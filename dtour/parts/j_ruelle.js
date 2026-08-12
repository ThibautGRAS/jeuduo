/* ================= NIVEAU 4 — LA RUELLE =================
   Shooter arcade en fausse profondeur. La caméra est fixe, derrière la
   barricade ; les ennemis viennent du fond et grossissent en approchant.

   Tout repose sur UNE idée : chaque ennemi porte un Z entre 0 (le fond
   de la ruelle) et 1 (la barricade). Sa taille, sa position à l'écran
   et son ordre de dessin se déduisent de ce Z. On ne déplace jamais un
   sprite verticalement à vitesse constante — c'est ce qui donne aux
   faux 3D leur allure de papier découpé. */

/* Le décor est en portrait (941 x 1672). Ces deux repères sont mesurés
   dessus : la ligne d'horizon où la ruelle se perd, et la ligne où les
   pieds d'un ennemi touchent la barricade. */
const RUELLE_HORIZON = 0.300;      /* fraction de hauteur : le fond      */
const RUELLE_BARRICADE = 0.760;    /* fraction de hauteur : le premier plan */
const RUELLE_ECH_LOIN = 0.055;     /* hauteur d'un ennemi au fond        */
const RUELLE_ECH_PRES = 0.520;     /* hauteur d'un ennemi à la barricade */
const RUELLE_FUITE = 0.500;        /* le point de fuite, en largeur      */

/* Les cinq trajectoires convergent vers le point de fuite. La valeur
   est l'écart à la barricade, en fraction de largeur ; au fond, tout le
   monde se rejoint. */
const RUELLE_COULOIRS = [-0.34, -0.17, 0, 0.17, 0.34];

/* La courbe de profondeur. Une interpolation linéaire donnerait une
   ruelle en entonnoir plat : les ennemis lointains avanceraient trop
   vite et les proches trop lentement. L'exposant écrase le fond et
   étire le premier plan, ce qui est la façon dont une perspective se
   comporte vraiment. */
function courbeZ(z){ return Math.pow(borne(z, 0, 1), 2.35); }

const Perspective = {
  /* Tout ce qu'il faut pour dessiner quelqu'un à la profondeur z, sur
     le couloir c. Une seule fonction : c'est elle qui garantit que les
     ennemis, les impacts et les corps au sol partagent le même monde. */
  projeter(z, couloir){
    const t = courbeZ(z);
    const H = Camera.H, L = Camera.L;
    const y = melange(H * RUELLE_HORIZON, H * RUELLE_BARRICADE, t);
    const ech = melange(RUELLE_ECH_LOIN, RUELLE_ECH_PRES, t);
    const ecart = RUELLE_COULOIRS[couloir] || 0;
    /* au fond, les couloirs se rejoignent au point de fuite */
    const x = L * (RUELLE_FUITE + ecart * t);
    return { x, y, hauteur: H * ech, ordre: t };
  },
};
