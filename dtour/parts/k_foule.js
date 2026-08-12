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

/* Les trois grappes, en fraction de largeur d'écran. Le monde du bar
   fait trois fonds bout à bout : ces positions sont à l'ÉCRAN et non
   dans le monde, la foule du premier plan ne défile pas avec le décor —
   c'est ce qui la distingue des clients du comptoir. */
const FOULE_PLACES = [
  { id: "gauche", x: 0.155 },
  { id: "centre", x: 0.500 },
  { id: "droite", x: 0.845 },
];
/* La ligne des pieds, SOUS le bas de l'écran : on ne voit que le buste.
   C'est ce qui laisse au champion de la place pour circuler tout en
   passant derrière eux. */
/* 1,52 et pas 1,30 : à 1,30 leur buste montait jusqu'à mi-écran et le
   champion disparaissait ENTIÈREMENT derrière une grappe. Or il doit
   circuler derrière eux, pas s'évanouir. À 1,52 on ne voit que les
   épaules et la tête, tout en bas : ils lui masquent les jambes et
   laissent le haut du corps lisible. */
const FOULE_PIEDS = 1.52;
const FOULE_TAILLE = 0.78;         /* fraction de la hauteur d'écran */
const FOULE_ECART = 0.052;         /* écart entre deux voisins d'une grappe */
const FOULE_PAR_GRAPPE = 3;        /* au plus, sinon ils se recouvrent */

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
    for (const place of FOULE_PLACES){
      if (!libres.length) break;
      const graine = libres.shift();
      const grappe = [graine];
      const amis = (LIENS[graine] && LIENS[graine].amis) || [];
      for (const a of amis){
        if (grappe.length >= FOULE_PAR_GRAPPE) break;
        const i = libres.indexOf(a);
        if (i >= 0) grappe.push(libres.splice(i, 1)[0]);
      }
      while (grappe.length < FOULE_PAR_GRAPPE && libres.length){
        grappe.push(libres.shift());
      }
      grappe.forEach((id, k) => {
        const ref = BAR_CLIENTS.find(c => c.id === id);
        if (!ref) return;
        this.foule.push({
          ref, place:place.id, rang:k, etat:"grappe", t:0,
          x:this.xFoule(place.id, k, grappe.length), dir:1, foulee:0,
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
