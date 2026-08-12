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
const RUELLE_ECH_PRES = 0.330;     /* hauteur d'un ennemi à la barricade */
/* La barricade occupe le bas du décor. On la redessine PAR-DESSUS les
   ennemis : sans ça, un homme arrivé au contact passe devant les
   caisses au lieu d'être masqué par elles, et la profondeur s'effondre
   au moment précis où elle compte le plus. */
/* Mesuré sur le décor : le bord haut des caisses est IRRÉGULIER et
   laisse des trouées. Couper au plus haut laissait une bande de rue
   entre les héros coupés et le bois. On descend la coupe DANS les
   caisses, là où elles couvrent partout. */
const RUELLE_PREMIER_PLAN = 0.700;  /* fraction du décor qui passe devant */
/* Les héros CHEVAUCHENT la barricade : leurs pieds sont sous le bord de
   l'écran et la palissade les coupe à la taille. C'est ce qui les met
   vraiment derrière l'abri au lieu de les poser devant. */
const RUELLE_TAILLE_HEROS = 0.400;
const RUELLE_PIEDS_HEROS = 0.995;   /* fraction de hauteur : les pieds    */
/* Les planches dessinent les héros de PROFIL, arme à l'horizontale. Or
   les ennemis arrivent du fond, donc d'en haut : à plat, les deux se
   visaient l'un l'autre par-dessus la barricade. On les incline
   légèrement vers le point de fuite — c'est un mensonge de perspective,
   mais c'est celui que l'œil attend. */
const RUELLE_INCLINE_HEROS = 0.16;  /* radians, vers le haut de la rue  */
/* Trois plans, et l'ordre compte plus que tout :
   3. les ENNEMIS au fond, masqués par les contours de la barricade ;
   2. la BARRICADE, redessinée par-dessus eux ;
   1. les HÉROS devant elle, entiers — ils étaient coupés à la ceinture
      et ressemblaient à des bustes posés sur les caisses.
   Quand ils rechargent, ils se baissent DERRIÈRE la barricade : c'est
   le seul moment où ils passent au second plan. */
/* Ils s'accroupissent, ils ne s'enfoncent pas dans le sol : les poses
   `baisse` et `accroupi` font déjà le travail, un gros décalage vertical
   par-dessus donnait un bonhomme qui tombe dans un trou. */
const RUELLE_ABRI = 0.075;
/* Le buste suit le réticule. On ne redessine pas le personnage sous un
   autre angle — on l'incline, dans une plage étroite : au-delà, on voit
   que c'est la même image qui pivote. */
const VISEE_INCLINE_MIN = -0.34, VISEE_INCLINE_MAX = 0.30;
const RUELLE_ECART_HEROS = 0.205;   /* écart au bord : plus ils sont
                                       écartés, plus les lignes de tir
                                       se croisent haut dans la ruelle */
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

/* ---------------- les armes ----------------
   Toutes les valeurs d'équilibrage vivent ICI, nulle part ailleurs :
   après le premier essai, tout se règle dans ces deux blocs. */
const ARMES = {
  revolver: { nom:"REVOLVER", chargeur:6, tete:100, torse:55, jambes:35,
              cadence:2.0, recharge:1.5, tolerance:0.045, secousse:0.55 },
  fusil:    { nom:"FUSIL",    chargeur:8, tete:70,  torse:40, jambes:28,
              cadence:2.5, recharge:2.0, tolerance:0.075, secousse:0.75 },
};

/* ---------------- les ennemis ----------------
   La corpulence dicte le couple vitesse/points de vie. Pour les types
   ordinaires, pv x vitesse tourne autour de 96 : ils représentent la
   même MENACE répartie autrement — l'un laisse peu de temps, l'autre
   demande plus de balles. Depardiahree casse la règle exprès (115) :
   c'est le seul qui vaut plus que ce qu'il coûte, donc le seul qui
   oblige à choisir. */
const ENNEMIS = {
  depar: {
    nom:"DEPARDIAHREE", pv:160, vitesse:0.072, taille:1.12, sprite:"depar",
    /* Le torse est BLINDÉ et la tête paye : c'est ce qui transforme un
       sac à points de vie en question. Sans ces multiplicateurs, tirer
       au hasard dans la masse restait la meilleure stratégie, parce que
       le torse est la zone la plus large. */
    /* 1,15 et pas 1,7 : à 1,7 le revolver faisait 170 sur 160 PV, donc
       UN headshot suffisait à coucher le tank et la question disparaissait.
       À 1,15 il en faut deux — deux balles dans la tête, ou neuf dans le
       torse, ou deux dans les jambes pour gagner une seconde. */
    mult:{ tete:1.15, torse:0.35, jambes:0.8, epaule:0.6 },
    /* Il lance à MOYENNE distance : trop loin la bouteille serait
       illisible, trop près le joueur n'a plus le temps de se couvrir. */
    jet:{ zMin:0.34, zMax:0.74, attente:[2.8, 4.6], objet:"bouteille",
          vol:1.15, degat:18 },
    /* Les jambes ne tuent pas, elles FONT GAGNER DU TEMPS. Le seuil est
       cumulatif : un tir de fusil dans la jambe (28 x 0,8) n'y suffit
       pas, deux oui. */
    trebuche:{ seuil:46, duree:1.15 },
  },
  dsk: {
    nom:"DSKKK", pv:95, vitesse:0.115, taille:0.98, sprite:"dsk",
    /* pv x vitesse = 10,9 contre 11,5 à Depardiahree : la même menace
       répartie autrement. L'un laisse peu de temps, l'autre demande
       beaucoup de balles. */
    mult:{ tete:1.25, torse:0.55, jambes:0.9, epaule:0.7 },
    /* La GARDE. Il couvre son visage périodiquement, et tant qu'elle
       tient, viser la tête revient à tirer dans ses avant-bras : aucun
       point de vie ne tombe, mais la garde s'use. Le joueur a donc trois
       réponses — attendre, tirer dans les jambes, ou casser la garde. */
    /* 240 et pas 78 : à 78 un seul coup de revolver (100 de brut)
       cassait la garde, donc « comment ouvrir sa garde ? » n'était pas
       une question. À 240 il faut trois balles de revolver ou quatre de
       fusil — la moitié d'un chargeur, ce qui rend l'autre réponse
       (attendre, ou viser les jambes) réellement concurrente. */
    garde:{ attente:[1.6, 2.9], duree:1.9, seuil:240, sonne:1.25,
            /* une fois sonné, il n'a plus de défense DU TOUT : c'est la
               récompense d'avoir cassé la garde plutôt que d'attendre */
            multSonne:1.8 },
    /* Arrivé au contact il ne s'évapore pas comme les autres : il SAUTE
       sur la barricade, et ça coûte plus cher. */
    bond:{ z:0.90, duree:0.55, degat:22 },
  },
  /* L'ABBÉ et BRUHELL, en attendant leur mécanique. Ils n'ont pas de
     `jet` : leurs poses de préparation ne sont pas dessinées. Ils
     avancent et frappent au contact — mais ils ne sont pas pour autant
     des doublons, parce qu'ils occupent une place que personne ne
     tenait : les FRAGILES. Peu de points de vie, tête très payante, ce
     sont ceux qu'on abat en premier quand la rue se remplit. */
  bruh: {
    nom:"PATRICK BRUHELL", pv:85, vitesse:0.100, taille:1.00, sprite:"bruh",
    /* Comme l'Abbé, sa menace n'est pas d'arriver au contact : exception
       DÉCLARÉE, et un test exige en échange qu'il reste fragile. */
    menaceDistante:true,
    mult:{ tete:1.50, torse:0.72, jambes:0.90, epaule:0.80 },
    /* IL EST L'EXACT CONTRAIRE DE L'ABBÉ, et c'est là tout l'intérêt de
       les avoir tous les deux. L'Abbé lance HAUT et LENT : on voit venir,
       on a le temps de se couvrir. BruHell lance un cocktail Molotov à
       plat et vite — 0,75 s de vol contre 1,35, une cloche de 0,045
       contre 0,185. Contre lui, se couvrir arrive souvent trop tard : la
       cible sur son bras devient la vraie réponse.
       En échange, il frappe plus fort et beaucoup moins souvent. */
    jet:{ zMin:0.34, zMax:0.52, attente:[3.4, 5.2], objet:"bouteille",
          vol:0.75, degat:22, penalite:1.7, cloche:0.045,
          /* cible mesurée sur enn_bruh_arme2 : la bouteille est à 0,33 de
             la largeur du canevas et 0,05 de sa hauteur */
          cible:{ x:0.33, y:0.05 } },
    plie:{ duree:1.3, multTete:1.7 },
  },
  abbe: {
    nom:"L'ABBÉ FORCEUR", pv:95, vitesse:0.090, taille:1.02, sprite:"abbe",
    /* Il est le premier à CASSER la règle pv x vitesse (8,6 au lieu de
       11) et c'est voulu : sa menace n'est pas d'arriver au contact mais
       de rester vivant derrière les autres à bombarder. Peu résistant,
       très gênant. */
    mult:{ tete:1.40, torse:0.70, jambes:0.90, epaule:0.80 },
    /* L'exception à la règle pv x vitesse est DÉCLARÉE ici, pas déduite
       d'un écart de chiffres : sa menace n'est pas d'arriver au contact.
       Un test vérifie en échange qu'il reste fragile — sinon ce drapeau
       serait un passe-droit. */
    menaceDistante:true,
    /* Il BOMBARDE EN CLOCHE, par-dessus les autres ennemis : il s'arrête
       LOIN — là où les autres n'ont pas encore commencé — et sa
       trajectoire monte deux fois plus haut. C'est ce qui le rend
       intéressant en horde mixte : un mur de Depardiahree ne le protège
       pas de la cible sur son bras, mais il protège son corps. */
    /* Sa fourchette ne CHEVAUCHE PAS celle de BruHell : postés à la même
       profondeur, les couloirs ayant convergé, ils se superposaient à
       l'écran avec leurs deux cibles. L'Abbé tient le fond, BruHell le
       plan intermédiaire. */
    jet:{ zMin:0.12, zMax:0.30, attente:[3.0, 4.8], objet:"encensoir",
          vol:1.35, degat:16, penalite:1.8, cloche:0.185,
          /* cible mesurée sur enn_abbe_arme2 : l'encensoir est à 0,34 de
             la largeur du canevas et 0,06 de sa hauteur */
          cible:{ x:0.34, y:0.06 } },
    /* Un jet annulé le laisse PLIÉ, tête offerte : c'est la récompense du
       tir de précision, et la raison de le préférer à À COUVERT. */
    plie:{ duree:1.5, multTete:1.8 },
  },
  jubi: {
    nom:"JUBILAR LE FUMIER", pv:110, vitesse:0.095, taille:1.00, sprite:"jubi",
    /* pv x vitesse = 10,5 : la troisième déclinaison de la même menace. */
    mult:{ tete:1.30, torse:0.60, jambes:0.85, epaule:0.75 },
    /* Il s'arrête net et prépare. Contrairement à Depardiahree, son bras
       armé porte une CIBLE : un tir dedans annule le jet. C'est la seule
       parade du niveau qui ne coûte pas de temps de tir, contrairement à
       À COUVERT — et c'est ce qui la rend intéressante. */
    /* Cible mesurée sur enn_jubi_arme2, et REMESURÉE à chaque nouvelle
       planche : la pose de préparation a changé en v6.63 et la pierre
       est passée de 0,23 / 0,09 à 0,14 / 0,05. Une position d'interface
       calée sur un sprite est solidaire de ce sprite. */
    jet:{ zMin:0.25, zMax:0.80, attente:[2.2, 3.6], objet:"pave",
          vol:1.00, degat:14, cible:{ x:0.14, y:0.05 }, penalite:1.6 },
  },
};

/* ---------------- ce qui vole ----------------
   Un projectile ne voyage pas dans l'espace du jeu : il voyage en Z,
   comme tout le reste du niveau. Sa taille et sa position se déduisent
   de sa profondeur, donc il grossit en approchant sans qu'on ait rien
   à animer. Passé un certain point il se retourne : un objet qui fond
   sur vous ne se voit plus de profil. */
const PROJ_BASCULE = 0.62;         /* fraction du vol où il se retourne */
/* L'échelle porte sur la PLUS GRANDE dimension de l'objet, et en
   fraction de la LARGEUR d'écran. Première version : la hauteur, en
   fraction de la hauteur d'écran — une bouteille fait 244 x 73, donc
   demander 15 % de hauteur en donnait 50 % de largeur. Elle remplissait
   l'écran. */
const PROJ_ECH_LOIN = 0.075;       /* part de la largeur, au départ     */
const PROJ_ECH_PRES = 0.340;       /* part de la largeur, à l'arrivée   */
const PROJ_HAUTEUR = 0.085;        /* de combien il monte en cloche     */
const PROJ_ROTATION = 6.0;
const IMPACT_DUREE = 0.55;
/* L'alerte doit apparaître AVANT que le bras parte, sinon elle ne
   prévient de rien. Elle vit toute la préparation. */
const ALERTE_TAILLE = 0.085;
/* Le retour d'un tir BLOQUÉ. Blanc et non rouge, en anneau et non en
   étoile : il ne doit surtout pas ressembler à un coup qui porte. */
const BLOCAGE_DUREE = 0.26;

/* ---------------- le bestiaire ----------------
   Une entrée par méchant : le sous-titre de sa carte, et les deux
   répliques de son arrivée. Le sous-titre doit dire COMMENT LE JOUER en
   quatre mots — c'est une carte de bestiaire, pas une biographie. La
   seconde réplique fait la blague, mais elle porte la même information :
   c'est le seul moment où le jeu enseigne, et il ne dure que deux
   secondes. */
const BESTIAIRE = {
  depar: {
    soustitre: "Blindé devant. Les jambes le ralentissent.",
    arrivee: ["Mon Dieu, un Depardiahree !", "Voilà un Depardiahree.",
              "Il y a un Depardiahree qui remonte la rue."],
    reponse: ["Vise pas le ventre, y'a rien à en tirer.",
              "Dans les jambes. Il tombe, il boit, il se relève.",
              "Il a le torse d'une armoire normande."],
  },
  dsk: {
    soustitre: "Rapide. Il se cache le visage.",
    arrivee: ["Un DSKKK !", "Attention, DSKKK.",
              "Mon Dieu, un DSKKK !"],
    reponse: ["Il met les mains devant. Casse-lui la garde.",
              "Deux fois plus vite et deux fois moins de plomb.",
              "Vise les jambes, elles passent."],
  },
  jubi: {
    soustitre: "Il s'arrête pour lancer. Vise son bras.",
    arrivee: ["Voilà Jubilar le fumier.", "Un Jubilar !",
              "Jubilar. Évidemment."],
    reponse: ["Quand il arme, tire dans le bras. Ça lui coupe l'envie.",
              "Le pavé ou le bras. À toi de voir.",
              "Il s'arrête toujours avant de lancer. C'est son défaut."],
  },
  abbe: {
    soustitre: "Il bombarde de loin, par-dessus les autres.",
    arrivee: ["Mon Dieu, l'Abbé Forceur !", "Voilà l'Abbé.",
              "L'Abbé Forceur, en personne."],
    reponse: ["Il lance en cloche. À couvert, ça suffit.",
              "Il reste au fond et il balance. Charmant homme.",
              "Son encensoir monte haut. Tu as le temps."],
  },
  bruh: {
    soustitre: "Molotov tendu. Trop rapide pour se couvrir.",
    arrivee: ["Un Patrick BruHell !", "Voilà BruHell.",
              "Mon Dieu, BruHell."],
    reponse: ["Lui, ça arrive à plat. Te couvrir sera trop tard.",
              "Tire dans le bras. C'est la seule réponse.",
              "Un cocktail, mais pas celui de Francky."],
  },
};

/* ---------------- l'annonce de horde ----------------
   Avant chaque horde, un héros nomme ce qui arrive et l'autre répond. À
   la PREMIÈRE rencontre d'un méchant, une carte de bestiaire précède
   l'échange : portrait en buste, nom, et deux mots qui disent comment le
   jouer. C'est le seul endroit du niveau où le jeu explique quelque
   chose — autant que ce soit court et que ça n'arrive qu'une fois. */
const ANNONCE_CARTE = 2.6;
const ANNONCE_MOT = 2.2;

/* ---------------- la cible du bras armé ----------------
   Mesuré au moment de concevoir les hordes : au fond de la rue un ennemi
   occupe 5,5 % de la hauteur d'écran, donc son avant-bras environ six
   pixels sur un iPhone. Une zone de tir calquée sur le sprite serait
   injouable là où elle sert le plus. La cible a donc une taille FIXE à
   l'écran, indépendante de la profondeur : c'est un élément d'interface
   posé sur l'ennemi, pas une partie de son corps.

   Sa position, elle, suit le sprite — bras levé, écarté du buste, en
   haut à droite de la boîte. C'est pour ça que la consigne de génération
   exige de voir du fond entre le bras et le corps. */
/* La position est MESURÉE sur le sprite de préparation, en fraction du
   canevas, et déclarée par personnage : elle n'est pas devinable. Ma
   première valeur (0,80 en largeur) plaçait la cible à DROITE alors que
   les deux planches lèvent le bras à GAUCHE — la cible flottait à côté
   d'une main vide. Refaire la mesure prend deux minutes ; la supposer
   coûte une livraison. */
const CIBLE_BRAS_DEFAUT = { x:0.23, y:0.09 };
const CIBLE_BRAS_TAILLE = 0.082;   /* fraction de la largeur d'écran */
const CIBLE_BRAS_PRISE = 1.15;     /* la zone tactile est un peu plus large */

/* ---------------- l'atténuation à distance ----------------
   Sans elle, la meilleure stratégie du niveau était de POSER le viseur
   sur le point de fuite et de tirer en boucle : les cinq couloirs
   convergent là-bas, donc tous les ennemis passent par ce point, et la
   tête d'un lointain valait autant que celle d'un ennemi au contact.
   Le joueur n'avait plus à viser ni à choisir.

   L'atténuation ne rend pas le tir lointain inutile — elle le rend
   COÛTEUX en munitions, ce qui remet le rechargement dans la boucle et
   récompense d'attendre qu'ils approchent. Le seuil de plein effet est
   volontairement bas (0,58) : passé la moitié de la rue, on tire à
   plein tarif, sinon le niveau devient une salle d'attente. */
const PORTEE_MIN = 0.32;           /* au fond de la ruelle              */
const PORTEE_PLEINE = 0.58;        /* à partir d'ici, plein tarif       */
function attenuation(z){
  return melange(PORTEE_MIN, 1, borne(z / PORTEE_PLEINE, 0, 1));
}
const RUELLE_JITTER = 0.08;        /* deux ennemis d'un même couloir ne
                                      doivent jamais être synchrones   */
const RUELLE_BARRICADE_PV = 100;

/* ---------- la relève ----------
   Quand l'un recharge, l'autre se lève et prend le relais tout seul.
   C'est ce qui fait des deux héros un BINÔME plutôt que deux boutons :
   le chargeur vide n'est plus un temps mort, c'est un passage de main.
   Ils s'appellent par leurs surnoms — Thibaut dit « inspecteur » à PF,
   PF dit « Callaghan » à Thibaut. */
const RELEVE_TH = [
  "Je te couvre, inspecteur.",
  "Bouge pas, j'ai ça.",
  "À moi, inspecteur.",
  "Recharge, je m'en occupe.",
];
const RELEVE_PF = [
  "Je prends la suite, Callaghan.",
  "Laisse, Callaghan.",
  "À moi.",
  "Souffle, Callaghan.",
];
const RELEVE_DUREE = 2.0;
/* L'IA ne prend pas TA place : elle prend celle de l'autre. Tu gardes
   Thibaut, et pendant qu'il recharge, PF se lève et tire tout seul — en
   ratant la moitié de ses coups, sinon le rechargement ne coûterait
   plus rien et la relève serait un cadeau. */
const IA_CADENCE = 0.62;            /* secondes entre deux coups        */
const IA_REUSSITE = 0.48;           /* un coup sur deux touche          */
const IA_ECART = 0.16;              /* de combien elle vise à côté      */
const RUELLE_DEGAT_BARRICADE = 12;

/* Les trois zones, en fraction de la hauteur du sprite depuis le haut.
   Elles suivent la taille et la position parce qu'elles sont exprimées
   en fractions : rien à recalculer quand l'ennemi grossit. */
const ZONES_CORPS = [
  { id:"tete",   haut:0.00, bas:0.20 },
  { id:"torse",  haut:0.20, bas:0.58 },
  { id:"jambes", haut:0.58, bas:1.00 },
];

/* ================= la mécanique du niveau ================= */
const Ruelle = {
  actif:false, fini:null, restant:0,
  ennemis:[], vague:0, aSortir:0, prochain:0,
  /* Qui a déjà été rencontré, pour ne montrer la carte qu'une fois. */
  vus:[], annonce:null, geantCle:null,
  projectiles:[], impacts:[], blocages:[],
  /* Le relevé de fin. `tues` est indexé par TYPE et pas par nom
     affichable : le nom vit dans ENNEMIS, et le dupliquer ici aurait
     dérivé au premier renommage — c'est exactement ce qui est arrivé
     avec les prénoms écrits en dur ailleurs dans ce projet. */
  bilan:null,
  barricade:RUELLE_BARRICADE_PV,
  actifIdx:0,                       /* 0 = Thibaut, 1 = PF */
  heros:[],
  secousse:0, hitStop:0, flashes:[],

  /* Les vagues montent en NOMBRE et en fréquence, pas en points de vie :
     le joueur doit sentir la pression, pas tirer quinze fois sur le
     même homme. */
  /* Chaque horde a son CASTING. Les premières enseignent une mécanique
     à la fois — tête ou jambes contre Depardiahree, puis la garde de
     DSKKK — et les suivantes mélangent, parce que la vraie difficulté
     est de décider QUI tuer en premier. */
  /* NEUF HORDES, et une progression qui ENSEIGNE au lieu de monter en
     nombre. Un type de méchant à la première, deux à la deuxième, trois
     à la troisième — puis un GÉANT. Le quatrième type arrive après lui,
     le cinquième ensuite, et un second géant clôt le cycle.

     `simultanes` plafonne le nombre de vivants à l'écran. C'est ce qui
     rend la question « qui tuer en premier ? » lisible : à huit ennemis
     de front on ne choisit plus, on arrose. */
  VAGUES:[
    { nombre:6,  delai:1.9,  vitesse:1.00, simultanes:2, types:["depar"] },
    { nombre:8,  delai:1.7,  vitesse:1.04, simultanes:3, types:["depar", "dsk"] },
    { nombre:10, delai:1.5,  vitesse:1.08, simultanes:3, types:["depar", "dsk", "jubi"] },
    { nombre:1,  delai:2.4,  vitesse:1.00, simultanes:1, geant:true,
      types:["depar", "dsk", "jubi"] },
    { nombre:11, delai:1.4,  vitesse:1.14, simultanes:3,
      types:["depar", "dsk", "jubi", "abbe"] },
    { nombre:12, delai:1.3,  vitesse:1.18, simultanes:3,
      types:["depar", "dsk", "jubi", "abbe", "bruh"] },
    { nombre:1,  delai:2.4,  vitesse:1.00, simultanes:1, geant:true,
      types:["dsk", "jubi", "abbe", "bruh"] },
    { nombre:14, delai:1.1,  vitesse:1.24, simultanes:3,
      types:["depar", "dsk", "jubi", "abbe", "bruh"] },
    { nombre:16, delai:0.95, vitesse:1.32, simultanes:3,
      types:["depar", "dsk", "jubi", "abbe", "bruh"] },
  ],
  /* Un géant, c'est un des cinq en 2,2 fois plus grand et quatre fois
     plus dur. Sa mécanique est INCHANGÉE : c'est ce qui le rend juste —
     on a appris à le lire, il faut le refaire en tenant plus longtemps. */
  GEANT_TAILLE:2.2, GEANT_PV:4.0, GEANT_VITESSE:0.62,

  demarrer(){
    this.actif = true; this.fini = null;
    this.ennemis.length = 0; this.flashes.length = 0;
    this.vus.length = 0; this.annonce = null; this.geantCle = null;
    this.projectiles.length = 0; this.impacts.length = 0; this.blocages.length = 0;
    this.bilan = { tues:{}, tetes:0, gardes:0, bloquees:0, encaissees:0,
                   contacts:0, hordes:0, annules:0 };
    for (const k of Object.keys(ENNEMIS)) this.bilan.tues[k] = 0;
    this.barricade = RUELLE_BARRICADE_PV;
    this.vague = 0; this.actifIdx = 0;
    this.secousse = 0; this.hitStop = 0;
    this.recul = 0; this.replique = null; this.iaT = 0; this.iaActive = false;
    this.couvert = false; this.introT = RUELLE_INTRO_DUREE; this.razViseur();
    this.heros = [
      { id:"thibaut", arme:"revolver", sprite:"ruel_th", balles:ARMES.revolver.chargeur,
        recharge:0, repos:0, pose:"vise1" },
      { id:"pf", arme:"fusil", sprite:"ruel_pf", balles:ARMES.fusil.chargeur,
        recharge:0, repos:0, pose:"vise" },
    ];
    this.lancerVague(0);
  },

  lancerVague(n){
    this.vague = n;
    const v = this.VAGUES[Math.min(n, this.VAGUES.length - 1)];
    this.aSortir = v.nombre;
    this.prochain = 0.6;
    /* Qui est la VEDETTE de cette horde : le type qu'on n'a jamais vu,
       sinon le géant, sinon celui qui arrive le plus souvent. C'est lui
       qu'on annonce — annoncer « des gens » n'apprend rien. */
    const inedits = (v.types || []).filter(k => this.vus.indexOf(k) < 0);
    const cle = v.geant
      ? (this.geantCle = piocher(v.types.slice()))
      : (inedits.length ? inedits[0] : piocher(v.types.slice()));
    this.annonce = {
      cle, geant:!!v.geant, t:0,
      /* La CARTE de bestiaire ne se montre qu'à la PREMIÈRE rencontre :
         c'est ce qui en fait une découverte. Neuf cartes dont six déjà
         vues, ce serait vingt secondes d'attente. */
      carte:this.vus.indexOf(cle) < 0 || !!v.geant,
      repliques:this.repliquesAnnonce(cle, !!v.geant),
    };
    if (this.vus.indexOf(cle) < 0) this.vus.push(cle);
    this.prochain = this.annonce.carte ? ANNONCE_CARTE + ANNONCE_MOT
                                       : ANNONCE_MOT;
  },

  /* Un héros nomme, l'autre commente. Le deuxième réplique est celle qui
     caractérise le méchant : c'est là qu'on apprend à quoi s'attendre,
     sous couvert de blague. */
  repliquesAnnonce(cle, geant){
    const b = BESTIAIRE[cle] || {};
    const nom = (ENNEMIS[cle] || {}).nom || "QUELQU'UN";
    if (geant){
      return [[0, "Euh… Thibaut ?"],
              [1, piocher(["Je le vois. Je le vois très bien.",
                           "Il a mangé les autres, c'est pas possible.",
                           "On va avoir besoin de plus de balles."])],
              [0, "UN " + nom + " GÉANT !"]];
    }
    return [[Math.random() < 0.5 ? 0 : 1, piocher(b.arrivee || ["Un " + nom + " !"])],
            [Math.random() < 0.5 ? 1 : 0, piocher(b.reponse || ["Charmant."])]];
  },

  /* Vivants à l'écran : ceux qui peuvent encore agir. Un corps au sol ne
     compte pas — sinon le plafond se remplirait de cadavres. */
  vivants(){
    return this.ennemis.filter(e => e.etat !== "chute" && e.etat !== "sol").length;
  },
  simultanesMax(){
    const v = this.VAGUES[Math.min(this.vague, this.VAGUES.length - 1)];
    return v.simultanes || 3;
  },
  vagueCourante(){
    return this.VAGUES[Math.min(this.vague, this.VAGUES.length - 1)];
  },

  ajouterEnnemi(){
    const v = this.VAGUES[Math.min(this.vague, this.VAGUES.length - 1)];
    /* Le casting est tiré dans la liste de la vague, répétitions
       comprises : un type présent deux fois sort deux fois plus. */
    const noms = v.types || Object.keys(ENNEMIS);
    const cle = v.geant && this.geantCle ? this.geantCle
              : noms[Math.floor(Math.random() * noms.length)];
    const ref = ENNEMIS[cle];
    const jitter = v.geant ? 1 : 1 + (Math.random() * 2 - 1) * RUELLE_JITTER;
    /* LE GÉANT n'est pas un sixième ennemi : c'est l'un des cinq, en plus
       gros et plus dur, avec sa mécanique INCHANGÉE. C'est ce qui le rend
       juste — on a appris à le lire, il faut le refaire en tenant plus
       longtemps. Il est aussi plus LENT : sans ça, quatre fois les points
       de vie à vitesse normale ne laissait pas le temps de le travailler. */
    const g = !!v.geant;
    this.ennemis.push({
      ref, geant:g,
      pv:ref.pv * (g ? this.GEANT_PV : 1), pvMax:ref.pv * (g ? this.GEANT_PV : 1),
      taille:(ref.taille || 1) * (g ? this.GEANT_TAILLE : 1),
      couloir:g ? 2 : Math.floor(Math.random() * RUELLE_COULOIRS.length),
      z:0, vitesse:ref.vitesse * v.vitesse * jitter * (g ? this.GEANT_VITESSE : 1),
      etat:"course", frame:0, tFrame:0, tEtat:0, mort:0,
      touche:null,
      /* dégâts encaissés dans les jambes depuis le dernier trébuchement,
         et délai avant le prochain jet */
      usure:0, attente:ref.jet ? melange(ref.jet.attente[0], ref.jet.attente[1], Math.random()) : 0,
      /* la garde : usure des avant-bras, et délai avant de la relever */
      usureGarde:0,
      attenteGarde:ref.garde ? melange(ref.garde.attente[0], ref.garde.attente[1], Math.random()) : 0,
    });
    this.aSortir--;
  },

  heroActif(){ return this.heros[this.actifIdx]; },

  /* L'équipier couvre : il se lève et tire de lui-même, sans que le
     joueur change de personnage. */
  iaCouvre(dt){
    const moi = this.heroActif();
    const lui = this.heros[1 - this.actifIdx];
    const doitCouvrir = moi.recharge > 0 && lui.recharge <= 0 && !this.couvert;
    if (!doitCouvrir){ this.iaT = 0; this.iaActive = false; return; }
    if (!this.iaActive){
      this.iaActive = true;
      const lignes = lui.id === "thibaut" ? RELEVE_TH : RELEVE_PF;
      this.replique = { txt:piocher(lignes), t:RELEVE_DUREE, qui:1 - this.actifIdx };
    }
    this.iaT -= dt;
    if (this.iaT > 0) return;
    this.iaT = IA_CADENCE;
    if (lui.balles <= 0){
      lui.recharge = ARMES[lui.arme].recharge; Sons.recharge(lui.arme !== "revolver"); return;
    }
    lui.balles--; lui.repos = 0.22;
    this.flashes.push({ t:0.13, duree:0.13, heros:1 - this.actifIdx });
    if (lui.arme === "revolver") Sons.revolver(); else Sons.fusil();
    /* Elle vise le plus avancé, et rate souvent : c'est un soutien, pas
       une seconde paire de mains parfaite. */
    const proies = this.ennemis.filter(e => e.etat !== "chute" && e.etat !== "sol");
    if (!proies.length) return;
    let but = proies[0];
    for (const e of proies) if (e.z > but.z) but = e;
    const b = this.boiteEnnemi(but);
    if (Math.random() > IA_REUSSITE) return;   /* raté : le coup part dans le décor */
    const arme = ARMES[lui.arme];
    const f = 0.20 + Math.random() * 0.60;     /* elle ne visait pas la tête */
    void IA_ECART;
    const zone = (ZONES_CORPS.find(z => f >= z.haut && f < z.bas) || ZONES_CORPS[1]).id;
    if (this.gardeTient(but) && zone === "tete"){
      but.usureGarde += brut * attenuation(but.z);
      if (but.usureGarde >= but.ref.garde.seuil){
        but.usureGarde = 0; but.etat = "garde_casse"; but.tEtat = 0;
      }
      return;
    }
    const brut = zone === "tete" ? arme.tete : zone === "torse" ? arme.torse : arme.jambes;
    const degat = brut * ((but.ref.mult && but.ref.mult[zone]) || 1) * attenuation(but.z);
    but.pv -= degat; but.touche = zone; Sons.impact(false);
    this.userJambes(but, zone, degat);
    Score.points += 10;
    if (but.pv <= 0){
      but.etat = "chute"; but.tEtat = 0; but.mort = 0;
      this.compterMort(but, zone);
      Score.points += 100;
    }
    else { but.etat = "touche"; but.tEtat = 0; }
    void b;
  },
  armeActive(){ return ARMES[this.heroActif().arme]; },
  changerHeros(){ this.actifIdx = 1 - this.actifIdx; Sons.clic(); },

  /* Tirer dans les jambes ne tue pas, ça FAIT TRÉBUCHER. Le compteur est
     cumulatif et remis à zéro à chaque chute : sans remise à zéro, une
     fois le seuil franchi il trébuchait à chaque balle et n'avançait
     plus jamais. Un ennemi déjà au sol ou en train de lancer ne trébuche
     pas — interrompre un jet est le travail du tir dans le bras, pas
     celui-ci. */
  gardeTient(e){ return !!e.ref.garde && e.etat === "garde"; },

  /* La fenêtre est OUVERTE pendant la préparation seulement : viser le
     bras avant qu'il soit armé, ou après le lancer, ne veut rien dire. */
  cibleOuverte(e){
    return !!(e.ref.jet && e.ref.jet.cible) && e.etat === "arme2";
  },
  /* L'image d'une pose, avec son repli : la pose demandée, puis celle
     que REPLI_POSE désigne, puis `run1` en dernier recours. */
  imagePose(e){
    const base = "enn_" + e.ref.sprite + "_";
    const nom = this.poseEnnemi(e);
    return Images.table[base + nom]
        || Images.table[base + (REPLI_POSE[nom] || "run1")]
        || Images.table[base + "run1"];
  },

  /* Le rectangle où une pose est RÉELLEMENT dessinée. Même arithmétique
     que le rendu, et il faut qu'elle le reste : la boîte de référence ne
     suffit pas dès qu'une pose a un canevas plus haut. L'encensoir levé
     de l'Abbé donne à sa pose `arme2` un canevas de 509 px contre 346
     pour sa course — raisonner sur la boîte de référence plaçait la cible
     150 px sous l'encensoir. */
  rectPose(e){
    const b = this.boiteEnnemi(e);
    const spr = this.imagePose(e);
    const ref = Images.table["enn_" + e.ref.sprite + "_run1"];
    if (!spr || !ref || !ref.naturalHeight) return b;
    const k = spr.naturalHeight / ref.naturalHeight;
    const h = b.h * k, l = h * spr.naturalWidth / spr.naturalHeight;
    return { x:b.x + (b.l - l) / 2, y:b.y + b.h - h, l, h };
  },
  posCibleBras(e){
    const r = this.rectPose(e);
    const c = (e.ref.jet && typeof e.ref.jet.cible === "object")
            ? e.ref.jet.cible : CIBLE_BRAS_DEFAUT;
    return { x:r.x + r.l * c.x, y:r.y + r.h * c.y,
             r:Camera.L * CIBLE_BRAS_TAILLE * 0.5 };
  },
  /* Un tir dans la cible : le jet est ANNULÉ, le pavé tombe, et il perd
     du temps. Rien n'entame ses points de vie — la parade fait gagner du
     temps, elle ne tue pas, sinon viser le bras dominerait tout. */
  tirerCibleBras(fx, fy){
    /* Deux cibles peuvent se SUPERPOSER : au fond de la rue les cinq
       couloirs ont convergé, et deux bombardiers postés loin se
       retrouvent à quelques pixels l'un de l'autre. On prend alors le
       PLUS PROCHE — même règle que pour les zones du corps, et surtout
       une règle déterministe : sans elle, c'était l'ordre du tableau qui
       décidait, donc l'ordre d'apparition. */
    let vise = null, meilleur = -1;
    for (const e of this.ennemis){
      if (!this.cibleOuverte(e)) continue;
      const c = this.posCibleBras(e);
      const dx = fx - c.x, dy = fy - c.y, rr = c.r * CIBLE_BRAS_PRISE;
      if (dx * dx + dy * dy > rr * rr) continue;
      if (e.z > meilleur){ meilleur = e.z; vise = e; }
    }
    {
      const e = vise;
      if (!e) return false;
      e.etat = "lache"; e.tEtat = 0;
      e.attente = e.ref.jet.attente[1] * e.ref.jet.penalite;
      Sons.impact(true);
      this.secousse = Math.max(this.secousse, 0.4);
      this.hitStop = Math.max(this.hitStop, 0.05);
      Score.points += 150;
      if (this.bilan) this.bilan.annules++;
      return true;
    }
  },

  /* Un seul endroit compte les morts : le joueur et l'équipier tuent
     tous les deux, et deux compteurs séparés auraient divergé. */
  compterMort(e, zone){
    if (!this.bilan) return;
    const cle = Object.keys(ENNEMIS).find(k => ENNEMIS[k] === e.ref);
    if (cle) this.bilan.tues[cle] = (this.bilan.tues[cle] || 0) + 1;
    if (zone === "tete") this.bilan.tetes++;
  },

  userJambes(e, zone, degat){
    if (zone !== "jambes" || !e.ref.trebuche) return;
    if (e.etat === "chute" || e.etat === "sol" || e.etat === "trebuche") return;
    e.usure += degat;
    if (e.usure < e.ref.trebuche.seuil) return;
    e.usure = 0;
    e.etat = "trebuche"; e.tEtat = 0;
  },

  pas(dt){
    if (!this.actif) return;
    /* Pendant l'annonce, rien ne bouge : ni les ennemis, ni le chrono. */
    if (this.introT > 0){ this.introT -= dt; return; }
    if (this.hitStop > 0){ this.hitStop -= dt; return; }
    this.secousse = Math.max(0, this.secousse - dt * 2.4);
    this.pasViseur(dt);
    for (const h of this.heros){
      if (h.recharge > 0){
        h.recharge -= dt;
        if (h.recharge <= 0){ h.balles = ARMES[h.arme].chargeur; h.repos = 0.12; }
      }
      if (h.repos > 0) h.repos -= dt;
    }
    /* Si celui qu'on tient recharge, l'autre couvre — sans changer de
       personnage : le joueur garde le sien. */
    this.iaCouvre(dt);
    if (this.replique){
      this.replique.t -= dt;
      if (this.replique.t <= 0) this.replique = null;
    }
    /* apparitions */
    if (this.aSortir > 0 && this.vivants() < this.simultanesMax()){
      this.prochain -= dt;
      if (this.prochain <= 0){
        this.ajouterEnnemi();
        const v = this.VAGUES[Math.min(this.vague, this.VAGUES.length - 1)];
        this.prochain = v.delai * (0.7 + Math.random() * 0.6);
      }
    }
    for (let i = this.ennemis.length - 1; i >= 0; i--){
      const e = this.ennemis[i];
      e.tEtat += dt;
      if (e.etat === "course"){
        e.z += e.vitesse * dt;
        /* Le bond passe AVANT tout le reste : arrivé là, plus rien
           d'autre ne compte. */
        if (e.ref.bond && e.z >= e.ref.bond.z){
          e.etat = "bond"; e.tEtat = 0; Sons.souffle(0.12, 0.09, 500, 1.6);
          continue;
        }
        if (e.ref.garde){
          e.attenteGarde -= dt;
          if (e.attenteGarde <= 0){
            e.etat = "garde"; e.tEtat = 0; e.usureGarde = 0;
            continue;
          }
        }
        /* Le jet : il faut être à moyenne distance, avoir attendu, et
           qu'aucune bouteille de lui ne soit déjà en vol. */
        const jet = e.ref.jet;
        if (jet){
          e.attente -= dt;
          if (e.attente <= 0 && e.z >= jet.zMin && e.z <= jet.zMax){
            /* celui qui a une cible sur le bras s'arrête NET d'abord :
               l'arrêt est le premier signal, et il faut qu'il précède la
               fenêtre de tir pour que le joueur ait le temps de lire */
            e.etat = jet.cible ? "arret" : "ramasse"; e.tEtat = 0;
            continue;
          }
        }
        /* Un lointain avance de peu de pixels : à cadence fixe il
           saccade. On lie la cadence d'animation à la vitesse APPARENTE,
           donc à la profondeur — loin il trottine, près il martèle. */
        e.tFrame += dt;
        const cad = melange(0.165, 0.075, courbeZ(e.z));
        if (e.tFrame > cad){ e.tFrame -= cad; e.frame = (e.frame + 1) % 6; }
        if (e.z >= 1){
          e.z = 1;
          this.barricade = Math.max(0, this.barricade - RUELLE_DEGAT_BARRICADE);
          if (this.bilan) this.bilan.contacts++;
          this.secousse = 0.8; Sons.choc();
          this.ennemis.splice(i, 1);
          if (this.barricade <= 0) this.terminer(false);
          continue;
        }
      } else if (e.etat === "arret"){
        if (e.tEtat > 0.38){ e.etat = "arme1"; e.tEtat = 0; }
      } else if (e.etat === "arme1"){
        if (e.tEtat > 0.34){ e.etat = "arme2"; e.tEtat = 0; }
      } else if (e.etat === "arme2"){
        /* LA FENÊTRE. 0,85 s, la même durée que le télégraphe de
           Depardiahree moins le temps de ramassage : assez pour lire et
           décider, trop peu pour flâner. */
        if (e.tEtat > 0.85){
          e.etat = "lance"; e.tEtat = 0;
          this.lancerProjectile(e);
        }
      } else if (e.etat === "lache"){
        /* l'objet est tombé : il se tient le bras. Qui a une pose `plie`
           enchaîne dessus — sa tête est alors offerte, et c'est la vraie
           récompense du tir dans le bras. Les autres repartent. */
        if (e.tEtat > 0.75){
          if (e.ref.plie){ e.etat = "plie"; e.tEtat = 0; }
          else { e.etat = "course"; e.tEtat = 0; }
        }
      } else if (e.etat === "plie"){
        if (e.tEtat > e.ref.plie.duree){ e.etat = "course"; e.tEtat = 0; }
      } else if (e.etat === "ramasse"){
        /* il s'ARRÊTE pour ramasser : l'arrêt est déjà une information,
           et c'est la fenêtre où on peut le punir sans qu'il avance */
        if (e.tEtat > 0.45){ e.etat = "arme"; e.tEtat = 0; }
      } else if (e.etat === "arme"){
        /* le télégraphe : bras en arrière, alerte au-dessus de la tête */
        if (e.tEtat > 1.05){
          e.etat = "lance"; e.tEtat = 0;
          this.lancerProjectile(e);
        }
      } else if (e.etat === "lance"){
        if (e.tEtat > 0.30){
          e.etat = "course"; e.tEtat = 0;
          const j = e.ref.jet;
          e.attente = melange(j.attente[0], j.attente[1], Math.random());
        }
      } else if (e.etat === "garde"){
        /* IL AVANCE EN GARDE. S'arrêter aurait fait de la garde un
           répit : c'est l'inverse qu'il faut, elle doit être une
           pression. La cadence des deux poses fait la marche. */
        e.z += e.vitesse * dt * 0.82;
        e.tFrame += dt;
        const cadG = melange(0.22, 0.11, courbeZ(e.z));
        if (e.tFrame > cadG){ e.tFrame -= cadG; e.frame = (e.frame + 1) % 2; }
        if (e.ref.bond && e.z >= e.ref.bond.z){ e.etat = "bond"; e.tEtat = 0; continue; }
        if (e.tEtat > e.ref.garde.duree){
          e.etat = "course"; e.tEtat = 0;
          const g = e.ref.garde;
          e.attenteGarde = melange(g.attente[0], g.attente[1], Math.random());
        }
      } else if (e.etat === "garde_casse"){
        if (e.tEtat > 0.34){ e.etat = "sonne"; e.tEtat = 0; }
      } else if (e.etat === "sonne"){
        /* plus de défense du tout, et il n'avance plus : c'est la
           fenêtre que le joueur a gagnée en cassant la garde */
        if (e.tEtat > e.ref.garde.sonne){
          e.etat = "course"; e.tEtat = 0;
          const g = e.ref.garde;
          e.attenteGarde = melange(g.attente[0], g.attente[1], Math.random());
        }
      } else if (e.etat === "bond"){
        if (e.tEtat > e.ref.bond.duree){
          this.barricade = Math.max(0, this.barricade - e.ref.bond.degat);
          if (this.bilan) this.bilan.contacts++;
          this.secousse = 1.0; this.hitStop = Math.max(this.hitStop, 0.06);
          Sons.choc();
          this.ennemis.splice(i, 1);
          if (this.barricade <= 0) this.terminer(false);
          continue;
        }
      } else if (e.etat === "trebuche"){
        /* il ne recule pas, il PERD DU TEMPS : c'est tout l'intérêt de
           lui tirer dans les jambes plutôt que de vider un chargeur
           dans son torse blindé. */
        if (e.tEtat > e.ref.trebuche.duree){ e.etat = "course"; e.tEtat = 0; }
      } else if (e.etat === "touche"){
        e.z += e.vitesse * dt * 0.35;   /* il ralentit, il ne s'arrête pas */
        if (e.tEtat > 0.22){ e.etat = "course"; e.tEtat = 0; }
      } else if (e.etat === "chute"){
        if (e.tEtat > 0.42){ e.etat = "sol"; e.tEtat = 0; }
      } else if (e.etat === "sol"){
        e.mort += dt;
        if (e.mort > 1.2){ this.ennemis.splice(i, 1); continue; }
      }
    }
    if (this.annonce){
      this.annonce.t += dt;
      const fin = (this.annonce.carte ? ANNONCE_CARTE : 0) + ANNONCE_MOT;
      if (this.annonce.t >= fin) this.annonce = null;
    }
    this.pasProjectiles(dt);
    for (let i = this.flashes.length - 1; i >= 0; i--){
      this.flashes[i].t -= dt;
      if (this.flashes[i].t <= 0) this.flashes.splice(i, 1);
    }
    /* la flamme dure un peu plus qu'une image : sinon on ne la voit
       jamais sur un écran à soixante images par seconde */
    /* vague suivante quand tout est nettoyé */
    if (this.aSortir <= 0 && !this.projectiles.length &&
        !this.ennemis.some(e => e.etat !== "chute" && e.etat !== "sol")){
      if (this.bilan) this.bilan.hordes = this.vague + 1;
      if (this.vague + 1 < this.VAGUES.length) this.lancerVague(this.vague + 1);
      else if (!this.fini) this.terminer(true);
    }
  },

  lancerProjectile(e){
    const j = e.ref.jet;
    /* On fige la hauteur de départ MAINTENANT : c'est la main du
       lanceur, et lui va continuer d'avancer ou tomber pendant le vol. */
    const p = Perspective.projeter(e.z, e.couloir);
    const haut = p.hauteur * (e.taille || e.ref.taille);
    this.projectiles.push({
      objet:j.objet, couloir:e.couloir, z0:e.z, y0:p.y - haut * 0.82,
      t:0, duree:j.vol, degat:j.degat, cloche:j.cloche,
    });
    /* le sifflement du verre qui part : court, aigu, il annonce le vol
       sans couvrir la détonation du joueur */
    Sons.souffle(0.16, 0.05, 900, 2.4);
  },

  /* Le seul endroit du niveau où COUVERT protège de quelque chose.
     Jusqu'ici le bouton coûtait un temps de tir et ne rendait rien :
     les deux héros s'accroupissaient devant un danger qui n'existait
     pas. La bouteille est ce danger. */
  pasProjectiles(dt){
    for (let i = this.projectiles.length - 1; i >= 0; i--){
      const pr = this.projectiles[i];
      pr.t += dt;
      if (pr.t < pr.duree) continue;
      this.projectiles.splice(i, 1);
      const abrite = this.couvert;
      this.impacts.push({
        image:abrite ? "imp_bois" : "imp_vin", t:0, couloir:pr.couloir, abrite,
      });
      if (abrite){
        /* elle éclate SUR les caisses : le bruit sans la douleur */
        if (this.bilan) this.bilan.bloquees++;
        this.secousse = Math.max(this.secousse, 0.35);
        Sons.choc();
      } else {
        if (this.bilan) this.bilan.encaissees++;
        this.barricade = Math.max(0, this.barricade - pr.degat);
        this.secousse = Math.max(this.secousse, 0.9);
        this.hitStop = Math.max(this.hitStop, 0.05);
        Sons.choc();
        if (this.barricade <= 0) this.terminer(false);
      }
    }
    for (let i = this.impacts.length - 1; i >= 0; i--){
      this.impacts[i].t += dt;
      if (this.impacts[i].t > IMPACT_DUREE) this.impacts.splice(i, 1);
    }
    for (let i = this.blocages.length - 1; i >= 0; i--){
      this.blocages[i].t += dt;
      if (this.blocages[i].t > BLOCAGE_DUREE) this.blocages.splice(i, 1);
    }
  },

  /* Où en est une bouteille à l'écran. La profondeur va du lanceur à la
     barricade ; la cloche est une simple parabole retirée à la hauteur,
     ce qui suffit à ne pas donner un tir tendu. */
  posProjectile(pr){
    const av = borne(pr.t / pr.duree, 0, 1);
    const z = melange(pr.z0, 1, av);
    const p = Perspective.projeter(z, pr.couloir);
    /* La trajectoire va de la MAIN du lanceur à la barricade, et non
       d'une hauteur arbitraire : c'est ce qui fait qu'on la voit partir
       de lui. La cloche est retirée par-dessus, modérément — à 0,30 de
       hauteur d'écran elle sortait par le haut. */
    const yArrivee = Camera.H * RUELLE_PREMIER_PLAN;
    /* la hauteur de cloche est propre au lanceur : l'Abbé passe par
       dessus les autres, un pavé va presque tendu */
    const cloche = Math.sin(av * Math.PI) * Camera.H * (pr.cloche || PROJ_HAUTEUR);
    const y = melange(pr.y0, yArrivee, av) - cloche;
    const taille = Camera.L * melange(PROJ_ECH_LOIN, PROJ_ECH_PRES, courbeZ(z));
    return { x:p.x, y, taille, av };
  },

  terminer(gagne){
    this.actif = false;
    this.fini = { gagne, t:0 };
    Jeu.phase = "fin";
  },
};

/* ---------------- le tir ----------------
   HITSCAN : le doigt désigne un point, on cherche qui est dessous et
   quelle zone du corps. Aucun projectile ne voyage — le retour doit
   être instantané, c'est tout l'intérêt du tap-to-shoot. */
Ruelle.boiteEnnemi = function(e){
  const p = Perspective.projeter(e.z, e.couloir);
  const h = p.hauteur * (e.taille || e.ref.taille);
  const img = Images.table["enn_" + e.ref.sprite + "_run1"];
  const rap = img && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 0.9;
  const l = h * rap;
  return { x:p.x - l / 2, y:p.y - h, l, h, ordre:p.ordre };
};

/* Qui est sous le doigt ? Le PLUS PROCHE d'abord : deux ennemis
   superposés, c'est celui de devant qu'on vise. */
Ruelle.viser = function(fx, fy, tolerance){
  let vise = null, zone = null;
  for (const e of this.ennemis){
    if (e.etat === "chute" || e.etat === "sol") continue;
    const b = this.boiteEnnemi(e);
    const marge = b.l * (tolerance || 0);
    if (fx < b.x - marge || fx > b.x + b.l + marge) continue;
    if (fy < b.y - marge || fy > b.y + b.h + marge) continue;
    if (vise && this.boiteEnnemi(vise).ordre > b.ordre) continue;
    const f = borne((fy - b.y) / Math.max(1, b.h), 0, 0.999);
    zone = (ZONES_CORPS.find(z => f >= z.haut && f < z.bas) || ZONES_CORPS[1]).id;
    vise = e;
  }
  return vise ? { ennemi:vise, zone } : null;
};

Ruelle.tirer = function(fx, fy){
  if (!this.actif) return false;
  const h = this.heroActif(), arme = ARMES[h.arme];
  if (h.recharge > 0 || h.repos > 0) return false;
  if (h.balles <= 0){
    /* le clic à vide, puis le rechargement : on l'entend avant de le lire */
    h.recharge = arme.recharge; Sons.aVide(); Sons.recharge(h.arme !== "revolver");
    return false;
  }
  h.balles--; h.repos = 1 / arme.cadence;
  /* La cible du bras passe AVANT les zones du corps : elle se superpose
     à la silhouette, et le joueur qui la vise ne veut pas toucher le
     torse par accident. */
  const annule = this.tirerCibleBras(fx, fy);
  if (h.balles <= 0){ h.recharge = arme.recharge; Sons.recharge(h.arme !== "revolver"); }
  this.secousse = Math.max(this.secousse, arme.secousse * 0.35);
  this.flashes.push({ t:0.13, duree:0.13, heros:this.actifIdx });
  if (h.arme === "revolver") Sons.revolver(); else Sons.fusil();
  if (annule) return true;
  const cible = this.viser(fx, fy, arme.tolerance);
  if (!cible) return false;
  const e = cible.ennemi;
  const brut = cible.zone === "tete" ? arme.tete
             : cible.zone === "torse" ? arme.torse : arme.jambes;
  /* GARDE : viser la tête revient à tirer dans les avant-bras. Aucun
     point de vie ne tombe — mais il FAUT le dire, sinon le joueur croit
     le jeu cassé. C'est le piège « éteint ne veut pas dire invisible »
     appliqué au tir : un coup sans effet visible est un bug aux yeux de
     celui qui joue. */
  if (this.gardeTient(e) && cible.zone === "tete"){
     /* la garde aussi : sinon on la cassait depuis le point de fuite,
        au même prix qu'au contact */
     e.usureGarde += brut * attenuation(e.z);
     this.blocages.push({ x:fx, y:fy, t:0 });
     Sons.bloque();
     if (e.usureGarde >= e.ref.garde.seuil){
       e.usureGarde = 0; e.etat = "garde_casse"; e.tEtat = 0;
       if (this.bilan) this.bilan.gardes++;
       Sons.impact(true); this.secousse = Math.max(this.secousse, 0.45);
     }
     return true;
  }
  const degat = brut * ((e.ref.mult && e.ref.mult[cible.zone]) || 1)
              * (e.etat === "sonne" && e.ref.garde && cible.zone === "tete"
                 ? e.ref.garde.multSonne : 1)
              * (e.etat === "plie" && e.ref.plie && cible.zone === "tete"
                 ? e.ref.plie.multTete : 1)
              * attenuation(e.z);
  e.pv -= degat;
  e.touche = cible.zone;
  this.userJambes(e, cible.zone, degat);
  Sons.impact(cible.zone === "tete");
  Score.points += cible.zone === "tete" ? 40 : 10;
  if (e.pv <= 0){
    e.etat = "chute"; e.tEtat = 0; e.mort = 0;
    this.compterMort(e, cible.zone);
    Score.points += 100 + (cible.zone === "tete" ? 60 : 0);
    /* un arrêt sur image très bref rend le coup satisfaisant sans
       casser la lisibilité */
    this.hitStop = cible.zone === "tete" ? 0.07 : 0.03;
    this.secousse = Math.max(this.secousse, 0.5);
  } else {
    e.etat = "touche"; e.tEtat = 0;
  }
  return true;
};

/* La pose d'un ennemi se déduit de son état, comme partout ailleurs. */
Ruelle.poseEnnemi = function(e){
  /* Le harnais force une pose pour photographier la planche entière à
     la taille du jeu. Rien d'autre ne pose ce champ. */
  if (e.poseForcee) return e.poseForcee;
  /* Il s'affaisse : la première pose au sol est encore tendue, la
     seconde est molle. Qui n'a pas de `sol2` retombe sur `sol`. */
  if (e.etat === "sol") return e.mort > 0.55 ? "sol2" : "sol";
  if (e.etat === "chute") return e.tEtat < 0.21 ? "chute1" : "chute2";
  if (e.etat === "garde") return "garde" + (1 + e.frame);
  if (e.etat === "garde_casse") return "garde_casse";
  if (e.etat === "sonne") return "sonne";
  if (e.etat === "bond") return "bond";
  if (e.etat === "arret") return "arret";
  if (e.etat === "arme1") return "arme1";
  if (e.etat === "arme2") return "arme2";
  if (e.etat === "lache") return "lache";
  if (e.etat === "plie") return "plie";
  if (e.etat === "ramasse") return "ramasse";
  if (e.etat === "arme") return "arme";
  if (e.etat === "lance") return "lance";
  if (e.etat === "trebuche") return e.tEtat < 0.34 ? "trebuche1" : "trebuche2";
  if (e.etat === "touche"){
    return e.touche === "tete" ? "hit_tete"
         : e.touche === "jambes" ? "hit_jambe"
         : e.tEtat < 0.11 ? "hit_torse" : "hit_epaule";
  }
  return "run" + (1 + e.frame);
};

/* La pose d'un héros : il vise, il tire, il se relève après le recul,
   il s'accroupit pour recharger. */
Ruelle.poseHeros = function(i){
  const h = this.heros[i], arme = ARMES[h.arme];
  if (this.couvert) return "accroupi";
  /* L'équipier qui couvre DOIT jouer l'animation de tir : sinon il tire
     vraiment — les munitions descendent, les ennemis tombent — mais il
     garde la pose au repos, et on croit que rien ne se passe. */
  const vise = i === this.actifIdx || (this.iaActive && i !== this.actifIdx);
  /* Celui qui ne fait rien reste À COUVERT : debout derrière la
     barricade sans tirer, il avait l'air d'attendre le bus. */
  if (!vise && h.recharge <= 0) return "accroupi";
  const th = h.id === "thibaut";
  if (h.recharge > 0){
    const p = 1 - h.recharge / arme.recharge;
    return p < 0.3 ? "baisse" : p < 0.7 ? "accroupi" : (th ? "arme1" : "arme1");
  }
  if (!vise) return th ? "arme2" : "arme2";
  const plein = i === this.actifIdx ? 1 / arme.cadence : 0.34;
  const t = plein - h.repos;
  if (h.repos > 0){
    /* PF n'utilise PAS sa pose `tir` : sa planche y dessine un éclair de
       bouche qui, une fois le personnage retourné, se retrouve à l'autre
       bout de l'écran. On garde sa pose de visée et on peint la flamme
       nous-mêmes, au bon endroit. */
    if (t < 0.09) return th ? "tir" : "vise";
    if (t < 0.18) return th ? "recul1" : "fumee";
    return th ? "recul2" : "recul1";
  }
  return th ? "vise1" : "vise";
};

/* ================= le rendu de la ruelle ================= */
const RuelleVue = {
  /* La carte de bestiaire, puis l'échange. Deux temps SUCCESSIFS et non
     superposés : la carte présente, le dialogue commente. Les mélanger
     donnerait un écran illisible pendant deux secondes. */
  dessinerAnnonce(){
    const L = Camera.L, H = Camera.H, an = Ruelle.annonce;
    const b = BESTIAIRE[an.cle] || {};
    const ref = ENNEMIS[an.cle] || {};
    const carteFin = an.carte ? ANNONCE_CARTE : 0;

    if (an.carte && an.t < carteFin){
      const av = an.t / carteFin;
      /* elle entre vite et sort vite : le temps utile est au milieu */
      const opac = borne(Math.min(av / 0.14, (1 - av) / 0.18), 0, 1);
      const cy = H * 0.34;
      ctx.globalAlpha = opac * 0.82;
      ctx.fillStyle = "#080D18";
      ctx.fillRect(0, cy - H * 0.30, L, H * 0.60);
      ctx.globalAlpha = opac;
      const im = Images.table["port_" + an.cle];
      const cote = H * 0.30 * (an.geant ? 1.12 : 1);
      if (im && im.naturalWidth){
        ctx.drawImage(im, L / 2 - cote / 2, cy - H * 0.24, cote, cote);
      }
      ctx.textAlign = "center";
      /* Le texte est RÉDUIT jusqu'à tenir, il n'est pas posé à une taille
         devinée : « L'ABBÉ FORCEUR » débordait des deux côtés en portrait,
         et le sous-titre encore plus. La largeur disponible se mesure,
         elle ne s'estime pas. */
      ctx.fillStyle = "#F1F5FF";
      RuelleVue.texteQuiTient((an.geant ? "GÉANT " : "") + (ref.nom || ""),
        L / 2, cy + H * 0.115, L * 0.92, H * 0.052, "800");
      ctx.fillStyle = "#F7B32B";
      RuelleVue.texteQuiTient(b.soustitre || "",
        L / 2, cy + H * 0.163, L * 0.90, H * 0.025, "600");
      ctx.textAlign = "left";
      ctx.globalAlpha = 1;
      return;
    }

    /* l'échange : une réplique après l'autre */
    const dt2 = an.t - carteFin;
    const rep = an.repliques || [];
    if (!rep.length) return;
    const par = ANNONCE_MOT / rep.length;
    const i = Math.min(rep.length - 1, Math.floor(dt2 / par));
    const dedans = dt2 - i * par;
    const opac = borne(Math.min(dedans / 0.12, (par - dedans) / 0.15), 0, 1);
    this.bulleHeros(rep[i][1], rep[i][0], opac);
  },

  /* Écrit centré en (x, y) sans jamais dépasser `large` : on part de la
     taille voulue et on descend tant que ça ne rentre pas. Quinze essais
     suffisent largement et bornent le coût. */
  texteQuiTient(txt, x, y, large, taille, gras){
    if (!txt) return;
    let t2 = taille;
    for (let k = 0; k < 15; k++){
      ctx.font = gras + " " + Math.round(t2) + "px 'Baloo 2', system-ui, sans-serif";
      if (ctx.measureText(txt).width <= large) break;
      t2 *= 0.92;
    }
    ctx.fillText(txt, x, y);
  },

  /* Une bulle au-dessus du héros qui parle. Bornée sur SA largeur : la
     même faute a déjà coupé une phrase deux fois sur ce projet. */
  bulleHeros(txt, qui, opac){
    const L = Camera.L, H = Camera.H;
    const h = Heros[qui] || Heros[0];
    ctx.save();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "800 " + Math.round(H * 0.028) + "px 'Baloo 2', system-ui, sans-serif";
    const bw = Math.min(ctx.measureText(txt).width + H * 0.040, L * 0.88);
    const bx = borne(L * (qui === 0 ? 0.32 : 0.68), bw / 2 + 6, L - bw / 2 - 6);
    const by = H * 0.725;
    ctx.globalAlpha = opac;
    ctx.fillStyle = "rgba(250,248,255,.96)";
    arrondi(bx - bw / 2, by - H * 0.032, bw, H * 0.064, H * 0.026); ctx.fill();
    ctx.fillStyle = h && h.couleur ? h.couleur : "#171226";
    ctx.font = "800 " + Math.round(H * 0.017) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.fillText(h && h.nom ? h.nom : "", bx, by - H * 0.019);
    ctx.fillStyle = "#171226";
    ctx.font = "800 " + Math.round(H * 0.028) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.fillText(txt, bx, by + H * 0.009);
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
  },

  dessiner(){
    const L = Camera.L, H = Camera.H;
    ctx.save();
    if (Ruelle.secousse > 0){
      const s = Ruelle.secousse * 9;
      ctx.translate((Math.random() * 2 - 1) * s, (Math.random() * 2 - 1) * s);
    }
    /* le décor couvre l'écran, ancré en bas : c'est la barricade qui
       doit rester en place, pas le ciel */
    const fond = Images.table.ruelle;
    if (fond && fond.naturalWidth){
      /* Le décor COUVRE l'écran, ancré en bas : la barricade doit rester
         en place, c'est le ciel qu'on peut perdre. Mais si l'écran est
         plus large que haut — un joueur qui n'a pas tourné son
         téléphone — couvrir cadrerait sur la barricade en gros plan. On
         se rabat alors sur un ajustement en hauteur, quitte à laisser du
         noir sur les côtés : mieux vaut une ruelle étroite qu'un mur de
         caisses. */
      const couvre = Math.max(L / fond.naturalWidth, H / fond.naturalHeight);
      const tient = Math.min(L / fond.naturalWidth, H / fond.naturalHeight);
      const e = (L > H) ? tient : couvre;
      const l = fond.naturalWidth * e, h = fond.naturalHeight * e;
      if (L > H){ ctx.fillStyle = "#0A0710"; ctx.fillRect(0, 0, L, H); }
      ctx.drawImage(fond, (L - l) / 2, H - h, l, h);
      this._fond = { l, h, x:(L - l) / 2, y:H - h };
    }
    /* les ennemis, du plus lointain au plus proche */
    const liste = Ruelle.ennemis.slice().sort((a, b) => a.z - b.z);
    for (const e of liste){
      /* REPLI SUR run1. Une pose absente rendait l'ennemi INVISIBLE
         alors qu'il continuait d'avancer et d'entamer la barricade : le
         pire des symptômes, parce qu'on cherche le bug dans la logique.
         Il vaut mieux une pose fausse qu'un ennemi fantôme. */
      const spr = Ruelle.imagePose(e);
      if (!spr || !spr.naturalWidth) continue;
      const b = Ruelle.boiteEnnemi(e);
      /* ANCRAGE PAR LES PIEDS. Toutes les poses n'ont pas le même
         canevas : une bouteille brandie fait dépasser Depardiahree de
         60 px au-dessus de sa hauteur debout. Dessiner l'image entière
         dans la boîte l'écraserait d'autant, et rehausser le canevas
         des treize autres poses décalerait les zones de corps — la
         tête ne serait plus dans la bande « tête ». On garde donc le
         canevas de `run1` comme référence, et le surplus de hauteur
         d'une pose pousse VERS LE HAUT, pieds fixes. */
      const ref = Images.table["enn_" + e.ref.sprite + "_run1"];
      const k = ref && ref.naturalHeight ? spr.naturalHeight / ref.naturalHeight : 1;
      const hp = b.h * k;
      const l = hp * spr.naturalWidth / spr.naturalHeight;
      ctx.globalAlpha = e.etat === "sol" ? borne(1 - (e.mort - 0.7) / 0.5, 0, 1) : 1;
      ctx.drawImage(spr, b.x + (b.l - l) / 2, b.y + b.h - hp, l, hp);
      ctx.globalAlpha = 1;
      /* Une barre de vie, mais SEULEMENT sur les ennemis entamés et
         assez proches pour être lus : au fond elles feraient un
         chapelet de traits illisibles, et sur un ennemi intact elles
         n'apprennent rien. C'est Depardiahree qu'il faut voir résister. */
      if (e.pv < e.pvMax && e.etat !== "chute" && e.etat !== "sol" && b.ordre > 0.10){
        const lv = Math.max(14, b.l * 0.44), hv = Math.max(2.5, b.h * 0.022);
        const xv = b.x + b.l / 2 - lv / 2, yv = b.y - hv * 2.4;
        const part = borne(e.pv / e.pvMax, 0, 1);
        ctx.fillStyle = "rgba(6,5,10,.68)";
        ctx.fillRect(xv - 1, yv - 1, lv + 2, hv + 2);
        ctx.fillStyle = part > 0.55 ? "#4CC46A" : part > 0.25 ? "#F7B32B" : "#E2453D";
        ctx.fillRect(xv, yv, lv * part, hv);
      }
      /* LA CIBLE DU BRAS ARMÉ, à taille d'écran fixe. Elle bat, comme
         l'alerte, mais plus vite : c'est une fenêtre, pas un
         avertissement. */
      if (Ruelle.cibleOuverte(e)){
        const im3 = Images.table.sig_cible_bras;
        const c = Ruelle.posCibleBras(e);
        if (im3 && im3.naturalWidth){
          const hc = c.r * 2 * (1 + 0.08 * Math.sin(e.tEtat * 16));
          const lc = hc * im3.naturalWidth / im3.naturalHeight;
          ctx.drawImage(im3, c.x - lc / 2, c.y - hc / 2, lc, hc);
        }
      }
      /* L'ALERTE, pendant toute la préparation du jet. Elle est à taille
         d'écran FIXE, pas à la taille de l'ennemi : au fond de la rue
         elle serait de six pixels, donc invisible, et c'est précisément
         de loin qu'il faut prévenir. Elle bat pour attirer l'œil sans
         clignoter — un clignotement disparaît une image sur deux. */
      if (e.etat === "ramasse" || e.etat === "arme" ||
          e.etat === "arret" || e.etat === "arme1" || e.etat === "arme2"){
        /* ambre pendant qu'il se prépare, rouge quand le jet est
           imminent : deux couleurs valent mieux qu'un compte à rebours */
        const imminent = e.etat === "arme" || e.etat === "arme2";
        const al = Images.table[imminent ? "sig_alerte" : "sig_alerte_or"];
        if (al && al.naturalWidth){
          const ha = H * ALERTE_TAILLE * (1 + 0.10 * Math.sin(e.tEtat * 11));
          const la = ha * al.naturalWidth / al.naturalHeight;
          ctx.drawImage(al, b.x + b.l / 2 - la / 2, b.y - ha * 1.25, la, ha);
        }
      }
    }

    /* LES BOUTEILLES EN VOL, avant que la barricade repasse devant :
       elles doivent disparaître derrière les caisses en arrivant, comme
       les ennemis. Passé PROJ_BASCULE l'objet se retourne — de profil
       jusque-là, puis de face, parce qu'un objet qui fond sur vous ne se
       voit plus de côté. */
    for (const pr of Ruelle.projectiles){
      const q = Ruelle.posProjectile(pr);
      const nom = "obj_" + pr.objet + (q.av > PROJ_BASCULE ? "_f" : "");
      const im = Images.table[nom];
      if (!im || !im.naturalWidth) continue;
      /* la taille porte sur la plus grande dimension : un objet long ne
         doit pas devenir large comme l'écran */
      const grand = Math.max(im.naturalWidth, im.naturalHeight);
      const lp = q.taille * im.naturalWidth / grand;
      const hp2 = q.taille * im.naturalHeight / grand;
      ctx.save();
      ctx.translate(q.x, q.y);
      /* elle tourne, mais seulement de profil : de face, une rotation
         se lit comme un tremblement */
      if (q.av <= PROJ_BASCULE) ctx.rotate(pr.t * PROJ_ROTATION);
      ctx.drawImage(im, -lp / 2, -hp2 / 2, lp, hp2);
      ctx.restore();
    }
    /* La barricade repasse DEVANT : les ennemis arrivés au contact
       doivent disparaître derrière les caisses, pas marcher dessus. */
    const f = this._fond;
    if (fond && f){
      /* On REDESSINE le décor entier, découpé au ciseau sous la ligne de
         barricade. Ma première version recopiait une tranche en
         calculant ses coordonnées source ET destination : deux
         arithmétiques à tenir d'accord, et une couture rectangulaire en
         plein milieu de l'écran dès que l'une dérivait. Un découpage ne
         peut pas se décaler : c'est la même image, au même endroit. */
      const yBarr = f.y + f.h * RUELLE_PREMIER_PLAN;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, yBarr, L, H - yBarr);
      ctx.clip();
      ctx.drawImage(fond, f.x, f.y, f.l, f.h);
      ctx.restore();
    }
    /* LES ÉCLATS, après que la barricade est repassée devant : la
       bouteille éclate SUR les caisses, pas derrière. Du bois quand on
       était couvert, du vin quand on a encaissé — l'image dit à elle
       seule si on s'en est sorti. */
    for (const im2 of Ruelle.impacts){
      const img = Images.table[im2.image];
      if (!img || !img.naturalWidth) continue;
      const av = im2.t / IMPACT_DUREE;
      const hi = H * melange(0.10, 0.20, av);
      const li = hi * img.naturalWidth / img.naturalHeight;
      const xi = L * (0.5 + RUELLE_COULOIRS[im2.couloir] * 0.55);
      const yi = H * RUELLE_PREMIER_PLAN;
      ctx.globalAlpha = borne(1 - (av - 0.45) / 0.55, 0, 1);
      ctx.drawImage(img, xi - li / 2, yi - hi * 0.62, li, hi);
      ctx.globalAlpha = 1;
    }

    /* L'ANNONCE se peint par-dessus le décor mais SOUS le pupitre : le
       joueur ne doit jamais perdre ses commandes de vue, même pendant
       qu'on lui présente ce qui arrive. */
    if (Ruelle.annonce) this.dessinerAnnonce();

    /* LES BLOCAGES : un anneau blanc qui s'ouvre là où la balle a tapé
       la garde. En blanc et en anneau, jamais en étoile rouge — il ne
       doit pas se confondre une seconde avec un coup qui porte. */
    for (const bl of Ruelle.blocages){
      const av = bl.t / BLOCAGE_DUREE;
      const ray = L * (0.012 + 0.030 * av);
      ctx.globalAlpha = borne(1 - av, 0, 1) * 0.9;
      ctx.strokeStyle = "#F1F5FF";
      ctx.lineWidth = Math.max(1.5, L * 0.008 * (1 - av * 0.6));
      ctx.beginPath(); ctx.arc(bl.x, bl.y, ray, 0, 6.2832); ctx.stroke();
      /* deux éclats obliques : l'anneau seul se lisait comme un viseur */
      ctx.beginPath();
      for (const [ax, ay] of [[0.7, -0.7], [-0.7, 0.7]]){
        ctx.moveTo(bl.x + ax * ray * 1.1, bl.y + ay * ray * 1.1);
        ctx.lineTo(bl.x + ax * ray * 1.8, bl.y + ay * ray * 1.8);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    /* La vie de la barricade, posée sur la barricade elle-même : les
       héros passent devant, les ennemis derrière. Elle suit la COURBE
       des caisses — un trait droit sur un décor en perspective a l'air
       collé par-dessus. */
    {
      const part = borne(Ruelle.barricade / RUELLE_BARRICADE_PV, 0, 1);
      const lj = L * 0.56, xj = L * 0.5;
      const yj = H * RUELLE_PREMIER_PLAN - H * 0.012;
      const ej = Math.max(4, H * 0.011);
      const fleche = H * 0.016;              /* de combien elle se creuse */
      const rayon = (lj * lj / 4 + fleche * fleche) / (2 * fleche);
      const cyArc = yj + rayon - fleche;
      const demi = Math.asin(Math.min(1, lj / 2 / rayon));
      const a0 = -Math.PI / 2 - demi, a1 = -Math.PI / 2 + demi;
      const arc = (de, a, ep, style) => {
        ctx.strokeStyle = style; ctx.lineWidth = ep; ctx.lineCap = "round";
        ctx.beginPath(); ctx.arc(xj, cyArc, rayon, de, a); ctx.stroke();
        ctx.lineCap = "butt";
      };
      arc(a0, a1, ej + 5, "rgba(6,5,12,.66)");
      const cj = part > 0.6 ? "#5FD97C" : part > 0.3 ? "#F7C64B" : "#F0685E";
      arc(a0, a0 + (a1 - a0) * part, ej, cj);
      arc(a0, a0 + (a1 - a0) * part, ej * 0.34, "rgba(255,255,255,.30)");
    }

    /* les deux héros, tout devant, de dos. PF est RETOURNÉ : les deux
       doivent viser vers le centre de la ruelle, sinon celui de droite
       tire vers le trottoir. */
    for (let i = 0; i < 2; i++){
      const h = Ruelle.heros[i];
      const spr = Images.table[h.sprite + "_" + Ruelle.poseHeros(i)];
      if (!spr || !spr.naturalWidth) continue;
      const haut = H * RUELLE_TAILLE_HEROS;
      const larg = haut * spr.naturalWidth / spr.naturalHeight;
      const x = i === 0 ? L * RUELLE_ECART_HEROS : L * (1 - RUELLE_ECART_HEROS);
      /* Pendant le rechargement il se met À COUVERT : il s'enfonce
         derrière la barricade, et il n'est plus dessiné devant elle. */
      const inactif = (i !== Ruelle.actifIdx && !Ruelle.iaActive) ? 1 : 0;
      const couvreTout = Ruelle.couvert ? 1 : 0;
      const abri = Math.max(couvreTout, inactif,
        h.recharge > 0 ? Math.sin(Math.min(1, 1 - h.recharge / ARMES[h.arme].recharge) * Math.PI) : 0);
      const yHaut = H * RUELLE_PIEDS_HEROS - haut + haut * RUELLE_ABRI * abri;
      ctx.save();
      ctx.globalAlpha = i === Ruelle.actifIdx ? 1 : 0.84;
      /* On pivote autour de l'épaule, pas du coin de l'image : sinon le
         personnage décolle du sol en s'inclinant. L'inclinaison SUIT le
         réticule pour le héros actif — c'est ce qui fait croire qu'il
         vise vraiment là où on pointe. */
      const ex = x, ey = yHaut + haut * 0.34;
      let ang = RUELLE_INCLINE_HEROS;
      if (i === Ruelle.actifIdx && h.recharge <= 0){
        const vx2 = Ruelle.viseur.x * L, vy2 = Ruelle.viseur.y * H;
        const dx2 = (i === 1 ? ex - vx2 : vx2 - ex);
        const brut = Math.atan2(ey - vy2, Math.max(1, Math.abs(dx2)));
        ang = borne(brut, VISEE_INCLINE_MIN, VISEE_INCLINE_MAX);
      }
      ctx.translate(ex, ey);
      if (i === 1) ctx.scale(-1, 1);
      ctx.rotate(-ang);
      ctx.drawImage(spr, -larg / 2, -haut * 0.34, larg, haut);
      /* La flamme de bouche est PEINTE, pas dessinée dans la planche :
         celle de PF partait à l'autre bout de l'écran une fois le
         personnage retourné, et une flamme peinte suit l'inclinaison
         sans qu'on ait à y penser. On est encore dans le repère du
         héros — inclinaison et miroir compris. */
      const flash = Ruelle.flashes.find(f => f.heros === i);
      if (flash){
        const vie = borne(flash.t / flash.duree, 0, 1);
        /* Position MESURÉE sur les sprites : le point le plus à droite
           de la moitié haute, c'est la bouche du canon. 0,894 de la
           largeur pour le revolver, 0,945 pour le fusil ; 0,153 et
           0,126 de la hauteur depuis le sommet de la toile.
           Le sprite est dessiné à partir de (-larg/2, -haut*0,34). */
        const fx4 = h.id === "thibaut" ? 0.894 : 0.945;
        const fy4 = h.id === "thibaut" ? 0.153 : 0.126;
        const mx = -larg / 2 + larg * fx4;
        const my = -haut * 0.34 + haut * fy4;
        const r0 = haut * (h.id === "thibaut" ? 0.075 : 0.105) * (0.55 + vie * 0.45);
        ctx.globalAlpha = vie;
        for (const [rr, col] of [[r0, "#F7B32B"], [r0 * 0.58, "#FFF3D0"]]){
          ctx.beginPath();
          for (let k = 0; k < 12; k++){
            const a3 = k * Math.PI / 6;
            const d3 = (k % 2 ? rr * 0.38 : rr) * (k === 0 ? 1.45 : 1);
            const px3 = mx + Math.cos(a3) * d3, py3 = my + Math.sin(a3) * d3;
            if (k) ctx.lineTo(px3, py3); else ctx.moveTo(px3, py3);
          }
          ctx.closePath(); ctx.fillStyle = col; ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    this.dessinerHud();
  },
};

/* ================= viser au pouce =================
   Toucher directement l'ennemi rendait le niveau trop simple : c'était
   un jeu de temps de réaction, sans adresse. Un VISEUR qu'on déplace au
   champignon et un bouton de tir séparé changent la nature du jeu — la
   difficulté devient le suivi d'une cible qui grossit et se décale.
   Le recul repousse le viseur vers le haut : c'est ce qui impose son
   rythme au revolver de Thibaut et distingue vraiment les deux armes. */
const VISEE_VITESSE = 0.62;         /* largeurs d'écran par seconde     */
const VISEE_RECUL = { revolver:0.085, fusil:0.042 };
const VISEE_RETOUR = 0.55;          /* le bras redescend tout seul      */
const MANCHE_R = 0.150, MANCHE_X = 0.195, MANCHE_Y = 0.855;
const TIR_R = 0.112, TIR_X = 0.805, TIR_Y = 0.855;
/* Les huit boutons sont normalisés : disque de 304 px centré dans un
   canevas de 320, donc un rayon visible de 0,95 fois ce que `poser()`
   reçoit. L'anneau suit la même règle et son bord INTÉRIEUR tombe à
   0,6925. Pour qu'il encercle le bouton au lieu de se poser dessus, il
   faut donc 0,95 / 0,6925 — sinon il vient couvrir la douille, ce qui
   était le cas à 1,06. */
const ANNEAU_AUTOUR = 1.38;
const COMPTE_SOUS = 1.52;   /* le compte passe SOUS l'anneau (1,31) */
/* Les commandes se posent sur le bas du décor — la barricade, et les
   deux héros accroupis derrière. Opaques, elles en cachaient une bonne
   part. Elles sont donc TRANSPARENTES AU REPOS et reviennent pleines
   quand on s'en sert : l'opacité devient un retour tactile au lieu
   d'être un réglage. Le bouton éteint descend plus bas encore, il n'a
   rien à dire tant que le chargeur se remplit. */
const CMD_REPOS = 0.45, CMD_ACTIVE = 1, CMD_ETEINT = 0.5, CMD_ANNEAU = 0.95;
const ABRI_R = 0.092, ABRI_X = 0.50, ABRI_Y = 0.735;

Object.assign(Ruelle, {
  viseur:{ x:0.5, y:0.45 }, manche:{ actif:false, id:null, dx:0, dy:0 },

  razViseur(){ this.viseur = { x:0.5, y:0.45 }; this.manche = { actif:false, id:null, dx:0, dy:0 }; },

  /* Les trois zones du pouce, en fractions : elles suivent l'écran. */
  zoneManche(){ return { x:Camera.L * MANCHE_X, y:Camera.H * MANCHE_Y, r:Camera.L * MANCHE_R }; },
  zoneTir(){ return { x:Camera.L * TIR_X, y:Camera.H * TIR_Y, r:Camera.L * TIR_R }; },
  zoneBascule(){ return { x:Camera.L * 0.5, y:Camera.H * 0.885, r:Camera.L * 0.082 }; },
  /* Se replier volontairement : les deux s'accroupissent, plus personne
     ne tire. Ça servira quand les ennemis lanceront des choses. */
  zoneAbri(){ return { x:Camera.L * ABRI_X, y:Camera.H * ABRI_Y, r:Camera.L * ABRI_R }; },
  dans(z, x, y){ const dx = x - z.x, dy = y - z.y; return dx * dx + dy * dy <= z.r * z.r; },

  toucheDebut(id, x, y){
    if (!this.actif) return false;
    if (this.introT > 0) return this.passerIntro();
    if (this.dans(this.zoneManche(), x, y)){
      this.manche = { actif:true, id, dx:0, dy:0 };
      this.majManche(x, y);
      return true;
    }
    if (this.dans(this.zoneAbri(), x, y)){
      if (this.couvert) this.quitterAbri();
      else { this.couvert = true; Sons.clic(); }
      return true;
    }
    /* À COUVERT, TIRER RELÈVE TOUT SEUL. Il fallait avant rappuyer sur
       le bouclier avant de pouvoir tirer : deux gestes là où l'intention
       est évidente, et le temps de les enchaîner suffisait à encaisser le
       jet suivant. Le bouton ne sert plus qu'à SE METTRE à couvert ; on
       en sort en tirant, ou en rappuyant dessus. */
    if (this.dans(this.zoneTir(), x, y)){
      if (this.couvert) this.quitterAbri();
      this.tirerViseur();
      return true;
    }
    if (this.dans(this.zoneBascule(), x, y)){
      /* changer de héros relève aussi : accroupi, l'autre ne pourrait
         rien faire de plus, et rester à couvert serait un piège */
      if (this.couvert) this.quitterAbri();
      this.changerHeros();
      return true;
    }
    return false;
  },
  /* Sortir de l'abri est un geste à part : il se déclenche depuis trois
     endroits — le bouclier, le tir, le changement de héros — et le son
     doit être le même partout. */
  quitterAbri(){
    if (!this.couvert) return false;
    this.couvert = false;
    Sons.souffle(0.10, 0.07, 620, 1.5);
    return true;
  },

  toucheBouge(id, x, y){
    if (this.manche.actif && this.manche.id === id) this.majManche(x, y);
  },
  toucheFin(id){
    if (this.manche.actif && this.manche.id === id) this.manche = { actif:false, id:null, dx:0, dy:0 };
  },
  majManche(x, y){
    const z = this.zoneManche();
    let dx = (x - z.x) / z.r, dy = (y - z.y) / z.r;
    const d = Math.hypot(dx, dy);
    if (d > 1){ dx /= d; dy /= d; }
    this.manche.dx = dx; this.manche.dy = dy;
  },

  /* Le viseur bouge, le recul le repousse, le bras le ramène. */
  pasViseur(dt){
    const m = this.manche;
    if (m.actif){
      this.viseur.x += m.dx * VISEE_VITESSE * dt;
      this.viseur.y += m.dy * VISEE_VITESSE * dt * (Camera.L / Math.max(1, Camera.H)) * 1.9;
    }
    if (this.recul > 0){
      const pris = Math.min(this.recul, VISEE_RETOUR * dt);
      this.viseur.y += pris; this.recul -= pris;
    }
    this.viseur.x = borne(this.viseur.x, 0.04, 0.96);
    this.viseur.y = borne(this.viseur.y, 0.06, 0.78);
  },

  tirerViseur(){
    const av = this.viseur.y;
    const ok = this.tirer(this.viseur.x * Camera.L, this.viseur.y * Camera.H);
    void av; void ok;
    const arme = this.heroActif().arme;
    /* Le recul ne s'applique que si le coup est parti. */
    if (this.heroActif().repos > 0){
      const r = VISEE_RECUL[arme] || 0.06;
      this.viseur.y = borne(this.viseur.y - r, 0.06, 0.78);
      this.recul = (this.recul || 0) + r;
    }
    return ok;
  },
});

/* ================= le HUD et les commandes ================= */
Object.assign(RuelleVue, {
  dessinerHud(){
    const L = Camera.L, H = Camera.H;
    const p = Math.round(L * 0.036);
    ctx.textBaseline = "middle";

    /* --- le haut ---
       Le bandeau pleine largeur passait SOUS les boutons de plein écran
       et de pause, qui vivent en HTML au-dessus du canevas : les
       chiffres se mêlaient aux ronds. On garde donc le tiers droit
       libre, et on descend la jauge de barricade sur sa propre ligne. */
    const hb = Math.round(H * 0.048);
    const largeHaut = L * 0.66;
    ctx.fillStyle = "rgba(8,7,14,.66)";
    arrondi(p * 0.5, p * 0.5, largeHaut, hb, hb * 0.5); ctx.fill();
    /* le score, avec son étoile */
    const cy = p * 0.5 + hb * 0.5;
    ctx.fillStyle = "#F7B32B";
    ctx.beginPath();
    for (let k = 0; k < 10; k++){
      const a2 = -Math.PI / 2 + k * Math.PI / 5;
      const rr = k % 2 ? hb * 0.16 : hb * 0.32;
      const px2 = p * 0.5 + hb * 0.62 + Math.cos(a2) * rr;
      const py2 = cy + Math.sin(a2) * rr;
      if (k) ctx.lineTo(px2, py2); else ctx.moveTo(px2, py2);
    }
    ctx.closePath(); ctx.fill();
    ctx.font = "800 " + Math.round(hb * 0.44) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(chiffres(Score.points), p * 0.5 + hb * 1.05, cy);
    /* la vague, et sa progression en pastilles : on sait combien il en
       reste à sortir sans lire un chiffre */
    ctx.textAlign = "right"; ctx.fillStyle = "#EDE7FA";
    ctx.fillText("VAGUE " + (Ruelle.vague + 1), largeHaut - hb * 0.4, cy);
    const vg = Ruelle.VAGUES[Math.min(Ruelle.vague, Ruelle.VAGUES.length - 1)];
    const restants = Ruelle.aSortir + Ruelle.ennemis.filter(e => e.etat === "course" || e.etat === "touche").length;
    const nb = Math.min(10, vg.nombre);
    const rp = Math.max(2.5, hb * 0.10), esp = rp * 3.4;
    let xp = p * 0.5 + hb * 1.05;
    const yp = p * 0.5 + hb * 1.35;
    for (let k = 0; k < nb; k++){
      const vivant = k < Math.ceil(restants * nb / Math.max(1, vg.nombre));
      ctx.beginPath(); ctx.arc(xp, yp, rp, 0, 6.2832);
      ctx.fillStyle = vivant ? "rgba(247,179,43,.92)" : "rgba(255,255,255,.22)";
      ctx.fill(); xp += esp;
    }
    /* ---------- les commandes ----------
       Ce sont des IMAGES, pas des dessins : le canevas ne sait pas
       faire une lueur sans shadowBlur, qui est interdit ici. Une image
       la porte déjà. On ne fait plus que les poser et animer ce qui
       bouge — la pastille du pouce et l'anneau de rechargement. */
    const poser = (nom, cx, cy, r, alpha) => {
      const img = Images.table[nom];
      if (!img || !img.naturalWidth) return;
      const l2 = r * 2 * (img.naturalWidth / img.naturalHeight);
      if (alpha != null) ctx.globalAlpha = alpha;
      ctx.drawImage(img, cx - l2 / 2, cy - r, l2, r * 2);
      ctx.globalAlpha = 1;
    };

    /* le viseur */
    const vx = Ruelle.viseur.x * L, vy = Ruelle.viseur.y * H;
    const rv = L * 0.052;
    const cible = Ruelle.viser(vx, vy, ARMES[Ruelle.heroActif().arme].tolerance);
    /* Le viseur ANNONCE l'atténuation : ambre sur une cible trop
       lointaine, rouge dès qu'elle est à plein tarif. Une règle
       d'équilibrage que le joueur ne peut pas lire est une punition
       arbitraire — il faut qu'il voie pourquoi ses balles ne portent
       pas, sans qu'on le lui écrive. */
    const plein = cible && attenuation(cible.ennemi.z) > 0.985;
    ctx.strokeStyle = !cible ? "rgba(255,255,255,.82)"
                    : plein ? "#E2453D" : "#F7B32B";
    ctx.lineWidth = Math.max(1.5, L * 0.006);
    ctx.beginPath(); ctx.arc(vx, vy, rv, 0, 6.2832); ctx.stroke();
    ctx.beginPath();
    for (const [ax, ay] of [[1,0],[-1,0],[0,1],[0,-1]]){
      ctx.moveTo(vx + ax * rv * 0.45, vy + ay * rv * 0.45);
      ctx.lineTo(vx + ax * rv * 1.35, vy + ay * rv * 1.35);
    }
    ctx.stroke();

    /* la croix, et la pastille qui suit le pouce */
    const zm = Ruelle.zoneManche();
    const aCroix = Ruelle.manche.actif ? CMD_ACTIVE : CMD_REPOS;
    poser("btn_croix", zm.x, zm.y, zm.r, aCroix);
    poser("btn_pouce",
      zm.x + Ruelle.manche.dx * zm.r * 0.40,
      zm.y + Ruelle.manche.dy * zm.r * 0.40, zm.r * 0.30, aCroix);

    /* le bouton de tir : trois états, plus l'anneau qui se remplit */
    const zt = Ruelle.zoneTir(), h = Ruelle.heroActif(), arme = ARMES[h.arme];
    const recharge = h.recharge > 0;
    const enfonce = h.repos > 1 / arme.cadence * 0.55;
    poser(recharge ? "btn_tir_vide" : enfonce ? "btn_tir_appui" : "btn_tir",
      zt.x, zt.y, zt.r * (enfonce ? 0.94 : 1),
      recharge ? CMD_ETEINT : enfonce ? CMD_ACTIVE : CMD_REPOS);
    if (recharge){
      /* l'anneau tourne : on voit le temps qui reste sans le compter */
      const av = 1 - h.recharge / arme.recharge;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(zt.x, zt.y);
      ctx.arc(zt.x, zt.y, zt.r * 1.6, -Math.PI / 2, -Math.PI / 2 + av * 6.2832);
      ctx.closePath(); ctx.clip();
      poser("btn_anneau", zt.x, zt.y, zt.r * ANNEAU_AUTOUR, CMD_ANNEAU);
      ctx.restore();
    }
    /* le compte, sous le bouton */
    ctx.save();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "800 " + Math.round(zt.r * 0.30) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.fillStyle = "rgba(247,193,58,.94)";
    ctx.fillText(h.balles + "/" + arme.chargeur, zt.x, zt.y + zt.r * COMPTE_SOUS);
    ctx.restore();

    /* à couvert et changer */
    const za = Ruelle.zoneAbri();
    poser("btn_couvert", za.x, za.y, za.r, Ruelle.couvert ? CMD_ACTIVE : CMD_REPOS);
    if (Ruelle.couvert){
      ctx.strokeStyle = "#4CC46A"; ctx.lineWidth = Math.max(2, za.r * 0.10);
      ctx.beginPath(); ctx.arc(za.x, za.y, za.r * 0.94, 0, 6.2832); ctx.stroke();
    }
    const zb = Ruelle.zoneBascule();
    poser("btn_changer", zb.x, zb.y, zb.r, CMD_REPOS);
    /* le cercle de couleur suit le bouton : sinon il flotte, plus net
       que ce qu'il entoure */
    ctx.globalAlpha = CMD_REPOS;
    ctx.strokeStyle = Heros[Ruelle.actifIdx] ? Heros[Ruelle.actifIdx].couleur : "#FFF";
    ctx.lineWidth = Math.max(2, L * 0.008);
    ctx.beginPath(); ctx.arc(zb.x, zb.y, zb.r * 0.96, 0, 6.2832); ctx.stroke();
    ctx.globalAlpha = 1;

    /* La réplique du relais, juste au-dessus de celui qui reprend. */
    if (Ruelle.replique){
      const r2 = Ruelle.replique;
      const al = borne(r2.t / 0.4, 0, 1);
      const by = H * 0.600;
      /* L'alignement était laissé à ce que le dessin précédent avait
         posé : la pastille se calait au centre et le texte partait à
         gauche. On le fixe ICI, juste avant d'écrire. */
      ctx.save();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      /* La réplique se RÉTRÉCIT pour tenir : « Je prends la suite,
         Callaghan. » sortait de l'écran par la droite. On cherche la
         taille qui rentre, puis on ramène la pastille dans l'écran. */
      let taille = L * 0.036, w2 = 0;
      for (let k = 0; k < 8; k++){
        ctx.font = "800 " + Math.round(taille) + "px 'Baloo 2', system-ui, sans-serif";
        w2 = ctx.measureText(r2.txt).width;
        if (w2 + 24 <= L * 0.80) break;
        taille *= 0.92;
      }
      const bw2 = w2 + 24;
      const bx = borne(r2.qui === 0 ? L * 0.30 : L * 0.70,
                       bw2 / 2 + 6, L - bw2 / 2 - 6);
      ctx.globalAlpha = al;
      ctx.fillStyle = "rgba(250,248,255,.95)";
      arrondi(bx - bw2 / 2, by - taille * 1.05, bw2, taille * 2.10, taille * 0.95); ctx.fill();
      ctx.fillStyle = "#171226";
      ctx.fillText(r2.txt, bx, by);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = "left";
  },
});

/* ================= l'annonce du niveau =================
   Une image avant la première vague. Elle sert deux buts d'un coup :
   annoncer le ton, et laisser au navigateur le temps de finir de
   charger le décor et les ennemis. Un niveau qui démarre sur un décor
   à moitié arrivé donne l'impression d'un jeu cassé. */
const RUELLE_INTRO_DUREE = 2.6;

Object.assign(Ruelle, {
  introT:0,
  introEnCours(){ return this.introT > 0; },
  passerIntro(){ if (this.introT > 0.25){ this.introT = 0.25; return true; } return false; },
});

RuelleVue.dessinerIntro = function(){
  const L = Camera.L, H = Camera.H, t = Ruelle.introT;
  /* elle s'efface sur son dernier quart de seconde */
  const al = borne(t / 0.25, 0, 1);
  const fond = Images.table.ruelle_flou;
  ctx.save();
  ctx.globalAlpha = al;
  if (fond && fond.naturalWidth){
    const e = Math.max(L / fond.naturalWidth, H / fond.naturalHeight);
    const l = fond.naturalWidth * e, h = fond.naturalHeight * e;
    ctx.drawImage(fond, (L - l) / 2, H - h, l, h);
  }
  ctx.fillStyle = "rgba(8,6,14,.55)";
  ctx.fillRect(0, 0, L, H);
  const duo = Images.table.duo_ruelle;
  if (duo && duo.naturalWidth){
    /* une arrivée par le bas, très courte : le duo se pose */
    const av = borne((RUELLE_INTRO_DUREE - t) / 0.5, 0, 1);
    /* Sous le titre, jamais dessus : le duo montait par-dessus le nom
       du niveau et les deux devenaient illisibles. */
    const hh = H * 0.52, ll = hh * duo.naturalWidth / duo.naturalHeight;
    ctx.globalAlpha = al * av;
    ctx.drawImage(duo, L / 2 - ll / 2, H * 0.80 - hh + (1 - av) * H * 0.05, ll, hh);
    ctx.globalAlpha = al;
  }
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#F7B32B";
  ctx.font = "800 " + Math.round(L * 0.105) + "px 'Baloo 2', system-ui, sans-serif";
  ctx.fillText("LA RUELLE", L / 2, H * 0.145);
  ctx.fillStyle = "rgba(237,231,250,.90)";
  ctx.font = "700 " + Math.round(L * 0.042) + "px 'Baloo 2', system-ui, sans-serif";
  ctx.fillText("Ils veulent la dernière part.", L / 2, H * 0.205);
  ctx.fillStyle = "rgba(237,231,250,.55)";
  ctx.font = "700 " + Math.round(L * 0.034) + "px 'Baloo 2', system-ui, sans-serif";
  ctx.fillText("Touchez pour commencer", L / 2, H * 0.845);
  ctx.textAlign = "left";
  ctx.restore();
};
