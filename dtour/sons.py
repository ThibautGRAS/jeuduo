#!/usr/bin/env python3
"""Fabrique les échantillons sonores de `son/`.

Pourquoi hors ligne plutôt qu'au WebAudio : le temps réel impose de
rester simple — quelques oscillateurs et un filtre, sinon on paye à
chaque coup de feu, cinquante fois par horde. Ici on peut empiler autant
de couches qu'on veut, le coût est payé une fois pour toutes.

Ce que ça N'EST PAS : un enregistrement. Ces sons sont plus riches que la
synthèse temps réel qu'ils remplacent, mais un vrai coup de feu ne se
fabrique pas comme ça. Déposer un fichier CC0 au même nom dans `son/` le
remplace sans toucher une ligne de code — c'est exactement ce que la
banque d'échantillons permet.

Sortie : OGG mono 32 kbps, quelques kilo-octets pièce.
"""
import subprocess, sys, pathlib
import numpy as np

SR = 44100


def bruit(n, graine):
    r = np.random.default_rng(graine)
    return r.standard_normal(n)


def passe_bas(x, coupe, sr=SR):
    """Un pôle, appliqué deux fois : suffisant, et sans dépendance."""
    a = np.exp(-2 * np.pi * coupe / sr)
    y = np.empty_like(x)
    z = 0.0
    for i in range(len(x)):
        z = (1 - a) * x[i] + a * z
        y[i] = z
    return y


def passe_bas_glissant(x, f0, f1, sr=SR):
    """Coupure qui s'effondre de f0 à f1 : c'est ce qui fait le claquement
    d'une détonation plutôt qu'un « pfff »."""
    n = len(x)
    f = np.geomspace(max(f0, 20), max(f1, 20), n)
    a = np.exp(-2 * np.pi * f / sr)
    y = np.empty(n)
    z = 0.0
    for i in range(n):
        z = (1 - a[i]) * x[i] + a[i] * z
        y[i] = z
    return y


def env(n, attaque, chute, puissance=2.2):
    """Attaque quasi instantanée, chute exponentielle."""
    t = np.arange(n) / SR
    a = np.clip(t / max(attaque, 1e-5), 0, 1)
    d = np.exp(-t / max(chute, 1e-5)) ** 1.0
    return a * (d ** 1.0) * (1 - t / (t[-1] + 1e-9)) ** 0.0 * (d ** (puissance - 1))


def queue(x, retards, gains, sr=SR):
    """Une réverbération de ruelle, à la main : quelques échos courts.
    Une vraie convolution demanderait une réponse impulsionnelle, qu'on
    n'a pas — et ces échos-là suffisent à donner un lieu."""
    y = x.copy()
    for r, g in zip(retards, gains):
        d = int(r * sr)
        if d >= len(x):
            continue
        y[d:] += x[:len(x) - d] * g
    return y


def normaliser(x, crete=0.78):
    """0,78 et non 0,89 : l'encodage Vorbis DÉPASSE la crête d'origine —
    mesuré à 1,000 en sortie pour 0,89 en entrée, donc saturé. La marge
    se prend avant l'encodeur, pas après."""
    m = np.max(np.abs(x))
    return x * (crete / m) if m > 0 else x


# ---------------- les sons ----------------

def tir(grave, duree, coupe0, coupe1, corps_f, corps_d, echos, graine):
    n = int(SR * duree)
    det = passe_bas_glissant(bruit(n, graine), coupe0, coupe1) * env(n, 0.0004, duree * 0.16, 2.6)
    t = np.arange(n) / SR
    f = corps_f * np.exp(-t / (duree * 0.10))
    corps = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.0006, duree * corps_d, 2.0)
    x = det * 1.0 + corps * (0.85 if grave else 0.55)
    x = queue(x, echos, [0.30, 0.18, 0.10])
    return normaliser(x)


def recharge():
    """Deux temps : le barillet, puis la fermeture. C'est un GESTE, et
    c'est le double claquement qui le dit."""
    n = int(SR * 0.95)
    x = np.zeros(n)
    for depart, dur, c0, c1, g in ((0.00, 0.05, 5200, 900, 0.55),
                                   (0.09, 0.04, 3400, 700, 0.35),
                                   (0.62, 0.07, 2600, 420, 0.75),
                                   (0.70, 0.05, 1500, 300, 0.45)):
        d = int(SR * depart); m = int(SR * dur)
        cl = passe_bas_glissant(bruit(m, int(depart * 1000) + 7), c0, c1)
        x[d:d + m] += cl * env(m, 0.0003, dur * 0.30, 2.4) * g
    return normaliser(x, 0.72)


def impact_chair():
    """Mat, sans aigu : de la matière, pas du métal."""
    n = int(SR * 0.26)
    x = passe_bas(bruit(n, 11), 900) * env(n, 0.0008, 0.045, 2.4)
    t = np.arange(n) / SR
    f = 150 * np.exp(-t / 0.035)
    x += np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.05, 2.0) * 0.9
    return normaliser(x, 0.80)


def cri(f0, f1, duree, rugosite, graine):
    """Un râle : une fondamentale qui descend, des harmoniques, et du
    souffle. Chaque méchant a sa hauteur et sa rugosité — c'est ce qui
    les distingue à l'oreille sans qu'on ait à les regarder."""
    n = int(SR * duree)
    t = np.arange(n) / SR
    f = np.geomspace(f0, f1, n)
    ph = 2 * np.pi * np.cumsum(f) / SR
    r = np.random.default_rng(graine)
    vib = 1 + rugosite * 0.5 * np.sin(2 * np.pi * (18 + r.random() * 10) * t)
    x = np.zeros(n)
    for h, g in ((1, 1.0), (2, 0.45), (3, 0.28), (4, 0.14), (5, 0.08)):
        x += np.sin(ph * h * vib) * g
    x *= env(n, 0.02, duree * 0.42, 1.6)
    souffle = passe_bas(bruit(n, graine + 3), 2200) * env(n, 0.03, duree * 0.30, 1.4)
    x = x * 0.8 + souffle * rugosite * 0.5
    x = passe_bas(x, 3400)
    return normaliser(x, 0.85)


SONS = {
    "tir_revolver": lambda: tir(False, 0.42, 9000, 260, 190, 0.055, [0.055, 0.11, 0.19], 1),
    "tir_fusil":    lambda: tir(True,  0.62, 5200, 150, 118, 0.085, [0.075, 0.15, 0.26], 2),
    "recharge":     recharge,
    "impact_chair": impact_chair,
    # cinq voix : du plus grave et lourd au plus aigu et nerveux
    "cri_depar": lambda: cri(150, 78, 0.85, 0.85, 21),
    "cri_dsk":   lambda: cri(215, 120, 0.62, 0.55, 22),
    "cri_jubi":  lambda: cri(185, 96, 0.70, 0.95, 23),
    "cri_abbe":  lambda: cri(255, 150, 0.78, 0.40, 24),
    "cri_bruh":  lambda: cri(200, 108, 0.66, 0.70, 25),
}


def ecrire(nom, x, dst):
    brut = (np.clip(x, -1, 1) * 32767).astype("<i2").tobytes()
    cible = dst / (nom + ".ogg")
    tmp = dst / (nom + ".ogg.tmp")
    # `-f ogg` explicite : le fichier temporaire s'appelle .ogg.tmp, et
    # ffmpeg déduit le format de l'extension — il ne reconnaissait pas
    # celle-là. Le temporaire reste nécessaire : une écriture interrompue
    # ne doit pas laisser un fichier tronqué, la leçon a coûté deux
    # sprites sur ce projet.
    r = subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(SR),
         "-ac", "1", "-i", "pipe:0", "-c:a", "libvorbis", "-b:a", "32k",
         "-f", "ogg", str(tmp)],
        input=brut, capture_output=True)
    if r.returncode != 0:
        sys.exit(f"ABANDON : ffmpeg a échoué sur {nom} — {r.stderr.decode()[:200]}")
    tmp.replace(cible)
    return cible.stat().st_size


if __name__ == "__main__":
    dst = pathlib.Path(sys.argv[1]); dst.mkdir(parents=True, exist_ok=True)
    total = 0
    for nom, f in SONS.items():
        o = ecrire(nom, f(), dst)
        total += o
        print(f"  {nom:14s} {o/1024:6.1f} Ko")
    print(f"\n{len(SONS)} échantillons, {total/1024:.0f} Ko au total")
