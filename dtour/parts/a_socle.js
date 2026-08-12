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

const VERSION = "6.37";

/* ---------- géométrie ----------
   Tout est exprimé en « unités monde », où un personnage mesure
   exactement 100 unités de haut. La conversion en pixels se fait au
   dernier moment, par un seul facteur d'échelle. Aucun calcul de jeu
   ne dépend donc de la taille de l'écran — c'est la leçon retenue du
   terrain 540x880 de DUO. */
const H_PERSO = 100;
const BRAS_TENDU = 0.95;   /* la main ne rejoint celle du héros qu'au moment de la poignée */
const PAS = 62;                       /* écart entre deux places de la file */
const PLACE_G = 2, PLACE_D = 3;      /* places fixes des deux héros */
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
const X_SALUT = xPlace(PLACE_G) + RECUL_SALUT;

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

const NB_PNJ = 28;
const SPRITES_PNJ = Array.from({ length:NB_PNJ }, (_, i) => "pnj" + String(i + 1).padStart(2, "0"));
/* Les habitants ne font PLUS la queue au D'Tour. Ils n'avaient pas de
   planche de file, donc pas de bras dessiné : le code leur peignait un
   bras à partir des couleurs relevées sur leur sprite, et ça n'a jamais
   eu l'air d'un bras. Vingt-huit clients suffisent largement à remplir
   la file ; les habitants gardent leur place à la terrasse, dans
   l'appartement du niveau 2 et au bar du niveau 3. C'est ce qui permet
   de supprimer releverTeintes() et dessinerBras(). */
const PERSOS_DEBOUT = [];
const PERSOS_ASSIS = ["pers_teo", "pers_charles"];
for (const p of PERSOS_DEBOUT) SPRITES_PNJ.push(p);
const POSES_HEROS = ["idle","attente","marche","regarde","surpris","stress","tendue","victoire"];
/* Les cinq poses d'un PNJ de la file. Le bras qui se tend est DESSINÉ
   maintenant : plus besoin de le peindre à partir des couleurs relevées
   sur le sprite. Les habitués, qui n'ont pas encore de planche, gardent
   le bras peint — les deux systèmes cohabitent le temps de la
   transition, et `aBrasDessine()` choisit. */
const POSES_PNJ = ["attente", "marche1", "marche2", "demi", "main"];

/* Ce que dit l'arrivant en tendant la main. Il est chaleureux, sûr de
   lui, et se trompe complètement de personne — c'est tout le sujet. */
const BONJOURS = [
  "Salut !", "Bonjour !", "Hé, salut !", "Tiens, salut !", "Ça va ?",
  "Oh, bonjour !", "Salut, toi !", "Eh bien ça alors !", "Content de te voir !",
];
/* Ce que répond le héros quand le joueur a visé juste. Il n'a aucune
   idée de qui c'est, et ça s'entend. */
const REPONSES = [
  "Salut !", "Bonjour !", "Euh... salut !", "Ça va ?", "Ah, salut !",
  "Bien sûr !", "Mais oui !", "Ça faisait longtemps !", "Enchanté !",
];
/* Et quand personne n'a serré la main tendue. */
const REPLIQUES_RATE = ["...", "Bon.", "Tant pis.", "..."];

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

  /* --- lit d'ambiance du bar : brouhaha, verres, rires ---
     Même moteur que le fond d'enquête : une boucle de bruit filtrée,
     plus des événements calés sur l'horloge AUDIO (pas sur l'affichage,
     une seconde qui traîne s'entend). Rien n'est échantillonné : tout
     est synthétisé, le jeu reste un seul fichier. */
  lancerFondBar(){
    this.init();
    if (!this.ac || this.bar) return;
    const n = this.ac.sampleRate * 3;
    const b = this.ac.createBuffer(1, n, this.ac.sampleRate), d = b.getChannelData(0);
    let prec = 0;
    for (let i = 0; i < n; i++){ prec = (prec + (Math.random() * 2 - 1) * 0.07) * 0.988; d[i] = prec; }
    const src = this.ac.createBufferSource(); src.buffer = b; src.loop = true;
    const f = this.ac.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 520; f.Q.value = 0.7;
    const g = this.ac.createGain(); g.gain.value = 0;
    src.connect(f); f.connect(g); g.connect(this.maitre);
    src.start();
    const t = this.ac.currentTime;
    this.bar = { src, gain:g, filtre:f, prochainVerre:t + 2, prochainRire:t + 5 };
  },
  arreterFondBar(){
    if (!this.bar) return;
    try{ this.bar.src.stop(); }catch(e){}
    this.bar = null;
  },
  /* chaud : 0 au calme, 1 en plein coup de feu — la salle monte d'un ton */
  fondBar(dt, chaud){
    if (!this.ac || !this.bar) return;
    const c = borne(chaud || 0, 0, 1);
    const g = this.bar.gain.gain;
    g.value = melange(g.value, 0.34 + c * 0.30, Math.min(1, dt * 1.1));
    this.bar.filtre.frequency.value = melange(this.bar.filtre.frequency.value, 480 + c * 420, Math.min(1, dt * 0.9));
    const t = this.ac.currentTime;
    if (t > this.bar.prochainVerre){
      this.bar.prochainVerre = t + hasard(1.4, 4.2) / (0.6 + c);
      if (this.actif){
        /* un verre qu'on pose quelque part dans la salle */
        this.percTic(t, 0.016);
        this.bip(hasard(1500, 2400), 0.05, "sine", 0.020, hasard(900, 1400));
      }
    }
    if (t > this.bar.prochainRire){
      this.bar.prochainRire = t + hasard(7, 17) / (0.7 + c);
      if (this.actif){
        /* trois syllabes de rire, dans le fond */
        const f0 = hasard(260, 420);
        for (let k = 0; k < 3; k++) this.souffle(0.09 - k * 0.02, 0.05, f0 * (1 + k * 0.22), 3.0);
      }
    }
  },

  /* le CLAC du verre sur le comptoir : bois, puis verre */
  verrePose(){
    this.bip(150, 0.06, "sine", 0.20, 90);
    this.bip(2100, 0.07, "triangle", 0.10, 1500);
  },
  /* un client emporte un verre sous le nez du joueur */
  verreChipe(){
    this.bip(880, 0.07, "sine", 0.10, 1300);
    this.souffle(0.10, 0.06, 900, 2.4);
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
  /* ---------- fond sonore de l'enquête ----------
     Un appartement n'est jamais silencieux : un souffle grave et
     continu (la ville derrière les fenêtres), une pendule qui bat la
     seconde, et de loin en loin un craquement de parquet. Rien de tout
     ça n'est un fichier : c'est du bruit filtré et deux oscillateurs.
     C'est ce lit qui fait la différence entre « une image » et « un
     endroit ». */
  enq:null,

  lancerFondEnquete(){
    this.init();
    if (!this.ac || this.enq) return;
    const n = this.ac.sampleRate * 3;
    const b = this.ac.createBuffer(1, n, this.ac.sampleRate), d = b.getChannelData(0);
    let prec = 0;
    for (let i = 0; i < n; i++){ prec = (prec + (Math.random() * 2 - 1) * 0.05) * 0.992; d[i] = prec; }
    const src = this.ac.createBufferSource(); src.buffer = b; src.loop = true;
    const f = this.ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 260;
    const g = this.ac.createGain(); g.gain.value = 0;
    src.connect(f); f.connect(g); g.connect(this.maitre);
    src.start();
    this.enq = { src, gain:g, prochainTic:this.ac.currentTime + 1, prochainCraquement:this.ac.currentTime + 6 };
  },
  arreterFondEnquete(){
    if (!this.enq) return;
    try{ this.enq.src.stop(); }catch(e){}
    this.enq = null;
  },
  /* La pendule est calée sur l'horloge audio, pas sur l'affichage :
     une seconde qui traîne s'entend tout de suite. */
  fondEnquete(dt){
    if (!this.ac || !this.enq) return;
    const g = this.enq.gain.gain;
    g.value = melange(g.value, 0.55, Math.min(1, dt * 1.2));
    const t = this.ac.currentTime;
    while (this.enq.prochainTic < t + 0.4){
      const q = this.enq.prochainTic;
      this.percTic(q, 0.030);
      this.enq.prochainTic += 1;
    }
    if (t > this.enq.prochainCraquement){
      this.enq.prochainCraquement = t + hasard(9, 22);
      if (this.actif) this.souffle(hasard(0.10, 0.22), 0.035, hasard(120, 320), 3.2);
    }
  },
  percTic(quand, vol){
    if (!this.ac || !this.actif) return;
    const n = Math.floor(this.ac.sampleRate * 0.02);
    const b = this.ac.createBuffer(1, n, this.ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 6);
    const src = this.ac.createBufferSource(); src.buffer = b;
    const f = this.ac.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 2600; f.Q.value = 6;
    const g = this.ac.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(this.maitre);
    src.start(quand);
  },



  /* --- Hortense et la tarte ---
     Les sept crochets demandés existent tous ; ils sont synthétisés,
     comme le reste du jeu. Si de vrais sons arrivent un jour, il
     suffira de remplacer le corps de ces fonctions. */
  hortenseEntre(){ this.bip(330, 0.10, "triangle", 0.16, 520); this.souffle(0.16, 0.10, 700, 1.4); },
  hortensePrepare(){ this.bip(180, 0.34, "sawtooth", 0.13, 320); },
  tarteLancee(){ this.souffle(0.14, 0.22, 1500, 0.9); this.bip(760, 0.07, "square", 0.12, 420); },
  tarteVol(){ this.souffle(0.05, 0.05, 2400, 1.8); },
  tarteEsquive(){ this.bip(1046, 0.09, "triangle", 0.22); this.bip(1568, 0.07, "sine", 0.13); this.souffle(0.10, 0.10, 2600, 1.2); },
  tarteImpact(){ this.souffle(0.30, 0.36, 260, 0.6); this.bip(96, 0.26, "sine", 0.28, 52); },
  tarteEcrasee(){ this.souffle(0.16, 0.16, 340, 0.9); },
  tarteTropTot(){ this.bip(150, 0.07, "square", 0.07); },
  hortenseRit(){ [523, 466, 523, 440].forEach((f, i) => setTimeout(() => this.bip(f, 0.09, "triangle", 0.14), i * 95)); },

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
  /* ---------- grille du niveau 2 ----------
     Même moteur, autre humeur : mineur, walking bass qui ne se pose
     jamais, accords rares et sourds. Le cliché du polar tient en quatre
     mesures, il ne faut surtout pas qu'il tienne le devant. */
  GRILLE_ENQUETE:[
    { basse:[110.00, 130.81], accord:[164.81, 196.00, 246.94] },  /* La m   */
    { basse:[146.83, 174.61], accord:[174.61, 220.00, 261.63] },  /* Ré m   */
    { basse:[164.81, 196.00], accord:[196.00, 233.08, 293.66] },  /* Mi 7   */
    { basse:[110.00, 103.83], accord:[164.81, 207.65, 246.94] },  /* La m   */
  ],
  /* ---------- grille du niveau 3 ----------
     Un vamp de bar, majeur et bon enfant : la basse marche, les accords
     tombent à contretemps, le charley ne s'arrête jamais. Ça doit
     donner envie de courir le long du comptoir. */
  GRILLE_BAR:[
    { basse:[98.00, 146.83],  accord:[196.00, 246.94, 293.66] },  /* Sol   */
    { basse:[110.00, 164.81], accord:[220.00, 261.63, 329.63] },  /* La m  */
    { basse:[130.81, 196.00], accord:[261.63, 329.63, 392.00] },  /* Do    */
    { basse:[123.47, 98.00],  accord:[246.94, 293.66, 369.99] },  /* Si m  */
  ],
  grilleCourante(){
    if (Jeu.niveau === 3) return this.GRILLE_BAR;
    return Jeu.niveau === 2 ? this.GRILLE_ENQUETE : this.GRILLE;
  },

  /* tempo : 92 le jour, 108 le soir, 124 la nuit ; 88 pour l'enquête */
  ordonnerMusique(tempo){
    if (!this.ac || !this.musique || !this.actif) return;
    const grille = this.grilleCourante();
    const noire = 60 / tempo;
    while (this.quand < this.ac.currentTime + 0.2){
      const m = grille[this.mesure % 4], t = this.temps4, q = this.quand;
      if (Jeu.niveau === 3){
        /* basse à chaque temps, accords sur les contretemps, charley aux
           croches : le bar swingue au lieu de marcher au pas */
        this.note(m.basse[t % 2], q, noire * 0.52, "triangle", 0.135, 480);
        m.accord.forEach((f, i) =>
          this.note(f, q + noire * 0.5 + 0.010 * i, noire * 0.30, "square", 0.026, 1900));
        this.balai(q, 0.042);
        this.balai(q + noire * 0.5, t % 2 === 0 ? 0.030 : 0.046);
        if (t === 3) this.note(m.basse[1] * 2, q + noire * 0.75, noire * 0.22, "sine", 0.05, 1400);
      } else {
      if (t === 0 || t === 2) this.note(m.basse[t === 0 ? 0 : 1], q, noire * 0.85, "triangle", 0.14, 420);
      if (t === 1 || t === 3){
        m.accord.forEach((f, i) => this.note(f, q + 0.012 * i, noire * 0.42, "sine", 0.045, 2400));
      }
      this.balai(q, t % 2 === 0 ? 0.05 : 0.028);
      if (t === 3) this.balai(q + noire * 0.5, 0.034);
      }
      this.quand += noire;
      this.temps4++;
      if (this.temps4 > 3){ this.temps4 = 0; this.mesure++; }
    }
  },
};

/* ================= chargement des images ================= */
const Images = { pret:false, table:{}, teintes:{} };

/* Effets repris tels quels de la planche : la poignée de main dans sa
   bulle, l'étoile COMBO, les gouttes de sueur, le point d'interrogation.
   Les redessiner au canevas aurait donné un trait étranger au reste. */
const EFFETS = ["fx_poignee","fx_combo","fx_goutte","fx_question"];

/* Hortense et sa tarte au citron meringuée : deux jeux d'images bien
   séparés. La tarte n'appartient JAMAIS au sprite d'Hortense — elle
   n'existe qu'à partir du lancer, comme un projectile à part entière. */
const SPRITES_HORTENSE = ["h_debout","h_marche","h_sournoise","h_arme","h_lance",
                          "h_courtA","h_courtB","h_pointe","h_parasol","h_chaise"];
const SPRITES_TARTE = ["tarte0","tarte1","tarte2","tarte3","tarte_boom","tarte_ecrasee",
                       "debris_meringue","debris_citron","debris_part"];

/* Tout ce que le niveau 2 dessine. Ces noms manquaient à la liste de
   chargement : les fichiers étaient bien sur le disque, la suite de
   tests le vérifiait, et l'appartement restait noir à l'écran parce que
   personne ne les avait jamais demandés. Un test contrôle désormais que
   img/ et cette liste disent la même chose. */
/* Les habitants et le chat servent aux niveaux 1 ET 2 : ils vivent
   dans le dossier commun, pas dans celui d'un niveau. */
/* ---------- l'échelle propre à un personnage ----------
   Jojo est de petite taille : c'est son nom et c'est la moitié du duo
   qu'il forme avec Francky. Les planches le dessinent avec les
   proportions d'un homme trapu ordinaire, alors on le réduit ICI, une
   fois pour toutes, plutôt que de corriger sa taille à chaque endroit
   où il apparaît — barman, visiteur, habitué, habitant. Un facteur
   oublié quelque part et il redevient grand. */
const ECHELLE_PERSO = { jojo:0.74 };
function echellePerso(id){ return ECHELLE_PERSO[id] || 1; }

const PERSONNAGES_MAISON = [
  "pers_gabi", "pers_francky", "pers_jojo", "pers_solene",
  "pers_marini", "pers_martin", "pers_mathilde", "susp_chat",
];

const IMAGES_NIVEAU2 = [
  "appart", "loupe",
  /* Dix poses par inspecteur, découpées dans une seule planche : même
     taille d'image, pieds sur la même ligne. `splat` vient d'une planche
     plus ancienne — c'est la seule qui n'a pas encore été refaite, et
     elle ne s'affiche qu'une seconde quand on prend la tarte. */
  "enq_pf_idle", "enq_pf_marche1", "enq_pf_marche2", "enq_pf_fouille", "enq_pf_examine",
  "enq_pf_interroge", "enq_pf_ecoute", "enq_pf_carnet", "enq_pf_accuse", "enq_pf_esquive",
  "enq_pf_splat",
  "enq_th_idle", "enq_th_marche1", "enq_th_marche2", "enq_th_fouille", "enq_th_examine",
  "enq_th_interroge", "enq_th_ecoute", "enq_th_carnet", "enq_th_accuse", "enq_th_esquive",
  "enq_th_splat",
  "ind_miettes", "ind_chorizo", "ind_fromage", "ind_serviette",
  "ind_sauce", "ind_assiette", "ind_ticket", "ind_pattes", "ind_billet",
  "ind_poils", "ind_gamelle", "ind_collier", "ind_croquettes",
  "ind_griffures", "ind_souris", "ind_pari", "ind_loto", "ind_de",
  "ind_cartes", "ind_badge_gym", "ind_shaker_prot", "ind_chaussure",
  "ind_chaussette", "ind_casque", "ind_rustine", "ind_montre",
  "ind_verre_renverse", "ind_bouteille_vin", "ind_tirebouchon",
  "ind_bouchon", "ind_capsule", "ind_shaker_bar", "ind_citron",
  "ind_tarte_part", "ind_cendrier", "ind_pieces", "ind_cles",
  "ind_telephone", "ind_carnet", "ind_stylo", "ind_lunettes_noires",
  "ind_echarpe_grise", "ind_pq", "ind_brassard", "ind_echarpe_tri",
  "ind_carton_pizza",
  "pizza_entiere", "pizza_entamee", "pizza_part", "pizza_boite_ouverte",
  "badge_indice", "badge_suspect",
  /* Poses assises, à échelle commune : leur pose debout figurait sur la
     même planche, ce qui a permis de mesurer le facteur au lieu de le
     deviner. Teo et Charles s'en servent déjà ; les sept autres
     attendent les places génériques de l'appartement. */
  "assis_teo", "assis_charles", "assis_gabi", "assis_marini", "assis_martin",
  "assis_mathilde", "assis_tristan", "assis_francky", "assis_jojo",
  "assis_kevin", "assis_remy",
];

/* Les dix poses de chaque champion au bar, dans l'ordre où elles
   s'enchaînent. Deux planches séparées — une par personnage — parce que
   les mettre côte à côte avait déjà fait glisser un Thibaut en polo
   vert dans la rangée de PF, deux fois. */
/* Quatorze poses depuis la v6.23 : la marche a quatre temps au lieu de
   deux, la course en a deux, et la descente se joue en quatre gestes —
   il attrape, il tient, il boit, il repose le verre vide. */
const POSES_BAR = ["idle", "marche1", "marche2", "marche3", "marche4",
                   "course1", "course2", "frein",
                   "attrape", "tient", "boit", "vide", "jette", "titube"];
const PREFIXES_BAR = ["bar_th", "bar_pf"];

/* ---------- niveau 4 : la ruelle ----------
   Treize images par ennemi : six de course, quatre d'impact, deux de
   chute et une au sol. Toutes découpées dans la même planche, donc même
   taille d'image et pieds sur la même ligne. */
const POSES_ENNEMI = ["run1", "run2", "run3", "run4", "run5", "run6",
                      "hit_torse", "hit_epaule", "hit_jambe", "hit_tete",
                      "chute1", "chute2", "sol"];
const ENNEMIS_RUELLE = ["costaud"];
/* Les deux héros derrière la barricade, vus de dos. Thibaut a douze
   poses, PF onze : leurs planches n'en donnaient pas autant, et rien
   n'oblige deux personnages à avoir le même nombre d'images. */
const POSES_RUEL_TH = ["accroupi", "leve1", "leve2", "debout", "arme1", "arme2",
                       "vise1", "vise2", "tir", "recul1", "recul2", "baisse"];
const POSES_RUEL_PF = ["accroupi", "leve1", "leve2", "arme1", "arme2", "vise",
                       "tir", "fumee", "recul1", "recul2", "baisse"];
const IMAGES_NIVEAU4 = ["ruelle"]
  .concat(ENNEMIS_RUELLE.flatMap(e => POSES_ENNEMI.map(po => "enn_" + e + "_" + po)))
  .concat(POSES_RUEL_TH.map(po => "ruel_th_" + po))
  .concat(POSES_RUEL_PF.map(po => "ruel_pf_" + po));

const IMAGES_NIVEAU3 = [
  "fond_bar",
  /* Les poses de barman sont TOUTES découpées dans la même bande de la
     même planche : même hauteur en pixels, même trait de coupe au
     niveau de la ceinture. C'est ce qui garantit qu'à hauteur d'écran
     constante le personnage garde sa taille et que son buste tombe pile
     sur le comptoir. Voir MEMOIRE.md, « Un sprite n'a pas de taille,
     il a une échelle ». */
  "bar_francky_idle", "bar_francky_choisit", "bar_francky_dose", "bar_francky_verse",
  "bar_francky_shake", "bar_francky_remplit", "bar_francky_decore", "bar_francky_sert",
  "bar_francky_essuie",
  "bar_jojo_idle", "bar_jojo_choisit", "bar_jojo_dose", "bar_jojo_verse",
  "bar_jojo_superpose", "bar_jojo_serie", "bar_jojo_decore", "bar_jojo_essuie",
  "bar_cocktail", "bar_jager", "bar_eau",
  /* les habitués animés, et le passage d'Hortense */
  "bar_marini_idle", "bar_marini_marche1", "bar_marini_marche2",
  "bar_marini_attrape", "bar_marini_boit", "bar_marini_vide",
  "bar_gabi_idle", "bar_gabi_marche1", "bar_gabi_marche2",
  "bar_gabi_attrape", "bar_gabi_boit", "bar_gabi_vide",
  "bar_martin_idle", "bar_martin_marche1", "bar_martin_marche2",
  "bar_mathilde_idle", "bar_mathilde_marche1", "bar_mathilde_marche2",
  "bar_mathilde_attrape", "bar_mathilde_boit", "bar_mathilde_vide",
  "bar_charles_idle", "bar_charles_marche1", "bar_charles_marche2",
  "bar_charles_attrape", "bar_charles_boit", "bar_charles_vide",
  "bar_tristan_idle", "bar_tristan_marche1", "bar_tristan_marche2",
  "bar_tristan_attrape", "bar_tristan_boit", "bar_tristan_vide",
  "bar_teo_idle", "bar_teo_marche1", "bar_teo_marche2",
  "bar_teo_attrape", "bar_teo_boit", "bar_teo_vide",
  "bar_solene_idle", "bar_solene_marche1", "bar_solene_marche2",
  "bar_solene_attrape", "bar_solene_boit", "bar_solene_vide",
  "bar_kevin_idle", "bar_kevin_marche1", "bar_kevin_marche2",
  "bar_kevin_attrape", "bar_kevin_boit", "bar_kevin_vide",
  "bar_remy_idle", "bar_remy_marche1", "bar_remy_marche2",
  "bar_remy_attrape", "bar_remy_boit", "bar_remy_vide",
  "bar_hortense_marche1", "bar_hortense_marche2", "bar_hortense_tarte",
].concat(PREFIXES_BAR.flatMap(pr => POSES_BAR.map(po => pr + "_" + po)));

/* ---------- où vit chaque image ----------
   img/ est rangé par niveau : commun/ pour ce qui sert partout, n1/,
   n2/, n3/ pour ce qui n'appartient qu'à un niveau. Le classement est
   déclaré ICI, une seule fois ; le chargeur et la suite de tests le
   lisent tous les deux — un fichier déplacé sans mise à jour se voit
   au premier lancement. */
const IMG_PAR_DOSSIER = {
  commun: ["logo", "face_thibaut", "face_pierre"]
    .concat(EFFETS, SPRITES_HORTENSE, SPRITES_TARTE, PERSONNAGES_MAISON),
  n1: MOMENTS.map(m => m.fond)
    /* SPRITES_PNJ liste des IDENTITÉS ; ce qui se charge, ce sont leurs
       poses. Les habitants debout font la queue mais vivent dans
       commun/, on les écarte ici. */
    .concat(SPRITES_PNJ.filter(n => PERSONNAGES_MAISON.indexOf(n) < 0)
      .flatMap(n => POSES_PNJ.map(po => n + "_" + po)))
    .concat(["thibaut", "pierre"].flatMap(h => POSES_HEROS.map(p => h + "_" + p))),
  n2: IMAGES_NIVEAU2,
  n3: IMAGES_NIVEAU3,
  n4: IMAGES_NIVEAU4,
};
const IMG_CHEMIN = {};
for (const d of Object.keys(IMG_PAR_DOSSIER))
  for (const n of IMG_PAR_DOSSIER[d]) IMG_CHEMIN[n] = d;

function cheminImage(nom){
  return "img/" + (IMG_CHEMIN[nom] || "commun") + "/" + nom + ".webp";
}

function listeImages(){
  return [].concat(...Object.values(IMG_PAR_DOSSIER));
}

/* Les bras tendus des PNJ sont dessinés, pas photographiés : la
   planche ne fournit qu'une seule main tendue générique et l'employer
   pour les seize aurait changé le personnage en pleine file. On relève
   donc, une fois pour toutes, la couleur de peau et celle de la manche
   de chaque sprite pour peindre un bras au bon coloris. */
/* releverTeintes() a été supprimée en v6.15 : elle relevait la couleur
   de peau et de manche de chaque sprite pour PEINDRE le bras qui se
   tend. Tous les bras sont dessinés maintenant. Voir MEMOIRE.md. */


function ancreDe(nom){
  /* L'ancrage horizontal était RELEVÉ sur le sprite, en cherchant le
     milieu des chaussures. Le pipeline de découpe canonique le garantit
     désormais : le centre des pieds est au milieu de l'image. C'est donc
     0,5 par construction, pour tout le monde. */
  void nom;
  return 0.5;
}

/* Ce qu'il faut avoir en main pour afficher l'écran titre et jouer le
   niveau 1 : le commun, le décor et les gens de la file, plus les trois
   vignettes et le fond du titre. Le reste — l'appartement et le bar —
   arrive en tâche de fond pendant qu'on choisit. */
function imagesEssentielles(){
  return IMG_PAR_DOSSIER.commun
    .concat(IMG_PAR_DOSSIER.n1)
    .concat(["fond_bar", "pizza_boite_ouverte", "bar_cocktail"]);
}
function imagesDifferees(){
  const dejà = new Set(imagesEssentielles());
  return listeImages().filter(n => !dejà.has(n));
}
/* Un dossier est-il complètement en main ? demarrer() s'en sert pour
   savoir s'il peut lancer le niveau tout de suite. */
function dossierPret(cle){
  const l = IMG_PAR_DOSSIER[cle] || [];
  return l.every(n => Images.table[n] && Images.table[n].naturalWidth);
}

function charger(noms, surAvance){
  let faits = 0;
  return Promise.all(noms.map(nom => new Promise(resoudre => {
    const img = new Image();
    img.onload = () => {
      Images.table[nom] = img;
      /* Plus de relevé de teintes : tous les bras sont dessinés. */
      faits++; if (surAvance) surAvance(faits / noms.length); resoudre();
    };
    img.onerror = () => { faits++; if (surAvance) surAvance(faits / noms.length); resoudre(); };
    /* Le numéro de version suit l'adresse : les images ont changé de
       définition et de prénom sans changer de nom de fichier, et Safari
       aurait resservi les anciennes depuis son cache — boutons neufs sur
       sprites périmés. */
    img.src = cheminImage(nom) + "?v=" + VERSION;
  })));
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
