# prompts/ — les textes à coller, tels quels

```
prompts/
├── reference/   UNE image par personnage, à joindre au prompt
├── n1/          la file d'attente
├── n2/          l'enquête de l'appartement
├── n3/          la tournée du bar
└── n4/          la ruelle (+ les cinq méchants)
```

**Une planche = un fichier `.txt` + l'image `reference/<perso>.png`.**
On copie tout le texte, on joint l'image, on envoie. Rien à compléter.

**Ne PAS coller `../PROMPTS.md`** : c'est de la documentation.

## Pourquoi UNE référence par personnage

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

## Après réception de la planche

**L'envoyer dans la conversation AVANT de la découper.** Une commande la
contrôle : fond, quatre bords, poses séparables, écart, égalité des
têtes, alignement des pieds, bord rosi, et **l'alternance des jambes**
pour un cycle.

## Ce qui n'est pas ici

Décors, boutons d'interface, icônes d'indices, portraits de dialogue :
uniques, donc écrits à la main dans `../PROMPTS.md`.
