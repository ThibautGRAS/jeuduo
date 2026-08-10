
/* ==================================================================
   NIVEAU 2 — L'AFFAIRE DE LA PIZZA AU CHORIZO
   ------------------------------------------------------------------
   Une mini-enquête dans un appartement vu en coupe. Le décor est une
   seule image très large ; la caméra glisse dessus. Tout est posé en
   POURCENTAGE de cette image, jamais en pixels d'écran : c'est ce qui
   permet au niveau de tenir aussi bien sur un ordinateur que sur un
   téléphone couché.

   Découpage demandé, et où il se trouve ici :
     LevelManager          -> Jeu.niveau + Progres
     CaseGenerator         -> Affaire
     InvestigationManager  -> Enquete
     EvidenceManager       -> Dossier
     InteractionManager    -> Enquete.zoneProche / inspecter
     SuspectManager        -> SUSPECTS + Enquete.interroger
     HortenseEventManager  -> HortenseApp
     PieProjectile         -> HortenseApp.tarte
     DodgeManager          -> HortenseApp.esquiver
================================================================== */

const ENQ_DUREE = 300;              /* cinq minutes */
const ENQ_OBJECTIF = 6;             /* indices à réunir */
const ENQ_PORTEE = 0.026;           /* distance d'interaction, en fraction d'image */
const ENQ_MARCHE = 0.20;            /* fraction d'image parcourue par seconde */
const ENQ_LIGNE = 0.925;
const ENQ_TAILLE = 0.46;
const ENQ_FOUILLE = 0.75;
const ENQ_MAUVAISE = 20;            /* secondes perdues sur une accusation ratée */
const ENQ_TARTE = 10;               /* secondes perdues sur une tarte reçue */
const ENQ_ESQUIVE_PTS = 100;

/* ---------- les meubles fouillables ----------
   `pied` est l'abscisse où l'inspecteur s'arrête, parfois décalée pour
   ne pas se planter dans le meuble. */
const ZONES = [
  { id:"chaussures", nom:"les chaussures",  x:0.038, y:0.74, pied:0.055 },
  { id:"manteaux",   nom:"les manteaux",    x:0.078, y:0.42, pied:0.102 },
  { id:"sac",        nom:"le sac",          x:0.156, y:0.74, pied:0.156 },
  { id:"biblio",     nom:"la bibliothèque", x:0.222, y:0.34, pied:0.222 },
  { id:"canape",     nom:"sous le canapé",  x:0.272, y:0.70, pied:0.272 },
  { id:"basse",      nom:"la table basse",  x:0.350, y:0.84, pied:0.350 },
  { id:"tv",         nom:"le meuble TV",    x:0.392, y:0.66, pied:0.392 },
  { id:"frigo",      nom:"le frigo",        x:0.503, y:0.56, pied:0.503 },
  { id:"four",       nom:"le four",         x:0.560, y:0.64, pied:0.560 },
  { id:"table",      nom:"la table",        x:0.608, y:0.76, pied:0.608 },
  { id:"placards",   nom:"les placards",    x:0.648, y:0.26, pied:0.654 },
  { id:"evier",      nom:"l'évier",         x:0.700, y:0.52, pied:0.700 },
  { id:"poubelle",   nom:"la poubelle",     x:0.752, y:0.72, pied:0.752 },
  { id:"commode",    nom:"la commode",      x:0.842, y:0.72, pied:0.842 },
  { id:"portant",    nom:"le portant",      x:0.966, y:0.44, pied:0.958 },
  { id:"lit",        nom:"sous le lit",     x:0.948, y:0.80, pied:0.912 },
];

/* ---------- la banque d'indices ----------
   `analyse` est ce que dit Pierre-François, qui sait lire une trace ;
   `brut` ce qu'en dit Thibaut, qui décrit ce qu'il voit. Quand `expert`
   est vrai, seul Pierre-François en tire quelque chose — et l'indice
   reste sur place, à récupérer avec le bon inspecteur. */
const INDICES = [
  { id:"sauce",     sprite:"ind_sauce",     nom:"Sauce tomate",
    analyse:"Sauce tomate. Encore tiède.", brut:"C'est rouge.", expert:true },
  { id:"chorizo",   sprite:"ind_chorizo",   nom:"Rondelle de chorizo",
    analyse:"Chorizo. Coupé fin, à la main.", brut:"Une rondelle. De quelque chose." },
  { id:"miettes",   sprite:"ind_miettes",   nom:"Miettes de pâte",
    analyse:"Miettes de pâte. Semées vers la droite.", brut:"Des miettes. Partout.", expert:true },
  { id:"fromage",   sprite:"ind_fromage",   nom:"Fromage refroidi",
    analyse:"Fromage refroidi. Trente minutes, pas plus.", brut:"C'est collant." },
  { id:"pattes",    sprite:"ind_pattes",    nom:"Traces de pattes",
    analyse:"Empreintes. Quatre coussinets. Un félin.", brut:"Quelqu'un a marché dedans.", expert:true },
  { id:"serviette", sprite:"ind_serviette", nom:"Serviette froissée",
    analyse:"Serviette froissée. Quelqu'un s'est essuyé vite.", brut:"Un mouchoir. Bof." },
  { id:"ticket",    sprite:"ind_ticket",    nom:"Ticket de livraison",
    analyse:"Ticket de livraison. 19 h 42. Une pizza chorizo.", brut:"Un papier. Avec des chiffres." },
  { id:"assiette",  sprite:"ind_assiette",  nom:"Assiette utilisée",
    analyse:"Assiette utilisée. Jamais rapportée à l'évier.", brut:"Une assiette. Sale." },
  { id:"boite",     sprite:"pizza_boite_ouverte", nom:"Boîte ouverte",
    analyse:"La boîte. Ouverte ici, pas à la cuisine.", brut:"La boîte ! Enfin, vide." },
  { id:"part",      sprite:"pizza_part",    nom:"Part abandonnée",
    analyse:"Une part entamée puis reposée. Quelqu'un a été dérangé.", brut:"Une part ! On peut la manger ?" },
];

/* ---------- ce qu'on trouve quand on ne trouve rien ---------- */
const RIEN = {
  chaussures:"Des chaussures. Rien dedans, heureusement.",
  manteaux:"Trois manteaux. Deux poches percées.",
  sac:"Des clés, un chargeur, du désespoir.",
  biblio:"Beaucoup de livres. Aucun sur la pizza.",
  canape:"Aucun suspect. Quelques chaussettes.",
  basse:"Une télécommande. A probablement servi à changer de chaîne.",
  tv:"Des câbles. Une enquête parallèle pourrait être ouverte.",
  frigo:"Beaucoup de choses. Pas la pizza.",
  four:"Étonnamment, quelqu'un a pensé à regarder ici.",
  placards:"Des bocaux, rangés par ordre de péremption.",
  evier:"Vaisselle propre. Suspect, dans cet appartement.",
  table:"Un verre vide. Une enquête parallèle pourrait être ouverte.",
  poubelle:"Pierre-François regrette immédiatement cette décision.",
  commode:"Des tiroirs. Puis d'autres tiroirs.",
  lit:"Aucun suspect. Quelques chaussettes.",
  portant:"Des vêtements. Aucun ne sent le chorizo.",
};

/* ---------- les suspects ---------- */
const SUSPECTS = [
  { id:"gamer", nom:"LE VOISIN DU DESSUS", sprite:"susp_gamer", x:0.310, y:0.66,
    dires:["J'étais sur un jeu en ligne.", "Toute la soirée.", "Enfin... presque toute."],
    absurde:"Il propose une partie.", aveu:"Il avait la clé. Et l'appétit." },
  { id:"blonde", nom:"LA COLOCATAIRE", sprite:"susp_blonde", x:0.665, y:0.62,
    dires:["Je n'ai rien entendu.", "J'avais mes écouteurs.", "La porte était fermée. Je crois."],
    absurde:"Elle demande si c'est une caméra cachée.", aveu:"Elle avait faim. Elle a été efficace." },
  { id:"brune", nom:"L'AMIE DE PASSAGE", sprite:"susp_brune", x:0.880, y:0.62,
    dires:["Je suis arrivée après.", "On m'a proposé du vin.", "Personne ne m'a parlé de pizza."],
    absurde:"Elle resservirait bien un verre.", aveu:"Elle est arrivée avant. Le ticket le dit." },
  { id:"chat", nom:"RISOTO", sprite:"susp_chat", x:0.452, y:0.88,
    dires:["...", "Refuse de répondre aux questions.", "Se lèche la patte."],
    absurde:"Refuse de répondre aux questions.", aveu:"Il a poussé la boîte. Le reste s'est fait tout seul." },
];

/* ---------- CaseGenerator -> Affaire ----------
   Trois scénarios, tirés au début de la partie et figés jusqu'à la fin.
   Le tirage part de la SOLUTION puis distribue ses indices : une
   enquête impossible ne peut donc pas sortir. */
const Affaire = {
  scenario:"A", coupable:null, cachette:null, reels:[], plan:{}, hortenseFaite:false,

  generer(){
    this.scenario = piocher(["A", "B", "C"]);
    if (this.scenario === "C") this.coupable = SUSPECTS[3];
    else if (this.scenario === "B") this.coupable = null;        /* personne : elle a été rangée */
    else this.coupable = piocher(SUSPECTS.slice(0, 3));

    this.cachette = piocher(this.scenario === "B"
      ? ["frigo", "four", "placards"]
      : ["poubelle", "sac", "lit", "commode", "canape"]);

    const obligatoires = ["ticket", "boite"];
    if (this.scenario === "C") obligatoires.push("pattes");
    else if (this.scenario === "B") obligatoires.push("assiette");
    else obligatoires.push("serviette");

    const reste = INDICES.map(i => i.id).filter(id => obligatoires.indexOf(id) < 0);
    melangerTableau(reste);
    this.reels = obligatoires.concat(reste.slice(0, ENQ_OBJECTIF - obligatoires.length));

    const places = ZONES.map(z => z.id).filter(id => id !== this.cachette);
    melangerTableau(places);
    this.plan = {};
    this.reels.forEach((id, k) => { this.plan[places[k]] = id; });
    this.hortenseFaite = false;
    return this;
  },

  bonneReponse(){ return this.coupable ? this.coupable.id : "personne"; },
  titreSolution(){ return this.coupable ? this.coupable.nom : "PERSONNE"; },
  chute(){
    if (this.scenario === "B") return "Personne ne l'a volée. Quelqu'un l'a rangée. C'est pire.";
    return this.coupable.aveu;
  },
};

function melangerTableau(t){
  for (let i = t.length - 1; i > 0; i--){
    const j = entier(0, i); const v = t[i]; t[i] = t[j]; t[j] = v;
  }
  return t;
}

/* ---------- EvidenceManager -> Dossier ---------- */
const Dossier = {
  cartes:[],
  raz(){ this.cartes = []; },
  ajouter(ind){ if (!this.cartes.some(c => c.id === ind.id)) this.cartes.push(ind); },
  compte(){ return this.cartes.length; },
};

/* ---------- HortenseEventManager -> HortenseApp ----------
   Elle entre par un bord, regarde, prépare, lance et repart. La tarte
   n'est PAS la pizza recherchée : c'est le lien avec le niveau 1. */
const ETAT_H2 = {
  CACHEE:"CACHEE", ENTREE:"ENTREE", GUET:"GUET", PREPARE:"PREPARE",
  LANCE:"LANCE", RIRE:"RIRE", SORTIE:"SORTIE", FINI:"FINI",
};

const HortenseApp = {
  etat:ETAT_H2.CACHEE, x:0, vise:0, chrono:0, cible:0, tarte:null, quand:0, faite:false,

  raz(){
    this.etat = ETAT_H2.CACHEE; this.faite = false; this.tarte = null;
    /* entre 35 % et 65 % de la durée : ni au tout début, ni à la fin */
    this.quand = ENQ_DUREE * hasard(0.35, 0.65);
  },
  ecoule(){ return ENQ_DUREE - Enquete.restant; },
  peutVenir(){
    return !this.faite && this.etat === ETAT_H2.CACHEE && Enquete.actif &&
           !Enquete.dossierOuvert && !Enquete.accusation && Enquete.gele <= 0 &&
           this.ecoule() >= this.quand;
  },
  declencher(){
    if (this.etat !== ETAT_H2.CACHEE) return;
    this.faite = true;
    const chef = Enquete.actifIns();
    this.cible = chef.heros;
    const cote = chef.x > 0.5 ? -1 : 1;
    this.x = borne(chef.x + cote * 0.17, -0.04, 1.04);
    this.vise = chef.x + cote * 0.08;
    this.etat = ETAT_H2.ENTREE;
    Enquete.dire("Un silence. Puis quelqu'un.", 1.6);
    Sons.hortenseEntre();
  },
  majorer(dt){
    if (this.etat === ETAT_H2.CACHEE){ if (this.peutVenir()) this.declencher(); return; }
    switch (this.etat){
      case ETAT_H2.ENTREE: {
        const r = this.vise - this.x;
        this.x += Math.sign(r) * Math.min(Math.abs(r), 0.24 * dt);
        if (Math.abs(this.vise - this.x) < 0.004){ this.etat = ETAT_H2.GUET; this.chrono = 0.4; }
        break;
      }
      case ETAT_H2.GUET:
        this.chrono -= dt;
        if (this.chrono <= 0){ this.etat = ETAT_H2.PREPARE; this.chrono = 0.55; Sons.hortensePrepare(); }
        break;
      case ETAT_H2.PREPARE:
        this.chrono -= dt;
        if (this.chrono <= 0) this.lancer();
        break;
      case ETAT_H2.LANCE:
        this.chrono -= dt;
        if (this.chrono <= 0 && !this.tarte){ this.etat = ETAT_H2.RIRE; this.chrono = 0.7; Sons.hortenseRit(); }
        break;
      case ETAT_H2.RIRE:
        this.chrono -= dt;
        if (this.chrono <= 0) this.etat = ETAT_H2.SORTIE;
        break;
      case ETAT_H2.SORTIE: {
        const dir = Math.sign(this.x - Enquete.actifIns().x) || 1;
        this.x += dir * 0.28 * dt;
        if (this.x < -0.06 || this.x > 1.06) this.etat = ETAT_H2.FINI;
        break;
      }
    }
    if (this.tarte) this.majorerTarte(dt);
  },
  lancer(){
    const ins = Enquete.inspecteurs[this.cible];
    this.etat = ETAT_H2.LANCE; this.chrono = 0.25;
    this.tarte = {
      x:this.x, y:0.52, x0:this.x, but:ins.x, t:0, rot:0, etat:"vol",
      duree:Math.max(0.9, Math.abs(this.x - ins.x) * 4.4),
    };
    Enquete.esquiveOuverte = false;
    Sons.tarteLancee();
  },
  resteAvantImpact(){
    const p = this.tarte;
    if (!p) return 1e9;
    return Math.max(0, (1 - Math.min(1, p.t / p.duree)) * p.duree);
  },
  majorerTarte(dt){
    const p = this.tarte;
    if (p.etat === "fini"){ this.tarte = null; Enquete.esquiveOuverte = false; return; }
    p.t += dt;
    const a = Math.min(1.3, p.t / p.duree);
    const fin = p.but + Math.sign(p.but - p.x0) * 0.10;
    p.x = melange(p.x0, fin, a);
    p.y = 0.52 - Math.sin(Math.PI * Math.min(1, a)) * 0.10 + a * 0.05;
    p.rot += dt * 9;
    Enquete.esquiveOuverte = p.etat === "vol" && this.resteAvantImpact() <= 0.45;
    if (p.etat === "vol" && a >= 1){
      p.etat = "fini";
      Enquete.recevoirTarte(this.cible);
    } else if (p.etat === "esquivee" && a >= 1.25){
      p.etat = "fini";
    }
  },
  esquiver(){
    const p = this.tarte;
    if (!p || p.etat !== "vol") return false;
    if (this.resteAvantImpact() > 0.45) return false;
    p.etat = "esquivee";
    Enquete.esquiveOuverte = false;
    return true;
  },
  visible(){ return this.etat !== ETAT_H2.CACHEE && this.etat !== ETAT_H2.FINI; },
};

/* ================= InvestigationManager -> Enquete ================= */
const Enquete = {
  actif:false, restant:0, indices:0, fouilles:0, fausses:0, zones:[],
  inspecteurs:[], actifIdx:0, fini:null, secousse:0, message:null, messageT:0,
  messageDuree:1.6, dossierOuvert:false, accusation:false, choixAcc:0,
  pizza:null, esquiveOuverte:false, tarteRecue:false, tarteEsquivee:false,
  gele:0, badge:null, badgeT:0,

  demarrer(){
    Affaire.generer();
    Dossier.raz();
    HortenseApp.raz();
    for (const s of SUSPECTS) s.vus = 0;
    this.actif = true;
    this.restant = ENQ_DUREE;
    this.indices = 0; this.fouilles = 0; this.fausses = 0;
    this.fini = null; this.secousse = 0; this.message = null;
    this.dossierOuvert = false; this.accusation = false; this.choixAcc = 0;
    this.pizza = null; this.esquiveOuverte = false;
    this.tarteRecue = false; this.tarteEsquivee = false;
    this.gele = 0; this.badge = null; this.badgeT = 0;
    this.actifIdx = 0;

    this.zones = ZONES.map(z => ({
      ref:z, fouillee:false, indice:Affaire.plan[z.id] || null,
      cachette:z.id === Affaire.cachette, pulse:Math.random() * 6.28,
    }));
    this.inspecteurs = Heros.map((h, i) => ({
      heros:i, x:0.10 + i * 0.05, dir:1, marche:0, pas:0, fouille:0, cible:-1, sale:0,
    }));
    Camera.xEnq = 0;
  },

  actifIns(){ return this.inspecteurs[this.actifIdx]; },
  autreIns(){ return this.inspecteurs[1 - this.actifIdx]; },
  estPF(ins){ return Heros[ins.heros].sprite === "pierre"; },
  changer(){ if (this.actif){ this.actifIdx = 1 - this.actifIdx; Sons.clic(); } },
  marcher(d){ if (this.actif && !this.dossierOuvert && !this.accusation) this.actifIns().marche = d; },
  dire(txt, duree){ this.message = txt; this.messageT = 0; this.messageDuree = duree || 1.8; },
  poserBadge(nom){ this.badge = nom; this.badgeT = 0; },

  /* --------- ce qui est à portée --------- */
  zoneProche(){
    const ins = this.actifIns();
    let meilleure = -1, dmin = ENQ_PORTEE;
    for (let i = 0; i < this.zones.length; i++){
      if (this.zones[i].fouillee) continue;
      const d = Math.abs(this.zones[i].ref.pied - ins.x);
      if (d < dmin){ dmin = d; meilleure = i; }
    }
    return meilleure;
  },
  suspectProche(){
    const ins = this.actifIns();
    let meilleur = -1, dmin = ENQ_PORTEE;
    for (let i = 0; i < SUSPECTS.length; i++){
      const d = Math.abs(SUSPECTS[i].x - ins.x);
      if (d < dmin){ dmin = d; meilleur = i; }
    }
    return meilleur;
  },

  /* --------- action contextuelle --------- */
  action(){
    if (this.esquiveOuverte) return this.esquiver();
    if (this.accusation) return this.valider();
    return this.inspecter();
  },
  inspecter(){
    if (!this.actif || this.gele > 0 || this.dossierOuvert) return false;
    const ins = this.actifIns();
    if (ins.fouille > 0) return false;
    const iz = this.zoneProche();
    if (iz >= 0){ ins.fouille = ENQ_FOUILLE; ins.cible = iz; ins.marche = 0; Sons.tarteVol(); return true; }
    const is = this.suspectProche();
    if (is >= 0){ this.interroger(is); return true; }
    this.dire("Rien à portée.", 1.0);
    return false;
  },

  resoudreFouille(ins){
    const z = this.zones[ins.cible];
    ins.fouille = 0;
    if (!z || z.fouillee){ ins.cible = -1; return; }
    const pf = this.estPF(ins);

    /* la cachette : la pizza n'apparaît que là, et pas avant trois indices */
    if (z.cachette){
      if (this.indices < 3){
        Effets.parole({ heros:ins.heros }, "Il y a quelque chose. Mais quoi ?", 2.0);
        ins.cible = -1;
        return;
      }
      z.fouillee = true; this.fouilles++;
      this.pizza = { t:0, zone:ins.cible };
      this.gele = 0.15;
      this.poserBadge("pizza");
      Effets.parole({ heros:ins.heros }, "La voilà.", 2.0);
      Sons.tarteEsquive(); Sons.palier();
      ins.cible = -1;
      return;
    }

    if (z.indice){
      const ind = INDICES.find(i => i.id === z.indice);
      if (ind.expert && !pf){
        /* Thibaut voit la chose sans la comprendre : l'indice reste à prendre */
        this.fausses++;
        Effets.parole({ heros:ins.heros }, ind.brut, 1.8);
        this.dire("Pierre-François saurait quoi en faire.", 2.0);
        Sons.bip(190, 0.16, "sine", 0.14, 130);
        ins.cible = -1;
        return;
      }
      z.fouillee = true; this.fouilles++;
      this.indices++;
      Dossier.ajouter(ind);
      this.gele = 0.15;
      this.poserBadge("indice");
      Effets.parole({ heros:ins.heros }, pf ? ind.analyse : ind.brut, 2.4);
      Sons.reussite(Math.min(7, this.indices));
      this.secousse = 0.25;
      if (this.indices === 4) this.dire("On commence à avoir quelque chose.", 2.4);
    } else {
      z.fouillee = true; this.fouilles++;
      this.fausses++;
      Effets.parole({ heros:ins.heros }, RIEN[z.ref.id] || "Rien.", 2.2);
      Sons.bip(190, 0.16, "sine", 0.14, 130);
    }
    ins.cible = -1;
  },

  interroger(is){
    const s = SUSPECTS[is];
    const ins = this.actifIns();
    if (this.estPF(ins)){
      Effets.parole({ heros:ins.heros }, s.absurde, 2.2);
      this.dire("Thibaut poserait de meilleures questions.", 2.0);
      return;
    }
    const d = s.dires[s.vus % s.dires.length];
    s.vus++;
    Effets.parole({ heros:ins.heros }, d, 2.4);
    Sons.bip(520, 0.08, "sine", 0.1);
  },

  /* --------- dossier et accusation --------- */
  basculerDossier(){
    if (!this.actif) return;
    this.dossierOuvert = !this.dossierOuvert;
    if (this.dossierOuvert) this.accusation = false;
    Sons.clic();
  },
  ouvrirAccusation(){
    if (!this.actif) return;
    if (this.indices < 3){ this.dire("Trois indices, au minimum.", 1.8); return; }
    this.accusation = true; this.dossierOuvert = false; this.choixAcc = 0;
    Sons.clic();
  },
  deplacerAccusation(d){
    if (!this.accusation) return;
    const n = SUSPECTS.length + 1;
    this.choixAcc = (this.choixAcc + d + n) % n;
    Sons.clic();
  },
  valider(){
    if (!this.accusation) return false;
    const rep = this.choixAcc < SUSPECTS.length ? SUSPECTS[this.choixAcc].id : "personne";
    this.accusation = false;
    if (rep !== Affaire.bonneReponse()){
      this.dire("Ça ne tient pas.", 2.2);
      this.poserBadge("suspect");
      this.restant -= ENQ_MAUVAISE;
      Sons.erreur();
      return false;
    }
    if (!this.pizza){
      this.dire("Et la pizza, elle est où ?", 2.4);
      this.restant -= ENQ_MAUVAISE;
      return false;
    }
    this.terminer(true);
    return true;
  },

  recevoirTarte(i){
    this.tarteRecue = true;
    this.inspecteurs[i].sale = 3;
    this.restant -= ENQ_TARTE;
    this.secousse = 0.6;
    this.poserBadge("splat");
    Sons.tarteImpact();
  },
  esquiver(){
    if (!HortenseApp.esquiver()) return false;
    this.tarteEsquivee = true;
    Score.points += ENQ_ESQUIVE_PTS;
    this.poserBadge("esquive");
    Sons.tarteEsquive();
    /* En repartant, elle laisse tomber quelque chose. Le doute est
       permis ; la réponse, non. */
    if (!Affaire.hortenseFaite){
      const libres = this.zones.filter(z => !z.fouillee && !z.indice && !z.cachette);
      if (libres.length){
        piocher(libres).indice = "chorizo";
        Affaire.hortenseFaite = true;
        this.dire("Elle a fait tomber quelque chose.", 2.4);
      }
    }
    return true;
  },

  terminer(gagne){
    this.fini = { gagne, t:0 };
    this.actif = false;
    this.tempsPris = ENQ_DUREE - this.restant;
    if (gagne){
      Score.points += Math.round(this.restant * 8 + this.indices * 150);
      Sons.palier();
    } else Sons.fin();
    Jeu.phase = "fin";
    Jeu.finChrono = 0;
    Interface.sortirJeu();
  },

  /* --------- boucle --------- */
  pas(dt){
    if (this.fini){ this.fini.t += dt; return; }
    if (!this.actif) return;
    if (this.badge){ this.badgeT += dt; if (this.badgeT > 1.2) this.badge = null; }
    if (this.gele > 0){ this.gele -= dt; return; }
    if (this.pizza) this.pizza.t += dt;
    if (this.dossierOuvert || this.accusation){ Effets.majorer(dt); return; }

    this.restant -= dt;
    this.secousse = Math.max(0, this.secousse - dt * 2);
    if (this.message){ this.messageT += dt; if (this.messageT > this.messageDuree) this.message = null; }
    for (const z of this.zones) z.pulse += dt * 2.4;

    /* l'actif conduit, l'autre suit deux pas derrière */
    const chef = this.actifIns(), suit = this.autreIns();
    if (chef.marche !== 0 && chef.fouille <= 0){
      chef.x = borne(chef.x + chef.marche * ENQ_MARCHE * dt, 0.02, 0.98);
      chef.pas += Math.abs(chef.marche) * dt * 9;
      chef.dir = chef.marche;
    }
    const but = borne(chef.x - chef.dir * 0.048, 0.02, 0.98);
    const ecart = but - suit.x;
    if (Math.abs(ecart) > 0.006 && suit.fouille <= 0){
      const v = Math.sign(ecart) * Math.min(Math.abs(ecart), ENQ_MARCHE * 1.2 * dt);
      suit.x += v; suit.pas += Math.abs(v) * 9; suit.dir = Math.sign(v) || suit.dir;
    }

    for (const ins of this.inspecteurs){
      if (ins.fouille > 0){
        ins.fouille -= dt;
        if (ins.fouille <= 0) this.resoudreFouille(ins);
      }
      if (ins.sale > 0) ins.sale -= dt;
    }

    HortenseApp.majorer(dt);
    Camera.suivreEnq(chef.x, dt);

    if (this.restant <= 0){ this.restant = 0; this.terminer(false); }
    Effets.majorer(dt);
    Sons.ambiancer(0.2, dt, ENQ_DUREE - this.restant);
  },
};
