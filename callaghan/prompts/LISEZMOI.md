# prompts/ — les textes à coller, tels quels

**Un fichier de ce dossier = un prompt complet.** On l'ouvre, on copie
TOUT le contenu, on le colle dans le générateur d'images. Rien à
compléter, rien à enlever.

**Ne PAS coller `PROMPTS.md`** : c'est de la documentation — quatorze
sections, des explications, l'historique des erreurs. Le coller noierait
le générateur. Ces fichiers-ci sont l'inverse : du texte brut, sans un
mot qui ne soit destiné au générateur.

## Ce qui est prêt

| fichier | personnage | mouvements | poses |
|---|---|---|---|
| `heros_bar_pf.txt` | pf | marche + course + frein | 9 |
| `heros_bar_thibaut.txt` | thibaut | marche + course + frein | 9 |
| `heros_base_pf.txt` | pf | idle + marche + course | 9 |
| `heros_base_thibaut.txt` | thibaut | idle + marche + course | 9 |
| `mechant_base_abbe.txt` | abbe | course + touche + chute | 8 |
| `mechant_base_bruh.txt` | bruh | course + touche + chute | 8 |
| `mechant_base_depar.txt` | depar | course + touche + chute | 8 |
| `mechant_base_dsk.txt` | dsk | course + touche + chute | 8 |
| `mechant_base_jubi.txt` | jubi | course + touche + chute | 8 |
| `mouvements_sup_pf.txt` | pf | saut + accroupi | 6 |
| `mouvements_sup_thibaut.txt` | thibaut | saut + accroupi | 6 |

## Ce qu'il faut faire de la planche reçue

**La faire vérifier avant de la découper.** L'envoyer dans la
conversation en demandant le contrôle : fond, bords, séparation des
poses, égalité des têtes, alignement des pieds, et surtout
**l'alternance des jambes** pour un cycle de marche ou de course. Trois
séances ont été perdues sur une course dont toutes les phases avaient le
même pied en avant.

## Si le jeu de mouvements voulu n'est pas là

Le demander dans la conversation : ces fichiers sont générés par
`planches.py`, qui assemble le catalogue de mouvements, la fiche du
personnage et les règles techniques. Il suffit de dire quel personnage et
quels mouvements.

Mouvements au catalogue : `idle`, `marche`, `course`, `saut`, `accroupi`,
`frein`, `touche`, `chute`.

## Les planches SPÉCIALES ne sont pas ici

Décors, boutons d'interface, icônes d'indices, portraits de dialogue, et
les gestes propres à un niveau — servir un verre, lancer un pavé,
brandir un encensoir. Elles sont uniques, donc écrites à la main dans
`../PROMPTS.md`, sections 2 à 14. Pour celles-là, copier la section
concernée **plus** le bloc de contraintes techniques qu'on trouve à la fin
de n'importe quel fichier de ce dossier.
