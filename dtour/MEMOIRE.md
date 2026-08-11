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
| Verre raté | il TRAÎNE (grisé) au lieu de disparaître | jeter = +10, boire = « ÉVENTÉ… » |
| Débordement | 5 traînes → ambiance −1.2/s | le ménage fait partie du service |
| Pompette | 3 verres bus en < 9 s → 5 s à vitesse ×0.55 | l'eau bue dessoûle instantanément |

Le garde-fou `faisable()` refuse tout verre injouable : distance à la
vitesse du champion + geste de boire + verres déjà posés < vie × 0.9.
Il travaille avec la vitesse EFFECTIVE : pompette, on sert moins loin.

### Un pupitre centré masque ce qu'on joue
Le pupitre du niveau 3 avait été copié de celui du niveau 2 —
`justify-content:center`. Au niveau 2 les sept touches bordent un
décor qu'on regarde de haut ; au niveau 3 le champion est **au centre
de l'écran**, et les quatre touches se sont posées sur lui. Deux
groupes, `space-between`, `pointer-events:none` sur le conteneur et
`auto` sur les groupes : le milieu redevient du décor cliquable. Un
style hérité d'un autre niveau se revérifie sur l'écran du niveau, pas
sur le papier.

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
