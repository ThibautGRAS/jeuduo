#!/usr/bin/env python3
"""Fabrique les cinq cris de méchants depuis un enregistrement de
grognements.

La synthèse ne donnait rien de bon pour un cri : un râle d'oscillateurs
sonne comme un jouet. Un vrai grognement animal, lui, a la rugosité et
les irrégularités qu'aucune formule ne produit à ce prix.

Trois choix qui expliquent le reste :

1. ON CHOISIT DES FENÊTRES, ON NE COUPE PAS AUX SILENCES. Le source
   grogne presque en continu — mesuré : la médiane de l'enveloppe est à
   0,026 et le 75e centile à 0,094, il n'y a pas de blancs. Une coupure
   au silence ne rendait que quatre morceaux sur cinquante-six secondes.
   On note donc les fenêtres par leur énergie DIVISÉE par l'énergie de
   leurs bords : une bonne fenêtre commence et finit doucement, sinon le
   cri démarre en plein milieu d'un aboiement.

2. CHAQUE MÉCHANT A SA TRANSFORMATION. Même matière, cinq voix : la
   hauteur et la durée bougent ensemble (`asetrate`, comme un
   magnétophone qu'on ralentit), ce qui étire aussi les formants. C'est
   exactement ce qui fait qu'un grognement descendu d'une quinte sonne
   énorme au lieu de sonner ralenti.

3. LE SOURCE NE RESTE PAS DANS LE DÉPÔT. 4,9 Mo servis par GitHub Pages
   pour un fichier que le jeu ne charge jamais. Les instants retenus sont
   écrits ici : le découpage est reproductible sans le garder.
"""
import subprocess, sys, pathlib

SOURCE_DEFAUT = "745360__johntrap__blackiegrogne-2401.wav"

# Fenêtres retenues, en secondes, mesurées sur le source (voir §1).
# Chaque méchant : (départ, durée, facteur de hauteur, gain).
# Facteur < 1 = plus grave et plus long ; > 1 = plus aigu et plus court.
VOIX = {
    # le tank : très grave, très long, il pèse
    "cri_depar": (6.80, 0.75, 0.62, 1.00),
    # le rapide : plus haut, plus court, nerveux
    "cri_dsk":   (2.35, 0.62, 1.18, 0.95),
    # le lanceur : rugueux, médium
    "cri_jubi":  (10.60, 0.70, 0.88, 1.00),
    # le vieux prêtre : le plus aigu et le plus fluet
    "cri_abbe":  (4.55, 0.58, 1.42, 0.90),
    # le bombardier : médium-grave
    "cri_bruh":  (35.75, 0.68, 0.78, 1.00),
}
SR = 44100


def extraire(src, dst, nom, depart, duree, hauteur, gain):
    tmp = dst / (nom + ".ogg.tmp")
    # asetrate change la hauteur ET la durée ensemble, comme un
    # magnétophone : c'est ce qu'on veut ici. aresample remet la
    # fréquence d'échantillonnage attendue derrière.
    filtres = (
        f"asetrate={int(SR * hauteur)},aresample={SR},"
        # les bords en douceur : sans ça, chaque cri claque à l'attaque
        # et à la coupure, et on entend le ciseau
        f"afade=t=in:st=0:d=0.035,"
        f"afade=t=out:st={duree / hauteur - 0.09:.3f}:d=0.09,"
        # un passe-bas doux : le source a des aigus de micro qui font
        # « enregistrement », pas « monstre »
        f"lowpass=f=5200,"
        # et une compression légère pour que tous sortent au même niveau
        f"acompressor=threshold=0.15:ratio=4:attack=5:release=180,"
        f"volume=1"
    )
    # DEUX PASSES : on rend d'abord en brut pour MESURER la crête, puis on
    # applique le gain exact. La compression laissait les cris à 0,30 de
    # crête là où les détonations sont à 0,78 — inaudibles à côté. Et la
    # marge se prend avant l'encodeur, qui dépasse la crête qu'on lui
    # donne (mesuré en v6.70 : 0,89 en entrée, 1,000 en sortie).
    r = subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-ss", f"{depart:.3f}", "-t", f"{duree:.3f}", "-i", str(src),
         "-ac", "1", "-af", filtres,
         "-f", "s16le", "-ar", str(SR), "pipe:1"],
        capture_output=True)
    if r.returncode != 0:
        sys.exit(f"ABANDON : ffmpeg a échoué sur {nom} — {r.stderr.decode()[:200]}")
    import numpy as np
    x = np.frombuffer(r.stdout, dtype="<i2").astype(np.float32) / 32768
    if not len(x):
        sys.exit(f"ABANDON : {nom} est vide")
    crete = float(np.abs(x).max())
    if crete < 0.02:
        sys.exit(f"ABANDON : {nom} est quasi silencieux ({crete:.3f})")
    x = x * (0.78 * gain / crete)
    brut = (np.clip(x, -1, 1) * 32767).astype("<i2").tobytes()
    r = subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(SR),
         "-ac", "1", "-i", "pipe:0",
         "-c:a", "libvorbis", "-b:a", "40k", "-f", "ogg", str(tmp)],
        input=brut, capture_output=True)
    if r.returncode != 0:
        sys.exit(f"ABANDON : encodage refusé pour {nom} — {r.stderr.decode()[:200]}")
    # écriture atomique : une interruption ne doit pas laisser un fichier
    # tronqué, la leçon a coûté deux sprites sur ce projet
    tmp.replace(dst / (nom + ".ogg"))
    return (dst / (nom + ".ogg")).stat().st_size


if __name__ == "__main__":
    dst = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "dtour/son")
    src = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else dst / SOURCE_DEFAUT
    if not src.exists():
        sys.exit(f"ABANDON : source introuvable — {src}\n"
                 f"Elle n'est pas versionnée (4,9 Mo). Voir son/LISEZMOI.md.")
    total = 0
    for nom, (d, du, h, g) in VOIX.items():
        o = extraire(src, dst, nom, d, du, h, g)
        total += o
        print(f"  {nom:12s} {d:6.2f} s  x{h:.2f}  {o / 1024:5.1f} Ko")
    print(f"\n{len(VOIX)} cris, {total / 1024:.0f} Ko")
