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

  /* On remplit la table d'images à la main, avec de vraies images — et
     on les CHARGE UNE SEULE FOIS pour tout le harnais. Chaque scène crée
     son propre contexte ; recharger les 252 images à chacune faisait
     tuer le processus par manque de mémoire bien avant la dernière
     scène, et le contrôle visuel devenait impossible pile sur ce qu'on
     venait de changer. Les objets Image sont en lecture seule ici, les
     partager ne pose donc aucun problème. */
  if (!preparer._cache){
    preparer._cache = {};
    for (const f of fs.readdirSync(PNG)){
      if (!f.endsWith(".png")) continue;
      preparer._cache[f.slice(0, -4)] = await loadImage(path.join(PNG, f));
    }
  }
  Object.assign(D.Images.table, preparer._cache);
  D.Images.pret = true;

  return { D, canevas };
}

/* Le calcul des teintes et le bras peint ont disparu en v6.15. Cette
   copie du calcul vivait ici parce que la fonction du jeu n'était pas
   exportée : deux implémentations du même relevé, qui ne pouvaient que
   divorcer. Elles sont parties ensemble. */
/* SCENES=35,36 node tests/apercu.js — le harnais complet charge un jeu
   d'images par scène et dépasse la mémoire disponible dans certains
   environnements. Filtrer permet de regarder ce qu'on vient de changer
   sans renoncer au contrôle visuel. */
const FILTRE = (process.env.SCENES || "").split(",").filter(Boolean);
function ecrire(canevas, nom){
  if (FILTRE.length && !FILTRE.some(f => nom.startsWith(f))) return;
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
    D.Tournee.lancer(); D.Tournee.introT = 0;
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
    D.Tournee.lancer(); D.Tournee.introT = 0;
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
    D.Tournee.lancer(); D.Tournee.introT = 0;
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
    D.Tournee.lancer(); D.Tournee.introT = 0;
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

  /* 35-36. LA FOULE DU PREMIER PLAN. Deux questions, deux clichés : le
     champion reste-t-il LISIBLE derrière une grappe, et les verres du
     comptoir restent-ils tous visibles ? Même mise en place que la scène
     14 — `dessinerVia` passe par le dessin du jeu, et non par `BarVue`
     seul : ma première version appelait BarVue directement et le
     champion n'apparaissait pas du tout. */
  {
    const { D, canevas } = await preparer(844, 318);
    D.amorcer(); D.Camera.mesurer(844, 318, 1);
    D.Jeu.demarrer(3); D.Tournee.lancer(); D.Tournee.introT = 0;
    D.Tournee.x = 0.42; D.Tournee.ambiance = 62; D.Score.points = 980;
    /* un verre sous chaque grappe : s'il en manque un à l'image, la
       foule masque le jeu et il faut la baisser encore */
    for (const p of D.FOULE_PLACES){
      D.Tournee.verres.push({ type:"cocktail", x:p.x, etat:D.ETAT_VERRE.POSE,
                              t:1.2, vie:7.5, barman:"francky" });
    }
    D.Tournee.marche = 0; D.Tournee.dir = 1;
    for (let i = 0; i < 8; i++) D.Jeu.pas(1 / 60);
    D.Tournee.replique = { qui:D.Tournee.foule[0], txt:"Tu reprends quelque chose ?", t:3 };
    D.Tournee.secousse = 0;
    dessinerVia(D, canevas);
    ecrire(canevas, "35_bar_foule");
  }
  {
    const { D, canevas } = await preparer(844, 318);
    D.amorcer(); D.Camera.mesurer(844, 318, 1);
    D.Jeu.demarrer(3); D.Tournee.lancer(); D.Tournee.introT = 0;
    D.Tournee.marche = 1; D.Tournee.dir = 1;
    for (let i = 0; i < 8; i++) D.Jeu.pas(1 / 60);
    /* le champion PILE au centre d'une grappe : c'est là qu'on voit s'il
       passe derrière tout en restant lisible */
    const centre = D.FOULE_PLACES[1];
    D.Tournee.foule.forEach(m => { if (m.place === centre.id) m.etat = "grappe"; });
    D.Tournee.secousse = 0;
    dessinerVia(D, canevas);
    ecrire(canevas, "36_bar_foule_derriere");
  }

  /* 36b. LE COLLÈGUE ET UNE CONVERSATION. Deux choses qu'aucun test ne
     juge : est-ce qu'il se lit comme l'AUTRE héros — même planche, même
     taille, mais titubant — et est-ce que sa bulle et celle de la foule
     tiennent ensemble à l'écran sans se recouvrir.
     Comme pour la scène 35 : passer par dessinerVia et laisser tourner
     huit images, sinon la caméra n'est pas recalée et personne
     n'apparaît. */
  {
    const { D, canevas } = await preparer(844, 318);
    D.amorcer(); D.Camera.mesurer(844, 318, 1);
    D.Jeu.demarrer(3); D.Tournee.lancer(); D.Tournee.introT = 0;
    D.Tournee.x = 0.42; D.Tournee.ambiance = 62;
    D.Tournee.marche = 0; D.Tournee.dir = 1;
    for (let i = 0; i < 8; i++) D.Jeu.pas(1 / 60);
    const c = D.Tournee.compere;
    if (c){
      c.x = 0.56; c.dir = -1; c.etat = "marche"; c.foulee = 1.2;
      c.dit = "Il a mis vingt minutes à choisir une bière. Vingt.";
      c.ditT = 3.0; c.crie = false;
    }
    D.Tournee.replique = { qui:D.Tournee.foule[0], txt:"Le maire est là.", t:3 };
    D.Tournee.secousse = 0;
    dessinerVia(D, canevas);
    ecrire(canevas, "36b_bar_collegue");
  }

  /* 36d. LES HUMEURS DES HABITUÉS. Tristan est le premier à avoir les six
     poses de figurant-2 : on le met quatre fois dans la même image, une
     par état. C'est la seule façon de voir si l'assis tombe SUR le
     tabouret et si les échelles se raccordent. */
  {
    const { D, canevas } = await preparer(844, 318);
    D.amorcer(); D.Camera.mesurer(844, 318, 1);
    D.Jeu.demarrer(3); D.Tournee.lancer(); D.Tournee.introT = 0;
    D.Tournee.x = 0.42; D.Tournee.ambiance = 85;
    D.Tournee.marche = 0; D.Tournee.dir = 1;
    for (let i = 0; i < 8; i++) D.Jeu.pas(1 / 60);
    const tri = D.Tournee.foule.filter(m => m.ref.id === "tristan");
    const etats = ["danse", "titube", "assis"];
    D.Tournee.foule.forEach((m, i) => {
      if (m.ref.id !== "tristan") m.etat = "grappe";
    });
    /* on force quatre habitués sur la planche de Tristan, un par état */
    /* SIX HABITUÉS DIFFÉRENTS, un par état : c'est la seule image qui dise
       si les six planches se raccordent entre elles et avec les `idle`
       d'origine. Une planche par personnage, découpée à six échelles
       différentes — l'erreur se verrait ici et nulle part ailleurs. */
    const qui = ["tristan", "mathilde", "kevin", "remy", "charles", "teo"];
    D.Tournee.foule.slice(0, 6).forEach((m, i) => {
      m.ref = D.BAR_CLIENTS.find(c => c.id === qui[i]) || m.ref;
      m.x = 0.26 + i * 0.055;
      m.etat = etats[i % 3];
      m.foulee = 0.4; m.t = 3.0; m.humeur = 5;
      if (m.etat === "assis"){
        const t2 = 2 + i;
        m.tabouret = t2; m.xAssis = D.BAR_TABOURETS[t2].x; m.verre = i > 2;
      }
    });
    void tri;
    D.Tournee.replique = null;
    D.Tournee.secousse = 0;
    dessinerVia(D, canevas);
    ecrire(canevas, "36d_bar_humeurs");
  }

  /* 36c. LE CRI. La plus longue des phrases criées, dans la plus grosse
     des bulles : c'est le pire cas, et le seul qui dise si le repli tient
     sans rétrécir la police au point que le cri redevienne une remarque. */
  {
    const { D, canevas } = await preparer(844, 318);
    D.amorcer(); D.Camera.mesurer(844, 318, 1);
    D.Jeu.demarrer(3); D.Tournee.lancer(); D.Tournee.introT = 0;
    D.Tournee.x = 0.42; D.Tournee.ambiance = 62;
    D.Tournee.marche = 0; D.Tournee.dir = 1;
    for (let i = 0; i < 8; i++) D.Jeu.pas(1 / 60);
    const c = D.Tournee.compere;
    if (c){
      c.x = 0.50; c.dir = 1; c.etat = "marche"; c.foulee = 0.6;
      c.crie = true; c.ditT = 4.0;
      const cris = D.COMPERE_CRIS[c.cle] || [];
      c.dit = cris.reduce((a, b) => (b.length > a.length ? b : a), "");
    }
    D.Tournee.replique = null;
    D.Tournee.secousse = 0;
    dessinerVia(D, canevas);
    ecrire(canevas, "36c_bar_collegue_cri");
  }

  /* 37. TOUS LES ENNEMIS à la même profondeur : la seule image qui dit
     s'ils se distinguent de LOIN, ce qui est toute la question quand la
     rue se remplit. Ils étaient cinq, ils sont six. */
  {
    const { D, canevas } = await preparer(390, 780);
    D.amorcer(); D.Camera.mesurer(390, 780, 1);
    D.Jeu.demarrer(4); D.Ruelle.introT = 0;
    D.Ruelle.ennemis.length = 0; D.Ruelle.aSortir = 0;
    Object.keys(D.ENNEMIS).forEach((k, i) => {
      const ref = D.ENNEMIS[k];
      D.Ruelle.ennemis.push({ ref, pv:ref.pv, pvMax:ref.pv, couloir:i % 5, z:0.58,
        vitesse:ref.vitesse, etat:"course", frame:i % 6, tFrame:0, tEtat:0,
        mort:0, touche:null, usure:0, attente:99, usureGarde:0, attenteGarde:99 });
    });
    D.Ruelle.secousse = 0;
    D.RuelleVue.dessiner();
    ecrire(canevas, "37_tous_ennemis");
  }

  /* 37-38. L'ABBÉ FORCEUR. Deux instants : l'encensoir brandi avec sa
     cible — la pose au canevas le plus haut de tout le jeu, 509 px contre
     346 — et la cloche en plein vol par-dessus un mur de Depardiahree,
     qui est la raison d'être du personnage. */
  {
    const { D, canevas } = await preparer(390, 780);
    D.amorcer(); D.Camera.mesurer(390, 780, 1);
    D.Jeu.demarrer(4); D.Ruelle.introT = 0;
    D.Ruelle.ennemis.length = 0; D.Ruelle.aSortir = 4;
    const abbe = D.ENNEMIS.abbe, dep = D.ENNEMIS.depar;
    const faire = (ref, z, couloir, etat) => {
      D.Ruelle.ennemis.push({ ref, pv:ref.pv, pvMax:ref.pv, couloir, z,
        vitesse:ref.vitesse, etat, frame:0, tFrame:0, tEtat:0.3, mort:0,
        touche:null, usure:0, attente:99, usureGarde:0, attenteGarde:999 });
      return D.Ruelle.ennemis[D.Ruelle.ennemis.length - 1];
    };
    faire(dep, 0.72, 1, "course");
    faire(dep, 0.66, 3, "course");
    faire(abbe, 0.30, 2, "arme2");
    D.Ruelle.secousse = 0;
    D.RuelleVue.dessiner();
    ecrire(canevas, "37_abbe_encensoir");
  }
  {
    const { D, canevas } = await preparer(390, 780);
    D.amorcer(); D.Camera.mesurer(390, 780, 1);
    D.Jeu.demarrer(4); D.Ruelle.introT = 0;
    D.Ruelle.ennemis.length = 0; D.Ruelle.aSortir = 4;
    const abbe = D.ENNEMIS.abbe;
    D.Ruelle.ennemis.push({ ref:abbe, pv:abbe.pv, pvMax:abbe.pv, couloir:2,
      z:0.28, vitesse:abbe.vitesse, etat:"lance", frame:0, tFrame:0, tEtat:0.1,
      mort:0, touche:null, usure:0, attente:99, usureGarde:0, attenteGarde:999 });
    const dep = D.ENNEMIS.depar;
    D.Ruelle.ennemis.push({ ref:dep, pv:dep.pv, pvMax:dep.pv, couloir:2, z:0.70,
      vitesse:dep.vitesse, etat:"course", frame:2, tFrame:0, tEtat:0, mort:0,
      touche:null, usure:0, attente:99, usureGarde:0, attenteGarde:999 });
    D.Ruelle.lancerProjectile(D.Ruelle.ennemis[0]);
    /* à mi-vol : c'est là que la cloche est au plus haut */
    D.Ruelle.projectiles[0].t = abbe.jet.vol * 0.5;
    D.Ruelle.secousse = 0;
    D.RuelleVue.dessiner();
    ecrire(canevas, "38_abbe_cloche");
  }

  /* 38b. XAVIER, les trois instants qu'aucun test ne peut juger : sa
     pelle brandie avec la cible dessus — elle doit tomber SUR la pelle et
     pas sur le crâne —, la pelle en plein vol de PRÈS, et sa mort. La
     séquence de mort a sa propre planche, dessinée à une autre échelle
     que les poses debout : c'est l'image qui dit si le raccord tient. */
  {
    const { D, canevas } = await preparer(390, 780);
    D.amorcer(); D.Camera.mesurer(390, 780, 1);
    D.Jeu.demarrer(4); D.Ruelle.introT = 0;
    D.Ruelle.ennemis.length = 0; D.Ruelle.aSortir = 4;
    const x = D.ENNEMIS.xavier;
    const poser = (z, couloir, etat) => D.Ruelle.ennemis.push({
      ref:x, pv:x.pv, pvMax:x.pv, couloir, z, vitesse:x.vitesse, etat,
      frame:0, tFrame:0, tEtat:0.1, mort:0, touche:null, usure:0,
      attente:99, usureGarde:0, attenteGarde:999 });
    poser(0.62, 2, "arme2");
    D.Ruelle.secousse = 0;
    D.RuelleVue.dessiner();
    ecrire(canevas, "38b_xavier_pelle_armee");
  }
  {
    const { D, canevas } = await preparer(390, 780);
    D.amorcer(); D.Camera.mesurer(390, 780, 1);
    D.Jeu.demarrer(4); D.Ruelle.introT = 0;
    D.Ruelle.ennemis.length = 0; D.Ruelle.aSortir = 4;
    const x = D.ENNEMIS.xavier;
    D.Ruelle.ennemis.push({ ref:x, pv:x.pv, pvMax:x.pv, couloir:2, z:0.72,
      vitesse:x.vitesse, etat:"lance", frame:0, tFrame:0, tEtat:0.1, mort:0,
      touche:null, usure:0, attente:99, usureGarde:0, attenteGarde:999 });
    D.Ruelle.lancerProjectile(D.Ruelle.ennemis[0]);
    D.Ruelle.projectiles[0].t = x.jet.vol * 0.55;
    D.Ruelle.secousse = 0;
    D.RuelleVue.dessiner();
    ecrire(canevas, "38c_xavier_pelle_en_vol");
  }
  {
    const { D, canevas } = await preparer(390, 780);
    D.amorcer(); D.Camera.mesurer(390, 780, 1);
    D.Jeu.demarrer(4); D.Ruelle.introT = 0;
    D.Ruelle.ennemis.length = 0; D.Ruelle.aSortir = 4;
    const x = D.ENNEMIS.xavier;
    /* les trois temps de la mort, côte à côte à la même profondeur */
    /* Les états s'appellent `chute` et `sol` ; la POSE se déduit ensuite
       du temps écoulé — chute1 avant 0,21 s, chute2 après, et sol2 après
       0,55 s pour qui en a un. Écrire "mort" comme état donnait trois
       morts qui couraient : c'est l'aperçu qui l'a montré, aucun test ne
       l'aurait vu. */
    [["chute", 0.10, 0], ["chute", 0.40, 0], ["sol", 0, 0.9]]
      .forEach(([etat, tEtat, mort], i) => {
        D.Ruelle.ennemis.push({ ref:x, pv:0, pvMax:x.pv, couloir:i + 1, z:0.60,
          vitesse:0, etat, frame:0, tFrame:0, tEtat, mort,
          touche:null, usure:0, attente:99, usureGarde:0, attenteGarde:999 });
      });
    D.Ruelle.secousse = 0;
    D.RuelleVue.dessiner();
    ecrire(canevas, "38d_xavier_mort");
  }

  /* 39. LES DEUX BOMBARDIERS ENSEMBLE, chacun en pleine préparation avec
     sa cible : c'est la horde qui justifie de les avoir tous les deux.
     L'un lance haut et lent, l'autre à plat et vite. */
  {
    const { D, canevas } = await preparer(390, 780);
    D.amorcer(); D.Camera.mesurer(390, 780, 1);
    D.Jeu.demarrer(4); D.Ruelle.introT = 0;
    D.Ruelle.ennemis.length = 0; D.Ruelle.aSortir = 5;
    const faire = (ref, z, couloir, etat) => {
      D.Ruelle.ennemis.push({ ref, pv:ref.pv, pvMax:ref.pv, couloir, z,
        vitesse:ref.vitesse, etat, frame:0, tFrame:0, tEtat:0.3, mort:0,
        touche:null, usure:0, attente:99, usureGarde:0, attenteGarde:999 });
      return D.Ruelle.ennemis[D.Ruelle.ennemis.length - 1];
    };
    faire(D.ENNEMIS.depar, 0.74, 2, "course");
    /* chacun dans SA fourchette, disjointe de l'autre : c'est ce qui les
       empêche de se superposer maintenant que les couloirs convergent */
    faire(D.ENNEMIS.abbe, D.ENNEMIS.abbe.jet.zMin + 0.05, 1, "arme2");
    faire(D.ENNEMIS.bruh, D.ENNEMIS.bruh.jet.zMax - 0.04, 3, "arme2");
    D.Ruelle.secousse = 0;
    D.RuelleVue.dessiner();
    ecrire(canevas, "39_deux_bombardiers");
  }

  /* 40-41. L'ANNONCE DE HORDE : la carte de bestiaire d'un méchant
     rencontré pour la première fois, puis l'échange entre les deux
     héros. Deux temps successifs, jamais superposés. */
  {
    const { D, canevas } = await preparer(390, 780);
    D.amorcer(); D.Camera.mesurer(390, 780, 1);
    D.Jeu.demarrer(4); D.Ruelle.introT = 0;
    D.Ruelle.ennemis.length = 0;
    /* étape 0 = la carte ; le rendu suit les étapes depuis la v6.68 */
    D.Ruelle.annonce = { cle:"abbe", geant:false, t:1.3, etape:0, carte:true,
                         repliques:D.Ruelle.repliquesAnnonce("abbe", false) };
    D.Ruelle.secousse = 0;
    D.RuelleVue.dessiner();
    ecrire(canevas, "40_carte_bestiaire");
  }
  {
    const { D, canevas } = await preparer(390, 780);
    D.amorcer(); D.Camera.mesurer(390, 780, 1);
    D.Jeu.demarrer(4); D.Ruelle.introT = 0;
    D.Ruelle.ennemis.length = 0;
    /* passé la carte : on est dans l'échange */
    /* étape 1 = la première bulle */
    D.Ruelle.annonce = { cle:"depar", geant:false, t:0.6, etape:1, carte:false,
      repliques:[[0, "Mon Dieu, un Depardiahree !"],
                 [1, "Vise pas le ventre, y'a rien à en tirer."]] };
    D.Ruelle.secousse = 0;
    D.RuelleVue.dessiner();
    ecrire(canevas, "41_annonce_dialogue");
  }
  /* 42. LE GÉANT : un des cinq, 2,2 fois plus grand, mécanique inchangée. */
  {
    const { D, canevas } = await preparer(390, 780);
    D.amorcer(); D.Camera.mesurer(390, 780, 1);
    D.Jeu.demarrer(4); D.Ruelle.introT = 0;
    D.Ruelle.ennemis.length = 0; D.Ruelle.aSortir = 0; D.Ruelle.annonce = null;
    const ref = D.ENNEMIS.depar;
    D.Ruelle.ennemis.push({ ref, geant:true,
      pv:ref.pv * D.Ruelle.GEANT_PV * 0.7, pvMax:ref.pv * D.Ruelle.GEANT_PV,
      taille:(ref.taille || 1) * D.Ruelle.GEANT_TAILLE,
      couloir:2, z:0.62, vitesse:ref.vitesse * D.Ruelle.GEANT_VITESSE,
      etat:"course", frame:2, tFrame:0, tEtat:0, mort:0, touche:null,
      usure:0, attente:99, usureGarde:0, attenteGarde:999 });
    D.Ruelle.secousse = 0;
    D.RuelleVue.dessiner();
    ecrire(canevas, "42_geant");
  }

  /* 43. L'AFFICHE DU NIVEAU 3, avant la première image. Contenue et non
     recadrée : la couper aux bords mangerait les deux noms peints. */
  {
    const { D, canevas } = await preparer(844, 318);
    D.amorcer(); D.Camera.mesurer(844, 318, 1);
    D.Jeu.demarrer(3); D.Tournee.lancer(); D.Tournee.introT = 0;
    D.Tournee.introT = 2.0;
    D.BarVue.dessiner();
    ecrire(canevas, "43_bar_affiche");
  }

  /* 44-46. L'HEURE ET LES EFFETS. Trois clichés : le crépuscule, la nuit
     avec un coup de feu qui l'éclaire, et toutes les particules en vol. */
  const scenePart = async (nom, vague, avecFx, avecFlash) => {
    const { D, canevas } = await preparer(390, 780);
    D.amorcer(); D.Camera.mesurer(390, 780, 1);
    D.Jeu.demarrer(4); D.Ruelle.introT = 0; D.Ruelle.annonce = null;
    D.Ruelle.vague = vague;
    D.Ruelle.ennemis.length = 0; D.Ruelle.aSortir = 0;
    const faire = (ref, z, couloir, etat) => D.Ruelle.ennemis.push({
      ref, pv:ref.pv, pvMax:ref.pv, taille:ref.taille || 1, couloir, z,
      vitesse:ref.vitesse, etat, frame:2, tFrame:0, tEtat:0.2, mort:0,
      touche:null, usure:0, attente:99, usureGarde:0, attenteGarde:999 });
    faire(D.ENNEMIS.depar, 0.66, 2, "course");
    faire(D.ENNEMIS.dsk, 0.44, 4, "course");
    if (avecFx){
      /* toutes les familles à la fois : douilles, fumée, bois, gerbe */
      D.Ruelle.fxTir(0, "revolver");
      D.Ruelle.fxTir(1, "fusil");
      D.Ruelle.fxBarricade(2, 14);
      D.Ruelle.semer("gerbe", 8, 0.52, 0.40, 0.22, 1.5708, 2.6, 1);
      for (let k = 0; k < 14; k++) D.Ruelle.pasParticules(1 / 60);
    }
    if (avecFlash) D.Ruelle.flashes.push({ t:0.12, duree:0.13, heros:0 });
    D.Ruelle.secousse = 0;
    D.RuelleVue.dessiner();
    ecrire(canevas, nom);
  };
  await scenePart("44_ruelle_crepuscule", 2, false, false);
  await scenePart("45_ruelle_nuit_flash", 5, false, true);
  await scenePart("46_ruelle_fx", 5, true, true);

  /* 47. JOJO À SON POSTE. Le comptoir n'est pas horizontal : son arête
     est à 0,538 sous Francky et 0,610 sous Jojo. Une constante unique
     laissait Jojo flotter au-dessus du sien. */
  {
    const { D, canevas } = await preparer(844, 318);
    D.amorcer(); D.Camera.mesurer(844, 318, 1);
    D.Jeu.demarrer(3); D.Tournee.introT = 0; D.Tournee.lancer(); D.Tournee.introT = 0;
    /* La caméra doit être RECALÉE explicitement : la poser en déplaçant
       le champion ne suffit pas dans le harnais, elle rattrape sur
       plusieurs images de jeu. On la place donc à la main sur Jojo. */
    D.Tournee.x = 0.76; D.Tournee.marche = 0;
    for (let i = 0; i < 8; i++) D.Jeu.pas(1 / 60);
    D.Camera.xBar = D.BarVue.larg() * 0.76 - D.Camera.L * 0.5;
    D.Tournee.barmans[1].pose = "bar_jojo_idle";
    D.Tournee.secousse = 0;
    dessinerVia(D, canevas);
    ecrire(canevas, "47_jojo_poste");
  }

  /* 48. LA FOULÉE, huit images consécutives côte à côte. Une animation ne
     se juge pas sur une image fixe : c'est la SUITE qui dit si ça court
     ou si ça vibre. Un seul contexte, et on déplace le champion entre
     chaque vignette — créer un contexte imbriqué par vignette rendait
     huit fois la même pose. */
  {
    const { D, canevas } = await preparer(1120, 320);
    const ctx = canevas.getContext("2d");
    D.amorcer(); D.Camera.mesurer(1120, 320, 1);
    D.Jeu.demarrer(3); D.Tournee.introT = 0; D.Tournee.lancer(); D.Tournee.introT = 0;
    D.Tournee.marcher(1);
    for (let i = 0; i < 60; i++) D.Jeu.pas(1 / 60);   /* il passe en course */
    ctx.fillStyle = "#110E1A"; ctx.fillRect(0, 0, 1120, 320);
    D.Camera.xBar = 0;
    for (let k = 0; k < 8; k++){
      const pose = D.Tournee.pose();
      /* on le pose à la k-ième colonne en jouant sur la position monde */
      D.Tournee.x = (k * 140 + 70) / D.BarVue.larg();
      D.BarVue.dessinerHeros();
      ctx.fillStyle = "#F7B32B"; ctx.font = "600 13px sans-serif";
      ctx.fillText(pose, k * 140 + 8, 312);
      ctx.strokeStyle = "rgba(255,255,255,.08)";
      ctx.beginPath(); ctx.moveTo(k * 140, 0); ctx.lineTo(k * 140, 320); ctx.stroke();
      for (let i = 0; i < 5; i++) D.Jeu.pas(1 / 60);
    }
    ecrire(canevas, "48_foulee");
  }

  /* 49. TIR ET RECHARGEMENT DES DEUX HÉROS, pour juger de l'ORIENTATION.
     Les nouvelles planches regardent dans deux sens opposés — Thibaut à
     droite, PF à gauche — et le rendu ne retourne plus l'indice 1 en dur
     mais compare le sens VOULU au sens NATIF. Cette scène est le seul
     endroit où l'on voit si les deux se font bien face. */
  for (const [nom, etat] of [["49_ruelle_tir", "tir"], ["50_ruelle_recharge", "recharge"]]){
    const { D, canevas } = await preparer(390, 780);
    D.amorcer(); D.Camera.mesurer(390, 780, 1);
    D.Jeu.demarrer(4);
    D.Ruelle.introT = 0; D.Ruelle.introSortie = true;
    D.Ruelle.annonce = null; D.Ruelle.mot = null;
    for (let i = 0; i < 30; i++) D.Jeu.pas(1 / 60);
    D.Ruelle.annonce = null;
    /* LES DEUX HÉROS DOIVENT ÊTRE DEBOUT. Le jeu accroupit celui qui
       n'est pas actif — c'est voulu, il se met à couvert — mais alors on
       ne voit qu'une seule arme et on ne peut rien juger de
       l'orientation. On force donc les deux hors de leur abri.
       Ma première version forçait le tir sans lever l'abri : PF sortait
       accroupi et j'ai cru un instant à un défaut d'échelle. */
    /* `iaActive` EST CE QUI DÉCIDE. J'avais d'abord forcé `h.abri`,
       `h.leve`, `h.couvert` — trois champs qui n'existent pas sur un
       héros : l'abri est CALCULÉ au moment du dessin, à partir de
       `Ruelle.iaActive` et de l'index actif. Forcer des variables sans
       vérifier qu'elles existent ne fait rien et ne dit rien. */
    D.Ruelle.iaActive = true;
    D.Ruelle.couvert = false;
    if (etat === "tir"){
      for (const h of D.Ruelle.heros){ h.recharge = 0; h.tirT = 0.05; }
      D.Ruelle.flashes = D.Ruelle.heros.map((h, i) => ({ heros:i, t:0.03, duree:0.06 }));
    } else {
      for (const h of D.Ruelle.heros){ h.recharge = 0.5; h.balles = 0; }
    }
    dessinerVia(D, canevas);
    ecrire(canevas, nom);
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
    D.Tournee.lancer(); D.Tournee.introT = 0;
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
  /* LE VOILE DE TRANSITION EST NEUTRALISÉ. Depuis la v6.87, un voile
     opaque tombe à chaque changement d'écran et se lève après deux images
     dessinées. Le harnais n'en dessine qu'UNE : toutes les scènes
     sortaient donc NOIRES, et je n'ai vu ma propre règle masquer mes
     contrôles visuels qu'en découpant les sprites du niveau 1 — plusieurs
     livraisons plus tard.
     C'est le pire cas de figure : un outil de vérification rendu aveugle
     par une correction, sans que rien ne le signale. */
  if (D.Transition){ D.Transition.voile = 0; D.Transition.nom = D.Transition.nomActuel(); }
  D.__dessiner();
  if (D.Transition) D.Transition.voile = 0;
}
