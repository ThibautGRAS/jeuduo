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

**Adresse** : https://thibautgras.github.io/jeuduo/dtour/

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
