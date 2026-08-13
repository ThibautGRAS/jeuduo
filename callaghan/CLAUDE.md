# CLAUDE.md — travailler sur Les Enquêtes de Callaghan

Ce fichier donne les **commandes et le cycle**. Il complète
`../CLAUDE.md` (règles communes au dépôt) et `MEMOIRE.md` (ce qui a
mordu, à lire avant de coder).

## Le jeu en une phrase

Quatre niveaux enchaînés dans un même décor et un même casting : la file
d'attente, l'enquête de l'appartement, la tournée du bar, la fusillade de
la ruelle. Jouable au doigt sur iPhone, hébergé sur GitHub Pages.

## Architecture

Le livrable est **un seul fichier**, `index.html`, produit par un
assembleur à partir de morceaux. On n'édite JAMAIS `index.html` à la
main : la prochaine assemblée écraserait le travail.

```
callaghan/parts/       les morceaux, dans l'ordre d'assemblage
  a_socle.js       constantes, images, sons, utilitaires, VERSION
  b_jeu.js         la machine à niveaux
  c_rendu.js       le canevas, la caméra, les transitions
  e_hortense.js    le niveau 1
  f_enquete.js     le niveau 2, logique
  g_enquete_vue.js le niveau 2, rendu
  h_bar.js         le niveau 3, logique
  i_bar_vue.js     le niveau 3, rendu
  k_foule.js       la foule du bar
  j_ruelle.js      le niveau 4, logique et rendu
  d_pilotage.js    interface, entrées, boucle, exports
```

Contraintes à ne pas casser : aucun outil de compilation, `svh` et jamais
`dvh`, aucun `shadowBlur`, boucle à pas fixe de 60 Hz avec accumulateur,
paysage pour les niveaux 1 à 3 et portrait pour le 4.

## Le cycle, dans cet ordre

```bash
# 1. éditer les morceaux, jamais index.html
# 2. assembler
python3 callaghan/assembler.py

# 3. syntaxe : extraire le <script> puis contrôler
node --check /tmp/dtour.js

# 4. tests
node callaghan/tests/tests.js          # code non nul si rouge

# 5. RENDU — règle en dur, voir ../CLAUDE.md
node callaghan/tests/apercu.js <dossier_png> <sortie>
#    puis OUVRIR les images produites

# 6. images : contrôle qui ne peut pas vivre dans Node
python3 callaghan/reparer_sprites.py callaghan/img --verifier

# 7. version dans a_socle.js ET dans index.html, puis push
```

Le harnais d'aperçu a besoin de PNG : node-canvas ne lit pas le WebP. On
convertit d'abord `img/**/*.webp` vers un dossier temporaire.

## Les outils

| script | ce qu'il fait |
|---|---|
| `assembler.py` | fabrique `index.html` depuis `parts/` |
| `decoupe2.py` | extrait des sprites d'une planche, fond magenta |
| `decouper_planche.py` | découpe une planche d'ennemi, échelle sur un témoin |
| `decouper_barman.py` | découpe un barman, échelle sur la TÊTE |
| `decouper_boutons.py` | les boutons de l'interface |
| `portraits.py` | les portraits du bestiaire, depuis les poses de course |
| `reparer_sprites.py` | fragments et trous ; `--verifier` pour contrôler |
| `sons.py` | synthèse hors ligne des détonations |
| `cris.py` | découpe les cris dans un enregistrement |
| `recharges.py` | prépare les sons de rechargement fournis |
| `ranger_memoire.py` | range `MEMOIRE.md` par thèmes |
| `planches.py prompt` | assemble un prompt de planche depuis le catalogue |
| `planches.py verifier` | contrôle une planche livrée AVANT découpage |
| `tests/apercu.js` | rend toutes les scènes du jeu, sans navigateur |

Tous écrivent de façon **atomique** — dans un `.tmp` puis remplacent. Ne
jamais les interrompre : deux sprites ont été corrompus par un `timeout`
avant que l'écriture atomique soit posée.

## Les sources lourdes restent dehors

GitHub Pages sert tout le dépôt. Les WAV, MP3 et planches d'origine sont
dans `.gitignore` ; ce qui les remplace est la **reproductibilité** : les
instants de découpe et les transformations sont écrits dans les scripts.
Thibaut garde les originaux de son côté.

## Ce que Thibaut apporte, et qui vaut le plus

Il travaille depuis un téléphone : pas de terminal, pas de rendu local.
Ce qu'il peut faire, personne d'autre ne peut le faire — et ce qu'il ne
peut pas faire, ne pas le lui demander.

**Une capture d'écran vaut mieux qu'une description.** Deux défauts
majeurs de ce projet n'ont été compris que par une capture : l'affiche du
bar qui ne s'affichait pas au premier lancement, et le pupitre dessiné
par-dessus. Aucun test ni aucun rendu ne les montrait.

**Nommer le symptôme, pas la cause.** « Ça reste sur la même pose » a
mené à la bonne correction. Si la cause avait été supposée — « la cadence
est trop lente » — on aurait accéléré une animation déjà trois fois trop
rapide. Le symptôme est une donnée ; la cause est une hypothèse, et c'est
mon travail.

**Envoyer une planche AVANT qu'elle soit découpée.** Une commande la
contrôle en dix secondes : fond, bords, séparation, têtes, pieds,
alternance des jambes. Découper d'abord, c'est perdre le découpage.

**Dire quand un correctif n'a rien changé** — et vérifier d'abord le
numéro de version en haut à gauche. Deux fois, le défaut signalé était
déjà corrigé mais servi depuis le cache de Safari.

## Le cycle d'une amélioration

1. Thibaut décrit le symptôme, avec une capture si ça se voit.
2. Je MESURE avant de corriger. Un chiffre, pas une impression : c'est ce
   qui a fait la différence sur le comptoir non horizontal, la foulée
   trois fois trop rapide, et les deux poses identiques.
3. Je corrige, j'assemble, je lance les tests, je REGARDE le rendu.
4. J'ajoute un test qui empêche le retour du défaut — et une scène
   d'aperçu si rien ne le montrait.
5. Je consigne dans `MEMOIRE.md` ce que ça a appris, avec le chiffre.
6. Je livre, version incrémentée, en disant quoi aller vérifier.

Si une planche d'images est nécessaire, l'étape 2 devient : donner le
fichier de `prompts/` à utiliser, puis contrôler la planche reçue.

## Deux règles en dur

Elles sont détaillées en tête de `MEMOIRE.md`, et ce sont les seules à
relire à chaque reprise :

1. **Regarder le rendu avant de pousser.**
2. **Aucune image montrée pendant un changement d'écran** — le voile de
   transition s'en charge, à condition que tout nouvel écran soit
   distingué dans `Transition.nomActuel`.
