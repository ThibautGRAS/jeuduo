/* ============================================================================
   Suite de tests de DUO — à lancer avec :  node tests/tests.js
   Les fonctions et constantes sont extraites du vrai index.html, donc la suite
   suit le code : elle échoue si une régression revient.
   ========================================================================== */
"use strict";
const fs = require("fs");
const path = require("path");

const SOURCE = path.join(__dirname, "..", "index.html");
const html = fs.readFileSync(SOURCE, "utf8");
const script = (html.match(/<script>([\s\S]*?)<\/script>/) || [])[1] || "";

let reussis = 0, echoues = 0;
function verifier(nom, condition, detail){
  if (condition){ reussis++; console.log("  ok   " + nom + (detail ? "  — " + detail : "")); }
  else { echoues++; console.log("  ÉCHEC " + nom + (detail ? "  — " + detail : "")); }
}
function titre(t){ console.log("\n" + t); }

/* --- extraction --- */
function extraire(motif, nom){
  const m = script.match(motif);
  if (!m) throw new Error("introuvable dans index.html : " + nom);
  return m[0];
}
function nombre(nom){
  const m = script.match(new RegExp("\\b" + nom + "\\s*=\\s*(-?[0-9.]+)"));
  return m ? parseFloat(m[1]) : NaN;
}

/* ======================= 1. CONSTANTES DE JEU ======================= */
titre("1. Constantes de jeu");
const VIT_INIT = nombre("VIT_INIT"), VIT_MAX = nombre("VIT_MAX"),
      VIT_MAX_ECLAIR = nombre("VIT_MAX_ECLAIR"), VIT_FEU = nombre("VIT_FEU"),
      SMASH_MUR = nombre("SMASH_MUR"), VY_MIN = nombre("VY_MIN"),
      CADRE_X = nombre("CADRE_X"), CADRE_Y = nombre("CADRE_Y"),
      RAQ_MARGE = nombre("RAQ_MARGE"), LARG = nombre("LARG"), HAUT = nombre("HAUT"),
      OBST_L = nombre("OBST_L"), BALLE_R = nombre("BALLE_R");

verifier("hiérarchie des vitesses", VIT_INIT < VIT_MAX && VIT_MAX < VIT_MAX_ECLAIR,
  VIT_INIT + " < " + VIT_MAX + " < " + VIT_MAX_ECLAIR);
verifier("plancher de la balle en feu sous le plafond", VIT_FEU < VIT_MAX_ECLAIR,
  VIT_FEU + " < " + VIT_MAX_ECLAIR);
verifier("un smash peut fissurer un mur", SMASH_MUR <= VIT_MAX_ECLAIR,
  SMASH_MUR + " ≤ " + VIT_MAX_ECLAIR);
verifier("vitesse verticale minimale positive", VY_MIN > 0 && VY_MIN < VIT_INIT);
verifier("raquettes à l'intérieur du cadre", RAQ_MARGE >= CADRE_Y,
  "marge " + RAQ_MARGE + " ≥ cadre " + CADRE_Y);
verifier("terrain jouable suffisant", LARG - 2*CADRE_X > 380,
  (LARG - 2*CADRE_X) + " px de large");

/* ======================= 2. ACHEMINEMENT RÉSEAU ======================= */
titre("2. Acheminement réseau");
const CONTROLE = ["lu", "vc", "rm", "nm", "nm2", "va"];
for (const t of CONTROLE){
  const surRapide = new RegExp('conn\\.send\\(\\{\\s*t:\\s*"' + t + '"').test(script);
  verifier('« ' + t + ' » n\'est pas sur le canal non fiable', !surRapide);
}
verifier("un acheminement fiable existe", /function envoyerFiable\(/.test(script));
verifier("file d'attente si le canal fiable n'est pas prêt", /filePrioritaire/.test(script));
verifier("le canal fiable dispatche le contrôle", /function recevoirFiable\([\s\S]*?recevoir\(m\)/.test(script));

/* ======================= 3. CYCLE DE VIE ======================= */
titre("3. Cycle de vie et minuteurs");
const nbSetInterval = (script.match(/setInterval\(/g) || []).length;
const nbClear = (script.match(/clearInterval\(/g) || []).length;
verifier("les minuteurs sont arrêtables", nbClear > 0 && /function arreterMinuteurs\(/.test(script),
  nbSetInterval + " créations, " + nbClear + " arrêts");
verifier("reprise après coupure implémentée", /function demarrerReprise\(/.test(script));
verifier("l'hôte accepte une liaison de reprise", /const reprise = partieEnCours/.test(script));

/* ======================= 4. GÉOMÉTRIE ======================= */
titre("4. Géométrie du terrain");
let margeMur = 0;
const murG = () => CADRE_X + margeMur, murD = () => LARG - CADRE_X - margeMur;
verifier("la balle rebondit sur le cadre, pas sur le bord", murG() + BALLE_R > BALLE_R);
for (const l of [62, 104, 168]){
  const demi = l/2;
  const g = Math.max(murG() + demi, Math.min(murD() - demi, -9999));
  verifier("raquette de " + l + " px bornée par le cadre", g - demi >= CADRE_X - 0.01);
}
margeMur = nombre("MUR_MAX") || 88;
verifier("mort subite : terrain encore jouable", murD() - murG() > 150,
  (murD() - murG()) + " px");
margeMur = 0;
function terrain(L, H){ return Math.min(0.92*L, (H - 215)*0.75, 540); }
for (const [nom, L, H] of [["iPhone SE",375,667],["iPhone 13",390,844],["Android compact",360,640],["paysage",844,390]]){
  const t = terrain(L, H);
  verifier("mise en page tient sur " + nom, t > 0 && t*720/540 + 215 <= H + 1,
    Math.round(t) + " px de large");
}

/* ======================= 5. ARÈNES ======================= */
titre("5. Arènes");
const blocARENES = extraire(/const ARENES = \[[\s\S]*?\n\];/, "ARENES");
const noms = [...blocARENES.matchAll(/nom:\s*"([^"]+)"/g)].map(m => m[1]);
const tempos = [...blocARENES.matchAll(/tempo:\s*(\d+)/g)].map(m => +m[1]);
const nbBlocs = [...blocARENES.matchAll(/blocs:\s*(\d+)/g)].map(m => +m[1]);
verifier("six arènes définies", noms.length === 6, noms.join(", "));
verifier("chaque arène a sa musique", tempos.length === noms.length);
verifier("tempos tous distincts", new Set(tempos).size === tempos.length, tempos.join("/"));
verifier("nombre de bûches défini partout", nbBlocs.length === noms.length, nbBlocs.join(","));
verifier("une ou deux bûches, jamais plus", nbBlocs.every(n => n >= 1 && n <= 2));
verifier("chaque arène a un décor peint", (blocARENES.match(/img:\s*"arenes\//g) || []).length === 6);

/* ======================= 6. BÛCHES INDESTRUCTIBLES ======================= */
titre("6. Bûches centrales");
const zoneCollision = extraire(/const survole = Math[\s\S]*?\n    \}/, "collision blocs");
verifier("aucune suppression d'obstacle au contact",
  !/obstacles\.splice/.test(zoneCollision.replace(/if \(bouleFeu\)[\s\S]*?\n/, "")),
  "la boule de feu ne les retire plus non plus");
verifier("pas de redimensionnement", !/o\.l = Math\.max\(OBST_L_MIN/.test(script));

/* ======================= 7. VANNES ET RIMES ======================= */
titre("7. Vannes, rimes et noms");
/* on recharge les fonctions pures du jeu dans une portée dédiée */
const codePur = [
  extraire(/const MOT_LETTRE = \{[\s\S]*?\n\};/, "MOT_LETTRE"),
  extraire(/const RIMES = \[[\s\S]*?\n\];/, "RIMES"),
  extraire(/function sansAccent\(s\)\{[\s\S]*?\n\}/, "sansAccent"),
  extraire(/function rimesDe\(nom\)\{[\s\S]*?\n\}/, "rimesDe"),
  extraire(/function classeNom\(n\)\{[\s\S]*?\n\}/, "classeNom"),
  extraire(/function motDe\(nom\)\{[\s\S]*?\n\}/, "motDe"),
  extraire(/function habiller\(phrase, gagnant, perdant, idx\)\{[\s\S]*?\n\}/, "habiller"),
].join("\n");
const { rimesDe, classeNom, motDe, habiller } =
  new Function(codePur + "\nreturn { rimesDe, classeNom, motDe, habiller };")();
const familles = ["SARCASMES", "SARCASMES_THEME", "SARCASMES_MATCH",
                  "SARCASMES_NOM", "SARCASMES_RIME", "SARCASMES_DEFAUT", "SARCASMES_ECRITURE"];
for (const f of familles) verifier("famille " + f + " présente", script.includes("const " + f));

const PRENOMS = ["THIBAUT","KEMAL","TIBO","TIMMY","LUCA","MARTIN","SIMON","LAURENT","MARIE",
                 "SOPHIE","HUGO","LEO","EMMA","JULIEN","NICOLAS","CLAIRE","PIERRE","ANTOINE",
                 "MATHIEU","SARAH","CAMILLE","MAXIME","ELODIE","GASTON","ROMAIN","OLIVIER",
                 "VALERIE","FRED","ZOE","AXEL","MICHEL","CHLOE","BAPTISTE","NOEMIE","YANIS","ADRIEN"];
const sansRime = PRENOMS.filter(p => !rimesDe(p));
verifier("tous les prénoms testés trouvent une rime", sansRime.length === 0,
  PRENOMS.length + " prénoms" + (sansRime.length ? " sauf " + sansRime.join(",") : ""));
verifier("nom par défaut détecté", classeNom("") === "defaut" && classeNom("JOUEUR") === "defaut");
verifier("nom illisible détecté", classeNom("XZQR") === "ecriture" && classeNom("TIM123") === "ecriture");
verifier("l'IA échappe à la vanne orthographique", classeNom("IA MOYEN") === "nom");
let residus = 0;
for (const p of PRENOMS.concat(["", "JOUEUR", "XZQR", "A"]))
  for (const ph of ["{P} rime avec {R}.", "{P}, {L} officiel.", "{G} bat {P}."])
    if (/\{[GPLR]\}/.test(habiller(ph, "TIBO", p, 3))) residus++;
verifier("aucun marqueur non substitué", residus === 0);
let stable = true;
for (let k = 0; k < 3000; k++){
  const p = PRENOMS[k % PRENOMS.length];
  if (habiller("{P}/{R}/{L}", "X", p, k % 41) !== habiller("{P}/{R}/{L}", "X", p, k % 41)) stable = false;
}
verifier("phrases identiques sur les deux écrans", stable, "3000 tirages");

/* ======================= 8. RAQUETTES ======================= */
titre("8. Rendu des raquettes");
const { eclaircir, assombrir } = new Function(
  extraire(/function eclaircir\(hex, k\)\{[\s\S]*?\n\}/, "eclaircir") + "\n" +
  extraire(/function assombrir\(hex, k\)\{[\s\S]*?\n\}/, "assombrir") +
  "\nreturn { eclaircir, assombrir };")();
const comp = s => s.match(/\d+/g).map(Number);
const haut = comp(eclaircir("#22D3EE", 0.45)), bas = comp(assombrir("#22D3EE", 0.55));
verifier("dégradé du corps orienté clair vers sombre",
  haut.every((v, i) => v > bas[i]) && haut.concat(bas).every(v => v >= 0 && v <= 255));
verifier("rendu dédié des raquettes", /function dessinerRaquette\(/.test(script));
verifier("écrasement à l'impact", /const impact = Math\.max\(0, 1 - \(performance\.now\(\) - tFlash\)/.test(script));
verifier("inclinaison bornée", /Math\.max\(-0\.13, Math\.min\(0\.13/.test(script));
const noyau = (l, c) => Math.max(0, (l - Math.min(13, l*0.16)*2 - 6) * Math.min(1, c));
verifier("noyau de charge monotone et borné",
  [62,104,168].every(l => noyau(l,0) === 0 && noyau(l,1) > 8 && noyau(l,1) < l));

/* ======================= 8bis. CHOIX D'ARÈNE ET PANNEAUX ======================= */
titre("8bis. Choix d'arène et tenue des panneaux");
verifier("sélecteur d'arène présent", /id="choixArenes"/.test(html));
verifier("arène imposée respectée dans le mélange",
  /if \(choixArene >= 0 && choixArene < ARENES\.length\)/.test(script));
verifier("choix mémorisé", /localStorage\.setItem\("duo_arene"/.test(script));
verifier("boutons construits après la définition des arènes",
  script.indexOf("const ARENES = [") < script.indexOf("initChoixArene"),
  "sinon zone morte temporelle");
{
  /* un panneau ne doit jamais dépasser le terrain sans pouvoir défiler */
  const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || "";
  const bloc = (css.match(/\.panneau\{[^}]*\}/) || [""])[0];
  verifier("panneaux défilables", /overflow-y:\s*auto/.test(bloc));
  /* hauteur estimée du panneau des vices sur le plus petit écran visé */
  const terrain = Math.min(0.92*360, (640 - 215)*0.75, 540);
  const hTerrain = terrain * 720/540;
  const hVices = 21*1.15 + 2*13 + 3*(12.5 + 2 + 2*10.5*1.35 + 18) + 2*7 + 28;
  verifier("panneau des vices tient sur petit écran",
    hVices < hTerrain, Math.round(hVices) + " px pour " + Math.round(hTerrain) + " px");
}

/* ======================= 8ter. ÉCRAN VERSUS ======================= */
titre("8ter. Écran VERSUS");
{
  const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || "";
  const flash = ((css.match(/\.vsFlash\{[^}]*\}/) || [""])[0]).replace(/\/\*[\s\S]*?\*\//g, "");
  verifier("le voile blanc ne peut pas persister",
    !/both|forwards/.test(flash) && /opacity:\s*0/.test(flash),
    "un remplissage d'animation appliquait le premier état pendant le délai");
  verifier("fond dédié au lieu d'un aplat", /\.vsFond\{/.test(css));
  verifier("plaques nominatives inclinées", /\.vsPlaque\{/.test(css));
  const bandeau = (mg, mode, arene, duels) =>
    ["AU MEILLEUR DES " + (2*mg - 1), mode.toUpperCase(), arene, duels].filter(Boolean).join(" · ");
  const exemples = [bandeau(2,"arcade","",""), bandeau(5,"classique","","DUELS A 1 — 0 B"),
                    bandeau(3,"arcade","ARÈNE LAVE","")];
  verifier("bandeau sans séparateur orphelin",
    exemples.every(t => !/·\s*$/.test(t) && !/^\s*·/.test(t) && !/·\s*·/.test(t)));
  verifier("format cohérent avec les manches gagnantes",
    [2,3,5].every(mg => Number(bandeau(mg,"a","","").match(/DES (\d+)/)[1]) === 2*mg - 1));
}

/* ======================= 8quater. STABILITÉ DE MISE EN PAGE ET FLUIDITÉ ======================= */
titre("8quater. Mise en page stable et rendu léger");
{
  const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || "";
  const hud = (css.match(/#hud\{[^}]*\}/) || [""])[0];
  const bas = (css.match(/#barreBasse\{[^}]*\}/) || [""])[0];
  verifier("hauteur du bandeau haut figée", /height:\s*\d+px/.test(hud),
    "un nom long ou un format en 5 manches décalait le terrain");
  verifier("hauteur de la barre basse figée", /height:\s*\d+px/.test(bas));
  verifier("nom tronqué plutôt que passé à la ligne",
    /#role\{[^}]*white-space:nowrap/.test(css) && /#role\{[^}]*text-overflow:ellipsis/.test(css));
  verifier("score sur une seule ligne", /#score\{[^}]*white-space:nowrap/.test(css));
  verifier("plus de texte sous le terrain", !/id="bandeau"/.test(html));
  verifier("annonces peintes dans le terrain", /function dessinerAnnonce\(/.test(script));
  verifier("flou d'ombre définitivement neutralisé",
    /function flou\(v\)\{ return 0; \}/.test(script.replace(/\s+/g, " ").replace("function flou(v){ return 0; }", "function flou(v){ return 0; }")) ||
    /return 0;/.test((script.match(/function flou\(v\)\{[^}]*\}/) || [""])[0]));
  verifier("rendu léger par défaut", /let effetsRiches = false;/.test(script));
  verifier("repli progressif : grain puis bloom",
    /if \(effetsRiches\)\{[^}]*\}\s*else if \(bloomActif\)/.test(script.replace(/\n/g, "")));
  verifier("particules plafonnées", /MAX_PARTICULES/.test(script));
}

/* ======================= 9. RÉFÉRENCES ======================= */
titre("9. Toute fonction appelée est définie");
{
  /* on retire commentaires et chaînes : sinon le moindre mot de prose
     ressemble à un appel de fonction */
  const nu = script
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ")
    /* une classe de caractères comme [<>&"'`] contient des guillemets et
       faussait l'appariement des chaînes : on la neutralise d'abord */
    .replace(/\[[^\]\n]*["'`][^\]\n]*\]/g, "[]")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/`(?:[^`\\]|\\.)*`/g, "``");
  const definies = new Set([...nu.matchAll(/function\s+(\w+)\s*\(/g)].map(m => m[1]));
  [...nu.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|\w+)\s*=>/g)]
    .forEach(m => definies.add(m[1]));
  [...nu.matchAll(/(\w+)\s*:\s*(?:async\s*)?(?:function|\([^)]*\)\s*=>)/g)]
    .forEach(m => definies.add(m[1]));
  /* une variable peut recevoir une fonction (graine() en renvoie une), et un
     paramètre aussi (le « fini » des promesses) : on les reconnaît également */
  [...nu.matchAll(/(?:const|let|var)\s+(\w+)\s*=/g)].forEach(m => definies.add(m[1]));
  [...nu.matchAll(/function\s*\w*\s*\(([^)]*)\)/g)]
    .forEach(m => m[1].split(",").forEach(a => { const n = a.trim().split(/[=\s]/)[0]; if (n) definies.add(n); }));
  [...nu.matchAll(/\(([^)]*)\)\s*=>/g)]
    .forEach(m => m[1].split(",").forEach(a => { const n = a.trim().split(/[=\s]/)[0]; if (n) definies.add(n); }));
  [...nu.matchAll(/(?:^|[^\w.])(\w+)\s*=>/g)].forEach(m => definies.add(m[1]));
  const NATIF = new Set(["if","for","while","switch","catch","return","typeof","function","new",
    "Math","JSON","Object","Array","String","Number","Boolean","Date","Promise","Set","Map",
    "parseInt","parseFloat","isFinite","isNaN","setTimeout","setInterval","clearTimeout",
    "clearInterval","requestAnimationFrame","fetch","Peer","Image","Audio","Blob","URL",
    "MediaRecorder","AudioContext","RTCPeerConnection","AbortSignal","Uint8ClampedArray",
    "console","localStorage","navigator","document","window","performance","location","eval",
    "async","await","of","in","do","else","try","delete","void","instanceof"]);
  const appelees = new Set([...nu.matchAll(/(?:^|[^.\w$])(\w+)\s*\(/g)].map(m => m[1]));
  const manquantes = [...appelees].filter(n =>
    !definies.has(n) && !NATIF.has(n) && !/^[A-Z_]+$/.test(n) && isNaN(Number(n)));
  verifier("aucune fonction appelée sans définition",
    manquantes.length === 0,
    manquantes.length ? "manquantes : " + manquantes.join(", ") : definies.size + " fonctions définies");
}

/* ======================= 10. PIÈGES CONNUS ======================= */
titre("10. Pièges déjà rencontrés (non-régression)");
verifier("aucun test de véracité sur un index de joueur",
  !/(if|while)\s*\(\s*!?\s*(gagnant|joueur|frappeur|recapGagnant)\s*\)/.test(script),
  "le joueur 0 est falsy en JavaScript");
verifier("immunité des blocs sans dépendance à un horodatage nul",
  !/!o\.tImpact\s*\|\|/.test(script));
verifier("pas de code mort après un return", !/return;\s*\/\* ancienne version/.test(script));
verifier("aucun flou d'ombre direct",
  !/ctx\.shadowBlur = (?!flou\()/.test(script),
  "tous les appels passent par flou(), qui renvoie 0");
verifier("traînée : plafond d'empilement au-dessus de la longueur voulue",
  /tr\.length > 24/.test(script) && /\? 20 : 13/.test(script));

/* ======================= RÉSULTAT ======================= */
console.log("\n" + "=".repeat(52));
console.log("réussis : " + reussis + "   échoués : " + echoues);
console.log("=".repeat(52));
process.exit(echoues ? 1 : 0);
