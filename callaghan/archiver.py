#!/usr/bin/env python3
"""archiver.py — ranger une planche de sprites, sans jamais l'écraser.

    python3 callaghan/archiver.py planche.png n3 bar_th
    python3 callaghan/archiver.py --index

POURQUOI GARDER LES PLANCHES

Elles n'étaient pas gardées. Trois redécoupages ont pourtant eu lieu — les
barmans, Jubilar, BruHell — et à chaque fois l'original n'existait que
dans la conversation. Une conversation se ferme.

Le coût est faible et mesuré : 147 Ko en WebP contre 1,9 Mo en PNG, soit
environ 3 Mo pour vingt planches, à comparer aux 12 Mo de `img/`. C'est
l'inverse du cas des sons, où un WAV de 4,9 Mo ne servait qu'une fois et
a été exclu du dépôt : ici on relit souvent, et le fichier est petit.

POURQUOI NE JAMAIS ÉCRASER

Une nouvelle planche du même personnage n'est pas une correction de
l'ancienne : c'est un autre dessin. Le t-shirt de BruHell a changé entre
deux planches. Si la seconde avait écrasé la première, on aurait perdu le
seul document expliquant à quoi ressemblaient les sprites alors en jeu —
et le seul moyen de refaire une pose manquante dans l'ANCIEN style.

Ce script refuse donc d'écraser. Fichier identique : il ne fait rien.
Fichier différent : il range à côté, en `-v2`, `-v3`.
"""
import sys, pathlib, hashlib, json, datetime

DOSSIERS = {"n1", "n2", "n3", "n4", "commun", "a_identifier"}
# `a_identifier` : le purgatoire. Mieux vaut une planche mal rangée
# qu'une planche perdue — mais elle n'y reste que jusqu'à ce qu'on
# retravaille le personnage concerné, moment où on la renomme.
BASE = pathlib.Path(__file__).parent / "planches"


def empreinte(chemin):
    return hashlib.sha256(pathlib.Path(chemin).read_bytes()).hexdigest()[:16]


def archiver(source, dossier, nom):
    from PIL import Image
    if dossier not in DOSSIERS:
        sys.exit(f"ABANDON : dossier « {dossier} » inconnu.\n"
                 f"Connus : {', '.join(sorted(DOSSIERS))}")
    src = pathlib.Path(source)
    if not src.exists():
        sys.exit(f"ABANDON : {src} introuvable")

    d = BASE / dossier
    d.mkdir(parents=True, exist_ok=True)

    im = Image.open(src).convert("RGB")
    tmp = d / (nom + ".webp.tmp")
    # 92 ET NON 82. Mesuré sur la planche de Solène : à 82, la
    # compression déplace assez de couleurs pour que le détourage
    # fragmente le personnage — sa pose de danse sortait en trois
    # morceaux, alors que le PNG d'origine se découpait proprement. Une
    # archive dont on ne peut pas rejouer la découpe ne sert à rien.
    im.save(tmp, "WEBP", quality=92, method=6)
    neuf = empreinte(tmp)

    # NE JAMAIS ÉCRASER. On cherche d'abord si cette planche EXACTE est
    # déjà là — auquel cas il n'y a rien à faire — puis le premier nom
    # libre.
    for cand in sorted(d.glob(f"{nom}*.webp")):
        if empreinte(cand) == neuf:
            tmp.unlink()
            print(f"  déjà archivée à l'identique : {cand.name}")
            return cand
    n = 1
    cible = d / f"{nom}.webp"
    while cible.exists():
        n += 1
        cible = d / f"{nom}-v{n}.webp"
    tmp.replace(cible)
    ko = cible.stat().st_size / 1024
    print(f"  {cible.relative_to(BASE.parent)}  {im.size[0]}x{im.size[1]}  {ko:.0f} Ko"
          + (f"  (version {n}, l'ancienne est conservée)" if n > 1 else ""))
    ecrire_index()
    return cible


def ecrire_index():
    """Un index lisible : sans lui, un dossier de planches devient un tas.
    Il est RÉÉCRIT à chaque archivage, jamais tenu à la main — une liste
    tenue à la main diverge de son dossier en trois semaines."""
    lignes = ["# planches/ — les originaux, tels que reçus", "",
              "Les planches d'où les sprites ont été découpés. Elles ne sont",
              "**jamais écrasées** : une nouvelle planche du même personnage est un",
              "autre dessin, pas une correction. Le t-shirt de BruHell a changé entre",
              "deux planches ; garder les deux est le seul moyen de refaire une pose",
              "dans l'ancien style.", "",
              "Rangées par `archiver.py`, jamais à la main.", "",
              "| dossier | planche | taille |", "|---|---|---|"]
    total = 0
    for dossier in sorted(DOSSIERS):
        d = BASE / dossier
        if not d.exists(): continue
        for f in sorted(d.glob("*.webp")):
            o = f.stat().st_size
            total += o
            lignes.append(f"| `{dossier}` | `{f.name}` | {o/1024:.0f} Ko |")
    lignes += ["", f"**{total/1024/1024:.1f} Mo au total.**"]
    n = len(list((BASE / "a_identifier").glob("*.webp"))) if (BASE / "a_identifier").exists() else 0
    if n:
        lignes += ["", f"## {n} planches à identifier", "",
                   "Récupérées d'un coup depuis les envois d'une longue séance, avant",
                   "que l'archivage existe. Elles portent leur nom d'origine, qui ne dit",
                   "rien — mais elles sont SAUVÉES, ce qui était l'urgence.",
                   "",
                   "Elles se renomment au fil de l'eau : chaque fois qu'on retravaille",
                   "un personnage, on renomme sa planche au passage. Les renommer toutes",
                   "d'un coup demanderait de les ouvrir une à une pour rien."]
    BASE.mkdir(parents=True, exist_ok=True)
    (BASE / "LISEZMOI.md").write_text("\n".join(lignes) + "\n", encoding="utf-8")


def main():
    if len(sys.argv) == 2 and sys.argv[1] == "--index":
        ecrire_index(); print("index réécrit"); return
    if len(sys.argv) < 4:
        sys.exit(__doc__)
    archiver(sys.argv[1], sys.argv[2], sys.argv[3])


if __name__ == "__main__":
    main()
