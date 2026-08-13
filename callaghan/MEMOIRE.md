# MEMOIRE.md — ce que ce dossier a appris

### RÈGLE EN DUR — aucune image pendant un changement d'écran

Le jeu donne un NOM à l'écran courant (`Transition.nomActuel`). Dès que
ce nom change, un voile opaque tombe, et il ne se lève qu'après DEUX
images dessinées dans le nouvel état et la taille stabilisée.

Pourquoi une règle générale plutôt que des correctifs : le même
scintillement a été corrigé SIX fois séparément — chargement vers
affiche, affiche vers choix, choix vers jeu, entrée de niveau, rotation,
recalage — avant qu'on comprenne que c'était un seul problème. Chaque
correctif était juste et insuffisant, parce qu'il ne couvrait que son
cas.

Deux images et non une : la première sert à poser les tailles, la
seconde à dessiner dedans.

Conséquence pour la suite : **ajouter un écran ne demande rien d'autre
que de le distinguer dans `nomActuel`**. Et deux états qui se ressemblent
à l'œil ne doivent PAS produire deux noms, sinon on ajoute des fondus là
où rien ne change.

---

### RÈGLE EN DUR — regarder le rendu avant de pousser
Aucune modification visuelle ne part sans qu'on ait OUVERT une image du
résultat. Pas « les tests sont verts, donc ça va » : les tests ont
laissé passer, dans ce seul projet, un bouton coupé à la ceinture, une
couture rectangulaire en plein écran, un halo rose autour des
commandes, un personnage qui flotte au-dessus du trottoir, un texte à
côté de sa pastille, une flamme de bouche à l'autre bout de l'écran et
un équipier qui tirait sans jouer son animation.

Le harnais rend toutes les scènes en une commande. Le coût est d'une
minute ; le coût d'un aller-retour avec Thibaut est bien supérieur, et
il use la confiance dans ce que je livre.

Corollaire : quand une scène manque au harnais, on l'AJOUTE au lieu de
bricoler un script jetable. `apercu.js` doit couvrir tout ce qui se
dessine.

---

Mémoire technique des **Enquêtes de Callaghan**, le jeu de `callaghan/`.

**Les cinq documents du projet**, et ce qu'on y cherche :

| fichier | on y va pour |
|---|---|
| `callaghan/CLAUDE.md` | les commandes et le cycle de travail |
| `callaghan/MEMOIRE.md` | ce qui a mordu, et comment ne pas le refaire |
| `callaghan/LISEZMOI.md` | ce que le jeu fait, version par version |
| `callaghan/PERSONNAGES.md` | qui sont les gens, et où ils apparaissent |
| `callaghan/PROMPTS.md` | comment demander une planche d'images |

Plus `callaghan/son/LISEZMOI.md` pour les échantillons, `../CLAUDE.md` pour
les règles communes au dépôt, et `../MEMOIRE.md` pour DUO — dont les
pièges valent souvent ici aussi.

**Plan** — mode d'emploi et parcours de lecture, section 0 (les huit
familles d'erreurs et ce qui marche), 1 (architecture), 2 (réglages
calibrés), 3 (les cent trente-sept pièges rangés en onze chapitres
thématiques), 4 (le harnais d'aperçu), 5 (ce qui n'est pas fait).

---

## Comment lire ce document

Ce fichier n'est pas un journal. C'est un **document de relecture** : on
l'ouvre AVANT de coder, pas après avoir cassé quelque chose. Il a été
réorganisé pour ça, et sa structure répond à trois usages différents.

### Trois parcours

**Je reprends le projet après une pause** — lire la section 0 en entier
(dix minutes). Elle donne les huit familles d'erreurs et ce qui marche.
Puis les deux RÈGLES EN DUR ci-dessus. Rien d'autre.

**Je m'apprête à faire quelque chose de précis** — ouvrir le chapitre
correspondant dans la section 3 et lire son chapeau, trois lignes. Les
entrées détaillées se consultent quand un symptôme apparaît, pas avant.

| je fais... | je lis |
|---|---|
| un outil de contrôle, un test | **3.9 en entier** — c'est la famille la plus nombreuse après les mesures |
| des sprites, un décor, une échelle | 3.1 et 3.2 |
| du texte, un bouton, une bulle | 3.3 |
| un écran, une transition, une rotation | 3.4 |
| une mécanique, un délai, un état | 3.5 |
| des scénarios, des dialogues, un casting | 3.6 |
| du son | 3.7 |
| de l'équilibrage | 3.8 |
| un test, un script d'outillage | 3.9 |
| de la lumière, des effets, un premier plan | 3.10 |

**Je démarre un NOUVEAU jeu** — voir la section suivante. La plupart de
ces leçons ne dépendent pas de ce projet.

### Ce qu'on emporterait dans un autre jeu

Si tout le code disparaissait, voici ce qui mériterait d'être réécrit en
premier, dans l'ordre.

**Les deux règles en dur.** Regarder le rendu avant de pousser, et ne
montrer aucune image pendant un changement d'écran. Elles ont chacune
coûté plusieurs séances à découvrir et rien à appliquer.

**Le harnais d'aperçu.** Un script qui rend TOUTES les scènes du jeu en
une commande, sans navigateur. C'est lui qui rend la première règle
tenable : sans lui, « regarder le rendu » veut dire lancer le jeu et
reproduire la situation à la main, ce que personne ne fait.

**L'édition par remplacement compté.** Un script qui exige un nombre
exact d'occurrences et ABANDONNE sinon. Coût nul, et il a évité des
doubles éditions, des remplacements dans le mauvais tableau, et des
corrections appliquées à un texte déjà corrigé.

**Les tables qui récitent l'inachevé.** Une liste des choses à moitié
faites, vide mais présente, qu'un test énumère. Un personnage sans ses
poses ne peut pas être oublié dans cet état.

**Le repli systématique.** Chaque ressource externe — son, image, pose —
a un secours interne. Le jeu ne devient jamais muet ni vide, et la
plomberie se livre avant les fichiers, ce qui permet de la vérifier
séparément.

**La discipline du chiffre.** Ne jamais écrire « ça semble décalé » mais
« la bouche du canon va de 0,964 à 0,725 selon la pose ». Un chiffre se
vérifie, se compare, et survit à celui qui l'a mesuré. C'est ce qui
distingue une leçon utile d'une impression.

### Ce que ce document ne contient pas

Les décisions de conception du jeu — pourquoi tel ennemi pose telle
question, pourquoi la foule est au premier plan — sont dans
`LISEZMOI.md`, qui raconte le jeu version par version. Ici on ne trouve
que ce qui a mordu.

---

## 0. Retour d'expérience — ce qui revient

Cent cinquante-trois pièges sont consignés plus bas, un par défaut
rencontré. Vus séparément ils sont anecdotiques ; regroupés, ils
dessinent **huit familles** qui expliquent la quasi-totalité des
allers-retours de ce projet. Cette section existe pour qu'on lise les
familles avant de refaire l'erreur, plutôt que de retrouver la leçon
après coup.

### Les huit familles d'erreurs, par coût décroissant

**1. Deviner une grandeur au lieu de la mesurer.** La plus chère, et de
loin. Position de la bouche du canon, ligne du comptoir, hauteur de tête
d'un barman, place du pavé dans la main, luminance d'un décor. À chaque
fois la valeur était *plausible* — c'est ce qui la rend dangereuse. Un
comptoir à 0,555 au lieu de 0,538 et 0,610 laisse un personnage flotter
pendant trois séances sans qu'on soupçonne le décor.
*Réflexe* : toute constante prise sur une image se mesure, et se
**remesure** à chaque nouvelle planche.

**2. Vérifier l'intention au lieu de l'artefact livré.** Le Vorbis dépasse
la crête qu'on lui donne — de 1,16 à 1,72 fois selon le contenu. Les
tests verts laissent passer un bouton coupé. Le fichier écrit peut être
tronqué. *Réflexe* : mesurer ce qui sort, pas ce qu'on a demandé. Boucler
si nécessaire : encoder, décoder, mesurer, recommencer.

**3. Une constante unique pour deux situations différentes.** Le comptoir
n'est pas horizontal. La bouche du canon bouge à chaque pose. Les deux
bombardiers ne peuvent pas se poster à la même profondeur. *Réflexe* :
« est-ce que cette valeur sert à deux endroits qui diffèrent ? » Si oui,
deux valeurs — et une table plutôt qu'un `if`.

**4. Un front là où il fallait un état.** L'ouverture du choix du
champion, déclenchée à l'instant où le chrono passe à zéro : posé à zéro
autrement, l'événement n'a jamais lieu. *Réflexe* : écrire la condition
comme une propriété vraie en permanence (« pas d'affiche en cours et pas
encore lancé »), pas comme une transition.

**5. Corriger un seul des endroits qui pilotent une chose.** Le pupitre du
niveau 3 était allumé par deux fonctions ; corriger la première ne
changeait rien, la seconde passait après. *Réflexe* : `grep` sur le nom
de l'élément avant de corriger, pas sur la condition qu'on croit fautive.

**6. Compenser au lieu de bloquer.** Retarder le premier délai
d'apparition ne suspend pas la file : la boucle continue. Arrêter un
ennemi ne suffit pas, il faut **borner** sa position. *Réflexe* : un état
qui suspend se teste dans la condition de la boucle.

**7. L'OUTIL DE CONTRÔLE EST FAUX.** Famille découverte tard, et la plus
nombreuse après les mesures — dix-sept entrées. Un contrôleur qui suppose
un fond `#FF00FF` alors que la capture est à (216, 2, 213) et compte donc
le fond comme un défaut. Une heuristique qui prend un bras levé pour un
crâne et annonce 32 % d'écart sur une planche parfaitement à l'échelle.
Un contrôle qui ne regarde qu'une rangée sur deux. Un test écrit pour le
cas qu'on vient de corriger et aveugle au même défaut ailleurs. Un prompt
qui demande cinq poses là où le jeu en charge onze.
*Réflexe* : essayer chaque contrôle sur un cas dont on CONNAÎT la
réponse — un défaut fabriqué exprès, une planche qu'on a mesurée à la
main. **Un contrôle qui signale un défaut inexistant est pire qu'une
absence de contrôle : il apprend à ignorer ses alertes.** Et après avoir
corrigé un défaut, écrire le test pour la CLASSE, pas pour le cas.

**8. Interrompre un travail qui écrit.** Deux sprites corrompus, deux
fois, par un `timeout` sur un script d'écriture — la seconde fois le
lendemain d'avoir noté qu'il ne fallait pas l'interrompre. *Réflexe* :
la consigne ne suffit pas, il faut rendre la faute impossible. Écriture
dans un `.tmp` puis remplacement.

### Ce qui marche, et qu'il faut garder

**Le contrôle visuel avant push.** C'est la pratique qui a rapporté le
plus. Elle a attrapé un Francky en double, un géant sans escorte, une
bulle sortie de l'écran trois fois, un pupitre par-dessus une affiche,
un halo autour d'un duo. Aucun de ces défauts n'a jamais fait rougir un
test.

**L'abandon sur compte dans les remplacements.** Un script d'édition qui
exige un nombre exact d'occurrences et s'arrête sinon. Il a évité une
double édition, un remplacement dans le mauvais tableau, et plusieurs
corrections appliquées à un texte déjà corrigé. Le coût est nul, le
bénéfice est de ne jamais écrire à moitié.

**Le repli systématique.** Chaque son échantillonné garde sa synthèse.
Chaque pose manquante retombe sur une pose de base. Le jeu ne devient
jamais muet ni vide, et la plomberie se livre avant les fichiers — ce
qui permet de la vérifier séparément.

**Un seul système par famille d'effets.** Les quatre familles de
particules partagent un pas et un rendu : ajouter un effet coûte une
ligne de gabarit. Le réflexe inverse — une boucle par effet — aurait
donné quatre fois le même code et quatre occasions d'oublier la remise à
zéro.

**Les tests qui récitent l'inachevé.** `ENNEMIS_INCOMPLETS`,
`POSES_BASE_MANQUANTES` : une table vide mais présente, qu'un test
énumère. Un personnage à moitié fini ne peut pas être oublié à moitié
fini.

### Trois erreurs de méthode, pas de code

**Affirmer sans vérifier.** J'ai dit à Thibaut que l'intro du niveau 4
attendait le clic. Elle ne l'attendait pas. Vérifier aurait coûté trente
secondes ; l'affirmation a coûté une séance et de la confiance.

**Livrer un garde-fou sans l'éprouver.** Plusieurs fois cette séance,
j'ai écrit un contrôle et annoncé qu'il protégeait de quelque chose —
sans l'essayer sur un cas fautif. Trois se sont révélés faux quand une
vraie planche est arrivée : l'un comptait le fond comme un défaut, l'un
prenait un bras pour une tête, l'un ne voyait qu'une rangée sur deux.

C'est la pire des trois, parce qu'elle produit de la CONFIANCE FAUSSE :
un contrôle vert donne le droit de passer à la suite. Fabriquer le cas
fautif exprès coûte deux minutes — une planche volontairement rosie, des
poses dont on a mesuré à la main qu'elles sont à l'échelle.

**Pousser sans relancer après un rebase.** Un commit distant est arrivé
pendant mon travail, j'ai rebasé et poussé sans relancer les tests. Un
test était rouge. Le rebase change le code : il exige un nouveau
contrôle, exactement comme une édition.

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
| `k_foule.js` | la foule du premier plan du bar — grappes, répliques, balades |
| `j_ruelle.js` | `Ruelle`, `RuelleVue` — logique et rendu du niveau 4 |
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

### Un détourage se vérifie SUR FOND SOMBRE
Les huit boutons paraissaient impeccables sur ma planche de contrôle
claire. En jeu, chacun portait un **liseré rose** : l'anti-crénelage du
halo, dont la couleur reste celle du fond même après décontamination.
Sur du clair on ne le voit pas ; sur une ruelle au crépuscule, il saute
aux yeux. Deux règles : on compose le contrôle sur un fond SOMBRE quand
l'image ira sur du sombre, et on annule l'alpha des pixels dont la
couleur décontaminée ressemble encore au fond — un pixel qui reste de la
couleur du fond EST du fond, quelle que soit son opacité.

### Un fond se MESURE, il ne se devine pas
La planche des boutons avait un fond à **(228, 3, 216)**, pas
`#FF00FF` : le générateur l'avait légèrement assombri. En supposant le
magenta pur, le détourage laissait des carrés roses opaques. On lit
désormais la couleur du fond au coin de l'image et on s'en sert comme
référence. Deux corollaires appris sur la même planche :

- Le corps des boutons est un **verre violet foncé**, donc de teinte
  magenta : la règle de connexité échouait parce que le halo lumineux
  fait un pont continu entre le fond et l'intérieur du bouton. Sur une
  planche d'éléments lumineux, on trie par **distance à la couleur du
  fond**, pas par teinte.
- Un halo semi-transparent garde la couleur du fond mélangée à la
  sienne. Le rendre transparent ne suffit pas : il faut **inverser le
  mélange**, `lueur = (observé - (1-a) x fond) / a`, sinon la lueur reste
  rose sur un décor sombre.

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

## 3. Pièges rencontrés, par thème

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

### 3.1 — Mesurer plutôt que deviner — sprites, décors, échelles

La famille la plus chère du projet. À chaque fois la valeur devinée
était *plausible* — c'est ce qui la rend dangereuse : elle ne provoque
pas d'erreur, elle décale.

**Avant de coder** : toute constante prise sur une image se mesure, et se
REMESURE à chaque nouvelle planche.

#### Des personnages à la mauvaise échelle ont l'air collés
Ils étaient à 0,46 de la hauteur du décor, soit un mètre trente dans une
pièce de deux mètres cinquante. Aucun réglage d'ombre ou de teinte ne
rattrape ça : c'est l'échelle qu'il faut mesurer sur le décor, pas
ajuster à l'œil. Pièce = 88 % de l'image, adulte = 70 % de la pièce,
donc 0,62. Le reste — deux ombres, dont une courte au contact des pieds,
et un voile chaud posé après les personnages — ne fait que finir le
travail.

#### Un découpage ne peut pas se décaler, une recopie si
Pour faire passer la barricade devant les combattants, j'avais recopié
la tranche basse du décor en calculant SES coordonnées source et
destination. Deux arithmétiques à tenir d'accord — et une couture
rectangulaire en plein milieu de l'écran dès que l'une dérivait. La
bonne façon : redessiner l'image ENTIÈRE, au même endroit, sous un
`clip()`. Même image, mêmes coordonnées, aucun décalage possible.

Deux mesures dans la foulée : le bord haut des caisses est IRRÉGULIER,
donc couper au plus haut laissait une bande de rue entre les héros
coupés et le bois — la coupe descend dans les caisses, là où elles
couvrent partout. Et les planches dessinent les héros de PROFIL, arme à
l'horizontale, alors que les ennemis arrivent d'en haut : à plat, les
deux se visaient l'un l'autre par-dessus la barricade. Une inclinaison
de 0,20 radian vers le point de fuite suffit — c'est un mensonge de
perspective, mais c'est celui que l'œil attend.

#### Deux poses côte à côte peuvent se toucher
Sur la planche des inspecteurs, le bras tendu de « accuse » entre dans la
case de « esquive » : aucun détecteur ne peut les séparer. On coupe à la
colonne la plus creuse, MESURÉE sur le profil d'occupation (22 px de
contenu contre 200 ailleurs), et on assume que le bout du doigt de l'un
entre chez l'autre. Le nettoyage par composante principale enlève ensuite
le morceau de chaussure emporté au passage.

#### Poser un personnage assis
Chaque habitant a une ligne d'appui relevée sur le décor — assise du
canapé, plateau de la table, sol du couloir — et non la ligne de sol
commune. Un buste calé sur le sol se retrouve debout devant sa table.

#### Le fond blanc enfermé entre les jambes
La remontée depuis les bords ne peut pas atteindre l'entrejambe, ceinturé
par les deux jambes. On le reconnaît à sa position — bas du sprite — et à
sa clarté ; c'est le critère de hauteur qui le distingue d'un t-shirt
blanc, tout aussi lumineux mais au milieu du corps.

#### Les objets se frôlent sur la planche 2
Un pont d'un pixel ramenait un bout du voisin **entre les jambes** de
Pierre-François, en bleu et rouge vifs. On érode de deux pixels avant
d'isoler la pièce principale, ce qui coupe ces ponts, puis on redilate.

#### Le liseré clair autour des sprites
Les bords sont un mélange du trait et du blanc de la planche. Les étaler
revenait à peindre le liseré qu'on veut supprimer : la couleur se
prélève **un pixel à l'intérieur**.

#### Une ligne de décor qui « a l'air » horizontale ne l'est pas forcément

Le comptoir du bar était traité comme une constante : 0,555. Mesuré sur
le fond par le plus fort gradient vertical, son arête est à 0,538 sous
Francky et 0,610 sous Jojo. Sept centièmes de hauteur d'écran — assez
pour qu'un barman flotte visiblement au-dessus de son plateau, et
suffisamment peu pour qu'on cherche la cause ailleurs pendant trois
séances.

La règle : toute grandeur prise sur un décor se mesure LÀ OÙ ELLE SERT,
pas une fois au milieu. Si deux personnages sont à deux endroits, il faut
deux mesures.

#### Une position calée sur un sprite doit suivre la POSE, pas le personnage

La flamme de bouche était mesurée une fois par héros. Elle collait tant
qu'il visait, et se détachait dès qu'il tirait : le canon recule, la
flamme restait devant. Mesuré chez Thibaut, la bouche va de 0,964 de sa
largeur en plein tir à 0,725 au deuxième temps de recul — un quart de sa
largeur.

La règle générale, troisième formulation sur ce projet : **une position
d'interface calée sur un dessin est solidaire de CE dessin** — donc de la
pose, pas seulement du personnage. Quand un personnage a vingt-trois
poses, il faut vingt-trois mesures, et un test qui vérifie qu'aucune pose
jouée ne manque à la table. Sans ce test, ajouter une pose plus tard
ferait retomber la flamme sur celle du tir sans erreur visible.

#### Une cible se pose sur le rectangle DESSINÉ, pas sur la boîte de référence

`posCibleBras` raisonnait sur la boîte de l'ennemi — celle qui vient de
`run1`. Ça marchait tant que la pose de préparation avait le même canevas.
L'encensoir levé de l'Abbé donne à sa pose `arme2` un canevas de **509 px
contre 346** pour sa course : la cible se retrouvait 150 px sous
l'encensoir. Il a fallu extraire `rectPose()` — la même arithmétique que
le rendu, ancrage par les pieds compris — et poser la cible dessus.

Corollaire pour les tests : la suite ne charge aucune image, donc
`rectPose` y renvoie la boîte de référence. Le test qui vérifie ce calcul
doit remplir `Images.table` depuis l'en-tête WebP, comme le font déjà les
contrôles d'invariants d'image.

#### Une position d'interface calée sur un sprite se REMESURE

La cible du bras armé de Jubilar était à 0,23 / 0,09 du canevas, mesurée
sur sa planche de la v6.56. La nouvelle planche place le pavé à
0,14 / 0,05 : reporter l'ancienne valeur aurait remis la cible à côté
d'une main vide, exactement le défaut corrigé en v6.56. Ce genre de
constante est solidaire du dessin sur lequel elle a été prise, et doit
figurer dans la liste des choses à refaire quand la planche change.

#### Et le cadrage se prend sur le HAUT DU CRÂNE, pas sur la boîte

Corollaire du précédent, et il a coûté une livraison. Cadrer sur le haut
de la boîte englobante marche jusqu'à ce qu'un personnage brandisse
quelque chose : le verre levé de Jojo devient le sommet de la boîte, sa
tête descend d'autant, et la coupe du bas remonte dans le torse. Mesuré :
17 px de balancement du crâne sur 193, visible en jeu comme un
hochement de tête à chaque geste.

Le haut du crâne se trouve en cherchant la première ligne où la
silhouette atteint 70 % d'une largeur de tête : un objet brandi est trop
étroit pour la remplir. On réserve ensuite au-dessus la place du plus
grand objet de la planche — mesurée, pas choisie — et la ceinture tombe à
une distance fixe SOUS le crâne.

Le garde-fou qui compte : le découpage refuse d'écrire si une pose est
plus courte que la cible. C'était le symptôme même du défaut, et il ne
déclenchait aucune erreur.

#### Une échelle de personnage se prend sur la TÊTE

Normaliser des poses sur leur hauteur totale marche tant qu'elles ont le
même cadrage. Dès qu'une planche mélange le pied (314 px) et le buste
(200 px), la même hauteur de canevas fait rétrécir la tête de 40 % : le
barman change de taille dès qu'il se met au travail.

La tête se mesure par le PLUS LONG SEGMENT horizontal continu dans le
haut de la silhouette, médiane sur les premières lignes. Un bras levé à
côté du crâne forme un segment séparé : il ne gonfle pas la mesure, ce qui
rend le repère utilisable sur une planche où les gestes changent à chaque
pose. Le recadrage au buste s'exprime ensuite en TÊTES, pas en pixels —
c'est une ligne anatomique, elle se déclare et ne se mesure pas.

#### Une position sur un sprite se MESURE, elle ne se devine pas

La cible du bras armé, première version : `x = 0,80` de la largeur, au
jugé. Les deux planches lèvent le bras à GAUCHE — la cible flottait à
côté d'une main vide. Mesurée sur le sprite, elle tombe à 0,23 de la
largeur du canevas et 0,09 de sa hauteur. La valeur est déclarée par
personnage dans `ENNEMIS[…].jet.cible`, parce que Depardiahree et
Jubilar ne brandissent pas au même endroit.

La vérification qui compte n'est pas visuelle mais arithmétique : on
calcule le rectangle où le sprite est réellement dessiné, et on vérifie
que la cible tombe dedans, à la même position relative à deux
profondeurs éloignées. L'œil, sur un ennemi de 46 px de haut, ne
distingue pas 0,23 de 0,40.

#### Une échelle de projectile ne se prend pas sur la hauteur

Première version du vol de bouteille : taille demandée en fraction de la
HAUTEUR d'écran, appliquée à la hauteur de l'image. Or la bouteille fait
244 x 73 — demander 15 % de hauteur en donnait 50 % de largeur, et elle
remplissait l'écran. L'échelle porte donc sur la PLUS GRANDE dimension
de l'image, en fraction de la LARGEUR d'écran : 0,075 au départ, 0,34 à
l'arrivée.

Même correction sur la cloche : 0,30 de hauteur d'écran la faisait
sortir par le haut. 0,085 suffit à ce que la trajectoire ne soit pas
tendue. Et le départ est figé à la MAIN du lanceur au moment du lancer —
pas recalculé pendant le vol, puisque lui continue d'avancer ou tombe.

Les deux défauts étaient invisibles aux tests : le projectile partait,
volait et touchait la barricade avec les bonnes valeurs. Seule l'image
les a montrés.

#### Le magenta bave sur ce qui brille

Le fond `#FF00FF` du détourage se mélange à toute lueur douce, et le
résultat n'est plus magenta pur : le détourage le garde. Mesuré sur les
boutons : une bande rose de 15 à 30 px de large tout autour, de couleur
(134, 58, 116) — du magenta délavé. Aucune reconstitution fiable n'est
possible, on ne connaît pas la couleur qui était dessous.

Deux parades, à appliquer ensemble. Côté prompt : bord FRANC, aucune
lueur ne déborde du disque. Côté découpe : le masque d'un bouton est un
CERCLE ajusté, pas le contour détecté — tout ce qui bave dans le fond
part avec le fond. Reste une désaturation du magenta résiduel
(`min(r,b)` ne peut pas dépasser `g`), sans effet sur l'ambre puisque le
vert y domine déjà.

### 3.2 — La chaîne d'images — chargement, découpage, formats

Du fichier fourni au pixel affiché. Presque tous ces pièges sont
silencieux : le code s'exécute, rien ne casse, et l'image est fausse.

**Avant de coder** : un contrôle d'image ne peut pas vivre dans la suite
Node — node-canvas ne lit pas le WebP. Il vit en Python.

#### Les images étaient sur le disque, jamais chargées
Le niveau 2 s'ouvrait sur un écran **noir uni**. Les vingt-six images
étaient bien dans `img/`, la suite le vérifiait, et le jeu n'en
demandait aucune : elles manquaient à `listeImages()`. Le test
« les fichiers existent » ne dit rien sur « on les charge ». Deux tests
confrontent désormais `img/` et la liste de chargement **dans les deux
sens** : rien sur le disque qui ne soit demandé, rien de demandé qui ne
soit sur le disque.

#### Un effet dessiné DANS la planche ne survit pas au miroir
La pose de tir de PF contenait son éclair de bouche. Une fois le
personnage retourné pour qu'il vise vers le centre de la ruelle, la
flamme se retrouvait à l'autre bout de l'écran. Un effet qui doit rester
solidaire d'un point précis se PEINT, dans le repère du personnage —
inclinaison et miroir compris — jamais dans le sprite. Position mesurée
sur l'image plutôt que devinée : le point le plus à droite de la moitié
haute, c'est la bouche du canon (0,894 de la largeur pour le revolver,
0,945 pour le fusil).

#### Charger en vagues, et refuser de jouer sans les images
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

#### La planche de sprites reglisse un faux PF
Deuxième fois : la rangée « PF » de la planche du bar contenait un
Thibaut en polo vert (cheveux bruns, sac à dos). Écarté à la découpe,
et un test verrouille `BAR_CHAMPIONS` : PF = heros 0, THIBAUT =
heros 1. Toute nouvelle planche se relit sprite par sprite AVANT de
nommer — la planche contact numérotée sert à ça.

#### Le WebP est compressé avec perte SOUS les pixels transparents

Le contrôle des trous restait rouge à un ou deux pixels près,
indéfiniment : chaque réparation en créait de nouveaux. La cause n'est pas
l'algorithme, c'est le format. Un pixel classé « fond » avant
enregistrement ne l'est plus après relecture — la couleur derrière un
alpha nul est réencodée elle aussi. Tout critère qui repose sur la
couleur sous une zone transparente est donc INSTABLE d'un enregistrement
à l'autre.

Parade : un seuil d'aire. On ne traite que les taches d'une taille
visible en jeu (25 px) ; en dessous, c'est du bruit d'encodage. Le
contrôle est stable au second passage, ce qui est le vrai test.

#### Un trou enclos n'est pas toujours un défaut

Deux cas opposés, et la taille ne les distingue pas : la jupe de Mathilde
(4 000 px) était un défaut, la rangée de shots de Jojo (700 px) est une
transparence voulue entre les verres. Ce qui tranche est la COULEUR SOUS
LE TROU — teinte de corps pour un alpha effacé par erreur, noir ou
magenta pour du fond réellement enclos. Ma première version comptait
tout, et déclarait cassées des découpes justes.

#### Un fichier de zéro octet ne déclenchait RIEN

Une réparation d'images interrompue en plein vol a laissé un fichier vide.
Aucun test ne l'a vu : la suite Node ne lit que l'en-tête WebP de
quelques images, et le jeu se replie silencieusement sur `run1` quand une
pose manque — le repli conçu pour éviter un ennemi invisible masquait
aussi un fichier mort.

`reparer_sprites.py --verifier` ouvre maintenant TOUS les fichiers, refuse
un fichier vide, et rend un code non nul sur le premier illisible. Il a
trouvé le second cas dans la seconde qui a suivi — il y en avait deux, pas
un. Le contrôle est gratuit : il faut décoder les images de toute façon.

À faire avant chaque push touchant aux images, comme le reste :

    python3 callaghan/reparer_sprites.py callaghan/img --verifier

#### Une coupure de planche doit pouvoir être bornée en hauteur

Deux poses qui se touchent se séparent en déclarant la colonne de coupe.
Mais couper la colonne sur TOUTE la hauteur de la planche sectionne aussi
la pose de la rangée du dessus : sur Jubilar, la coupure des poses au sol
amputait le bras d'une pose de course, et le morceau détaché — 3 537 px,
au-dessus du seuil de fragment — était compté comme une pose de plus. Le
contrôle de compte a refusé d'écrire, ce qui a évité la livraison. Une
coupure se déclare donc avec sa plage de hauteur.

#### « Garder ou jeter » se tranche au CHIFFRE, pas au principe

Deux décisions opposées, prises à quelques jours d'écart, et toutes deux
justes :

- le WAV de 4,9 Mo qui a servi à découper cinq cris est SORTI du dépôt ;
  on ne le relit jamais, et le découpage est reproductible par script.
- les planches de sprites y sont ENTRÉES ; on les relit souvent — trois
  redécoupages déjà — et elles pèsent 147 Ko en WebP contre 1,9 Mo en
  PNG.

La règle n'est ni « tout garder » ni « rien garder » : **garder ce qu'on
relit, quand c'est petit.** Et les deux termes se mesurent — combien de
fois a-t-on eu besoin de ce fichier, et combien pèse-t-il une fois
converti.

Corollaire sur l'écrasement : une nouvelle planche du même personnage
n'est pas une correction de l'ancienne, c'est un autre dessin. Le t-shirt
de BruHell a changé entre deux planches ; écraser aurait effacé le seul
document expliquant à quoi ressemblaient les sprites alors en jeu.
L'archivage refuse donc d'écraser et range en `-v2`.

#### Un fichier source lourd n'a rien à faire dans un dépôt servi

4,9 Mo de WAV pour cinq fichiers de 8 Ko que le jeu charge. GitHub Pages
sert tout le dépôt. Le source sort du dépôt, et ce qui le remplace est la
REPRODUCTIBILITÉ : les instants et les transformations sont écrits dans
le script, donc le découpage se refait sans avoir gardé la matière.

#### `ffmpeg` déduit le format de l'extension

Écrire dans un fichier temporaire `.ogg.tmp` — précaution héritée des
sprites corrompus — casse la détection de format : il faut `-f ogg`
explicite. La précaution reste bonne, elle demande juste d'être dite.

#### Un script qui écrit des fichiers doit écrire ATOMIQUEMENT

J'ai corrompu deux sprites, à deux reprises, en interrompant
`reparer_sprites.py` avec un `timeout` alors qu'il écrivait — il met plus
de deux minutes sur les 530 images. La deuxième fois, c'était le lendemain
d'avoir écrit dans cette mémoire qu'il ne fallait pas l'interrompre : la
consigne ne suffisait pas, il fallait rendre la faute impossible.

Le script écrit désormais dans un `.tmp` puis remplace : une interruption
laisse l'original intact. Et il accepte un sous-dossier en argument, pour
n'avoir à traiter que ce qu'on vient de changer.

#### Un seuil de bruit se pose LOIN du bruit, pas à sa limite

`TACHE_MIN = 25` était calé pile sur le bruit de réencodage WebP, qui
produit des taches jusqu'à 35 px : chaque passe de réparation en corrigeait
une et en créait une autre, indéfiniment. Les vrais défauts, eux, faisaient
de 700 à 9 000 px. À 80, le contrôle est stable au second passage — et
c'est ce second passage qui est le vrai test, pas le premier.

#### Un détourage qui rate un motif clair troue le vêtement

Le détourage a pris les motifs clairs des vêtements pour du fond :
chemise à fleurs, imprimé de t-shirt, jupe à feuilles. Jusqu'à 9 000
pixels troués sur un sprite, visibles en jeu comme des morceaux
manquants du personnage.

**Mesurer avant de réparer a évité de tout redessiner** : les pixels
troués avaient gardé leur COULEUR — RGB moyen (164,159,156) dans les
trous contre (166,140,128) sur le corps, et 1 % de magenta seulement. Le
détourage n'avait effacé que l'alpha. Remettre l'alpha sur les trous
ENCLOS suffit donc, sans rien réinventer ; seuls les 8 % restés noirs
sont repeints depuis leur voisin opaque.

#### Un fragment de la pose voisine se voit comme un personnage en double

`bar_francky_verse` embarquait un Francky ENTIER en plus du bon, `shake`
et `dose` une bande verticale de leur voisine. En jeu : deux barmans côte
à côte et un bout de comptoir. On ne garde que la plus grosse composante
connexe — mais attention, ce nettoyage ne vaut QUE pour les personnages :
un impact de pierre est légitimement fait d'éclats séparés, et l'anneau
de rechargement est un anneau.

Après retrait, la figure doit être RECENTRÉE dans son canevas — sans
changer les dimensions. Le rendu déduit la largeur du rapport de l'image :
recadrer aurait changé la taille du personnage à l'écran.

#### Ce contrôle ne peut pas vivre dans la suite Node

node-canvas ne lit pas le WebP, et les tests n'y lisent que l'en-tête
pour les dimensions : aucun test JS ne peut inspecter un canal alpha.
Le contrôle vit donc en Python, et se lance avant tout push qui touche
aux images :

    python3 callaghan/reparer_sprites.py callaghan/img --verifier

Il rend un code non nul s'il reste un fragment ou un trou.

### 3.3 — Interface et lisibilité — texte, bulles, boutons

Tout ce qui se lit à bout de bras sur un téléphone. La règle qui
revient : un texte se RÉDUIT ou se REPLIE jusqu'à tenir, il ne se pose
jamais à une taille devinée.

**Avant de coder** : mesurer la largeur disponible, pas l'estimer.

#### Un bouton grisé passe pour un bouton mort
La commande d'esquive du niveau 1 était à 55 % d'opacité tant qu'aucune
tarte n'était en l'air. Elle restait cliquable, mais personne ne la
pressait — et une pression à vide ne renvoyait aucun retour, ce qui
confirmait l'impression. Deux règles : une commande disponible s'affiche
pleinement, et toute pression répond quelque chose, même « il n'y a rien
à faire ».

#### Masquer un bouton, c'est supprimer une mécanique
En ajoutant ACCUSER, j'ai caché CHANGER sous 360 px de haut « pour que
ça tienne ». C'est-à-dire précisément sur l'iPhone couché, le seul
appareil visé — et CHANGER commande la moitié du jeu, puisqu'un
inspecteur seul ne peut pas réunir tous les indices. Quand la place
manque, on raccourcit un libellé ou on passe en pastille ; on ne retire
pas la commande. Un test refuse désormais toute règle qui masque `#c2C`.

#### L'alignement du texte se règle JUSTE avant d'écrire
Une bulle du niveau 4 sortait avec son texte à côté de sa pastille : le
dessin précédent — un bouclier — avait laissé `ctx.textAlign` à sa
valeur, et la pastille se calait au centre pendant que le texte partait
à gauche. Le contexte de canevas est un état GLOBAL : on ne suppose
jamais ce qu'un dessin voisin y a laissé. `save()`, on pose l'alignement
et la ligne de base, on écrit, `restore()`.

#### La ligne de sol n'est pas la réserve d'interface
`Camera.sol` valait `H - basUI`, où `basUI` est la place réservée aux
commandes (8 % du bas). Les gens de la file marchaient donc sur une ligne
invisible, au-dessus du trottoir du décor : ils avaient l'air de flotter.
La réserve sert au calcul de la hauteur utile, pas à poser les pieds —
le sol descend à `H - basUI * 0,45`. Les commandes du niveau 1 sont des
pastilles dans les coins, elles ne cachent pas le centre.

#### La ligne de sol est déclarée dans le DÉCOR, pas dans l'interface
Deux versions passées à déplacer `Camera.sol` alors que le réglage juste
était `ANCRE_FOND_Y` : la fraction de l'IMAGE de fond où se trouve le
trottoir. Le décor s'aligne sur la ligne de sol, pas l'inverse. Elle
valait 0,86 pour des décors dont le trottoir dégagé est à 0,88 — d'où la
file qui flottait. La bonne méthode : mesurer sur l'image (l'écart-type
par ligne montre où le trottoir est uniforme), et le décor livré avec le
niveau doit annoncer sa ligne de sol.

#### Une fonctionnalité sans CSS n'existe pas
`#pauseBtn`, `#pause`, `.secondaire`, `.choix` : le bouton de pause et son
panneau étaient dans le HTML, câblés dans le code, avec `Pause.mettre()`,
`Pause.NOMS[3]`, le focus sur REPRENDRE — et **zéro règle de style**. Un
bouton nu dans le flux du document, un panneau en texte brut au bas de la
page. Aucun test ne pouvait le voir : ils vérifiaient le comportement, et
le comportement était juste. Chercher ce motif ailleurs : tout élément
ajouté au HTML sans être stylé dans la même passe est probablement
invisible.

#### On ne savait pas qui parlait
Les bulles des inspecteurs n'avaient qu'un mince liseré de couleur ;
seuls les témoins et les visiteurs portaient un nom, parce que le
gabarit du bandeau de nom était conditionné à `st.temoin || st.visiteur`.
La condition est devenue « qui a un nom l'affiche ». Une information
d'attribution ne se code pas en couleur seule : sur un téléphone, deux
liserés de 3 px ne se distinguent pas.

#### Un écran plein doit être SEUL
Le dossier posait un voile sur toute la surface — mais les bulles,
dessinées avant, apparaissaient en fantômes dessous, et le bandeau de
message, dessiné après, recouvrait son titre. Quand un panneau prend
tout l'écran, il faut décider ce qui passe devant : ici l'esquive de
tarte, et rien d'autre.

#### Ce que le canevas écrit sous la barre de commandes n'existe pas
La barre du niveau 2 est en HTML, par-dessus le canevas : elle mange les
19 % du bas. Le dossier y écrivait ses deux dernières lignes — « il
manque encore… » et « touchez pour refermer » — parfaitement invisibles
sur téléphone, et parfaitement visibles dans le harnais, qui ne dessine
pas le DOM. Tout panneau plein écran se compose dans la hauteur UTILE
(`ENQ_BANDE_CMD`).

#### Empiler des bulles finit toujours par les cacher
Le premier calage les remontait d'un étage par collision. Sur un écran
de 318 px, la deuxième passait sous le chrono. Le calage résout
maintenant les recouvrements en hauteur **jusqu'à un plafond**, puis se
replie latéralement. Et la mesure d'une bulle est une fonction séparée
du dessin : deux calculs parallèles auraient fini par divorcer.

#### Une bulle par bouche
Les réponses des témoins sortaient de la bulle de l'inspecteur qui
posait la question. À trois personnes dans le champ, on ne savait plus
qui parlait. Chaque bouche a maintenant sa bulle et son style :
blanc + liseré de couleur pour les inspecteurs, papier crème signé du
nom pour les habitants.

#### Un bouton contextuel qui fait deux choses n'en fait aucune
`INSPECTER` cherchait un meuble, puis à défaut quelqu'un à interroger.
Charles étant assis à la table, l'appui ne faisait jamais ce qu'on
attendait. Deux commandes distinctes, chacune éteinte quand elle n'a
rien à faire. Une action doit être prévisible avant l'appui, pas après.

#### Deux bulles au même endroit
Deux répliques déclenchées en même temps s'écrivaient l'une sur l'autre.
Une bulle par personne — la nouvelle chasse l'ancienne — et les bulles
de deux inspecteurs proches s'empilent au lieu de se superposer. Même
chose pour les plaques de nom, qui passaient derrière les personnages :
elles se dessinent après.

#### Le bandeau de commandes mangeait la scène
Un bandeau pleine largeur coupait les héros aux genoux. Les commandes
sont trois pastilles dans les coins, bornées à 26 % de la largeur — au
delà, celle de gauche mord sur le héros de gauche.

#### Le logo gardait un liseré
Le détourage général remonte le clair depuis les bords ; l'enseigne
étant une plaque **sombre**, il lui laissait un cadre gris. Elle est
découpée à l'envers : on part du noir, on bouche les trous — le lettrage
blanc est enfermé dedans — et on garde la plus grande pièce.

#### Un bouton posé au canevas entier n'a pas droit à l'à-peu-près

`poser(nom, cx, cy, r)` dessine l'image COMPLÈTE centrée sur la zone
tactile. Conséquence rarement anticipée : la position du dessin DANS son
canevas est sa position à l'écran, et son diamètre dans le canevas est
sa taille à l'écran. Une planche générée sans contrainte donne donc des
boutons décalés et de tailles différentes sans qu'une seule ligne de
code soit fautive. Mesuré sur la première planche : croix décalée de
12,5 % de sa largeur — hors de sa zone tactile — et disques allant de
300 à 443 px dans un canevas de 451, d'où un bouton de tir qui
rétrécissait de 27 % à l'appui.

D'où la règle : **canevas 320, disque 304, centré**, pour les huit.
`decouper_boutons.py` l'impose et refuse d'écrire s'il ne détecte pas
exactement huit boutons ; un test relit l'en-tête WebP et compare les
huit tailles.

#### Une bulle trop longue se REPLIE, elle ne rapetisse pas

Réduire la police jusqu'à ce que la phrase tienne sur une ligne donne un
texte minuscule étalé sur toute la largeur : lisible au sens strict,
illisible en pratique. Deux lignes gardent une taille normale. La coupure
se choisit sur l'espace le plus proche du MILIEU — au premier espace
venu, on obtient une ligne longue et un mot seul, qu'on lit deux fois.

La réduction de police reste, mais comme dernier recours : un seul mot
plus large que la bulle.

#### Un texte de carte se RÉDUIT jusqu'à tenir, il ne se devine pas

« L'ABBÉ FORCEUR » débordait des deux côtés de l'écran en portrait, et
son sous-titre encore plus. Poser une taille de police en fraction de
hauteur marche pour un mot court et casse au premier nom long.
`texteQuiTient()` part de la taille voulue et descend tant que la mesure
dépasse la largeur disponible. Quinze essais bornent le coût.

#### Une bulle se borne sur SA largeur, pas sur une marge fixe

Borner le centre de la bulle à 0,14 de la largeur laissait dépasser une
bulle de 0,44 de large : la phrase était coupée par le bord. C'est la
même faute qu'au niveau 4 avec la réplique de relève, et elle s'écrit
pareil — `borne(x, bw / 2 + 6, L - bw / 2 - 6)`.

#### Un élément d'interface posé sur un ennemi garde une taille d'écran

Au fond de la ruelle un ennemi occupe 5,5 % de la hauteur d'écran, donc
son avant-bras environ six pixels sur un iPhone. Toute zone de tir
calquée sur le sprite est donc injouable exactement là où elle sert le
plus. La cible du bras et le point d'exclamation d'alerte ont une taille
FIXE en fraction d'écran ; seule leur POSITION suit le sprite. C'est
aussi pourquoi la consigne de génération exige de voir du fond entre le
bras levé et le buste : sans cet écart, la cible se superpose au torse et
le joueur ne sait plus ce qu'il vise.

#### L'opacité des commandes ne se juge que sur le décor

Sur fond uni, toutes les valeurs se valent. Sur le décor, c'est le
bouton de TIR qui décide : il tombe sur le polo clair de
Pierre-François, et c'est là que la douille blanche se dissout la
première. `ALPHA=0.62 node tests/apercu.js` rejoue les scènes 23 à 26 à
une autre valeur sans toucher au jeu. Réglage retenu : 0,45 au repos, 1 dès
qu'on touche — l'opacité est un retour tactile, pas un réglage figé.

#### L'anneau de rechargement doit encercler, pas recouvrir

Il était posé à `1.06` fois le rayon du bouton : comme son bord
intérieur tombe à 0,6925 du canevas et le bouton à 0,95, l'anneau se
retrouvait SUR la douille. Le bon facteur se déduit : 0,95 / 0,6925 =
1,372, arrondi à `ANNEAU_AUTOUR = 1.38`. Le compte de munitions a suivi,
de 1,34 à 1,52, sinon l'anneau lui passait dessus.

### 3.4 — Écrans, transitions et orientation

Cette famille a été corrigée SIX fois séparément avant d'être
comprise comme un seul problème. Elle est aujourd'hui couverte par une
règle générale — le voile de transition — mais les pièges restent utiles
pour comprendre pourquoi elle existe.

**Avant de coder** : un nouvel écran doit être distingué dans
`Transition.nomActuel`, sinon il n'a pas de transition.

#### Le bandeau du niveau 1 s'affichait par-dessus l'appartement
`entrerJeu()` allumait `#hud` sans regarder le niveau : un compteur de
file à zéro flottait au-dessus de l'enquête, qui dessine le sien sur le
canevas.

#### L'orientation est une propriété du NIVEAU, pas du jeu
Le paysage obligatoire était une règle globale depuis le premier jour.
La ruelle du niveau 4 s'enfonce vers un point de fuite : sa profondeur a
besoin de HAUTEUR, et son interface empile les ennemis lointains, la
barricade et les deux héros. Imposer le paysage l'aurait tué ; imposer
le portrait aurait tué les trois autres. `ORIENTATION` déclare donc ce
que chaque niveau demande, `ecranOk(L, H, niv)` remplace `paysageOk`, et
le panneau de pivot dit dans quel sens tourner. L'écran titre reste en
paysage : c'est là qu'on choisit, et les tuiles se partagent la largeur.

À retenir pour la suite : une contrainte posée quand il n'existait qu'un
seul niveau mérite d'être requestionnée à chaque nouveau niveau. C'est
le même motif que la liste de `entrerTitre()` qui ne rangeait qu'un
pupitre.

#### Un écran de présentation se dessine EN PREMIER, pas en dernier

L'affiche du bar était peinte à la fin de `dessiner()`. Comme l'écran de
choix rend la main plus haut dans la même fonction, elle n'était jamais
atteinte au premier lancement — et l'était au rejeu, parce que l'état
diffère d'un cheveu entre les deux chemins. Un écran qui doit TOUT
recouvrir se place au début et rend la main lui-même.

#### Une même propriété pilotée à deux endroits : c'est le dernier qui gagne

Le pupitre du niveau 3 était allumé par deux fonctions différentes. J'en
ai corrigé une ; l'autre, appelée après, le rallumait sans rien savoir de
l'affiche. Le symptôme est resté identique, ce qui donne l'impression que
la correction n'a servi à rien.

Le réflexe : avant de corriger un affichage, chercher TOUS les endroits
qui le pilotent. `grep` sur le nom de l'élément, pas seulement sur la
condition qu'on croit fautive.

#### Un panneau caché doit dire vrai

L'écran de rotation n'était mis à jour que lorsqu'il devenait visible.
La ruelle se joue en portrait : elle ne bloque donc jamais l'écran, et le
panneau conservait le texte du dernier niveau qui l'avait bloqué. Il
suffisait de tourner le téléphone pendant la ruelle pour lire le texte de
la tournée.

La règle : un élément d'interface se met à jour quand SON CONTENU change,
pas quand il devient visible. Le coût est nul, et il évite une classe
entière de « il affiche n'importe quoi une fois sur deux ».

#### Une clé de stockage est un CONTRAT avec le passé

En rangeant le dépôt, le dossier `dtour/` est devenu `callaghan/`. Le
remplacement automatique aurait emporté `dtour_progres` et
`dtour_records` — deux clés écrites dans le navigateur des JOUEURS.
Les renommer aurait effacé leur progression et leurs records **sans
erreur ni message** : le jeu aurait simplement recommencé à zéro, et
personne n'aurait su pourquoi.

Ce qui a sauvé la mise : ne pas remplacer en aveugle, et relire ce qui
restait. `dtour_progres` figurait dans le fichier de doc, ce qui a attiré
l'œil sur son existence dans le code.

La règle : avant tout renommage global, isoler ce qui est un **nom
interne** (variable, dossier, fonction — libre) de ce qui est un
**identifiant durable** — clé de stockage, nom de fichier publié, adresse
web. Les seconds ne se renomment pas, ou alors avec une migration.

Corollaire : ces clés portent maintenant un commentaire qui dit de ne pas
y toucher. Un nom qui a l'air incohérent avec le reste attire les
corrections bien intentionnées.

#### Une adresse publiée ne se casse pas pour du rangement

Le jeu vivait à `/jeuduo/dtour/`. Cette adresse est sur des écrans
d'accueil et a été envoyée à des gens. Le dossier a été renommé, mais
`dtour/` reste avec une redirection de dix lignes.

Le coût est nul, le bénéfice est que personne ne tombe sur un 404 sans
avoir rien demandé. À ne supprimer que le jour où on est sûr que plus
personne ne l'utilise — c'est-à-dire probablement jamais.

#### Un nom qui apparaît à l'écran ne s'écrit qu'à un seul endroit

Les quatre noms de niveaux étaient dans les tuiles du menu — et nulle
part ailleurs. L'écran de chargement disait « CHARGEMENT », celui de
rotation parlait du niveau 1 quel que soit le niveau demandé. Chacun
avait été écrit à l'époque où il n'y avait qu'un niveau, et personne
n'était revenu.

#### Un voile se lève APRÈS que la nouvelle image est prête, pas avant

L'entrée dans un niveau retirait le voile de chargement puis démarrait le
niveau. Entre les deux, au moins une image était dessinée : l'écran
précédent, ou le nouveau à une taille pas encore ajustée. C'est le
scintillement qu'on voyait.

Le bon ordre : monter le niveau, ajuster le canevas, laisser DEUX images
se dessiner — la première pose les tailles, la seconde dessine dedans —
puis lever le voile.

Deux corollaires :
- poser le voile dans TOUS les cas, même quand rien n'est à charger. Une
  transition qui change de forme selon l'état du cache se remarque.
- lui donner un FILET. `requestAnimationFrame` ne se déclenche pas dans
  un onglet en arrière-plan ; sans délai de secours, le voile pourrait
  rester posé. C'est la même faute que la v6.85, une fois suffit.

#### Un état qui dépend du TEMPS ne doit pas dépendre d'un ÉVÉNEMENT

La faute la plus grave de ce projet : le jeu ne démarrait plus du tout.

J'avais posé un voile tant que la taille d'écran n'était pas stable
depuis 260 ms. La condition était juste, mais elle n'était évaluée QUE
sur un événement du navigateur — `resize`, `orientationchange`. Sur un
chargement calme, aucun de ces événements ne survient après la
stabilisation : le voile restait posé indéfiniment.

Deux filets valent mieux qu'un, et pour une raison précise : le premier
peut retomber dans le même piège.
- Une relecture PROGRAMMÉE au moment où le délai expire, déclenchée par
  le changement lui-même.
- Une reprise depuis la BOUCLE, qui tourne même en pause. C'est le filet
  qui ne peut pas manquer : tant qu'une image est dessinée, l'état est
  relu.

Corollaire à retenir avant d'écrire une condition temporelle : « qui va
la relire, et est-ce garanti ? »

#### Le navigateur MENT sur la taille pendant une rotation

iOS rend des dimensions périmées pendant quelques centaines de
millisecondes après un changement d'orientation, puis la barre d'adresse
se replie et la hauteur change encore — sans émettre de `resize` sur la
fenêtre. On dessinait donc une ou deux images à la mauvaise échelle :
c'est le « redimensionnement » visible en arrivant sur un écran.

Trois parades, ensemble :
- PLUSIEURS relevés après une rotation (0, 120, 300, 600, 900 ms) : un
  seul à 220 ms tombait parfois sur une valeur encore fausse, et elle
  restait jusqu'au prochain geste du joueur ;
- écouter `visualViewport`, seul à signaler le repli de la barre ;
- et surtout NE PAS DESSINER tant que la mesure bouge. On ne peut pas
  mesurer mieux — le navigateur ment — mais on peut savoir quand il
  s'est calmé : deux cent soixante millisecondes sans changement. Le
  voile de pivot reste posé pendant ce temps, muet, et masque les images
  intermédiaires.

Le piège dans le piège : « pas encore mesuré » doit compter comme
CALME. Répondre « pas stable » quand aucune mesure n'a eu lieu bloquait
la boucle pour toujours dans le harnais de test.

#### Un état déduit vaut mieux qu'un front

L'affiche du bar ouvrait le choix du champion à l'instant précis où son
chrono passait à zéro. Posé à zéro autrement — par un test, par une
reprise —, l'événement n'avait jamais lieu et le choix restait fermé pour
toujours, pupitre affiché sur un niveau pas commencé. Écrire la condition
comme un ÉTAT (« pas d'affiche en cours et pas encore lancé ») au lieu
d'un front la rend vraie quel que soit le chemin.

### 3.5 — La boucle, le temps et les états

Le pas fixe, les délais, les états qui suspendent. La question à se
poser devant toute condition temporelle : **qui va la relire, et est-ce
garanti ?**

**Avant de coder** : un état qui suspend se teste DANS la condition de la
boucle, pas en retardant un délai.

#### Deux raisons de suspendre, une seule suspension
`Boucle.pause` sert au blocage portrait ET à la pause demandée. Le
premier jet remettait `pause` à faux dès que l'écran redevenait
paysage, ce qui reprenait la partie derrière l'écran de pause. On teste
donc les deux causes avant de relancer.

#### Monter la scène et lancer la partie sont deux choses
Pour que les deux inspecteurs entrent à l'image pendant l'introduction,
il faut qu'ils existent — mais surtout pas que le chrono tourne.
`Enquete.monter()` tire l'affaire, pose les meubles et place les deux
hors champ ; `Enquete.lancer()` démarre seulement le décompte. Le piège
qui a suivi : la fin de l'introduction rappelait `demarrer()`, qui
remonte tout — les deux repartaient hors champ et les indices étaient
redistribués. On ne remonte que si la scène n'existe pas encore.

#### Une exception de dessin fige le jeu, sans un mot
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

#### `setTimeout` pour une échéance de jeu
La conclusion de l'enquête était programmée par `setTimeout`. Une
échéance en temps absolu continue de courir pendant une pause — c'est le
même piège que les horodatages de DUO. Tout ce qui compte le temps du
jeu passe par `pas(dt)`.

#### La fenêtre d'esquive s'ouvrait après le choc
La tarte vise **au-delà** du héros pour poursuivre sa route s'il se
baisse. Le décompte était calculé sur la course entière, donc le repère
s'allumait une fois la meringue reçue. On repère l'instant du
croisement, pas la fin de la course.

#### Deux tartes en l'air se bloquaient l'une l'autre
L'esquive visait la première tarte de la liste, répondait « trop tôt »,
et le verrou anti-martèlement empêchait d'éviter l'autre. Elle vise
maintenant la plus **pressante**.

#### Une fenêtre d'action ne vaut rien si rien n'arrête celui qui la traverse

BruHell ne lançait jamais son cocktail. Le réflexe aurait été de raccourcir
son délai d'attente ; le vrai défaut était ailleurs. Sa fenêtre de jet
mesure 1,8 s de traversée et son attente initiale 3,4 à 5,2 s : il
sortait de la fenêtre avant d'avoir fini d'attendre. Aucun réglage de
délai n'aurait tenu, parce que la fenêtre elle-même dépendait de sa
vitesse.

La correction est structurelle : un ennemi dont la menace est la DISTANCE
se poste à sa portée et n'avance plus. Ça règle le bug, ça rend le
personnage conforme à sa définition, et ça le rend dangereux au lieu
d'être une cible qui passe.

Piège dans la correction : arrêter ne suffit pas, il faut BORNER. Le pas
qui l'amène à sa position le fait dépasser de quelques millièmes, et la
condition `z <= zMax` échoue encore. Mesuré entre les deux versions : 0
jet pour l'Abbé, 1 pour BruHell en trente secondes.

#### Une boucle audio a besoin d'un arrêt explicite ET d'une libération

Deux pièges, et le second ne se voit qu'à la deuxième partie. Une source
en `loop = true` continue de tourner quand le niveau se termine : elle
accompagne l'écran titre puis se superpose à la musique suivante. Et
libérer la source ne suffit pas — tant que `gainMus` existe,
`lancerMusique()` refuse de partir, et les autres niveaux deviennent
muets. L'arrêt doit remettre les deux à zéro.

#### Bloquer une file d'apparitions, ce n'est pas retarder son premier délai

L'annonce de horde repoussait `prochain`, le délai avant la prochaine
apparition. Insuffisant : la boucle continuait de tourner et deux ennemis
étaient déjà dans la rue pendant qu'on lisait la carte. Un état qui
SUSPEND doit être testé dans la condition de la boucle, pas compensé par
un délai.

#### Un bouton d'état ne doit pas bloquer l'action qui l'annule

À couvert, appuyer sur TIRER ne faisait rien : il fallait d'abord
rappuyer sur le bouclier. Le code disait `if (this.couvert) return true;`
avant même de regarder où le doigt avait tapé — l'état bloquait l'entrée
au lieu d'être annulé par elle. Or l'intention de quelqu'un qui appuie sur
TIRER pendant qu'il est accroupi ne fait aucun doute.

La règle : un état défensif s'annule tout seul dès que le joueur demande
l'action qu'il empêche. Sortir de l'abri est devenu un geste nommé
(`quitterAbri`) appelé depuis trois endroits — le bouclier, le tir, le
changement de héros — pour que le son et l'effet soient les mêmes partout.

Attention au corollaire : ne pas tout débloquer pour autant. La croix
directionnelle reste active à couvert, parce que viser est le seul geste
qui reste et que le couper ferait de l'abri un temps mort.

#### Un compteur cumulatif se remet à zéro, sinon il déclenche en boucle

Le trébuchement se déclenche quand les dégâts encaissés aux jambes
passent un seuil. Sans remise à zéro, une fois le seuil franchi il
trébuchait à CHAQUE balle et n'avançait plus jamais — l'ennemi devenait
inoffensif pour deux balles de revolver.

### 3.6 — Contenu — scénarios, castings, textes

Les données du jeu : affaires, personnages, répliques. Le piège
récurrent est l'écriture en dur d'un détail qui devient variable plus
tard — un prénom, un objet, une place.

**Avant d'écrire cinquante entrées** : lire la structure, et vérifier
qu'un texte tiré au sort ne suppose pas un cas particulier.

#### Les deux héros ont été intervertis
La table de découpe a inversé les panneaux : le repère vert s'allumait
au-dessus de Pierre-François et le bouton « Thibaut » montrait un
portrait chauve. Rien dans le jeu ne s'en apercevait. `decoupe2.py`
mesure maintenant le buste des deux sprites produits et refuse de sortir
si Thibaut n'est pas en vert et Pierre-François en noir.

#### Les prénoms écrits en dur dérivent
Ils étaient recopiés à cinq endroits — deux boutons, deux lignes de
légende, deux boutons de debug. Ils viennent tous du tableau `Heros`,
seule source du prénom, du sprite et du portrait. Échanger les deux
héros se fait en échangeant deux lignes.

#### Un scénario ne peut nommer que des gens PRÉSENTS
Trois affaires écrites avec Solène, Rémy et Jojo pour coupables : elles
ne peuvent pas tourner tant que le casting de l'appartement est figé sur
quatre habitants. Le tirage de distribution n'est pas un raffinement à
ajouter après les scénarios, c'est ce qui les rend possibles.

#### Un identifiant en double fait disparaître une affaire
« Trente-cinq scénarios sortent sur trente-six » : j'ai cherché un
scénario structurellement exclu pendant plusieurs essais, alors que la
liste des manquants était VIDE. Deux affaires portaient le même
identifiant — le compteur de distincts en voyait donc une de moins. Le
symptôme désignait le tirage, la cause était dans les données. Un test
vérifie maintenant l'unicité directement, ce qui donne un message qui
nomme le coupable au lieu de faire soupçonner l'aléatoire.

#### Un casting variable casse tout ce qui nommait quelqu'un
En rendant l'appartement tirable, six tests et une fonction de jeu se
sont cassés — tous parce qu'ils désignaient une personne par son nom :
`SUSPECTS.find(id === "charles")`, `PLACES_FIXES[s.id]`, « les quatre
sont toujours là », et `interroger(is)` avec un indice gardé d'une partie
à l'autre. Rien de subtil, mais il faut les chercher : dès qu'une donnée
devient aléatoire, **tout ce qui la nommait devient faux**. Les tests
prennent maintenant « un habitant humain quelconque » ou passent leur
tour quand la personne visée n'est pas de la distribution.

#### `expert` et `social` sont des SERRURES, pas des étiquettes
Elles ne disent pas « cet objet est technique » ou « cet objet parle des
gens » : elles disent **qui peut ramasser l'indice**. Un indice `expert`
est invisible pour Thibaut, un indice `social` l'est pour PF. D'où la
règle absolue : **un indice porte au plus un trait**. En posant
`social:true` sur des indices déjà `expert:true`, j'en ai créé que
PERSONNE ne pouvait ramasser — d'où les affaires qui ne réunissaient
que cinq indices sur six, une fois sur trois. Onze indices neutres sont
devenus sociaux, sans jamais toucher à un expert, et la suite tient sur
huit passes.

#### Marquer un indice `social` ne se fait pas à la légère
Vingt et un nouveaux indices passés en `social` d'un coup : la suite est
devenue intermittente sur DEUX tests distincts, dont la lecture d'un
indice par PF (`(pf && !ind.social) ? analyse : brut` — un indice social
lu par PF affiche la version brute). Le trait ne dit pas « cet objet
parle des gens », il dit « c'est Thibaut qui le lit le mieux ». Annulé
en attendant d'en comprendre toutes les conséquences.

#### Lire la structure AVANT d'écrire cinquante entrées
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

#### Une couleur écrite en dur se cache à plusieurs endroits
J'avais corrigé les pastilles de légende en v6.10 en écrivant « une
couleur ne s'écrit qu'à un seul endroit » — et j'en avais laissé une
deuxième : le fond des touches de salut, `#cmdT` et `#cmdP`, peint dans
le CSS. Résultat visible cinq versions plus tard : la touche de PF était
VERTE avec le visage de PF dessus. Quand on retire une donnée du CSS pour
la faire venir du code, on cherche TOUTES ses occurrences, pas celle qui
a motivé la correction. Un test refuse maintenant tout `background`
codé en dur sur ces deux touches.

#### Une rangée ne suffit pas, un côté non plus
Deux leçons du même repli. Pousser une bulle vers un côté puis la
rabattre dans l'écran la reposait sur sa voisine : on cherche un TROU
en balayant la rangée de gauche à droite, on ne pousse plus à
l'aveugle. Et une bulle centrée remplit sa rangée à elle seule — large
de 42 % au plus, il en tient deux par rangée, mais pas une troisième :
le balayage descend de rangée en rangée jusqu'à trouver une place.
Cinq rangées pleines, cas jamais vu, et la plus récente passe devant.

#### Du texte écrit pour un cas particulier, tiré au sort ensuite
Les répliques de découverte nommaient un meuble — « Dans un sac » —
alors que le scénario tirait sa cachette parmi deux ou trois. Huit
affaires sur dix-sept pouvaient annoncer le mauvais endroit. Chaque zone
porte maintenant sa tournure locative (`dedans`), et les textes
l'appellent par un marqueur. Règle générale : dès qu'une valeur est
tirée au sort, tout texte qui la mentionne doit passer par le marqueur,
jamais par la copie.

#### Une branche de contenu que rien n'atteignait
Trois affaires n'ont pas de coupable. La contradiction se déclenchait sur
`bonneReponse()`, qui vaut alors « personne » — aucun suspect ne porte
cet identifiant, donc la phrase existait dans le fichier et n'est jamais
sortie à l'écran. Elle vise désormais un `temoinCle`. À retenir : une
valeur sentinelle (« personne ») qui traverse une comparaison
d'identifiants ne lève aucune erreur, elle rend juste du contenu
invisible. Seul un audit qui déroule les dix-sept cas l'a montré.

#### Un détail écrit en dur transforme dix-sept affaires en une seule
« 19 h 42 » revenait à chaque partie, dans le ticket comme dans la
contradiction. Les détails sont désormais tirés une fois par affaire et
insérés par marqueurs `{heure}`, `{livreur}`, `{froid}`… Un seul point
d'insertion, donc un texte oublié se voit immédiatement : il reste des
accolades à l'écran. Un test le vérifie sur deux cents tirages.

#### Un indice qu'on ne peut pas refermer n'est pas une fausse piste
Le garnissage puisait dans toute la banque : des traces de pattes
pouvaient sortir dans une affaire sans chat. Chaque indice signifiant
porte maintenant une étiquette, chaque affaire aussi, et ils doivent se
répondre. Attention au piège qui a suivi : filtrer le garnissage a privé
sept affaires de tout indice réservé à Thibaut, donc jouables avec un
seul inspecteur. Un test refuse toute affaire dont les étiquettes
n'admettent pas au moins un indice pour chacun des deux.

#### Deux listes parallèles finissent par se désynchroniser
Les questions des inspecteurs et les réponses des témoins étaient deux
tableaux distincts, chacun avec son curseur. On demandait l'heure, on
s'entendait répondre qu'il y avait deux pizzas. Un *sujet* tient
désormais la question ET ses trois réponses possibles. C'est la même
leçon que la mesure des bulles séparée de leur dessin : ce qui doit
rester d'accord doit vivre au même endroit.

#### Rendre un ordre aléatoire casse les tests qui présumaient le premier

Les hordes tirent désormais l'ordre des méchants au sort. Six aides de
test appelaient `ajouterEnnemi()` en supposant obtenir un Depardiahree —
elles mesuraient soudain la mécanique d'un autre. Une aide de test qui
dépend d'un tirage doit le FORCER, pas espérer.

Même famille : quatorze mises en place tapaient sur le pupitre juste
après `demarrer(4)`, et l'annonce intercepte maintenant le doigt. Le
comportement est voulu ; c'est la mise en place qui devait en tenir
compte. Sauf pour les deux tests qui vérifient l'annonce elle-même — un
remplacement global les avait cassés en fermant ce qu'ils venaient lire.

#### Un secours qui ignore une contrainte fabrique des fantômes

Le placement des habitants du niveau 2 servait une place DEBOUT en
secours à qui n'avait pas de silhouette debout. Le code s'exécutait sans
erreur, le personnage entrait dans `SUSPECTS`, son étiquette s'affichait,
il était interrogeable — et invisible. Le pire des symptômes, encore une
fois : tout fonctionne sauf l'image.

Mesuré : 198 placements fantômes sur 2393, soit un par partie sur deux.
La règle qui manquait : **une place n'est tenable que si le sprite
existe**. Un secours doit vérifier la même contrainte que le premier
choix, sinon il ne fait que déplacer le problème hors de vue.

Deux corollaires. On sert les plus CONTRAINTS d'abord — qui ne peut que
s'asseoir passe avant qui peut les deux — et on ne coupe pas la liste des
candidats avant d'avoir placé : certains seront écartés, il faut de quoi
les remplacer. Un candidat sans place tenable est écarté, pas placé de
force ; mais le noyau (coupable, témoin clé) garde une priorité absolue,
et un test vérifie qu'il est toujours dans la pièce.

#### Perdre doit raconter l'histoire, sinon elle est perdue

L'enquête ratée n'affichait ni coupable ni explication. Or celui qui n'a
pas trouvé a plus besoin de savoir que celui qui a trouvé : une histoire
qu'on ne connaît pas ne donne pas envie d'être rejouée.

Piège rencontré dans la correction elle-même : ma première version
remplaçait la chute par un message de défaite. Or sur cinquante
scénarios, cinquante et un ont une chute et dix-huit seulement ont un
récit — **la chute EST l'explication**. La remplacer retirait l'histoire
à celui qui en avait le plus besoin. Le reproche passe devant, en une
phrase courte, et la chute reste.

#### Un écran de fin par niveau, sinon il mentira

Le niveau 4 tombait sur le relevé du niveau 1 et affichait PERSONNES
SALUÉES et FILE LA PLUS LONGUE à la sortie d'une fusillade. `afficherFin`
aiguille désormais les quatre niveaux, et chaque écran commence par
ÉTEINDRE les panneaux des autres — c'est l'oubli qui laisse deux
tableaux empilés.

Le détail par catégorie se construit depuis `Object.keys(ENNEMIS)` et le
conteneur HTML est VIDE : recopier la liste des ennemis dans le HTML
aurait dérivé au premier ajout, exactement comme les prénoms écrits en
dur ailleurs. Un test vérifie que le conteneur est bien vide.

#### Une pose manquante rendait l'ennemi invisible

Le rendu abandonnait (`continue`) quand l'image de la pose n'était pas
dans la table — mais la logique continuait : l'ennemi avançait, entamait
la barricade et tuait, sans qu'on le voie. C'est le pire des symptômes,
parce qu'on cherche le défaut dans la logique. Le rendu se replie
désormais sur `run1`. Une pose fausse vaut mieux qu'un ennemi fantôme.

### 3.7 — Le son

Arrivé tard, et avec ses propres lois. La plus contre-intuitive : un
son FRÉQUENT doit fatiguer moins, pas sonner mieux.

**Avant de coder** : la crête se vérifie sur le fichier LIVRÉ, en
bouclant — l'encodeur dépasse ce qu'on lui donne.

#### Monter un son au-dessus de 1 demande un limiteur, pas du courage

Les détonations devaient dominer. Passer leur gain de 0,85 à 1,55 sature
la sortie dès que deux sons se superposent, et une saturation numérique
s'entend comme un grésillement — l'inverse de la puissance recherchée. Un
compresseur en fin de chaîne rattrape les crêtes et permet de régler
chaque son pour son RÔLE plutôt que pour éviter le plafond.

#### Un même enregistrement peut porter trois sons

Un grognement de 0,8 s donne le râle du monstre vivant (un éclat de 0,2 s
pris au hasard, doux, répété), son dernier cri (l'enregistrement entier,
ralenti à 0,78 — le ralentissement descend la hauteur, donc la mort sonne
plus grave que la vie) et rien d'autre à charger. Découper et transposer
coûte trois paramètres ; cinq fichiers de plus auraient coûté 40 Ko et une
séance de découpage.

Corollaire : le son d'ambiance n'a PAS de repli synthétisé, et c'est
assumé — un râle de synthèse joué en boucle serait pire que le silence.
L'invariant « jamais muet » porte sur les sons qui ponctuent une action,
pas sur l'ambiance.

#### La crête d'un encodage se vérifie sur le FICHIER LIVRÉ, en bouclant

Troisième rencontre avec ce piège, et cette fois il est réglé pour de
bon. Le dépassement du Vorbis dépend du CONTENU : mesuré de 1,47 à 1,72
fois sur un enregistrement de pistolet déjà saturé à la source, contre
1,16 sur de la synthèse. Aucune marge fixe ne convient aux deux.

La parade est une boucle : encoder, décoder le fichier écrit, mesurer,
baisser le gain, recommencer. Six essais suffisent et bornent le coût.
C'est le même principe que le contrôle visuel avant push — on vérifie
l'artefact livré, pas l'intention.

#### Un échantillon ne doit pas dépasser le geste qu'il accompagne

Le rechargement du pistolet fourni dure 1,68 s de son utile, le geste en
jeu 1,5 s. Tronquer emportait le troisième des trois claquements en plein
milieu : un rechargement qui s'arrête au deuxième temps ne se lit plus
comme un rechargement. On ACCÉLÈRE donc pour faire tenir.

Le test lit la durée réelle dans le conteneur OGG — la dernière page
porte la position de granule, donc le nombre d'échantillons. Estimer
d'après le poids du fichier ne marche pas : le débit est variable.

#### Un son fréquent doit FATIGUER moins, pas sonner mieux

L'échantillon d'impact sur un corps a été retiré au profit de la
synthèse qu'il remplaçait. Le critère n'est pas la qualité isolée mais la
FRÉQUENCE : ce son sort cinquante fois par horde. Un enregistrement, même
bon, s'entend alors en boucle — toujours la même attaque, toujours la
même queue. Une percussion synthétisée avec un grain de hasard à chaque
tir ne se répète jamais tout à fait.

Corollaire pour choisir quoi échantillonner : les sons RARES d'abord (un
cri de mort, un rechargement), les sons fréquents en dernier — et
seulement avec plusieurs variantes.

#### Un enregistrement continu ne se coupe pas aux silences

Le source des cris grogne sans interruption : médiane d'enveloppe à
0,026, 75ᵉ centile à 0,094. Une segmentation par seuil d'énergie n'a
rendu que quatre morceaux sur cinquante-six secondes, et les quatre
commençaient en plein milieu d'un aboiement.

La parade : glisser une fenêtre de durée fixe et la NOTER — énergie
moyenne divisée par l'énergie de ses bords. Une bonne fenêtre est forte
au milieu et faible aux extrémités ; c'est exactement ce qu'on cherche
pour un son qu'on va fondre en entrée et en sortie.

#### Lever une règle, c'est garder l'invariant qui la motivait

« Aucun fichier audio » n'était pas un caprice : elle garantissait qu'il
n'y a rien à télécharger, rien qui puisse manquer, aucune licence à
vérifier. En la levant pour neuf sons, il fallait sauver ce qui comptait
vraiment — **que le jeu ne soit jamais muet**. D'où le repli synthétisé
systématique, et le test qui vérifie que chaque appel d'échantillon en a
un. La plomberie se livre alors avant les fichiers, ce qui est le seul
moyen de la vérifier séparément.

#### Un encodeur DÉPASSE la crête qu'on lui donne

Échantillons normalisés à 0,89 avant encodage, mesurés à 1,000 après :
saturés. Le Vorbis reconstruit un signal qui dépasse l'original. La marge
se prend AVANT l'encodeur — 0,78 donne 0,905 en sortie. Contrôler après
encodage, jamais avant : c'est le fichier livré qui compte.

### 3.8 — Équilibrage et mécaniques de jeu

Ce qui fait qu'un ennemi pose une QUESTION plutôt qu'un obstacle. Un
seuil ne veut rien dire seul : il se compare toujours au dégât d'un coup.

**Avant de coder** : une exception à une règle d'équilibrage se DÉCLARE
dans la donnée, elle ne se déduit pas d'un écart de chiffres.

#### Une règle d'équilibrage vaut pour le cas qui l'a fait naître

J'ai écrit un test exigeant qu'aucune tête ne tue d'un seul coup. C'était
généraliser à tort la leçon du TANK : là, un headshot unique effaçait la
question « tête ou jambes ? ». Sur un ennemi FRAGILE qui arrive vite, le
headshot unique EST le dessein — c'est la récompense d'avoir visé juste
avant qu'il arrive.

Le test dit maintenant ce qui compte vraiment : que le coût d'une tête
DIFFÈRE d'un ennemi à l'autre, et que le tank en demande au moins deux.
Un plancher commun aurait aplati les cinq.

#### Une perspective convergente superpose ce qui se poste loin

Les cinq couloirs du niveau 4 convergent : deux ennemis postés à la même
profondeur se retrouvent à quelques pixels l'un de l'autre, avec leurs
deux cibles de bras superposées. Ça ne se voit sur aucun test — la
mécanique fonctionne — et ça se voit tout de suite à l'image.

Deux parades, appliquées ensemble : les fourchettes de distance des deux
bombardiers sont DISJOINTES, et une cible superposée à une autre désigne
la plus PROCHE. La seconde compte le plus : sans règle explicite, c'était
l'ordre du tableau d'ennemis, donc l'ordre d'apparition, qui décidait de
qui était touché.

#### Une exception à une règle d'équilibrage se DÉCLARE

L'Abbé casse la règle pv × vitesse : 8,6 contre 11. C'est voulu — sa
menace est de rester vivant loin, pas d'arriver au contact. Mais tant que
l'exception n'était qu'un écart de chiffres, le test ne pouvait que
tomber ou être affaibli pour tout le monde.

La parade : un drapeau `menaceDistante` dans sa fiche, le test ne mesure
la règle que sur les ennemis de contact — ET un second test exige que
l'exempté reste fragile et s'arrête loin. Sans ce garde-fou, le drapeau
serait un passe-droit pour n'importe quel déséquilibre.

#### Un premier plan se calibre sur ce qu'il ne doit PAS masquer

Première version de la foule du bar : pieds à 1,30 hauteur d'écran,
taille 0,78. Leur buste montait à mi-écran et le champion disparaissait
ENTIÈREMENT derrière une grappe. Or il doit circuler derrière eux, pas
s'évanouir.

La bonne façon de poser ces deux nombres n'est pas de choisir une taille
mais de partir des deux choses à ne pas couvrir : le COMPTOIR (donc les
verres à attraper) et le HAUT DU CORPS du champion. D'où pieds à 1,52 :
on ne voit que les épaules et la tête. Un test vérifie que le haut de la
foule reste plus bas que la ligne du comptoir — c'est la seule contrainte
qui décidait de tout, parce qu'une foule qui masque les verres oblige à
reprendre le garde-fou de faisabilité.

#### Une perspective qui converge crée un point de camping

Les cinq couloirs du niveau 4 convergent vers le point de fuite : tous
les ennemis passent donc par le MÊME pixel au fond de la rue. Viseur
posé là, tirer en boucle touchait tout le monde à la tête sans jamais
viser. Ce n'est pas un défaut de la visée, c'est une conséquence de la
perspective — toute fausse profondeur convergente a ce point.

Parade : une atténuation des dégâts en fonction de Z, 32 % au fond,
plein tarif à partir de 0,58. Elle ne rend pas le tir lointain
impossible, elle le rend COÛTEUX en munitions, ce qui remet le
rechargement dans la boucle. À appliquer partout où le dégât dépend
d'une distance : les points de vie, mais aussi l'usure de la garde de
DSKKK, qu'on cassait sinon depuis le fond au prix du contact.

Et la règle doit se LIRE : le viseur passe à l'ambre sur une cible
atténuée. Un équilibrage invisible est une punition arbitraire.

#### Un seuil se compare toujours au dégât d'UN coup

Deux fois le même défaut en deux versions. `mult.tete = 1.7` sur 160 PV
donnait 170 : un headshot couchait le tank. `garde.seuil = 78` contre 100
de dégât brut au revolver : un seul coup cassait la garde. Dans les deux
cas la question de conception disparaissait, et aucun test ne le voyait
parce que la mécanique FONCTIONNAIT. Un seuil se pose maintenant en
NOMBRE DE COUPS, arrondi au supérieur, et un test le vérifie pour les
deux armes.

#### Un multiplicateur de zone doit être vérifié contre les PV

`mult.tete = 1.7` sur 160 PV donnait 170 de dégât au revolver : UN
headshot couchait le tank, et la question « tête pour tuer ou jambes
pour ralentir ? » disparaissait. À 1,15 il en faut deux. Un test compare
désormais le nombre de balles à la tête et au torse, et exige au moins
deux à la tête et un rapport de trois entre les deux.

### 3.9 — Tests et outillage

Les tests attrapent beaucoup, et jamais le visuel. Ils ont aussi leurs
propres pièges — un test qui repère du code par son nom, une aide qui
mute l'état global, deux tests qui mesurent la même chose.

**Avant de coder** : un test qu'on doit AFFAIBLIR pour le faire passer
signale presque toujours que le code a tort.

#### Un état global du jeu casse les tests qui le supposaient fixe
Trois fois dans la même session, sous trois formes. Le casting de
l'appartement devient aléatoire → tout ce qui nommait un habitant
devient faux. Le menu passe en PORTRAIT → dans un harnais qui simule un
écran couché, le pivot met la boucle en pause et « la boucle est
relancée » tombe, alors que rien n'est cassé. Le niveau 4 gagne un écran
d'ANNONCE qui gèle la mécanique → quinze tests qui appelaient
`demarrer(4)` puis `pas()` se retrouvent à mesurer un monde figé.

La règle : quand on ajoute un état qui BLOQUE ou RANDOMISE, on cherche
tout de suite qui en dépendait sans le savoir. Et le test se recentre
sur son INTENTION — « la pause a rendu la main » plutôt que « la boucle
tourne », parce que la boucle peut légitimement être arrêtée par autre
chose.

#### Un script d'édition qui abandonne laisse le travail à moitié fait
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

#### Tester AVANT d'assembler, c'est tester l'ancien fichier

Variante sournoise de la précédente, et je viens de la commettre. La
suite lit `index.html`, qui est PRODUIT par l'assembleur. Lancer les
tests avant d'assembler mesure donc l'état d'avant l'édition : le
résultat affiché ne dit rien du code qu'on s'apprête à livrer.

Ce jour-là il était rouge — la version du script et celle affichée ne
concordaient pas encore, puisque l'assembleur n'avait pas tourné. La
chaîne a ensuite assemblé, retesté au vert et poussé le bon état. Rien de
mauvais n'est parti, mais j'ai affiché un rouge et poussé dans la même
commande : la prochaine fois, ce sera vrai.

L'ordre est donc invariable, et le premier terme n'est pas facultatif :
**assembler → `node --check` → tester → regarder → pousser.**

#### Une chaîne de commandes masque un test rouge
J'ai poussé la v6.21 avec un test en échec. La boucle de vérification
affichait bien le rouge, mais elle se terminait avec un code de succès,
et le `&&` qui suivait a enchaîné sur le commit et le push. Le garde-fou
doit ARRÊTER la chaîne : la boucle sort en erreur dès qu'un ✗ apparaît,
et rien ne se pousse derrière. Voir un échec défiler dans la sortie ne
suffit pas — il faut qu'il bloque.

#### Le harnais visuel voit ce que la suite ne voit pas
`Enquete.poseIns(E2.inspecteurs.indexOf(ins))` : `E2` est un alias LOCAL
de `dessiner()`, pas une variable de module. Les 449 tests passaient —
ils n'appellent jamais le rendu — et le jeu plantait à la première image.
C'est `apercu.js` qui l'a dit. Toute modification du rendu passe par un
aperçu, sans exception.

#### Une regex sur du code attrape ce qu'elle matche, pas ce qu'on veut
En convertissant les ordonnées du dossier en hauteur utile, mon
remplacement `H * 0.xx` a raté `H * (0.745 + i * 0.048)` — entre
parenthèses. Résultat : les lignes de théorie sont passées SOUS le
message final et l'ont chevauché. Même famille que la reconstruction de
listes par regex. Après toute transformation mécanique du code, on
compte ce qui reste ET on regarde l'image.

#### Un test qui dépend d'un tirage doit FORCER le tirage

Quatre vérifications sur la contradiction n'étaient exécutées que si
l'affaire tirée au sort avait un coupable — sinon le bloc était sauté au
profit d'un « rien à contredire ». Résultat mesuré : le nombre de tests
passait de 692 à 689 environ une fois sur six.

Un test qui ne s'exécute pas ne protège de rien, et personne ne remarque
son absence : la suite reste verte. Pire, le symptôme se lit comme du
bruit — « tiens, le compte a bougé » — au lieu d'un défaut.

La parade : relancer le tirage jusqu'à obtenir le cas voulu (soixante
essais suffisent ici), et VÉRIFIER qu'on l'a obtenu. Ainsi l'échec de la
mise en place devient lui-même un test rouge.

Signe à surveiller : **un nombre de tests qui varie d'une exécution à
l'autre**. Il ne devrait jamais varier.

#### Un test statistique au seuil trop proche de la moyenne
« On préfère envoyer celui qui a quelque chose à dire » : taux réel
62 %, seuil 55 %, 200 tirages — soit 2,2 σ, un échec toutes les
soixante-dix passes, toujours au mauvais moment. Porté à 600 tirages :
même seuil, 3,7 σ. Mesurer l'écart-type avant de fixer un seuil.

#### `${PIPESTATUS[0]}` et le tube
`node tests/x.js | tail -1` renvoie le code de `tail`. Un `&&` qui suit
ne verra jamais l'échec — la publication est partie une fois sur une
suite qu'on n'avait pas lue. Rediriger vers un fichier, puis afficher.

---

#### Deux tests qui mesurent la même chose finissent par se contredire

« Les trois ennemis pèsent la même menace » et « les cinq ennemis pèsent
la même menace » cohabitaient, écrits à deux moments différents. Les deux
sont tombés en même temps sur l'Abbé, et il a fallu comprendre qu'il n'y
en avait qu'un à corriger. Un invariant, un test.

#### Le harnais rechargeait ses images à chaque scène

Chaque scène crée son propre contexte, et `preparer()` rechargeait les
252 images à chacune : le processus était tué par manque de mémoire bien
avant les dernières scènes, donc pile sur ce qu'on venait de changer. Les
images sont en lecture seule ici — un cache unique partagé entre les
contextes suffit, et le harnais complet passe.

#### Un test qui repère du code par son nom tombera au renommage

« La barricade repasse devant les ennemis » cherchait `Ruelle.poseEnnemi`
dans la source pour situer la passe des ennemis. Renommé en
`Ruelle.imagePose`, le test est tombé alors que l'ordre de dessin était
juste. C'est le même défaut que « reconstruire une liste du code à la
regex » : inévitable ici — l'ordre de dessin ne se teste pas autrement —
mais le repère doit être commenté pour que l'échec se lise en dix
secondes.

#### Une aide de test qui mute l'état global fait tomber les tests suivants

Mon aide `unDsk()` écrivait dans `VAGUES[0].types` et remplaçait
`Ruelle.viser` sans le remettre. Résultat : quatre tests SUIVANTS en
échec, et le défaut avait l'air d'être dans le jeu. Une aide qui touche
à l'état partagé doit le restaurer, ou construire son objet à la main
plutôt que passer par la fabrique du jeu.

### 3.10 — Décor, lumière et effets

Ce qui appartient au LIEU. La question qui tranche : « est-ce que je
dois pouvoir le dépasser ? » Si oui, ça se place dans le monde ; sinon,
à l'écran.

#### Une planche lumineuse sur noir : l'extinction va sur la COULEUR

Trois essais pour un seul bord visible, et les deux premiers étaient des
contresens instructifs.

1. Détourer : le dégradé du néon se coupe quelque part, la coupure se
   voit comme un halo sale.
2. Fabriquer un alpha depuis la luminance : la zone autour du sujet n'est
   pas noire mais gris très foncé (10 à 40), elle devient donc
   semi-opaque avec du NOIR dessous — un voile sombre, pire que le bord.
3. La bonne : composer en ADDITIF, où le noir n'ajoute rien, et faire
   mourir la COULEUR au bord. En additif, l'alpha ne sert à rien.

Et la cause du bord, mesurable : le néon TOUCHE les bords de l'image
d'origine — luminance jusqu'à 246 sur la ligne du bas. Il est coupé net
par le cadre. Aucun mode de composition ne rattrape ça : il faut ajouter
une marge et éteindre dedans.

Détourer un personnage entouré de néon laisse un halo sale : le dégradé
lumineux se coupe quelque part, et cette coupure se voit. En mode
`lighter`, un fond noir n'ajoute rien et disparaît de lui-même, tandis
que le néon se fond dans la pénombre. Aucune découpe, donc aucun bord
raté — à condition que le fond du dessin soit VRAIMENT noir, ce qui se
vérifie en mesurant les coins.

#### Un décor de premier plan accroché à la CAMÉRA n'est pas un décor

Les grappes de figurants du bar étaient posées en fractions d'ÉCRAN.
Résultat : elles suivaient le champion partout, comme peintes sur la
vitre. On ne les dépassait jamais, et un bar long de trois fonds semblait
tenir en un seul écran.

Posées en coordonnées de MONDE, elles deviennent des lieux : on croise un
groupe, on le dépasse, on en trouve un autre plus loin. La règle
générale : tout ce qui appartient au LIEU se place dans le monde ; seule
l'interface se place à l'écran. Un doute sur la catégorie se tranche en
demandant « est-ce que je dois pouvoir le dépasser ? ».

#### Remplir des groupes à tour de rôle, pas l'un après l'autre

Dix habitués pour six grappes : en remplissant chacune à fond avant de
passer à la suivante, les deux dernières restaient désertes. À tour de
rôle, toutes se garnissent. Le défaut ne se voit pas au premier essai —
il faut compter, ou marcher jusqu'au bout du bar.

#### Changer de décor pour un plus sombre oblige à traiter les SPRITES

Les décors de crépuscule et de nuit sont à 0,39 et 0,35 de la luminance
de celui de jour. Les poser tels quels laissait héros et méchants
éclairés comme en plein jour : ils flottaient sur la nuit comme des
découpes. Un décor n'est pas un fond interchangeable — il fixe une
lumière, et tout ce qui se dessine dessus doit s'y plier.

Le voile se pose donc APRÈS les personnages et AVANT le pupitre : la
scène entière est teintée, l'interface reste lisible. Et il est bleu
profond plutôt que noir — le noir écrase les couleurs, le bleu les
refroidit en les gardant.

Corollaire heureux : c'est la nuit qui donne son intérêt au coup de feu.
En plein jour il se voit à peine ; la nuit il repeint l'écran. L'effet ne
coûte qu'un rectangle en mode `lighter` dont l'alpha suit l'heure.

#### Un seul système de particules pour toutes les familles

Douilles, fumée, éclats de bois, gerbe : même pas, même rendu, un objet
plat par particule et un champ `forme` qui dit comment la peindre.
Ajouter une famille coûte une ligne de gabarit. Le réflexe inverse — une
boucle et un tableau par effet — donne quatre fois le même code à
maintenir et quatre occasions d'oublier la remise à zéro.

Deux règles de survie : un PLAFOND, sinon une horde chargée sème plus
vite qu'elle ne nettoie ; et on jette les PLUS VIEILLES, parce qu'une
explosion qui n'apparaît pas se remarque plus qu'une fumée qui s'efface.

### 3.11 — Structure du code

Organisation, suppressions, refactorisations. Supprimer un système,
c'est toujours plus d'endroits qu'on ne croit.

#### Supprimer un système, c'est cinq endroits à la fois
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

#### Une garantie qui s'écrase elle-même
Chaque affaire doit contenir au moins un indice que PF sait lire
(`expert`) et un que Thibaut comprend (`social`). Quand aucun indice
NEUTRE n'était disponible, le code de garantie écrasait la dernière
case du tirage — y compris celle que le passage précédent venait de
remplir. Avec treize indices ça ne se voyait jamais ; avec cinquante,
un tirage sur trois repartait avec cinq indices utiles au lieu de six.
Les cases acquises sont maintenant protégées, et on renonce plutôt que
d'écraser. Le symptôme n'apparaissait qu'une fois sur trois : **une
suite lancée une seule fois ne prouve rien sur un tirage aléatoire**.

#### Une correction appliquée à moitié laisse le défaut vivant

J'ai retiré le « rappel écrit » des prompts de héros parce qu'il
contredisait l'image de référence. Une heure plus tard, il était toujours
dans les cinq prompts de méchants et les quatre de mouvements — je n'avais
corrigé que là où le défaut s'était manifesté.

Conséquence mesurable : dix-sept fichiers de prompt pour onze planches
réelles, les doublons n'existant QUE parce que ce rappel les
différenciait. Une fois retiré partout : onze fichiers.

C'est la même famille que « un contrôle écrit pour UN cas laisse passer
tous les autres », et c'est la troisième fois de la séance. **Après avoir
corrigé quelque chose, chercher le même motif ailleurs — par `grep`, pas
de mémoire.**

#### Un test qui DÉDUIT au lieu de LIRE tombe à chaque renommage

Un test vérifiait que chaque prompt a son image de référence, en
déduisant le personnage du nom de fichier. Il est tombé quatre fois pour
la même idée : `thibaut.txt`, puis `thibaut-1.txt`, puis `heros-1.txt`,
puis `mechants.txt`.

Le prompt ÉCRIT la référence qu'il faut joindre. Lire cette ligne est la
seule source qui ne mente pas. Un nom de fichier est une description, et
une description est lossy — c'était la leçon des prompts eux-mêmes, elle
valait aussi pour leurs noms.

#### Un rappel écrit à côté d'une image finit par la contredire

Les prompts en mode référence portaient deux lignes de « rappel de
contrôle » — « polo vert, jean bleu, cheveux bruns ». Elles venaient de
la fiche du personnage, qui décrit UNE tenue.

Le jour où le niveau 1 a reçu sa propre référence, en tenue de rue, le
rappel s'est mis à décrire le polo du bar sous une image en blouson. Un
texte qui contredit son image : exactement le défaut qu'une référence est
censée supprimer.

Je l'avais pourtant écrit deux jours plus tôt — « ne PAS redécrire le
personnage à côté de l'image » — et j'avais gardé deux lignes « juste pour
contrôler ». **Une exception à une règle qu'on vient de poser est presque
toujours la règle qui revient par la fenêtre.**

Conséquence heureuse : sans ce rappel, le texte devient IDENTIQUE pour les
deux héros. Un seul prompt par niveau au lieu de deux, et ce qui les
distingue est l'image jointe — ce qui est la bonne façon de le dire.

#### Une image par variante bat une bascule dans le texte

Le niveau 1 habille les héros autrement que le bar. Première solution :
garder une seule référence et écrire dans le prompt « la référence ne
fait pas foi sur les vêtements, voici le costume ». Deux consignes qui se
marchent dessus — et le premier essai se contredisait littéralement deux
lignes plus bas, parce que j'avais rapiécé le texte par des
remplacements de phrases au lieu d'écrire un mode entier.

La bonne solution est arrivée avec les planches : **une image de
référence par TENUE**, numérotée, et chaque prompt écrit le nom de celle
qu'il faut joindre. Plus de bascule, plus de contradiction possible.

Corollaire : quand un texte doit dire « sauf que », se demander s'il ne
manque pas une donnée. Ici il manquait une image.

#### Un contrôle écrit pour UN cas laisse passer tous les autres

Le prompt du niveau 2 demandait 5 poses sur 11. J'ai corrigé, et écrit un
test — qui ne vérifiait que le niveau 2. Thibaut a demandé le lendemain
si le niveau 3 avait bien ses verres : il demandait 9 poses sur 16, et
ignorait TOUT ce qui touche au verre, c'est-à-dire le cœur du niveau.

Mon test n'aurait jamais vu ce défaut. Il était écrit pour le cas que je
venais de corriger, pas pour la classe de défauts à laquelle ce cas
appartient.

**Après avoir corrigé un défaut, se demander où le même défaut peut
exister ailleurs — et écrire le test pour LÀ, pas pour ICI.** Le test est
désormais générique : il tire les poses attendues du code, niveau par
niveau, et les compare aux prompts.

Même séance, même famille : trois tests différents ont dû être repris
parce qu'ils ouvraient `n3/thibaut.txt` alors que la scène venait d'être
scindée en deux fichiers. Une aide unique de lecture a remplacé les trois
corrections, et évite la quatrième.

#### Un prompt de planche se vérifie contre ce que le CODE consomme

Le prompt du niveau 2 demandait cinq poses. Le jeu en charge onze : il
oubliait l'écoute, l'interrogatoire, le carnet, l'accusation, l'esquive
et le splat de tarte — dont trois n'existent qu'à ce niveau.

Une planche générée dessus aurait été à moitié inutilisable, et on ne
s'en serait aperçu qu'au découpage, après avoir attendu la génération.

La liste des poses d'un prompt ne se rédige pas de mémoire : elle se
compare à celle que le code charge. Un test le fait désormais, et il tire
les noms attendus du CODE et non d'une liste recopiée — une liste
recopiée aurait le même défaut que le prompt qu'elle vérifie.

Corollaire : quand la liste dépasse neuf poses, la scène se déclare
scindée et le générateur produit deux planches, en écrivant dans chacune
qu'il faut joindre la même référence.

#### Une heuristique de mesure se vérifie sur un cas où l'on connaît la réponse

Mon contrôleur signalait « les têtes varient de 32 % » sur une planche
dont les hauteurs allaient de 440 à 453 pixels — donc parfaitement à
l'échelle. La faute était dans la mesure : je prenais la médiane de
largeur des 18 % supérieurs de chaque pose, ce qui compte un BRAS LEVÉ
comme une tête.

La bonne mesure est le plus long segment CONTINU de chaque ligne : un
bras tendu à côté du crâne forme un segment séparé, plus court. Après
correction : 10,2 % au lieu de 32 %, sous le seuil.

Ce que ça enseigne sur l'outillage : **un contrôle qui signale un défaut
qui n'existe pas est pire qu'une absence de contrôle**, parce qu'il
apprend à ignorer ses alertes. Chaque heuristique doit être essayée sur
un cas dont on connaît la réponse — ici, des poses dont on a mesuré à la
main qu'elles étaient à la même échelle.

Même famille, même séance : le contrôleur ne voyait que 3 poses sur 10
parce qu'il cherchait les colonnes sur l'image ENTIÈRE, alors que la
planche avait deux rangées de cinq — les sujets d'une rangée se
superposent à ceux de l'autre. Détecter les rangées d'abord.

#### Un contrôleur doit MESURER ce qu'il contrôle, pas le supposer

Mon contrôleur de planche cherchait un fond `#FF00FF`. Les planches
arrivent en capture d'écran : le magenta y est à (216, 2, 213), mesuré.
Le seuil en dur comptait donc **le fond lui-même** comme du rose
parasite — 98 % du contour signalé sur une planche parfaitement saine.

Deux corrections, et la seconde n'était pas évidente :
- la couleur du fond se MESURE sur les bords de l'image ;
- l'image se RECADRE d'abord sur la zone colorée, parce qu'une capture
  d'écran porte des bandes noires qui faussent tous les contrôles de
  bord et de proportion.

Un outil de contrôle qui suppose ses entrées parfaites ne sert que dans
le cas où on n'en a pas besoin.

#### Une image de référence bat une description écrite

Le t-shirt de BruHell a changé entre deux planches. Rien dans le texte
n'avait bougé : c'est le texte lui-même qui avait été relu et
réinterprété. Une description écrite est lossy par construction — chaque
lecture est une reconstruction.

D'où la règle : **le texte sert à CRÉER, l'image sert à REPRODUIRE.**
Premier contact, on décrit ; ensuite, on montre.

Trois précautions apprises en le posant :

- La référence se FABRIQUE depuis les sprites du jeu, pas depuis la
  planche d'origine. Entre les deux il y a eu des redécoupages, des
  réparations de trous, des recadrages : la planche d'origine ne montre
  plus ce que le joueur voit.
- Fond gris neutre. Ni magenta — on ne veut pas qu'il soit recopié comme
  un élément du personnage — ni blanc, qui écrase les vêtements clairs.
- **Ne PAS redécrire le personnage à côté de l'image.** Une description
  complète entre en concurrence avec la référence, et le générateur
  tranche au hasard. Deux lignes de rappel suffisent, formulées comme un
  contrôle à confirmer et non comme une consigne.

#### Un outil que l'autre ne peut pas lancer ne lui sert à rien

J'ai construit un générateur de prompts en ligne de commande, l'ai
présenté comme la solution aux allers-retours, et Thibaut a répondu :
« je peux donc coller le .md dans mon générateur ? »

Deux erreurs dans la même livraison. `PROMPTS.md` ressemble à un prompt et
n'en est pas un — c'est de la documentation, et le coller noierait le
générateur d'images. Et surtout, `planches.py` demande un terminal :
Thibaut travaille depuis son téléphone. L'outil était utile à MOI.

La correction : pré-générer les textes et les déposer dans `prompts/`, un
fichier autonome par planche, du texte brut à copier tel quel.

Règle à garder : **avant de livrer un outil, se demander qui l'exécute.**
Si c'est l'autre, il doit pouvoir le faire dans SON environnement — et son
environnement n'est pas le mien. Un script est une réponse pour moi ; pour
lui, la réponse est un fichier prêt.

#### Un prompt écrit à la main dérive, un prompt assemblé non

Quatorze prompts de planche vivaient dans PROMPTS.md, chacun avec sa
propre copie des règles communes. Trois conséquences, toutes constatées
et toutes coûteuses :

- **les règles divergent.** Un prompt rappelle l'espacement, le suivant
  l'oublie, celui d'après invente une autre formulation.
- **le vocabulaire de pose est réinventé** à chaque planche. C'est ainsi
  qu'une course est née avec la même jambe devant sur toutes ses phases :
  personne n'avait jamais écrit ce qu'était une phase de foulée.
- **le physique d'un personnage est ressaisi** et change. Le t-shirt de
  BruHell a été redessiné entre deux planches pour cette raison.

La correction est la même que pour le code : on n'écrit plus l'artefact,
on l'ASSEMBLE depuis des morceaux qui n'existent qu'à un exemplaire —
un catalogue de mouvements, une fiche par personnage, un bloc de règles.

#### Un contrôle « à l'œil, après coup » n'est pas un contrôle

PROMPTS.md listait cinq vérifications à faire de tête sur une planche
livrée. Elles se faisaient irrégulièrement, et souvent APRÈS le
découpage — donc trop tard.

Trois des cinq étaient mesurables par un programme, et une quatrième —
l'alternance des jambes dans un cycle — n'avait même pas été imaginée.
`planches.py verifier` les fait toutes en une commande, avant découpage,
et refuse de conclure tant qu'un point cloche.

La preuve que ça valait le coup : lancé sur une planche reconstituée à
partir des poses existantes, il retrouve seul le défaut de foulée que
trois séances de réglage n'avaient pas expliqué.

Règle générale : **un contrôle qui dépend de la vigilance humaine finit
par ne plus se faire.** S'il est mesurable, il doit être une commande.

#### Vérifier que les phases d'un cycle sont VRAIMENT différentes

J'ai corrigé la cadence d'une foulée, mesuré 2,8 cycles par seconde, et
livré. Thibaut a répondu : « mais c'est toujours la même jambe qui
avance ? »

Il avait raison. Mesuré ensuite, pose par pose : `course1` et `course2`
ont les pieds au MÊME endroit — 172 pixels tous les deux — et aucune des
quatorze poses du personnage n'a la jambe opposée en avant. Ce ne sont pas
deux phases, c'est deux fois la même. Aucune cadence ne peut créer une
alternance absente des images.

Le signe que j'avais sous les yeux et que je n'ai pas lu : la différence
entre les deux images était de **5,2 %**. J'ai noté le chiffre, je l'ai
utilisé pour expliquer pourquoi une alternance rapide se lit comme du
figé — et je n'ai pas posé la question évidente : cinq pour cent, est-ce
assez pour deux phases de course ? Non. Deux phases opposées changent
tout le bas du corps.

**Un chiffre mesuré ne sert à rien s'on ne lui pose pas la bonne
question.** Avant de régler la cadence d'un cycle, vérifier que ses phases
diffèrent — et pour une foulée, cela se vérifie sur la position des PIEDS,
pas sur une différence globale de pixels.

Corollaire posé en même temps : le nombre de phases se compte dans les
DONNÉES déclarées, jamais dans les images chargées. Ma première version
comptait `Images.table` — faux deux fois : la suite de tests n'a aucune
image, et en jeu les images arrivent en vagues, donc la foulée aurait
dépendu de la vitesse du réseau.

#### Une animation trop RAPIDE se lit comme une animation bloquée

Signalé comme « ça reste quasi sur la même pose ». La cause était
l'inverse : la course alternait ses deux poses quatorze fois par seconde,
soit sept cycles — presque trois fois une vraie foulée.

Deux images qui ne diffèrent que de 5,2 % (mesuré) alternées à cette
vitesse ne produisent pas un mouvement : elles produisent un scintillement
que l'œil moyenne en une image floue et immobile. Le symptôme ressemble à
un compteur bloqué, on cherche donc du côté de l'incrément — et il va
très bien.

**Avant de chercher pourquoi une animation ne bouge pas, MESURER sa
cadence.** Une foulée humaine fait 2,5 à 3 cycles par seconde ; au-delà
de 4, ça vibre.

Corollaire sur l'outillage : le harnais ne rendait que des images fixes,
donc ne pouvait pas montrer ce défaut. Il rend désormais huit images
consécutives côte à côte.

#### Deux poses ne suffisent pas seules : le reste doit bouger

Un cycle de course à deux images est pauvre par construction. Ce qui le
sauve n'est pas une troisième image mais le mouvement AUTOUR : un sursaut
vertical et une inclinaison, tous deux accrochés à la MÊME phase que la
pose.

Deux détails qui font la différence :
- l'amplitude doit être visible. 0,008 de hauteur d'écran fait trois
  pixels sur un téléphone : autant ne rien faire. 0,020 se voit.
- la fréquence doit suivre la pose, à deux battements par cycle — un par
  contact de pied. Un sursaut à une fréquence indépendante ajoute du
  bruit au lieu du mouvement.

Et l'inclinaison pivote sur les PIEDS : au centre, les pieds passent sous
le sol d'un côté et flottent de l'autre.

#### Une animation qui ne se voit pas passe pour une mécanique cassée
L'équipier tirait vraiment pendant le rechargement — munitions
consommées, ennemis qui tombaient — mais `poseHeros` ne donnait la pose
de tir qu'au héros ACTIF. Il restait au repos, et le joueur en concluait
que la fonction ne marchait pas. Une mécanique invisible est une
mécanique absente.

#### Le meilleur calage ne remplace pas un tour de parole
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

#### Trois pièges dans une file à tour de parole
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

#### Un calage ne vaut que s'il connaît TOUT ce qui est à l'écran
Le calage des bulles était juste, et l'écran restait un fouillis :
il ne connaissait que les bulles. Le badge (« SUSPECT ! », « SPLAT ! »)
est dessiné au centre à H*0,30, en plein milieu de la zone des bulles,
et les plaques de nom au-dessus des têtes — ni l'un ni les autres
n'entraient dans le calcul. Le calage part maintenant d'une liste
d'`obstacles()` qui décrit ces boîtes dans la même convention, et les
bulles les évitent comme elles s'évitent entre elles. Corollaire : deux
étiquettes pour la même bouche, c'est une de trop — une personne qui
parle n'affiche plus sa plaque de nom, sa bulle le fait.

#### Le drapeau qui annulait le repli
Dans la boucle de remontée, atteindre le plafond faisait `break` en
laissant `libre` à vrai : le repli latéral, écrit et relu plusieurs
fois, **ne s'exécutait jamais** — les bulles restaient l'une sur
l'autre et le bug a survécu à deux corrections. C'est le harnais
d'aperçu qui l'a montré, pas la relecture. Le plafond lève désormais
son propre drapeau (`plafonne`), et c'est lui qui déclenche le repli.

#### Une file de dialogue FIFO retient les réponses
`majDialogue` tirait les répliques dans l'ordre d'insertion. Une
réponse de témoin insérée à 1,1 s restait donc coincée **derrière**
une déduction programmée à 4 s : la question restait sans réponse
pendant quatre secondes, et le test ne rougissait qu'un tirage sur
huit — quand la fouille précédente avait laissé traîner sa salve. On
tire par échéance, pas par ordre d'arrivée.

#### Une cadence fixe ne lit pas
Les répliques partaient toutes les 1,5 s et vivaient 2,2 s, quelle que
soit leur longueur : les longues disparaissaient avant la fin de la
lecture. `dureeLecture()` étire la durée ET l'espacement dans une même
salve — entre salves, chacune garde son départ, une réponse de témoin
n'attend pas un vieux bavardage, les bulles s'empilent pour ça.

#### Une propriété qui écrase une méthode
`Tournee` avait un compteur `pas:0` (les foulées) ET une méthode
`pas(dt)`. Dans le littéral, la méthode gagnait ; mais `lancer()`
faisait `this.pas = 0` et **remplaçait la méthode par un nombre** au
premier lancement — `Tournee.pas is not a function`, au premier test.
Le compteur s'appelle `foulee`. Dans un objet-module dont la boucle
s'appelle `pas`, aucun état ne doit s'appeler `pas`.

#### Aucun chemin tactile vers la fin de partie
L'accusation n'était liée qu'à la touche `A`, et son mode d'emploi
n'apparaissait qu'à l'intérieur du dossier. Sur téléphone, on pouvait
réunir les six indices sans **aucun** moyen de conclure. La règle qui
s'en dégage : toute action qui termine une partie doit avoir un bouton
visible en permanence, éteint tant qu'elle est indisponible, et qui dit
ce qui manque. Une commande au clavier n'est jamais un chemin, c'est un
raccourci.

#### Une méthode de rendu posée dans le mauvais objet ne se voit qu'à
l'exécution

J'ai inséré `dessinerAnnonce` en m'ancrant sur `razViseur`, qui appartient
à `Ruelle` et non à `RuelleVue` : la syntaxe passait, les tests passaient,
et le harnais est tombé sur « this.dessinerAnnonce is not a function ».
Une ancre d'insertion doit être choisie DANS l'objet visé, pas à sa
proximité dans le fichier.

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

Tenu à jour à chaque livraison. Une entrée qui disparaît d'ici sans avoir
été faite est une promesse perdue — c'est arrivé pour le tableau
d'enquête, resté quarante versions sans que personne y revienne.

### Demandé et pas encore fait

- **Le menu de sélection des personnages** du niveau 3 : Thibaut le
  trouve peu lisible et « cheap ». Demandé plusieurs fois, jamais
  commencé. C'est le seul point de sa liste qui reste entier.
- **Les deux phases de foulée `course3` et `course4`** : mesuré,
  `course1` et `course2` ont les pieds au MÊME endroit et aucune pose n'a
  la jambe opposée en avant. La foulée ne peut donc pas alterner, quelle
  que soit la cadence. Le code est prêt — il compte les phases dans
  `POSES_BAR` — et le prompt est écrit dans `PROMPTS.md`. Il ne manque
  que les images.
- **`esquive` et `splat` au niveau 1.** Le niveau lance des tartes — le
  mot y apparaît quarante-cinq fois — mais aucun sprite ne dit ce qui
  arrive quand elle touche : `poseHeros` renvoie « surpris », la MÊME
  pose que pour l'esquive, la fin de partie et une interpellation. Quatre
  situations sous une seule image. Le prompt les demande désormais ;
  quand les fichiers arriveront, il restera à les ajouter à
  `POSES_HEROS` et à distinguer les deux cas dans `poseHeros` — `splat`
  si `h.tarte > 0`, `esquive` si `h.esquive`.
- **La pose `serie` de Jojo** montre une passoire au lieu de la série de
  shots prête. La bonne pose est dans la rangée chorégraphiée de sa
  planche, mais celle-ci a un comptoir et un cadre blanc qui gênent la
  détection.

### Écrit dans la conception, jamais construit

- **Le tableau d'enquête et la reconstitution chronologique.** L'asset
  est découpé depuis longtemps ; la mécanique n'existe pas. L'accusation
  se fait sur une liste de suspects, sans avoir à désigner les indices
  qui la soutiennent. C'est le plus vieux manque du projet.
- **Risoto** est interrogeable mais ne se déplace pas.
- **Les allées et venues du bar** : les figurants forment des grappes et
  se baladent, mais personne ne quitte le bar pour de bon ni n'y entre.

### Su et assumé

- **Aucune mesure de performance sur appareil réel.** Le nombre de
  particules est plafonné au jugé (90), pas mesuré sur un iPhone.
- **L'équilibrage du niveau 2** — cinq minutes, six indices sur seize
  meubles — est un pari, pas une mesure.
- **La licence de l'enregistrement de grognements** (Freesound 745360)
  n'a pas été vérifiée. Si elle demande une attribution, elle doit
  figurer quelque part.
- **Le jeton GitHub a transité par la conversation** à plusieurs
  reprises. Il doit être régénéré.

### Ce que les tests ne couvrent pas

À savoir avant de faire confiance à une suite verte.

- **Le temps qui passe.** Aucun test ne simule « rien ne se produit
  pendant une seconde ». C'est ce trou qui a laissé partir en production
  un voile qui ne se levait jamais.
- **Le navigateur.** Rotation, repli de la barre d'adresse,
  `requestAnimationFrame` en arrière-plan : rien de tout ça n'est
  observable ici. Ces états demandent un raisonnement explicite et jamais
  un seul mécanisme.
- **Le nombre de tests doit être STABLE.** S'il varie d'une exécution à
  l'autre, c'est qu'une vérification dépend d'un tirage et ne s'exécute
  pas toujours. Mesuré une fois : 692 ou 689 selon le hasard, corrigé en
  forçant le tirage.
- **L'oreille.** Les sons sont vérifiés décodables, non silencieux, non
  saturés, de timbres distincts — jamais écoutés.
- **Le rendu**, sauf par le harnais d'aperçu, et seulement pour les
  scènes qu'on a pensé à y ajouter.
