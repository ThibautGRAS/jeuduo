# LES PERSONNAGES DE CALLAGHAN

La référence unique. Avant d'écrire un niveau, une réplique ou une
affaire, c'est ICI qu'on vérifie qui est qui — les traits ci-dessous
sont déjà joués dans les niveaux existants, les contredire casserait
des dialogues en production. Quand un détail diverge entre ce fichier
et le code, **le code fait foi** et ce fichier doit être corrigé.

---

## Les deux inspecteurs

### PIERRE-FRANÇOIS (« PF »)
- **Physique : chauve, lunettes.** C'est LE point à ne jamais rater —
  deux planches de sprites ont déjà tenté l'inversion (voir MEMOIRE.md).
- Couleur d'interface : **bleu `#2A8AE4`**, `Heros[0]`, il tient la
  **gauche** de l'écran au niveau 1. Le bleu vient de son sweat à
  capuche marine — le vert appartient à Thibaut, qui le porte.
- Voussoie Charles, tutoie Teo et sa belle-sœur. La sœur d'Hortense est
  sa belle-sœur.
- Au niveau 2, c'est **l'inspecteur qui inspecte** : posé, méthodique,
  il corrige les hypothèses farfelues de Thibaut.
- Au niveau 3 : **boit vite, court lentement** (vitesse 0.82,
  descente 0.65). « Lent. Mais redoutable une fois au comptoir. »
  Revers de la médaille : il enchaîne si vite qu'il se met POMPETTE
  plus facilement que Thibaut — l'eau le dessoûle.
- Dix poses au bar (`bar_pf_*`) : repos, marche1, marche2, course,
  frein, attrape, boit, vide, jette, titube. Planche séparée de celle
  de Thibaut, pour qu'aucun des deux ne puisse glisser dans l'autre.
- Sprites : `pierre_*` (n1), `enq_pf_*` (n2), `bar_pf_*` (n3),
  `face_pierre` (commun).

### THIBAUT
- **Physique : brun, polo vert, sac à dos.**
- Couleur d'interface : **vert `#37AC48`**, `Heros[1]`, il tient la
  **droite** de l'écran au niveau 1 — la couleur de ses vêtements.
- Au niveau 2, c'est **l'inspecteur qui interroge** : il propose des
  théories absurdes (« Le tabouret a mangé la pizza. Non ? Bon. ») et
  oppose le dossier aux témoins.
- Au niveau 3 : **court vite, boit lentement** (vitesse 1.00,
  descente 1.00). « Rapide. Mais quand il boit, il ne fait que ça. »
  Sa seule pose d'action le montre buvant ET jetant à la fois — elle
  sert aux deux gestes, c'est dans le personnage.
- Sprites : `thibaut_*` (n1), `enq_th_*` (n2), `bar_th_*` (n3),
  `face_thibaut` (commun).

---

## Les adversaires et la famille

### HORTENSE
- La lanceuse de tartes au citron meringuées. Passe **par les fenêtres**
  au niveau 1, **frappe à la porte** au niveau 2 (et il FAUT lui
  ouvrir : elle attend, l'enquête se gèle).
- Au niveau 3 elle traverse le bar, **s'arrête au milieu et montre sa
  tarte**, puis repart sans la lancer. Sprites du passage :
  `bar_hortense_{marche1,marche2,tarte}`.
- Le fond du bar l'affiche : « Hortense a dit : pas de tarte, pas de
  service. » et « Règle n°1 du D'Tour : ne jamais dire non à Hortense. »
- Sprites : `h_*` et `tarte*`, `debris_*` (commun).

### GABI
- Colocataire de l'appartement du niveau 2, **sœur d'Hortense** la
  lanceuse de tartes, et **belle-sœur de Pierre-François**. Amie de
  Teopedo, et **amante secrète de Charles** — ils vivent sous le même
  toit et personne n'est au courant. Elle
  s'appelait « la sœur d'Hortense » jusqu'à la v6.5 ; c'est Gabi.
- Un rouleau de papier toilette dans la poche. Sans explication.
- Habitante interrogeable (couloir). Lui parler peut **provoquer** une
  visite d'Hortense — insister finit toujours par payer.
- Au niveau 3, habituée du bar et **entièrement animée** :
  `bar_gabi_{idle,marche1,marche2,attrape,boit,vide}`, verre de vin
  compris. Elle longe le comptoir et chipe les verres qu'on a laissés
  traîner.
- Sprite : `pers_gabi` (commun). Fait la queue au niveau 1.

### RISOTO (le chat)
- Le chat de l'appartement. Ne parle pas — il ne répond qu'à ses
  propres sujets et **jamais aux confrontations**.
- Peut être le coupable d'une affaire sur trois environ.
- Au niveau 3 il traverse le bas de l'écran, c'est tout.
- Sprite : `susp_chat` (commun).

---

## Les habitants de l'appartement (niveau 2)

### TEO (TEOPEDO)
- Gamer avachi sur le canapé, manette en main. PF le tutoie. Son nom
  affiché est **TEOPEDO** — c'est bien son nom, pas une coquille.
- Il **se lève enfin** depuis la v6.20 : sa planche en pied lui rend des
  jambes, il est habitué du bar au niveau 3
  (`bar_teo_{idle,marche1,marche2,attrape,boit,vide}`).
- Son sprite assis `pers_teo` reste : c'est lui qui occupe le canapé de
  l'appartement, et c'est sa signature.
- Sprites : `pers_teo` (commun, assis), `bar_teo_*` (n3, en pied).

### CHARLES
- **Amant secret de Gabi.** Il connaît aussi PF et Hortense.
- Lunettes noires **à l'intérieur**, parie sur tout — y compris avec le
  chat (« Il ne compte pas. »). PF le vouvoie.
- Au niveau 2 il est **assis à la table** : son sprite `pers_charles`
  n'a pas de jambes, il ne peut donc pas faire la queue au niveau 1.
- Sa planche de v6.10 lui a donné des jambes : il est **habitué du bar
  au niveau 3**, entièrement animé —
  `bar_charles_{idle,marche1,marche2,attrape,boit,vide}`.
- Son allure a été rajeunie à cette occasion (jeune homme, chemise
  rayée pastel sur t-shirt crème) ; les lunettes noires portées à
  l'intérieur restent, et c'est tout ce qui compte pour le personnage.
- Sprites : `pers_charles` (commun, assis), `bar_charles_*` (n3).

---

## Les deux barmans

### FRANCKY, DU D'TOUR
- Barman du D'Tour. Chemise hawaïenne, lunettes noires, t-shirt
  Lonsdale. Spécialiste du cocktail **« bonne nuit les petits »** —
  deux doses, et on ne se réveille pas.
- Visiteur du niveau 2, thèmes `dodo` et `alcool` ; hors sujet, il
  râle sur sa tournée impayée (« Francky met trop de sirop. Je le dis
  depuis dix ans », dit un autre).
- Au niveau 3 il tient la **gauche** du comptoir (0,34) et sert les
  **cocktails**. Son télégraphe est le plus long du niveau, en cinq
  temps : il choisit sa bouteille, verse, shake, remue, décore. S'il
  essuie tranquillement un verre au chiffon, méfiance — c'est de l'eau.
- Il a désormais une silhouette **en pied** (`pers_francky`, refaite en
  v6.20) : il peut donc habiter l'appartement du niveau 2, pas seulement
  y frapper à la porte.
- Sprites : `pers_francky` (commun, en pied), `bar_francky_{idle,choisit,
  verse,shake,remue,decore,sert,essuie}` (n3, bustes derrière le bar).

### JOJO LE NAIN
- Barman de **l'Entrepotes**, plombier le reste du temps, marié à une
  femme de très grande taille. Tablier-salopette « Entrenain ».
- Visiteur du niveau 2, thèmes `plomberie`, `hauteur`, `alcool`.
- Au niveau 3, il vient prêter main-forte au D'Tour — l'ardoise
  « JÄGERBOMBS DE JOJO » est au mur — et tient la **droite** du
  comptoir (0,66). Son télégraphe : le doseur puis le shot. Le chiffon
  tranquille, c'est de l'eau.
- Silhouette **en pied** depuis la v6.20 (`pers_jojo`).
- **Sa petite taille est déclarée dans le code**, pas dans le dessin :
  ses planches le donnent avec les proportions d'un homme trapu
  ordinaire (rapport tête/hauteur 0,168, identique à Francky).
  `ECHELLE_PERSO.jojo = 0.74` le réduit **partout à la fois** — derrière
  le comptoir, en visiteur, en habitué. Si une nouvelle façon de
  l'afficher apparaît un jour, elle doit passer par `echellePerso()`,
  sinon il redevient grand à cet endroit-là. Un test compte les usages.
- Sprites : `pers_jojo` (commun, en pied), `bar_jojo_*` (n3, bustes).

---

### MATHILDE
- **Petite amie de Thibaut.** Professeure d'histoire, sportive, et elle
  aime faire la fête — les trois à la fois, sans contradiction.
- Visiteuse du niveau 2, thèmes `alcool` et `chat`. C'est la seule qui
  parle de **méthode** : chronologie, sources, recoupement. « Une
  soirée, ça se reconstitue comme une bataille : qui était où, et à
  quelle heure. » Sur le chat : « Un chat n'a pas de mobile. Retenez
  ça. »
- Habituée du bar au niveau 3, **entièrement animée** :
  `bar_mathilde_{idle,marche1,marche2,attrape,boit,vide}`. Elle marche,
  se sert et boit comme Gabi et le maire.
- Fait la queue au niveau 1.
- Sprite : `pers_mathilde` (commun).

---

### TRISTAN
- **Ami de Thibaut, pote de PF aussi.** Boxe et course à pied, et il aime
  la fête autant que le sport — les deux sans contradiction, comme
  Mathilde.
- **Petit ami de Solène**, elle-même amie de Mathilde. C'est Solène qui a
  **adopté Risoto**, le chat roux.
- Habitué du bar au niveau 3, entièrement animé :
  `bar_tristan_{idle,marche1,marche2,attrape,boit,vide}` (n3). Chemise
  blanche à bananes, pantalon gris, baskets blanches.
- Il n'a **pas** de sprite d'appartement : il n'existe qu'au bar pour
  l'instant. Sa silhouette de repli est sa propre pose de repos.

### SOLÈNE
- **Petite amie de Tristan**, amie de Mathilde. Drôle, elle aime les
  chats et le vélo.
- **Le chat, c'est toute son histoire** : Risoto vit dans l'appartement
  et appartient à Gabi — mais c'est Solène qui le nourrit, et **elle est
  convaincue qu'il est à elle**. Ce malentendu tenace est du matériau
  de scénario tout prêt : deux personnes revendiquent le même animal,
  et l'une des deux ment sans le savoir.
- Habituée du bar au niveau 3, entièrement animée :
  `bar_solene_{idle,marche1,marche2,attrape,boit,vide}` (n3). Cheveux
  longs châtains, lunettes de soleil relevées sur la tête, blouson noir,
  jean clair.
- Pas de sprite d'appartement pour l'instant : sa silhouette de repli
  est sa propre pose de repos.

---

### KEVIN
- **Professeur de mathématiques**, salle de sport et course à pied.
  Éternel célibataire, il aime sortir, faire la fête et les femmes — et
  il en parle. Survêtement gris intégral, il ne se change jamais.
- Ami de **Thibaut** et de **Rémy**. Il connaît Mathilde, Solène et
  Tristan.
- Habitué du bar au niveau 3 : `bar_kevin_*` (n3). Pose assise :
  `assis_kevin` (n2).

### RÉMY
- **Professeur d'histoire**, comme Mathilde — et comme Teo. Trois profs
  d'histoire dans la même bande, c'est assumé : c'est comme ça qu'ils se
  sont connus.
- Course à pied, vélo, **paris sportifs** et foot. Il aime aussi les
  travaux, et la fête. Chemise à motifs, écharpe grise, il l'a toujours.
- Ami de **Mathilde, Tristan, Thibaut, Kevin et Solène**, et il connaît
  **PF**. C'est le personnage le plus relié de la bande : de quoi
  construire des recoupements dans les affaires à venir.
- Habitué du bar au niveau 3 : `bar_remy_*` (n3). Pose assise :
  `assis_remy` (n2).

---

## La carte des liens

C'est la donnée qui sert à deux choses : **conseiller le bon inspecteur**
au niveau 2, et **fabriquer les recoupements** des affaires. Un témoin
interrogé par quelqu'un qui le connaît en dit plus, et craque plus vite.

| Personnage | Amis | Connaît | Inspecteur conseillé |
|---|---|---|---|
| Mathilde | Thibaut, Solène, Rémy, Kevin | Tristan | **Thibaut** |
| Tristan | Solène, Thibaut, Kevin, Rémy | Mathilde, PF | **Thibaut** |
| Kevin | Tristan, Mathilde, Solène, Rémy | PF | les deux |
| Rémy | Thibaut, Tristan, Mathilde | PF, Kevin | les deux |
| Solène | Tristan, Mathilde, Kevin | Gabi | — |
| Teopedo | Gabi, Hortense, PF | Thibaut (vaguement) | **PF** |
| Charles | Gabi (voir ci-dessous) | PF, Hortense | **PF** |
| Gabi | Solène, Teopedo | Charles, PF, Hortense | **PF** |
| Francky | **adore Mathilde** | tout le bar | — |
| Jojo | **n'aime pas Mathilde** | tout le bar | — |
| Marini, Martin | — | — | — |

### Les trois nœuds à exploiter

**Gabi et Charles sont amants, et personne ne le sait.** Ils vivent dans
le même appartement, l'une debout dans le couloir, l'autre attablé. Ils
ont donc tous les deux une raison de mentir sur où ils étaient et avec
qui — **une raison qui n'a rien à voir avec l'enquête**. C'est le
meilleur moteur d'une affaire : deux témoignages faux, deux innocents,
et des inspecteurs qui tirent la mauvaise conclusion s'ils se contentent
de la contradiction. Corollaire de jeu : accuser l'un des deux sur la
foi de son mensonge doit être un piège qui coûte cher.

**Le chat a deux maîtresses.** Risoto appartient à Gabi ; Solène le
nourrit et est convaincue qu'il est à elle. Deux témoignages sincères et
incompatibles sur le même animal.

**Mathilde divise les deux barmans.** Francky l'adore, Jojo ne la
supporte pas. C'est la seule inimitié franche de la bande, donc la seule
source de témoignages de mauvaise foi assumée.

### Ce qui reste à inventer

Aucune inimitié à l'intérieur de la bande d'amis : tout le monde
s'apprécie. Une brouille, une dette, une rancune ancienne — n'importe
laquelle donnerait beaucoup aux affaires.

---

## Les visiteurs (niveau 2)

### MARINI, MAIRE DE COMPIÈGNE
- Quatre-vingts ans, véreux et galant. Thèmes `officiel` et `argent`.
- « Je ne me souviens pas de la pizza. Je me souviens très bien
  d'elle. » Il passe aussi à la télé du bar (« LE MAIRE FAIT LE
  POINT »).
- Habitué du bar au niveau 3 — il se sert, évidemment. Le seul habitué
  entièrement animé : `bar_marini_{idle,marche1,marche2,attrape,boit,vide}`.
- Sprite : `pers_marini` (commun). Fait la queue au niveau 1.

### MARTIN, AGENT DE SÉCURITÉ
- Boxeur, ancien comptable : **il compte tout**. Thèmes `securite`,
  `porte`, `argent`.
- « Vingt-deux entrées, dix-neuf sorties. Ça ne tombe jamais juste. »
- **Le décalage EST le personnage** : il a l'air d'un étudiant mince au
  sac à dos, et il annonce calmement qu'il fait la sécurité, qu'il a
  boxé, qu'il a été comptable. Personne ne le croit ; il note quand
  même. Ne jamais « corriger » cet écart entre le sprite et la fiche —
  c'est de là que vient le comique. Trois de ses répliques jouent
  dessus : « Oui, c'est moi la sécurité. Non, je ne vais pas grandir. »
- Habitué du bar au niveau 3 : `bar_martin_{idle,marche1,marche2}`. Sa
  planche n'a pas de pose de consommation, il se sert donc sans changer
  d'expression — ce qui lui va bien.
- Sprite : `pers_martin` (commun). Fait la queue au niveau 1.

---

## Où chacun apparaît

| Personnage | Niveau 1 | Niveau 2 | Niveau 3 |
|---|---|---|---|
| PF | héros (droite) | inspecteur | champion |
| Thibaut | héros (gauche) | inspecteur | champion |
| Hortense | attaque aux fenêtres | frappe à la porte | traverse, rare |
| Gabi | fait la queue | habitante | habituée du bar (animée) |
| Mathilde | fait la queue | visiteuse | habituée du bar |
| Tristan | — | — | habitué du bar (animé) |
| Solène | — | — | habituée du bar (animée) |
| Kevin | — | — | habitué du bar (animé) |
| Rémy | — | — | habitué du bar (animé) |
| Teo | terrasse | habitant | — |
| Charles | terrasse | habitant (assis) | habitué du bar (animé) |
| Risoto | — | suspect | traverse, clin d'œil |
| Francky | fait la queue | visiteur | barman (cocktails) |
| Jojo | fait la queue | visiteur | barman (Jägerbombs) |
| Marini | fait la queue | visiteur | habitué + télé du fond |
| Martin | fait la queue | visiteur | habitué du bar |

Ajouter un niveau, c'est piocher dans ce tableau — pas inventer des
gens : « seuls des personnages écrits pour le jeu valent la peine
d'interrompre une partie », et la règle vaut pour les easter eggs.
