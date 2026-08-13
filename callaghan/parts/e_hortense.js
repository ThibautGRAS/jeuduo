
/* ==================================================================
   HORTENSE ET LA TARTE AU CITRON
   ------------------------------------------------------------------
   Événement greffé sur la partie, jamais bloquant : la file continue
   d'avancer, les mains continuent de se tendre. Hortense arrive par un
   bord, observe, arme son bras, lance, et repart en riant.

   Trois systèmes séparés, comme demandé :
     HortenseManager -> Hortense (le chef d'orchestre, ici `Tartes`)
     Hortense        -> `Hortense`
     PieProjectile   -> `Tarte`
     DodgeManager    -> `Esquive`
   Le GameManager (`Jeu`) ne fait que les appeler.
================================================================== */

/* ---------- rythme ---------- */
const HORTENSE_REPIT = 10;              /* jamais pendant les dix premières secondes */
const HORTENSE_ECART = [20, 40];        /* intervalle entre deux apparitions */
const HORTENSE_REPOS = 11;              /* jamais deux attaques plus rapprochées */
const P_FAUSSE_ALERTE = 0.10;
const P_DOUBLE_TARTE = 0.05;            /* et seulement après 90 s */
const DOUBLE_APRES = 90;

/* Temps de vol : long au début, court à la fin, jamais sous 0,60 s. */
const VOL_DEBUT = 1.20, VOL_PLANCHER = 0.60, VOL_TAUX = 0.982;
const FENETRE_ESQUIVE = 0.45;           /* la fenêtre utile, juste avant l'impact */
const VERROU_TROP_TOT = 0.25;           /* appuyer trop tôt bloque brièvement : pas de martèlement */
const TARTE_DUREE = 2.0;                /* combien de temps on reste couvert de meringue */

/* Hortense a sa propre profondeur : devant la file ET devant les
   arrivants, plus bas et plus grande. On ne peut pas la confondre avec
   quelqu'un qui fait la queue. */
const HORTENSE_Y = 0.46, HORTENSE_Z = 1.30;

const ETAT_H = {
  CACHEE:"CACHEE", ENTREE:"ENTREE", GUET:"GUET", PREPARE:"PREPARE",
  LANCE:"LANCE", RIRE:"RIRE", SORTIE:"SORTIE", REPOS:"REPOS",
};
const ETAT_TARTE = { DEPART:"DEPART", VOL:"VOL", ESQUIVEE:"ESQUIVEE", IMPACT:"IMPACT", FINIE:"FINIE" };

/* Durées des poses, en secondes. */
const DUREE_GUET = 0.85, DUREE_PREPARE = 0.70, DUREE_LANCE = 0.22, DUREE_RIRE = 0.80;

/* ---------- la tarte ---------- */
class Tarte {
  constructor(depart, cible, duree){
    this.x = depart.x; this.y = depart.y;
    this.x0 = depart.x; this.y0 = depart.y;
    this.cible = cible;                 /* indice du héros visé */
    this.but = Tartes.pointVise(cible);
    /* elle vise un point AU-DELÀ du héros : si celui-ci se baisse, la
       tarte poursuit sa route et va s'écraser derrière lui */
    const d = Math.sign(this.but.x - this.x0) || 1;
    this.fin = { x:this.but.x + d * 78, y:this.but.y + 26 };
    /* La tarte vise AU-DELÀ du héros : elle le croise donc avant la fin
       de sa course. Compter la fenêtre d'esquive sur la durée totale
       l'ouvrait après le choc — le joueur voyait le repère s'allumer
       une fois la meringue reçue. On repère l'instant du croisement. */
    this.tImpact = Math.abs(this.but.x - this.x0) / Math.max(1e-6, Math.abs(this.fin.x - this.x0));
    this.duree = duree;
    this.avancement = 0;
    /* Elle est en vol dès qu'elle quitte la main : garder un état
       DEPART d'une image faisait qu'une esquive tentée au tout premier
       instant ne trouvait aucune tarte et ne répondait rien. */
    this.etat = ETAT_TARTE.VOL;
    this.rotation = 0;
    this.vitesseRot = (d > 0 ? 1 : -1) * hasard(7, 10);
    this.collision = true;
    this.chrono = 0;
    this.arc = -hasard(30, 46);         /* la cloche du tir */
  }

  /* Reste-t-il assez peu de temps pour que l'esquive compte ? */
  get resteAvantImpact(){ return Math.max(0, (this.tImpact - this.avancement) * this.duree); }
  get fenetreOuverte(){ return this.etat === ETAT_TARTE.VOL && this.resteAvantImpact <= FENETRE_ESQUIVE; }

  position(t){
    const x = melange(this.x0, this.fin.x, t);
    const y = melange(this.y0, this.fin.y, t) + this.arc * Math.sin(Math.PI * t);
    return { x, y };
  }

  majorer(dt){
    if (this.etat === ETAT_TARTE.FINIE) return;
    if (this.etat === ETAT_TARTE.IMPACT){
      this.chrono -= dt;
      if (this.chrono <= 0) this.etat = ETAT_TARTE.FINIE;
      return;
    }
    if (this.etat === ETAT_TARTE.DEPART) this.etat = ETAT_TARTE.VOL;

    this.avancement = Math.min(1.25, this.avancement + dt / this.duree);
    const p = this.position(this.avancement);
    this.x = p.x; this.y = p.y;
    this.rotation += this.vitesseRot * dt;

    if (this.etat === ETAT_TARTE.VOL && this.collision && Esquive.touche(this)){
      Tartes.impact(this);
      return;
    }
    /* passé le héros, elle finit par s'écraser au sol */
    if (this.avancement >= 1){
      if (this.etat === ETAT_TARTE.ESQUIVEE || !this.collision) Tartes.ecraser(this);
      else Tartes.impact(this);
    }
  }
}

/* ---------- DodgeManager -> Esquive ---------- */
const Esquive = {
  verrou:0,

  raz(){ this.verrou = 0; },
  majorer(dt){ this.verrou = Math.max(0, this.verrou - dt); },

  /* Boîte de collision du héros : le torse et la tête, pas la totalité
     du sprite. Une tarte qui frôle les chaussures ne doit pas compter.
     Pendant l'esquive, elle descend avec lui. */
  boite(h){
    const H = Heros[h];
    const bas = H.esquive ? 0.42 : 0;
    return {
      x:xPlace(H.place), demi:0.17 * H_PERSO,
      haut:(-0.96 + bas) * H_PERSO, basY:(-0.34 + bas) * H_PERSO,
    };
  },

  touche(tarte){
    const b = this.boite(tarte.cible);
    if (Heros[tarte.cible].esquive) return false;
    return Math.abs(tarte.x - b.x) < b.demi && tarte.y > b.haut && tarte.y < b.basY;
  },

  /* Appelé quand le joueur presse ESQUIVER. */
  tenter(){
    if (Jeu.phase !== "jeu") return "rien";
    if (this.verrou > 0) return "verrou";
    const t = Tartes.tarteImminente();
    if (!t) return "rien";
    if (!t.fenetreOuverte){
      /* beaucoup trop tôt : aucune action, et on se verrouille un
         instant pour que marteler le bouton ne serve à rien */
      this.verrou = VERROU_TROP_TOT;
      Sons.tarteTropTot();
      return "tot";
    }
    return Tartes.reussirEsquive(t) ? "ok" : "rien";
  },
};

/* ---------- Hortense ---------- */
const Hortense = {
  etat:ETAT_H.CACHEE, x:0, vise:0, cote:1, chrono:0, cible:-1,
  fausse:false, cachette:null, doubleReste:0, phase:0,

  raz(){
    this.etat = ETAT_H.CACHEE; this.x = 0; this.chrono = 0; this.cible = -1;
    this.fausse = false; this.cachette = null; this.doubleReste = 0; this.phase = 0;
  },

  get visible(){ return this.etat !== ETAT_H.CACHEE && this.etat !== ETAT_H.REPOS; },

  /* Le sprite dépend de l'état ; c'est tout ce que le rendu a besoin de savoir. */
  get sprite(){
    if (this.cachette) return this.cachette;
    switch (this.etat){
      case ETAT_H.ENTREE: return this.phase % 2 < 1 ? "h_courtA" : "h_courtB";
      case ETAT_H.GUET: return "h_sournoise";
      case ETAT_H.PREPARE: return "h_arme";
      /* LE LANCER EST UN GESTE EN TROIS TEMPS. Il affichait `h_lance`
         pendant 0,22 s, et le RIRE la même image pendant 0,80 s : une
         seconde entière sur un dessin fixe, pour le geste qu'on regarde
         le plus dans ce niveau.
         Les trois phases se répartissent sur la durée de l'état, et le
         rire a désormais sa propre image. */
      case ETAT_H.LANCE: {
        const p = borne(this.chrono / DUREE_LANCE, 0, 0.999);
        return "h_lance" + (1 + Math.floor(p * 3));
      }
      case ETAT_H.RIRE: return "h_rire";
      case ETAT_H.SORTIE: return "h_courtB";
      default: return "h_debout";
    }
  },
  /* Elle regarde toujours vers les héros. */
  get versGauche(){ return this.cote > 0; },

  /* Position monde de sa main au moment du lancer. */
  main(){
    const h = H_PERSO * HORTENSE_Z;
    return { x:this.x + (this.cote > 0 ? -1 : 1) * 0.20 * h, y:-0.92 * h + HORTENSE_Y * H_PERSO };
  },
};

/* ---------- HortenseManager -> Tartes ---------- */
const Tartes = {
  tartes:[], debris:[], prochaine:0, derniere:-999,

  raz(){
    this.tartes = []; this.debris = []; this.derniere = -999;
    this.prochaine = HORTENSE_REPIT + hasard(2, 8);
    Hortense.raz(); Esquive.raz();
  },

  dureeVol(){
    return Math.max(VOL_PLANCHER, VOL_DEBUT * Math.pow(VOL_TAUX, Difficulte.saluts));
  },

  /* Point que la tarte cherche à atteindre : la tête et le buste. */
  pointVise(h){ return { x:xPlace(Heros[h].place), y:-0.66 * H_PERSO }; },

  tarteEnVol(){ return this.tartes.find(t => t.etat === ETAT_TARTE.VOL) || null; },

  /* La plus PRESSANTE, pas la première de la liste. Avec deux tartes en
     l'air, viser la première venue faisait répondre « trop tôt » alors
     que l'autre arrivait dans la fenêtre — et le verrou qui suit
     empêchait de l'esquiver. La double attaque était imperdable dans le
     mauvais sens du terme. */
  tarteImminente(){
    let choix = null;
    for (const t of this.tartes){
      if (t.etat !== ETAT_TARTE.VOL) continue;
      if (!choix || t.resteAvantImpact < choix.resteAvantImpact) choix = t;
    }
    return choix;
  },

  /* --------- apparition --------- */
  peutApparaitre(){
    if (Jeu.phase !== "jeu") return false;
    if (Jeu.temps < HORTENSE_REPIT) return false;
    if (Jeu.temps - this.derniere < HORTENSE_REPOS) return false;
    if (Hortense.visible || this.tartes.length) return false;
    /* jamais par-dessus une main déjà tendue qui va expirer : on ne
       veut pas demander deux gestes dans la même demi-seconde */
    for (const p of Jeu.demandes) if (p.chrono < 0.9) return false;
    return true;
  },

  apparaitre(force){
    if (!force && !this.peutApparaitre()) return null;
    Hortense.raz();
    Hortense.cote = Math.random() < 0.5 ? 1 : -1;   /* 1 : elle vient de la droite */
    Hortense.etat = ETAT_H.ENTREE;
    Hortense.fausse = !force && Math.random() < P_FAUSSE_ALERTE;
    Hortense.cible = Math.random() < 0.5 ? 0 : 1;
    Hortense.cachette = null;

    const marge = 0.7 * H_PERSO;
    if (Hortense.cote > 0){
      Hortense.x = Camera.bordDroit() + marge;
      Hortense.vise = Math.max(xSalut(1) + 0.7 * PAS, Camera.bordDroit() - 1.5 * H_PERSO);
    } else {
      Hortense.x = Camera.bordGauche() - marge;
      Hortense.vise = xPlace(PLACE_G) - 1.5 * H_PERSO;
    }
    /* une fois de temps en temps, elle se poste derrière un meuble */
    if (Math.random() < 0.28) Hortense.cachette = Math.random() < 0.5 ? "h_parasol" : "h_chaise";

    this.derniere = Jeu.temps;
    Effets.texte(Hortense.x, -1.5 * H_PERSO, "OH NON, HORTENSE", "#F7B32B", 0.95, 1.3);
    Sons.hortenseEntre();
    return Hortense;
  },

  /* --------- lancer --------- */
  lancer(cibleForce){
    const cible = cibleForce !== undefined ? cibleForce : Hortense.cible;
    Hortense.cible = cible;
    const t = new Tarte(Hortense.main(), cible, this.dureeVol());
    this.tartes.push(t);
    Sons.tarteLancee();
    return t;
  },

  reussirEsquive(t){
    if (t.etat !== ETAT_TARTE.VOL) return false;
    t.etat = ETAT_TARTE.ESQUIVEE;
    t.collision = false;
    /* Les DEUX se baissent. Il n'y a qu'un bouton d'esquive ; exiger
       deux appuis distincts quand Hortense lance deux tartes rendait la
       double attaque impossible à passer sans le savoir d'avance. */
    for (const h of Heros) h.esquive = { t:0, duree:0.55 };
    Score.esquives++;
    Score.points += 100;
    const p = this.pointVise(t.cible);
    Effets.texte(p.x, p.y - 34, "ESQUIVÉ !", "#8FE39B", 1.15, 1.0);
    Effets.texte(p.x, p.y - 62, "+100", "#F7B32B", 0.85, 1.0);
    Sons.tarteEsquive();
    Interface.majBandeau();
    return true;
  },

  impact(t){
    t.etat = ETAT_TARTE.IMPACT;
    t.chrono = 0.5;
    t.collision = false;
    const h = Heros[t.cible];
    h.tarte = TARTE_DUREE;
    h.sueur = 1.6;
    h.esquive = null;
    Score.recues++;
    Score.casser();
    Camera.secouer(1);
    Jeu.gel = 0.10;                       /* l'arrêt sur image de l'impact */
    this.eclabousser(t.x, t.y, 16);
    Effets.texte(t.x, t.y - 26, "SPLAT !", "#E2453D", 1.25, 1.1);
    Sons.tarteImpact();
    Jeu.perdreVie();
    Interface.majBandeau();
  },

  /* Elle finit par terre, derrière le héros. */
  ecraser(t){
    t.etat = ETAT_TARTE.IMPACT;
    t.chrono = 0.45;
    t.auSol = true;
    this.eclabousser(t.x, Math.min(-4, t.y), 9);
    Sons.tarteEcrasee();
  },

  eclabousser(x, y, n){
    for (let i = 0; i < n; i++){
      const a = hasard(-Math.PI * 0.95, -0.05), v = hasard(40, 145);
      this.debris.push({
        x, y, vx:Math.cos(a) * v, vy:Math.sin(a) * v, t:0, duree:hasard(0.6, 1.15),
        rot:hasard(0, 6.28), vrot:hasard(-7, 7),
        img:piocher(["debris_meringue","debris_citron","debris_part"]),
        taille:hasard(0.16, 0.30),
      });
    }
  },

  /* --------- boucle --------- */
  majorer(dt){
    Esquive.majorer(dt);

    /* les héros : esquive en cours et meringue sur la figure */
    for (const h of Heros){
      if (h.esquive){ h.esquive.t += dt; if (h.esquive.t >= h.esquive.duree) h.esquive = null; }
      if (h.tarte > 0) h.tarte = Math.max(0, h.tarte - dt);
    }

    for (const t of this.tartes) t.majorer(dt);
    this.tartes = this.tartes.filter(t => t.etat !== ETAT_TARTE.FINIE);

    for (const d of this.debris){
      d.t += dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 340 * dt; d.rot += d.vrot * dt;
      if (d.y > 0){ d.y = 0; d.vy *= -0.28; d.vx *= 0.55; }
    }
    this.debris = this.debris.filter(d => d.t < d.duree);

    if (Jeu.phase !== "jeu") return;

    /* apparition spontanée */
    if (!Hortense.visible && Jeu.temps >= this.prochaine){
      if (this.apparaitre()) this.prochaine = Jeu.temps + hasard(HORTENSE_ECART[0], HORTENSE_ECART[1]);
      else this.prochaine = Jeu.temps + 1.2;      /* le moment est mal choisi, on repasse plus tard */
    }

    this.majorerHortense(dt);
  },

  majorerHortense(dt){
    const H = Hortense;
    H.phase += dt * 6;
    const vit = VIT_MARCHE * 1.7;

    switch (H.etat){
      case ETAT_H.ENTREE: {
        const reste = H.vise - H.x;
        H.x += Math.sign(reste) * Math.min(Math.abs(reste), vit * dt);
        if (Math.abs(H.vise - H.x) < 1){
          H.etat = ETAT_H.GUET; H.chrono = DUREE_GUET;
        }
        break;
      }
      case ETAT_H.GUET:
        H.chrono -= dt;
        if (H.chrono <= 0){
          if (H.fausse){ H.etat = ETAT_H.SORTIE; Effets.texte(H.x, -1.35 * H_PERSO, "…bon.", "#93A4C4", 0.85); }
          else { H.etat = ETAT_H.PREPARE; H.chrono = DUREE_PREPARE; Sons.hortensePrepare(); }
        }
        break;
      case ETAT_H.PREPARE:
        H.chrono -= dt;
        if (H.chrono <= 0){ H.etat = ETAT_H.LANCE; H.chrono = DUREE_LANCE; this.lancer(); }
        break;
      case ETAT_H.LANCE:
        H.chrono -= dt;
        if (H.chrono <= 0){ H.etat = ETAT_H.RIRE; H.chrono = DUREE_RIRE; Sons.hortenseRit(); }
        break;
      case ETAT_H.RIRE:
        H.chrono -= dt;
        if (H.chrono <= 0){
          /* la double attaque : rare, tard dans la partie, et toujours
             annoncée par le même temps de préparation */
          if (H.doubleReste === 0 && Jeu.temps > DOUBLE_APRES && Math.random() < P_DOUBLE_TARTE){
            H.doubleReste = 1;
            H.cible = 1 - H.cible;
            H.etat = ETAT_H.PREPARE; H.chrono = DUREE_PREPARE * 1.15;
            Effets.texte(H.x, -1.42 * H_PERSO, "ENCORE UNE !", "#F7B32B", 1.0, 1.1);
            Sons.hortensePrepare();
          } else {
            H.doubleReste = 0;
            H.etat = ETAT_H.SORTIE;
          }
        }
        break;
      case ETAT_H.SORTIE: {
        const sortie = H.cote > 0 ? Camera.bordDroit() + H_PERSO : Camera.bordGauche() - H_PERSO;
        H.x += Math.sign(sortie - H.x) * vit * 1.25 * dt;
        H.cachette = null;
        if (Math.abs(sortie - H.x) < 6){ H.etat = ETAT_H.CACHEE; }
        break;
      }
    }
  },
};

/* ================= rendu d'Hortense et de la tarte ================= */

function dessinerHortense(voile){
  if (!Hortense.visible) return;
  const hauteur = H_PERSO * Camera.ech * HORTENSE_Z;
  const yBase = Camera.sol + HORTENSE_Y * H_PERSO * Camera.ech;
  const H = Hortense;

  /* Elle avance en trottinant : un balancement plus marqué que celui
     des gens de la file, elle n'est pas là pour attendre. */
  const court = H.etat === ETAT_H.ENTREE || H.etat === ETAT_H.SORTIE;
  const bob = court ? Math.abs(Math.sin(H.phase)) * hauteur * 0.035
                    : Math.sin(H.phase * 0.5) * hauteur * 0.006;
  let incline = 0;
  if (H.etat === ETAT_H.PREPARE) incline = 0.06 * (H.cote > 0 ? 1 : -1) * Math.sin(H.chrono * 9);
  if (H.etat === ETAT_H.LANCE) incline = -0.10 * (H.cote > 0 ? 1 : -1);

  ombreAuSol(H.x, yBase, hauteur, voile.ombre / 0.16);
  dessinerPerso(H.sprite, H.x, yBase - bob, hauteur, H.versGauche, incline, 1);

  /* Pendant qu'elle vise, un fil discret relie son regard au héros
     ciblé : on doit pouvoir deviner qui va prendre, sans qu'un panneau
     l'écrive. */
  if (H.etat === ETAT_H.PREPARE && H.cible >= 0){
    const dep = Camera.ecran(H.x), arr = Camera.ecran(xPlace(Heros[H.cible].place));
    const y = yBase - hauteur * 0.80;
    const yc = Camera.sol - H_PERSO * Camera.ech * 0.80;
    ctx.save();
    ctx.globalAlpha = 0.14 + 0.10 * Math.sin(Jeu.temps * 12);
    ctx.strokeStyle = Heros[H.cible].couleur;
    ctx.lineWidth = Math.max(1.5, hauteur * 0.014);
    ctx.setLineDash([hauteur * 0.05, hauteur * 0.055]);
    ctx.beginPath(); ctx.moveTo(dep, y); ctx.lineTo(arr, yc); ctx.stroke();
    ctx.restore();
    ctx.setLineDash([]);
  }
}

function dessinerTartes(){
  const ech = Camera.ech;

  for (const t of Tartes.tartes){
    const px = Camera.ecran(t.x), py = Camera.sol + t.y * ech;

    if (t.etat === ETAT_TARTE.IMPACT){
      const img = Images.table[t.auSol ? "tarte_ecrasee" : "tarte_boom"];
      if (img && img.naturalWidth){
        const av = 1 - borne(t.chrono / 0.5, 0, 1);
        const l = H_PERSO * ech * (t.auSol ? 0.85 : 1.5) * (0.7 + av * 0.5);
        const hh = l * img.naturalHeight / img.naturalWidth;
        ctx.save();
        ctx.globalAlpha = borne(1.25 - av, 0, 1);
        ctx.drawImage(img, px - l / 2, py - hh * (t.auSol ? 0.72 : 0.5), l, hh);
        ctx.restore();
      }
      continue;
    }

    /* Quatre orientations de la planche, enchaînées : ça suffit à faire
       tourner la tarte sans la déformer par une rotation lissée. */
    const n = ((Math.floor(t.rotation / (Math.PI / 2)) % 4) + 4) % 4;
    const img = Images.table["tarte" + n];
    if (!img || !img.naturalWidth) continue;
    const l = H_PERSO * ech * 0.62, hh = l * img.naturalHeight / img.naturalWidth;

    /* une traîne courte, pour qu'on la suive des yeux */
    ctx.save();
    for (let k = 3; k >= 1; k--){
      const p = t.position(Math.max(0, t.avancement - k * 0.045));
      ctx.globalAlpha = 0.10 * (4 - k);
      ctx.drawImage(img, Camera.ecran(p.x) - l / 2, Camera.sol + p.y * ech - hh / 2, l, hh);
    }
    ctx.globalAlpha = 1;
    ctx.drawImage(img, px - l / 2, py - hh / 2, l, hh);
    ctx.restore();
  }

  for (const d of Tartes.debris){
    const img = Images.table[d.img];
    if (!img || !img.naturalWidth) continue;
    const l = H_PERSO * ech * d.taille, hh = l * img.naturalHeight / img.naturalWidth;
    ctx.save();
    ctx.globalAlpha = borne(1 - Math.pow(d.t / d.duree, 2.5), 0, 1);
    ctx.translate(Camera.ecran(d.x), Camera.sol + d.y * ech);
    ctx.rotate(d.rot);
    ctx.drawImage(img, -l / 2, -hh / 2, l, hh);
    ctx.restore();
  }

  if (Debug.ouvert) dessinerDebugTarte();
}

/* Tracé de contrôle : boîte de collision, trajectoire, fenêtre d'esquive. */
function dessinerDebugTarte(){
  ctx.save();
  ctx.lineWidth = 1.5;
  for (let i = 0; i < Heros.length; i++){
    const b = Esquive.boite(i);
    ctx.strokeStyle = Heros[i].esquive ? "#8FE39B" : "#E2453D";
    const x0 = Camera.ecran(b.x - b.demi), x1 = Camera.ecran(b.x + b.demi);
    const y0 = Camera.sol + b.haut * Camera.ech, y1 = Camera.sol + b.basY * Camera.ech;
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  }
  for (const t of Tartes.tartes){
    if (t.etat === ETAT_TARTE.IMPACT) continue;
    ctx.strokeStyle = t.fenetreOuverte ? "#F7B32B" : "rgba(255,255,255,.45)";
    ctx.beginPath();
    for (let k = 0; k <= 24; k++){
      const p = t.position(k / 24);
      const px = Camera.ecran(p.x), py = Camera.sol + p.y * Camera.ech;
      k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();
}
