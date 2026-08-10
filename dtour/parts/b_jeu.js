
/* ================= ScoreManager -> Score ================= */
const Score = {
  points:0, combo:0, meilleurCombo:0, saluts:0, fileMax:0, esquives:0, recues:0,

  raz(){
    this.points = 0; this.combo = 0; this.meilleurCombo = 0; this.saluts = 0;
    this.fileMax = 0; this.esquives = 0; this.recues = 0;
  },
  multiplicateur(){ return Math.max(1, this.combo); },
  reussir(bonus){
    this.combo++;
    if (this.combo > this.meilleurCombo) this.meilleurCombo = this.combo;
    this.saluts++;
    const gagne = Math.round(50 * this.multiplicateur() * (bonus || 1));
    this.points += gagne;
    return gagne;
  },
  casser(){ const c = this.combo; this.combo = 0; return c; },
  noterFile(n){ if (n > this.fileMax) this.fileMax = n; },
};

/* ================= NPC ================= */
let compteurPnj = 0;

class Pnj {
  constructor(sprite, type){
    this.id = ++compteurPnj;
    this.sprite = sprite;
    this.etat = ETAT.ENTREE;
    this.place = -1;            /* queuePosition ; -1 tant qu'il n'est pas rangé */
    this.cible = -1;            /* targetHero : 0 Thibaut, 1 Pierre-François */
    this.tReaction = 0;
    this.type = type || "SIMPLE";
    this.x = 0;
    this.vise = 0;
    this.arrive = false;
    this.interaction = false;
    this.bras = 0;              /* extension du bras : 0 le long du corps, 1 main serrée */
    this.chrono = 0;
    this.attente = 0;
    this.regarde = 1;
    this.phase = Math.random() * Math.PI * 2;
    this.doubleReste = 0;
    this.revenant = false;
    this.viseDemande = false;
    this.parti = false;
    this.pas = 0;               /* avancement du cycle de marche */
  }

  get img(){ return Images.table[this.sprite]; }
  get teinte(){ return Images.teintes[this.sprite] || { peau:"#E8B28E", peauOmbre:"#C08F6F", manche:"#2C3550", mancheOmbre:"#1D2439" }; }

  /* Le PNJ ne connaît que lui-même : il avance vers `vise` et change
     d'état quand il y arrive. Toute décision qui regarde les autres
     appartient à Foule. */
  avancer(dt){
    this.phase += dt * 2.2;
    switch (this.etat){
      case ETAT.ENTREE:
      case ETAT.MARCHE: {
        const v = VIT_MARCHE * Difficulte.facteurVitesse;
        const reste = this.vise - this.x;
        const pas = Math.sign(reste) * Math.min(Math.abs(reste), v * dt);
        this.x += pas;
        this.pas += Math.abs(pas) * 0.09;
        this.regarde = 1;
        if (Math.abs(this.vise - this.x) < 0.6){
          this.x = this.vise;
          if (this.viseDemande){ this.viseDemande = false; Foule.ouvrirDemande(this); }
          else Foule.ranger(this);
        }
        break;
      }
      case ETAT.DEMANDE: {
        this.attente += dt;
        this.bras = Math.min(BRAS_TENDU, this.bras + dt * 7);
        this.chrono -= dt;
        if (this.chrono <= 0) Jeu.rater(this, "lent");
        break;
      }
      case ETAT.POIGNEE: {
        this.chrono -= dt;
        this.bras = 1;
        if (this.chrono <= 0){
          if (this.doubleReste > 0){
            this.doubleReste--;
            this.cible = 1 - this.cible;
            this.vise = xSalut(this.cible);
            this.viseDemande = true;
            this.etat = ETAT.MARCHE;
            this.bras = 0;
          }
          else Foule.reprendre(this);
        }
        break;
      }
      case ETAT.MALAISE: {
        this.chrono -= dt;
        this.bras = Math.max(0, this.bras - dt * 1.15);
        if (this.chrono <= 0) Foule.reprendre(this);
        break;
      }
      case ETAT.ATTENTE:
        this.bras = Math.max(0, this.bras - dt * 3);
        this.regarde = -1;      /* rangé dans la file, on regarde le bar */
        break;
      case ETAT.REPOS: {
        /* le passant qui traverse sans dire bonjour */
        this.x += VIT_MARCHE * 1.25 * Difficulte.facteurVitesse * dt;
        this.pas += dt * 6;
        this.regarde = 1;
        break;
      }
    }
  }

  /* Pose affichée : les PNJ n'ont qu'un sprite, l'animation est faite
     au dessin (balancement, inclinaison, bras peint). */
  get penche(){
    /* Il se penche vers la gauche, où sont les deux héros, et d'autant
       plus qu'il vise Thibaut, qui est le plus loin. */
    const loin = this.cible === 0 ? 1.7 : 1;
    if (this.etat === ETAT.DEMANDE) return -0.05 * this.bras * loin;
    if (this.etat === ETAT.POIGNEE) return -0.05 * loin;
    if (this.etat === ETAT.MALAISE) return -0.02 * this.bras * loin;
    return 0;
  }
}

/* ================= QueueManager -> File ================= */
const File = {
  places:[],          /* index = place dans la file ; { pnj } ou { heros:0|1 } */

  raz(){ this.places = []; },
  taille(){ return this.places.length; },
  reserver(pnj){ pnj.place = this.places.length; this.places.push({ pnj }); return pnj.place; },
  poserHeros(h, place){
    while (this.places.length < place) this.places.push({ vide:true });
    this.places[place] = { heros:h };
  },
  /* Nombre de personnes réellement en place : c'est ce chiffre qu'affiche
     le bandeau, pour ne pas compter quelqu'un qui marche encore. */
  installees(){
    let n = 0;
    for (const c of this.places){
      if (c.heros !== undefined) n++;
      else if (c.pnj && c.pnj.arrive) n++;
    }
    return n;
  },
  /* Étendue occupée, en unités monde : sert au cadrage caméra. */
  etendue(){ return xPlace(Math.max(3, this.places.length - 1)) + 40; },
  gonfler(n){
    for (let i = 0; i < n; i++){
      const p = new Pnj(piocher(SPRITES_PNJ), "SIMPLE");
      this.reserver(p);
      p.x = xPlace(p.place); p.vise = p.x; p.arrive = true;
      p.etat = ETAT.ATTENTE; p.regarde = -1;
      Foule.tous.push(p);
    }
    Score.noterFile(this.installees());
  },
};

/* ================= héros ================= */
const Heros = [
  { nom:"THIBAUT", sprite:"thibaut", place:PLACE_T, couleur:"#37AC48" },
  { nom:"PF", sprite:"pierre", place:PLACE_PF, couleur:"#2A8AE4" },
];

/* Point d'arrêt de l'arrivant selon le héros qu'il vient saluer. */
function xSalut(h){ return xPlace(Heros[h].place) + RECUL_SALUT; }

function razHeros(){
  for (const h of Heros){
    h.geste = null;         /* { type:"poignee"|"vide"|"victoire", t, duree } */
    h.esquive = null;       /* { t, duree } pendant qu'il se baisse */
    h.tarte = 0;            /* secondes de meringue restantes sur la figure */
    h.sueur = 0;
    h.tremble = 0;
    h.phase = Math.random() * 6.28;
  }
}
function gesteHeros(h, type, duree){ Heros[h].geste = { type, t:0, duree }; }

/* Point de rendez-vous de la main, en unités monde.
   Deux cas, et la distinction compte : tant que le joueur n'a pas
   répondu, le héros garde les mains dans les poches, donc l'arrivant
   tend le bras vers un point d'attente devant lui. Au moment de la
   poignée, le sprite « main tendue » entre en jeu et le rendez-vous
   devient le bout de sa main, relevé sur l'image au chargement — celle
   de Pierre-François va nettement plus loin que celle de Thibaut, un
   chiffre en dur décalait la poignée d'une demi-main. */
function mainHeros(h, serre){
  const H = Heros[h];
  const x0 = xPlace(H.place);
  if (!serre) return { x:x0 + 0.34 * H_PERSO, y:-0.60 * H_PERSO };
  const m = Images.teintes[H.sprite + "_tendue"];
  return {
    x:x0 + (m && m.mainX != null ? m.mainX : 0.38 * H_PERSO),
    y:(m && m.mainY != null ? m.mainY : -0.58 * H_PERSO),
  };
}

/* ================= NPCManager -> Foule ================= */
const Foule = {
  tous:[], jumeauSuivant:null,

  raz(){ this.tous = []; this.jumeauSuivant = null; compteurPnj = 0; },

  /* Fait entrer quelqu'un par la gauche. Il longe la file par devant :
     il passe donc forcément devant les deux héros, et c'est là que se
     joue tout le gag. */
  arriver(typeForce){
    let type = typeForce || Difficulte.tirerType();
    let sprite;
    if (this.jumeauSuivant){ sprite = this.jumeauSuivant; this.jumeauSuivant = null; type = "SIMPLE"; }
    else if (type === "JUMEAU"){ sprite = piocher(SPRITES_PNJ); this.jumeauSuivant = sprite; }
    else if (type === "REVENANT"){
      const deja = this.tous.filter(p => p.arrive && p.etat === ETAT.ATTENTE);
      sprite = deja.length ? piocher(deja).sprite : piocher(SPRITES_PNJ);
    }
    else sprite = piocher(SPRITES_PNJ);

    const p = new Pnj(sprite, type);
    p.revenant = (type === "REVENANT");
    p.x = Camera.bordGauche() - 46;
    p.interaction = (type !== "PASSANT") && (typeForce ? true : Math.random() < Difficulte.pInteraction());

    if (type === "PASSANT"){
      p.etat = ETAT.REPOS; p.interaction = false;
    } else {
      File.reserver(p);
      /* La cible est tirée ici, pas à l'ouverture de la demande : c'est
         elle qui décide où l'arrivant s'arrête. */
      if (p.interaction){
        p.cible = Math.random() < 0.5 ? 0 : 1;
        p.vise = xSalut(p.cible);
        p.viseDemande = true;
      } else {
        p.vise = xPlace(p.place);
      }
      p.etat = ETAT.ENTREE;
    }
    this.tous.push(p);
    Sons.arrivee();
    return p;
  },

  /* Ouvre une demande de poignée de main. */
  ouvrirDemande(pnj, cibleForce, facteur){
    if (pnj.type === "FAUSSE" && cibleForce === undefined){
      /* faux signal : la main monte, puis la personne se recoiffe. */
      pnj.etat = ETAT.MALAISE;
      pnj.cible = Math.random() < 0.5 ? 0 : 1;
      pnj.bras = 0.42;
      pnj.chrono = 0.95;
      Effets.bulle(pnj, "?", 0.9);
      Sons.bip(520, 0.09, "sine", 0.1);
      return;
    }
    pnj.etat = ETAT.DEMANDE;
    if (cibleForce !== undefined) pnj.cible = cibleForce;
    else if (pnj.cible < 0) pnj.cible = Math.random() < 0.5 ? 0 : 1;
    const spec = TYPES[pnj.type] || {};
    pnj.tReaction = Difficulte.reaction() * (spec.react || 1) * (facteur || 1);
    pnj.chrono = pnj.tReaction;
    pnj.attente = 0;
    pnj.bras = 0;
    pnj.regarde = -1;
    if (pnj.type === "DOUBLE" && pnj.doubleReste === 0 && cibleForce === undefined) pnj.doubleReste = 1;
    Jeu.demandes.push(pnj);
    Effets.alerte(pnj);
    Effets.parole({ pnj }, pnj.revenant ? "Re-salut !" : piocher(BONJOURS), 1.5);
    Sons.alerte();
  },

  /* Après une interaction, la personne va se ranger au bout de la file. */
  reprendre(pnj){
    const i = Jeu.demandes.indexOf(pnj);
    if (i >= 0) Jeu.demandes.splice(i, 1);
    if (pnj.place < 0){ pnj.etat = ETAT.REPOS; return; }
    pnj.etat = ETAT.MARCHE;
    pnj.vise = xPlace(pnj.place);
    pnj.bras = 0;
  },

  ranger(pnj){
    pnj.etat = ETAT.ATTENTE;
    pnj.arrive = true;
    pnj.regarde = -1;
    Score.noterFile(File.installees());
  },

  majorer(dt){
    for (const p of this.tous) p.avancer(dt);
    /* on oublie les passants sortis du cadre */
    const limite = Camera.bordDroit() + 120;
    for (const p of this.tous) if (p.place < 0 && p.x > limite) p.parti = true;
    this.tous = this.tous.filter(p => !p.parti);
  },

  /* PNJ visibles, triés pour que celui de gauche passe devant. */
  dessinables(){
    const rangés = [], devant = [];
    for (const p of this.tous) (p.arrive && p.etat === ETAT.ATTENTE ? rangés : devant).push(p);
    rangés.sort((a, b) => b.place - a.place);
    devant.sort((a, b) => b.x - a.x);
    return { rangés, devant };
  },
};

/* ================= GameManager -> Jeu ================= */
const Jeu = {
  phase:"chargement",     /* chargement | titre | jeu | fin */
  gel:0,                  /* arrêt sur image très bref, au moment de l'impact */
  temps:0,                /* temps de jeu, en secondes ; n'avance pas hors partie */
  vies:VIES,
  invincible:false,
  ralenti:1,
  demandes:[],
  prochaineArrivee:0,
  finChrono:0,
  moment:0, fonduDe:0, fondu:1,

  demarrer(){
    Difficulte.raz(); Score.raz(); File.raz(); Foule.raz(); Effets.raz(); razHeros(); Tartes.raz();
    this.temps = 0; this.gel = 0; this.vies = VIES; this.ralenti = 1; this.demandes = [];
    this.moment = 0; this.fonduDe = 0; this.fondu = 1; this.finChrono = 0;
    this.phase = "jeu";

    /* [BAR] PNJ PNJ THIBAUT PIERRE-FRANÇOIS */
    File.gonfler(2);
    File.poserHeros(0, PLACE_T);
    File.poserHeros(1, PLACE_PF);
    while (File.places.length <= PLACE_PF) File.places.push({ vide:true });
    Score.noterFile(File.installees());

    this.prochaineArrivee = this.temps + 1.5;
    Camera.recaler();
    Sons.reveiller(); Sons.lancerAmbiance(); Sons.lancerMusique();
    Interface.majBandeau(); Interface.entrerJeu();
  },

  /* --------- boucle logique, pas fixe --------- */
  pas(dt){
    /* L'arrêt sur image de l'impact : une centaine de millisecondes où
       plus rien n'avance, sauf le décompte du gel lui-même. */
    if (this.gel > 0){
      this.gel -= dt;
      Camera.majorer(dt);
      return;
    }
    if (this.phase === "jeu"){
      this.temps += dt;
      this.majMoment();
      Foule.majorer(dt);
      /* On n'ouvre pas une main tendue pendant que la tarte arrive : les
         deux gestes doivent rester humainement enchaînables. */
      const tarteProche = (() => { const t = Tartes.tarteEnVol(); return !!t && t.resteAvantImpact < 0.75; })();
      if (tarteProche) this.prochaineArrivee = Math.max(this.prochaineArrivee, this.temps + 0.4);
      if (!tarteProche && this.temps >= this.prochaineArrivee && this.demandes.length < Difficulte.simultanees()){
        Foule.arriver();
        this.prochaineArrivee = this.temps + Difficulte.delaiArrivee();
      } else if (this.temps >= this.prochaineArrivee){
        this.prochaineArrivee = this.temps + 0.35;
      }
    } else if (this.phase === "titre"){
      Foule.majorer(dt);
    } else if (this.phase === "fin"){
      Foule.majorer(dt);
      this.finChrono += dt;
      this.ralenti = melange(this.ralenti, 0.22, Math.min(1, dt * 2.2));
      if (this.finChrono > 1.7 && !Interface.finAffichee) Interface.afficherFin();
    }
    for (const h of Heros){
      if (h.geste){ h.geste.t += dt; if (h.geste.t >= h.geste.duree) h.geste = null; }
      h.sueur = Math.max(0, h.sueur - dt * 0.5);
      h.tremble = Math.max(0, h.tremble - dt * 2.2);
      h.phase += dt * 1.6;
    }
    Tartes.majorer(dt);
    Effets.majorer(dt);
    Camera.majorer(dt);
    const densite = borne(File.installees() / 26, 0, 1);
    Sons.ambiancer(densite, dt, this.temps);
    /* la musique n'existe qu'en partie, et le tempo monte avec le soir */
    const tempo = melange(92, 124, borne(Score.saluts / MOMENTS[2].seuil, 0, 1));
    Sons.volumeMusique(this.phase === "jeu" ? 0.80 : (this.phase === "fin" ? 0.25 : 0.45));
    Sons.ordonnerMusique(tempo);
  },

  majMoment(){
    const n = Score.saluts;
    let cible = 0;
    for (let i = 0; i < MOMENTS.length; i++) if (n >= MOMENTS[i].seuil) cible = i;
    if (cible !== this.moment){ this.fonduDe = this.moment; this.moment = cible; this.fondu = 0; }
    if (this.fondu < 1) this.fondu = Math.min(1, this.fondu + 1 / (60 * DUREE_FONDU));
  },

  /* --------- une commande a été pressée --------- */
  saluer(h){
    if (this.phase === "titre"){ this.demarrer(); return; }
    if (this.phase !== "jeu") return;
    Sons.reveiller();
    Interface.flashCommande(h);
    const bonne = this.demandes.find(p => p.cible === h);
    if (bonne) return this.reussir(bonne);
    if (this.demandes.length) return this.rater(this.demandes[0], "mauvais", h);
    return this.fauxSalut(h);
  },

  reussir(pnj){
    const i = this.demandes.indexOf(pnj);
    if (i >= 0) this.demandes.splice(i, 1);
    pnj.etat = ETAT.POIGNEE;
    pnj.chrono = 0.42;
    const spec = TYPES[pnj.type] || {};
    const gagne = Score.reussir(spec.points || 1);
    Difficulte.compter();
    gesteHeros(pnj.cible, "poignee", 0.5);
    const m = mainHeros(pnj.cible, true);
    Effets.eclat(m.x, m.y, Score.combo);
    Effets.parole({ heros:pnj.cible }, piocher(REPONSES), 1.2);
    Effets.texte(m.x, m.y - 34, "+" + chiffres(gagne), "#F7B32B", 0.85);
    if (pnj.revenant) Effets.texte(pnj.x, -1.28 * H_PERSO, "ENCORE ?!", "#7FC3F5", 0.9);
    Sons.poignee(); Sons.reussite(Math.min(7, Score.combo - 1));
    if (Score.combo > 1 && Score.combo % 5 === 0){
      Effets.etoile(X_SALUT, -1.55 * H_PERSO, Score.combo);
      Sons.palier();
    }
    Interface.majBandeau();
  },

  rater(pnj, cause, auteur){
    const i = this.demandes.indexOf(pnj);
    if (i >= 0) this.demandes.splice(i, 1);
    pnj.etat = ETAT.MALAISE;
    pnj.chrono = cause === "lent" ? 1.15 : 0.9;
    const casse = Score.casser();

    if (cause === "mauvais"){
      /* le mauvais héros tend la main à quelqu'un qui ne lui parlait pas */
      gesteHeros(auteur, "vide", 1.05);
      const m = mainHeros(auteur, true);
      Effets.texte(m.x, m.y - 30, "OUPS.", "#E2453D", 1.1);
      Effets.gouttes(xPlace(Heros[auteur].place), -0.92 * H_PERSO, 5);
      Heros[auteur].sueur = 1.6; Heros[auteur].tremble = 1;
      Heros[pnj.cible].sueur = 1.1;
    } else {
      Effets.parole({ pnj }, piocher(REPLIQUES_RATE), 1.3);
      Effets.gouttes(xPlace(Heros[pnj.cible].place), -0.92 * H_PERSO, 4);
      Heros[pnj.cible].sueur = 1.8; Heros[pnj.cible].tremble = 0.8;
    }
    if (casse >= 4) Effets.texte(X_SALUT, -1.62 * H_PERSO, "COMBO PERDU", "#93A4C4", 0.9);
    Sons.erreur(); if (cause === "lent") Sons.gene();
    this.perdreVie();
    Interface.majBandeau();
  },

  /* Presser une commande alors que personne ne tend la main : le héros
     salue le vide. Ça ne coûte pas de vie — seulement le combo. */
  fauxSalut(h){
    gesteHeros(h, "vide", 0.72);
    Score.casser();
    const m = mainHeros(h, true);
    Effets.texte(m.x, m.y - 28, "OUPS.", "#E2453D", 0.85);
    Heros[h].sueur = 0.9;
    Sons.bip(150, 0.2, "sawtooth", 0.16, 90);
    Interface.majBandeau();
  },

  perdreVie(){
    if (this.invincible) return;
    this.vies--;
    Interface.majVies();
    if (this.vies <= 0) this.terminer();
  },

  terminer(){
    this.phase = "fin";
    this.finChrono = 0;
    this.demandes = [];
    for (const p of Foule.tous) if (p.etat === ETAT.DEMANDE){ p.etat = ETAT.MALAISE; p.chrono = 1; }
    Sons.fin();
    Interface.sortirJeu();
  },

  retourTitre(){
    this.phase = "titre";
    this.ralenti = 1;
    Difficulte.raz(); Score.raz(); File.raz(); Foule.raz(); Effets.raz(); razHeros(); Tartes.raz();
    this.temps = 0; this.gel = 0; this.moment = 0; this.fondu = 1; this.fonduDe = 0; this.demandes = [];
    File.gonfler(3);
    File.poserHeros(0, PLACE_T); File.poserHeros(1, PLACE_PF);
    while (File.places.length <= PLACE_PF) File.places.push({ vide:true });
    Camera.recaler();
    Interface.entrerTitre();
  },
};
