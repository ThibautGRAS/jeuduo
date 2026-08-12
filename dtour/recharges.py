#!/usr/bin/env python3
"""Prépare les deux sons de rechargement à partir des fichiers fournis.

Ce ne sont pas des sons fabriqués : ce sont des enregistrements déposés
dans `son/`. Le travail consiste à les rendre utilisables par le jeu, et
il tient en quatre points :

1. LES FAIRE TENIR DANS LA DURÉE DU GESTE. Le revolver recharge en 1,5 s
   et le fusil en 2,0 s. Un échantillon plus long continue de claquer
   alors que le héros tire déjà : le son ment sur l'état du jeu.
2. COUPER LE VIDE. Le fichier pistolet ne commence qu'à 0,14 s et
   s'arrête à 1,78 s sur 2,40 s de durée — un tiers du fichier est du
   silence, et ce silence retarde le premier claquement.
3. LES METTRE AU MÊME NIVEAU. Le fichier fusil sort à 0,016 de RMS
   contre 0,067 pour le pistolet : quatre fois plus faible, inaudible à
   côté d'une détonation. On normalise sur la CRÊTE, après encodage,
   parce que le Vorbis dépasse ce qu'on lui donne.
4. MONO. Le jeu joue tout par un seul canal ; garder la stéréo doublerait
   le poids pour rien.
"""
import subprocess, sys, pathlib
import numpy as np

SR = 44100
# 0,68 et non 0,78 : le fichier pistolet est DÉJÀ saturé à la source
# (crête 1,000), donc riche en harmoniques que le Vorbis reconstruit en
# dépassant. Mesuré : 0,78 en entrée ressortait à 0,987.
CRETE = 0.68

# nom de sortie : (fichier source, début, fin, durée max du geste)
SOURCES = {
    "recharge_revolver": ("276959__gfl7__pistol-reload-sound.mp3", 0.12, 1.82, 1.50),
    "recharge_fusil":    ("88282__s_dij__gba_reload_07.wav",        0.01, 1.02, 2.00),
}


def preparer(src, debut, fin, duree_max):
    """On ACCÉLÈRE pour faire tenir, on ne tronque pas. Le rechargement du
    pistolet est un geste en TROIS claquements étalés sur 1,68 s ; couper
    à 1,50 s emportait le troisième en plein milieu, et un rechargement
    qui s'arrête au deuxième temps ne se lit plus comme un rechargement.
    Accéléré de 12 %, les trois y sont."""
    span = fin - debut
    tempo = max(1.0, span / duree_max)
    duree = span / tempo
    filtres = []
    if tempo > 1.001:
        filtres.append(f"atempo={tempo:.4f}")
    filtres.append(f"afade=t=out:st={max(0, duree - 0.06):.3f}:d=0.06")
    r = subprocess.run(
        ["ffmpeg", "-v", "error", "-ss", f"{debut:.3f}", "-t", f"{span:.3f}",
         "-i", str(src), "-ac", "1", "-ar", str(SR),
         "-af", ",".join(filtres),
         "-f", "s16le", "pipe:1"],
        capture_output=True)
    if r.returncode != 0:
        sys.exit(f"ABANDON : ffmpeg a refusé {src} — {r.stderr.decode()[:200]}")
    x = np.frombuffer(r.stdout, dtype="<i2").astype(np.float32) / 32768
    if len(x) < SR * 0.05:
        sys.exit(f"ABANDON : {src} rend moins de 50 ms")
    c = float(np.abs(x).max())
    if c < 0.02:
        sys.exit(f"ABANDON : {src} est quasi silencieux ({c:.3f})")
    return x * (CRETE / c), duree


def crete_fichier(chemin):
    d = subprocess.run(["ffmpeg", "-v", "error", "-i", str(chemin),
                        "-f", "s16le", "-ac", "1", "-ar", str(SR), "pipe:1"],
                       capture_output=True)
    y = np.frombuffer(d.stdout, dtype="<i2").astype(np.float32) / 32768
    return float(np.abs(y).max()) if len(y) else 0.0


def ecrire(nom, x, dst):
    """On ENCODE, on MESURE LE FICHIER LIVRÉ, et on recommence s'il sature.

    Deviner une marge ne marche pas : le dépassement du Vorbis dépend du
    contenu. Mesuré sur ce pistolet, déjà saturé à la source, il va de
    1,47 à 1,72 fois selon le niveau d'entrée — impossible à anticiper.
    Le seul chiffre qui compte est celui du fichier qu'on livre.
    """
    tmp = dst / (nom + ".ogg.tmp")
    gain = 1.0
    for essai in range(6):
        brut = (np.clip(x * gain, -1, 1) * 32767).astype("<i2").tobytes()
        r = subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(SR),
             "-ac", "1", "-i", "pipe:0",
             "-c:a", "libvorbis", "-b:a", "40k", "-f", "ogg", str(tmp)],
            input=brut, capture_output=True)
        if r.returncode != 0:
            sys.exit(f"ABANDON : encodage refusé pour {nom} — {r.stderr.decode()[:200]}")
        pk = crete_fichier(tmp)
        if pk <= 0.90:
            break
        gain *= 0.88 / pk
    else:
        sys.exit(f"ABANDON : {nom} sature encore après six essais ({pk:.3f})")
    tmp.replace(dst / (nom + ".ogg"))
    return (dst / (nom + ".ogg")).stat().st_size, pk


if __name__ == "__main__":
    dst = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "dtour/son")
    for nom, (f, a, b, dm) in SOURCES.items():
        src = dst / f
        if not src.exists():
            sys.exit(f"ABANDON : source introuvable — {src}\n"
                     f"Les sources ne sont pas versionnées. Voir son/LISEZMOI.md.")
        x, d = preparer(src, a, b, dm)
        o, pk = ecrire(nom, x, dst)
        print(f"  {nom:18s} {d:4.2f} s  {o / 1024:5.1f} Ko  crête livrée {pk:.3f}")
