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
const SOIREE_SOL = 0.84;
const SOIREE_TAILLE = 0.30;
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
    "J'étais {ou}, avec {a}.",
    "{ou}, tout le temps. Demande à {a}.",
    "Avec {a}, {ou}. On a pas bougé.",
    "Moi ? {ou}. {a} peut le dire.",
  ],
  vu: [
    "J'ai vu {a} filer {ou}.",
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
    "{a} a changé de sujet trois fois.",
    "Si j'étais toi, je regarderais {a}.",
    "{a} a pas décroché un mot de la soirée.",
  ],
  gene: [
    "Moi ? Nulle part. Enfin, ici.",
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
  accuses:[], bulle:null,

  raz(){
    this.actif = false; this.temps = 0; this.fini = 0; this.verdict = null;
    this.x = 0.20; this.dir = 1; this.foulee = 0; this.marche = 0;
    this.invites.length = 0; this.couple.length = 0; this.accuses.length = 0;
    this.motif = null; this.questions = SOIREE_QUESTIONS; this.bulle = null;
  },

  demarrer(){
    this.raz();
    this.actif = true;
    const dispo = BAR_CLIENTS.filter(c => c.prefixe && Images.table[c.prefixe + "_idle"]);
    /* HUIT INVITÉS : assez pour qu'on ne puisse pas tous les interroger,
       assez peu pour qu'on les distingue de loin. */
    for (let i = 0; i < 8 && dispo.length; i++){
      const ref = dispo.splice(Math.floor(Math.random() * dispo.length), 1)[0];
      const coin = SOIREE_COINS[i % SOIREE_COINS.length];
      this.invites.push({
        ref, x:coin.x + (Math.random() - 0.5) * 0.05, coin,
        cible:coin.x, foulee:Math.random() * 4, dir:1,
        t:hasard(3, 8), dit:null, ditT:0, interroge:false, coupable:false,
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
          if (!iv.dit && Math.random() < 0.03){
            iv.dit = piocher(SOIREE_GENE); iv.ditT = 2.2;
          }
        }
      } else if (iv.t <= 0){
        /* CERTAINS NE BOUGENT PAS. Une salle où tout le monde marche tout
           le temps n'a pas de groupes, et c'est aux groupes qu'on lit une
           soirée. Une fois sur trois, il reste où il est et il parle. */
        if (Math.random() < 0.34){
          iv.cible = iv.x;
          if (Math.random() < 0.5){
            const autres = this.invites.filter(q => q !== iv);
            iv.dit = piocher(SOIREE_AMBIANCE)
              .replace("{a}", (piocher(autres) || iv).ref.nom);
            iv.ditT = 2.8;
          }
          iv.t = hasard(4, 10);
        } else {
          const coin = piocher(SOIREE_COINS);
          iv.coin = coin; iv.cible = coin.x + (Math.random() - 0.5) * 0.06;
          iv.t = hasard(5, 12);
        }
      }

      const d = iv.cible - iv.x;
      if (Math.abs(d) > 0.006){
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
  },

  /* CE QU'IL RÉPOND. Un innocent dit où il était et cite quelqu'un au
     hasard. Un coupable cite SON COMPLICE — et deux alibis qui se
     referment l'un sur l'autre sont la seule preuve du niveau. */
  temoignage(iv){
    const autres = this.invites.filter(q => q !== iv);
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

    /* UN INNOCENT NE RÉPOND PAS TOUJOURS LA MÊME CHOSE. Les proportions
       comptent : trop d'alibis et le niveau est un tableur, trop de
       soupçons et tout le monde a l'air coupable. */
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
    if (i >= 0){ this.accuses.splice(i, 1); return; }
    this.accuses.push(iv);
    if (this.accuses.length >= 2) this.terminer(true);
  },

  terminer(accuse){
    this.fini = 0.001;
    const bon = accuse && this.accuses.length === 2 &&
      this.accuses.every(q => q.coupable);
    this.verdict = {
      bon,
      couple:this.couple.map(q => q.ref.nom).join(" et "),
      motif:this.motif,
      restant:this.questions,
    };
    if (bon) Score.ajouter(400 + this.questions * 50);
  },

  pose(iv){
    const p = iv.ref.prefixe, dispo = n => Images.table[p + "_" + n] ? n : null;
    if (Math.abs(iv.cible - iv.x) > 0.006)
      return dispo("marche" + (1 + (Math.floor(iv.foulee) % 2)))
          || dispo("marche1") || "idle";
    if (iv.coin && iv.coin.cle === "piste")
      return dispo("danse" + (1 + (Math.floor(iv.foulee) % 2)))
          || dispo("danse1") || dispo("idle") || "idle";
    return (Math.floor(iv.foulee / 3) % 2 && dispo("idle2")) || "idle";
  },
};

const SoireeVue = {
  ex(x){ return Camera.L * x; },

  dessiner(){
    const H = Camera.H, L = Camera.L;
    const fond = Images.table["fond_salle"];
    if (fond && fond.naturalWidth) ctx.drawImage(fond, 0, 0, L, H);
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

  dessinerHud(){
    const H = Camera.H, L = Camera.L;
    ctx.save();
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.font = "800 " + Math.round(H * 0.040) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.fillStyle = "#F6F2FF";
    const s = Math.max(0, Math.ceil(SOIREE_DUREE - Soiree.temps));
    ctx.fillText(Soiree.questions + " QUESTIONS — " + Math.floor(s / 60) + ":"
                 + String(s % 60).padStart(2, "0"), L / 2, H * 0.03);
    ctx.restore();
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
    ctx.restore();
  },
};
