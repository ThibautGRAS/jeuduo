# prompts/ — les textes à coller, tels quels

```
prompts/
├── reference/   UNE image par personnage, à joindre au prompt
├── n1/          la file d'attente
├── n2/          l'enquête de l'appartement
├── n3/          la tournée du bar
├── n4/          la ruelle (+ les cinq méchants)
└── sup/         mouvements en réserve : saut, roulades
```

**`sup/` n'est utilisé par aucun niveau aujourd'hui.** Ces planches sont
là pour le jour où un niveau en aura besoin — une esquive roulée, un saut
par-dessus un obstacle. Les générer maintenant produirait des images que
rien n'affiche.

**Un seul prompt sert aux DEUX héros.** Le texte est identique ; ce qui
les distingue est l'IMAGE jointe. Le prompt écrit en tête
`reference/<thibaut ou pf>-2.png` : on remplace par celui qu'on veut.

Avant, il y avait deux fichiers qui différaient de deux lignes — dont une
qui était FAUSSE. Elle rappelait « polo vert » sous une référence en
blouson, parce qu'elle venait de la fiche du personnage, qui ne décrit
qu'une tenue. Un texte qui contredit son image est exactement le défaut
qu'une référence est censée supprimer : il a disparu.

**Une planche = un fichier `.txt` + une image de `reference/`.**
On copie tout le texte, on joint l'image, on envoie. Rien à compléter.
On copie tout le texte, on joint l'image, on envoie. Rien à compléter.

**Ne PAS coller `../PROMPTS.md`** : c'est de la documentation.

## Plusieurs références par personnage : une par TENUE

Un personnage peut avoir plusieurs images de référence, numérotées :

| image | tenue | utilisée par |
|---|---|---|
| `thibaut.png` | polo vert, civil | n3, sup |
| `thibaut-2.png` | blouson bomber, tenue de rue | n1 |
| `thibaut-3.png` | **policier** : brassard, holster | n2 et n4 |
| `pf.png` | t-shirt beige, civil | n3, sup |
| `pf-2.png` | manteau beige, col roulé bleu | n1 |
| `pf-3.png` | **policier** : manteau, brassard, holster | n2 et n4 |

Les niveaux 2 et 4 partagent la MÊME image : c'est la même soirée
d'enquête, donc la même tenue. Une seule image pour les deux, donc aucun
risque qu'ils divergent.

**Chaque prompt écrit le nom de celle qu'il faut joindre**, en haut,
juste sous le titre de la scène. Sans ce nom, on ne sait pas laquelle
prendre et on envoie le bar dans la file d'attente.

Avant que le niveau 1 ait la sienne, son prompt décrivait le costume par
écrit ET disait à la référence du bar de ne pas faire foi sur les
vêtements — deux consignes qui se marchaient dessus. **Une image par
tenue est plus simple et plus sûre qu'une bascule dans le texte.**

## Pourquoi une référence tout court

C'est le point de toute l'organisation. Thibaut a **une seule** image de
référence, partagée par les quatre niveaux. Le jour où elle change — un
personnage redessiné, un style resserré — une commande régénère les
quatre niveaux alignés dessus :

```bash
python3 callaghan/planches.py tout
```

Sans ça, il faudrait se souvenir de quels prompts citaient quelle image.

Les références sont **fabriquées depuis les sprites du jeu**, pas
choisies parmi les planches d'origine : entre les deux il y a eu des
redécoupages et des réparations. Elles montrent le personnage tel que le
joueur le voit aujourd'hui.

## Quand un niveau habille le personnage autrement

Le niveau 1 met les héros en tenue de rue — blouson pour Thibaut, manteau
pour PF. Son prompt dit donc que la référence fait foi sur **le visage,
la morphologie et le style**, mais pas sur les vêtements, qui sont
décrits en dessous. Sans cette bascule, régénérer le niveau 1 depuis la
référence du bar leur mettrait un polo dans la file.

## Quand une scène est scindée

Le niveau 2 demande onze poses — plus que le maximum de neuf. Il est donc
livré en **deux planches**, `thibaut-1.txt` et `thibaut-2.txt`, et chacune
dit en tête qu'il faut joindre la **même** image de référence. C'est elle
qui garantit que les deux se raccordent.

## Neuf poses par planche, pas plus

Au-delà, le générateur rétrécit chaque sujet pour tout faire tenir sur la
rangée, et les têtes cessent d'être égales — le défaut le plus coûteux au
découpage, parce qu'il ne se rattrape pas. Le générateur REFUSE désormais
plutôt que de livrer une planche qu'on sait mauvaise.

Si une série dépasse neuf poses, **deux planches**, en joignant la MÊME
image de référence aux deux : c'est ce qui garantit qu'elles se
raccordent. C'est ce qui a été fait pour les mouvements de réserve —
saut d'un côté, roulades de l'autre.

## Après réception de la planche

**L'envoyer dans la conversation AVANT de la découper.** Une commande la
contrôle : fond, quatre bords, poses séparables, écart, égalité des
têtes, alignement des pieds, bord rosi, et **l'alternance des jambes**
pour un cycle.

## Ce qui n'est pas ici

Décors, boutons d'interface, icônes d'indices, portraits de dialogue :
uniques, donc écrits à la main dans `../PROMPTS.md`.
