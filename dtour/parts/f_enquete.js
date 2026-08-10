
/* ==================================================================
   NIVEAU 2 — L'AFFAIRE DE LA PIZZA AU CHORIZO
   ------------------------------------------------------------------
   Un appartement en coupe, deux inspecteurs amateurs, et une pizza qui
   a disparu. On fouille des meubles jusqu'à trouver les trois traces
   de chorizo qui désignent le coupable, avant la fin du chrono.

   Le décor est une seule image très large (1505 x 336) : la caméra
   glisse dessus. Les zones sont posées en POURCENTAGE de cette image,
   jamais en pixels d'écran — c'est la même règle que le niveau 1, et
   c'est ce qui permet au niveau de tenir aussi bien sur un ordinateur
   que sur un téléphone couché.
================================================================== */

const ENQ_DUREE = 100;              /* secondes au départ */
const ENQ_COUT_FOUILLE = 4;         /* ce que coûte une fouille infructueuse */
const ENQ_INDICES = 3;              /* traces à réunir pour conclure */
const ENQ_MARCHE = 0.46;            /* largeur d'image parcourue par seconde */
const ENQ_LIGNE = 0.925;            /* la bande de circulation, en fraction de hauteur */
const ENQ_TAILLE = 0.46;            /* hauteur d'un héros, en fraction de l'image */
const ENQ_FOUILLE = 0.9;            /* durée d'une fouille */

/* Les zones fouillables. `x` et `y` sont des fractions de l'image ;
   `pied` est l'abscisse où le héros s'arrête, souvent décalée pour ne
   pas se planter dans le meuble. */
const ZONES = [
  { id:"chaussures", nom:"les chaussures",     x:0.038, y:0.74, pied:0.055 },
  { id:"manteaux",   nom:"les manteaux",       x:0.072, y:0.42, pied:0.080 },
  { id:"parapluies", nom:"le porte-parapluies", x:0.156, y:0.74, pied:0.156 },
  { id:"biblio",     nom:"la bibliothèque",    x:0.222, y:0.34, pied:0.222 },
  { id:"canape",     nom:"sous le canapé",     x:0.272, y:0.70, pied:0.272 },
  { id:"basse",      nom:"la table basse",     x:0.350, y:0.84, pied:0.350 },
  { id:"tv",         nom:"le meuble TV",       x:0.392, y:0.66, pied:0.392 },
  { id:"frigo",      nom:"le frigo",           x:0.503, y:0.56, pied:0.503 },
  { id:"four",       nom:"le four",            x:0.560, y:0.64, pied:0.560 },
  { id:"placards",   nom:"les placards",       x:0.640, y:0.26, pied:0.640 },
  { id:"evier",      nom:"l'évier",            x:0.690, y:0.52, pied:0.690 },
  { id:"table",      nom:"la table",           x:0.608, y:0.76, pied:0.608 },
  { id:"poubelle",   nom:"la poubelle",        x:0.752, y:0.72, pied:0.752 },
  { id:"commode",    nom:"la commode",         x:0.842, y:0.72, pied:0.842 },
  { id:"lit",        nom:"le lit",             x:0.948, y:0.80, pied:0.930 },
  { id:"portant",    nom:"le portant",         x:0.966, y:0.44, pied:0.948 },
];

/* Ce qu'on trouve quand on ne trouve rien. Une réplique par zone, pour
   que fouiller deux fois le même meuble ne donne pas la même phrase. */
const RIEN = [
  "Rien. Enfin, rien de comestible.",
  "Que de la poussière.",
  "Rien du tout. Suspect, non ?",
  "Alors ça, c'est vide.",
  "Rien. Mais c'est bien rangé.",
  "Non. Toujours rien.",
  "Ah. Non plus.",
  "Rien ici. On perd du temps.",
  "Vide. Comme mon estomac.",
  "Négatif.",
];
const TROUVE = [
  "Une trace de chorizo !",
  "Là ! Du chorizo !",
  "Ça, c'est du chorizo.",
  "Une miette. Rouge. Grasse.",
];
const SUSPECTS = [
  { nom:"LE VOISIN DU DESSUS", chute:"Il avait la clé. Et l'appétit." },
  { nom:"LE CHAT", chute:"Personne ne l'a vu. C'est bien le problème." },
  { nom:"PIERRE-FRANÇOIS", chute:"Il a dit qu'il n'aimait pas ça. Personne n'a vérifié." },
  { nom:"THIBAUT", chute:"« J'ai juste goûté. » Trois fois." },
];

const Enquete = {
  actif:false, restant:0, indices:0, fouilles:0, zones:[], coupable:null, conclusion:0,
  choisie:-1, message:null, messageT:0, fini:null, chrono:0,
  inspecteurs:[], secousse:0,

  /* --------- mise en place --------- */
  demarrer(){
    this.actif = true;
    this.restant = ENQ_DUREE;
    this.indices = 0;
    this.fouilles = 0;
    this.choisie = -1;
    this.message = null;
    this.fini = null;
    this.chrono = 0;
    this.secousse = 0;
    this.conclusion = 0;
    this.coupable = piocher(SUSPECTS);

    /* on tire les zones qui cachent une trace */
    const melangees = ZONES.map((z, i) => i);
    for (let i = melangees.length - 1; i > 0; i--){
      const j = entier(0, i);
      const t = melangees[i]; melangees[i] = melangees[j]; melangees[j] = t;
    }
    const gagnantes = new Set(melangees.slice(0, ENQ_INDICES));
    this.zones = ZONES.map((z, i) => ({
      ref:z, fouillee:false, trace:gagnantes.has(i), pulse:Math.random() * 6.28,
    }));

    /* les deux inspecteurs entrent par la porte, à gauche */
    this.inspecteurs = Heros.map((h, i) => ({
      heros:i, x:0.10 + i * 0.055, vise:0.10 + i * 0.055,
      cible:-1, etat:"repos", chrono:0, pas:0,
    }));
    Camera.xEnq = 0;
  },

  terminer(gagne){
    this.fini = { gagne, t:0 };
    this.actif = false;
    if (gagne){
      const points = Math.round(this.restant * 50 + this.indices * 200);
      Score.points += points;
      this.gain = points;
      Sons.palier();
    } else {
      this.gain = 0;
      Sons.fin();
    }
    Jeu.phase = "fin";
    Jeu.finChrono = 0;
    Interface.sortirJeu();
  },

  /* --------- désigner une zone --------- */
  viser(fx, fy){
    if (!this.actif) return;
    let meilleure = -1, dmin = 1e9;
    for (let i = 0; i < this.zones.length; i++){
      const z = this.zones[i].ref;
      const dx = (z.x - fx) * 3.4, dy = z.y - fy;      /* l'image est large : on corrige */
      const d = dx * dx + dy * dy;
      if (d < dmin){ dmin = d; meilleure = i; }
    }
    if (meilleure < 0 || dmin > 0.26) return;
    this.envoyer(meilleure);
  },

  envoyer(i){
    const z = this.zones[i];
    if (!this.actif || z.fouillee) {
      if (z && z.fouillee) this.dire("Déjà fouillé.", 0.9);
      return;
    }
    /* l'inspecteur le plus proche s'en charge, s'il est disponible */
    let choisi = null, dmin = 1e9;
    for (const ins of this.inspecteurs){
      if (ins.etat === "fouille") continue;
      const d = Math.abs(ins.x - z.ref.pied);
      if (d < dmin){ dmin = d; choisi = ins; }
    }
    if (!choisi) return;
    choisi.cible = i;
    choisi.vise = z.ref.pied;
    choisi.etat = "marche";
    this.choisie = i;
    Sons.clic();
  },

  dire(txt, duree){ this.message = txt; this.messageT = 0; this.messageDuree = duree || 1.6; },

  /* --------- la fouille aboutit --------- */
  fouiller(ins){
    const z = this.zones[ins.cible];
    if (!z || z.fouillee) { ins.etat = "repos"; ins.cible = -1; return; }
    z.fouillee = true;
    this.fouilles++;
    ins.etat = "repos";
    const nom = Heros[ins.heros].court;
    if (z.trace){
      this.indices++;
      Effets.parole({ heros:ins.heros }, piocher(TROUVE), 1.6);
      Sons.reussite(Math.min(7, this.indices));
      Sons.poignee();
      this.secousse = 0.4;
      /* On laisse une seconde pour lire la dernière réplique, mais avec
         le chrono du jeu et non un setTimeout : une échéance en temps
         absolu continue de courir pendant une pause. */
      if (this.indices >= ENQ_INDICES) this.conclusion = 1.0;
    } else {
      this.restant -= ENQ_COUT_FOUILLE;
      Effets.parole({ heros:ins.heros }, RIEN[this.fouilles % RIEN.length], 1.4);
      Sons.bip(190, 0.16, "sine", 0.14, 130);
    }
    void nom;
    ins.cible = -1;
  },

  /* --------- boucle --------- */
  pas(dt){
    if (this.fini){ this.fini.t += dt; return; }
    if (!this.actif) return;
    this.chrono += dt;
    if (this.conclusion > 0){
      this.conclusion -= dt;
      if (this.conclusion <= 0) this.terminer(true);
      for (const ins of this.inspecteurs) if (ins.etat === "fouille") ins.chrono -= dt;
      Effets.majorer(dt);
      return;
    }
    this.restant -= dt;
    this.secousse = Math.max(0, this.secousse - dt * 2);
    if (this.message) { this.messageT += dt; if (this.messageT > this.messageDuree) this.message = null; }
    for (const z of this.zones) z.pulse += dt * 2.4;

    for (const ins of this.inspecteurs){
      if (ins.etat === "marche"){
        const reste = ins.vise - ins.x;
        const pas = Math.sign(reste) * Math.min(Math.abs(reste), ENQ_MARCHE * dt);
        ins.x += pas;
        ins.pas += Math.abs(pas) * 26;
        if (Math.abs(ins.vise - ins.x) < 0.004){
          ins.x = ins.vise; ins.etat = "fouille"; ins.chrono = ENQ_FOUILLE;
        }
      } else if (ins.etat === "fouille"){
        ins.chrono -= dt;
        if (ins.chrono <= 0) this.fouiller(ins);
      }
    }

    /* la caméra suit celui qui bouge, sinon le milieu des deux */
    const actif = this.inspecteurs.find(i => i.etat !== "repos") || this.inspecteurs[0];
    Camera.suivreEnq(actif.x, dt);

    if (this.restant <= 0){ this.restant = 0; this.terminer(false); }
    Effets.majorer(dt);
    Sons.ambiancer(0.25, dt, this.chrono);
  },

  /* --------- rendu --------- */
  dessiner(){
    const img = Images.table.appart;
    const L = Camera.L, H = Camera.H;
    if (!img || !img.naturalWidth){
      ctx.fillStyle = "#0B1226"; ctx.fillRect(0, 0, L, H); return;
    }
    const s = H / img.naturalHeight;
    const larg = img.naturalWidth * s;
    const trem = this.secousse > 0 ? Math.sin(this.secousse * 60) * 4 * this.secousse : 0;
    const x0 = -borne(Camera.xEnq, 0, Math.max(0, larg - L)) + trem;
    ctx.clearRect(0, 0, L, H);
    ctx.imageSmoothingEnabled = true;
    if ("imageSmoothingQuality" in ctx) ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, x0, 0, larg, H);

    const ecranX = fx => x0 + fx * larg;
    const ecranY = fy => fy * H;

    /* les zones */
    for (const z of this.zones){
      const px = ecranX(z.ref.x), py = ecranY(z.ref.y);
      if (px < -60 || px > L + 60) continue;
      const r = Math.max(13, H * 0.048);
      ctx.save();
      if (z.fouillee){
        ctx.globalAlpha = 0.75;
        ctx.beginPath(); ctx.arc(px, py, r * 0.62, 0, 6.2832);
        ctx.fillStyle = z.trace ? "rgba(247,179,43,.92)" : "rgba(11,18,38,.72)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 2; ctx.stroke();
        ctx.strokeStyle = z.trace ? "#3A2A06" : "rgba(255,255,255,.85)";
        ctx.lineWidth = Math.max(2, r * 0.14); ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(px - r * 0.24, py); ctx.lineTo(px - r * 0.05, py + r * 0.2); ctx.lineTo(px + r * 0.26, py - r * 0.22);
        ctx.stroke();
      } else {
        const b = 1 + 0.12 * Math.sin(z.pulse);
        ctx.globalAlpha = 0.5 + 0.25 * Math.sin(z.pulse);
        ctx.beginPath(); ctx.arc(px, py, r * b, 0, 6.2832);
        ctx.strokeStyle = "#F7B32B"; ctx.lineWidth = Math.max(2, r * 0.13); ctx.stroke();
        ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.arc(px, py, r * 0.16, 0, 6.2832);
        ctx.fillStyle = "#F7B32B"; ctx.fill();
      }
      ctx.restore();
    }

    /* les deux inspecteurs */
    const haut = H * ENQ_TAILLE;
    const sol = H * ENQ_LIGNE;
    for (const ins of this.inspecteurs){
      const h = Heros[ins.heros];
      const px = ecranX(ins.x);
      let pose = "idle";
      if (ins.etat === "marche") pose = "marche";
      else if (ins.etat === "fouille") pose = "regarde";
      const nom = h.sprite + "_" + pose;
      const img2 = Images.table[nom];
      if (!img2 || !img2.naturalWidth) continue;
      const bob = ins.etat === "marche" ? Math.abs(Math.sin(ins.pas)) * haut * 0.02 : 0;
      const penche = ins.etat === "fouille" ? 0.16 : 0;
      const versGauche = ins.vise < ins.x - 0.001;

      const g = ctx.createRadialGradient(px, sol, 0, px, sol, haut * 0.22);
      g.addColorStop(0, "rgba(20,14,10,.34)"); g.addColorStop(1, "rgba(20,14,10,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(px, sol, haut * 0.22, haut * 0.05, 0, 0, 6.2832); ctx.fill();

      const l = haut * img2.naturalWidth / img2.naturalHeight;
      const a = ancreDe(nom);
      ctx.save();
      ctx.translate(px, sol - bob);
      if (penche) ctx.rotate(penche * (versGauche ? -1 : 1));
      ctx.scale(versGauche ? -1 : 1, 1);
      ctx.drawImage(img2, -a * l, -haut, l, haut);
      ctx.restore();
    }

    /* les bulles, dessinées par le niveau 1 mais repositionnées ici */
    for (const p of Effets.paroles){
      if (p.cible.heros === undefined) continue;
      const ins = this.inspecteurs[p.cible.heros];
      if (!ins) continue;
      dessinerParoleLibre(p, ecranX(ins.x), sol - haut);
    }

    /* le bandeau d'enquête */
    this.dessinerBandeau();
  },

  dessinerBandeau(){
    const L = Camera.L, H = Camera.H;
    const marge = Math.max(10, H * 0.035);
    const taille = Math.max(12, H * 0.052);
    ctx.save();
    ctx.font = "800 " + Math.round(taille) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.textBaseline = "middle";

    /* chrono, au centre haut */
    const s = Math.max(0, Math.ceil(this.restant));
    const txt = (s < 10 && this.restant > 0 ? "0" : "") + s + " s";
    ctx.textAlign = "center";
    const l = ctx.measureText(txt).width;
    ctx.fillStyle = "rgba(10,16,30,.72)";
    arrondi(L / 2 - l / 2 - 14, marge, l + 28, taille * 1.7, 10); ctx.fill();
    ctx.strokeStyle = this.restant < 20 ? "rgba(226,69,61,.9)" : "rgba(255,255,255,.14)";
    ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = this.restant < 20 ? "#E2453D" : "#F1F5FF";
    ctx.fillText(txt, L / 2, marge + taille * 0.86);

    /* traces trouvées, en haut à droite */
    const r = taille * 0.42;
    for (let i = 0; i < ENQ_INDICES; i++){
      const px = L - marge - r - i * (r * 2.6);
      const py = marge + taille * 0.86;
      ctx.beginPath(); ctx.arc(px, py, r, 0, 6.2832);
      ctx.fillStyle = i < this.indices ? "#F7B32B" : "rgba(255,255,255,.14)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1.5; ctx.stroke();
    }
    ctx.restore();
  },
};

/* Une bulle posée à un endroit libre : le niveau 2 place ses héros
   lui-même, la version du niveau 1 irait les chercher dans la file. */
function dessinerParoleLibre(p, px, pyTete){
  const t = p.t / p.duree;
  const monte = Math.min(1, p.t * 8);
  const py = pyTete - Camera.H * 0.02 - monte * Camera.H * 0.02;
  const taille = Math.max(11, Camera.H * 0.055);
  ctx.save();
  ctx.globalAlpha = borne(1 - Math.pow(t, 4), 0, 1) * (0.35 + 0.65 * monte);
  ctx.font = "800 " + Math.round(taille) + "px 'Baloo 2', system-ui, sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const l = ctx.measureText(p.txt).width;
  const pad = taille * 0.62, bh = taille * 1.72, bl = l + pad * 2;
  const bx = borne(px - bl / 2, 4, Camera.L - bl - 4);
  const by = py - bh;
  arrondi(bx, by, bl, bh, bh * 0.42);
  ctx.fillStyle = "rgba(252,253,255,.96)"; ctx.fill();
  ctx.strokeStyle = "#23181A"; ctx.lineWidth = Math.max(1.5, taille * 0.10); ctx.stroke();
  const qx = borne(px, bx + bh * 0.5, bx + bl - bh * 0.5);
  ctx.beginPath();
  ctx.moveTo(qx - bh * 0.18, by + bh - 1);
  ctx.lineTo(qx + bh * 0.18, by + bh - 1);
  ctx.lineTo(qx, by + bh + bh * 0.36);
  ctx.closePath();
  ctx.fillStyle = "rgba(252,253,255,.96)"; ctx.fill();
  ctx.strokeStyle = "#23181A"; ctx.lineWidth = Math.max(1.5, taille * 0.10); ctx.stroke();
  ctx.fillStyle = "#1A1420";
  ctx.fillText(p.txt, bx + bl / 2, by + bh / 2);
  ctx.restore();
}
