#!/usr/bin/env python3
"""Assemble les morceaux de parts/ dans le <script> unique d'index.html.

Le dépôt impose un seul fichier livré, sans outil de compilation côté
client : l'assemblage a lieu ici, à la main, et c'est bien index.html qui
part en production. Le script refuse d'écrire si le repère n'est pas
trouvé exactement une fois — l'édition partielle a déjà coûté une
livraison sur le projet voisin.
"""
import re, sys, pathlib

BASE = pathlib.Path(__file__).parent
CIBLE = BASE / "index.html"
MORCEAUX = ["a_socle.js", "b_jeu.js", "c_rendu.js", "e_hortense.js", "f_enquete.js", "g_enquete_vue.js", "d_pilotage.js"]

REPERE = re.compile(r"<script>\n.*?\n</script>", re.S)


def main():
    html = CIBLE.read_text(encoding="utf-8")
    trouves = REPERE.findall(html)
    if len(trouves) != 1:
        sys.exit(f"ABANDON : {len(trouves)} bloc(s) <script> trouvé(s), il en faut exactement 1")

    corps = []
    for m in MORCEAUX:
        p = BASE / "parts" / m
        if not p.exists():
            sys.exit(f"ABANDON : morceau manquant {m}")
        corps.append(p.read_text(encoding="utf-8").rstrip("\n"))
    script = "<script>\n" + "\n".join(corps) + "\n</script>"

    neuf = REPERE.sub(lambda _: script, html, count=1)
    if neuf == html:
        print("index.html déjà à jour")
        return
    CIBLE.write_text(neuf, encoding="utf-8")
    lignes = neuf.count("\n") + 1
    print(f"index.html assemblé : {lignes} lignes, {len(neuf)} octets")


if __name__ == "__main__":
    main()
