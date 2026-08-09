# CLAUDE.md — comment travailler sur ce dépôt

Lire ce fichier **avant toute modification**, puis `MEMOIRE.md` pour le contexte
technique et les pièges déjà rencontrés.

## Le projet en une phrase

Jeu de duel type Pong en pair-à-pair, un seul fichier `index.html`, jouable au
doigt sur iPhone, hébergé sur GitHub Pages.

| | |
|---|---|
| Dépôt | `ThibautGRAS/jeuduo`, branche `main` |
| Adresse principale | https://thibautgras.github.io/jeuduo/ |
| Miroir rapide | Netlify, relié au même dépôt (déploiement en ~15 s) |
| Cible | iPhone, Safari, réseau mobile |

## Contraintes à ne pas casser

- **Un seul fichier.** Tout le jeu tient dans `index.html` : HTML, CSS et
  JavaScript. Pas d'outil de compilation, pas de dépendance à installer. Seules
  exceptions autorisées : PeerJS chargé depuis un CDN, les décors dans
  `arenes/`, et la suite de tests dans `tests/`.
- **Pas de stockage navigateur en dehors de `localStorage`** pour les
  préférences (nom, photo, réglages, compteur de duels).
- **Le terrain fait toujours 540 × 720 unités de jeu**, quelle que soit la
  taille d'écran. Toute la géométrie en dépend.

## Flux de travail obligatoire

Dans cet ordre, sans sauter d'étape :

1. **Éditer par remplacement vérifié.** Chaque remplacement compte ses
   occurrences et refuse d'écrire si le compte n'est pas exact. Un script qui
   échoue partiellement ne doit **rien** écrire — voir le piège « édition
   partielle » dans `MEMOIRE.md`.
2. **Contrôler la syntaxe** : extraire le `<script>` et lancer `node --check`.
3. **Lancer la suite** : `node tests/tests.js`. Elle rend un code non nul en cas
   d'échec.
4. **Ne pousser que si tout est vert.** Enchaîner les commandes avec `&&`, jamais
   avec des retours à la ligne : sinon le déploiement part malgré un test rouge.
5. **Vérifier après coup** que le fichier déployé contient bien ce qu'on croit,
   en particulier le numéro de version affiché en bas du lobby.

Incrémenter `VERSION` **et** le texte `DUO vX.Y` du lobby à chaque livraison :
c'est le seul moyen pour l'utilisateur de savoir ce qu'il teste.

## Ce que les outils ne voient pas

- `node --check` valide la **syntaxe**, pas les références : une fonction
  appelée sans être définie passe le contrôle et plante à l'exécution. La
  section « Références » de la suite couvre ce cas depuis qu'il s'est produit.
- Une capture d'écran vaut mieux qu'une supposition : demander une capture
  plutôt que d'imaginer le rendu.
- L'environnement d'exécution ne peut pas ouvrir `github.io` : s'appuyer sur le
  journal de déploiement de GitHub, et le dire quand la vérification est
  indirecte.

## Modes de séance

- **EXPLORATION** — on cherche, on jette, on ne pousse pas. Les essais vivent
  dans des fichiers `index_vX.html` locaux.
- **PRODUCTION** — on livre. Suite verte, version incrémentée, push, puis
  message court expliquant ce qui change et ce qu'il faut aller vérifier.

## Déploiement

Push par l'API Contents de GitHub, un fichier à la fois, avec le `sha` du
fichier existant. Le jeton est **fourni en séance par Thibaut**, jamais stocké
ici ni dans le code. Ne jamais écrire de secret dans le dépôt : il est public.

## Ton des échanges

Français, direct, sans emphase inutile. Annoncer ce qui a été mesuré plutôt que
ce qui est supposé. Quand une erreur a été commise, le dire clairement et dire
ce qui a été mis en place pour qu'elle ne revienne pas.
