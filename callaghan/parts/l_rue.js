/* ===================== NIVEAU 5 — LE RACCOMPAGNAGE =====================

   Le bar ferme. Trois habitués doivent rentrer, et ils ne peuvent pas le
   faire seuls. On les pousse du D'Tour, à gauche, jusqu'au carrefour, à
   droite. C'est tout.

   CE N'EST PAS UN JEU DE TIR, C'EST UN JEU DE BERGER. Les trois avancent
   TOUT SEULS, en titubant, et chacun DÉRIVE à sa façon : l'un repart vers
   le bar, l'autre se plante au milieu du trottoir, le troisième se met à
   danser. On court de l'un à l'autre pour les relancer — et pendant qu'on
   en relance un, les deux autres dérivent.

   POURQUOI ÇA MARCHE AVEC CE QU'ON A DÉJÀ : `titube`, `marche1`,
   `marche2`, `danse1` existent pour neuf habitués. Le niveau ne demande
   pas une seule pose de plus. Ce qui manquait était un DÉCOR, et c'est la
   seule chose qui a été dessinée pour lui.

   LES RÉPLIQUES SONT LA SIGNALÉTIQUE. Quand un ivrogne dérive, il le dit
   — « Je vais rentrer », « Attends. Attends. ATTENDS. » — et c'est ce qui
   permet de comprendre la dérive sans regarder les trois en même temps.
   Le réservoir `ivres` du bar sert tel quel : rien à réécrire.
   ===================================================================== */

const RUE_SOL = 0.715;          /* la bordure du trottoir, mesurée sur le décor */
const RUE_TAILLE = 0.30;        /* hauteur d'un personnage, en fraction d'écran */
const RUE_DEPART = 0.06;        /* la porte du D'Tour                          */
const RUE_ARRIVEE = 0.94;       /* le carrefour                                */
const RUE_MARCHE = 0.115;       /* le joueur, en fraction de monde par seconde  */
const RUE_IVRE = 0.030;         /* eux, quand ils avancent                      */
const RUE_PORTEE = 0.055;       /* à quelle distance on les relance             */
const RUE_DUREE = 150;
/* L'écart minimal entre deux ivrognes. Mesuré à l'écran : en dessous de
   0,07 de monde, deux silhouettes se recouvrent assez pour qu'on ne sache
   plus laquelle parle. */
const RUE_ECART = 0.075;
/* CE QUI FAIT LE JEU : on n'en tient qu'UN. Le tenir est confortable — il
   avance à votre pas, droit, sans dériver — et c'est justement pour ça
   que le lâcher coûte quelque chose. Sans cette contrainte, marcher à
   côté d'eux suffisait et il n'y avait aucune décision à prendre : c'est
   le défaut qu'on corrige ici, et il n'était pas visible avant d'y jouer.

   LA ROUTE DONNE L'ENJEU. Un ivrogne qui dérive trop longtemps descend du
   trottoir. Il reste RUE_ROUTE_DELAI secondes sur la chaussée, et si
   personne ne vient le chercher, une voiture passe : vingt secondes de
   moins au chrono, et il remonte tout seul, secoué. */
const RUE_ROUTE_DELAI = 4.0;
const RUE_ROUTE_PEINE = 20;
const RUE_ROUTE_BAS = 0.115;   /* de combien il descend, en fraction d'écran */
const RUE_TENU_ECART = 0.045;  /* à quelle distance il vous suit           */
/* Combien de temps ils tiennent avant de dériver, et combien de temps la
   dérive dure. Mesuré à la main : en dessous de quatre secondes on ne
   peut pas s'occuper des trois, au-dessus de dix le niveau s'endort. */
const RUE_AVANT_DERIVE = [4.0, 9.0];
const RUE_DERIVE_DUREE = [3.0, 6.0];

/* Les trois dérives. Chacune a sa pose, sa réplique et son remède — et
   c'est le remède qui fait le jeu : on ne les traite pas pareil. */
const RUE_PRIS = ["Ah bah voilà.", "Tu me tiens ? Tu me tiens.",
                  "On va où ?", "Doucement, doucement."];
const RUE_ROUTE_DIT = ["Y'a une route, là ?", "Je coupe.",
                       "C'est plus court par là.", "Attends, je traverse."];
const RUE_KLAXON = ["PUTAIN.", "Il m'a klaxonné.", "J'ai rien fait, moi.",
                    "Bon. Je remonte."];

const RUE_DERIVES = [
  { cle:"demi_tour", pose:"marche", sens:-1,
    dit:["Je vais rentrer.", "J'ai oublié un truc.", "Une dernière."] },
  { cle:"plante",    pose:"titube", sens:0,
    dit:["Attends. Attends. ATTENDS.", "Putain la marche.",
         "J'ai quelque chose à te dire."] },
  { cle:"danse",     pose:"danse",  sens:0,
    dit:["T'as vu comment je danse ?", "Chut. Écoute.",
         "On devrait faire ça plus souvent."] },
];

const Rue = {
  actif:false, temps:0, fini:0, x:0.10, dir:1, foulee:0, marche:0, tenu:null,
  peine:0, klaxon:0,
  ivrognes:[], bulle:null, bulleT:0,

  raz(){
    this.actif = false; this.temps = 0; this.fini = 0;
    this.x = RUE_DEPART; this.dir = 1; this.foulee = 0;
    this.ivrognes.length = 0; this.bulle = null; this.bulleT = 0; this.marche = 0; this.tenu = null;
    this.peine = 0; this.klaxon = 0;
  },

  demarrer(){
    this.raz();
    this.actif = true;
    /* TROIS, et pas plus : à quatre on ne peut plus tenir le troupeau, à
       deux on n'a pas à choisir. Le choix est le jeu. */
    const dispo = BAR_CLIENTS.filter(c =>
      c.prefixe && Images.table[c.prefixe + "_titube"]);
    for (let i = 0; i < 3 && dispo.length; i++){
      const ref = dispo.splice(Math.floor(Math.random() * dispo.length), 1)[0];
      this.ivrognes.push({
        ref, x:RUE_DEPART + 0.02 + i * 0.035, foulee:Math.random() * 4,
        etat:"marche", derive:null, t:hasard(RUE_AVANT_DERIVE[0], RUE_AVANT_DERIVE[1]),
        dit:null, ditT:0, arrive:false,
      });
    }
  },

  marcher(d){ if (this.actif && !this.fini) this.marche = d; },

  /* PRENDRE OU LÂCHER, un seul bouton. Prendre attrape le plus proche à
     portée ; s'il n'y a personne, il ne se passe rien — un bouton qui
     répond dans le vide vaut mieux qu'un bouton grisé qu'on regarde. */
  prendre(){
    if (!this.actif || this.fini) return;
    if (this.tenu){ this.tenu.tenu = false; this.tenu = null; return; }
    let meilleur = null, dist = RUE_PORTEE;
    for (const iv of this.ivrognes){
      if (iv.arrive) continue;
      const d = Math.abs(iv.x - this.x);
      if (d < dist){ dist = d; meilleur = iv; }
    }
    if (meilleur){
      meilleur.tenu = true; meilleur.derive = null; meilleur.route = 0;
      meilleur.etat = "marche";
      meilleur.dit = piocher(RUE_PRIS); meilleur.ditT = 2.2;
      this.tenu = meilleur;
    }
  },

  /* Tous rentrés, ou le temps écoulé. */
  gagne(){ return this.ivrognes.length > 0 && this.ivrognes.every(i => i.arrive); },

  pas(dt){
    if (!this.actif) return;
    this.temps += dt;
    if (this.fini > 0){ this.fini += dt; return; }

    /* LE JOUEUR SE PILOTE COMME AU BAR : `marcher(-1|0|1)`, et le
       pilotage n'a rien à apprendre de nouveau. Deux flèches, c'est tout
       ce que ce niveau demande. */
    if (this.marche !== 0){
      this.dir = this.marche;
      this.x = borne(this.x + this.dir * dt * RUE_MARCHE, 0.02, 0.98);
      this.foulee += dt * 7;
    }

    for (const iv of this.ivrognes){
      if (iv.arrive) continue;
      if (iv.ditT > 0){ iv.ditT -= dt; if (iv.ditT <= 0) iv.dit = null; }
      iv.t -= dt;

      /* ON LES RELANCE EN LES APPROCHANT, pas en appuyant. Un bouton de
         plus sur un niveau qui se joue à deux flèches, et le pouce n'y
         arrive plus. Être là suffit — c'est aussi ce que ça veut dire,
         raccompagner quelqu'un. */
      if (iv.derive && Math.abs(this.x - iv.x) < RUE_PORTEE){
        iv.derive = null; iv.etat = "marche";
        iv.t = hasard(RUE_AVANT_DERIVE[0], RUE_AVANT_DERIVE[1]);
      }

      if (!iv.derive && iv.t <= 0){
        iv.derive = piocher(RUE_DERIVES);
        iv.etat = iv.derive.cle;
        iv.t = hasard(RUE_DERIVE_DUREE[0], RUE_DERIVE_DUREE[1]);
        iv.dit = piocher(iv.derive.dit); iv.ditT = 2.6;
      } else if (iv.derive && iv.t <= 0){
        /* une dérive qui dure finit SUR LA ROUTE. C'est ce qui remplace
           l'ancien retour à la marche : sans conséquence, laisser dériver
           ne coûtait rien et le niveau n'avait pas de tension. */
        iv.route = RUE_ROUTE_DELAI;
        iv.etat = "plante";
        iv.dit = piocher(RUE_ROUTE_DIT); iv.ditT = 2.6;
      }

      const sens = iv.derive ? iv.derive.sens : 1;
      if (sens !== 0){
        iv.x = borne(iv.x + sens * dt * RUE_IVRE, 0.02, RUE_ARRIVEE);
        iv.foulee += dt * 3.2;
      } else {
        iv.foulee += dt * 2.4;
      }
      if (iv.x >= RUE_ARRIVEE - 0.001){ iv.arrive = true; iv.dit = null; }
    }

    /* ILS NE SE MARCHENT PAS DESSUS. Vu en jeu : les trois finissaient
       superposés au même endroit, et on ne savait plus qui dérivait. Ils
       se repoussent doucement dès qu'ils sont à moins d'un demi-pas —
       assez pour rester lisibles, pas assez pour qu'on voie une force. */
    for (let a = 0; a < this.ivrognes.length; a++)
      for (let b = a + 1; b < this.ivrognes.length; b++){
        const p1 = this.ivrognes[a], p2 = this.ivrognes[b];
        if (p1.arrive || p2.arrive) continue;
        const d2 = p2.x - p1.x;
        if (Math.abs(d2) < RUE_ECART){
          const pousse = (RUE_ECART - Math.abs(d2)) * 0.5 * (d2 >= 0 ? 1 : -1);
          p1.x = borne(p1.x - pousse, 0.02, RUE_ARRIVEE);
          p2.x = borne(p2.x + pousse, 0.02, RUE_ARRIVEE);
        }
      }

    if (this.gagne() && !this.fini){ this.fini = 0.001; Score.ajouter(500); }
    else if (this.temps + this.peine >= RUE_DUREE && !this.fini) this.fini = 0.001;
    if (this.klaxon > 0) this.klaxon -= dt;
  },

  /* La pose se déduit de l'état, comme au bar. Tout se replie sur `idle` :
     un habitué sans planche complète marche raide, il ne disparaît pas. */
  pose(iv){
    const p = iv.ref.prefixe, dispo = n => Images.table[p + "_" + n] ? n : null;
    if (iv.arrive) return dispo("idle") || "idle";
    if (iv.etat === "danse")
      return dispo("danse" + (1 + (Math.floor(iv.foulee) % 2)))
          || dispo("danse1") || dispo("titube") || "idle";
    if (iv.etat === "plante") return dispo("titube") || "idle";
    /* il MARCHE en titubant : une image sur deux penchée, c'est ce qui
       les distingue du joueur d'un seul coup d'oeil */
    if (Math.floor(iv.foulee) % 2 && dispo("titube")) return "titube";
    return dispo("marche" + (1 + (Math.floor(iv.foulee) % 2)))
        || dispo("marche1") || "idle";
  },
};

const RueVue = {
  ex(x){ return Camera.L * x; },

  dessiner(){
    const H = Camera.H, L = Camera.L;
    const fond = Images.table["fond_rue"];
    if (fond && fond.naturalWidth) ctx.drawImage(fond, 0, 0, L, H);
    else { ctx.fillStyle = "#0b1020"; ctx.fillRect(0, 0, L, H); }

    /* le carrefour, marqué au sol : sans repère, on ne sait pas où on
       les emmène */
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.15 * Math.sin(Rue.temps * 2.2);
    ctx.fillStyle = "#7CFFB2";
    ctx.fillRect(this.ex(RUE_ARRIVEE) - L * 0.004, H * (RUE_SOL - 0.02),
                 L * 0.008, H * 0.03);
    ctx.restore();

    const gens = Rue.ivrognes.slice().sort((a, b) => a.x - b.x);
    for (const iv of gens) this.dessinerUn(iv);
    this.dessinerJoueur();
    this.dessinerJauge();
  },

  dessinerUn(iv){
    const H = Camera.H, L = Camera.L;
    const nom = iv.ref.prefixe + "_" + Rue.pose(iv);
    const spr = Images.table[nom] || Images.table[iv.ref.prefixe + "_idle"];
    if (!spr || !spr.naturalWidth) return;
    const sh = H * RUE_TAILLE * (iv.ref.taille || 1);
    const sl = sh * spr.naturalWidth / spr.naturalHeight;
    /* IL DESCEND VRAIMENT DU TROTTOIR : il change de ligne de sol, et
       c'est ce qui se voit de loin — plus que n'importe quelle icône. */
    const bas = iv.route > 0 ? RUE_ROUTE_BAS * borne((RUE_ROUTE_DELAI - iv.route) * 2, 0, 1) : 0;
    const x = this.ex(iv.x), y = H * (RUE_SOL + bas) + H * 0.012;
    ctx.save();
    ctx.globalAlpha = iv.arrive ? 0.45 : 1;
    ctx.fillStyle = "rgba(0,0,0,.30)";
    ctx.beginPath(); ctx.ellipse(x, y, sl * 0.22, H * 0.008, 0, 0, 6.283); ctx.fill();
    ctx.drawImage(spr, x - sl / 2, y - sh, sl, sh);
    ctx.restore();
    /* LES BULLES S'ÉTAGENT. Trois personnes proches parlaient à la même
       hauteur et les phrases se recouvraient : on lisait « Attends.
       Attends. ATTE » et rien d'autre. Chacun a son étage, tiré de son
       rang dans le troupeau. */
    if (iv.route > 0){
      /* le compte à rebours se lit SOUS LUI, là où on regarde déjà */
      ctx.save();
      ctx.globalAlpha = 0.55 + 0.45 * Math.sin(Rue.temps * 9);
      ctx.fillStyle = "#FF5A4A";
      ctx.fillRect(x - sl * 0.30, y + H * 0.012,
                   sl * 0.60 * (iv.route / RUE_ROUTE_DELAI), H * 0.008);
      ctx.restore();
    }
    if (iv.tenu){
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = "#7CFFB2";
      ctx.beginPath(); ctx.ellipse(x, y, sl * 0.26, H * 0.010, 0, 0, 6.283);
      ctx.stroke ? (ctx.strokeStyle = "#7CFFB2", ctx.lineWidth = 2, ctx.stroke()) : ctx.fill();
      ctx.restore();
    }
    if (iv.dit){
      const etage = Rue.ivrognes.indexOf(iv) % 3;
      BarVue.bulle(iv.dit, x, y - sh - H * (0.010 + etage * 0.055),
                   L * 0.46, 0.028, borne(iv.ditT / 0.4, 0, 1));
    }
  },

  dessinerJoueur(){
    const H = Camera.H, L = Camera.L;
    const champ = Tournee.champion || BAR_CHAMPIONS[0];
    const base = champ.prefixe + "_";
    const nom = Rue.marche !== 0
      ? base + "marche" + (1 + (Math.floor(Rue.foulee) % 3))
      : base + "idle";
    const spr = Images.table[nom] || Images.table[base + "idle"];
    if (!spr || !spr.naturalWidth) return;
    const sh = H * RUE_TAILLE * 1.06;
    const sl = sh * spr.naturalWidth / spr.naturalHeight;
    const x = this.ex(Rue.x), y = H * RUE_SOL + H * 0.016;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.34)";
    ctx.beginPath(); ctx.ellipse(x, y, sl * 0.24, H * 0.009, 0, 0, 6.283); ctx.fill();
    if (Rue.dir < 0){ ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }
    ctx.drawImage(spr, x - sl / 2, y - sh, sl, sh);
    ctx.restore();
  },

  /* Combien il en reste, et combien de temps. Rien d'autre : le niveau se
     lit dans la rue, pas dans une interface. */
  dessinerJauge(){
    const H = Camera.H, L = Camera.L;
    const reste = Rue.ivrognes.filter(i => !i.arrive).length;
    ctx.save();
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.font = "800 " + Math.round(H * 0.042) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.fillStyle = "#F6F2FF";
    const s = Math.max(0, Math.ceil(RUE_DUREE - Rue.temps - Rue.peine));
    if (Rue.klaxon > 0){
      ctx.fillStyle = "rgba(255,90,74," + borne(Rue.klaxon, 0, 1) * 0.30 + ")";
      ctx.fillRect(0, 0, L, H);
      ctx.fillStyle = "#F6F2FF";
    }
    ctx.fillText(reste + " À RAMENER — " + Math.floor(s / 60) + ":"
                 + String(s % 60).padStart(2, "0"), L / 2, H * 0.03);
    ctx.restore();
  },
};
