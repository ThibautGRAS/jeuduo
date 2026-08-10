
/* ==================================================================
   NIVEAU 2 — RENDU
   ------------------------------------------------------------------
   Séparé de la logique : le fichier précédent ne connaît que des
   fractions, celui-ci ne fait que les convertir en pixels.
================================================================== */

const EnqVue = {
  /* Conversion fraction d'image -> pixels écran. */
  larg(){
    const img = Images.table.appart;
    if (!img || !img.naturalWidth) return Camera.L;
    return img.naturalWidth * (Camera.H / img.naturalHeight);
  },
  origine(){ return -borne(Camera.xEnq, 0, Math.max(0, this.larg() - Camera.L)); },
  ex(fx){ return this.origine() + fx * this.larg(); },
  ey(fy){ return fy * Camera.H; },

  dessiner(){
    const L = Camera.L, H = Camera.H;
    const img = Images.table.appart;
    if (!img || !img.naturalWidth){ ctx.fillStyle = "#0B1226"; ctx.fillRect(0, 0, L, H); return; }
    const E2 = Enquete;
    const trem = E2.secousse > 0 ? Math.sin(E2.secousse * 62) * 5 * E2.secousse : 0;

    ctx.clearRect(0, 0, L, H);
    ctx.imageSmoothingEnabled = true;
    if ("imageSmoothingQuality" in ctx) ctx.imageSmoothingQuality = "high";
    ctx.save();
    ctx.translate(trem, 0);
    ctx.drawImage(img, this.origine(), 0, this.larg(), H);

    /* Rien d'autre que le décor tant que l'enquête n'est pas montée :
       l'introduction s'affiche par-dessus, en HTML. */
    if (Enquete.pretes()){
      this.dessinerSuspects();
      /* Pendant l'introduction on ne montre que les gens : les repères
         de fouille et les plaques de nom arriveraient avant les
         règles. */
      if (Enquete.actif) this.dessinerZones();
      this.dessinerInspecteurs();
      if (Enquete.actif) this.dessinerNoms();
    }
    if (Enquete.pretes() && HortenseApp.visible()) this.dessinerHortense();
    if (E2.pizza) this.dessinerPizza();

    /* La lumière de l'appartement est chaude, les sprites sont neutres :
       sans ce voile posé APRÈS les personnages, ils se détachent du
       décor comme des découpages. C'est la même leçon qu'au niveau 1. */
    ctx.fillStyle = "rgba(255,168,88,.11)";
    ctx.fillRect(-trem, 0, L + Math.abs(trem) * 2, H);
    const vig = ctx.createRadialGradient(L / 2, H * 0.52, H * 0.35, L / 2, H * 0.52, H * 1.05);
    vig.addColorStop(0, "rgba(10,6,2,0)");
    vig.addColorStop(1, "rgba(10,6,2,.34)");
    ctx.fillStyle = vig;
    ctx.fillRect(-trem, 0, L + Math.abs(trem) * 2, H);
    ctx.restore();

    /* Deux inspecteurs côte à côte parlent parfois en même temps : on
       empile les bulles au lieu de les superposer. */
    const bulles = Effets.paroles.filter(p => p.cible.heros !== undefined && E2.inspecteurs[p.cible.heros]);
    bulles.sort((a, b) => E2.inspecteurs[a.cible.heros].x - E2.inspecteurs[b.cible.heros].x);
    let etage = 0, precX = -1e9;
    for (const p of bulles){
      const ins = E2.inspecteurs[p.cible.heros];
      const px = this.ex(ins.x) + trem;
      if (Math.abs(px - precX) < Camera.L * 0.30) etage++; else etage = 0;
      precX = px;
      dessinerParoleLibre(p, px, this.ey(ENQ_LIGNE) - H * ENQ_TAILLE - etage * H * 0.115,
        { bord:Heros[ins.heros].couleur });
    }
    /* Les témoins parlent au-dessus d'eux-mêmes, dans une bulle de
       couleur différente et signée de leur nom : on ne confond plus qui
       répond et qui demande. */
    for (const p of Effets.paroles){
      if (p.cible.temoin === undefined) continue;
      const s = SUSPECTS[p.cible.temoin];
      if (!s) continue;
      const h = H * (s.taille || 0.30);
      dessinerParoleLibre(p, this.ex(s.x) + trem, this.ey(s.bas) - h - H * 0.055,
        { temoin:true, nom:s.nom });
    }

    if (Enquete.actif) this.dessinerBandeau();
    if (E2.dossierOuvert) this.dessinerDossier();
    if (E2.accusation) this.dessinerAccusation();
    if (E2.esquiveOuverte) this.dessinerEsquive();
    if (E2.badge) this.dessinerBadge();
    if (E2.message) this.dessinerMessage();
  },

  /* --------- meubles --------- */
  dessinerZones(){
    const H = Camera.H;
    const iz = Enquete.zoneProche();
    for (let i = 0; i < Enquete.zones.length; i++){
      const z = Enquete.zones[i];
      const px = this.ex(z.ref.x), py = this.ey(z.ref.y);
      if (px < -70 || px > Camera.L + 70) continue;
      const r = Math.max(11, H * 0.040);
      ctx.save();
      if (z.fouillee){
        ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.arc(px, py, r * 0.5, 0, 6.2832);
        ctx.fillStyle = "rgba(11,18,38,.70)"; ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = Math.max(1.6, r * 0.11);
        ctx.lineCap = "round"; ctx.beginPath();
        ctx.moveTo(px - r * 0.2, py); ctx.lineTo(px - r * 0.04, py + r * 0.17); ctx.lineTo(px + r * 0.22, py - r * 0.18);
        ctx.stroke();
      } else if (i === iz){
        /* à portée : la loupe et l'invite */
        const loupe = Images.table.loupe;
        const t = H * 0.085;
        if (loupe && loupe.naturalWidth){
          const l = t * loupe.naturalWidth / loupe.naturalHeight;
          ctx.drawImage(loupe, px - l / 2, py - t * 2.05, l, t);
        }
        const taille = Math.max(10, H * 0.036);
        ctx.font = "800 " + Math.round(taille) + "px 'Baloo 2', system-ui, sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        const txt = "INSPECTER";
        const w = ctx.measureText(txt).width;
        ctx.fillStyle = "rgba(247,179,43,.95)";
        const yl = py - taille * 0.9;
        arrondi(px - w / 2 - 8, yl - taille * 0.8, w + 16, taille * 1.6, taille * 0.8); ctx.fill();
        ctx.fillStyle = "#1A1305"; ctx.fillText(txt, px, yl + taille * 0.04);
      } else {
        const b = 1 + 0.12 * Math.sin(z.pulse);
        ctx.globalAlpha = 0.34 + 0.20 * Math.sin(z.pulse);
        ctx.beginPath(); ctx.arc(px, py, r * b, 0, 6.2832);
        ctx.strokeStyle = "#F7B32B"; ctx.lineWidth = Math.max(1.8, r * 0.12); ctx.stroke();
      }
      ctx.restore();
    }
  },

  /* --------- suspects --------- */
  dessinerSuspects(){
    const H = Camera.H;
    for (const s of SUSPECTS){
      const img = Images.table[s.sprite];
      if (!img || !img.naturalWidth) continue;
      const px = this.ex(s.x);
      if (px < -140 || px > Camera.L + 140) continue;
      /* Chacun a sa taille et son ancrage : la sœur est debout, pieds
         sur la ligne de sol ; les deux autres sont assis, calés sur leur
         propre hauteur. Un seul chiffre pour tous les collait à côté du
         meuble sur lequel ils sont censés être. */
      const h = H * (s.taille || 0.30);
      const l = h * img.naturalWidth / img.naturalHeight;
      const bas = this.ey(s.bas);
      const g3 = ctx.createRadialGradient(px, bas, 0, px, bas, h * 0.34);
      g3.addColorStop(0, "rgba(24,14,6,.32)"); g3.addColorStop(1, "rgba(24,14,6,0)");
      ctx.fillStyle = g3;
      ctx.beginPath(); ctx.ellipse(px, bas, h * 0.34, h * 0.06, 0, 0, 6.2832); ctx.fill();
      ctx.drawImage(img, px - l / 2, bas - h, l, h);

    }
  },

  /* --------- les noms, par-dessus tout le monde ---------
     Posés après les inspecteurs : glissés derrière eux, ils étaient
     illisibles au moment précis où l'on parlait au suspect. */
  dessinerNoms(){
    const H = Camera.H;
    for (const s of SUSPECTS){
      const px = this.ex(s.x);
      if (px < -140 || px > Camera.L + 140) continue;
      const pres = Math.abs(Enquete.actifIns().x - s.x) < ENQ_PORTEE * 2.2;
      if (!pres && !s.vus) continue;
      const h = H * (s.taille || 0.30);
      const bas = this.ey(s.bas);
      const taille = Math.max(9, H * 0.034);
      const py = bas - h - H * 0.018;
      ctx.save();
      ctx.globalAlpha = pres ? 1 : 0.6;
      ctx.font = "800 " + Math.round(taille) + "px 'Baloo 2', system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const w = ctx.measureText(s.nom).width;
      ctx.fillStyle = s.coince ? "rgba(226,69,61,.94)" : "rgba(10,16,30,.86)";
      arrondi(px - w / 2 - 9, py - taille * 0.86, w + 18, taille * 1.72, taille * 0.86); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.24)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = s.coince ? "#FFF3F2" : "#F1F5FF";
      ctx.fillText(s.nom, px, py + taille * 0.06);
      /* Un signe, pas un mot : la commande INTERROGER s'allume en bas
         de l'écran, répéter le mot ici chevauchait la plaque de nom. */
      if (pres){
        const r = taille * 0.62;
        const cy = py - taille * 1.9;
        ctx.beginPath(); ctx.arc(px, cy, r, 0, 6.2832);
        ctx.fillStyle = "rgba(126,92,196,.95)"; ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(px - r * 0.34, cy + r * 0.72); ctx.lineTo(px + r * 0.16, cy + r * 0.72);
        ctx.lineTo(px - r * 0.10, cy + r * 1.34); ctx.closePath();
        ctx.fillStyle = "rgba(126,92,196,.95)"; ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "800 " + Math.round(r * 1.25) + "px 'Baloo 2', system-ui, sans-serif";
        ctx.fillText("?", px, cy + r * 0.06);
      }
      ctx.restore();
    }
  },

  /* --------- inspecteurs --------- */
  dessinerInspecteurs(){
    const H = Camera.H;
    const haut = H * ENQ_TAILLE, sol = this.ey(ENQ_LIGNE);
    for (let i = 0; i < Enquete.inspecteurs.length; i++){
      const ins = Enquete.inspecteurs[i];
      const pf = Enquete.estPF(ins);
      let nom;
      if (ins.sale > 0) nom = pf ? "enq_pf_splat" : "enq_th_splat";
      else if (ins.fouille > 0) nom = pf ? "enq_pf_fouille" : "enq_th_fouille";
      else nom = pf ? "enq_pf_marche" : "enq_th_marche";
      const img = Images.table[nom];
      if (!img || !img.naturalWidth) continue;

      const px = this.ex(ins.x);
      const bouge = ins.marche !== 0 && ins.fouille <= 0;
      const bob = bouge ? Math.abs(Math.sin(ins.pas)) * haut * 0.022 : 0;
      const h = ins.sale > 0 ? haut * 0.62 : haut;         /* les têtes barbouillées sont des portraits */
      const l = h * img.naturalWidth / img.naturalHeight;
      const yBase = ins.sale > 0 ? sol - haut * 0.55 : sol;

      /* Deux ombres : une large et douce pour asseoir la silhouette dans
         la pièce, une courte et franche au contact des pieds. Sans la
         seconde, le personnage flotte à un centimètre du parquet. */
      const g = ctx.createRadialGradient(px, sol, 0, px, sol, haut * 0.26);
      g.addColorStop(0, "rgba(24,14,6,.40)"); g.addColorStop(1, "rgba(24,14,6,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(px, sol, haut * 0.26, haut * 0.055, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = "rgba(20,12,6,.34)";
      ctx.beginPath(); ctx.ellipse(px, sol, haut * 0.10, haut * 0.020, 0, 0, 6.2832); ctx.fill();

      ctx.save();
      ctx.translate(px, yBase - bob);
      ctx.scale(ins.dir < 0 ? -1 : 1, 1);
      ctx.drawImage(img, -l / 2, -h, l, h);
      ctx.restore();

      /* le repère de l'inspecteur actif */
      if (i === Enquete.actifIdx && Enquete.actif){
        const py = sol - haut - H * 0.03;
        const t = H * 0.030;
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = Heros[ins.heros].couleur;
        ctx.beginPath();
        ctx.moveTo(px - t * 0.6, py - t * 0.7); ctx.lineTo(px + t * 0.6, py - t * 0.7); ctx.lineTo(px, py + t * 0.5);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
  },

  dessinerHortense(){
    const H = Camera.H;
    const sol = this.ey(ENQ_LIGNE), h = H * 0.46;
    const px = this.ex(HortenseApp.x);
    const table = {
      ENTREE:HortenseApp.phase % 2 < 1 ? "h_courtA" : "h_courtB",
      GUET:"h_sournoise", PREPARE:"h_arme", LANCE:"h_lance",
      RIRE:"h_pointe", SORTIE:"h_marche",
    };
    const img = Images.table[table[HortenseApp.etat] || "h_debout"];
    const versGauche = Enquete.actifIns().x < HortenseApp.x;
    if (img && img.naturalWidth){
      const l = h * img.naturalWidth / img.naturalHeight;
      const g2 = ctx.createRadialGradient(px, sol, 0, px, sol, h * 0.22);
      g2.addColorStop(0, "rgba(20,14,10,.34)"); g2.addColorStop(1, "rgba(20,14,10,0)");
      ctx.fillStyle = g2;
      ctx.beginPath(); ctx.ellipse(px, sol, h * 0.22, h * 0.05, 0, 0, 6.2832); ctx.fill();
      ctx.save();
      ctx.translate(px, sol);
      ctx.scale(versGauche ? -1 : 1, 1);
      ctx.drawImage(img, -l / 2, -h, l, h);
      ctx.restore();
    }

    const p = HortenseApp.tarte;
    if (p && p.etat !== "fini"){
      const cadres = ["tarte0", "tarte1", "tarte2", "tarte3"];
      const im = Images.table[cadres[Math.floor(p.rot / 0.9) % 4]] || Images.table.tarte0;
      const taille = H * 0.12;
      ctx.save();
      ctx.translate(this.ex(p.x), this.ey(p.y));
      ctx.rotate(p.rot);
      if (im && im.naturalWidth){
        const l = taille * im.naturalWidth / im.naturalHeight;
        ctx.drawImage(im, -l / 2, -taille / 2, l, taille);
      } else {
        ctx.beginPath(); ctx.arc(0, 0, taille * 0.5, 0, 6.2832);
        ctx.fillStyle = "#F6E6B4"; ctx.fill();
        ctx.strokeStyle = "#C98A2A"; ctx.lineWidth = 3; ctx.stroke();
      }
      ctx.restore();
    }
  },

  dessinerPizza(){
    const H = Camera.H;
    const z = Enquete.zones[Enquete.pizza.zone];
    if (!z) return;
    const img = Images.table[Affaire.scenario === "B" ? "pizza_entiere" : "pizza_entamee"];
    if (!img || !img.naturalWidth) return;
    const t = Math.min(1, Enquete.pizza.t * 3);
    const h = H * 0.20 * (0.6 + 0.4 * doux(t));
    const l = h * img.naturalWidth / img.naturalHeight;
    const px = this.ex(z.ref.x), py = this.ey(z.ref.y) - H * 0.05;
    ctx.save();
    ctx.globalAlpha = t;
    const g = ctx.createRadialGradient(px, py, 0, px, py, h * 1.4);
    g.addColorStop(0, "rgba(247,179,43,.55)"); g.addColorStop(1, "rgba(247,179,43,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, h * 1.4, 0, 6.2832); ctx.fill();
    ctx.drawImage(img, px - l / 2, py - h / 2, l, h);
    ctx.restore();
  },

  /* --------- bandeau --------- */
  dessinerBandeau(){
    const L = Camera.L, H = Camera.H;
    const marge = Math.max(9, H * 0.032);
    const taille = Math.max(11, H * 0.046);
    ctx.save();
    ctx.font = "800 " + Math.round(taille) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.textBaseline = "middle";

    /* chrono */
    const s = Math.max(0, Math.ceil(Enquete.restant));
    const mn = Math.floor(s / 60), sc = s % 60;
    const txt = mn + ":" + (sc < 10 ? "0" : "") + sc;
    ctx.textAlign = "center";
    const l = ctx.measureText(txt).width;
    ctx.fillStyle = "rgba(10,16,30,.74)";
    arrondi(L / 2 - l / 2 - 14, marge, l + 28, taille * 1.7, 10); ctx.fill();
    ctx.strokeStyle = Enquete.restant < 45 ? "rgba(226,69,61,.9)" : "rgba(255,255,255,.14)";
    ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = Enquete.restant < 45 ? "#E2453D" : "#F1F5FF";
    ctx.fillText(txt, L / 2, marge + taille * 0.86);

    /* indices */
    const eti = "INDICES  " + Enquete.indices + " / " + ENQ_OBJECTIF;
    ctx.textAlign = "left";
    const l2 = ctx.measureText(eti).width;
    ctx.fillStyle = "rgba(10,16,30,.74)";
    arrondi(marge, marge, l2 + 24, taille * 1.7, 10); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = "#F7B32B";
    ctx.fillText(eti, marge + 12, marge + taille * 0.86);
    ctx.restore();
  },

  dessinerMessage(){
    const H = Camera.H, L = Camera.L;
    const taille = Math.max(11, H * 0.040);
    ctx.save();
    ctx.globalAlpha = borne(1 - Math.pow(Enquete.messageT / Enquete.messageDuree, 4), 0, 1);
    ctx.font = "700 " + Math.round(taille) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const w = ctx.measureText(Enquete.message).width;
    const py = H * 0.135;
    ctx.fillStyle = "rgba(10,16,30,.8)";
    arrondi(L / 2 - w / 2 - 14, py - taille, w + 28, taille * 2, 9); ctx.fill();
    ctx.fillStyle = "#C6D1E6"; ctx.fillText(Enquete.message, L / 2, py);
    ctx.restore();
  },

  dessinerBadge(){
    const H = Camera.H, L = Camera.L;
    const table = { indice:"badge_indice", suspect:"badge_suspect", esquive:"badge_indice",
                    splat:"badge_suspect", pizza:"badge_indice" };
    const img = Images.table[table[Enquete.badge]];
    const t = Enquete.badgeT / 1.2;
    const ech = 1 + (1 - Math.min(1, t * 5)) * 0.5;
    ctx.save();
    ctx.globalAlpha = borne(1 - Math.pow(t, 3), 0, 1);
    const h = H * 0.13 * ech;
    if (img && img.naturalWidth){
      const l = h * img.naturalWidth / img.naturalHeight;
      ctx.drawImage(img, L / 2 - l / 2, H * 0.30 - h / 2, l, h);
    }
    /* Sous le badge INDICE +1 : quoi, et où. */
    if (Enquete.badge === "indice" && Enquete.dernier){
      const t2 = Math.max(11, H * 0.044);
      ctx.font = "800 " + Math.round(t2) + "px 'Baloo 2', system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const w = ctx.measureText(Enquete.dernier).width;
      const py = H * 0.30 + h * 0.72;
      ctx.fillStyle = "rgba(10,16,30,.88)";
      arrondi(L / 2 - w / 2 - 12, py - t2, w + 24, t2 * 2, t2); ctx.fill();
      ctx.strokeStyle = "rgba(247,179,43,.6)"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = "#F7B32B"; ctx.fillText(Enquete.dernier, L / 2, py);
    }
    const mots = { esquive:"ESQUIVÉ !", splat:"SPLAT !", pizza:"PIZZA RETROUVÉE" };
    if (mots[Enquete.badge]){
      const taille = Math.max(14, H * 0.055);
      ctx.font = "800 " + Math.round(taille) + "px 'Baloo 2', system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.lineWidth = Math.max(3, taille * 0.22); ctx.strokeStyle = "rgba(12,10,18,.9)";
      ctx.strokeText(mots[Enquete.badge], L / 2, H * 0.30 + h * 0.7);
      ctx.fillStyle = "#F7B32B"; ctx.fillText(mots[Enquete.badge], L / 2, H * 0.30 + h * 0.7);
    }
    ctx.restore();
  },

  dessinerEsquive(){
    const H = Camera.H, L = Camera.L;
    const taille = Math.max(15, H * 0.070);
    ctx.save();
    ctx.font = "800 " + Math.round(taille) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const txt = "ESQUIVER !";
    const w = ctx.measureText(txt).width;
    const py = H * 0.20;
    ctx.fillStyle = "rgba(247,179,43,.96)";
    arrondi(L / 2 - w / 2 - 22, py - taille, w + 44, taille * 2, taille); ctx.fill();
    ctx.fillStyle = "#1A1305"; ctx.fillText(txt, L / 2, py);
    ctx.restore();
  },

  /* --------- dossier d'enquête --------- */
  dessinerDossier(){
    const L = Camera.L, H = Camera.H;
    ctx.save();
    ctx.fillStyle = "rgba(8,13,24,.86)"; ctx.fillRect(0, 0, L, H);
    const taille = Math.max(12, H * 0.050);
    ctx.font = "800 " + Math.round(taille) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#F7B32B";
    ctx.fillText("DOSSIER D'ENQUÊTE", L / 2, H * 0.13);

    const n = Math.max(1, Dossier.cartes.length);
    const cw = Math.min(L * 0.15, H * 0.30);
    const total = n * (cw + 10) - 10;
    let x = L / 2 - total / 2;
    for (const c of Dossier.cartes){
      const img = Images.table[c.sprite];
      ctx.fillStyle = "rgba(252,250,244,.95)";
      arrondi(x, H * 0.28, cw, cw * 1.32, 8); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.3)"; ctx.lineWidth = 1.5; ctx.stroke();
      if (img && img.naturalWidth){
        const ih = cw * 0.62, il = ih * img.naturalWidth / img.naturalHeight;
        ctx.drawImage(img, x + cw / 2 - Math.min(il, cw * 0.8) / 2, H * 0.30,
                      Math.min(il, cw * 0.8), ih * Math.min(1, cw * 0.8 / il));
      }
      const t2 = Math.max(8, cw * 0.105);
      ctx.font = "800 " + Math.round(t2) + "px 'Baloo 2', system-ui, sans-serif";
      ctx.fillStyle = "#1A1420";
      ctx.fillText(c.nom, x + cw / 2, H * 0.28 + cw * 1.00);
      /* L'endroit compte autant que l'objet. */
      ctx.font = "700 " + Math.round(t2 * 0.86) + "px 'Baloo 2', system-ui, sans-serif";
      ctx.fillStyle = "#6B5F52";
      ctx.fillText(c.ou || "", x + cw / 2, H * 0.28 + cw * 1.15);
      x += cw + 10;
    }
    if (!Dossier.cartes.length){
      ctx.font = "700 " + Math.round(taille * 0.7) + "px 'Baloo 2', system-ui, sans-serif";
      ctx.fillStyle = "#8496B6";
      ctx.fillText("Rien pour l'instant.", L / 2, H * 0.45);
    }
    ctx.font = "700 " + Math.round(taille * 0.6) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.fillStyle = "#8496B6";
    const manque2 = Enquete.cePquiManque();
    ctx.fillStyle = manque2 ? "#8496B6" : "#8FD79B";
    ctx.fillText(manque2 || "Tout y est : ACCUSER.", L / 2, H * 0.80);
    ctx.fillStyle = "#8496B6";
    ctx.fillText("Touchez l'écran pour refermer", L / 2, H * 0.88);
    ctx.restore();
  },

  /* --------- accusation --------- */
  dessinerAccusation(){
    const L = Camera.L, H = Camera.H;
    ctx.save();
    ctx.fillStyle = "rgba(8,13,24,.9)"; ctx.fillRect(0, 0, L, H);
    const taille = Math.max(12, H * 0.050);
    ctx.font = "800 " + Math.round(taille) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#F7B32B";
    ctx.fillText("QUI A PRIS LA PIZZA ?", L / 2, H * 0.12);
    const manque = Enquete.cePquiManque();
    ctx.font = "700 " + Math.round(taille * 0.52) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.fillStyle = manque ? "#E2453D" : "#8FD79B";
    ctx.fillText(manque || "Pizza retrouvée. Vous pouvez conclure.", L / 2, H * 0.20);

    const noms = SUSPECTS.map(s => s.nom).concat(["PERSONNE"]);
    const hl = H * 0.10;
    const y0 = H * 0.30;
    for (let i = 0; i < noms.length; i++){
      const y = y0 + i * hl;
      const choisi = i === Enquete.choixAcc;
      const w = Math.min(L * 0.7, 460);
      ctx.fillStyle = choisi ? "rgba(247,179,43,.94)" : "rgba(255,255,255,.06)";
      arrondi(L / 2 - w / 2, y - hl * 0.36, w, hl * 0.72, hl * 0.36); ctx.fill();
      ctx.font = "800 " + Math.round(taille * 0.62) + "px 'Baloo 2', system-ui, sans-serif";
      ctx.fillStyle = choisi ? "#1A1305" : "#C6D1E6";
      ctx.fillText(noms[i], L / 2, y);
    }
    ctx.font = "700 " + Math.round(taille * 0.55) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.fillStyle = "#8496B6";
    ctx.fillText("Touchez un nom pour l'accuser · ← → puis E au clavier", L / 2, H * 0.92);
    ctx.restore();
  },
};
/* Une bulle posée à un endroit libre : le niveau 2 place ses héros
   lui-même, la version du niveau 1 irait les chercher dans la file. */
function dessinerParoleLibre(p, px, pyTete, style){
  const st = style || {};
  const t = p.t / p.duree;
  const monte = Math.min(1, p.t * 8);
  const py = pyTete - Camera.H * 0.02 - monte * Camera.H * 0.02;
  const taille = Math.max(11, Camera.H * 0.052);
  ctx.save();
  ctx.globalAlpha = borne(1 - Math.pow(t, 4), 0, 1) * (0.35 + 0.65 * monte);
  ctx.font = "800 " + Math.round(taille) + "px 'Baloo 2', system-ui, sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const l = ctx.measureText(p.txt).width;
  const pad = taille * 0.62;
  const hNom = st.temoin ? taille * 0.86 : 0;
  const bh = taille * 1.72 + hNom;
  const bl = l + pad * 2;
  const bx = borne(px - bl / 2, 4, Camera.L - bl - 4);
  const by = py - bh;

  /* Deux styles bien séparés : blanc pour les inspecteurs, avec un
     liseré de leur couleur, et papier crème signé pour les témoins. */
  const fond = st.temoin ? "rgba(247,240,224,.97)" : "rgba(252,253,255,.97)";
  arrondi(bx, by, bl, bh, bh * 0.30);
  ctx.fillStyle = fond; ctx.fill();
  ctx.strokeStyle = "#23181A"; ctx.lineWidth = Math.max(1.5, taille * 0.10); ctx.stroke();
  if (st.bord){
    ctx.fillStyle = st.bord;
    arrondi(bx, by + bh * 0.22, Math.max(3, taille * 0.16), bh * 0.56, taille * 0.08); ctx.fill();
  }
  const qx = borne(px, bx + bh * 0.4, bx + bl - bh * 0.4);
  ctx.beginPath();
  ctx.moveTo(qx - bh * 0.14, by + bh - 1);
  ctx.lineTo(qx + bh * 0.14, by + bh - 1);
  ctx.lineTo(qx, by + bh + bh * 0.28);
  ctx.closePath();
  ctx.fillStyle = fond; ctx.fill();
  ctx.strokeStyle = "#23181A"; ctx.lineWidth = Math.max(1.5, taille * 0.10); ctx.stroke();

  if (st.temoin && st.nom){
    ctx.font = "800 " + Math.round(taille * 0.56) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.fillStyle = "#8A6B34";
    ctx.fillText(st.nom, bx + bl / 2, by + hNom * 0.62);
  }
  ctx.font = (st.temoin ? "700 " : "800 ") + Math.round(taille) + "px 'Baloo 2', system-ui, sans-serif";
  ctx.fillStyle = st.temoin ? "#2A2117" : "#1A1420";
  ctx.fillText(p.txt, bx + bl / 2 + (st.bord ? taille * 0.12 : 0), by + hNom + taille * 0.86);
  ctx.restore();
}
