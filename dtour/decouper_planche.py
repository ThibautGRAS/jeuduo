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


def composantes(a, coupures):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    obj = ndimage.binary_opening(~((r > 150) & (b > 150) & (g < 120)), np.ones((5, 5)))
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
    al = np.asarray(imref.convert("RGBA"))[..., 3]
    ys = np.nonzero(al.max(axis=1) > 16)[0]
    haut_ref = int(ys.max() - ys.min() + 1)

    # le témoin est la première pose de la première rangée
    tx0, ty0, tx1, ty1, _ = rgs[0][0]
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
