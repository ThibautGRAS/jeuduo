# CLAUDE.md — comment travailler sur ce dépôt

Lire ce fichier **avant toute modification**. Il donne ce qui vaut pour
tout le dépôt ; chaque jeu a ensuite ses propres documents.

## Ce dépôt contient DEUX jeux

Ils sont indépendants : code séparé, documents séparés, versions
séparées. La seule chose qu'ils partagent est ce fichier et l'hébergement.

| | **DUO** | **Les Enquêtes de Callaghan** |
|---|---|---|
| Dossier | racine (`index.html`) | `dtour/` |
| Quoi | duel type Pong en pair-à-pair | quatre niveaux, un fil narratif |
| Adresse | `thibautgras.github.io/jeuduo/` | `thibautgras.github.io/jeuduo/dtour/` |
| Version | `DUO vX.Y`, dans le lobby | `CALLAGHAN vX.YZ`, en haut à gauche |
| Ses règles | `MEMOIRE.md` (racine) | `dtour/CLAUDE.md` puis `dtour/MEMOIRE.md` |

**Avant de toucher à l'un des deux**, lire le `MEMOIRE.md` correspondant.
Les pièges de DUO valent souvent pour Callaghan et réciproquement — même
auteur, même cible, mêmes réflexes — mais les architectures n'ont rien à
voir.

## Cible commune

iPhone, Safari, réseau mobile. Tout se joue au doigt. Ce qui n'est pas
lisible à bout de bras sur un téléphone n'existe pas.

## Flux de travail obligatoire

Dans cet ordre, sans sauter d'étape. Il vaut pour les deux jeux ; seules
les commandes changent.

1. **Éditer par remplacement compté.** Chaque remplacement compte ses
   occurrences et refuse d'écrire si le compte n'est pas exact. Un script
   qui échoue partiellement ne doit **rien** écrire — voir le piège
   « édition partielle » dans `MEMOIRE.md`.
2. **Contrôler la syntaxe** : extraire le `<script>` et lancer
   `node --check`.
3. **Lancer la suite de tests.** Elle rend un code non nul en cas
   d'échec.
4. **REGARDER LE RENDU AVANT DE POUSSER.** Règle en dur, sans exception :
   toute modification qui touche à l'affichage — un sprite, une position,
   une couleur, un bouton, un ordre de dessin — se vérifie **à l'image**
   avant le push, en OUVRANT les fichiers produits. Les tests ne voient
   pas un bouton coupé, une couture, un halo rose, un personnage qui
   flotte ou un texte à côté de sa pastille : ils ont laissé passer tout
   ça. Une suite verte n'autorise pas à pousser du visuel non regardé.
5. **Ne pousser que si tout est vert.** Enchaîner les commandes avec
   `&&`, jamais avec des retours à la ligne : sinon le déploiement part
   malgré un test rouge.
6. **Vérifier après coup** que le fichier déployé contient bien ce qu'on
   croit, en particulier le numéro de version.

**Après un rebase, tout recommence à l'étape 2.** Un commit distant
arrivé entre-temps change le code : il exige un nouveau contrôle,
exactement comme une édition. Cette étape a déjà été sautée une fois, et
un test rouge est parti en production.

**Piège du tube.** `node tests/x.js | tail -3` renvoie le code de `tail`,
pas celui du test : un `&&` qui suit ne verra jamais l'échec. Rediriger
vers un fichier puis afficher, ou tester le code de retour explicitement.

Incrémenter la version **et** le texte affiché à chaque livraison : c'est
le seul moyen pour Thibaut de savoir ce qu'il teste — et la première
chose à lui faire vérifier quand il signale qu'un correctif n'a rien
changé.

## Ce que les outils ne voient pas

- `node --check` valide la **syntaxe**, pas les références : une fonction
  appelée sans être définie passe le contrôle et plante à l'exécution.
  Les deux suites couvrent ce cas depuis qu'il s'est produit.
- Les tests n'observent ni le TEMPS qui passe ni le navigateur. Un état
  qui dépend d'un délai, d'une rotation d'écran ou d'un
  `requestAnimationFrame` n'est pas couvert : il demande un raisonnement
  explicite, et de ne jamais dépendre d'un seul mécanisme. Un voile qui
  ne se lève que sur un événement a déjà empêché un jeu de démarrer.
- Une capture d'écran vaut mieux qu'une supposition : demander une
  capture plutôt que d'imaginer le rendu.
- L'environnement d'exécution ne peut pas ouvrir `github.io` : vérifier
  le déployé par l'API GitHub, et le dire quand la vérification est
  indirecte.

## Publication

`git push` sur `ThibautGRAS/jeuduo`, branche `main`, avec un jeton
**fourni en séance par Thibaut**. Ne jamais écrire de secret dans le
dépôt : il est public. Si un jeton a transité par la conversation, le
dire et conseiller de le régénérer.

GitHub Pages sert **tout le dépôt** : un fichier source lourd déposé pour
travailler doit en ressortir. Les sources d'images et de sons vivent hors
dépôt, et les scripts qui les transforment sont versionnés à leur place.

## Modes de séance

- **EXPLORATION** — on cherche, on jette, on ne pousse pas.
- **PRODUCTION** — on livre. Suite verte, rendu regardé, version
  incrémentée, push, puis message court disant ce qui change et ce qu'il
  faut aller vérifier.

## Ton des échanges

Français, direct, sans emphase inutile. Annoncer ce qui a été **mesuré**
plutôt que ce qui est supposé — un chiffre se vérifie, une impression
non. Quand une erreur a été commise, le dire clairement et dire ce qui a
été mis en place pour qu'elle ne revienne pas.
