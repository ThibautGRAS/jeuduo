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
   demande plus de balles. Le costaud casse la règle exprès (115) :
   c'est le seul qui vaut plus que ce qu'il coûte, donc le seul qui
   oblige à choisir. */
const ENNEMIS = {
  costaud: { nom:"LE COSTAUD", pv:160, vitesse:0.072, taille:1.12, sprite:"costaud" },
};
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
  barricade:RUELLE_BARRICADE_PV,
  actifIdx:0,                       /* 0 = Thibaut, 1 = PF */
  heros:[],
  secousse:0, hitStop:0, flashes:[],

  /* Les vagues montent en NOMBRE et en fréquence, pas en points de vie :
     le joueur doit sentir la pression, pas tirer quinze fois sur le
     même homme. */
  VAGUES:[
    { nombre:5,  delai:1.9, vitesse:1.00 },
    { nombre:8,  delai:1.5, vitesse:1.05 },
    { nombre:12, delai:1.2, vitesse:1.12 },
    { nombre:15, delai:0.95, vitesse:1.22 },
    { nombre:20, delai:0.75, vitesse:1.35 },
  ],

  demarrer(){
    this.actif = true; this.fini = null;
    this.ennemis.length = 0; this.flashes.length = 0;
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
  },

  ajouterEnnemi(){
    const v = this.VAGUES[Math.min(this.vague, this.VAGUES.length - 1)];
    const noms = Object.keys(ENNEMIS);
    const ref = ENNEMIS[noms[Math.floor(Math.random() * noms.length)]];
    const jitter = 1 + (Math.random() * 2 - 1) * RUELLE_JITTER;
    this.ennemis.push({
      ref, pv:ref.pv, pvMax:ref.pv,
      couloir:Math.floor(Math.random() * RUELLE_COULOIRS.length),
      z:0, vitesse:ref.vitesse * v.vitesse * jitter,
      etat:"course", frame:0, tFrame:0, tEtat:0, mort:0,
      touche:null,
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
    if (lui.balles <= 0){ lui.recharge = ARMES[lui.arme].recharge; return; }
    lui.balles--; lui.repos = 0.22;
    this.flashes.push({ t:0.13, duree:0.13, heros:1 - this.actifIdx });
    Sons.bip(lui.arme === "revolver" ? 120 : 90, 0.09, "square", 0.16, 60);
    /* Elle vise le plus avancé, et rate souvent : c'est un soutien, pas
       une seconde paire de mains parfaite. */
    const proies = this.ennemis.filter(e => e.etat === "course" || e.etat === "touche");
    if (!proies.length) return;
    let but = proies[0];
    for (const e of proies) if (e.z > but.z) but = e;
    const b = this.boiteEnnemi(but);
    if (Math.random() > IA_REUSSITE) return;   /* raté : le coup part dans le décor */
    const arme = ARMES[lui.arme];
    const f = 0.20 + Math.random() * 0.60;     /* elle ne visait pas la tête */
    void IA_ECART;
    const zone = (ZONES_CORPS.find(z => f >= z.haut && f < z.bas) || ZONES_CORPS[1]).id;
    const degat = zone === "tete" ? arme.tete : zone === "torse" ? arme.torse : arme.jambes;
    but.pv -= degat; but.touche = zone;
    Score.points += 10;
    if (but.pv <= 0){ but.etat = "chute"; but.tEtat = 0; but.mort = 0; Score.points += 100; }
    else { but.etat = "touche"; but.tEtat = 0; }
    void b;
  },
  armeActive(){ return ARMES[this.heroActif().arme]; },
  changerHeros(){ this.actifIdx = 1 - this.actifIdx; Sons.clic(); },

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
    if (this.aSortir > 0){
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
        /* Un lointain avance de peu de pixels : à cadence fixe il
           saccade. On lie la cadence d'animation à la vitesse APPARENTE,
           donc à la profondeur — loin il trottine, près il martèle. */
        e.tFrame += dt;
        const cad = melange(0.165, 0.075, courbeZ(e.z));
        if (e.tFrame > cad){ e.tFrame -= cad; e.frame = (e.frame + 1) % 6; }
        if (e.z >= 1){
          e.z = 1;
          this.barricade = Math.max(0, this.barricade - RUELLE_DEGAT_BARRICADE);
          this.secousse = 0.8;
          this.ennemis.splice(i, 1);
          if (this.barricade <= 0) this.terminer(false);
          continue;
        }
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
    for (let i = this.flashes.length - 1; i >= 0; i--){
      this.flashes[i].t -= dt;
      if (this.flashes[i].t <= 0) this.flashes.splice(i, 1);
    }
    /* la flamme dure un peu plus qu'une image : sinon on ne la voit
       jamais sur un écran à soixante images par seconde */
    /* vague suivante quand tout est nettoyé */
    if (this.aSortir <= 0 && !this.ennemis.some(e => e.etat === "course" || e.etat === "touche")){
      if (this.vague + 1 < this.VAGUES.length) this.lancerVague(this.vague + 1);
      else if (!this.fini) this.terminer(true);
    }
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
  const h = p.hauteur * e.ref.taille;
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
  if (h.balles <= 0){ h.recharge = arme.recharge; return false; }
  h.balles--; h.repos = 1 / arme.cadence;
  if (h.balles <= 0) h.recharge = arme.recharge;
  this.secousse = Math.max(this.secousse, arme.secousse * 0.35);
  this.flashes.push({ t:0.13, duree:0.13, heros:this.actifIdx });
  Sons.bip(h.arme === "revolver" ? 120 : 90, 0.10, "square", 0.22, 60);
  const cible = this.viser(fx, fy, arme.tolerance);
  if (!cible) return false;
  const e = cible.ennemi;
  const degat = cible.zone === "tete" ? arme.tete
              : cible.zone === "torse" ? arme.torse : arme.jambes;
  e.pv -= degat;
  e.touche = cible.zone;
  Score.points += cible.zone === "tete" ? 40 : 10;
  if (e.pv <= 0){
    e.etat = "chute"; e.tEtat = 0; e.mort = 0;
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
  if (e.etat === "sol") return "sol";
  if (e.etat === "chute") return e.tEtat < 0.21 ? "chute1" : "chute2";
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
      const spr = Images.table["enn_" + e.ref.sprite + "_" + Ruelle.poseEnnemi(e)];
      if (!spr || !spr.naturalWidth) continue;
      const b = Ruelle.boiteEnnemi(e);
      const l = b.h * spr.naturalWidth / spr.naturalHeight;
      ctx.globalAlpha = e.etat === "sol" ? borne(1 - (e.mort - 0.7) / 0.5, 0, 1) : 1;
      ctx.drawImage(spr, b.x + (b.l - l) / 2, b.y, l, b.h);
      ctx.globalAlpha = 1;
      /* Une barre de vie, mais SEULEMENT sur les ennemis entamés et
         assez proches pour être lus : au fond elles feraient un
         chapelet de traits illisibles, et sur un ennemi intact elles
         n'apprennent rien. C'est le costaud qu'il faut voir résister. */
      if (e.pv < e.pvMax && e.etat !== "chute" && e.etat !== "sol" && b.ordre > 0.10){
        const lv = Math.max(14, b.l * 0.44), hv = Math.max(2.5, b.h * 0.022);
        const xv = b.x + b.l / 2 - lv / 2, yv = b.y - hv * 2.4;
        const part = borne(e.pv / e.pvMax, 0, 1);
        ctx.fillStyle = "rgba(6,5,10,.68)";
        ctx.fillRect(xv - 1, yv - 1, lv + 2, hv + 2);
        ctx.fillStyle = part > 0.55 ? "#4CC46A" : part > 0.25 ? "#F7B32B" : "#E2453D";
        ctx.fillRect(xv, yv, lv * part, hv);
      }
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
      const couvreTout = Ruelle.couvert ? 1 : 0;
      const abri = Math.max(couvreTout,
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
const ABRI_R = 0.072, ABRI_X = 0.50, ABRI_Y = 0.745;

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
      this.couvert = !this.couvert; Sons.clic(); return true;
    }
    if (this.couvert) return true;              /* à couvert, on ne tire pas */
    if (this.dans(this.zoneTir(), x, y)){ this.tirerViseur(); return true; }
    if (this.dans(this.zoneBascule(), x, y)){ this.changerHeros(); return true; }
    return false;
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
    /* la barricade, sur sa propre ligne, loin des boutons */
    const lj = L * 0.30, xj = p * 0.5, yj = p * 0.5 + hb * 1.90;
    const part = Ruelle.barricade / RUELLE_BARRICADE_PV;
    ctx.fillStyle = "rgba(8,7,14,.55)";
    arrondi(xj - 2, yj - hb * 0.15, lj + 4, hb * 0.30, hb * 0.15); ctx.fill();
    ctx.fillStyle = part > 0.6 ? "#4CC46A" : part > 0.3 ? "#F7B32B" : "#E2453D";
    arrondi(xj, yj - hb * 0.11, Math.max(2, (lj - 2) * part), hb * 0.22, hb * 0.11); ctx.fill();

    /* --- le viseur --- */
    const vx = Ruelle.viseur.x * L, vy = Ruelle.viseur.y * H;
    const r = L * 0.052;
    const cible = Ruelle.viser(vx, vy, ARMES[Ruelle.heroActif().arme].tolerance);
    ctx.strokeStyle = cible ? "#E2453D" : "rgba(255,255,255,.82)";
    ctx.lineWidth = Math.max(1.5, L * 0.006);
    ctx.beginPath(); ctx.arc(vx, vy, r, 0, 6.2832); ctx.stroke();
    ctx.beginPath();
    for (const [ax, ay] of [[1,0],[-1,0],[0,1],[0,-1]]){
      ctx.moveTo(vx + ax * r * 0.45, vy + ay * r * 0.45);
      ctx.lineTo(vx + ax * r * 1.35, vy + ay * r * 1.35);
    }
    ctx.stroke();

    /* --- le champignon --- */
    /* Le relief se fait par COUCHES, jamais par shadowBlur : un anneau
       sombre en dessous, un dégradé au-dessus, un liseré clair en haut.
       C'est ce qui fait qu'un bouton a l'air appuyable. */
    const pastille = (cx, cy, r, haut, bas, liseré) => {
      ctx.fillStyle = "rgba(0,0,0,.42)";
      ctx.beginPath(); ctx.arc(cx, cy + r * 0.06, r, 0, 6.2832); ctx.fill();
      const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
      g.addColorStop(0, haut); g.addColorStop(1, bas);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = liseré; ctx.lineWidth = Math.max(1.5, r * 0.055);
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.985, -2.5, 0.4); ctx.stroke();
    };
    const zm = Ruelle.zoneManche();
    pastille(zm.x, zm.y, zm.r, "rgba(38,33,50,.70)", "rgba(10,9,16,.70)", "rgba(247,179,43,.30)");
    ctx.strokeStyle = "rgba(247,179,43,.45)"; ctx.lineWidth = Math.max(1.5, zm.r * 0.045);
    ctx.beginPath(); ctx.arc(zm.x, zm.y, zm.r * 0.97, 0, 6.2832); ctx.stroke();
    /* Quatre flèches : on lit tout de suite que ça pousse dans les
       quatre sens, là où une pastille nue n'annonce rien. */
    for (const [ax, ay] of [[0,-1],[0,1],[-1,0],[1,0]]){
      const d = zm.r * 0.76, t2 = zm.r * 0.13;
      const px2 = zm.x + ax * d, py2 = zm.y + ay * d;
      const vif = (Ruelle.manche.dx * ax + Ruelle.manche.dy * ay) > 0.45;
      ctx.fillStyle = vif ? "#F7B32B" : "rgba(255,255,255,.42)";
      ctx.beginPath();
      ctx.moveTo(px2 + ax * t2, py2 + ay * t2);
      ctx.lineTo(px2 - ax * t2 + ay * t2, py2 - ay * t2 + ax * t2);
      ctx.lineTo(px2 - ax * t2 - ay * t2, py2 - ay * t2 - ax * t2);
      ctx.closePath(); ctx.fill();
    }
    const tx = zm.x + Ruelle.manche.dx * zm.r * 0.42;
    const ty = zm.y + Ruelle.manche.dy * zm.r * 0.42;
    pastille(tx, ty, zm.r * 0.34, "rgba(255,255,255,.95)", "rgba(168,168,188,.95)", "rgba(255,255,255,.9)");

    /* --- le bouton de tir, avec les munitions autour --- */
    const zt = Ruelle.zoneTir(), h = Ruelle.heroActif(), arme = ARMES[h.arme];
    const recharge = h.recharge > 0;
    if (recharge) pastille(zt.x, zt.y, zt.r, "rgba(96,84,52,.86)", "rgba(52,44,26,.86)", "rgba(255,255,255,.20)");
    else pastille(zt.x, zt.y, zt.r, "#F2635A", "#B32A22", "rgba(255,255,255,.42)");
    /* Pendant le rechargement, l'anneau se remplit : on sait quand on
       pourra tirer sans compter les secondes. */
    if (recharge){
      const av = 1 - h.recharge / arme.recharge;
      ctx.strokeStyle = "#F7B32B"; ctx.lineWidth = Math.max(2.5, zt.r * 0.10);
      ctx.beginPath();
      ctx.arc(zt.x, zt.y, zt.r * 0.86, -Math.PI / 2, -Math.PI / 2 + av * 6.2832);
      ctx.stroke();
    }
    /* Le chargeur est une COURONNE DE SEGMENTS autour du bouton : on
       lit d'un coup d'œil combien il reste, sans compter des points. */
    const rInt = zt.r * 1.06, rExt = zt.r * 1.34;
    for (let k = 0; k < arme.chargeur; k++){
      const pas2 = 6.2832 / arme.chargeur, marge = pas2 * 0.14;
      const a0 = -Math.PI / 2 + k * pas2 + marge, a1 = a0 + pas2 - marge * 2;
      ctx.beginPath();
      ctx.arc(zt.x, zt.y, rExt, a0, a1);
      ctx.arc(zt.x, zt.y, rInt, a1, a0, true);
      ctx.closePath();
      ctx.fillStyle = k < h.balles ? "#F7B32B" : "rgba(210,210,225,.26)";
      ctx.fill();
    }
    /* Une balle dessinée plutôt que le mot TIR : le geste se comprend
       sans lire. */
    ctx.save();
    ctx.translate(zt.x, zt.y); ctx.rotate(-0.62);
    const bl = zt.r * 0.86, bw = zt.r * 0.30;
    ctx.fillStyle = recharge ? "rgba(200,190,170,.45)" : "#F0C060";
    ctx.beginPath();
    ctx.moveTo(-bw / 2, bl * 0.42); ctx.lineTo(bw / 2, bl * 0.42);
    ctx.lineTo(bw / 2, -bl * 0.10);
    ctx.quadraticCurveTo(bw / 2, -bl * 0.46, 0, -bl * 0.50);
    ctx.quadraticCurveTo(-bw / 2, -bl * 0.46, -bw / 2, -bl * 0.10);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = recharge ? "rgba(170,160,140,.45)" : "#C89A38";
    ctx.fillRect(-bw / 2, bl * 0.10, bw, bl * 0.32);
    ctx.restore();

    /* --- la bascule de héros, au centre --- */
    const zb = Ruelle.zoneBascule();
    pastille(zb.x, zb.y, zb.r, "rgba(40,36,58,.88)", "rgba(14,12,22,.88)", "rgba(255,255,255,.18)");
    ctx.strokeStyle = Heros[Ruelle.actifIdx] ? Heros[Ruelle.actifIdx].couleur : "#FFF";
    ctx.lineWidth = Math.max(2.5, L * 0.010);
    ctx.beginPath(); ctx.arc(zb.x, zb.y, zb.r * 0.94, 0, 6.2832); ctx.stroke();
    /* Deux flèches qui tournent : le symbole du relais, plus lisible
       qu'un prénom abrégé. */
    ctx.strokeStyle = "#FFF"; ctx.lineWidth = Math.max(2, zb.r * 0.11);
    ctx.lineCap = "round";
    for (const sens of [1, -1]){
      const rr = zb.r * 0.44, dec = sens * zb.r * 0.13;
      ctx.beginPath();
      ctx.arc(zb.x, zb.y + dec * 0.2, rr, sens > 0 ? 3.35 : 0.20, sens > 0 ? 5.9 : 2.8);
      ctx.stroke();
      const a2 = sens > 0 ? 5.9 : 2.8;
      const px2 = zb.x + Math.cos(a2) * rr, py2 = zb.y + dec * 0.2 + Math.sin(a2) * rr;
      const t2 = zb.r * 0.17;
      ctx.beginPath();
      ctx.moveTo(px2 + sens * t2, py2);
      ctx.lineTo(px2 - sens * t2 * 0.3, py2 - t2 * 0.9);
      ctx.lineTo(px2 - sens * t2 * 0.3, py2 + t2 * 0.9);
      ctx.closePath(); ctx.fillStyle = "#FFF"; ctx.fill();
    }
    ctx.lineCap = "butt";
    ctx.font = "800 " + Math.round(zb.r * 0.30) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,.86)";
    ctx.fillText("CHANGER", zb.x, zb.y + zb.r * 1.32);
    /* Le bouton À COUVERT : au-dessus des autres, au centre, pour qu'on
       le trouve sans regarder. */
    const za = Ruelle.zoneAbri();
    pastille(za.x, za.y, za.r,
      Ruelle.couvert ? "rgba(76,196,106,.92)" : "rgba(40,36,58,.86)",
      Ruelle.couvert ? "rgba(38,124,60,.92)" : "rgba(14,12,22,.86)",
      "rgba(255,255,255,.24)");
    /* un bouclier dessiné : le mot n'aurait pas tenu */
    ctx.fillStyle = Ruelle.couvert ? "#0C2412" : "rgba(255,255,255,.80)";
    ctx.beginPath();
    ctx.moveTo(za.x, za.y - za.r * 0.52);
    ctx.lineTo(za.x + za.r * 0.44, za.y - za.r * 0.26);
    ctx.lineTo(za.x + za.r * 0.44, za.y + za.r * 0.14);
    ctx.quadraticCurveTo(za.x + za.r * 0.40, za.y + za.r * 0.52, za.x, za.y + za.r * 0.58);
    ctx.quadraticCurveTo(za.x - za.r * 0.40, za.y + za.r * 0.52, za.x - za.r * 0.44, za.y + za.r * 0.14);
    ctx.lineTo(za.x - za.r * 0.44, za.y - za.r * 0.26);
    ctx.closePath(); ctx.fill();

    /* La réplique du relais, juste au-dessus de celui qui reprend. */
    if (Ruelle.replique){
      const r2 = Ruelle.replique;
      const al = borne(r2.t / 0.4, 0, 1);
      const bx = r2.qui === 0 ? L * 0.28 : L * 0.72;
      const by = H * 0.600;
      /* L'alignement était laissé à ce que le dessin précédent avait
         posé : la pastille se calait au centre et le texte partait à
         gauche. On le fixe ICI, juste avant d'écrire. */
      ctx.save();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = "800 " + Math.round(L * 0.036) + "px 'Baloo 2', system-ui, sans-serif";
      const w2 = ctx.measureText(r2.txt).width;
      const bw2 = Math.min(w2 + 22, L * 0.62);
      ctx.globalAlpha = al;
      ctx.fillStyle = "rgba(250,248,255,.95)";
      arrondi(bx - bw2 / 2, by - L * 0.038, bw2, L * 0.076, L * 0.032); ctx.fill();
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
