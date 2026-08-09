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
    appendChild(c){ this.children.push(c); return c; },
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
    else if (sel === ".btnMode") liste = ["arcade", "classique"].map(n => {
      const e = element("mode:" + n); e.dataset.mode = n; return e; });
    else if (sel === ".btnManches") liste = ["2", "3", "5"].map(n => {
      const e = element("manches:" + n); e.dataset.n = n; return e; });
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
                " get obstacles(){ return obstacles; }, get particules(){ return particules; }," +
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

console.log("\n5. Robustesse : deux minutes de plus");
try {
  for (let i = 0; i < 120; i++) avancer(1000);
  verifier("aucune exception sur la durée", true, "140 s de jeu au total");
} catch (e){ verifier("aucune exception sur la durée", false, e.message); }
verifier("les tâches ne s'accumulent pas", taches.length < 60, taches.length + " tâches actives");

console.log("\n" + "=".repeat(52));
console.log("réussis : " + reussis + "   échoués : " + echoues);
console.log("=".repeat(52));
process.exit(echoues ? 1 : 0);
