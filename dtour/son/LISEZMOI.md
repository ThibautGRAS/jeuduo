# son/ — les échantillons du jeu

Huit fichiers OGG mono, 45 Ko au total.

## Remplacer un son

**Déposer un `.ogg` au même nom suffit.** Aucune ligne de code à toucher :
`Sons.ECHANTILLONS` liste les noms, le chargeur va chercher
`son/<nom>.ogg`, et le fichier trouvé prend la place.

| fichier | quand |
|---|---|
| `tir_revolver.ogg` | Thibaut tire |
| `tir_fusil.ogg` | Pierre-François tire |
| `recharge.ogg` | rechargement, les deux armes |
| `cri_depar.ogg` | Depardiahree tombe |
| `cri_dsk.ogg` | DSKKK tombe |
| `cri_jubi.ogg` | Jubilar tombe |
| `cri_abbe.ogg` | l'Abbé tombe |
| `cri_bruh.ogg` | BruHell tombe |

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

## Les détonations et le rechargement

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
