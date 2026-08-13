"use strict";
/* ==================================================================
   NIVEAU 3 — RENDU
   ------------------------------------------------------------------
   Même partage des rôles qu'au niveau 2 : h_bar.js ne connaît que des
   fractions du monde, ce fichier les convertit en pixels.
================================================================== */

const BarVue = {
  larg(){
    const img = Images.table.fond_bar;
    if (!img || !img.naturalWidth) return Camera.L;
    return BAR_COPIES * img.naturalWidth * (Camera.H / img.naturalHeight);
  },
  origine(){ return -borne(Camera.xBar, 0, Math.max(0, this.larg() - Camera.L)); },
  ex(fx){ return this.origine() + fx * this.larg(); },
  ey(fy){ return fy * Camera.H; },

  dessiner(){
    const L = Camera.L, H = Camera.H;
    const T = Tournee;
    const img = Images.table.fond_bar;
    if (!img || !img.naturalWidth){ ctx.fillStyle = "#120A18"; ctx.fillRect(0, 0, L, H); return; }

    /* L'INTRO PASSE AVANT TOUT, y compris avant l'écran de choix. Elle
       était peinte à la fin de `dessiner()`, donc le `return` du choix
       l'emportait : au premier lancement on tombait sur le bar et le
       pupitre sans jamais la voir, alors qu'au rejeu elle apparaissait.
       Un écran de présentation ne doit dépendre d'aucun autre état. */
    if (T.introT > 0){ this.dessinerIntro(); return; }
    if (T.enChoix){ this.dessinerChoix(); return; }

    const trem = T.secousse > 0 ? Math.sin(T.secousse * 62) * 5 * T.secousse : 0;
    ctx.clearRect(0, 0, L, H);
    ctx.imageSmoothingEnabled = true;
    if ("imageSmoothingQuality" in ctx) ctx.imageSmoothingQuality = "high";
    ctx.save();
    ctx.translate(trem, 0);
    /* le monde = le fond répété : un seul très long comptoir */
    const lUne = this.larg() / BAR_COPIES;
    for (let k = 0; k < BAR_COPIES; k++){
      const x0 = this.origine() + k * lUne;
      if (x0 > L || x0 + lUne < 0) continue;
      ctx.drawImage(img, x0, 0, lUne + 1, H);
    }

    this.dessinerNeon();
    this.dessinerBarmans();
    this.dessinerHalos();
    this.dessinerVerres();
    if (T.invite) this.dessinerInvite();
    this.dessinerClients();
    this.dessinerHeros();
    /* LA FOULE PASSE APRÈS LE CHAMPION : c'est tout l'intérêt du premier
       plan, il circule DERRIÈRE eux. Mais après les verres aussi, sans
       jamais les couvrir — ils sont bien plus bas que le comptoir. */
    this.dessinerFoule();
    if (T.tarte) this.dessinerTarte();

    /* Le coup de feu réchauffe la salle. */
    if (T.coupDeFeu){
      const p = 0.5 + 0.5 * Math.sin(T.coupT * 6);
      ctx.fillStyle = "rgba(255,120,40," + (0.05 + 0.05 * p).toFixed(3) + ")";
      ctx.fillRect(-trem, 0, L + Math.abs(trem) * 2, H);
    }
    ctx.restore();

    /* Pompette : la salle se dédouble. Pas de ctx.filter — coûteux et
       inégal selon Safari — on recopie le canevas sur lui-même, décalé
       et translucide. Le bandeau se dessine APRÈS : lui reste net. */
    if (T.bourre > 0){
      const int2 = Math.min(1, T.bourre);
      const cvs = ctx.canvas;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 0.26 * int2;
      const dx = Math.sin(T.temps * 5.3) * 7 * int2;
      const dy = Math.cos(T.temps * 4.1) * 3 * int2;
      ctx.drawImage(cvs, dx, dy, cvs.width, cvs.height);
      ctx.restore();
      /* et un léger voile chaud, l'œil qui pique */
      ctx.save();
      ctx.fillStyle = "rgba(255,140,190," + (0.045 * int2).toFixed(3) + ")";
      ctx.fillRect(0, 0, L, H);
      ctx.restore();
    }

    /* le comptoir prend la lumière quand ça se passe bien */
    if (T.flash > 0){
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "rgba(255,232,170," + (0.16 * T.flash / 0.22).toFixed(3) + ")";
      ctx.fillRect(0, 0, L, H);
      ctx.restore();
    }

    if (T.actif && !T.fini) this.dessinerBords();
    if (T.actif || T.fini) this.dessinerBandeau();
    if (T.message) this.dessinerMessage();

    /* L'AFFICHE EN DERNIER, par-dessus le HUD : c'est un écran de
       présentation, pas une surimpression. Posée au milieu du dessin,
       la jauge d'ambiance et le score lui passaient dessus. */

  },

  /* --------- choix du champion --------- */
  dessinerChoix(){
    const L = Camera.L, H = Camera.H;
    ctx.clearRect(0, 0, L, H);
    ctx.fillStyle = "#120A18"; ctx.fillRect(0, 0, L, H);
    const taille = Math.max(12, H * 0.055);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "800 " + Math.round(taille) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.fillStyle = "#F7B32B";
    ctx.fillText("CHOISIS TON CHAMPION", L / 2, H * 0.10);

    const T = Tournee;
    BAR_CHAMPIONS.forEach((c, k) => {
      const cx = L * (0.28 + k * 0.44);
      const choisi = k === T.choixChamp;
      const cadreL = L * 0.36, cadreH = H * 0.66, cy = H * 0.46;
      ctx.save();
      ctx.globalAlpha = choisi ? 1 : 0.55;
      arrondi(cx - cadreL / 2, cy - cadreH / 2, cadreL, cadreH, 12);
      ctx.fillStyle = "rgba(28,20,36,.92)"; ctx.fill();
      ctx.lineWidth = choisi ? 4 : 2;
      ctx.strokeStyle = choisi ? Heros[c.heros].couleur : "rgba(255,255,255,.25)";
      ctx.stroke();
      /* Le champion choisi lève son verre, l'autre attend : l'écran de
         choix montre enfin ce qui les distingue. */
      const spr = Images.table[poseBar(c, choisi ? "tient" : "idle")];
      if (spr && spr.naturalWidth){
        const sh = cadreH * 0.52, sl = sh * spr.naturalWidth / spr.naturalHeight;
        ctx.drawImage(spr, cx - sl / 2, cy - cadreH * 0.44, sl, sh);
      }
      ctx.font = "800 " + Math.round(taille * 0.8) + "px 'Baloo 2', system-ui, sans-serif";
      ctx.fillStyle = "#FFF";
      ctx.fillText(c.nom, cx, cy + cadreH * 0.14);
      /* les deux jauges, en carrés pleins et vides comme sur l'ardoise */
      const jauges = [["VITESSE", c.jauges.vitesse], ["DESCENTE", c.jauges.descente]];
      ctx.font = "700 " + Math.round(taille * 0.46) + "px 'Baloo 2', system-ui, sans-serif";
      jauges.forEach(([nom, n], j) => {
        const y = cy + cadreH * (0.24 + j * 0.10);
        ctx.fillStyle = "#8496B6"; ctx.textAlign = "right";
        ctx.fillText(nom, cx - cadreL * 0.04, y);
        ctx.textAlign = "left"; ctx.fillStyle = "#F7B32B";
        ctx.fillText("■".repeat(n) + "□".repeat(5 - n), cx + cadreL * 0.02, y);
        ctx.textAlign = "center";
      });
      ctx.font = "600 " + Math.round(taille * 0.40) + "px 'Baloo 2', system-ui, sans-serif";
      ctx.fillStyle = "#B9AFC6";
      ctx.fillText(c.devise, cx, cy + cadreH * 0.44, cadreL * 0.92);
      ctx.restore();
    });
    const t2 = Math.max(10, H * 0.036);
    ctx.font = "700 " + Math.round(t2) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.fillStyle = "#8FD79B";
    ctx.fillText("Touchez un champion, puis BOIRE pour lancer la tournée", L / 2, H * 0.90);
  },

  /* La zone touchée sur l'écran de choix : gauche, droite, ou validation. */
  toucherChoix(fx){
    const T = Tournee;
    const k = fx < 0.5 ? 0 : 1;
    if (k === T.choixChamp) T.lancer();
    else T.choisir(k);
  },

  /* --------- la scène --------- */
  dessinerBarmans(){
    const H = Camera.H;
    for (const b of Tournee.barmans){
      const spr = Images.table[b.pose];
      if (!spr || !spr.naturalWidth) continue;
      /* Toutes les poses de barman ont la même hauteur source et le même
         trait de coupe : une seule hauteur d'écran suffit donc, et le bas
         du sprite se pose PILE sur le comptoir. Avant, des poses de
         cadrages différents à hauteur constante faisaient grandir et
         rétrécir le barman à chaque geste. */
      /* Jojo est petit : son échelle vient d'ECHELLE_PERSO, déclarée une
         seule fois pour tous les endroits où il apparaît. */
      const sh = H * BAR_TAILLE_BARMAN * echellePerso(b.ref.id);
      const sl = sh * spr.naturalWidth / spr.naturalHeight;
      const x = this.ex(b.ref.x);
      /* SA ligne de comptoir, pas la moyenne : le plateau descend de
         0,538 à 0,610 entre les deux postes. */
      const plateau = b.ref.comptoir || BAR_COMPTOIR;
      ctx.drawImage(spr, x - sl / 2, this.ey(plateau) - sh * 0.98, sl, sh);
      if (b.etat === "prepare"){
        /* petit indicateur au-dessus : quelque chose arrive */
        const p = borne(b.t / b.duree, 0, 1);
        const y = this.ey(BAR_COMPTOIR) - sh * 1.06;
        ctx.beginPath(); ctx.arc(x, y, H * 0.016, -Math.PI / 2, -Math.PI / 2 + p * 6.283);
        ctx.strokeStyle = "#F7B32B"; ctx.lineWidth = Math.max(2, H * 0.008); ctx.stroke();
      }
    }
  },

  dessinerVerres(){
    const H = Camera.H;
    for (const v of Tournee.verres){
      const B = BOISSONS[v.type];
      const spr = Images.table[B.sprite];
      if (!spr || !spr.naturalWidth) continue;
      const sh = H * (v.type === "cocktail" ? 0.135 : 0.105);
      const sl = sh * spr.naturalWidth / spr.naturalHeight;
      const x = this.ex(v.x), y = this.ey(BAR_COMPTOIR);
      ctx.save();
      /* un verre qui traîne s'éteint : plus de jauge, moins de couleur */
      if (v.etat === ETAT_VERRE.TRAINE) ctx.globalAlpha = 0.55;
      ctx.drawImage(spr, x - sl / 2, y - sh, sl, sh);
      if (v.etat === "POSE"){
        /* la jauge circulaire de vie du verre */
        const p = 1 - v.t / v.vie;
        ctx.beginPath(); ctx.arc(x, y - sh - H * 0.028, H * 0.015, -Math.PI / 2, -Math.PI / 2 + p * 6.283);
        ctx.strokeStyle = p > 0.35 ? "#8FD79B" : "#E8574B";
        ctx.lineWidth = Math.max(2, H * 0.008); ctx.stroke();
      }
      ctx.restore();
    }
  },

  dessinerHeros(){
    const T = Tournee, H = Camera.H;
    const c = T.champion;
    if (!c) return;
    const spr = Images.table[poseBar(c, T.pose())];
    if (!spr || !spr.naturalWidth) return;
    const sh = H * BAR_TAILLE_HEROS, sl = sh * spr.naturalWidth / spr.naturalHeight;
    const x = this.ex(T.x);
    const y = this.ey(BAR_SOL);
    /* LE SURSAUT ET L'INCLINAISON portent l'animation que deux poses ne
       peuvent pas porter seules. L'ancien sursaut faisait 0,008 de
       hauteur — trois pixels sur un téléphone, invisible — et battait à
       une fréquence sans rapport avec la pose affichée.

       Il est maintenant accroché à la MÊME phase que la pose, à deux
       battements par cycle : un par contact de pied. C'est ce qui fait
       qu'un cycle à deux images se lit comme une course. */
    /* LE SURSAUT DU CODE DISPARAÎT PENDANT LA COURSE. Il datait du temps
       où il n'y avait que DEUX poses : il portait alors seul le mouvement
       vertical. Le cycle en a quatre maintenant, et les sprites portent
       ce mouvement eux-mêmes — la phase de suspension est dessinée 41 px
       en l'air.
       Les deux se cumulaient : 23 px de saut de tête entre sprites plus
       8 px de code, soit 31 px de tressautement onze fois par seconde.
       C'est ça, le « ça sautille ».
       Il reste pour la MARCHE, dont les trois sprites sont posés au sol
       et ne portent aucun mouvement vertical. */
    const court = T.dureeMarche > 0.6;
    const phase = T.foulee * BAR_CADENCE_COURSE * Math.PI;
    const enMouvement = T.marche !== 0 && T.boitT <= 0;
    const saut = (enMouvement && !court)
      ? Math.abs(Math.sin(phase)) * H * BAR_SAUT_COURSE * 0.45 : 0;
    /* et il se penche vers l'avant quand il court : sans ça il a l'air de
       glisser debout */
    /* L'inclinaison ne PULSE plus. Elle oscillait à `phase * 2`, soit
       quatre fois par cycle alors qu'une foulée n'a que deux appuis : un
       tremblement de plus, sans rapport avec les jambes. Un coureur se
       penche en avant et y reste. */
    const penche = (enMouvement && court) ? BAR_PENCHE_COURSE * T.dir : 0;
    ctx.save();
    /* ombre courte au contact des pieds — même recette qu'au niveau 2 */
    ctx.fillStyle = "rgba(0,0,0,.30)";
    ctx.beginPath(); ctx.ellipse(x, y, sl * 0.30, H * 0.014, 0, 0, 6.283); ctx.fill();
    if (T.bourre > 0){
      /* pompette : on tangue autour des pieds */
      const roulis = Math.sin(T.temps * 3.1) * 0.10 * Math.min(1, T.bourre);
      ctx.translate(x, y); ctx.rotate(roulis); ctx.translate(-x, -y);
    }
    if (penche){
      /* pivot sur les PIEDS, pas sur le centre : pivoter au centre ferait
         passer les pieds sous le sol d'un côté et flotter de l'autre */
      ctx.translate(x, y); ctx.rotate(penche); ctx.translate(-x, -y);
    }
    if (T.dir < 0){ ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }
    ctx.drawImage(spr, x - sl / 2, y - sh - saut, sl, sh);
    ctx.restore();
  },

  dessinerInvite(){
    const T = Tournee, H = Camera.H;
    const inv = T.invite;
    const spr = Images.table[T.poseInvite()];
    if (!spr || !spr.naturalWidth) return;
    const sh = H * (inv.qui === "chat" ? 0.11 : 0.42);
    const sl = sh * spr.naturalWidth / spr.naturalHeight;
    const x = this.ex(inv.x), y = this.ey(BAR_SOL);
    ctx.save();
    ctx.globalAlpha = 0.96;
    ctx.drawImage(spr, x - sl / 2, y - sh, sl, sh);
    ctx.restore();
  },

  /* --------- les lumières du comptoir ---------
     Aucun shadowBlur : tout est en dégradés. Ce n'est pas que de la
     déco — le halo sous un verre dit sa nature d'un coup d'œil (chaud
     pour un cocktail, ambré pour un Jäger, FROID pour l'eau), et c'est
     ce qui rend le piège lisible à pleine vitesse. */
  TEINTES:{ cocktail:[255, 138, 60], jager:[247, 179, 43], eau:[120, 200, 255] },

  halo(x, y, r, teinte, force){
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const c = teinte;
    g.addColorStop(0, "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + (0.80 * force).toFixed(3) + ")");
    g.addColorStop(0.5, "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + (0.26 * force).toFixed(3) + ")");
    g.addColorStop(1, "rgba(" + c[0] + "," + c[1] + "," + c[2] + ",0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.42, 0, 0, 6.283); ctx.fill();
  },

  /* le liseré de néon qui court le long du comptoir, au tempo de la
     musique — même source que Sons.ordonnerMusique, sinon l'œil et
     l'oreille se contredisent */
  dessinerNeon(){
    const T = Tournee, H = Camera.H, L = Camera.L;
    const noire = 60 / T.tempo();
    const battement = (T.temps % noire) / noire;
    const puls = 0.35 + 0.65 * Math.pow(1 - battement, 2.2);
    const teinte = T.combo >= 10 ? [232, 87, 75] : T.combo >= 5 ? [247, 179, 43] : [190, 110, 255];
    const y = this.ey(BAR_COMPTOIR) + H * 0.012;
    const g = ctx.createLinearGradient(0, y - H * 0.03, 0, y + H * 0.02);
    const t = teinte;
    g.addColorStop(0, "rgba(" + t.join(",") + ",0)");
    g.addColorStop(0.5, "rgba(" + t.join(",") + "," + (0.44 * puls).toFixed(3) + ")");
    g.addColorStop(1, "rgba(" + t.join(",") + ",0)");
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = g;
    ctx.fillRect(0, y - H * 0.03, L, H * 0.05);
    /* à gros combo, deux taches qui balaient le plafond */
    if (T.combo >= 5){
      for (const sens of [1, -1]){
        const bx = L * (0.5 + sens * 0.34 * Math.sin(T.temps * 0.9 + (sens > 0 ? 0 : 1.7)));
        this.halo(bx, H * 0.10, H * 0.20, teinte, 0.5 * puls);
      }
    }
    ctx.restore();
  },

  /* un halo sous chaque verre, plus un projecteur sur celui qui vient
     d'être posé : le CLAC s'entend, maintenant il se voit */
  dessinerHalos(){
    const T = Tournee, H = Camera.H;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const v of T.verres){
      const teinte = this.TEINTES[v.type] || [255, 255, 255];
      const x = this.ex(v.x), y = this.ey(BAR_COMPTOIR);
      const vieux = v.etat === ETAT_VERRE.TRAINE;
      this.halo(x, y, H * (vieux ? 0.065 : 0.115), teinte, vieux ? 0.32 : 1);
      /* le projecteur : un cône depuis les spots, la première seconde */
      if (v.etat === ETAT_VERRE.POSE && v.t < 1.1){
        const f = 1 - v.t / 1.1;
        const haut = 0, lh = H * 0.030, lb = H * 0.11;
        const g = ctx.createLinearGradient(0, haut, 0, y);
        g.addColorStop(0, "rgba(" + teinte.join(",") + "," + (0.10 * f).toFixed(3) + ")");
        g.addColorStop(0.65, "rgba(" + teinte.join(",") + "," + (0.30 * f).toFixed(3) + ")");
        g.addColorStop(1, "rgba(" + teinte.join(",") + ",0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x - lh, haut); ctx.lineTo(x + lh, haut);
        ctx.lineTo(x + lb, y); ctx.lineTo(x - lb, y);
        ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
  },

  /* --------- les habitués --------- */
  /* --------- la foule du premier plan --------- */
  /* L'AFFICHE DU NIVEAU, avant la première image. Elle annonce le
     niveau et donne au navigateur le temps de finir de charger le décor
     — même service que l'intro de la ruelle. Une tape la passe. */
  /* L'ÉCRAN D'INTRODUCTION, en PLEIN ÉCRAN et non posé sur la scène.
     Même forme qu'au niveau 4 : un fond flou, le duo par-dessus, le nom
     du niveau, et une invite. Posée sur le bar en clair, l'affiche se
     mélangeait au décor qu'elle est censée présenter. */
  dessinerIntro(){
    const L = Camera.L, H = Camera.H, t = Tournee.introT;
    const al = borne(t / 0.30, 0, 1);
    ctx.save();
    ctx.globalAlpha = al;

    /* le bar, flouté et assombri : on reconnaît le lieu sans le lire */
    const fond = Images.table.fond_bar_flou;
    ctx.fillStyle = "#0A0714";
    ctx.fillRect(0, 0, L, H);
    if (fond && fond.naturalWidth){
      const e = Math.max(L / fond.naturalWidth, H / fond.naturalHeight);
      const l = fond.naturalWidth * e, h = fond.naturalHeight * e;
      ctx.globalAlpha = al * 0.85;
      ctx.drawImage(fond, (L - l) / 2, (H - h) / 2, l, h);
      ctx.globalAlpha = al;
    }
    /* un voile qui remonte du bas : il détache le texte du décor */
    const v = ctx.createLinearGradient(0, H * 0.62, 0, H);
    v.addColorStop(0, "rgba(10,7,20,0)");
    v.addColorStop(1, "rgba(10,7,20,.92)");
    ctx.fillStyle = v;
    ctx.fillRect(0, H * 0.62, L, H * 0.38);

    /* LE DUO, COMPOSÉ EN ADDITIF plutôt que détouré. Son fond est noir
       pur (mesuré : 1 de luminance aux coins) et les personnages sont
       cernés d'un néon. Un détourage coupait DANS ce néon et laissait un
       halo sale ; en additif, le noir n'ajoute rien, le néon se fond dans
       la nuit du bar et les deux noms peints restent nets. Aucune
       découpe, donc aucun artefact possible.

       Contenu et non recadré : les deux noms font partie de l'image,
       les couper reviendrait à couper le titre. */
    const duo = Images.table.duo_bar;
    if (duo && duo.naturalWidth){
      const av = borne((BAR_INTRO_DUREE - t) / 0.5, 0, 1);
      const e2 = Math.min((L * 1.00) / duo.naturalWidth,
                          (H * 0.86) / duo.naturalHeight);
      const l2 = duo.naturalWidth * e2, h2 = duo.naturalHeight * e2;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = al * av;
      ctx.drawImage(duo, (L - l2) / 2,
                    H * 0.44 - h2 / 2 + (1 - av) * H * 0.04, l2, h2);
      ctx.restore();
      ctx.globalAlpha = al;
    }

    /* Une bande sombre derrière le titre : le duo descend bas et le texte
       se posait sur ses jambes. Elle vient APRÈS le duo, donc par-dessus,
       et en mode normal — pas additif, sinon elle éclaircirait. */
    const bt = ctx.createLinearGradient(0, H * 0.72, 0, H);
    bt.addColorStop(0, "rgba(8,5,16,0)");
    bt.addColorStop(0.40, "rgba(8,5,16,.88)");
    bt.addColorStop(1, "rgba(8,5,16,.96)");
    ctx.fillStyle = bt;
    ctx.fillRect(0, H * 0.72, L, H * 0.28);

    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#F7B32B";
    BarVue.texteQuiTient("LA TOURNÉE DU D'TOUR", L / 2, H * 0.865, L * 0.88,
                         H * 0.085, "800");
    ctx.fillStyle = "rgba(237,231,250,.62)";
    ctx.font = "700 " + Math.round(H * 0.038) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.fillText("Touchez pour commencer", L / 2, H * 0.950);
    ctx.textAlign = "left";
    ctx.restore();
  },

  /* Écrit centré sans jamais dépasser `large` : on part de la taille
     voulue et on descend tant que ça ne rentre pas. */
  texteQuiTient(txt, x, y, large, taille, gras){
    if (!txt) return;
    let t2 = taille;
    for (let k = 0; k < 15; k++){
      ctx.font = gras + " " + Math.round(t2) + "px 'Baloo 2', system-ui, sans-serif";
      if (ctx.measureText(txt).width <= large) break;
      t2 *= 0.92;
    }
    ctx.fillText(txt, x, y);
  },

  dessinerFoule(){
    const L = Camera.L, H = Camera.H;
    const T = Tournee;
    if (!T.foule) return;
    /* du plus lointain au plus proche : les grappes du bas passent
       devant celles qui se baladent, pour que personne ne semble
       traverser un voisin */
    const liste = T.foule.slice().sort((a, b) => a.x - b.x);
    for (const m of liste){
      const pose = m.etat === "grappe" ? "idle" : "marche" + (1 + (Math.floor(m.foulee) % 2));
      const spr = Images.table[m.ref.prefixe + "_" + pose]
               || Images.table[m.ref.prefixe + "_idle"]
               || Images.table[m.ref.sprite];
      if (!spr || !spr.naturalWidth) continue;
      const sh = H * FOULE_TAILLE * m.ref.taille * echellePerso(m.ref.id);
      const sl = sh * spr.naturalWidth / spr.naturalHeight;
      /* `ex` convertit une position DU MONDE en position d'écran : la
         grappe reste sur place quand le champion se déplace, et on la
         dépasse. Hors champ, on ne la dessine pas. */
      const x = this.ex(m.x), y = H * FOULE_PIEDS;
      if (x < -L * 0.25 || x > L * 1.25) continue;
      ctx.save();
      /* un cran plus sombre que le champion : ils sont du décor vivant,
         ils ne doivent pas se disputer l'œil avec lui */
      ctx.globalAlpha = 0.96;
      if (m.dir < 0 && m.etat !== "grappe"){
        ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0);
      }
      ctx.drawImage(spr, x - sl / 2, y - sh, sl, sh);
      ctx.restore();
    }
    /* la réplique, au-dessus de celui qui parle */
    const r = T.replique;
    if (r && r.qui && T.foule.indexOf(r.qui) >= 0){
      const m = r.qui;
      const sh = H * FOULE_TAILLE * m.ref.taille * echellePerso(m.ref.id);
      const by = H * FOULE_PIEDS - sh * 0.98;
      ctx.save();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = "800 " + Math.round(H * 0.042) + "px 'Baloo 2', system-ui, sans-serif";
      const w = ctx.measureText(r.txt).width;
      const bw = Math.min(w + 20, L * 0.44);
      /* On ramène la bulle dans l'écran d'après SA LARGEUR, pas d'après
         une marge fixe : borner le centre à 0,14 laissait quand même
         dépasser une bulle de 0,44 de large, et la phrase était coupée. */
      const bx = borne(this.ex(m.x), bw / 2 + 6, L - bw / 2 - 6);
      ctx.globalAlpha = borne(r.t / 0.4, 0, 1);
      ctx.fillStyle = "rgba(250,248,255,.95)";
      arrondi(bx - bw / 2, by - H * 0.036, bw, H * 0.072, H * 0.030); ctx.fill();
      ctx.fillStyle = "#171226";
      ctx.fillText(r.txt, bx, by);
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.textAlign = "left";
    }
  },

  dessinerClients(){
    const H = Camera.H;
    for (const cl of Tournee.clients){
      const spr = Images.table[Tournee.poseClient(cl)];
      if (!spr || !spr.naturalWidth) continue;
      const sh = H * BAR_TAILLE_HEROS * cl.ref.taille * echellePerso(cl.ref.id);
      const sl = sh * spr.naturalWidth / spr.naturalHeight;
      /* un cran plus haut et plus sombres : ils sont derrière, ils ne
         doivent jamais se disputer l'œil avec le champion */
      const x = this.ex(cl.x), y = this.ey(BAR_SOL) - H * 0.022;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,.24)";
      ctx.beginPath(); ctx.ellipse(x, y, sl * 0.26, H * 0.011, 0, 0, 6.283); ctx.fill();
      ctx.globalAlpha = 0.90;
      if (cl.dir < 0){ ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }
      ctx.drawImage(spr, x - sl / 2, y - sh, sl, sh);
      ctx.restore();
      /* la main qui se tend juste avant de chiper */
      if (cl.etat === "prend"){
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        this.halo(x, this.ey(BAR_COMPTOIR), H * 0.05, [255, 120, 120], 0.7);
        ctx.restore();
      }
    }
  },

  /* La tarte réutilise les images du niveau 1 : c'est la même tarte,
     et on veut qu'elle soit reconnue tout de suite. */
  dessinerTarte(){
    const T = Tournee, H = Camera.H;
    const p = T.tarte;
    const nom = p.etat === "esquivee" ? "tarte_ecrasee" : "tarte" + (Math.floor(p.rot) % 4);
    const spr = Images.table[nom];
    if (!spr || !spr.naturalWidth) return;
    const sh = H * 0.085, sl = sh * spr.naturalWidth / spr.naturalHeight;
    const x = this.ex(p.x), y = this.ey(p.y);
    ctx.save();
    if (p.etat === "vol"){
      /* halo d'alerte pendant la fenêtre : la seule aide qu'on donne */
      if (T.esquiveOuverte){
        ctx.globalCompositeOperation = "lighter";
        this.halo(x, y, H * 0.10, [255, 210, 120], 0.9);
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.translate(x, y); ctx.rotate(p.rot); ctx.translate(-x, -y);
    }
    ctx.drawImage(spr, x - sl / 2, y - sh / 2, sl, sh);
    ctx.restore();
  },

  /* --------- ce qui se passe hors de l'écran ---------
     Le comptoir fait trois écrans de large : un barman qui prépare à
     l'autre bout ne se voit pas, et tout le niveau repose sur le fait
     de LIRE les barmans. Sans ces repères de bord, l'anticipation
     demandée n'existe simplement pas — on découvrait les verres en
     arrivant dessus. */
  dansLEcran(fx){
    const x = this.ex(fx);
    return x > Camera.L * 0.06 && x < Camera.L * 0.94;
  },

  chevron(cote, y, teinte, taille, force){
    const L = Camera.L;
    const x = cote < 0 ? L * 0.028 : L * 0.972;
    const s = taille * (cote < 0 ? 1 : -1);
    ctx.save();
    ctx.globalAlpha = force;
    ctx.beginPath();
    ctx.moveTo(x - s, y - taille * 0.85);
    ctx.lineTo(x + s * 0.55, y);
    ctx.lineTo(x - s, y + taille * 0.85);
    ctx.closePath();
    ctx.fillStyle = "rgba(" + teinte.join(",") + ",.92)";
    ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(10,8,16,.75)"; ctx.stroke();
    ctx.restore();
  },

  dessinerBords(){
    const T = Tournee, H = Camera.H;
    /* les verres déjà posés : couleur de la boisson, et la jauge de vie
       qui se vide en même temps que celle du verre */
    for (const v of T.verres){
      if (v.etat !== ETAT_VERRE.POSE || this.dansLEcran(v.x)) continue;
      const cote = this.ex(v.x) < Camera.L / 2 ? -1 : 1;
      const y = this.ey(BAR_COMPTOIR);
      const teinte = this.TEINTES[v.type] || [255, 255, 255];
      this.chevron(cote, y, teinte, H * 0.055, 1);
      const p = 1 - v.t / v.vie;
      const x = cote < 0 ? Camera.L * 0.028 : Camera.L * 0.972;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y + H * 0.10, H * 0.017, -Math.PI / 2, -Math.PI / 2 + p * 6.283);
      ctx.strokeStyle = p > 0.35 ? "#8FD79B" : "#E8574B";
      ctx.lineWidth = Math.max(2, H * 0.009); ctx.stroke();
      ctx.restore();
    }
    /* et les préparations en cours : on voit venir, même de dos */
    for (const b of T.barmans){
      if (b.etat !== "prepare" || this.dansLEcran(b.xPose)) continue;
      const cote = this.ex(b.xPose) < Camera.L / 2 ? -1 : 1;
      const y = this.ey(BAR_COMPTOIR) - H * 0.20;
      const teinte = this.TEINTES[b.type] || [255, 255, 255];
      const p = borne(b.t / b.duree, 0, 1);
      this.chevron(cote, y, teinte, H * 0.038, 0.55 + 0.45 * p);
      const x = cote < 0 ? Camera.L * 0.028 : Camera.L * 0.972;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y - H * 0.055, H * 0.014, -Math.PI / 2, -Math.PI / 2 + p * 6.283);
      ctx.strokeStyle = "#F7B32B"; ctx.lineWidth = Math.max(2, H * 0.008); ctx.stroke();
      ctx.restore();
    }
  },

  /* --------- habillage --------- */
  dessinerBandeau(){
    const L = Camera.L, H = Camera.H, T = Tournee;
    const taille = Math.max(11, H * 0.045);
    ctx.save();
    ctx.textBaseline = "middle";
    /* la jauge AMBIANCE, en haut au centre */
    const jl = L * 0.34, jh = Math.max(8, H * 0.030), jx = L / 2 - jl / 2, jy = H * 0.030;
    arrondi(jx, jy, jl, jh, jh / 2); ctx.fillStyle = "rgba(10,8,16,.66)"; ctx.fill();
    const p = borne(T.ambiance / BAR_AMBIANCE_BUT, 0, 1);
    if (p > 0){
      arrondi(jx + 2, jy + 2, Math.max(jh - 4, (jl - 4) * p), jh - 4, (jh - 4) / 2);
      ctx.fillStyle = T.finale ? "#F7B32B" : "#8FD79B"; ctx.fill();
    }
    ctx.font = "800 " + Math.round(taille * 0.62) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.fillStyle = "#FFF";
    ctx.fillText("AMBIANCE", L / 2, jy + jh / 2);

    /* Score et combo une ligne PLUS BAS : sur la ligne du haut ils
       tombaient derrière le filigrane de version, coin supérieur
       gauche — « 1030 » et « CALLAGHAN v6 » se chevauchaient. Chacun
       sur sa plaque : au-dessus des bouteilles, un chiffre nu se perd. */
    const ly = jy + jh * 1.9;
    const plaque = (texte, aDroite, couleur) => {
      ctx.font = "800 " + Math.round(taille * 0.9) + "px 'Baloo 2', system-ui, sans-serif";
      const lt = ctx.measureText(texte).width;
      const ph = taille * 1.25, pl = lt + taille * 0.7;
      const px = aDroite ? L * 0.97 - pl : L * 0.03;
      arrondi(px, ly - ph / 2, pl, ph, ph / 2);
      ctx.fillStyle = "rgba(10,8,16,.62)"; ctx.fill();
      ctx.textAlign = "center"; ctx.fillStyle = couleur;
      ctx.fillText(texte, px + pl / 2, ly);
    };
    plaque(String(Score.points), false, "#F7B32B");
    /* le chrono : la jauge doit être pleine AVANT la fin de la soirée */
    {
      const r = Math.max(0, Math.ceil(T.restant));
      const txt = Math.floor(r / 60) + ":" + (r % 60 < 10 ? "0" : "") + (r % 60);
      ctx.font = "800 " + Math.round(taille * 0.9) + "px 'Baloo 2', system-ui, sans-serif";
      const lt = ctx.measureText(txt).width, ph = taille * 1.25, pl = lt + taille * 0.7;
      arrondi(L / 2 - pl / 2, ly - ph / 2, pl, ph, ph / 2);
      ctx.fillStyle = "rgba(10,8,16,.62)"; ctx.fill();
      ctx.textAlign = "center";
      ctx.fillStyle = r <= 20 ? "#E8574B" : "#DCE4F4";
      ctx.fillText(txt, L / 2, ly);
    }
    if (T.combo >= 2){
      plaque("COMBO x" + T.combo, true,
        T.combo >= 10 ? "#E8574B" : T.combo >= 5 ? "#F7B32B" : "#8FD79B");
    }
    ctx.restore();
  },

  dessinerMessage(){
    const L = Camera.L, H = Camera.H, T = Tournee;
    const t = T.messageT / T.messageDuree;
    const taille = Math.max(13, H * 0.072);
    ctx.save();
    ctx.globalAlpha = borne(1 - Math.pow(t, 3), 0, 1);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "800 " + Math.round(taille) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.lineWidth = Math.max(3, taille * 0.16);
    ctx.strokeStyle = "rgba(10,6,14,.85)";
    ctx.strokeText(T.message, L / 2, H * 0.20);
    ctx.fillStyle = "#FFE9B0";
    ctx.fillText(T.message, L / 2, H * 0.20);
    ctx.restore();
  },
};
