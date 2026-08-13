# LES ENQUÊTES DE CALLAGHAN

Trois niveaux, un seul fichier, jouables au doigt.

Qui est qui ? Les fiches complètes des personnages — traits, liens,
sprites, apparitions — sont dans **PERSONNAGES.md** : c'est la
référence à consulter avant d'écrire un niveau ou une réplique.

| | |
|---|---|
| **01 · La file du D'Tour** | Saluez tout le monde devant le bar, avant que ça devienne gênant. |
| **02 · L'enquête de la pizza** | Fouillez l'appartement, réunissez six indices, cinq minutes. |

On choisit le niveau sur l'écran d'accueil, les deux sont toujours
ouverts, et on peut mettre en pause à tout moment pour reprendre,
recommencer, ou revenir au menu.

**Adresse** : https://thibautgras.github.io/jeuduo/callaghan/
(l'ancienne, `/callaghan/`, redirige et le restera)

Pierre-François et Thibaut font la queue devant Le D'Tour. Les gens qui
longent la file leur tendent la main comme s'ils les connaissaient. Il
faut saluer avec le bon héros, assez vite. Trois ratés et c'est fini.

Thibaut, c'est le brun au polo vert. **PF** — Pierre-François — c'est le
chauve à lunettes. La planche fournie les annonçait dans l'autre sens ;
les fichiers de `img/` portent les bons noms.

> Ils ne les connaissaient même pas.

## Niveau 2 — l'enquête de la pizza

Les trois niveaux sont **toujours** jouables : on choisit celui qu'on
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

**L'esquive de la tarte** (corrigée en v6.5). Le bouton d'action devient
« ESQUIVER ! » dès qu'une tarte arrive — mais il se grisait dans la même
passe, parce qu'aucun meuble n'était à portée. On voyait un bouton mort
au moment précis où il fallait appuyer, et l'esquive est restée
injouable une version entière. L'invite passe désormais devant : elle ne
s'éteint jamais. Et la fenêtre est passée de 0,45 s à **0,62 s** — au
pouce, un tiers de seconde ne suffit pas.

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

**Trente-trois affaires écrites** qui se servent de ces liens : la pizza mise de
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
| **GABI** — couloir | Colocataire, sœur de celle qui lance des tartes, et belle-sœur de Pierre-François. |
| **RISOTO** — au sol | Le chat. Il ne dira rien, mais il laisse des traces. |

Ils sont aussi dans le **niveau 1**, mais filtrés par leur pose : les
six qui tiennent **debout et entiers** font la queue — Gabi, Mathilde,
Francky, Jojo, Marini et Martin. Teo est assis par terre sur son sprite
et Charles n'a pas de jambes : ils ne peuvent pas marcher, alors ils
tiennent la terrasse du D'Tour. Leurs sprites les montrent
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

**On voit qui parle.** Trois papiers : **blanc** avec un liseré de
couleur pour les inspecteurs — vert Pierre-François, bleu Thibaut —
**crème** signé du nom pour les gens de la maison, **mauve** pour ceux
qui ne font que passer. Auparavant tout sortait de la même bouche et
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

**Les inspecteurs raisonnent à voix haute** (v5.0), et le raisonnement
appartient à l'affaire, pas à l'indice :

- **Chaque affaire lit ses trois indices porteurs à sa façon.** Trouver
  le billet dans « la dette » donne « Ce n'est pas un oubli. C'est un
  paiement. » ; le trouver dans « le comptage » donne « Quelqu'un a payé
  SA part. Au centime. » Le garnissage garde son écho générique : une
  fausse piste ne mène nulle part, c'est le but.
- **À deux indices, la première théorie** — fausse exprès. Thibaut
  propose l'absurde (« Le tabouret a mangé la pizza. Non ? Bon. »),
  Pierre-François corrige et remet l'enquête sur ses rails. La piste
  sérieuse arrive au quatrième indice, comme avant.
- **Thibaut oppose le dossier aux gens.** Chaque indice trouvé rouvre
  les entretiens : une confrontation par personne et par indice, les
  porteurs d'abord. L'innocent referme la piste (« Je m'essuie
  lentement. C'est toute une éducation. »), le témoin clé s'enfonce
  d'un demi-aveu. Le premier passage reste à l'anecdote, et le chat ne
  répond qu'à ses sujets — il ne parle pas.
- **Le témoin clé craque par paliers.** À trois indices il en dit trop,
  à cinq il ne tient plus — quel que soit l'inspecteur : c'est le
  dossier qui met la pression, pas la question.
- **Le dossier pense.** Sous les cartes, une ligne « CE QU'ON EN
  PENSE » suit le raisonnement : l'hypothèse, puis la piste, puis la
  contradiction. On sait toujours où en sont les têtes.

Les prompts qui servent à fabriquer toutes ces images sont réunis dans
****, avec les règles apprises à chaque planche ratée.

**Les champions du bar ont quatorze poses** (v6.23) : marche à quatre
temps, course à deux, et la descente en quatre gestes — il attrape, il
regarde ce qu'il tient, il boit, il reste avec le verre vide. C'est ce
dernier temps qui donne son poids à la lenteur de Thibaut. Sur l'écran
de choix, le champion sélectionné lève son verre pendant que l'autre
attend.

**Neuf poses assises en réserve** (v6.21). Teo et Charles s'en servent
déjà — l'un avachi sur le canapé, l'autre attablé —, les sept autres
attendent les places génériques de l'appartement. Elles ont été
découpées à partir d'une planche où chaque personnage figurait AUSSI
debout : c'est cette pose debout qui a donné le facteur d'échelle, au
lieu de le deviner.

**Le jeu démarre sans tout attendre** (v6.19). Le chargement se fait en
deux vagues : la première — le commun, le décor et les gens de la file,
plus les trois vignettes et le fond du titre — est la seule qui bloque
l'écran de chargement. L'appartement et le bar arrivent en tâche de fond
pendant qu'on choisit son niveau, et si on va plus vite que le réseau,
l'écran de chargement revient le temps qu'il faut plutôt que d'afficher
des trous noirs. Environ 2,3 Mo de moins à attendre au premier
lancement.

**Le décor du niveau 1 annonce sa ligne de sol** (v6.18) : le trottoir
dégagé est à 88 % de la hauteur de l'image, et `ANCRE_FOND_Y` l'aligne
sur la ligne où marchent les gens. Les trois moments — jour, soir, nuit —
partagent le même cadrage au pixel et sèment des clins d'œil aux autres
niveaux : l'ardoise des cocktails de Francky, l'affiche de LA CHORIZO,
la règle n°1 sur Hortense, l'avis du maire Marini, la gamelle de Risoto,
le carton à pizza dans la poubelle et le chat roux endormi au premier
étage.

**Le bras peint n'existe plus** (v6.15). Vingt-huit clients dans la file,
les deux héros redessinés en huit poses, et **plus personne n'a besoin
d'un bras tracé au code** : `releverTeintes()` et `dessinerBras()` sont
supprimées, avec la copie dupliquée du calcul qui vivait dans le harnais.
Les habitants du quartier ne font plus la queue — c'était la seule raison
qui restait de peindre un bras — mais ils gardent la terrasse,
l'appartement du niveau 2 et le bar du niveau 3. L'ancrage horizontal des
sprites, lui aussi relevé sur l'image autrefois, vaut désormais 0,5 par
construction : le pipeline de découpe met le centre des pieds au milieu.

**La file est repeuplée** (v6.14). Des clients à cinq poses chacun : ils attendent, ils **marchent vraiment** (deux temps, au lieu du
faux rebond appliqué à une image figée), et leur bras qui se tend pour
serrer est **dessiné**, plus peint par le code. 651 Ko pour 80 images, et
une définition quatre fois supérieure aux anciens sprites de 44 px.

Le bras peint survit pour les habitués du quartier — Gabi, Mathilde, le
maire, Martin, Francky, Jojo — qui n'ont pas encore de planche de file :
`aBrasDessine()` choisit l'un ou l'autre, et le jour où tout le monde
aura son bras, `releverTeintes` et `dessinerBras` disparaîtront.

**Une pause sur tous les niveaux** : un bouton discret en haut à droite,
avec REPRENDRE, RECOMMENCER et MENU PRINCIPAL. Il existait dans le code
depuis des versions **sans une seule ligne de style** — bouton nu dans le
flux du document, panneau en texte brut : la fonction était là, personne
ne pouvait s'en servir.

**L'Abbé et BruHell entrent dans la rue** (v6.64) : leurs planches de
base sont découpées, treize poses chacune, et une **septième horde**
mélange enfin les cinq — c'est celle qui pose la question du document de
conception : qui tuer en premier ?

Leur mécanique de lancer n'est pas encore dessinée. Plutôt que de les
garder sur une étagère, ils prennent une place que personne ne tenait :
les **fragiles**. L'Abbé arrive vite (0,150) pour 70 points de vie et une
tête à 1,60 ; BruHell tient un peu mieux. Ce sont ceux qu'on abat en
premier quand la rue se remplit. Une table `ENNEMIS_INCOMPLETS` dit qui
attend quoi, et un test la récite — un ennemi à moitié fini est nommé,
pas oublié.

**Deux fichiers d'image étaient VIDES** — zéro octet — écrits par une
réparation interrompue en plein vol. Rien ne les signalait : la suite Node
ne lit que l'en-tête WebP de quelques images. Le contrôle Python ouvre
désormais TOUS les fichiers et rend un code non nul sur le premier
illisible. Il en a trouvé un second dans la seconde qui a suivi.

**La foulée du bar** (v6.93) : la cause était l'inverse de ce qu'on
croit en la voyant.

L'animation ne restait pas bloquée — elle allait **trop vite**. La course
alternait ses deux poses **quatorze fois par seconde**, soit sept cycles,
presque trois fois une vraie foulée. Deux images qui ne diffèrent que de
5 % alternées à cette vitesse ne se lisent pas comme une course : elles
se lisent comme une vibration, donc comme du figé.

Cadence ramenée à **2,8 cycles par seconde**, celle d'un homme qui court.

**Et comme il n'y a que deux poses de course, le reste doit bouger.** Le
sursaut existait déjà mais faisait 0,008 de hauteur — trois pixels sur un
téléphone, invisible — et battait à une fréquence sans rapport avec la
pose affichée. Il est passé à 0,020, accroché à la **même phase** que la
pose, à deux battements par cycle : un par contact de pied. S'y ajoute
une inclinaison vers l'avant, qui pivote sur les **pieds** — pivoter au
centre ferait passer les pieds sous le sol d'un côté.

**Une scène d'aperçu rend huit images consécutives côte à côte.** Une
animation ne se juge pas sur une image fixe : c'est la suite qui dit si
ça court ou si ça vibre. Le harnais ne savait pas faire ça.

**Un dossier par jeu** (v6.92) : `duo/` et `callaghan/`. La racine ne sert
plus un jeu mais le **choix** entre les deux — avant, elle servait DUO, ce
qui faisait croire que le dépôt ÉTAIT DUO et que Callaghan en était un
sous-produit.

**Rien ne casse.** `dtour/` reste en place et ne contient qu'une
redirection : c'est une adresse posée sur des écrans d'accueil et envoyée
à des gens, la casser pour une question de rangement serait absurde.

**Et les clés de stockage n'ont PAS suivi le renommage.**
`dtour_progres` et `dtour_records` sont écrites dans le navigateur des
joueurs : les renommer aurait effacé leur progression, sans erreur ni
message. Une clé de stockage est un contrat avec le passé, pas un nom de
variable. Deux tests le tiennent.

**Callaghan a son manifeste et ses icônes** (v6.91).

En vérifiant que les deux jeux étaient bien séparés, j'ai trouvé un
manque plutôt qu'un couplage : Callaghan déclarait son titre
d'application — « CALLAGHAN » — mais **n'avait ni manifeste ni icône**.
Ajouté à l'écran d'accueil d'un iPhone, il sortait sans image. Le
manifeste de la racine appartient à DUO et ne le concerne pas.

Les icônes sont découpées dans son propre visuel : les deux visages du
duo, cadrés serré pour rester lisibles en petit.

**Pas d'orientation figée dans le manifeste**, et c'est délibéré : les
trois premiers niveaux se jouent en paysage, la ruelle en portrait. La
figer casserait l'un des deux. Un test le verrouille.

**Et la séparation est mesurée, pas supposée** : aucun morceau de
Callaghan ne renvoie vers `../`, la racine ne mentionne jamais `callaghan`.
Un test le tient — le jour où l'un emprunterait un fichier à l'autre, on
ne pourrait plus toucher au premier sans casser le second, et rien ne le
signalerait.

**La documentation du dépôt est rangée** (v6.90).

**Le dépôt contient DEUX jeux** — DUO à la racine, Callaghan dans
`callaghan/` — et `CLAUDE.md` décrivait le premier tout en donnant les
commandes du second. Quelqu'un qui arrivait dessus croyait travailler sur
un jeu de Pong. Il est devenu la **porte d'entrée du dépôt** : ce qui
vaut pour les deux, et un tableau qui renvoie chacun à ses documents.

**`callaghan/CLAUDE.md` est né** : les commandes de Callaghan n'existaient
nulle part de façon consultable. L'architecture des morceaux, le cycle en
sept étapes, les douze scripts d'outillage et ce qu'ils font, les
contraintes à ne pas casser.

**Les contraintes propres à DUO** — un seul fichier, PeerJS, le terrain
de 540 × 720, le miroir Netlify — ont rejoint sa mémoire, où elles ont
leur place.

**La section « ce qui n'est pas fait » est refaite** et rangée en quatre
catégories : demandé et pas commencé, écrit dans la conception mais
jamais construit, su et assumé, et ce que les tests ne couvrent pas.
Elle datait de quarante versions.

**Et un défaut trouvé en route.** Le nombre de tests VARIAIT d'une
exécution à l'autre — 692 ou 689 environ une fois sur six. Quatre
vérifications sur la contradiction ne s'exécutaient que si l'affaire
tirée au sort avait un coupable. Un test qui ne s'exécute pas ne protège
de rien, et la suite reste verte. Le tirage est maintenant forcé, et
l'échec de la mise en place est lui-même un test. **Un nombre de tests
qui bouge est un signal, pas du bruit.**

**La mémoire du projet devient un document de relecture** (v6.89).

Les **137 pièges** y étaient empilés dans l'ordre où ils sont arrivés :
le bon ordre pour les écrire, le mauvais pour les lire. Personne ne relit
137 entrées avant de coder, et on ne pouvait pas consulter « ce que je
dois savoir sur les images » puisque c'était éparpillé sur mille lignes.

Ils sont désormais rangés en **onze chapitres thématiques**, chacun avec
un chapeau de trois lignes qui dit l'essentiel — mesures, chaîne
d'images, interface, écrans, boucle, contenu, son, équilibrage, tests,
décor, structure. Aucune leçon n'a été perdue : 137 avant, 137 après,
vérifié titre par titre.

S'y ajoutent **trois parcours de lecture** — je reprends après une pause,
je m'apprête à faire quelque chose de précis, je démarre un nouveau jeu —
avec un tableau qui renvoie chaque tâche à son chapitre.

Et une section **« ce qu'on emporterait dans un autre jeu »** : les deux
règles en dur, le harnais d'aperçu, l'édition par remplacement compté,
les tables qui récitent l'inachevé, le repli systématique, et la
discipline du chiffre. Rien de tout cela ne dépend de ce projet.

Deux tests gardent la structure : un chapitre qui disparaîtrait
emporterait ses leçons sans que personne s'en aperçoive.

**Les écrans d'attente annoncent le niveau** (v6.88) : « CHARGEMENT » ne
disait rien, et l'écran de rotation parlait de « la file du D'Tour » quel
que soit le niveau demandé — faux depuis qu'il y en a quatre, et
déroutant quand on venait de lancer la ruelle.

Les quatre noms étaient écrits en dur dans les tuiles du menu et nulle
part ailleurs. Ils sont maintenant à **un seul endroit**, avec pour
chacun la raison de son orientation. Un écran d'attente qui nomme ce
qu'on attend cesse d'être une attente : il devient une annonce.

| niveau | panneau |
|---|---|
| 1 | LA FILE DU D'TOUR — il faut voir la file entière |
| 2 | L'ENQUÊTE DE LA PIZZA — l'appartement se lit en entier |
| 3 | LA TOURNÉE DU D'TOUR — le comptoir est long |
| 4 | LA RUELLE — sa profondeur a besoin de hauteur |

**Un défaut trouvé en vérifiant** : le niveau 4 affichait le texte du
niveau 3. Il se joue en portrait, donc il ne bloque jamais l'écran, et le
panneau gardait le texte du dernier niveau qui l'avait bloqué. **Un
panneau caché doit dire vrai** — il peut réapparaître à la rotation
suivante.

**UNE RÈGLE POUR TOUS LES SCINTILLEMENTS** (v6.87) — et tu avais raison
de me le demander : je les corrigeais un par un, ce qui garantissait d'en
laisser passer.

Le problème était toujours le même. À chaque passage d'un écran à un
autre — chargement vers affiche, affiche vers choix, choix vers jeu,
rotation — une ou deux images sont dessinées dans un état intermédiaire :
décor pas encore couvert, taille pas encore ajustée, ancien écran encore
en place.

Désormais, **une seule mécanique** : le jeu donne un NOM à l'écran
courant, et dès que ce nom change, un voile opaque tombe. Il ne se lève
qu'après **deux images** dessinées dans le nouvel état et la taille
stabilisée — la première pose les tailles, la seconde dessine dedans. Le
joueur voit une transition nette d'environ 130 ms au lieu d'un sursaut.

Six écrans sont nommés aujourd'hui : titre, affiche du bar, choix du
champion, tournée, affiche de la ruelle, fusillade. **Ajouter un écran
plus tard ne demandera rien** — c'est là toute la valeur d'une règle
générale : elle couvre aussi les écrans qui n'existent pas encore.

**Plus de scintillement à l'entrée d'un niveau** (v6.86) : et ta
proposition était la bonne — c'est bien le voile de chargement qui règle
ça, à condition de le retirer AU BON MOMENT.

**L'ordre était fautif** : on retirait le voile, PUIS on démarrait le
niveau. Au moins une image était donc dessinée entre les deux — l'ancien
écran, ou le nouveau à la mauvaise taille. Désormais on monte le niveau,
on ajuste le canevas, on laisse **deux** images se dessiner — la première
pose les tailles, la seconde dessine dedans — et seulement là le voile se
lève.

**Et le voile est posé à chaque entrée**, même quand les images sont déjà
en cache. Une transition qui change de forme selon l'état du cache se
remarque : au premier lancement on voyait un voile, au dixième non.

**Avec son propre filet**, parce que je viens d'apprendre la leçon :
`requestAnimationFrame` ne se déclenche pas dans un onglet en
arrière-plan. Un délai de secours lève le voile quoi qu'il arrive. Un
mécanisme unique ne garantit jamais qu'un voile se lève.

**Correction d'urgence : le jeu ne démarrait plus** (v6.85).

Ma correction du sursaut de rotation posait un voile tant que la taille
d'écran n'était pas stable — mais **rien ne relisait cet état une fois
la taille stabilisée**. Le voile n'était levé que par un événement du
navigateur ; s'il n'en venait plus, il restait posé pour toujours et le
jeu ne démarrait jamais.

Deux filets, parce qu'un seul aurait pu retomber dans le même piège :

- une **relecture programmée** au moment où le délai expire, déclenchée
  par le changement de taille lui-même ;
- une **reprise depuis la boucle**, qui tourne même en pause : à chaque
  image, si la seule raison de suspendre était un recalage et que la
  taille est calme, l'état est relu.

La leçon, et elle est générale : **un état qui dépend du TEMPS ne doit
jamais dépendre d'un événement pour être relu.**

**Plus de sursaut après une rotation** (v6.84) : le navigateur MENT sur
la taille. iOS rend des dimensions périmées pendant quelques centaines de
millisecondes après un changement d'orientation, puis la barre d'adresse
se replie et la hauteur change encore — sans émettre de `resize` sur la
fenêtre. Une ou deux images étaient donc dessinées à la mauvaise échelle.

On ne peut pas mesurer mieux, mais on peut savoir **quand la mesure s'est
calmée** : deux cent soixante millisecondes sans changement. Le voile
reste posé pendant ce temps — muet, sans texte, puisqu'il n'y a rien à
demander au joueur — et masque les images intermédiaires. S'y ajoutent
cinq relevés échelonnés après la rotation et l'écoute de
`visualViewport`, seul à signaler le repli de la barre.

**La mémoire du projet a sa synthèse.** Cent soixante-neuf pièges y
étaient consignés un par un ; ils sont maintenant regroupés en **sept
familles d'erreurs** classées par coût, et une liste de ce qui marche et
qu'il faut garder. Y compris deux erreurs de méthode plutôt que de code —
affirmer sans vérifier, et pousser sans relancer les tests après un
rebase.

**Plus de démarcation sur l'affiche** (v6.83) : le rectangle se devinait
autour du duo, et il a fallu trois essais pour comprendre pourquoi.

**Le néon TOUCHE les bords de l'image d'origine** — luminance jusqu'à 246
en bas, mesurée. Il est donc coupé net par le cadre, et cette coupure se
voit quel que soit le mode de composition. J'ai ajouté une marge noire
pour lui laisser de la place, puis une extinction douce dessus.

**L'extinction porte sur la COULEUR, pas sur l'alpha.** Mon deuxième
essai fabriquait un canal alpha depuis la luminance : la zone autour du
duo n'étant pas noire mais gris très foncé, elle devenait semi-opaque et
produisait un voile sombre — pire que le rectangle. Une planche lumineuse
sur noir se compose en ADDITIF, et en additif l'alpha ne sert à rien :
seule compte la couleur, qui doit mourir au bord.

Le fichier n'a donc plus de canal alpha du tout, et un test le vérifie.

**L'affiche du bar réparée** (v6.82) : tes deux captures montraient deux
défauts différents, et ils avaient deux causes différentes.

**Elle ne s'affichait pas au premier lancement.** Elle était peinte à la
FIN du dessin, or l'écran de choix rend la main avant : au premier
lancement on tombait sur le bar et le pupitre sans jamais la voir, alors
qu'au rejeu elle apparaissait. Elle passe maintenant avant tout le reste
— un écran de présentation ne doit dépendre d'aucun autre état.

**Le pupitre se dessinait par-dessus**, boutons éteints en travers du
titre. Et il fallait corriger DEUX endroits : une seconde fonction
rallumait le pupitre sans tenir compte de l'affiche, et c'est elle qui
gagnait puisqu'elle passait en dernier.

**Le duo se compose en ADDITIF, il n'est plus détouré.** Le fond de
l'image est un noir pur : en mode `lighter` il n'ajoute rien et disparaît
de lui-même, tandis que le néon des contours se fond dans la pénombre —
là où un détourage laissait un halo sale. Aucune découpe, donc aucun bord
raté. Il occupe 80 % de la hauteur, avec une bande sombre derrière le
titre.

**Les deux intros attendent le clic** (v6.81) : elles s'effaçaient toutes
seules après 2,6 s à la ruelle et 3,2 s au bar. Le joueur qui lisait
encore se retrouvait en pleine partie sans l'avoir demandé — et le
niveau 4 ne faisait pas exception, contrairement à ce que je croyais.

Elles descendent maintenant jusqu'à un palier et **attendent**. Une tape
lance la sortie ; le quart de seconde de garde reste, pour qu'un doigt
encore posé de l'écran précédent ne l'emporte pas.

**Le bar prend de la profondeur** (v6.80).

**L'écran d'intro du niveau 3 est en PLEIN ÉCRAN**, comme celui de la
ruelle : le duo détouré sur un fond de bar flouté et assombri, le nom du
niveau, l'invite. Posée en clair sur le bar, l'affiche se mélangeait au
décor qu'elle est censée présenter.

**LES FIGURANTS SONT DANS LE BAR, plus sur la caméra.** C'était le défaut
de fond : accrochés à l'écran, ils suivaient le champion comme un décor
peint sur la vitre — on ne les dépassait jamais et le bar semblait tenir
en un seul écran. Quatre grappes réparties sur toute la longueur, dont on
croise les groupes en se déplaçant.

Défaut trouvé en le faisant : six grappes pour dix habitués en laissaient
deux désertes, parce que je remplissais chacune à fond avant de passer à
la suivante. À TOUR DE RÔLE, elles se remplissent toutes — et les
affinités tiennent encore, 46 % de paires amies.

**Les longues répliques se replient sur DEUX LIGNES** au lieu de
rapetisser la police : réduire jusqu'à tenir donnait un texte minuscule
étalé sur toute la largeur, illisible. La coupure se fait sur l'espace le
plus proche du milieu, pour deux lignes équilibrées.

**Le bruit blanc d'ambiance du bar est retiré.** Il datait d'avant
l'enregistrement ; les deux se superposaient en un souffle sourd qui
mangeait les voix. La rumeur enregistrée monte de 0,30 à 0,52.

**Les lumières de la rue vacillent plus franchement** : trois sinus
incommensurables au lieu de deux, amplitude de 10 à 26 %. À l'ancien
réglage on devinait le vacillement sans le voir.

**Jojo enfin d'aplomb, et l'affiche avant le choix** (v6.79).

**LE COMPTOIR N'EST PAS HORIZONTAL.** C'était ça, le bug de Jojo, et il
se mesure : l'arête du plateau est à **0,538 sous Francky et 0,610 sous
Jojo** — sept centièmes de hauteur d'écran d'écart. Le code posait les
deux sur une constante unique à 0,555, donc Jojo flottait au-dessus du
sien. Chaque poste porte désormais SA ligne.

**L'affiche du bar passe AVANT le choix du champion.** Posée après, elle
interrompait le joueur juste après qu'il avait décidé — le pire moment.
Elle se passe d'une tape, avec le même quart de seconde de garde que la
ruelle, et **la musique part dès l'affiche** : un écran de présentation
silencieux se lit comme un chargement.

Défaut trouvé en le faisant : j'ouvrais le choix sur le FRONT de fin
d'affiche. Posé à zéro autrement, le choix ne s'ouvrait jamais et le
pupitre s'affichait sur un niveau pas encore commencé. C'est un état
déduit, maintenant, pas un front.

**Les répliques de combat sont plus rares** : une chance sur cinq et
douze secondes de repos, contre une sur trois et sept. À l'ancien
réglage, une horde de dix morts en lâchait trois ou quatre. Et il ne peut
jamais y en avoir deux à l'écran — un test le vérifie sur une horde
entière qui tombe d'un coup.

**Les pavés s'éclairent, les balles perdues marquent, les méchants ont
un caractère** (v6.78).

**Des flaques de lumière sur les pavés**, à partir du crépuscule. La
route du décor de nuit est à 19 de luminance moyenne — presque noire ;
ce sont elles qui lui rendent de la profondeur. Positions mesurées sur le
décor : les deux lampadaires tombent à x=0,47 et 0,75, l'enseigne du bar
au fond à 0,49. Elles **vacillent**, chacune à son rythme : une lumière
parfaitement stable se lit comme du décor mort.

**Une balle perdue laisse une marque** : étincelles et poussière au point
visé, plus un ricochet aigu et descendant. Sans ça, tirer à côté ne
produisait rien — le joueur ne savait pas s'il avait manqué ou si le jeu
n'avait pas entendu son doigt. Et la gerbe est **plus petite au fond de
la rue** : la perspective vaut pour les ratés comme pour le reste.

**Les héros commentent les morts.** Une chance sur trois, sept secondes
de repos entre deux, et jamais par-dessus une annonce — une phrase à
chaque mort se lit deux fois puis ne se voit plus. Quatre répliques par
méchant, taillées pour lui : « Il niera aussi, tu verras. » « La séance
est levée. » « Le cœur a lâché. »

**Et les cinq ont un caractère écrit.** Le fil commun : ce sont cinq
hommes qu'on a adorés et qui se sont crus au-dessus — un monstre sacré,
un grand argentier, un homme d'Église, un menteur patient, une figure de
la générosité. Chaque mécanique dit quelque chose du personnage : l'ogre
avance par sa masse, l'homme de pouvoir se protège la figure, le menteur
annonce tout ce qu'il fait, l'hypocrite bombarde sans jamais s'approcher.

**La nuit tombe sur la ruelle, et tous les effets arrivent** (v6.77).

**L'heure avance avec les hordes** : le crépuscule à la troisième, la
nuit à la sixième. Le décor dit où on en est de la soirée sans qu'aucun
texte n'ait à le dire — même principe que l'ambiance du bar. Les trois
décors font exactement la même taille, donc la barricade ne bouge pas
d'un pixel d'un décor à l'autre ; un test le vérifie.

**Il fallait éclairer, pas seulement assombrir.** Les deux nouveaux
décors sont à 0,39 et 0,35 de la luminance de celui de jour (mesuré) :
sans rien faire, héros et méchants flottaient sur la nuit comme des
découpes de plein jour. Un voile bleu profond — pas noir, le noir écrase
les couleurs — est posé APRÈS les personnages, donc il les teinte avec le
décor.

**Et le coup de feu éclaire la rue.** C'est l'effet qui justifie la
nuit : en plein jour un tir se voit à peine, la nuit il repeint tout
l'écran une fraction de seconde. L'intensité suit l'heure.

**Tous les effets, dans un seul système** : ajouter une famille coûte une
ligne de gabarit, pas une boucle de plus.

- **Les douilles** sautent vers l'arrière et rebondissent une fois.
- **La fumée** monte et grossit — sans elle, une rafale de six balles ne
  laisse aucune trace.
- **Les éclats de bois** partent de la barricade vers le joueur : c'est
  ce qui fait qu'on encaisse le coup au lieu de le regarder.
- **La gerbe** est courte et sombre, jamais rouge vif, et sa taille suit
  la profondeur — sinon un ennemi au fond éclabousse comme s'il était à
  un mètre. Le jeu est burlesque, pas gore.

Le tout est plafonné à quatre-vingt-dix particules, et **on jette les
plus vieilles** : une explosion qui n'apparaît pas est plus choquante
qu'une fumée qui disparaît.

**Le géant est escorté, BruHell devient l'Enfoiré** (v6.76).

**Le géant n'arrive plus seul.** Seul, il n'y avait qu'à reculer et
tirer : aucune pression, aucun choix. Il vient maintenant avec une horde
ordinaire de huit — seul le premier sorti est géant — et il faut décider
à chaque instant qui coûte le plus cher. C'est exactement la question que
le niveau pose partout ailleurs.

**« BRUHELL L'ENFOIRÉ »**, partout. Les Enfoirés sont le nom de la troupe
des Restos du cœur, et le personnage joue de ce décalage : le t-shirt à
grand cœur d'un côté, la conduite de l'autre. Le surnom est la blague,
« Patrick » ne disait rien.

**Cinq répliques d'arrivée et six réponses par méchant**, soit **150
combinaisons** contre 9 avant : à trois répliques, on les connaissait par
cœur dès la troisième horde.

**Deux réglages** : le grognement des vivants monte encore (0,46 → 0,60),
et le bois qui éclate baisse (0,90 → 0,62) — il sortait plus fort que le
verre à niveau égal, et il tombe à chaque projectile bloqué, donc
souvent.

**La flamme suit le canon, et le son prend du muscle** (v6.75).

**LA FLAMME DE BOUCHE ÉTAIT POSÉE À UNE POSITION FIXE** alors que le
canon bouge. Ça tenait tant que le héros visait ; dès qu'il tirait puis
reculait, l'arme partait en arrière et la flamme restait devant — à côté
du personnage, du mauvais côté de sa main. Mesuré chez Thibaut :
**0,964 de sa largeur en plein tir contre 0,725 au deuxième temps de
recul**, près d'un quart d'écart. La bouche est maintenant mesurée
**pose par pose**, pour les vingt-trois poses des deux héros, et un test
vérifie qu'aucune pose jouée ne manque à la table.

**Les impacts ont une matière** : le verre quand une bouteille éclate, le
bois quand un pavé ou un encensoir s'écrase. La matière dit ce qui vient
d'arriver mieux qu'un message.

**Les volumes sont revus** : détonations montées à 1,55 et 1,60 pour
qu'elles dominent, musique de 0,55 à 0,68, cri de mort **baissé** de 1,0
à 0,55 — il écrasait les grognements des vivants — et grognement remonté
de 0,30 à 0,46.

Un **limiteur** protège la sortie : des gains au-dessus de 1 saturent, et
une saturation numérique s'entend comme un grésillement, pas comme de la
puissance.

**Les grognements partent en rafale** : un éclat isolé toutes les deux
secondes s'entend comme un accident, deux ou trois rapprochés s'entendent
comme une bête. Même échantillon, découpé ailleurs à chaque fois.

**Les bombardiers se postent, et les monstres grognent** (v6.74).

**BruHell ne lançait effectivement jamais.** Sa fenêtre de jet ne dure
que **1,8 s** alors que son délai d'attente initial va de 3,4 à 5,2 s :
il la traversait avant d'avoir fini d'attendre. La cause n'était pas le
délai — c'est que **rien ne l'arrêtait**, alors que « rester au fond » est
toute sa définition. Un ennemi à menace distante se POSTE désormais à sa
distance de tir, et sa position y est bornée : sans ça il la dépassait de
quelques millièmes et la condition de jet échouait encore. Mesuré après
correction, en trente secondes : l'Abbé 5 jets, BruHell 4.

**Ils ne sont plus faibles.** Postés, ils sont à portée quasi pleine et
tombaient d'une seule balle dans la tête. L'Abbé passe à 115 points de vie
(tête 1,25) et BruHell à 120 (tête 1,15) : il en faut **deux** à leur
distance de tir, et comme ils ne s'approchent plus, ces deux balles se
méritent.

**Les monstres grognent tant qu'ils sont vivants** : un éclat de 0,18 à
0,30 s pris au hasard dans leur cri, haché et répété, avec un intervalle
qui se resserre quand ils approchent. Un seul à la fois pour toute la rue
— à trois qui râlent ensemble, on n'entend plus les tirs. À la mort, le
cri **entier, plus lent et plus fort** : le ralentissement descend la
hauteur, donc la mort sonne plus grave que la vie.

**La bulle remonte à mi-écran** : à 0,635 elle se posait sur les caisses
et sur la tête du champion, illisible sur un fond de bois.

**La carte de bestiaire ne se saute plus.** En tapant vite avant qu'elle
arrive, on la passait sans l'avoir lue — et rien ne permet de la revoir.
Elle tient ses 2,5 s quoi qu'on fasse. Les répliques, elles, restent
sautables : on les a déjà entendues.

**La ruelle a sa musique** (v6.73) : 28,8 s en boucle, 234 Ko, qui
remplacent la petite grille de jazz — elle n'a rien à faire dans une
fusillade. Repli sur la grille synthétisée si le fichier manque, comme
pour tous les échantillons.

Deux pièges de boucle, tous deux réglés : elle **s'arrête explicitement**
au retour au menu, sinon elle continue sur l'écran titre et se superpose
à la musique du niveau suivant ; et **`gainMus` est libéré** à l'arrêt,
sinon la grille synthétisée refuse de repartir pour les autres niveaux et
le jeu reste muet à la deuxième partie.

Les fichiers source — deux rechargements et la musique — **sortent du
dépôt** : 7,5 Mo servis par GitHub Pages pour des fichiers que le jeu ne
charge jamais.

**Chaque arme a son rechargement** (v6.72) : deux enregistrements
remplacent le son unique. Le barillet d'un revolver et la culasse d'un
fusil ne font pas le même bruit — et c'est un des rares moments où le
joueur sait quelle arme il tient sans regarder.

L'ancien paramètre disait la DURÉE du geste (« c'est le long ») et non
l'arme : il ne permettait donc pas de choisir le son. Il porte maintenant
la clé de l'arme.

**Le pistolet est ACCÉLÉRÉ, pas tronqué.** C'est un geste en trois
claquements étalés sur 1,68 s, alors que le rechargement dure 1,5 s :
couper emportait le troisième en plein milieu, et un rechargement qui
s'arrête au deuxième temps ne se lit plus comme un rechargement. Accéléré
de 13 %, les trois y sont — vérifié, ils tombent à 0,05, 0,65 et 1,40 s.

Et un test lit la **durée réelle** dans l'en-tête OGG pour vérifier
qu'aucun échantillon ne dépasse le geste qu'il accompagne.

**Les méchants grognent** (v6.71) : les cinq cris sont découpés dans un
enregistrement de grognements de chien, plus la synthèse qui sonnait
comme un jouet.

**On choisit des fenêtres, on ne coupe pas aux silences** : le source
grogne presque en continu — médiane de l'enveloppe à 0,026, 75ᵉ centile à
0,094, aucun blanc. Une coupure au silence ne rendait que quatre morceaux
sur cinquante-six secondes. Les fenêtres sont donc notées par leur
énergie **divisée par celle de leurs bords** : une bonne fenêtre commence
et finit doucement, sinon le cri démarre en plein milieu d'un aboiement.

**Chaque méchant a sa transformation** : même matière, cinq voix. La
hauteur et la durée bougent ensemble, ce qui étire aussi les formants —
c'est ce qui fait qu'un grognement descendu d'une quinte sonne énorme au
lieu de sonner ralenti. Mesuré, du plus grave au plus fluet :
Depardiahree 832 Hz sur 1,21 s, l'Abbé 1462 Hz sur 0,40 s.

**L'impact sur un corps revient à la synthèse.** C'est le son le plus
fréquent du niveau — cinquante fois par horde. Un échantillon, même bon,
s'y entend en boucle et fatigue ; la percussion sèche, non.

Le source de 4,9 Mo **n'est pas versionné** : les instants retenus sont
écrits dans `cris.py`, le découpage est reproductible sans le garder.

**Le jeu a des échantillons** (v6.70) : la règle « aucun fichier audio »
est levée pour neuf sons — deux détonations, le rechargement, l'impact
dans la chair, et **un cri par méchant**. 55 Ko au total.

Mais l'invariant qui motivait la règle reste, et il est plus fort :
**le jeu n'est JAMAIS muet.** Chaque son passant par un échantillon garde
son repli synthétisé — fichier absent, réseau lent, décodage refusé, le
son sort quand même. C'est ce qui permet de livrer la plomberie avant les
fichiers, et un test le vérifie.

Deux autres garanties : le chargement part **après** les images
essentielles et ne retarde pas l'écran titre ; et tout passe par
l'**AudioContext déjà déverrouillé**, jamais par un élément audio HTML —
lancé depuis un rappel réseau, iOS le bloque silencieusement.

**Déposer un `.ogg` dans `son/` au bon nom suffit à remplacer un son**,
sans toucher une ligne de code. Les fichiers actuels sont une synthèse
hors ligne, plus riche que le temps réel mais pas un enregistrement :
`son/LISEZMOI.md` dit où trouver de vrais sons en CC0.

**L'affiche du bar et la vignette du niveau 4** (v6.69) : le niveau 3
s'ouvre sur son affiche — PF et Thibaut dos à dos au comptoir — montrée
3,2 s, passable d'une tape. Elle rend le même service que l'intro de la
ruelle : elle annonce le niveau ET donne au navigateur le temps de finir
de charger le décor.

Elle est **contenue et non recadrée** : la couper aux bords mangerait les
deux noms peints en bas. Et elle se dessine **en dernier**, par-dessus le
HUD — posée au milieu du dessin, la jauge d'ambiance et le score lui
passaient dessus.

**La vignette du niveau 4 utilise le PORTRAIT** de Depardiahree et non sa
pose de course : un personnage en pied réduit à une vignette de menu ne
montre qu'une silhouette, un buste se lit.

**L'ordre change, l'annonce se lit** (v6.68) : trois corrections sur ce
qui venait d'être posé.

**L'ordre d'introduction des méchants est tiré au sort à chaque partie.**
Les hordes déclarent COMBIEN de types elles mélangent, pas lesquels :
écrits en dur, on commençait toujours par Depardiahree et on finissait
par BruHell, et une partie ressemblait à la précédente. Mesuré : au moins
huit ordres différents sur trente parties.

**L'annonce se lit UNE ÉTAPE À LA FOIS**, comme les bulles du niveau 2 :
la carte, puis la première réplique, puis la seconde. Une tape passe à la
suivante, avec le même délai de 0,12 s qui empêche un appui d'en sauter
deux. Et **rien ne sort tant qu'elle n'est pas finie** — retarder le
premier délai ne suffisait pas, deux ennemis étaient déjà dans la rue
pendant qu'on lisait la carte. Taper pendant l'annonce ne tire pas :
sinon on vide un chargeur en essayant de passer le texte.

**Le chargement porte le titre du jeu.** « La file du D'Tour » était le
nom du premier niveau seul et n'a plus cours depuis qu'il y en a quatre :
l'écran de chargement affiche **LES ENQUÊTES DE CALLAGHAN**, dans le
style de l'enseigne du menu.

**Neuf hordes, deux géants, un bestiaire** (v6.67) : le niveau 4 cesse
d'être une montée en nombre pour devenir un apprentissage.

**Un type de méchant à la première horde, deux à la deuxième, trois à la
troisième — puis un GÉANT.** Le quatrième type arrive après lui, le
cinquième ensuite, et un second géant clôt le cycle. Neuf hordes.

**Jamais plus de trois à l'écran.** C'est ce qui rend la question « qui
tuer en premier ? » lisible : à huit de front on ne choisit plus, on
arrose.

**Le géant est l'un des cinq**, 2,2 fois plus grand, quatre fois plus
dur, et plus lent. Sa mécanique est **inchangée** — c'est ce qui le rend
juste : on a appris à le lire, il faut le refaire en tenant plus
longtemps.

**Une carte de bestiaire à la première rencontre** : portrait en buste,
nom, et un sous-titre qui dit comment le jouer en quatre mots. Elle ne
revient pas — c'est une découverte, pas un rappel. Les portraits sont
recadrés dans les sprites de course, donc le portrait EST le personnage
qu'on va affronter.

**Puis l'échange.** Un héros nomme, l'autre commente : « Mon Dieu, un
Depardiahree ! » — « Vise pas le ventre, y'a rien à en tirer. » La
deuxième réplique fait la blague mais porte l'information : c'est le seul
moment où le jeu enseigne, et il dure deux secondes.

**BruHell complète le bestiaire** (v6.66) : cinquième et dernier ennemi,
dix-neuf poses. **Les cinq sont complets, `ENNEMIS_INCOMPLETS` est vide.**

Il lance un **cocktail Molotov**, et il est l'exact contraire de l'Abbé —
c'est là tout l'intérêt de les avoir tous les deux. L'Abbé lance HAUT et
LENT : on voit venir, on a le temps de se couvrir. BruHell lance À PLAT et
VITE — 0,75 s de vol contre 1,35, une cloche de 0,045 contre 0,185. Contre
lui, se couvrir arrive souvent trop tard : la cible sur son bras devient la
vraie réponse. En échange il frappe plus fort et beaucoup moins souvent.

**Leurs fourchettes de distance ne se chevauchent plus** : l'Abbé tient le
fond (0,12–0,30), BruHell le plan intermédiaire (0,34–0,52). Postés à la
même profondeur, les cinq couloirs ayant convergé, ils se superposaient à
l'écran avec leurs deux cibles.

**Et deux cibles superposées désignent maintenant la plus PROCHE** — même
règle que pour les zones du corps. Sans elle, c'était l'ordre du tableau,
donc l'ordre d'apparition, qui décidait.

**Neuf hordes** : cinq d'apprentissage, une mécanique chacune, puis quatre
mixtes dont la dernière réunit les cinq.

**L'Abbé Forceur bombarde** (v6.65) : quatrième ennemi complet, dix-neuf
poses, et la première mécanique qui change la GÉOMÉTRIE du niveau plutôt
que sa cadence.

Il s'arrête **plus loin que tous les autres** — entre 0,14 et 0,52 de
profondeur, là où les autres n'ont pas encore commencé — lève son
encensoir droit vers le ciel et **bombarde en cloche par-dessus eux**.
Sa trajectoire monte à 0,185 de hauteur d'écran contre 0,085 pour un
pavé : c'est un nombre, pas un dessin.

D'où la horde qui fait tout le niveau : **un mur de Depardiahree protège
son corps mais pas la cible sur son bras**. Il faut choisir entre casser
le mur et interrompre le bombardement.

**Et un jet annulé le laisse PLIÉ**, tête offerte pendant une seconde et
demie, à 1,8 fois le tarif — comme DSKKK après une garde cassée. C'est ce
qui rend le tir de précision préférable au simple À COUVERT contre lui.
Sa pose `plie` est déclarée dans `POSES_PROPRES` : qui ne l'a pas repart
simplement en courant, et un test le vérifie.

**Il casse la règle pv × vitesse**, à 8,6 contre 11 : sa menace n'est pas
d'arriver au contact. L'exception est **déclarée** dans sa fiche et non
déduite d'un écart de chiffres — et un test exige en échange qu'il reste
fragile, sinon ce drapeau deviendrait un passe-droit.

**Jubilar refait** (v6.63) : ses dix-huit poses viennent de deux
nouvelles planches, et le raccord de chemise qui clochait depuis la v6.56
est réglé — la base et la mécanique sortent enfin du même dessin.

Le pavé a changé de place dans la pose de préparation : de 0,23 / 0,05 du
canevas à **0,14 / 0,05**. La cible du bras a suivi. C'est une leçon à
retenir : **une position d'interface calée sur un sprite est solidaire de
ce sprite** — elle se remesure à chaque nouvelle planche, elle ne se
reporte pas. Vérifié aux deux bornes de sa fourchette de jet : la cible
tombe à 0,140 / 0,050 du sprite dessiné, aux deux profondeurs.

Le découpeur accepte désormais des **coupures bornées en hauteur** : une
colonne coupée sur toute la planche sectionnait aussi la pose du dessus,
et le morceau détaché — 3 537 px — était compté comme une pose de plus.

**Le bar est plein de monde** (v6.62) : neuf habitués peuplent le
**premier plan**, en trois grappes — bas gauche, bas centre, bas droite —
posées si bas qu'on ne voit que leurs épaules et leur tête. Le champion
circule DERRIÈRE eux : ils lui masquent les jambes et laissent le haut du
corps lisible.

**Ils ne masquent aucun verre**, et c'est la contrainte qui a décidé de
tout le reste : leur tête reste plus bas que le comptoir. S'ils avaient
couvert les verres, il aurait fallu reprendre le garde-fou de faisabilité
et le niveau devenait un autre jeu. Un test verrouille cette ligne.

**Les grappes se composent par affinité** : `LIENS` sert depuis le niveau
2, on s'en sert plutôt que de tirer au sort. Mesuré sur quarante
soirées : plus de la moitié des paires d'une grappe sont des amis, contre
un cinquième au hasard pur. Le reste se remplit avec qui il reste — le
maire, l'agent de sécurité et Charles se retrouvent ensemble faute de
mieux, et ça se lit très bien.

**Rien n'est figé.** De temps en temps l'un quitte sa grappe pour faire
un tour, et revient dans une AUTRE grappe : la soirée se recompose sans
chef d'orchestre. Et parfois il s'en va pour de bon.

**Et ils parlent.** Une réplique toutes les sept à treize secondes,
trois secondes à l'écran, choisie d'abord selon ce qui se passe — coup de
feu, ambiance à plat, champion pompette — et sinon selon le personnage.
Mathilde se plaint que Jojo l'ignore, le maire déclare le buffet non
conforme.

**Jojo ne hoche plus la tête** (v6.61) : ses poses étaient calibrées sur
le haut de leur boîte englobante. Or un verre brandi ou une bouteille
levée dépassent du crâne : le cadrage commençait sur l'OBJET, la tête
descendait d'autant et la coupe remontait dans le torse. Mesuré : le haut
du crâne bougeait de **17 px sur 193** d'une pose à l'autre.

Le cadrage part maintenant du **haut du crâne**, trouvé en cherchant la
première ligne où la silhouette atteint 70 % d'une largeur de tête — un
objet brandi ne remplit pas ce critère. La place nécessaire au plus grand
objet de la planche est réservée au-dessus, et la ceinture tombe à une
distance fixe sous le crâne. Après correction : **2 px d'écart sur le
crâne, zéro sur la ceinture**.

Et le découpage **refuse d'écrire** si une pose est plus courte que la
cible : c'était exactement ce défaut, et il passait inaperçu.

**Les barmans redécoupés** (v6.60) : les 17 poses de Francky et Jojo
sortent de nouvelles planches, et trois choses changent.

**Plus de bout de comptoir.** Les poses en pied sont recadrées **à la
ceinture** par le découpage lui-même, à une hauteur exprimée en TÊTES et
non en pixels. Le bois qui restait collé au sprite se posait par-dessus le
vrai comptoir du décor, avec sa propre perspective et sa propre lumière :
on voyait une table flotter.

**L'échelle se prend sur la TÊTE, pas sur la hauteur.** Une pose en pied
fait 314 px là où un buste en fait 200 : les mettre à la même hauteur de
canevas faisait rétrécir la tête de 40 % dès que le barman se mettait au
travail. La tête se mesure par le plus long segment horizontal continu du
haut de la silhouette — un bras levé à côté du crâne forme un segment
séparé, il ne gonfle donc pas la mesure.

**Plusieurs planches par personnage.** `shake` n'existait que sur la
grande planche de Francky : le découpage accepte de piocher ailleurs, et
la normalisation par la tête rend le mélange sans risque.

**Les sprites sont réparés** (v6.59) : deux défauts de découpage
corrigés sur **219 sprites de personnage**, mesurés avant d'y toucher.

Les **fragments** d'abord : plusieurs sprites embarquaient un morceau de
la pose voisine de leur planche. `bar_francky_verse` contenait un Francky
ENTIER en plus du bon — d'où les deux barmans côte à côte et le bout de
comptoir qui traînait avec eux — `shake` et `dose` une bande verticale.
On ne garde plus que la plus grosse composante, et la figure est
recentrée dans son canevas sans en changer les dimensions : le rendu
déduit la largeur du rapport de l'image, la toucher aurait changé
l'échelle à l'écran.

Les **trous** ensuite : le détourage avait pris les motifs clairs des
vêtements pour du fond — chemise à fleurs de Tristan, imprimé du t-shirt
de Teo, jupe de Mathilde. Jusqu'à 9 000 pixels manquants sur un seul
sprite. La couleur était restée dessous, seul l'alpha avait été effacé :
la réparation est sans perte, et les 8 % de pixels vraiment perdus sont
repeints depuis leur voisin.

Vérifié après coup : zéro fragment, zéro trou sur les 255 sprites de
personnage, et aucun sprite amené au bord de son canevas par le
recentrage.

**Plus d'habitant fantôme** (v6.58) : au niveau 2, une étiquette de nom
s'affichait parfois au-dessus d'une place vide — le personnage était
interrogeable sans être visible, tantôt au frigo, tantôt dans le couloir.
Cause : une place DEBOUT était servie en secours à quelqu'un qui n'a pas
de silhouette debout — Tristan, Kevin, Rémy, Teo, Charles n'ont qu'une
pose assise. Mesuré avant correction : **198 placements fantômes sur
2393**, soit un par partie sur deux. Une place n'est désormais tenable
que si le sprite existe ; on sert les plus contraints d'abord, et un
candidat sans place est écarté plutôt que placé de force. Vérifié sur
4800 placements : zéro fantôme, cinq habitants à chaque partie, coupable
et témoin clé toujours présents.

**Une enquête ratée raconte quand même l'affaire** : on ne montrait ni le
coupable ni ce qui s'était passé, et le joueur repartait sans savoir. La
solution est révélée dans les deux cas — **« C'ÉTAIT CHARLES, et la pizza
était dans une poche de manteau. »** — suivie de la chute, qui est la
véritable explication : cinquante et un scénarios en ont une, dix-huit
seulement ont un récit. Seul le ton change, et une phrase courte dit
pourquoi on a perdu : au chrono, ou à force de citer des noms.

**Tirer relève tout seul** (v6.57) : à couvert, il fallait rappuyer sur
le bouclier avant de pouvoir tirer. Deux gestes là où l'intention est
évidente — et le temps de les enchaîner suffisait à encaisser le jet
suivant. Le bouton ne sert plus qu'à SE METTRE à couvert ; on en sort en
tirant, en changeant de héros, ou en rappuyant dessus. La croix reste
utilisable pendant qu'on encaisse : viser est le seul geste qui reste, le
couper aurait fait de l'abri un temps mort.

**Le bestiaire connaît les méchants** : `PERSONNAGES.md` a sa section
« Les méchants de la ruelle », avec pour chacun ses chiffres, sa mécanique
et surtout **la question qu'il pose au joueur**. Le tableau « Où chacun
apparaît » gagne une colonne Niveau 4, et il est dit noir sur blanc qu'ils
n'interviennent nulle part ailleurs : une colonne vide sur toute leur ligne
est une information, pas un oubli.

**Jubilar et la cible du bras** (v6.56) : troisième ennemi, et la
première parade qui ne coûte pas de temps de tir. Il s'arrête net, sort
un pavé, arme — et pendant les 0,85 s de préparation, une **cible
apparaît sur son bras armé**. Un tir dedans annule le jet : le pavé
tombe, il se tient le bras et perd une seconde et demie. Rien n'entame
ses points de vie, la parade fait gagner du temps sans tuer. Contre lui
on choisit donc entre À COUVERT, qui coûte un temps de tir, et le tir de
précision, qui n'en coûte aucun mais peut se rater.

La cible a une **taille fixe à l'écran**, indépendante de la profondeur :
au fond de la rue un avant-bras fait six pixels, une zone calquée sur le
sprite serait injouable là où elle sert le plus. Sa position, elle, est
mesurée sur le sprite et déclarée par personnage.

**DSKKK a enfin sa planche complète** : six poses de course, quatre
impacts, deux de chute et deux poses au sol — il s'affaisse. Il glissait
jusqu'ici au lieu de courir et ne réagissait pas aux impacts.

**L'alerte a deux couleurs** : ambre pendant qu'il se prépare, rouge
quand le jet est imminent. Deux couleurs valent mieux qu'un compte à
rebours.

**Six hordes** au lieu de cinq, chacune avec son casting : Depardiahree,
puis DSKKK, puis Jubilar — une mécanique à la fois — et trois hordes
mélangées. Le relevé de fin compte les jets annulés au bras.

**Les balles portent moins de loin** (v6.55) : la meilleure stratégie
du niveau était de POSER le viseur sur le point de fuite et de tirer en
boucle. Les cinq couloirs convergent là-bas, donc tous les ennemis
passent par ce point, et la tête d'un lointain valait autant que celle
d'un ennemi au contact — plus besoin de viser ni de choisir. Les dégâts
tombent maintenant à 32 % au fond de la rue et remontent à plein tarif
à mi-distance. Un headshot sur Depardiahree passe de deux balles à
quatre : le tir lointain n'est pas interdit, il coûte deux chargeurs.
La garde de DSKKK résiste dans les mêmes proportions, sinon on la
cassait depuis le fond au prix du contact.

**Et le viseur le dit** : ambre sur une cible trop lointaine, rouge dès
qu'elle est à plein tarif. Une règle d'équilibrage que le joueur ne peut
pas lire est une punition arbitraire.

**Le niveau 4 a son relevé de fin** : il tombait jusqu'ici sur celui du
niveau 1 et affichait PERSONNES SALUÉES et FILE LA PLUS LONGUE à la
sortie d'une fusillade. Il montre désormais les hordes passées sur le
total, les tirs à la tête, les gardes cassées, les jets encaissés sur le
nombre reçu, les ennemis arrivés au contact — et le **détail des abattus
par catégorie**, construit à partir de la table des ennemis pour qu'un
ennemi ajouté au jeu y apparaisse sans qu'on touche au HTML.

**DSKKK relève sa garde** (v6.54) : deuxième ennemi, et une question
neuve. Il va deux fois plus vite que Depardiahree pour moitié moins de
points de vie — même menace, répartie autrement — et il couvre son
visage périodiquement, tout en continuant d'avancer. Tant que la garde
tient, viser la tête revient à tirer dans ses avant-bras : rien ne
tombe. Trois réponses, et aucune n'est gratuite — attendre qu'il baisse
les bras, viser les jambes qui passent la garde, ou dépenser trois
balles sur les avant-bras pour la casser. Une garde cassée le laisse
**sonné** une seconde et quart, sans aucune défense, la tête à 1,8 fois
le tarif normal.

**Un tir bloqué se VOIT et s'ENTEND** : un anneau blanc qui s'ouvre là
où la balle a tapé, et un claquement métallique sec. Jamais l'étoile
rouge d'un coup qui porte. Un coup sans effet visible est un bug aux
yeux de celui qui joue — c'est « éteint ne veut pas dire invisible »
appliqué au tir.

**Et il ne s'évapore pas au contact** : il BONDIT sur la barricade, pour
22 points au lieu de 12.

**Chaque horde a son casting** : la première n'envoie que des
Depardiahree, la deuxième que des DSKKK — une mécanique à la fois — et
les trois suivantes mélangent, parce que la vraie difficulté est de
décider qui tuer en premier.

**Depardiahree lance sa bouteille** (v6.53) : le premier ennemi à
mécanique complète, et le premier danger du niveau. Il s'arrête à
moyenne distance, ramasse, arme — un point d'exclamation bat au-dessus
de sa tête pendant toute la préparation — puis lance. La bouteille
tourne en vol, se retourne aux deux tiers du trajet parce qu'un objet
qui fond sur vous ne se voit plus de profil, et éclate sur les caisses.

**Et À COUVERT protège enfin de quelque chose.** Le bouton existait
depuis trois versions : il coûtait un temps de tir et ne rendait rien,
les deux héros s'accroupissaient devant un danger qui n'existait pas.
Couvert, la bouteille éclate en gerbe de bois et la barricade est
intacte ; découvert, c'est du vin et 18 points de moins.

**Son torse est blindé** : 0,35 de multiplicateur contre 1,15 à la tête.
Deux balles de revolver dans la tête, neuf dans le torse — tirer dans la
masse n'est plus la meilleure stratégie, alors que le torse est la zone
la plus large. Et deux balles dans les jambes le font **trébucher** : ça
ne le tue pas, ça fait gagner une seconde et quart. Le costaud est
devenu Depardiahree, ses treize fichiers renommés.

**Les boutons sont normalisés** (v6.52) : les huit commandes du niveau
4 passent par un découpage qui garantit trois choses — pas un pixel de
magenta, le même diamètre pour tous, et le disque centré au pixel dans
son canevas. `poser()` dessine le canevas ENTIER : la place du dessin
dans son canevas EST sa place à l'écran, et son diamètre y est sa
taille. La planche précédente décalait la croix de 12 % de sa largeur —
elle ne tombait plus sur sa zone tactile — et le bouton de tir
rétrécissait de 27 % quand on appuyait dessus. L'anneau de rechargement,
lui, encercle enfin le bouton au lieu de se poser sur la douille : son
bord intérieur est calé sur le bord du bouton.

**Et elles s'effacent** : les commandes sont posées à 0,45 au repos et
reviennent pleines dès qu'on s'en sert — doigt sur la croix, tir
enfoncé, à couvert engagé. L'opacité devient un retour tactile au lieu
d'un réglage figé. Le bouton éteint pendant le rechargement descend à
0,5 : il n'a rien à dire tant que le chargeur se remplit.

**Le harnais couvre le niveau 4** (v6.51) : quatre scènes permanentes —
l'annonce, le jeu, la relève, le repli — parce qu'une règle en dur veut
désormais qu'aucune modification visuelle ne parte sans qu'on ait ouvert
une image du résultat. Elle a servi tout de suite : la réplique de
relève sortait de l'écran par la droite, elle se rétrécit maintenant
pour tenir, et le bouton À COUVERT était trop discret.

**Les commandes sont des images** (v6.50) : bouton de tir dans ses
trois états, anneau de rechargement qui se remplit, croix
directionnelle, pastille de pouce, bouclier et relais. Peintes au
canevas elles avaient l'air d'un prototype — sans shadowBlur, qui reste
interdit, on ne peut pas approcher une vraie lueur. Une image la porte
déjà.

**Les armes s'entendent** (v6.49). Chaque coup de feu tient en trois
couches synthétisées : la **détonation** — bruit blanc très court dans
un filtre qui s'effondre, c'est elle qui claque —, le **corps** — un
oscillateur grave qui plonge d'une octave, c'est ce qui sépare une arme
d'un pétard — et la **queue**, une réverbération courte, plus longue
pour le fusil parce que la ruelle renvoie. S'y ajoutent le clic à vide,
le rechargement en deux temps, l'impact mat sur un corps, sa variante
plus aiguë au headshot, et le choc de bois quand la barricade encaisse.

Pas un octet d'audio à télécharger, pas de licence à vérifier : tout est
synthétisé, comme le reste du jeu depuis le premier jour.

**La jauge appartient au décor** (v6.48) : la vie de la barricade est
posée sur les caisses et **suit leur courbe** — un trait droit sur un
décor en perspective a l'air collé par-dessus. Les héros passent devant
elle, les ennemis derrière. Le bouton de tir devient un cadran :
couronne de fins bâtonnets, bague lumineuse en trois passes de plus en
plus pâles, balle dorée en dégradé et compte de munitions dessous.

**Le binôme se comprend** (v6.47) : celui qui ne tire pas reste
**accroupi derrière la barricade** — debout sans rien faire, il avait
l'air d'attendre le bus. La vie de la barricade se lit désormais **sur
la barricade**, juste au-dessus des caisses : en haut à gauche, on la
confondait avec le score. Et les boutons sont en verre plutôt qu'en
plastique — fond transparent, halo intérieur, éclat en croissant et
liseré qui s'illumine en haut, le tout par couches puisque shadowBlur
reste interdit.

**Le menu allégé** (v6.45) : debout, le logo disparaît — il répétait
l'enseigne juste en dessous — la légende des touches du clavier aussi,
elle n'a aucun sens sur un téléphone, et l'enseigne CALLAGHAN se cale
désormais sur la LARGEUR au lieu de déborder des deux côtés.

Et au tout premier chargement, le jeu ne réclame plus **deux sens à la
suite** : tout ce qui n'est pas une partie en cours compte comme le
menu, donc le portrait.

**Le menu se tient debout** (v6.44) : les quatre tuiles s'empilent,
vignette à gauche et texte à droite. On demande de tourner le téléphone
à l'entrée des trois premiers niveaux — jamais avant d'avoir choisi — et
le quatrième reste debout.

**Le niveau 4 s'annonce** : le duo arrive sur une ruelle floutée, avec
son titre et sa devise. Elle sert deux buts d'un coup — annoncer le ton,
et laisser au navigateur le temps de finir de charger le décor et les
ennemis. Un niveau qui démarre sur un décor à moitié arrivé donne
l'impression d'un jeu cassé. On la passe d'un doigt.

**L'écran titre se tient comme on veut** (v6.43) : il accepte les deux
sens, et les quatre tuiles passent sur deux rangs en portrait. Demander
de tourner son téléphone avant même d'avoir choisi son niveau était une
brimade — le pivot devient une demande à l'entrée d'un niveau, avec un
**voile de chargement** le temps que le canevas bascule : sans lui, on
voyait la scène se contorsionner.

Le bouton de pause est **plus transparent et décalé du coin** — au ras du
bord il masquait l'enseigne du décor — et le plein écran a disparu, le
navigateur le fait déjà.

**L'équipier couvre** (v6.42) : quand ton héros recharge, l'autre se
lève et tire **tout seul** — sans te changer de personnage. Il rate à peu
près la moitié de ses coups, sinon le rechargement ne coûterait plus
rien. Il le dit en se levant : « Je te couvre, inspecteur », « Laisse,
Callaghan ».

**Un bouton À COUVERT** au centre : les deux s'accroupissent, plus
personne ne tire, et l'équipier ne se lève pas non plus. C'est le repli
volontaire — il servira quand les ennemis lanceront des choses.

Et le **bandeau du haut** ne se mêle plus aux boutons de plein écran et
de pause : il s'arrête aux deux tiers de la largeur, la vague se lit en
pastilles et la barricade a sa propre ligne.

**Un binôme, pas deux boutons** (v6.41) : quand l'un recharge, l'autre
se lève et prend le relais tout seul, en le disant — « Je te couvre,
inspecteur », « Laisse, Callaghan ». Thibaut appelle PF *inspecteur*, PF
appelle Thibaut *Callaghan*. Le chargeur vide n'est plus un temps mort,
c'est un passage de main. Si les deux sont à sec, personne ne se relève
et on subit.

Le HUD prend son style : une croix directionnelle à quatre flèches, le
chargeur en **couronne de segments** autour d'un bouton de tir en forme
de balle, et deux flèches qui tournent pour le relais.

**Le buste suit le réticule** (v6.40) : le héros actif s'incline vers
l'endroit qu'on vise, dans une plage étroite — au-delà, on verrait que
c'est la même image qui pivote. Le rechargement est devenu un simple
accroupissement au sol au lieu d'une chute dans un trou, avec l'anneau
du bouton de tir qui se remplit pour dire quand on pourra retirer. Les
boutons ont du relief, et les ennemis **entamés** portent une barre de
vie — seulement eux, et seulement assez près pour être lus : c'est le
costaud qu'il faut voir résister.

**On vise au pouce** (v6.39). Toucher directement l'ennemi rendait le
niveau trop simple : c'était un jeu de temps de réaction, sans adresse.
Un **champignon** à gauche pousse le viseur, un **bouton TIR** à droite
fait feu, et le **recul** repousse le réticule vers le haut — fort au
revolver de Thibaut, doux au fusil de PF. C'est ça qui distingue enfin
les deux armes : l'un impose son rythme, l'autre pardonne.

**Trois plans, dans le bon ordre** : les ennemis au fond, masqués par
les contours de la barricade ; la barricade au second ; les héros
devant, **entiers**. Ils étaient coupés à la ceinture et ressemblaient à
des bustes posés sur les caisses. Quand ils rechargent, ils s'enfoncent
derrière l'abri — c'est le seul moment où ils passent au second plan.

**Un premier HUD** : score, vague, jauge de barricade, viseur qui rougit
sur une cible, munitions en couronne autour du bouton de tir, et une
bascule au centre pour changer de héros.

**Les héros visent la ruelle** (v6.38) : ils sont inclinés vers le point
de fuite, la coupe de la barricade descend dans les caisses là où elles
couvrent partout, et la course des ennemis s'anime à une cadence liée à
leur profondeur — loin ils trottinent, près ils martèlent. Le premier
plan est redessiné sous un découpage plutôt que recopié : une couture
rectangulaire traversait l'écran.

**La ruelle prend sa place** (v6.37) : la barricade est devenue un
**premier plan**, redessinée par-dessus les combattants. Un ennemi
arrivé au contact disparaît derrière les caisses au lieu de marcher
dessus, et les deux héros la chevauchent — pieds sous le bord de
l'écran, coupés à la taille par la palissade. PF est retourné pour que
les deux visent vers le centre de la ruelle. Les ennemis ont rétréci
d'un tiers, les héros grandi de moitié.

**Le niveau 4 se joue** (v6.35). Quatrième tuile au menu, et une ruelle
qui se tient debout : Thibaut au revolver et PF au fusil défendent la
barricade pendant que le quartier accourt. On touche un ennemi pour
tirer ; la tête vaut 100 dégâts au revolver contre 55 au torse, ce qui
donne son sens à la précision de Thibaut, tandis que le fusil de PF
pardonne davantage. Cinq vagues qui montent en nombre et en fréquence,
jamais en points de vie — le joueur doit sentir la pression, pas tirer
quinze fois sur le même homme.

Tout l'équilibrage tient dans deux blocs, `ARMES` et `ENNEMIS` : après
un essai, une valeur se change en une ligne.

**La ruelle prend de la profondeur** (v6.34). Le niveau 4 démarre : le
décor est en place, l'orientation bascule en portrait — une ruelle qui
s'enfonce a besoin de hauteur —, et le projecteur de perspective
fonctionne. Chaque ennemi porte un Z entre 0 (le fond) et 1 (la
barricade) ; sa taille, sa position et son ordre de dessin s'en
déduisent, avec une courbe en puissance 2,35 qui écrase le fond et étire
le premier plan. Une progression linéaire aurait donné un entonnoir
plat. Les cinq couloirs se rejoignent au point de fuite à moins de deux
pixels près.

Premier ennemi découpé : treize images, six de course, quatre d'impact,
deux de chute et une au sol.

**Cinquante et une affaires** (v6.32), dont dix-huit avec le nouveau
casting : le compte de Martin qui ne tombe jamais juste, le maire qui se
sert et laisse cinq euros, Tristan qui sort porter la pizza à quelqu'un
déjà monté, Solène qui crève en arrivant et pose la boîte dans l'entrée,
Teo qui n'a même pas eu à se lever, Francky qui met une pizza au frais
pour Mathilde, Kevin qui a faim depuis 20 h 15, Jojo qui la planque dans
l'évier pour qu'elle ne l'ait pas — et deux affaires où **personne n'a
rien volé**.

**Six affaires du nouveau casting** (v6.31), dont les trois nœuds du
quartier : la **liaison secrète de Gabi et Charles** — deux innocents qui
mentent, et pas sur le vol —, les **trois professeurs d'histoire** qui
reconstituent la soirée à voix haute jusqu'à ce que la chronologie
désigne celle qui l'a écrite, et **Rémy le carrefour**, qui couvre un ami
sans mentir une seule fois, simplement en racontant autre chose.

**Quand on trouve, on comprend** : l'écran de fin donne désormais le
**récit** en trois phrases, pas seulement la chute. La chute fait rire,
le récit dit l'enchaînement.

**Une piste écartée le reste** : accuser quelqu'un à tort le barre
définitivement de la liste. Le curseur ne s'y arrête plus, et la
validation la refuse — accuser deux fois la même personne n'aurait aucun
sens, et voir ce qu'on a éliminé fait partie du raisonnement.

**L'appartement change de monde** (v6.29). Treize habitants possibles,
**cinq tirés à chaque partie** plus le chat, sur cinq places — entrée,
cuisine, chambre, canapé, table. Le tirage garde toujours le coupable de
l'affaire et son témoin clé, puis complète en **préférant leurs proches** :
une pièce doit ressembler à un groupe, pas à un tirage. Deux places sont
assises et n'acceptent que ceux qui ont une pose assise ; trois sont
debout et demandent une silhouette dans `commun/`.

Chacun des neuf nouveaux a ses **trois sujets d'entretien** — Kevin qui
donne l'heure exacte de sa faim, Martin qui annonce « oui, c'est moi la
sécurité, non je ne vais pas grandir », Francky qui monte des glaçons que
personne n'a demandés, Jojo qui change de pièce quand Mathilde parle.

**La carte des liens** (v6.26). Le jeu sait qui connaît qui, et une
**pastille à la couleur d'un inspecteur** apparaît sur la plaque de nom
de ceux sur qui il a une prise : PF pour Teopedo, Gabi et Charles ;
Thibaut pour Mathilde. Personne n'est conseillé quand les deux ont une
prise — un conseil qui désigne tout le monde ne conseille rien — ni
quand aucun des deux n'en a. C'est ce qui donne enfin un sens à TAB.

Trois liens sont volontairement à sens unique : Francky **adore**
Mathilde sans réciprocité, le chat aime qui le nourrit, et Hortense
n'habite pas l'appartement.

**Cinquante indices** (v6.25) au lieu de treize. Ils ne parlent plus
seulement de la pizza : le chat de Solène et Gabi, les paris de Rémy,
le sport de Kevin et Tristan, la soirée elle-même, et les objets qui
désignent quelqu'un — le rouleau de papier toilette de Gabi, les
lunettes noires de Charles, l'écharpe grise de Rémy, l'écharpe
tricolore du maire. Chacun porte son analyse, sa version brute, sa
question de confrontation, la réponse de l'innocent, celle du coupable,
et l'écho de l'autre inspecteur. Deux sont volontairement ambigus — la
chaussure boueuse et la chaussette peuvent être de Kevin comme de
Tristan.

**Les inspecteurs jouent la scène** (v6.13). Dix poses chacun, choisies
par la logique et pas par le rendu : debout, deux temps de marche,
accroupi à fouiller, en train d'examiner un objet, la main ouverte quand
il interroge, la main au menton quand c'est l'autre qui parle, le carnet
quand le dossier est ouvert, le doigt tendu quand il accuse, et les bras
levés quand une tarte arrive. Avant : trois poses, et l'inspecteur
marchait sur place pendant qu'il interrogeait quelqu'un.

**Le dialogue se joue au doigt** (v6.12). Une seule bulle à l'écran, on
**tape pour la suivante** — un chevron clignotant l'annonce — et **rien
ne s'invite tant que la file n'est pas vide** : un visiteur qui débarquait
au milieu d'un échange faisait parler trois bouches à la fois et on ne
suivait plus rien. Le temps ne décide plus, sauf en filet : si personne
ne tape, ça avance tout seul au bout de deux fois et demie le temps de
lecture, pour qu'une partie laissée en plan ne se bloque jamais.

**Les bulles se lisent** : multi-lignes (42 % de l'écran au plus), une
durée de vie qui suit la longueur du texte — de 3 à 6,4 secondes, et le
fondu n'entame que les derniers pour-cent —, et un calage qui cherche un
trou rangée par rangée. **Chaque bulle porte le nom de qui parle**, les
inspecteurs compris : un liseré de couleur de trois pixels ne se
distingue pas sur un téléphone. Le calage connaît aussi les autres
étiquettes de l'écran — le badge central, les plaques de nom — et les
évite ; et une personne qui parle n'affiche plus sa plaque, sa bulle
suffit.

**Le dossier occupe tout l'écran, et rien ne passe devant** sauf une
tarte à esquiver. Il se compose dans la hauteur utile, au-dessus de la
barre de commandes : ses dernières lignes s'écrivaient dessous, donc
dans le vide.

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

**Les détails changent à chaque partie.** L'heure du ticket, le temps
que le fromage a mis à refroidir, le nom du livreur, la pointure des
chaussures, l'étage : tout est tiré une fois au début et repris partout.
L'heure que le ticket porte est exactement celle que Thibaut oppose au
suspect. Écrits en dur, ces détails faisaient de dix-sept affaires une
seule soirée répétée.

**La découverte nomme le vrai meuble.** Chaque zone sait se dire au bon
cas — « à la poubelle », « sous le lit », « derrière les livres » — et
les répliques de découverte l'appellent par `{Ou}`. Écrites en dur,
huit affaires sur dix-sept annonçaient un meuble alors que la pizza
était dans un autre.

**Chaque affaire a quelqu'un à confondre.** Dans les trois affaires où
personne n'a rien volé, il n'y avait pas de coupable, donc la
contradiction n'était jamais dite : elle existait dans le fichier et ne
sortait jamais à l'écran. Ces affaires désignent maintenant un **témoin
clé** — celui qui lâche la phrase qui change tout.

**Les indices collent à l'affaire.** Un indice qui désigne quelqu'un —
des traces de pattes, un billet, le menu du livreur — porte une
étiquette, et n'apparaît que dans les affaires qui portent la même. Des
traces de pattes dans une affaire sans chat, c'est une piste qu'on ne
peut jamais refermer. Les indices neutres, eux, vont partout : il reste
des fausses pistes, mais des fausses pistes qu'on peut refermer.

**Le générateur d'affaire** tire un scénario sur trois au début de la
partie, puis en déduit le coupable, la cachette et les six indices —
jamais l'inverse. Une enquête impossible ne peut donc pas sortir, et la
suite de tests le vérifie sur trois cents tirages : six indices sans
doublon, six meubles distincts, jamais d'indice sur la cachette, et les
deux indices porteurs toujours présents.

**Marini, maire de Compiègne**, quatre-vingts ans, véreux et galant.
Thèmes `officiel` — il signe, il tamponne, il saisit — et `argent`.
« Un buffet non déclaré, c'est un buffet saisi. La loi, c'est la loi. »
« Je ne me souviens pas de la pizza. Je me souviens très bien d'elle. »

**Martin, agent de sécurité**, boxeur, ancien comptable. Thèmes
`securite`, `porte` et `argent`. C'est le témoin qu'on rêve d'avoir :
« Vingt-deux entrées, dix-neuf sorties. Ça ne tombe jamais juste. »
« Il manque exactement trois parts. J'ai recompté. »

**Des gens passent.** Toutes les 42 à 78 secondes, quelqu'un entre par
un bord, s'arrête près des inspecteurs, dit une phrase et repart.
**Chacun ne passe qu'une fois par partie** : leur venue doit être un
événement, pas une ronde. Quand les quatre sont passés, il n'en vient
plus d'autres.

Sept fois sur dix, on envoie celui qui a quelque chose à dire sur
l'affaire en cours — leur unique passage doit compter.

| | |
|---|---|
| **FRANCKY, DU D'TOUR** | Barman. Cocktail « bonne nuit les petits ». `dodo`, `alcool` |
| **JOJO LE NAIN** | Barman de l'Entrepotes, plombier, marié à une femme très grande. `plomberie`, `hauteur`, `alcool` |
| **MARINI, MAIRE DE COMPIÈGNE** | Quatre-vingts ans, véreux, aime les femmes. `porte`, `argent` |
| **MARTIN, AGENT DE SÉCURITÉ** | Boxeur autiste, ancien comptable. Il compte tout. `salon`, `argent`, `chat` |

Seuls des personnages écrits pour le jeu figurent au registre : un
passant sans histoire ne vaut pas la peine d'interrompre une enquête.

Sept fois sur dix, si l'affaire touche à l'un de ses thèmes, il tombe
pile sur le sujet. Sinon il dit quelque chose d'utile sur l'affaire, ou
rien du tout — « Francky met trop de sirop. Je le dis depuis dix ans. »

Les répliques utiles ne sont **pas écrites d'avance** : elles sont
fabriquées à partir de l'affaire en cours, sinon un passant pourrait
envoyer chercher dans un meuble vide. « À votre place, je regarderais la
poubelle. » ne sort que s'il y a effectivement quelque chose à la
poubelle. Un test le vérifie sur cent vingt affaires.

Ils ne coupent jamais Hortense, ni le dossier, ni l'accusation.

**Francky, du D'Tour**, barman, spécialiste du cocktail « bonne nuit les
petits » — deux doses, et on ne se réveille pas. Il a des répliques
**liées** : elles ne sortent que dans les affaires qui portent
l'étiquette `dodo` ou `alcool`. « J'en ai servi un ici, vers 20 h 15.
Après ça, plus personne n'a rien vu. » Ailleurs, il parle de sa tournée
impayée.

Trois affaires lui donnent la parole : la sieste, la tournée « bonne
nuit les petits » où la seule personne à jeun a tout mangé, et le
réveil où l'appartement entier s'était endormi et où plus personne ne
savait où il avait posé la boîte.

**Jojo le nain**, barman de l'Entrepotes, plombier le reste du temps, et
marié à une femme de très grande taille. Trois thèmes lui répondent :
`plomberie` — c'est lui qui a posé le siphon de l'évier —, `alcool` — il
sert le second verre après celui de Francky —, et `hauteur`, parce que sa
femme atteint les placards du haut sans monter sur rien.

Neuf affaires lui donnent la parole : la fuite d'évier qui a fait vider
le placard du bas avec la pizza dedans, le siphon démonté les mains
libres, la boîte à pizza transformée en bassine, le placard du haut sans
trace de tabouret, le tabouret mal remis de trente centimètres, la pizza
rangée en hauteur devant deux inspecteurs qui n'ont jamais levé la tête,
la tournée des deux bars, et la tournée dont personne n'a compté les
verres.

Chaque thème compte au moins trois affaires — un test le refuse en
dessous, parce qu'un thème sous-alimenté rend un personnage à moitié
muet.

### Ajouter un visiteur

Le registre `VISITEURS` attend un sprite, un nom, le côté d'arrivée et
trois répliques pour ne rien dire. En option, `lie` associe des
répliques à une étiquette d'affaire — c'est ce qui fait qu'un passant
tombe parfois pile sur le sujet. Les répliques utiles, elles, sont
communes : elles viennent de l'affaire. Un visiteur tient donc en six à
dix lignes.

Un test refuse une réplique liée à une étiquette qu'aucune affaire ne
porte : elle dormirait pour toujours.

**Hortense** intervient une fois, entre 35 % et 65 % du temps, jamais
pendant le dossier ni pendant l'accusation. Mais **parler à sa sœur,
c'est la prévenir** : une fois sur deux elle rapplique dans les
secondes qui suivent, sinon l'attente est franchement raccourcie — et
insister finit toujours par payer. Gabi le dit elle-même : « Je viens
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

## Niveau 3 — la tournée du D'Tour

PF et Thibaut sont de retour au bar — mais un seul y va. **CHOISIS TON
CHAMPION** : Thibaut court vite et boit lentement, PF, c'est l'inverse.
Aucun des deux n'est meilleur, un test surveille l'équilibre
(vitesse × cadence de descente : moins de 35 % d'écart).

Devant un très long comptoir — le fond mis trois fois bout à bout, une
seule grande salle —, **Francky sert les cocktails à gauche, Jojo les
Jägerbombs à droite**. Un verre posé vit sept secondes et demie (cinq
en plein coup de feu), sa jauge circulaire vire au rouge, puis RATÉ, la
série tombe — **et le verre reste là**. Il traîne, grisé : le boire ne
donne plus rien (« ÉVENTÉ… »), le JETER débarrasse (+10). À cinq verres
qui traînent, **LE BAR DÉBORDE** et l'ambiance file tant qu'on ne fait
pas le ménage. Les verres frais passent toujours avant les traînes sous
la main.

Deux boutons : **BOIRE** et **JETER**. Quatre issues :

| On fait | Sur | Résultat |
|---|---|---|
| BOIRE | cocktail / Jäger | **PARFAIT !** — points × combo, ambiance +7 |
| JETER | eau | **PAS DUPE !** — +150, la série continue |
| BOIRE | eau | **DE L'EAU ?!** — gel, combo perdu, ambiance −8 |
| JETER | cocktail / Jäger | **SACRILÈGE !** — −80, combo perdu |

**Les barmans télégraphient.** Francky prépare **en cinq temps** — il
choisit sa bouteille, il verse, il shake, il remue, il décore — et c'est
le signal le plus long du niveau : un cocktail se voit venir de loin.
Jojo fait **quatre temps** : il choisit, il dose, il verse dans le shot,
il superpose les couleurs. Cette différence de longueur est en soi une
information — on reconnaît le barman à son rythme avant de regarder ce
qu'il tient. Les deux tiennent leur poste **en face des étagères** (0,24
et 0,76 du monde) : rapprochés pour qu'on les voie tous les deux, ils se
retrouvaient au bord d'une copie du décor, devant les toilettes et le
frigo. C'est le rôle des chevrons de bord, pas celui des barmans. Et chez les deux, **le chiffon
tranquille annonce l'eau**. Elle n'apparaît qu'après vingt-cinq
secondes, puis environ une fois sur quatre. Un bon joueur lit le geste
avant que le verre touche le bois.

Le comptoir fait trois écrans : quand un barman prépare hors champ, un
**chevron au bord de l'écran** en donne la couleur et l'avancement, et
les verres déjà posés hors champ ont le leur avec leur jauge de vie.
Sans ces repères l'anticipation n'existait pas — on découvrait les
verres en arrivant dessus.

**Jamais d'injouable.** Avant de servir, le pattern vérifie que le
verre est atteignable : distance à la vitesse du champion, plus le
geste de boire, plus les verres déjà posés, le tout dans la vie du
verre avec une marge. Difficile, oui ; impossible, jamais — un test
le vérifie sur le pire cas (PF chargé, verre à l'autre bout).

**Boire immobilise.** C'est la faiblesse de Thibaut : pendant sa longue
descente, il ne bouge plus, et les verres vieillissent.

**Boire trop vite saoule.** Trois verres coup sur coup — moins de neuf
secondes entre le premier et le troisième — et c'est **POMPETTE !** :
cinq secondes où la salle se dédouble, où le champion tangue et
n'avance plus qu'à moitié, avec les jambes qui dérivent toutes seules.
Le garde-fou le sait : les barmans servent moins loin tant que ça
tangue. C'est la contrepartie naturelle de PF — il enchaîne vite, il
titube vite. Et l'eau gagne enfin une vertu : **la boire dessoûle
instantanément** (elle casse toujours le combo — à chacun de choisir
son poison).

La soirée monte : un verre à la fois, puis deux après 45 s, puis le
**🔥 COUP DE FEU 🔥** vers 70 s — vingt secondes où tout accélère, trois
verres possibles, la musique passe de 96 à 118.

### Comment on gagne, comment on perd

La soirée dure **2 min 30**, et la jauge **AMBIANCE** part à 35 : il y a
de quoi monter, et de quoi tomber. Elle **fuit toute seule** de 0,35 par
seconde — ne rien faire, c'est perdre. Chaque bonne décision rend 8,
chaque erreur en coûte 8, un verre raté 5.

| Issue | Ce qui l'a déclenchée |
|---|---|
| **SOIRÉE VALIDÉE** | jauge pleine → DERNIÈRE TOURNÉE → 5 décisions réussies |
| **LE BAR S'EST VIDÉ** | la jauge est tombée à zéro |
| **SOIRÉE ÉCOURTÉE** | 2 min 30 écoulées sans avoir rempli la jauge |

L'écran de fin dit toujours **pourquoi** : une défaite qu'on ne comprend
pas ne se rejoue pas.

### Les points

| Geste | Points |
|---|---|
| Cocktail bu | 100 |
| Jägerbomb bu | 120 |
| Eau jetée | 150 |
| **SUR LE COUP** (bu dans la 1,6 s après le CLAC) | +50 |
| Verre qui traîne, débarrassé | +10 |
| Sacrilège | −80 |

Le tout multiplié par le combo — ×2 à 3 enchaînements, jusqu'à **×5**,
plafond assumé pour que la prime de vitesse reste intéressante. À la
victoire s'ajoutent le meilleur combo ×40, le temps restant ×5 et
l'ambiance finale : finir vite et fort paie mieux que finir de justesse.

### Le bar est habité

Quatre habitués entrent et sortent : **Gabi, le maire, Martin et
Mathilde**. Gabi et le maire ont leurs gestes complets — ils marchent,
se servent, boivent, repartent le verre en main. Martin et Mathilde
n'ont pas encore de pose de consommation : ils se servent sans changer
d'expression, et le code se rabat proprement là-dessus. Ils longent le
comptoir, et un verre laissé là depuis plus de la moitié de sa vie
**finit dans leur main**. Ce n'est pas une punition de plus : le verre chipé ne devient pas
une traîne, ils font le ménage à notre place — mais les points partent
avec eux.

Et surtout : **personne ne vole un verre d'eau.** Un verre qui reste
planté là alors qu'un habitué passe devant, c'est de l'eau. Le niveau
gagne un indice sans une ligne d'interface.

Risoto traverse parfois le bas de l'écran. Et Hortense traverse le bar,
**s'arrête au milieu et montre sa tarte au citron**… puis une fois sur
deux **elle la lance vraiment**.

Alors le bouton **ESQUIVER** apparaît — dès que la tarte est en l'air,
pas seulement pendant la fenêtre, pour qu'on ait le temps de se
préparer — et il n'est jamais éteint. BOIRE esquive aussi, c'est la
touche déjà sous le pouce, et la touche A au clavier. Réussi : +200 et
de l'ambiance. Manqué : gel, combo perdu, −10 d'ambiance.

### Les lumières du comptoir

Chaque verre pose un **halo coloré** sur le bois : chaud pour un
cocktail, ambré pour un Jägerbomb, **franchement froid pour l'eau**.
C'est de la décoration qui travaille — le piège se lit à pleine vitesse,
du coin de l'œil. Un **projecteur** tombe sur le verre pendant la
seconde qui suit le CLAC, un **liseré de néon** court le long du
comptoir au tempo exact de la musique (même source, sinon l'œil et
l'oreille se contredisent), il vire à l'ambre à combo 5 et au rouge à
combo 10, deux taches balaient le plafond au-delà de 5, et le comptoir
prend un éclat à chaque réussite. Tout en dégradés : pas un
`shadowBlur`.

### Le son

Un lit d'ambiance de bar synthétisé — brouhaha filtré qui monte d'un ton
au coup de feu, verres qu'on pose au loin, éclats de rire — et un vamp
funk majeur, basse qui marche, accords à contretemps, charley aux
croches. Rien n'est échantillonné : le jeu reste un seul fichier.

### Les dix poses

Chaque champion a sa planche : repos, deux temps de marche, course,
freinage, attrape, boit, verre vide, jette, titube. La pose se **déduit**
de l'état — le geste de boire est une seule minuterie dont on lit
l'avancement (attrape → boit → vide), donc l'image ne peut pas se
désynchroniser de la mécanique. La pose de titubage sert à la pompette,
le freinage à l'arrêt d'un sprint.

Pendant **CHOISIS TON CHAMPION**, le pupitre reste rangé : on choisit
au doigt sur les deux cartes, et les commandes n'apparaissent qu'une
fois le champion en place — elles n'avaient rien à piloter.

**Au doigt** : les deux flèches dans le coin bas gauche, JETER puis
BOIRE dans le coin bas droit — BOIRE le plus au bord, c'est la touche
la plus utilisée. Rien au milieu : le champion se joue au centre de
l'écran, des touches centrées le masquaient. Cibles de 50 px minimum,
fond opaque (une pastille translucide disparaît sur un décor de bar),
vert pour BOIRE, rouge pour JETER. Quand aucun verre n'est à portée
elles se ternissent **sans s'effacer** — le pouce doit savoir où se
poser. Onze tests verrouillent cette disposition.

Clavier : flèches ou Q pour courir, E / ENTRÉE / ESPACE pour BOIRE,
J pour JETER. En debug (`?debug=1` + O) : 1 cocktail, 2 eau Francky,
3 Jägerbomb, 4 eau Jojo, R coup de feu, C combo ×10.

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

Le bouton **Esquiver** reste vif et cliquable en permanence, même quand
aucune tarte n'est en l'air : grisé, il passait pour désactivé et
personne n'osait le presser — or il faut l'avoir déjà sous le pouce
quand la tarte arrive, on n'a que 450 ms. Il s'entoure d'un halo et
clignote quand la fenêtre s'ouvre, et une pression à vide répond « PAS
DE TARTE » plutôt que rien du tout.

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

Le script d'`index.html` est découpé en neuf morceaux dans `parts/`,
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
