"use strict";

/* ==================================================================
   LA FILE DU D'TOUR
   ------------------------------------------------------------------
   Un seul fichier, aucune dépendance, aucun fichier audio : tous les
   sons sont synthétisés au WebAudio. Les images viennent de img/,
   découpées de la planche fournie.

   Correspondance avec l'architecture demandée dans le brief :
     GameManager       -> Jeu
     QueueManager      -> File
     NPCManager        -> Foule
     DifficultyManager -> Difficulte
     ScoreManager      -> Score
     InputManager      -> Entrees
     AudioManager      -> Sons
     UIManager         -> Interface
================================================================== */

const VERSION = "1.1";

/* ---------- géométrie ----------
   Tout est exprimé en « unités monde », où un personnage mesure
   exactement 100 unités de haut. La conversion en pixels se fait au
   dernier moment, par un seul facteur d'échelle. Aucun calcul de jeu
   ne dépend donc de la taille de l'écran — c'est la leçon retenue du
   terrain 540x880 de DUO. */
const H_PERSO = 100;
const BRAS_TENDU = 0.95;   /* la main ne rejoint celle du héros qu'au moment de la poignée */
const PAS = 62;                       /* écart entre deux places de la file */
const PLACE_T = 2, PLACE_PF = 3;      /* places fixes des deux héros */
const X_PORTE = -34;                  /* la porte du bar, à gauche de la place 0 */

function xPlace(i){ return 46 + i * PAS; }

/* Recul de celui qui salue : il ne se plante PAS entre les deux héros
   — deux personnes espacées de 62 unités ne laissent aucune place à un
   tiers. Il s'arrête à 88 unités à DROITE de celui qu'il vise, toujours
   la même distance : le bras peint fait alors la même longueur dans les
   deux cas, et celle-ci répond à la main tendue des sprites, qui va
   chercher entre 36 et 45 unités. Viser Thibaut place donc l'arrivant
   juste devant Pierre-François, à qui il tourne le dos : c'est
   exactement la bonne image. */
const RECUL_SALUT = 104;
const X_SALUT = xPlace(PLACE_T) + RECUL_SALUT;

/* Les arrivants longent la file par devant : plus bas à l'écran et
   légèrement plus grands, ils passent donc DEVANT les gens rangés.
   La hauteur d'épaule tombe pile à celle de la main tendue des héros :
   la poignée de main est horizontale, comme dans la vraie vie. */
const DEVANT_Y = 0.24, DEVANT_Z = 1.07;

/* Épaule du PNJ, en fraction de sa hauteur mesurée depuis les pieds. */
const EPAULE = 0.66;

/* ---------- rythme ----------
   Temps de réaction : 2 s au départ, jamais moins de 0,55 s. La
   décroissance est géométrique plutôt que par paliers de 0,2 s : la
   marche d'escalier se sentait, la courbe non. */
const REACT_DEBUT = 2.0, REACT_PLANCHER = 0.55, REACT_TAUX = 0.962;
const ARRIVEE_DEBUT = 2.9, ARRIVEE_PLANCHER = 0.78, ARRIVEE_TAUX = 0.972;
const P_INTERACTION_DEBUT = 0.80, P_INTERACTION_FIN = 0.94;
const VIT_MARCHE = 78;                /* unités monde par seconde */
const VIES = 3;
const SIMULTANE_PALIERS = [0, 13, 30]; /* saluts requis pour 1, 2 puis 3 demandes en même temps */

/* ---------- moments de la journée ----------
   Le décor ne saute pas d'un état à l'autre : on interpole en continu
   une teinte, et on croise les deux images sur 2,2 s. */
const MOMENTS = [
  { nom:"jour", fond:"fond_jour", seuil:0,
    voile:"rgba(255,232,190,0)", ombre:0.16, chaleur:0, lampes:0 },
  { nom:"soir", fond:"fond_soir", seuil:22,
    voile:"rgba(255,146,64,0.20)", ombre:0.26, chaleur:0.5, lampes:0.55 },
  { nom:"nuit", fond:"fond_nuit", seuil:52,
    voile:"rgba(28,44,110,0.34)", ombre:0.40, chaleur:0.15, lampes:1 },
];
const DUREE_FONDU = 2.2;

/* ---------- états du PNJ ----------
   ENTERING / WALKING / WAITING / REQUESTING_HANDSHAKE / HANDSHAKING /
   AWKWARD / IDLE, en français. */
const ETAT = {
  ENTREE:"ENTREE", MARCHE:"MARCHE", ATTENTE:"ATTENTE",
  DEMANDE:"DEMANDE", POIGNEE:"POIGNEE", MALAISE:"MALAISE", REPOS:"REPOS",
};

/* ---------- types d'interaction ----------
   Les absurdités restent rares : c'est leur rareté qui les rend
   drôles. Chacune n'apparaît qu'après un certain nombre de saluts. */
const TYPES = {
  AUCUNE:       { poids:0,    des:0 },
  SIMPLE:       { poids:100,  des:0 },
  ENTHOUSIASTE: { poids:9,    des:8,  react:0.62, points:2.0 },
  PATIENT:      { poids:7,    des:10, react:2.30, points:0.8 },
  DOUBLE:       { poids:8,    des:16 },
  FAUSSE:       { poids:7,    des:12 },
  REVENANT:     { poids:6,    des:20 },
  PASSANT:      { poids:6,    des:6 },
  JUMEAU:       { poids:5,    des:24 },
};

const NB_PNJ = 16;
const SPRITES_PNJ = Array.from({ length:NB_PNJ }, (_, i) => "pnj" + String(i + 1).padStart(2, "0"));
const POSES_HEROS = ["idle","attente","marche","regarde","surpris","stress","tendue","victoire"];

const REPLIQUES_OK = ["SALUT !","BONJOUR !","ENCHANTÉ !","ÇA VA ?","SALUT !","BIEN OU BIEN ?"];
const REPLIQUES_RATE = ["...","MALAISE","GÊNANT.","..."];

/* ================= petits outils ================= */
const borne = (v, a, b) => v < a ? a : (v > b ? b : v);
const melange = (a, b, t) => a + (b - a) * t;
const doux = t => t * t * (3 - 2 * t);
const hasard = (a, b) => a + Math.random() * (b - a);
const entier = (a, b) => Math.floor(hasard(a, b + 1));
const piocher = t => t[Math.floor(Math.random() * t.length)];

/* Séparateur de milliers en espace insécable fine, comme sur la planche. */
function chiffres(n){ return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F"); }

/* ================= mémoire locale ================= */
const CLE = "dtour_records";
function lireRecords(){
  try{ return JSON.parse(localStorage.getItem(CLE)) || {}; }catch(e){ return {}; }
}
function ecrireRecord(r){
  const a = lireRecords(); let neuf = false;
  for (const k of ["score","combo","saluts","file"]){
    if ((r[k] || 0) > (a[k] || 0)){ a[k] = r[k]; if (k === "score") neuf = true; }
  }
  try{ localStorage.setItem(CLE, JSON.stringify(a)); }catch(e){}
  return neuf;
}

/* ================= AudioManager -> Sons =================
   Aucun fichier audio : tout est synthétisé. Un lit d'ambiance de rue
   (bruit filtré) plus des brèves de conversation dont la densité monte
   avec la nuit. Le contexte n'est créé qu'au premier geste du joueur,
   sinon iOS le laisse suspendu. */
const Sons = {
  ac:null, maitre:null, ambiance:null, gainAmb:null, filtreAmb:null,
  actif:true, prochaineBrève:0,

  init(){
    if (this.ac) return;
    const C = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!C) return;
    this.ac = new C();
    this.maitre = this.ac.createGain();
    this.maitre.gain.value = this.actif ? 0.9 : 0;
    this.maitre.connect(this.ac.destination);
  },
  reveiller(){ this.init(); if (this.ac && this.ac.state === "suspended") this.ac.resume(); },
  basculer(){
    this.actif = !this.actif;
    if (this.maitre) this.maitre.gain.value = this.actif ? 0.9 : 0;
    return this.actif;
  },

  bip(freq, duree, forme, vol, vers){
    if (!this.ac || !this.actif) return;
    const t = this.ac.currentTime;
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = forme || "sine"; o.frequency.setValueAtTime(freq, t);
    if (vers) o.frequency.exponentialRampToValueAtTime(Math.max(20, vers), t + duree);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.25, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    o.connect(g); g.connect(this.maitre); o.start(t); o.stop(t + duree + 0.02);
  },
  souffle(duree, vol, centre, q){
    if (!this.ac || !this.actif) return;
    const t = this.ac.currentTime, n = Math.max(1, Math.floor(this.ac.sampleRate * duree));
    const b = this.ac.createBuffer(1, n, this.ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = this.ac.createBufferSource(); s.buffer = b;
    const f = this.ac.createBiquadFilter();
    f.type = "bandpass"; f.frequency.value = centre || 900; f.Q.value = q || 1.1;
    const g = this.ac.createGain(); g.gain.value = vol || 0.2;
    s.connect(f); f.connect(g); g.connect(this.maitre); s.start(t);
  },

  /* --- lit d'ambiance : rue + terrasse --- */
  lancerAmbiance(){
    if (!this.ac || this.ambiance) return;
    const n = this.ac.sampleRate * 2;
    const b = this.ac.createBuffer(1, n, this.ac.sampleRate), d = b.getChannelData(0);
    let prec = 0;
    for (let i = 0; i < n; i++){ prec = (prec + (Math.random() * 2 - 1) * 0.06) * 0.985; d[i] = prec; }
    const s = this.ac.createBufferSource(); s.buffer = b; s.loop = true;
    this.filtreAmb = this.ac.createBiquadFilter();
    this.filtreAmb.type = "lowpass"; this.filtreAmb.frequency.value = 620;
    this.gainAmb = this.ac.createGain(); this.gainAmb.gain.value = 0;
    s.connect(this.filtreAmb); this.filtreAmb.connect(this.gainAmb); this.gainAmb.connect(this.maitre);
    s.start(); this.ambiance = s;
  },
  ambiancer(densite, dt, temps){
    if (!this.ac || !this.gainAmb) return;
    const cible = 0.22 + densite * 0.5;
    const g = this.gainAmb.gain;
    g.value = melange(g.value, cible, Math.min(1, dt * 1.4));
    if (this.filtreAmb) this.filtreAmb.frequency.value = melange(520, 1150, densite);
    /* brèves de conversation : de plus en plus serrées à mesure que ça se remplit */
    if (temps > this.prochaineBrève){
      this.prochaineBrève = temps + hasard(1.1, 3.4) / (0.5 + densite);
      if (this.actif) this.souffle(hasard(0.09, 0.2), 0.035 + densite * 0.05, hasard(300, 1500), 2.2);
    }
  },

  arrivee(){ this.souffle(0.1, 0.09, 420, 1.6); },
  alerte(){ this.bip(880, 0.07, "triangle", 0.2); this.bip(1320, 0.07, "sine", 0.13); },
  poignee(){ this.souffle(0.11, 0.2, 240, 1.4); this.bip(190, 0.09, "sine", 0.2, 130); },
  reussite(n){
    const gamme = [523, 587, 659, 784, 880, 1047, 1175, 1319];
    const f = gamme[Math.min(gamme.length - 1, n)];
    this.bip(f, 0.11, "triangle", 0.24); this.bip(f * 2, 0.07, "sine", 0.1);
  },
  palier(){ [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.bip(f, 0.13, "triangle", 0.2), i * 55)); },
  erreur(){ this.bip(196, 0.3, "sawtooth", 0.26, 84); this.souffle(0.22, 0.14, 260, 0.8); },
  gene(){ this.bip(233, 0.5, "sine", 0.16, 150); this.bip(247, 0.5, "sine", 0.12, 160); },
  fin(){ [392, 349, 294, 233].forEach((f, i) => setTimeout(() => this.bip(f, 0.4, "triangle", 0.24), i * 190)); },
  clic(){ this.bip(660, 0.04, "square", 0.12); },

  /* ---------- musique ----------
     Une petite boucle de bistrot, entièrement synthétisée : contrebasse
     qui marche, deux accords soufflés à contretemps, un balai sur la
     caisse claire. Quatre mesures, une grille de jazz simple, et un
     tempo qui monte du jour à la nuit — c'est le seul endroit où l'on
     entend que la soirée avance.
     Ordonnancement à l'avance de 0,2 s : sans ça, iOS place les notes
     de travers dès que l'onglet respire. */
  GRILLE:[
    { basse:[146.83, 110.00], accord:[220.00, 261.63, 329.63] },  /* Ré m7  */
    { basse:[196.00, 146.83], accord:[246.94, 293.66, 349.23] },  /* Sol 7  */
    { basse:[130.81, 196.00], accord:[196.00, 261.63, 329.63] },  /* Do maj7*/
    { basse:[110.00, 164.81], accord:[220.00, 277.18, 329.63] },  /* La 7   */
  ],
  musique:false, mesure:0, temps4:0, quand:0, gainMus:null, intensite:0,

  lancerMusique(){
    if (!this.ac || this.gainMus) return;
    this.gainMus = this.ac.createGain();
    this.gainMus.gain.value = 0;
    this.gainMus.connect(this.maitre);
    this.quand = this.ac.currentTime + 0.12;
    this.mesure = 0; this.temps4 = 0; this.musique = true;
  },
  volumeMusique(v){
    if (this.gainMus) this.gainMus.gain.value = v;
  },
  note(freq, quand, duree, forme, vol, filtre){
    if (!this.ac || !this.gainMus) return;
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = forme; o.frequency.setValueAtTime(freq, quand);
    g.gain.setValueAtTime(0.0001, quand);
    g.gain.exponentialRampToValueAtTime(vol, quand + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, quand + duree);
    let sortie = g;
    if (filtre){
      const f = this.ac.createBiquadFilter();
      f.type = "lowpass"; f.frequency.value = filtre;
      g.connect(f); sortie = f;
    }
    o.connect(g); sortie.connect(this.gainMus);
    o.start(quand); o.stop(quand + duree + 0.05);
  },
  balai(quand, vol){
    if (!this.ac || !this.gainMus) return;
    const n = Math.floor(this.ac.sampleRate * 0.07);
    const b = this.ac.createBuffer(1, n, this.ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.4);
    const src = this.ac.createBufferSource(); src.buffer = b;
    const f = this.ac.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 4200;
    const g = this.ac.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(this.gainMus);
    src.start(quand);
  },
  /* tempo : 92 le jour, 108 le soir, 124 la nuit */
  ordonnerMusique(tempo){
    if (!this.ac || !this.musique || !this.actif) return;
    const noire = 60 / tempo;
    while (this.quand < this.ac.currentTime + 0.2){
      const m = this.GRILLE[this.mesure % 4], t = this.temps4, q = this.quand;
      if (t === 0 || t === 2) this.note(m.basse[t === 0 ? 0 : 1], q, noire * 0.85, "triangle", 0.14, 420);
      if (t === 1 || t === 3){
        m.accord.forEach((f, i) => this.note(f, q + 0.012 * i, noire * 0.42, "sine", 0.045, 2400));
      }
      this.balai(q, t % 2 === 0 ? 0.05 : 0.028);
      if (t === 3) this.balai(q + noire * 0.5, 0.034);
      this.quand += noire;
      this.temps4++;
      if (this.temps4 > 3){ this.temps4 = 0; this.mesure++; }
    }
  },
};

/* ================= chargement des images ================= */
const Images = { pret:false, table:{}, teintes:{} };

function listeImages(){
  const l = ["logo","face_thibaut","face_pierre"];
  for (const m of MOMENTS) l.push(m.fond);
  for (const h of ["thibaut","pierre"]) for (const p of POSES_HEROS) l.push(h + "_" + p);
  for (const s of SPRITES_PNJ) l.push(s);
  return l;
}

/* Les bras tendus des PNJ sont dessinés, pas photographiés : la
   planche ne fournit qu'une seule main tendue générique et l'employer
   pour les seize aurait changé le personnage en pleine file. On relève
   donc, une fois pour toutes, la couleur de peau et celle de la manche
   de chaque sprite pour peindre un bras au bon coloris. */
function releverTeintes(nom, img){
  try{
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext("2d", { willReadFrequently:true });
    x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    const lire = (fx, fy) => {
      const px = Math.floor(c.width * fx), py = Math.floor(c.height * fy);
      const i = (py * c.width + px) * 4;
      return [d[i], d[i + 1], d[i + 2], d[i + 3]];
    };
    /* peau : on cherche le pixel le plus « chair » dans la zone du visage */
    let peau = [232, 178, 142], meilleur = -1;
    for (let fy = 0.06; fy <= 0.22; fy += 0.02){
      for (let fx = 0.3; fx <= 0.7; fx += 0.05){
        const p = lire(fx, fy);
        if (p[3] < 200) continue;
        const note = p[0] - p[2];
        if (p[0] > 120 && p[0] >= p[1] && p[1] >= p[2] && note > 22 && note > meilleur){
          meilleur = note; peau = [p[0], p[1], p[2]];
        }
      }
    }
    /* manche : le flanc du torse, à mi-hauteur du buste */
    let manche = null;
    for (const fx of [0.20, 0.80, 0.26, 0.74]){
      const p = lire(fx, 0.40);
      if (p[3] > 210){ manche = [p[0], p[1], p[2]]; break; }
    }
    if (!manche) manche = lire(0.5, 0.42).slice(0, 3);
    const fiche = {
      peau: "rgb(" + peau.join(",") + ")",
      peauOmbre: "rgb(" + peau.map(v => Math.round(v * 0.82)).join(",") + ")",
      manche: "rgb(" + manche.join(",") + ")",
      mancheOmbre: "rgb(" + manche.map(v => Math.round(v * 0.72)).join(",") + ")",
      ancre: 0.5,
    };

    /* --- ancre horizontale ---
       Le centre du sprite n'est pas le centre du corps : la pose « main
       tendue » est 50 % plus large que la pose au repos, et cadrer sur
       le milieu de l'image faisait glisser le personnage d'un quart de
       sa largeur au moment où il tendait le bras. On relève donc le
       milieu des PIEDS, qui ne bouge pas d'une pose à l'autre. */
    const opaque = (px, py) => d[(py * c.width + px) * 4 + 3] > 120;
    let xg = c.width, xd = -1;
    for (let py = Math.floor(c.height * 0.82); py < c.height; py++){
      for (let px = 0; px < c.width; px++){
        if (!opaque(px, py)) continue;
        if (px < xg) xg = px;
        if (px > xd) xd = px;
      }
    }
    if (xd >= 0) fiche.ancre = (xg + xd) / 2 / c.width;

    /* --- bout de la main tendue ---
       Utilisé comme point de rendez-vous du bras peint du PNJ. */
    if (nom.endsWith("_tendue")){
      let mx = -1, my = 0, n = 0;
      for (let px = c.width - 1; px >= 0 && mx < 0; px--){
        for (let py = 0; py < Math.floor(c.height * 0.72); py++){
          if (opaque(px, py)){ mx = px; my += py; n++; }
        }
      }
      if (mx >= 0){
        const largeurMonde = H_PERSO * c.width / c.height;
        fiche.mainX = (mx / c.width - fiche.ancre) * largeurMonde;
        fiche.mainY = -(1 - (my / Math.max(1, n)) / c.height) * H_PERSO;
      }
    }
    Images.teintes[nom] = fiche;
  }catch(e){
    Images.teintes[nom] = { peau:"#E8B28E", peauOmbre:"#C08F6F", manche:"#2C3550", mancheOmbre:"#1D2439", ancre:0.5 };
  }
}

function ancreDe(nom){
  const t = Images.teintes[nom];
  return t && t.ancre != null ? t.ancre : 0.5;
}

function charger(surAvance){
  const noms = listeImages();
  let faits = 0;
  return Promise.all(noms.map(nom => new Promise(resoudre => {
    const img = new Image();
    img.onload = () => {
      Images.table[nom] = img;
      if (nom.startsWith("pnj") || nom.startsWith("thibaut") || nom.startsWith("pierre")) releverTeintes(nom, img);
      faits++; if (surAvance) surAvance(faits / noms.length); resoudre();
    };
    img.onerror = () => { faits++; if (surAvance) surAvance(faits / noms.length); resoudre(); };
    /* Le numéro de version suit l'adresse : les images ont changé de
       définition et de prénom sans changer de nom de fichier, et Safari
       aurait resservi les anciennes depuis son cache — boutons neufs sur
       sprites périmés. */
    img.src = "img/" + nom + ".webp?v=" + VERSION;
  }))).then(() => { Images.pret = true; });
}

/* ================= DifficultyManager -> Difficulte ================= */
const Difficulte = {
  saluts:0, forcageReaction:null, facteurVitesse:1,

  raz(){ this.saluts = 0; this.forcageReaction = null; this.facteurVitesse = 1; },
  compter(){ this.saluts++; },

  reaction(){
    if (this.forcageReaction != null) return this.forcageReaction;
    return Math.max(REACT_PLANCHER, REACT_DEBUT * Math.pow(REACT_TAUX, this.saluts));
  },
  delaiArrivee(){
    const d = Math.max(ARRIVEE_PLANCHER, ARRIVEE_DEBUT * Math.pow(ARRIVEE_TAUX, this.saluts));
    return d * hasard(0.75, 1.25) / this.facteurVitesse;
  },
  pInteraction(){
    return melange(P_INTERACTION_DEBUT, P_INTERACTION_FIN, borne(this.saluts / 40, 0, 1));
  },
  simultanees(){
    let n = 1;
    for (let i = 1; i < SIMULTANE_PALIERS.length; i++) if (this.saluts >= SIMULTANE_PALIERS[i]) n = i + 1;
    return n;
  },
  /* Tire un type d'interaction parmi ceux débloqués, au poids. */
  tirerType(){
    const dispo = Object.keys(TYPES).filter(k => k !== "AUCUNE" && this.saluts >= TYPES[k].des);
    let total = 0; for (const k of dispo) total += TYPES[k].poids;
    let r = Math.random() * total;
    for (const k of dispo){ r -= TYPES[k].poids; if (r <= 0) return k; }
    return "SIMPLE";
  },
};
