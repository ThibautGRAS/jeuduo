
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
      if (Visiteurs.visible()) this.dessinerVisiteur();
      this.dessinerInspecteurs();
      /* L'invite du meuble à portée se pose après les inspecteurs :
         celui qui fouille se plantait devant son propre libellé. */
      if (Enquete.actif) this.dessinerInvite();
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
    /* Toutes les bulles passent par le même calage : on les mesure, puis
       on remonte celles qui se recouvrent jusqu'à ce que plus aucune n'en
       touche une autre. L'empilement à l'estime laissait encore la
       question et la réponse l'une sur l'autre. */
    /* Le dossier est un écran plein. Les bulles dessinées avant lui se
       voyaient en fantômes sous le voile, et le bandeau de message,
       dessiné après, recouvrait son titre. Quand il est ouvert, il est
       seul. */
    const bulles = [];
    const suite = !!(E2.fileDial && E2.fileDial.length);
    if (!E2.dossierOuvert) for (const p of Effets.paroles){
      if (p.cible.heros !== undefined){
        const ins = E2.inspecteurs[p.cible.heros];
        if (!ins) continue;
        /* Un liseré de couleur ne suffisait pas : on ne savait pas qui
           parlait. Le prénom est écrit sur la bulle, comme pour les
           autres — c'est la question qui revenait le plus souvent. */
        bulles.push({ p, px:this.ex(ins.x) + trem,
          base:this.ey(ENQ_LIGNE) - H * ENQ_TAILLE,
          style:{ bord:Heros[ins.heros].couleur, nom:Heros[ins.heros].court,
                  nomCouleur:Heros[ins.heros].couleur, suite } });
      } else if (p.cible.visiteur){
        if (!Visiteurs.visible()) continue;
        bulles.push({ p, px:this.ex(Visiteurs.x) + trem,
          base:this.ey(ENQ_LIGNE) - H * ENQ_TAILLE * 0.92 - H * 0.05,
          style:{ visiteur:true, nom:Visiteurs.qui.nom, suite } });
      } else if (p.cible.temoin !== undefined){
        const s = SUSPECTS[p.cible.temoin];
        if (!s) continue;
        bulles.push({ p, px:this.ex(s.x) + trem,
          base:this.ey(s.bas) - H * (s.taille || 0.30) - H * 0.05,
          style:{ temoin:true, nom:s.nom, suite } });
      }
    }
    /* Les plus anciennes gardent leur place : une réponse qui arrive ne
       fait pas sauter la question qu'on est en train de lire. */
    bulles.sort((a, b) => b.p.t - a.p.t);
    /* On sème le calage avec ce qui occupe DÉJÀ l'écran : le badge, au
       centre à H*0,30, et les plaques de nom au-dessus des têtes. Ils
       n'entraient pas dans le calcul, et c'est de là que venait
       l'essentiel de l'enchevêtrement — « SUSPECT ! » se retrouvait
       sous une bulle, illisible. */
    const posees = this.obstacles();
    const marge = Math.max(4, H * 0.014);
    /* Plafond : au-dessus, on passerait sous le chrono et le compteur
       d'indices. Une bulle cachée par le bandeau ne vaut pas mieux
       qu'une bulle recouverte. */
    const plafond = H * 0.155;
    const chevauche = (a, b2) =>
      a.x0 < b2.x0 + b2.bl + marge && b2.x0 < a.x0 + a.bl + marge &&
      (a.y - a.bh) < b2.y + marge && (b2.y - b2.bh) < a.y + marge;
    for (const b of bulles){
      const m = mesurerParole(b.p, b.style);
      b.bl = m.bl; b.bh = m.bh;
      /* Une bulle déjà posée GARDE sa place. Le calage tournait à chaque
         image : dès qu'une bulle naissait ou mourait, les autres étaient
         replacées et sautaient à l'écran, parfois loin de la bouche. */
      if (b.p._x0 != null){ b.x0 = b.p._x0; b.y = b.p._y; posees.push(b);
        dessinerParoleLibre(b.p, b.px, b.y, b.style, b.x0); continue; }
      b.y = b.base - H * 0.02;
      b.x0 = borne(b.px - b.bl / 2, 4, Math.max(4, Camera.L - b.bl - 4));
      /* D'abord on remonte, tant qu'il reste de la place. Le piège
         corrigé ici : quand le plafond bloquait la remontée, le drapeau
         `libre` restait vrai et AUCUN repli ne s'exécutait — les bulles
         restaient l'une sur l'autre. Le plafond doit déclencher le
         repli, pas l'annuler. */
      let garde = 0, libre = false, plafonne = false;
      while (!libre && !plafonne && garde++ < 12){
        libre = true;
        for (const q of posees){
          if (!chevauche(b, q)) continue;
          libre = false;
          const remonte = q.y - q.bh - marge;
          if (remonte - b.bh < plafond) plafonne = true;   /* plus de place en hauteur */
          else b.y = remonte;
          break;
        }
      }
      /* Puis, si le plafond est atteint, on cherche un TROU dans la
         rangée : pousser vers un côté puis se faire rabattre par le
         bord de l'écran re-superposait les bulles larges — c'était la
         dernière cause de recouvrement. On balaie la rangée de gauche à
         droite et on prend la première place qui tient. */
      /* Puis, si le plafond est atteint, on cherche un TROU, rangée par
         rangée depuis le plafond : une seule rangée ne suffit pas — une
         bulle centrée la remplit à elle seule, et pousser vers un côté
         puis se faire rabattre par le bord re-superposait tout. */
      if (plafonne){
        let y = plafond + b.bh, cale = false;
        for (let rang = 0; rang < 5 && !cale; rang++){
          b.y = y;
          const bande = posees.filter(q =>
            (b.y - b.bh) < q.y + marge && (q.y - q.bh) < b.y + marge)
            .sort((q1, q2) => q1.x0 - q2.x0);
          let x = 4, place = null;
          for (const q of bande){
            if (x + b.bl + marge <= q.x0){ place = x; break; }
            x = Math.max(x, q.x0 + q.bl + marge);
          }
          if (place == null && x + b.bl <= Camera.L - 4) place = x;
          if (place != null){ b.x0 = place; cale = true; }
          else y += b.bh + marge;
        }
        /* b.px ne bouge pas : la queue reste dirigée vers la bouche,
           dessinerParoleLibre la rabat d'elle-même dans la bulle. */
        /* Cinq rangées pleines : la plus récente passe devant, faute de mieux. */
      }
      posees.push(b);
      b.p._x0 = b.x0; b.p._y = b.y;
      dessinerParoleLibre(b.p, b.px, b.y, b.style, b.x0);
    }

    if (Enquete.actif) this.dessinerBandeau();
    if (E2.dossierOuvert) this.dessinerDossier();
    /* Le dossier est un écran plein : le badge et le bandeau de message
       étaient dessinés APRÈS lui et recouvraient son titre. L'esquive,
       elle, passe devant tout — une tarte n'attend pas qu'on referme le
       dossier. */
    if (E2.accusation) this.dessinerAccusation();
    if (E2.esquiveOuverte) this.dessinerEsquive();
    if (!E2.dossierOuvert && E2.badge) this.dessinerBadge();
    if (!E2.dossierOuvert && E2.message) this.dessinerMessage();
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
        /* rien ici : l'invite est dessinée plus tard, par dessinerInvite */
      } else {
        const b = 1 + 0.12 * Math.sin(z.pulse);
        ctx.globalAlpha = 0.34 + 0.20 * Math.sin(z.pulse);
        ctx.beginPath(); ctx.arc(px, py, r * b, 0, 6.2832);
        ctx.strokeStyle = "#F7B32B"; ctx.lineWidth = Math.max(1.8, r * 0.12); ctx.stroke();
      }
      ctx.restore();
    }
  },

  /* --------- le passant ---------
     Il marche sur la même ligne que les inspecteurs, à peine plus petit
     parce qu'il longe le fond de la pièce. */
  dessinerVisiteur(){
    const H = Camera.H;
    const img = Images.table[Visiteurs.qui.sprite];
    if (!img || !img.naturalWidth) return;
    const h = H * ENQ_TAILLE * (Visiteurs.qui.taille || 0.92) * echellePerso(Visiteurs.qui.id);
    const l = h * img.naturalWidth / img.naturalHeight;
    const px = this.ex(Visiteurs.x);
    const sol = this.ey(ENQ_LIGNE) - H * 0.012;
    const bouge = Visiteurs.etat !== "PARLE";
    const bob = bouge ? Math.abs(Math.sin(Visiteurs.pas)) * h * 0.020 : 0;
    const g2 = ctx.createRadialGradient(px, sol, 0, px, sol, h * 0.24);
    g2.addColorStop(0, "rgba(24,14,6,.30)"); g2.addColorStop(1, "rgba(24,14,6,0)");
    ctx.fillStyle = g2;
    ctx.beginPath(); ctx.ellipse(px, sol, h * 0.24, h * 0.05, 0, 0, 6.2832); ctx.fill();
    ctx.save();
    ctx.translate(px, sol - bob);
    ctx.scale(Visiteurs.dir < 0 ? -1 : 1, 1);
    ctx.drawImage(img, -l / 2, -h, l, h);
    ctx.restore();

    /* Son nom, tant qu'il est là — mais pas s'il parle : sa bulle le
       porte déjà, et les deux étiquettes se chevauchaient. */
    if (Effets.paroles.some(p2 => p2.cible.visiteur)) return;
    const taille = Math.max(9, H * 0.032);
    ctx.save();
    ctx.font = "800 " + Math.round(taille) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const w = ctx.measureText(Visiteurs.qui.nom).width;
    const py = sol - h - H * 0.020;
    ctx.fillStyle = "rgba(58,42,96,.88)";
    arrondi(px - w / 2 - 9, py - taille * 0.86, w + 18, taille * 1.72, taille * 0.86); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = "#EDE7FA"; ctx.fillText(Visiteurs.qui.nom, px, py + taille * 0.06);
    ctx.restore();
  },

  /* --------- l'invite « INSPECTER », par-dessus tout le monde --------- */
  dessinerInvite(){
    const H = Camera.H;
    const iz = Enquete.zoneProche();
    if (iz < 0) return;
    const z = Enquete.zones[iz];
    const px = this.ex(z.ref.x), py = this.ey(z.ref.y);
    const loupe = Images.table.loupe;
    const t = H * 0.085;
    ctx.save();
    if (loupe && loupe.naturalWidth){
      const l = t * loupe.naturalWidth / loupe.naturalHeight;
      ctx.drawImage(loupe, px - l / 2, py - t * 2.05, l, t);
    }
    const taille = Math.max(10, H * 0.036);
    ctx.font = "800 " + Math.round(taille) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const txt = "INSPECTER";
    const w = ctx.measureText(txt).width;
    const yl = py - taille * 0.9;
    ctx.fillStyle = "rgba(247,179,43,.96)";
    arrondi(px - w / 2 - 8, yl - taille * 0.8, w + 16, taille * 1.6, taille * 0.8); ctx.fill();
    ctx.strokeStyle = "rgba(26,19,5,.4)"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = "#1A1305"; ctx.fillText(txt, px, yl + taille * 0.04);
    ctx.restore();
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
  /* Les boîtes déjà occupées à l'écran, dans la MÊME convention que le
     calage des bulles : y = bord du bas, bh = hauteur. Le badge et les
     plaques de nom sont dessinés ailleurs dans le fichier ; tant qu'ils
     n'entraient pas ici, aucune bulle ne pouvait les éviter. */
  obstacles(){
    const H = Camera.H, L = Camera.L, out = [];
    if (Enquete.badge){
      const t = Enquete.badgeT / 1.2;
      const ech = 1 + (1 - Math.min(1, t * 5)) * 0.5;
      const h = H * 0.13 * ech;
      const l = h * 1.6;                       /* les badges sont plus larges que hauts */
      out.push({ x0:L / 2 - l / 2, bl:l, y:H * 0.30 + h * 0.9, bh:h * 1.4 });
    }
    if (Enquete.actif){
      for (const s2 of SUSPECTS){
        const px = this.ex(s2.x);
        if (px < -140 || px > L + 140) continue;
        const pres = Math.abs(Enquete.actifIns().x - s2.x) < ENQ_PORTEE_GENS;
        if (!pres && !s2.vus) continue;
        const h = H * (s2.taille || 0.30);
        const taille = Math.max(9, H * 0.034);
        const py = this.ey(s2.bas) - h - H * 0.018;
        /* la plaque, plus le point d'interrogation qui la surmonte */
        const haut = pres ? taille * 3.4 : taille * 0.86;
        const larg = Math.max(taille * 5, H * 0.12);
        out.push({ x0:px - larg / 2, bl:larg, y:py + taille * 0.86, bh:haut + taille * 0.86 });
      }
    }
    return out;
  },

  dessinerNoms(){
    const H = Camera.H;
    for (const s of SUSPECTS){
      const px = this.ex(s.x);
      if (px < -140 || px > Camera.L + 140) continue;
      const pres = Math.abs(Enquete.actifIns().x - s.x) < ENQ_PORTEE_GENS;
      if (!pres && !s.vus) continue;
      /* Si cette personne est en train de parler, sa bulle porte déjà son
         nom : deux étiquettes pour la même bouche se chevauchaient. */
      const i = SUSPECTS.indexOf(s);
      if (Effets.paroles.some(p => p.cible.temoin === i)) continue;
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
      /* Dix poses, choisies par la logique : le rendu ne décide de rien. */
      nom = (pf ? "enq_pf_" : "enq_th_") + Enquete.poseIns(Enquete.inspecteurs.indexOf(ins));
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
    /* La barre de commandes du niveau 2 est en HTML, par-dessus le
       canevas : elle mange les 19 % du bas. Le dossier s'y écrivait
       quand même, et ses deux dernières lignes — « il manque encore… »
       et « touchez pour refermer » — étaient purement invisibles. Tout
       le dossier se compose donc dans la hauteur UTILE. */
    const hu = H * (1 - ENQ_BANDE_CMD);
    const y = f => hu * f;
    ctx.save();
    ctx.fillStyle = "rgba(8,13,24,.90)"; ctx.fillRect(0, 0, L, H);
    const taille = Math.max(12, hu * 0.050);
    ctx.font = "800 " + Math.round(taille) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#F7B32B";
    ctx.fillText("DOSSIER D'ENQUÊTE", L / 2, y(0.13));

    const n = Math.max(1, Dossier.cartes.length);
    const cw = Math.min(L * 0.15, hu * 0.30);
    const total = n * (cw + 10) - 10;
    let x = L / 2 - total / 2;
    for (const c of Dossier.cartes){
      const img = Images.table[c.sprite];
      ctx.fillStyle = "rgba(252,250,244,.95)";
      arrondi(x, y(0.28), cw, cw * 1.32, 8); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.3)"; ctx.lineWidth = 1.5; ctx.stroke();
      if (img && img.naturalWidth){
        const ih = cw * 0.62, il = ih * img.naturalWidth / img.naturalHeight;
        ctx.drawImage(img, x + cw / 2 - Math.min(il, cw * 0.8) / 2, y(0.30),
                      Math.min(il, cw * 0.8), ih * Math.min(1, cw * 0.8 / il));
      }
      const t2 = Math.max(8, cw * 0.105);
      ctx.font = "800 " + Math.round(t2) + "px 'Baloo 2', system-ui, sans-serif";
      ctx.fillStyle = "#1A1420";
      ctx.fillText(c.nom, x + cw / 2, y(0.28) + cw * 1.00);
      /* L'endroit compte autant que l'objet. */
      ctx.font = "700 " + Math.round(t2 * 0.86) + "px 'Baloo 2', system-ui, sans-serif";
      ctx.fillStyle = "#6B5F52";
      ctx.fillText(c.ou || "", x + cw / 2, y(0.28) + cw * 1.15);
      x += cw + 10;
    }
    if (!Dossier.cartes.length){
      ctx.font = "700 " + Math.round(taille * 0.7) + "px 'Baloo 2', system-ui, sans-serif";
      ctx.fillStyle = "#8496B6";
      ctx.fillText("Rien pour l'instant.", L / 2, y(0.45));
    }
    /* Où en sont les têtes : le dossier raconte le raisonnement, pas
       seulement l'inventaire. */
    const theorie = Enquete.theorie();
    if (theorie.length){
      ctx.font = "800 " + Math.round(taille * 0.50) + "px 'Baloo 2', system-ui, sans-serif";
      ctx.fillStyle = "#F7B32B";
      ctx.fillText("CE QU'ON EN PENSE", L / 2, y(0.70));
      /* Les théories sont des phrases entières : on réduit la police
         jusqu'à ce que la plus longue tienne, plutôt que de déborder. */
      let tTh = taille * 0.62;
      ctx.font = "700 " + Math.round(tTh) + "px 'Baloo 2', system-ui, sans-serif";
      const plusLarge = Math.max.apply(null, theorie.map(t => ctx.measureText(t).width));
      if (plusLarge > L * 0.92) tTh *= L * 0.92 / plusLarge;
      ctx.font = "700 " + Math.round(Math.max(9, tTh)) + "px 'Baloo 2', system-ui, sans-serif";
      ctx.fillStyle = "#E8DFC8";
      theorie.forEach((t, i) => ctx.fillText(t, L / 2, y(0.745 + i * 0.048)));
    }
    ctx.font = "700 " + Math.round(taille * 0.6) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.fillStyle = "#8496B6";
    const manque2 = Enquete.cePquiManque();
    ctx.fillStyle = manque2 ? "#8496B6" : "#8FD79B";
    ctx.fillText(manque2 || "Tout y est : ACCUSER.", L / 2, y(0.86));
    ctx.fillStyle = "#8496B6";
    ctx.fillText("Touchez l'écran pour refermer", L / 2, y(0.93));
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
/* Mesure d'une bulle sans la dessiner : le calage en a besoin avant de
   savoir où la poser, et deux calculs séparés auraient fini par
   divorcer. */
/* Découpe un texte en lignes qui tiennent dans `larg`. Fonction pure :
   la mesure est passée en paramètre, la suite de tests lui donne une
   règle factice. Un mot plus long que la ligne part seul — on ne coupe
   pas les mots, une bulle n'est pas un dictionnaire. */
function decouperLignes(txt, larg, mesure){
  const mots = String(txt).split(" ");
  const lignes = [];
  let courante = "";
  for (const mot of mots){
    const essai = courante ? courante + " " + mot : mot;
    if (courante && mesure(essai) > larg){ lignes.push(courante); courante = mot; }
    else courante = essai;
  }
  if (courante) lignes.push(courante);
  return lignes;
}

function mesurerParole(p, style){
  const st = style || {};
  const taille = Math.max(10, Camera.H * 0.046);
  ctx.save();
  ctx.font = "800 " + Math.round(taille) + "px 'Baloo 2', system-ui, sans-serif";
  /* Largeur plafonnée à 44 % de l'écran : deux bulles côte à côte
     tiennent toujours, donc le repli latéral du calage ne peut plus
     échouer — c'était la dernière cause de superposition. */
  const largMax = Camera.L * 0.42;
  const cle = p.txt + "|" + Math.round(taille) + "|" + Math.round(largMax);
  if (p._cleLignes !== cle){
    p._cleLignes = cle;
    p._lignes = decouperLignes(p.txt, largMax, t => ctx.measureText(t).width);
    p._largeur = Math.max.apply(null, p._lignes.map(t => ctx.measureText(t).width));
  }
  ctx.restore();
  const pad = taille * 0.62;
  /* Le bandeau de nom n'était réservé qu'aux témoins et aux visiteurs :
     les inspecteurs n'avaient qu'un liseré de couleur, et on ne savait
     pas lequel des deux venait de parler. Maintenant : qui a un nom
     l'affiche. */
  const hNom = st.nom ? taille * 0.86 : 0;
  const interligne = taille * 1.14;
  return { bl:p._largeur + pad * 2, bh:taille * 1.72 + hNom + (p._lignes.length - 1) * interligne,
           taille, hNom, lignes:p._lignes, interligne };
}

function dessinerParoleLibre(p, px, pyBas, style, x0){
  const st = style || {};
  const t = p.t / p.duree;
  const monte = Math.min(1, p.t * 8);
  const m = mesurerParole(p, st);
  const taille = m.taille, hNom = m.hNom, bl = m.bl, bh = m.bh;
  const bx = x0 != null ? x0 : borne(px - bl / 2, 4, Math.max(4, Camera.L - bl - 4));
  const by = pyBas - bh - monte * Camera.H * 0.012;

  ctx.save();
  /* t^8 au lieu de t^4 : la bulle reste franche jusqu'aux 85 derniers
     pour-cent de sa vie, au lieu de pâlir dès la moitié. On la voyait
     translucide sur presque toutes les captures. */
  ctx.globalAlpha = borne(1 - Math.pow(t, 8), 0, 1) * (0.35 + 0.65 * monte);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";

  /* Trois papiers : blanc pour les inspecteurs, crème pour les gens de
     la maison, mauve pour ceux qui ne font que passer. */
  const fond = st.visiteur ? "rgba(234,228,248,.97)"
             : st.temoin   ? "rgba(247,240,224,.97)"
             : "rgba(252,253,255,.97)";
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

  if (st.nom){
    ctx.font = "800 " + Math.round(taille * 0.56) + "px 'Baloo 2', system-ui, sans-serif";
    ctx.fillStyle = st.nomCouleur ? st.nomCouleur : st.visiteur ? "#5B4A8C" : "#8A6B34";
    ctx.fillText(st.nom, bx + bl / 2, by + hNom * 0.62);
  }
  ctx.font = ((st.temoin || st.visiteur) ? "700 " : "800 ") + Math.round(taille) + "px 'Baloo 2', system-ui, sans-serif";
  ctx.fillStyle = st.visiteur ? "#241C3A" : st.temoin ? "#2A2117" : "#1A1420";
  const lignes = m.lignes || [p.txt];
  /* Un petit chevron dit que le doigt a la main : sans lui, on ne devine
     pas qu'il faut taper. Il ne s'affiche qu'une fois la bulle lisible,
     et seulement s'il reste quelque chose derrière. */
  if (st.suite && p.t > 0.35){
    const r = taille * 0.42;
    const cx = bx + bl - r * 1.9, cy = by + bh - r * 1.4;
    ctx.save();
    ctx.globalAlpha *= 0.55 + 0.45 * Math.abs(Math.sin(p.t * 3.4));
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.5, cy - r * 0.7);
    ctx.lineTo(cx + r * 0.6, cy);
    ctx.lineTo(cx - r * 0.5, cy + r * 0.7);
    ctx.closePath();
    ctx.fillStyle = "#8A6B34"; ctx.fill();
    ctx.restore();
  }
  for (let i = 0; i < lignes.length; i++)
    ctx.fillText(lignes[i], bx + bl / 2 + (st.bord ? taille * 0.12 : 0),
                 by + hNom + taille * 0.86 + i * m.interligne);
  ctx.restore();
}
