# prompts/ — les textes à coller, tels quels

```
prompts/
├── reference/   les images à joindre, une par personnage et par tenue
├── n1/  heros-1.txt  heros-2.txt      la file d'attente
├── n2/  heros-1.txt  heros-2.txt      l'enquête
├── n3/  heros-1.txt  heros-2.txt      la tournée du bar
├── n4/  heros-1.txt  heros-2.txt      la ruelle
│         mechants.txt                 les cinq méchants
└── sup/ saut.txt  roulades.txt        en réserve, aucun niveau ne s'en sert
```

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
| `thibaut.png` `pf.png` | civil | n3, sup |
| `thibaut-2.png` `pf-2.png` | tenue de rue | n1 |
| `thibaut-3.png` `pf-3.png` | policier | n2 et n4 |
| `depar` `dsk` `jubi` `abbe` `bruh` | — | n4/mechants |

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
