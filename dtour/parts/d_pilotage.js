
/* ================= UIManager -> Interface ================= */
const E = {};
function accrocher(){
  for (const id of ["cv","intro","jauge","titre","logo","btnJouer","hud","vScore","vCombo","cCombo","miniT","miniP","tRecord",
                    "vFile","vies","pupitre","cmdT","cmdP","cmdE","visageT","visageP","nomG","nomD","legG","legD","legPtG","legPtD","cibleG","cibleD","fin","fScore","fCombo","finTitre","releve","releveEnq","eTemps","eIndices","eFouilles","eScore","eCoupable","eChute","eRecit","niveaux","marque","vign1","vign2","titreFond","titreVoile","titreHaut","titreEnseigne","titreSst","pause","pauseNiv","pauseBtn","coins","pReprendre","pRecommencer","pMenu","pupitre2","c2G","c2D","c2A","c2ATxt","c2Int","c2C","c2CImg","c2Dos","c2DosN","c2Acc","c2AccN","introNiv","introTxt","niv2","eFausses","eTarte","vign3","niv3","vign4","niv4","pupitre3","c3G","c3D","c3B","c3J","c3E","releveRuelle","releveTues","rScore","rHordes","rTetes","rGardes","rEncaissees","rAnnules","rContacts","releveBar","bScore","bCombo","bCocktails","bJagers","bEaux","bErreurs","bChipes","finTitre","releve","releveEnq","eTemps","eIndices","eFouilles","eCoupable","eChute",
                    "fSaluts","fFile","fEsquives","fRecues","fRecord","btnRejouer","pivot","pivotOk",
                    "cmdE","outilsBtn","debug",
                    "dVitesse","dVitesseV","dReaction","dReactionV","dLecture","version","pleinBtn","pivotTitre","pivotTexte","niveaux"]){
    E[id] = document.getElementById(id);
  }
}

/* Le jeu se joue en paysage, plein écran. Ce n'est pas une préférence :
   la file s'étire horizontalement, en portrait on n'en voit que trois
   personnes et le geste par-dessus Pierre-François ne rentre pas dans
   le cadre. On demande donc le plein écran au premier geste du joueur —
   c'est le seul moment où le navigateur l'accorde — et on verrouille
   l'orientation quand l'appareil le permet. Quand il ne le permet pas
   (Safari sur iPhone n'expose ni l'un ni l'autre), on bloque l'écran
   tant que le téléphone est debout. */
/* ---------- l'orientation, niveau par niveau ----------
   Les trois premiers niveaux se jouent en PAYSAGE : il faut voir la
   file entière, l'appartement en enfilade, le bar dans sa longueur. La
   ruelle du niveau 4, elle, s'enfonce vers le fond — sa profondeur a
   besoin de HAUTEUR, et l'interface empile les ennemis lointains, la
   barricade et les deux héros. Imposer le paysage partout y détruirait
   le niveau ; imposer le portrait partout détruirait les trois autres.
   L'orientation devient donc une propriété du niveau. */
/* L'écran titre accepte les DEUX sens : on y arrive comme on tient son
   téléphone, et lui demander de tourner avant même d'avoir choisi son
   niveau était une brimade. Le pivot devient une demande à l'entrée
   d'un niveau, pas un péage à l'entrée du jeu. */
/* Le menu se tient DEBOUT : quatre tuiles empilées se lisent mieux
   qu'alignées, et c'est la façon dont on prend son téléphone. On demande
   ensuite de tourner à l'entrée des trois premiers niveaux — jamais
   avant d'avoir choisi. Le quatrième reste debout. */
const ORIENTATION = { 0:"portrait", 1:"paysage", 2:"paysage", 3:"paysage", 4:"portrait" };
function orientationVoulue(niv){ return ORIENTATION[niv] || "paysage"; }
function paysageOk(L, H){ return L >= H * 1.02; }
function portraitOk(L, H){ return H >= L * 1.02; }
/* L'écran convient-il au niveau demandé ? Sur le titre, on reste en
   paysage : c'est là qu'on choisit, et les tuiles sont en ligne. */
function ecranOk(L, H, niv){
  const veut = orientationVoulue(niv);
  if (veut === "libre") return true;
  return veut === "portrait" ? portraitOk(L, H) : paysageOk(L, H);
}

const Ecran = {
  estPlein(){
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  },
  demander(){
    const e = document.documentElement;
    const f = e.requestFullscreen || e.webkitRequestFullscreen || e.msRequestFullscreen;
    if (f){
      try{
        const p = f.call(e, { navigationUI:"hide" });
        if (p && p.catch) p.catch(() => {});
      }catch(err){ /* refusé : on continue sans */ }
    }
    this.verrouiller();
  },
  verrouiller(){
    const o = globalThis.screen && globalThis.screen.orientation;
    if (o && o.lock){
      try{
        const p = o.lock("landscape");
        if (p && p.catch) p.catch(() => {});
      }catch(err){ /* iOS ne sait pas faire : le blocage portrait prend le relais */ }
    }
  },
  sortir(){
    const f = document.exitFullscreen || document.webkitExitFullscreen;
    if (f){ try{ const p = f.call(document); if (p && p.catch) p.catch(() => {}); }catch(err){} }
  },
  basculer(){ this.estPlein() ? this.sortir() : this.demander(); },
};

/* ---------- LevelManager : ce que le joueur a déjà fait ----------
   Les deux niveaux sont TOUJOURS jouables. On garde quand même la trace
   du niveau 1 terminé — c'est une information, pas une serrure : elle
   sert à afficher un état sur l'écran d'accueil, jamais à interdire. */
const CLE_PROGRES = "dtour_progres";
const Progres = {
  lire(){
    try{ return JSON.parse(localStorage.getItem(CLE_PROGRES)) || {}; }catch(e){ return {}; }
  },
  ecrire(p){ try{ localStorage.setItem(CLE_PROGRES, JSON.stringify(p)); }catch(e){} },
  niveau2Ouvert(){ return true; },
  n1Termine(){ return !!this.lire().n1; },
  finirNiveau1(){ const p = this.lire(); p.n1 = true; this.ecrire(p); },
};

/* ---------- introduction du niveau 2 ----------
   Cinq écrans courts, six secondes en tout. On peut passer d'un
   toucher : une cinématique qu'on ne peut pas sauter est une punition
   dès la deuxième partie. */
/* Six temps, une dizaine de secondes, sautables d'un geste : une
   cinématique qu'on ne peut pas passer est une punition dès la
   deuxième partie. Les deux inspecteurs entrent à l'image pendant
   qu'elle se déroule — le décor est là dès le deuxième temps, ils
   arrivent au troisième et au quatrième. */
const INTRO_NIV2 = [
  { t:1.5, txt:"QUELQUES HEURES\nPLUS TARD...", noir:true },
  { t:1.7, txt:"UNE PIZZA AU CHORIZO\n<em>A DISPARU.</em>" },
  { t:1.8, txt:"Pierre-François sort sa loupe.", entree:0 },
  { t:1.5, txt:"Thibaut le rejoint.", entree:1 },
  { t:1.6, txt:"NIVEAU 2\n<em>L'AFFAIRE DE LA PIZZA AU CHORIZO</em>" },
  { t:1.7, txt:"<em>Fouillez. Retrouvez la pizza.\nPuis désignez qui.</em>" },
];
/* Où chacun s'arrête en entrant, et à quelle vitesse. */
const INTRO_PLACES = [0.115, 0.062];
const INTRO_PAS = 0.150;

const Intro = {
  actif:false, etape:0, chrono:0, entres:[false, false],

  lancer(){
    this.actif = true; this.etape = 0; this.chrono = INTRO_NIV2[0].t;
    this.entres = [false, false];
    Enquete.monter();
    Camera.xEnq = 0;
    if (E.introNiv) E.introNiv.classList.add("on");
    this.afficher();
  },
  afficher(){
    const e = INTRO_NIV2[this.etape];
    if (E.introTxt) E.introTxt.innerHTML = e.txt.replace(/\n/g, "<br>");
    if (E.introNiv) E.introNiv.classList.toggle("noir", !!e.noir);
    if (e.entree !== undefined){
      this.entres[e.entree] = true;
      Sons.clic();
    }
  },
  passer(){
    /* Passer d'un geste : on saute à la fin, et les deux sont en place. */
    this.etape++;
    if (this.etape >= INTRO_NIV2.length) return this.finir();
    this.chrono = INTRO_NIV2[this.etape].t;
    this.afficher();
  },
  finir(){
    this.actif = false;
    this.entres = [true, true];
    if (E.introNiv) E.introNiv.classList.remove("on", "noir");
    for (let i = 0; i < Enquete.inspecteurs.length; i++) Enquete.inspecteurs[i].x = INTRO_PLACES[i];
    Jeu.demarrerEnquete();
  },
  /* Les deux entrent par la gauche pendant que le texte défile. */
  majorer(dt){
    if (!this.actif) return;
    for (let i = 0; i < Enquete.inspecteurs.length; i++){
      const ins = Enquete.inspecteurs[i];
      if (!this.entres[i]) continue;
      const but = INTRO_PLACES[i];
      const reste = but - ins.x;
      if (Math.abs(reste) < 0.002){ ins.marche = 0; continue; }
      const pas = Math.sign(reste) * Math.min(Math.abs(reste), INTRO_PAS * dt);
      ins.x += pas; ins.pas += Math.abs(pas) * 9; ins.dir = 1; ins.marche = 1;
    }
    this.chrono -= dt;
    if (this.chrono <= 0) this.passer();
  },
};

/* ---------- Pause ----------
   Elle gèle le temps de jeu sans arrêter l'affichage : la scène reste
   visible derrière, ce qui vaut mieux qu'un écran noir pour se
   rappeler où on en était. `Boucle.pause` sert aussi au blocage
   portrait, d'où le OU logique : deux raisons de suspendre, une seule
   suspension. */
const Pause = {
  active:false,
  NOMS:["", "01 · La file du D'Tour", "02 · L'enquête de la pizza", "03 · La tournée du D'Tour"],

  peut(){ return Jeu.phase === "jeu" && !Intro.actif; },
  basculer(){ this.active ? this.reprendre() : this.mettre(); },
  mettre(){
    if (!this.peut()) return;
    this.active = true;
    if (E.pause) E.pause.classList.add("on");
    if (E.pauseNiv) E.pauseNiv.textContent = this.NOMS[Jeu.niveau] || "";
    Boucle.pause = true;
    Sons.clic();
    if (E.pReprendre) E.pReprendre.focus({ preventScroll:true });
  },
  reprendre(){
    this.active = false;
    if (E.pause) E.pause.classList.remove("on");
    Interface.pensePivot();          /* le portrait peut avoir sa propre raison de bloquer */
    if (!Boucle.pause) Boucle.reprendre();
    Sons.clic();
  },
  quitter(){
    this.active = false;
    if (E.pause) E.pause.classList.remove("on");
    Sons.arreterFondEnquete();
    Jeu.retourTitre();
    Interface.pensePivot();
    if (!Boucle.pause) Boucle.reprendre();
  },
  recommencer(){
    const n = Jeu.niveau;
    this.active = false;
    if (E.pause) E.pause.classList.remove("on");
    Interface.pensePivot();
    if (!Boucle.pause) Boucle.reprendre();
    Jeu.demarrer(n);
  },
};

/* Un dégradé vertical à partir de la couleur d'un héros : la même teinte
   en haut, assombrie d'un quart en bas. */
function degradeHeros(hex){
  const n = parseInt(String(hex).replace("#", ""), 16);
  const r = (n >> 16) & 255, v = (n >> 8) & 255, b = n & 255;
  const s = f => "rgba(" + Math.round(r * f) + "," + Math.round(v * f) + "," + Math.round(b * f) + ",.92)";
  return "linear-gradient(180deg," + s(1) + "," + s(0.72) + ")";
}

const Interface = {
  finAffichee:false, dernierCombo:0,

  preparer(){
    if (E.version) E.version.textContent = "CALLAGHAN v" + VERSION;
    if (E.logo && Images.table.logo) E.logo.src = Images.table.logo.src;
    /* Chaque niveau porte sa vignette : l'enseigne du bar pour le
       premier, la boîte à pizza pour le second. */
    /* Le décor du bar sert de fond à l'écran titre : c'est l'image qui
       dit le mieux de quel jeu il s'agit. Posée seulement quand elle est
       vraiment chargée — sinon on afficherait un cadre vide. */
    if (E.titreFond && Images.table.fond_bar && Images.table.fond_bar.naturalWidth){
      E.titreFond.style.backgroundImage = "url(" + Images.table.fond_bar.src + ")";
    }
    if (E.vign1 && Images.table.logo){ E.vign1.src = Images.table.logo.src; E.vign1.alt = "La file du D'Tour"; }
    if (E.vign2 && Images.table.pizza_boite_ouverte){
      E.vign2.src = Images.table.pizza_boite_ouverte.src; E.vign2.alt = "L'enquête de la pizza";
    }
    if (E.vign4 && Images.table.enn_depar_run1 && Images.table.enn_depar_run1.naturalWidth){
      E.vign4.src = Images.table.enn_depar_run1.src; E.vign4.alt = "La ruelle";
    }
    if (E.vign3 && Images.table.bar_cocktail && Images.table.bar_cocktail.naturalWidth){
      E.vign3.src = Images.table.bar_cocktail.src; E.vign3.alt = "La tournée du D'Tour";
    }
    /* Prénoms, portraits et libellés : tout se déduit du tableau Heros,
       dans l'ordre gauche puis droite. Les identifiants HTML gardent
       leurs vieilles lettres T et P, qui désignent désormais la place
       et non la personne. */
    const cases = [
      { img:[E.visageT, E.miniT], nom:E.nomG, leg:E.legG, pt:E.legPtG, cible:E.cibleG, bouton:E.cmdT },
      { img:[E.visageP, E.miniP], nom:E.nomD, leg:E.legD, pt:E.legPtD, cible:E.cibleD, bouton:E.cmdP },
    ];
    for (let i = 0; i < Heros.length; i++){
      const h = Heros[i], c = cases[i];
      const face = Images.table["face_" + h.sprite];
      for (const el of c.img) if (el && face){ el.src = face.src; el.alt = h.court; }
      if (c.nom) c.nom.textContent = h.court;
      if (c.leg) c.leg.textContent = h.court;
      if (c.pt && c.pt.style) c.pt.style.background = h.couleur;
      if (c.bouton && c.bouton.style) c.bouton.style.background = degradeHeros(h.couleur);
      if (c.cible) c.cible.textContent = "Cible : " + h.court;
      if (c.bouton && c.bouton.setAttribute) c.bouton.setAttribute("aria-label", "Saluer " + h.court);
    }
    const r = lireRecords();
    if (E.tRecord) E.tRecord.textContent = r.score ? "MEILLEUR SCORE " + chiffres(r.score) : "";
  },
  avancement(f){ if (E.jauge) E.jauge.style.width = Math.round(f * 100) + "%"; },
  fermerIntro(){ if (E.intro) E.intro.classList.add("parti"); },

  /* Lancer un niveau dont les images ne sont pas encore là afficherait
     des trous noirs. On rouvre alors l'écran de chargement — le même —
     et on démarre dès que le dossier est complet. */
  lancerNiveau(niv){
    const cle = "n" + niv;
    if (dossierPret(cle)){ Jeu.demarrer(niv); return; }
    if (E.intro) E.intro.classList.remove("parti");
    this.avancement(0);
    const debut = Date.now();
    const guetter = () => {
      if (dossierPret(cle)){
        this.fermerIntro();
        Jeu.demarrer(niv);
        return;
      }
      /* la barre avance avec ce qui est réellement arrivé */
      const l = IMG_PAR_DOSSIER[cle] || [];
      const faits = l.filter(n => Images.table[n] && Images.table[n].naturalWidth).length;
      this.avancement(l.length ? faits / l.length : 1);
      if (Date.now() - debut > 30000){   /* filet : on ne bloque jamais le joueur */
        this.fermerIntro(); Jeu.demarrer(niv); return;
      }
      setTimeout(guetter, 120);
    };
    guetter();
  },

  entrerTitre(){
    this.finAffichee = false;
    if (E.releve) E.releve.style.display = "";
    if (E.releveEnq) E.releveEnq.classList.remove("on");
    if (E.eCoupable) E.eCoupable.classList.remove("on");
    if (E.eChute) E.eChute.classList.remove("on");
    const r = lireRecords();
    if (E.tRecord) E.tRecord.textContent = r.score ? "MEILLEUR SCORE " + chiffres(r.score) : "";
    if (E.titre) E.titre.classList.remove("parti");
    if (E.niv2Sst) E.niv2Sst.textContent = "Six indices, cinq minutes.";
    if (E.fin) E.fin.classList.remove("on");
    /* Tout ce qui appartient à une partie se range ICI. La liste avait
       été écrite quand il n'existait qu'un pupitre : en revenant au menu
       après le niveau 2 ou 3, JETER et BOIRE restaient affichés en bas
       de l'écran titre. Un nouveau niveau ajoute son pupitre à cette
       liste, et le test qui suit le vérifie. */
    for (const el of [E.hud, E.pupitre, E.pupitre2, E.pupitre3, E.releveBar,
                      E.outilsBtn, E.pleinBtn, E.pauseBtn]){
      if (el) el.classList.remove("on");
    }
  },
  entrerJeu(){
    this.finAffichee = false;
    /* L'orientation dépend du NIVEAU depuis la v6.33 : entrer dans un
       niveau doit la réévaluer. Sans ça, on passait du titre en paysage
       à la ruelle sans que rien ne vérifie — et le décor portrait se
       retrouvait cadré sur la barricade, en gros plan.
       On pose un VOILE le temps que le canevas se redimensionne : sans
       lui, on voyait la scène se contorsionner pendant la bascule. */
    if (E.intro) E.intro.classList.remove("parti");
    this.avancement(1);
    setTimeout(() => { ajusterCanevas(); this.pensePivot(); }, 0);
    setTimeout(() => { ajusterCanevas(); this.pensePivot(); }, 240);
    setTimeout(() => { if (E.intro) E.intro.classList.add("parti"); }, 520);
    if (E.titre) E.titre.classList.add("parti");
    if (E.fin) E.fin.classList.remove("on");
    /* Le bandeau SCORE / COMBO / FILE appartient au niveau 1. Le niveau 2
       dessine le sien sur le canevas : les deux ensemble donnaient un
       compteur de file à zéro au-dessus d'un appartement. */
    if (E.hud) E.hud.classList.toggle("on", Jeu.niveau === 1);
    if (E.pupitre) E.pupitre.classList.toggle("on", Jeu.niveau === 1);
    if (E.pupitre2) E.pupitre2.classList.toggle("on", Jeu.niveau === 2);
    /* Le pupitre du niveau 3 n'apparaît qu'une fois le champion choisi :
       pendant la sélection, les flèches et BOIRE/JETER n'ont rien à
       piloter et encombrent l'écran de choix. */
    if (E.pupitre3) E.pupitre3.classList.toggle("on", Jeu.niveau === 3 && !Tournee.enChoix);
    if (E.outilsBtn && Debug.autorise) E.outilsBtn.classList.add("on");
    if (E.pleinBtn) E.pleinBtn.classList.add("on");
    if (E.pauseBtn) E.pauseBtn.classList.add("on");
    this.majVies(); this.majBandeau();
  },
  sortirJeu(){
    if (E.pupitre) E.pupitre.classList.remove("on");
    if (E.pupitre2) E.pupitre2.classList.remove("on");
    if (E.pupitre3) E.pupitre3.classList.remove("on");
  },

  /* Niveau 1 : le bouton d'esquive s'allume dès qu'une tarte est en
     l'air, et clignote quand la fenêtre est ouverte. Il reste cliquable
     en permanence — un bouton éteint ne se presse pas, et l'esquive se
     joue en moins d'une demi-seconde. */
  majEsquive(){
    if (!E.cmdE || Jeu.niveau !== 1) return;
    const t = Tartes.tarteImminente();
    E.cmdE.classList.toggle("alerte", !!(t && t.fenetreOuverte));
  },

  /* Le bouton d'action dit ce qu'il fait, et change quand la tarte
     arrive : c'est la seule façon d'apprendre l'esquive sans notice. */
  majAction(){
    if (Jeu.niveau !== 2) return;
    const esq = Enquete.esquiveOuverte;
    if (E.c2ATxt) E.c2ATxt.textContent = esq ? "ESQUIVER !" : "INSPECTER";
    if (E.c2A) E.c2A.classList.toggle("esquive", !!esq);
    if (E.c2DosN) E.c2DosN.textContent = String(Dossier.compte());
    /* Les deux commandes disent chacune si elles ont quelque chose à
       faire : plus de doute sur ce qui va se passer.
       MAIS l'esquive passe devant : le bouton affichait « ESQUIVER ! »
       et se grisait dans la même passe, parce qu'aucun meuble n'était à
       portée. On voyait un bouton mort au moment précis où il fallait
       appuyer — l'esquive du niveau 2 est restée injouable une version
       entière. Une invite à agir ne s'éteint jamais. */
    if (E.c2A) E.c2A.classList.toggle("eteint", !esq && Enquete.zoneProche() < 0);
    if (E.c2Int) E.c2Int.classList.toggle("eteint", Enquete.suspectProche() < 0);
    /* Le bouton CHANGER porte le visage de CELUI QU'ON VA PRENDRE : on
       sait d'un coup d'œil qui on a en main et qui on récupère. */
    if (E.c2CImg && Enquete.inspecteurs.length === 2){
      const autre = Heros[Enquete.autreIns().heros];
      const face = Images.table["face_" + autre.sprite];
      if (face && E.c2CImg.src !== face.src){ E.c2CImg.src = face.src; E.c2CImg.alt = autre.court; }
    }
    if (E.c2AccN) E.c2AccN.textContent = String(Enquete.accusationsRestantes);
    if (E.c2Acc){
      const pret = Enquete.peutConclure();
      E.c2Acc.classList.toggle("eteint", !pret);
      /* Il clignote seulement quand il ne manque vraiment plus rien. */
      E.c2Acc.classList.toggle("prete", pret && !Enquete.cePquiManque() && !Enquete.accusation);
      E.c2Acc.textContent = Enquete.accusation ? "RETOUR" : "ACCUSER";
    }
  },

  majBandeau(){
    if (E.vScore) E.vScore.textContent = chiffres(Score.points);
    if (E.vCombo) E.vCombo.textContent = "\u00D7" + Score.multiplicateur();
    if (E.vFile) E.vFile.textContent = chiffres(File.installees());
    if (E.cCombo && Score.combo > this.dernierCombo && Score.combo > 1){
      E.cCombo.classList.remove("chaud");
      void E.cCombo.offsetWidth;
      E.cCombo.classList.add("chaud");
    }
    this.dernierCombo = Score.combo;
  },
  majVies(){
    if (!E.vies) return;
    const b = E.vies.querySelectorAll("b");
    for (let i = 0; i < b.length; i++) b[i].classList.toggle("perdue", i >= Jeu.vies);
  },
  flashCommande(h){
    const b = h === 0 ? E.cmdT : (h === 1 ? E.cmdP : E.cmdE);
    if (!b) return;
    b.classList.add("pressee");
    setTimeout(() => b.classList.remove("pressee"), 90);
  },
  /* Niveau 3 : BOIRE et JETER ne s'allument que devant un verre. Ils
     restent cliquables — un appui à vide répond « PAS DE VERRE ICI ». */
  majActionBar(){
    if (Jeu.niveau !== 3) return;
    /* L'écran de choix se joue au doigt sur le canevas : on range le
       pupitre tant qu'il n'y a pas de champion. */
    if (E.pupitre3) E.pupitre3.classList.toggle("on", !Tournee.enChoix);
    if (Tournee.enChoix) return;
    const pret = Tournee.actif && Tournee.verreAPortee() >= 0 && Tournee.boitT <= 0;
    if (E.c3B) E.c3B.classList.toggle("eteint", !pret);
    if (E.c3J) E.c3J.classList.toggle("eteint", !pret);
    /* ESQUIVER apparaît dès qu'une tarte est en l'air — pas seulement
       pendant la fenêtre — et il n'est JAMAIS éteint : c'est une invite
       à agir, et une invite éteinte ne se presse pas (l'esquive du
       niveau 2 en est morte pendant une version). */
    const tarte = !!Tournee.tarte && Tournee.tarte.etat === "vol";
    if (E.c3E){
      E.c3E.classList.toggle("on", tarte);
      E.c3E.classList.toggle("alerte", !!Tournee.esquiveOuverte);
      E.c3E.classList.remove("eteint");
    }
  },

  /* Le niveau 4 tombait jusqu'ici sur le relevé du niveau 1 : il
     affichait PERSONNES SALUÉES et FILE LA PLUS LONGUE à la sortie d'une
     fusillade. Il a le sien. */
  afficherFinRuelle(){
    const gagne = Ruelle.fini && Ruelle.fini.gagne;
    const b = Ruelle.bilan || { tues:{}, tetes:0, gardes:0, bloquees:0,
                                encaissees:0, contacts:0, hordes:0 };
    if (E.finTitre){
      E.finTitre.innerHTML = gagne ? "LA RUELLE<em>EST À NOUS.</em>"
                                   : "LA BARRICADE<em>A CÉDÉ.</em>";
    }
    if (E.releve) E.releve.style.display = "none";
    if (E.releveBar) E.releveBar.classList.remove("on");
    if (E.releveEnq) E.releveEnq.classList.remove("on");
    if (E.releveRuelle) E.releveRuelle.classList.add("on");
    if (E.rScore) E.rScore.textContent = chiffres(Score.points);
    /* Sur une défaite, la horde en cours n'est pas passée : on affiche
       celles qui l'ont été, sur le total. Compter la horde perdue serait
       flatteur et faux. */
    if (E.rHordes) E.rHordes.textContent = b.hordes + " / " + Ruelle.VAGUES.length;
    if (E.rTetes) E.rTetes.textContent = chiffres(b.tetes);
    if (E.rGardes) E.rGardes.textContent = chiffres(b.gardes);
    if (E.rEncaissees) E.rEncaissees.textContent = chiffres(b.encaissees)
      + (b.bloquees ? " / " + chiffres(b.bloquees + b.encaissees) : "");
    if (E.rAnnules) E.rAnnules.textContent = chiffres(b.annules || 0);
    if (E.rContacts) E.rContacts.textContent = chiffres(b.contacts);

    /* Le détail par catégorie, construit à partir de ENNEMIS : ajouter
       un ennemi au jeu suffit à le faire apparaître ici. */
    if (E.releveTues){
      const lignes = Object.keys(ENNEMIS)
        .map(cle => ({ nom:ENNEMIS[cle].nom, n:b.tues[cle] || 0 }))
        .filter(l => l.n > 0)
        .sort((x, y) => y.n - x.n);
      const total = lignes.reduce((s, l) => s + l.n, 0);
      let html = "";
      for (const l of lignes){
        html += '<div class="lg"><span class="nm">' + l.nom
             + '</span><span class="nb chiffre">' + chiffres(l.n) + '</span></div>';
      }
      /* zéro tué est un résultat, pas un bug : il faut le dire. */
      html += '<div class="lg"><span class="nm">TOTAL ABATTUS</span>'
           + '<span class="nb chiffre">' + chiffres(total) + '</span></div>';
      E.releveTues.innerHTML = html;
      E.releveTues.classList.add("on");
    }
    if (E.eCoupable) E.eCoupable.classList.remove("on");
    if (E.eRecit) E.eRecit.classList.remove("on");
    if (E.eChute){
      /* On dit POURQUOI : une défaite qu'on ne comprend pas ne se
         rejoue pas. */
      E.eChute.textContent = gagne
        ? "Cinq hordes, et la rue est vide. On peut aller boire un verre."
        : b.encaissees > b.contacts
          ? "Ce sont les jets qui ont eu la barricade. Le bouton À COUVERT existe."
          : "Ils sont arrivés au contact. Les jambes ralentissent, la tête tue.";
      E.eChute.classList.add("on");
    }
    if (E.fin) E.fin.classList.add("on");
    if (E.btnRejouer) E.btnRejouer.focus({ preventScroll:true });
  },

  afficherFinBar(){
    const gagne = Tournee.fini && Tournee.fini.gagne;
    const cause = Tournee.fini ? Tournee.fini.cause : "temps";
    if (E.finTitre){
      E.finTitre.innerHTML = gagne ? "SOIRÉE<em>VALIDÉE.</em>"
        : cause === "vide" ? "LE BAR<em>S'EST VIDÉ.</em>"
        : "SOIRÉE<em>ÉCOURTÉE.</em>";
    }
    if (E.releve) E.releve.style.display = "none";
    if (E.releveEnq) E.releveEnq.classList.remove("on");
    if (E.releveBar) E.releveBar.classList.add("on");
    if (E.releveRuelle) E.releveRuelle.classList.remove("on");
    if (E.releveTues) E.releveTues.classList.remove("on");
    const st = Tournee.stats || {};
    if (E.bScore) E.bScore.textContent = chiffres(Score.points);
    if (E.bCombo) E.bCombo.textContent = "\u00D7" + Tournee.meilleurCombo;
    if (E.bCocktails) E.bCocktails.textContent = chiffres(st.cocktails || 0);
    if (E.bJagers) E.bJagers.textContent = chiffres(st.jagers || 0);
    if (E.bEaux) E.bEaux.textContent = chiffres(st.eauxJetees || 0);
    if (E.bErreurs) E.bErreurs.textContent = chiffres((st.eauxBues || 0) + (st.sacrileges || 0) + (st.rates || 0));
    if (E.bChipes) E.bChipes.textContent = chiffres(st.chipes || 0);
    if (E.eCoupable){
      E.eCoupable.textContent = "CHAMPION : " + (Tournee.champion ? Tournee.champion.nom : "")
        + (Tournee.bonusFin ? "  ·  BONUS " + chiffres(Tournee.bonusFin) : "");
      E.eCoupable.classList.add("on");
    }
    /* On dit pourquoi : une défaite qu'on ne comprend pas ne se rejoue pas. */
    if (E.eChute){
      E.eChute.textContent = gagne
        ? "La dernière tournée est passée. Personne ne s'en souviendra."
        : cause === "vide" ? "Plus d'ambiance : la salle est partie ailleurs."
        : "Le temps a manqué — la jauge d'ambiance n'était pas pleine.";
    }
    if (E.fin) E.fin.classList.add("on");
    if (E.btnRejouer) E.btnRejouer.focus({ preventScroll:true });
  },

  afficherFin(){
    this.finAffichee = true;
    if (Jeu.niveau === 4) return this.afficherFinRuelle();
    if (Jeu.niveau === 3) return this.afficherFinBar();
    if (Jeu.niveau === 2) return this.afficherFinEnquete();
    if (E.releveRuelle) E.releveRuelle.classList.remove("on");
    if (E.releveTues) E.releveTues.classList.remove("on");
    if (E.releve) E.releve.style.display = "";
    const neuf = ecrireRecord({ score:Score.points, combo:Score.meilleurCombo,
                                saluts:Score.saluts, file:Score.fileMax });
    const r = lireRecords();
    if (E.fScore) E.fScore.textContent = chiffres(Score.points);
    if (E.fCombo) E.fCombo.textContent = "\u00D7" + Score.meilleurCombo;
    if (E.fSaluts) E.fSaluts.textContent = chiffres(Score.saluts);
    if (E.fFile) E.fFile.textContent = chiffres(Score.fileMax);
    if (E.fEsquives) E.fEsquives.textContent = chiffres(Score.esquives);
    if (E.fRecues) E.fRecues.textContent = chiffres(Score.recues);
    if (E.fRecord) E.fRecord.textContent = neuf ? "NOUVEAU RECORD" : ("RECORD " + chiffres(r.score || 0));
    if (E.fin) E.fin.classList.add("on");
    if (E.btnRejouer) E.btnRejouer.focus({ preventScroll:true });
  },
  /* Bloque tant qu'on n'est pas en paysage, et met le jeu en pause :
     laisser tourner derrière ferait perdre des vies sans que personne
     ne voie rien. */
  /* Le relevé du niveau 2 n'a rien à voir avec celui du niveau 1 : on
     montre l'autre tableau plutôt que de tordre le premier. */
  afficherFinEnquete(){
    if (E.releveBar) E.releveBar.classList.remove("on");
    const gagne = Enquete.fini && Enquete.fini.gagne;
    if (E.finTitre){
      E.finTitre.innerHTML = gagne
        ? "AFFAIRE<em>CLASSÉE.</em>"
        : "LA PIZZA<em>COURT TOUJOURS.</em>";
    }
    if (E.releve) E.releve.style.display = "none";
    if (E.releveEnq) E.releveEnq.classList.add("on");
    if (E.releveRuelle) E.releveRuelle.classList.remove("on");
    if (E.releveTues) E.releveTues.classList.remove("on");
    const pris = Math.max(0, Math.round(ENQ_DUREE - Enquete.restant));
    if (E.eTemps) E.eTemps.textContent = Math.floor(pris / 60) + ":" + (pris % 60 < 10 ? "0" : "") + (pris % 60);
    if (E.eIndices) E.eIndices.textContent = Enquete.indices + " / " + ENQ_OBJECTIF;
    if (E.eFausses) E.eFausses.textContent = chiffres(Enquete.fausses);
    if (E.eTarte) E.eTarte.textContent = Enquete.tarteEsquivee ? "OUI" : (Enquete.tarteRecue ? "NON" : "—");
    if (E.eFouilles) E.eFouilles.textContent = chiffres(Enquete.fouilles);
    if (E.eScore) E.eScore.textContent = chiffres(Score.points);
    if (E.eCoupable){
      E.eCoupable.textContent = gagne ? "C'ÉTAIT " + Affaire.titreSolution() : "";
      E.eCoupable.classList.toggle("on", !!gagne);
    }
    if (E.eChute){
      E.eChute.textContent = gagne ? Affaire.chute() : "Personne n'a rien vu. Comme d'habitude.";
      E.eChute.classList.add("on");
    }
    /* Le récit : la chute fait rire, le récit fait comprendre. Trouver
       le coupable sans savoir ce qu'il a fait laissait le joueur sur sa
       faim. */
    if (E.eRecit){
      const r2 = gagne ? Affaire.recit() : "";
      E.eRecit.textContent = r2;
      E.eRecit.classList.toggle("on", !!r2);
    }
    const r = lireRecords();
    if (gagne && Score.points > (r.enquete || 0)){
      try{
        const t = lireRecords(); t.enquete = Score.points;
        localStorage.setItem(CLE, JSON.stringify(t));
      }catch(e){}
    }
    if (E.fin) E.fin.classList.add("on");
    if (E.btnRejouer) E.btnRejouer.focus({ preventScroll:true });
  },

  pensePivot(){
    const L = globalThis.innerWidth || 1, H = globalThis.innerHeight || 1;
    /* Sur l'écran titre on exige le paysage : c'est là qu'on choisit son
       niveau, et les tuiles se partagent la largeur. */
    /* Tout ce qui n'est pas une partie EN COURS compte comme le menu :
       au tout premier chargement la phase n'est pas encore « titre », et
       le jeu réclamait le paysage une seconde avant de réclamer le
       portrait. Deux demandes contradictoires à la suite. */
    const enJeu = Jeu.phase === "jeu" || Jeu.phase === "fin";
    const niv = enJeu ? Jeu.niveau : 0;
    const veutPortrait = orientationVoulue(niv) === "portrait";
    const bloque = !ecranOk(L, H, niv);
    if (E.pivot) E.pivot.classList.toggle("on", bloque);
    if (bloque && E.pivotTitre && E.pivotTexte){
      const doigt = globalThis.matchMedia && globalThis.matchMedia("(pointer:coarse)").matches;
      E.pivotTitre.textContent = doigt ? "Tourne ton téléphone"
        : veutPortrait ? "Rétrécis la fenêtre" : "Élargis la fenêtre";
      E.pivotTexte.textContent = veutPortrait
        ? (doigt ? "La ruelle se joue debout : sa profondeur a besoin de hauteur."
                 : "La ruelle se joue dans une fenêtre plus haute que large.")
        : (doigt ? "La file du D'Tour se joue en paysage : il faut voir la file entière."
                 : "La file du D'Tour se joue dans une fenêtre plus large que haute.");
    }
    /* Deux raisons possibles de suspendre : l'écran debout et la pause
       demandée. On ne relance que si aucune des deux ne tient. */
    if (bloque || Pause.active) Boucle.pause = true;
    else if (Boucle.pause) Boucle.reprendre();
    return bloque;
  },
};

/* ================= InputManager -> Entrees =================
   Les commandes doivent partir à l'appui, pas au relâchement : sur un
   temps de réaction de 0,55 s, attendre le « click » coûte assez pour
   perdre la main. On écoute donc pointerdown et keydown, et on neutralise
   le click qui suit. */
const Entrees = {
  brancher(){
    const presser = (h, ev) => {
      if (ev){ ev.preventDefault(); ev.stopPropagation(); }
      Sons.reveiller();
      Jeu.saluer(h);
    };

    /* La troisième commande. Elle ne salue personne : elle fait plonger
       le héros que vise Hortense. */
    const esquiver = ev => {
      if (ev){ ev.preventDefault(); ev.stopPropagation(); }
      Sons.reveiller();
      if (Jeu.phase === "titre"){ Jeu.demarrer(); return; }
      Interface.flashCommande(2);
      /* Une pression doit toujours répondre quelque chose : sans retour,
         le joueur croit le bouton mort. */
      const r = Esquive.tenter();
      if (r === "rien"){
        Effets.texte(X_SALUT, -1.35 * H_PERSO, "PAS DE TARTE", "#93A4C4", 0.75);
        Sons.bip(320, 0.05, "sine", 0.08);
      }
    };
    Entrees.esquiver = esquiver;

    if (E.cmdT) E.cmdT.addEventListener("pointerdown", e => presser(0, e));
    if (E.cmdP) E.cmdP.addEventListener("pointerdown", e => presser(1, e));
    if (E.cmdE) E.cmdE.addEventListener("pointerdown", e => esquiver(e));
    for (const b of [E.cmdT, E.cmdP, E.cmdE]) if (b) b.addEventListener("click", e => e.preventDefault());

    /* Trois zones sur le canevas, dans l'ordre où les personnages sont
       à l'écran : Thibaut à gauche, l'esquive au milieu sous le pouce,
       Pierre-François à droite. Le pouce n'a jamais à traverser. */
    /* Le champignon a besoin du glissement, pas seulement de l'appui. */
    if (E.cv) E.cv.addEventListener("pointermove", e => {
      if (Jeu.niveau !== 4 || Jeu.phase !== "jeu") return;
      const r4 = E.cv.getBoundingClientRect ? E.cv.getBoundingClientRect() : { left:0, top:0 };
      Ruelle.toucheBouge(e.pointerId, e.clientX - r4.left, e.clientY - r4.top);
    });
    if (E.cv) E.cv.addEventListener("pointerup", e => { if (Jeu.niveau === 4) Ruelle.toucheFin(e.pointerId); });
    if (E.cv) E.cv.addEventListener("pointercancel", e => { if (Jeu.niveau === 4) Ruelle.toucheFin(e.pointerId); });
    if (E.cv) E.cv.addEventListener("pointerdown", e => {
      if (Jeu.niveau === 4){
        if (Jeu.phase !== "jeu" || !Ruelle.actif) return;
        e.preventDefault(); Sons.reveiller();
        const r4 = E.cv.getBoundingClientRect ? E.cv.getBoundingClientRect() : { left:0, top:0 };
        /* On ne tire plus en touchant l'ennemi : le pouce gauche pousse
           le viseur, le pouce droit appuie sur TIR. */
        Ruelle.toucheDebut(e.pointerId, e.clientX - r4.left, e.clientY - r4.top);
        return;
      }
      if (Jeu.niveau === 3){
        if (Jeu.phase !== "jeu" || !Tournee.enChoix) return;
        e.preventDefault(); Sons.reveiller();
        const r3 = E.cv.getBoundingClientRect ? E.cv.getBoundingClientRect() : { left:0, top:0 };
        BarVue.toucherChoix((e.clientX - r3.left) / Camera.L);
        return;
      }
      if (Jeu.niveau === 2){
        if (Jeu.phase !== "jeu") return;
        e.preventDefault();
        Sons.reveiller();
        if (Intro.actif){ Intro.passer(); return; }
        if (Enquete.dossierOuvert){ Enquete.basculerDossier(); return; }
        /* Taper dans le décor passe la bulle en cours. C'est le geste le
           plus fréquent du niveau : il passe avant tout le reste, sauf
           l'intro et le dossier qui sont des écrans pleins. */
        if (Enquete.avancerDialogue()) return;
        if (Enquete.accusation){
          const r2 = E.cv.getBoundingClientRect
            ? E.cv.getBoundingClientRect() : { left:0, top:0 };
          Enquete.viserAccusation((e.clientY - r2.top) / Camera.H);
          return;
        }
        return;
      }
      if (Jeu.phase !== "jeu") return;
      const f = e.clientX / Math.max(1, globalThis.innerWidth);
      if (f < 0.36) presser(0, e);
      else if (f > 0.64) presser(1, e);
      else esquiver(e);
    });

    /* Niveau 2 : ses propres touches. Elles passent avant celles du
       niveau 1 pour que A et L ne déclenchent pas des saluts. */
    globalThis.addEventListener("keydown", e => {
      if (Jeu.niveau !== 2 || Jeu.phase !== "jeu") return;
      const t = e.key.toLowerCase();
      if (t === "escape"){ e.preventDefault(); Pause.basculer(); return; }
      if (Pause.active) return;
      if (Intro.actif){ if (t === " " || t === "enter"){ e.preventDefault(); Intro.passer(); } return; }
      if (t === "arrowleft" || t === "q"){
        e.preventDefault();
        if (Enquete.accusation) Enquete.deplacerAccusation(-1); else Enquete.marcher(-1);
      } else if (t === "arrowright" || t === "d" && false){
        e.preventDefault(); Enquete.marcher(1);
      } else if (t === "arrowright"){
        e.preventDefault();
        if (Enquete.accusation) Enquete.deplacerAccusation(1); else Enquete.marcher(1);
      } else if (t === "e" || t === "enter"){
        e.preventDefault(); Sons.reveiller();
        if (!Enquete.avancerDialogue()) Enquete.action();
      } else if (t === " "){
        e.preventDefault(); Sons.reveiller();
        if (Enquete.esquiveOuverte) Enquete.esquiver();
        else if (!Enquete.avancerDialogue()) Enquete.action();
      } else if (t === "i"){
        e.preventDefault(); Sons.reveiller(); Enquete.parler();
      } else if (t === "tab"){
        e.preventDefault(); Enquete.changer();
      } else if (t === "d"){
        e.preventDefault(); Enquete.basculerDossier();
      } else if (t === "a"){
        e.preventDefault(); Enquete.ouvrirAccusation();
      }
    }, { passive:false });
    globalThis.addEventListener("keyup", e => {
      if (Jeu.niveau !== 2) return;
      const t = e.key.toLowerCase();
      if (t === "arrowleft" || t === "arrowright" || t === "q") Enquete.marcher(0);
    });

    /* Le clavier du niveau 3 : flèches pour courir, E pour BOIRE,
       J pour JETER. En choix de champion, les flèches choisissent et
       E ou ESPACE lancent. */
    globalThis.addEventListener("keydown", e => {
      if (Jeu.niveau !== 3 || Jeu.phase !== "jeu") return;
      const t = e.key.toLowerCase();
      if (t === "f" || t === "escape" || t === "p" || t === "s" || t === "o") return;
      if (e.repeat && t !== "arrowleft" && t !== "arrowright" && t !== "q") return;
      if (t === "arrowleft" || t === "q"){
        e.preventDefault();
        if (Tournee.enChoix) Tournee.choisir(Tournee.choixChamp - 1); else Tournee.marcher(-1);
      } else if (t === "arrowright"){
        e.preventDefault();
        if (Tournee.enChoix) Tournee.choisir(Tournee.choixChamp + 1); else Tournee.marcher(1);
      } else if (t === "e" || t === "enter" || t === " "){
        e.preventDefault(); Sons.reveiller();
        if (Tournee.enChoix) Tournee.lancer(); else Tournee.boire();
      } else if (t === "j"){
        e.preventDefault(); Sons.reveiller(); Tournee.jeter();
      } else if (t === "a"){
        e.preventDefault(); Sons.reveiller(); Tournee.esquiver();
      } else if (Debug.autorise && Debug.ouvert){
        /* les quatre commandes de service du mode debug */
        if (t === "1") Debug.servirBar("francky", "cocktail");
        if (t === "2") Debug.servirBar("francky", "eau");
        if (t === "3") Debug.servirBar("jojo", "jager");
        if (t === "4") Debug.servirBar("jojo", "eau");
        if (t === "r"){ Tournee.coupFait = true; Tournee.coupDeFeu = true; Tournee.coupT = 0; }
        if (t === "c") Tournee.combo = 10;
      }
    }, { passive:false });
    globalThis.addEventListener("keyup", e => {
      if (Jeu.niveau !== 3) return;
      const t = e.key.toLowerCase();
      if (t === "arrowleft" || t === "arrowright" || t === "q") Tournee.marcher(0);
    });

    globalThis.addEventListener("keydown", e => {
      if ((Jeu.niveau === 2 || Jeu.niveau === 3) && Jeu.phase === "jeu") return;
      if (e.repeat) return;
      const t = e.key.toLowerCase();
      if (t === "a" || t === "q" || t === "arrowleft"){ presser(0, e); return; }
      if (t === "l" || t === "p" || t === "m" || t === "arrowright"){ presser(1, e); return; }
      /* ESPACE esquive pendant la partie ; il ne relance que hors jeu,
         sinon on relancerait la partie en cherchant à sauver sa peau. */
      if (t === " "){
        e.preventDefault();
        if (Jeu.phase === "jeu") esquiver(e);
        else if (Jeu.phase === "titre" || (Jeu.phase === "fin" && Interface.finAffichee)) Jeu.demarrer();
        return;
      }
      if (t === "enter"){
        e.preventDefault();
        if (Jeu.phase === "titre" || (Jeu.phase === "fin" && Interface.finAffichee)) Jeu.demarrer();
        return;
      }
      if (t === "s"){ Sons.reveiller(); Sons.basculer(); return; }
      if (t === "o"){ Debug.basculer(); return; }
      if (Debug.autorise && Debug.ouvert){
        if (t === "h"){ Debug.agir("hortense"); return; }
        if (t === "t"){ Debug.agir("tarte"); return; }
        if (t === "1"){ Debug.agir("cibleP"); return; }
        if (t === "2"){ Debug.agir("cibleT"); return; }
        if (t === "d"){ Debug.agir("simEsquive"); return; }
        if (t === "i"){ Debug.agir("simImpact"); return; }
      }
      if (t === "d"){ Debug.basculer(); return; }
      if (t === "f"){ e.preventDefault(); Ecran.basculer(); return; }
      if (t === "escape" || t === "p"){ e.preventDefault(); Pause.basculer(); return; }
    }, { passive:false });

    /* Le plein écran ne s'obtient que dans un vrai geste utilisateur :
       c'est ici, et nulle part ailleurs, qu'il faut le demander. */
    if (E.btnJouer) E.btnJouer.addEventListener("click", () => {
      Sons.reveiller(); Sons.clic(); Ecran.demander(); Jeu.demarrer(1);
    });
    /* choix du niveau sur l'écran d'accueil */
    if (E.niveaux) E.niveaux.addEventListener("click", ev => {
      const b = ev.target.closest("button[data-niv]");
      if (!b) return;
      Sons.reveiller(); Sons.clic(); Ecran.demander();
      Interface.lancerNiveau(Number(b.dataset.niv));
    });
    if (E.btnRejouer) E.btnRejouer.addEventListener("click", () => { Sons.clic(); Jeu.demarrer(); });
    if (E.pleinBtn) E.pleinBtn.addEventListener("click", () => { Sons.clic(); Ecran.basculer(); });
    if (E.pauseBtn) E.pauseBtn.addEventListener("click", () => Pause.basculer());
    if (E.pReprendre) E.pReprendre.addEventListener("click", () => Pause.reprendre());
    if (E.pRecommencer) E.pRecommencer.addEventListener("click", () => Pause.recommencer());
    if (E.pMenu) E.pMenu.addEventListener("click", () => Pause.quitter());

    /* Les quatre grandes touches du niveau 2. Marcher se tient : on
       reste appuyé, donc pointerdown/up et non click. */
    const tenir = (el, d) => {
      if (!el) return;
      el.addEventListener("pointerdown", ev => {
        ev.preventDefault(); Sons.reveiller();
        if (Enquete.accusation) Enquete.deplacerAccusation(d); else Enquete.marcher(d);
        el.classList.add("pressee");
      });
      const relacher = () => { Enquete.marcher(0); el.classList.remove("pressee"); };
      el.addEventListener("pointerup", relacher);
      el.addEventListener("pointercancel", relacher);
      el.addEventListener("pointerleave", relacher);
    };
    tenir(E.c2G, -1);
    tenir(E.c2D, 1);
    /* Le pupitre du niveau 3 : marcher se tient, BOIRE valide aussi le
       choix du champion — c'est le geste qu'on a déjà sous le pouce. */
    const tenir3 = (el, d) => {
      if (!el) return;
      el.addEventListener("pointerdown", ev => {
        ev.preventDefault(); Sons.reveiller();
        if (Tournee.enChoix) Tournee.choisir(Tournee.choixChamp + d);
        else Tournee.marcher(d);
        el.classList.add("pressee");
      });
      const rel3 = () => { Tournee.marcher(0); el.classList.remove("pressee"); };
      el.addEventListener("pointerup", rel3);
      el.addEventListener("pointercancel", rel3);
      el.addEventListener("pointerleave", rel3);
    };
    tenir3(E.c3G, -1);
    tenir3(E.c3D, 1);
    if (E.c3B) E.c3B.addEventListener("pointerdown", ev => {
      ev.preventDefault(); Sons.reveiller();
      if (Tournee.enChoix) Tournee.lancer(); else Tournee.boire();
    });
    if (E.c3J) E.c3J.addEventListener("pointerdown", ev => {
      ev.preventDefault(); Sons.reveiller();
      if (!Tournee.enChoix) Tournee.jeter();
    });
    if (E.c3E) E.c3E.addEventListener("pointerdown", ev => {
      ev.preventDefault(); Sons.reveiller(); Tournee.esquiver();
    });
    for (const b of [E.c3G, E.c3D, E.c3B, E.c3J, E.c3E]) if (b) b.addEventListener("click", ev => ev.preventDefault());
    if (E.c2A) E.c2A.addEventListener("pointerdown", ev => {
      ev.preventDefault(); Sons.reveiller();
      if (Intro.actif) Intro.passer(); else Enquete.action();
    });
    if (E.c2Int) E.c2Int.addEventListener("pointerdown", ev => {
      ev.preventDefault(); Sons.reveiller(); Enquete.parler();
    });
    if (E.c2C) E.c2C.addEventListener("pointerdown", ev => { ev.preventDefault(); Enquete.changer(); });
    if (E.c2Dos) E.c2Dos.addEventListener("pointerdown", ev => { ev.preventDefault(); Enquete.basculerDossier(); });
    if (E.c2Acc) E.c2Acc.addEventListener("pointerdown", ev => {
      ev.preventDefault(); Sons.reveiller();
      if (Enquete.accusation) Enquete.accusation = false; else Enquete.ouvrirAccusation();
    });
    for (const b of [E.c2G, E.c2D, E.c2A, E.c2Int, E.c2C, E.c2Dos, E.c2Acc]) if (b) b.addEventListener("click", ev => ev.preventDefault());
    if (E.outilsBtn) E.outilsBtn.addEventListener("click", () => Debug.basculer());

    globalThis.addEventListener("resize", () => { ajusterCanevas(); Interface.pensePivot(); });
    globalThis.addEventListener("orientationchange", () => setTimeout(() => { ajusterCanevas(); Interface.pensePivot(); }, 220));
    document.addEventListener("visibilitychange", () => { if (document.hidden) Boucle.pause = true; else Boucle.reprendre(); });
    /* iOS n'ouvre le son qu'après un geste : on l'attrape au premier contact */
    globalThis.addEventListener("pointerdown", () => Sons.reveiller(), { once:true });
  },
};

/* ================= mode DEBUG ================= */
const Debug = {
  ouvert:false, autorise:false, cible:null,

  /* Niveau 3 : forcer un service précis, pour éprouver chaque cas. */
  servirBar(id, type){
    const b = Tournee.barmans.find(x => x.ref.id === id);
    if (!b || b.etat !== "repos") return;
    b.type = type; b.etat = "prepare"; b.t = 0;
    b.xPose = borne(b.ref.x + hasard(-0.08, 0.08), 0.06, 0.94);
    b.duree = 0.8;
  },

  init(){
    try{
      this.autorise = /(\?|&)debug=1/.test(globalThis.location.search) ||
                      globalThis.location.hostname === "localhost";
    }catch(e){ this.autorise = false; }
    if (E.outilsBtn && this.autorise) E.outilsBtn.classList.add("on");
    if (!E.debug) return;
    E.debug.addEventListener("click", e => {
      const b = e.target.closest("button[data-act]");
      if (b) this.agir(b.dataset.act, b);
    });
    if (E.dVitesse) E.dVitesse.addEventListener("input", () => {
      Difficulte.facteurVitesse = Number(E.dVitesse.value) / 100;
      if (E.dVitesseV) E.dVitesseV.textContent = Difficulte.facteurVitesse.toFixed(2);
    });
    if (E.dReaction) E.dReaction.addEventListener("input", () => {
      const v = Number(E.dReaction.value) / 100;
      Difficulte.forcageReaction = v >= 2.5 ? null : v;
      if (E.dReactionV) E.dReactionV.textContent = v.toFixed(2);
    });
  },
  basculer(){
    if (!E.debug) return;
    if (!this.autorise) this.autorise = true;
    if (E.outilsBtn) E.outilsBtn.classList.add("on");
    this.ouvert = !this.ouvert;
    E.debug.classList.toggle("on", this.ouvert);
  },
  agir(a, bouton){
    if (Jeu.phase === "titre" && a !== "jour" && a !== "soir" && a !== "nuit") Jeu.demarrer();
    switch (a){
      case "arrivee": Foule.arriver("SIMPLE"); break;
      case "salut": {
        const libre = Foule.tous.find(p => p.etat === ETAT.ENTREE || p.etat === ETAT.MARCHE);
        if (libre){ libre.x = X_SALUT; Foule.ouvrirDemande(libre, this.cible == null ? undefined : this.cible); }
        else { const p = Foule.arriver("SIMPLE"); p.x = X_SALUT; Foule.ouvrirDemande(p, this.cible == null ? undefined : this.cible); }
        break;
      }
      case "cibleT": case "cibleP": {
        const v = a === "cibleT" ? 0 : 1;
        this.cible = this.cible === v ? null : v;
        for (const b of E.debug.querySelectorAll("[data-act^=cible]")) b.classList.remove("actif");
        if (this.cible != null) bouton.classList.add("actif");
        break;
      }
      case "file10": File.gonfler(10); break;
      case "file50": File.gonfler(50); break;
      case "jour": case "soir": case "nuit": {
        const i = ["jour","soir","nuit"].indexOf(a);
        Jeu.fonduDe = Jeu.moment; Jeu.moment = i; Jeu.fondu = 0;
        Score.saluts = Math.max(Score.saluts, MOMENTS[i].seuil);
        break;
      }
      case "hortense": Tartes.apparaitre(true); break;
      case "tarte": {
        if (!Hortense.visible) Tartes.apparaitre(true);
        Hortense.etat = ETAT_H.PREPARE; Hortense.chrono = 0.05;
        if (this.cible != null) Hortense.cible = this.cible;
        break;
      }
      case "simEsquive": {
        const t = Tartes.tarteEnVol();
        if (t) Tartes.reussirEsquive(t);
        break;
      }
      case "simImpact": {
        const t = Tartes.tarteEnVol();
        if (t) Tartes.impact(t);
        else { Tartes.apparaitre(true); Hortense.etat = ETAT_H.PREPARE; Hortense.chrono = 0.05; }
        break;
      }
      case "invincible":
        Jeu.invincible = !Jeu.invincible;
        bouton.classList.toggle("actif", Jeu.invincible);
        break;
      case "lent":
        Boucle.lent = !Boucle.lent;
        bouton.classList.toggle("actif", Boucle.lent);
        break;
    }
    Interface.majBandeau();
  },
  lire(){
    if (!this.ouvert || !E.dLecture) return;
    E.dLecture.textContent =
      "phase    " + Jeu.phase + "\n" +
      "saluts   " + Score.saluts + "\n" +
      "reaction " + Difficulte.reaction().toFixed(2) + " s\n" +
      "arrivee  " + (Jeu.prochaineArrivee - Jeu.temps).toFixed(2) + " s\n" +
      "simult.  " + Difficulte.simultanees() + " (" + Jeu.demandes.length + " en cours)\n" +
      "file     " + File.installees() + " / " + File.places.length + "\n" +
      "zoom     " + Camera.z.toFixed(2) + "  base " + Math.round(Camera.base) + "\n" +
      "pnj      " + Foule.tous.length + "\n" +
      "moment   " + MOMENTS[Jeu.moment].nom + " (" + Jeu.fondu.toFixed(2) + ")\n" +
      "hortense " + Hortense.etat + (Hortense.fausse ? " (fausse)" : "") + "\n" +
      "  cible  " + (Hortense.cible === 0 ? "THIBAUT" : Hortense.cible === 1 ? "PIERRE-F." : "-") + "\n" +
      "  vol    " + Tartes.dureeVol().toFixed(2) + " s\n" +
      (() => {
        const t = Tartes.tarteEnVol();
        if (!t) return "  tarte  -\n";
        return "  tarte  " + (t.avancement * 100).toFixed(0) + " %  reste " +
               t.resteAvantImpact.toFixed(2) + " s" + (t.fenetreOuverte ? "  [ESQUIVE]" : "") + "\n";
      })() +
      "esquives " + Score.esquives + "  reçues " + Score.recues;
  },
};

/* ================= boucle =================
   Pas de temps fixe à 60 Hz avec accumulateur : la difficulté est la
   même sur un écran 60, 90 ou 120 Hz. Rattrapage borné à 5 pas, sinon
   un retour d'onglet rejouerait plusieurs secondes d'un coup. */
const Boucle = {
  PAS_S:1 / 60, reste:0, precedent:0, pause:false, lent:false, tourne:false, incidents:0,

  demarrer(){
    if (this.tourne) return;
    this.tourne = true;
    this.precedent = (globalThis.performance || Date).now();
    const trame = maintenant => {
      const dt = Math.min(0.25, (maintenant - this.precedent) / 1000);
      this.precedent = maintenant;
      /* Une trame qui casse ne doit PAS emporter la boucle. Sans ce
         filet, une exception dans le dessin empêchait la trame suivante
         d'être demandée : le jeu restait figé sur son dernier écran, ici
         « QUELQUES HEURES PLUS TARD... », sans le moindre message. */
      try{
        if (!this.pause){
          const echelle = (Jeu.phase === "fin" ? Jeu.ralenti : 1) * (this.lent ? 0.25 : 1);
          this.reste += dt * echelle;
          let n = 0;
          while (this.reste >= this.PAS_S && n < 5){ Jeu.pas(this.PAS_S); this.reste -= this.PAS_S; n++; }
          if (this.reste > this.PAS_S * 5) this.reste = 0;
        }
        dessiner();
        Debug.lire();
      }catch(err){
        this.incidents = (this.incidents || 0) + 1;
        if (this.incidents <= 3 && globalThis.console) console.error("trame ignorée :", err);
      }
      globalThis.requestAnimationFrame(trame);
    };
    globalThis.requestAnimationFrame(trame);
  },
  reprendre(){ this.pause = false; this.precedent = (globalThis.performance || Date).now(); this.reste = 0; },
};

/* ================= amorçage =================
   Ce bloc lit des constantes déclarées plus haut : il reste donc en fin
   de fichier. La zone morte temporelle a déjà coûté deux écrans blancs
   sur le projet voisin. */
function amorcer(){
  accrocher();
  cv = E.cv;
  if (!cv || !cv.getContext) return;
  ctx = cv.getContext("2d");
  ajusterCanevas();
  Debug.init();
  Entrees.brancher();
  Interface.pensePivot();
  Jeu.retourTitre();
  Boucle.demarrer();
  /* Deux vagues. La première seule bloque l'écran de chargement : c'est
     de quoi voir le titre et jouer la file. La seconde — l'appartement
     et le bar — se charge pendant qu'on choisit son niveau, et
     lancerNiveau() attend poliment si on va plus vite qu'elle. */
  charger(imagesEssentielles(), f => Interface.avancement(f)).then(() => {
    Images.pret = true;
    Interface.preparer();
    Jeu.retourTitre();          /* les sprites sont là : on repeuple la file du titre */
    ajusterCanevas();
    setTimeout(() => Interface.fermerIntro(), 120);
    charger(imagesDifferees()).then(() => { Images.toutPret = true; });
  });
}

if (typeof document !== "undefined" && document.readyState !== "loading") amorcer();
else if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", amorcer);

/* Exposé pour la suite de tests, qui exécute ce script hors navigateur. */
globalThis.DTOUR = {
  VERSION, ETAT, TYPES, MOMENTS, H_PERSO, PAS, PLACE_G, PLACE_D, X_SALUT, Z_MIN,
  REACT_DEBUT, REACT_PLANCHER, VIES,
  xPlace, borne, melange, chiffres, doux, SPRITES_PNJ, PERSOS_DEBOUT, PERSOS_ASSIS,
  Difficulte, Score, File, Foule, Jeu, Heros, Camera, Effets, Sons, Images, Pnj, TERRASSE,
  mainHeros, xSalut, ancreDe, amorcer, RECUL_SALUT, paysageOk, portraitOk, ecranOk, orientationVoulue, ORIENTATION, Ecran, Interface, Pause, Boucle,
  Perspective, courbeZ, POSES_ENNEMI, POSES_PROPRES, POSES_BASE_MANQUANTES,
  REPLI_POSE,
  attenuation, PORTEE_MIN, PORTEE_PLEINE,
  ENNEMIS_RUELLE, IMAGES_NIVEAU4, Ruelle, RuelleVue, ARMES, ENNEMIS, ZONES_CORPS, VISEE_RECUL, VISEE_VITESSE, RELEVE_TH, RELEVE_PF, IA_REUSSITE, IA_CADENCE, POSES_RUEL_TH, POSES_RUEL_PF, RUELLE_COULOIRS, RUELLE_HORIZON, RUELLE_BARRICADE, RUELLE_DEGAT_BARRICADE, Enquete, EnqVue, Affaire, Dossier, LIENS, conseilInspecteur, PLACES, DEBOUT_APPART, ASSIS_APPART, HortenseApp, Visiteurs, VISITEURS, SUSPECTS, SUSPECTS_BANQUE, PLACES_FIXES, composerSuspects, INDICES, ZONES,
  Heros, Interface, Pause, ECHELLE_PERSO, echellePerso, imagesEssentielles, imagesDifferees, dossierPret, charger, ECHOS, PIECES, BAVARDAGES, SCENARIOS, RIEN, ENQ_TAILLE, ENQ_ACCUSATIONS, remplir, decouperLignes, IMG_CHEMIN, IMG_PAR_DOSSIER, cheminImage, listeImages,
  Tournee, BarVue, BAR_CHAMPIONS, BOISSONS, BARMANS, BAR_EXPIRE, BAR_MARCHE, BAR_PORTEE, BAR_AMBIANCE_BUT, BAR_TOURNEE_FINALE, ETAT_VERRE,
  POSES_BAR, poseBar, BAR_CLIENTS, BAR_DUREE, BAR_AMBIANCE_DEBUT, BAR_AMBIANCE_FUITE, BAR_SUR_LE_COUP, BAR_DEBORDE, BAR_MULT_MAX, BAR_AMBIANCE_GAIN, BAR_PRIME_COUP, BAR_CLIENT_SEUIL, BAR_ESQUIVE_PTS, BAR_ESQUIVE_FENETRE, BAR_TARTE_CHANCE, BAR_TAILLE_BARMAN, BAR_COPIES,
  ENQ_DUREE, ENQ_OBJECTIF, ENQ_PORTEE, ENQ_PORTEE_GENS, ENQ_ESQUIVE_FENETRE, SUJETS, Progres, Intro,
  Hortense, Tartes, Esquive, Tarte, ETAT_H, ETAT_TARTE,
  FENETRE_ESQUIVE, VOL_DEBUT, VOL_PLANCHER, HORTENSE_REPIT, HORTENSE_REPOS, HORTENSE_ECART, TARTE_DUREE,
  __dessiner:() => dessiner(),
  __ajuster:() => ajusterCanevas(),
};
