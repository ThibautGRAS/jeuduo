# Tests de DUO

```bash
node tests/tests.js
```

53 vérifications lancées directement contre `index.html` : les constantes, les
fonctions pures et la structure du code sont extraites du fichier réel, donc la
suite suit le jeu au lieu de dupliquer sa logique.

Sortie : `réussis / échoués`, et code de retour 1 si quelque chose casse — donc
utilisable tel quel avant un déploiement.

## Ce qui est couvert

| Section | Vérifie |
|---|---|
| Constantes | hiérarchie des vitesses, plafonds, cadre et marges cohérents |
| Réseau | aucun message de contrôle sur le canal non fiable, file d'attente présente |
| Cycle de vie | minuteurs arrêtables, reprise après coupure |
| Géométrie | rebond sur le cadre, raquettes bornées, mise en page sur 4 formats |
| Arènes | six arènes, décors, tempos distincts, une ou deux bûches |
| Bûches | ni destruction ni redimensionnement |
| Vannes | rimes trouvées sur 36 prénoms, aucun marqueur résiduel, même texte des deux côtés |
| Non-régression | les pièges déjà rencontrés une fois |

## Pièges surveillés

Ces vérifications existent parce que le bug s'est produit pour de vrai :

- **le joueur 0 est falsy** — un `if (gagnant)` sautait silencieusement le joueur 0 ;
- **horodatage nul** — `!o.tImpact` contournait l'immunité des blocs ;
- **flou d'ombre** — 29 appels non gardés faisaient chuter la fluidité et
  déclenchaient le repli automatique des effets ;
- **traînée** — un plafond d'empilement plus bas que la longueur voulue rendait
  la traîne longue inatteignable ;
- **code mort** après un `return`.

## Ajouter un test

```js
verifier("nom du test", condition, "détail affiché");
```
