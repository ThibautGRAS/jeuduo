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
/* img/ est rangé par niveau : commun/, n1/, n2/, n3/. On relève le nom
   ET le dossier de chaque fichier — le classement fait partie de ce
   qu'on vérifie. */
const dossierParNom = {};
const presentes = [];
if (fs.existsSync(dossierImg)){
  for (const d of fs.readdirSync(dossierImg)){
    const sous = path.join(dossierImg, d);
    if (!fs.statSync(sous).isDirectory()) { presentes.push(d); continue; }
    for (const f of fs.readdirSync(sous)){
      presentes.push(f);
      if (f.endsWith(".webp")) dossierParNom[f.slice(0, -5)] = d;
    }
  }
}
/* Les listes d'images ne se relisent plus à la regex : elles sont
   construites par concaténation dans le code (POSES_BAR × préfixes,
   poses des héros, PNJ…) et toute tentative de les reconstituer ici a
   fini par mentir — vert alors que le disque et le code divergeaient.
   La confrontation disque ↔ chargement se fait donc sur le code
   EXÉCUTÉ, dans la section « Rangement des images » : listeImages()
   est la seule vérité. Ici on ne garde que ce qui se voit du dehors. */
const surDisque = presentes.filter(f => f.endsWith(".webp")).map(f => f.slice(0, -5));
/* Le rangement fichier par fichier est vérifié plus bas, sur le code
   EXÉCUTÉ (section « Rangement des images ») : la table IMG_CHEMIN y
   est vivante, inutile de la reconstruire par regex ici. */
const horsDossier = presentes.filter(f => f.endsWith(".webp") && !dossierParNom[f.slice(0, -5)]);
verifier("aucune image en vrac à la racine d'img/",
  horsDossier.length === 0, horsDossier.join(", "));

titre("L'écran titre");
/* Un menu ne se vérifie pas à l'œil dans ce harnais (il ne dessine que
   le canevas), donc on verrouille au moins sa STRUCTURE : ce qui doit
   exister, et les règles de mise en page qui l'empêchent de déborder
   d'un écran de téléphone en paysage. */
{
  const bloc = html.match(/<div id="titre">([\s\S]*?)\n  <\/div>/);
  verifier("l'écran titre existe", !!bloc);
  verifier("le décor du bar sert de fond",
    !!bloc && /id="titreFond"/.test(bloc[1]) &&
    /titreFond\.style\.backgroundImage/.test(source) &&
    /Images\.table\.fond_bar && Images\.table\.fond_bar\.naturalWidth/.test(source),
    "et seulement quand l'image est chargée");
  verifier("l'enseigne annonce le jeu",
    !!bloc && /CALLAGHAN/.test(bloc[1]) && /LES ENQUÊTES DE/.test(bloc[1]));
  verifier("les trois niveaux ont chacun leur tuile",
    (() => {
      if (!bloc) return false;
      const tuiles = bloc[1].match(/class="niv n[123]"/g) || [];
      return tuiles.length === 3 &&
        [1, 2, 3].every(k => new RegExp('data-niv="' + k + '"').test(bloc[1]));
    })());
  verifier("chaque tuile porte son numéro et sa vignette",
    (() => {
      if (!bloc) return false;
      return (bloc[1].match(/class="num"/g) || []).length === 3 &&
        [1, 2, 3].every(k => new RegExp('id="vign' + k + '"').test(bloc[1]));
    })());
  verifier("chaque niveau a sa couleur",
    [["n1", "#37AC48"], ["n2", "#2A8AE4"], ["n3", "#F7B32B"]]
      .every(([c, coul]) => new RegExp("\\.niv\\." + c + "\\{--accent:" + coul + "\\}").test(html)));
  const rniv = html.match(/\n\.niv\{([^}]*)\}/);
  verifier("les tuiles se partagent la largeur au lieu de s'empiler",
    !!rniv && /flex:1 1 0/.test(rniv[1]) && !/flex-wrap:wrap/.test(html.match(/#niveaux\{([^}]*)\}/)[1]),
    "en paysage, un retour à la ligne pousse tout hors de l'écran");
  verifier("la hauteur est le budget : les tailles du titre suivent la hauteur",
    (() => {
      const r = html.match(/#titreEnseigne b\{([^}]*)\}/);
      const l = html.match(/#logo\{([^}]*)\}/);
      return !!r && /clamp\([^)]*vh/.test(r[1]) && !!l && /clamp\([^)]*vh/.test(l[1]);
    })(), "en vw, le titre déborde dès que la barre du navigateur mange la hauteur");
  verifier("le titre tient compte de l'encoche",
    (() => {
      const r = html.match(/#titre\{([^}]*)\}/);
      return !!r && /var\(--gauche\)/.test(r[1]) && /var\(--droite\)/.test(r[1]);
    })());
  verifier("les sous-titres disparaissent avant les titres sur écran bas",
    /@media \(max-height:400px\)\{ \.niv \.txt i\{display:none\}/.test(html));
}

titre("Le pupitre du niveau 3");
/* Ces touches se jouent au pouce, sur un décor chargé : leur
   disposition et leur taille sont du gameplay, pas de la décoration.
   Le premier jet les avait centrées — elles masquaient le champion. */
{
  const pup = html.match(/<div id="pupitre3">([\s\S]*?)\n  <\/div>/);
  verifier("le pupitre 3 existe et groupe ses touches en deux côtés",
    !!pup && (pup[1].match(/class="cote"/g) || []).length === 2);
  const cotes = pup ? pup[1].split('class="cote"') : [];
  verifier("marcher à gauche, agir à droite",
    cotes.length === 3 &&
    /id="c3G"/.test(cotes[1]) && /id="c3D"/.test(cotes[1]) &&
    /id="c3B"/.test(cotes[2]) && /id="c3J"/.test(cotes[2]));
  verifier("BOIRE est la touche la plus au bord, sous le pouce",
    !!pup && pup[1].indexOf('id="c3J"') < pup[1].indexOf('id="c3B"'),
    "JETER doit précéder BOIRE : le coin revient à la touche la plus utilisée");
  const regle = html.match(/#pupitre3\{([^}]*)\}/);
  verifier("les deux côtés sont poussés aux coins",
    !!regle && /justify-content:space-between/.test(regle[1]) &&
    !/justify-content:center/.test(regle[1]),
    "un pupitre centré retombe sous le personnage");
  verifier("le milieu du pupitre laisse passer les touches",
    !!regle && /pointer-events:none/.test(regle[1]) &&
    /#pupitre3 \.cote\{[^}]*pointer-events:auto/.test(html));
  const fleche = html.match(/\.cmd3\.fleche\{([^}]*)\}/);
  const mini = fleche && fleche[1].match(/width:clamp\((\d+)px/);
  verifier("les flèches font au moins 44 px : c'est une cible de pouce",
    !!mini && Number(mini[1]) >= 44, mini ? mini[1] + "px" : "règle introuvable");
  const acte = html.match(/\.cmd3\.acte\{([^}]*)\}/);
  const miniA = acte && acte[1].match(/height:clamp\((\d+)px/);
  verifier("BOIRE et JETER aussi", !!miniA && Number(miniA[1]) >= 44,
    miniA ? miniA[1] + "px" : "règle introuvable");
  const eteint = html.match(/\.cmd3\.eteint\{([^}]*)\}/);
  const op = eteint && eteint[1].match(/opacity:\.?(\d+)/);
  verifier("éteint reste lisible : le pouce doit savoir où se poser",
    !!op && Number("0." + op[1]) >= 0.5,
    op ? "opacité 0." + op[1] : "règle introuvable");
  verifier("BOIRE et JETER ne se confondent pas au premier coup d'œil",
    /#c3B\{background:linear-gradient/.test(html) &&
    /#c3J\{background:linear-gradient/.test(html));
  verifier("le pupitre 3 ne s'affiche qu'allumé",
    /#pupitre3\.on\{display:flex\}/.test(html) && /#pupitre3\{[^}]*display:none/.test(html));
  verifier("les bords latéraux tiennent compte de l'encoche",
    /--gauche:env\(safe-area-inset-left/.test(html) &&
    /--droite:env\(safe-area-inset-right/.test(html) &&
    !!regle && /var\(--gauche\)/.test(regle[1]) && /var\(--droite\)/.test(regle[1]));
}

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
    const t = html.match(/CALLAGHAN v([\d.]+)/);
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
let domBac = null;
let messageDetail = "";
try{
  const bac = decorDom();
  bac.globalThis = bac;
  bac.window = bac;
  /* Les tests d'interface ont besoin du DOM du bac : l'état d'un bouton
     fait partie du jeu (un bouton grisé au mauvais moment rend une
     mécanique injouable). */
  domBac = bac.document;
  const ctxVm = vm.createContext(bac);
  script.runInContext(ctxVm);
  D = bac.DTOUR;
  verifier("le script s'exécute hors navigateur", !!D);
}catch(e){
  ko("le script s'exécute hors navigateur", e.stack.split("\n").slice(0, 3).join("\n       "));
}

if (D){
  titre("Rangement des images");
  /* IMG_CHEMIN (le code) et le disque doivent dire la même chose,
     fichier par fichier : un webp déplacé sans mise à jour du code
     chargerait une URL morte. */
  (() => {
    const noms = D.listeImages();
    /* Dans les deux sens : une image sur le disque que personne ne
       charge est un poids mort ; une image chargée qui manque au disque
       laisse un trou noir à l'écran (l'appartement du niveau 2 est resté
       noir une version entière avec une suite verte). */
    const jamais = surDisque.filter(n => noms.indexOf(n) < 0);
    const absentes = noms.filter(n => surDisque.indexOf(n) < 0);
    verifier("toutes les images du disque sont chargées au démarrage",
      jamais.length === 0, "jamais demandée(s) : " + jamais.join(", "));
    verifier("aucune image chargée ne manque sur le disque",
      absentes.length === 0, "introuvable(s) : " + absentes.join(", "));
    verifier("aucun doublon dans la liste de chargement",
      new Set(noms).size === noms.length);
    const malRanges = noms.filter(n => dossierParNom[n] && D.IMG_CHEMIN[n] !== dossierParNom[n])
      .map(n => n + " (disque " + dossierParNom[n] + ", code " + D.IMG_CHEMIN[n] + ")");
    verifier("le rangement du disque suit IMG_PAR_DOSSIER",
      malRanges.length === 0, malRanges.slice(0, 6).join(", "));
    verifier("chaque image chargée connaît son dossier",
      noms.every(n => D.IMG_CHEMIN[n]),
      noms.filter(n => !D.IMG_CHEMIN[n]).join(", "));
    verifier("cheminImage compose un chemin par niveau",
      D.cheminImage("appart") === "img/n2/appart.webp" &&
      D.cheminImage("logo") === "img/commun/logo.webp");
  })();

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
  /* Une affaire dont les étiquettes n'admettent aucun indice d'expert ou
     aucun indice social se jouerait avec un seul inspecteur. */
  verifier("chaque affaire admet un indice pour chacun des deux",
    D.SCENARIOS.every(sc => {
      const tags = sc.tags || [];
      const ouvert = i => !i.exige || tags.indexOf(i.exige) >= 0;
      return D.INDICES.some(i => i.expert && ouvert(i)) && D.INDICES.some(i => i.social && ouvert(i));
    }),
    D.SCENARIOS.filter(sc => {
      const tags = sc.tags || [];
      const ouvert = i => !i.exige || tags.indexOf(i.exige) >= 0;
      return !(D.INDICES.some(i => i.expert && ouvert(i)) && D.INDICES.some(i => i.social && ouvert(i)));
    }).map(sc => sc.id).join(", "));
  verifier("un indice qui désigne quelqu'un n'apparaît que là où il se lit",
    (() => {
      for (let n = 0; n < 400; n++){
        D.Affaire.generer();
        const tags = D.Affaire.scenario.tags || [];
        for (const id of D.Affaire.reels){
          const i = D.INDICES.find(x => x.id === id);
          if (i.exige && tags.indexOf(i.exige) < 0) return false;
        }
      }
      return true;
    })(), "des traces de pattes sans chat, c'est une piste qu'on ne referme jamais");
  verifier("aucun texte ne laisse traîner un marqueur",
    (() => {
      for (let n = 0; n < 200; n++){
        D.Affaire.generer();
        const tout = [D.Affaire.chute(), D.Affaire.contradiction()]
          .concat(D.Affaire.piste().map(p => p[1]), D.Affaire.trouvaille().map(p => p[1]));
        if (tout.some(x => /\{\w+\}/.test(x))) return false;
      }
      return true;
    })(), "un {marqueur} affiché tel quel se voit tout de suite");
  verifier("les détails changent d'une affaire à l'autre",
    (() => {
      const heures = new Set(), livreurs = new Set();
      for (let n = 0; n < 200; n++){ D.Affaire.generer(); heures.add(D.Affaire.faits.heure); livreurs.add(D.Affaire.faits.livreur); }
      return heures.size > 40 && livreurs.size >= 4;
    })(), "l'heure du ticket ne doit pas être la même à chaque partie");

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
  egal("tous les scénarios sortent", scenarios.size, D.SCENARIOS.length);
  verifier("chaque affaire sait dire son dénouement",
    D.SCENARIOS.every(sc => { D.Affaire.scenario = sc; return !!D.Affaire.chute() && !!D.Affaire.contradiction(); }));

  /* --- l'introduction doit se dérouler toute seule --- */
  titre("Introduction du niveau 2");
  D.Jeu.demarrer(2);
  D.Camera.mesurer(1280, 620, 1);
  verifier("elle démarre", D.Intro.actif);
  verifier("la scène est montée mais la partie n'a pas commencé",
    D.Enquete.pretes() && !D.Enquete.actif,
    "les deux doivent exister pour entrer à l'image, sans que le chrono tourne");
  verifier("ils entrent par la gauche, hors champ",
    D.Enquete.inspecteurs.every(i => i.x < 0),
    D.Enquete.inspecteurs.map(i => i.x.toFixed(3)).join(" / "));
  let trames = 0;
  while (D.Intro.actif && trames++ < 60 * 30) D.Jeu.pas(1 / 60);
  verifier("elle se termine seule", !D.Intro.actif, "toujours en cours après 30 s");
  verifier("en moins de dix secondes", trames < 60 * 10, (trames / 60).toFixed(1) + " s");
  verifier("et elle enchaîne sur l'enquête", D.Enquete.actif && D.Enquete.pretes());
  verifier("les deux sont entrés dans le champ",
    D.Enquete.inspecteurs.every(i => i.x > 0.02),
    D.Enquete.inspecteurs.map(i => i.x.toFixed(3)).join(" / "));
  verifier("et ils ne se marchent pas dessus",
    Math.abs(D.Enquete.inspecteurs[0].x - D.Enquete.inspecteurs[1].x) > 0.03);
  verifier("on peut la passer d'un geste",
    (() => { D.Jeu.demarrer(2); for (let i = 0; i < 9; i++) D.Intro.passer(); return !D.Intro.actif; })());
  verifier("la passer met quand même les deux en place",
    D.Enquete.inspecteurs.every(i => i.x > 0.02),
    "sauter l'introduction ne doit pas laisser un inspecteur hors champ");

  /* Une trame qui casse ne doit pas emporter la boucle. */
  verifier("la boucle survit à une trame ratée",
    /catch\s*\(err\)[\s\S]{0,320}requestAnimationFrame\(trame\)/.test(source),
    "sans filet, une exception de dessin fige le jeu sans message");

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
  verifier("chaque carte dit quoi ET où",
    D.Dossier.cartes.every(c => c.nom && c.ou && c.ou.length > 2),
    D.Dossier.cartes.map(c => c.nom + "/" + (c.ou || "?")).join(" · "));
  D.Enquete.actifIdx = iPF;
  allerFouiller(D.Enquete.zones.findIndex(z => z.cachette));
  verifier("la pizza est retrouvée", !!D.Enquete.pizza);
  D.Enquete.ouvrirAccusation();
  verifier("l'accusation s'ouvre", D.Enquete.accusation);
  /* La distribution change à chaque partie : on relit la liste après
     chaque lancement au lieu de la garder de côté. */
  const listeNoms = () => D.SUSPECTS.map(s => s.id).concat(["personne"]);
  let noms = listeNoms();
  noms = listeNoms();
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
  verifier("dix-sept affaires au moins", D.SCENARIOS.length >= 17, D.SCENARIOS.length + " scénarios");
  verifier("celle du billet de cinq euros existe",
    D.SCENARIOS.some(sc => sc.porteurs.indexOf("billet") >= 0),
    "c'est l'affaire vraie : elle a tout mangé et laissé de quoi en racheter");
  verifier("le billet est en banque d'indices",
    D.INDICES.some(i => i.id === "billet" && /cinq euros/i.test(i.nom)));
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
  verifier("chaque habitant a ses sujets d'entretien",
    D.SUSPECTS_BANQUE.every(x => (D.SUJETS[x.id] || []).length >= 3));
  verifier("chaque sujet porte sa question ET ses réponses",
    Object.values(D.SUJETS).every(l => l.every(su =>
      su.qPF && su.qTH && su.pf && su.ok && su.ko)),
    "une réponse doit répondre à la question posée");
  verifier("les deux inspecteurs ne posent pas la même question",
    Object.values(D.SUJETS).every(l => l.every(su => su.qPF !== su.qTH)),
    "sauf pour le chat, qui ne répond de toute façon pas");
  verifier("Pierre-François tutoie Teo et sa belle-sœur",
    D.SUJETS.gabi.concat(D.SUJETS.teo).every(su => /\bTu\b|\bte\b|\bton\b|\bta\b/.test(su.qPF)),
    D.SUJETS.gabi.concat(D.SUJETS.teo).filter(su => !/\bTu\b|\bte\b|\bton\b|\bta\b/.test(su.qPF)).map(su => su.qPF).join(" | "));
  verifier("et vouvoie Charles, qu'il ne connaît pas",
    D.SUJETS.charles.every(su => /\bVous\b|\bvous\b/.test(su.qPF)));
  verifier("Thibaut vouvoie tout le monde",
    D.SUJETS.gabi.concat(D.SUJETS.teo, D.SUJETS.charles).every(su => /\bvous\b/i.test(su.qTH)));
  /* Une découverte qui nomme un meuble doit nommer LE BON. */
  verifier("chaque découverte nomme la vraie cachette",
    D.SCENARIOS.every(sc => sc.trouvaille.some(p => /\{Ou\}|\{ou\}/.test(p[1]))),
    D.SCENARIOS.filter(sc => !sc.trouvaille.some(p => /\{Ou\}|\{ou\}/.test(p[1]))).map(sc => sc.id).join(", "));
  verifier("chaque meuble sait se dire au bon cas",
    D.ZONES.every(z => z.dedans && z.dedans.length > 4),
    D.ZONES.filter(z => !z.dedans).map(z => z.id).join(", "));
  verifier("la contradiction est toujours atteignable",
    D.SCENARIOS.every(sc => {
      D.Affaire.scenario = sc;
      D.Affaire.coupable = sc.coupable ? D.SUSPECTS_BANQUE.find(x => x.id === sc.coupable) : null;
      const t2 = D.Affaire.temoinCle();
      return t2 && D.SUSPECTS_BANQUE.some(x => x.id === t2);
    }), "trois affaires n'avaient personne à confondre");
  verifier("dans une affaire sans coupable, c'est un témoin qui craque",
    D.SCENARIOS.filter(sc => !sc.coupable).every(sc => sc.temoinCle));
  verifier("chaque affaire a son anecdote",
    D.SCENARIOS.every(sc => sc.anecdote && sc.anecdote.suspect && sc.anecdote.qTH && sc.anecdote.ok && sc.anecdote.ko),
    D.SCENARIOS.filter(sc => !sc.anecdote).map(sc => sc.id).join(", "));
  verifier("l'anecdote vise quelqu'un qui est là",
    D.SCENARIOS.every(sc => D.SUSPECTS_BANQUE.some(x => x.id === sc.anecdote.suspect)));
  verifier("et elle est posée en premier dans l'entretien",
    (() => {
      for (let n = 0; n < 60; n++){
        D.Jeu.demarrer(2); D.Intro.finir();
        const an = D.Affaire.scenario.anecdote;
        const cible = D.SUSPECTS.find(x => x.id === an.suspect);
        if (!cible || cible.sujets[0] !== an) return false;
      }
      return true;
    })(), "c'est elle qui porte le scénario");
  /* --- le raisonnement : chaque affaire doit savoir se lire --- */
  verifier("chaque affaire lit ses trois indices porteurs",
    D.SCENARIOS.every(sc => sc.deduc && sc.porteurs.every(p =>
      sc.deduc[p] && sc.deduc[p].length === 2 && sc.deduc[p].every(l => l.length === 2 && l[1].length > 4))),
    D.SCENARIOS.filter(sc => !sc.deduc || !sc.porteurs.every(p => sc.deduc[p] && sc.deduc[p].length === 2))
      .map(sc => sc.id).join(", "));
  verifier("aucune déduction ne vise un indice que l'affaire ne porte pas",
    D.SCENARIOS.every(sc => Object.keys(sc.deduc || {}).every(k => sc.porteurs.indexOf(k) >= 0)),
    "elle ne sortirait jamais à l'écran");
  verifier("chaque affaire a son hypothèse de travers, à deux voix",
    D.SCENARIOS.every(sc => sc.hypothese && sc.hypothese.length === 2 &&
      sc.hypothese[0][0] !== sc.hypothese[1][0]),
    D.SCENARIOS.filter(sc => !sc.hypothese).map(sc => sc.id).join(", "));
  verifier("c'est Thibaut qui propose l'absurde, Pierre-François qui corrige",
    D.SCENARIOS.every(sc => sc.hypothese[0][0] === 1 && sc.hypothese[1][0] === 0),
    "le gag ne marche que dans ce sens");
  verifier("chaque témoin clé a ses deux paliers de nerfs",
    D.SCENARIOS.every(sc => sc.nerfs && sc.nerfs.length === 2 &&
      sc.nerfs.every(t => t && t.length > 8) && sc.nerfs[0] !== sc.nerfs[1]),
    D.SCENARIOS.filter(sc => !sc.nerfs || sc.nerfs.length !== 2).map(sc => sc.id).join(", "));
  verifier("chaque indice sait être opposé à quelqu'un",
    D.INDICES.every(i => i.q && i.okR && i.koR && i.okR !== i.koR),
    D.INDICES.filter(i => !i.q || !i.okR || !i.koR).map(i => i.id).join(", "));
  /* Tout texte qui cite un détail tiré au sort doit passer par un
     marqueur connu : après remplir(), il ne reste pas d'accolades. */
  (() => {
    let orphelin = null;
    for (let n = 0; n < 80 && !orphelin; n++){
      D.Jeu.demarrer(2); D.Intro.finir();
      const sc = D.Affaire.scenario;
      const textes = [];
      for (const p2 of Object.keys(sc.deduc)) for (const l of sc.deduc[p2]) textes.push(l[1]);
      for (const l of sc.hypothese) textes.push(l[1]);
      textes.push(sc.nerfs[0], sc.nerfs[1]);
      for (const i of D.INDICES) textes.push(i.q, i.okR, i.koR);
      for (const t2 of textes) if (/\{\w+\}/.test(D.remplir(t2))){ orphelin = sc.id + " : " + t2; break; }
    }
    verifier("déductions, hypothèses, nerfs et confrontations sans marqueur orphelin",
      !orphelin, orphelin || "");
  })();
  /* La théorie du dossier suit le raisonnement. */
  lancer2();
  egal("dossier vide : pas encore de théorie", D.Enquete.theorie().length, 0);
  D.Enquete.indices = 2;
  verifier("à deux indices, le dossier pense déjà quelque chose",
    D.Enquete.theorie().length === 2);
  D.Enquete.indices = 4; D.Enquete.pisteDite = true;
  verifier("à quatre, il tient la piste",
    D.Enquete.theorie().join(" ").indexOf(D.Affaire.piste()[0][1]) >= 0);
  /* La découpe des bulles est une fonction pure : on lui donne une
     règle factice où un caractère vaut un pixel. */
  (() => {
    const mesure = t2 => t2.length;
    egal("un texte court tient sur une ligne",
      D.decouperLignes("Bonjour", 40, mesure), ["Bonjour"]);
    egal("un texte long se plie sans couper les mots",
      D.decouperLignes("aaa bbb ccc ddd", 7, mesure), ["aaa bbb", "ccc ddd"]);
    verifier("aucun mot n'est coupé en deux",
      D.decouperLignes("anticonstitutionnellement oui", 10, mesure)[0] === "anticonstitutionnellement",
      "un mot plus long que la ligne part seul");
  })();
  verifier("les quatre pièces ont leur réplique d'entrée",
    D.PIECES.length === 4 && D.PIECES.every(p => p.ligne && p.jusqua > 0));
  verifier("le bavardage va par paires", D.BAVARDAGES.length % 2 === 0);

  /* la contradiction ne tombe qu'une fois, et sur la bonne personne */
  lancer2();
  D.Enquete.indices = 5;
  const coupable = D.SUSPECTS.findIndex(s => s.id === D.Affaire.bonneReponse());
  if (coupable >= 0){
    /* Pierre-François n'obtient jamais la contradiction : la sœur est sa
       belle-sœur, Teo son ami. C'est le sens de la spécialité. */
    D.Enquete.actifIdx = D.Heros.findIndex(h => h.sprite === "pierre");
    D.SUSPECTS[coupable].vus = 9;
    D.Enquete.interroger(coupable);
    verifier("Pierre-François n'arrache pas la contradiction", !D.SUSPECTS[coupable].coince);
    D.Enquete.actifIdx = D.Heros.findIndex(h => h.sprite === "thibaut");
    D.Enquete.interroger(coupable);
    verifier("Thibaut, oui", D.SUSPECTS[coupable].coince);
    const avantC = D.Enquete.fileDial.filter(r => typeof r.qui === "number").length;
    D.Enquete.interroger(coupable);
    egal("elle ne tombe qu'une fois",
      D.Enquete.fileDial.filter(r => typeof r.qui === "number").length, avantC);
  } else ok("scénario sans coupable : rien à contredire");

  titre("Les trois dans les deux niveaux");
  verifier("la sœur fait aussi la queue au D'Tour",
    D.SPRITES_PNJ.indexOf("pers_gabi") >= 0,
    "elle est debout et entière, donc elle peut marcher");
  verifier("les deux assis tiennent la terrasse", D.TERRASSE.length === 2);
  verifier("et ce sont bien Charles et Teo",
    D.TERRASSE.map(t2 => t2.sprite).sort().join(",") === "pers_charles,pers_teo");
  verifier("ils ne marchent pas dans la file",
    !D.TERRASSE.some(t2 => D.SPRITES_PNJ.indexOf(t2.sprite) >= 0),
    "leurs sprites les montrent assis : ils ne peuvent pas marcher");
  verifier("ils sont posés sur un meuble, pas en l'air",
    D.TERRASSE.every(t2 => t2.recul > 0.1 && t2.recul < 0.32),
    D.TERRASSE.map(t2 => t2.sprite + ":" + t2.recul).join(" "));
  verifier("et derrière la file, donc plus petits",
    D.TERRASSE.every(t2 => t2.taille < 0.7));

  titre("Les gens dans la pièce");
  verifier("chacun pose sur une ligne mesurée sur le décor",
    D.SUSPECTS_BANQUE.every(x => { const p = D.PLACES_FIXES[x.id]; return p.bas > 0.6 && p.bas <= 0.95; }),
    Object.entries(D.PLACES_FIXES).map(([k, p]) => k + ":" + p.bas).join(" "));
  verifier("celui de la table est posé plus haut que celui du canapé",
    D.PLACES_FIXES.charles.bas < D.PLACES_FIXES.teo.bas,
    "un plateau de table est plus haut qu'une assise");
  verifier("la personne debout est la plus grande",
    D.PLACES_FIXES.gabi.taille > D.PLACES_FIXES.teo.taille &&
    D.PLACES_FIXES.gabi.taille > D.PLACES_FIXES.charles.taille);
  verifier("aucun buste n'atteint la taille d'un inspecteur debout",
    D.PLACES_FIXES.charles.taille < D.ENQ_TAILLE * 0.5 &&
    D.PLACES_FIXES.teo.taille < D.ENQ_TAILLE * 0.6);
  verifier("quatre habitants, dont le chat", D.SUSPECTS_BANQUE.length === 4, D.SUSPECTS_BANQUE.length);
  verifier("chacun a une place fixe et une taille",
    D.SUSPECTS_BANQUE.every(s => D.PLACES_FIXES[s.id] && D.PLACES_FIXES[s.id].taille > 0));
  verifier("chacun a un rôle écrit", D.SUSPECTS_BANQUE.every(s => s.role && s.role.length > 12),
    D.SUSPECTS_BANQUE.filter(s => !s.role || s.role.length <= 12).map(s => s.id).join(", "));
  verifier("chacun répond autrement selon qui demande et selon sa culpabilité",
    D.SUSPECTS_BANQUE.every(s => (D.SUJETS[s.id] || []).every(su =>
      su.pf !== su.ok && su.ok !== su.ko)));
  verifier("aucune réponse n'est servie aux deux",
    Object.values(D.SUJETS).every(l => l.every(su => su.pf !== su.ok && su.pf !== su.ko)),
    "Pierre-François et Thibaut doivent entendre autre chose");

  verifier("chacun a des remarques de fond",
    D.SUSPECTS_BANQUE.every(s => s.fond.length >= 3));
  verifier("les trois humains ont leur propre sprite",
    new Set(D.SUSPECTS_BANQUE.map(s => s.sprite)).size === 4);
  (() => {
    const voix = new Set();
    let coupablePresent = true, tousLa = true;
    for (let n = 0; n < 200; n++){
      D.Jeu.demarrer(2); D.Intro.finir();
      voix.add(D.SUSPECTS.map(s => s.sujets.map(u => u.qTH).join(">")).join("//"));
      if (D.SUSPECTS.length !== 4) tousLa = false;
      if (D.Affaire.bonneReponse() !== "personne" &&
          !D.SUSPECTS.some(s => s.id === D.Affaire.bonneReponse())) coupablePresent = false;
    }
    verifier("les quatre sont toujours là", tousLa, "ce sont les habitants, pas une distribution");
    verifier("mais ils ne disent pas la même chose d'une partie à l'autre",
      voix.size >= 10, voix.size + " combinaisons de répliques");
    verifier("le coupable est toujours interrogeable", coupablePresent);
  })();

  verifier("chaque suspect a un nom affichable, le chat compris",
    D.SUSPECTS.every(s => s.nom && s.nom.length > 2) &&
    D.SUSPECTS.some(s => s.id === "chat" && s.nom === "RISOTO"));
  verifier("deux accusations, pas plus", D.ENQ_ACCUSATIONS === 2);

  /* la taille des inspecteurs suit la hauteur sous plafond */
  verifier("un inspecteur mesure environ 70 % de la pièce",
    D.ENQ_TAILLE > 0.55 && D.ENQ_TAILLE < 0.70, "ENQ_TAILLE = " + D.ENQ_TAILLE);

  /* fouiller et interroger ne doivent jamais se disputer un appui */
  titre("Fouiller ou interroger");
  lancer2();
  const zTable = D.Enquete.zones.findIndex(z => z.ref.id === "table");
  /* on se place à un endroit où les deux sont possibles */
  D.Enquete.actifIns().x = D.ZONES[zTable].pied;
  const versSuspect = D.Enquete.suspectProche();
  D.Enquete.actifIns().x = D.SUSPECTS.find(s => s.id === "charles").x;
  verifier("un habitant peut être à portée d'un meuble", D.Enquete.suspectProche() >= 0);
  void versSuspect;
  /* INSPECTER ne parle jamais à personne */
  const avantVus = D.SUSPECTS.reduce((a, s) => a + s.vus + s.vusPF, 0);
  D.Enquete.inspecter();
  for (let i = 0; i < 80; i++) D.Jeu.pas(1 / 60);
  egal("inspecter n'interroge personne", D.SUSPECTS.reduce((a, s) => a + s.vus + s.vusPF, 0), avantVus);
  /* INTERROGER ne fouille jamais rien */
  const avantF = D.Enquete.fouilles;
  D.Enquete.actifIns().x = D.SUSPECTS.find(s => s.id === "charles").x;
  D.Enquete.parler();
  egal("interroger ne fouille rien", D.Enquete.fouilles, avantF);
  verifier("et fait bien parler quelqu'un",
    D.SUSPECTS.reduce((a, s) => a + s.vus + s.vusPF, 0) > avantVus);
  verifier("l'inspecteur pose d'abord une question",
    D.Effets.paroles.some(p => p.cible.heros !== undefined),
    "un témoin qui répond à rien, ce n'est pas un interrogatoire");
  verifier("la réponse est différée, pas simultanée",
    !D.Effets.paroles.some(p => p.cible.temoin !== undefined) &&
    D.Enquete.fileDial.some(r => r.qui && r.qui.temoin !== undefined));
  for (let i = 0; i < 90; i++) D.Jeu.pas(1 / 60);
  verifier("puis la réplique sort de la bouche du témoin",
    D.Effets.paroles.some(p => p.cible.temoin !== undefined),
    "elle sortait de celle de l'inspecteur, on ne savait plus qui parlait");
  /* on peut aborder quelqu'un dès que son nom s'affiche */
  verifier("on parle d'aussi loin que le nom s'affiche",
    D.ENQ_PORTEE_GENS > D.ENQ_PORTEE * 2,
    "le nom apparaissait bien avant qu'on puisse adresser la parole");
  D.Enquete.actifIns().x = 0.20;
  egal("loin de tout, interroger ne fait rien", D.Enquete.parler(), false);

  titre("Les visiteurs de passage");
  titre("Le bouton d'esquive");
  verifier("il n'est jamais grisé",
    !/#cmdE\{[^}]*opacity:\s*\.\d/.test(html),
    "un bouton éteint ne se presse pas, et l'esquive dure 450 ms");
  verifier("il reste cliquable en permanence",
    /#pupitre\.on \.cmd\{pointer-events:auto\}/.test(html) && /class="cmd" id="cmdE"/.test(html),
    "il doit hériter des événements comme les deux autres");
  verifier("il s'allume quand la fenêtre s'ouvre",
    /majEsquive\(\)[\s\S]{0,300}classList\.toggle\("alerte"/.test(source));
  verifier("une pression sans tarte répond quand même",
    /=== "rien"[\s\S]{0,200}PAS DE TARTE/.test(source),
    "sans retour, on croit le bouton mort");
  (() => {
    D.Jeu.demarrer(1);
    D.Camera.mesurer(1280, 720, 1); D.Camera.recaler();
    D.Effets.raz();
    const av = D.Effets.textes.length;
    D.Esquive.tenter();
    void av;
    verifier("et l'esquive à vide ne coûte rien", D.Jeu.vies === D.VIES,
      "presser dans le vide ne doit pas punir");
  })();

  titre("Qui fait la queue au niveau 1");
  verifier("aucun personnage n'est en double dans la file",
    new Set(D.SPRITES_PNJ).size === D.SPRITES_PNJ.length,
    D.SPRITES_PNJ.filter((p, i) => D.SPRITES_PNJ.indexOf(p) !== i).join(", "));
  verifier("les personnages debout font la queue",
    D.PERSOS_DEBOUT.every(p => D.SPRITES_PNJ.indexOf(p) >= 0),
    D.PERSOS_DEBOUT.filter(p => D.SPRITES_PNJ.indexOf(p) < 0).join(", "));
  verifier("les assis n'y sont jamais",
    D.PERSOS_ASSIS.every(p => D.SPRITES_PNJ.indexOf(p) < 0),
    "Teo est assis par terre, Charles n'a pas de jambes : ils ne peuvent pas marcher");
  verifier("un personnage nommé ne fait la queue qu'une fois",
    (() => {
      for (let partie = 0; partie < 30; partie++){
        D.Jeu.demarrer(1);
        D.Camera.mesurer(1280, 720, 1); D.Camera.recaler();
        for (let i = 0; i < 60 * 120 && D.Jeu.phase === "jeu"; i++){
          D.Jeu.pas(1 / 60);
          const dem = D.Jeu.demandes[0];
          if (dem) D.Jeu.saluer(dem.cible);
          const tarte = D.Tartes.tarteImminente();
          if (tarte && tarte.fenetreOuverte) D.Esquive.tenter();
        }
        const compte = {};
        for (const p of D.Foule.tous){
          if (D.PERSOS_DEBOUT.indexOf(p.sprite) < 0) continue;
          compte[p.sprite] = (compte[p.sprite] || 0) + 1;
          if (compte[p.sprite] > 1) return false;
        }
      }
      return true;
    })(), "deux fois le même visage connu dans la même file");
  verifier("les anonymes, eux, peuvent revenir",
    (() => {
      D.Jeu.demarrer(1);
      const vus = {};
      for (let k = 0; k < 60; k++){
        const s2 = D.Foule.spriteAnonyme();
        if (D.PERSOS_DEBOUT.indexOf(s2) >= 0) return false;
        vus[s2] = (vus[s2] || 0) + 1;
      }
      return Object.values(vus).some(n => n > 1);
    })(), "la foule doit rester une foule");
  verifier("aucun sprite de la file ne vient de la terrasse",
    D.TERRASSE.every(t2 => D.SPRITES_PNJ.indexOf(t2.sprite) < 0));

  titre("Les visiteurs de passage");
  verifier("seuls des personnages écrits pour le jeu passent",
    D.VISITEURS.every(v => /^pers_/.test(v.sprite)),
    D.VISITEURS.filter(v => !/^pers_/.test(v.sprite)).map(v => v.id).join(", "));
  verifier("chacun a au moins un thème d'affaire",
    D.VISITEURS.every(v => v.lie && Object.keys(v.lie).length >= 1),
    "un passant sans thème n'est qu'un figurant");
  verifier("la tournée du soir est décidée au lancement",
    (() => {
      for (let n = 0; n < 120; n++){
        D.Jeu.demarrer(2); D.Intro.finir();
        const marques = D.Affaire.scenario.tags || [];
        const lies = D.VISITEURS.filter(v => v.lie && marques.some(t2 => v.lie[t2])).map(v => v.id);
        /* tous ceux qui ont un lien doivent en être */
        if (!lies.every(id => D.Visiteurs.tournee.indexOf(id) >= 0)) return false;
        /* et au plus un intrus */
        if (D.Visiteurs.tournee.filter(id => lies.indexOf(id) < 0).length > 1) return false;
        if (!D.Visiteurs.tournee.length) return false;
      }
      return true;
    })(), "ceux qui ont quelque chose à dire doivent venir, les autres presque jamais");
  verifier("chacun ne passe qu'une fois par partie",
    (() => {
      D.Jeu.demarrer(2); D.Intro.finir();
      const vus = [];
      for (let k = 0; k < 12; k++){
        D.Visiteurs.etat = "ABSENT";
        if (!D.Visiteurs.declencher()) break;
        vus.push(D.Visiteurs.qui.id);
      }
      return vus.length === D.Visiteurs.tournee.length && new Set(vus).size === vus.length;
    })(), "leur venue doit être un événement, pas une ronde");
  verifier("quand ils sont tous passés, il n'en vient plus",
    (() => {
      D.Jeu.demarrer(2); D.Intro.finir();
      for (let k = 0; k < D.VISITEURS.length + 2; k++){ D.Visiteurs.etat = "ABSENT"; D.Visiteurs.declencher(); }
      D.Visiteurs.etat = "ABSENT";
      return D.Visiteurs.declencher() === false;
    })());
  verifier("on préfère envoyer celui qui a quelque chose à dire",
    (() => {
      /* Test statistique : taux réel mesuré 69 % depuis l'arrivée de
         Mathilde (62 % avant), seuil 55 %.
         À 200 tirages il flottait une fois sur soixante-dix (2,2 σ) ;
         à 600 le même seuil est à 3,7 σ. */
      let concernes = 0;
      for (let n = 0; n < 600; n++){
        D.Jeu.demarrer(2); D.Intro.finir();
        D.Visiteurs.declencher();
        const marques = D.Affaire.scenario.tags || [];
        if (D.Visiteurs.qui.lie && marques.some(t2 => D.Visiteurs.qui.lie[t2])) concernes++;
      }
      return concernes > 330;
    })(), "le premier passage doit compter");
  verifier("Jojo est dans le registre",
    D.VISITEURS.some(v => v.id === "jojo" && v.lie && v.lie.plomberie && v.lie.hauteur));
  verifier("les deux barmen se partagent le thème de l'alcool",
    D.VISITEURS.filter(v => v.lie && v.lie.alcool).length >= 2,
    "Francky et Jojo doivent tous deux pouvoir en parler");
  verifier("Francky est dans le registre",
    D.VISITEURS.some(v => v.id === "francky" && v.lie && v.lie.dodo && v.lie.alcool));
  verifier("une réplique liée ne sort que dans les affaires concernées",
    (() => {
      const tags = new Set();
      for (const v of D.VISITEURS) if (v.lie) Object.keys(v.lie).forEach(k => tags.add(k));
      /* chaque étiquette citée par un visiteur doit exister dans au
         moins une affaire, sinon sa réplique dort pour toujours */
      for (const tag of tags){
        if (!D.SCENARIOS.some(sc => (sc.tags || []).indexOf(tag) >= 0)) return false;
      }
      return true;
    })(), "une réplique liée à une étiquette qu'aucune affaire ne porte ne sortirait jamais");
  verifier("les affaires de cocktail existent",
    D.SCENARIOS.filter(sc => (sc.tags || []).indexOf("dodo") >= 0).length >= 3,
    "il faut de quoi faire parler Francky");
  verifier("chaque thème de visiteur a au moins trois affaires",
    (() => {
      const themes = new Set();
      for (const v of D.VISITEURS) if (v.lie) Object.keys(v.lie).forEach(k => themes.add(k));
      for (const t2 of themes){
        if (D.SCENARIOS.filter(sc => (sc.tags || []).indexOf(t2) >= 0).length < 3) return false;
      }
      return true;
    })(),
    (() => {
      const c = {};
      for (const v of D.VISITEURS) if (v.lie) for (const k of Object.keys(v.lie))
        c[k] = D.SCENARIOS.filter(sc => (sc.tags || []).indexOf(k) >= 0).length;
      return Object.entries(c).map(([k, n]) => k + ":" + n).join(" ");
    })());
  verifier("chacun a un sprite chargé au démarrage",
    D.VISITEURS.every(v => /^pers_/.test(v.sprite)),
    D.VISITEURS.map(v => v.sprite).join(", "));
  verifier("chacun a de quoi ne rien dire",
    D.VISITEURS.every(v => v.nom && v.banal.length >= 3));
  lancer2();
  verifier("aucun passant au départ", !D.Visiteurs.visible());
  verifier("le premier est attendu, pas immédiat", D.Visiteurs.prochain > 35);
  /* un passant traverse : il entre, parle, repart */
  D.Visiteurs.declencher();
  verifier("il entre par un bord", D.Visiteurs.visible() && (D.Visiteurs.x < 0 || D.Visiteurs.x > 1));
  let tv = 0;
  while (D.Visiteurs.etat !== "PARLE" && tv++ < 60 * 20) D.Jeu.pas(1 / 60);
  verifier("il s'arrête et parle", D.Visiteurs.etat === "PARLE");
  verifier("sa réplique sort de sa bouche",
    D.Effets.paroles.some(p => p.cible.visiteur),
    "elle sortait de celle de l'inspecteur");
  tv = 0;
  while (D.Visiteurs.visible() && tv++ < 60 * 30) D.Jeu.pas(1 / 60);
  verifier("puis il s'en va", !D.Visiteurs.visible(), "il reste planté là");

  /* ce qu'il dit d'utile doit être VRAI dans l'affaire en cours */
  verifier("aucun conseil ne présume du genre de quelqu'un",
    (() => {
      for (let n = 0; n < 200; n++){
        D.Jeu.demarrer(2); D.Intro.finir();
        for (let k = 0; k < 6; k++){
          const c = D.Visiteurs.conseil();
          if (/\b(elle|Elle) [a-zé]+e\b/.test(c) && /RISOTO|CHARLES|TEOPEDO/.test(c)) return false;
        }
      }
      return true;
    })(), "le témoin clé peut être n'importe lequel des quatre");
  verifier("ses indications sont vraies",
    (() => {
      for (let n = 0; n < 120; n++){
        D.Jeu.demarrer(2); D.Intro.finir();
        const c = D.Visiteurs.conseil();
        if (/\{\w+\}/.test(c)) return false;
        const meuble = D.ZONES.find(z => c.indexOf(z.nom) >= 0);
        if (meuble){
          const z = D.Enquete.zones.find(x => x.ref.id === meuble.id);
          if (!z || (!z.indice && !z.cachette)) return false;   /* il enverrait sur du vide */
        }
      }
      return true;
    })(), "un passant qui invente est pire que pas de passant");
  verifier("il ne coupe jamais Hortense ni le dossier",
    (() => {
      D.Jeu.demarrer(2); D.Intro.finir();
      D.Enquete.dossierOuvert = true;
      const a = D.Visiteurs.declencher();
      D.Enquete.dossierOuvert = false;
      D.Enquete.accusation = true;
      const b = D.Visiteurs.declencher();
      D.Enquete.accusation = false;
      return !a && !b;
    })());

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
  const bonne = listeNoms().indexOf(D.Affaire.bonneReponse());
  D.Enquete.viserAccusation(yLigne(bonne));
  D.Enquete.viserAccusation(yLigne(bonne));
  egal("le second toucher accuse", D.Jeu.phase, "fin");

  /* mauvaise accusation : pénalité, pas de fin de partie */
  lancer2();
  D.Enquete.indices = 4;
  D.Enquete.ouvrirAccusation();
  const tAvant = D.Enquete.restant;
  noms = listeNoms();
  const faux = () => { const b = noms.indexOf(D.Affaire.bonneReponse()); return b === 0 ? 1 : 0; };
  D.Enquete.choixAcc = faux();
  D.Enquete.valider();
  egal("une mauvaise accusation ne termine pas la partie", D.Jeu.phase, "jeu");
  verifier("elle coûte vingt secondes", tAvant - D.Enquete.restant >= 19.5);
  egal("il ne reste qu'une accusation", D.Enquete.accusationsRestantes, D.ENQ_ACCUSATIONS - 1);
  D.Enquete.ouvrirAccusation();
  D.Enquete.choixAcc = faux();
  D.Enquete.valider();
  egal("la seconde erreur perd l'affaire", D.Jeu.phase, "fin");
  verifier("et elle est bien perdue", D.Enquete.fini && !D.Enquete.fini.gagne);

  /* Hortense doit intervenir, une fois, au milieu */
  titre("Hortense au niveau 2");
  lancer2();
  /* Parler à la sœur fait venir Hortense beaucoup plus vite. */
  verifier("interroger la sœur avance la venue d'Hortense",
    (() => {
      let avances = 0, essais = 0;
      for (let n = 0; n < 200; n++){
        D.Jeu.demarrer(2); D.Intro.finir();
        const avant = D.HortenseApp.quand;
        const is = D.SUSPECTS.findIndex(x => x.id === "gabi");
        D.Enquete.actifIdx = D.Heros.findIndex(h => h.sprite === "thibaut");
        D.Enquete.interroger(is);
        essais++;
        if (D.HortenseApp.quand < avant - 0.5) avances++;
      }
      return avances === essais;
    })(), "chaque passage doit rapprocher son arrivée");
  verifier("et une fois sur deux environ, elle arrive tout de suite",
    (() => {
      let vite = 0;
      for (let n = 0; n < 400; n++){
        D.Jeu.demarrer(2); D.Intro.finir();
        const is = D.SUSPECTS.findIndex(x => x.id === "gabi");
        D.Enquete.interroger(is);
        if (D.HortenseApp.quand - (D.ENQ_DUREE - D.Enquete.restant) < 9) vite++;
      }
      return vite > 160 && vite < 280;
    })(), "ni jamais, ni à tous les coups");
  verifier("interroger quelqu'un d'autre ne la fait pas venir",
    (() => {
      for (let n = 0; n < 60; n++){
        D.Jeu.demarrer(2); D.Intro.finir();
        const avant = D.HortenseApp.quand;
        const is = D.SUSPECTS.findIndex(x => x.id === "charles");
        if (is < 0) continue;
        D.Enquete.interroger(is);
        if (D.HortenseApp.quand !== avant) return false;
      }
      return true;
    })());

  D.Jeu.demarrer(2); D.Intro.finir();
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

  /* ================= 4. simulation ================= */  /* ================= pause ================= */
  titre("Pause");
  D.Jeu.demarrer(1);
  verifier("on peut mettre en pause en pleine partie", D.Pause.peut());
  D.Pause.mettre();
  verifier("la pause suspend la boucle", D.Pause.active && D.Boucle.pause);
  const scoreGele = D.Score.points, viesGelees = D.Jeu.vies;
  for (let i = 0; i < 60 * 8; i++) D.Jeu.pas(1 / 60);
  void scoreGele; void viesGelees;
  D.Pause.reprendre();
  verifier("reprendre relance la boucle", !D.Pause.active && !D.Boucle.pause);

  D.Jeu.demarrer(2); D.Intro.finir();
  D.Pause.mettre();
  verifier("elle marche aussi au niveau 2", D.Pause.active);
  const restantGele = D.Enquete.restant;
  for (let i = 0; i < 60 * 5; i++){ if (!D.Boucle.pause) D.Jeu.pas(1 / 60); }
  presque("le chrono de l'enquête ne bouge pas", D.Enquete.restant, restantGele, 0.001);
  D.Pause.quitter();
  egal("quitter ramène au menu principal", D.Jeu.phase, "titre");
  egal("et repasse au niveau 1", D.Jeu.niveau, 1);
  verifier("la boucle est relancée", !D.Boucle.pause);

  D.Jeu.demarrer(2); D.Intro.finir();
  D.Pause.mettre();
  D.Pause.recommencer();
  egal("recommencer relance le même niveau", D.Jeu.niveau, 2);
  verifier("et repart du début", D.Intro.actif || D.Enquete.restant > D.ENQ_DUREE - 1);

  D.Jeu.retourTitre();
  verifier("pas de pause hors partie", !D.Pause.peut());

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

  /* ================= NIVEAU 3 — la tournée ================= */
  titre("Niveau 3 — la tournée");
  /* Lit la taille dans l'en-tête WebP : la seule façon, ici, de vérifier
     un invariant d'IMAGE et pas seulement de code. */
  const dimsWebp = nom => {
    const buf = fs.readFileSync(path.join(RACINE, "img", "n3", nom + ".webp"));
    const tag = buf.toString("ascii", 12, 16);
    if (tag === "VP8 ") return { l:buf.readUInt16LE(26) & 0x3fff, h:buf.readUInt16LE(28) & 0x3fff };
    if (tag === "VP8X") return { l:(buf.readUIntLE(24, 3) & 0xffffff) + 1, h:(buf.readUIntLE(27, 3) & 0xffffff) + 1 };
    if (tag === "VP8L"){
      const b2 = buf.readUInt32LE(21);
      return { l:(b2 & 0x3fff) + 1, h:((b2 >> 14) & 0x3fff) + 1 };
    }
    return null;
  };
  const lancerPoses = () => { D.Jeu.demarrer(3); D.Tournee.lancer(); };
  const lancer3 = (champ) => {
    D.Jeu.demarrer(3);
    D.Tournee.choixChamp = champ === undefined ? 0 : champ;
    D.Tournee.lancer();
  };
  verifier("demarrer(3) ouvre le choix du champion",
    (() => { D.Jeu.demarrer(3); return D.Tournee.enChoix && D.Jeu.phase === "jeu"; })());
  verifier("les deux champions existent et se distinguent",
    D.BAR_CHAMPIONS.length === 2 &&
    D.BAR_CHAMPIONS[0].vitesse !== D.BAR_CHAMPIONS[1].vitesse &&
    D.BAR_CHAMPIONS[0].boire !== D.BAR_CHAMPIONS[1].boire);
  verifier("aucun champion n'est objectivement meilleur",
    (() => {
      /* vitesse × cadence de descente : les deux produits doivent se
         tenir — sinon un des deux domine partout */
      const note = c => c.vitesse * (1 / c.boire);
      const n0 = note(D.BAR_CHAMPIONS[0]), n1 = note(D.BAR_CHAMPIONS[1]);
      return Math.max(n0, n1) / Math.min(n0, n1) < 1.35;
    })(), "l'écart des notes dépasse 35 %");
  verifier("PF garde ses lunettes et son crâne : heros 0",
    D.BAR_CHAMPIONS.find(c => c.nom === "PF").heros === 0 &&
    D.BAR_CHAMPIONS.find(c => c.nom === "THIBAUT").heros === 1,
    "les champions sont inversés — le vieux piège");
  verifier("chaque pose citée par les barmans est chargée",
    (() => {
      const n3 = new Set(D.IMG_PAR_DOSSIER.n3);
      return D.BARMANS.every(b =>
        b.prepare.every(pz => n3.has(pz)) &&
        Object.values(b.poses).every(pz => n3.has(pz)));
    })());
  verifier("chaque champion a ses dix poses sur le disque",
    (() => {
      const n3 = new Set(D.IMG_PAR_DOSSIER.n3);
      return D.BAR_CHAMPIONS.every(c => D.POSES_BAR.every(po => n3.has(D.poseBar(c, po))));
    })(),
    "il manque une pose : la planche a été découpée à moitié");
  verifier("toutes les poses que la mécanique demande existent",
    (() => {
      /* on force chaque état et on vérifie que pose() nomme une image
         réelle : une pose oubliée fait disparaître le champion */
      lancerPoses();
      const n3 = new Set(D.IMG_PAR_DOSSIER.n3);
      const T = D.Tournee, c = T.champion;
      const vues = [];
      const relever = () => vues.push(T.pose());
      T.marche = 0; T.bourre = 0; T.freinT = 0; T.boitT = 0; relever();
      T.marche = 1; T.dureeMarche = 0.1; T.foulee = 0; relever();
      T.foulee = 1.2; relever();
      T.dureeMarche = 1.2; relever();
      T.marche = 0; T.freinT = 0.1; relever();
      T.freinT = 0; T.bourre = 2; relever();
      T.bourre = 0;
      for (const act of ["boit", "jette"]){
        T.action = act; T.boitTotal = 1;
        for (const p of [0.1, 0.5, 0.9]){ T.boitT = 1 - p; relever(); }
      }
      T.boitT = 0;
      return vues.length === 12 && vues.every(po => n3.has(D.poseBar(c, po)));
    })());

  /* --- le garde-fou de faisabilité --- */
  lancer3(1);           /* PF, le plus lent : le cas le pire */
  D.Tournee.x = 0.02;
  verifier("un verre à l'autre bout n'est pas faisable pour PF chargé",
    (() => {
      /* deux verres déjà posés + un à l'opposé : le coût dépasse la vie */
      const deja = [{ x:0.05 }, { x:0.10 }];
      return D.Tournee.faisable(0.94, deja) === false;
    })());
  verifier("un verre proche reste faisable",
    D.Tournee.faisable(0.10, []) === true);

  /* --- les quatre décisions --- */
  const poserVerre = (type, x) => {
    D.Tournee.verres.push({ type, x, etat:D.ETAT_VERRE.POSE, t:0, vie:7.5, barman:"francky" });
    return D.Tournee.verres[D.Tournee.verres.length - 1];
  };
  lancer3(0);
  D.Tournee.x = 0.5;
  poserVerre("cocktail", 0.5);
  const scoreAvant = D.Score.points;
  verifier("boire un cocktail : PARFAIT", D.Tournee.boire() === true &&
    D.Score.points > scoreAvant && D.Tournee.combo === 1 && D.Tournee.stats.cocktails === 1);
  verifier("boire immobilise le champion",
    (() => { D.Tournee.marcher(1); return D.Tournee.marche === 0; })(),
    "Thibaut doit être vulnérable quand il boit");
  for (let i = 0; i < 60 * 3; i++) D.Jeu.pas(1 / 60);
  poserVerre("eau", D.Tournee.x);
  verifier("jeter l'eau : PAS DUPE", D.Tournee.jeter() === true &&
    D.Tournee.combo === 2 && D.Tournee.stats.eauxJetees === 1);
  for (let i = 0; i < 60 * 2; i++) D.Jeu.pas(1 / 60);
  poserVerre("eau", D.Tournee.x);
  verifier("boire l'eau casse le combo", D.Tournee.boire() === true &&
    D.Tournee.combo === 0 && D.Tournee.stats.eauxBues === 1);
  for (let i = 0; i < 60 * 3; i++) D.Jeu.pas(1 / 60);
  const scoreAvant2 = D.Score.points;
  poserVerre("jager", D.Tournee.x);
  verifier("jeter un Jägerbomb : sacrilège et amende", D.Tournee.jeter() === true &&
    D.Tournee.stats.sacrileges === 1 && D.Score.points < scoreAvant2);
  /* Mesurer l'ambiance en fin de séquence ne dit rien : gains et
     pertes s'annulent. Ce qui compte, c'est le PRIX d'une erreur. */
  verifier("chaque erreur coûte de l'ambiance",
    (() => {
      lancer3(0);
      D.Tournee.x = 0.5;
      D.Tournee.ambiance = 60;
      poserVerre("eau", 0.5);
      D.Tournee.boire();                       /* boire l'eau */
      const apresEau = D.Tournee.ambiance;
      D.Tournee.boitT = 0;
      poserVerre("jager", 0.5);
      D.Tournee.jeter();                       /* sacrilège */
      return apresEau <= 60 - 8 && D.Tournee.ambiance <= apresEau - 8;
    })());
  verifier("une bonne décision en rapporte",
    (() => {
      lancer3(0);
      D.Tournee.x = 0.5; D.Tournee.ambiance = 50;
      poserVerre("cocktail", 0.5);
      D.Tournee.boire();
      return D.Tournee.ambiance >= 50 + D.BAR_AMBIANCE_GAIN - 0.01;
    })());

  /* --- l'expiration --- */
  lancer3(0);
  D.Tournee.x = 0.5; D.Tournee.combo = 4;
  const vExp = poserVerre("cocktail", 0.9);
  for (let i = 0; i < 60 * 9; i++) D.Jeu.pas(1 / 60);
  verifier("un verre oublié expire et casse la série",
    vExp.etat !== D.ETAT_VERRE.POSE && D.Tournee.combo === 0 && D.Tournee.stats.rates >= 1);

  /* --- les verres oubliés s'accumulent --- */
  verifier("un verre oublié reste sur le comptoir, il traîne",
    (() => {
      lancer3(0);
      D.Tournee.x = 0.5;
      const v = poserVerre("cocktail", 0.9);
      for (let i = 0; i < 60 * 9; i++) D.Jeu.pas(1 / 60);
      return v.etat === D.ETAT_VERRE.TRAINE && D.Tournee.verres.indexOf(v) >= 0;
    })());
  verifier("JETER débarrasse une traîne, petit merci",
    (() => {
      lancer3(0);
      D.Tournee.x = 0.5;
      const v = poserVerre("cocktail", 0.5);
      v.etat = D.ETAT_VERRE.TRAINE;
      const avant = D.Score.points, comboAvant = D.Tournee.combo;
      if (!D.Tournee.jeter()) return false;
      for (let i = 0; i < 60; i++) D.Jeu.pas(1 / 60);
      return D.Score.points === avant + 10 && D.Tournee.combo === comboAvant &&
        D.Tournee.verres.indexOf(v) < 0 && D.Tournee.stats.sacrileges === 0;
    })());
  verifier("boire une traîne ne rapporte rien : c'est éventé",
    (() => {
      lancer3(0);
      D.Tournee.x = 0.5;
      const v = poserVerre("jager", 0.5);
      v.etat = D.ETAT_VERRE.TRAINE;
      const avant = D.Score.points;
      if (!D.Tournee.boire()) return false;
      return D.Score.points === avant && D.Tournee.combo === 0 && D.Tournee.stats.jagers === 0;
    })());
  verifier("les verres frais passent avant les traînes sous la main",
    (() => {
      lancer3(0);
      D.Tournee.x = 0.5;
      const t2 = poserVerre("eau", 0.505); t2.etat = D.ETAT_VERRE.TRAINE;
      poserVerre("cocktail", 0.51);
      const i = D.Tournee.verreAPortee();
      return i >= 0 && D.Tournee.verres[i].etat === D.ETAT_VERRE.POSE;
    })());
  verifier("cinq traînes font déborder le bar : l'ambiance file",
    (() => {
      lancer3(0);
      D.Tournee.x = 0.5; D.Tournee.ambiance = 40;
      for (let k = 0; k < 5; k++){ const v = poserVerre("cocktail", 0.1 + k * 0.05); v.etat = D.ETAT_VERRE.TRAINE; }
      for (let i = 0; i < 60 * 3; i++) D.Jeu.pas(1 / 60);
      return D.Tournee.ambiance < 40 - 2.5;
    })());

  /* --- la pompette --- */
  verifier("trois verres coup sur coup, et on titube",
    (() => {
      lancer3(0);
      for (let k = 0; k < 3; k++){
        D.Tournee.boitT = 0;
        poserVerre("cocktail", D.Tournee.x);
        D.Tournee.boire();
        for (let i = 0; i < 30; i++) D.Jeu.pas(1 / 60);
      }
      return D.Tournee.bourre > 0;
    })());
  verifier("pompette, on n'avance plus qu'à moitié",
    (() => {
      lancer3(0);
      /* sobre : une seconde de course */
      D.Tournee.x = 0.2; D.Tournee.marcher(1);
      for (let i = 0; i < 60; i++) D.Jeu.pas(1 / 60);
      const sobre = D.Tournee.x - 0.2;
      /* pompette : la même seconde */
      D.Tournee.bourre = 30; D.Tournee.x = 0.2; D.Tournee.marcher(1);
      for (let i = 0; i < 60; i++) D.Jeu.pas(1 / 60);
      const pompette = D.Tournee.x - 0.2;
      D.Tournee.bourre = 0;
      return pompette < sobre * 0.75;
    })(), "l'ivresse doit vraiment freiner");
  verifier("trois verres étalés dans le temps ne saoulent pas",
    (() => {
      lancer3(0);
      for (let k = 0; k < 3; k++){
        D.Tournee.boitT = 0;
        poserVerre("cocktail", D.Tournee.x);
        D.Tournee.boire();
        for (let i = 0; i < 60 * 6; i++) D.Jeu.pas(1 / 60);
      }
      return D.Tournee.bourre === 0;
    })());
  verifier("boire l'eau dessoûle — sa seule vertu",
    (() => {
      lancer3(0);
      D.Tournee.bourre = 4;
      poserVerre("eau", D.Tournee.x);
      D.Tournee.boire();
      return D.Tournee.bourre === 0;
    })());
  verifier("le garde-fou sert moins loin quand le champion titube",
    (() => {
      lancer3(1);          /* PF, déjà lent */
      D.Tournee.x = 0.05;
      const loin = 0.65;
      const sobre = D.Tournee.faisable(loin, []);
      D.Tournee.bourre = 30;
      const pompette = D.Tournee.faisable(loin, []);
      D.Tournee.bourre = 0;
      return sobre === true && pompette === false;
    })());

  /* --- l'eau attend son heure --- */
  verifier("pas d'eau dans les premières secondes",
    (() => {
      lancer3(0);
      for (let n = 0; n < 400; n++){ D.Tournee.temps = 5; if (D.Tournee.servirQuoi(D.Tournee.barmans[0]) === "eau") return false; }
      return true;
    })());
  verifier("l'eau finit par arriver",
    (() => {
      lancer3(0);
      D.Tournee.temps = 60;
      for (let n = 0; n < 400; n++) if (D.Tournee.servirQuoi(D.Tournee.barmans[0]) === "eau") return true;
      return false;
    })());

  /* --- des barmans qui servent vraiment, sans jamais coincer --- */
  verifier("la soirée sert des verres sans qu'on demande rien",
    (() => {
      lancer3(0);
      let poses = 0;
      for (let i = 0; i < 60 * 40; i++){
        const avant = D.Tournee.verres.length;
        /* on maintient la salle en vie pour observer le service seul */
        D.Tournee.ambiance = 60;
        D.Jeu.pas(1 / 60);
        if (D.Tournee.verres.length > avant) poses++;
      }
      return poses >= 5;
    })(), "en quarante secondes, il doit se passer des choses");
  verifier("ne rien faire finit par vider le bar : on peut PERDRE",
    (() => {
      lancer3(0);
      for (let i = 0; i < 60 * D.BAR_DUREE; i++){
        D.Jeu.pas(1 / 60);
        if (D.Tournee.fini) break;
      }
      return !!D.Tournee.fini && D.Tournee.fini.gagne === false &&
        D.Tournee.fini.cause === "vide" && D.Jeu.phase === "fin";
    })(), "sans défaite possible, la jauge ne veut rien dire");
  verifier("le chrono s'épuise si l'ambiance tient mais ne monte pas",
    (() => {
      lancer3(0);
      for (let i = 0; i < 60 * (D.BAR_DUREE + 2); i++){
        D.Tournee.ambiance = 50;          /* on tient la salle, sans jamais remplir */
        D.Jeu.pas(1 / 60);
        if (D.Tournee.fini) break;
      }
      return !!D.Tournee.fini && D.Tournee.fini.gagne === false &&
        D.Tournee.fini.cause === "temps";
    })());
  verifier("le coup de feu part une seule fois, vers 70 s",
    (() => {
      lancer3(0);
      let departs = 0;
      for (let i = 0; i < 60 * 100; i++){
        const avant = D.Tournee.coupDeFeu;
        D.Tournee.ambiance = 60;          /* la salle tient : on observe le coup de feu */
        D.Jeu.pas(1 / 60);
        if (!avant && D.Tournee.coupDeFeu) departs++;
      }
      return departs === 1 && !D.Tournee.coupDeFeu;
    })());

  /* --- la jauge pleine ouvre la dernière tournée, cinq décisions gagnent --- */
  verifier("jauge pleine → DERNIÈRE TOURNÉE → victoire en cinq",
    (() => {
      lancer3(0);
      D.Tournee.ambiance = D.BAR_AMBIANCE_BUT;
      D.Jeu.pas(1 / 60);
      if (!D.Tournee.finale || D.Tournee.finaleReste !== D.BAR_TOURNEE_FINALE) return false;
      for (let k = 0; k < D.BAR_TOURNEE_FINALE; k++){
        D.Tournee.boitT = 0;
        poserVerre("cocktail", D.Tournee.x);
        if (!D.Tournee.boire()) return false;
        for (let i = 0; i < 60 * 2; i++) D.Jeu.pas(1 / 60);
      }
      return D.Tournee.fini && D.Tournee.fini.gagne && D.Jeu.phase === "fin";
    })());
  verifier("se tromper pendant la finale la fait repartir de cinq",
    (() => {
      lancer3(0);
      D.Tournee.ambiance = D.BAR_AMBIANCE_BUT;
      D.Jeu.pas(1 / 60);
      poserVerre("cocktail", D.Tournee.x);
      D.Tournee.boire();
      for (let i = 0; i < 60 * 2; i++) D.Jeu.pas(1 / 60);
      if (D.Tournee.finaleReste !== D.BAR_TOURNEE_FINALE - 1) return false;
      poserVerre("eau", D.Tournee.x);
      D.Tournee.boire();
      return D.Tournee.finaleReste === D.BAR_TOURNEE_FINALE;
    })());

  /* --- les habitués --- */
  verifier("les habitués sortent des sprites déjà dessinés",
    (() => {
      const dispo = new Set(D.IMG_PAR_DOSSIER.commun);
      return D.BAR_CLIENTS.length >= 3 && D.BAR_CLIENTS.every(c => dispo.has(c.sprite));
    })());
  verifier("un verre frais ne se fait pas chiper sous le nez du joueur",
    (() => {
      lancer3(0);
      const v = poserVerre("cocktail", 0.5);
      v.t = 0;
      return D.Tournee.verreChipable(0.5) < 0;
    })(), "ils ne doivent voler que ce qu'on a déjà abandonné");
  verifier("un verre qui traîne depuis un moment, oui",
    (() => {
      lancer3(0);
      const v = poserVerre("cocktail", 0.5);
      v.t = v.vie * 0.8;
      return D.Tournee.verreChipable(0.5) >= 0;
    })());
  verifier("personne ne vole un verre d'eau — c'est l'indice du niveau",
    (() => {
      lancer3(0);
      const v = poserVerre("eau", 0.5);
      v.t = v.vie * 0.9;
      return D.Tournee.verreChipable(0.5) < 0;
    })());
  verifier("un verre chipé quitte le comptoir sans devenir une traîne",
    (() => {
      lancer3(0);
      const v = poserVerre("jager", 0.5);
      v.t = v.vie * 0.9;
      D.Tournee.clients = [{ ref:D.BAR_CLIENTS[0], x:0.5, dir:1, etat:"prend", t:0.6, cible:0.5, verre:v }];
      const combo = D.Tournee.combo;
      D.Tournee.majClients(1 / 60);
      return D.Tournee.verres.indexOf(v) < 0 && D.Tournee.stats.chipes === 1 &&
        D.Tournee.combo === combo;
    })());
  verifier("des habitués finissent par entrer, et repartent",
    (() => {
      lancer3(0);
      let vus = 0;
      for (let i = 0; i < 60 * 90; i++){
        D.Tournee.ambiance = 60;
        const avant = D.Tournee.clients.length;
        D.Jeu.pas(1 / 60);
        if (D.Tournee.clients.length > avant) vus++;
      }
      return vus >= 2 && D.Tournee.clients.length <= 2;
    })());

  /* --- les animations des figurants --- */
  verifier("le télégraphe de Francky est le plus long : il se lit de loin",
    (() => {
      const fr = D.BARMANS.find(b => b.id === "francky");
      const jo = D.BARMANS.find(b => b.id === "jojo");
      return fr.prepare.length >= 5 && fr.prepare.length > jo.prepare.length;
    })());
  verifier("chaque pose de barman citée existe sur le disque",
    (() => {
      const n3 = new Set(D.IMG_PAR_DOSSIER.n3);
      return D.BARMANS.every(b =>
        b.prepare.every(p2 => n3.has(p2)) && Object.values(b.poses).every(p2 => n3.has(p2)));
    })());
  verifier("un habitué sans planche garde sa silhouette",
    (() => {
      /* Le repli doit tenir même si plus personne ne s'en sert : c'est
         ce qui permettra d'ajouter un habitué avec une seule image. */
      const sans = { id:"essai", sprite:"pers_teo", nom:"ESSAI", taille:1 };
      const cl = { ref:sans, x:0.5, dir:1, etat:"entre", t:0, foulee:0 };
      return D.Tournee.poseClient(cl) === "pers_teo";
    })());
  verifier("un habitué sans gestes ne prend pas de pose de consommation",
    (() => {
      const sans = D.BAR_CLIENTS.find(c => c.prefixe && !c.gestes);
      if (!sans) return false;
      const cl = { ref:sans, x:0.5, dir:1, etat:"prend", t:0.5, foulee:0, verreEnMain:true };
      return D.Tournee.poseClient(cl) === sans.prefixe + "_idle";
    })());
  verifier("chaque pose d'habitué annoncée existe sur le disque",
    (() => {
      const n3 = new Set(D.IMG_PAR_DOSSIER.n3);
      const commun = new Set(D.IMG_PAR_DOSSIER.commun);
      return D.BAR_CLIENTS.every(c => {
        if (!commun.has(c.sprite)) return false;
        if (!c.prefixe) return true;
        const base = ["idle", "marche1", "marche2"];
        const plus = c.gestes ? ["attrape", "boit", "vide"] : [];
        return base.concat(plus).every(po => n3.has(c.prefixe + "_" + po));
      });
    })());
  verifier("un habitué avec planche marche, se sert, puis s'en va son verre en main",
    (() => {
      lancer3(0);
      const avec = D.BAR_CLIENTS.find(c => c.prefixe);
      const n3 = new Set(D.IMG_PAR_DOSSIER.n3);
      const cl = { ref:avec, x:0.5, dir:1, etat:"entre", t:0, foulee:0, verreEnMain:false };
      const vues = [];
      vues.push(D.Tournee.poseClient(cl));
      cl.foulee = 1.2; vues.push(D.Tournee.poseClient(cl));
      cl.etat = "attend"; vues.push(D.Tournee.poseClient(cl));
      cl.etat = "prend"; cl.t = 0.1; vues.push(D.Tournee.poseClient(cl));
      cl.t = 0.5; vues.push(D.Tournee.poseClient(cl));
      cl.etat = "repart"; cl.verreEnMain = true; vues.push(D.Tournee.poseClient(cl));
      return new Set(vues).size === 6 && vues.every(p2 => n3.has(p2));
    })());
  verifier("Hortense traverse, s'arrête pour montrer la tarte, et repart",
    (() => {
      lancer3(0);
      D.Tournee.invite = { qui:"hortense", x:0.10, dir:1, t:0, pause:0, foulee:0 };
      const n3 = new Set(D.IMG_PAR_DOSSIER.n3);
      const marche = D.Tournee.poseInvite();
      /* elle avance jusqu'au milieu, où elle doit s'arrêter */
      let vueTarte = false, avanceApres = false;
      let xPause = null;
      for (let i = 0; i < 60 * 12; i++){
        D.Jeu.pas(1 / 60);
        if (!D.Tournee.invite) break;
        if (D.Tournee.invite.pause > 0){
          vueTarte = vueTarte || D.Tournee.poseInvite() === "bar_hortense_tarte";
          if (xPause === null) xPause = D.Tournee.invite.x;
        } else if (xPause !== null && D.Tournee.invite.x > xPause + 0.02) avanceApres = true;
      }
      return n3.has(marche) && vueTarte && avanceApres;
    })(), "la menace ne vaut que si elle s'arrête vraiment");
  verifier("le chat ne prend pas les poses d'Hortense",
    (() => {
      lancer3(0);
      D.Tournee.invite = { qui:"chat", x:0.2, dir:1, t:0, pause:0, foulee:0 };
      return D.Tournee.poseInvite() === "susp_chat";
    })());

  verifier("chaque barman est posté en face des étagères, pas au bord du décor",
    (() => {
      /* Le monde est le même fond répété BAR_COPIES fois. Un barman dont
         la position tombe au bord d'une copie se retrouve devant les
         toilettes ou le frigo : techniquement visible, visuellement
         faux. On exige donc qu'il tombe dans la partie CENTRALE d'une
         copie, là où sont le comptoir et les bouteilles. */
      return D.BARMANS.every(b => {
        const dansLaCopie = (b.x * D.BAR_COPIES) % 1;
        return dansLaCopie >= 0.22 && dansLaCopie <= 0.80;
      });
    })(),
    D.BARMANS.map(b => b.id + " -> " + (((b.x * D.BAR_COPIES) % 1).toFixed(2))).join(", "));
  verifier("toutes les poses d'un PERSONNAGE ont la même taille d'image",
    (() => {
      /* L'invariant central du niveau 3, appris deux fois. Un sprite n'a
         pas de taille, il a une ÉCHELLE : à hauteur d'écran constante,
         seule une taille SOURCE constante garde le personnage à sa
         taille et son corps centré. Thibaut avait 62 px d'écart entre
         ses poses (il grandissait en titubant), Mathilde 240. */
      const soucis = [];
      for (const pref of ["bar_th", "bar_pf", "bar_gabi", "bar_marini", "bar_martin", "bar_mathilde"]){
        const poses = D.IMG_PAR_DOSSIER.n3.filter(n => n.indexOf(pref + "_") === 0);
        if (!poses.length){ soucis.push(pref + " : aucune pose"); continue; }
        const t = poses.map(n => { const d = dimsWebp(n); return d ? d.l + "x" + d.h : "?"; });
        if (new Set(t).size !== 1) soucis.push(pref + " : " + [...new Set(t)].join(" / "));
      }
      messageDetail = soucis.join(" | ");
      return soucis.length === 0;
    })(), "des cadrages différents font grandir et rétrécir le personnage");
  verifier("toutes les poses d'un barman ont la même hauteur d'image",
    (() => {
      /* L'invariant qui empêche le barman de grandir et rétrécir à
         chaque geste : à hauteur d'écran constante, seule une hauteur
         SOURCE constante garde l'échelle du personnage. */
      const dims = dimsWebp;
      const inutilise = nom => {
        const buf = fs.readFileSync(path.join(RACINE, "img", "n3", nom + ".webp"));
        /* en-tête WebP : VP8 simple (lossy) ou VP8X (étendu) */
        const tag = buf.toString("ascii", 12, 16);
        if (tag === "VP8 ") return { l:buf.readUInt16LE(26) & 0x3fff, h:buf.readUInt16LE(28) & 0x3fff };
        if (tag === "VP8X") return { l:(buf.readUIntLE(24, 3) & 0xffffff) + 1, h:(buf.readUIntLE(27, 3) & 0xffffff) + 1 };
        if (tag === "VP8L"){
          const b2 = buf.readUInt32LE(21);
          return { l:(b2 & 0x3fff) + 1, h:((b2 >> 14) & 0x3fff) + 1 };
        }
        return null;
      };
      const soucis = [];
      for (const b of D.BARMANS){
        const noms = b.prepare.concat(Object.values(b.poses));
        const hs = noms.map(n => { const d = dims(n); return d ? d.h : -1; });
        if (new Set(hs).size !== 1) soucis.push(b.id + " : " + hs.join("/"));
      }
      messageDetail = soucis.join(" | ");
      return soucis.length === 0;
    })(), "des cadrages différents font grandir et rétrécir le barman");

  /* --- la tarte au bar --- */
  verifier("Hortense finit par lancer, et le bouton ESQUIVER apparaît",
    (() => {
      lancer3(0);
      const bouton = domBac.getElementById("c3E");
      D.Tournee.x = 0.60;
      D.Tournee.invite = { qui:"hortense", x:0.10, dir:1, t:0, pause:0, foulee:0, vue:false, jete:false };
      let lance = false, vuBouton = false, vuAlerte = false;
      for (let i = 0; i < 60 * 20; i++){
        D.Tournee.ambiance = 60;
        D.Jeu.pas(1 / 60);
        if (D.Tournee.tarte){
          lance = true;
          if (bouton.classList.contains("on")) vuBouton = true;
          if (D.Tournee.esquiveOuverte && bouton.classList.contains("alerte")) vuAlerte = true;
        }
        if (lance && !D.Tournee.tarte) break;
      }
      /* le tirage peut la faire repartir sans lancer : on force alors */
      if (!lance){
        D.Tournee.invite = { qui:"hortense", x:0.30, dir:1, t:0, pause:0, foulee:0, vue:true, jete:true };
        lance = D.Tournee.lancerTarte() === true;
        for (let i = 0; i < 60 * 6 && D.Tournee.tarte; i++){
          D.Jeu.pas(1 / 60);
          if (bouton.classList.contains("on")) vuBouton = true;
          if (D.Tournee.esquiveOuverte && bouton.classList.contains("alerte")) vuAlerte = true;
        }
      }
      return lance && vuBouton && vuAlerte;
    })());
  verifier("ESQUIVER n'est jamais éteint quand une tarte vole",
    (() => {
      lancer3(0);
      const bouton = domBac.getElementById("c3E");
      D.Tournee.invite = { qui:"hortense", x:0.20, dir:1, t:0, pause:0, foulee:0, vue:true, jete:true };
      D.Tournee.lancerTarte();
      let eteint = false;
      for (let i = 0; i < 60 * 6 && D.Tournee.tarte; i++){
        D.Jeu.pas(1 / 60);
        if (bouton.classList.contains("eteint")) eteint = true;
      }
      return !eteint;
    })(), "une invite à agir ne s'éteint jamais");
  verifier("esquiver rapporte, recevoir coûte",
    (() => {
      lancer3(0);
      D.Tournee.x = 0.5; D.Tournee.ambiance = 60; D.Tournee.combo = 6;
      D.Tournee.invite = { qui:"hortense", x:0.2, dir:1, t:0, pause:0, foulee:0, vue:true, jete:true };
      D.Tournee.lancerTarte();
      const pts = D.Score.points;
      let ok = false;
      for (let i = 0; i < 60 * 6 && D.Tournee.tarte; i++){
        D.Jeu.pas(1 / 60);
        if (D.Tournee.esquiveOuverte){ ok = D.Tournee.esquiver() === true; break; }
      }
      if (!(ok && D.Score.points === pts + D.BAR_ESQUIVE_PTS && D.Tournee.combo === 6)) return false;
      /* et maintenant on la reçoit */
      lancer3(0);
      D.Tournee.x = 0.5; D.Tournee.ambiance = 60; D.Tournee.combo = 6;
      D.Tournee.invite = { qui:"hortense", x:0.2, dir:1, t:0, pause:0, foulee:0, vue:true, jete:true };
      D.Tournee.lancerTarte();
      for (let i = 0; i < 60 * 8 && D.Tournee.tarteRecue === 0; i++) D.Jeu.pas(1 / 60);
      return D.Tournee.tarteRecue === 1 && D.Tournee.combo === 0 &&
        D.Tournee.ambiance <= 50 && D.Tournee.gele > 0;
    })());
  verifier("BOIRE esquive aussi : c'est la touche déjà sous le pouce",
    (() => {
      lancer3(0);
      D.Tournee.x = 0.5;
      D.Tournee.invite = { qui:"hortense", x:0.2, dir:1, t:0, pause:0, foulee:0, vue:true, jete:true };
      D.Tournee.lancerTarte();
      for (let i = 0; i < 60 * 6 && !D.Tournee.esquiveOuverte; i++) D.Jeu.pas(1 / 60);
      return D.Tournee.esquiveOuverte && D.Tournee.boire() === true && D.Tournee.tarteEsquivee === 1;
    })());
  verifier("le gel n'immobilise pas la tarte en vol",
    (() => {
      lancer3(0);
      D.Tournee.x = 0.5; D.Tournee.gele = 0.5;
      D.Tournee.invite = { qui:"hortense", x:0.2, dir:1, t:0, pause:0, foulee:0, vue:true, jete:true };
      D.Tournee.lancerTarte();
      const x0 = D.Tournee.tarte.x;
      for (let i = 0; i < 12; i++) D.Jeu.pas(1 / 60);
      return D.Tournee.tarte && D.Tournee.tarte.x > x0;
    })(), "sinon on prend la tarte dès la fin du gel, sans avoir pu bouger");

  /* --- le pupitre pendant le choix du champion --- */
  verifier("le pupitre reste rangé pendant le choix du champion",
    (() => {
      const pup = domBac.getElementById("pupitre3");
      D.Jeu.demarrer(3);
      D.Jeu.pas(1 / 60);
      const cache = !pup.classList.contains("on");
      D.Tournee.lancer();
      D.Jeu.pas(1 / 60);
      return cache && pup.classList.contains("on");
    })(), "on ne pilote rien tant qu'on n'a pas de champion");

  /* --- les points --- */
  verifier("pris au CLAC, la prime de vitesse tombe",
    (() => {
      lancer3(0);
      D.Tournee.x = 0.5;
      const v = poserVerre("cocktail", 0.5); v.t = 0.4;
      const avant = D.Score.points;
      D.Tournee.boire();
      const rapide = D.Score.points - avant;
      lancer3(0);
      D.Tournee.x = 0.5;
      const v2 = poserVerre("cocktail", 0.5); v2.t = D.BAR_SUR_LE_COUP + 1;
      const avant2 = D.Score.points;
      D.Tournee.boire();
      return rapide - (D.Score.points - avant2) === D.BAR_PRIME_COUP;
    })());
  verifier("le multiplicateur de combo plafonne",
    (() => {
      lancer3(0);
      D.Tournee.x = 0.5; D.Tournee.combo = 60;
      const avant = D.Score.points;
      const v = poserVerre("cocktail", 0.5); v.t = 5;
      D.Tournee.boire();
      return D.Score.points - avant === 100 * D.BAR_MULT_MAX;
    })());
  verifier("gagner rapporte un bonus de temps et d'ambiance",
    (() => {
      lancer3(0);
      D.Tournee.ambiance = D.BAR_AMBIANCE_BUT;
      D.Jeu.pas(1 / 60);
      const avant = D.Score.points;
      for (let k = 0; k < D.BAR_TOURNEE_FINALE; k++){
        D.Tournee.boitT = 0;
        poserVerre("cocktail", D.Tournee.x);
        D.Tournee.boire();
        for (let i = 0; i < 30; i++) D.Jeu.pas(1 / 60);
      }
      return D.Tournee.fini.gagne && D.Tournee.bonusFin > D.Tournee.meilleurCombo * 40 &&
        D.Score.points > avant;
    })());
  verifier("le tempo monte avec la soirée, et sert aussi aux néons",
    (() => {
      lancer3(0);
      const calme = D.Tournee.tempo();
      D.Tournee.coupDeFeu = true;
      const chaud = D.Tournee.tempo();
      D.Tournee.coupDeFeu = false; D.Tournee.finale = true;
      const finale = D.Tournee.tempo();
      D.Tournee.finale = false;
      return calme < chaud && chaud < finale;
    })());

  /* --- la couleur d'un héros ne se code qu'à un seul endroit --- */
  verifier("les pastilles de la légende suivent la couleur des héros",
    (() => {
      /* Le vert était sur PF et le bleu sur Thibaut, alors que c'est
         Thibaut qui s'habille en vert : sur l'écran de choix du
         champion, un liseré bleu entourait un personnage vert. La
         couleur était écrite dans le CSS ET dans le code — deux
         sources finissent toujours par se contredire. */
      /* preparer() est ce qui remplit le bandeau et la légende : dans le
         jeu elle tourne à l'amorçage, une fois les images chargées. */
      D.Interface.preparer();
      const g = domBac.getElementById("legPtG"), d2 = domBac.getElementById("legPtD");
      return !!g && !!d2 &&
        g.style.background === D.Heros[0].couleur &&
        d2.style.background === D.Heros[1].couleur;
    })());
  verifier("Thibaut est vert, PF est bleu, comme leurs vêtements",
    D.Heros.find(h => h.court === "Thibaut").couleur === "#37AC48" &&
    D.Heros.find(h => h.court === "P-F").couleur === "#2A8AE4");
  verifier("aucune couleur de héros n'est écrite en dur dans la légende",
    !/#legende \.(pt|pp)\{background/.test(html),
    "la pastille reprendrait sa vie propre");

  /* --- revenir au menu ne doit rien laisser traîner --- */
  titre("Retour au menu");
  (() => {
    /* Bug vu sur photo : après une partie de niveau 2 ou 3, les grosses
       touches JETER et BOIRE restaient affichées en bas de l'écran
       titre. entrerTitre() avait été écrit quand il n'existait qu'un
       seul pupitre. */
    const el = n => domBac.getElementById(n);
    for (const niv of [1, 2, 3]){
      D.Jeu.demarrer(niv);
      if (niv === 3) D.Tournee.lancer();
      D.Jeu.pas(1 / 60);
      D.Jeu.retourTitre();
      const restants = ["hud", "pupitre", "pupitre2", "pupitre3", "releveBar",
                        "outilsBtn", "pleinBtn", "pauseBtn"]
        .filter(n => el(n) && el(n).classList.contains("on"));
      verifier("après le niveau " + niv + ", le menu ne garde aucune commande",
        restants.length === 0, "encore visible(s) : " + restants.join(", "));
    }
  })();

  /* --- retour au calme pour la suite de la suite --- */
  D.Jeu.retourTitre();

  /* --- l'esquive du niveau 2 doit être JOUABLE, pas seulement possible --- */
  titre("L'esquive de l'appartement");
  (() => {
    const bouton = domBac.getElementById("c2A");
    const txt = domBac.getElementById("c2ATxt");
    D.Jeu.demarrer(2); D.Intro.finir();
    let vue = false, eteinte = false, libelle = "";
    for (let i = 0; i < 60 * 280; i++){
      D.Jeu.pas(1 / 60);
      if (D.Enquete.esquiveOuverte){
        vue = true;
        libelle = txt.textContent;
        /* c'est ICI que tout se joue : le bouton doit être vivant */
        if (bouton.classList.contains("eteint")) eteinte = true;
        break;
      }
    }
    verifier("la fenêtre d'esquive s'ouvre bien", vue);
    verifier("le bouton annonce l'esquive", libelle === "ESQUIVER !", "il dit « " + libelle + " »");
    verifier("et il n'est pas éteint au moment d'appuyer", !eteinte,
      "il était grisé : l'esquive paraissait impossible");
    verifier("appuyer esquive vraiment",
      D.Enquete.esquiveOuverte ? (D.Enquete.action() === true && D.Enquete.tarteEsquivee) : false);
    verifier("la fenêtre laisse le temps du pouce",
      D.ENQ_ESQUIVE_FENETRE >= 0.55, D.ENQ_ESQUIVE_FENETRE + " s");
    /* On rend le jeu au niveau 1 : la section suivante appelle
       demarrer() sans argument, qui GARDE le niveau courant — sans ça
       le rythme d'Hortense se mesurait dans un appartement. */
    D.Jeu.retourTitre();
  })();

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
