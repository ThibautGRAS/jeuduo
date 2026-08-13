#!/usr/bin/env python3
"""Réorganise la section 3 de MEMOIRE.md par THÈMES.

Les cent trente-sept pièges y étaient empilés dans l'ordre où ils sont
arrivés. C'est le bon ordre pour ÉCRIRE — on ajoute à la fin — et le
mauvais pour LIRE : personne ne relit cent trente-sept entrées avant de
coder, et on ne peut pas consulter « ce que je dois savoir sur les
images » puisque c'est éparpillé sur mille lignes.

Ce script déplace les blocs sans en changer une ligne. Il abandonne si un
piège n'est pas classé ou l'est deux fois : perdre une leçon dans une
réorganisation serait le comble.
"""
import pathlib, re, sys, collections

CHAPITRES = [
 ("Mesurer plutôt que deviner — sprites, décors, échelles",
  """La famille la plus chère du projet. À chaque fois la valeur devinée
était *plausible* — c'est ce qui la rend dangereuse : elle ne provoque
pas d'erreur, elle décale.

**Avant de coder** : toute constante prise sur une image se mesure, et se
REMESURE à chaque nouvelle planche.""",
  [4,17,32,55,63,64,65,84,88,108,111,115,116,123,131,135]),

 ("La chaîne d'images — chargement, découpage, formats",
  """Du fichier fourni au pixel affiché. Presque tous ces pièges sont
silencieux : le code s'exécute, rien ne casse, et l'image est fausse.

**Avant de coder** : un contrôle d'image ne peut pas vivre dans la suite
Node — node-canvas ne lit pas le WebP. Il vit en Python.""",
  [0,14,26,46,68,69,70,72,97,100,105,106,117,118,119]),

 ("Interface et lisibilité — texte, bulles, boutons",
  """Tout ce qui se lit à bout de bras sur un téléphone. La règle qui
revient : un texte se RÉDUIT ou se REPLIE jusqu'à tenir, il ne se pose
jamais à une taille devinée.

**Avant de coder** : mesurer la largeur disponible, pas l'estimer.""",
  [8,9,16,25,28,30,36,37,38,40,53,54,56,61,62,67,83,103,113,124,134,136]),

 ("Écrans, transitions et orientation",
  """Cette famille a été corrigée SIX fois séparément avant d'être
comprise comme un seul problème. Elle est aujourd'hui couverte par une
règle générale — le voile de transition — mais les pièges restent utiles
pour comprendre pourquoi elle existe.

**Avant de coder** : un nouvel écran doit être distingué dans
`Transition.nomActuel`, sinon il n'a pas de transition.""",
  [3,18,73,74,75,76,77,78,79,85]),

 ("La boucle, le temps et les états",
  """Le pas fixe, les délais, les états qui suspendent. La question à se
poser devant toute condition temporelle : **qui va la relire, et est-ce
garanti ?**

**Avant de coder** : un état qui suspend se teste DANS la condition de la
boucle, pas en retardant un délai.""",
  [5,6,7,58,59,60,90,92,101,122,133]),

 ("Contenu — scénarios, castings, textes",
  """Les données du jeu : affaires, personnages, répliques. Le piège
récurrent est l'écriture en dur d'un détail qui devient variable plus
tard — un prénom, un objet, une place.

**Avant d'écrire cinquante entrées** : lire la structure, et vérifier
qu'un texte tiré au sort ne suppose pas un cas particulier.""",
  [1,2,12,19,20,21,22,23,24,42,48,49,50,51,52,102,120,121,127,130]),

 ("Le son",
  """Arrivé tard, et avec ses propres lois. La plus contre-intuitive : un
son FRÉQUENT doit fatiguer moins, pas sonner mieux.

**Avant de coder** : la crête se vérifie sur le fichier LIVRÉ, en
bouclant — l'encodeur dépasse ce qu'on lui donne.""",
  [89,91,93,94,95,96,98,99]),

 ("Équilibrage et mécaniques de jeu",
  """Ce qui fait qu'un ennemi pose une QUESTION plutôt qu'un obstacle. Un
seuil ne veut rien dire seul : il se compare toujours au dégât d'un coup.

**Avant de coder** : une exception à une règle d'équilibrage se DÉCLARE
dans la donnée, elle ne se déduit pas d'un écart de chiffres.""",
  [71,107,109,112,126,128,132]),

 ("Tests et outillage",
  """Les tests attrapent beaucoup, et jamais le visuel. Ils ont aussi leurs
propres pièges — un test qui repère du code par son nom, une aide qui
mute l'état global, deux tests qui mesurent la même chose.

**Avant de coder** : un test qu'on doit AFFAIBLIR pour le faire passer
signale presque toujours que le code a tort.""",
  [13,27,29,31,39,47,66,110,114,125,129]),

 ("Décor, lumière et effets",
  """Ce qui appartient au LIEU. La question qui tranche : « est-ce que je
dois pouvoir le dépasser ? » Si oui, ça se place dans le monde ; sinon,
à l'écran.""",
  [80,81,82,86,87]),

 ("Structure du code",
  """Organisation, suppressions, refactorisations. Supprimer un système,
c'est toujours plus d'endroits qu'on ne croit.""",
  [10,11,15,33,34,35,41,43,44,45,57,104]),
]

PREAMBULE = """## 3. Pièges rencontrés, par thème

Cent trente-sept pièges, un par défaut rencontré. Ils étaient empilés
dans l'ordre où ils sont arrivés : le bon ordre pour les écrire, le
mauvais pour les lire. Ils sont désormais rangés par thème.

**Comment s'en servir.** On ne les relit pas tous. On ouvre le chapitre
qui correspond à ce qu'on s'apprête à faire — des images, du son, un
écran, un scénario — et on lit son chapeau, qui tient en trois lignes.
Les entrées détaillées sont là pour le jour où le symptôme apparaît :
elles décrivent le défaut, sa cause mesurée, et la parade.

**Ce que chaque entrée contient.** Le symptôme tel qu'il s'est présenté,
le CHIFFRE qui a permis de le comprendre quand il y en a un, et la règle
qui en sort. Les chiffres comptent plus que les conclusions : ils
permettent de vérifier si la règle vaut encore dans un autre contexte.

"""

def main():
    p = pathlib.Path("dtour/MEMOIRE.md")
    t = p.read_text(encoding="utf-8")
    d = t.index("## 3. Pièges rencontrés")
    f = t.index("## 4. Le harnais")
    sec = t[d:f]

    morceaux = re.split(r'(?m)^(### .+)$', sec)
    blocs = []
    for i in range(1, len(morceaux), 2):
        blocs.append(morceaux[i] + morceaux[i + 1])

    vus = collections.Counter()
    for _, _, idx in CHAPITRES:
        for i in idx:
            vus[i] += 1
    manquants = [i for i in range(len(blocs)) if not vus[i]]
    doubles = [i for i, n in vus.items() if n > 1]
    if manquants or doubles:
        sys.exit(f"ABANDON : non classés {manquants}, en double {doubles}")
    if max(vus) >= len(blocs):
        sys.exit(f"ABANDON : indice hors bornes ({max(vus)} pour {len(blocs)} blocs)")

    out = [PREAMBULE]
    for k, (titre, chapeau, idx) in enumerate(CHAPITRES, 1):
        out.append(f"### 3.{k} — {titre}\n\n{chapeau}\n\n")
        for i in idx:
            # les entrées descendent d'un niveau : ### devient ####
            out.append(re.sub(r'(?m)^### ', '#### ', blocs[i]).rstrip() + "\n\n")

    p.write_text(t[:d] + "".join(out) + t[f:], encoding="utf-8")
    print(f"{len(blocs)} pièges rangés en {len(CHAPITRES)} chapitres")


if __name__ == "__main__":
    main()
