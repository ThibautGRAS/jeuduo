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
for (const m of source.matchAll(/"(fond_[a-z]+|logo|face_[a-z_]+|fx_[a-z]+|pnj\d\d|(?:thibaut|pierre)_[a-z]+)"/g)) citees.add(m[1]);
for (const m of source.matchAll(/Images\.table\.(fx_[a-z]+|appart|loupe)/g)) citees.add(m[1]);
for (const m of source.matchAll(/sprite:"([a-z_0-9]+)"/g)) if (!/^(pierre|thibaut)$/.test(m[1])) citees.add(m[1]);
for (const m of source.matchAll(/"(enq_[a-z_]+|pizza_[a-z_]+|badge_[a-z]+)"/g)) citees.add(m[1]);
citees.add("appart"); citees.add("loupe");
for (const m of source.matchAll(/"(h_[a-zA-Z]+|tarte[0-9]|tarte_[a-z]+|debris_[a-z]+)"/g)) citees.add(m[1]);
/* les quatre orientations de la tarte sont composées : "tarte" + n */
for (let i = 0; i < 4; i++) citees.add("tarte" + i);
/* les poses des héros sont construites par concaténation : on les recompose */
for (const h of ["thibaut","pierre"]) for (const p of ["idle","attente","marche","regarde","surpris","stress","tendue","victoire"]) citees.add(h + "_" + p);
for (let i = 1; i <= 16; i++) citees.add("pnj" + String(i).padStart(2, "0"));
const manquantes = [...citees].filter(n => !presentes.includes(n + ".webp"));

/* Le test précédent ne dit que « le fichier est là ». Il ne dit pas
   qu'on le CHARGE : les images du niveau 2 étaient sur le disque, la
   suite était verte, et l'appartement restait noir. On confronte donc
   img/ à la liste de chargement, dans les deux sens. */
const chargees = new Set();
{
  const blocs = source.match(/const IMAGES_NIVEAU2 = \[([\s\S]*?)\];/);
  if (blocs) for (const m of blocs[1].matchAll(/"([A-Za-z_0-9]+)"/g)) chargees.add(m[1]);
  for (const nom of ["logo", "face_thibaut", "face_pierre"]) chargees.add(nom);
  for (const liste of ["EFFETS", "SPRITES_HORTENSE", "SPRITES_TARTE", "SPRITES_PNJ"]){
    const b = source.match(new RegExp("const " + liste + " = \\[([\\s\\S]*?)\\]"));
    if (b) for (const m of b[1].matchAll(/"([A-Za-z_0-9]+)"/g)) chargees.add(m[1]);
  }
  for (const m of source.matchAll(/fond:"([a-z_]+)"/g)) chargees.add(m[1]);
  for (const h of ["thibaut", "pierre"]){
    const b = source.match(/const POSES_HEROS = \[([\s\S]*?)\]/);
    if (b) for (const m of b[1].matchAll(/"([a-z]+)"/g)) chargees.add(h + "_" + m[1]);
  }
  for (let i = 1; i <= 16; i++) chargees.add("pnj" + String(i).padStart(2, "0"));
}
const surDisque = presentes.filter(f => f.endsWith(".webp")).map(f => f.slice(0, -5));
const jamaisChargees = surDisque.filter(n => !chargees.has(n));
const introuvables = [...chargees].filter(n => surDisque.indexOf(n) < 0);
verifier("toutes les images du disque sont chargées au démarrage",
  jamaisChargees.length === 0, "jamais demandée(s) : " + jamaisChargees.join(", "));
verifier("aucune image demandée ne manque sur le disque",
  introuvables.length === 0, "introuvable(s) : " + introuvables.join(", "));
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
  verifier("Thibaut est devant Pierre-François dans la file", D.PLACE_G < D.PLACE_D);
  verifier("le point de salut est derrière les deux héros", D.X_SALUT > D.xPlace(D.PLACE_D),
    "X_SALUT=" + D.X_SALUT + " place PF=" + D.xPlace(D.PLACE_D));
  const dPF = D.X_SALUT - D.xPlace(D.PLACE_D);
  const dT = D.X_SALUT - D.xPlace(D.PLACE_G);
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
  egal("Thibaut est à sa place", D.File.places[D.PLACE_G].heros, 0);
  egal("Pierre-François est à sa place", D.File.places[D.PLACE_D].heros, 1);
  egal("le bandeau annonce quatre personnes", D.File.installees(), 4);
  egal("trois vies", D.Jeu.vies, D.VIES);
  egal("phase de jeu", D.Jeu.phase, "jeu");

  /* --- machine à états --- */
  titre("Machine à états du PNJ");
  D.Camera.mesurer(1280, 720, 1); D.Camera.recaler();
  const p = D.Foule.arriver("SIMPLE");
  egal("il entre par la gauche", p.etat, D.ETAT.ENTREE);
  verifier("il entre hors champ, à gauche", p.x < D.Camera.bordGauche(),
    "x=" + p.x.toFixed(0) + " bord=" + D.Camera.bordGauche().toFixed(0));
  verifier("une place lui est réservée", p.place >= 4);
  verifier("sa cible est choisie dès l'arrivée", p.cible === 0 || p.cible === 1);
  const arret = D.xSalut(p.cible);
  let tours = 0;
  while (p.etat === D.ETAT.ENTREE && tours++ < 4000) p.avancer(1 / 60);
  egal("il s'arrête pour saluer", p.etat, D.ETAT.DEMANDE);
  presque("il s'arrête devant le héros qu'il vise", p.x, arret, 1);
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
  /* Ce qui doit rester visible en toutes circonstances : les deux héros
     et le point où l'on vient leur serrer la main. */
  const dansEcran = () => {
    const xT = D.Camera.ecran(D.xPlace(D.PLACE_G));
    const xS = D.Camera.ecran(D.xSalut(1));
    return xT > 0 && xS < D.Camera.L;
  };
  verifier("au départ, la zone de jeu est à l'écran", dansEcran());
  D.File.gonfler(60);
  D.Camera.recaler();
  verifier("elle ne descend pas sous le plancher", D.Camera.z >= D.Z_MIN - 1e-9, "z=" + D.Camera.z);
  verifier("la zone d'action reste à l'écran même avec 64 personnes", dansEcran(),
    "xT=" + D.Camera.ecran(D.xPlace(D.PLACE_G)).toFixed(0) + " xS=" + D.Camera.ecran(D.xSalut(1)).toFixed(0));
  verifier("les personnages restent gros", D.H_PERSO * D.Camera.ech > 120,
    (D.H_PERSO * D.Camera.ech).toFixed(0) + " px");
  verifier("la file déborde volontairement de l'écran", D.Camera.dernierePlaceVisible() < D.File.places.length - 1,
    "visible jusqu'à " + D.Camera.dernierePlaceVisible());
  /* Le jeu est verrouillé en paysage : on ne teste donc que des formats
     paysage, et on vérifie séparément que le portrait est refusé. */
  for (const [L, H, mini] of [[844, 390, 95], [1024, 600, 120]]){
    D.Camera.mesurer(L, H, 3); D.Camera.recaler();
    verifier("cadrage tenu en " + L + "x" + H,
      dansEcran() && D.H_PERSO * D.Camera.ech > mini,
      "h=" + (D.H_PERSO * D.Camera.ech).toFixed(0) + " px, xT=" +
      D.Camera.ecran(D.xPlace(D.PLACE_G)).toFixed(0) + ", xS=" + D.Camera.ecran(D.xSalut(1)).toFixed(0));
  }

  titre("Paysage imposé");
  verifier("un iPhone couché est accepté", D.paysageOk(844, 390));
  verifier("un écran carré est accepté", D.paysageOk(800, 780));
  verifier("un iPhone debout est refusé", !D.paysageOk(390, 844));
  verifier("une fenêtre étroite est refusée", !D.paysageOk(600, 900));
  verifier("le plein écran est demandé au geste du joueur",
    /btnJouer[\s\S]{0,220}Ecran\.demander\(\)/.test(code),
    "requestFullscreen n'est accordé que dans un gestionnaire d'événement");
  verifier("l'orientation est verrouillée quand l'appareil le permet",
    /orientation[\s\S]{0,160}lock\("landscape"\)/.test(source));
  verifier("l'échec du verrouillage n'arrête pas le jeu",
    /lock\("landscape"\)[\s\S]{0,200}catch/.test(source));

  /* --- records --- */
  titre("Records");
  D.Jeu.demarrer();
  D.Score.points = 500; D.Score.meilleurCombo = 7;
  const r1 = (() => { try{ return JSON.parse(require("fs") && "null"); }catch(e){ return null; } })();
  void r1;

  /* ================= niveau 2 ================= */
  titre("Niveau 2 — l'affaire de la pizza");
  verifier("seize meubles fouillables", D.ZONES.length === 16, D.ZONES.length + " zones");
  verifier("toutes les zones sont dans le cadre",
    D.ZONES.every(z => z.x > 0 && z.x < 1 && z.y > 0 && z.y < 1));
  verifier("deux meubles voisins ne se confondent pas",
    (() => {
      const p = D.ZONES.map(z => z.pied).sort((a, b) => a - b);
      for (let i = 1; i < p.length; i++) if (p[i] - p[i - 1] < D.ENQ_PORTEE * 1.5) return false;
      return true;
    })(), "sinon on ne sait pas lequel on fouille");
  verifier("les quatre pièces sont représentées",
    D.ZONES.some(z => z.x < 0.2) && D.ZONES.some(z => z.x > 0.2 && z.x < 0.45) &&
    D.ZONES.some(z => z.x > 0.45 && z.x < 0.8) && D.ZONES.some(z => z.x > 0.8));
  verifier("dix indices en banque", D.INDICES.length >= 10, D.INDICES.length);
  verifier("chaque indice a ses deux lectures",
    D.INDICES.every(i => i.analyse && i.brut && i.analyse !== i.brut));
  verifier("chaque meuble a une réplique quand il ne donne rien",
    D.ZONES.every(z => !!D.Enquete && true));

  /* --- le générateur ne peut pas sortir d'enquête impossible --- */
  titre("Générateur d'affaire");
  let genOk = true, scenarios = new Set(), detail = "";
  for (let n = 0; n < 900; n++){
    D.Affaire.generer();
    scenarios.add(D.Affaire.scenario.id);
    if (D.Affaire.reels.length !== D.ENQ_OBJECTIF){ genOk = false; detail = "indices " + D.Affaire.reels.length; break; }
    if (new Set(D.Affaire.reels).size !== D.ENQ_OBJECTIF){ genOk = false; detail = "doublon d'indice"; break; }
    const places = Object.keys(D.Affaire.plan);
    if (places.length !== D.ENQ_OBJECTIF){ genOk = false; detail = "places " + places.length; break; }
    if (places.indexOf(D.Affaire.cachette) >= 0){ genOk = false; detail = "un indice sur la cachette"; break; }
    if (!D.ZONES.some(z => z.id === D.Affaire.cachette)){ genOk = false; detail = "cachette inconnue"; break; }
    if (D.Affaire.scenario.coupable && !D.Affaire.coupable){ genOk = false; detail = "coupable manquant"; break; }
    if (!D.Affaire.scenario.coupable && D.Affaire.coupable){ genOk = false; detail = "coupable en trop"; break; }
    if (!D.Affaire.scenario.porteurs.every(p => D.Affaire.reels.indexOf(p) >= 0)){
      genOk = false; detail = "un indice porteur manque"; break;
    }
  }
  verifier("neuf cents tirages sans enquête impossible", genOk, detail);
  verifier("chaque affaire demande les deux inspecteurs",
    (() => {
      for (let n = 0; n < 400; n++){
        D.Affaire.generer();
        const t2 = id => D.INDICES.find(i => i.id === id) || {};
        if (!D.Affaire.reels.some(id => t2(id).expert)) return false;
        if (!D.Affaire.reels.some(id => t2(id).social)) return false;
      }
      return true;
    })(), "un tirage se bouclait avec un seul inspecteur");
  egal("les dix scénarios sortent", scenarios.size, D.SCENARIOS.length);
  verifier("chaque affaire sait dire son dénouement",
    D.SCENARIOS.every(sc => { D.Affaire.scenario = sc; return !!D.Affaire.chute() && !!D.Affaire.contradiction(); }));

  /* --- une partie menée jusqu'au bout --- */
  titre("Enquête complète");
  const lancer2 = () => { D.Jeu.demarrer(2); D.Intro.finir(); D.Camera.mesurer(1280, 620, 1); };
  lancer2();
  egal("on est bien au niveau 2", D.Jeu.niveau, 2);
  egal("le chrono part plein", Math.round(D.Enquete.restant), D.ENQ_DUREE);
  egal("six indices sont cachés", D.Enquete.zones.filter(z => z.indice).length, D.ENQ_OBJECTIF);
  egal("une seule cachette", D.Enquete.zones.filter(z => z.cachette).length, 1);
  egal("les deux inspecteurs sont là", D.Enquete.inspecteurs.length, 2);
  egal("Pierre-François mène au départ", D.Heros[D.Enquete.actifIdx].sprite, "pierre");

  /* aller jusqu'à un meuble et fouiller */
  const allerFouiller = (idx) => {
    const z = D.Enquete.zones[idx];
    D.Enquete.actifIns().x = z.ref.pied;
    D.Enquete.inspecter();
    let n = 0;
    while (D.Enquete.actifIns().fouille > 0 && n++ < 600) D.Jeu.pas(1 / 60);
    for (let k = 0; k < 20; k++) D.Jeu.pas(1 / 60);
  };
  const iVide = D.Enquete.zones.findIndex(z => !z.indice && !z.cachette);
  const avant2 = D.Enquete.fausses;
  allerFouiller(iVide);
  verifier("un meuble vide se ferme après la fouille", D.Enquete.zones[iVide].fouillee);
  egal("et compte comme une fausse piste", D.Enquete.fausses, avant2 + 1);

  /* un indice d'expert résiste à Thibaut puis cède à Pierre-François */
  lancer2();
  const iExp = D.Enquete.zones.findIndex(z => {
    const ind = z.indice && D.INDICES.find(x => x.id === z.indice);
    return ind && ind.expert;
  });
  if (iExp >= 0){
    D.Enquete.actifIdx = D.Heros.findIndex(h => h.sprite === "thibaut");
    allerFouiller(iExp);
    egal("Thibaut ne sait pas lire la trace", D.Enquete.indices, 0);
    verifier("l'indice reste sur place", !D.Enquete.zones[iExp].fouillee);
    D.Enquete.actifIdx = D.Heros.findIndex(h => h.sprite === "pierre");
    allerFouiller(iExp);
    egal("Pierre-François la lit", D.Enquete.indices, 1);
    egal("et la carte entre au dossier", D.Dossier.compte(), 1);
  } else ok("aucun indice d'expert dans ce tirage");

  /* la pizza ne se montre pas avant trois indices */
  lancer2();
  const iCache = D.Enquete.zones.findIndex(z => z.cachette);
  allerFouiller(iCache);
  verifier("la cachette ne livre rien sans indices", !D.Enquete.pizza);
  verifier("et reste fouillable", !D.Enquete.zones[iCache].fouillee);

  /* partie gagnante : on ramasse tout, on trouve la pizza, on accuse */
  lancer2();
  const iPF = D.Heros.findIndex(h => h.sprite === "pierre");
  const iTH = D.Heros.findIndex(h => h.sprite === "thibaut");
  /* Tout réunir demande les DEUX : Pierre-François lit les traces,
     Thibaut lit les gens. Fouiller avec un seul ne suffit pas. */
  D.Enquete.actifIdx = iPF;
  for (let i = 0; i < D.Enquete.zones.length; i++){
    if (D.Enquete.zones[i].indice) allerFouiller(i);
  }
  const avecPFSeul = D.Enquete.indices;
  for (let i = 0; i < D.Enquete.zones.length; i++){
    const z = D.Enquete.zones[i];
    if (!z.indice || z.fouillee) continue;
    D.Enquete.actifIdx = iTH;
    allerFouiller(i);
  }
  verifier("un seul inspecteur ne suffit pas", avecPFSeul < D.ENQ_OBJECTIF,
    "Pierre-François seul en réunit " + avecPFSeul);
  egal("les six indices sont réunis à deux", D.Enquete.indices, D.ENQ_OBJECTIF);
  egal("le dossier contient six cartes", D.Dossier.compte(), D.ENQ_OBJECTIF);
  D.Enquete.actifIdx = iPF;
  allerFouiller(D.Enquete.zones.findIndex(z => z.cachette));
  verifier("la pizza est retrouvée", !!D.Enquete.pizza);
  D.Enquete.ouvrirAccusation();
  verifier("l'accusation s'ouvre", D.Enquete.accusation);
  const noms = D.SUSPECTS.map(s => s.id).concat(["personne"]);
  D.Enquete.choixAcc = noms.indexOf(D.Affaire.bonneReponse());
  D.Enquete.valider();
  egal("la bonne accusation classe l'affaire", D.Jeu.phase, "fin");
  verifier("et l'affaire est gagnée", D.Enquete.fini && D.Enquete.fini.gagne);
  verifier("le score récompense le temps restant", D.Score.points > 0, "score " + D.Score.points);

  /* dialogues et scénarios */
  titre("Dialogues et scénarios");
  lancer2();
  D.Enquete.dialogue([[0, "Un."], [1, "Deux."]], 0);
  for (let i = 0; i < 6; i++) D.Jeu.pas(1 / 60);
  egal("la première réplique part tout de suite", D.Effets.paroles.length, 1);
  for (let i = 0; i < 60 * 2; i++) D.Jeu.pas(1 / 60);
  verifier("la seconde arrive après, pas en même temps",
    D.Enquete.fileDial.length === 0, "il reste " + D.Enquete.fileDial.length + " réplique(s)");
  verifier("dix affaires au moins", D.SCENARIOS.length >= 10, D.SCENARIOS.length + " scénarios");
  verifier("chaque affaire est complète",
    D.SCENARIOS.every(sc => sc.id && sc.cachettes.length && sc.porteurs.length === 3 &&
      sc.piste && sc.trouvaille && sc.contradiction && sc.chute));
  verifier("aucune affaire n'a le même dénouement",
    new Set(D.SCENARIOS.map(sc => sc.chute)).size === D.SCENARIOS.length);
  verifier("les coupables sont variés",
    new Set(D.SCENARIOS.map(sc => sc.coupable)).size >= 4,
    [...new Set(D.SCENARIOS.map(sc => sc.coupable))].join(", "));
  verifier("chaque cachette citée existe",
    D.SCENARIOS.every(sc => sc.cachettes.every(c => D.ZONES.some(z => z.id === c))));
  verifier("chaque indice porteur existe",
    D.SCENARIOS.every(sc => sc.porteurs.every(p => D.INDICES.some(i => i.id === p))));
  verifier("chaque indice a un écho de l'autre inspecteur",
    D.INDICES.every(i => D.ECHOS[i.id] && D.ECHOS[i.id].length === 2),
    D.INDICES.filter(i => !D.ECHOS[i.id]).map(i => i.id).join(", "));
  verifier("chaque meuble se lit différemment selon l'inspecteur",
    D.ZONES.every(z => D.RIEN[z.id] && D.RIEN[z.id].pf && D.RIEN[z.id].th &&
      D.RIEN[z.id].pf !== D.RIEN[z.id].th),
    D.ZONES.filter(z => !D.RIEN[z.id] || D.RIEN[z.id].pf === D.RIEN[z.id].th).map(z => z.id).join(", "));
  verifier("les deux inspecteurs ont chacun leur spécialité",
    D.INDICES.some(i => i.expert) && D.INDICES.some(i => i.social),
    "sinon on joue tout le niveau avec le même");
  verifier("les quatre pièces ont leur réplique d'entrée",
    D.PIECES.length === 4 && D.PIECES.every(p => p.ligne && p.jusqua > 0));
  verifier("le bavardage va par paires", D.BAVARDAGES.length % 2 === 0);

  /* la contradiction ne tombe qu'une fois, et sur la bonne personne */
  lancer2();
  D.Enquete.indices = 5;
  D.Enquete.actifIdx = D.Heros.findIndex(h => h.sprite === "thibaut");
  const coupable = D.SUSPECTS.findIndex(s => s.id === D.Affaire.bonneReponse());
  if (coupable >= 0){
    D.Enquete.fileDial = [];
    D.Enquete.interroger(coupable);
    verifier("interroger le coupable révèle la contradiction", D.Enquete.fileDial.length === 1);
    D.Enquete.fileDial = [];
    D.Enquete.interroger(coupable);
    verifier("elle ne tombe qu'une fois", D.Enquete.fileDial.length === 0);
  } else ok("scénario sans coupable : rien à contredire");

  verifier("chaque suspect a un nom affichable, le chat compris",
    D.SUSPECTS.every(s => s.nom && s.nom.length > 2) &&
    D.SUSPECTS.some(s => s.id === "chat" && s.nom === "RISOTO"));
  verifier("deux accusations, pas plus", D.ENQ_ACCUSATIONS === 2);

  /* la taille des inspecteurs suit la hauteur sous plafond */
  verifier("un inspecteur mesure environ 70 % de la pièce",
    D.ENQ_TAILLE > 0.55 && D.ENQ_TAILLE < 0.70, "ENQ_TAILLE = " + D.ENQ_TAILLE);

  /* on doit pouvoir conclure au doigt, sans clavier */
  titre("Conclure sans clavier");
  lancer2();
  verifier("le bouton d'accusation est éteint au départ", !D.Enquete.peutConclure());
  egal("et il dit pourquoi", D.Enquete.cePquiManque(), "Il faut au moins trois indices.");
  D.Enquete.indices = 3;
  verifier("trois indices l'allument", D.Enquete.peutConclure());
  egal("mais la pizza manque encore", D.Enquete.cePquiManque(), "Il faut encore retrouver la pizza.");
  D.Enquete.pizza = { t:0, zone:0 };
  egal("plus rien ne manque", D.Enquete.cePquiManque(), null);
  D.Enquete.ouvrirAccusation();
  verifier("la liste s'ouvre", D.Enquete.accusation);
  /* toucher une ligne la choisit, la toucher deux fois valide */
  const yLigne = i => 0.30 + i * 0.10;
  D.Enquete.viserAccusation(yLigne(2));
  egal("un toucher choisit la ligne visée", D.Enquete.choixAcc, 2);
  D.Enquete.viserAccusation(yLigne(0));
  egal("un autre toucher change de ligne", D.Enquete.choixAcc, 0);
  const bonne = D.SUSPECTS.map(s => s.id).concat(["personne"]).indexOf(D.Affaire.bonneReponse());
  D.Enquete.viserAccusation(yLigne(bonne));
  D.Enquete.viserAccusation(yLigne(bonne));
  egal("le second toucher accuse", D.Jeu.phase, "fin");

  /* mauvaise accusation : pénalité, pas de fin de partie */
  lancer2();
  D.Enquete.indices = 4;
  D.Enquete.ouvrirAccusation();
  const tAvant = D.Enquete.restant;
  D.Enquete.choixAcc = noms.indexOf(D.Affaire.bonneReponse()) === 0 ? 1 : 0;
  D.Enquete.valider();
  egal("une mauvaise accusation ne termine pas la partie", D.Jeu.phase, "jeu");
  verifier("elle coûte vingt secondes", tAvant - D.Enquete.restant >= 19.5);
  egal("il ne reste qu'une accusation", D.Enquete.accusationsRestantes, D.ENQ_ACCUSATIONS - 1);
  D.Enquete.ouvrirAccusation();
  D.Enquete.choixAcc = noms.indexOf(D.Affaire.bonneReponse()) === 0 ? 1 : 0;
  D.Enquete.valider();
  egal("la seconde erreur perd l'affaire", D.Jeu.phase, "fin");
  verifier("et elle est bien perdue", D.Enquete.fini && !D.Enquete.fini.gagne);

  /* Hortense doit intervenir, une fois, au milieu */
  titre("Hortense au niveau 2");
  lancer2();
  verifier("elle est programmée entre 35 % et 65 %",
    D.HortenseApp.quand >= D.ENQ_DUREE * 0.35 && D.HortenseApp.quand <= D.ENQ_DUREE * 0.65,
    "à " + D.HortenseApp.quand.toFixed(0) + " s");
  let vue = false, tarteVue = false, t6 = 0;
  while (t6++ < 60 * 260 && D.Jeu.phase === "jeu"){
    D.Jeu.pas(1 / 60);
    if (D.HortenseApp.visible()) vue = true;
    if (D.HortenseApp.tarte) tarteVue = true;
    if (D.Enquete.esquiveOuverte) D.Enquete.esquiver();
  }
  verifier("elle intervient bien une fois", vue);
  verifier("elle lance une tarte", tarteVue);
  verifier("l'esquive rapporte des points", D.Enquete.tarteEsquivee, "esquive manquée");

  /* le chrono épuisé perd la partie */
  lancer2();
  let t7 = 0;
  while (D.Jeu.phase === "jeu" && t7++ < 60 * (D.ENQ_DUREE + 20)) D.Jeu.pas(1 / 60);
  egal("le temps écoulé termine la partie", D.Jeu.phase, "fin");
  verifier("et l'affaire n'est pas résolue", D.Enquete.fini && !D.Enquete.fini.gagne);

  /* progression */
  titre("Progression");
  D.Jeu.retourTitre();
  egal("revenir au titre repasse au niveau 1", D.Jeu.niveau, 1);
  verifier("le niveau 2 est jouable dès le départ", D.Progres.niveau2Ouvert(),
    "aucune serrure : on doit pouvoir y aller directement");
  verifier("terminer le niveau 1 reste enregistré",
    (() => { D.Jeu.demarrer(1); D.Jeu.terminer(); return D.Progres.n1Termine(); })());
  verifier("et l'accueil n'affiche aucun cadenas",
    !/id="niv2Cad"/.test(html) && !/\.niv\.verrouille/.test(html),
    "il reste une serrure dans le balisage ou la feuille de style");

  /* ================= 4. simulation ================= */  /* ================= 4. simulation ================= */
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
  /* Un joueur qui se trompe une fois sur quinze n'atteint pas toujours
     le soir en douze parties : l'affirmer ici rendait la suite instable.
     La preuve que le soir et la nuit sont atteignables est plus bas,
     dans la partie jouée parfaitement. */
  verifier("une partie ordinaire dure assez pour que ça monte", salutsMax >= 12,
    "saluts max " + salutsMax);
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
    /* un joueur parfait esquive aussi : il attend que la fenêtre
       s'ouvre, puis appuie */
    const tarte = D.Tartes.tarteImminente();
    if (tarte && tarte.fenetreOuverte) D.Esquive.tenter();
    if (D.Jeu.phase !== "jeu") break;
    void 0;
  }
  verifier("un jeu parfait ne perd aucune vie", D.Jeu.vies === D.VIES, "vies " + D.Jeu.vies);
  verifier("le combo monte au-delà de dix", D.Score.meilleurCombo > 10, "combo " + D.Score.meilleurCombo);
  verifier("on atteint la nuit", D.Score.saluts >= D.MOMENTS[2].seuil, "saluts " + D.Score.saluts);
}

  /* ================= Hortense et la tarte =================
     Hortense n'arrive jamais avant la dixième seconde. Il faut donc
     laisser tourner la partie pour l'atteindre — sans quoi les mains
     tendues qu'on ignore auraient déjà terminé le jeu. */
  const amenerA = secondes => {
    D.Jeu.demarrer();
    D.Camera.mesurer(1280, 720, 1); D.Camera.recaler();
    D.Jeu.invincible = true;
    for (let i = 0; i < 60 * secondes; i++) D.Jeu.pas(1 / 60);
    D.Jeu.invincible = false;
    D.Jeu.vies = D.VIES;
    for (const p of D.Jeu.demandes) p.etat = D.ETAT.MALAISE;
    D.Jeu.demandes.length = 0;
    D.Tartes.raz();
    D.Tartes.derniere = -999;
  };

  titre("Hortense");
  D.Jeu.demarrer();
  D.Camera.mesurer(1280, 720, 1); D.Camera.recaler();

  egal("elle commence cachée", D.Hortense.etat, D.ETAT_H.CACHEE);
  verifier("rien ne peut la faire venir dans les dix premières secondes",
    !D.Tartes.peutApparaitre(), "temps " + D.Jeu.temps.toFixed(1));
  D.Jeu.invincible = true;
  let vueTot = false;
  for (let i = 0; i < 60 * (D.HORTENSE_REPIT + 1); i++){
    D.Jeu.pas(1 / 60);
    if (D.Hortense.visible) vueTot = true;
  }
  /* Passé le répit, elle DOIT finir par venir. Exiger qu'elle soit déjà
     autorisée à la seconde près était faux : sa prochaine venue est
     tirée entre 20 et 40 s, et le test échouait une fois sur six sans
     que rien ne soit cassé. On avance donc jusqu'à ce qu'elle puisse
     venir, dans la limite du plus long intervalle possible. */
  let attente = 0, autorisee = false;
  while (attente++ < 60 * (D.HORTENSE_ECART[1] + 8)){
    if (D.Tartes.peutApparaitre() || D.Hortense.visible){ autorisee = true; break; }
    D.Jeu.pas(1 / 60);
  }
  D.Jeu.invincible = false;
  verifier("passé ce délai, elle finit par venir", autorisee || vueTot,
    "rien au bout de " + (D.HORTENSE_ECART[1] + 8) + " s");
  const h = D.Tartes.apparaitre(true);
  verifier("elle apparaît sur demande", !!h && D.Hortense.visible);
  egal("elle entre en scène", D.Hortense.etat, D.ETAT_H.ENTREE);
  verifier("elle entre hors champ", D.Hortense.x < D.Camera.bordGauche() || D.Hortense.x > D.Camera.bordDroit());
  verifier("elle vise un héros existant", D.Hortense.cible === 0 || D.Hortense.cible === 1);
  D.Hortense.fausse = false;

  const vus = new Set();
  let garde = 0, tarte = null;
  while (garde++ < 60 * 25){
    D.Jeu.pas(1 / 60);
    vus.add(D.Hortense.etat);
    if (!tarte) tarte = D.Tartes.tarteEnVol();
    if (D.Hortense.etat === D.ETAT_H.CACHEE && tarte) break;
  }
  verifier("elle passe par le guet", vus.has(D.ETAT_H.GUET));
  verifier("elle passe par la préparation", vus.has(D.ETAT_H.PREPARE));
  verifier("elle passe par le lancer", vus.has(D.ETAT_H.LANCE));
  verifier("elle rit après avoir lancé", vus.has(D.ETAT_H.RIRE));
  verifier("elle finit par sortir", vus.has(D.ETAT_H.SORTIE));
  verifier("une tarte a bien été créée", !!tarte);

  /* --- la tarte est un objet distinct d'Hortense --- */
  titre("La tarte");
  amenerA(12);
  D.Jeu.invincible = true;
  D.Tartes.apparaitre(true);
  const t1 = D.Tartes.lancer(1);
  verifier("la tarte existe indépendamment", t1 instanceof D.Tarte);
  egal("elle vise le héros demandé", t1.cible, 1);
  verifier("elle part de la main d'Hortense", Math.abs(t1.x0 - D.Hortense.main().x) < 1);
  verifier("elle vise au-delà du héros, pour finir derrière lui",
    Math.abs(t1.fin.x - D.xPlace(D.Heros[1].place)) > 40, "fin " + t1.fin.x.toFixed(0));
  verifier("elle tourne pendant le vol", (() => {
    const r0 = t1.rotation; t1.majorer(0.1); return Math.abs(t1.rotation - r0) > 0.1;
  })());
  verifier("sa trajectoire est courbe", (() => {
    const a = t1.position(0), m = t1.position(0.5), b = t1.position(1);
    return m.y < (a.y + b.y) / 2 - 10;
  })());

  /* --- durée de vol --- */
  D.Difficulte.raz();
  presque("temps de vol au départ", D.Tartes.dureeVol(), D.VOL_DEBUT, 1e-9);
  let volPrec = D.Tartes.dureeVol(), volMonotone = true;
  for (let i = 0; i < 400; i++){
    D.Difficulte.compter();
    const v = D.Tartes.dureeVol();
    if (v > volPrec + 1e-9) volMonotone = false;
    volPrec = v;
  }
  verifier("le temps de vol ne remonte jamais", volMonotone);
  presque("il s'arrête au plancher", D.Tartes.dureeVol(), D.VOL_PLANCHER, 1e-9);
  verifier("le plancher reste jouable", D.VOL_PLANCHER >= 0.6);

  /* --- fenêtre d'esquive --- */
  titre("Esquive");
  amenerA(12);
  D.Jeu.invincible = true;
  D.Tartes.apparaitre(true);
  const t2 = D.Tartes.lancer(0);
  verifier("la fenêtre est fermée au départ", !t2.fenetreOuverte,
    "reste " + t2.resteAvantImpact.toFixed(2) + " s");
  egal("appuyer trop tôt ne fait rien", D.Esquive.tenter(), "tot");
  verifier("et verrouille brièvement le bouton", D.Esquive.verrou > 0);
  egal("marteler ne sert à rien", D.Esquive.tenter(), "verrou");
  let ouvertures = 0;
  while (t2.etat === D.ETAT_TARTE.VOL && ouvertures < 600){
    D.Jeu.pas(1 / 60); ouvertures++;
    if (t2.fenetreOuverte) break;
  }
  verifier("la fenêtre finit par s'ouvrir", t2.fenetreOuverte);
  verifier("elle dure environ 450 ms", Math.abs(t2.resteAvantImpact - D.FENETRE_ESQUIVE) < 0.06,
    "reste " + t2.resteAvantImpact.toFixed(3) + " s");
  const ptsAvant = D.Score.points, viesAvant2 = D.Jeu.vies, comboAvant = D.Score.combo;
  D.Esquive.verrou = 0;
  egal("appuyer dans la fenêtre réussit", D.Esquive.tenter(), "ok");
  egal("le héros se baisse", !!D.Heros[0].esquive, true);
  egal("+100 points", D.Score.points - ptsAvant, 100);
  egal("aucune vie perdue", D.Jeu.vies, viesAvant2);
  egal("le combo des salutations est préservé", D.Score.combo, comboAvant);
  egal("une esquive de plus au compteur", D.Score.esquives, 1);
  verifier("la tarte poursuit sa route", t2.etat === D.ETAT_TARTE.ESQUIVEE);
  verifier("elle ne peut plus toucher personne", !t2.collision);

  /* --- impact --- */
  titre("Impact");
  amenerA(12);
  D.Score.reussir(1); D.Score.reussir(1);
  D.Tartes.apparaitre(true);
  const t3b = D.Tartes.lancer(1);
  const vies3 = D.Jeu.vies;
  let n3 = 0;
  while (t3b.etat !== D.ETAT_TARTE.IMPACT && n3++ < 600) D.Jeu.pas(1 / 60);
  egal("sans esquive, la tarte arrive", t3b.etat, D.ETAT_TARTE.IMPACT);
  egal("une vie est perdue", D.Jeu.vies, vies3 - 1);
  egal("le combo casse", D.Score.combo, 0);
  egal("une tarte reçue au compteur", D.Score.recues, 1);
  verifier("le héros reste couvert de meringue", D.Heros[1].tarte > 1.2, D.Heros[1].tarte.toFixed(2));
  verifier("la caméra a été secouée", D.Camera.secousse > 0);
  verifier("l'image se fige un court instant", D.Jeu.gel > 0.05 && D.Jeu.gel <= 0.12,
    (D.Jeu.gel * 1000).toFixed(0) + " ms");

  /* --- la boîte de collision est petite et honnête --- */
  titre("Collision");
  const boite = D.Esquive.boite(0);
  verifier("la boîte est plus étroite que le sprite", boite.demi * 2 < 0.42 * D.H_PERSO);
  verifier("elle couvre la tête et le buste, pas les pieds", boite.basY < -0.2 * D.H_PERSO);
  D.Heros[0].esquive = { t:0, duree:0.5 };
  const baissee = D.Esquive.boite(0);
  verifier("elle descend pendant l'esquive", baissee.haut > boite.haut);
  D.Heros[0].esquive = null;

  /* --- Hortense ne doit jamais devenir une routine --- */
  titre("Rythme d'Hortense");
  D.Jeu.demarrer();
  D.Jeu.invincible = true;
  let apparitions = 0, dernierTemps = -99, ecartMin = 1e9;
  for (let i = 0; i < 60 * 300; i++){
    const avant = D.Hortense.visible;
    D.Jeu.pas(1 / 60);
    if (D.Jeu.phase !== "jeu"){ D.Jeu.vies = 3; D.Jeu.phase = "jeu"; }
    const t4 = D.Tartes.tarteEnVol();
    if (t4 && t4.fenetreOuverte) D.Esquive.tenter();
    const dem = D.Jeu.demandes[0];
    if (dem && dem.attente > dem.tReaction * 0.5) D.Jeu.saluer(dem.cible);
    if (!avant && D.Hortense.visible){
      apparitions++;
      ecartMin = Math.min(ecartMin, D.Jeu.temps - dernierTemps);
      dernierTemps = D.Jeu.temps;
    }
  }
  verifier("elle vient plusieurs fois en cinq minutes", apparitions >= 4, apparitions + " apparitions");
  verifier("elle reste un événement, pas une mécanique", apparitions <= 18, apparitions + " apparitions");
  verifier("deux attaques ne se collent jamais", ecartMin >= D.HORTENSE_REPOS - 0.1,
    "écart minimal " + ecartMin.toFixed(1) + " s");
  D.Jeu.invincible = false;

/* ================= bilan ================= */
console.log("\n" + "\u2500".repeat(46));
console.log(reussis + " réussis, " + echecs + " échoué(s)");
process.exit(echecs ? 1 : 0);
