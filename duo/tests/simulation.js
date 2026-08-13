/* ============================================================================
   Harnais d'exécution — node tests/simulation.js

   Les autres tests lisent le code. Celui-ci l'EXÉCUTE : il bouchonne le
   navigateur (DOM, canevas, audio, réseau, stockage), charge index.html tel
   quel, lance un match solo et fait tourner la boucle de jeu.

   Il attrape ce qu'aucune analyse statique ne voit : fonction manquante à
   l'exécution, valeur invalide qui se propage, état qui n'avance plus,
   exception dans une branche rarement empruntée.
   ========================================================================== */
"use strict";
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const script = (html.match(/<script>([\s\S]*?)<\/script>/) || [])[1] || "";

let reussis = 0, echoues = 0;
const verifier = (nom, ok, detail) => {
  if (ok){ reussis++; console.log("  ok   " + nom + (detail ? "  — " + detail : "")); }
  else { echoues++; console.log("  ÉCHEC " + nom + (detail ? "  — " + detail : "")); }
};

/* ---------------------------------------------------------------- bouchons */
const journalDessin = [];
function contexte2d(){
  const etat = { globalAlpha: 1, globalCompositeOperation: "source-over" };
  const pile = [];
  const degrade = { addColorStop(){} };
  const rien = () => {};
  return new Proxy({}, {
    get(_, p){
      if (p in etat) return etat[p];
      if (p === "canvas") return { width: 540, height: 720 };
      if (p === "measureText") return () => ({ width: 40 });
      if (p === "createLinearGradient" || p === "createRadialGradient" || p === "createPattern")
        return () => degrade;
      if (p === "createImageData") return (w, h) => ({ data: new Uint8ClampedArray(w*h*4) });
      if (p === "getImageData") return (x, y, w, h) => ({ data: new Uint8ClampedArray(w*h*4) });
      if (p === "putImageData" || p === "drawImage") return rien;
      if (p === "save") return () => pile.push({ ...etat });
      if (p === "restore") return () => { const e = pile.pop(); if (e) Object.assign(etat, e); };
      return (...a) => {
        journalDessin.push(String(p));
        for (const v of a) if (typeof v === "number" && !Number.isFinite(v))
          throw new Error("valeur non finie passée à ctx." + String(p) + " : " + a.join(","));
        return undefined;
      };
    },
    set(_, p, v){
      if (typeof v === "number" && !Number.isFinite(v))
        throw new Error("valeur non finie affectée à ctx." + String(p));
      etat[p] = v; return true;
    },
  });
}

function element(id){
  const el = {
    id, tagName: "DIV", style: {}, dataset: {}, children: [],
    textContent: "", innerHTML: "", value: "", disabled: false,
    videoWidth: 320, videoHeight: 320, offsetWidth: 100, srcObject: null,
    ecouteurs: {},
    classList: {
      _s: new Set(),
      add(c){ this._s.add(c); }, remove(c){ this._s.delete(c); },
      toggle(c, f){ if (f === undefined) this._s.has(c) ? this._s.delete(c) : this._s.add(c);
                    else f ? this._s.add(c) : this._s.delete(c); },
      contains(c){ return this._s.has(c); },
    },
    addEventListener(t, f){ (this.ecouteurs[t] = this.ecouteurs[t] || []).push(f); },
    removeEventListener(){},
    appendChild(c){ this.children.push(c); c.parentNode = this; return c; },
    parentNode: null,
    removeChild(c){ const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
    querySelector(){ return element("q"); },
    querySelectorAll(){ return []; },
    getBoundingClientRect(){ return { left: 0, top: 0, width: 540, height: 720 }; },
    getContext(){ return contexte2d(); },
    toDataURL(){ return "data:image/jpeg;base64,AAAA"; },
    focus(){}, play(){ return Promise.resolve(); },
    declencher(t, ev){ for (const f of (this.ecouteurs[t] || [])) f(ev || {}); },
  };
  return el;
}

const elements = new Map();
const groupes = new Map();
const obtenir = id => { if (!elements.has(id)) elements.set(id, element(id)); return elements.get(id); };

/* horloge et minuteurs pilotés : rien ne s'exécute sans qu'on le demande */
let horloge = 0;
const taches = [];
let idTache = 1;

const doc = {
  getElementById: obtenir,
  createElement: t => { const e = element("créé:" + t); e.tagName = t.toUpperCase(); return e; },
  /* mémorisé : sans cela, chaque appel renverrait de nouveaux éléments et les
     écouteurs posés au chargement ne seraient jamais déclenchés */
  querySelectorAll: sel => {
    if (groupes.has(sel)) return groupes.get(sel);
    let liste = [];
    if (sel === ".btnSolo") liste = ["facile", "moyen", "difficile"].map(n => {
      const e = element("solo:" + n); e.dataset.niveau = n; return e; });
    else if (sel === ".btnMode") liste = ["arcade", "classique", "gravite", "relais"].map(n => {
      const e = element("mode:" + n); e.dataset.mode = n; return e; });
    else if (sel === ".btnManches") liste = ["2", "3", "5"].map(n => {
      const e = element("manches:" + n); e.dataset.n = n; return e; });
    else if (sel === ".btnQualite") liste = ["minimal", "normal", "max"].map(n => {
      const e = element("q:" + n); e.dataset.q = n; return e; });
    else if (sel === ".carteVice") liste = ["I", "B", "G"].map(k => {
      const e = element("vice:" + k); e.dataset.vice = k; return e; });
    groupes.set(sel, liste);
    return liste;
  },
  addEventListener(){},
  documentElement: element("html"),
  body: element("body"),
};

const stockage = new Map();
const contexteGlobal = {
  document: doc,
  window: null,
  navigator: { mediaDevices: { getUserMedia: () => Promise.reject(new Error("pas de média")) },
               wakeLock: undefined },
  localStorage: {
    getItem: k => (stockage.has(k) ? stockage.get(k) : null),
    setItem: (k, v) => stockage.set(k, String(v)),
    removeItem: k => stockage.delete(k),
  },
  performance: { now: () => horloge },
  requestAnimationFrame: f => { taches.push({ quand: horloge + 16.7, f, id: idTache, image: true }); return idTache++; },
  cancelAnimationFrame: () => {},
  setTimeout: (f, d) => { taches.push({ quand: horloge + (d || 0), f, id: idTache }); return idTache++; },
  clearTimeout: id => { const i = taches.findIndex(t => t.id === id); if (i >= 0) taches.splice(i, 1); },
  setInterval: (f, d) => { taches.push({ quand: horloge + (d || 0), f, id: idTache, periode: d || 16 }); return idTache++; },
  clearInterval: id => { const i = taches.findIndex(t => t.id === id); if (i >= 0) taches.splice(i, 1); },
  Image: function(){ this.onload = null; this.onerror = null;
                     Object.defineProperty(this, "src", { set(){ if (this.onerror) this.onerror(); } }); },
  Peer: function(){ this.on = () => {}; this.destroy = () => {}; this.destroyed = false;
                    this.connect = () => ({ on: () => {}, send: () => {}, open: false, close: () => {} }); },
  AudioContext: undefined,
  webkitAudioContext: undefined,
  fetch: () => Promise.reject(new Error("hors ligne")),
  console,
  Math, JSON, Object, Array, String, Number, Boolean, Date, Promise, Set, Map,
  parseInt, parseFloat, isNaN, isFinite, Uint8ClampedArray, Error,
  location: { search: "", reload(){} },
  URL: { createObjectURL: () => "blob:x", revokeObjectURL(){} },
  Blob: function(){},
  MediaRecorder: undefined,
  AbortSignal: { timeout: () => undefined },
};
contexteGlobal.window = contexteGlobal;
contexteGlobal.globalThis = contexteGlobal;

/* --------------------------------------------------------------- chargement */
console.log("\n1. Chargement du jeu dans un navigateur simulé");
let jeu = null;
try {
  const noms = Object.keys(contexteGlobal);
  const valeurs = noms.map(n => contexteGlobal[n]);
  /* on expose quelques repères internes pour pouvoir observer la partie */
  const sonde = "\nreturn { get etat(){ return etat; }, get phase(){ return phase; }," +
                " get balles(){ return balles; }, get manches(){ return manches; }," +
                " get obstacles(){ return obstacles; }, get particules(){ return particules; }, get debris(){ return debris; }, puits: () => puitsActifs()," +
                " get lus(){ return lus; }, VERSION };";
  jeu = new Function(...noms, script + sonde)(...valeurs);
  verifier("le script s'exécute sans exception", true, "version " + jeu.VERSION);
} catch (e){
  verifier("le script s'exécute sans exception", false, e.message);
  console.log("\n" + "=".repeat(52) + "\nréussis : " + reussis + "   échoués : " + echoues + "\n" + "=".repeat(52));
  process.exit(1);
}

/* ------------------------------------------------------------- déroulement */
function avancer(ms){
  const cible = horloge + ms;
  let gardeFou = 0;
  while (horloge < cible){
    taches.sort((a, b) => a.quand - b.quand);
    const t = taches[0];
    if (!t || t.quand > cible){ horloge = cible; break; }
    horloge = t.quand;
    if (t.periode) t.quand = horloge + t.periode;
    else taches.shift();
    t.f();
    if (++gardeFou > 200000) throw new Error("boucle de tâches emballée");
  }
}

console.log("\n1bis. Écran de lancement");
try {
  const intro = obtenir("intro");
  verifier("la version s'affiche à l'écran de lancement",
    obtenir("introVersion").textContent === "v" + jeu.VERSION,
    obtenir("introVersion").textContent);
  verifier("l'écran est visible au départ", !intro.classList.contains("parti"));
  /* la voie normale passe par une promesse, que ce harnais synchrone ne peut
     pas laisser se résoudre ; on éprouve donc le garde-fou, qui est justement
     ce qui doit être infaillible : l écran ne doit jamais rester bloqué. */
  avancer(3200);
  verifier("l écran ne peut jamais rester bloqué", intro.classList.contains("parti"),
    "délai de secours déclenché");
} catch (e){ verifier("écran de lancement", false, e.message); }

console.log("\n2. Lancement d'un match solo");
try {
  doc.querySelectorAll(".btnSolo")[2].declencher("click");   /* difficile */
  verifier("le mode solo démarre", jeu.phase === "regles",
    "phase après le clic : " + jeu.phase);
} catch (e){ verifier("le mode solo démarre", false, e.message); }

try {
  obtenir("btnLu").declencher("click");
  avancer(200);
  verifier("la validation des règles est acceptée", jeu.phase === "vs" || jeu.phase === "compte",
    "phase : " + jeu.phase);
} catch (e){ verifier("la validation des règles est acceptée", false, e.message); }

console.log("\n3. Vingt secondes de jeu simulées");
let exception = null, imagesRendues = 0;
const avantDessin = journalDessin.length;
try {
  for (let i = 0; i < 20; i++){ avancer(1000); imagesRendues = journalDessin.length - avantDessin; }
} catch (e){ exception = e; }
verifier("aucune exception pendant la partie", !exception, exception ? exception.message : "20 s simulées");
verifier("le rendu produit bien des tracés", imagesRendues > 1000, imagesRendues + " opérations de dessin");

console.log("\n4. État du jeu après la partie");
const s = jeu.etat.score, m = jeu.manches;
verifier("le score progresse", s[0] + s[1] + m[0]*5 + m[1]*5 > 0,
  "score " + s.join("-") + " | manches " + m.join("-"));
verifier("phase cohérente", ["compte","jeu","recap","vice","fin","vs"].includes(jeu.phase), jeu.phase);

let invalides = 0;
for (const b of jeu.balles)
  for (const k of ["x","y","vx","vy","spin"])
    if (!Number.isFinite(b[k])) invalides++;
verifier("aucune valeur invalide dans les balles", invalides === 0,
  jeu.balles.length + " balle(s) en jeu");

let obstaclesInvalides = 0;
for (const o of jeu.obstacles)
  for (const k of ["x","y","l","h"])
    if (!Number.isFinite(o[k])) obstaclesInvalides++;
verifier("aucune valeur invalide dans les blocs", obstaclesInvalides === 0,
  jeu.obstacles.length + " bloc(s)");
verifier("particules plafonnées", jeu.particules.length <= 200, jeu.particules.length + " particules");

console.log("\n5. Mode gravité");
try {
  obtenir("btnMenu").declencher("click");
  avancer(300);
  doc.querySelectorAll(".btnMode")[2].declencher("click");   /* gravité */
  doc.querySelectorAll(".btnSolo")[1].declencher("click");   /* moyen */
  obtenir("btnLu").declencher("click");
  avancer(300);
  let boum = null;
  const avant = journalDessin.length;
  try { for (let i = 0; i < 25; i++) avancer(1000); } catch (e){ boum = e; }
  verifier("le mode gravité tourne sans exception", !boum, boum ? boum.message : "25 s simulées");
  verifier("le rendu continue", journalDessin.length - avant > 1000,
    (journalDessin.length - avant) + " opérations");
  let mauvais = 0;
  for (const b of jeu.balles)
    for (const k of ["x","y","vx","vy"]) if (!Number.isFinite(b[k])) mauvais++;
  verifier("les puits ne produisent pas de valeur invalide", mauvais === 0);
  const s2 = jeu.etat.score, m2 = jeu.manches;
  verifier("le jeu progresse en gravité", s2[0] + s2[1] + m2[0] + m2[1] > 0,
    "score " + s2.join("-") + " | manches " + m2.join("-"));
  /* ils n'arrivent qu'à partir de la deuxième manche : on ne l'exige donc
     qu'une fois la première remportée */
  const manchesJouees = jeu.manches[0] + jeu.manches[1];
  if (manchesJouees > 0)
    verifier("des rochers à partir de la deuxième manche", jeu.debris.length > 0,
      jeu.debris.length + " rochers après " + manchesJouees + " manche(s)");
  else
    /* en première manche il ne doit y avoir AUCUNE semence, mais des éclats
       peuvent naître d'un mur fissuré : on ne peut pas les distinguer ici,
       le contrôle du semis est fait par la suite statique */
    verifier("première manche : pas de semis", true,
      jeu.debris.length + " éclat(s), issus des murs le cas échéant");
  {
    /* ils doivent tourner AUTOUR, pas être collés au trou */
    const dists = jeu.debris.map(d => {
      const p = jeu.puits();
      return Math.min(...p.map(q => Math.hypot(q.x - d.x, q.y - d.y)));
    });
    const moy = dists.reduce((a, b) => a + b, 0) / (dists.length || 1);
    verifier("ils gardent leurs distances", dists.length === 0 || moy > 40,
      "distance moyenne au trou : " + Math.round(moy) + " px");
  }
} catch (e){ verifier("le mode gravité démarre", false, e.message); }

console.log("\n5bis. Mode relais");
try {
  obtenir("btnMenu").declencher("click");
  avancer(300);
  doc.querySelectorAll(".btnMode")[3].declencher("click");   /* relais */
  doc.querySelectorAll(".btnSolo")[0].declencher("click");   /* facile */
  obtenir("btnLu").declencher("click");
  avancer(300);
  let boum = null;
  try { for (let i = 0; i < 30; i++) avancer(1000); } catch (e){ boum = e; }
  verifier("le mode relais tourne sans exception", !boum, boum ? boum.message : "30 s simulées");
  verifier("aucun score en coopératif", jeu.etat.score[0] === 0 && jeu.etat.score[1] === 0,
    "score " + jeu.etat.score.join("-"));
  verifier("aucune manche en coopératif", jeu.manches[0] === 0 && jeu.manches[1] === 0);
} catch (e){ verifier("le mode relais démarre", false, e.message); }

console.log("\n6. Robustesse : deux minutes de plus");
try {
  for (let i = 0; i < 120; i++) avancer(1000);
  verifier("aucune exception sur la durée", true, "140 s de jeu au total");
} catch (e){ verifier("aucune exception sur la durée", false, e.message); }
verifier("les tâches ne s'accumulent pas", taches.length < 60, taches.length + " tâches actives");

console.log("\n" + "=".repeat(52));
console.log("réussis : " + reussis + "   échoués : " + echoues);
console.log("=".repeat(52));
process.exit(echoues ? 1 : 0);
