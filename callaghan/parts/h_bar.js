"use strict";
/* ============================================================
   NIVEAU 3 — LA TOURNÉE DU D'TOUR
   Un seul héros au choix, un très long comptoir, deux barmans.
   Francky pose des cocktails, Jojo des Jägerbombs, les deux
   glissent parfois un verre d'eau. On court, on identifie, on
   BOIT ou on JETTE — et on repart aussitôt.

   Tout le temps passe par pas(dt), jamais par setTimeout.
   ============================================================ */

/* ---------- réglages ---------- */
const BAR_COPIES = 3;               /* le monde = trois fois le fond mis bout à bout : un seul grand bar */
const BAR_SOL = 0.965;              /* ligne de sol du joueur, en fraction de la hauteur du fond */
const BAR_COMPTOIR = 0.555;         /* le plateau du comptoir, mesuré sur le fond (bois clair : 0.55-0.57) */
const BAR_TAILLE_HEROS = 0.52;      /* hauteur du héros, en fraction de l'écran */
const BAR_TAILLE_BARMAN = 0.34;     /* hauteur du buste des barmans (tête -> ceinture) */
const BAR_PORTEE = 0.030;           /* portée de prise d'un verre, en fraction du monde */
const BAR_MARCHE = 0.135;           /* fraction du monde parcourue par seconde, à vitesse 1.0 */
const BAR_EXPIRE = [7.5, 5.2];      /* vie d'un verre posé : début, puis en plein coup de feu */
const BAR_AMBIANCE_BUT = 100;
/* L'affiche du niveau, avant la première image. 3,2 s : assez pour la
   regarder, assez court pour ne pas peser au deuxième essai — et une
   tape la passe de toute façon. */
const BAR_INTRO_DUREE = 3.2;
const BAR_INTRO_PALIER = 0.35;
const BAR_AMBIANCE_DEBUT = 35;      /* on commence à mi-pente : il y a de quoi monter ET de quoi tomber */
const BAR_AMBIANCE_FUITE = 0.35;    /* la salle se lasse toute seule, par seconde */
const BAR_AMBIANCE_GAIN = 8;        /* ce que rapporte une bonne décision */
const BAR_DUREE = 150;              /* la soirée dure deux minutes trente */
const BAR_SUR_LE_COUP = 1.6;        /* servi et bu dans la seconde et demie : prime */
const BAR_PRIME_COUP = 50;
const BAR_MULT_MAX = 5;             /* le multiplicateur de combo plafonne */
const BAR_COUP_DE_FEU_A = 70;       /* le coup de feu part vers 70 s */
const BAR_COUP_DE_FEU_DUREE = 20;
const BAR_TOURNEE_FINALE = 5;       /* décisions à réussir pour conclure */
const BAR_DEBORDE = 5;              /* verres qui traînent avant que le bar déborde */
const BAR_POMPETTE_VERRES = 3;      /* verres bus coup sur coup... */
const BAR_POMPETTE_FENETRE = 9;     /* ...en moins de neuf secondes... */
const BAR_POMPETTE_DUREE = 5;       /* ...et on titube cinq secondes */
/* Deux poses de course seulement : il faut donc que le RESTE bouge. La
   cadence, le sursaut et l'inclinaison font le travail que deux images
   ne peuvent pas faire seules. */
const BAR_CADENCE_COURSE = 0.56;   /* 2,8 cycles/s, la foulée d'un coureur */
const BAR_SAUT_COURSE = 0.020;     /* amplitude du sursaut, en hauteur d'écran */
const BAR_PENCHE_COURSE = 0.055;   /* inclinaison vers l'avant, en radians */
const BAR_POMPETTE_FREIN = 0.55;    /* la vitesse qu'il reste quand on titube */

/* Les deux champions. Les chiffres viennent de la commande : PF boit
   vite mais court lentement, Thibaut l'inverse. Aucun des deux ne doit
   être objectivement meilleur — c'est ce que le test d'équilibre
   surveille. */
const BAR_CHAMPIONS = [
  { heros:1, nom:"THIBAUT", prefixe:"bar_th", vitesse:1.00, boire:1.00,
    jauges:{ vitesse:5, descente:3 },
    devise:"Rapide. Mais quand il boit, il ne fait que ça." },
  { heros:0, nom:"PF", prefixe:"bar_pf", vitesse:0.82, boire:0.65,
    jauges:{ vitesse:3, descente:5 },
    devise:"Lent. Mais redoutable une fois au comptoir." },
];
/* Les dix poses viennent d'une planche par personnage : on les nomme
   par composition, jamais en dur — une pose ajoutée se branche en un
   seul endroit. */
function poseBar(champion, pose){ return champion.prefixe + "_" + pose; }

/* Les habitués. Ils ne sont là que pour vivre — mais un verre qui
   traîne trop longtemps sous leur nez finit dans leur main. Ils ne
   touchent JAMAIS un verre d'eau : personne ne vole de l'eau, et ça
   devient un indice — un verre que personne ne chipe est suspect. */
/* Les habitués. `prefixe` déclare une planche, `gestes` dit si cette
   planche sait attraper et boire. Sans planche, la silhouette suffit :
   poseClient() se rabat proprement, et le jour où une planche arrive il
   n'y a qu'une ligne à changer. */
const BAR_CLIENTS = [
  { id:"gabi", sprite:"pers_gabi", nom:"GABI", taille:0.88,
    prefixe:"bar_gabi", gestes:true },
  { id:"marini", sprite:"pers_marini", nom:"LE MAIRE", taille:0.84,
    prefixe:"bar_marini", gestes:true },
  { id:"martin", sprite:"pers_martin", nom:"MARTIN", taille:0.92,
    prefixe:"bar_martin", gestes:false },
  { id:"mathilde", sprite:"pers_mathilde", nom:"MATHILDE", taille:0.88,
    prefixe:"bar_mathilde", gestes:true },
  /* Charles ne pouvait pas marcher : son sprite du niveau 2 est assis à
     la table, sans jambes. Sa planche lui en a donné — il descend donc
     au bar, lunettes noires comprises. */
  { id:"charles", sprite:"bar_charles_idle", nom:"CHARLES", taille:0.90,
    prefixe:"bar_charles", gestes:true },
  /* Tristan n'a pas de sprite d'appartement : il n'existe qu'au bar,
     donc sa silhouette de repli est sa propre pose de repos. */
  { id:"tristan", sprite:"bar_tristan_idle", nom:"TRISTAN", taille:0.92,
    prefixe:"bar_tristan", gestes:true },
  /* Teo se lève enfin : sa planche en pied lui rend des jambes. Son
     sprite assis reste pour le canapé du niveau 2. */
  { id:"teo", sprite:"bar_teo_idle", nom:"TEOPEDO", taille:0.94,
    prefixe:"bar_teo", gestes:true },
  { id:"solene", sprite:"bar_solene_idle", nom:"SOLÈNE", taille:0.88,
    prefixe:"bar_solene", gestes:true },
  { id:"kevin", sprite:"bar_kevin_idle", nom:"KEVIN", taille:0.94,
    prefixe:"bar_kevin", gestes:true },
  { id:"remy", sprite:"bar_remy_idle", nom:"RÉMY", taille:0.93,
    prefixe:"bar_remy", gestes:true },
];
const BAR_ESQUIVE_FENETRE = 0.62;   /* même fenêtre qu'au niveau 2 : un pouce, pas une souris */
const BAR_ESQUIVE_PTS = 200;
const BAR_TARTE_CHANCE = 0.55;      /* une visite sur deux finit par un lancer */
const BAR_CLIENT_SEUIL = 0.55;      /* un verre entamé à plus de 55 % de sa vie est chipable */

/* Les boissons. `bonne` dit s'il faut la boire ; l'eau se jette. */
const BOISSONS = {
  cocktail:{ sprite:"bar_cocktail", nom:"COCKTAIL",  bonne:true,  points:100 },
  jager:   { sprite:"bar_jager",    nom:"JÄGERBOMB", bonne:true,  points:120 },
  eau:     { sprite:"bar_eau",      nom:"EAU",       bonne:false, points:150 },
};

/* Les deux barmans : leur poste, leur spécialité, et la petite
   chorégraphie qui TÉLÉGRAPHIE ce qui arrive. Un bon joueur lit le
   geste avant que le verre soit posé. L'eau a sa préparation à part,
   plus posée — c'est l'indice. */
const BARMANS = [
  /* Les postes sont revenus à 0,24 et 0,76 : le décor est le même fond
     répété trois fois, et ces deux valeurs tombent en face des étagères
     à bouteilles. À 0,34 et 0,66 ils se retrouvaient au BORD d'une
     copie, devant les toilettes et le frigo — techniquement visibles,
     visuellement faux. Ce qu'on voit hors champ est traité par les
     chevrons de bord, pas en déplaçant les gens. */
  /* LE COMPTOIR N'EST PAS HORIZONTAL. Mesuré sur le fond, par le plus
     fort gradient vertical : son arête est à 0,538 sous Francky et à
     0,610 sous Jojo — sept centièmes de hauteur d'écran d'écart. Une
     constante unique à 0,555 laissait donc Jojo flotter au-dessus de son
     comptoir, ce qui se voyait tout de suite et ne s'expliquait pas.
     Chaque poste porte désormais SA ligne. */
  { id:"francky", nom:"FRANCKY", x:0.24, comptoir:0.538, sert:"cocktail",
    poses:{ repos:"bar_francky_idle", eau:"bar_francky_essuie", sert:"bar_francky_sert" },
    /* cinq temps : il choisit, il dose, il verse, il shake, il remplit,
       il décore. Plus la séquence est longue, plus le joueur a le temps
       de LIRE ce qui arrive — c'est là que se gagne le niveau. */
    prepare:["bar_francky_choisit", "bar_francky_dose", "bar_francky_verse",
             "bar_francky_shake", "bar_francky_remplit", "bar_francky_decore"] },
  { id:"jojo", nom:"JOJO", x:0.76, comptoir:0.610, sert:"jager",
    poses:{ repos:"bar_jojo_idle", eau:"bar_jojo_essuie", sert:"bar_jojo_serie" },
    /* quatre temps : il choisit, il dose, il verse, il superpose. Un peu
       plus court que Francky, et cette différence de RYTHME est en soi
       une information — on reconnaît le barman avant de voir ce qu'il
       tient. */
    prepare:["bar_jojo_choisit", "bar_jojo_dose", "bar_jojo_verse", "bar_jojo_superpose"] },
];

const ETAT_VERRE = { PREPARE:"PREPARE", POSE:"POSE", PRIS:"PRIS", TRAINE:"TRAINE" };

const Tournee = {
  actif:false, champion:null, choixChamp:0, enChoix:false,
  x:0.5, dir:1, marche:0, foulee:0, boitT:0, jetteT:0, action:null,
  verres:[], barmans:[], ambiance:0, combo:0, meilleurCombo:0,
  coupDeFeu:false, coupT:0, finale:false, finaleReste:0,
  stats:null, fini:null, message:null, messageT:0, messageDuree:1.6,
  gele:0, secousse:0, invite:null, prochainClin:0,
  bus:[], bourre:0, deborde:false,
  clients:[], prochainClient:0, introT:0, introSortie:false, flash:0, boitTotal:1, freinT:0, dureeMarche:0,
  tarte:null, esquiveOuverte:false, tarteEsquivee:0, tarteRecue:0,
  restant:BAR_DUREE,

  /* --------- montage --------- */
  monter(){
    /* L'AFFICHE VIENT AVANT LE CHOIX. Posée après, elle interrompait le
       joueur juste après qu'il avait décidé — le pire moment. Avant, elle
       fait ce qu'une affiche doit faire : présenter le lieu, puis laisser
       entrer. C'est l'ordre du niveau 4, et il n'y a pas de raison qu'il
       diffère ici. */
    this.introT = BAR_INTRO_DUREE;
    this.introSortie = false;
    this.enChoix = false;      /* le choix n'ouvre qu'après l'affiche */
    this.choixChamp = 0;
    this.champion = null;
    this.fini = null;
    this.actif = false;
  },

  /* L'affiche se passe d'une tape, mais pas trop vite : le même quart de
     seconde que la ruelle, sinon un doigt encore posé de l'écran
     précédent l'emporte sans qu'on l'ait vue. */
  passerIntro(){
    if (this.introT <= 0) return false;
    if (BAR_INTRO_DUREE - this.introT < 0.25) return true;
    this.introSortie = true;
    if (this.introT > BAR_INTRO_PALIER) this.introT = BAR_INTRO_PALIER;
    return true;
  },

  choisir(k){
    this.choixChamp = (k + BAR_CHAMPIONS.length) % BAR_CHAMPIONS.length;
    Sons.clic();
  },

  lancer(){
    this.champion = BAR_CHAMPIONS[this.choixChamp];
    this.enChoix = false;
    this.actif = true;
    this.x = 0.5; this.dir = 1; this.marche = 0; this.foulee = 0;
    this.boitT = 0; this.jetteT = 0; this.action = null;
    this.verres = [];
    this.combo = 0; this.meilleurCombo = 0;
    this.coupDeFeu = false; this.coupT = 0; this.coupFait = false;
    this.finale = false; this.finaleReste = 0;
    this.temps = 0; this.gele = 0; this.secousse = 0;
    this.message = null; this.invite = null;
    this.prochainClin = hasard(14, 26);
    this.bus = []; this.bourre = 0; this.deborde = false;
    this.clients = []; this.prochainClient = hasard(8, 14);
    this.composerFoule();
    this.flash = 0; this.boitTotal = 1; this.freinT = 0; this.dureeMarche = 0;
    this.tarte = null; this.esquiveOuverte = false;
    this.tarteEsquivee = 0; this.tarteRecue = 0;
    this.restant = BAR_DUREE;
    this.ambiance = BAR_AMBIANCE_DEBUT;
    this.stats = { cocktails:0, jagers:0, eauxJetees:0, eauxBues:0, sacrileges:0, rates:0,
                   chipes:0, debarrasses:0, primes:0 };
    this.barmans = BARMANS.map(b => ({
      ref:b, etat:"repos", t:0, prochaine:0, pose:b.poses.repos, type:null,
    }));
    this.barmans[0].prochaine = 1.6;
    this.barmans[1].prochaine = 5.5;
    Sons.reveiller();
  },

  dire(txt, duree){ this.message = txt; this.messageT = 0; this.messageDuree = duree || 1.6; },

  /* Le tempo sert à DEUX choses : la musique, et le clignotement des
     néons du comptoir. Une seule source, sinon l'image et le son
     partent en désaccord. */
  tempo(){ return this.finale ? 126 : this.coupDeFeu ? 118 : 96; },

  /* La pose du champion se DÉDUIT de l'état, elle n'est jamais posée à
     la main : le geste de boire est une seule minuterie (boitT) dont on
     lit l'avancement, donc l'image ne peut pas se désynchroniser de la
     mécanique. */
  pose(){
    if (this.boitT > 0 && this.boitTotal > 0){
      const p = 1 - this.boitT / this.boitTotal;
      if (this.action === "jette") return p < 0.35 ? "attrape" : "jette";
      /* quatre temps : il attrape, il regarde ce qu'il tient, il boit,
         il reste avec le verre vide. C'est ce dernier temps qui donne
         son poids à la descente de Thibaut. */
      return p < 0.18 ? "attrape" : p < 0.36 ? "tient" : p < 0.78 ? "boit" : "vide";
    }
    if (this.bourre > 0) return "titube";
    if (this.freinT > 0) return "frein";
    if (this.marche !== 0){
      /* LA CADENCE, mesurée et corrigée. `foulee` grandit de 10 par
         seconde. L'ancien facteur 1,4 faisait changer de pose 14 fois par
         seconde, soit SEPT cycles de course — presque trois fois une
         vraie foulée. Deux images qui ne diffèrent que de 5 % alternées
         quatorze fois par seconde ne se lisent pas comme une course :
         elles se lisent comme une vibration, donc comme du figé. C'est
         exactement ce qui était signalé.

         0,56 donne 2,8 cycles par seconde, ce qui est la cadence d'un
         homme qui court. La marche à 0,9 sur quatre poses donne 2,25
         cycles : elle allait déjà bien, on n'y touche pas. */
      if (this.dureeMarche > 0.6) return (Math.floor(this.foulee * BAR_CADENCE_COURSE) % 2) ? "course2" : "course1";
      return "marche" + (1 + Math.floor(this.foulee * 0.9) % 4);
    }
    return "idle";
  },

  vitesseEffective(){
    return this.champion.vitesse * (this.bourre > 0 ? BAR_POMPETTE_FREIN : 1);
  },

  /* --------- ce que le pattern a le droit de servir ----------
     On ne pose JAMAIS un verre injouable : le temps d'aller le
     chercher — distance à la vitesse du champion, plus le geste de
     boire — doit tenir dans la vie du verre, avec une marge. C'est le
     garde-fou demandé : difficile, oui ; impossible, jamais. */
  faisable(x, dejaPoses){
    const c = this.champion;
    const vit = BAR_MARCHE * this.vitesseEffective();
    const vie = this.coupDeFeu ? BAR_EXPIRE[1] : BAR_EXPIRE[0];
    let cout = Math.abs(x - this.x) / vit;
    for (const v of dejaPoses){
      cout += Math.abs(x - v.x) / vit + 1.15 * c.boire;
    }
    return cout + 1.15 * c.boire < vie * 0.9;
  },

  nbSimultanes(){
    if (this.finale) return 2;
    if (this.coupDeFeu) return 3;
    if (this.temps > 45) return 2;
    return 1;
  },

  /* Le barman choisit quoi préparer. L'eau n'apparaît qu'après 25 s,
     puis une fois sur quatre environ. */
  servirQuoi(b){
    if (this.temps > 25 && Math.random() < 0.26) return "eau";
    return b.ref.sert;
  },

  majBarman(b, dt){
    b.t += dt;
    const enJeu = this.verres.filter(v => v.etat === ETAT_VERRE.POSE || v.etat === ETAT_VERRE.PREPARE);
    if (b.etat === "repos"){
      b.prochaine -= dt * (this.coupDeFeu ? 2.1 : 1) * (this.finale ? 2.4 : 1);
      if (b.prochaine > 0 || enJeu.length >= this.nbSimultanes()) return;
      /* où poser : devant soi, avec un peu de jeu */
      const x = borne(b.ref.x + hasard(-0.10, 0.10), 0.06, 0.94);
      if (!this.faisable(x, enJeu.filter(v => v.etat === ETAT_VERRE.POSE))) { b.prochaine = 0.7; return; }
      b.type = this.servirQuoi(b);
      b.etat = "prepare"; b.t = 0; b.xPose = x;
      b.duree = (b.type === "eau" ? 1.35 : hasard(1.5, 2.1)) / (this.coupDeFeu ? 1.35 : 1);
      return;
    }
    if (b.etat === "prepare"){
      /* la pose télégraphie : shake pour un cocktail, shot pour un
         Jägerbomb, chiffon tranquille pour l'eau */
      const seq = b.type === "eau" ? [b.ref.poses.eau] : b.ref.prepare;
      b.pose = seq[Math.min(seq.length - 1, Math.floor(b.t / b.duree * seq.length))];
      if (b.t < b.duree) return;
      /* CLAC : le verre est posé */
      this.verres.push({
        type:b.type, x:b.xPose, etat:ETAT_VERRE.POSE, t:0,
        vie:this.coupDeFeu ? BAR_EXPIRE[1] : BAR_EXPIRE[0],
        barman:b.ref.id,
      });
      Sons.verrePose();
      b.etat = "sert"; b.pose = b.ref.poses.sert; b.t = 0;
      return;
    }
    if (b.etat === "sert"){
      if (b.t < 0.55) return;
      b.etat = "repos"; b.pose = b.ref.poses.repos;
      b.prochaine = this.finale ? hasard(0.7, 1.3)
                  : this.coupDeFeu ? hasard(1.2, 2.4)
                  : this.temps < 20 ? hasard(3.4, 5.2)
                  : hasard(2.2, 4.0);
    }
  },

  /* --------- le joueur --------- */
  marcher(d){
    if (!this.actif || this.fini) return;
    if (this.boitT > 0) return;           /* boire immobilise — c'est la faiblesse de Thibaut */
    /* s'arrêter net après un sprint laisse une trace : la pose de
       freinage existe, autant qu'elle serve */
    if (d === 0 && this.marche !== 0 && this.dureeMarche > 0.45) this.freinT = 0.20;
    if (d !== this.marche) this.dureeMarche = 0;
    this.marche = d;
  },

  verreAPortee(){
    /* les verres frais d'abord ; à défaut, une traîne à débarrasser */
    for (const etat of [ETAT_VERRE.POSE, ETAT_VERRE.TRAINE]){
      let m = -1, dmin = BAR_PORTEE;
      for (let i = 0; i < this.verres.length; i++){
        const v = this.verres[i];
        if (v.etat !== etat) continue;
        const d = Math.abs(v.x - this.x);
        if (d < dmin){ dmin = d; m = i; }
      }
      if (m >= 0) return m;
    }
    return -1;
  },

  boire(){
    /* Une tarte en vol passe devant tout : le geste utile n'est plus de
       boire. Même règle qu'au niveau 2, et le bouton dédié reste là. */
    if (this.esquiveOuverte) return this.esquiver();
    return this.decider(true);
  },
  jeter(){ return this.decider(false); },

  decider(boit){
    if (!this.actif || this.fini || this.boitT > 0) return false;
    const i = this.verreAPortee();
    if (i < 0){ this.dire("PAS DE VERRE ICI", 1.0); return false; }
    const v = this.verres[i];
    const B = BOISSONS[v.type];
    const trainait = v.etat === ETAT_VERRE.TRAINE;
    v.etat = ETAT_VERRE.PRIS;
    this.marche = 0;
    const c = this.champion;

    if (trainait){
      /* un verre qui traîne : le jeter débarrasse, le boire déçoit */
      if (boit){
        this.boitTotal = this.boitT = 1.15 * c.boire;
        this.action = "boit";
        this.dire("ÉVENTÉ…", 1.2);
        Sons.bip(240, 0.25, "sine", 0.10, 190);
      } else {
        this.boitTotal = this.boitT = 0.55;
        this.action = "jette";
        Score.points += 10;
        this.stats.debarrasses++;
        this.dire("DÉBARRASSÉ  +10", 1.0);
        Sons.clic();
      }
      return true;
    }

    if (boit && B.bonne){
      /* la bonne boisson, bue : la durée du geste dépend du champion */
      this.boitTotal = this.boitT = 1.15 * c.boire;
      this.action = "boit";
      this.combo++;
      this.meilleurCombo = Math.max(this.meilleurCombo, this.combo);
      const mult = Math.min(BAR_MULT_MAX, 1 + Math.floor(this.combo / 3));
      let gain = B.points * mult;
      /* prime de vitesse : pris presque au CLAC. C'est ce qui récompense
         la lecture des barmans plutôt que le sprint à l'aveugle. */
      const surLeCoup = v.t <= BAR_SUR_LE_COUP;
      if (surLeCoup){ gain += BAR_PRIME_COUP; this.stats.primes++; }
      Score.points += gain;
      this.ambiance = Math.min(BAR_AMBIANCE_BUT, this.ambiance + (this.finale ? 0 : BAR_AMBIANCE_GAIN));
      if (v.type === "cocktail") this.stats.cocktails++; else this.stats.jagers++;
      this.flash = 0.22;
      this.dire((surLeCoup ? "SUR LE COUP !  +" : "PARFAIT !  +") + gain, 1.1);
      Sons.reussite(Math.min(7, this.combo));
      /* la gorgée compte : trois verres coup sur coup, et on titube */
      this.bus.push(this.temps);
      if (this.bus.length > BAR_POMPETTE_VERRES) this.bus.shift();
      if (this.bus.length === BAR_POMPETTE_VERRES &&
          this.temps - this.bus[0] < BAR_POMPETTE_FENETRE){
        this.bourre = BAR_POMPETTE_DUREE;
        this.bus = [];
        this.dire("POMPETTE !", 2.0);
        Sons.bip(520, 0.3, "triangle", 0.14, 360);
      }
      if (this.finale) this.avancerFinale();
      return true;
    }
    if (!boit && !B.bonne){
      /* l'eau, jetée : le réflexe du soir */
      this.boitTotal = this.boitT = 0.55;
      this.action = "jette";
      this.combo++;
      this.meilleurCombo = Math.max(this.meilleurCombo, this.combo);
      Score.points += B.points;
      this.ambiance = Math.min(BAR_AMBIANCE_BUT, this.ambiance + (this.finale ? 0 : BAR_AMBIANCE_GAIN));
      this.stats.eauxJetees++;
      this.flash = 0.18;
      this.dire("PAS DUPE !  +" + B.points, 1.1);
      Sons.tarteEsquive();
      if (this.finale) this.avancerFinale();
      return true;
    }
    if (boit && !B.bonne){
      /* il a bu l'eau. Silence. */
      this.boitTotal = this.boitT = 1.15 * c.boire;
      this.action = "boit";
      this.combo = 0;
      this.gele = 0.35;
      this.secousse = 0.4;
      this.ambiance = Math.max(0, this.ambiance - 8);
      this.stats.eauxBues++;
      /* la seule vertu de l'eau : elle dessoûle */
      this.dire(this.bourre > 0 ? "DE L'EAU ?! …ÇA DESSOÛLE." : "DE L'EAU ?!", 1.6);
      this.bourre = 0; this.bus = [];
      Sons.bip(180, 0.4, "sine", 0.16, 120);
      if (this.finale) this.raterFinale();
      return true;
    }
    /* il a jeté une bonne boisson : sacrilège */
    this.boitTotal = this.boitT = 0.55;
    this.action = "jette";
    this.combo = 0;
    this.secousse = 0.5;
    this.ambiance = Math.max(0, this.ambiance - 8);
    Score.points = Math.max(0, Score.points - 80);
    this.stats.sacrileges++;
    this.dire("SACRILÈGE !", 1.6);
    Sons.erreur();
    if (this.finale) this.raterFinale();
    return true;
  },

  /* --------- la tarte d'Hortense, au bar aussi ---------
     Elle traverse, s'arrête, montre la tarte — et une fois sur deux
     elle la lance vraiment. La fenêtre d'esquive est la même qu'au
     niveau 2 ; le bouton ESQUIVER, lui, s'allume dès qu'une tarte
     existe, pas seulement pendant la fenêtre : on doit pouvoir se
     préparer. */
  lancerTarte(){
    const iv = this.invite;
    if (!iv || iv.qui !== "hortense" || this.tarte) return false;
    this.tarte = {
      x:iv.x, y:0.50, x0:iv.x, but:this.x, t:0, rot:0, etat:"vol",
      duree:Math.max(0.85, Math.abs(iv.x - this.x) * 4.2),
    };
    this.esquiveOuverte = false;
    Sons.tarteLancee();
    this.dire("ATTENTION !", 1.0);
    return true;
  },
  resteAvantTarte(){
    const p = this.tarte;
    if (!p) return 1e9;
    return Math.max(0, (1 - Math.min(1, p.t / p.duree)) * p.duree);
  },
  majTarte(dt){
    const p = this.tarte;
    if (!p) return;
    if (p.etat === "fini"){ this.tarte = null; this.esquiveOuverte = false; return; }
    p.t += dt;
    const a = Math.min(1.3, p.t / p.duree);
    const fin = p.but + Math.sign(p.but - p.x0) * 0.04;
    p.x = melange(p.x0, fin, a);
    p.y = 0.50 - Math.sin(Math.PI * Math.min(1, a)) * 0.09 + a * 0.06;
    p.rot += dt * 9;
    this.esquiveOuverte = p.etat === "vol" && this.resteAvantTarte() <= BAR_ESQUIVE_FENETRE;
    if (p.etat === "vol" && a >= 1){ p.etat = "fini"; this.recevoirTarte(); }
    else if (p.etat === "esquivee" && a >= 1.25) p.etat = "fini";
  },
  esquiver(){
    const p = this.tarte;
    if (!p || p.etat !== "vol" || this.resteAvantTarte() > BAR_ESQUIVE_FENETRE) return false;
    p.etat = "esquivee";
    this.esquiveOuverte = false;
    this.tarteEsquivee++;
    Score.points += BAR_ESQUIVE_PTS;
    this.ambiance = Math.min(BAR_AMBIANCE_BUT, this.ambiance + 5);
    this.flash = 0.22;
    this.dire("PAS AUJOURD'HUI !  +" + BAR_ESQUIVE_PTS, 1.4);
    Sons.tarteEsquive();
    return true;
  },
  recevoirTarte(){
    this.tarteRecue++;
    this.combo = 0;
    this.gele = 0.9;
    this.secousse = 0.7;
    this.marche = 0;
    this.ambiance = Math.max(0, this.ambiance - 10);
    this.dire("EN PLEINE POIRE !", 1.8);
    Sons.tarteImpact();
  },

  /* --------- coup de feu et tournée finale --------- */
  avancerFinale(){
    this.finaleReste--;
    if (this.finaleReste <= 0) this.terminer(true);
    else this.dire("ENCORE " + this.finaleReste + " !", 1.2);
  },
  raterFinale(){
    this.finaleReste = BAR_TOURNEE_FINALE;
    this.dire("ON REPREND LA TOURNÉE !", 1.6);
  },

  /* --------- comment la soirée se gagne, et comment elle se perd ---------
     Il manquait une défaite : la jauge ne pouvait que monter et le
     chrono ne servait à rien. Trois issues, désormais :
       - jauge pleine puis la dernière tournée réussie → SOIRÉE VALIDÉE
       - jauge à zéro → le bar s'est vidé, on a perdu la salle
       - temps écoulé sans avoir rempli la jauge → soirée écourtée   */
  terminer(gagne, cause){
    this.fini = { gagne, t:0, cause:cause || (gagne ? "tournee" : "temps") };
    this.actif = false;
    let bonus = this.meilleurCombo * 40;
    if (gagne) bonus += Math.round(this.restant) * 5 + Math.round(this.ambiance);
    this.bonusFin = bonus;
    Score.points += bonus;
    if (gagne) Sons.palier(); else Sons.fin();
    Jeu.phase = "fin";
    Jeu.finChrono = 0;
    Interface.sortirJeu();
  },

  /* --------- boucle --------- */
  pas(dt){
    if (this.fini){ this.fini.t += dt; return; }
    /* L'affiche fige la soirée : rien ne bouge derrière, sinon le
       chronomètre tourne pendant qu'on regarde une image. */
    if (this.introT > 0){
      /* MÊME RÈGLE QU'À LA RUELLE : elle descend jusqu'au palier puis
         attend la tape. Une affiche qui s'efface toute seule pendant
         qu'on la regarde n'est pas une présentation, c'est un délai. */
      if (this.introT > BAR_INTRO_PALIER || this.introSortie){
        this.introT -= dt;
        if (this.introT < 0) this.introT = 0;
      }
      return;
    }
    /* LE CHOIX EST UN ÉTAT DÉDUIT, pas un front. Ouvrir sur la fin de
       l'affiche marchait tant qu'on passait par la décrémentation ; posé
       à zéro autrement, le choix ne s'ouvrait jamais et le pupitre
       s'affichait sur un niveau qu'on n'avait pas encore commencé. */
    if (!this.actif && !this.fini) this.enChoix = true;
    if (this.enChoix || !this.actif) return;
    this.temps += dt;
    this.restant = Math.max(0, BAR_DUREE - this.temps);
    if (this.gele > 0){ this.gele -= dt; this.majTarte(dt); return; }
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 3);
    if (this.freinT > 0) this.freinT = Math.max(0, this.freinT - dt);
    if (this.marche !== 0 && this.boitT <= 0) this.dureeMarche += dt;
    this.secousse = Math.max(0, this.secousse - dt * 2);
    if (this.message){ this.messageT += dt; if (this.messageT > this.messageDuree) this.message = null; }

    /* l'ivresse retombe toute seule */
    if (this.bourre > 0) this.bourre = Math.max(0, this.bourre - dt);

    /* déplacement — boire cloue sur place, l'ivresse freine et fait dériver */
    if (this.boitT > 0){
      this.boitT -= dt;
      if (this.boitT <= 0){ this.action = null; }
    } else if (this.marche !== 0){
      this.x = borne(this.x + this.marche * BAR_MARCHE * this.vitesseEffective() * dt, 0.02, 0.98);
      this.foulee += Math.abs(this.marche) * dt * 10;
      this.dir = this.marche;
    }
    if (this.bourre > 0 && this.boitT <= 0){
      /* les jambes ne suivent plus tout à fait */
      this.x = borne(this.x + Math.sin(this.temps * 2.6) * 0.010 * dt, 0.02, 0.98);
    }

    /* les verres vieillissent — et un verre oublié ne disparaît plus :
       il TRAÎNE sur le comptoir jusqu'à ce qu'on le débarrasse */
    for (const v of this.verres){
      if (v.etat !== ETAT_VERRE.POSE) continue;
      v.t += dt;
      if (v.t > v.vie){
        v.etat = ETAT_VERRE.TRAINE;
        this.combo = 0;
        this.stats.rates++;
        this.ambiance = Math.max(0, this.ambiance - 5);
        this.dire("RATÉ !", 1.2);
        Sons.bip(200, 0.2, "sine", 0.12, 150);
      }
    }
    this.verres = this.verres.filter(v =>
      v.etat === ETAT_VERRE.POSE || v.etat === ETAT_VERRE.TRAINE);

    /* trop de verres qui traînent : le bar déborde et l'ambiance file */
    const nTraine = this.verres.filter(v => v.etat === ETAT_VERRE.TRAINE).length;
    if (nTraine >= BAR_DEBORDE){
      this.ambiance = Math.max(0, this.ambiance - 1.2 * dt);
      if (!this.deborde){ this.deborde = true; this.dire("LE BAR DÉBORDE !", 1.8); Sons.erreur(); }
    } else this.deborde = false;

    for (const b of this.barmans) this.majBarman(b, dt);

    /* le coup de feu, une fois par soirée */
    if (!this.coupFait && this.temps > BAR_COUP_DE_FEU_A){
      this.coupFait = true; this.coupDeFeu = true; this.coupT = 0;
      this.dire("🔥 COUP DE FEU 🔥", 2.2);
      Sons.palier();
    }
    if (this.coupDeFeu){
      this.coupT += dt;
      if (this.coupT > BAR_COUP_DE_FEU_DUREE) this.coupDeFeu = false;
    }

    /* La jauge pleine se lit AVANT la fuite. Dans l'autre ordre, une
       jauge amenée à 100 par une bonne décision redescendait à 99,99 à
       l'image suivante et la dernière tournée ne partait JAMAIS : la
       partie devenait infinie. Ce sont les tests de la finale qui l'ont
       dit, pas la relecture. */
    if (!this.finale && this.ambiance >= BAR_AMBIANCE_BUT){
      this.finale = true;
      this.finaleReste = BAR_TOURNEE_FINALE;
      this.dire("DERNIÈRE TOURNÉE !", 2.4);
      Sons.palier();
    }

    /* La salle se lasse toute seule : sans rien faire, on descend. C'est
       ce qui rend le chrono et la jauge vraiment opposés. */
    if (!this.finale) this.ambiance = Math.max(0, this.ambiance - BAR_AMBIANCE_FUITE * dt);

    /* les deux défaites */
    if (!this.finale && this.ambiance <= 0){ this.terminer(false, "vide"); return; }
    if (!this.finale && this.restant <= 0){ this.terminer(false, "temps"); return; }

    this.majClients(dt);
    this.majFoule(dt);

    /* clins d'œil : Risoto traverse, Hortense passe et regarde */
    this.prochainClin -= dt;
    if (this.prochainClin <= 0 && !this.invite){
      this.prochainClin = hasard(24, 44);
      this.invite = { qui:Math.random() < 0.72 ? "chat" : "hortense",
                      x:-0.06, dir:1, t:0, pause:0, foulee:0, vue:false, jete:false };
    }
    if (this.invite){
      const iv = this.invite;
      iv.t += dt;
      if (iv.qui === "chat"){
        iv.x += iv.dir * dt * 0.16;
      } else {
        /* Hortense traverse, s'arrête au milieu, montre la tarte, et
           repart sans la lancer. C'est la menace qui fait le gag. */
        if (!iv.vue && iv.x >= 0.46){ iv.vue = true; iv.pause = 1.6; }
        if (iv.pause > 0){
          iv.pause -= dt; iv.foulee = iv.foulee || 0;
          /* à la fin de la pause, elle lance — ou pas */
          if (iv.pause <= 0 && !iv.jete){
            iv.jete = true;
            if (Math.random() < BAR_TARTE_CHANCE) this.lancerTarte();
          }
        } else { iv.x += iv.dir * dt * 0.085; iv.foulee = (iv.foulee || 0) + dt * 7; }
      }
      /* elle ne disparaît pas avant que sa tarte ait fini son vol */
      if (iv.x > 1.08 && !this.tarte) this.invite = null;
    }
    this.majTarte(dt);

    Camera.suivreBar(this.x, dt);
  },

  /* --------- les habitués ---------
     Ils entrent par un bord, longent le comptoir, et si un verre traîne
     depuis un moment sous leur nez, ils se servent. Ce n'est pas une
     punition de plus : le verre chipé ne devient pas une traîne — ils
     font le ménage à notre place, mais les points partent avec eux. */
  majClients(dt){
    this.prochainClient -= dt;
    if (this.prochainClient <= 0 && this.clients.length < 2){
      this.prochainClient = hasard(10, 20) / (this.coupDeFeu ? 1.8 : 1);
      const ref = BAR_CLIENTS[Math.floor(Math.random() * BAR_CLIENTS.length)];
      const parGauche = Math.random() < 0.5;
      this.clients.push({
        ref, x:parGauche ? -0.05 : 1.05, dir:parGauche ? 1 : -1,
        etat:"entre", t:0, cible:hasard(0.15, 0.85), verre:null,
        foulee:0, verreEnMain:false,
      });
    }
    for (const cl of this.clients){
      cl.t += dt;
      if (cl.etat === "entre" || cl.etat === "repart") cl.foulee += dt * 7;
      if (cl.etat === "entre"){
        cl.x += cl.dir * dt * 0.075;
        /* un verre chipable en chemin ? on se détourne */
        const i = this.verreChipable(cl.x);
        if (i >= 0){ cl.etat = "prend"; cl.t = 0; cl.verre = this.verres[i]; }
        else if ((cl.dir > 0 && cl.x >= cl.cible) || (cl.dir < 0 && cl.x <= cl.cible)){
          cl.etat = "attend"; cl.t = 0;
        }
        continue;
      }
      if (cl.etat === "attend"){
        const i = this.verreChipable(cl.x);
        if (i >= 0){ cl.etat = "prend"; cl.t = 0; cl.verre = this.verres[i]; }
        else if (cl.t > hasard(2.5, 5)){ cl.etat = "repart"; cl.dir = Math.random() < 0.5 ? 1 : -1; }
        continue;
      }
      if (cl.etat === "prend"){
        if (cl.t < 0.55) continue;
        /* il l'emporte — sauf si le joueur a été plus rapide */
        const k = this.verres.indexOf(cl.verre);
        if (k >= 0 && cl.verre.etat === ETAT_VERRE.POSE){
          this.verres.splice(k, 1);
          cl.verreEnMain = true;
          this.stats.chipes++;
          this.ambiance = Math.min(BAR_AMBIANCE_BUT, this.ambiance + 1);
          this.dire("CHIPÉ PAR " + cl.ref.nom + " !", 1.3);
          Sons.verreChipe();
        }
        cl.verre = null; cl.etat = "repart";
        cl.dir = Math.random() < 0.5 ? 1 : -1;
        continue;
      }
      cl.x += cl.dir * dt * 0.085;
    }
    this.clients = this.clients.filter(cl => cl.x > -0.12 && cl.x < 1.12);
  },

  /* La pose d'un habitué, même règle que pour le champion : elle se
     déduit de l'état. Sans planche, on renvoie la silhouette. */
  poseInvite(){
    const iv = this.invite;
    if (!iv || iv.qui === "chat") return "susp_chat";
    if (iv.pause > 0) return "bar_hortense_tarte";
    return (Math.floor((iv.foulee || 0) * 0.9) % 2) ? "bar_hortense_marche2" : "bar_hortense_marche1";
  },

  poseClient(cl){
    if (!cl.ref.prefixe) return cl.ref.sprite;
    const p = cl.ref.prefixe;
    /* Martin et Mathilde n'ont pas de poses de consommation : ils gardent
       leur air immobile en se servant, ce qui passe très bien. */
    if (cl.etat === "prend") return cl.ref.gestes ? (cl.t < 0.30 ? p + "_attrape" : p + "_boit") : p + "_idle";
    if (cl.etat === "attend") return p + "_idle";
    if (cl.etat === "repart" && cl.verreEnMain && cl.ref.gestes) return p + "_vide";
    return (Math.floor(cl.foulee * 0.9) % 2) ? p + "_marche2" : p + "_marche1";
  },

  /* Un verre à portée du client, assez vieux pour être abandonné — et
     jamais un verre d'eau : personne ne vole de l'eau. */
  verreChipable(x){
    for (let i = 0; i < this.verres.length; i++){
      const v = this.verres[i];
      if (v.etat !== ETAT_VERRE.POSE || v.type === "eau") continue;
      if (v.t < v.vie * BAR_CLIENT_SEUIL) continue;
      if (Math.abs(v.x - x) < BAR_PORTEE * 1.2) return i;
    }
    return -1;
  },
};
