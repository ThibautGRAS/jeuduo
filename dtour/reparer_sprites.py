#!/usr/bin/env python3
"""Répare deux défauts de découpage sur les sprites de PERSONNAGES.

1. LES FRAGMENTS. Plusieurs sprites embarquent un morceau de la pose
   voisine de la planche : `bar_francky_verse` contient un Francky
   ENTIER en plus du bon, `shake` et `dose` une bande verticale. En jeu
   on voit deux barmans côte à côte, et un bout de comptoir avec eux.
   On ne garde que la plus grosse composante connexe, puis on RECENTRE
   la figure dans son canevas — sans toucher aux dimensions, sinon
   l'échelle à l'écran changerait : le rendu déduit la largeur du
   rapport de l'image.

2. LES TROUS. Le détourage a pris les motifs clairs des vêtements pour
   du fond : chemise à fleurs de Tristan, imprimé du t-shirt de Teo,
   jupe de Mathilde. Mesuré : jusqu'à 9 000 pixels troués sur un seul
   sprite, visibles en jeu comme des morceaux manquants.

   Bonne nouvelle mesurée avant de corriger : le détourage n'a effacé
   que l'ALPHA, la couleur est restée dessous — RGB moyen (164,159,156)
   dans les trous contre (166,140,128) sur le corps. Remettre l'alpha
   suffit donc, sans rien réinventer. Seuls les pixels restés noirs ou
   magenta (8 % et 1 %) sont repeints depuis leur voisin opaque.

Ne s'applique QU'AUX personnages. Un objet a le droit d'avoir des trous
et plusieurs morceaux : l'anneau de rechargement est un anneau, un impact
de pierre est un éclat de gravats.
"""
import sys, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage

# les familles de personnages, par préfixe de nom de fichier
PERSONNAGES = ("bar_", "pers_", "assis_", "enn_", "ruel_", "h_", "face_",
               "hortense", "duo_", "pierre_", "thibaut_", "enq_")
FRAG_MIN = 300        # en dessous, c'est du bruit de bord, pas un fragment
TACHE_MIN = 25        # en dessous, un trou n'est pas visible en jeu


def est_personnage(nom):
    return any(nom.startswith(p) for p in PERSONNAGES)


def trous_fautifs(a, vis):
    """Les trous à reboucher, et EUX SEULS.

    Tout pixel transparent enclos n'est pas un défaut. Entre deux verres
    à shot alignés, entre un bras et un buste, la transparence est
    voulue — et la couleur dessous est celle du fond de la planche, donc
    noire après despill ou franchement magenta.

    Le défaut du détourage, lui, laisse une couleur de CORPS sous un
    alpha effacé : c'est ce qui a permis de réparer 219 sprites sans rien
    redessiner. C'est donc la couleur qui tranche, pas la taille — un vrai
    trou de 4 000 px (la jupe de Mathilde) et une vraie transparence de
    700 px (la rangée de shots de Jojo) ne se distinguent pas autrement.
    """
    plein = ndimage.binary_fill_holes(vis)
    enclos = plein & ~vis
    if not enclos.any():
        return enclos & False
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    fond = ((r < 30) & (g < 30) & (b < 30)) | ((np.minimum(r, b) - g) > 40)
    mauvais = enclos & ~fond
    # SEUIL D'AIRE, et il n'est pas cosmétique : le WebP est compressé
    # avec perte, y compris SOUS les pixels transparents. Un pixel classé
    # « fond » avant enregistrement ne l'est plus après relecture, et le
    # contrôle restait rouge à un ou deux pixels près indéfiniment, chaque
    # réparation en créant de nouveaux. On ne traite donc que les taches
    # d'une taille VISIBLE : en dessous, c'est du bruit d'encodage.
    lab, n = ndimage.label(mauvais)
    if n:
        tailles = ndimage.sum(mauvais, lab, range(1, n + 1))
        garder = np.zeros(n + 1, dtype=bool)
        garder[1:] = tailles >= TACHE_MIN
        mauvais = garder[lab]
    return mauvais


def reparer(chemin):
    im = Image.open(chemin).convert("RGBA")
    a = np.asarray(im).astype(np.int16).copy()
    al = a[..., 3]
    vis = al > 40
    if not vis.any():
        return None

    lab, n = ndimage.label(vis)
    tailles = ndimage.sum(vis, lab, range(1, n + 1))
    principal = int(np.argmax(tailles)) + 1
    frags = (lab != principal) & (lab != 0) & vis
    aire_frag = int(frags.sum())
    fragments = int(((tailles > FRAG_MIN) & (tailles < tailles.max())).sum())

    # --- 1. effacer les fragments ---
    if fragments:
        a[frags] = 0
        vis = (lab == principal)

    # --- 2. reboucher les trous : l'alpha, pas la couleur ---
    # Il faut ITÉRER : reboucher un trou change la silhouette, et de
    # nouveaux pixels se retrouvent enclos sur son bord — un ou deux à
    # chaque passe. Sans boucle, le contrôle restait rouge à un pixel
    # près après chaque réparation, indéfiniment. 
    n_trous = 0
    for _ in range(6):
        trous = trous_fautifs(a, vis)
        if not trous.any():
            break
        n_trous += int(trous.sum())
        a[..., 3][trous] = 255
        vis = vis | trous

    # --- 3. recentrer horizontalement si un fragment est parti ---
    decale = 0
    if fragments:
        ys, xs = np.nonzero(vis)
        centre = (xs.min() + xs.max()) / 2
        decale = int(round(a.shape[1] / 2 - centre))
        if decale:
            a = np.roll(a, decale, axis=1)
            # ce qui sort d'un côté ne doit pas rentrer de l'autre
            if decale > 0: a[:, :decale] = 0
            else: a[:, decale:] = 0

    Image.fromarray(a.astype(np.uint8), "RGBA").save(
        chemin, "WEBP", quality=95, method=6)
    return fragments, aire_frag, n_trous, decale


def verifier(racine):
    """Mode contrôle : ne touche à rien, rend un code non nul s'il reste
    un fragment ou un trou. La suite Node ne peut PAS faire ce contrôle —
    node-canvas ne lit pas le WebP, et les tests n'y lisent que l'en-tête
    pour les dimensions. Il vit donc ici, et se lance avant un push qui
    touche aux images :

        python3 dtour/reparer_sprites.py dtour/img --verifier
    """
    racine = pathlib.Path(racine)
    fautifs = []
    illisibles = []
    for p in sorted(racine.rglob("*.webp")):
        # UN FICHIER VIDE OU ILLISIBLE PASSAIT INAPERÇU. La suite Node ne
        # lit que l'en-tête WebP de quelques images ; un fichier de zéro
        # octet — écrit par une réparation interrompue en plein vol, ce
        # qui est arrivé — ne déclenchait rien et serait parti en
        # production. Ce contrôle ouvre TOUS les fichiers, personnages ou
        # non, et c'est gratuit puisqu'il faut les décoder de toute façon.
        try:
            if p.stat().st_size == 0:
                raise ValueError("fichier vide")
            Image.open(p).convert("RGBA").load()
        except Exception as e:
            illisibles.append((str(p.relative_to(racine)), type(e).__name__))
            continue
        if not est_personnage(p.stem):
            continue
        a = np.asarray(Image.open(p).convert("RGBA")).astype(int)
        vis = a[..., 3] > 40
        if not vis.any():
            continue
        lab, n = ndimage.label(vis)
        tailles = ndimage.sum(vis, lab, range(1, n + 1))
        frag = int(((tailles > FRAG_MIN) & (tailles < tailles.max())).sum())
        trous = int(trous_fautifs(a, vis).sum())
        if frag or trous:
            fautifs.append((str(p.relative_to(racine)), frag, trous))
    if illisibles:
        print(f"{len(illisibles)} fichier(s) ILLISIBLE(S) :")
        for f, e in illisibles:
            print(f"  {f}  ({e})")
        sys.exit(1)
    if fautifs:
        print(f"{len(fautifs)} sprite(s) de personnage à réparer :")
        for f, fr, tr in fautifs[:20]:
            print(f"  {f:38s} fragments={fr} trous={tr}")
        sys.exit(1)
    print("aucun fragment, aucun trou sur les sprites de personnage")


def main(racine):
    racine = pathlib.Path(racine)
    total = corriges = 0
    rapport = []
    for p in sorted(racine.rglob("*.webp")):
        if not est_personnage(p.stem):
            continue
        total += 1
        r = reparer(p)
        if not r:
            continue
        frag, aire, trous, dec = r
        if frag or trous:
            corriges += 1
            rapport.append((str(p.relative_to(racine)), frag, aire, trous, dec))
    rapport.sort(key=lambda x: -(x[2] + x[3]))
    print(f"{'fichier':38s} {'frag':>5s} {'aire':>7s} {'trous':>7s} {'décal':>6s}")
    for f, frag, aire, trous, dec in rapport[:25]:
        print(f"{f:38s} {frag:5d} {aire:7d} {trous:7d} {dec:6d}")
    print(f"\n{corriges} sprites réparés sur {total} sprites de personnage")


if __name__ == "__main__":
    if "--verifier" in sys.argv:
        verifier(sys.argv[1])
    else:
        main(sys.argv[1])
