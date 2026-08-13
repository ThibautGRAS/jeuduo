# prompts/ — les textes à coller, tels quels

**Un fichier `.txt` = un prompt complet, et une image `reference_*.png`
à JOINDRE avec.** On copie tout le texte, on joint l'image du même
personnage, on envoie.

**Ne PAS coller `../PROMPTS.md`** : c'est de la documentation. Ces
fichiers-ci sont du texte brut, sans un mot qui ne soit destiné au
générateur.

## Pourquoi une image de référence

Une description écrite est **relue et réinterprétée** à chaque planche.
Le t-shirt de BruHell a changé entre deux planches sans qu'un mot du
texte ait bougé. Une image de référence supprime cette réinterprétation :
elle montre le personnage tel qu'il est EN JEU aujourd'hui, après tous
les redécoupages et corrections.

C'est pour ça que la référence est fabriquée depuis les sprites du jeu et
non choisie parmi les planches d'origine.

## Les trois modes, et quand les utiliser

| situation | mode | ce qu'on joint |
|---|---|---|
| le personnage existe déjà en jeu | **poses** | `reference_<perso>.png` |
| nouveau personnage, on a une photo du vrai | **photo** | la photo du visage |
| nouveau personnage, rien d'existant | **texte** | rien |

Tous les fichiers de ce dossier sont en mode **poses** : ce sont des
personnages déjà en jeu. Pour les deux autres modes, le demander dans la
conversation.

En mode `poses`, le prompt ne redécrit PAS le personnage — il dit à
l'image de faire foi, avec deux lignes de rappel formulées comme un
contrôle. Une description complète qui accompagne une image entre en
concurrence avec elle, et le générateur tranche au hasard.

## Ce qui est prêt

| fichier | personnage | mouvements | poses |
|---|---|---|---|
| `heros_bar_thibaut.txt` | Thibaut | marche + course + frein | 9 |
| `heros_bar_pf.txt` | PF | marche + course + frein | 9 |
| `heros_sup_thibaut.txt` | Thibaut | saut + accroupi | 6 |
| `heros_sup_pf.txt` | PF | saut + accroupi | 6 |
| `mechant_base_depar.txt` | Depardiahree | course + touche + chute | 8 |
| `mechant_base_dsk.txt` | DSKKK | course + touche + chute | 8 |
| `mechant_base_jubi.txt` | Jubilar | course + touche + chute | 8 |
| `mechant_base_abbe.txt` | l'Abbé | course + touche + chute | 8 |
| `mechant_base_bruh.txt` | BruHell | course + touche + chute | 8 |

## Si ta référence est sur fond magenta

**Pas grave, c'est même pratique** : c'est le fond attendu en sortie, et
le générateur a un exemple sous les yeux.

Une seule précaution, et elle est déjà dans les prompts : le magenta ne
doit pas TEINDRE le personnage. Le fond `#FF00FF` se mélange à toute
lueur douce — mesuré une fois sur une planche livrée, une bande rose de
(134, 58, 116) sur 15 à 30 px tout autour du sujet. Rien ne sait la
retirer : on ignore la couleur qui était dessous.

Le contrôle de planche le vérifie désormais, et il discrimine bien —
0,0 % sur une planche saine, 83 % sur une planche volontairement rosie.

## Après réception de la planche

**L'envoyer dans la conversation AVANT de la découper.** Une commande la
contrôle : fond, quatre bords, poses séparables, écart, égalité des
têtes, alignement des pieds — et **l'alternance des jambes** pour un
cycle. Trois séances ont été perdues sur une course dont toutes les
phases avaient le même pied en avant ; ce contrôle l'aurait vu tout de
suite.

## Les planches spéciales ne sont pas ici

Décors, boutons, icônes, portraits, et les gestes propres à un niveau —
servir un verre, lancer un pavé. Ils sont uniques, donc écrits dans
`../PROMPTS.md`. Pour ceux-là, copier la section concernée **plus** le
bloc de contraintes techniques qu'on trouve à la fin de n'importe quel
fichier de ce dossier.
