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
let source = html.match(/<script>\n([\s\S]*?)\n<\/script>/)[1];
/* ALPHA=0.62 node tests/apercu.js — rejoue tout le harnais avec une
   autre opacité de commandes. La seule façon de juger la valeur est de
   la voir SUR le décor : sur fond uni, elles se valent toutes. */
if (process.env.ALPHA) source = source.replace("const CMD_REPOS = 0.45", "const CMD_REPOS = " + process.env.ALPHA);

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

  return { D, canevas };
}

/* Le calcul des teintes et le bras peint ont disparu en v6.15. Cette
   copie du calcul vivait ici parce que la fonction du jeu n'était pas
   exportée : deux implémentations du même relevé, qui ne pouvaient que
   divorcer. Elles sont parties ensemble. */
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
    D.Tournee.x = 0.24;
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

  /* 22. niveau 4 : la ruelle en portrait, un ennemi à cinq profondeurs
         sur les cinq couloirs. C'est la scène qui décide si la fausse
         profondeur tient : les silhouettes doivent grossir vite en
         approchant, et les lointaines rester minuscules. */
  {
    const { D, canevas } = await preparer(420, 840);
    D.amorcer(); D.Camera.mesurer(420, 840, 1);
    const ctx = canevas.getContext("2d");
    const fond = D.Images.table.ruelle;
    /* le décor couvre l'écran, ancré en bas */
    const s2 = Math.max(420 / fond.naturalWidth, 840 / fond.naturalHeight);
    ctx.drawImage(fond, (420 - fond.naturalWidth * s2) / 2,
      840 - fond.naturalHeight * s2, fond.naturalWidth * s2, fond.naturalHeight * s2);
    const essais = [[0.02, 2], [0.20, 0], [0.42, 4], [0.68, 1], [0.95, 3]];
    /* du plus lointain au plus proche : l'ordre de rendu suit Z */
    for (const [z, couloir] of essais){
      const p = D.Perspective.projeter(z, couloir);
      const spr = D.Images.table["enn_depar_run" + (1 + Math.floor(z * 6) % 6)];
      const h = p.hauteur, l = h * spr.naturalWidth / spr.naturalHeight;
      ctx.drawImage(spr, p.x - l / 2, p.y - h, l, h);
    }
    ecrire(canevas, "22_ruelle_420");
  }

  /* 23-26. LE NIVEAU 4, dans ses quatre situations. Ces scènes existent
     parce que la règle en dur de MEMOIRE.md l'exige : aucune
     modification visuelle ne part sans qu'on ait ouvert une image. */
  {
    const { D, canevas } = await preparer(390, 780);
    D.amorcer(); D.Camera.mesurer(390, 780, 1);
    D.Jeu.demarrer(4); D.Ruelle.introT = 1.6;
    D.RuelleVue.dessiner(); D.RuelleVue.dessinerIntro();
    ecrire(canevas, "23_ruelle_intro");
  }
  {
    const { D, canevas } = await preparer(390, 780);
    D.amorcer(); D.Camera.mesurer(390, 780, 1);
    D.Jeu.demarrer(4); D.Ruelle.introT = 0;
    for (let k = 0; k < 3; k++) D.Ruelle.ajouterEnnemi();
    D.Ruelle.ennemis.forEach((e, k) => { e.z = [0.28, 0.58, 0.86][k]; e.couloir = [1, 3, 2][k]; e.frame = k; });
    D.Ruelle.ennemis[1].pv = 90;
    D.Score.points = 1660; D.Ruelle.barricade = 74; D.Ruelle.vague = 2; D.Ruelle.aSortir = 6;
    D.Ruelle.heros[0].balles = 4;
    D.Ruelle.viseur = { x:0.52, y:0.40 };
    D.Ruelle.manche = { actif:true, id:1, dx:0.35, dy:-0.5 };
    D.Ruelle.secousse = 0;
    D.RuelleVue.dessiner();
    ecrire(canevas, "24_ruelle_jeu");
  }
  {
    /* le rechargement : l'un s'accroupit, l'autre couvre et le dit */
    const { D, canevas } = await preparer(390, 780);
    D.amorcer(); D.Camera.mesurer(390, 780, 1);
    D.Jeu.demarrer(4); D.Ruelle.introT = 0;
    D.Ruelle.ajouterEnnemi(); D.Ruelle.ennemis[0].z = 0.62;
    D.Ruelle.heros[0].balles = 0; D.Ruelle.heros[0].recharge = 1.0;
    D.Ruelle.pas(1 / 60);
    D.Ruelle.heros[1].repos = 0.20;
    D.Ruelle.flashes.push({ t:0.13, duree:0.13, heros:1 });
    D.Ruelle.secousse = 0;
    D.RuelleVue.dessiner();
    ecrire(canevas, "25_ruelle_releve");
  }
  {
    /* à couvert : les deux accroupis, plus personne ne tire */
    const { D, canevas } = await preparer(390, 780);
    D.amorcer(); D.Camera.mesurer(390, 780, 1);
    D.Jeu.demarrer(4); D.Ruelle.introT = 0;
    D.Ruelle.ajouterEnnemi(); D.Ruelle.ennemis[0].z = 0.80;
    D.Ruelle.couvert = true; D.Ruelle.barricade = 28; D.Ruelle.secousse = 0;
    D.RuelleVue.dessiner();
    ecrire(canevas, "26_ruelle_couvert");
  }

  /* 28-29. le jet de Depardiahree : l'alerte pendant la préparation,
     puis la bouteille en vol. Ce sont les deux instants que le joueur
     doit lire, donc les deux qu'il faut regarder. */
  {
    const { D, canevas } = await preparer(390, 780);
    D.amorcer(); D.Camera.mesurer(390, 780, 1);
    D.Jeu.demarrer(4); D.Ruelle.introT = 0;
    D.Ruelle.ennemis.length = 0; D.Ruelle.aSortir = 4;
    D.Ruelle.ajouterEnnemi();
    const e = D.Ruelle.ennemis[0];
    e.z = 0.52; e.couloir = 2; e.attente = 0.02;
    for (let k = 0; k < 80; k++) D.Ruelle.pas(1 / 60);   /* jusqu'à "arme" */
    D.Ruelle.secousse = 0;
    D.RuelleVue.dessiner();
    ecrire(canevas, "28_depar_alerte");
  }
  {
    const { D, canevas } = await preparer(390, 780);
    D.amorcer(); D.Camera.mesurer(390, 780, 1);
    D.Jeu.demarrer(4); D.Ruelle.introT = 0;
    D.Ruelle.ennemis.length = 0; D.Ruelle.aSortir = 4;
    D.Ruelle.ajouterEnnemi();
    const e = D.Ruelle.ennemis[0];
    e.z = 0.52; e.couloir = 2; e.attente = 0.02;
    /* on avance jusqu'à mi-vol : la bouteille est haute et déjà grosse */
    for (let k = 0; k < 130; k++) D.Ruelle.pas(1 / 60);
    D.Ruelle.secousse = 0;
    D.RuelleVue.dessiner();
    ecrire(canevas, "29_depar_bouteille");
  }

  /* 30. l'éclat sur les caisses, à couvert : c'est l'image qui dit au
     joueur qu'il s'en est sorti. Du bois quand on était couvert, du vin
     quand on a encaissé. */
  {
    const { D, canevas } = await preparer(390, 780);
    D.amorcer(); D.Camera.mesurer(390, 780, 1);
    D.Jeu.demarrer(4); D.Ruelle.introT = 0;
    D.Ruelle.ennemis.length = 0; D.Ruelle.aSortir = 4;
    D.Ruelle.ajouterEnnemi();
    const e = D.Ruelle.ennemis[0];
    e.z = 0.52; e.couloir = 2; e.attente = 0.02;
    D.Ruelle.couvert = true;
    for (let k = 0; k < 175; k++) D.Ruelle.pas(1 / 60);
    D.Ruelle.secousse = 0;
    D.RuelleVue.dessiner();
    ecrire(canevas, "30_depar_eclat_couvert");
  }

  /* 31-33. DSKKK : la garde qui avance, le tir bloqué, et le moment où
     elle casse. Ce sont les trois instants de sa mécanique. */
  {
    const { D, canevas } = await preparer(390, 780);
    D.amorcer(); D.Camera.mesurer(390, 780, 1);
    D.Jeu.demarrer(4); D.Ruelle.introT = 0;
    D.Ruelle.ennemis.length = 0; D.Ruelle.aSortir = 3;
    const ref = D.ENNEMIS.dsk;
    const faire = (z, couloir, etat) => {
      D.Ruelle.ennemis.push({ ref, pv:ref.pv, pvMax:ref.pv, couloir, z,
        vitesse:ref.vitesse, etat, frame:0, tFrame:0, tEtat:0, mort:0,
        touche:null, usure:0, attente:0, usureGarde:0, attenteGarde:999 });
      return D.Ruelle.ennemis[D.Ruelle.ennemis.length - 1];
    };
    faire(0.34, 0, "garde");
    faire(0.60, 3, "garde");
    faire(0.78, 2, "course");
    D.Ruelle.blocages.push({ x:390 * 0.52, y:780 * 0.40, t:0.08 });
    D.Ruelle.secousse = 0;
    D.RuelleVue.dessiner();
    ecrire(canevas, "31_dsk_garde_et_blocage");
  }
  {
    const { D, canevas } = await preparer(390, 780);
    D.amorcer(); D.Camera.mesurer(390, 780, 1);
    D.Jeu.demarrer(4); D.Ruelle.introT = 0;
    D.Ruelle.ennemis.length = 0; D.Ruelle.aSortir = 3;
    const ref = D.ENNEMIS.dsk;
    D.Ruelle.ennemis.push({ ref, pv:ref.pv * 0.5, pvMax:ref.pv, couloir:2, z:0.66,
      vitesse:ref.vitesse, etat:"sonne", frame:0, tFrame:0, tEtat:0.3, mort:0,
      touche:null, usure:0, attente:0, usureGarde:0, attenteGarde:999 });
    D.Ruelle.secousse = 0;
    D.RuelleVue.dessiner();
    ecrire(canevas, "32_dsk_sonne");
  }
  {
    const { D, canevas } = await preparer(390, 780);
    D.amorcer(); D.Camera.mesurer(390, 780, 1);
    D.Jeu.demarrer(4); D.Ruelle.introT = 0;
    D.Ruelle.ennemis.length = 0; D.Ruelle.aSortir = 3;
    const ref = D.ENNEMIS.dsk;
    D.Ruelle.ennemis.push({ ref, pv:ref.pv, pvMax:ref.pv, couloir:2, z:0.95,
      vitesse:ref.vitesse, etat:"bond", frame:0, tFrame:0, tEtat:0.28, mort:0,
      touche:null, usure:0, attente:0, usureGarde:0, attenteGarde:999 });
    D.Ruelle.secousse = 0;
    D.RuelleVue.dessiner();
    ecrire(canevas, "33_dsk_bond");
  }

  /* 34. Jubilar en pleine préparation : la cible sur le bras armé, à
     taille d'écran fixe, sur deux profondeurs très différentes. C'est LE
     contrôle qui compte — une cible qui rétrécit avec l'ennemi serait
     injouable au fond de la rue. */
  {
    const { D, canevas } = await preparer(390, 780);
    D.amorcer(); D.Camera.mesurer(390, 780, 1);
    D.Jeu.demarrer(4); D.Ruelle.introT = 0;
    D.Ruelle.ennemis.length = 0; D.Ruelle.aSortir = 3;
    const ref = D.ENNEMIS.jubi;
    /* les deux BORNES de sa fourchette de jet, pas des z arbitraires :
       hors de [zMin, zMax] le jeu ne le fait jamais armer, et une scène
       impossible ne prouve rien */
    const j = D.ENNEMIS.jubi.jet;
    for (const [z, c] of [[j.zMin + 0.02, 1], [j.zMax - 0.06, 3]]){
      D.Ruelle.ennemis.push({ ref, pv:ref.pv, pvMax:ref.pv, couloir:c, z,
        vitesse:ref.vitesse, etat:"arme2", frame:0, tFrame:0, tEtat:0.3,
        mort:0, touche:null, usure:0, attente:9, usureGarde:0, attenteGarde:999 });
    }
    D.Ruelle.secousse = 0;
    D.RuelleVue.dessiner();
    ecrire(canevas, "34_jubilar_cible_bras");
  }

  /* 27. les poses propres de Depardiahree, à leur taille de jeu, sur
     une même ligne de sol : c'est la seule façon de voir qu'une pose
     plus haute que les autres ne fait pas grandir le personnage. */
  {
    const { D, canevas } = await preparer(390, 780);
    D.amorcer(); D.Camera.mesurer(390, 780, 1);
    D.Jeu.demarrer(4); D.Ruelle.introT = 0;
    /* cinq poses, cinq couloirs : une de plus et deux se recouvrent */
    const poses = ["trebuche1", "trebuche2", "ramasse", "arme", "lance"];
    for (let k = 0; k < poses.length; k++){
      D.Ruelle.ajouterEnnemi();
      const e = D.Ruelle.ennemis[k];
      e.z = 0.62; e.couloir = k;
      e.etat = "course"; e.frame = 0; e.poseForcee = poses[k];
    }
    D.Ruelle.secousse = 0;
    D.RuelleVue.dessiner();
    ecrire(canevas, "27_depardiahree_poses");
  }

  /* 21. niveau 1 au format d'un téléphone en paysage plein écran : c'est
         là que le rapport largeur/hauteur est le plus haut, et donc que
         la ligne de sol se voit le mieux. */
  {
    const { D, canevas } = await preparer(844, 390);
    D.amorcer(); D.Jeu.demarrer();
    D.Camera.mesurer(844, 390, 1); D.File.gonfler(6); D.Camera.recaler();
    for (let i = 0; i < 40; i++) D.Jeu.pas(1 / 60);
    const img = D.Images.table["pnj01_attente"];
    console.log("    sol=" + D.Camera.sol.toFixed(0) + " basUI=" + D.Camera.basUI.toFixed(0) +
                " hauteur=" + (D.H_PERSO * D.Camera.ech).toFixed(0) +
                " sprite=" + img.naturalWidth + "x" + img.naturalHeight);
    dessinerVia(D, canevas);
    ecrire(canevas, "21_file_390");
  }

  /* 19. niveau 2 : le pire cas signalé — plusieurs bulles, un badge au
         centre, des plaques de nom, tout en même temps */
  {
    const { D, canevas } = await preparer(844, 318);
    D.amorcer(); D.Camera.mesurer(844, 318, 1);
    D.Jeu.demarrer(2); D.Intro.finir();
    D.Enquete.indices = 3;
    for (const s of D.SUSPECTS) s.vus = true;
    D.Visiteurs.declencher();
    D.Visiteurs.etat = "PARLE"; D.Visiteurs.x = 0.62;
    /* On passe par la FILE, comme le jeu : une seule bulle doit sortir,
       avec le chevron qui annonce la suite. */
    D.Enquete.dialogue([
      [0, "Ce n'est pas la pizza non plus."],
      [1, "Sa sœur l'a prévenue, c'est certain."],
      [{ temoin:0 }, "Non."],
      [{ visiteur:true }, "Deux cocktails offerts. Vous les prenez maintenant ou après ?"],
    ], 0);
    D.Enquete.poserBadge("suspect");
    D.Enquete.badgeT = 0.2;
    for (let i = 0; i < 20; i++) D.Jeu.pas(1 / 60);
    void 0;
    dessinerVia(D, canevas);
    ecrire(canevas, "19_enq_bulles_844");
  }

  /* 20. niveau 2 : le dossier ouvert, six cartes */
  {
    const { D, canevas } = await preparer(844, 318);
    D.amorcer(); D.Camera.mesurer(844, 318, 1);
    D.Jeu.demarrer(2); D.Intro.finir();
    for (let k = 0; k < 6; k++){
      const z = D.Enquete.zones.find(z2 => z2.indice && !z2.fouillee);
      if (!z) break;
      D.Enquete.actifIns().x = z.ref.x;
      D.Enquete.inspecter();
      for (let i = 0; i < 80; i++) D.Jeu.pas(1 / 60);
    }
    D.Enquete.dossierOuvert = true;
    D.Jeu.pas(1 / 60);
    dessinerVia(D, canevas);
    ecrire(canevas, "20_enq_dossier_844");
  }

  /* 18. niveau 3 : la tarte en vol, fenêtre d'esquive ouverte, la salle pleine */
  {
    const { D, canevas } = await preparer(844, 318);
    D.amorcer(); D.Camera.mesurer(844, 318, 1);
    D.Jeu.demarrer(3);
    D.Tournee.lancer();
    D.Tournee.x = 0.56; D.Tournee.temps = 62; D.Tournee.combo = 9;
    D.Tournee.ambiance = 88; D.Score.points = 5240;
    D.Tournee.verres.push({ type:"cocktail", x:0.50, etat:D.ETAT_VERRE.POSE, t:1.0, vie:7.5, barman:"francky" });
    D.Tournee.clients = [
      { ref:D.BAR_CLIENTS[0], x:0.47, dir:1, etat:"attend", t:1, cible:0.47, verre:null, foulee:0, verreEnMain:false },
      { ref:D.BAR_CLIENTS[3], x:0.66, dir:-1, etat:"entre", t:1, cible:0.66, verre:null, foulee:1.4, verreEnMain:false },
    ];
    D.Tournee.invite = { qui:"hortense", x:0.44, dir:1, t:2, pause:0, foulee:0, vue:true, jete:true };
    D.Tournee.lancerTarte();
    /* on avance jusqu'à la fenêtre d'esquive */
    for (let i = 0; i < 60 * 6 && !D.Tournee.esquiveOuverte; i++) D.Jeu.pas(1 / 60);
    for (let i = 0; i < 20; i++) D.Camera.suivreBar(D.Tournee.x, 1 / 30);
    dessinerVia(D, canevas);
    ecrire(canevas, "18_bar_tarte_844");
  }
})();

/* dessiner() n'est pas exporté : on le rejoint par la boucle du jeu,
   qui l'appelle. Plus simple : on rappelle la même passe de rendu en
   passant par le point d'entrée public. */
function dessinerVia(D, canevas){
  void canevas;
  D.__dessiner();
}
