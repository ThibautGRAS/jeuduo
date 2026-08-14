#!/usr/bin/env python3
"""Fabrique les portraits du bestiaire à partir des sprites de course.

Pourquoi pas une planche dédiée : les cinq méchants ont déjà dix-neuf
poses chacun, toutes calibrées et raccordées. Un portrait dessiné à part
dériverait — c'est arrivé deux fois sur ce projet, avec la chemise de
Jubilar puis le costume de BruHell. Recadrer le buste de `run1` garantit
que le portrait EST le personnage qu'on va affronter, au pixel près.

Le cadrage se prend depuis le HAUT DU CRÂNE et non depuis la boîte
englobante — même règle que pour les barmans : une main tendue au-dessus
de la tête ferait descendre le visage dans la carte.
"""
import sys, re, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage

COTE = 320            # le portrait est carré, il s'affiche dans une carte
BUSTE = 0.46          # part de la hauteur du personnage gardée
MARGE = 0.06          # de l'air autour, sinon le buste touche les bords


def tete_largeur(mv):
    """Le plus long segment horizontal continu du haut de la silhouette :
    un bras tendu à côté du crâne forme un segment séparé."""
    h = mv.shape[0]
    runs = []
    for y in range(max(1, int(h * 0.18))):
        best = cur = 0
        for v in mv[y]:
            cur = cur + 1 if v else 0
            if cur > best: best = cur
        if best: runs.append(best)
    return int(np.median(runs)) if runs else max(1, mv.shape[1])


def portrait(src, dst):
    im = Image.open(src).convert("RGBA")
    a = np.asarray(im).astype(int)
    vis = a[..., 3] > 40
    ys, xs = np.nonzero(vis)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    corps = vis[y0:y1 + 1, x0:x1 + 1]
    lt = tete_largeur(corps)

    # le haut du crâne : première ligne atteignant 70 % d'une tête
    haut = 0
    for y in range(corps.shape[0]):
        best = cur = 0
        for v in corps[y]:
            cur = cur + 1 if v else 0
            if cur > best: best = cur
        if best >= lt * 0.70:
            haut = y
            break

    H = y1 - y0 + 1
    bas = min(H, haut + int(H * BUSTE))
    band = corps[haut:bas]
    by, bx = np.nonzero(band)
    if not len(bx):
        sys.exit(f"ABANDON : buste vide sur {src}")

    # carré centré sur le buste, côté = la plus grande dimension
    cx = x0 + (bx.min() + bx.max()) / 2
    cy = y0 + haut + (by.min() + by.max()) / 2
    cote = max(bx.max() - bx.min(), by.max() - by.min()) * (1 + MARGE * 2)
    g0, g1 = int(cx - cote / 2), int(cx + cote / 2)
    h0, h1 = int(cy - cote / 2), int(cy + cote / 2)

    toile = Image.new("RGBA", (int(cote), int(cote)), (0, 0, 0, 0))
    dx, dy = max(0, -g0), max(0, -h0)
    coupe = im.crop((max(0, g0), max(0, h0), min(im.width, g1), min(im.height, h1)))
    toile.paste(coupe, (dx, dy), coupe)
    toile = toile.resize((COTE, COTE), Image.LANCZOS)
    toile.save(dst, "WEBP", quality=95, method=6)
    return int(cote)


if __name__ == "__main__":
    dossier = pathlib.Path(sys.argv[1])
    # LA LISTE VIENT DU SOCLE, pas d'une copie : elle était recopiée ici,
    # et Xavier n'aurait pas eu de portrait sans qu'on s'en aperçoive —
    # le chargeur, lui, en demande un pour chaque nom d'ENNEMIS_RUELLE.
    socle = (pathlib.Path(__file__).parent / "parts" / "a_socle.js").read_text(
        encoding="utf-8")
    ligne = re.search(r"const ENNEMIS_RUELLE = \[(.*?)\];", socle, re.S).group(1)
    for pref in re.findall(r'"([a-z0-9_]+)"', ligne):
        src = dossier / f"enn_{pref}_run1.webp"
        if not src.exists():
            sys.exit(f"ABANDON : {src} manquant")
        c = portrait(src, dossier / f"port_{pref}.webp")
        print(f"  port_{pref}  carré source {c} px -> {COTE}x{COTE}")
    print("portraits écrits")
