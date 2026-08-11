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

    this.dessinerBarmans();
    this.dessinerVerres();
    if (T.invite) this.dessinerInvite();
    this.dessinerHeros();

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

    if (T.actif || T.fini) this.dessinerBandeau();
    if (T.message) this.dessinerMessage();
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
      const spr = Images.table[c.idle];
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
      const sh = H * 0.30, sl = sh * spr.naturalWidth / spr.naturalHeight;
      const x = this.ex(b.ref.x);
      /* derrière le comptoir : le bas du buste passe dessous */
      ctx.drawImage(spr, x - sl / 2, this.ey(BAR_COMPTOIR) - sh * 0.94, sl, sh);
      if (b.etat === "prepare"){
        /* petit indicateur au-dessus : quelque chose arrive */
        const p = borne(b.t / b.duree, 0, 1);
        const y = this.ey(BAR_COMPTOIR) - sh * 1.04;
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
    let nomSpr = c.idle;
    if (T.boitT > 0) nomSpr = T.action === "jette" ? c.jette : c.boit;
    else if (T.marche !== 0) nomSpr = (c.vitesse >= 1 ? c.course : c.marche);
    const spr = Images.table[nomSpr];
    if (!spr || !spr.naturalWidth) return;
    const sh = H * BAR_TAILLE_HEROS, sl = sh * spr.naturalWidth / spr.naturalHeight;
    const x = this.ex(T.x);
    const y = this.ey(BAR_SOL);
    const saut = (T.marche !== 0 && T.boitT <= 0) ? Math.abs(Math.sin(T.foulee * 1.4)) * H * 0.008 : 0;
    ctx.save();
    /* ombre courte au contact des pieds — même recette qu'au niveau 2 */
    ctx.fillStyle = "rgba(0,0,0,.30)";
    ctx.beginPath(); ctx.ellipse(x, y, sl * 0.30, H * 0.014, 0, 0, 6.283); ctx.fill();
    if (T.bourre > 0){
      /* pompette : on tangue autour des pieds */
      const roulis = Math.sin(T.temps * 3.1) * 0.10 * Math.min(1, T.bourre);
      ctx.translate(x, y); ctx.rotate(roulis); ctx.translate(-x, -y);
    }
    if (T.dir < 0){ ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }
    ctx.drawImage(spr, x - sl / 2, y - sh - saut, sl, sh);
    ctx.restore();
  },

  dessinerInvite(){
    const T = Tournee, H = Camera.H;
    const inv = T.invite;
    const spr = Images.table[inv.qui === "chat" ? "susp_chat" : "h_marche"];
    if (!spr || !spr.naturalWidth) return;
    const sh = H * (inv.qui === "chat" ? 0.11 : 0.42);
    const sl = sh * spr.naturalWidth / spr.naturalHeight;
    const x = this.ex(inv.x), y = this.ey(BAR_SOL);
    ctx.save();
    ctx.globalAlpha = 0.96;
    ctx.drawImage(spr, x - sl / 2, y - sh, sl, sh);
    ctx.restore();
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
