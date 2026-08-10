
/* ================= caméra =================
   Le bar reste collé au bord gauche ; la file pousse vers la droite.
   Quand elle dépasse ce que l'écran peut montrer, on dézoome — mais pas
   au-delà de Z_MIN, sinon les personnages deviennent illisibles. Le
   reste de la file est alors résumé au bord droit. */
const Z_MIN = 0.40;
const Camera = {
  x:X_PORTE - 14, z:1, zVise:1, ech:1, base:120, sol:0, L:1, H:1, dpr:1,

  mesurer(L, H, dpr){
    this.L = L; this.H = H; this.dpr = dpr;
    /* La largeur pèse moins que la hauteur, sauf en portrait où c'est
       elle qui contraint : sans le second terme, un iPhone debout
       affichait des personnages de 82 px perdus au bas de l'écran. */
    this.base = borne(Math.min(H * 0.27, L * 0.28), 70, 200);
    this.sol = H * 0.845;
    this.calculerVise();
  },
  calculerVise(){
    const echBase = this.base / H_PERSO;
    this.zVise = borne((this.L * 0.965) / Math.max(1, File.etendue() * echBase), Z_MIN, 1);
  },
  recaler(){ this.calculerVise(); this.z = this.zVise; this.ech = (this.base / H_PERSO) * this.z; },
  majorer(dt){
    this.calculerVise();
    this.z = melange(this.z, this.zVise, Math.min(1, dt * 2.6));
    this.ech = (this.base / H_PERSO) * this.z;
  },
  ecran(xMonde){ return (xMonde - this.x) * this.ech; },
  bordGauche(){ return this.x; },
  bordDroit(){ return this.x + this.L / this.ech; },
  /* Combien de places tiennent à l'écran, pour savoir ce qu'on résume. */
  dernierePlaceVisible(){ return Math.floor((this.bordDroit() - 46) / PAS); },
};

/* ================= effets ================= */
const Effets = {
  textes:[], eclats:[], gouttesL:[], alertes:[], bulles:[],

  raz(){ this.textes = []; this.eclats = []; this.gouttesL = []; this.alertes = []; this.bulles = []; },

  texte(x, y, txt, couleur, taille, duree){
    this.textes.push({ x, y, txt, couleur, taille:taille || 1, t:0, duree:duree || 1.05 });
  },
  eclat(x, y, force){
    const n = borne(6 + force * 2, 6, 26);
    this.eclats.push({ x, y, t:0, duree:0.5, force:borne(force / 10, 0.2, 1.6) });
    for (let i = 0; i < n; i++){
      const a = hasard(-Math.PI, 0), v = hasard(30, 90) * (1 + force * 0.05);
      this.gouttesL.push({ x, y, vx:Math.cos(a) * v, vy:Math.sin(a) * v, t:0, duree:hasard(0.4, 0.8),
        c:i % 3 === 0 ? "#F7B32B" : "#FFFFFF", r:hasard(1.6, 3.4) });
    }
  },
  gouttes(x, y, n){
    for (let i = 0; i < n; i++){
      this.gouttesL.push({ x:x + hasard(-8, 8), y:y + hasard(-6, 6),
        vx:hasard(-16, 16), vy:hasard(-46, -14), t:0, duree:hasard(0.5, 0.9), c:"#7FC3F5", r:hasard(1.8, 3.2) });
    }
  },
  alerte(pnj){ this.alertes.push({ pnj, t:0 }); },
  bulle(pnj, txt, duree){ this.bulles.push({ pnj, txt, t:0, duree }); },

  majorer(dt){
    for (const e of this.textes) e.t += dt;
    this.textes = this.textes.filter(e => e.t < e.duree);
    for (const e of this.eclats) e.t += dt;
    this.eclats = this.eclats.filter(e => e.t < e.duree);
    for (const g of this.gouttesL){ g.t += dt; g.x += g.vx * dt; g.y += g.vy * dt; g.vy += 190 * dt; }
    this.gouttesL = this.gouttesL.filter(g => g.t < g.duree);
    for (const b of this.bulles) b.t += dt;
    this.bulles = this.bulles.filter(b => b.t < b.duree && b.pnj.etat === ETAT.MALAISE);
    this.alertes = this.alertes.filter(a => a.pnj.etat === ETAT.DEMANDE);
    for (const a of this.alertes) a.t += dt;
  },
};

/* ================= rendu =================
   Aucun shadowBlur : la leçon de DUO vaut ici aussi, il force une passe
   de rendu par objet. Les lueurs sont des dégradés radiaux, posés une
   seule fois. */
let ctx = null, cv = null;

function ajusterCanevas(){
  if (!cv) return;
  const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
  const L = cv.clientWidth || 640, H = cv.clientHeight || 360;
  const lp = Math.round(L * dpr), hp = Math.round(H * dpr);
  if (cv.width !== lp || cv.height !== hp){ cv.width = lp; cv.height = hp; }
  Camera.mesurer(L, H, dpr);
}

/* Un personnage, ancré sur ses pieds. */
function dessinerPerso(nom, xMonde, yBase, hauteur, versGauche, incline, alpha){
  const img = Images.table[nom];
  if (!img || !img.naturalWidth) return;
  const l = hauteur * img.naturalWidth / img.naturalHeight;
  const a = ancreDe(nom);
  const px = Camera.ecran(xMonde);
  ctx.save();
  if (alpha != null) ctx.globalAlpha = alpha;
  ctx.translate(px, yBase);
  if (incline) ctx.rotate(incline);
  ctx.scale(versGauche ? -1 : 1, 1);
  ctx.drawImage(img, -a * l, -hauteur, l, hauteur);
  ctx.restore();
}

function ombreAuSol(xMonde, yBase, hauteur, force){
  const px = Camera.ecran(xMonde), r = hauteur * 0.26;
  const g = ctx.createRadialGradient(px, yBase, 0, px, yBase, r);
  g.addColorStop(0, "rgba(20,16,24," + (0.34 * force) + ")");
  g.addColorStop(1, "rgba(20,16,24,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(px, yBase, r, r * 0.26, 0, 0, 6.2832);
  ctx.fill();
}

/* --- bras peint du PNJ ---
   La planche ne donne qu'une main tendue générique : s'en servir pour
   les seize aurait changé le personnage au milieu de la file. On peint
   donc le bras avec la couleur de manche et la couleur de peau relevées
   sur le sprite lui-même. Un léger creux au milieu évite qu'il passe
   devant le visage de Pierre-François. */
function dessinerBras(pnj, xMonde, yBase, hauteur, cible, ext){
  const t = pnj.teinte;
  const ep = { x:Camera.ecran(xMonde) - hauteur * 0.04, y:yBase - hauteur * EPAULE };
  const but = { x:Camera.ecran(cible.x), y:Camera.sol + cible.y * Camera.ech };
  const fin = { x:melange(ep.x, but.x, ext), y:melange(ep.y, but.y, ext) };

  /* Le coude tombe sous la ligne épaule-main, d'autant plus que le bras
     va loin : c'est ce qui donne le geste « je tends le bras par-dessus
     Pierre-François », et ça fait passer l'avant-bras devant son torse
     plutôt que devant son visage. */
  const portee = Math.hypot(fin.x - ep.x, fin.y - ep.y);
  const coude = {
    x:melange(ep.x, fin.x, 0.52),
    y:melange(ep.y, fin.y, 0.52) + portee * 0.14 + hauteur * 0.02,
  };

  const trait = hauteur * 0.042;
  const cerne = trait + hauteur * 0.020;
  ctx.save();
  ctx.lineCap = "round"; ctx.lineJoin = "round";

  /* raccord d'épaule : sans lui, le bras avait l'air posé à côté du corps */
  ctx.beginPath(); ctx.arc(ep.x, ep.y, hauteur * 0.040, 0, 6.2832);
  ctx.fillStyle = t.manche; ctx.fill();
  ctx.strokeStyle = "#23181A"; ctx.lineWidth = Math.max(1, hauteur * 0.016); ctx.stroke();

  /* cerne d'un seul tenant : deux traits séparés laissaient un angle net au coude */
  ctx.beginPath();
  ctx.moveTo(ep.x, ep.y); ctx.quadraticCurveTo(coude.x, coude.y, fin.x, fin.y);
  ctx.strokeStyle = "#23181A"; ctx.lineWidth = cerne; ctx.stroke();

  /* manche : de l'épaule au coude */
  ctx.beginPath();
  ctx.moveTo(ep.x, ep.y);
  ctx.quadraticCurveTo(melange(ep.x, coude.x, 0.6), melange(ep.y, coude.y, 0.6), coude.x, coude.y);
  ctx.strokeStyle = t.manche; ctx.lineWidth = trait; ctx.stroke();

  /* avant-bras nu : du coude à la main, un peu plus fin */
  ctx.beginPath();
  ctx.moveTo(coude.x, coude.y);
  ctx.quadraticCurveTo(melange(coude.x, fin.x, 0.45), melange(coude.y, fin.y, 0.45), fin.x, fin.y);
  ctx.strokeStyle = t.peau; ctx.lineWidth = trait * 0.86; ctx.stroke();

  /* la main : une ellipse couchée le long du bras. En cercle, elle
     donnait une sucette au bout d'un bâton. */
  const ang = Math.atan2(fin.y - coude.y, fin.x - coude.x);
  const rx = hauteur * 0.062, ry = hauteur * 0.045;
  ctx.beginPath(); ctx.ellipse(fin.x, fin.y, rx, ry, ang, 0, 6.2832);
  ctx.fillStyle = t.peau; ctx.fill();
  ctx.strokeStyle = "#23181A"; ctx.lineWidth = Math.max(1, hauteur * 0.015); ctx.stroke();
  /* le pli du pouce */
  ctx.beginPath();
  ctx.ellipse(fin.x, fin.y - ry * 0.35, rx * 0.62, ry * 0.30, ang, 0, 6.2832);
  ctx.strokeStyle = t.peauOmbre; ctx.lineWidth = Math.max(1, hauteur * 0.010); ctx.stroke();
  ctx.restore();
  return fin;
}

/* --- alerte au-dessus du héros visé ---
   Le signal est posé sur le héros à saluer, pas sur le PNJ, et reprend
   la couleur de son bouton : à 0,6 s de temps de réaction, c'est la
   seule façon de lire la consigne sans réfléchir. */
function dessinerAlerte(a){
  const pnj = a.pnj;
  if (pnj.cible < 0) return;
  const h = Heros[pnj.cible];
  const hauteur = H_PERSO * Camera.ech;
  const px = Camera.ecran(xPlace(h.place));
  const py = Camera.sol - hauteur * 1.26;
  const r = Math.max(13, hauteur * 0.15);
  const reste = borne(pnj.chrono / Math.max(0.001, pnj.tReaction), 0, 1);
  const bat = 1 + 0.09 * Math.sin(a.t * 15);

  ctx.save();
  ctx.translate(px, py);
  ctx.scale(bat, bat);

  /* pastille */
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832);
  ctx.fillStyle = "rgba(11,18,38,.92)"; ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.13); ctx.strokeStyle = h.couleur; ctx.stroke();

  /* anneau de décompte */
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.34, -Math.PI / 2, -Math.PI / 2 + 6.2832 * reste);
  ctx.strokeStyle = reste < 0.34 ? "#E2453D" : "#F7B32B";
  ctx.lineWidth = Math.max(2.5, r * 0.20); ctx.lineCap = "butt"; ctx.stroke();

  /* le point d'exclamation */
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 " + Math.round(r * 1.5) + "px 'Baloo 2', system-ui, sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("!", 0, r * 0.06);

  /* petite pointe vers la tête */
  ctx.beginPath();
  ctx.moveTo(-r * 0.28, r * 0.86); ctx.lineTo(r * 0.28, r * 0.86); ctx.lineTo(0, r * 1.5);
  ctx.closePath(); ctx.fillStyle = "rgba(11,18,38,.92)"; ctx.fill();
  ctx.restore();
}

function dessinerBulle(b){
  const hauteur = H_PERSO * Camera.ech * DEVANT_Z;
  const px = Camera.ecran(b.pnj.x);
  const py = Camera.sol + DEVANT_Y * H_PERSO * Camera.ech - hauteur * 1.04;
  const r = Math.max(11, hauteur * 0.13);
  ctx.save();
  ctx.globalAlpha = borne(1 - b.t / b.duree * 0.7, 0, 1);
  ctx.beginPath(); ctx.arc(px, py, r, 0, 6.2832);
  ctx.fillStyle = "rgba(255,255,255,.94)"; ctx.fill();
  ctx.strokeStyle = "#23181A"; ctx.lineWidth = Math.max(1.6, r * 0.11); ctx.stroke();
  ctx.fillStyle = "#23181A";
  ctx.font = "800 " + Math.round(r * 1.3) + "px 'Baloo 2', system-ui, sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(b.txt, px, py + r * 0.06);
  ctx.restore();
}

/* --- décor ---
   Les trois images n'ont pas le même cadrage : on les pose donc toutes
   avec le même point d'ancrage (le trottoir, 82 % de la hauteur) pour
   que le croisement jour/soir/nuit ne fasse pas sauter le bar. */
const ANCRE_FOND_Y = 0.86, ANCRE_FOND_X = 0.34;

function poserFond(nom, alpha){
  const img = Images.table[nom];
  if (!img || !img.naturalWidth) return;
  const L = Camera.L, H = Camera.H;
  const zoom = 0.98 + 0.06 * Camera.z;          /* la caméra recule quand la file s'allonge */
  const s = Math.max(L / img.naturalWidth, H / img.naturalHeight) * zoom;
  const l = img.naturalWidth * s, h = img.naturalHeight * s;
  const x = -ANCRE_FOND_X * l + L * ANCRE_FOND_X;
  const y = Camera.sol - ANCRE_FOND_Y * h;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, x, Math.min(y, 0), l, h);
  ctx.globalAlpha = 1;
}

function dessinerDecor(){
  const a = MOMENTS[Jeu.fonduDe], b = MOMENTS[Jeu.moment];
  const t = doux(borne(Jeu.fondu, 0, 1));
  poserFond(a.fond, 1);
  if (b !== a && t > 0) poserFond(b.fond, t);

  /* On passe TOUJOURS par melangeVoile, même à t = 1 : renvoyer le
     MOMENT brut donnait un objet sans champ `couleur`, fillStyle restait
     au noir par défaut et le décor disparaissait sous un rectangle plein. */
  return melangeVoile(a, b, t);
}

/* Le voile de teinte est posé APRÈS les personnages, pas après le
   décor : sinon les sprites restaient éclairés en plein jour au milieu
   d'une rue de nuit, et se détachaient comme des découpages. */
function poserVoile(voile){
  ctx.fillStyle = voile.couleur;
  ctx.fillRect(0, 0, Camera.L, Camera.H);
  if (voile.lampes > 0.02){
    const g = ctx.createRadialGradient(Camera.L * 0.5, Camera.sol - Camera.H * 0.30, 0,
                                       Camera.L * 0.5, Camera.sol - Camera.H * 0.30, Camera.L * 0.62);
    g.addColorStop(0, "rgba(255,196,110," + (0.22 * voile.lampes) + ")");
    g.addColorStop(1, "rgba(255,196,110,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, Camera.L, Camera.H);
  }
}

function melangeVoile(a, b, t){
  const lire = s => s.match(/[\d.]+/g).map(Number);
  const va = lire(a.voile), vb = lire(b.voile);
  const c = [0, 1, 2].map(i => Math.round(melange(va[i], vb[i], t)));
  const o = melange(va[3], vb[3], t);
  return {
    couleur:"rgba(" + c.join(",") + "," + o.toFixed(3) + ")",
    ombre:melange(a.ombre, b.ombre, t),
    lampes:melange(a.lampes, b.lampes, t),
  };
}

/* --- la file résumée, quand elle déborde de l'écran --- */
function dessinerDebordement(){
  const derniere = Camera.dernierePlaceVisible();
  const cachees = File.places.length - 1 - derniere;
  if (cachees < 2) return;
  const hauteur = H_PERSO * Camera.ech;

  /* Un voile qui mange le bord droit plutôt que de fausses silhouettes :
     posées par-dessus les vrais sprites, elles faisaient un mur. Là, la
     file se perd dans la nuit et le compteur dit combien il en reste. */
  const large = Math.min(Camera.L * 0.22, hauteur * 2.4);
  const g = ctx.createLinearGradient(Camera.L - large, 0, Camera.L, 0);
  g.addColorStop(0, "rgba(11,18,38,0)");
  g.addColorStop(1, "rgba(11,18,38,.80)");
  ctx.fillStyle = g;
  ctx.fillRect(Camera.L - large, 0, large, Camera.H);

  const eti = "+" + cachees;
  const py = Camera.sol - hauteur * 0.62;
  const taille = Math.max(15, Math.round(hauteur * 0.30));
  ctx.font = "800 " + taille + "px 'Baloo 2', system-ui, sans-serif";
  ctx.textAlign = "right"; ctx.textBaseline = "middle";
  const l = ctx.measureText(eti).width;
  ctx.fillStyle = "rgba(11,18,38,.9)";
  arrondi(Camera.L - l - 28, py - taille * 0.72, l + 20, taille * 1.44, 10); ctx.fill();
  ctx.strokeStyle = "rgba(247,179,43,.55)"; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "#F7B32B";
  ctx.fillText(eti, Camera.L - 16, py);
}

function arrondi(x, y, l, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + l, y, x + l, y + h, r);
  ctx.arcTo(x + l, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + l, y, r);
  ctx.closePath();
}

/* --- un héros --- */
function poseHeros(i){
  const h = Heros[i];
  if (Jeu.phase === "fin") return i === 0 ? "surpris" : "stress";
  if (h.geste) return h.geste.type === "victoire" ? "victoire" : "tendue";
  if (h.sueur > 0.7) return "stress";
  if (Jeu.demandes.some(p => p.cible === i)) return "regarde";
  return (Math.floor(h.phase) % 6 === 0) ? "attente" : "idle";
}

function dessinerHeros(i, voile){
  const h = Heros[i];
  const hauteur = H_PERSO * Camera.ech;
  const pose = poseHeros(i);
  const nom = h.sprite + "_" + pose;
  const tourne = !!h.geste;                    /* il se retourne vers la droite pour saluer */
  const bob = Math.sin(h.phase * 1.7) * hauteur * 0.006;
  const trem = h.tremble > 0 ? Math.sin(h.tremble * 42) * hauteur * 0.012 : 0;
  const x = xPlace(h.place);

  ombreAuSol(x, Camera.sol, hauteur, voile.ombre / 0.16);
  dessinerPerso(nom, x + trem / Camera.ech, Camera.sol + bob, hauteur, !tourne, 0, 1);

  /* gouttes de sueur permanentes tant que le malaise dure */
  if (h.sueur > 0.25 && Math.random() < 0.05) Effets.gouttes(x, -0.9 * H_PERSO, 1);

  /* liseré de couleur sous le héros visé : redondance utile avec l'alerte */
  if (Jeu.demandes.some(p => p.cible === i)){
    const px = Camera.ecran(x);
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.25 * Math.sin(Jeu.temps * 9);
    ctx.strokeStyle = h.couleur; ctx.lineWidth = Math.max(2, hauteur * 0.028);
    ctx.beginPath(); ctx.ellipse(px, Camera.sol + hauteur * 0.02, hauteur * 0.19, hauteur * 0.055, 0, 0, 6.2832);
    ctx.stroke(); ctx.restore();
  }
}

/* --- un PNJ --- */
function dessinerPnj(p, voile){
  const rangé = p.arrive && p.etat === ETAT.ATTENTE;
  const z = rangé ? 1 : DEVANT_Z;
  const hauteur = H_PERSO * Camera.ech * z;
  const yBase = Camera.sol + (rangé ? 0 : DEVANT_Y * H_PERSO * Camera.ech);
  const marche = (p.etat === ETAT.ENTREE || p.etat === ETAT.MARCHE || p.etat === ETAT.REPOS);
  const bob = marche ? Math.abs(Math.sin(p.pas)) * hauteur * 0.022 : Math.sin(p.phase) * hauteur * 0.005;
  const bascule = marche ? Math.sin(p.pas) * 0.035 : 0;

  ombreAuSol(p.x, yBase, hauteur, voile.ombre / 0.16);
  dessinerPerso(p.sprite, p.x, yBase - bob, hauteur, p.regarde < 0, p.penche + bascule, 1);

  if (p.bras > 0.02 && p.cible >= 0){
    dessinerBras(p, p.x, yBase - bob, hauteur, mainHeros(p.cible, p.etat === ETAT.POIGNEE), p.bras);
  }
}

/* --- boucle de dessin --- */
function dessiner(){
  if (!ctx) return;
  const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, Camera.L, Camera.H);
  ctx.imageSmoothingEnabled = true;
  if ("imageSmoothingQuality" in ctx) ctx.imageSmoothingQuality = "high";

  const voile = dessinerDecor();

  /* la file, de droite à gauche : celui de devant passe par-dessus */
  for (let i = File.places.length - 1; i >= 0; i--){
    const c = File.places[i];
    if (!c) continue;
    if (c.heros !== undefined) dessinerHeros(c.heros, voile);
    else if (c.pnj && c.pnj.arrive && c.pnj.etat === ETAT.ATTENTE) dessinerPnj(c.pnj, voile);
  }

  /* ceux qui longent la file, par devant */
  const devant = Foule.tous.filter(p => !(p.arrive && p.etat === ETAT.ATTENTE)).sort((a, b) => b.x - a.x);
  for (const p of devant) dessinerPnj(p, voile);

  dessinerDebordement();
  poserVoile(voile);

  /* effets */
  for (const b of Effets.bulles) dessinerBulle(b);
  for (const a of Effets.alertes) dessinerAlerte(a);

  for (const e of Effets.eclats){
    const t = e.t / e.duree, r = (14 + 46 * e.force) * Camera.ech * (0.4 + t * 1.5);
    const px = Camera.ecran(e.x), py = Camera.sol + e.y * Camera.ech;
    ctx.save(); ctx.globalAlpha = (1 - t) * 0.85;
    const g = ctx.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, "rgba(255,255,255,.95)");
    g.addColorStop(0.45, "rgba(247,179,43,.55)");
    g.addColorStop(1, "rgba(247,179,43,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r, 0, 6.2832); ctx.fill();
    ctx.restore();
  }
  for (const g of Effets.gouttesL){
    const t = g.t / g.duree;
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = g.c;
    ctx.beginPath();
    ctx.arc(Camera.ecran(g.x), Camera.sol + g.y * Camera.ech, g.r * Camera.ech * 1.6, 0, 6.2832);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const e of Effets.textes){
    const t = e.t / e.duree;
    const px = Camera.ecran(e.x), py = Camera.sol + e.y * Camera.ech - t * 34;
    const taille = Math.max(12, Camera.base * 0.15 * e.taille) * (1 + (1 - Math.min(1, t * 5)) * 0.35);
    ctx.save();
    ctx.globalAlpha = borne(1 - Math.pow(t, 2.4), 0, 1);
    ctx.font = "800 " + Math.round(taille) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.lineWidth = Math.max(2.5, taille * 0.20); ctx.strokeStyle = "rgba(12,10,18,.85)";
    ctx.strokeText(e.txt, px, py); ctx.fillStyle = e.couleur; ctx.fillText(e.txt, px, py);
    ctx.restore();
  }

  if (Jeu.phase === "fin"){
    ctx.fillStyle = "rgba(7,11,22," + borne(Jeu.finChrono * 0.35, 0, 0.45) + ")";
    ctx.fillRect(0, 0, Camera.L, Camera.H);
  }
}
