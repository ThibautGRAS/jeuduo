
/* ================= UIManager -> Interface ================= */
const E = {};
function accrocher(){
  for (const id of ["cv","intro","jauge","titre","logo","btnJouer","hud","vScore","vCombo","cCombo","miniT","miniP","tRecord",
                    "vFile","vies","pupitre","cmdT","cmdP","cmdE","visageT","visageP","nomG","nomD","legG","legD","cibleG","cibleD","fin","fScore","fCombo",
                    "fSaluts","fFile","fEsquives","fRecues","fRecord","btnRejouer","pivot","pivotOk",
                    "cmdE","outilsBtn","debug",
                    "dVitesse","dVitesseV","dReaction","dReactionV","dLecture","version","pleinBtn","pivotTitre","pivotTexte"]){
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
function paysageOk(L, H){ return L >= H * 1.02; }

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

const Interface = {
  finAffichee:false, dernierCombo:0,

  preparer(){
    if (E.version) E.version.textContent = "D'TOUR v" + VERSION;
    if (E.logo && Images.table.logo) E.logo.src = Images.table.logo.src;
    /* Prénoms, portraits et libellés : tout se déduit du tableau Heros,
       dans l'ordre gauche puis droite. Les identifiants HTML gardent
       leurs vieilles lettres T et P, qui désignent désormais la place
       et non la personne. */
    const cases = [
      { img:[E.visageT, E.miniT], nom:E.nomG, leg:E.legG, cible:E.cibleG, bouton:E.cmdT },
      { img:[E.visageP, E.miniP], nom:E.nomD, leg:E.legD, cible:E.cibleD, bouton:E.cmdP },
    ];
    for (let i = 0; i < Heros.length; i++){
      const h = Heros[i], c = cases[i];
      const face = Images.table["face_" + h.sprite];
      for (const el of c.img) if (el && face){ el.src = face.src; el.alt = h.court; }
      if (c.nom) c.nom.textContent = h.court;
      if (c.leg) c.leg.textContent = h.court;
      if (c.cible) c.cible.textContent = "Cible : " + h.court;
      if (c.bouton && c.bouton.setAttribute) c.bouton.setAttribute("aria-label", "Saluer " + h.court);
    }
    const r = lireRecords();
    if (E.tRecord) E.tRecord.textContent = r.score ? "MEILLEUR SCORE " + chiffres(r.score) : "";
  },
  avancement(f){ if (E.jauge) E.jauge.style.width = Math.round(f * 100) + "%"; },
  fermerIntro(){ if (E.intro) E.intro.classList.add("parti"); },

  entrerTitre(){
    this.finAffichee = false;
    const r = lireRecords();
    if (E.tRecord) E.tRecord.textContent = r.score ? "MEILLEUR SCORE " + chiffres(r.score) : "";
    if (E.titre) E.titre.classList.remove("parti");
    if (E.fin) E.fin.classList.remove("on");
    if (E.hud) E.hud.classList.remove("on");
    if (E.pupitre) E.pupitre.classList.remove("on");
    if (E.outilsBtn) E.outilsBtn.classList.remove("on");
    if (E.pleinBtn) E.pleinBtn.classList.remove("on");
  },
  entrerJeu(){
    this.finAffichee = false;
    if (E.titre) E.titre.classList.add("parti");
    if (E.fin) E.fin.classList.remove("on");
    if (E.hud) E.hud.classList.add("on");
    if (E.pupitre) E.pupitre.classList.add("on");
    if (E.outilsBtn && Debug.autorise) E.outilsBtn.classList.add("on");
    if (E.pleinBtn) E.pleinBtn.classList.add("on");
    this.majVies(); this.majBandeau();
  },
  sortirJeu(){ if (E.pupitre) E.pupitre.classList.remove("on"); },

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
  afficherFin(){
    this.finAffichee = true;
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
  pensePivot(){
    const L = globalThis.innerWidth || 1, H = globalThis.innerHeight || 1;
    const bloque = !paysageOk(L, H);
    if (E.pivot) E.pivot.classList.toggle("on", bloque);
    if (bloque && E.pivotTitre && E.pivotTexte){
      const doigt = globalThis.matchMedia && globalThis.matchMedia("(pointer:coarse)").matches;
      E.pivotTitre.textContent = doigt ? "Tourne ton téléphone" : "Élargis la fenêtre";
      E.pivotTexte.textContent = doigt
        ? "La file du D'Tour se joue en paysage : il faut voir la file entière."
        : "La file du D'Tour se joue dans une fenêtre plus large que haute.";
    }
    if (bloque) Boucle.pause = true;
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
      Esquive.tenter();
    };
    Entrees.esquiver = esquiver;

    if (E.cmdT) E.cmdT.addEventListener("pointerdown", e => presser(0, e));
    if (E.cmdP) E.cmdP.addEventListener("pointerdown", e => presser(1, e));
    if (E.cmdE) E.cmdE.addEventListener("pointerdown", e => esquiver(e));
    for (const b of [E.cmdT, E.cmdP, E.cmdE]) if (b) b.addEventListener("click", e => e.preventDefault());

    /* Trois zones sur le canevas, dans l'ordre où les personnages sont
       à l'écran : Thibaut à gauche, l'esquive au milieu sous le pouce,
       Pierre-François à droite. Le pouce n'a jamais à traverser. */
    if (E.cv) E.cv.addEventListener("pointerdown", e => {
      if (Jeu.phase !== "jeu") return;
      const f = e.clientX / Math.max(1, globalThis.innerWidth);
      if (f < 0.36) presser(0, e);
      else if (f > 0.64) presser(1, e);
      else esquiver(e);
    });

    globalThis.addEventListener("keydown", e => {
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
    }, { passive:false });

    /* Le plein écran ne s'obtient que dans un vrai geste utilisateur :
       c'est ici, et nulle part ailleurs, qu'il faut le demander. */
    if (E.btnJouer) E.btnJouer.addEventListener("click", () => {
      Sons.reveiller(); Sons.clic(); Ecran.demander(); Jeu.demarrer();
    });
    if (E.btnRejouer) E.btnRejouer.addEventListener("click", () => { Sons.clic(); Jeu.demarrer(); });
    if (E.pleinBtn) E.pleinBtn.addEventListener("click", () => { Sons.clic(); Ecran.basculer(); });
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
  VERSION, ETAT, TYPES, MOMENTS, H_PERSO, PAS, PLACE_G, PLACE_D, X_SALUT, Z_MIN,
  REACT_DEBUT, REACT_PLANCHER, VIES,
  xPlace, borne, melange, chiffres, doux,
  Difficulte, Score, File, Foule, Jeu, Heros, Camera, Effets, Sons, Images, Pnj,
  mainHeros, xSalut, ancreDe, amorcer, RECUL_SALUT, paysageOk, Ecran, Interface,
  Hortense, Tartes, Esquive, Tarte, ETAT_H, ETAT_TARTE,
  FENETRE_ESQUIVE, VOL_DEBUT, VOL_PLANCHER, HORTENSE_REPIT, HORTENSE_REPOS, TARTE_DUREE,
  __dessiner:() => dessiner(),
  __ajuster:() => ajusterCanevas(),
};
