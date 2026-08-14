# prompts/ — les textes à coller, tels quels

```
prompts/
├── reference/   les images à joindre, une par personnage et par tenue
├── n1/ n2/ n3/ n4/   ce que la mécanique du niveau demande
├── communs/     les personnages qui TRAVERSENT les niveaux
├── objets/      les objets lancés : pelle, molotov
└── sup/         en réserve, aucun niveau ne s'en sert
```

## Les objets

`objets/` contient un fichier par objet lancé, prêt à coller. Ils étaient
écrits à la main dans `../PROMPTS.md` — un paragraphe à retrouver et à
recopier. **Un prompt qu'on recopie est un prompt qu'on modifie en le
recopiant**, et il finit par diverger de ce que le jeu attend.

Un projectile = TROIS images, et le prompt les nomme toutes les trois :
`obj_<nom>` au départ du vol, `obj_<nom>_f` après la bascule à 62 % de la
trajectoire — il arrive alors de face, plus grand — et `imp_<nom>` pour
l'impact.

**Pas de référence à joindre** : on ne fabrique pas un cocktail Molotov à
l'identique d'une image existante, on le décrit. Une référence n'a de sens
que pour un PERSONNAGE, dont l'identité doit se raccorder d'une planche à
l'autre.

## Où ranger une nouvelle planche

**Le rangement suit ce qui DÉTERMINE la liste de poses.**

Pour les héros, c'est la mécanique du niveau : boire au bar, viser dans
la ruelle, fouiller un meuble. Leurs planches vont dans `n1/`, `n2/`…
même s'il s'agit du même personnage — c'est pour ça qu'il y en a quatre
jeux.

Pour Hortense, c'est elle : son lancer de tarte est le même geste au
niveau 1 et au niveau 2, et ses sprites vivent déjà dans `img/commun/`.
Sa planche va donc dans `communs/`.

Mesuré avant de trancher : **seuls Thibaut, PF et Hortense traversent les
niveaux.** Les PNJ de la file, les habitués du bar et les cinq méchants
appartiennent chacun à un seul — leurs planches restent dans le dossier
de ce niveau. Un dossier « personnages » pour tout le monde aurait rangé
selon une distinction qui n'existe pas.


**Onze prompts.** Il y en avait dix-sept : les cinq méchants partageaient
un texte identique à quatre lignes près, et les mouvements de réserve
étaient dupliqués par héros. Ce qui les distinguait était un « rappel »
écrit — qui contredisait l'image dès qu'un niveau changeait de tenue.
Il a disparu, et les doublons avec lui.

**Un prompt sert à PLUSIEURS personnages.** Le texte est le même ; ce qui
change est l'image jointe. Le prompt écrit en tête
`reference/<le personnage voulu>.png` : on remplace par celui qu'on veut.

## Ce qu'il faut joindre

| image | tenue | prompts |
|---|---|---|
| `thibaut-jeune.png` `pf-jeune.png` | tenue de rue | n1 |
| `thibaut-flic.png` `pf-flic.png` | policier | n2 **et** n4 |
| `thibaut-muscle.png` `pf-muscle.png` | civil, au bar | n3, sup |
| `hortense.png` | — | communs |
| `depar` `dsk` `jubi` `abbe` `bruh` | — | n4/mechants |

**Les tenues portent des NOMS, plus des numéros.** `-2` et `-3` ne
disaient rien : il fallait ouvrir l'image pour savoir laquelle joindre.

Les niveaux 2 et 4 partagent la même : même soirée d'enquête, même tenue,
donc aucun risque qu'ils divergent.

Les niveaux 2 et 4 partagent la même image : même soirée d'enquête, même
tenue, donc aucun risque qu'ils divergent.

## Chaque prompt couvre TOUT ce que son niveau charge

Vérifié par un test, qui tire la liste du CODE. Ce n'était pas le cas :
le n2 demandait 5 poses sur 11, le n3 en demandait 9 sur 16 — il ignorait
tout ce qui touche au verre — et le n4 en demandait 5 sur 14. Trois fois
le même défaut, trouvé trois fois par Thibaut.

## Un piège de nom : `vide`

Au niveau 1, c'est une **main** tendue que personne ne prend. Au niveau 3,
c'est un **verre** vide brandi. Deux choses opposées sous un même mot. Les
préfixes de fichier les séparent — `thibaut_vide` et `bar_th_vide` — mais
un humain qui lit « vide » ne peut pas deviner lequel.

## Après réception de la planche

**L'envoyer dans la conversation AVANT de la découper.** Une commande la
contrôle : fond, quatre bords, rangées, poses séparables, écart, égalité
des têtes, alignement des pieds, bord rosi, et **alternance des jambes**
pour un cycle.

## Neuf poses par planche, pas plus

Au-delà, le générateur rétrécit les sujets et les têtes cessent d'être
égales. Le générateur refuse. Les scènes plus longues sont scindées, et
chaque planche dit de joindre la MÊME référence.

## Ce qui n'est pas ici

Décors, boutons, icônes, portraits : uniques, donc écrits à la main dans
`../PROMPTS.md`.
