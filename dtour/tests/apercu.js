#!/usr/bin/env node
/* Rend quelques images du jeu HORS navigateur, pour les regarder.
   Le script d'index.html est exécuté tel quel sur un décor DOM minimal
   dont le canevas est un vrai canevas (node-canvas). On peut donc
   contrôler le cadrage, l'échelle des personnages, le bras peint et la
   lisibilité de l'alerte sans lancer de navigateur.

   Usage : node tests/apercu.js <dossier-png> <dossier-sortie>
   Les PNG sont les mêmes images que img/, converties : node-canvas ne
   lit pas le WebP.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { createCanvas, loadImage } = require("canvas");

const RACINE = path.join(__dirname, "..");
const PNG = process.argv[2] || "/tmp/apngs";
const SORTIE = process.argv[3] || "/tmp/apercu";
fs.mkdirSync(SORTIE, { recursive:true });

const html = fs.readFileSync(path.join(RACINE, "index.html"), "utf8");
const source = html.match(/<script>\n([\s\S]*?)\n<\/script>/)[1];

function decor(L, H){
  const canevas = createCanvas(L, H);
  const fait = new Map();
  const elem = id => {
    if (fait.has(id)) return fait.get(id);
    const e = {
      id, textContent:"", value:"100", style:{}, dataset:{}, offsetWidth:0, src:"",
      clientWidth:L, clientHeight:H, width:L, height:H,
      classList:{ _s:new Set(), add(...c){ c.forEach(x => this._s.add(x)); },
        remove(...c){ c.forEach(x => this._s.delete(x)); },
        toggle(c, v){ v ? this._s.add(c) : this._s.delete(c); },
        contains(c){ return this._s.has(c); } },
      addEventListener(){}, focus(){}, appendChild(){},
      querySelectorAll(){ return []; }, querySelector(){ return null; }, closest(){ return null; },
    };
    if (id === "cv"){
      e.getContext = t => canevas.getContext(t);
      Object.defineProperty(e, "width", { get:() => canevas.width, set:v => { canevas.width = v; } });
      Object.defineProperty(e, "height", { get:() => canevas.height, set:v => { canevas.height = v; } });
    }
    fait.set(id, e); return e;
  };
  const stock = {};
  const bac = {
    document:{
      readyState:"complete", hidden:false, getElementById:elem,
      createElement:t => (t === "canvas" ? createCanvas(8, 8) : elem("_t" + Math.random())),
      addEventListener(){},
    },
    localStorage:{ getItem:k => (k in stock ? stock[k] : null), setItem:(k, v) => { stock[k] = String(v); } },
    requestAnimationFrame:() => 0, cancelAnimationFrame(){},
    devicePixelRatio:1, innerWidth:L, innerHeight:H,
    location:{ search:"", hostname:"apercu" },
    performance:{ now:() => Date.now() },
    addEventListener(){}, console, setTimeout, clearTimeout, setInterval, clearInterval,
    Image:class{ set src(v){ if (this.onerror) this.onerror(); } },
  };
  bac.globalThis = bac; bac.window = bac;
  return { bac, canevas, elem };
}

async function preparer(L, H){
  const { bac, canevas } = decor(L, H);
  vm.createContext(bac);
  new vm.Script(source, { filename:"jeu" }).runInContext(bac);
  const D = bac.DTOUR;

  /* on remplit la table d'images à la main, avec de vraies images */
  for (const f of fs.readdirSync(PNG)){
    if (!f.endsWith(".png")) continue;
    const img = await loadImage(path.join(PNG, f));
    D.Images.table[f.slice(0, -4)] = img;
  }
  D.Images.pret = true;

  /* relevé des teintes et des ancres : la fonction du jeu passe par
     document.createElement("canvas"), qui est un vrai canevas ici */
  const relever = new Function("D", "return null;");
  void relever;
  for (const [nom, img] of Object.entries(D.Images.table)){
    if (!/^(pnj|thibaut|pierre)/.test(nom)) continue;
    releverIci(D, nom, img);
  }
  return { D, canevas };
}

/* Même calcul que releverTeintes() du jeu, refait ici parce que la
   fonction n'est pas exportée. Si les deux divergent, l'aperçu le
   montrera tout de suite : les bras seront de la mauvaise couleur. */
function releverIci(D, nom, img){
  const c = createCanvas(img.width, img.height);
  const x = c.getContext("2d");
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data;
  const lire = (fx, fy) => {
    const px = Math.floor(c.width * fx), py = Math.floor(c.height * fy);
    const i = (py * c.width + px) * 4;
    return [d[i], d[i + 1], d[i + 2], d[i + 3]];
  };
  let peau = [232, 178, 142], mieux = -1;
  for (let fy = 0.06; fy <= 0.22; fy += 0.02){
    for (let fx = 0.3; fx <= 0.7; fx += 0.05){
      const p = lire(fx, fy);
      if (p[3] < 200) continue;
      const note = p[0] - p[2];
      if (p[0] > 120 && p[0] >= p[1] && p[1] >= p[2] && note > 22 && note > mieux){ mieux = note; peau = [p[0], p[1], p[2]]; }
    }
  }
  const chair = p => p[0] > 120 && p[0] >= p[1] && p[1] >= p[2] && (p[0] - p[2]) > 30;
  let manche = null, fonce = 1e9;
  for (const fx of [0.50, 0.42, 0.58, 0.36, 0.64, 0.46, 0.54]){
    for (const fy of [0.34, 0.40, 0.30]){
      const p = lire(fx, fy);
      if (p[3] < 210 || chair(p)) continue;
      const somme = p[0] + p[1] + p[2];
      if (somme < fonce){ fonce = somme; manche = [p[0], p[1], p[2]]; }
    }
  }
  if (!manche) manche = lire(0.5, 0.36).slice(0, 3);
  const fiche = {
    peau:"rgb(" + peau.join(",") + ")",
    peauOmbre:"rgb(" + peau.map(v => Math.round(v * 0.82)).join(",") + ")",
    manche:"rgb(" + manche.join(",") + ")",
    mancheOmbre:"rgb(" + manche.map(v => Math.round(v * 0.72)).join(",") + ")",
    ancre:0.5,
  };
  const opaque = (px, py) => d[(py * c.width + px) * 4 + 3] > 120;
  let xg = c.width, xd = -1;
  for (let py = Math.floor(c.height * 0.82); py < c.height; py++){
    for (let px = 0; px < c.width; px++){ if (opaque(px, py)){ if (px < xg) xg = px; if (px > xd) xd = px; } }
  }
  if (xd >= 0) fiche.ancre = (xg + xd) / 2 / c.width;
  if (nom.endsWith("_tendue")){
    let mx = -1, my = 0, n = 0;
    for (let px = c.width - 1; px >= 0 && mx < 0; px--){
      for (let py = 0; py < Math.floor(c.height * 0.72); py++){ if (opaque(px, py)){ mx = px; my += py; n++; } }
    }
    if (mx >= 0){
      const lm = D.H_PERSO * c.width / c.height;
      fiche.mainX = (mx / c.width - fiche.ancre) * lm;
      fiche.mainY = -(1 - (my / Math.max(1, n)) / c.height) * D.H_PERSO;
    }
  }
  D.Images.teintes[nom] = fiche;
}

function ecrire(canevas, nom){
  const p = path.join(SORTIE, nom + ".png");
  fs.writeFileSync(p, canevas.toBuffer("image/png"));
  console.log("  " + p);
}

/* Fait tourner la partie jusqu'à ce qu'une demande soit ouverte, en
   répondant juste, pour photographier un moment de jeu réaliste. */
function jouerJusqua(D, condition, limite){
  let n = 0;
  while (n++ < (limite || 60 * 300)){
    D.Jeu.pas(1 / 60);
    if (condition(D)) return true;
    const dem = D.Jeu.demandes[0];
    if (dem && dem.attente > dem.tReaction * 0.5) D.Jeu.saluer(dem.cible);
  }
  return false;
}

(async () => {
  console.log("Aperçus :");

  /* 1. écran titre, format bureau */
  {
    const { D, canevas } = await preparer(1280, 720);
    D.amorcer();
    D.Jeu.retourTitre();
    D.Camera.mesurer(1280, 720, 1); D.Camera.recaler();
    for (let i = 0; i < 60; i++) D.Jeu.pas(1 / 60);
    D.Camera.recaler();
    dessinerVia(D, canevas);
    ecrire(canevas, "1_titre_1280");
  }

  /* 2. jour, une main tendue vers Thibaut */
  {
    const { D, canevas } = await preparer(1280, 720);
    D.amorcer(); D.Jeu.demarrer();
    D.Camera.mesurer(1280, 720, 1); D.Camera.recaler();
    jouerJusqua(D, () => false, 60 * 8);
    const p = D.Foule.arriver("SIMPLE");
    p.x = D.xSalut(0);
    D.Foule.ouvrirDemande(p, 0);
    for (let i = 0; i < 22; i++) D.Jeu.pas(1 / 60);
    dessinerVia(D, canevas);
    ecrire(canevas, "2_jour_thibaut_1280");
  }

  /* 3. jour, une main tendue vers Pierre-François */
  {
    const { D, canevas } = await preparer(1280, 720);
    D.amorcer(); D.Jeu.demarrer();
    D.Camera.mesurer(1280, 720, 1); D.Camera.recaler();
    const p = D.Foule.arriver("SIMPLE");
    p.x = D.xSalut(1);
    D.Foule.ouvrirDemande(p, 1);
    for (let i = 0; i < 22; i++) D.Jeu.pas(1 / 60);
    dessinerVia(D, canevas);
    ecrire(canevas, "3_jour_pierre_1280");
  }

  /* 4. le soir, file moyenne, poignée de main en cours */
  {
    const { D, canevas } = await preparer(1280, 720);
    D.amorcer(); D.Jeu.demarrer();
    D.Camera.mesurer(1280, 720, 1);
    D.File.gonfler(9);
    D.Score.saluts = 30; D.Jeu.moment = 1; D.Jeu.fonduDe = 1; D.Jeu.fondu = 1;
    D.Camera.recaler();
    const p = D.Foule.arriver("SIMPLE");
    p.x = D.xSalut(1);
    D.Foule.ouvrirDemande(p, 1);
    for (let i = 0; i < 30; i++) D.Jeu.pas(1 / 60);
    D.Jeu.saluer(1);
    for (let i = 0; i < 6; i++) D.Jeu.pas(1 / 60);
    dessinerVia(D, canevas);
    ecrire(canevas, "4_soir_poignee_1280");
  }

  /* 5. la nuit, file très longue : le débordement doit se lire */
  {
    const { D, canevas } = await preparer(1280, 720);
    D.amorcer(); D.Jeu.demarrer();
    D.Camera.mesurer(1280, 720, 1);
    D.File.gonfler(46);
    D.Score.saluts = 60; D.Score.points = 24800; D.Score.combo = 12;
    D.Jeu.moment = 2; D.Jeu.fonduDe = 2; D.Jeu.fondu = 1;
    D.Camera.recaler();
    const p = D.Foule.arriver("SIMPLE");
    p.x = D.xSalut(0);
    D.Foule.ouvrirDemande(p, 0);
    for (let i = 0; i < 24; i++) D.Jeu.pas(1 / 60);
    dessinerVia(D, canevas);
    ecrire(canevas, "5_nuit_longue_1280");
  }

  /* 6. iPhone en paysage */
  {
    const { D, canevas } = await preparer(844, 318);
    D.amorcer(); D.Jeu.demarrer();
    D.Camera.mesurer(844, 318, 1);
    D.File.gonfler(7);
    D.Score.saluts = 24; D.Jeu.moment = 1; D.Jeu.fonduDe = 1; D.Jeu.fondu = 1;
    D.Camera.recaler();
    const p = D.Foule.arriver("SIMPLE");
    p.x = D.xSalut(0);
    D.Foule.ouvrirDemande(p, 0);
    for (let i = 0; i < 24; i++) D.Jeu.pas(1 / 60);
    dessinerVia(D, canevas);
    ecrire(canevas, "6_iphone_paysage_844");
  }

  /* 7. iPhone en portrait */
  {
    const { D, canevas } = await preparer(390, 750);
    D.amorcer(); D.Jeu.demarrer();
    D.Camera.mesurer(390, 750, 1);
    D.File.gonfler(5);
    D.Camera.recaler();
    const p = D.Foule.arriver("SIMPLE");
    p.x = D.xSalut(1);
    D.Foule.ouvrirDemande(p, 1);
    for (let i = 0; i < 24; i++) D.Jeu.pas(1 / 60);
    dessinerVia(D, canevas);
    ecrire(canevas, "7_iphone_portrait_390");
  }

  /* 9. niveau 2 : l'appartement */
  {
    const { D, canevas } = await preparer(1280, 620);
    D.amorcer();
    D.Camera.mesurer(1280, 620, 1);
    D.Jeu.demarrer(2); D.Intro.finir();
    const z = D.Enquete.zones.findIndex(x => x.ref.id === "table");
    D.Enquete.actifIns().x = D.Enquete.zones[z].ref.pied;
    for (let i = 0; i < 30; i++) D.Jeu.pas(1 / 60);
    dessinerVia(D, canevas);
    ecrire(canevas, "9_enquete_1280");
  }
  {
    const { D, canevas } = await preparer(844, 318);
    D.amorcer();
    D.Camera.mesurer(844, 318, 1);
    D.Jeu.demarrer(2); D.Intro.finir();
    const z = D.Enquete.zones.findIndex(x => x.ref.id === "canape");
    D.Enquete.actifIns().x = D.Enquete.zones[z].ref.pied;
    D.Enquete.indices = 3;
    for (let i = 0; i < 30; i++) D.Jeu.pas(1 / 60);
    D.Enquete.inspecter();
    for (let i = 0; i < 50; i++) D.Jeu.pas(1 / 60);
    dessinerVia(D, canevas);
    ecrire(canevas, "10_enquete_844");
  }

  /* 14. un passant qui traverse et qui parle */
  {
    const { D, canevas } = await preparer(844, 318);
    D.amorcer(); D.Camera.mesurer(844, 318, 1);
    D.Jeu.demarrer(2); D.Intro.finir();
    D.Enquete.actifIns().x = 0.42; D.Enquete.autreIns().x = 0.37;
    for (let i = 0; i < 30; i++) D.Jeu.pas(1 / 60);
    D.Visiteurs.declencher();
    D.Visiteurs.qui = D.VISITEURS.find(v => v.id === "francky") || D.Visiteurs.qui;
    let n = 0;
    while (D.Visiteurs.etat !== "PARLE" && n++ < 60 * 20) D.Jeu.pas(1 / 60);
    for (let i = 0; i < 40; i++) D.Jeu.pas(1 / 60);
    dessinerVia(D, canevas);
    ecrire(canevas, "14_visiteur_844");
  }

  /* 13. pendant l'introduction : le décor seul, rien qui plante */
  {
    const { D, canevas } = await preparer(844, 318);
    D.amorcer(); D.Camera.mesurer(844, 318, 1);
    D.Jeu.demarrer(2);
    /* au troisième temps : Pierre-François est entré, Thibaut arrive */
    for (let i = 0; i < 60 * 7.2; i++){ D.Jeu.pas(1 / 60); }
    D.__dessiner();
    ecrire(canevas, "13_intro_844");
  }

  /* 12. face à un suspect, nom affiché */
  {
    const { D, canevas } = await preparer(844, 318);
    D.amorcer(); D.Camera.mesurer(844, 318, 1);
    D.Jeu.demarrer(2); D.Intro.finir();
    D.Enquete.actifIdx = D.Heros.findIndex(h => h.sprite === "thibaut");
    const cible = D.SUSPECTS.find(s => s.id === "charles") || D.SUSPECTS[0];
    D.Enquete.actifIns().x = cible.x - 0.02;
    D.Enquete.autreIns().x = cible.x - 0.07;
    for (let i = 0; i < 30; i++) D.Jeu.pas(1 / 60);
    D.Enquete.parler();
    /* assez tard pour que la question ET la réponse soient à l'écran */
    for (let i = 0; i < 90; i++) D.Jeu.pas(1 / 60);
    dessinerVia(D, canevas);
    ecrire(canevas, "12_suspect_844");
  }

  /* 11. la liste d'accusation */
  {
    const { D, canevas } = await preparer(844, 318);
    D.amorcer(); D.Camera.mesurer(844, 318, 1);
    D.Jeu.demarrer(2); D.Intro.finir();
    D.Enquete.indices = 5;
    D.Enquete.pizza = { t:1, zone:0 };
    D.Enquete.ouvrirAccusation();
    D.Jeu.pas(1 / 60);
    dessinerVia(D, canevas);
    ecrire(canevas, "11_accusation_844");
  }

  /* 8. le malaise : main qui se retire, sueur */
  {
    const { D, canevas } = await preparer(1280, 720);
    D.amorcer(); D.Jeu.demarrer();
    D.Camera.mesurer(1280, 720, 1);
    D.File.gonfler(5); D.Camera.recaler();
    const p = D.Foule.arriver("SIMPLE");
    p.x = D.xSalut(0);
    D.Foule.ouvrirDemande(p, 0);
    p.chrono = 0.02;
    for (let i = 0; i < 26; i++) D.Jeu.pas(1 / 60);
    dessinerVia(D, canevas);
    ecrire(canevas, "8_malaise_1280");
  }

  /* 13. niveau 3 : le choix du champion */
  {
    const { D, canevas } = await preparer(844, 318);
    D.amorcer(); D.Camera.mesurer(844, 318, 1);
    D.Jeu.demarrer(3);
    D.Jeu.pas(1 / 60);
    dessinerVia(D, canevas);
    ecrire(canevas, "13_bar_choix_844");
  }

  /* 14. niveau 3 : en pleine tournée — un cocktail servi, une eau posée */
  {
    const { D, canevas } = await preparer(844, 318);
    D.amorcer(); D.Camera.mesurer(844, 318, 1);
    D.Jeu.demarrer(3);
    D.Tournee.lancer();
    D.Tournee.x = 0.42; D.Tournee.combo = 4; D.Tournee.ambiance = 55;
    D.Score.points = 1240;
    D.Tournee.verres.push({ type:"cocktail", x:0.34, etat:D.ETAT_VERRE.POSE, t:1.4, vie:7.5, barman:"francky" });
    D.Tournee.verres.push({ type:"eau", x:0.60, etat:D.ETAT_VERRE.POSE, t:4.8, vie:7.5, barman:"jojo" });
    D.Tournee.barmans[0].etat = "prepare"; D.Tournee.barmans[0].t = 0.9;
    D.Tournee.barmans[0].duree = 1.8; D.Tournee.barmans[0].type = "cocktail";
    D.Tournee.barmans[0].pose = "bar_francky_shake";
    D.Tournee.marche = 1; D.Tournee.dir = 1;
    for (let i = 0; i < 8; i++) D.Jeu.pas(1 / 60);
    D.Tournee.dire("PARFAIT !  +200", 1.4);
    dessinerVia(D, canevas);
    ecrire(canevas, "14_bar_tournee_844");
  }

  /* 15. niveau 3 : pompette au milieu des verres qui traînent */
  {
    const { D, canevas } = await preparer(844, 318);
    D.amorcer(); D.Camera.mesurer(844, 318, 1);
    D.Jeu.demarrer(3);
    D.Tournee.lancer();
    D.Tournee.x = 0.42; D.Tournee.temps = 40; D.Tournee.bourre = 4.5;
    D.Score.points = 2380; D.Tournee.combo = 6; D.Tournee.ambiance = 70;
    for (const [t, x] of [["cocktail", 0.30], ["jager", 0.36], ["eau", 0.47], ["cocktail", 0.52]]){
      D.Tournee.verres.push({ type:t, x, etat:D.ETAT_VERRE.TRAINE, t:9, vie:7.5, barman:"francky" });
    }
    D.Tournee.verres.push({ type:"jager", x:0.56, etat:D.ETAT_VERRE.POSE, t:2, vie:7.5, barman:"jojo" });
    D.Tournee.dire("POMPETTE !", 2.0);
    D.Tournee.clients = [
      { ref:D.BAR_CLIENTS[1], x:0.30, dir:1, etat:"prend", t:0.3, cible:0.3, verre:null },
      { ref:D.BAR_CLIENTS[2], x:0.62, dir:-1, etat:"attend", t:1, cible:0.62, verre:null },
    ];
    D.Camera.xBar = 0; 
    for (let i = 0; i < 30; i++) D.Camera.suivreBar(D.Tournee.x, 1 / 30);
    dessinerVia(D, canevas);
    ecrire(canevas, "15_bar_pompette_844");
  }

  /* 16. niveau 3 : lumières du comptoir, projecteur sur un verre neuf */
  {
    const { D, canevas } = await preparer(844, 318);
    D.amorcer(); D.Camera.mesurer(844, 318, 1);
    D.Jeu.demarrer(3);
    D.Tournee.lancer();
    D.Tournee.x = 0.50; D.Tournee.temps = 55; D.Tournee.combo = 7;
    D.Tournee.ambiance = 82; D.Score.points = 4120;
    D.Tournee.verres.push({ type:"cocktail", x:0.44, etat:D.ETAT_VERRE.POSE, t:0.3, vie:7.5, barman:"francky" });
    D.Tournee.verres.push({ type:"eau", x:0.57, etat:D.ETAT_VERRE.POSE, t:1.0, vie:7.5, barman:"jojo" });
    D.Tournee.verres.push({ type:"jager", x:0.63, etat:D.ETAT_VERRE.TRAINE, t:9, vie:7.5, barman:"jojo" });
    D.Tournee.clients = [{ ref:D.BAR_CLIENTS[0], x:0.63, dir:1, etat:"prend", t:0.3, cible:0.63, verre:null }];
    D.Tournee.marche = 1; D.Tournee.dureeMarche = 1.2; D.Tournee.flash = 0.12;
    for (let i = 0; i < 20; i++) D.Camera.suivreBar(D.Tournee.x, 1 / 30);
    dessinerVia(D, canevas);
    ecrire(canevas, "16_bar_lumieres_844");
  }

  /* 17. niveau 3 : Francky en pleine préparation, le maire se sert,
         Hortense s'arrête avec sa tarte */
  {
    const { D, canevas } = await preparer(844, 318);
    D.amorcer(); D.Camera.mesurer(844, 318, 1);
    D.Jeu.demarrer(3);
    D.Tournee.lancer();
    D.Tournee.x = 0.52; D.Tournee.temps = 48; D.Tournee.combo = 3;
    D.Tournee.ambiance = 64; D.Score.points = 2960;
    const fr = D.Tournee.barmans[0];
    fr.etat = "prepare"; fr.type = "cocktail"; fr.duree = 2.0; fr.t = 1.3;
    fr.pose = fr.ref.prepare[3];
    const jo = D.Tournee.barmans[1];
    jo.etat = "prepare"; jo.type = "eau"; jo.duree = 1.35; jo.t = 0.6;
    jo.pose = jo.ref.poses.eau;
    D.Tournee.verres.push({ type:"jager", x:0.62, etat:D.ETAT_VERRE.POSE, t:5.2, vie:7.5, barman:"jojo" });
    const maire = D.BAR_CLIENTS.find(c => c.prefixe);
    D.Tournee.clients = [{ ref:maire, x:0.62, dir:1, etat:"prend", t:0.42, cible:0.62, verre:null, foulee:0, verreEnMain:false }];
    D.Tournee.invite = { qui:"hortense", x:0.44, dir:1, t:1, pause:1.2, foulee:0 };
    for (let i = 0; i < 20; i++) D.Camera.suivreBar(D.Tournee.x, 1 / 30);
    dessinerVia(D, canevas);
    ecrire(canevas, "17_bar_figurants_844");
  }
})();

/* dessiner() n'est pas exporté : on le rejoint par la boucle du jeu,
   qui l'appelle. Plus simple : on rappelle la même passe de rendu en
   passant par le point d'entrée public. */
function dessinerVia(D, canevas){
  void canevas;
  D.__dessiner();
}
