# son/ — les échantillons du jeu

Douze fichiers OGG mono. 96 Ko d'effets, plus 234 Ko de musique.

## Remplacer un son

**Déposer un `.ogg` au même nom suffit.** Aucune ligne de code à toucher :
`Sons.ECHANTILLONS` liste les noms, le chargeur va chercher
`son/<nom>.ogg`, et le fichier trouvé prend la place.

| fichier | quand |
|---|---|
| `tir_revolver.ogg` | Thibaut tire |
| `tir_fusil.ogg` | Pierre-François tire |
| `recharge_revolver.ogg` | Thibaut recharge (1,5 s) |
| `recharge_fusil.ogg` | Pierre-François recharge (2,0 s) |
| `cri_depar.ogg` | Depardiahree tombe |
| `cri_dsk.ogg` | DSKKK tombe |
| `cri_jubi.ogg` | Jubilar tombe |
| `cri_abbe.ogg` | l'Abbé tombe |
| `cri_bruh.ogg` | BruHell tombe |
| `musique_ruelle.ogg` | musique du niveau 4, en boucle |
| `impact_bois.ogg` | un pavé ou un encensoir s'écrase |
| `impact_bouteille.ogg` | une bouteille éclate |

## Ce qui n'est PAS un échantillon, et pourquoi

**L'impact sur un corps reste synthétisé.** C'est le son le plus fréquent
du niveau — cinquante fois par horde. Un échantillon, même bon, s'y
entend en boucle et fatigue ; la percussion sèche de la synthèse, non.
L'échantillon fabriqué en v6.70 pour ce rôle a été retiré.

## Les cris viennent d'un enregistrement

Découpés dans un enregistrement de grognements de chien
(`745360__johntrap__blackiegrogne-2401.wav`, Freesound, 56 s).

**Le source n'est pas versionné** : 4,9 Mo servis par GitHub Pages pour
un fichier que le jeu ne charge jamais. Il est ignoré par `.gitignore`.
Pour refabriquer les cris, le remettre dans `son/` et lancer :

    python3 dtour/cris.py dtour/son

Les instants retenus et la transformation de chacun sont écrits dans
`cris.py` — le découpage est donc reproductible sans garder le source.

**À vérifier** : la licence de cet enregistrement. Freesound mélange CC0,
CC-BY et CC-BY-NC ; si celui-ci demande une attribution, elle doit
figurer quelque part dans le jeu ou le dépôt.

## La musique du niveau 4

28,8 s en boucle, 234 Ko à 64 kbps. Elle remplace la petite grille de
jazz synthétisée, qui n'a rien à faire dans une fusillade.

Deux points qui l'ont demandé du soin :

- **Elle s'arrête explicitement au retour au menu.** Une boucle sans
  arrêt continue sur l'écran titre et se superpose à la musique du
  niveau suivant.
- **`gainMus` est libéré à l'arrêt**, sinon la boucle synthétisée refuse
  de repartir pour les autres niveaux et le jeu reste muet à la deuxième
  partie.

Elle passe par le même gain que la musique synthétisée, donc
`attenuerMusique()` la baisse aussi quand l'équipier parle.

## Les rechargements viennent d'enregistrements

Fournis, puis préparés par `python3 dtour/recharges.py dtour/son`. Quatre
choses sont faites, et chacune répare un défaut mesuré :

- **Ils tiennent dans la durée du geste** — 1,5 s au revolver, 2,0 s au
  fusil. Un échantillon plus long claque encore alors que le héros tire
  déjà. Le pistolet est un geste en TROIS claquements étalés sur 1,68 s :
  il est ACCÉLÉRÉ de 13 % pour que les trois y soient, pas tronqué.
- **Le vide est coupé** : le fichier pistolet ne commençait qu'à 0,14 s.
- **Ils sont mis au même niveau** que les détonations : le fusil sortait
  quatre fois plus faible que le pistolet.
- **La crête est vérifiée SUR LE FICHIER LIVRÉ**, en bouclant. Le
  dépassement du Vorbis dépend du contenu : mesuré de 1,47 à 1,72 fois
  sur ce pistolet déjà saturé à la source. Deviner une marge ne marche
  pas.

Les sources ne sont pas versionnées (`.gitignore`).

## Les détonations

Une **synthèse hors ligne** (`python3 dtour/sons.py dtour/son`), plus
riche que ce que le WebAudio produit en temps réel — on peut empiler
autant de couches qu'on veut, le coût est payé une fois. Ce ne sont pas
des enregistrements. Où trouver du CC0 :

- **freesound.org** en filtrant sur CC0 : détonations, rechargements.
  Vérifier la licence fichier par fichier.
- **kenney.nl/assets** : impacts et interface, CC0, sans attribution.
  Rien pour les armes à feu en revanche.
- **opengameart.org**, collection « CC0 Sound Effects ».

## Trois règles à ne pas casser

1. **Le jeu ne doit jamais devenir muet.** Chaque son passant par un
   échantillon garde son repli synthétisé. Un test le vérifie.
2. **Tout passe par l'AudioContext.** Un élément audio HTML lancé depuis
   un rappel réseau est silencieusement bloqué par iOS.
3. **Rien ne bloque le démarrage.** Le chargement part après les images
   essentielles. Un test vérifie l'ordre.
