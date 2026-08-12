# son/ — les échantillons du jeu

Neuf fichiers OGG mono, 55 Ko au total. Ils remplacent la synthèse temps
réel pour les sons où elle était faible : les détonations, le
rechargement, l'impact dans la chair, et un cri par méchant.

## Remplacer un son

**Déposer un `.ogg` au même nom suffit.** Aucune ligne de code à toucher,
aucune déclaration à modifier : `Sons.ECHANTILLONS` liste les noms, le
chargeur va chercher `son/<nom>.ogg`, et le fichier trouvé prend la
place. Les noms attendus :

| fichier | quand |
|---|---|
| `tir_revolver.ogg` | Thibaut tire |
| `tir_fusil.ogg` | Pierre-François tire |
| `recharge.ogg` | rechargement, les deux armes |
| `impact_chair.ogg` | une balle touche un corps |
| `cri_depar.ogg` | Depardiahree tombe |
| `cri_dsk.ogg` | DSKKK tombe |
| `cri_jubi.ogg` | Jubilar tombe |
| `cri_abbe.ogg` | l'Abbé tombe |
| `cri_bruh.ogg` | BruHell tombe |

## Ce que sont les fichiers actuels

Une **synthèse hors ligne**, pas des enregistrements. Ils sont plus
riches que ce que le WebAudio pouvait produire en temps réel — on peut
empiler autant de couches qu'on veut, le coût est payé une fois — mais
un vrai coup de feu ne se fabrique pas comme ça. Ils sont là pour que le
jeu ne soit pas muet et pour que la plomberie soit vérifiable avant que
les vrais sons arrivent.

Ils se refabriquent avec `python3 dtour/sons.py dtour/son`.

## Où trouver de vrais sons, en CC0

Le bac à sable de développement ne joint que `github.com` : les bonnes
banques n'y sont pas, et il faut les télécharger à la main.

- **kenney.nl/assets** — impacts et interface, CC0, sans attribution.
  Rien pour les armes à feu en revanche.
- **freesound.org** en filtrant sur la licence CC0 — c'est là qu'on
  trouve les détonations, les rechargements et les cris. Vérifier la
  licence fichier par fichier : le site mélange CC0, CC-BY et CC-BY-NC.
- **opengameart.org**, collection « CC0 Sound Effects ».

## Trois règles à ne pas casser

1. **Le jeu ne doit jamais devenir muet.** Chaque son passant par un
   échantillon garde son repli synthétisé. Fichier absent, réseau lent,
   décodage refusé : le son sort quand même. Un test le vérifie.
2. **Tout passe par l'AudioContext.** Un élément audio HTML lancé depuis
   un rappel réseau est silencieusement bloqué par iOS. Les échantillons
   sont décodés en AudioBuffer et joués par la même chaîne que le reste.
3. **Rien ne bloque le démarrage.** Le chargement part après les images
   essentielles. Un test vérifie l'ordre.
