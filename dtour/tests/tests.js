#!/usr/bin/env node
/* Suite de tests de « La file du D'Tour ».
   Rend un code de sortie non nul dès qu'un test échoue : elle est faite
   pour être enchaînée avec && avant un push.

   Elle fait quatre choses, dans cet ordre :
     1. extrait le <script> d'index.html et contrôle la syntaxe ;
     2. confronte les fonctions APPELÉES aux fonctions DÉFINIES — une
        fonction invoquée sans corps passe `node --check` et plante à
        l'exécution, c'est arrivé sur le projet voisin ;
     3. exécute le script hors navigateur, sur un décor DOM minimal, et
        vérifie la logique de jeu ;
     4. simule des parties entières pour vérifier qu'aucune ne casse.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const RACINE = path.join(__dirname, "..");
let echecs = 0, reussis = 0;
let section = "";

function titre(t){ section = t; console.log("\n\u2500\u2500 " + t); }
function ok(nom){ reussis++; console.log("   \u2713 " + nom); }
function ko(nom, detail){
  echecs++;
  console.log("   \u2717 " + nom + (detail ? "\n       " + detail : ""));
}
function verifier(nom, condition, detail){ condition ? ok(nom) : ko(nom, detail); }
function egal(nom, obtenu, attendu){
  const bon = JSON.stringify(obtenu) === JSON.stringify(attendu);
  bon ? ok(nom) : ko(nom, "obtenu " + JSON.stringify(obtenu) + ", attendu " + JSON.stringify(attendu));
}
function presque(nom, obtenu, attendu, marge){
  const bon = Math.abs(obtenu - attendu) <= (marge == null ? 1e-6 : marge);
  bon ? ok(nom) : ko(nom, "obtenu " + obtenu + ", attendu \u2248 " + attendu);
}

/* ================= 1. extraction et syntaxe ================= */
titre("Fichier et syntaxe");

const html = fs.readFileSync(path.join(RACINE, "index.html"), "utf8");
const blocs = html.match(/<script>\n[\s\S]*?\n<\/script>/g) || [];
verifier("un seul bloc <script> dans index.html", blocs.length === 1, blocs.length + " trouvé(s)");
const source = blocs.length ? blocs[0].replace(/^<script>\n/, "").replace(/\n<\/script>$/, "") : "";

verifier("le script n'est pas vide", source.length > 20000, source.length + " octets");
verifier("mode strict activé", /^"use strict";/.test(source.trim()));

let script = null;
try{
  script = new vm.Script(source, { filename:"index.html<script>" });
  ok("syntaxe acceptée");
}catch(e){
  ko("syntaxe acceptée", e.message);
}

/* Les images citées par le script doivent exister sur le disque. */
titre("Ressources");
const dossierImg = path.join(RACINE, "img");
const presentes = fs.existsSync(dossierImg) ? fs.readdirSync(dossierImg) : [];
const citees = new Set();
for (const m of source.matchAll(/"(fond_[a-z]+|logo|face_[a-z]+|pnj\d\d|(?:thibaut|pierre)_[a-z]+)"/g)) citees.add(m[1]);
/* les poses des héros sont construites par concaténation : on les recompose */
for (const h of ["thibaut","pierre"]) for (const p of ["idle","attente","marche","regarde","surpris","stress","tendue","victoire"]) citees.add(h + "_" + p);
for (let i = 1; i <= 16; i++) citees.add("pnj" + String(i).padStart(2, "0"));
const manquantes = [...citees].filter(n => !presentes.includes(n + ".webp"));
verifier("toutes les images citées existent dans img/", manquantes.length === 0, "manquant : " + manquantes.join(", "));
verifier("aucune image inutilisée dans img/",
  presentes.filter(f => f.endsWith(".webp") && !citees.has(f.slice(0, -5))).length === 0,
  "inutilisée : " + presentes.filter(f => f.endsWith(".webp") && !citees.has(f.slice(0, -5))).join(", "));

/* ================= 2. références =================
   L'analyse porte sur le code SEUL. Les commentaires et les chaînes
   sont d'abord blanchis : sans ça, le mot « rue » d'un commentaire
   suivi d'une parenthèse passait pour un appel de fonction, et la
   phrase « aucun shadowBlur » faisait échouer le test qui interdit
   shadowBlur. */
function blanchir(src){
  let out = "", i = 0, n = src.length;
  const precedentUtile = () => {
    for (let k = out.length - 1; k >= 0; k--){
      const c = out[k];
      if (c === " " || c === "\n" || c === "\t" || c === "\r") continue;
      return c;
    }
    return "";
  };
  while (i < n){
    const c = src[i], d = src[i + 1];
    if (c === "/" && d === "/"){
      while (i < n && src[i] !== "\n"){ i++; }
      continue;
    }
    if (c === "/" && d === "*"){
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")){ if (src[i] === "\n") out += "\n"; i++; }
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`"){
      i++;
      while (i < n && src[i] !== c){ if (src[i] === "\\") i++; i++; }
      i++;
      out += '""';
      continue;
    }
    if (c === "/" && "(,=:[!&|?{};+".includes(precedentUtile())){
      /* littéral régulier : on le remplace par un jeton neutre */
      i++;
      while (i < n && src[i] !== "/"){
        if (src[i] === "\\") i++;
        else if (src[i] === "[") { while (i < n && src[i] !== "]"){ if (src[i] === "\\") i++; i++; } }
        i++;
      }
      i++;
      while (i < n && /[gimsuy]/.test(src[i])) i++;
      out += "REGEX";
      continue;
    }
    out += c; i++;
  }
  return out;
}
const code = blanchir(source);
titre("Références");

const definies = new Set();
const ajouterParams = liste => {
  for (let brut of String(liste).split(",")){
    brut = brut.trim().replace(/=.*$/s, "").replace(/^\.\.\./, "").trim();
    if (/^[A-Za-z_$][\w$]*$/.test(brut)) definies.add(brut);
  }
};
for (const m of code.matchAll(/\bfunction\s*\*?\s*([A-Za-z_$][\w$]*)?\s*\(([^)]*)\)/g)){
  if (m[1]) definies.add(m[1]);
  ajouterParams(m[2]);
}
for (const m of code.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) definies.add(m[1]);
for (const m of code.matchAll(/\bclass\s+([A-Za-z_$][\w$]*)/g)) definies.add(m[1]);
/* méthodes, accesseurs et constructeurs : `nom(args){`, `get nom(){` */
for (const m of code.matchAll(/(?:^|[\s;,{])(?:get\s+|set\s+|static\s+|async\s+)*([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{/g)){
  definies.add(m[1]); ajouterParams(m[2]);
}
/* fonctions fléchées, avec ou sans parenthèses */
for (const m of code.matchAll(/\(([^()]*)\)\s*=>/g)) ajouterParams(m[1]);
for (const m of code.matchAll(/(?:^|[\s(,=:[])([A-Za-z_$][\w$]*)\s*=>/g)) definies.add(m[1]);
for (const m of code.matchAll(/\bcatch\s*\(([^)]*)\)/g)) ajouterParams(m[1]);
for (const m of code.matchAll(/\bfor\s*\(\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) definies.add(m[1]);
/* propriétés valant une fonction : `nom: (a) => …` ou `nom: function` */
for (const m of code.matchAll(/([A-Za-z_$][\w$]*)\s*:\s*(?:async\s*)?(?:function|\(|[A-Za-z_$][\w$]*\s*=>)/g)) definies.add(m[1]);

const CONNUS = new Set(["if","for","while","switch","catch","return","typeof","function","new","do",
  "Math","JSON","Object","Array","String","Number","Boolean","Promise","Set","Map","Date","Image",
  "parseInt","parseFloat","isNaN","isFinite","setTimeout","clearTimeout","setInterval","clearInterval",
  "requestAnimationFrame","cancelAnimationFrame","console","localStorage","document","window",
  "globalThis","performance","navigator","AudioContext","webkitAudioContext","Error","RegExp","Symbol",
  "void","await","async","from","of","in","delete","else","try","super","this","REGEX"]);

const appels = new Set();
for (const m of code.matchAll(/(?:^|[^.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) appels.add(m[1]);
const orphelines = [...appels].filter(n => !definies.has(n) && !CONNUS.has(n));
verifier("aucune fonction appelée sans être définie", orphelines.length === 0, "orpheline(s) : " + orphelines.join(", "));
verifier("le décompte des fonctions définies est plausible", definies.size > 60, definies.size + " noms");

/* Interdits hérités des ennuis du projet voisin. */
titre("Interdits");
verifier("aucun shadowBlur sur le canevas", !/shadowBlur/.test(code));
verifier("aucune unité dvh dans la feuille de style", !/\d\s*dvh/.test(html));
verifier("aucun secret en dur", !/github_pat|ghp_[A-Za-z0-9]{20}/.test(html));
verifier("la version du script et celle affichée concordent",
  (() => {
    const v = source.match(/const VERSION = "([\d.]+)"/);
    const t = html.match(/D'TOUR v([\d.]+)/);
    return v && t && v[1] === t[1];
  })(), "VERSION vs texte du pied de page");

/* ================= 3. logique, hors navigateur ================= */
titre("Logique de jeu");

function decorDom(){
  const fait = new Map();
  const elem = id => {
    if (fait.has(id)) return fait.get(id);
    const e = {
      id, textContent:"", value:"100", style:{}, dataset:{}, offsetWidth:0, src:"",
      classList:{ _s:new Set(),
        add(...c){ c.forEach(x => this._s.add(x)); },
        remove(...c){ c.forEach(x => this._s.delete(x)); },
        toggle(c, v){ v === undefined ? (this._s.has(c) ? this._s.delete(c) : this._s.add(c)) : (v ? this._s.add(c) : this._s.delete(c)); },
        contains(c){ return this._s.has(c); } },
      addEventListener(){}, removeEventListener(){}, focus(){}, appendChild(){},
      querySelectorAll(){ return []; }, querySelector(){ return null; }, closest(){ return null; },
      getContext:null,
    };
    fait.set(id, e); return e;
  };
  const stock = {};
  return {
    document:{
      readyState:"complete",
      hidden:false,
      getElementById:elem,
      createElement:() => elem("_tmp_" + Math.random()),
      addEventListener(){}, removeEventListener(){},
    },
    localStorage:{
      getItem:k => (k in stock ? stock[k] : null),
      setItem:(k, v) => { stock[k] = String(v); },
      removeItem:k => { delete stock[k]; },
    },
    requestAnimationFrame:() => 0,
    cancelAnimationFrame(){},
    devicePixelRatio:1,
    innerWidth:1280, innerHeight:720,
    location:{ search:"", hostname:"tests" },
    performance:{ now:() => Date.now() },
    addEventListener(){}, removeEventListener(){},
    Image:class{ constructor(){ this.naturalWidth = 0; this.naturalHeight = 0; } set src(v){ this._s = v; if (this.onerror) setTimeout(() => this.onerror(), 0); } get src(){ return this._s; } },
    console,
    setTimeout, clearTimeout, setInterval, clearInterval,
  };
}

let D = null;
try{
  const bac = decorDom();
  bac.globalThis = bac;
  bac.window = bac;
  const ctxVm = vm.createContext(bac);
  script.runInContext(ctxVm);
  D = bac.DTOUR;
  verifier("le script s'exécute hors navigateur", !!D);
}catch(e){
  ko("le script s'exécute hors navigateur", e.stack.split("\n").slice(0, 3).join("\n       "));
}

if (D){
  /* --- géométrie --- */
  titre("Géométrie");
  verifier("Thibaut est devant Pierre-François dans la file", D.PLACE_T < D.PLACE_PF);
  verifier("le point de salut est derrière les deux héros", D.X_SALUT > D.xPlace(D.PLACE_PF),
    "X_SALUT=" + D.X_SALUT + " place PF=" + D.xPlace(D.PLACE_PF));
  const dPF = D.X_SALUT - D.xPlace(D.PLACE_PF);
  const dT = D.X_SALUT - D.xPlace(D.PLACE_T);
  verifier("saluer Pierre-François est un geste court", dPF > 0.2 * D.H_PERSO && dPF < 0.8 * D.H_PERSO, "d=" + dPF);
  verifier("saluer Thibaut demande de tendre le bras plus loin", dT > dPF * 1.6, "dT=" + dT + " dPF=" + dPF);
  verifier("les places sont régulièrement espacées",
    D.xPlace(1) - D.xPlace(0) === D.PAS && D.xPlace(9) - D.xPlace(8) === D.PAS);

  /* --- courbe de difficulté --- */
  titre("Difficulté");
  D.Difficulte.raz();
  presque("temps de réaction au départ", D.Difficulte.reaction(), D.REACT_DEBUT, 1e-9);
  let precedent = D.Difficulte.reaction(), monotone = true;
  for (let i = 0; i < 400; i++){
    D.Difficulte.compter();
    const r = D.Difficulte.reaction();
    if (r > precedent + 1e-9) monotone = false;
    precedent = r;
  }
  verifier("le temps de réaction ne remonte jamais", monotone);
  presque("plancher de réaction respecté", D.Difficulte.reaction(), D.REACT_PLANCHER, 1e-9);
  verifier("le plancher est bien au-dessus de zéro", D.REACT_PLANCHER >= 0.5);

  D.Difficulte.raz();
  const d0 = D.Difficulte.delaiArrivee();
  verifier("le délai entre deux arrivées est positif", d0 > 0);
  for (let i = 0; i < 400; i++) D.Difficulte.compter();
  let pire = 0;
  for (let i = 0; i < 200; i++) pire = Math.max(pire, D.Difficulte.delaiArrivee());
  verifier("les arrivées se resserrent avec le temps", pire < 1.6, "pire délai tardif " + pire.toFixed(2));

  D.Difficulte.raz();
  egal("une seule demande à la fois au début", D.Difficulte.simultanees(), 1);
  for (let i = 0; i < 13; i++) D.Difficulte.compter();
  egal("deux demandes possibles à 13 saluts", D.Difficulte.simultanees(), 2);
  for (let i = 0; i < 20; i++) D.Difficulte.compter();
  egal("trois demandes possibles à 33 saluts", D.Difficulte.simultanees(), 3);

  D.Difficulte.raz();
  const tot = {}; for (let i = 0; i < 4000; i++){ const t = D.Difficulte.tirerType(); tot[t] = (tot[t] || 0) + 1; }
  verifier("au départ, seules les interactions simples et les passants sortent",
    Object.keys(tot).every(k => k === "SIMPLE" || k === "PASSANT"), Object.keys(tot).join(","));
  verifier("l'interaction simple reste largement majoritaire", (tot.SIMPLE || 0) / 4000 > 0.85);
  for (let i = 0; i < 40; i++) D.Difficulte.compter();
  const tard = {}; for (let i = 0; i < 4000; i++){ const t = D.Difficulte.tirerType(); tard[t] = (tard[t] || 0) + 1; }
  verifier("les événements absurdes finissent par apparaître", Object.keys(tard).length >= 6, Object.keys(tard).join(","));
  verifier("ils restent rares", (tard.SIMPLE || 0) / 4000 > 0.6, "part de SIMPLE " + ((tard.SIMPLE || 0) / 4000).toFixed(2));

  /* --- moments de la journée --- */
  titre("Jour, soir, nuit");
  const seuils = D.MOMENTS.map(m => m.seuil);
  verifier("les seuils sont croissants", seuils.every((s, i) => i === 0 || s > seuils[i - 1]), seuils.join(","));
  egal("on commence de jour", seuils[0], 0);
  verifier("chaque moment a son décor", D.MOMENTS.every(m => /^fond_/.test(m.fond)));

  /* --- score et combo --- */
  titre("Score et combo");
  D.Score.raz();
  egal("multiplicateur minimal à 1", D.Score.multiplicateur(), 1);
  const g1 = D.Score.reussir(1);
  egal("premier salut : 50 points", g1, 50);
  const g2 = D.Score.reussir(1);
  egal("deuxième salut : 100 points", g2, 100);
  egal("le combo a suivi", D.Score.combo, 2);
  D.Score.reussir(2);
  egal("le bonus de type est appliqué", D.Score.points, 50 + 100 + 300);
  const casse = D.Score.casser();
  egal("l'erreur renvoie le combo perdu", casse, 3);
  egal("le combo est remis à zéro", D.Score.combo, 0);
  egal("le meilleur combo est conservé", D.Score.meilleurCombo, 3);
  D.Score.noterFile(9); D.Score.noterFile(4);
  egal("la file maximale ne redescend pas", D.Score.fileMax, 9);
  egal("séparateur de milliers", D.chiffres(1234567), "1\u202F234\u202F567");
  egal("pas de séparateur sous mille", D.chiffres(999), "999");

  /* --- mise en place --- */
  titre("Mise en place de la file");
  D.Jeu.demarrer();
  egal("quatre personnes au départ", D.File.places.length, 4);
  egal("les deux premières sont des PNJ",
    [D.File.places[0].pnj !== undefined, D.File.places[1].pnj !== undefined], [true, true]);
  egal("Thibaut est à sa place", D.File.places[D.PLACE_T].heros, 0);
  egal("Pierre-François est à sa place", D.File.places[D.PLACE_PF].heros, 1);
  egal("le bandeau annonce quatre personnes", D.File.installees(), 4);
  egal("trois vies", D.Jeu.vies, D.VIES);
  egal("phase de jeu", D.Jeu.phase, "jeu");

  /* --- machine à états --- */
  titre("Machine à états du PNJ");
  const p = D.Foule.arriver("SIMPLE");
  egal("il entre par la gauche", p.etat, D.ETAT.ENTREE);
  verifier("il entre hors champ, à gauche", p.x < D.xPlace(0));
  verifier("une place lui est réservée", p.place >= 4);
  let tours = 0;
  while (p.etat === D.ETAT.ENTREE && tours++ < 4000) p.avancer(1 / 60);
  egal("il s'arrête pour saluer", p.etat, D.ETAT.DEMANDE);
  presque("il s'arrête au bon endroit", p.x, D.X_SALUT, 1);
  verifier("il vise un héros existant", p.cible === 0 || p.cible === 1);
  verifier("la demande est enregistrée", D.Jeu.demandes.includes(p));
  verifier("le chrono part du temps de réaction", p.chrono > 0 && p.chrono <= p.tReaction + 1e-9);

  /* le piège du joueur 0 : Thibaut porte l'indice 0, un test de vérité
     simple l'aurait sauté. On force la cible sur lui. */
  D.Jeu.demandes.length = 0;
  p.etat = D.ETAT.DEMANDE; p.cible = 0; p.chrono = 2; p.tReaction = 2;
  D.Jeu.demandes.push(p);
  const avant = D.Score.points, viesAvant = D.Jeu.vies;
  D.Jeu.saluer(0);
  egal("saluer Thibaut (indice 0) réussit", p.etat, D.ETAT.POIGNEE);
  verifier("le score a monté", D.Score.points > avant);
  egal("aucune vie perdue", D.Jeu.vies, viesAvant);
  egal("la demande est retirée", D.Jeu.demandes.length, 0);

  /* mauvais héros */
  const p2 = D.Foule.arriver("SIMPLE");
  p2.etat = D.ETAT.DEMANDE; p2.cible = 1; p2.chrono = 2; p2.tReaction = 2; p2.bras = 1;
  D.Jeu.demandes.push(p2);
  const combAvant = D.Score.combo, v2 = D.Jeu.vies;
  D.Jeu.saluer(0);
  verifier("le combo casse sur le mauvais héros", D.Score.combo === 0 && combAvant > 0);
  egal("une vie est perdue", D.Jeu.vies, v2 - 1);
  egal("le PNJ passe au malaise", p2.etat, D.ETAT.MALAISE);

  /* trop tard */
  const p3 = D.Foule.arriver("SIMPLE");
  p3.etat = D.ETAT.DEMANDE; p3.cible = 1; p3.tReaction = 0.5; p3.chrono = 0.5;
  D.Jeu.demandes.push(p3);
  const v3 = D.Jeu.vies;
  for (let i = 0; i < 60; i++) p3.avancer(1 / 60);
  egal("la main se retire toute seule", p3.etat, D.ETAT.MALAISE);
  egal("une vie est perdue au temps écoulé", D.Jeu.vies, v3 - 1);

  /* main tendue dans le vide */
  D.Jeu.demarrer();
  const v4 = D.Jeu.vies;
  D.Score.reussir(1); D.Score.reussir(1);
  D.Jeu.saluer(1);
  egal("saluer dans le vide ne coûte pas de vie", D.Jeu.vies, v4);
  egal("mais coûte le combo", D.Score.combo, 0);

  /* fin de partie */
  titre("Fin de partie");
  D.Jeu.demarrer();
  for (let i = 0; i < D.VIES; i++) D.Jeu.perdreVie();
  egal("trois erreurs terminent la partie", D.Jeu.phase, "fin");
  verifier("plus aucune demande en cours", D.Jeu.demandes.length === 0);
  D.Jeu.demarrer();
  egal("rejouer remet les vies", D.Jeu.vies, D.VIES);
  egal("rejouer remet le score", D.Score.points, 0);
  egal("rejouer remet la file", D.File.places.length, 4);

  /* --- caméra --- */
  titre("Caméra");
  D.Jeu.demarrer();
  D.Camera.mesurer(1280, 720, 1);
  D.Camera.recaler();
  const dansEcran = () => {
    const xT = D.Camera.ecran(D.xPlace(D.PLACE_T));
    const xS = D.Camera.ecran(D.X_SALUT);
    return xT > 0 && xS < D.Camera.L;
  };
  verifier("au départ, la zone de jeu est à l'écran", dansEcran());
  const z0 = D.Camera.z;
  D.File.gonfler(40);
  D.Camera.recaler();
  verifier("la caméra recule quand la file s'allonge", D.Camera.z < z0, "z " + z0 + " -> " + D.Camera.z);
  verifier("elle ne descend pas sous le plancher", D.Camera.z >= D.Z_MIN - 1e-9, "z=" + D.Camera.z);
  verifier("les deux héros et le point de salut restent à l'écran", dansEcran(),
    "xT=" + D.Camera.ecran(D.xPlace(D.PLACE_T)).toFixed(0) + " xS=" + D.Camera.ecran(D.X_SALUT).toFixed(0));
  verifier("les personnages restent lisibles", D.H_PERSO * D.Camera.ech > 48,
    (D.H_PERSO * D.Camera.ech).toFixed(0) + " px");
  /* et sur un iPhone en paysage */
  D.Camera.mesurer(844, 390, 3); D.Camera.recaler();
  verifier("idem sur iPhone en paysage", dansEcran() && D.H_PERSO * D.Camera.ech > 40,
    "h=" + (D.H_PERSO * D.Camera.ech).toFixed(0) + " px");
  D.Camera.mesurer(390, 844, 3); D.Camera.recaler();
  verifier("le portrait reste jouable", dansEcran(),
    "xT=" + D.Camera.ecran(D.xPlace(D.PLACE_T)).toFixed(0) + " xS=" + D.Camera.ecran(D.X_SALUT).toFixed(0));

  /* --- records --- */
  titre("Records");
  D.Jeu.demarrer();
  D.Score.points = 500; D.Score.meilleurCombo = 7;
  const r1 = (() => { try{ return JSON.parse(require("fs") && "null"); }catch(e){ return null; } })();
  void r1;

  /* ================= 4. simulation ================= */
  titre("Simulation de parties");
  let plantage = null, partiesFinies = 0, scoreMax = 0, fileMax = 0, salutsMax = 0;
  for (let partie = 0; partie < 12 && !plantage; partie++){
    try{
      D.Jeu.demarrer();
      D.Camera.mesurer(1280, 720, 1); D.Camera.recaler();
      /* un joueur artificiel : il répond juste la plupart du temps, et
         de plus en plus lentement à mesure que ça s'accélère */
      let trames = 0;
      while (D.Jeu.phase === "jeu" && trames++ < 60 * 60 * 6){
        D.Jeu.pas(1 / 60);
        const dem = D.Jeu.demandes[0];
        if (dem && dem.attente > dem.tReaction * 0.45){
          const juste = Math.random() < 0.93;
          D.Jeu.saluer(juste ? dem.cible : 1 - dem.cible);
        }
      }
      if (D.Jeu.phase === "fin") partiesFinies++;
      scoreMax = Math.max(scoreMax, D.Score.points);
      fileMax = Math.max(fileMax, D.Score.fileMax);
      salutsMax = Math.max(salutsMax, D.Score.saluts);
    }catch(e){
      plantage = e;
    }
  }
  verifier("aucune partie ne plante", !plantage, plantage && plantage.stack.split("\n").slice(0, 3).join("\n       "));
  verifier("les parties se terminent bien", partiesFinies >= 10, partiesFinies + "/12");
  verifier("la file grandit vraiment", fileMax >= 12, "file maximale observée " + fileMax);
  verifier("on atteint le soir", salutsMax >= D.MOMENTS[1].seuil, "saluts max " + salutsMax);
  verifier("le score reste dans un ordre de grandeur lisible", scoreMax > 500 && scoreMax < 5e6, "score max " + scoreMax);

  /* une partie sans jamais répondre : elle doit se terminer vite */
  D.Jeu.demarrer();
  let t2 = 0;
  while (D.Jeu.phase === "jeu" && t2++ < 60 * 90) D.Jeu.pas(1 / 60);
  verifier("ne rien faire termine la partie en moins d'une minute", D.Jeu.phase === "fin" && t2 < 60 * 60,
    (t2 / 60).toFixed(1) + " s");

  /* une partie parfaite : le combo doit monter haut sans rien casser */
  D.Jeu.demarrer();
  let t3 = 0;
  while (t3++ < 60 * 210){
    D.Jeu.pas(1 / 60);
    const dem = D.Jeu.demandes[0];
    if (dem) D.Jeu.saluer(dem.cible);
    if (D.Jeu.phase !== "jeu") break;
  }
  verifier("un jeu parfait ne perd aucune vie", D.Jeu.vies === D.VIES, "vies " + D.Jeu.vies);
  verifier("le combo monte au-delà de dix", D.Score.meilleurCombo > 10, "combo " + D.Score.meilleurCombo);
  verifier("on atteint la nuit", D.Score.saluts >= D.MOMENTS[2].seuil, "saluts " + D.Score.saluts);
}

/* ================= bilan ================= */
console.log("\n" + "\u2500".repeat(46));
console.log(reussis + " réussis, " + echecs + " échoué(s)");
process.exit(echecs ? 1 : 0);
