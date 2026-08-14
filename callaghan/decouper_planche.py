#!/usr/bin/env python3
"""Découpe une planche de poses d'ennemi, sur une ou plusieurs rangées.

Ce que le premier découpeur ne savait pas faire, et qui a été appris sur
les planches de DSKKK et de Jubilar :

1. PLUSIEURS RANGÉES. Le regroupement se fait sur la LIGNE DE SOL et non
   sur le centre vertical : une pose couchée a un centre bien plus haut
   que ses voisines debout, et le regroupement par centre séparait les
   quatre poses au sol de leur propre rangée.
2. UNE LIGNE DE SOL PAR RANGÉE. Chaque rangée a la sienne, et l'écart de
   chaque pose à celle de SA rangée est conservé — c'est ce qui garde les
   56 px d'air sous une pose de saut.
3. COUPURES MANUELLES. Deux poses qui se touchent ne font qu'une
   composante. On ne peut pas les séparer automatiquement sans risque, on
   déclare donc la colonne de coupe, mesurée sur le creux d'encre.

Le script refuse d'écrire si le compte de poses détecté ne correspond pas
exactement à la liste attendue.
"""
import sys, json, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage

MARGE_BAS = 2
AIRE_MIN = 3000


def despill(rgb):
    """min(r,b) ne peut pas dépasser g : retire le magenta mélangé aux
    bords sans toucher aux teintes chaudes, où le vert domine déjà."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    exces = np.maximum(np.minimum(r, b) - g, 0)
    out = rgb.copy()
    out[..., 0] = np.clip(r - exces, 0, 255)
    out[..., 2] = np.clip(b - exces, 0, 255)
    return out


def couper_au_creux(bande, d, f, n):
    """Coupe un bloc trop large là où le profil est le plus CREUX.

    Deux poses qui se touchent par un doigt ne sont pas perdues : entre
    deux corps il ne reste qu'un avant-bras. Mesuré sur une planche
    livrée, le corridor descend à 37 pixels de hauteur occupée là où un
    personnage en fait 531 — sept pour cent.

    Le creux se cherche AUTOUR de la position attendue, jamais partout :
    le minimum global mettait les deux coupes dans le même corridor et
    produisait un fragment de 61 px de large.

    Cela remplace les coupures écrites à la main, qui demandaient de
    relever une abscisse à l'œil pour chaque planche fautive."""
    col = bande[:, d:f].sum(axis=0).astype(float)
    larg = f - d
    bornes = [0]
    for k in range(1, n):
        centre = int(larg * k / n)
        demi = int(larg / n * 0.35)
        a0, a1 = max(1, centre - demi), min(larg - 1, centre + demi)
        if a1 > a0:
            bornes.append(a0 + int(np.argmin(col[a0:a1])))
    bornes.append(larg)
    return [(d + bornes[i], d + bornes[i + 1]) for i in range(len(bornes) - 1)]


def composantes(a, coupures):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # EST DU FOND TOUT CE QUI EST MAGENTA, quelle que soit sa CLARTÉ.
    # Le seuil `r > 150` gardait comme personnage un cadre magenta foncé
    # à (140, 0, 140) — or dessiner un cadre autour de chaque pose est ce
    # qui empêche le générateur de les faire déborder l'une sur l'autre.
    # La famille magenta se reconnaît à sa forme : rouge et bleu dominent
    # nettement le vert.
    # ÉCART DE 120 ET NON DE 150 : mesuré sur les planches de course de
    # Xavier, les bandes de cadre sont à (95, 1, 85) — un magenta si
    # sombre que l'écart au vert n'y est que de 94, et onze bandes
    # pleine hauteur passaient pour des poses. Le rapport MULTIPLICATIF
    # les attrape sans risque pour les teintes chaudes : une peau ou une
    # brique a du vert, pas un magenta pur.
    magenta = ((r > g + 120) & (b > g + 120)) | \
              ((r > 40) & (b > 30) & (g < 90) & (r + b > 3 * g))
    obj = ndimage.binary_opening(~magenta, np.ones((5, 5)))
    # Les coupures séparent deux poses qui se touchent. Une coupure peut
    # être LIMITÉE EN HAUTEUR : une colonne coupée sur toute la planche
    # sectionne aussi la pose du dessus. Mesuré : ma coupure des poses au
    # sol de Jubilar amputait le bras d'une de ses poses de course, et
    # créait un fragment de 3 537 px pris pour une pose de plus.
    for c in coupures:
        if isinstance(c, (list, tuple)):
            x, y0, y1 = c
            obj[y0:y1, x - 1:x + 2] = False
        else:
            obj[:, c - 1:c + 2] = False
    lab, n = ndimage.label(obj)
    tailles = ndimage.sum(obj, lab, range(1, n + 1))
    tranches = ndimage.find_objects(lab)
    gardes = []
    for i in range(1, n + 1):
        if tailles[i - 1] <= AIRE_MIN:
            continue
        sl = tranches[i - 1]
        gardes.append((sl[1].start, sl[0].start, sl[1].stop, sl[0].stop, i))

    # UN FRAGMENT DÉTACHÉ N'EST PAS UNE POSE. La planche d'Hortense a une
    # tarte en VOL, séparée de sa main : un bloc de 60x33 px que l'aire
    # minimale ne filtre pas et qui passait pour un personnage de plus.
    # On le RATTACHE au voisin le plus proche — la tarte fait partie de la
    # pose de lancer, la jeter reviendrait à lancer dans le vide.
    #
    # UN FRAGMENT EST PETIT DANS LES DEUX SENS. Le critère ne regardait
    # que la HAUTEUR, et la planche de chutes de Xavier l'a pris en
    # défaut : son corps au sol fait 517 x 200 px contre 457 px de haut
    # pour les poses à genoux — moitié moins haut, donc « fragment », donc
    # recollé à la pose d'à côté. Deux poses n'en faisaient plus qu'une,
    # à 150 px de fond vide près. Une tarte est courte ET étroite ; un
    # homme allongé est court et LARGE.
    if len(gardes) >= 3:
        hs = sorted(y2 - y1 for _, y1, _, y2, _ in gardes)
        ws = sorted(x2 - x1 for x1, _, x2, _, _ in gardes)
        hmed, wmed = hs[len(hs) // 2], ws[len(ws) // 2]
        petit = lambda g: (g[3] - g[1] < hmed * 0.5) and (g[2] - g[0] < wmed * 0.5)
        vrais = [g for g in gardes if not petit(g)]
        frags = [g for g in gardes if petit(g)]
        for fx1, fy1, fx2, fy2, fi in frags:
            if not vrais: break
            k = min(range(len(vrais)),
                    key=lambda j: min(abs(vrais[j][0] - fx2), abs(fx1 - vrais[j][2])))
            x1, y1, x2, y2, idx = vrais[k]
            vrais[k] = (min(x1, fx1), min(y1, fy1), max(x2, fx2), max(y2, fy2), idx)
            # la composante du fragment doit suivre dans le masque
            lab[lab == fi] = idx
        if vrais: gardes = sorted(vrais)

    # UN BLOC ANORMALEMENT LARGE CONTIENT PLUSIEURS POSES qui se touchent.
    # On le coupe automatiquement au creux, au lieu de demander une
    # abscisse relevée à l'œil. La largeur médiane sert d'étalon : c'est
    # la largeur d'UNE pose sur cette planche-là.
    if len(gardes) >= 2:
        larges = sorted(x2 - x1 for x1, y1, x2, y2, _ in gardes)
        med = larges[len(larges) // 2]
        eclate = []
        for x1, y1, x2, y2, idx in gardes:
            n2 = max(1, round((x2 - x1) / max(1, med)))
            if n2 == 1 or (x2 - x1) < med * 1.6:
                eclate.append((x1, y1, x2, y2, idx)); continue
            bande = obj[y1:y2]
            for d, f in couper_au_creux(bande, x1, x2, n2):
                col = obj[y1:y2, d:f]
                ys = np.nonzero(col.any(axis=1))[0]
                if not len(ys): continue
                eclate.append((d, y1 + ys.min(), f, y1 + ys.max() + 1, idx))
        gardes = eclate

    return lab, gardes


def rangees(boites, tolerance=60):
    """Regroupe par LIGNE DE SOL, puis ordonne chaque rangée par x."""
    par_sol = sorted(boites, key=lambda t: t[3])
    groupes = []
    for t in par_sol:
        for g in groupes:
            if abs(g[-1][3] - t[3]) < tolerance:
                g.append(t)
                break
        else:
            groupes.append([t])
    groupes.sort(key=lambda g: min(b[3] for b in g))
    for g in groupes:
        g.sort()
    return groupes


def main(cfg):
    src = pathlib.Path(cfg["planche"])
    a = np.asarray(Image.open(src).convert("RGB")).astype(np.int16)
    lab, boites = composantes(a, cfg.get("coupures", []))
    rgs = rangees(boites)

    attendues = cfg["rangees"]
    if len(rgs) != len(attendues):
        sys.exit(f"ABANDON : {len(rgs)} rangée(s) détectée(s), {len(attendues)} attendue(s)")
    for k, (rg, noms) in enumerate(zip(rgs, attendues), 1):
        if len(rg) != len(noms):
            sys.exit(f"ABANDON : rangée {k} — {len(rg)} pose(s), {len(noms)} attendue(s) : {noms}")

    imref = Image.open(cfg["reference"])
    COTE_L, COTE_H = imref.size
    # LE CANEVAS PEUT ÊTRE ÉLARGI SANS TOUCHER À L'ÉCHELLE. Les deux
    # venaient du même sprite témoin, ce qui interdisait toute pose plus
    # LARGE que l'ancienne : le lancer d'Hortense, bras tendu, fait 118 px
    # là où son sprite d'affût en fait 97. Refuser la pose parce que le
    # témoin est étroit revient à interdire tout geste nouveau.
    #
    # `largeur` élargit le canevas ; l'échelle, elle, reste calée sur la
    # HAUTEUR du témoin — c'est elle qui garantit que le personnage garde
    # sa taille en jeu.
    if cfg.get("largeur"):
        COTE_L = max(COTE_L, int(cfg["largeur"]))
    al = np.asarray(imref.convert("RGBA"))[..., 3]
    ys = np.nonzero(al.max(axis=1) > 16)[0]
    haut_ref = int(ys.max() - ys.min() + 1)
    # DEUX PLANCHES DU MÊME PERSONNAGE PEUVENT NE PAS AVOIR LA MÊME
    # ÉCHELLE. Mesuré sur Xavier : 412 px debout sur la planche de base
    # contre 510 sur celle du lancer, soit 1,24 fois plus grand pour le
    # même homme. Caler les deux sur la même hauteur de référence lui
    # aurait fait changer de taille en jeu selon qu'il court ou qu'il
    # lance.
    #
    # `hauteur_ref` corrige l'écart sans toucher au canevas : on garde la
    # taille d'image du personnage de référence, et on ne change que la
    # hauteur de sujet visée. Le calcul est à faire une fois, à la main,
    # et il s'écrit dans la config — c'est une MESURE, elle doit rester
    # relisible.
    if cfg.get("hauteur_ref"):
        haut_ref = int(cfg["hauteur_ref"])

    # le témoin est la première pose de la première rangée
    # LE TÉMOIN SE CHOISIT. Il était figé sur la première pose de la
    # première rangée — or la seconde planche du bar commence par une pose
    # REDONDANTE qu'on ne découpe pas, et prendre `frein` comme témoin
    # donnait une échelle de 0,97 contre 0,84 pour la première planche :
    # le même personnage changeait de taille selon la pose.
    #
    # Le témoin doit être le MÊME sprite pour toutes les planches d'un
    # personnage. `temoin` dit lequel prendre, en rang dans la rangée.
    #
    # `temoin_rangee` dit dans QUELLE rangée le chercher. Il a fallu
    # l'ajouter le jour où la pelle en vol de Xavier a formé sa propre
    # rangée : les rangées se groupent par ligne de sol, un objet en l'air
    # se détache donc des figures, arrive en premier, et servait d'étalon
    # — 117 px de pelle pour 329 px attendus, soit une échelle de 2,81 et
    # un personnage de 554 px de large dans un canevas de 302.
    it = int(cfg.get("temoin", 1)) - 1
    ir = min(int(cfg.get("temoin_rangee", 1)) - 1, len(rgs) - 1)
    tx0, ty0, tx1, ty1, _ = rgs[ir][min(it, len(rgs[ir]) - 1)]
    haut_temoin = ty1 - ty0
    ech = haut_ref / haut_temoin
    print(f"témoin : {haut_temoin} px sur la planche, {haut_ref} px sur {pathlib.Path(cfg['reference']).name}")
    print(f"échelle : {ech:.4f}\n")

    dst = pathlib.Path(cfg["sortie"])
    dst.mkdir(parents=True, exist_ok=True)
    prefixe = cfg["prefixe"]
    ecrites = 0
    for rg, noms in zip(rgs, attendues):
        sol = max(b[3] for b in rg)
        tolerance_air = 0.06 * haut_temoin
        for nom, (x0, y0, x1, y1, i) in zip(noms, rg):
            if nom is None:
                continue
            m = (lab == i)
            vue = a[y0:y1, x0:x1]
            mv = m[y0:y1, x0:x1]
            rgb = despill(vue.astype(np.int16)).astype(np.uint8)
            alpha = np.clip(1.6 - ndimage.gaussian_filter((~mv).astype(float), 0.8) * 3.2, 0, 1)
            img = Image.fromarray(np.dstack([rgb, (alpha * 255).astype(np.uint8)]), "RGBA")
            nl, nh = max(1, round(img.width * ech)), max(1, round(img.height * ech))
            img = img.resize((nl, nh), Image.LANCZOS)
            if nl > COTE_L:
                sys.exit(f"ABANDON : {nom} fait {nl} px de large, canevas {COTE_L}")
            ecart = sol - y1
            air = int(round((0 if ecart < tolerance_air else ecart) * ech))
            hauteur = max(COTE_H, nh + MARGE_BAS + air)
            toile = Image.new("RGBA", (COTE_L, hauteur), (0, 0, 0, 0))
            toile.paste(img, ((COTE_L - nl) // 2, hauteur - MARGE_BAS - air - nh), img)
            toile.save(dst / f"{prefixe}_{nom}.webp", "WEBP", quality=95, method=6)
            marque = "  DÉBORDE" if hauteur > COTE_H else ("  EN L'AIR" if air else "")
            print(f"  {nom:14s} {nl:4d}x{nh:4d}  canevas {COTE_L}x{hauteur}{marque}")
            ecrites += 1
    print(f"\n{ecrites} images écrites dans {dst}")


if __name__ == "__main__":
    main(json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")))
