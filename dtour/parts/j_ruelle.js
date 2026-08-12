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
  armeActive(){ return ARMES[this.heroActif().arme]; },
  changerHeros(){ this.actifIdx = 1 - this.actifIdx; Sons.clic(); },

  pas(dt){
    if (!this.actif) return;
    if (this.hitStop > 0){ this.hitStop -= dt; return; }
    this.secousse = Math.max(0, this.secousse - dt * 2.4);
    for (const h of this.heros){
      if (h.recharge > 0){
        h.recharge -= dt;
        if (h.recharge <= 0) h.balles = ARMES[h.arme].chargeur;
      }
      if (h.repos > 0) h.repos -= dt;
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
        e.tFrame += dt;
        if (e.tFrame > 0.10){ e.tFrame = 0; e.frame = (e.frame + 1) % 6; }
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
  this.flashes.push({ t:0.10, duree:0.10, heros:this.actifIdx });
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
  const vise = i === this.actifIdx;
  const th = h.id === "thibaut";
  if (h.recharge > 0){
    const p = 1 - h.recharge / arme.recharge;
    return p < 0.3 ? "baisse" : p < 0.7 ? "accroupi" : (th ? "arme1" : "arme1");
  }
  if (!vise) return th ? "arme2" : "arme2";
  const t = 1 / arme.cadence - h.repos;
  if (h.repos > 0){
    if (t < 0.09) return "tir";
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
      const e = Math.max(L / fond.naturalWidth, H / fond.naturalHeight);
      const l = fond.naturalWidth * e, h = fond.naturalHeight * e;
      ctx.drawImage(fond, (L - l) / 2, H - h, l, h);
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
    }
    /* les deux héros, au premier plan, de dos */
    for (let i = 0; i < 2; i++){
      const h = Ruelle.heros[i];
      const spr = Images.table[h.sprite + "_" + Ruelle.poseHeros(i)];
      if (!spr || !spr.naturalWidth) continue;
      const haut = H * 0.30, larg = haut * spr.naturalWidth / spr.naturalHeight;
      const x = i === 0 ? L * 0.22 : L * 0.78;
      ctx.globalAlpha = i === Ruelle.actifIdx ? 1 : 0.82;
      ctx.drawImage(spr, x - larg / 2, H * 0.985 - haut, larg, haut);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  },
};
