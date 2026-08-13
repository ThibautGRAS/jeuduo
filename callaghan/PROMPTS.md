# Les prompts de génération d'images

Mémo de tout ce qui sert à fabriquer les planches du jeu. Les règles du
premier chapitre ne sont pas décoratives : **chacune vient d'une planche
ratée**. Elles sont reprises dans chaque prompt, et il vaut mieux les
recopier telles quelles que les résumer.

Rappel : le découpage, le détourage et la mise à l'échelle se font
ensuite par script (Pillow + scipy). Personne ne retouche les images à
la main.

---

## 0. Comment ce document s'utilise

Il y a **deux familles de planches**, et elles ne se demandent pas de la
même façon.

### A. Les MOUVEMENTS — on ne les écrit plus, on les génère

Courir, marcher, sauter, s'accroupir, encaisser, tomber : ce sont les
mêmes gestes pour tous les personnages et tous les niveaux. Les écrire à
la main quatorze fois a produit exactement ce qu'on pouvait craindre —
des règles recopiées qui divergent, et un vocabulaire de pose réinventé à
chaque planche. C'est ainsi qu'on s'est retrouvé avec deux poses de
course ayant la MÊME jambe devant : personne n'avait jamais écrit ce
qu'était une phase de foulée.

```bash
python3 callaghan/planches.py mouvements          # ce qui existe
python3 callaghan/planches.py prompt thibaut course marche
```

Le prompt sort assemblé : la fiche du personnage, les phases décrites
une à une, et les contraintes techniques — toujours les mêmes, puisqu'il
n'y en a plus qu'une copie. Il se colle tel quel dans un générateur
d'images.

**Ajouter un mouvement** se fait dans `MOUVEMENTS`, en haut de
`planches.py`. Décrire chaque phase par ce qui la distingue **sur le bas
du corps** : c'est là que se voit une animation, pas dans les bras.

### B. Les planches SPÉCIALES — elles restent écrites ici

Tout ce qui n'est pas un mouvement de personnage : les décors, les
boutons d'interface, les icônes d'indices, les portraits de dialogue, et
les gestes propres à un niveau — servir un verre, lancer un pavé,
brandir un encensoir. Ceux-là sont uniques, donc ils s'écrivent, et les
sections 2 à 14 les gardent.

Une planche spéciale doit **rappeler les contraintes techniques**. Le
plus simple est de générer un prompt de mouvement quelconque et d'en
recopier le bloc final.

### C. CONTRÔLER LA PLANCHE AVANT DE LA DÉCOUPER

C'est le geste qui économise le plus d'allers-retours, et il n'existait
pas : les contrôles se faisaient à l'œil, souvent après découpage.

```bash
python3 callaghan/planches.py verifier planche.png 6
```

Il vérifie le fond, les quatre bords, le nombre de poses séparables,
l'écart entre voisines, l'égalité des têtes, l'alignement des pieds — et
pour un cycle, que **les jambes alternent vraiment**. Il refuse de dire
« conforme » tant qu'un point cloche, et dit lequel.

Ce dernier contrôle a été écrit après coup, sur une planche livrée : il
retrouve tout seul le défaut que Thibaut avait repéré à l'œil et que
trois séances de réglage n'avaient pas expliqué.

---

## 1. Les règles communes, et pourquoi

**Fond magenta uni `#FF00FF`.** Le détourage repère le fond par sa
TEINTE et par sa CONNEXITÉ : on garde les zones magenta qui touchent un
bord de l'image, le reste est du personnage. C'est ce qui permet de
laisser les ombres portées (elles touchent le bord) sans effacer un
manteau violet (il est enclos dans la silhouette). Les deux premières
versions du détourage, par teinte seule puis par teinte et clarté, ont
chacune produit un bug visible en jeu.

**Aucune ombre portée** reste préférable malgré tout : c'est du bruit en
moins.

**Aucun décor.** Un bout de comptoir dessiné sous un barman ne s'aligne
jamais avec le comptoir du jeu : on le voyait flotter. Idem pour un
canapé sous une pose assise.

**Aucun texte.** Les légendes blanches laissent un halo antialiasé
au-dessus des têtes voisines.

**Espacement strict.** C'est la règle la plus souvent violée, et celle
qui bloque tout : deux poses qui se touchent ne peuvent pas être
séparées automatiquement. Formulation qui a fini par marcher :

> Au moins 80 px de fond magenta VIDE entre deux poses voisines. Aucune
> partie d'un personnage — bras tendu, jambe de course, verre,
> éclaboussure — ne doit entrer dans la colonne d'à côté. Vérification :
> en balayant l'image de gauche à droite, on doit pouvoir tracer un
> trait vertical entièrement magenta entre deux poses voisines.

**Échelle identique sur toute la planche**, rangées comprises. Même
taille de tête partout. Un sprite n'a pas de taille, il a une échelle :
à hauteur d'écran constante, seule une hauteur SOURCE constante garde le
personnage à sa taille. Thibaut a eu 62 px d'écart entre ses poses — il
grandissait en titubant.

**Pieds alignés au pixel** sur une ligne de sol commune, rangée par
rangée. Le découpage ancre sur le centre des CHAUSSURES : c'est ce qui
empêche le corps de dériver latéralement pendant un cycle de marche.

**La tête est le point le plus haut**, 60 px de vide au-dessus. Un objet
levé au-dessus de la tête fausse l'ancrage.

**Numéroter les poses** (petits chiffres au-dessus) aide à la relecture,
mais ils doivent être franchement séparés des personnages.

---

## 2. Prompt STANDARD — 10 poses en pied

Sert aux habitués du bar, aux habitants de l'appartement, à tout le
monde sauf les barmans et les héros.

```
Planche de sprites pour un jeu vidéo 2D en vue de côté, style cartoon :
contour noir net, cel-shading en 2-3 tons, personnage légèrement
caricatural mais proportions réalistes, lumière venant du haut à l'avant.

PERSONNAGE (le même sur toute la planche, sans aucune exception) :
>>> COLLER ICI LA DESCRIPTION <<<

=== FORMAT (impératif) ===
- Une seule image PNG, au moins 1536 px de large.
- Fond MAGENTA UNI #FF00FF, parfaitement plat.
- AUCUNE OMBRE PORTÉE, même légère, même sous les pieds.
- AUCUN DÉCOR : ni sol, ni mur, ni meuble, ni objet posé.
- AUCUN TEXTE : ni titre, ni légende, ni flèche, ni cadre.
- Chaque pose fait au moins 400 px de haut, au moins 80 px de vide entre
  deux poses, aucun chevauchement, aucun membre coupé par le bord.
- Personnage tourné vers la DROITE, légère perspective trois quarts.

=== LES TROIS RÈGLES QUI COMPTENT LE PLUS ===
1. ÉCHELLE IDENTIQUE PARTOUT, d'une rangée à l'autre comprise.
2. PIEDS ALIGNÉS AU PIXEL sur une ligne de sol commune, par rangée.
3. LA TÊTE EST LE POINT LE PLUS HAUT, 60 px de vide au-dessus.

=== MISE EN PAGE : 5 colonnes x 2 rangées = 10 poses ===
Rangée 1 : 1. debout au repos, bras le long du corps — 2. marche, jambe
gauche devant — 3. marche, jambe droite devant (contre-temps de la 2) —
4. course rapide, buste penché — 5. freinage, talons plantés.
Rangée 2 : 6. penché en avant, main droite tendue, main ouverte et VIDE
(il va saisir un verre) — 7. boit, verre transparent à la bouche, tête
en arrière — 8. verre vide tenu bas, air satisfait — 9. jette le contenu
sur le côté d'un geste large, quelques gouttes — 10. ivre et titubant,
genoux fléchis, buste vrillé, sourire béat.
```

Le jeu n'utilise que 6 de ces poses pour un habitué (repos, deux temps
de marche, saisir, boire, verre vide) ; les autres servent aux
personnages jouables.

---

## 3. Prompt HÉROS DU BAR — 14 poses

Pour Thibaut et PF au niveau 3. Même bloc FORMAT et mêmes trois règles.

```
=== MISE EN PAGE : 7 colonnes x 2 rangées = 14 poses ===
Rangée 1 : 1. repos — 2, 3, 4, 5. les quatre temps d'un cycle de marche
complet (la 5 doit enchaîner naturellement sur la 2) — 6, 7. les deux
temps d'une course.
Rangée 2 : 8. freinage — 9. penché, main tendue et VIDE — 10. il tient
le verre devant lui et le regarde — 11. il boit, tête en arrière —
12. verre vide tenu bas — 13. il jette le contenu sur le côté —
14. ivre et titubant.
```

Les poses 9 à 12 forment la descente en quatre gestes : c'est le
dernier temps, le verre vide, qui donne son poids à la lenteur de
Thibaut.

---

## 4. Prompt HÉROS DE LA FILE — 8 poses (niveau 1)

Vue de FACE, en pied. La pose 7 porte une contrainte technique
particulière.

```
=== CADRAGE ===
Personnage EN PIED, vu de FACE (très légèrement de trois quarts), regard
vers le spectateur. 8 colonnes x 1 rangée.

=== LA CONTRAINTE CRUCIALE : LA MAIN DE LA POSE 7 ===
- bras droit tendu vers la DROITE, à l'horizontale, hauteur de poitrine ;
- main GRANDE OUVERTE, paume de profil, doigts écartés ;
- main NETTEMENT DÉTACHÉE du corps, au moins 30 px de vide ;
- rien d'autre ne dépasse à droite dans cette pose.
Dans les 7 autres poses, aucune main ne part vers la droite.

=== LES 8 POSES ===
1. repos — 2. attente, regard ailleurs, épaules basses — 3. marche sur
place — 4. il regarde un client qui arrive sur sa droite — 5. surpris,
sursaut franc — 6. stressé, il transpire — 7. il tend la main (voir
ci-dessus) — 8. victoire, poing serré, réjoui.
```

---

## 5. Prompt PNJ DE LA FILE — 4 personnes x 5 poses

```
SUJET : quatre clients qui font la queue devant un bar, le soir. Des
gens ordinaires du quartier. Vus DE FACE, EN PIED.

=== MISE EN PAGE : 5 colonnes x 4 rangées = 20 poses ===
UNE RANGÉE PAR PERSONNAGE, ses 5 poses sur toute la rangée.
1. ATTENTE, les deux bras près du corps.
2. MARCHE temps 1 : vu DE FACE, jambe droite avancée, genou plié —
   quelqu'un qui progresse vers vous en vous faisant face.
3. MARCHE temps 2 : le contre-temps, jambe gauche avancée.
4. BRAS À DEMI TENDU vers la droite, coude plié, main qui s'ouvre.
5. BRAS TENDU à l'horizontale vers la DROITE, main grande ouverte,
   NETTEMENT DÉTACHÉE du corps.
Le bras va toujours vers la DROITE : le jeu retourne l'image pour
l'autre côté.

=== VARIÉTÉ ===
Quatre personnes visiblement différentes : âges, corpulences, tailles,
tenues. Leurs différences de TAILLE doivent être celles de vraies
personnes, à l'échelle commune de l'image.
```

Une seule échelle pour toute la planche : le jeu dessine tous les PNJ à
la même hauteur, donc c'est la toile commune qui préserve leurs
différences de taille.

---

## 6. Prompt BARMAN — 8 bustes

```
=== CADRAGE : BUSTE, ET C'EST LE POINT CRUCIAL ===
- Vue de FACE, comme vu par un client debout devant le bar.
- Chaque pose coupée NET à la CEINTURE, à l'horizontale, au même endroit
  du corps dans les 8 poses. Rien en dessous.
- Bras et mains entièrement visibles au-dessus de la ligne de coupe.
- SURTOUT PAS de comptoir, de plan de bar, de tapis, ni de bouteilles
  POSÉES. Il peut tenir des objets DANS LES MAINS, rien de plus.
- 8 colonnes x 1 rangée : une seule rangée garantit l'échelle.

=== LES 8 POSES ===
1. AU REPOS, rien dans les mains, regard vers le client — 2. il choisit
une bouteille — 3. il dose — 4. il verse — 5. il mélange (shaker ou
cuillère) — 6. il décore — 7. il présente le verre, bras avancé —
8. il essuie un verre au torchon, tranquillement.
```

Le télégraphe du niveau 3 repose là-dessus : Francky prépare en cinq
temps, Jojo en quatre, et cette différence de rythme est une information
de jeu.

---

## 7. Prompt ENQUÊTE — 10 poses (niveau 2)

Pour les deux inspecteurs. Même bloc FORMAT.

```
=== MISE EN PAGE : 5 colonnes x 2 rangées = 10 poses ===
Rangée 1 : 1. debout immobile — 2, 3. deux temps de marche —
4. ACCROUPI, il fouille un meuble bas (aucun meuble dessiné) — 5. il se
redresse et EXAMINE un petit objet entre deux doigts.
Rangée 2 : 6. IL INTERROGE, buste penché, une main ouverte paume vers le
haut — 7. IL ÉCOUTE, bras croisés ou main au menton, sceptique — 8. IL
CONSULTE UN CARNET à deux mains — 9. IL ACCUSE, bras tendu, index pointé
— 10. IL ESQUIVE, il se jette de côté, bras levés pour se protéger.
```

Attention : le bras tendu de « accuse » déborde facilement sur
« esquive ». C'est la planche où l'espacement compte le plus.

---

## 8. Prompt POSES ASSISES

À demander en même temps que la pose debout du même personnage : c'est
elle qui donne le facteur d'échelle, au lieu de le deviner.

```
RÉFÉRENCES : les planches jointes. Reprendre EXACTEMENT les mêmes
personnages — visage, coiffure, vêtements, accessoires. Les accessoires
sont ce qui les identifie (lunettes, foulard, écharpe tricolore,
moustache, sac) et ne doivent jamais disparaître.

=== MISE EN PAGE : 2 colonnes x N rangées ===
UNE RANGÉE PAR PERSONNAGE : colonne 1 = DEBOUT au repos, de face ;
colonne 2 = ASSIS. La pose debout sert de repère de taille.

=== LES QUATRE RÈGLES ===
1. ÉCHELLE IDENTIQUE POUR TOUTE L'IMAGE.
2. MÊME LIGNE DE SOL debout comme assis : les pieds touchent cette ligne
   au pixel près, y compris dans la pose assise.
3. HAUTEUR D'ASSISE COMMUNE : le bassin à environ 27 % de la hauteur
   debout au-dessus du sol — la hauteur d'un canapé. Cuisses à
   l'horizontale, genoux à 90°, pieds à plat. LA MÊME pour tous.
4. AUCUN SIÈGE DESSINÉ : ils sont assis sur un siège invisible.

Trois personnages par planche au maximum : au-delà, les visages dérivent.
```

---

## 9. Prompt PORTRAIT — 6 bustes de dialogue

```
=== CADRAGE : TÊTE ET ÉPAULES ===
- Vue de FACE, regard vers le joueur.
- Coupé NET juste SOUS LES ÉPAULES, au même endroit dans les 6 poses.
- Tête CENTRÉE avec de la marge : le portrait sera affiché dans une
  pastille arrondie.
- ÉCHELLE IDENTIQUE et surtout LES YEUX À LA MÊME HAUTEUR dans les 6 :
  les expressions défilent dans la même pastille.

=== CE QUI DOIT RESTER LISIBLE ===
Affiché à environ 50 px de côté. On ne lit que la silhouette et deux ou
trois couleurs : accessoires généreux, expressions FRANCHEMENT exagérées.

=== LES 6 EXPRESSIONS ===
1. neutre — 2. sourire — 3. rire — 4. surpris — 5. méfiant — 6. agacé.
```

---

## 10. Prompt DÉCOR (niveau 1)

```
SUJET : la façade d'angle d'une brasserie parisienne, LE D'TOUR, vue de
face depuis le trottoir d'en face.

=== FORMAT ===
- PNG au rapport 2,37 (par exemple 2560 x 1080).
- AUCUN PERSONNAGE, aucune silhouette humaine, aucun animal.
- Aucun texte hors des enseignes du bar.

=== LA CONTRAINTE LA PLUS IMPORTANTE : LA LIGNE DE SOL ===
Le jeu pose les personnages sur une ligne à 88 % de la hauteur.
- À cette hauteur, sur TOUTE la largeur : du trottoir PLAT et DÉGAGÉ.
- Rien ne coupe cette ligne : jardinière, borne, marche, table, chaise
  et poubelle sont entièrement au-dessus (donc derrière les gens) ou
  entièrement en dessous.
- Sous cette ligne : trottoir, caniveau, bout de chaussée, vides.

=== TROIS VERSIONS, IDENTIQUES AU CADRAGE PRÈS ===
Même bâtiment, même cadrage au pixel. Seule la lumière change : JOUR,
SOIR, NUIT.

=== PETITS DÉTAILS À SEMER ===
Ardoise « COCKTAILS DE FRANCKY », affiche « LA CHORIZO — REST PIZZA
EVER », carton à pizza dans une poubelle, tarte au citron entamée sur
une table, chat roux endormi à une fenêtre, affichette « RÈGLE N°1 DU
D'TOUR : NE JAMAIS DIRE NON À HORTENSE », flyer signé « M. MARINI,
MAIRE », gamelle de chat près de la porte.
```

C'est `ANCRE_FOND_Y` qui déclare cette ligne côté code. Un décor livré
sans elle fait flotter toute la file.

---

## 11. Prompt ICÔNES D'INDICES

```
Planche d'icônes, style émoticône moderne : formes simples et pleines,
contour noir net, couleurs franches, léger relief.

=== FORMAT ===
- PNG au moins 2048 px de large, fond MAGENTA UNI #FF00FF.
- Grille de 5 colonnes x 4 rangées = 20 icônes.
- Chaque icône tient dans un CARRÉ, centrée, MÊME TAILLE pour toutes.
- Au moins 60 px de vide entre deux icônes.
- Aucun texte, aucun cadre, aucune ombre portée.
- Objet SEUL : ni main qui le tient, ni table, ni décor.
- Vue de trois quarts, légèrement de dessus.

=== POURQUOI ÇA COMPTE ===
Affichées à environ 60 px de côté : on ne lit que la silhouette et deux
ou trois couleurs. Formes très lisibles, contrastes forts, pas de petits
détails.
```

---

## 12. Les descriptions de personnages

À coller dans le bloc PERSONNAGE. Voir `PERSONNAGES.md` pour les
caractères et les liens ; ici, seulement ce qui se dessine.

| Personnage | Description |
|---|---|
| **Thibaut** | Cheveux bruns courts en pétard, barbe très courte. Polo vert foncé (niveaux 1 et 2) ou blouson bomber vert foncé sur t-shirt crème (bar). Jean bleu, baskets blanches. Ni chauve, ni lunettes, jamais de manteau beige. |
| **PF** | Chauve crâne rasé, lunettes rondes à fine monture, barbe courte grisonnante. Manteau beige clair sur col roulé bleu marine, ou t-shirt crème seul (bar). Jean bleu, baskets blanches. |
| **Francky** | Barman corpulent, cheveux blancs en brosse, lunettes de soleil noires, chemise hawaïenne bleu marine à fleurs blanches sur t-shirt « LONSDALE », tablier « BARMAN », short beige. |
| **Jojo** | Barman de PETITE TAILLE, crâne rasé, barbiche grise, sweat à capuche orange, salopette en jean « Entrenain », ceinture à outils, chaussures de chantier. Voir la note ci-dessous. |
| **Hortense** | Cheveux bruns très bouclés volumineux, foulard léopard, veste noire, sac en bandoulière, jean clair, baskets blanches. |
| **Gabi** | Cheveux bruns longs ondulés, lunettes rondes, blouson molletonné bleu canard, jean clair, baskets blanches, un rouleau de papier toilette dans la poche arrière. |
| **Mathilde** | Cheveux bruns mi-longs ondulés, pull crème torsadé, jupe portefeuille rouge, sac à main marron, baskets blanches. |
| **Marini** | Maire, quatre-vingts ans, cheveux blancs, lunettes rondes, costume bleu marine, écharpe tricolore à glands dorés, chaussures marron. |
| **Martin** | Jeune homme mince, cheveux châtains courts, t-shirt bleu marine à logo, sac à dos noir, pantalon cargo beige, baskets blanches. Il ne doit PAS avoir l'air d'un agent de sécurité : le décalage est le personnage. |
| **Teo (Teopedo)** | Crâne rasé, barbe courte, t-shirt blanc « I ♥ JACK LANG », jean bleu, baskets blanches. |
| **Charles** | Jeune homme, lunettes de soleil noires portées à l'intérieur, chemise rayée pastel sur t-shirt crème, jean bleu, baskets blanches. |
| **Tristan** | Chemise blanche à motif bananes, pantalon gris, baskets blanches, barbe courte. |
| **Solène** | Cheveux longs châtains, lunettes de soleil relevées sur la tête, blouson noir, jean clair, baskets claires. |
| **Kevin** | Survêtement gris intégral (sweat et jogging), baskets blanches, cheveux bruns bouclés courts. |
| **Rémy** | Chemise à petits motifs, écharpe grise nouée, jean bleu, chaussures marron, barbe courte. |
| **Risoto** | Chat roux tigré, collier avec médaille. |

**Note sur Jojo.** Ses planches le donnent avec les proportions d'un
homme trapu ordinaire (rapport tête/hauteur 0,168, identique à Francky).
Sa petite taille est donc déclarée dans le code —
`ECHELLE_PERSO.jojo = 0.74` — et appliquée partout où il apparaît. Pour
de vraies proportions, il faudrait préciser dans le prompt : *tête de
taille normale d'adulte, tronc normal, mais BRAS ET JAMBES NETTEMENT
COURTS, environ deux tiers de la hauteur d'un adulte moyen*.

---

## 13. Ce qu'il faut vérifier avant d'envoyer une planche

Trois contrôles à l'œil qui évitent un aller-retour :

1. **Plisser les yeux et ne regarder que les têtes.** Si l'une est plus
   grosse qu'une autre, c'est à refaire.
2. **Balayer horizontalement** : peut-on tracer un trait vertical
   entièrement magenta entre deux poses voisines ?
3. **Regarder la ligne des pieds.** Les chaussures doivent toutes poser
   sur la même horizontale, rangée par rangée.
4. **Sur une planche de boutons, plisser les yeux et comparer les
   diamètres.** C'est la consigne la plus souvent ratée, et celle qui ne
   se rattrape pas au découpage sans perdre de la définition.
5. **Chercher un halo qui déborde sur le magenta.** Une lueur qui sort
   de la forme se mélange au fond et laisse une bavure rose que rien ne
   sait retirer proprement.

---

## 14. Prompt BOUTONS D'INTERFACE

Écrit pour le niveau 4, valable pour toute commande tactile. Deux
différences avec les planches de personnages, et elles comptent :

- **Le bord doit être FRANC.** C'est la règle qui a manqué la première
  fois : les boutons portaient une lueur douce, elle s'est fondue dans
  le `#FF00FF`, et le détourage a gardé une bande rose de 15 à 30 px
  tout autour. On ne peut pas la reconstituer — la couleur qui était
  dessous est perdue.
- **Le diamètre doit être IDENTIQUE partout.** `poser()` dessine le
  canevas entier : le diamètre du dessin dans son canevas EST sa taille
  à l'écran, et sa position dans le canevas EST sa position à l'écran.
  `decouper_boutons.py` renormalise, mais il ne peut pas inventer les
  pixels d'un bouton généré trop petit.

```
Planche de 8 boutons d'interface, style verre bombé, vue de face.

=== FORMAT ===
- PNG au moins 2400 px de large, fond MAGENTA UNI #FF00FF.
- Grille de 4 colonnes x 2 rangées = 8 boutons.
- Chaque bouton est un DISQUE PARFAIT, centré au pixel dans sa case,
  et TOUS ont EXACTEMENT le même diamètre.
- Au moins 120 px de magenta VIDE entre deux boutons.

=== LA RÈGLE QUI COMPTE ===
BORD FRANC. Le disque s'arrête net sur le magenta : aucune lueur,
aucun halo, aucun flou, aucune ombre portée ne dépasse du cercle.
Toute la lumière du bouton reste À L'INTÉRIEUR du disque. Un halo
qui déborde se mélange au fond et laisse une bavure rose impossible
à retirer ensuite.

=== COULEURS ===
Palette imposée, AUCUN rose, AUCUN magenta, AUCUN violet :
- corps : bleu nuit très sombre #080D18 à #1B2436, reflet vitré en haut
- contour et symboles : blanc craie #F1F5FF
- accents : rouge brique #C6483C, ambre #F7B32B, vert #37AC48
- éteint : gris bleuté #8496B6

=== AUCUN TEXTE ===
Pas un mot dans les images : les libellés sont écrits par le jeu.

=== LES 8 BOUTONS ===
Rangée 1
1. TIR, actif — douille de revolver en diagonale, corps sombre,
   anneau rouge brique lumineux, symbole blanc craie.
2. TIR, enfoncé — même bouton, anneau plus vif, corps plus clair,
   reflet écrasé (il est appuyé, pas plus petit).
3. TIR, vide — même bouton éteint, tout en gris bleuté #8496B6,
   aucune lumière rouge.
4. ANNEAU DE RECHARGE — un anneau ambre #F7B32B seul, épais,
   centre entièrement vide (transparent), rien d'autre.

Rangée 2
5. À COUVERT — bouclier blanc craie sur corps sombre, contour ambre.
6. CHANGER — deux flèches circulaires qui se poursuivent, blanc craie.
7. CROIX DIRECTIONNELLE — quatre triangles blanc craie aux quatre
   points cardinaux sur un disque sombre, centre vide.
8. PASTILLE DE POUCE — petit disque nacré clair, lisse, sans symbole.

=== POURQUOI ===
Affichés à 60–110 px sur un fond bleu nuit, au pouce, en plein jeu.
On ne lit que la silhouette et une couleur. Formes grasses, contrastes
forts, aucun petit détail.
```

**Ce que fait le découpage ensuite** : le masque d'un disque est un
CERCLE ajusté, pas le contour détecté — ce qui bave dans le fond part
avec le fond. L'anneau, lui, n'est pas un disque : il garde son masque
propre, complété par une désaturation du magenta résiduel. Sortie
normalisée en canevas 320 avec un disque de 304 centré, pour les huit.

**Le n° 4 doit vraiment avoir le centre vide** : le jeu le découpe en
secteur pour montrer l'avancement du rechargement, et le pose à `1.38`
fois le rayon du bouton pour qu'il l'encercle au lieu de le couvrir.

---

## Les deux phases de foulée qui manquent (niveau 3)

**Pourquoi.** Mesuré sur les planches actuelles : `course1` et `course2`
ont les pieds au MÊME endroit (172 px tous les deux), et aucune des
quatorze poses de chaque champion n'a la jambe opposée en avant. La
foulée ne peut donc pas alterner, quelle que soit la cadence — c'est de
l'art qui manque, pas du réglage.

**Ce qu'il faut** : deux poses par champion, `course3` et `course4`, qui
sont les phases où l'**AUTRE jambe** est devant. Le code compte les
phases dans `POSES_BAR` : ajouter les deux noms et les deux fichiers
suffit, le cycle passe de deux à quatre temps tout seul (vérifié en
simulation : 2,92 cycles/s).

**Cadrage impératif** — le même que les poses existantes, sinon le
personnage saute d'une image à l'autre :

- fond magenta pur (255, 0, 255), personnage entier
- vu de trois quarts, tourné vers la DROITE, comme `course1`
- même taille de tête et même hauteur totale que `course1`
- pieds au même niveau bas du cadre
- polo vert et jean bleu pour Thibaut, t-shirt clair et jean pour PF

**Le prompt.**

> Planche de deux poses de course, côte à côte, fond magenta pur uni
> (#FF00FF), style bande dessinée aux couleurs franches, même trait et
> même échelle que les autres poses du personnage.
>
> Un homme [POLO VERT ET JEAN BLEU, cheveux bruns en bataille, courte
> barbe / T-SHIRT BEIGE ET JEAN, chauve, lunettes rondes, barbe courte],
> vu de trois quarts, courant vers la droite, bras pliés en mouvement.
>
> Pose 1 : la jambe GAUCHE est tendue loin devant, le pied gauche à
> l'appui, la jambe droite repliée en arrière. Le bras droit part en
> avant, le gauche en arrière.
>
> Pose 2 : moment de suspension inverse — la jambe gauche revient sous le
> corps, la droite s'élance vers l'avant sans encore toucher le sol. Les
> deux pieds décollés.
>
> Important : ces deux poses doivent être le MIROIR de foulée des poses
> existantes — c'est-à-dire l'autre jambe devant — tout en gardant le
> personnage tourné vers la DROITE. Ne pas retourner l'image : un
> personnage retourné regarderait à gauche.
