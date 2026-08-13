/* ================= LA FOULE DU PREMIER PLAN =================
   Le bar était vide de monde : deux clients longeaient le comptoir, et
   c'était tout. Ici on peuple le PREMIER PLAN — trois grappes de gens
   posées tout en bas, dont on ne voit que le buste, et derrière
   lesquelles le champion circule.

   Trois décisions structurent le reste :

   1. ILS SONT DEVANT, MAIS PAS DEVANT LE COMPTOIR. Placés le plus bas
      possible, coupés par le bord de l'écran, ils masquent le champion
      qui passe derrière eux mais jamais les verres à attraper. Sans ça
      il aurait fallu reprendre le garde-fou de faisabilité, et le
      niveau serait devenu un autre jeu.

   2. LES GROUPES SE COMPOSENT PAR AFFINITÉ. `LIENS` existe depuis le
      niveau 2 : on s'en sert plutôt que de tirer au sort. Une grappe
      d'amis se lit comme un groupe ; cinq personnes au hasard se lisent
      comme un tirage.

   3. RIEN N'EST FIGÉ. Quelqu'un quitte sa grappe pour faire un tour et
      revient — parfois dans une AUTRE grappe, ce qui recompose la
      soirée sans qu'on ait à l'orchestrer. Et de temps en temps, l'un
      s'en va pour de bon ; sa place se libère et quelqu'un d'autre
      finit par arriver. */

/* Les grappes sont PLACÉES DANS LE BAR, pas sur l'écran. C'était le
   défaut de la première version : accrochées à la caméra, elles
   suivaient le champion comme un décor peint sur la vitre — on ne les
   dépassait jamais, et le bar semblait tenir en un seul écran.

   Posées dans le MONDE, elles ne sont visibles que quand on passe
   devant : le bar redevient un lieu qu'on traverse, avec des coins où
   il y a du monde et des coins où il n'y a personne. Six grappes
   réparties sur toute la longueur — assez pour qu'il y ait presque
   toujours quelqu'un en vue, jamais assez pour faire une haie. */
const FOULE_PLACES = [
  { id: "g1", x: 0.110 }, { id: "g2", x: 0.370 },
  { id: "g3", x: 0.630 }, { id: "g4", x: 0.890 },
];
/* La ligne des pieds, SOUS le bas de l'écran : on ne voit que le buste.
   C'est ce qui laisse au champion de la place pour circuler tout en
   passant derrière eux. */
/* 1,52 et pas 1,30 : à 1,30 leur buste montait jusqu'à mi-écran et le
   champion disparaissait ENTIÈREMENT derrière une grappe. Or il doit
   circuler derrière eux, pas s'évanouir. À 1,52 on ne voit que les
   épaules et la tête, tout en bas : ils lui masquent les jambes et
   laissent le haut du corps lisible. */
/* DES PERSONNAGES ENTIERS, PAS DES BUSTES. Les pieds étaient à 1,52 —
   très loin sous l'écran — donc on ne voyait que les épaules et la tête.
   Ils passent à 1,06 : les pieds dépassent à peine du cadre, et on voit
   enfin qui ils sont.
   La TAILLE baisse en conséquence, sinon un personnage entier à 0,78 de
   la hauteur d'écran masquerait le champion au lieu de lui laisser le
   passage. C'est le compromis d'origine, mais résolu dans l'autre sens :
   on rapetisse au lieu de couper. */
/* LA TÊTE DOIT RESTER SOUS LE COMPTOIR, à 0,555 : au-dessus, la foule
   masque les verres, qui sont l'enjeu du niveau. C'est la contrainte qui
   commande, et elle se calcule — tête = pieds - taille, donc
   1,06 - 0,50 = 0,56, juste dessous.
   On voit alors 0,555 à 1,0 d'un personnage haut de 0,50 : quatre-vingt-
   dix pour cent de lui, pieds légèrement hors cadre. C'est ce qu'on
   voulait, et c'est le maximum possible sans manger les verres. */
const FOULE_PIEDS = 1.18;
/* RECALCULÉE quand le comptoir est passé de 0,555 à 0,585 sur le fond
   neuf : tête = 1,06 − 0,50 = 0,56, donc AU-DESSUS du comptoir, donc les
   verres masqués. À 0,46 la tête est à 0,60, juste dessous.
   C'est une donnée DÉRIVÉE du comptoir : elle doit être refaite chaque
   fois que le décor change. */
/* AGRANDIE : elle faisait 0,46 contre 0,52 pour le héros, soit 88 % de
   sa taille — alors qu'elle est au PREMIER PLAN, donc plus près de la
   caméra. Elle devrait être plus GRANDE, pas plus petite.
   À 0,62 elle fait 119 % du héros, ce qui donne la profondeur.
   La contrainte reste la même : sa tête doit rester SOUS le comptoir, à
   0,546, sinon elle masque les verres. Tête = 1,18 - 0,62 = 0,56, juste
   dessous. Les pieds dépassent donc de 18 % — c'est le prix, et Thibaut
   l'a accepté explicitement. */
const FOULE_TAILLE = 0.62;
const FOULE_ECART = 0.030;         /* écart entre deux voisins, EN MONDE */
/* DEUX PAR GRAPPE, PAS TROIS. Il n'y a que dix personnages pour quatre
   grappes : à trois, la foule les prenait TOUS et plus aucun client ne
   pouvait entrer depuis qu'on interdit les doublons. À deux, il en reste
   deux de libres — exactement le nombre de clients simultanés autorisés.
   Et des personnages entiers tiennent moins bien à trois de front. */
const FOULE_PAR_GRAPPE = 2;

const FOULE_REPLIQUE = [7.0, 13.0];   /* délai entre deux répliques      */
const FOULE_REPL_DUREE = 3.2;         /* elle vit assez pour être lue    */
const FOULE_BALADE = [11.0, 22.0];    /* délai entre deux balades        */
const FOULE_BALADE_DUREE = [4.5, 8.0];
const FOULE_DEPART = 0.22;            /* part des balades qui finissent dehors */

/* Ce qu'ils disent. Une réplique doit se raccrocher à ce qui se passe,
   sinon c'est du bruit : les seaux CONTEXTE sont choisis d'abord quand
   la situation s'y prête, et le reste vient du personnage. Les phrases
   sont courtes — elles se lisent en passant, sans interrompre le jeu. */
const FOULE_PHRASES = {
  ambiance_basse: [
    "Il se passe rien, là.",
    "On se croirait un mardi.",
    "Quelqu'un met de la musique ?",
  ],
  ambiance_haute: [
    "LÀ on est bien !",
    "C'est ça, le D'Tour.",
    "Je bouge plus de la soirée.",
  ],
  coup_de_feu: [
    "Ça arrive de partout !",
    "Francky va exploser.",
    "Regarde-moi ce comptoir.",
  ],
  pompette: [
    "Il tient plus debout.",
    "Doucement, champion.",
    "Il va finir sur le tabouret.",
  ],
  gabi:     ["J'ai commandé une pizza.", "Personne n'a vu ma part ?"],
  charles:  ["Moi je bois pas, je goûte.", "C'était mieux avant. Enfin, non."],
  teo:      ["Je reste cinq minutes.", "Bon. Dix minutes."],
  mathilde: ["Jojo m'a encore ignorée.", "Ses cocktails sont meilleurs."],
  tristan:  ["Deux, et j'y vais.", "On refait la même ?"],
  solene:   ["Tu as vu qui est là ?", "Je préviens Mathilde."],
  kevin:    ["C'est ma tournée. Enfin, presque.", "Jägerbombs. Point."],
  remy:     ["Le premier qui craque paie.", "J'ai vu Teo boire de l'eau."],
  marini:   ["La municipalité soutient ce lieu.", "Un buffet non conforme."],
  martin:   ["Je suis pas en service.", "Enfin, un peu quand même."],
  commun:   ["Il en met du temps.", "Tu reprends quelque chose ?",
             "Elle est où, Hortense ?", "Pas de tarte ce soir, j'espère."],
};

Object.assign(Tournee, {
  /* --------- composition --------- */
  /* On sème une grappe avec quelqu'un, puis on la complète avec SES
     amis. Le reste des places se remplit avec qui il reste : mieux vaut
     une grappe dépareillée qu'une place vide, et de toute façon les
     balades les mélangeront. */
  composerFoule(){
    this.foule = [];
    this.replT = melange(FOULE_REPLIQUE[0], FOULE_REPLIQUE[1], Math.random());
    this.baladeT = melange(FOULE_BALADE[0], FOULE_BALADE[1], Math.random());
    this.replique = null;
    const libres = BAR_CLIENTS.map(c => c.id);
    melangerTableau(libres);

    /* UNE GRAINE PAR GRAPPE D'ABORD, puis on complète À TOUR DE RÔLE.
       Remplir chaque grappe à fond avant de passer à la suivante vidait
       les dernières : mesuré, dix personnes pour six grappes en
       laissaient deux désertes. À tour de rôle, elles se remplissent
       toutes, et le bar a du monde partout où on passe. */
    const graines = [];
    for (const place of FOULE_PLACES){
      if (!libres.length) break;
      const id = libres.shift();
      graines.push({ place:place.id, ids:[id] });
    }
    let tour = 0;
    while (libres.length && graines.length){
      const g = graines[tour % graines.length];
      tour++;
      if (g.ids.length >= FOULE_PAR_GRAPPE) {
        if (graines.every(x => x.ids.length >= FOULE_PAR_GRAPPE)) break;
        continue;
      }
      /* on prend un AMI de la graine s'il en reste un, sinon le premier
         venu : mieux vaut une grappe dépareillée qu'une place vide */
      const amis = (LIENS[g.ids[0]] && LIENS[g.ids[0]].amis) || [];
      let i = libres.findIndex(x => amis.indexOf(x) >= 0);
      if (i < 0) i = 0;
      g.ids.push(libres.splice(i, 1)[0]);
    }

    for (const g of graines){
      g.ids.forEach((id, k) => {
        const ref = BAR_CLIENTS.find(c => c.id === id);
        if (!ref) return;
        this.foule.push({
          ref, place:g.place, rang:k, etat:"grappe", t:0,
          x:this.xFoule(g.place, k, g.ids.length), dir:1, foulee:0,
          cible:0, retour:0,
        });
      });
    }
  },

  /* La position d'un membre : le centre de sa grappe, décalé selon son
     rang. Les rangs sont centrés sur la grappe pour qu'une grappe de
     deux ne soit pas décalée sur un côté. */
  xFoule(place, rang, taille){
    const p = FOULE_PLACES.find(q => q.id === place);
    if (!p) return 0.5;
    return p.x + (rang - (taille - 1) / 2) * FOULE_ECART;
  },
  grappe(place){ return this.foule.filter(m => m.place === place); },

  /* --------- vie --------- */
  majFoule(dt){
    if (!this.foule) return;

    /* les répliques */
    this.replT -= dt;
    if (this.replique){
      this.replique.t -= dt;
      if (this.replique.t <= 0) this.replique = null;
    }
    if (this.replT <= 0 && !this.replique){
      this.replT = melange(FOULE_REPLIQUE[0], FOULE_REPLIQUE[1], Math.random());
      const candidats = this.foule.filter(m => m.etat === "grappe");
      if (candidats.length){
        const qui = piocher(candidats);
        this.replique = { qui, txt:this.phraseFoule(qui), t:FOULE_REPL_DUREE };
      }
    }

    /* les balades et les départs */
    this.baladeT -= dt;
    if (this.baladeT <= 0){
      this.baladeT = melange(FOULE_BALADE[0], FOULE_BALADE[1], Math.random());
      const sedentaires = this.foule.filter(m => m.etat === "grappe");
      if (sedentaires.length > 1){
        const qui = piocher(sedentaires);
        qui.etat = "balade"; qui.t = 0;
        qui.cible = hasard(0.10, 0.90);
        qui.retour = melange(FOULE_BALADE_DUREE[0], FOULE_BALADE_DUREE[1], Math.random());
        qui.part = Math.random() < FOULE_DEPART;
        if (this.replique && this.replique.qui === qui) this.replique = null;
      }
    }

    for (let i = this.foule.length - 1; i >= 0; i--){
      const m = this.foule[i];
      m.t += dt;
      if (m.etat === "grappe"){
        /* il rejoint doucement sa place : après un départ voisin, les
           rangs se resserrent au lieu de sauter */
        const g = this.grappe(m.place);
        const cible = this.xFoule(m.place, g.indexOf(m), g.length);
        m.x += borne(cible - m.x, -dt * 0.10, dt * 0.10);
        continue;
      }
      if (m.etat === "balade"){
        m.foulee += dt * 6;
        const vers = m.part ? (m.x < 0.5 ? -0.2 : 1.2) : m.cible;
        m.dir = vers > m.x ? 1 : -1;
        m.x += m.dir * dt * 0.10;
        if (m.part){
          if (m.x < -0.15 || m.x > 1.15){ this.foule.splice(i, 1); }
          continue;
        }
        if (Math.abs(m.x - m.cible) < 0.012 && m.t > m.retour * 0.5){
          /* il repart vers une grappe, PAS forcément la sienne : c'est
             ce qui recompose la soirée sans chef d'orchestre */
          m.etat = "revient"; m.t = 0;
          const dispos = FOULE_PLACES.filter(p => this.grappe(p.id).length < FOULE_PAR_GRAPPE);
          if (dispos.length) m.place = piocher(dispos).id;
        }
        continue;
      }
      if (m.etat === "revient"){
        m.foulee += dt * 6;
        const g = this.grappe(m.place).filter(q => q !== m);
        const cible = this.xFoule(m.place, g.length, g.length + 1);
        m.dir = cible > m.x ? 1 : -1;
        m.x += m.dir * dt * 0.11;
        if (Math.abs(m.x - cible) < 0.02){ m.etat = "grappe"; m.t = 0; }
      }
    }
  },

  /* Le contexte d'abord, le personnage ensuite. Une réplique qui parle
     de ce qui se passe vaut dix qui parlent dans le vide. */
  phraseFoule(m){
    const seaux = [];
    if (this.coupDeFeu) seaux.push("coup_de_feu");
    if (this.bourre > 0) seaux.push("pompette");
    if (this.ambiance < BAR_AMBIANCE_BUT * 0.30) seaux.push("ambiance_basse");
    if (this.ambiance > BAR_AMBIANCE_BUT * 0.80) seaux.push("ambiance_haute");
    if (seaux.length && Math.random() < 0.62) return piocher(FOULE_PHRASES[piocher(seaux)]);
    const perso = FOULE_PHRASES[m.ref.id];
    if (perso && Math.random() < 0.65) return piocher(perso);
    return piocher(FOULE_PHRASES.commun);
  },
});
