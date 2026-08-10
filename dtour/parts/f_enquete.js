
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
const ENQ_PORTEE = 0.026;           /* portée pour les meubles, en fraction d'image */
/* Les gens s'abordent de plus loin qu'un tiroir ne s'ouvre : la portée
   de la parole est celle à laquelle leur nom s'affiche, pas moins. On
   voyait le nom sans pouvoir encore adresser la parole. */
const ENQ_PORTEE_GENS = ENQ_PORTEE * 2.2;
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
  { id:"billet",    sprite:"ind_billet",    nom:"Billet de cinq euros",
    analyse:"Cinq euros. Posé bien à plat, pas tombé de poche.",
    brut:"Cinq euros ! On rachète une pizza ?" },
  { id:"manette",   sprite:"ind_serviette", nom:"Manette grasse",
    analyse:"Une manette. Sale.", brut:"Des traces de doigts gras. Il a joué en mangeant.", social:true },
];

/* ---------- ce que l'autre en dit ----------
   Trouver un indice déclenche un échange à deux voix : celui qui fouille
   annonce, l'autre commente. C'est ce qui fait qu'ils ont l'air de
   travailler ensemble plutôt que de se relayer. */
const ECHOS = {
  sauce:["Tiède ? Donc récent.", "Ne touche pas. Enfin, trop tard."],
  billet:["Personne ne paie pour un vol.", "Alors ce n'est pas un vol. C'est un remboursement."],
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



/* ---------- ce dont on parle ----------
   Un sujet tient la question ET les réponses possibles. Avant, les
   questions défilaient d'un côté et les réponses de l'autre : on
   demandait l'heure et on s'entendait répondre qu'il y avait deux
   pizzas. Ici la réponse répond.

   Trois versions par sujet :
     pf  ce qu'on répond à Pierre-François, qui est de la famille ou de
         la bande — il n'obtient donc jamais de fait ;
     ok  ce qu'on répond à Thibaut quand on n'a rien fait ;
     ko  ce qu'on lui répond quand c'est nous.

   Pierre-François TUTOIE Teo et sa belle-sœur, et vouvoie Charles qu'il
   ne connaît pas. Thibaut vouvoie tout le monde : c'est un inconnu, et
   c'est précisément ce qui le rend efficace. */
const SUJETS = {
  soeur:[
    { qPF:"Tu étais où, ce soir ?", qTH:"Vous étiez où, ce soir ?",
      pf:"Chez moi. Comme tous les soirs. Passe dimanche.",
      ok:"Dans ma chambre. La porte du couloir grince, je l'aurais entendue.",
      ko:"Dans ma chambre. Enfin, pas tout le temps." },
    { qPF:"Tu as ouvert à quelqu'un ?", qTH:"Vous avez ouvert à quelqu'un ?",
      pf:"Tu me demandes ça à moi ? On en reparle à Noël.",
      ok:"Ma sœur est passée. Elle ne reste jamais longtemps.",
      ko:"J'ai ouvert, oui. Ce n'était pas le livreur." },
    { qPF:"Tu as mangé quoi ?", qTH:"Qu'avez-vous mangé ?",
      pf:"Tu diras à ta femme que j'ai appelé. Deux fois.",
      ok:"Rien. J'attendais que vous rentriez.",
      ko:"Un truc vite fait. Ne me regarde pas comme ça." },
  ],
  teo:[
    { qPF:"Tu as bougé de ce canapé ?", qTH:"Vous avez quitté cette pièce ?",
      pf:"Tu me connais. Assieds-toi plutôt.",
      ok:"Pas une fois. La manette peut en témoigner.",
      ko:"Deux minutes. Pour la cuisine. C'est tout." },
    { qPF:"Tu as entendu la porte ?", qTH:"Avez-vous entendu la porte ?",
      pf:"J'entends surtout que tu me soupçonnes.",
      ok:"Deux fois. À dix minutes d'écart. La seconde plus discrète.",
      ko:"Non. J'avais le son fort." },
    { qPF:"Tu as touché au frigo ?", qTH:"Avez-vous ouvert le réfrigérateur ?",
      pf:"On ne va pas se fâcher pour un frigo.",
      ok:"Jamais. Je ne me sers pas chez les gens.",
      ko:"Ouvert, oui. Sans le toucher. C'est une manière de parler." },
  ],
  charles:[
    { qPF:"Vous êtes qui, exactement ?", qTH:"Vous êtes arrivé quand ?",
      pf:"Vous êtes de la famille, vous ? Ah. Alors rien.",
      ok:"Vers vingt heures. La porte était déjà ouverte.",
      ko:"Je ne suis pas arrivé. Je veux dire : pas resté." },
    { qPF:"Vous connaissez qui, ici ?", qTH:"Vous êtes venu voir qui ?",
      pf:"Personne. Enfin, tout le monde. Enfin.",
      ok:"J'attendais quelqu'un. Elle n'est pas descendue.",
      ko:"Personne. Ne notez pas ça." },
    { qPF:"Vous avez dîné ?", qTH:"Vous avez mangé quelque chose ?",
      pf:"Vous posez des questions étranges.",
      ok:"Non. Je ne comptais pas rester.",
      ko:"J'ai rangé ce qui traînait. Ce n'est pas la même chose." },
  ],
  chat:[
    { qPF:"Risoto. Regarde-moi.", qTH:"Risoto ?",
      pf:"Il ronronne.", ok:"Il détourne la tête.", ko:"Il recule d'un pas." },
    { qPF:"Tu étais où ?", qTH:"Vous étiez où ?",
      pf:"Il se lèche la patte.", ok:"Il fixe la fenêtre.", ko:"Il a du rouge sur le poitrail." },
    { qPF:"Tu as faim ?", qTH:"Vous avez mangé ?",
      pf:"Il s'installe sur mes pieds.", ok:"Aucune déclaration.", ko:"Il se lèche la patte. Longuement." },
  ],
};

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


/* ---------- les gens de l'appartement ----------
   Trois habitués, à des places fixes, et le chat. Ils ne sont pas
   interchangeables : chacun a un lien avec les deux inspecteurs, et ce
   lien change ce qu'on obtient de lui.

     LA SŒUR D'HORTENSE  colocataire. Sœur de celle qui lance des tartes,
                         et belle-sœur de Pierre-François. Elle ne dira
                         donc rien d'utile à Pierre-François.
     CHARLES             son amant. Personne n'est censé savoir qu'il
                         était là. C'est son seul mobile, et il vaut
                         toutes les pizzas du monde.
     TEOPEDO             ami de Pierre-François et d'Hortense. Prof
                         d'histoire. Un passé qu'il ne raconte pas, et
                         des gestes qui le racontent pour lui.
     RISOTO              le chat. Il ne dira rien, mais il laisse des
                         traces.

   Les répliques dépendent de QUI interroge : Pierre-François est de la
   famille et de la bande, on lui ménage la vérité ; Thibaut est un
   inconnu, on se surveille moins devant lui. C'est ce qui fait que les
   deux interrogatoires ne se valent pas. */
/* `bas` est la ligne sur laquelle le personnage POSE, relevée sur le
   décor : l'assise du canapé à 80 %, le plateau de la table à 73,5 %,
   le sol du couloir à 90 %, celui du salon à 92,5 %. Poser tout le monde
   sur la même ligne mettait Charles debout devant sa table et faisait
   flotter Teo au-dessus du canapé. */
const PLACES_FIXES = {
  teo:     { x:0.292, bas:0.805, taille:0.315 },  /* avachi sur la droite du canapé */
  charles: { x:0.660, bas:0.730, taille:0.260 },  /* attablé, place du fond */
  soeur:   { x:0.818, bas:0.900, taille:0.575 },  /* debout dans le couloir */
  chat:    { x:0.452, bas:0.925, taille:0.170 },  /* par terre            */
};

const SUSPECTS_BANQUE = [
  { id:"teo", nom:"TEOPEDO", sprite:"pers_teo",
    role:"Ami de Pierre-François. Professeur d'histoire.",
    fond:[
      "Il récite la chronologie exacte de la soirée. À la minute.",
      "Il connaît le nom du livreur. Et celui d'avant.",
      "Il dit qu'un lieu se lit par couches. Comme une fouille.",
    ] },

  { id:"charles", nom:"CHARLES", sprite:"pers_charles",
    role:"Personne ne sait pourquoi il est là.",
    fond:[
      "Il garde ses lunettes noires à l'intérieur.",
      "Il regarde la porte du couloir toutes les dix secondes.",
      "Il connaît l'appartement mieux qu'un visiteur.",
    ] },

  { id:"soeur", nom:"LA SŒUR D'HORTENSE", sprite:"pers_soeur",
    role:"Colocataire. Belle-sœur de Pierre-François.",
    fond:[
      "Elle a un rouleau de papier toilette dans la poche. Sans explication.",
      "Elle jette un œil au couloir chaque fois qu'on parle de la chambre.",
      "Elle dit « ma sœur » comme on dit « ce n'est pas moi ».",
    ] },

  { id:"chat", nom:"RISOTO", sprite:"susp_chat",
    role:"Le chat. Il était là avant tout le monde.",
    fond:[
      "Il se frotte contre la jambe. Ce n'est pas un aveu.",
      "Il fixe le meuble du bas. Depuis un moment.",
      "Il ronronne. C'est tout ce qu'on obtiendra.",
    ] },
];

/* Les quatre sont toujours là : ce sont les habitants, pas une
   distribution. Ce qui change, c'est ce qu'ils racontent. */
const SUSPECTS = [];

function composerSuspects(){
  SUSPECTS.length = 0;
  for (const s of SUSPECTS_BANQUE){
    const p = PLACES_FIXES[s.id];
    const coupable = Affaire.bonneReponse() === s.id;
    /* Les sujets de l'entretien : ceux de la personne, plus l'anecdote
       propre à l'affaire en cours si elle la concerne. L'anecdote passe
       en premier — c'est elle qui porte le scénario. */
    const sujets = (SUJETS[s.id] || []).slice();
    melangerTableau(sujets);
    const an = Affaire.scenario && Affaire.scenario.anecdote;
    if (an && an.suspect === s.id) sujets.unshift(an);
    SUSPECTS.push({
      id:s.id, nom:s.nom, sprite:s.sprite, role:s.role,
      x:p.x, bas:p.bas, taille:p.taille,
      sujets, coupable,
      fond:piocher(s.fond),
      tour:0, vus:0, vusPF:0, coince:false,
    });
  }
  return SUSPECTS;
}

/* ---------- CaseGenerator -> Affaire ----------
   Dix affaires écrites, tirées au sort au début de la partie et figées
   jusqu'à la fin. Chacune fixe son coupable, ses cachettes possibles,
   les indices qui la portent, et ses quatre répliques. Le tirage part
   de la SOLUTION puis distribue ses indices : une enquête impossible ne
   peut donc pas sortir. */
const SCENARIOS = [
  /* --- la sœur --- */
  { id:"pour_hortense", coupable:"soeur", cachettes:["frigo", "placards"],
    porteurs:["ticket", "assiette", "serviette"],
    piste:[[0, "Elle n'a pas été volée. Elle a été mise de côté."],
           [1, "Mise de côté pour qui ?"]],
    trouvaille:[[0, "Au frigo. Emballée. Étiquetée, presque."],
                [1, "On garde une pizza comme ça pour quelqu'un qu'on aime."]],
    contradiction:"Vous l'avez rangée pour votre sœur. Elle repasse ce soir.",
    chute:"Elle la gardait pour Hortense. Personne n'a rien volé, et personne n'a rien dit." ,
    anecdote:{ suspect:"soeur", qTH:"Pourquoi au frigo, et pas sur le plan ?", qPF:"Pourquoi au frigo, et pas sur le plan ?", ok:"Parce qu'au frigo, ça se garde.", ko:"Elle se garde pour qui ?", pf:"Tu poses des questions de flic." }
  },

  { id:"la_porte", coupable:"soeur", cachettes:["commode", "portant"],
    porteurs:["ticket", "boite", "pattes"],
    piste:[[0, "Quelqu'un est entré sans sonner."],
           [1, "Donc quelqu'un lui a ouvert."]],
    trouvaille:[[0, "Dans la commode. Sous du linge propre."],
                [1, "Il a fallu vouloir la cacher."]],
    contradiction:"Vous avez ouvert à quelqu'un. Ce n'était pas le livreur.",
    chute:"Elle a ouvert la porte à quelqu'un qui n'aurait pas dû venir. La pizza a payé le silence." ,
    anecdote:{ suspect:"soeur", qTH:"Qui avez-vous laissé entrer ?", qPF:"Qui avez-vous laissé entrer ?", ok:"Quelqu'un qui n'aurait pas dû monter.", ko:"Et vous n'avez rien dit.", pf:"Ne me fais pas dire ça." }
  },

  { id:"la_dette", coupable:"soeur", cachettes:["poubelle", "evier"],
    porteurs:["billet", "miettes", "boite"],
    piste:[[0, "Des miettes, et cinq euros posés à côté."],
           [1, "Personne ne paie pour un vol."]],
    trouvaille:[[0, "La boîte est là. Vide, pliée, rangée."],
                [1, "Elle a même fait le tri."]],
    contradiction:"Vous avez laissé cinq euros. On ne rembourse que ce qu'on a pris.",
    chute:"Nous étions sortis. Elle a tout mangé, laissé des miettes et un billet de cinq euros pour qu'on en rachète une. C'est presque de la politesse." ,
    anecdote:{ suspect:"soeur", qTH:"Ces cinq euros, ils sortent d'où ?", qPF:"Ces cinq euros, ils sortent d'où ?", ok:"De mon porte-monnaie. D'où veux-tu qu'ils sortent.", ko:"On ne rembourse que ce qu'on a pris.", pf:"Tu comptes vraiment l'argent, maintenant ?" }
  },

  /* --- Charles --- */
  { id:"amant", coupable:"charles", cachettes:["manteaux", "sac"],
    porteurs:["ticket", "serviette", "fromage"],
    piste:[[0, "Il a mangé vite. Debout. Sans s'asseoir."],
           [1, "Quelqu'un qui ne voulait pas être vu."]],
    trouvaille:[[0, "Dans la poche d'un manteau. Encore chaude."],
                [1, "Ce manteau n'est pas à lui."]],
    contradiction:"Vous n'étiez pas là. Alors pourquoi votre manteau sent le chorizo ?",
    chute:"Il n'était pas censé être là. Il a pris la pizza pour effacer sa visite. Il a effacé l'inverse." ,
    anecdote:{ suspect:"charles", qTH:"Ce manteau est à vous ?", qPF:"Ce manteau est à vous ?", ok:"Il traînait. J'avais froid.", ko:"Il sent le chorizo.", pf:"Il traînait, je vous dis." }
  },

  { id:"effacer", coupable:"charles", cachettes:["poubelle"],
    porteurs:["boite", "sauce", "assiette"],
    piste:[[0, "Deux assiettes lavées. Une seule utilisée."],
           [1, "Quelqu'un a fait le ménage de sa propre présence."]],
    trouvaille:[[0, "À la poubelle. Entière, sous le sac."],
                [1, "On ne jette pas une pizza. On jette une preuve."]],
    contradiction:"Vous avez lavé deux assiettes. Vous dîniez seul ?",
    chute:"Il a tout nettoyé pour qu'on ne sache pas qu'il était venu. Y compris le dîner." ,
    anecdote:{ suspect:"charles", qTH:"Pourquoi deux assiettes lavées ?", qPF:"Pourquoi deux assiettes lavées ?", ok:"J'aime que ce soit propre.", ko:"Vous dîniez donc à deux.", pf:"C'est un crime, être ordonné ?" }
  },

  { id:"le_couloir", coupable:"charles", cachettes:["lit", "commode"],
    porteurs:["ticket", "miettes", "part"],
    piste:[[0, "Des miettes jusqu'au couloir."],
           [1, "Personne ne mange une pizza dans une chambre."]],
    trouvaille:[[0, "Sous le lit. Avec une part entamée."],
                [1, "Il a été dérangé au milieu."]],
    contradiction:"Vous surveillez ce couloir depuis vingt minutes. Pourquoi ?",
    chute:"Il s'était réfugié dans la chambre avec la pizza. Quelqu'un a frappé. Il a tout laissé là." ,
    anecdote:{ suspect:"charles", qTH:"Qu'alliez-vous faire dans le couloir ?", qPF:"Qu'alliez-vous faire dans le couloir ?", ok:"Rien. Je cherchais la salle de bain.", ko:"Elle est de l'autre côté.", pf:"Elle est de ce côté, non ?" }
  },

  /* --- TeoPedo --- */
  { id:"vieux_reflexe", coupable:"teo", cachettes:["frigo", "four"],
    porteurs:["ticket", "fromage", "serviette"],
    piste:[[0, "Aucune trace sur la poignée. Aucune."],
           [1, "Ça s'apprend, ça ?"]],
    trouvaille:[[0, "Au four. Éteint. Refermé proprement."],
                [1, "Un amateur laisse la porte ouverte."]],
    contradiction:"Vous avez ouvert le frigo sans le toucher. Où apprend-on ça ?",
    chute:"Il a ouvert, pris, refermé, sans une marque. Un vieux réflexe, dit-il. Il n'a pas dit de quand." ,
    anecdote:{ suspect:"teo", qTH:"Où avez-vous appris à ouvrir sans laisser de trace ?", qPF:"Où avez-vous appris à ouvrir sans laisser de trace ?", ok:"On apprend des choses, dans une vie.", ko:"Quelle vie, exactement ?", pf:"Tu ne veux pas savoir. Vraiment." }
  },

  { id:"le_prof", coupable:"teo", cachettes:["biblio", "tv"],
    porteurs:["ticket", "boite", "miettes"],
    piste:[[0, "Il connaît l'heure de la livraison à la minute."],
           [1, "Il connaît beaucoup de choses à la minute."]],
    trouvaille:[[0, "Derrière les livres. Rangée par taille."],
                [1, "Même en cachant, il classe."]],
    contradiction:"Vous savez tout de cette soirée. Sauf où vous étiez à dix-neuf heures cinquante.",
    chute:"Le prof d'histoire a daté la scène mieux que nous. Il en avait besoin : il en faisait partie." ,
    anecdote:{ suspect:"teo", qTH:"Comment connaissez-vous l'heure à la minute ?", qPF:"Comment connaissez-vous l'heure à la minute ?", ok:"Je date les choses. C'est mon métier.", ko:"On date ce qu'on a vécu.", pf:"Tu m'as déjà entendu dater une soirée ?" }
  },

  /* --- Risoto, et les chaînes --- */
  { id:"le_chat_seul", coupable:"chat", cachettes:["canape", "lit"],
    porteurs:["pattes", "boite", "chorizo"],
    piste:[[0, "Ce n'est pas une main qui a fait ça."],
           [1, "Ne me dis pas que c'est le chat."]],
    trouvaille:[[0, "Poussée jusque là-dessous. Regarde les traces."],
                [1, "Risoto. On doit parler."]],
    contradiction:"Vous n'avez pas de mains. C'est embêtant pour la boîte.",
    chute:"Il a poussé la boîte du plan de travail au sol, puis du sol au dessous. Le reste s'est fait tout seul." ,
    anecdote:{ suspect:"chat", qTH:"Risoto, cette boîte, c'était vous ?", qPF:"Risoto, cette boîte, c'était vous ?", ok:"Il fixe le meuble du bas.", ko:"Il ne dira rien de plus.", pf:"Il ronronne, ce qui n'est pas une réponse." }
  },

  { id:"la_chaine", coupable:"charles", cachettes:["sac", "poubelle"],
    porteurs:["pattes", "sauce", "boite"],
    piste:[[0, "Le chat a renversé. Quelqu'un a ramassé."],
           [1, "Et n'a rien dit. C'est ça qui compte."]],
    trouvaille:[[0, "Dans un sac. Emballée à la hâte."],
                [1, "Ramasser, ce n'est pas voler. Cacher, si."]],
    contradiction:"Vous avez ramassé après le chat. Pourquoi ne pas le dire ?",
    chute:"Risoto a fait tomber la boîte. Charles a ramassé — et caché, parce qu'être là suffisait à le condamner." ,
    anecdote:{ suspect:"charles", qTH:"Vous avez ramassé après le chat ?", qPF:"Vous avez ramassé après le chat ?", ok:"Quelqu'un devait le faire.", ko:"Ramasser, non. Cacher, oui.", pf:"Ce n'est pas un aveu." }
  },

  /* --- les invraisemblables --- */
  { id:"la_reconstitution", coupable:"teo", cachettes:["biblio", "tv", "commode"],
    porteurs:["ticket", "miettes", "assiette"],
    piste:[[0, "Tout est disposé exactement comme au moment des faits."],
           [1, "Trop exactement."]],
    trouvaille:[[0, "Ce qu'il en reste est rangé par ordre de taille."],
                [1, "Il a refait la scène. En entier."]],
    contradiction:"Pour reconstituer un repas, il faut le refaire. Vous l'avez refait.",
    chute:"Il voulait comprendre comment ça s'était passé. Il a reconstitué la soirée, méthodiquement, et il a mangé la pizza deux fois pour être sûr.",
    anecdote:{ suspect:"teo", qTH:"Vous avez reconstitué la soirée ?", qPF:"Tu as encore tout reconstitué ?",
      ok:"Mentalement. C'est un exercice.", ko:"On ne reconstitue bien qu'en refaisant les gestes.",
      pf:"Tu sais que ça m'inquiète, quand tu fais ça." } },

  { id:"le_pari", coupable:"charles", cachettes:["basse", "sac"],
    porteurs:["chorizo", "serviette", "part"],
    piste:[[0, "Il a mangé vite. Très vite."],
           [1, "Trop vite pour quelqu'un qui avait faim."]],
    trouvaille:[[0, "Ce qu'il en reste tient dans une main."],
                [1, "Quatre minutes. Il a dû s'entraîner."]],
    contradiction:"On ne mange pas une pizza en quatre minutes sans raison.",
    chute:"Il a parié avec le chat qu'il la finirait en moins de quatre minutes. Le chat n'a pas relevé. Il a mangé quand même.",
    anecdote:{ suspect:"charles", qTH:"Vous avez parié quelque chose, ce soir ?", qPF:"Vous pariez souvent ?",
      ok:"Jamais. Je n'ai personne avec qui parier.", ko:"Avec le chat. Il ne compte pas.",
      pf:"Je ne vois pas le rapport avec la pizza." } },

  { id:"le_congelateur", coupable:null, cachettes:["frigo"],
    porteurs:["ticket", "fromage", "boite"],
    piste:[[0, "Elle est passée du chaud au froid en dix minutes."],
           [1, "Personne ne fait ça par accident."]],
    trouvaille:[[0, "Au congélateur. Dure comme un carreau."],
                [1, "Quelqu'un a voulu la garder au chaud. Au congélateur."]],
    contradiction:"On ne garde pas une pizza au chaud dans un congélateur.",
    chute:"Quelqu'un a voulu bien faire. Personne ne l'a volée : elle a été mise à congeler pour rester bonne, ce qui reste discutable.",
    anecdote:{ suspect:"teo", qTH:"Qui range les restes, ici ?", qPF:"C'est toi qui ranges les restes ?",
      ok:"Personne. C'est bien le problème de cet appartement.", ko:"Moi. Et je range bien.",
      pf:"Tu ranges toujours des choses au mauvais endroit." } },

  { id:"le_regime", coupable:"soeur", cachettes:["portant", "lit", "commode"],
    porteurs:["billet", "serviette", "chorizo"],
    piste:[[0, "Elle l'a cachée. Puis elle l'a retrouvée."],
           [1, "Se cacher quelque chose à soi-même, ça se paie."]],
    trouvaille:[[0, "Sous une pile de linge. Bien enfouie."],
                [1, "Elle l'a cachée d'elle-même. Et elle a perdu."]],
    contradiction:"Vous l'avez cachée pour ne pas la manger. Ça n'a pas suffi.",
    chute:"Elle commençait un régime le lendemain. Elle a caché la pizza pour tenir. Elle a tenu quarante minutes.",
    anecdote:{ suspect:"soeur", qTH:"Vous cachez souvent de la nourriture ?", qPF:"Tu caches encore des trucs à toi-même ?",
      ok:"Jamais. Je n'ai rien à me cacher.", ko:"Une fois. Ça n'a pas marché.",
      pf:"On avait dit qu'on ne parlait plus de ça." } },

  { id:"la_sieste", coupable:null, cachettes:["four", "evier"],
    porteurs:["ticket", "assiette", "miettes"],
    piste:[[0, "Une assiette utilisée avant notre départ."],
           [1, "Avant notre départ ?"]],
    trouvaille:[[0, "Ce qu'il en reste était déjà là quand nous sommes partis."],
                [1, "Pierre-François. Regarde-moi."]],
    contradiction:"Personne n'a rien pris après notre départ. Le problème est avant.",
    chute:"Personne n'a volé la pizza. Pierre-François en a mangé la moitié avant de sortir, puis a fait une sieste et a tout oublié. L'enquête aura duré cinq minutes de plus que nécessaire.",
    anecdote:{ suspect:"teo", qTH:"Vous les avez vus partir ?", qPF:"Tu nous as vus partir ?",
      ok:"Oui. L'un des deux avait l'air repu.", ko:"Je n'ai rien vu. Je jouais.",
      pf:"Tu me regardes bizarrement, là." } },

  { id:"le_double", coupable:"charles", cachettes:["sac", "manteaux", "poubelle"],
    porteurs:["ticket", "boite", "billet"],
    piste:[[0, "Deux tickets. Une seule livraison enregistrée."],
           [1, "Il y en avait deux, donc."]],
    trouvaille:[[0, "La première. Intacte, jamais ouverte."],
                [1, "Il en a commandé une seconde pour cacher la première."]],
    contradiction:"Vous avez payé deux fois. Une seule pizza a été mangée.",
    chute:"Il en a commandé une deuxième pour que personne ne remarque la disparition de la première. Il a doublé le problème et le budget.",
    anecdote:{ suspect:"charles", qTH:"Combien de pizzas sont arrivées ce soir ?", qPF:"Vous comptez bien, vous ?",
      ok:"Une. J'ai vu passer le livreur une fois.", ko:"Une. Enfin, une à la fois.",
      pf:"Vous hésitez sur un chiffre simple." } },

  { id:"la_tarte", coupable:null, cachettes:["placards", "evier"],
    porteurs:["ticket", "chorizo", "assiette"],
    piste:[[0, "Quelqu'un est venu, a échangé quelque chose, et est reparti."],
           [1, "Échangé ?"]],
    trouvaille:[[0, "Dans le placard. À la place d'autre chose."],
                [1, "Il y avait une tarte au citron ici. Plus maintenant."]],
    contradiction:"Personne n'a volé. Quelqu'un a troqué.",
    chute:"Hortense est passée. Elle a laissé une tarte au citron et emporté l'idée. La pizza, elle, n'a jamais bougé." ,
    anecdote:{ suspect:"soeur", qTH:"Qu'est-ce qui a disparu du placard ?", qPF:"Qu'est-ce qui a disparu du placard ?", ok:"Une tarte au citron. Ma sœur adore ça.", ko:"Elle a donc échangé.", pf:"Elle passe, elle prend, elle repart." }
  },
];

const Affaire = {
  scenario:null, coupable:null, cachette:null, reels:[], plan:{}, hortenseFaite:false,

  generer(){
    this.scenario = piocher(SCENARIOS);
    this.coupable = this.scenario.coupable
      ? SUSPECTS_BANQUE.find(s => s.id === this.scenario.coupable) : null;
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
  /* Une carte garde l'indice ET l'endroit. « Sauce tomate » ne veut
     rien dire sans « sur la table basse » : c'est le lieu qui fait la
     déduction, pas l'objet. */
  ajouter(ind, ou){
    if (this.cartes.some(c => c.id === ind.id)) return;
    this.cartes.push({ id:ind.id, nom:ind.nom, sprite:ind.sprite, ou:ou });
  },
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
  etat:ETAT_H2.CACHEE, x:0, vise:0, chrono:0, cible:0, tarte:null, quand:0, faite:false, phase:0, appelee:false,

  raz(){
    this.etat = ETAT_H2.CACHEE; this.faite = false; this.tarte = null;
    this.appelee = false;
    /* entre 35 % et 65 % de la durée : ni au tout début, ni à la fin */
    this.quand = ENQ_DUREE * hasard(0.35, 0.65);
  },

  /* Interroger sa sœur, c'est la prévenir. Une fois sur deux elle
     rapplique dans les secondes qui suivent ; sinon l'attente est
     franchement raccourcie, et insister finit toujours par payer. */
  provoquer(){
    if (this.faite || this.etat !== ETAT_H2.CACHEE) return false;
    const reste = this.quand - this.ecoule();
    if (Math.random() < 0.55){
      this.quand = this.ecoule() + hasard(3.5, 8);
      this.appelee = true;
      return true;
    }
    if (reste > 6) this.quand = this.ecoule() + reste * 0.55;
    return false;
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
    Enquete.dire(this.appelee ? "Elle n'a pas mis longtemps." : "Un silence. Puis quelqu'un.", 1.8);
    Enquete.dialogue([[1 - this.cible, this.appelee ? "Sa sœur l'a prévenue." : "Attends. Tu entends ?"]], 0.4);
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

  /* Monter la scène ne lance pas la partie. L'introduction a besoin des
     deux inspecteurs pour les faire entrer à l'image, mais surtout pas
     du chrono ni des commandes. */
  monter(){
    Affaire.generer();
    Dossier.raz();
    HortenseApp.raz();
    composerSuspects();
    this.restant = ENQ_DUREE;
    this.indices = 0; this.fouilles = 0; this.fausses = 0;
    this.fini = null; this.secousse = 0; this.message = null;
    this.dossierOuvert = false; this.accusation = false; this.choixAcc = 0;
    this.pizza = null; this.esquiveOuverte = false;
    this.tarteRecue = false; this.tarteEsquivee = false;
    this.gele = 0; this.badge = null; this.badgeT = 0;
    this.dernier = null;
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
    /* Hors champ à gauche : c'est l'introduction qui les fait entrer. */
    this.inspecteurs = Heros.map((h, i) => ({
      heros:i, x:-0.06 - i * 0.05, dir:1, marche:0, pas:0, fouille:0, cible:-1, sale:0,
    }));
    this.actif = false;
    Camera.xEnq = 0;
  },

  /* Le chrono part ici, et pas avant. */
  lancer(){
    this.actif = true;
    this.restant = ENQ_DUREE;
  },

  demarrer(){
    this.monter();
    this.lancer();
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
  /* `qui` est soit l'indice d'un inspecteur, soit { temoin:i } : la file
     sert aux deux, sinon la réponse d'un témoin aurait dû passer par un
     minuteur séparé. */
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
      if (r.qui && r.qui.temoin !== undefined) Effets.parole(r.qui, r.txt, 2.6);
      else if (this.inspecteurs[r.qui]) Effets.parole({ heros:this.inspecteurs[r.qui].heros }, r.txt, 2.2);
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
    let meilleur = -1, dmin = ENQ_PORTEE_GENS;
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
    /* On n'interroge PLUS ici : quand quelqu'un se tient devant un
       meuble, on ne savait pas ce que le bouton allait faire. Parler a
       sa propre commande. */
    this.dire("Aucun meuble à portée.", 1.2);
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
      Dossier.ajouter(ind, z.ref.nom);
      this.gele = 0.15;
      this.poserBadge("indice");
      /* On annonce ce qu'on a trouvé et où : sans le lieu, le dossier
         devient une liste d'objets sans enquête. */
      this.dernier = ind.nom + " — " + z.ref.nom;
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

  /* Commande « INTERROGER » : elle ne cherche que des gens. */
  parler(){
    if (!this.actif || this.gele > 0 || this.dossierOuvert) return false;
    const is = this.suspectProche();
    if (is < 0){ this.dire("Personne à portée.", 1.2); return false; }
    this.interroger(is);
    return true;
  },

  interroger(is){
    const s = SUSPECTS[is];
    const ins = this.actifIns();
    const pf = this.estPF(ins);
    const sujet = s.sujets[s.tour % s.sujets.length];
    s.tour++;
    if (pf) s.vusPF++; else s.vus++;

    /* Question puis réponse, sur le MÊME sujet. Avant, les deux listes
       défilaient séparément : on demandait l'heure et on s'entendait
       répondre qu'il y avait deux pizzas. */
    Effets.parole({ heros:ins.heros }, pf ? sujet.qPF : sujet.qTH, 2.0);
    Sons.bip(pf ? 470 : 540, 0.08, "sine", 0.1);
    const reponse = pf ? sujet.pf : (s.coupable ? sujet.ko : sujet.ok);
    this.dialogue([[{ temoin:is }, reponse]], 1.25);

    /* Une remarque de fond au premier passage : ce qu'on voit, pas ce
       qu'on entend. Elle vaut pour les deux. */
    if (s.vus + s.vusPF === 1) this.dialogue([[1 - this.actifIdx, s.fond]], 2.9);

    /* Parler à la sœur d'Hortense revient à la prévenir. Elle le dit
       elle-même, pour qu'on comprenne ce qui va suivre. */
    if (s.id === "soeur" && HortenseApp.provoquer()){
      this.dialogue([[{ temoin:is }, piocher([
        "Je viens de prévenir ma sœur, au fait.",
        "Ma sœur adore ce genre d'histoires. Je lui envoie un message.",
        "Elle passait justement dans le quartier.",
      ])]], 2.6);
    }

    if (pf){
      if (!s.gene){
        s.gene = true;
        this.dire(s.id === "soeur" ? "C'est sa belle-sœur. Thibaut ferait mieux."
                : s.id === "teo"   ? "C'est son ami. Thibaut ferait mieux."
                : "Thibaut poserait de meilleures questions.", 2.4);
      }
      return;
    }

    /* Assez d'indices en poche et la bonne personne en face : la
       contradiction saute aux yeux. Une seule fois. */
    if (this.indices >= 4 && s.id === Affaire.bonneReponse() && !s.coince){
      s.coince = true;
      this.dialogue([[this.actifIdx, Affaire.contradiction()]], 2.9);
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
