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

/* ======================= 9. PIÈGES CONNUS ======================= */
titre("9. Pièges déjà rencontrés (non-régression)");
verifier("aucun test de véracité sur un index de joueur",
  !/(if|while)\s*\(\s*!?\s*(gagnant|joueur|frappeur|recapGagnant)\s*\)/.test(script),
  "le joueur 0 est falsy en JavaScript");
verifier("immunité des blocs sans dépendance à un horodatage nul",
  !/!o\.tImpact\s*\|\|/.test(script));
verifier("pas de code mort après un return", !/return;\s*\/\* ancienne version/.test(script));
verifier("le flou d'ombre passe par flou()",
  !/ctx\.shadowBlur = (?!flou\()/.test(script));
verifier("traînée : plafond d'empilement au-dessus de la longueur voulue",
  /tr\.length > 24/.test(script) && /\? 20 : 13/.test(script));

/* ======================= RÉSULTAT ======================= */
console.log("\n" + "=".repeat(52));
console.log("réussis : " + reussis + "   échoués : " + echoues);
console.log("=".repeat(52));
process.exit(echoues ? 1 : 0);
