/* ================== NIVEAU 5 — LE COUPLE MYSTÈRE ==================

   L'arrière-salle du D'Tour, privatisée. Tout le monde est là. DEUX
   personnes se voient en cachette, et il faut trouver lesquelles.

   POURQUOI CE NIVEAU-LÀ PLUTÔT QUE LE PRÉCÉDENT. Le raccompagnage a été
   abandonné après deux essais : la mécanique n'avait pas de décision. On
   marchait, les gens repartaient, rien ne coûtait rien. Ici la contrainte
   est la même pour tout le monde — on ne peut pas être partout — mais
   elle produit un ARBITRAGE, parce que ce qu'on rate ne revient pas :
   pendant qu'on interroge quelqu'un, les autres bougent.

   TROIS FAÇONS DE TROUVER, et c'est ce qui fait la richesse :

   1. LES REGARDER. Loin du joueur, les deux coupables dérivent l'un vers
      l'autre et se retrouvent dans un coin discret — le couloir des
      toilettes ou le fumoir. On approche, ils se séparent. Un joueur
      attentif résout l'affaire SANS POSER UNE SEULE QUESTION.
   2. LES INTERROGER. Chacun dit où il était. Deux personnes ne peuvent
      pas être le seul alibi l'une de l'autre : c'est le recoupement qui
      les trahit, pas le mensonge lui-même.
   3. ÉCOUTER LE COMPTOIR. Les autres invités lâchent des bribes sur ceux
      qu'ils ont vus. Personne ne dit rien de décisif ; tout le monde dit
      un morceau.

   CE N'EST PAS TOUJOURS UNE TROMPERIE. Une fois sur trois les deux
   cachaient autre chose — un cadeau, une dette, une démission. On peut
   avoir raison sur le couple et tort sur le motif, et c'est ce qui
   empêche le niveau d'être une seule blague répétée.
   ================================================================== */

/* LA LIGNE DE SOL. Mesurée à 0,615 la première fois — c'était la
   jonction MUR/PLINTHE derrière les meubles, pas la ligne où l'on marche.
   Vu en jeu : tout le monde flottait, debout sur le buffet et sur le
   banc. Le sol praticable commence là où le carrelage prend toute la
   largeur, soit 0,80 ; les pieds se posent un peu plus bas encore. */
/* LE DÉCOR EST PLUS LARGE QUE L'ÉCRAN : il DÉFILE au lieu d'être écrasé.
   Le premier essai le tirait sur toute la largeur — 1,81 de rapport
   étiré vers 2,16 — et tout se déformait : personne ne touchait le sol,
   les tailles étaient fausses. On garde son rapport et on suit le joueur.
   Mesuré sur l'image livrée : la plinthe s'arrête à 0,79, le sol
   praticable court jusqu'en bas, et les pieds se posent à 0,80. */
const SOIREE_SOL = 0.80;
/* LA TAILLE SE MESURE SUR LA PORTE, pas au jugé. Deux essais ratés dans
   les deux sens : 0,30 sur un décor étiré donnait des géants, 0,235 sur
   le décor corrigé donnait des figurines. L'étalon est l'ouverture des
   toilettes — 0,44 de la hauteur d'écran sur cette image — et un homme
   fait à peu près 0,85 de la hauteur d'une porte. Soit 0,37 une fois la
   taille propre au personnage appliquée, donc 0,41 avant. */
const SOIREE_TAILLE = 0.41;
const SOIREE_MARCHE = 0.115;     /* le joueur                              */
const SOIREE_LENT = 0.026;       /* les invités                            */
const SOIREE_PORTEE = 0.060;     /* à quelle distance on parle             */
/* ILS NE SE MARCHENT PAS DESSUS. Vu en jeu : sept invités empilés dans
   l'embrasure des toilettes, impossible de savoir qui parlait. Ils se
   repoussent doucement sous cet écart — le couple, lui, a le droit de se
   rapprocher jusqu'à 0,05, sinon on ne le verrait jamais ensemble. */
const SOIREE_ECART = 0.085;
const SOIREE_ECART_COUPLE = 0.048;
const SOIREE_DUREE = 210;
const SOIREE_QUESTIONS = 8;      /* on ne peut pas interroger tout le monde */

/* LES CINQ COINS DE LA SALLE, relevés sur le décor. `discret` dit si on
   peut s'y retrouver sans être vu : c'est là que le couple se forme. */
const SOIREE_COINS = [
  { cle:"buffet",   x:0.10, nom:"au buffet",            discret:false },
  { cle:"cadeaux",  x:0.30, nom:"vers les cadeaux",     discret:false },
  { cle:"couloir",  x:0.53, nom:"dans le couloir",      discret:true  },
  { cle:"piste",    x:0.68, nom:"sur la piste",         discret:false },
  { cle:"fumoir",   x:0.88, nom:"dehors, au fumoir",    discret:true  },
];

/* CE QU'ILS CACHAIENT. Le couple est toujours un couple ; le MOTIF, lui,
   change — et c'est le motif qui fait la chute. */
/* LES TROIS CRÉNEAUX. C'est le coeur du nouveau système : chacun a un
   PARCOURS — où il était à 22 h, à 23 h, à minuit — et un témoignage
   porte toujours sur UN créneau. Avant, chacun répondait « j'étais là
   avec X » sans dire QUAND : rien ne pouvait se recouper, et l'enquête
   se réduisait à repérer qui citait qui.

   Maintenant deux personnes qui se disent ensemble à 23 h alors qu'un
   troisième en a vu une ailleurs au même moment, c'est une CONTRADICTION
   datée — et c'est vérifiable dans le carnet. */
const SOIREE_CRENEAUX = ["22 h", "23 h", "minuit"];

const SOIREE_MOTIFS = [
  { cle:"tromperie", titre:"Ils se voient en cachette.",
    chute:"Tout le bar le savait. Sauf toi." },
  { cle:"cadeau", titre:"Ils préparaient une surprise.",
    chute:"Le cadeau était pour toi. Bravo." },
  { cle:"dette", titre:"L'un devait de l'argent à l'autre.",
    chute:"Trois cents balles. Depuis deux ans." },
];

/* Ce qu'on répond quand on n'a rien à cacher : un lieu, une heure, et
   quelqu'un pour le confirmer. Les coupables, eux, se citent l'un
   l'autre — et deux alibis qui se referment l'un sur l'autre, c'est tout
   ce que le joueur a besoin de voir. */
/* CE QU'ILS RÉPONDENT. Une seule tournure — « j'étais là, avec X » —
   revenait à chaque question et le niveau devenait un formulaire. Six
   familles maintenant, et chacune dit quelque chose de DIFFÉRENT sur
   l'enquête :
     alibi     un lieu et un témoin. La brique de base
     vu        il a vu quelqu'un ailleurs. Contredit un alibi
     rien      il n'a rien vu, et ça arrive
     detail    un détail vrai mais inutile. Le bruit de fond
     soupcon   il trouve que quelqu'un est bizarre. Une piste, pas une preuve
     gene      il élude. Les coupables y viennent quand on insiste
   Un innocent pioche partout ; un coupable ne sort JAMAIS de `alibi` et
   `gene`, et c'est ça qui se remarque au bout de deux questions. */
const SOIREE_DITS = {
  alibi: [
    "J'étais {ou}, avec {a}. Tout le temps.",
    "{ou}. Demande à {a}, elle était collée à moi.",
    "Avec {a}. On a pas bougé de la soirée.",
    "Moi ? {ou}. {a} peut te le dire.",
    "{a} et moi, {ou}. On refaisait le monde.",
    "J'ai passé la soirée {ou}. Ambiance.",
  ],
  vu: [
    "J'ai vu {a} filer {ou}, l'air pressé.",
    "{a} a disparu vingt minutes. Vingt.",
    "{a} est revenu {ou} en se recoiffant.",
    "{a} est passé par le couloir. Deux fois.",
    "{a} et {b} se sont croisés {ou}.",
    "{a} cherchait quelqu'un, ça se voyait.",
    "{a} avait son téléphone en mode avion.",
  ],
  rien: [
    "J'ai rien vu, moi. J'ai le dos tourné.",
    "Je regardais le gâteau. Toute la soirée.",
    "Demande à quelqu'un qui boit moins.",
    "Aucune idée. Sincèrement aucune.",
  ],
  detail: [
    "Y'a plus de glaçons. C'est tout ce que je sais.",
    "L'horloge est arrêtée depuis mars.",
    "{a} a ramené un cadeau emballé dans du journal.",
    "Le gâteau, il en manque DEUX parts.",
    "Quelqu'un a écrit sur le miroir.",
  ],
  soupcon: [
    "{a} est bizarre ce soir. Vraiment bizarre.",
    "{a} a rangé son téléphone quand je suis arrivé.",
    "{a} rit trop fort. C'est mauvais signe.",
    "{a} a changé de sujet trois fois.",
    "Si j'étais toi, je regarderais {a}.",
    "{a} a pas décroché un mot de la soirée.",
  ],
  gene: [
    "Moi ? Nulle part. Enfin, ici.",
    "Écoute, j'ai pas que ça à faire.",
    "Tu me fatigues avec tes questions.",
    "J'étais là. Puis ailleurs. Puis là.",
    "Pourquoi tu demandes ça ?",
    "C'est un interrogatoire ou une soirée ?",
    "On peut parler d'autre chose ?",
  ],
};

/* Ce qu'ils lâchent tout seuls, sans qu'on demande. C'est le bruit de la
   salle : ça ne prouve rien et ça oriente le regard. */
const SOIREE_AMBIANCE = [
  "Quelqu'un a vu {a} ?",
  "Il est où, le gâteau ?",
  "{a} danse tout seul depuis dix minutes.",
  "J'ai froid. Qui a ouvert la porte du fumoir ?",
  "On remet de la musique ?",
  "C'est qui qui a pris ma veste ?",
  "Le baby-foot est cassé. Comme d'hab.",
  "Qui a mis ce morceau ? Sérieux, qui ?",
  "J'ai emballé mon cadeau dans du journal. Assumé.",
  "Y'a plus de verres propres. Y'a plus de verres du tout.",
  "MAX a encore triché au baby.",
  "L'horloge est arrêtée. Donc il est jamais trop tard.",
  "Attendez, on chante quand ?",
  "Deux parts de gâteau ont disparu. DEUX.",
  "Je connais personne ici. Je reste.",
  "Y'a un mec qui dort dans les manteaux.",
  "Quelqu'un a vu mon téléphone ? Non ? Tant mieux.",
  "Le fumoir, c'est dehors. Dehors, c'est l'hiver.",
];

/* PRIS SUR LE FAIT. Quand le joueur arrive pendant que les deux sont
   ensemble, ils se séparent — et ils DISENT quelque chose. C'est la
   récompense de la bonne lecture : on ne gagne pas encore, mais on SAIT,
   et on l'entend. Sans ça, la meilleure action du jeu était silencieuse. */
const SOIREE_SURPRIS = [
  "Ah ! Tiens ! Salut !",
  "On parlait de la déco.",
  "Je... je cherchais les toilettes.",
  "C'est pas ce que tu crois.",
  "On se connaît à peine, hein.",
  "Quelle coïncidence, non ?",
];

/* CE QU'ILS RÉPONDENT QUAND ON LES DÉSIGNE. Accuser était muet : un
   anneau rouge et rien d'autre. */
const SOIREE_ACCUSE = [
  "MOI ?!",
  "Non mais tu t'entends ?",
  "J'ai rien fait !",
  "Ça se passe comme ça, alors.",
  "Tu vas le regretter.",
  "Bon. D'accord. Enfin, non.",
];

const SOIREE_GENE = [
  "Moi ? Nulle part. Enfin, ici.",
  "J'étais là. Puis ailleurs. Puis là.",
  "Pourquoi tu demandes ça ?",
  "J'ai rien vu, moi.",
];
const SOIREE_RAGOTS = [
  "J'ai vu {a} partir vers {ou}.",
  "{a} et {b} se sont croisés, je crois.",
  "Demande à {a}, elle regardait tout.",
  "{a} est passé par le couloir. Deux fois.",
];

const Soiree = {
  actif:false, temps:0, fini:0, verdict:null,
  x:0.20, dir:1, foulee:0, marche:0,
  invites:[], couple:[], motif:null, questions:SOIREE_QUESTIONS,
  accuses:[], bulle:null, notes:[], confirme:false,

  raz(){
    this.actif = false; this.temps = 0; this.fini = 0; this.verdict = null;
    this.x = 0.20; this.dir = 1; this.foulee = 0; this.marche = 0;
    this.invites.length = 0; this.couple.length = 0; this.accuses.length = 0;
    this.motif = null; this.questions = SOIREE_QUESTIONS; this.bulle = null;
    this.notes = []; this.confirme = false;
  },

  demarrer(){
    this.raz();
    this.actif = true;
    const dispo = BAR_CLIENTS.filter(c => c.prefixe && Images.table[c.prefixe + "_idle"]);
    /* HUIT INVITÉS : assez pour qu'on ne puisse pas tous les interroger,
       assez peu pour qu'on les distingue de loin. */
    for (let i = 0; i < 8 && dispo.length; i++){
      const ref = dispo.splice(Math.floor(Math.random() * dispo.length), 1)[0];
      /* CHACUN SON COIN AU DÉPART, et on tourne dans la liste : huit
         invités sur cinq coins remplissent la salle au lieu de s'agglutiner
         au centre. Vu en jeu : cinq personnes entre les cadeaux et le
         couloir, la moitié droite vide. */
      const coin = SOIREE_COINS[i % SOIREE_COINS.length];
      this.invites.push({
        ref, x:coin.x + (Math.random() - 0.5) * 0.05, coin,
        cible:coin.x, foulee:Math.random() * 4, dir:1,
        t:hasard(3, 8), dit:null, ditT:0, interroge:false, coupable:false,
        decalage:Math.random() * 6,
      });
    }
    /* LE COUPLE EST VRAISEMBLABLE OU IL N'EST RIEN. On évite deux
       personnes que le bar sait déjà ensemble : Rémy et Bobito ne font
       pas un scandale. */
    const paires = [];
    for (let a = 0; a < this.invites.length; a++)
      for (let b = a + 1; b < this.invites.length; b++){
        const ia = this.invites[a].ref.id, ib = this.invites[b].ref.id;
        const l = LIENS[ia];
        if (l && l.amis && l.amis.indexOf(ib) >= 0 && Math.random() < 0.5) continue;
        paires.push([this.invites[a], this.invites[b]]);
      }
    this.couple = paires.length ? piocher(paires) : this.invites.slice(0, 2);
    for (const q of this.couple) q.coupable = true;
    this.motif = piocher(SOIREE_MOTIFS);

    /* LE PARCOURS DE CHACUN : trois coins, un par créneau. C'est la
       VÉRITÉ de la soirée, et tout le reste en découle. */
    const publics = SOIREE_COINS.filter(c => !c.discret);
    for (const q of this.invites)
      q.parcours = SOIREE_CRENEAUX.map(() => piocher(publics));

    /* LE CRÉNEAU DU RENDEZ-VOUS. Les deux coupables sont ensemble dans un
       coin DISCRET, sur un seul créneau — pas toute la soirée. C'est ce
       qui rend l'affaire trouvable : ils ont un trou commun, pas un
       comportement suspect permanent. */
    this.creneau = Math.floor(Math.random() * SOIREE_CRENEAUX.length);
    const cachette = piocher(SOIREE_COINS.filter(c => c.discret));
    for (const q of this.couple) q.parcours[this.creneau] = cachette;

    /* UN FAUX TÉMOIN. Un innocent couvre quelqu'un — par amitié, par
       erreur, ou parce qu'il a mal vu. Sans lui, tout recoupement était
       une preuve : le joueur qui croise deux témoignages avait gagné.
       Avec lui, il faut TROIS sources concordantes, et se tromper devient
       possible sans que ce soit injuste. */
    const innocents = this.invites.filter(q => !q.coupable);
    this.fauxTemoin = innocents.length ? piocher(innocents) : null;
    if (this.fauxTemoin){
      const couvre = piocher(innocents.filter(q => q !== this.fauxTemoin) || []);
      this.fauxTemoin.couvre = couvre || null;
    }
  },

  loin(iv){ return Math.abs(this.x - iv.x) > 0.22; },

  pas(dt){
    if (!this.actif) return;
    if (this.fini > 0){ this.fini += dt; return; }
    this.temps += dt;

    if (this.marche !== 0){
      this.dir = this.marche;
      this.x = borne(this.x + this.dir * dt * SOIREE_MARCHE, 0.03, 0.97);
      this.foulee += dt * 7;
    }
    if (this.bulle){
      this.bulle.t -= dt;
      if (this.bulle.t <= 0) this.bulle = null;
    }

    for (const iv of this.invites){
      if (iv.ditT > 0){ iv.ditT -= dt; if (iv.ditT <= 0) iv.dit = null; }
      iv.t -= dt;

      /* LE COUPLE SE CHERCHE QUAND ON REGARDE AILLEURS, et se sépare dès
         qu'on approche. C'est l'indice le plus fort du niveau, et le seul
         qui ne passe pas par une phrase. */
      if (iv.coupable){
        const autre = this.couple[0] === iv ? this.couple[1] : this.couple[0];
        const discret = SOIREE_COINS.filter(c => c.discret);
        if (this.loin(iv) && this.loin(autre)){
          const coin = discret[0];
          iv.cible = coin.x + (this.couple[0] === iv ? -0.02 : 0.02);
          iv.coin = coin;
        } else if (Math.abs(this.x - iv.x) < 0.30 && Math.abs(iv.x - autre.x) < 0.12){
          /* on approche : il s'écarte, un peu trop naturellement */
          const fuite = piocher(SOIREE_COINS.filter(c => !c.discret));
          iv.cible = fuite.x; iv.coin = fuite;
          if (!iv.dit){
            iv.dit = piocher(SOIREE_SURPRIS); iv.ditT = 2.6;
          }
        }
      } else if (iv.t <= 0){
        /* CERTAINS NE BOUGENT PAS. Une salle où tout le monde marche tout
           le temps n'a pas de groupes, et c'est aux groupes qu'on lit une
           soirée. Une fois sur trois, il reste où il est et il parle. */
        if (Math.random() < 0.34){
          iv.cible = iv.x;
          if (Math.random() < 0.8){
            const autres = this.invites.filter(q => q !== iv);
            iv.dit = piocher(SOIREE_AMBIANCE)
              .replace("{a}", (piocher(autres) || iv).ref.nom);
            iv.ditT = 2.8;
          }
          iv.t = hasard(4, 10);
        } else {
          const coin = piocher(SOIREE_COINS);
          iv.coin = coin; iv.cible = coin.x + (Math.random() - 0.5) * 0.10;
          iv.t = hasard(5, 12);
        }
      }

      /* HYSTÉRÉSIS : on se met en marche au-delà de 0,018 et on ne
         s'arrête qu'en dessous de 0,008. Un seul seuil faisait vibrer
         ceux qui arrivaient pile dessus — un pas en avant, un pas en
         arrière, indéfiniment. */
      /* ILS SE TOURNENT VERS CELUI QUI PARLE. Une salle où tout le monde
         regarde du même côté n'a pas de groupes : c'est le détail le plus
         cheap et le plus payant de tout le niveau. */
      if (!iv.bouge){
        const voisin = this.invites.find(q =>
          q !== iv && q.dit && Math.abs(q.x - iv.x) < 0.10);
        if (voisin) iv.dir = voisin.x > iv.x ? 1 : -1;
      }
      const d = iv.cible - iv.x;
      iv.bouge = Math.abs(d) > (iv.bouge ? 0.008 : 0.018);
      if (iv.bouge){
        iv.dir = d > 0 ? 1 : -1;
        iv.x = borne(iv.x + iv.dir * dt * SOIREE_LENT, 0.03, 0.97);
        iv.foulee += dt * 3.4;
      }
    }

    /* l'anti-empilement, après tous les déplacements */
    for (let a = 0; a < this.invites.length; a++)
      for (let b = a + 1; b < this.invites.length; b++){
        const p1 = this.invites[a], p2 = this.invites[b];
        const ensemble = p1.coupable && p2.coupable;
        const mini = ensemble ? SOIREE_ECART_COUPLE : SOIREE_ECART;
        const d = p2.x - p1.x;
        if (Math.abs(d) < mini){
          const pousse = (mini - Math.abs(d)) * 0.5 * (d >= 0 ? 1 : -1);
          p1.x = borne(p1.x - pousse, 0.03, 0.97);
          p2.x = borne(p2.x + pousse, 0.03, 0.97);
          /* LA POUSSÉE DÉPLACE AUSSI LA CIBLE. Sans ça, deux invités
             serrés se repoussaient pendant que chacun revenait vers son
             point : ils oscillaient sur place et l'alternance
             marche1/marche2 les faisait CLIGNOTER, l'air bloqués. C'est
             le défaut vu en jeu, et il ne se voyait pas à l'arrêt. */
          p1.cible = p1.x; p2.cible = p2.x;
        }
      }

    if (this.temps >= SOIREE_DUREE && !this.fini) this.terminer(false);
  },

  marcher(d){ if (this.actif && !this.fini) this.marche = d; },

  /* Celui qui est à portée, s'il y en a un. Tout le niveau passe par là :
     parler, accuser, tout se fait EN ÉTANT À CÔTÉ. */
  proche(){
    let best = null, dist = SOIREE_PORTEE;
    for (const iv of this.invites){
      const d = Math.abs(iv.x - this.x);
      if (d < dist){ dist = d; best = iv; }
    }
    return best;
  },

  parler(){
    if (!this.actif || this.fini) return;
    const iv = this.proche();
    if (!iv) return;
    if (!iv.interroge && this.questions <= 0){
      this.bulle = { txt:"Plus le temps de discuter.", t:2.0 };
      return;
    }
    if (!iv.interroge){ iv.interroge = true; this.questions--; }
    iv.dit = this.temoignage(iv); iv.ditT = 3.4;
    /* LE CARNET RETIENT À NOTRE PLACE. Sans lui il fallait mémoriser huit
       alibis en écoutant, ce que personne ne fait sur un téléphone : le
       niveau était une devinette. Avec, deux alibis qui se citent l'un
       l'autre sautent aux yeux, et ça devient une déduction. */
    const note = { nom:iv.ref.nom, txt:iv.dit };
    const i = this.notes.findIndex(n => n.nom === iv.ref.nom);
    if (i >= 0) this.notes[i] = note; else this.notes.push(note);
  },

  /* CE QU'IL RÉPOND. Un innocent dit où il était et cite quelqu'un au
     hasard. Un coupable cite SON COMPLICE — et deux alibis qui se
     referment l'un sur l'autre sont la seule preuve du niveau. */
  temoignage(iv){
    const autres = this.invites.filter(q => q !== iv);
    /* ON RÉPOND SUR UN CRÉNEAU, et on avance dans la soirée à chaque
       question : réinterroger quelqu'un ne redonne pas la même phrase,
       ça donne l'heure suivante. C'est ce qui fait qu'insister a un sens. */
    iv.creneau = ((iv.creneau == null) ? Math.floor(Math.random() * 3)
                                       : (iv.creneau + 1) % 3);
    const c = iv.creneau, heure = SOIREE_CRENEAUX[c];
    const ou = q => ((q.parcours && q.parcours[c]) || SOIREE_COINS[0]).nom;

    if (iv.coupable){
      const autre = this.couple[0] === iv ? this.couple[1] : this.couple[0];
      if (c === this.creneau){
        /* LE CRÉNEAU QU'IL DOIT COUVRIR. Il ment, et il ment BIEN : un
           lieu public, et son complice comme témoin. Les deux racontent
           la même chose — c'est vérifiable, et c'est leur seule faute. */
        iv.presse = (iv.presse || 0) + 1;
        if (iv.presse > 2 && Math.random() < 0.5) return piocher(SOIREE_DITS.gene);
        return "À " + heure + ", j'étais "
             + piocher(SOIREE_COINS.filter(q2 => !q2.discret)).nom
             + ", avec " + autre.ref.nom + ".";
      }
      /* sur les autres créneaux il dit vrai : un coupable n'est pas un
         menteur permanent, et c'est ce qui rend le trou repérable */
      return "À " + heure + ", j'étais " + ou(iv) + ".";
    }

    /* LE FAUX TÉMOIN couvre quelqu'un, sans savoir qu'il brouille tout. */
    if (this === Soiree && this.fauxTemoin === iv && iv.couvre && Math.random() < 0.5)
      return "À " + heure + ", " + iv.couvre.ref.nom + " était avec moi, "
           + ou(iv) + ".";

    /* UN INNOCENT DIT VRAI. Trois façons : où il était, où il a vu
       quelqu'un, ou rien du tout. */
    const r0 = Math.random();
    if (r0 < 0.45) return "À " + heure + ", j'étais " + ou(iv) + ".";
    if (r0 < 0.80){
      const vu = piocher(autres);
      return "À " + heure + ", j'ai vu " + vu.ref.nom + " " + ou(vu) + ".";
    }
    const remplir = t => t
      .replace("{ou}", piocher(SOIREE_COINS).nom)
      .replace("{a}", (piocher(autres) || iv).ref.nom)
      .replace("{b}", (piocher(autres) || iv).ref.nom);

    if (iv.coupable){
      /* IL SE COUVRE, ET IL S'ÉNERVE. La première fois il donne son alibi
         — celui qui cite son complice. Aux suivantes il élude, et c'est
         l'insistance qui le trahit autant que le contenu. */
      iv.presse = (iv.presse || 0) + 1;
      const autre = this.couple[0] === iv ? this.couple[1] : this.couple[0];
      if (iv.presse === 1 || Math.random() < 0.35)
        return remplir(piocher(SOIREE_DITS.alibi))
          .replace(/avec [A-ZÉÈÀÎ' ]+\./, "avec " + autre.ref.nom + ".")
          .replace(/Demande à [A-ZÉÈÀÎ' ]+\./, "Demande à " + autre.ref.nom + ".");
      return piocher(SOIREE_DITS.gene);
    }

    /* et parfois, rien d'utile : c'est le bruit de fond, et une soirée
       où tout le monde a quelque chose à dire n'est pas une soirée. */
    const r = Math.random();
    const seau = r < 0.30 ? "alibi" : r < 0.55 ? "vu" : r < 0.70 ? "soupcon"
               : r < 0.85 ? "detail" : "rien";
    let t = remplir(piocher(SOIREE_DITS[seau]));
    /* CE QU'IL A VRAIMENT VU. Une fois sur quatre, celui qui parle d'un
       autre parle du COUPLE : c'est la seule façon d'avancer sans les
       suivre soi-même, et c'est assez rare pour que ça se mérite. */
    if ((seau === "vu" || seau === "soupcon") && Math.random() < 0.35){
      const vrai = piocher(this.couple);
      t = t.replace(/\b[A-ZÉÈÀÎ][A-ZÉÈÀÎ' .]+\b/, vrai.ref.nom);
    }
    return t;
  },

  /* ACCUSER SE FAIT EN DEUX FOIS : on désigne quelqu'un, puis l'autre. Un
     seul nom ne veut rien dire — c'est un COUPLE qu'on cherche. */
  accuser(){
    if (!this.actif || this.fini) return;
    const iv = this.proche();
    if (!iv) return;
    const i = this.accuses.indexOf(iv);
    if (i >= 0){ this.accuses.splice(i, 1); this.confirme = false; return; }
    /* ON N'ACCUSE PLUS QUE DEUX PERSONNES, et rien ne se déclenche tout
       seul. Avant, le second nom lançait le verdict sans prévenir : on ne
       savait ni qu'il en fallait deux, ni qu'on venait de conclure. */
    if (this.accuses.length >= 2){
      this.bulle = { txt:"Deux noms, c'est déjà beaucoup.", t:2.0 };
      return;
    }
    this.accuses.push(iv);
    iv.dit = piocher(SOIREE_ACCUSE); iv.ditT = 2.4;
  },

  /* LE SEUL GESTE IRRÉVERSIBLE DU NIVEAU, et il faut le vouloir : un
     bouton à part, qui n'apparaît qu'une fois les deux noms posés. */
  confirmer(){
    if (!this.actif || this.fini || this.accuses.length < 2) return;
    if (!this.confirme){
      this.confirme = true;
      this.bulle = { txt:"Tu accuses " + this.accuses[0].ref.nom + " et "
                        + this.accuses[1].ref.nom + ". Sûr ?", t:4.0 };
      return;
    }
    this.terminer(true);
  },

  terminer(accuse){
    this.fini = 0.001;
    const bon = accuse && this.accuses.length === 2 &&
      this.accuses.every(q => q.coupable);
    this.verdict = {
      bon,
      couple:this.couple.map(q => q.ref.nom).join(" et "),
      accuses:this.accuses.map(q => q.ref.nom).join(" et "),
      motif:this.motif,
      restant:this.questions,
    };
    if (bon) Score.ajouter(400 + this.questions * 50);
  },

  /* LES POSES SCINTILLAIENT, et deux causes se cumulaient :
     1. la foulée avançait MÊME À L'ARRÊT, donc `idle` et `idle2`
        alternaient plusieurs fois par seconde ;
     2. la marche continuait d'alterner quand il était presque arrêté.
     La foulée ne tourne plus que quand il avance, et le repos change de
     pose sur une horloge LENTE, propre à chacun — sinon les huit
     changent en même temps, ce qui se voit encore plus. */
  pose(iv){
    const p = iv.ref.prefixe, dispo = n => Images.table[p + "_" + n] ? n : null;
    if (iv.bouge)
      return dispo("marche" + (1 + (Math.floor(iv.foulee) % 2)))
          || dispo("marche1") || "idle";
    /* SUR LA PISTE, ON DANSE. C'est le seul endroit de la salle où le
       décor promet quelque chose — boule à facettes, spots au sol — et
       personne n'y faisait rien. */
    if (iv.coin && iv.coin.cle === "piste")
      return dispo("danse" + (1 + (Math.floor(Soiree.temps * 2.2 + iv.decalage) % 2)))
          || dispo("danse1") || "idle";
    return (Math.floor((Soiree.temps + iv.decalage) / 3.5) % 2 && dispo("idle2"))
        || "idle";
  },
};

const SoireeVue = {
  /* LA SALLE EST PLUS LARGE QUE L'ÉCRAN. Sa largeur en pixels vient de
     son RAPPORT, pas de l'écran : c'est ce qui empêche la déformation.
     La caméra suit le joueur et se borne aux deux bouts — on ne voit
     jamais le vide au-delà du décor. */
  larg(){
    const f = Images.table["fond_salle"];
    const r = (f && f.naturalWidth) ? f.naturalWidth / f.naturalHeight : 2.55;
    return Math.max(Camera.L, Camera.H * r);
  },
  origine(){
    return borne(Camera.L / 2 - Soiree.x * this.larg(),
                 Camera.L - this.larg(), 0);
  },
  ex(x){ return this.origine() + x * this.larg(); },

  dessiner(){
    const H = Camera.H, L = Camera.L;
    const fond = Images.table["fond_salle"];
    if (fond && fond.naturalWidth)
      ctx.drawImage(fond, this.origine(), 0, this.larg(), H);
    else { ctx.fillStyle = "#2a1c10"; ctx.fillRect(0, 0, L, H); }

    const gens = Soiree.invites.slice().sort((a, b) => a.x - b.x);
    for (const iv of gens) this.dessinerUn(iv);
    this.dessinerJoueur();
    this.dessinerHud();
    if (Soiree.fini > 0) this.dessinerVerdict();
  },

  dessinerUn(iv){
    const H = Camera.H, L = Camera.L;
    const nom = iv.ref.prefixe + "_" + Soiree.pose(iv);
    const spr = Images.table[nom] || Images.table[iv.ref.prefixe + "_idle"];
    if (!spr || !spr.naturalWidth) return;
    const sh = H * SOIREE_TAILLE * (iv.ref.taille || 1);
    const sl = sh * spr.naturalWidth / spr.naturalHeight;
    const x = this.ex(iv.x), y = H * SOIREE_SOL + H * 0.012;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.30)";
    ctx.beginPath(); ctx.ellipse(x, y, sl * 0.22, H * 0.008, 0, 0, 6.283); ctx.fill();
    if (iv.dir < 0){ ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }
    ctx.drawImage(spr, x - sl / 2, y - sh, sl, sh);
    ctx.restore();

    /* CE QU'ON A DÉJÀ DEMANDÉ SE VOIT. Sans ça, on réinterroge les mêmes
       et on brûle ses questions sans s'en apercevoir. */
    if (iv.interroge){
      ctx.save(); ctx.globalAlpha = 0.6; ctx.fillStyle = "#7CFFB2";
      ctx.beginPath(); ctx.arc(x, y - sh - H * 0.012, H * 0.008, 0, 6.283); ctx.fill();
      ctx.restore();
    }
    if (Soiree.accuses.indexOf(iv) >= 0){
      ctx.save(); ctx.strokeStyle = "#FF5A4A"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(x, y, sl * 0.26, H * 0.011, 0, 0, 6.283);
      ctx.stroke(); ctx.restore();
    }
    /* le nom sous celui qu'on peut aborder : on joue avec des gens qu'on
       connaît, encore faut-il savoir qui on a devant soi */
    if (Soiree.proche() === iv && Soiree.fini <= 0){
      ctx.save();
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.font = "800 " + Math.round(H * 0.026) + "px 'Baloo 2', system-ui, sans-serif";
      ctx.fillStyle = "#F6F2FF";
      ctx.fillText(iv.ref.nom, x, y + H * 0.010);
      ctx.restore();
    }
    if (iv.dit){
      const etage = Soiree.invites.indexOf(iv) % 3;
      BarVue.bulle(iv.dit, x, y - sh - H * (0.020 + etage * 0.052),
                   L * 0.50, 0.028, borne(iv.ditT / 0.4, 0, 1));
    }
  },

  dessinerJoueur(){
    const H = Camera.H;
    const champ = Tournee.champion || BAR_CHAMPIONS[0];
    const base = champ.prefixe + "_";
    const nom = Soiree.marche !== 0
      ? base + "marche" + (1 + (Math.floor(Soiree.foulee) % 3)) : base + "idle";
    const spr = Images.table[nom] || Images.table[base + "idle"];
    if (!spr || !spr.naturalWidth) return;
    const sh = H * SOIREE_TAILLE * 1.06;
    const sl = sh * spr.naturalWidth / spr.naturalHeight;
    const x = this.ex(Soiree.x), y = H * SOIREE_SOL + H * 0.016;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.34)";
    ctx.beginPath(); ctx.ellipse(x, y, sl * 0.24, H * 0.009, 0, 0, 6.283); ctx.fill();
    if (Soiree.dir < 0){ ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }
    ctx.drawImage(spr, x - sl / 2, y - sh, sl, sh);
    ctx.restore();
  },

  /* LE CARNET, ouvert en permanence en haut à gauche. Il dit trois
     choses d'un coup d'oeil : ce qu'on cherche (DEUX noms), où on en est,
     et ce qu'on a appris. C'est ce qui manquait pour que le niveau se
     comprenne sans explication. */
  dessinerCarnet(){
    const H = Camera.H, L = Camera.L;
    /* IL MANGEAIT L'ÉCRAN. Six notes, un fond à peine teinté, du texte
       coupé au milieu des mots : on ne voyait plus ni la salle ni le
       carnet. Trois décisions, toutes prises en le regardant :
       1. TROIS notes, pas six. Ce sont les trois dernières qui servent
          au recoupement ; au-delà, on relit au lieu de jouer.
       2. UN FOND OPAQUE. Un panneau translucide sur un décor chargé n'est
          lisible ni comme panneau ni comme décor.
       3. LE TEXTE EST COUPÉ SUR SA LARGEUR RÉELLE, mesurée, et pas à un
          nombre de signes au jugé — c'est ce qui produisait « au buf... »
          alors qu'il restait la place. */
    const marge = H * 0.024;
    const police = t => Math.round(H * t) + "px 'Baloo 2', system-ui, sans-serif";
    const lignes = Soiree.notes.slice(-3);
    const l = Math.min(L * 0.40, H * 0.90);
    const haut = H * 0.088 + lignes.length * H * 0.030;
    ctx.save();
    ctx.fillStyle = "rgba(10,8,18,.90)";
    arrondi(marge, marge, l, haut, H * 0.012); ctx.fill();
    ctx.textAlign = "left"; ctx.textBaseline = "top";

    ctx.font = "800 " + police(0.023);
    ctx.fillStyle = "#FFD98A";
    ctx.fillText("QUI SE VOIT EN CACHETTE ?", marge + H * 0.012, marge + H * 0.010);

    ctx.font = "800 " + police(0.022);
    for (let i = 0; i < 2; i++){
      const q = Soiree.accuses[i];
      ctx.fillStyle = q ? "#FF8A6A" : "rgba(246,242,255,.38)";
      ctx.fillText((i + 1) + ". " + (q ? q.ref.nom : "— — —"),
                   marge + H * 0.012 + i * l * 0.5, marge + H * 0.040);
    }

    ctx.font = "600 " + police(0.019);
    const large = l - H * 0.024;
    lignes.forEach((n, i) => {
      ctx.fillStyle = "rgba(246,242,255,.88)";
      let t = n.nom + " — " + n.txt;
      while (ctx.measureText(t).width > large && t.length > 8)
        t = t.slice(0, t.length - 2);
      if (t !== n.nom + " — " + n.txt) t += "…";
      ctx.fillText(t, marge + H * 0.012, marge + H * 0.072 + i * H * 0.030);
    });
    ctx.restore();
    ctx.textAlign = "left";
  },

  dessinerHud(){
    const H = Camera.H, L = Camera.L;
    ctx.save();
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.font = "800 " + Math.round(H * 0.040) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.fillStyle = "#F6F2FF";
    const s = Math.max(0, Math.ceil(SOIREE_DUREE - Soiree.temps));
    /* LE CHRONO PASSE À DROITE. Au centre il se retrouvait sous le
       carnet — « 8 Q_ESTIONS » — et deux informations superposées n'en
       font aucune. */
    ctx.textAlign = "right";
    ctx.fillText(Soiree.questions + " QUESTIONS — " + Math.floor(s / 60) + ":"
                 + String(s % 60).padStart(2, "0"), L - H * 0.11, H * 0.03);
    ctx.textAlign = "center";
    ctx.restore();
    this.dessinerCarnet();
    if (Soiree.bulle)
      BarVue.bulle(Soiree.bulle.txt, L / 2, H * 0.16, L * 0.6, 0.030,
                   borne(Soiree.bulle.t / 0.4, 0, 1));
  },

  dessinerVerdict(){
    const H = Camera.H, L = Camera.L;
    const v = Soiree.verdict;
    if (!v) return;
    ctx.save();
    ctx.fillStyle = "rgba(9,7,18," + borne(Soiree.fini * 1.2, 0, 0.82) + ")";
    ctx.fillRect(0, 0, L, H);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = v.bon ? "#7CFFB2" : "#FF8A6A";
    ctx.font = "800 " + Math.round(H * 0.070) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.fillText(v.bon ? "C'ÉTAIT EUX" : "RATÉ", L / 2, H * 0.34);
    ctx.fillStyle = "#F6F2FF";
    ctx.font = "800 " + Math.round(H * 0.044) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.fillText(v.couple, L / 2, H * 0.47);
    ctx.font = "600 " + Math.round(H * 0.034) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.fillText(v.motif.titre, L / 2, H * 0.57);
    ctx.fillText(v.motif.chute, L / 2, H * 0.65);
    /* CE QU'ON AVAIT DIT, pour mesurer de combien on s'est planté. */
    if (!v.bon && v.accuses){
      ctx.fillStyle = "rgba(246,242,255,.62)";
      ctx.font = "600 " + Math.round(H * 0.028) + "px 'Baloo 2', system-ui, sans-serif";
      ctx.fillText("Tu avais dit " + v.accuses + ".", L / 2, H * 0.75);
    }
    ctx.restore();
  },
};
