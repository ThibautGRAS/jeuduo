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
const BAR_PORTEE = 0.030;           /* portée de prise d'un verre, en fraction du monde */
const BAR_MARCHE = 0.135;           /* fraction du monde parcourue par seconde, à vitesse 1.0 */
const BAR_EXPIRE = [7.5, 5.2];      /* vie d'un verre posé : début, puis en plein coup de feu */
const BAR_AMBIANCE_BUT = 100;
const BAR_COUP_DE_FEU_A = 70;       /* le coup de feu part vers 70 s */
const BAR_COUP_DE_FEU_DUREE = 20;
const BAR_TOURNEE_FINALE = 5;       /* décisions à réussir pour conclure */

/* Les deux champions. Les chiffres viennent de la commande : PF boit
   vite mais court lentement, Thibaut l'inverse. Aucun des deux ne doit
   être objectivement meilleur — c'est ce que le test d'équilibre
   surveille. */
const BAR_CHAMPIONS = [
  { heros:1, nom:"THIBAUT", vitesse:1.00, boire:1.00, jauges:{ vitesse:5, descente:3 },
    idle:"bar_th_idle", marche:"bar_th_marche", course:"bar_th_course",
    boit:"bar_th_action", jette:"bar_th_action",
    devise:"Rapide. Mais quand il boit, il ne fait que ça." },
  { heros:0, nom:"PF", vitesse:0.82, boire:0.65, jauges:{ vitesse:3, descente:5 },
    idle:"bar_pf_idle", marche:"bar_pf_marche", course:"bar_pf_marche",
    boit:"bar_pf_boit", jette:"bar_pf_jette",
    devise:"Lent. Mais redoutable une fois au comptoir." },
];

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
  { id:"francky", nom:"FRANCKY", x:0.24, sert:"cocktail",
    poses:{ repos:"bar_francky_idle", eau:"bar_francky_touille", sert:"bar_francky_sert" },
    prepare:["bar_francky_shake", "bar_francky_verse"] },
  { id:"jojo", nom:"JOJO", x:0.76, sert:"jager",
    poses:{ repos:"bar_jojo_idle", eau:"bar_jojo_essuie", sert:"bar_jojo_montre" },
    prepare:["bar_jojo_mesure", "bar_jojo_shot", "bar_jojo_verse"] },
];

const ETAT_VERRE = { PREPARE:"PREPARE", POSE:"POSE", PRIS:"PRIS", RATE:"RATE" };

const Tournee = {
  actif:false, champion:null, choixChamp:0, enChoix:false,
  x:0.5, dir:1, marche:0, foulee:0, boitT:0, jetteT:0, action:null,
  verres:[], barmans:[], ambiance:0, combo:0, meilleurCombo:0,
  coupDeFeu:false, coupT:0, finale:false, finaleReste:0,
  stats:null, fini:null, message:null, messageT:0, messageDuree:1.6,
  gele:0, secousse:0, invite:null, prochainClin:0,

  /* --------- montage --------- */
  monter(){
    this.enChoix = true;
    this.choixChamp = 0;
    this.champion = null;
    this.fini = null;
    this.actif = false;
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
    this.ambiance = 0; this.combo = 0; this.meilleurCombo = 0;
    this.coupDeFeu = false; this.coupT = 0; this.coupFait = false;
    this.finale = false; this.finaleReste = 0;
    this.temps = 0; this.gele = 0; this.secousse = 0;
    this.message = null; this.invite = null;
    this.prochainClin = hasard(14, 26);
    this.stats = { cocktails:0, jagers:0, eauxJetees:0, eauxBues:0, sacrileges:0, rates:0 };
    this.barmans = BARMANS.map(b => ({
      ref:b, etat:"repos", t:0, prochaine:0, pose:b.poses.repos, type:null,
    }));
    this.barmans[0].prochaine = 1.6;
    this.barmans[1].prochaine = 5.5;
    Sons.reveiller();
  },

  dire(txt, duree){ this.message = txt; this.messageT = 0; this.messageDuree = duree || 1.6; },

  /* --------- ce que le pattern a le droit de servir ----------
     On ne pose JAMAIS un verre injouable : le temps d'aller le
     chercher — distance à la vitesse du champion, plus le geste de
     boire — doit tenir dans la vie du verre, avec une marge. C'est le
     garde-fou demandé : difficile, oui ; impossible, jamais. */
  faisable(x, dejaPoses){
    const c = this.champion;
    const vie = this.coupDeFeu ? BAR_EXPIRE[1] : BAR_EXPIRE[0];
    let cout = Math.abs(x - this.x) / (BAR_MARCHE * c.vitesse);
    for (const v of dejaPoses){
      cout += Math.abs(x - v.x) / (BAR_MARCHE * c.vitesse) + 1.15 * c.boire;
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
      Sons.clic(); Sons.bip(720, 0.05, "triangle", 0.14);
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
    this.marche = d;
  },

  verreAPortee(){
    let m = -1, dmin = BAR_PORTEE;
    for (let i = 0; i < this.verres.length; i++){
      const v = this.verres[i];
      if (v.etat !== ETAT_VERRE.POSE) continue;
      const d = Math.abs(v.x - this.x);
      if (d < dmin){ dmin = d; m = i; }
    }
    return m;
  },

  boire(){ return this.decider(true); },
  jeter(){ return this.decider(false); },

  decider(boit){
    if (!this.actif || this.fini || this.boitT > 0) return false;
    const i = this.verreAPortee();
    if (i < 0){ this.dire("PAS DE VERRE ICI", 1.0); return false; }
    const v = this.verres[i];
    const B = BOISSONS[v.type];
    v.etat = ETAT_VERRE.PRIS;
    this.marche = 0;
    const c = this.champion;

    if (boit && B.bonne){
      /* la bonne boisson, bue : la durée du geste dépend du champion */
      this.boitT = 1.15 * c.boire;
      this.action = "boit";
      this.combo++;
      this.meilleurCombo = Math.max(this.meilleurCombo, this.combo);
      const gain = B.points * Math.min(4, 1 + Math.floor(this.combo / 3));
      Score.points += gain;
      this.ambiance = Math.min(BAR_AMBIANCE_BUT, this.ambiance + (this.finale ? 0 : 7));
      if (v.type === "cocktail") this.stats.cocktails++; else this.stats.jagers++;
      this.dire("PARFAIT !  +" + gain, 1.1);
      Sons.reussite(Math.min(7, this.combo));
      if (this.finale) this.avancerFinale();
      return true;
    }
    if (!boit && !B.bonne){
      /* l'eau, jetée : le réflexe du soir */
      this.boitT = 0.55;
      this.action = "jette";
      this.combo++;
      this.meilleurCombo = Math.max(this.meilleurCombo, this.combo);
      Score.points += B.points;
      this.ambiance = Math.min(BAR_AMBIANCE_BUT, this.ambiance + (this.finale ? 0 : 7));
      this.stats.eauxJetees++;
      this.dire("PAS DUPE !  +" + B.points, 1.1);
      Sons.tarteEsquive();
      if (this.finale) this.avancerFinale();
      return true;
    }
    if (boit && !B.bonne){
      /* il a bu l'eau. Silence. */
      this.boitT = 1.15 * c.boire;
      this.action = "boit";
      this.combo = 0;
      this.gele = 0.35;
      this.secousse = 0.4;
      this.ambiance = Math.max(0, this.ambiance - 8);
      this.stats.eauxBues++;
      this.dire("DE L'EAU ?!", 1.6);
      Sons.bip(180, 0.4, "sine", 0.16, 120);
      if (this.finale) this.raterFinale();
      return true;
    }
    /* il a jeté une bonne boisson : sacrilège */
    this.boitT = 0.55;
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

  terminer(gagne){
    this.fini = { gagne, t:0 };
    this.actif = false;
    Score.points += this.meilleurCombo * 40;
    if (gagne) Sons.palier(); else Sons.fin();
    Jeu.phase = "fin";
    Jeu.finChrono = 0;
    Interface.sortirJeu();
  },

  /* --------- boucle --------- */
  pas(dt){
    if (this.fini){ this.fini.t += dt; return; }
    if (this.enChoix || !this.actif) return;
    this.temps += dt;
    if (this.gele > 0){ this.gele -= dt; return; }
    this.secousse = Math.max(0, this.secousse - dt * 2);
    if (this.message){ this.messageT += dt; if (this.messageT > this.messageDuree) this.message = null; }

    /* déplacement — boire cloue sur place */
    if (this.boitT > 0){
      this.boitT -= dt;
      if (this.boitT <= 0){ this.action = null; }
    } else if (this.marche !== 0){
      const c = this.champion;
      this.x = borne(this.x + this.marche * BAR_MARCHE * c.vitesse * dt, 0.02, 0.98);
      this.foulee += Math.abs(this.marche) * dt * 10;
      this.dir = this.marche;
    }

    /* les verres vieillissent */
    for (const v of this.verres){
      if (v.etat !== ETAT_VERRE.POSE) continue;
      v.t += dt;
      if (v.t > v.vie){
        v.etat = ETAT_VERRE.RATE;
        this.combo = 0;
        this.stats.rates++;
        this.ambiance = Math.max(0, this.ambiance - 5);
        this.dire("RATÉ !", 1.2);
        Sons.bip(200, 0.2, "sine", 0.12, 150);
      }
    }
    this.verres = this.verres.filter(v =>
      v.etat === ETAT_VERRE.POSE || (v.etat === ETAT_VERRE.RATE && v.t < v.vie + 0.8));

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

    /* la jauge pleine déclenche la dernière tournée */
    if (!this.finale && this.ambiance >= BAR_AMBIANCE_BUT){
      this.finale = true;
      this.finaleReste = BAR_TOURNEE_FINALE;
      this.dire("DERNIÈRE TOURNÉE !", 2.4);
      Sons.palier();
    }

    /* clins d'œil : Risoto traverse, Hortense passe et regarde */
    this.prochainClin -= dt;
    if (this.prochainClin <= 0 && !this.invite){
      this.prochainClin = hasard(24, 44);
      this.invite = { qui:Math.random() < 0.72 ? "chat" : "hortense",
                      x:-0.06, dir:1, t:0 };
    }
    if (this.invite){
      this.invite.t += dt;
      this.invite.x += this.invite.dir * dt * (this.invite.qui === "chat" ? 0.16 : 0.085);
      if (this.invite.x > 1.08) this.invite = null;
    }

    Camera.suivreBar(this.x, dt);
  },
};
