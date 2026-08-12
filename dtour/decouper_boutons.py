#!/usr/bin/env python3
"""Découpe la planche de boutons du niveau 4 et la normalise.

Trois garanties, dans cet ordre d'importance :

1. AUCUN MAGENTA. Les disques sont coupés par un CERCLE ajusté, pas par
   le contour détecté : toute lueur qui bavait dans le fond disparaît
   avec le fond. L'anneau, lui, n'est pas un disque — il garde son
   masque propre, complété par une désaturation du magenta résiduel.
2. MÊME DIAMÈTRE pour les huit. Le canevas de sortie est identique et
   le disque y occupe exactement la même place : `poser()` peut donc
   dessiner tout le canevas, la taille à l'écran ne dépend plus du
   dessin.
3. CENTRÉ AU PIXEL. Le centre du disque est le centre du canevas, donc
   le bouton visible coïncide avec sa zone tactile.

Le script refuse d'écrire s'il ne trouve pas exactement huit boutons.
"""
import sys, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage

COTE = 320          # canevas de sortie
DIAM = 304          # diamètre du disque dedans (marge de 8 px pour l'anti-crénelage)
NOMS = ["tir", "tir_appui", "tir_vide", "anneau",
        "couvert", "changer", "croix", "pouce"]


def masque_fond(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return (r > 170) & (b > 170) & (g < 110)


def despill(rgb):
    """Retire la composante magenta d'un pixel : min(r,b) ne peut pas
    dépasser g. Sans effet sur l'ambre (g y est déjà le plus fort)."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    exces = np.maximum(np.minimum(r, b) - g, 0)
    out = rgb.copy()
    out[..., 0] = np.clip(r - exces, 0, 255)
    out[..., 2] = np.clip(b - exces, 0, 255)
    return out


def decouper(src, dst):
    im = Image.open(src).convert("RGB")
    a = np.asarray(im).astype(np.int16)
    obj = ndimage.binary_opening(~masque_fond(a), np.ones((5, 5)))
    lab, n = ndimage.label(obj)
    if n != 8:
        sys.exit(f"ABANDON : {n} bouton(s) détecté(s), il en faut exactement 8")

    boites = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        boites.append((sl[1].start, sl[0].start, sl[1].stop, sl[0].stop, i))
    boites.sort(key=lambda t: (t[1] // 300, t[0]))

    dst.mkdir(parents=True, exist_ok=True)
    rapport = []
    for nom, (x0, y0, x1, y1, i) in zip(NOMS, boites):
        m = (lab == i)
        ys, xs = np.nonzero(m)
        cx, cy = xs.mean(), ys.mean()
        d = np.hypot(xs - cx, ys - cy)
        rext = np.percentile(d, 99.9)

        # marge généreuse autour, puis rééchelonnage vers le canevas final
        pad = int(rext) + 6
        gx0, gy0 = int(round(cx)) - pad, int(round(cy)) - pad
        vue = a[gy0:gy0 + 2 * pad, gx0:gx0 + 2 * pad]
        mv = m[gy0:gy0 + 2 * pad, gx0:gx0 + 2 * pad]
        yy, xx = np.mgrid[0:2 * pad, 0:2 * pad]
        dist = np.hypot(xx - (cx - gx0), yy - (cy - gy0))

        if nom == "anneau":
            # un anneau : on garde sa forme, on nettoie sa couleur
            alpha = np.clip(1.6 - ndimage.gaussian_filter(
                (~mv).astype(float), 0.8) * 3.2, 0, 1)
            # rayon intérieur = plus grand disque vide au centre, donc la
            # plus courte distance du centre à un pixel d'anneau
            rint = np.percentile(dist[mv], 0.5)
            rapport.append((nom, rext, rint))
        else:
            # un disque : le cercle EST le masque, la lueur qui déborde part
            alpha = np.clip(rext - 1.5 - dist + 1.0, 0, 1)
            rapport.append((nom, rext, None))

        rgb = despill(vue.astype(np.int16)).astype(np.uint8)
        out = np.dstack([rgb, (alpha * 255).astype(np.uint8)])
        img = Image.fromarray(out, "RGBA")
        # le rayon extérieur devient toujours DIAM/2 : taille unique
        ech = (DIAM / 2) / rext
        nt = max(1, int(round(img.width * ech)))
        img = img.resize((nt, nt), Image.LANCZOS)
        toile = Image.new("RGBA", (COTE, COTE), (0, 0, 0, 0))
        toile.paste(img, ((COTE - nt) // 2, (COTE - nt) // 2), img)
        toile.save(dst / f"btn_{nom}.webp", "WEBP", quality=95, method=6)

    print(f"{'bouton':12s} {'R ext':>7s} {'R int':>7s}")
    for nom, re_, ri in rapport:
        print(f"{nom:12s} {re_:7.1f} {('%7.1f' % ri) if ri else '      —'}")
    return rapport


if __name__ == "__main__":
    decouper(pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]))
