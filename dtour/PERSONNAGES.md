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
- Couleur d'interface : **vert `#37AC48`**, `Heros[0]`, il tient la
  **droite** de l'écran au niveau 1.
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
- Couleur d'interface : **bleu `#2A8AE4`**, `Heros[1]`, il tient la
  **gauche** de l'écran au niveau 1.
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

### LA SŒUR D'HORTENSE
- Colocataire de l'appartement du niveau 2, sœur de la lanceuse,
  **belle-sœur de Pierre-François**.
- Habitante interrogeable (couloir). Lui parler peut **provoquer** une
  visite d'Hortense — insister finit toujours par payer.
- Au niveau 3, elle fait partie des **habitués du bar** : elle longe le
  comptoir et chipe les verres qu'on a laissés traîner.
- Sprite : `pers_soeur` (commun). Fait la queue au niveau 1.

### RISOTO (le chat)
- Le chat de l'appartement. Ne parle pas — il ne répond qu'à ses
  propres sujets et **jamais aux confrontations**.
- Peut être le coupable d'une affaire sur trois environ.
- Au niveau 3 il traverse le bas de l'écran, c'est tout.
- Sprite : `susp_chat` (commun).

---

## Les habitants de l'appartement (niveau 2)

### TEO
- Gamer, assis par terre devant son écran, **ne se lève jamais** (son
  sprite est assis — il ne peut pas faire la queue au niveau 1, il
  tient la terrasse). PF le tutoie.
- Sprite : `pers_teo` (commun).

### CHARLES
- Attablé, lunettes noires **à l'intérieur**, parie sur tout — y
  compris avec le chat (« Il ne compte pas. »). Assis à la table, sans
  jambes sur son sprite : lui aussi tient la terrasse au niveau 1.
  PF le vouvoie.
- Sprite : `pers_charles` (commun).

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
- Sprites : `pers_francky` (commun), `bar_francky_{idle,choisit,verse,
  shake,remue,decore,sert,essuie}` (n3).

### JOJO LE NAIN
- Barman de **l'Entrepotes**, plombier le reste du temps, marié à une
  femme de très grande taille. Tablier-salopette « Entrenain ».
- Visiteur du niveau 2, thèmes `plomberie`, `hauteur`, `alcool`.
- Au niveau 3, il vient prêter main-forte au D'Tour — l'ardoise
  « JÄGERBOMBS DE JOJO » est au mur — et tient la **droite** du
  comptoir (0,66). Son télégraphe : le doseur puis le shot. Le chiffon
  tranquille, c'est de l'eau.
- Sprites : `pers_jojo` (commun), `bar_jojo_*` (n3).

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
- Habitué du bar au niveau 3. Il compte probablement les verres.
- Sprite : `pers_martin` (commun). Fait la queue au niveau 1.

---

## Où chacun apparaît

| Personnage | Niveau 1 | Niveau 2 | Niveau 3 |
|---|---|---|---|
| PF | héros (droite) | inspecteur | champion |
| Thibaut | héros (gauche) | inspecteur | champion |
| Hortense | attaque aux fenêtres | frappe à la porte | traverse, rare |
| La sœur | fait la queue | habitante | habituée du bar |
| Teo | terrasse | habitant | — |
| Charles | terrasse | habitant | — |
| Risoto | — | suspect | traverse, clin d'œil |
| Francky | fait la queue | visiteur | barman (cocktails) |
| Jojo | fait la queue | visiteur | barman (Jägerbombs) |
| Marini | fait la queue | visiteur | habitué + télé du fond |
| Martin | fait la queue | visiteur | habitué du bar |

Ajouter un niveau, c'est piocher dans ce tableau — pas inventer des
gens : « seuls des personnages écrits pour le jeu valent la peine
d'interrompre une partie », et la règle vaut pour les easter eggs.
