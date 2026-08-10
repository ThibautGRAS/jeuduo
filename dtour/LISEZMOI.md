# LES ENQUÊTES DE CALLAGHAN

Deux niveaux, un seul fichier, jouables au doigt.

| | |
|---|---|
| **01 · La file du D'Tour** | Saluez tout le monde devant le bar, avant que ça devienne gênant. |
| **02 · L'enquête de la pizza** | Fouillez l'appartement, réunissez six indices, cinq minutes. |

On choisit le niveau sur l'écran d'accueil, les deux sont toujours
ouverts, et on peut mettre en pause à tout moment pour reprendre,
recommencer, ou revenir au menu.

**Adresse** : https://thibautgras.github.io/jeuduo/dtour/

Pierre-François et Thibaut font la queue devant Le D'Tour. Les gens qui
longent la file leur tendent la main comme s'ils les connaissaient. Il
faut saluer avec le bon héros, assez vite. Trois ratés et c'est fini.

Thibaut, c'est le brun au polo vert. **PF** — Pierre-François — c'est le
chauve à lunettes. La planche fournie les annonçait dans l'autre sens ;
les fichiers de `img/` portent les bons noms.

> Ils ne les connaissaient même pas.

## Niveau 2 — l'enquête de la pizza

Les deux niveaux sont **toujours** jouables : on choisit celui qu'on
veut sur l'écran d'accueil, sans rien avoir à débloquer. Le fait d'avoir
terminé le niveau 1 reste enregistré sous `dtour_progres` — c'est une
information, pas une serrure.

Une courte introduction — six temps, une dizaine de secondes, sautable
d'un geste. Elle est **jouée dans le décor** : écran noir sur « Quelques
heures plus tard... », puis l'appartement apparaît, Pierre-François
entre par la gauche avec sa loupe, Thibaut le rejoint, et le titre
tombe. La scène est montée avant que le chrono parte — c'est ce qui
permet de les faire entrer à l'image sans que la partie ait commencé.

Puis l'enquête : seize meubles, six indices à réunir, cinq minutes.

**Échelle.** Un adulte fait environ 70 % de la hauteur sous plafond, et
la pièce occupe 88 % de l'image : les inspecteurs mesurent donc 0,62 de
la hauteur du décor. Ce n'est pas un chiffre au jugé — à 0,46, ils
faisaient un mètre trente et avaient l'air collés sur une carte postale.
Deux ombres les asseyent dans la pièce, une large et douce, une courte
et franche au contact des pieds, et un voile chaud posé **après** eux
les met à la lumière de l'appartement.

**Commandes.** `←` `→` marcher, `E` fouiller un meuble, `I` interroger
quelqu'un, `TAB` changer d'inspecteur, `ESPACE` action contextuelle et
esquive, `D` le dossier, `A` accuser, `Échap` pause.

**Fouiller et interroger sont deux touches**, pas une. Quand quelqu'un se
tient devant un meuble — et c'est le cas de Charles, assis à la table —
on ne savait pas ce que le bouton allait faire. Chacune s'éteint quand
elle n'a rien à faire, et un petit signe violet s'allume au-dessus de la
personne à portée.

**Ils se parlent.** Trouver un indice déclenche un échange à deux voix :
celui qui fouille annonce, l'autre commente. Un mot en entrant dans
chaque pièce, une fois par partie. Et de loin en loin, quand on les
laisse tranquilles, ils bavardent. Tout est cadencé par le chrono du
jeu, jamais par `setTimeout`.

**Dix-sept affaires écrites** qui se servent de ces liens : la pizza mise de
côté pour Hortense, Charles qui efface sa visite, le prof d'histoire qui
date la soirée à la minute parce qu'il en faisait partie, la chaîne
Risoto-puis-Charles, le troc contre une tarte au citron, la reconstitution du prof
d'histoire qui a remangé la pizza pour être sûr de comprendre, le pari
perdu contre le chat, la pizza mise au congélateur pour la garder au
chaud, le régime qui a tenu quarante minutes, la deuxième pizza
commandée pour masquer la disparition de la première, la sieste de
Pierre-François qui avait tout mangé avant de partir — ou la vraie :
nous étions sortis, elle a tout mangé, laissé des miettes et un **billet
de cinq euros** pour qu'on en rachète une. « Personne ne paie pour un
vol. » « Alors ce n'est pas un vol. C'est un remboursement. » Qui, où et
pourquoi changent à chaque fois, et avec eux la piste, la réplique de
découverte, la contradiction et le dénouement. Aucun dénouement n'est
répété. La suite le vérifie sur neuf cents tirages.

**Deux accusations, pas plus.** La seconde erreur perd l'affaire. Sans
cette limite, on citait tout le monde jusqu'à tomber juste. Le nombre
restant est écrit sur le bouton.

**Trois habitants, à des places fixes**, et le chat. Ils ne sont pas
interchangeables : chacun a un lien avec les inspecteurs, et ce lien
change ce qu'on obtient de lui.

| | |
|---|---|
| **TEOPEDO** — canapé | Ami de Pierre-François et d'Hortense. Prof d'histoire. Un passé qu'il ne raconte pas, et des gestes qui le racontent pour lui. |
| **CHARLES** — table | L'amant de la colocataire. Personne n'est censé savoir qu'il était là : c'est son seul mobile, et il vaut toutes les pizzas du monde. |
| **LA SŒUR D'HORTENSE** — couloir | Colocataire, sœur de celle qui lance des tartes, et belle-sœur de Pierre-François. |
| **RISOTO** — au sol | Le chat. Il ne dira rien, mais il laisse des traces. |

Les trois sont aussi dans le **niveau 1** : la sœur fait la queue comme
tout le monde — elle est debout et entière, donc elle marche — et les
deux autres tiennent la terrasse du D'Tour. Leurs sprites les montrent
assis : on ne peut pas les faire marcher, alors ils regardent. Quand la
file s'allonge, elle finit par passer devant eux, ce qui est exactement
ce que fait une file.

Chacun **pose sur une ligne relevée sur le décor** : l'assise du canapé à
80 %, le plateau de la table à 73 %, le sol du couloir à 90 %. Charles
occupe la place du fond et non le milieu du plateau : c'est là que se
plante l'inspecteur qui fouille la table. Les
poser tous sur la même ligne mettait Charles debout devant sa table et
faisait flotter Teo au-dessus du canapé.

**Un interrogatoire est un échange, et la réponse répond.** Un *sujet*
tient la question et ses réponses possibles — auparavant les questions
défilaient d'un côté et les réponses de l'autre, si bien qu'on demandait
l'heure et qu'on s'entendait répondre qu'il y avait deux pizzas.

Trois réponses par sujet : ce qu'on dit à Pierre-François, qui est de la
famille ou de la bande ; ce qu'on dit à Thibaut quand on n'a rien fait ;
et ce qu'on lui dit quand c'est nous.

**Pierre-François tutoie Teo et sa belle-sœur**, et vouvoie Charles qu'il
ne connaît pas. Thibaut vouvoie tout le monde — c'est un inconnu, et
c'est précisément ce qui le rend efficace. « Tu as ouvert à quelqu'un ? »
appelle « On en reparle à Noël. » ; « Vous avez ouvert à quelqu'un ? »
appelle « J'ai ouvert, oui. Ce n'était pas le livreur. »

**Chaque affaire ajoute son anecdote**, posée en premier dans
l'entretien : c'est elle qui porte le scénario. « Ces cinq euros, ils
sortent d'où ? » — « De mon porte-monnaie. D'où veux-tu qu'ils
sortent. »

On aborde quelqu'un **dès que son nom s'affiche**, pas plus près : la
portée de la parole vaut plus du double de celle d'un tiroir.

**On voit qui parle.** Les inspecteurs ont une bulle blanche avec un
liseré de leur couleur — vert pour Pierre-François, bleu pour Thibaut.
Les habitants répondent au-dessus d'eux-mêmes, dans une bulle papier
crème signée de leur nom. Auparavant tout sortait de la même bouche et
on ne savait plus qui demandait quoi.

Toutes les bulles passent par un **calage commun** : on les mesure, on
remonte celles qui se recouvrent, et quand le plafond est atteint — sous
le chrono — elles se décalent sur le côté plutôt que de disparaître
derrière le bandeau.

**Les deux inspecteurs n'entendent pas la même chose, et c'est le
cœur du niveau.** Pierre-François est de la famille et de la bande : sa
belle-sœur lui parle de Noël, Teo lui dit de s'asseoir. Devant Thibaut,
un inconnu, on se surveille moins — et lui seul arrache la
contradiction. Aucune réplique n'est servie aux deux ; un test le
vérifie ligne par ligne.

Chacun a en plus une **remarque de fond** que l'autre inspecteur
formule : ce qu'on voit et non ce qu'on entend. « Elle a un rouleau de
papier toilette dans la poche. Sans explication. »

**Ils portent leur nom** dès qu'on les approche, et pour de bon dès qu'on
leur a parlé — le chat compris. On ne peut pas accuser quelqu'un qu'on
ne sait pas nommer.

**Les scénarios se voient enfin.** Au quatrième indice, les deux
inspecteurs formulent la piste — « Rien n'a été volé. Tout a été
rangé. » — et la découverte de la pizza a sa réplique propre. Surtout,
interroger la bonne personne avec quatre indices en poche fait sauter
une contradiction, une seule fois par partie : c'est ce qui donne un
intérêt à l'interrogatoire au-delà de la réplique amusante.

**Les deux ne servent pas à la même chose, et il faut les deux.**
Pierre-François lit les traces : certains indices ne se lisent qu'avec
lui. Thibaut lit les gens : la manette grasse, le menu du livreur, les
suspects — Pierre-François n'en tire rien. Chaque affaire contient au
moins un indice de chaque sorte, garanti par le générateur : sans cette
règle, un tirage sur trois se bouclait avec un seul inspecteur et le
bouton CHANGER ne servait à rien.

**Même les meubles muets se lisent à deux.** Les seize meubles ont deux
répliques : Pierre-François décrit ce qu'il déduit — « Coussins
déplacés. On s'est assis, puis relevé vite. » — Thibaut ce qu'il
ressent — « Aucun suspect. Quelques chaussettes. »

**Le fond sonore** n'est pas décoratif : c'est lui qui fait la
différence entre « une image » et « un endroit ». La pendule est calée
sur l'horloge audio et non sur l'affichage — une seconde qui traîne
s'entend tout de suite.

**Le générateur d'affaire** tire un scénario sur trois au début de la
partie, puis en déduit le coupable, la cachette et les six indices —
jamais l'inverse. Une enquête impossible ne peut donc pas sortir, et la
suite de tests le vérifie sur trois cents tirages : six indices sans
doublon, six meubles distincts, jamais d'indice sur la cachette, et les
deux indices porteurs toujours présents.

**Hortense** intervient une fois, entre 35 % et 65 % du temps, jamais
pendant le dossier ni pendant l'accusation. Mais **parler à sa sœur,
c'est la prévenir** : une fois sur deux elle rapplique dans les
secondes qui suivent, sinon l'attente est franchement raccourcie — et
insister finit toujours par payer. La sœur le dit elle-même : « Je viens
de prévenir ma sœur, au fait. » L'attente moyenne tombe de 150 à 37
secondes. Elle lance sa tarte, on a
450 ms pour se baisser, et en repartant elle laisse tomber une rondelle
de chorizo — le doute est permis, la réponse non.

**Comment on gagne**, dans l'ordre :

1. fouiller les meubles jusqu'à **trois indices** au moins ;
2. ouvrir la **bonne cachette** — la pizza ne se montre nulle part
   avant, et pas non plus avant ces trois indices ;
3. appuyer sur **ACCUSER** et désigner qui.

Le bouton ACCUSER est présent dès la première seconde mais éteint ; il
s'allume à trois indices et clignote quand plus rien ne manque. La liste
des suspects se touche directement : un premier toucher choisit, un
second accuse. Une mauvaise accusation coûte vingt secondes et ne
termine pas la partie.

Ces conditions sont écrites à l'écran — en haut de la liste et au bas du
dossier — parce que la première version les gardait pour elle et qu'on
pouvait réunir six indices sans voir comment conclure.

## Format

Le jeu est **verrouillé en paysage** et demande le **plein écran** au
premier appui sur JOUER — c'est le seul moment où un navigateur
l'accorde. Quand l'appareil expose l'API d'orientation, elle est
verrouillée ; quand il ne l'expose pas (Safari sur iPhone), un écran
bloquant prend le relais tant que le téléphone est debout, et la partie
est mise en pause derrière.

Ce n'est pas une préférence : la file s'étire horizontalement. En
portrait on n'en voit que trois personnes, et le bras tendu par-dessus
Pierre-François ne rentre pas dans le cadre.

`F` bascule le plein écran, le bouton ⛶ aussi.

## Commandes

| | Thibaut | PF |
|---|---|---|
| Clavier | `A` `Q` `←` | `L` `P` `M` `→` |
| Écran | moitié gauche | moitié droite |
| | le gros bouton vert | le gros bouton bleu |

`Espace` lance ou relance une partie. `S` coupe le son. `D` ouvre les
outils. `Échap` ou `P` met en pause — la scène reste visible derrière,
ce qui vaut mieux qu'un écran noir pour se rappeler où on en était.

## Ce qu'il faut savoir avant d'y toucher

Lire d'abord `../CLAUDE.md` et `../MEMOIRE.md` pour les règles du dépôt,
puis **`MEMOIRE.md`, ici même** : il tient les réglages calibrés, les
pièges propres à ce jeu et ce qui n'est pas fait.

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

Ce harnais a trouvé ce qu'aucun test logique ne pouvait voir : un écran
entièrement noir, un bras en saucisse, une épaule au niveau du visage,
des personnages trop grands, des bandes blanches aux bords du décor, des
sprites éclairés en plein jour au milieu d'une rue de nuit, et une tache
bleue entre les jambes d'un inspecteur. Une capture vaut mieux qu'une
supposition — le détail des incidents est dans `MEMOIRE.md`.

## Place à l'écran

Les commandes ne sont pas un bandeau mais **trois pastilles** : les deux
héros dans les coins bas, là où tombent les pouces en paysage, et
l'esquive au centre, discrète tant qu'aucune tarte n'est en l'air. Un
bandeau pleine largeur mangeait la moitié basse de la scène et coupait
les héros aux genoux ; les pastilles ne recouvrent que les pieds de deux
ou trois figurants dans les angles.

Elles sont bornées à 26 % de la largeur, ce qui n'est pas un chiffre
choisi au hasard : c'est la limite au-delà de laquelle la pastille de
gauche vient mordre sur Thibaut.

La ligne de sol laisse 8 % de hauteur sous les pieds. Sans cette marge,
les personnages étaient posés sur le bord de l'écran et n'avaient plus
l'air d'être sur le trottoir.

L'écran titre se règle sur la HAUTEUR disponible et non sur la largeur.
Réglé en largeur, le logo poussait le bouton JOUER et la légende hors du
cadre dès que la barre du navigateur mangeait cent pixels.

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

### Qui est qui

Le tableau `Heros` est la **seule** source : prénom, sprite et donc
portrait. Son ordre est celui des commandes — 0 = pastille verte à
gauche, touche A ; 1 = pastille bleue à droite, touche L. Les libellés
des boutons, la légende de l'écran titre et les boutons du panneau
debug se remplissent depuis lui.

Écrits en dur dans le HTML, ces prénoms avaient fini par désigner
l'autre bonhomme. Échanger les deux héros se fait maintenant en
échangeant deux lignes, et `decoupe2.py` refuse de sortir les images si
le buste de Thibaut n'est pas vert et celui de Pierre-François noir.

### Ce qu'ils se disent

L'arrivant lance un « Salut ! », « Tiens, salut ! » ou « Ça va ? » au
moment où il tend la main — c'est ce qui rend le malentendu audible. Si
le joueur vise juste, le héros répond, et sa réponse trahit qu'il ne
sait pas du tout à qui il parle : « Euh... salut ! », « Bien sûr ! »,
« Ça faisait longtemps ! ». Si personne ne serre, l'arrivant conclut
tout seul : « Bon. », « Tant pis. »

Les bulles suivent celui qui parle plutôt que de rester plantées à
l'endroit où il se tenait, et la queue de la bulle reste dirigée vers sa
tête même quand la bulle glisse pour ne pas sortir de l'écran.

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

Le détail, et les raisons, sont dans `MEMOIRE.md`.

- Pas de tableau des scores partagé : le record est local à l'appareil.
- Pas de manifeste PWA propre au jeu.
- Le portrait est refusé, pas dégradé : mieux vaut un écran clair qu'un
  jeu injouable.
- Sur iPhone, Safari n'expose ni `requestFullscreen` ni le verrouillage
  d'orientation. Ajouter le jeu à l'écran d'accueil donne le plein écran
  réel ; sinon la barre du navigateur reste.
- La musique n'a pas de réglage de volume séparé : `S` coupe tout.
