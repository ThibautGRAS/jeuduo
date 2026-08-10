
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
const ENQ_LIGNE = 0.920;   /* la ligne de sol du salon, relevée sur le décor */
/* Un adulte fait environ 70 % de la hauteur sous plafond, et la pièce
   occupe 88 % de l'image : 0,62 et pas un chiffre au jugé. À 0,46, les
   inspecteurs mesuraient un mètre trente et avaient l'air collés sur
   une carte postale plutôt que debout dans le salon. */
const ENQ_TAILLE = 0.62;
const ENQ_FOUILLE = 0.75;
const ENQ_ACCUSATIONS = 2;         /* on n'a droit qu'à deux noms */
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
  { id:"manette",   sprite:"ind_serviette", nom:"Manette grasse",
    analyse:"Une manette. Sale.", brut:"Des traces de doigts gras. Il a joué en mangeant.", social:true },
];

/* ---------- ce que l'autre en dit ----------
   Trouver un indice déclenche un échange à deux voix : celui qui fouille
   annonce, l'autre commente. C'est ce qui fait qu'ils ont l'air de
   travailler ensemble plutôt que de se relayer. */
const ECHOS = {
  sauce:["Tiède ? Donc récent.", "Ne touche pas. Enfin, trop tard."],
  ticket_menu:["Tu connais le livreur ?", "Je connais surtout ses horaires."],
  manette:["Gras. Donc il mangeait.", "Et il jouait. Les deux."],
  chorizo:["Coupé à la main. Personne ne fait ça.", "Moi je l'aurais mangée entière."],
  miettes:["Vers la droite, tu es sûr ?", "Quelqu'un est parti par là."],
  fromage:["Trente minutes. On l'a raté de peu.", "On était là il y a trente minutes."],
  pattes:["Un félin. On en connaît un.", "Il est juste là. Il nous regarde."],
  serviette:["Vite, et mal.", "Un coupable pressé, c'est déjà quelque chose."],
  ticket:["19 h 42. Note-le.", "Je note. Enfin, je retiens."],
  assiette:["Jamais rapportée. Ça en dit long.", "Ça en dit surtout sur cet appartement."],
  boite:["Ouverte ici. Pas à la cuisine.", "Donc on a mangé debout. Comme des sauvages."],
  part:["Reposée, pas jetée. On l'a dérangé.", "Ou il a eu honte."],
};

/* Un mot en entrant dans chaque pièce, une fois par partie. */
const PIECES = [
  { id:"entree",  jusqua:0.19, ligne:"L'entrée. On commence par le commencement." },
  { id:"salon",   jusqua:0.45, ligne:"Le salon. C'est ici que ça s'est joué." },
  { id:"cuisine", jusqua:0.80, ligne:"La cuisine. Le point de départ, en théorie." },
  { id:"chambre", jusqua:1.01, ligne:"La chambre. Personne ne mange une pizza ici." },
];

/* Remarques d'attente : ils se parlent quand on les laisse tranquilles. */
const BAVARDAGES = [
  [0, "On avance ?"], [1, "On avance."],
  [1, "J'ai faim."], [0, "Ce n'est pas le sujet."],
  [0, "Reprenons depuis le début."], [1, "On n'a pas encore de début."],
  [1, "Et si personne ne l'avait prise ?"], [0, "Alors elle serait là."],
  [0, "Note tout."], [1, "Je n'ai pas de carnet."],
];



/* ---------- ce qu'on trouve quand on ne trouve rien ----------
   Deux lectures par meuble, jamais la même. Pierre-François décrit ce
   qu'il déduit, Thibaut ce qu'il ressent. Fouiller deux fois le même
   meuble avec l'autre inspecteur doit apprendre quelque chose, même
   quand il n'y a rien à trouver. */
const RIEN = {
  chaussures:{ pf:"Pointure 43. Boueuses. Sorties récemment.", th:"Des chaussures. Rien dedans, heureusement." },
  manteaux:  { pf:"Trois manteaux, une seule poche vidée.", th:"Il fait froid dehors. Je dis ça." },
  sac:       { pf:"Un sac préparé à la hâte.", th:"Des clés, un chargeur, du désespoir." },
  biblio:    { pf:"Rangée par taille. Quelqu'un de méthodique vit ici.", th:"Beaucoup de livres. Aucun sur la pizza." },
  canape:    { pf:"Coussins déplacés. On s'est assis, puis relevé vite.", th:"Aucun suspect. Quelques chaussettes." },
  basse:     { pf:"Un cercle humide. Un verre a séjourné ici.", th:"Une télécommande. A servi à changer de chaîne." },
  tv:        { pf:"Éteinte, mais l'écran est tiède.", th:"Des câbles. Une enquête parallèle pourrait s'ouvrir." },
  frigo:     { pf:"Il manque une place au milieu de l'étagère.", th:"Beaucoup de choses. Pas la pizza." },
  four:      { pf:"Froid. Personne ne l'a allumé ce soir.", th:"Étonnamment, quelqu'un a pensé à regarder ici." },
  table:     { pf:"Quatre chaises, une seule écartée.", th:"Un verre vide. Enquête parallèle." },
  placards:  { pf:"Rangés par date de péremption. Ça se remarque.", th:"Des bocaux. Beaucoup de bocaux." },
  evier:     { pf:"Vaisselle faite. Ce soir, et vite.", th:"Propre. Suspect, dans cet appartement." },
  poubelle:  { pf:"Rien de gras. On n'a pas jeté de carton ici.", th:"Je regrette immédiatement cette décision." },
  commode:   { pf:"Un tiroir refermé de travers.", th:"Des tiroirs. Puis d'autres tiroirs." },
  portant:   { pf:"Un cintre vide au milieu. Quelqu'un s'est rhabillé.", th:"Aucun vêtement ne sent le chorizo." },
  lit:       { pf:"Couverture tirée d'un seul côté.", th:"Aucun suspect. Quelques chaussettes." },
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
   Dix affaires écrites, tirées au sort au début de la partie et figées
   jusqu'à la fin. Chacune fixe son coupable, ses cachettes possibles,
   les indices qui la portent, et ses quatre répliques. Le tirage part
   de la SOLUTION puis distribue ses indices : une enquête impossible ne
   peut donc pas sortir. */
const SCENARIOS = [
  { id:"voisin", coupable:"gamer", cachettes:["canape", "sac", "tv"],
    porteurs:["ticket", "boite", "serviette"],
    piste:[[0, "Quelqu'un est entré, a mangé, et est reparti."], [1, "Donc quelqu'un d'ici."]],
    trouvaille:[[0, "Cachée sous le canapé. Mal."], [1, "On sait qui range mal."]],
    contradiction:"Vous avez joué toute la soirée. Sans pause. Vraiment ?",
    chute:"Il avait la clé, la faim, et une manette dans les mains." },

  { id:"coloc", coupable:"blonde", cachettes:["placards", "commode", "portant"],
    porteurs:["ticket", "assiette", "fromage"],
    piste:[[0, "Une assiette, une seule. Un repas solitaire."], [1, "Et discret."]],
    trouvaille:[[0, "Rangée dans un placard. Derrière les bocaux."], [1, "Personne ne cache une pizza par hasard."]],
    contradiction:"Vous n'avez rien entendu, mais vous avez dîné.",
    chute:"Elle avait faim. Elle a été efficace." },

  { id:"amie", coupable:"brune", cachettes:["sac", "manteaux", "chaussures"],
    porteurs:["ticket", "boite", "part"],
    piste:[[0, "La boîte a été ouverte près de l'entrée."], [1, "Quelqu'un qui n'est pas resté."]],
    trouvaille:[[0, "Dans un sac. Prête à partir."], [1, "Elle comptait l'emporter."]],
    contradiction:"Vous êtes arrivée après. Le ticket dit avant.",
    chute:"Elle est arrivée avant tout le monde. Le ticket ne ment pas." },

  { id:"chat", coupable:"chat", cachettes:["lit", "canape", "commode"],
    porteurs:["pattes", "boite", "miettes"],
    piste:[[0, "Ce n'est pas une main qui a fait ça."], [1, "Ne me dis pas que c'est le chat."]],
    trouvaille:[[0, "Poussée jusqu'ici. Regarde les traces."], [1, "Risoto, on doit parler."]],
    contradiction:"Vous n'avez pas de mains. C'est embêtant.",
    chute:"Il a poussé la boîte. Le reste s'est fait tout seul." },

  { id:"chat_complice", coupable:"chat", cachettes:["four", "frigo"],
    porteurs:["pattes", "fromage", "ticket"],
    piste:[[0, "Des traces jusqu'à la cuisine."], [1, "Il a eu de l'aide pour ouvrir, quand même."]],
    trouvaille:[[0, "Dans le four. Éteint, heureusement."], [1, "Un chat n'ouvre pas un four."]],
    contradiction:"Quelqu'un a ouvert pour vous. Mais c'est vous qui avez mangé.",
    chute:"Il a fait le plus dur. Quelqu'un a ouvert la porte, et n'a rien dit." },

  { id:"rangee", coupable:null, cachettes:["frigo", "placards"],
    porteurs:["ticket", "boite", "assiette"],
    piste:[[0, "Rien n'a été volé. Tout a été rangé."], [1, "C'est pire."]],
    trouvaille:[[0, "Au frigo. Sous une assiette."], [1, "Elle n'a jamais quitté l'appartement."]],
    contradiction:"Personne n'a rien pris. Mais quelqu'un a rangé.",
    chute:"Personne ne l'a volée. Quelqu'un l'a rangée. C'est pire." },

  { id:"oubliee", coupable:null, cachettes:["four", "evier"],
    porteurs:["ticket", "fromage", "serviette"],
    piste:[[0, "Froide depuis une demi-heure."], [1, "Quelqu'un voulait la réchauffer."]],
    trouvaille:[[0, "Dans le four. Jamais allumé."], [1, "Donc personne n'a volé. On a juste oublié."]],
    contradiction:"Vous alliez la réchauffer. Vous avez oublié.",
    chute:"Elle attendait dans un four éteint. Depuis le début." },

  { id:"partagee", coupable:"gamer", cachettes:["basse", "tv", "poubelle"],
    porteurs:["part", "miettes", "boite"],
    piste:[[0, "Plusieurs parts, plusieurs mains."], [1, "Une pizza ne se partage pas toute seule."]],
    trouvaille:[[0, "Ce qu'il en reste est là."], [1, "Il en reste une part. Une."]],
    contradiction:"Vous n'étiez pas seul. Mais vous avez fini.",
    chute:"Ils l'ont partagée. Il a pris la dernière part, et le silence avec." },

  { id:"poubelle", coupable:"blonde", cachettes:["poubelle"],
    porteurs:["boite", "serviette", "sauce"],
    piste:[[0, "Quelqu'un a voulu faire disparaître les preuves."], [1, "En les mettant à la poubelle. Audacieux."]],
    trouvaille:[[0, "À la poubelle. Entière."], [1, "Jeter une pizza entière. Quel monde."]],
    contradiction:"On ne jette pas ce qu'on n'a pas touché.",
    chute:"Elle l'a goûtée, détestée, et jetée. Sans le dire à personne." },

  { id:"emportee", coupable:"brune", cachettes:["manteaux", "portant", "commode"],
    porteurs:["ticket", "chorizo", "pattes"],
    piste:[[0, "Des rondelles semées jusqu'à l'entrée."], [1, "Elle est partie avec."]],
    trouvaille:[[0, "Dans une poche de manteau. Sérieusement."], [1, "Ce manteau ne s'en remettra pas."]],
    contradiction:"Votre manteau sent le chorizo. Le mien, non.",
    chute:"Elle l'a glissée dans son manteau. Elle comptait la manger dehors." },
];

const Affaire = {
  scenario:null, coupable:null, cachette:null, reels:[], plan:{}, hortenseFaite:false,

  generer(){
    this.scenario = piocher(SCENARIOS);
    this.coupable = this.scenario.coupable
      ? SUSPECTS.find(s => s.id === this.scenario.coupable) : null;
    this.cachette = piocher(this.scenario.cachettes);

    const obligatoires = this.scenario.porteurs.slice();
    const reste = INDICES.map(i => i.id).filter(id => obligatoires.indexOf(id) < 0);
    melangerTableau(reste);
    this.reels = obligatoires.concat(reste.slice(0, ENQ_OBJECTIF - obligatoires.length));

    /* Toute affaire doit contenir au moins une trace que seul
       Pierre-François sait lire, et au moins un détail que seul Thibaut
       comprend. Sans cette garantie, un tirage sur trois se bouclait
       avec un seul inspecteur et le bouton CHANGER ne servait à rien. */
    const a = id => INDICES.find(i => i.id === id) || {};
    for (const trait of ["expert", "social"]){
      if (this.reels.some(id => a(id)[trait])) continue;
      const candidat = reste.find(id => a(id)[trait] && this.reels.indexOf(id) < 0);
      if (!candidat) continue;
      const remplacable = this.reels.findIndex((id, k) =>
        k >= obligatoires.length && !a(id).expert && !a(id).social);
      const ou = remplacable >= 0 ? remplacable : this.reels.length - 1;
      this.reels[ou] = candidat;
    }

    const places = ZONES.map(z => z.id).filter(id => id !== this.cachette);
    melangerTableau(places);
    this.plan = {};
    this.reels.forEach((id, k) => { this.plan[places[k]] = id; });
    this.hortenseFaite = false;
    return this;
  },

  bonneReponse(){ return this.coupable ? this.coupable.id : "personne"; },
  titreSolution(){ return this.coupable ? this.coupable.nom : "PERSONNE"; },
  chute(){ return this.scenario.chute; },
  piste(){ return this.scenario.piste; },
  trouvaille(){ return this.scenario.trouvaille; },
  contradiction(){ return this.scenario.contradiction; },
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
  etat:ETAT_H2.CACHEE, x:0, vise:0, chrono:0, cible:0, tarte:null, quand:0, faite:false, phase:0,

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
    Enquete.dialogue([[1 - this.cible, "Attends. Tu entends ?"]], 0.4);
    Sons.hortenseEntre();
  },
  majorer(dt){
    this.phase += dt * 7;
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
    for (const s of SUSPECTS){ s.vus = 0; s.coince = false; }
    this.actif = true;
    this.restant = ENQ_DUREE;
    this.indices = 0; this.fouilles = 0; this.fausses = 0;
    this.fini = null; this.secousse = 0; this.message = null;
    this.dossierOuvert = false; this.accusation = false; this.choixAcc = 0;
    this.pizza = null; this.esquiveOuverte = false;
    this.tarteRecue = false; this.tarteEsquivee = false;
    this.gele = 0; this.badge = null; this.badgeT = 0;
    this.actifIdx = 0;
    this.fileDial = [];
    this.accusationsRestantes = ENQ_ACCUSATIONS;
    this.piecesVues = {};
    this.prochainBavardage = hasard(18, 30);
    this.pisteDite = false;

    this.zones = ZONES.map(z => ({
      ref:z, fouillee:false, indice:Affaire.plan[z.id] || null,
      cachette:z.id === Affaire.cachette, pulse:Math.random() * 6.28,
    }));
    this.inspecteurs = Heros.map((h, i) => ({
      heros:i, x:0.10 + i * 0.05, dir:1, marche:0, pas:0, fouille:0, cible:-1, sale:0,
    }));
    Camera.xEnq = 0;
  },

  /* Pendant l'introduction, l'enquête n'est pas encore montée : il n'y
     a pas d'inspecteurs. Renvoyer un sosie inoffensif plutôt que
     `undefined` évite qu'un simple affichage fasse tomber la boucle. */
  pretes(){ return this.inspecteurs.length === 2; },
  actifIns(){ return this.inspecteurs[this.actifIdx] || { heros:0, x:0.1, dir:1, marche:0, pas:0, fouille:0, cible:-1, sale:0 }; },
  autreIns(){ return this.inspecteurs[1 - this.actifIdx] || this.actifIns(); },
  estPF(ins){ return Heros[ins.heros].sprite === "pierre"; },
  changer(){ if (this.actif){ this.actifIdx = 1 - this.actifIdx; Sons.clic(); } },
  marcher(d){ if (this.actif && !this.dossierOuvert && !this.accusation) this.actifIns().marche = d; },
  dire(txt, duree){ this.message = txt; this.messageT = 0; this.messageDuree = duree || 1.8; },

  /* Une réplique après l'autre, cadencées par le chrono du jeu. Les
     empiler d'un coup les rendait illisibles ; un setTimeout les aurait
     laissées courir pendant le dossier. */
  dialogue(paires, delai){
    this.fileDial = (this.fileDial || []).concat(paires.map((p, i) => ({
      qui:p[0], txt:p[1], quand:(delai || 0) + i * 1.5,
    })));
  },
  majDialogue(dt){
    if (!this.fileDial || !this.fileDial.length) return;
    for (const r of this.fileDial) r.quand -= dt;
    while (this.fileDial.length && this.fileDial[0].quand <= 0){
      const r = this.fileDial.shift();
      Effets.parole({ heros:this.inspecteurs[r.qui].heros }, r.txt, 2.0);
    }
  },
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
      this.dialogue(Affaire.trouvaille(), 1.6);
      this.dire("Il reste à désigner qui. Bouton ACCUSER.", 3.2);
      Sons.tarteEsquive(); Sons.palier();
      ins.cible = -1;
      return;
    }

    if (z.indice){
      const ind = INDICES.find(i => i.id === z.indice);
      /* Symétrique de l'expertise : certaines choses ne parlent qu'à
         Thibaut, qui connaît les gens et les habitudes. Sans ça, on
         jouait tout le niveau avec Pierre-François. */
      if (ind.social && pf){
        this.fausses++;
        Effets.parole({ heros:ins.heros }, ind.analyse, 1.8);
        this.dire("Thibaut connaît mieux la maison.", 2.0);
        Sons.bip(190, 0.16, "sine", 0.14, 130);
        ins.cible = -1;
        return;
      }
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
      Effets.parole({ heros:ins.heros }, (pf && !ind.social) ? ind.analyse : ind.brut, 2.6);
      const echo = ECHOS[ind.id];
      if (echo) this.dialogue([[1 - this.actifIdx, echo[pf ? 0 : 1]]], 1.4);
      Sons.reussite(Math.min(7, this.indices));
      this.secousse = 0.25;
      if (this.indices === 3) this.dire("Assez pour accuser. Mais où est la pizza ?", 2.8);
      else if (this.indices === 4 && !this.pisteDite){
        this.pisteDite = true;
        this.dialogue(Affaire.piste(), 3.0);
      }
    } else {
      z.fouillee = true; this.fouilles++;
      this.fausses++;
      const r = RIEN[z.ref.id];
      Effets.parole({ heros:ins.heros }, r ? (pf ? r.pf : r.th) : "Rien.", 2.4);
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
    /* Assez d'indices en poche, et la bonne personne en face : la
       contradiction saute aux yeux. C'est la seule récompense concrète
       de l'interrogatoire, et elle ne tombe qu'une fois. */
    if (this.indices >= 4 && s.id === Affaire.bonneReponse() && !s.coince){
      s.coince = true;
      this.dialogue([[this.actifIdx, Affaire.contradiction()]], 1.6);
      this.poserBadge("suspect");
      Sons.reussite(6);
    }
  },

  /* --------- dossier et accusation --------- */
  basculerDossier(){
    if (!this.actif) return;
    this.dossierOuvert = !this.dossierOuvert;
    if (this.dossierOuvert) this.accusation = false;
    Sons.clic();
  },
  /* Ce qu'il manque pour conclure, en clair. Le joueur ne doit pas
     avoir à deviner qu'il faut AUSSI avoir retrouvé la pizza. */
  peutConclure(){ return this.indices >= 3; },
  cePquiManque(){
    if (this.indices < 3) return "Il faut au moins trois indices.";
    if (!this.pizza) return "Il faut encore retrouver la pizza.";
    return null;
  },

  ouvrirAccusation(){
    if (!this.actif) return;
    if (this.indices < 3){ this.dire("Trois indices, au minimum.", 2.0); return; }
    this.accusation = true; this.dossierOuvert = false; this.choixAcc = 0;
    Sons.clic();
  },
  /* Toucher directement une ligne de la liste : sur un téléphone,
     naviguer avec deux flèches pour valider avec une troisième touche
     n'a aucun sens. */
  viserAccusation(fy){
    if (!this.accusation) return;
    const n = SUSPECTS.length + 1;
    const y0 = 0.30, pas = 0.10;
    const i = Math.round((fy - y0) / pas);
    if (i < 0 || i >= n) return;
    if (i === this.choixAcc){ this.valider(); return; }
    this.choixAcc = i;
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
      this.accusationsRestantes--;
      this.poserBadge("suspect");
      Sons.erreur();
      if (this.accusationsRestantes <= 0){
        /* Deux noms, pas trois : sans cette limite, on finissait par
           citer tout le monde jusqu'à tomber juste. */
        this.dialogue([[0, "On s'est trompés deux fois."], [1, "On ne nous laissera pas recommencer."]], 0.3);
        this.terminer(false);
        return false;
      }
      this.dire("Ça ne tient pas. Une seule autre chance.", 2.6);
      this.restant -= ENQ_MAUVAISE;
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
    this.dialogue([[i, "..."], [1 - i, "Ce n'est pas la pizza non plus."]], 0.8);
    Sons.tarteImpact();
  },
  esquiver(){
    if (!HortenseApp.esquiver()) return false;
    this.tarteEsquivee = true;
    Score.points += ENQ_ESQUIVE_PTS;
    this.poserBadge("esquive");
    this.dialogue([[this.actifIdx, "Encore elle."], [1 - this.actifIdx, "Ce n'est pas la pizza, ça."]], 0.6);
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

    /* un mot en entrant dans une pièce, une seule fois */
    const piece = PIECES.find(p => chef.x < p.jusqua);
    if (piece && !this.piecesVues[piece.id]){
      this.piecesVues[piece.id] = true;
      if (this.fouilles > 0 || piece.id !== "entree") this.dialogue([[this.actifIdx, piece.ligne]], 0.2);
    }

    /* et de loin en loin, ils se parlent */
    this.prochainBavardage -= dt;
    if (this.prochainBavardage <= 0 && !(this.fileDial && this.fileDial.length)){
      this.prochainBavardage = hasard(22, 38);
      const k = entier(0, BAVARDAGES.length / 2 - 1) * 2;
      this.dialogue([BAVARDAGES[k], BAVARDAGES[k + 1]], 0);
    }
    this.majDialogue(dt);

    HortenseApp.majorer(dt);
    Camera.suivreEnq(chef.x, dt);

    if (this.restant <= 0){ this.restant = 0; this.terminer(false); }
    Effets.majorer(dt);
  },
};
