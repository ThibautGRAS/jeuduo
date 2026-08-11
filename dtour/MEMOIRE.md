# MEMOIRE.md — ce que ce dossier a appris

Mémoire technique de `dtour/`. Complète `LISEZMOI.md`, qui décrit le
jeu, et `../MEMOIRE.md`, dont les pièges valent ici aussi.

---

## 1. Architecture

### Un fichier livré, neuf morceaux édités

`index.html` est le livrable : HTML, CSS et JavaScript dans un seul
fichier, aucun outil de compilation chez le joueur. Il est recollé par
`assembler.py` à partir de `parts/` :

| Morceau | Contenu |
|---|---|
| `a_socle.js` | constantes, utilitaires, `Sons`, chargement des images, `Difficulte` |
| `b_jeu.js` | `Score`, `Pnj`, `File`, `Foule`, `Heros`, `Jeu` — niveau 1 et aiguillage |
| `c_rendu.js` | `Camera`, `Effets`, rendu du niveau 1 |
| `e_hortense.js` | Hortense, la tarte, l'esquive (niveau 1) |
| `f_enquete.js` | `Affaire`, `Dossier`, `HortenseApp`, `Enquete` — logique du niveau 2 |
| `g_enquete_vue.js` | `EnqVue` — rendu du niveau 2 |
| `h_bar.js` | `Tournee`, champions, barmans, boissons — logique du niveau 3 |
| `i_bar_vue.js` | `BarVue` — rendu du niveau 3 |
| `d_pilotage.js` | `Progres`, `Intro`, `Interface`, `Entrees`, `Ecran`, `Debug`, `Boucle`, amorçage |

`d_pilotage.js` passe **en dernier** : il lit des constantes déclarées
partout ailleurs. La zone morte temporelle a déjà coûté deux écrans
blancs sur le projet voisin.

`assembler.py` refuse d'écrire s'il ne trouve pas exactement un bloc
`<script>`.

### Trois niveaux, un seul cadre

`Jeu.niveau` vaut 1, 2 ou 3. `Jeu.pas()` et `dessiner()` aiguillent dès
la première ligne ; tout le reste — chrono, sons, effets, écran de fin,
plein écran, blocage portrait — est commun. Les niveaux ne partagent
aucune géométrie. Ajouter un niveau = un morceau logique + un morceau
vue, une branche dans `demarrer/pas/dessiner`, une carte sur l'écran
titre, un pupitre HTML, une liste `IMAGES_NIVEAUX` et son dossier
`img/nX/` — le niveau 3 est le modèle du geste.

### img/ est rangé par niveau

`img/commun/` (héros, Hortense, tarte, habitants, effets), `img/n1/`,
`img/n2/`, `img/n3/`. Le classement est déclaré UNE fois, dans
`IMG_PAR_DOSSIER` (a_socle) ; `cheminImage(nom)` compose l'URL, la
suite compare la table au disque fichier par fichier — un webp déplacé
sans mise à jour du code se voit au premier lancement. Piège rencontré
le jour même : `SPRITES_PNJ` embarque les habitants debout (ils font la
queue au niveau 1) — `n1` doit les EXCLURE, ils vivent dans commun/.

### Réglages du niveau 3

| Réglage | Valeur | Pourquoi |
|---|---|---|
| Monde | 3 × le fond bout à bout | le fond seul (650 px à H=318) est plus étroit que l'écran |
| Plateau du comptoir | 0.555 | mesuré sur le fond (bande de bois clair : 0.55-0.57) |
| Vie d'un verre | 7.5 s, 5.2 s en coup de feu | |
| Thibaut / PF | vitesse 1.00 / 0.82, boire 1.00 / 0.65 | produits comparables, test < 35 % d'écart |
| Eau | après 25 s, p = 0.26 | le piège attend que le réflexe s'installe |
| Coup de feu | à 70 s, 20 s, une fois | |
| Dernière tournée | 5 décisions, erreur = on repart à 5 | |
| Durée de la soirée | 150 s | le chrono est une vraie contrainte |
| Ambiance | départ 35, fuite 0,35/s, gain 8 | il faut pouvoir monter ET tomber |
| Défaites | jauge à 0, ou temps écoulé jauge non pleine | il n'y en avait AUCUNE avant |
| Prime SUR LE COUP | +50 si bu en moins de 1,6 s | récompense la lecture, pas le sprint |
| Multiplicateur | plafonné ×5 | sinon la prime ne pèse plus rien |
| Postes des barmans | 0,34 et 0,66 | plus écartés, on n'en voyait aucun |
| Télégraphe Francky | 5 poses ; Jojo 3 | plus c'est long, plus ça se lit |
| Habitués | chipent un verre après 55 % de sa vie, jamais l'eau | ménage gratuit, points perdus |
| Tarte au bar | 55 % des passages d'Hortense, fenêtre 0,62 s, +200 / −10 | même fenêtre qu'au niveau 2 |
| Télégraphe Jojo | 3 poses contre 5 à Francky | la longueur est une information |
| Verre raté | il TRAÎNE (grisé) au lieu de disparaître | jeter = +10, boire = « ÉVENTÉ… » |
| Débordement | 5 traînes → ambiance −1.2/s | le ménage fait partie du service |
| Pompette | 3 verres bus en < 9 s → 5 s à vitesse ×0.55 | l'eau bue dessoûle instantanément |

Le garde-fou `faisable()` refuse tout verre injouable : distance à la
vitesse du champion + geste de boire + verres déjà posés < vie × 0.9.
Il travaille avec la vitesse EFFECTIVE : pompette, on sert moins loin.

### Un test de dimensions ne voit pas le CONTENU
Le pire raté de la série. En refaisant la découpe des dix poses de
chaque personnage, le test « toutes les poses ont la même taille » est
passé au vert du premier coup — et chaque sprite contenait **deux
personnages empilés** : je recopiais la bande source entière au lieu de
la seule boîte de la pose, donc la voisine de gauche, celle de droite ET
celle de la rangée du dessous entraient dans l'image. Un invariant sur
les métadonnées ne dit rien de ce qu'il y a dedans. Toute découpe se
regarde, pose par pose, sur une planche de contact — le test vient
ensuite, pour empêcher la régression, jamais pour valider la première
livraison.

### La ligne de sol se calcule PAR RANGÉE
Corollaire du même chantier : la médiane des bas de boîte prise sur les
DEUX rangées d'une planche tombe entre les deux. Résultat, une rangée
flottait au-dessus du sol et l'autre était coupée à mi-corps. Chaque
rangée a sa propre ligne de sol ; seules la largeur et la hauteur de la
toile sont communes au personnage.

### On ancre un sprite sur les PIEDS, pas sur sa boîte
Cadrer au plus juste puis centrer à l'écran fait dériver le corps
latéralement dès qu'un bras se tend : sur un cycle de marche à deux
images, le personnage tremble. La toile canonique place le centre des
CHAUSSURES au milieu de l'image et la ligne de sol en bas ; le rendu
dessine alors bêtement en `x - largeur/2`, `y - hauteur`, et tout tombe
juste.

### Le fond se reconnaît à sa CONNEXITÉ, pas à sa couleur
Troisième version du détourage, et la bonne. La teinte seule gardait les
ombres portées ; ajouter « et clair » a rendu un manteau violet fantôme.
Les deux critères sont chromatiques et un vêtement peut toujours les
imiter. Le bon test est topologique : **le fond et ses ombres touchent le
bord de l'image, un vêtement violet est enclos dans le personnage**. On
étiquette les composantes de teinte magenta, on garde celles qui
atteignent un bord, et le reste est du personnage quelle que soit sa
couleur. C'est la méthode des toutes premières planches sur damier —
j'en étais parti, j'y reviens, et cette fois pour de bon.

### La teinte ne suffit pas : le fond est aussi CLAIR
Suite de la leçon précédente, et elle m'a coûté un personnage fantôme en
jeu. Le test « min(r-g, b-g) élevé » reconnaît le magenta — mais aussi
un **tissu violacé sombre** : le manteau patchwork d'un client passait
pour du fond à demi effacé, et il apparaissait translucide, à 20 %
d'opacité. Le fond, lui, est TOUJOURS clair sur ses deux canaux : on
exige `r > 140 et b > 140` avant de rendre transparent. Mesure de
contrôle après découpe : l'opacité moyenne du corps doit être ≥ 0,99 —
c'est ce chiffre qui a désigné le coupable parmi cent quarante sprites.

### Le magenta se reconnaît à sa TEINTE, pas à sa clarté
Une planche est arrivée avec deux petites ombres portées sous les pieds.
Le test de fond « rouge et bleu hauts, vert bas » ne les voyait pas :
une ombre est du magenta SOMBRE. Elles devenaient donc des taches
semi-opaques accrochées aux chaussures. Le bon test est chromatique —
`min(r-g, b-g)` élevé et `r ≈ b` — et il reste juste quelle que soit la
luminosité. Une jupe rouge, un blouson bleu canard ou un manteau beige
n'y passent pas.

### Un sprite n'a pas de taille, il a une ÉCHELLE
**La leçon a dû être apprise deux fois : d'abord sur les barmans, puis
sur les six personnages en pied — Thibaut avait 62 px d'écart entre ses
poses (il grandissait en titubant, rétrécissait en buvant) et Mathilde
240. Un test lit maintenant la taille dans l'en-tête WebP et refuse
toute divergence, personnage par personnage.**

Le rendu dessinait chaque pose de barman à une hauteur d'écran fixe
(`H*0.30`). Or les poses venaient de cadrages différents : `idle`
faisait 260×183 (un buste serré, vieille planche) et les poses animées
~200×255. À hauteur constante, le personnage **grandissait au repos et
rétrécissait dès qu'il travaillait** — et pour Jojo, des poses EN PIED
normalisées à la même hauteur le réduisaient à un nain posé sur le
comptoir. Ce n'est pas un réglage à corriger, c'est une erreur de
méthode : une hauteur d'écran commune n'a de sens que si les sources
partagent la même hauteur ET le même trait de coupe. Toutes les poses
d'un barman sont donc découpées **dans la même bande de la même
rangée** de la même planche (bande y fixe, seul x varie), ce qui donne
193 px pour toutes et une coupe à la ceinture. Un test lit la hauteur
dans l'en-tête WebP et refuse toute divergence.

Corollaire pour les poses qui viennent d'ailleurs (`idle`, la pose
« eau ») : on les met à l'échelle de la séquence, et on ne peut **ancrer
sur le pixel le plus haut que si ce pixel est la tête**. La pose de Jojo
au shaker levé calait le shaker sur la ligne des têtes et enfonçait le
personnage sous le comptoir ; il a fallu prendre une pose bras baissés.
La mesure automatique de la largeur de tête, elle, s'est révélée
inutilisable — elle attrapait un bras levé et sortait des échelles de
0,43. Trancher à l'œil sur une planche de trois échelles côte à côte a
été plus rapide et plus juste.

### Aucun décor ne doit être cuit dans un sprite
Les bustes des planches sont dessinés appuyés sur un bout de comptoir en
bois. Ce bois ne s'aligne jamais avec le comptoir du jeu : on voyait
« un bout de planche » flotter sous Francky. Tout sprite se découpe
AU-DESSUS du décor de la planche — pour ces séquences, la bande de
comptoir se repère au profil des lignes (la largeur occupée saute
d'un coup quand la planche relie les poses entre elles).

### Le monde répété change le sens des coordonnées
Le décor du bar est le même fond mis bout à bout `BAR_COPIES` fois. Une
position monde de 0,34 ne veut donc pas dire « un tiers du bar » mais
« tout au début de la deuxième copie », c'est-à-dire au BORD du fond :
devant les toilettes et le frigo, pas devant les étagères. En
rapprochant les barmans pour qu'on les voie, je les ai postés
exactement là. Retour à 0,24 et 0,76, qui tombent au centre d'une copie,
et un test qui vérifie la position MODULO la copie —
`(x * BAR_COPIES) % 1` doit rester entre 0,22 et 0,80. La visibilité
hors champ se règle avec les chevrons de bord, pas en déplaçant les
gens.

### Un monde de trois écrans cache ce qu'il faut lire
Les barmans étaient postés à 0,24 et 0,76 d'un monde large de trois
écrans : sur la photo de contrôle, **aucun des deux n'était visible**.
Tout le niveau repose sur la lecture de leurs gestes, et ces gestes se
jouaient hors champ. Deux corrections : les postes rapprochés à 0,34 et
0,66, et des chevrons de bord qui donnent la couleur et l'avancement de
ce qui se prépare ailleurs. Un test refuse un écartement supérieur à
0,34. La leçon générale : une mécanique d'anticipation se vérifie sur
une image rendue, pas sur le schéma.

### Un garde-fou par position finit par manger du bon
La boîte « VUE ORIGINALE » des planches s'exclut par sa position
(x > 1230). Sur la planche de Jojo, la sixième pose de la rangée 1
commence à x = 1290 : parfaitement légitime, et écartée sans bruit. Le
compte a sauvé la mise (« exportés 18/19 »). Un filtre par position ne
vaut que pour la rangée où la boîte se trouve — et tout export se
termine par un comptage attendu/obtenu.

### Un fragment du voisin suit dans la découpe
Deux sprites emportaient un bout de comptoir de la pose d'à côté. On ne
garde alors que la **composante connexe principale**. À réserver aux
sprites concernés : ailleurs, les petites composantes sont les gouttes
et les éclaboussures, et il faut les garder.

### demarrer() sans argument garde le niveau courant
Un test ajouté juste avant la section « Rythme d'Hortense » laissait le
jeu au niveau 2 ; `Jeu.demarrer()` sans argument conserve `this.niveau`,
donc le rythme d'Hortense se mesurait dans un appartement — zéro
apparition. Tout test qui change de niveau le rend avant de sortir
(`Jeu.retourTitre()`).

### Une couleur ne s'écrit qu'à un seul endroit
Les pastilles de la légende étaient colorées dans le CSS (`.pt` vert,
`.pp` bleu) et les héros portaient leur couleur dans `Heros[]`. Deux
sources pour la même information : elles ont fini par se contredire, et
c'est le vert de PF autour d'un Thibaut vert qui l'a révélé. Les
pastilles lisent maintenant `Heros[].couleur`, et un test compare le
style calculé à la donnée. Au passage, la convention est remise droite :
**Thibaut est vert** (polo, puis blouson), **PF est bleu** (son sweat à
capuche marine).

### Une contradiction n'est pas forcément un bug
La planche de Martin montrait un jeune homme mince au sac à dos, là où
sa fiche décrivait un boxeur agent de sécurité. J'ai failli « réparer »
l'un ou l'autre : c'était le personnage. Le décalage entre ce qu'un
personnage dit et ce qu'il a l'air EST le comique du jeu. Signaler
l'écart, oui ; trancher tout seul, non — et quand il est confirmé, il
s'écrit dans la fiche et dans les répliques pour qu'il existe en jeu.

### Renommer un personnage : le nom oui, la parenté non
« La sœur d'Hortense » devient Gabi : l'identifiant, le sprite et le nom
affiché changent, mais « ma sœur », « belle-sœur de Pierre-François »
sont des LIENS et restent. Le renommage se fait par motifs distincts
(`"soeur"`, `soeur:`, `.soeur`, `pers_soeur`, le nom affiché), chacun
compté, et on relit ce qui reste pour vérifier que ce n'est que de la
parenté.

### Les planches annotées piègent le découpage
Les nouvelles planches portent des cadres blancs et des légendes
(« MODE BARMAN », « 1. CHOISIT LES INGRÉDIENTS », « VUE ORIGINALE »).
Les composantes de texte se filtrent à la hauteur (< 55 px) et les
traits de cadre à la largeur (> 620 px) ; la boîte « VUE ORIGINALE »,
elle, ne se distingue que par sa POSITION (x > 1230). Les rangées sont
données à la main : la détection automatique fusionnait les deux
premières, les chevelures dépassant sur la rangée du dessous.

### La jauge se lit AVANT la fuite, pas après
En ajoutant la fuite d'ambiance, je l'ai mise avant le contrôle de
« jauge pleine ». Résultat : une jauge amenée à 100 par une bonne
décision redescendait à 99,99 à l'image suivante, le seuil n'était
jamais franchi, **la dernière tournée ne partait jamais et la partie
devenait infinie**. Ce sont les deux tests de la finale, écrits la
version d'avant, qui l'ont dit dans la minute. Quand on insère un
amortissement dans une boucle, on regarde ce qui LIT la valeur juste
après.

### Reconstruire une liste du code à la regex finit toujours par mentir
La suite vérifiait « disque ↔ images chargées » en recomposant
`IMAGES_NIVEAU3` et compagnie par expressions régulières sur le source.
Le jour où la liste est devenue `[...].concat(PREFIXES.flatMap(...))`,
le test est passé au vert **en comparant deux ensembles faux**. La
confrontation se fait maintenant sur `D.listeImages()`, dans le bac
d'exécution : la seule vérité, c'est ce que le jeu demande vraiment.

### Un fond magenta vaut mieux qu'un damier
Les premières planches arrivaient sur damier gris : le détourage
remontait les composantes grisâtres depuis les bords, au risque
d'emporter un verre d'eau ou une chemise claire. Sur `#FF00FF` la
découpe est exacte, et surtout on récupère une alpha GRADUÉE en
retirant la couleur du fond des pixels de bord
(`c = (c_vu - (1-a)·fond) / a`) au lieu de laisser un liseré rose. Pas
de `fill_holes` : le magenta pris entre un bras et un torse doit rester
transparent, et c'est ce qui arrive naturellement.

### Une liste écrite pour un seul niveau vieillit mal
`entrerTitre()` rangeait le bandeau et LE pupitre — celui du niveau 1,
le seul qui existait quand la fonction a été écrite. Deux niveaux plus
tard, revenir au menu après le bar laissait les grosses touches JETER et
BOIRE affichées par-dessus l'écran titre. La fonction parcourt maintenant
une liste d'éléments, un nouveau niveau y ajoute son pupitre, et un test
rejoue les trois niveaux pour vérifier qu'aucune commande ne survit au
retour au menu. Chercher ce motif partout : toute énumération d'éléments
« du jeu » écrite avant le niveau 2 est suspecte.

### Un écran titre doit dire de quel jeu il s'agit
L'ancien menu empilait un logo, trois lignes de liste et une légende de
touches par-dessus le trottoir du niveau 1. Lisible, et parfaitement
muet : rien n'y disait qu'on tenait un jeu de bar. Le nouveau pose le
**décor du bar en fond** (l'image la plus parlante du jeu), une enseigne
au néon en deux niveaux de lueur, et trois **tuiles** avec numéro,
vignette et couleur par niveau. Deux règles qui viennent du format
paysage de téléphone : les tailles se règlent en `vh` et pas en `vw`
(en largeur, le titre déborde dès que la barre du navigateur mange la
hauteur), et les tuiles se partagent la largeur (`flex:1 1 0`) sans
`flex-wrap` — un retour à la ligne pousse tout hors de l'écran. Le
harnais ne dessinant que le canevas, la structure du menu est verrouillée
par des tests qui lisent le HTML et le CSS.

### Un pupitre centré masque ce qu'on joue
Le pupitre du niveau 3 avait été copié de celui du niveau 2 —
`justify-content:center`. Au niveau 2 les sept touches bordent un
décor qu'on regarde de haut ; au niveau 3 le champion est **au centre
de l'écran**, et les quatre touches se sont posées sur lui. Deux
groupes, `space-between`, `pointer-events:none` sur le conteneur et
`auto` sur les groupes : le milieu redevient du décor cliquable. Un
style hérité d'un autre niveau se revérifie sur l'écran du niveau, pas
sur le papier.

### Une invite à agir ne s'éteint jamais — deuxième fois
Le bouton d'action du niveau 2 devient « ESQUIVER ! » quand une tarte
arrive. Trois lignes plus bas, la même fonction l'éteignait parce
qu'aucun meuble n'était à portée : le joueur voyait un bouton grisé au
moment exact où il fallait appuyer, et l'esquive de l'appartement est
restée injouable **une version entière** sans qu'aucun test ne bronche —
la mécanique, elle, fonctionnait parfaitement dans le bac. C'est la même
faute que sur le pupitre du niveau 3, à un mois d'écart. Règle : quand
l'interface CHANGE pour réclamer une action, cet état passe devant tous
les autres. Et un test doit lire l'état RÉEL du bouton dans le DOM, pas
seulement l'état du jeu — d'où `domBac` dans la suite.

### Éteint ne veut pas dire invisible
`opacity:.40; filter:grayscale(.5)` sur une pastille translucide, sur
un fond de bar en néons : les touches BOIRE et JETER avaient
littéralement disparu de la photo d'écran. Un bouton momentanément
inutile doit rester **repérable** — fond opaque, `opacity:.62` et
désaturation. Un test refuse toute opacité éteinte sous 0,5.

### Le filigrane de version squatte le coin haut gauche
`#version` est en absolu à 14 px du bord ; le bandeau du niveau 3
écrivait le score au même endroit — « 1030 » par-dessus « CALLAGHAN
v6 ». Le score et le combo sont descendus d'une ligne, chacun sur sa
plaque arrondie : au-dessus des bouteilles, un chiffre nu se perd.

### La double vision ne passe pas par ctx.filter
`ctx.filter = "blur(...)"` est coûteux et inégal selon Safari — même
famille d'interdit que shadowBlur. L'ivresse recopie le canevas sur
lui-même, décalé en sinus et translucide (`setTransform(1,0,0,1,0,0)`
puis `drawImage(ctx.canvas, dx, dy, largeur physique, hauteur
physique)` — en coordonnées PHYSIQUES, sinon le dpr double l'image).
Le bandeau et les messages se dessinent APRÈS : ils restent nets.

### Le raisonnement du niveau 2 (v5.0)

Quatre couches, toutes portées par les scénarios eux-mêmes :

- **`deduc`** — chaque affaire lit ses trois indices porteurs à sa
  façon : trouver l'indice déclenche un échange à deux voix qui relie
  l'objet à CETTE histoire. Le garnissage garde l'écho générique
  d'`ECHOS` — une fausse piste ne mène nulle part, c'est le but.
- **`hypothese`** — à deux indices, la première théorie, fausse exprès :
  Thibaut [1] propose l'absurde, Pierre-François [0] corrige. Un test
  refuse le sens inverse, le gag ne marche que dans celui-là. La piste
  sérieuse reste au quatrième indice.
- **Confrontations** — chaque indice de la banque porte `q`/`okR`/`koR` :
  Thibaut oppose le dossier aux gens, une fois par (personne, indice),
  les porteurs d'abord. L'innocent referme la piste, le témoin clé
  s'enfonce d'un demi-aveu. Le premier passage reste à l'anecdote, et
  le chat est exclu — il ne parle pas.
- **`nerfs`** — le témoin clé craque par paliers, à 3 puis 5 indices,
  quel que soit l'inspecteur : c'est le dossier qui met la pression,
  pas la question. Un palier consommé éteint celui du dessous.

Le dossier affiche l'état du raisonnement (`Enquete.theorie()`) :
hypothèse, puis piste, puis contradiction.

---

## 2. Réglages calibrés

Réglés par mesure ou par simulation. Les changer demande de relancer la
suite.

### Niveau 1

| Réglage | Valeur | Justification |
|---|---|---|
| Temps de réaction | 2,0 s → 0,55 s | décroissance géométrique : les paliers de 0,2 s se sentaient |
| Délai entre arrivées | 2,9 s → 0,78 s | |
| Demandes simultanées | 1, puis 2 à 13 saluts, 3 à 33 | |
| Points | 50 × combo × bonus de type | donne les ordres de grandeur de la planche |
| Écart entre deux places | 62 unités | |
| Recul de celui qui salue | 104 unités | répond à la main tendue des sprites, qui va chercher entre 36 et 45 |
| Hauteur d'un héros | 46 % de la hauteur d'écran | plafonnée par la largeur en dessous de 4:3 |
| Plancher de dézoom | 0,72 | en dessous, on ne lisait plus qui tendait la main |

### Niveau 2

| Réglage | Valeur | Justification |
|---|---|---|
| Durée | 300 s | |
| Indices à réunir | 6 sur 13 en banque | |
| Meubles | 16 | |
| Portée d'interaction | 0,026 largeur d'image | deux meubles plus proches que 1,5 × cette valeur se voleraient les touchers ; un test le vérifie |
| Vitesse de marche | 0,20 largeur/s | traverser l'appartement prend cinq secondes |
| Accusation ratée | −20 s | |
| Tarte reçue | −10 s | jamais une défaite : l'événement doit être drôle |
| Hortense | entre 35 % et 65 % du temps | |
| Fenêtre d'esquive | 450 ms | la même qu'au niveau 1 |

---

## 3. Pièges rencontrés

Chacun a coûté du temps, et chacun est désormais surveillé par la suite.

### Les images étaient sur le disque, jamais chargées
Le niveau 2 s'ouvrait sur un écran **noir uni**. Les vingt-six images
étaient bien dans `img/`, la suite le vérifiait, et le jeu n'en
demandait aucune : elles manquaient à `listeImages()`. Le test
« les fichiers existent » ne dit rien sur « on les charge ». Deux tests
confrontent désormais `img/` et la liste de chargement **dans les deux
sens** : rien sur le disque qui ne soit demandé, rien de demandé qui ne
soit sur le disque.

### Les deux héros ont été intervertis
La table de découpe a inversé les panneaux : le repère vert s'allumait
au-dessus de Pierre-François et le bouton « Thibaut » montrait un
portrait chauve. Rien dans le jeu ne s'en apercevait. `decoupe2.py`
mesure maintenant le buste des deux sprites produits et refuse de sortir
si Thibaut n'est pas en vert et Pierre-François en noir.

### Les prénoms écrits en dur dérivent
Ils étaient recopiés à cinq endroits — deux boutons, deux lignes de
légende, deux boutons de debug. Ils viennent tous du tableau `Heros`,
seule source du prénom, du sprite et du portrait. Échanger les deux
héros se fait en échangeant deux lignes.

### Le bandeau du niveau 1 s'affichait par-dessus l'appartement
`entrerJeu()` allumait `#hud` sans regarder le niveau : un compteur de
file à zéro flottait au-dessus de l'enquête, qui dessine le sien sur le
canevas.

### Des personnages à la mauvaise échelle ont l'air collés
Ils étaient à 0,46 de la hauteur du décor, soit un mètre trente dans une
pièce de deux mètres cinquante. Aucun réglage d'ombre ou de teinte ne
rattrape ça : c'est l'échelle qu'il faut mesurer sur le décor, pas
ajuster à l'œil. Pièce = 88 % de l'image, adulte = 70 % de la pièce,
donc 0,62. Le reste — deux ombres, dont une courte au contact des pieds,
et un voile chaud posé après les personnages — ne fait que finir le
travail.

### Deux raisons de suspendre, une seule suspension
`Boucle.pause` sert au blocage portrait ET à la pause demandée. Le
premier jet remettait `pause` à faux dès que l'écran redevenait
paysage, ce qui reprenait la partie derrière l'écran de pause. On teste
donc les deux causes avant de relancer.

### Monter la scène et lancer la partie sont deux choses
Pour que les deux inspecteurs entrent à l'image pendant l'introduction,
il faut qu'ils existent — mais surtout pas que le chrono tourne.
`Enquete.monter()` tire l'affaire, pose les meubles et place les deux
hors champ ; `Enquete.lancer()` démarre seulement le décompte. Le piège
qui a suivi : la fin de l'introduction rappelait `demarrer()`, qui
remonte tout — les deux repartaient hors champ et les indices étaient
redistribués. On ne remonte que si la scène n'existe pas encore.

### Une exception de dessin fige le jeu, sans un mot
Le niveau 2 restait bloqué sur « QUELQUES HEURES PLUS TARD... ». Cause :
pendant l'introduction, l'enquête n'est pas encore montée — pas
d'inspecteurs — et l'affichage des noms de suspects lisait la position
d'un inspecteur inexistant. L'exception partait dans `dessiner()`, donc
`requestAnimationFrame` n'était jamais rappelé et la boucle mourait.
L'écran restait sur sa dernière image, sans erreur visible.

Deux corrections, et la seconde compte plus que la première :
1. on ne dessine le niveau que si `Enquete.pretes()` ;
2. **la boucle attrape ses propres exceptions** et redemande une trame
   quoi qu'il arrive. Une image ratée doit coûter une image, pas la
   partie. Les trois premières sont écrites dans la console.

Leçon plus large : la suite de tests n'exerçait jamais le dessin. Elle
appelait `Intro.finir()` pour aller au gameplay et sautait précisément
le moment qui plantait. Le harnais d'aperçu rend maintenant une trame
pendant l'introduction.

### Un bouton grisé passe pour un bouton mort
La commande d'esquive du niveau 1 était à 55 % d'opacité tant qu'aucune
tarte n'était en l'air. Elle restait cliquable, mais personne ne la
pressait — et une pression à vide ne renvoyait aucun retour, ce qui
confirmait l'impression. Deux règles : une commande disponible s'affiche
pleinement, et toute pression répond quelque chose, même « il n'y a rien
à faire ».

### Masquer un bouton, c'est supprimer une mécanique
En ajoutant ACCUSER, j'ai caché CHANGER sous 360 px de haut « pour que
ça tienne ». C'est-à-dire précisément sur l'iPhone couché, le seul
appareil visé — et CHANGER commande la moitié du jeu, puisqu'un
inspecteur seul ne peut pas réunir tous les indices. Quand la place
manque, on raccourcit un libellé ou on passe en pastille ; on ne retire
pas la commande. Un test refuse désormais toute règle qui masque `#c2C`.

### Supprimer un système, c'est cinq endroits à la fois
Le bras peint tenait en cinq morceaux : `dessinerBras()`, son appel,
`releverTeintes()`, l'accesseur `get teinte()`, le repérage de la main du
héros dans `mainHeros()` — et une **sixième copie du calcul dupliquée dans
le harnais visuel**, parce que la fonction du jeu n'était pas exportée.
Tout part ensemble ou rien ne part : en laisser un morceau, c'est garder
le piège sans le bénéfice. Au passage, `ancreDe()` relevait aussi
l'ancrage horizontal sur le sprite ; le pipeline canonique le garantit,
donc la fonction retourne 0,5.

Et pour la deuxième fois de la session, une suppression par expression
régulière a retiré une déclaration en laissant son usage
(`const t = ...` enlevé, `return t.ancre` conservé) : `node --check`
passait, le jeu plantait à la première image, et c'est le harnais visuel
qui l'a dit. Après toute chirurgie mécanique, on lance l'aperçu.

### Une garantie qui s'écrase elle-même
Chaque affaire doit contenir au moins un indice que PF sait lire
(`expert`) et un que Thibaut comprend (`social`). Quand aucun indice
NEUTRE n'était disponible, le code de garantie écrasait la dernière
case du tirage — y compris celle que le passage précédent venait de
remplir. Avec treize indices ça ne se voyait jamais ; avec cinquante,
un tirage sur trois repartait avec cinq indices utiles au lieu de six.
Les cases acquises sont maintenant protégées, et on renonce plutôt que
d'écraser. Le symptôme n'apparaissait qu'une fois sur trois : **une
suite lancée une seule fois ne prouve rien sur un tirage aléatoire**.

### Un scénario ne peut nommer que des gens PRÉSENTS
Trois affaires écrites avec Solène, Rémy et Jojo pour coupables : elles
ne peuvent pas tourner tant que le casting de l'appartement est figé sur
quatre habitants. Le tirage de distribution n'est pas un raffinement à
ajouter après les scénarios, c'est ce qui les rend possibles.

### Un casting variable casse tout ce qui nommait quelqu'un
En rendant l'appartement tirable, six tests et une fonction de jeu se
sont cassés — tous parce qu'ils désignaient une personne par son nom :
`SUSPECTS.find(id === "charles")`, `PLACES_FIXES[s.id]`, « les quatre
sont toujours là », et `interroger(is)` avec un indice gardé d'une partie
à l'autre. Rien de subtil, mais il faut les chercher : dès qu'une donnée
devient aléatoire, **tout ce qui la nommait devient faux**. Les tests
prennent maintenant « un habitant humain quelconque » ou passent leur
tour quand la personne visée n'est pas de la distribution.

### `expert` et `social` sont des SERRURES, pas des étiquettes
Elles ne disent pas « cet objet est technique » ou « cet objet parle des
gens » : elles disent **qui peut ramasser l'indice**. Un indice `expert`
est invisible pour Thibaut, un indice `social` l'est pour PF. D'où la
règle absolue : **un indice porte au plus un trait**. En posant
`social:true` sur des indices déjà `expert:true`, j'en ai créé que
PERSONNE ne pouvait ramasser — d'où les affaires qui ne réunissaient
que cinq indices sur six, une fois sur trois. Onze indices neutres sont
devenus sociaux, sans jamais toucher à un expert, et la suite tient sur
huit passes.

### Marquer un indice `social` ne se fait pas à la légère
Vingt et un nouveaux indices passés en `social` d'un coup : la suite est
devenue intermittente sur DEUX tests distincts, dont la lecture d'un
indice par PF (`(pf && !ind.social) ? analyse : brut` — un indice social
lu par PF affiche la version brute). Le trait ne dit pas « cet objet
parle des gens », il dit « c'est Thibaut qui le lit le mieux ». Annulé
en attendant d'en comprendre toutes les conséquences.

### Lire la structure AVANT d'écrire cinquante entrées
Premier essai des nouveaux indices : trente-sept entrées écrites d'un
trait, puis trois échecs de suite. Trois identifiants existaient déjà
(serviette, ticket, billet), un champ obligatoire manquait — l'**écho de
l'autre inspecteur**, dans `ECHOS`, une paire de répliques par indice —
et la liste d'images se recoupait avec celle du niveau 3. Deux minutes
de lecture de la structure et des identifiants pris auraient évité de
tout réécrire. Règle : avant d'ajouter en masse dans une table, on lit
UNE entrée complète, on liste les clés obligatoires, et on vérifie les
identifiants déjà pris.

Corollaire rencontré dans la foulée : compléter une liste d'images en
comparant aux seuls noms `ind_*` laisse passer les sprites partagés
(`pizza_part` servait déjà d'indice et de décor). On compare à TOUS les
noms déjà présents.

### Une couleur écrite en dur se cache à plusieurs endroits
J'avais corrigé les pastilles de légende en v6.10 en écrivant « une
couleur ne s'écrit qu'à un seul endroit » — et j'en avais laissé une
deuxième : le fond des touches de salut, `#cmdT` et `#cmdP`, peint dans
le CSS. Résultat visible cinq versions plus tard : la touche de PF était
VERTE avec le visage de PF dessus. Quand on retire une donnée du CSS pour
la faire venir du code, on cherche TOUTES ses occurrences, pas celle qui
a motivé la correction. Un test refuse maintenant tout `background`
codé en dur sur ces deux touches.

### La ligne de sol n'est pas la réserve d'interface
`Camera.sol` valait `H - basUI`, où `basUI` est la place réservée aux
commandes (8 % du bas). Les gens de la file marchaient donc sur une ligne
invisible, au-dessus du trottoir du décor : ils avaient l'air de flotter.
La réserve sert au calcul de la hauteur utile, pas à poser les pieds —
le sol descend à `H - basUI * 0,45`. Les commandes du niveau 1 sont des
pastilles dans les coins, elles ne cachent pas le centre.

### Charger en vagues, et refuser de jouer sans les images
Les images pèsent 5,7 Mo, dont 3 Mo pour le seul niveau 1. Tout attendre
avant le premier écran, c'était plusieurs secondes de barre de
chargement sur un téléphone. Deux vagues : l'essentiel (commun + n1 +
les trois vignettes et le fond du titre) bloque, le reste suit en tâche
de fond. Le piège évident serait de lancer le niveau 2 avant que son
dossier soit arrivé — on afficherait des trous noirs. `lancerNiveau()`
vérifie `dossierPret()`, rouvre l'écran de chargement si besoin, et
garde un filet de trente secondes pour ne jamais bloquer le joueur. Un
test vérifie que les deux vagues couvrent EXACTEMENT toutes les images :
une image dans aucune vague ne se chargerait jamais.

### Un script d'édition qui abandonne laisse le travail à moitié fait
Le pire de la série, et il a survécu cinq versions. À la v6.12 j'ai
annoncé « taper dans le décor passe la bulle » : le script éditait trois
fichiers, il a **abandonné sur le deuxième** (motif ambigu, deux
occurrences) et le troisième — le pilotage — n'a jamais été touché. La
fonction existait, les tests l'appelaient, et **rien dans le jeu ne
l'appelait**. Deux règles en sortent :
1. Après un ABANDON, on relit ce qui a DÉJÀ été appliqué avant l'arrêt.
   L'abandon protège du demi-changement dans un fichier, pas entre
   plusieurs fichiers.
2. Un test qui appelle la logique directement ne prouve jamais qu'elle
   est reliée à un geste. Pour tout geste du joueur, un test doit
   vérifier le CÂBLAGE — chercher l'appel dans le gestionnaire — et pas
   seulement le comportement de la fonction.

### La ligne de sol est déclarée dans le DÉCOR, pas dans l'interface
Deux versions passées à déplacer `Camera.sol` alors que le réglage juste
était `ANCRE_FOND_Y` : la fraction de l'IMAGE de fond où se trouve le
trottoir. Le décor s'aligne sur la ligne de sol, pas l'inverse. Elle
valait 0,86 pour des décors dont le trottoir dégagé est à 0,88 — d'où la
file qui flottait. La bonne méthode : mesurer sur l'image (l'écart-type
par ligne montre où le trottoir est uniforme), et le décor livré avec le
niveau doit annoncer sa ligne de sol.

### Une chaîne de commandes masque un test rouge
J'ai poussé la v6.21 avec un test en échec. La boucle de vérification
affichait bien le rouge, mais elle se terminait avec un code de succès,
et le `&&` qui suivait a enchaîné sur le commit et le push. Le garde-fou
doit ARRÊTER la chaîne : la boucle sort en erreur dès qu'un ✗ apparaît,
et rien ne se pousse derrière. Voir un échec défiler dans la sortie ne
suffit pas — il faut qu'il bloque.

### Une fonctionnalité sans CSS n'existe pas
`#pauseBtn`, `#pause`, `.secondaire`, `.choix` : le bouton de pause et son
panneau étaient dans le HTML, câblés dans le code, avec `Pause.mettre()`,
`Pause.NOMS[3]`, le focus sur REPRENDRE — et **zéro règle de style**. Un
bouton nu dans le flux du document, un panneau en texte brut au bas de la
page. Aucun test ne pouvait le voir : ils vérifiaient le comportement, et
le comportement était juste. Chercher ce motif ailleurs : tout élément
ajouté au HTML sans être stylé dans la même passe est probablement
invisible.

### Le harnais visuel voit ce que la suite ne voit pas
`Enquete.poseIns(E2.inspecteurs.indexOf(ins))` : `E2` est un alias LOCAL
de `dessiner()`, pas une variable de module. Les 449 tests passaient —
ils n'appellent jamais le rendu — et le jeu plantait à la première image.
C'est `apercu.js` qui l'a dit. Toute modification du rendu passe par un
aperçu, sans exception.

### Deux poses côte à côte peuvent se toucher
Sur la planche des inspecteurs, le bras tendu de « accuse » entre dans la
case de « esquive » : aucun détecteur ne peut les séparer. On coupe à la
colonne la plus creuse, MESURÉE sur le profil d'occupation (22 px de
contenu contre 200 ailleurs), et on assume que le bout du doigt de l'un
entre chez l'autre. Le nettoyage par composante principale enlève ensuite
le morceau de chaussure emporté au passage.

### Le meilleur calage ne remplace pas un tour de parole
Trois versions passées à perfectionner l'empilement des bulles — remontée,
plafond, repli par rangées, obstacles — et l'écran restait confus. La
cause n'était pas géométrique : **plusieurs personnes parlaient en même
temps**, et le calage se recalculait à chaque image, donc les bulles
sautaient dès qu'une naissait ou mourait, parfois loin de la bouche. La
vraie réponse est un tour de parole : **une bulle à la fois, on tape pour
la suite, et rien ne s'invite tant que la file n'est pas vide**. Le
calage devient presque inutile, ce qui est le signe qu'on tenait le
problème par le mauvais bout. Deux compléments : une bulle déjà posée
garde sa position (mémorisée sur l'objet), et un chevron clignotant dit
que le doigt a la main.

Corollaire de méthode : quand une amélioration est reprise trois fois
sans que le défaut disparaisse, ce n'est pas le réglage qui est en cause,
c'est le modèle.

### Trois pièges dans une file à tour de parole
Tous rencontrés en une heure, tous invisibles sans diagnostic :
1. **Deux formes de cible cohabitaient.** L'ancienne file passait un
   INDEX d'inspecteur (0 ou 1), les prises de parole isolées un OBJET
   `{heros}`. Ne pas traiter la seconde faisait sauter les répliques **en
   silence** : la question de l'inspecteur disparaissait et seule la
   réponse sortait.
2. **Un délai d'ouverture hérité bloquait le doigt.** Le vieux `delai`
   de `dialogue()` empêchait le compteur anti-double-tape d'avancer, donc
   la deuxième tape ne faisait rien. Supprimé : avec le doigt, un délai
   n'a plus de sens.
3. **Un test qui tape avant de regarder jette ce qu'il attend.** Mon
   utilitaire de test tapait puis vérifiait : il détruisait la bulle
   qu'il cherchait. L'ordre est : laisser passer le temps, REGARDER,
   puis taper.

### Un calage ne vaut que s'il connaît TOUT ce qui est à l'écran
Le calage des bulles était juste, et l'écran restait un fouillis :
il ne connaissait que les bulles. Le badge (« SUSPECT ! », « SPLAT ! »)
est dessiné au centre à H*0,30, en plein milieu de la zone des bulles,
et les plaques de nom au-dessus des têtes — ni l'un ni les autres
n'entraient dans le calcul. Le calage part maintenant d'une liste
d'`obstacles()` qui décrit ces boîtes dans la même convention, et les
bulles les évitent comme elles s'évitent entre elles. Corollaire : deux
étiquettes pour la même bouche, c'est une de trop — une personne qui
parle n'affiche plus sa plaque de nom, sa bulle le fait.

### On ne savait pas qui parlait
Les bulles des inspecteurs n'avaient qu'un mince liseré de couleur ;
seuls les témoins et les visiteurs portaient un nom, parce que le
gabarit du bandeau de nom était conditionné à `st.temoin || st.visiteur`.
La condition est devenue « qui a un nom l'affiche ». Une information
d'attribution ne se code pas en couleur seule : sur un téléphone, deux
liserés de 3 px ne se distinguent pas.

### Un écran plein doit être SEUL
Le dossier posait un voile sur toute la surface — mais les bulles,
dessinées avant, apparaissaient en fantômes dessous, et le bandeau de
message, dessiné après, recouvrait son titre. Quand un panneau prend
tout l'écran, il faut décider ce qui passe devant : ici l'esquive de
tarte, et rien d'autre.

### Ce que le canevas écrit sous la barre de commandes n'existe pas
La barre du niveau 2 est en HTML, par-dessus le canevas : elle mange les
19 % du bas. Le dossier y écrivait ses deux dernières lignes — « il
manque encore… » et « touchez pour refermer » — parfaitement invisibles
sur téléphone, et parfaitement visibles dans le harnais, qui ne dessine
pas le DOM. Tout panneau plein écran se compose dans la hauteur UTILE
(`ENQ_BANDE_CMD`).

### Une regex sur du code attrape ce qu'elle matche, pas ce qu'on veut
En convertissant les ordonnées du dossier en hauteur utile, mon
remplacement `H * 0.xx` a raté `H * (0.745 + i * 0.048)` — entre
parenthèses. Résultat : les lignes de théorie sont passées SOUS le
message final et l'ont chevauché. Même famille que la reconstruction de
listes par regex. Après toute transformation mécanique du code, on
compte ce qui reste ET on regarde l'image.

### Empiler des bulles finit toujours par les cacher
Le premier calage les remontait d'un étage par collision. Sur un écran
de 318 px, la deuxième passait sous le chrono. Le calage résout
maintenant les recouvrements en hauteur **jusqu'à un plafond**, puis se
replie latéralement. Et la mesure d'une bulle est une fonction séparée
du dessin : deux calculs parallèles auraient fini par divorcer.

### Le drapeau qui annulait le repli
Dans la boucle de remontée, atteindre le plafond faisait `break` en
laissant `libre` à vrai : le repli latéral, écrit et relu plusieurs
fois, **ne s'exécutait jamais** — les bulles restaient l'une sur
l'autre et le bug a survécu à deux corrections. C'est le harnais
d'aperçu qui l'a montré, pas la relecture. Le plafond lève désormais
son propre drapeau (`plafonne`), et c'est lui qui déclenche le repli.

### Une rangée ne suffit pas, un côté non plus
Deux leçons du même repli. Pousser une bulle vers un côté puis la
rabattre dans l'écran la reposait sur sa voisine : on cherche un TROU
en balayant la rangée de gauche à droite, on ne pousse plus à
l'aveugle. Et une bulle centrée remplit sa rangée à elle seule — large
de 42 % au plus, il en tient deux par rangée, mais pas une troisième :
le balayage descend de rangée en rangée jusqu'à trouver une place.
Cinq rangées pleines, cas jamais vu, et la plus récente passe devant.

### Une file de dialogue FIFO retient les réponses
`majDialogue` tirait les répliques dans l'ordre d'insertion. Une
réponse de témoin insérée à 1,1 s restait donc coincée **derrière**
une déduction programmée à 4 s : la question restait sans réponse
pendant quatre secondes, et le test ne rougissait qu'un tirage sur
huit — quand la fouille précédente avait laissé traîner sa salve. On
tire par échéance, pas par ordre d'arrivée.

### Une cadence fixe ne lit pas
Les répliques partaient toutes les 1,5 s et vivaient 2,2 s, quelle que
soit leur longueur : les longues disparaissaient avant la fin de la
lecture. `dureeLecture()` étire la durée ET l'espacement dans une même
salve — entre salves, chacune garde son départ, une réponse de témoin
n'attend pas un vieux bavardage, les bulles s'empilent pour ça.

### Une propriété qui écrase une méthode
`Tournee` avait un compteur `pas:0` (les foulées) ET une méthode
`pas(dt)`. Dans le littéral, la méthode gagnait ; mais `lancer()`
faisait `this.pas = 0` et **remplaçait la méthode par un nombre** au
premier lancement — `Tournee.pas is not a function`, au premier test.
Le compteur s'appelle `foulee`. Dans un objet-module dont la boucle
s'appelle `pas`, aucun état ne doit s'appeler `pas`.

### La planche de sprites reglisse un faux PF
Deuxième fois : la rangée « PF » de la planche du bar contenait un
Thibaut en polo vert (cheveux bruns, sac à dos). Écarté à la découpe,
et un test verrouille `BAR_CHAMPIONS` : PF = heros 0, THIBAUT =
heros 1. Toute nouvelle planche se relit sprite par sprite AVANT de
nommer — la planche contact numérotée sert à ça.

### Un test statistique au seuil trop proche de la moyenne
« On préfère envoyer celui qui a quelque chose à dire » : taux réel
62 %, seuil 55 %, 200 tirages — soit 2,2 σ, un échec toutes les
soixante-dix passes, toujours au mauvais moment. Porté à 600 tirages :
même seuil, 3,7 σ. Mesurer l'écart-type avant de fixer un seuil.

### Du texte écrit pour un cas particulier, tiré au sort ensuite
Les répliques de découverte nommaient un meuble — « Dans un sac » —
alors que le scénario tirait sa cachette parmi deux ou trois. Huit
affaires sur dix-sept pouvaient annoncer le mauvais endroit. Chaque zone
porte maintenant sa tournure locative (`dedans`), et les textes
l'appellent par un marqueur. Règle générale : dès qu'une valeur est
tirée au sort, tout texte qui la mentionne doit passer par le marqueur,
jamais par la copie.

### Une branche de contenu que rien n'atteignait
Trois affaires n'ont pas de coupable. La contradiction se déclenchait sur
`bonneReponse()`, qui vaut alors « personne » — aucun suspect ne porte
cet identifiant, donc la phrase existait dans le fichier et n'est jamais
sortie à l'écran. Elle vise désormais un `temoinCle`. À retenir : une
valeur sentinelle (« personne ») qui traverse une comparaison
d'identifiants ne lève aucune erreur, elle rend juste du contenu
invisible. Seul un audit qui déroule les dix-sept cas l'a montré.

### Un détail écrit en dur transforme dix-sept affaires en une seule
« 19 h 42 » revenait à chaque partie, dans le ticket comme dans la
contradiction. Les détails sont désormais tirés une fois par affaire et
insérés par marqueurs `{heure}`, `{livreur}`, `{froid}`… Un seul point
d'insertion, donc un texte oublié se voit immédiatement : il reste des
accolades à l'écran. Un test le vérifie sur deux cents tirages.

### Un indice qu'on ne peut pas refermer n'est pas une fausse piste
Le garnissage puisait dans toute la banque : des traces de pattes
pouvaient sortir dans une affaire sans chat. Chaque indice signifiant
porte maintenant une étiquette, chaque affaire aussi, et ils doivent se
répondre. Attention au piège qui a suivi : filtrer le garnissage a privé
sept affaires de tout indice réservé à Thibaut, donc jouables avec un
seul inspecteur. Un test refuse toute affaire dont les étiquettes
n'admettent pas au moins un indice pour chacun des deux.

### Deux listes parallèles finissent par se désynchroniser
Les questions des inspecteurs et les réponses des témoins étaient deux
tableaux distincts, chacun avec son curseur. On demandait l'heure, on
s'entendait répondre qu'il y avait deux pizzas. Un *sujet* tient
désormais la question ET ses trois réponses possibles. C'est la même
leçon que la mesure des bulles séparée de leur dessin : ce qui doit
rester d'accord doit vivre au même endroit.

### Une bulle par bouche
Les réponses des témoins sortaient de la bulle de l'inspecteur qui
posait la question. À trois personnes dans le champ, on ne savait plus
qui parlait. Chaque bouche a maintenant sa bulle et son style :
blanc + liseré de couleur pour les inspecteurs, papier crème signé du
nom pour les habitants.

### Un bouton contextuel qui fait deux choses n'en fait aucune
`INSPECTER` cherchait un meuble, puis à défaut quelqu'un à interroger.
Charles étant assis à la table, l'appui ne faisait jamais ce qu'on
attendait. Deux commandes distinctes, chacune éteinte quand elle n'a
rien à faire. Une action doit être prévisible avant l'appui, pas après.

### Poser un personnage assis
Chaque habitant a une ligne d'appui relevée sur le décor — assise du
canapé, plateau de la table, sol du couloir — et non la ligne de sol
commune. Un buste calé sur le sol se retrouve debout devant sa table.

### Deux bulles au même endroit
Deux répliques déclenchées en même temps s'écrivaient l'une sur l'autre.
Une bulle par personne — la nouvelle chasse l'ancienne — et les bulles
de deux inspecteurs proches s'empilent au lieu de se superposer. Même
chose pour les plaques de nom, qui passaient derrière les personnages :
elles se dessinent après.

### Aucun chemin tactile vers la fin de partie
L'accusation n'était liée qu'à la touche `A`, et son mode d'emploi
n'apparaissait qu'à l'intérieur du dossier. Sur téléphone, on pouvait
réunir les six indices sans **aucun** moyen de conclure. La règle qui
s'en dégage : toute action qui termine une partie doit avoir un bouton
visible en permanence, éteint tant qu'elle est indisponible, et qui dit
ce qui manque. Une commande au clavier n'est jamais un chemin, c'est un
raccourci.

### `setTimeout` pour une échéance de jeu
La conclusion de l'enquête était programmée par `setTimeout`. Une
échéance en temps absolu continue de courir pendant une pause — c'est le
même piège que les horodatages de DUO. Tout ce qui compte le temps du
jeu passe par `pas(dt)`.

### La fenêtre d'esquive s'ouvrait après le choc
La tarte vise **au-delà** du héros pour poursuivre sa route s'il se
baisse. Le décompte était calculé sur la course entière, donc le repère
s'allumait une fois la meringue reçue. On repère l'instant du
croisement, pas la fin de la course.

### Deux tartes en l'air se bloquaient l'une l'autre
L'esquive visait la première tarte de la liste, répondait « trop tôt »,
et le verrou anti-martèlement empêchait d'éviter l'autre. Elle vise
maintenant la plus **pressante**.

### Le bandeau de commandes mangeait la scène
Un bandeau pleine largeur coupait les héros aux genoux. Les commandes
sont trois pastilles dans les coins, bornées à 26 % de la largeur — au
delà, celle de gauche mord sur le héros de gauche.

### Le logo gardait un liseré
Le détourage général remonte le clair depuis les bords ; l'enseigne
étant une plaque **sombre**, il lui laissait un cadre gris. Elle est
découpée à l'envers : on part du noir, on bouche les trous — le lettrage
blanc est enfermé dedans — et on garde la plus grande pièce.

### Le fond blanc enfermé entre les jambes
La remontée depuis les bords ne peut pas atteindre l'entrejambe, ceinturé
par les deux jambes. On le reconnaît à sa position — bas du sprite — et à
sa clarté ; c'est le critère de hauteur qui le distingue d'un t-shirt
blanc, tout aussi lumineux mais au milieu du corps.

### Les objets se frôlent sur la planche 2
Un pont d'un pixel ramenait un bout du voisin **entre les jambes** de
Pierre-François, en bleu et rouge vifs. On érode de deux pixels avant
d'isoler la pièce principale, ce qui coupe ces ponts, puis on redilate.

### Le liseré clair autour des sprites
Les bords sont un mélange du trait et du blanc de la planche. Les étaler
revenait à peindre le liseré qu'on veut supprimer : la couleur se
prélève **un pixel à l'intérieur**.

### `${PIPESTATUS[0]}` et le tube
`node tests/x.js | tail -1` renvoie le code de `tail`. Un `&&` qui suit
ne verra jamais l'échec — la publication est partie une fois sur une
suite qu'on n'avait pas lue. Rediriger vers un fichier, puis afficher.

---

## 4. Le harnais d'aperçu

`tests/apercu.js` exécute le script d'`index.html` **hors navigateur**,
sur un vrai canevas (node-canvas), et écrit dix images : titre, salut
vers chacun des deux héros, poignée le soir, file très longue la nuit,
iPhone couché, iPhone debout, malaise, et deux vues du niveau 2.

```
npm i canvas
node tests/apercu.js /tmp/apngs /tmp/apercu
```

Le détour par des PNG est nécessaire : node-canvas ne lit pas le WebP.

Ce harnais a trouvé ce qu'aucun test logique ne pouvait voir : un écran
noir, un bras en saucisse, une épaule au niveau du visage, des
personnages trop grands, des bandes blanches aux bords du décor, des
sprites éclairés en plein jour au milieu d'une rue de nuit, et une tache
bleue entre les jambes d'un inspecteur.

**Une capture vaut mieux qu'une supposition.** Mais il ne mesure pas la
fluidité : rien ici ne dit si le jeu tient 60 images par seconde sur un
téléphone.

---

## 5. Ce qui n'est pas fait

- Le tableau d'enquête et la reconstitution chronologique : l'asset est
  découpé, la mécanique n'existe pas. L'accusation se fait sur une liste
  de suspects, sans avoir à désigner les indices qui la soutiennent.
- Risoto est interrogeable mais ne se déplace pas.
- Aucune mesure de performance sur appareil réel.
- L'équilibrage du niveau 2 — cinq minutes, six indices sur seize
  meubles — est un pari, pas une mesure.
