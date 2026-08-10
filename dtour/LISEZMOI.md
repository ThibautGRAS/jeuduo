# LA FILE DU D'TOUR

Jeu d'arcade 2D, un seul fichier, jouable au doigt.

**Adresse** : https://thibautgras.github.io/jeuduo/dtour/

Thibaut et Pierre-François font la queue devant Le D'Tour. Les gens qui
longent la file leur tendent la main comme s'ils les connaissaient. Il
faut saluer avec le bon héros, assez vite. Trois ratés et c'est fini.

Thibaut, c'est le brun au polo vert. **PF** — Pierre-François — c'est le
chauve à lunettes. La planche fournie les annonçait dans l'autre sens ;
les fichiers de `img/` portent les bons noms.

> Ils ne les connaissaient même pas.

## Commandes

| | Thibaut | PF |
|---|---|---|
| Clavier | `A` `Q` `←` | `L` `P` `M` `→` |
| Écran | moitié gauche | moitié droite |
| | le gros bouton vert | le gros bouton bleu |

`Espace` lance ou relance une partie. `S` coupe le son. `D` ouvre les
outils.

## Ce qu'il faut savoir avant d'y toucher

Lire d'abord `../CLAUDE.md` et `../MEMOIRE.md` : les règles et les
pièges du dépôt valent ici aussi, et plusieurs ont déjà été payés.

- **Un seul fichier livré.** Tout le jeu tient dans `index.html`. Les
  seules ressources séparées sont les images de `img/`.
- **Aucun fichier audio.** Tout est synthétisé au WebAudio, comme dans
  DUO : l'ambiance de rue, les bruitages, et la petite boucle de bistrot
  — contrebasse, deux accords à contretemps, un balai sur la caisse
  claire, sur une grille de quatre mesures. Rien à télécharger, rien de
  protégé.
- **Pas de `shadowBlur`**, pas de `dvh` — voir `MEMOIRE.md`.
- La géométrie est en **unités monde**, où un personnage mesure 100 de
  haut. Rien dans la logique ne dépend de la taille de l'écran ; la
  conversion en pixels se fait au dernier moment, par un seul facteur.

## Travailler dessus

Le script d'`index.html` est découpé en quatre morceaux dans `parts/`,
recollés par `assembler.py`. C'est un confort de rédaction : le livrable
reste le fichier unique, et l'assemblage a lieu ici, pas chez le joueur.

```
python3 assembler.py && node tests/tests.js
```

`assembler.py` refuse d'écrire s'il ne trouve pas exactement un bloc
`<script>` — l'édition partielle a déjà coûté une livraison sur DUO.

**Ne pousser que si la suite est verte**, et enchaîner en `&&`, jamais
avec des retours à la ligne.

### Regarder ce qu'on fait

`tests/apercu.js` exécute le script du jeu **hors navigateur**, sur un
vrai canevas (node-canvas), et écrit huit images : écran titre, salut
vers chacun des deux héros, poignée de main le soir, file très longue la
nuit, iPhone en paysage, iPhone en portrait, et le malaise.

```
npm i canvas
python3 -c "from PIL import Image; import glob,os; [Image.open(p).save('/tmp/apngs/'+os.path.basename(p)[:-5]+'.png') for p in glob.glob('img/*.webp')]"
node tests/apercu.js /tmp/apngs /tmp/apercu
```

Le détour par des PNG est nécessaire : node-canvas ne lit pas le WebP.

Ce harnais a trouvé huit défauts qu'aucun test logique n'aurait vus :
un écran entièrement noir, un bras en saucisse, une épaule au niveau du
visage, des personnages trop grands, des bandes blanches sur les bords
du décor, et des sprites éclairés en plein jour au milieu d'une rue de
nuit. Une capture vaut mieux qu'une supposition.

## Comment c'est fait

| Brief | Ici |
|---|---|
| GameManager | `Jeu` |
| QueueManager | `File` |
| NPCManager | `Foule` |
| DifficultyManager | `Difficulte` |
| ScoreManager | `Score` |
| InputManager | `Entrees` |
| AudioManager | `Sons` |
| UIManager | `Interface` |

États du PNJ : `ENTREE` → `DEMANDE` → `POIGNEE` ou `MALAISE` → `MARCHE`
→ `ATTENTE`. `REPOS` sert au passant qui traverse sans dire bonjour.

### La géométrie du salut

C'est la décision qui a demandé le plus d'essais.

Les arrivants entrent **par la gauche** et longent la file par devant :
ils passent donc forcément devant les deux héros, et l'action reste
toujours au même endroit à l'écran, quelle que soit la longueur de la
file.

Celui qui salue ne se plante **pas** entre les deux héros : 62 unités
d'écart ne laissent la place à personne, et les bras se croisaient
n'importe comment. Il s'arrête à 104 unités **à droite de celui qu'il
vise** — la cible est donc tirée à l'arrivée, puisque c'est elle qui
décide du point d'arrêt. Saluer Pierre-François est un geste court ;
saluer Thibaut oblige à tendre le bras **par-dessus Pierre-François**,
ce qui est exactement la blague.

Le bras du PNJ est **peint au canevas**, pas découpé : la planche ne
fournit qu'une seule main tendue générique, et l'employer pour les seize
aurait changé le personnage au milieu de la file. La couleur de peau et
celle de la manche sont relevées sur chaque sprite au chargement.

Le rendez-vous des mains se fait en deux temps. Tant que le joueur n'a
pas répondu, le héros garde les mains dans les poches : la main du PNJ
vise un point d'attente devant lui. Au moment de la poignée, le sprite
« main tendue » entre en jeu et le rendez-vous devient le bout de sa
main, mesuré sur l'image — celle de Pierre-François va nettement plus
loin que celle de Thibaut, un chiffre en dur décalait la poignée d'une
demi-main.

### Le signal

L'alerte est posée **au-dessus du héros à saluer**, pas au-dessus du
PNJ, et reprend la couleur de son bouton : vert pour Thibaut, bleu pour
Pierre-François. Un anneau de décompte l'entoure, et une ellipse de la
même couleur s'allume au sol sous le héros. À 0,55 s de temps de
réaction, c'est la seule façon de lire la consigne sans réfléchir.

### La caméra

Premier réglage : cadrer toute la file. Mauvaise idée — à trente
personnes, les têtes faisaient quarante pixels sur un téléphone et on ne
voyait plus qui tendait la main.

Maintenant la caméra cadre la **zone d'action** : les deux héros et le
point de salut. Rien n'a le droit de la réduire, et le dézoom s'arrête à
`Z_MIN = 0.85`. Quand la file déborde, c'est le bar qui sort par la
gauche, jamais la poignée de main. La longueur se lit au compteur FILE,
au voile qui mange le bord droit et au badge « +N ».

La suite de tests vérifie qu'avec soixante-quatre personnes, les deux
héros et le point de salut restent à l'écran et les personnages au-dessus
de 120 px en 1280×720, de 95 px en 844×390 et en 390×750.

Le décor fait 2,3 fois plus large que haut : sur un téléphone debout on
n'en voit qu'une tranche étroite. Centrée à 34 %, elle tombait sur
l'angle du mur — quatre cents pixels de crépi beige. L'ancrage
horizontal suit donc le format, et glisse vers la devanture éclairée
quand l'écran se resserre. La ligne de sol remonte aussi en portrait,
sinon la file se range derrière les deux gros boutons.

## Réglages

Ils ont été posés puis éprouvés par simulation. Les changer demande de
relancer la suite.

| Réglage | Valeur | Pourquoi |
|---|---|---|
| Temps de réaction | 2,0 s → 0,55 s | décroissance géométrique : les paliers de 0,2 s se sentaient |
| Délai entre arrivées | 2,9 s → 0,78 s | |
| Demandes simultanées | 1, puis 2 à 13 saluts, 3 à 33 | |
| Points | 50 × combo × bonus de type | donne les ordres de grandeur de la planche |
| Vies | 3 | |
| Jour → soir → nuit | 0 / 22 / 52 saluts | croisement sur 2,2 s |
| Écart entre deux places | 62 unités | |
| Dézoom minimal | 0,85 | en dessous, on ne voit plus qui salue |
| Tempo de la musique | 92 → 124 | c'est le seul endroit où l'on entend que la soirée avance |
| Recul de celui qui salue | 104 unités | répond à la main tendue des sprites (36 à 45) |

Les événements absurdes — l'enthousiaste, le patient, le double salut,
la fausse alerte, le revenant, le passant, les jumeaux — se débloquent
petit à petit et restent minoritaires : la suite vérifie que le salut
ordinaire garde plus de 60 % des tirages même tard dans la partie.

## Images

`img/` contient 38 fichiers WebP, 730 ko en tout, découpés
automatiquement de la planche fournie : trois décors, huit poses pour
chacun des deux héros, seize PNJ, le logo et deux portraits ronds pour
les boutons.

Ils sont exportés en **double résolution**, rééchantillonnés au filtre
de Lanczos puis légèrement renforcés. Ça n'invente aucun détail : les
sprites d'origine font 130 px de haut et sont affichés jusqu'à 360 px
réels sur un écran retina, le rééchantillonnage du navigateur les
rendait mous. On choisit simplement le noyau plutôt que de le subir.

Le détourage se fait par **remontée depuis les bords** sur le clair
désaturé, jamais par seuil global : un seuil aurait mangé le t-shirt
blanc du PNJ 09. Les seize PNJ se touchent sur la planche ; ils sont
séparés par détection des creux d'occupation, vérifiée à l'œil.

## Ce qui n'est pas fait

- Pas de tableau des scores partagé : le record est local à l'appareil.
- Pas de manifeste PWA propre au jeu.
- Le portrait est jouable mais à l'étroit ; un pense-bête suggère le
  paysage, et se referme si on insiste.
- La musique n'a pas de réglage de volume séparé : `S` coupe tout.
