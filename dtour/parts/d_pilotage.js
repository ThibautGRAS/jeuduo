
/* ================= UIManager -> Interface ================= */
const E = {};
function accrocher(){
  for (const id of ["cv","intro","jauge","titre","logo","btnJouer","hud","vScore","vCombo","cCombo",
                    "vFile","vies","pupitre","cmdT","cmdP","visageT","visageP","fin","fScore","fCombo",
                    "fSaluts","fFile","fRecord","btnRejouer","pivot","pivotOk","outilsBtn","debug",
                    "dVitesse","dVitesseV","dReaction","dReactionV","dLecture","version"]){
    E[id] = document.getElementById(id);
  }
}

const Interface = {
  finAffichee:false, dernierCombo:0,

  preparer(){
    if (E.version) E.version.textContent = "D'TOUR v" + VERSION;
    if (E.logo && Images.table.logo) E.logo.src = Images.table.logo.src;
    if (E.visageT && Images.table.face_thibaut) E.visageT.src = Images.table.face_thibaut.src;
    if (E.visageP && Images.table.face_pierre) E.visageP.src = Images.table.face_pierre.src;
  },
  avancement(f){ if (E.jauge) E.jauge.style.width = Math.round(f * 100) + "%"; },
  fermerIntro(){ if (E.intro) E.intro.classList.add("parti"); },

  entrerTitre(){
    this.finAffichee = false;
    if (E.titre) E.titre.classList.remove("parti");
    if (E.fin) E.fin.classList.remove("on");
    if (E.hud) E.hud.classList.remove("on");
    if (E.pupitre) E.pupitre.classList.remove("on");
    if (E.outilsBtn) E.outilsBtn.classList.remove("on");
  },
  entrerJeu(){
    this.finAffichee = false;
    if (E.titre) E.titre.classList.add("parti");
    if (E.fin) E.fin.classList.remove("on");
    if (E.hud) E.hud.classList.add("on");
    if (E.pupitre) E.pupitre.classList.add("on");
    if (E.outilsBtn && Debug.autorise) E.outilsBtn.classList.add("on");
    this.majVies(); this.majBandeau();
  },
  sortirJeu(){ if (E.pupitre) E.pupitre.classList.remove("on"); },

  majBandeau(){
    if (E.vScore) E.vScore.textContent = chiffres(Score.points);
    if (E.vCombo) E.vCombo.textContent = "x" + Score.multiplicateur();
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
    const b = h === 0 ? E.cmdT : E.cmdP;
    if (!b) return;
    b.classList.add("pressee");
    setTimeout(() => b.classList.remove("pressee"), 90);
  },
  afficherFin(){
    this.finAffichee = true;
    const neuf = ecrireRecord({ score:Score.points, combo:Score.meilleurCombo,
                                saluts:Score.saluts, file:Score.fileMax });
    const r = lireRecords();
    if (E.fScore) E.fScore.textContent = chiffres(Score.points);
    if (E.fCombo) E.fCombo.textContent = "x" + Score.meilleurCombo;
    if (E.fSaluts) E.fSaluts.textContent = chiffres(Score.saluts);
    if (E.fFile) E.fFile.textContent = chiffres(Score.fileMax);
    if (E.fRecord) E.fRecord.textContent = neuf ? "NOUVEAU RECORD" : ("RECORD " + chiffres(r.score || 0));
    if (E.fin) E.fin.classList.add("on");
    if (E.btnRejouer) E.btnRejouer.focus({ preventScroll:true });
  },
  pensePivot(){
    if (!E.pivot) return;
    const portrait = globalThis.innerHeight > globalThis.innerWidth * 1.15;
    const petit = Math.min(globalThis.innerWidth, globalThis.innerHeight) < 520;
    E.pivot.style.display = (portrait && petit && !this.pivotVu) ? "flex" : "none";
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

    if (E.cmdT) E.cmdT.addEventListener("pointerdown", e => presser(0, e));
    if (E.cmdP) E.cmdP.addEventListener("pointerdown", e => presser(1, e));
    for (const b of [E.cmdT, E.cmdP]) if (b) b.addEventListener("click", e => e.preventDefault());

    /* moitié gauche / moitié droite de l'écran */
    if (E.cv) E.cv.addEventListener("pointerdown", e => {
      if (Jeu.phase !== "jeu") return;
      presser(e.clientX < globalThis.innerWidth / 2 ? 0 : 1, e);
    });

    globalThis.addEventListener("keydown", e => {
      if (e.repeat) return;
      const t = e.key.toLowerCase();
      if (t === "a" || t === "q" || t === "arrowleft"){ presser(0, e); return; }
      if (t === "l" || t === "p" || t === "m" || t === "arrowright"){ presser(1, e); return; }
      if (t === " " || t === "enter"){
        e.preventDefault();
        if (Jeu.phase === "titre") Jeu.demarrer();
        else if (Jeu.phase === "fin" && Interface.finAffichee) Jeu.demarrer();
        return;
      }
      if (t === "s"){ Sons.reveiller(); Sons.basculer(); return; }
      if (t === "d"){ Debug.basculer(); return; }
    }, { passive:false });

    if (E.btnJouer) E.btnJouer.addEventListener("click", () => { Sons.reveiller(); Sons.clic(); Jeu.demarrer(); });
    if (E.btnRejouer) E.btnRejouer.addEventListener("click", () => { Sons.clic(); Jeu.demarrer(); });
    if (E.pivotOk) E.pivotOk.addEventListener("click", () => { Interface.pivotVu = true; Interface.pensePivot(); });
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
      "moment   " + MOMENTS[Jeu.moment].nom + " (" + Jeu.fondu.toFixed(2) + ")";
  },
};

/* ================= boucle =================
   Pas de temps fixe à 60 Hz avec accumulateur : la difficulté est la
   même sur un écran 60, 90 ou 120 Hz. Rattrapage borné à 5 pas, sinon
   un retour d'onglet rejouerait plusieurs secondes d'un coup. */
const Boucle = {
  PAS_S:1 / 60, reste:0, precedent:0, pause:false, lent:false, tourne:false,

  demarrer(){
    if (this.tourne) return;
    this.tourne = true;
    this.precedent = (globalThis.performance || Date).now();
    const trame = maintenant => {
      const dt = Math.min(0.25, (maintenant - this.precedent) / 1000);
      this.precedent = maintenant;
      if (!this.pause){
        const echelle = (Jeu.phase === "fin" ? Jeu.ralenti : 1) * (this.lent ? 0.25 : 1);
        this.reste += dt * echelle;
        let n = 0;
        while (this.reste >= this.PAS_S && n < 5){ Jeu.pas(this.PAS_S); this.reste -= this.PAS_S; n++; }
        if (this.reste > this.PAS_S * 5) this.reste = 0;
      }
      dessiner();
      Debug.lire();
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
  charger(f => Interface.avancement(f)).then(() => {
    Interface.preparer();
    Jeu.retourTitre();          /* les sprites sont là : on repeuple la file du titre */
    ajusterCanevas();
    setTimeout(() => Interface.fermerIntro(), 120);
  });
}

if (typeof document !== "undefined" && document.readyState !== "loading") amorcer();
else if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", amorcer);

/* Exposé pour la suite de tests, qui exécute ce script hors navigateur. */
globalThis.DTOUR = {
  VERSION, ETAT, TYPES, MOMENTS, H_PERSO, PAS, PLACE_T, PLACE_PF, X_SALUT, Z_MIN,
  REACT_DEBUT, REACT_PLANCHER, VIES,
  xPlace, borne, melange, chiffres, doux,
  Difficulte, Score, File, Foule, Jeu, Heros, Camera, Effets, Sons, Images, Pnj,
  mainHeros, xSalut, ancreDe, amorcer, RECUL_SALUT,
  __dessiner:() => dessiner(),
  __ajuster:() => ajusterCanevas(),
};
