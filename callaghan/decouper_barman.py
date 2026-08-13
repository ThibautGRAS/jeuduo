#!/usr/bin/env python3
"""Découpe les poses de barman depuis les planches d'origine.

Trois choses que le découpage précédent avait ratées, et qui se voyaient
en jeu :

1. LES FRAGMENTS. `bar_francky_verse` embarquait un Francky ENTIER en
   plus du bon. Ici chaque cellule est délimitée par sa colonne, et on ne
   garde que la plus grosse composante connexe DEDANS.

2. LE MORCEAU DE COMPTOIR. Plusieurs poses sont dessinées derrière un
   plan de travail en bois. Collé au sprite, ce bois se retrouve posé
   par-dessus le vrai comptoir du décor, avec sa propre perspective et sa
   propre lumière : on voit un bout de table flotter. On le retire en le
   détectant par sa COULEUR et par sa LARGEUR — le bois est brun et
   s'étend plus large que le corps, contrairement à un vêtement.

3. LE TRAIT DE COUPE COMMUN. Le rendu pose le bas du sprite pile sur le
   comptoir du décor et déduit la largeur du rapport de l'image : deux
   poses de cadrages différents font grandir et rétrécir le barman à
   chaque geste. Toutes les poses sortent donc du même canevas, à la même
   échelle, la ceinture sur la même ligne.
"""
import sys, json, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage

COTE_H = 193          # hauteur du canevas, celle des sprites en place
MARGE_BAS = 2


def masque(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return ndimage.binary_opening(~((r > 150) & (b > 150) & (g < 120)), np.ones((3, 3)))


def despill(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    exces = np.maximum(np.minimum(r, b) - g, 0)
    out = rgb.copy()
    out[..., 0] = np.clip(r - exces, 0, 255)
    out[..., 2] = np.clip(b - exces, 0, 255)
    return out


def tete_largeur(mv):
    """Largeur de la tête, en pixels. On prend le PLUS LONG SEGMENT
    horizontal continu dans le haut de la silhouette, et sa médiane : un
    bras levé à côté de la tête forme un segment SÉPARÉ, il ne gonfle donc
    pas la mesure — c'est ce qui rend le repère utilisable sur une planche
    où les gestes changent à chaque pose."""
    h = mv.shape[0]
    runs = []
    for y in range(0, max(1, int(h * 0.20))):
        ligne = mv[y]
        best = cur = 0
        for v in ligne:
            cur = cur + 1 if v else 0
            if cur > best: best = cur
        if best: runs.append(best)
    if not runs:
        return max(1, mv.shape[1])
    return int(np.median(runs))


def tete_haut(mv, largeur):
    """Première ligne où la silhouette atteint la largeur d'une tête.

    Indispensable : un verre brandi ou une bouteille levée dépassent du
    crâne, et la boîte englobante commence alors sur l'OBJET. Cadrer
    dessus fait descendre la tête et remonter la coupe dans le torse — le
    barman hoche la tête en travaillant. On cherche donc où la tête
    commence VRAIMENT, en exigeant un segment continu d'au moins 70 % de
    sa largeur."""
    for y in range(mv.shape[0]):
        best = cur = 0
        for v in mv[y]:
            cur = cur + 1 if v else 0
            if cur > best: best = cur
        if best >= largeur * 0.70:
            return y
    return 0


def retirer_comptoir(vue, mv):
    """Coupe la bande de bois du bas. Deux conditions ENSEMBLE, parce que
    chacune seule se trompe : la couleur seule prendrait un vêtement brun,
    la largeur seule prendrait les épaules."""
    h, l = mv.shape
    largeurs = mv.sum(axis=1)
    if not largeurs.max():
        return mv, 0
    r, g, b = vue[..., 0], vue[..., 1], vue[..., 2]
    bois = (r > g + 12) & (g > b + 6) & (r > 60) & (r < 210)
    coupe = 0
    # on remonte depuis le bas tant que la ligne est large ET brune
    for y in range(h - 1, int(h * 0.55), -1):
        if not largeurs[y]:
            continue
        part_bois = bois[y][mv[y]].mean() if mv[y].any() else 0
        large = largeurs[y] > largeurs[int(h * 0.30):int(h * 0.60)].max() * 0.92
        if part_bois > 0.55 and large:
            coupe = y
        elif coupe:
            break
    if not coupe:
        return mv, 0
    neuf = mv.copy()
    neuf[coupe:] = False
    return neuf, h - coupe


def decouper(cfg):
    """Plusieurs planches sont admises : une pose peut manquer sur la
    planche principale — `shake` n'existe que sur la grande planche de
    Francky. La normalisation par la tête rend le mélange sans risque,
    c'est même sa raison d'être."""
    dst = pathlib.Path(cfg["sortie"]); dst.mkdir(parents=True, exist_ok=True)
    feuilles = {}
    for nom_r, r in cfg["rangees"].items():
        chemin = r.get("planche") or cfg["planche"]
        if chemin not in feuilles:
            im = np.asarray(Image.open(chemin).convert("RGB")).astype(np.int16)
            feuilles[chemin] = (im, masque(im))

    # 1. extraire chaque pose demandée
    brut = {}
    for nom, (rang, i) in cfg["poses"].items():
        r = cfg["rangees"][rang]
        a, obj = feuilles[r.get("planche") or cfg["planche"]]
        y0, y1 = r["y"]
        x0, x1 = r["cols"][i]
        m = np.zeros_like(obj); m[y0:y1, x0:x1] = obj[y0:y1, x0:x1]
        lab, n = ndimage.label(m)
        if not n:
            sys.exit(f"ABANDON : cellule vide pour {nom}")
        t = ndimage.sum(m, lab, range(1, n + 1))
        mm = (lab == int(np.argmax(t)) + 1)
        ys, xs = np.nonzero(mm)
        sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
        vue, mv = a[sl], mm[sl]
        mv, retire = retirer_comptoir(vue, mv)
        ys2, xs2 = np.nonzero(mv)
        if not len(ys2):
            sys.exit(f"ABANDON : {nom} entièrement retiré")
        s2 = (slice(ys2.min(), ys2.max() + 1), slice(xs2.min(), xs2.max() + 1))
        brut[nom] = (vue[s2], mv[s2], retire)

    # 2. L'ÉCHELLE SE PREND SUR LA TÊTE, pas sur la hauteur totale. Une
    #    pose en pied fait 314 px là où un buste en fait 200 : mettre les
    #    deux à la même hauteur de canevas ferait rétrécir la tête de 40 %
    #    dès que le barman se met au travail. On mesure donc la tête et on
    #    ramène toutes les poses à la même largeur de tête.
    for nom in brut:
        vue, mv, retire = brut[nom]
        lt = tete_largeur(mv)
        brut[nom] = (vue, mv, retire, lt, tete_haut(mv, lt))

    # 3. Puis on RECADRE AU BUSTE, en TÊTES et non en pixels : les poses
    #    en pied montreraient des jambes là où le rendu attend le
    #    comptoir. La hauteur est déclarée dans la config parce qu'elle
    #    est anatomique, pas mesurable — c'est la ligne de la ceinture, et
    #    elle doit être la même sur toutes les planches d'un personnage.
    # la coupe se compte depuis le HAUT DE LA TÊTE, et il faut réserver
    # au-dessus la place du plus grand objet brandi de la planche
    bustes = cfg.get("hauteur_tetes") or min(
        (v[1].shape[0] - v[4]) / v[3] for v in brut.values())
    coiffe = max(v[4] / v[3] for v in brut.values())
    total = coiffe + bustes
    ref = (COTE_H - MARGE_BAS) / total          # largeur de tête cible, en px
    largeur = max(int(round(v[1].shape[1] * ref / v[3])) for v in brut.values()) + 8

    print(f"{'pose':12s} {'source':>11s} {'tête':>5s} {'coiffe':>7s} {'comptoir':>9s} {'coupé':>6s} {'sortie':>11s}")
    for nom, (vue, mv, retire, th, ht) in brut.items():
        rgb = despill(vue.astype(np.int16)).astype(np.uint8)
        alpha = np.clip(1.6 - ndimage.gaussian_filter((~mv).astype(float), 0.8) * 3.2, 0, 1)
        img = Image.fromarray(np.dstack([rgb, (alpha * 255).astype(np.uint8)]), "RGBA")
        k = ref / th
        nl, nh = max(1, int(round(img.width * k))), max(1, int(round(img.height * k)))
        img = img.resize((nl, nh), Image.LANCZOS)
        # la ceinture tombe à `bustes` têtes SOUS le haut du crâne
        bas = int(round(ht * k + bustes * ref))
        coupe = 0
        if nh > bas:
            coupe = nh - bas
            img = img.crop((0, 0, nl, bas)); nh = bas
        if nh < bas - 1:
            # LE DÉFAUT DE CALIBRATION, ATTRAPÉ ICI. Une pose plus COURTE
            # que la cible ne peut pas être recadrée : collée par le bas,
            # sa tête descend d'autant. Mesuré chez Jojo avec une cible à
            # 3,7 têtes : le haut du crâne bougeait de 17 px sur 193 d'une
            # pose à l'autre, il hochait la tête en travaillant. La cible
            # doit être la pose la PLUS COURTE, pas une valeur choisie.
            sys.exit(f"ABANDON : {nom} fait {nh} px de contenu pour une cible de {bas} — "
                     f"baisser hauteur_tetes à "
                     f"{min((v[1].shape[0] - v[4]) / v[3] for v in brut.values()):.2f} au plus")
        toile = Image.new("RGBA", (largeur, COTE_H), (0, 0, 0, 0))
        # ancrage par la CEINTURE : le bas du contenu tombe toujours au
        # même endroit, et la coiffe brandie occupe la marge du haut
        toile.paste(img, ((largeur - nl) // 2, COTE_H - MARGE_BAS - nh), img)
        toile.save(dst / f"{cfg['prefixe']}_{nom}.webp", "WEBP", quality=95, method=6)
        print(f"{nom:12s} {str(mv.shape[1])+'x'+str(mv.shape[0]):>11s} {th:5d} "
              f"{ht:7d} {retire:9d} {coupe:6d} {str(nl)+'x'+str(nh):>11s}")
    print(f"\ncanevas {largeur}x{COTE_H}, tête {ref:.1f} px, coiffe {coiffe:.2f} tête(s), "
          f"buste {bustes:.2f} tête(s), {len(brut)} poses")


if __name__ == "__main__":
    decouper(json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")))
