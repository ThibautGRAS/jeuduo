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
    this.recul = 0; this.razViseur();
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
    this.pasViseur(dt);
    for (const h of this.heros){
      if (h.recharge > 0){
        h.recharge -= dt;
        if (h.recharge <= 0){ h.balles = ARMES[h.arme].chargeur; h.repos = 0.12; }
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
      const abri = h.recharge > 0 ? Math.sin(Math.min(1, 1 - h.recharge / ARMES[h.arme].recharge) * Math.PI) : 0;
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
const MANCHE_R = 0.155, MANCHE_X = 0.20, MANCHE_Y = 0.845;
const TIR_R = 0.115, TIR_X = 0.80, TIR_Y = 0.845;

Object.assign(Ruelle, {
  viseur:{ x:0.5, y:0.45 }, manche:{ actif:false, id:null, dx:0, dy:0 },

  razViseur(){ this.viseur = { x:0.5, y:0.45 }; this.manche = { actif:false, id:null, dx:0, dy:0 }; },

  /* Les trois zones du pouce, en fractions : elles suivent l'écran. */
  zoneManche(){ return { x:Camera.L * MANCHE_X, y:Camera.H * MANCHE_Y, r:Camera.L * MANCHE_R }; },
  zoneTir(){ return { x:Camera.L * TIR_X, y:Camera.H * TIR_Y, r:Camera.L * TIR_R }; },
  zoneBascule(){ return { x:Camera.L * 0.5, y:Camera.H * 0.885, r:Camera.L * 0.085 }; },
  dans(z, x, y){ const dx = x - z.x, dy = y - z.y; return dx * dx + dy * dy <= z.r * z.r; },

  toucheDebut(id, x, y){
    if (!this.actif) return false;
    if (this.dans(this.zoneManche(), x, y)){
      this.manche = { actif:true, id, dx:0, dy:0 };
      this.majManche(x, y);
      return true;
    }
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

    /* --- bandeau du haut : score, vague, barricade --- */
    const hb = Math.round(H * 0.052);
    ctx.fillStyle = "rgba(8,7,14,.72)";
    arrondi(p * 0.5, p * 0.5, L - p, hb, hb * 0.3); ctx.fill();
    ctx.font = "800 " + Math.round(hb * 0.40) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.textAlign = "left"; ctx.fillStyle = "#F7B32B";
    ctx.fillText(chiffres(Score.points), p * 1.1, p * 0.5 + hb * 0.5);
    ctx.textAlign = "center"; ctx.fillStyle = "#EDE7FA";
    ctx.fillText("VAGUE " + (Ruelle.vague + 1), L * 0.5, p * 0.5 + hb * 0.5);

    /* la barricade : une jauge, pas un nombre */
    const lj = L * 0.24, xj = L - p * 1.1 - lj, yj = p * 0.5 + hb * 0.5;
    const part = Ruelle.barricade / RUELLE_BARRICADE_PV;
    ctx.fillStyle = "rgba(255,255,255,.16)";
    arrondi(xj, yj - hb * 0.16, lj, hb * 0.32, hb * 0.16); ctx.fill();
    ctx.fillStyle = part > 0.6 ? "#4CC46A" : part > 0.3 ? "#F7B32B" : "#E2453D";
    arrondi(xj, yj - hb * 0.16, Math.max(2, lj * part), hb * 0.32, hb * 0.16); ctx.fill();

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
    pastille(zm.x, zm.y, zm.r, "rgba(46,40,64,.62)", "rgba(12,10,20,.62)", "rgba(255,255,255,.16)");
    const tx = zm.x + Ruelle.manche.dx * zm.r * 0.60;
    const ty = zm.y + Ruelle.manche.dy * zm.r * 0.60;
    pastille(tx, ty, zm.r * 0.40, "rgba(255,255,255,.92)", "rgba(176,176,196,.92)", "rgba(255,255,255,.9)");

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
    ctx.textAlign = "center"; ctx.fillStyle = "#FFF";
    ctx.font = "800 " + Math.round(zt.r * 0.34) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.fillText(recharge ? "…" : "TIR", zt.x, zt.y);
    /* une balle par munition, en couronne : on lit le chargeur d'un
       coup d'œil sans compter */
    for (let k = 0; k < arme.chargeur; k++){
      const a = -Math.PI / 2 + (k / arme.chargeur) * 6.2832;
      const rr = zt.r * 1.30;
      ctx.beginPath();
      ctx.arc(zt.x + Math.cos(a) * rr, zt.y + Math.sin(a) * rr, zt.r * 0.11, 0, 6.2832);
      ctx.fillStyle = k < h.balles ? "#F7B32B" : "rgba(255,255,255,.18)";
      ctx.fill();
    }

    /* --- la bascule de héros, au centre --- */
    const zb = Ruelle.zoneBascule();
    pastille(zb.x, zb.y, zb.r, "rgba(40,36,58,.88)", "rgba(14,12,22,.88)", "rgba(255,255,255,.18)");
    ctx.strokeStyle = Heros[Ruelle.actifIdx] ? Heros[Ruelle.actifIdx].couleur : "#FFF";
    ctx.lineWidth = Math.max(2.5, L * 0.010);
    ctx.beginPath(); ctx.arc(zb.x, zb.y, zb.r * 0.94, 0, 6.2832); ctx.stroke();
    ctx.fillStyle = "#EDE7FA";
    ctx.font = "800 " + Math.round(zb.r * 0.40) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.fillText(Ruelle.heroActif().id === "thibaut" ? "TH" : "P-F", zb.x, zb.y - zb.r * 0.12);
    ctx.font = "700 " + Math.round(zb.r * 0.26) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.fillStyle = "rgba(237,231,250,.66)";
    ctx.fillText("CHANGER", zb.x, zb.y + zb.r * 0.42);
    ctx.textAlign = "left";
  },
});
