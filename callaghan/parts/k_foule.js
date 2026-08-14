/* ================= LA FOULE DU PREMIER PLAN =================
   Le bar était vide de monde : deux clients longeaient le comptoir, et
   c'était tout. Ici on peuple le PREMIER PLAN — trois grappes de gens
   posées tout en bas, dont on ne voit que le buste, et derrière
   lesquelles le champion circule.

   Trois décisions structurent le reste :

   1. ILS SONT DEVANT, MAIS PAS DEVANT LE COMPTOIR. Placés le plus bas
      possible, coupés par le bord de l'écran, ils masquent le champion
      qui passe derrière eux mais jamais les verres à attraper. Sans ça
      il aurait fallu reprendre le garde-fou de faisabilité, et le
      niveau serait devenu un autre jeu.

   2. LES GROUPES SE COMPOSENT PAR AFFINITÉ. `LIENS` existe depuis le
      niveau 2 : on s'en sert plutôt que de tirer au sort. Une grappe
      d'amis se lit comme un groupe ; cinq personnes au hasard se lisent
      comme un tirage.

   3. RIEN N'EST FIGÉ. Quelqu'un quitte sa grappe pour faire un tour et
      revient — parfois dans une AUTRE grappe, ce qui recompose la
      soirée sans qu'on ait à l'orchestrer. Et de temps en temps, l'un
      s'en va pour de bon ; sa place se libère et quelqu'un d'autre
      finit par arriver. */

/* Les grappes sont PLACÉES DANS LE BAR, pas sur l'écran. C'était le
   défaut de la première version : accrochées à la caméra, elles
   suivaient le champion comme un décor peint sur la vitre — on ne les
   dépassait jamais, et le bar semblait tenir en un seul écran.

   Posées dans le MONDE, elles ne sont visibles que quand on passe
   devant : le bar redevient un lieu qu'on traverse, avec des coins où
   il y a du monde et des coins où il n'y a personne. Six grappes
   réparties sur toute la longueur — assez pour qu'il y ait presque
   toujours quelqu'un en vue, jamais assez pour faire une haie. */
const FOULE_PLACES = [
  { id: "g1", x: 0.110 }, { id: "g2", x: 0.370 },
  { id: "g3", x: 0.630 }, { id: "g4", x: 0.890 },
];
/* La ligne des pieds, SOUS le bas de l'écran : on ne voit que le buste.
   C'est ce qui laisse au champion de la place pour circuler tout en
   passant derrière eux. */
/* 1,52 et pas 1,30 : à 1,30 leur buste montait jusqu'à mi-écran et le
   champion disparaissait ENTIÈREMENT derrière une grappe. Or il doit
   circuler derrière eux, pas s'évanouir. À 1,52 on ne voit que les
   épaules et la tête, tout en bas : ils lui masquent les jambes et
   laissent le haut du corps lisible. */
/* DES PERSONNAGES ENTIERS, PAS DES BUSTES. Les pieds étaient à 1,52 —
   très loin sous l'écran — donc on ne voyait que les épaules et la tête.
   Ils passent à 1,06 : les pieds dépassent à peine du cadre, et on voit
   enfin qui ils sont.
   La TAILLE baisse en conséquence, sinon un personnage entier à 0,78 de
   la hauteur d'écran masquerait le champion au lieu de lui laisser le
   passage. C'est le compromis d'origine, mais résolu dans l'autre sens :
   on rapetisse au lieu de couper. */
/* LA TÊTE DOIT RESTER SOUS LE COMPTOIR, à 0,555 : au-dessus, la foule
   masque les verres, qui sont l'enjeu du niveau. C'est la contrainte qui
   commande, et elle se calcule — tête = pieds - taille, donc
   1,06 - 0,50 = 0,56, juste dessous.
   On voit alors 0,555 à 1,0 d'un personnage haut de 0,50 : quatre-vingt-
   dix pour cent de lui, pieds légèrement hors cadre. C'est ce qu'on
   voulait, et c'est le maximum possible sans manger les verres. */
const FOULE_PIEDS = 1.18;
/* RECALCULÉE quand le comptoir est passé de 0,555 à 0,585 sur le fond
   neuf : tête = 1,06 − 0,50 = 0,56, donc AU-DESSUS du comptoir, donc les
   verres masqués. À 0,46 la tête est à 0,60, juste dessous.
   C'est une donnée DÉRIVÉE du comptoir : elle doit être refaite chaque
   fois que le décor change. */
/* AGRANDIE : elle faisait 0,46 contre 0,52 pour le héros, soit 88 % de
   sa taille — alors qu'elle est au PREMIER PLAN, donc plus près de la
   caméra. Elle devrait être plus GRANDE, pas plus petite.
   À 0,62 elle fait 119 % du héros, ce qui donne la profondeur.
   La contrainte reste la même : sa tête doit rester SOUS le comptoir, à
   0,546, sinon elle masque les verres. Tête = 1,18 - 0,62 = 0,56, juste
   dessous. Les pieds dépassent donc de 18 % — c'est le prix, et Thibaut
   l'a accepté explicitement. */
const FOULE_TAILLE = 0.62;
const FOULE_ECART = 0.030;         /* écart entre deux voisins, EN MONDE */
/* DEUX PAR GRAPPE, PAS TROIS. Il n'y a que dix personnages pour quatre
   grappes : à trois, la foule les prenait TOUS et plus aucun client ne
   pouvait entrer depuis qu'on interdit les doublons. À deux, il en reste
   deux de libres — exactement le nombre de clients simultanés autorisés.
   Et des personnages entiers tiennent moins bien à trois de front. */
const FOULE_PAR_GRAPPE = 2;

/* FOULE_REPLIQUE a disparu : le délai entre deux prises de parole est
   maintenant celui entre deux ÉCHANGES (FOULE_ECHANGE), et l'intérieur
   d'un échange enchaîne à FOULE_ENCHAINE. Sept à treize secondes entre
   deux phrases faisaient une salle d'attente, pas un bar. */
const FOULE_REPL_DUREE = 3.2;         /* elle vit assez pour être lue    */
const FOULE_BALADE = [11.0, 22.0];    /* délai entre deux balades        */
const FOULE_BALADE_DUREE = [4.5, 8.0];
const FOULE_DEPART = 0.22;            /* part des balades qui finissent dehors */

/* Ce qu'ils disent. Une réplique doit se raccrocher à ce qui se passe,
   sinon c'est du bruit : les seaux CONTEXTE sont choisis d'abord quand
   la situation s'y prête, et le reste vient du personnage. Les phrases
   sont courtes — elles se lisent en passant, sans interrompre le jeu. */
const FOULE_PHRASES = {
  ambiance_basse: [
    "Il se passe rien, là.",
    "On se croirait un mardi.",
    "Quelqu'un met de la musique ?",
  ],
  ambiance_haute: [
    "LÀ on est bien !",
    "C'est ça, le D'Tour.",
    "Je bouge plus de la soirée.",
  ],
  coup_de_feu: [
    "Ça arrive de partout !",
    "Francky va exploser.",
    "Regarde-moi ce comptoir.",
  ],
  pompette: [
    "Il tient plus debout.",
    "Doucement, champion.",
    "Il va finir sur le tabouret.",
  ],
  gabi:     ["J'ai commandé une pizza.", "Personne n'a vu ma part ?"],
  charles:  ["Moi je bois pas, je goûte.", "C'était mieux avant. Enfin, non."],
  teo:      ["Je reste cinq minutes.", "Bon. Dix minutes."],
  mathilde: ["Jojo m'a encore ignorée.", "Ses cocktails sont meilleurs."],
  tristan:  ["Deux, et j'y vais.", "On refait la même ?"],
  solene:   ["Tu as vu qui est là ?", "Je préviens Mathilde."],
  kevin:    ["C'est ma tournée. Enfin, presque.", "Jägerbombs. Point."],
  remy:     ["Le premier qui craque paie.", "J'ai vu Teo boire de l'eau."],
  marini:   ["La municipalité soutient ce lieu.", "Un buffet non conforme."],
  martin:   ["Je suis pas en service.", "Enfin, un peu quand même."],
  commun:   ["Il en met du temps.", "Tu reprends quelque chose ?",
             "Elle est où, Hortense ?", "Pas de tarte ce soir, j'espère."],
};

/* ================= LES DISCUSSIONS DE COMPTOIR =================
   Le bar disait des phrases ISOLÉES : quelqu'un lâchait un mot, personne
   ne répondait, et la salle avait l'air de penser tout haut chacun dans
   son coin. Un bar, c'est le contraire — c'est deux personnes qui se
   racontent une histoire que tout le monde connaît déjà.

   Un échange est une SUITE de répliques jouées par deux voisins de la
   même grappe, à tour de rôle. La bulle ne change pas : elle se contente
   de passer de l'un à l'autre, ce qui suffit à faire une conversation.

   Trois réservoirs, et c'est la proportion qui fait le bar :
     `ragots`        ce qui se dit sur les gens présents. Le plus gros,
                     parce que c'est ce dont on parle vraiment dans un
                     bar de quartier.
     `faits_divers`  les méchants du niveau 4, vus du comptoir. Ils ne
                     sont pas des ennemis ici, ce sont des NOMS DANS LE
                     JOURNAL — et c'est ce décalage qui est drôle.
     `commun`        le reste : la tournée, le patron, la soirée.

   On se moque de ce que les gens FONT, jamais de ce qu'ils sont. La
   règle vient du niveau 4 et elle vaut ici aussi. */
const FOULE_DISCUSSIONS = {
  ragots: [
    ["Le maire est là.", "Il est TOUJOURS là.", "C'est son bureau, en fait."],
    ["Kevin a payé sa tournée.", "Non.", "Si.", "Alors là je m'assois."],
    ["Teo avait dit cinq minutes.", "Il est là depuis dix-neuf heures."],
    ["Solène a tout raconté à Mathilde.", "Évidemment.", "En trois minutes."],
    ["Charles boit pas, il goûte.", "Il goûte depuis vingt ans."],
    ["Rémy a compté les verres de Tristan.", "Et ?", "Il a arrêté à onze."],
    ["Gabi cherche sa part de pizza.", "Elle la cherche encore ?",
     "Elle la cherchera toute sa vie."],
    ["Martin dit qu'il est pas en service.", "Il a son arme.",
     "Il a toujours son arme."],
    ["Mathilde a commandé un truc compliqué.", "Jojo a soupiré.",
     "Jojo soupire depuis l'ouverture."],
    ["Tu as vu qui parle à qui ?", "Non. Raconte.", "Pas ici."],
    ["Ils se sont remis ensemble.", "Encore ?", "Troisième fois cette année."],
    ["Le maire a promis des travaux.", "Lesquels ?", "Il a pas dit."],
    ["Kevin veut faire des Jägerbombs.", "Personne veut.", "Il en fait quand même."],
    ["Solène prévient toujours Mathilde.", "C'est un service public."],
    ["Rémy a dit que le premier qui craque paie.", "Il a craqué le premier.",
     "Il a pas payé."],
    ["Teo a bu de l'eau.", "De l'EAU ?", "Je l'ai vu. J'ai des témoins."],
    ["Charles a remis ses lunettes noires.", "Il fait nuit.", "Justement."],
    ["Ils ont parlé de moi ?", "Un peu.", "Beaucoup ?", "Beaucoup."],
    ["Gabi a encore invité tout le monde.", "Chez elle ?",
     "Chez quelqu'un d'autre."],
    ["Le patron a changé les prix.", "Il les a montés ?",
     "Il les a juste effacés."],
    ["Tristan avait dit deux verres.", "Et il y va quand ?", "Il y va jamais."],
    ["Y'a une histoire avec le voisin du dessus.", "Encore la musique ?",
     "Encore la musique."],
    ["Mathilde trouve les cocktails de Jojo meilleurs.", "Dis pas ça à Francky.",
     "Trop tard, il a entendu."],
    ["Martin a fait un contrôle sur le parking.", "Sur qui ?",
     "Sur sa propre voiture. Il vérifiait."],
    ["Ils ont refait la salle du fond.", "Ça change quoi ?",
     "Les mêmes chaises, mais ailleurs."],
    ["Kevin a un plan.", "Le dernier a coûté cher.", "Celui-là est gratuit.",
     "C'est ce qu'il avait dit."],
  ],
  faits_divers: [
    ["T'as vu, l'acteur ?", "Lequel ?", "Le gros. Il est parti à l'étranger.",
     "Pour les impôts, oui. On a lu."],
    ["Il paraît qu'il a tout nié.", "Comme d'habitude.",
     "Il nierait devant une photo."],
    ["Le banquier, là.", "Celui de l'hôtel ?", "Celui de l'hôtel.",
     "Il s'en est sorti, hein.", "Ils s'en sortent tous."],
    ["Ils ont fait tomber la statue.", "Celle de l'abbé ?",
     "Ils l'ont pas fait tomber. Ils l'ont juste enlevée.",
     "C'est pareil, en plus poli."],
    ["Un saint homme, qu'ils disaient.", "Tout le monde disait ça.",
     "C'est bien le problème."],
    ["Le chanteur aussi ?", "Le chanteur aussi.",
     "Il chantait pour les Restos.", "Il chantait, oui."],
    ["Y'en a un qui a balancé un pavé.", "Sur qui ?",
     "Sur personne. C'était pour le geste."],
    ["Ils passent tous à la télé après.", "Pour s'expliquer.",
     "Ils expliquent jamais rien, ils racontent."],
    ["Moi ce qui me tue, c'est les voisins.", "Quels voisins ?",
     "Ceux qui disent « il était très bien »."],
    ["Il avait coulé une terrasse.", "Et alors ?",
     "Un dimanche. Tout seul. En chemise blanche."],
    ["Y'a toujours un moment où ça se voit.", "Pas toujours.",
     "Si. On regarde juste pas."],
    ["Ils écrivent ça en une ligne dans le journal.", "Et deux pages sur le foot.",
     "Voilà."],
    ["Tu crois qu'ils dorment, ces gens ?", "Très bien, je crois.",
     "C'est ça qui fait peur."],
    ["Y'a un flic qui a démissionné sur l'affaire.", "Pourquoi ?",
     "Il a dit qu'on lui demandait de regarder ailleurs."],
    ["On en parle six mois, et puis plus rien.", "Jusqu'au prochain.",
     "Y'a toujours un prochain."],
    ["Le procès, c'est quand ?", "Ça fait quatre ans qu'on demande.",
     "Alors c'est jamais."],
    ["Il a écrit un livre, en plus.", "Sur quoi ?", "Sur lui.",
     "Évidemment sur lui."],
    ["Moi je dis rien, hein.", "Tu dis rien depuis vingt minutes.",
     "Je dis rien, mais je pense fort."],
  ],
  commun: [
    ["Tu reprends quelque chose ?", "Le même.", "Le même pour moi aussi."],
    ["Il en met du temps.", "Il est tout seul.", "Il est toujours tout seul."],
    ["Elle est où, Hortense ?", "Chut.", "Pourquoi chut ?", "Parce que."],
    ["S'il y a une tarte ce soir, je pars.", "Tu pars jamais."],
    ["C'est qui qui paie ?", "Silence général.", "Voilà. C'est bien ce que je pensais."],
    ["Il est quelle heure ?", "Tôt.", "Tu as dit ça il y a deux heures."],
    ["On mange quelque chose ?", "Il y a des cacahuètes.",
     "Il y a des cacahuètes depuis mars."],
    ["La musique est bien, ce soir.", "C'est la même que d'habitude.",
     "Alors elle a toujours été bien."],
    ["Tu travailles demain ?", "Techniquement.", "Techniquement.", "Voilà."],
    ["Le tabouret du fond est cassé.", "Depuis quand ?",
     "Depuis que Kevin s'est assis dessus."],
    ["Il fait chaud, non ?", "C'est toi qui as chaud.",
     "Peut-être aussi, oui."],
    ["On se refait la même ?", "On se refait la même.",
     "On avait dit la dernière.", "On avait dit ça avant la dernière."],
  ],
};

/* La cadence des échanges. Sept à treize secondes entre deux répliques
   ISOLÉES, c'était le rythme d'une salle d'attente. Un échange
   s'enchaîne réplique par réplique — la suite arrive tout de suite,
   sinon la réponse tombe dix secondes après la question et personne ne
   fait le lien. */
const FOULE_ECHANGE = [3.5, 7.5];     /* délai entre deux CONVERSATIONS  */
const FOULE_ENCHAINE = 0.35;          /* blanc entre deux répliques      */

/* ================= LE COLLÈGUE, AU FOND, PAS FRAIS =================
   On joue un inspecteur ; l'autre est là aussi. Il ne sert pas, il ne
   compte pas les verres, il ne fait rien d'utile — il DÉAMBULE, et il
   parle de son collègue à qui veut l'entendre. C'est-à-dire à personne.

   Trois raisons de le mettre là, et elles tiennent toutes au niveau :
   1. LE DUO EST LE SUJET DU JEU. Aux niveaux 2 et 4 ils sont ensemble ;
      au 3 l'un travaillait pendant que l'autre n'existait pas.
   2. IL DIT CE QUE LE JOUEUR PENSE. « Il court vite, c'est tout ce
      qu'il fait, mais il le fait vite » — c'est la devise du champion,
      retournée par celui qui la subit.
   3. IL NE GÊNE RIEN. Il marche derrière le comptoir-joueur, au même
      plan que les clients, et il ne touche jamais un verre : le niveau
      reste exactement le même jeu.

   Il TITUBE, il ne marche pas : la planche du bar a une pose `titube`
   par héros, faite pour l'état pompette du champion. C'est elle qui
   sert ici, en permanence. */
const COMPERE_MARCHE = 0.055;        /* moitié moins vite qu'un client   */
const COMPERE_PAUSE = [2.2, 5.5];    /* il s'arrête souvent, et longtemps */
const COMPERE_TRAJET = [3.0, 7.0];
const COMPERE_PAROLE = [6.0, 11.0];
const COMPERE_DUREE = 3.4;
const COMPERE_ENTREE = 6.0;          /* il arrive après le début, pas avec */

/* CE QU'IL CRIE. Une remarque de comptoir et un cri à travers la salle
   ne se disent pas dans la même bulle : les cris sortent en capitales,
   plus gros, et durent plus longtemps parce qu'on les regarde arriver.

   Ils ne parlent pas forcément de son collègue — c'est justement ce qui
   les rend drôles : un type qui traverse le bar en hurlant une question
   de sondage n'a besoin d'aucun contexte. */
const COMPERE_CRIS = {
  pf: [
    "JEAAAAANNE ! AU SECOURS !",
    "SUR 100 FRANÇAISES, COMBIEN ONT DÉJÀ FAIT OUMBAOUMBA ?",
    "CE N'EST QU'UN DÉTAIL !",
    "JEAAAANNE ! J'AI RETROUVÉ MON VERRE !",
    "QUELQU'UN A VU MA VOITURE ? NON ? TANT MIEUX !",
  ],
  th: [
    "JE SUIS PAS EN SERVICE ! ENFIN, UN PEU !",
    "SUR 100 COLLÈGUES, COMBIEN SAVENT COURIR ? UN !",
    "C'EST MOI QUI CONDUIS ! NON. C'EST PAS MOI.",
    "FRANCKYYY ! LA MÊME ! POUR TOUT LE MONDE !",
    "J'AI UNE PISTE ! ENFIN, J'AVAIS.",
  ],
};
/* Un peu plus d'un quart des prises de parole. Au-delà il ne parlait plus
   qu'en capitales et le procédé s'usait ; en dessous, on faisait une
   partie entière sans en entendre un seul. */
const COMPERE_CHANCE_CRI = 0.28;
const COMPERE_DUREE_CRI = 4.2;

/* Ce qu'il raconte sur l'autre. Deux jeux, un par héros : il faut que ce
   soit le COLLÈGUE qu'on entend, pas une voix générique. On se moque de
   ce qu'il fait, jamais de ce qu'il est — et jamais au point que le
   joueur se sente visé : c'est de l'affection de comptoir. */
const COMPERE_PHRASES = {
  /* PF parle de THIBAUT — le rapide */
  pf: [
    "Thibaut. Il court vite. C'est tout ce qu'il fait, mais il le fait vite.",
    "Mon collègue. Mon COLLÈGUE. Regardez-le servir.",
    "Il m'a dit « je gère ». Il a dit ça.",
    "Il a arrêté un type en courant. Le mauvais type. Mais en courant.",
    "La paperasse, c'est pour qui ? C'est pour moi.",
    "On m'a mis en binôme avec un lévrier.",
    "Il dit qu'il a une piste. Il a jamais de piste.",
    "Vingt ans de métier. Vingt ans à courir derrière lui.",
    "Il tire mieux qu'il ne sert. C'est dire.",
    "Je lui ai dit : réfléchis d'abord. Il était déjà parti.",
    "Il a klaxonné pendant toute la filature. TOUTE la filature.",
    "Un jour il va se rentrer dans une porte. J'ai hâte.",
    "C'est un bon gars. Faut juste jamais lui donner les clés.",
    "Il note rien. Il retient tout. Et il se trompe.",
  ],
  /* THIBAUT parle de PF — le lent */
  th: [
    "PF, il réfléchit. Longtemps. Très, très longtemps.",
    "Il a mis vingt minutes à choisir une bière. Vingt.",
    "Mon collègue est lent. Mais il arrive. Toujours.",
    "Il note TOUT. Même ça. Il va noter ça.",
    "Il a jamais couru de sa vie. Jamais. Pas une fois.",
    "Je lui ai dit qu'on était pressés. Il a pris un carnet.",
    "Il a une théorie. Il a toujours une théorie.",
    "Il conduit à quarante. Sur l'autoroute.",
    "On a failli le perdre dans un escalier. Il montait.",
    "Il relit ses rapports. Deux fois. À voix haute.",
    "Il dit qu'il a une méthode. C'est pas une méthode, c'est une sieste.",
    "Il m'a expliqué un truc pendant une heure. J'ai rien retenu.",
    "C'est le meilleur flic que je connaisse. Le plus lent, aussi.",
    "Il range son bureau avant une descente. Avant.",
  ],
};

Object.assign(Tournee, {
  /* --------- composition --------- */
  /* On sème une grappe avec quelqu'un, puis on la complète avec SES
     amis. Le reste des places se remplit avec qui il reste : mieux vaut
     une grappe dépareillée qu'une place vide, et de toute façon les
     balades les mélangeront. */
  composerFoule(){
    this.foule = [];
    this.replT = melange(FOULE_ECHANGE[0], FOULE_ECHANGE[1], Math.random());
    this.echange = null;
    this.baladeT = melange(FOULE_BALADE[0], FOULE_BALADE[1], Math.random());
    this.replique = null;
    const libres = BAR_CLIENTS.map(c => c.id);
    melangerTableau(libres);

    /* UNE GRAINE PAR GRAPPE D'ABORD, puis on complète À TOUR DE RÔLE.
       Remplir chaque grappe à fond avant de passer à la suivante vidait
       les dernières : mesuré, dix personnes pour six grappes en
       laissaient deux désertes. À tour de rôle, elles se remplissent
       toutes, et le bar a du monde partout où on passe. */
    const graines = [];
    for (const place of FOULE_PLACES){
      if (!libres.length) break;
      const id = libres.shift();
      graines.push({ place:place.id, ids:[id] });
    }
    let tour = 0;
    while (libres.length && graines.length){
      const g = graines[tour % graines.length];
      tour++;
      if (g.ids.length >= FOULE_PAR_GRAPPE) {
        if (graines.every(x => x.ids.length >= FOULE_PAR_GRAPPE)) break;
        continue;
      }
      /* on prend un AMI de la graine s'il en reste un, sinon le premier
         venu : mieux vaut une grappe dépareillée qu'une place vide */
      const amis = (LIENS[g.ids[0]] && LIENS[g.ids[0]].amis) || [];
      let i = libres.findIndex(x => amis.indexOf(x) >= 0);
      if (i < 0) i = 0;
      g.ids.push(libres.splice(i, 1)[0]);
    }

    for (const g of graines){
      g.ids.forEach((id, k) => {
        const ref = BAR_CLIENTS.find(c => c.id === id);
        if (!ref) return;
        this.foule.push({
          ref, place:g.place, rang:k, etat:"grappe", t:0,
          x:this.xFoule(g.place, k, g.ids.length), dir:1, foulee:0,
          cible:0, retour:0,
        });
      });
    }
  },

  /* La position d'un membre : le centre de sa grappe, décalé selon son
     rang. Les rangs sont centrés sur la grappe pour qu'une grappe de
     deux ne soit pas décalée sur un côté. */
  xFoule(place, rang, taille){
    const p = FOULE_PLACES.find(q => q.id === place);
    if (!p) return 0.5;
    return p.x + (rang - (taille - 1) / 2) * FOULE_ECART;
  },
  grappe(place){ return this.foule.filter(m => m.place === place); },

  /* --------- vie --------- */
  majFoule(dt){
    if (!this.foule) return;

    /* les répliques et les échanges */
    this.replT -= dt;
    if (this.replique){
      this.replique.t -= dt;
      if (this.replique.t <= 0){
        this.replique = null;
        /* la SUITE de l'échange enchaîne presque tout de suite : une
           réponse qui arrive dix secondes après la question n'est plus
           une réponse, c'est une autre phrase */
        if (this.echange && this.echange.length) this.replT = FOULE_ENCHAINE;
      }
    }
    if (this.replT <= 0 && !this.replique){
      if (this.echange && this.echange.length){
        const suite = this.echange.shift();
        /* celui qui devait répondre a pu partir en balade entre-temps :
           on rend alors la parole à n'importe qui de sa grappe, et si la
           grappe s'est vidée, l'échange s'arrête là. C'est ce qui arrive
           dans un vrai bar, aussi. */
        const qui = (suite.qui.etat === "grappe") ? suite.qui
          : piocher(this.grappe(suite.qui.place).filter(m => m.etat === "grappe"));
        if (qui) this.replique = { qui, txt:suite.txt, t:FOULE_REPL_DUREE };
        else this.echange = null;
        this.replT = FOULE_ENCHAINE;
      } else {
        this.replT = melange(FOULE_ECHANGE[0], FOULE_ECHANGE[1], Math.random());
        this.ouvrirEchange();
      }
    }

    /* les balades et les départs */
    this.baladeT -= dt;
    if (this.baladeT <= 0){
      this.baladeT = melange(FOULE_BALADE[0], FOULE_BALADE[1], Math.random());
      const sedentaires = this.foule.filter(m => m.etat === "grappe");
      if (sedentaires.length > 1){
        const qui = piocher(sedentaires);
        qui.etat = "balade"; qui.t = 0;
        qui.cible = hasard(0.10, 0.90);
        qui.retour = melange(FOULE_BALADE_DUREE[0], FOULE_BALADE_DUREE[1], Math.random());
        qui.part = Math.random() < FOULE_DEPART;
        if (this.replique && this.replique.qui === qui) this.replique = null;
      }
    }

    for (let i = this.foule.length - 1; i >= 0; i--){
      const m = this.foule[i];
      m.t += dt;
      if (m.etat === "grappe"){
        /* il rejoint doucement sa place : après un départ voisin, les
           rangs se resserrent au lieu de sauter */
        const g = this.grappe(m.place);
        const cible = this.xFoule(m.place, g.indexOf(m), g.length);
        m.x += borne(cible - m.x, -dt * 0.10, dt * 0.10);
        continue;
      }
      if (m.etat === "balade"){
        m.foulee += dt * 6;
        const vers = m.part ? (m.x < 0.5 ? -0.2 : 1.2) : m.cible;
        m.dir = vers > m.x ? 1 : -1;
        m.x += m.dir * dt * 0.10;
        if (m.part){
          if (m.x < -0.15 || m.x > 1.15){ this.foule.splice(i, 1); }
          continue;
        }
        if (Math.abs(m.x - m.cible) < 0.012 && m.t > m.retour * 0.5){
          /* il repart vers une grappe, PAS forcément la sienne : c'est
             ce qui recompose la soirée sans chef d'orchestre */
          m.etat = "revient"; m.t = 0;
          const dispos = FOULE_PLACES.filter(p => this.grappe(p.id).length < FOULE_PAR_GRAPPE);
          if (dispos.length) m.place = piocher(dispos).id;
        }
        continue;
      }
      if (m.etat === "revient"){
        m.foulee += dt * 6;
        const g = this.grappe(m.place).filter(q => q !== m);
        const cible = this.xFoule(m.place, g.length, g.length + 1);
        m.dir = cible > m.x ? 1 : -1;
        m.x += m.dir * dt * 0.11;
        if (Math.abs(m.x - cible) < 0.02){ m.etat = "grappe"; m.t = 0; }
      }
    }
  },

  /* --------- le collègue --------- */
  /* Il est l'AUTRE champion : celui que le joueur n'a pas choisi. Rien à
     déclarer, donc, et rien à maintenir le jour où un troisième héros
     arrive. */
  composerCompere(){
    const autre = BAR_CHAMPIONS.find(c => c !== this.champion);
    if (!autre){ this.compere = null; return; }
    this.compere = {
      ref:autre, cle:autre.prefixe.replace("bar_", ""),
      x:hasard(0.15, 0.85), dir:1, foulee:0,
      etat:"pause", t:COMPERE_ENTREE, cible:0.5,
      parleT:hasard(COMPERE_PAROLE[0], COMPERE_PAROLE[1]),
      dit:null, ditT:0, crie:false,
    };
  },

  majCompere(dt){
    const c = this.compere;
    if (!c) return;
    c.t -= dt;
    if (c.etat === "pause"){
      if (c.t <= 0){
        c.etat = "marche";
        c.t = melange(COMPERE_TRAJET[0], COMPERE_TRAJET[1], Math.random());
        /* il repart vers ailleurs, et jamais vers le point où il est :
           une cible trop proche le faisait vibrer sur place */
        do { c.cible = hasard(0.08, 0.92); } while (Math.abs(c.cible - c.x) < 0.15);
      }
    } else {
      c.foulee += dt * 4.2;
      c.dir = c.cible > c.x ? 1 : -1;
      c.x += c.dir * dt * COMPERE_MARCHE;
      if (Math.abs(c.x - c.cible) < 0.02 || c.t <= 0){
        c.etat = "pause";
        c.t = melange(COMPERE_PAUSE[0], COMPERE_PAUSE[1], Math.random());
      }
    }
    if (c.ditT > 0){
      c.ditT -= dt;
      if (c.ditT <= 0) c.dit = null;
    } else {
      c.parleT -= dt;
      if (c.parleT <= 0){
        c.parleT = melange(COMPERE_PAROLE[0], COMPERE_PAROLE[1], Math.random());
        c.crie = Math.random() < COMPERE_CHANCE_CRI;
        c.dit = piocher((c.crie ? COMPERE_CRIS : COMPERE_PHRASES)[c.cle]);
        c.ditT = c.crie ? COMPERE_DUREE_CRI : COMPERE_DUREE;
      }
    }
  },

  /* Il titube en permanence : c'est tout le personnage. À l'arrêt il
     tient son verre, ce qui donne à la pose de repos une raison d'être
     là plutôt qu'un temps mort. */
  poseCompere(){
    const c = this.compere;
    if (!c) return null;
    const base = c.etat === "marche" ? "titube" : "tient";
    return Images.table[poseBar(c.ref, base)] ? poseBar(c.ref, base)
         : poseBar(c.ref, "idle");
  },

  /* UN ÉCHANGE PLUTÔT QU'UNE PHRASE. Deux voisins de la même grappe se
     répondent ; la bulle passe de l'un à l'autre. Faute de voisin — une
     grappe d'une seule personne — on retombe sur la phrase isolée, qui
     reste juste : quelqu'un qui pense tout haut au comptoir, ça existe.

     LE CONTEXTE PASSE DEVANT. Quand le coup de feu bat son plein ou que
     le champion titube, la salle commente CE QUI SE PASSE : une
     conversation sur le maire pendant que tout brûle sonne faux. */
  ouvrirEchange(){
    const candidats = this.foule.filter(m => m.etat === "grappe");
    if (!candidats.length) return;
    const qui = piocher(candidats);
    const voisins = this.grappe(qui.place).filter(m => m !== qui && m.etat === "grappe");
    if (!voisins.length || this.contexteFoule().length){
      this.echange = null;
      this.replique = { qui, txt:this.phraseFoule(qui), t:FOULE_REPL_DUREE };
      return;
    }
    const autre = piocher(voisins);
    const lignes = piocher(FOULE_DISCUSSIONS[this.seauDiscussion()]);
    this.echange = lignes.slice(1).map((txt, i) => ({
      qui: (i % 2 === 0) ? autre : qui, txt }));
    this.replique = { qui, txt:lignes[0], t:FOULE_REPL_DUREE };
  },

  /* Les proportions du bar. Les ragots l'emportent parce que c'est ce
     dont on parle vraiment dans un bar de quartier ; les faits divers
     arrivent assez souvent pour qu'on tombe dessus dans une soirée, pas
     assez pour que le comptoir devienne une revue de presse. */
  seauDiscussion(){
    const r = Math.random();
    return r < 0.46 ? "ragots" : r < 0.76 ? "faits_divers" : "commun";
  },

  contexteFoule(){
    const seaux = [];
    if (this.coupDeFeu) seaux.push("coup_de_feu");
    if (this.bourre > 0) seaux.push("pompette");
    if (this.ambiance < BAR_AMBIANCE_BUT * 0.30) seaux.push("ambiance_basse");
    if (this.ambiance > BAR_AMBIANCE_BUT * 0.80) seaux.push("ambiance_haute");
    return seaux;
  },

  /* Le contexte d'abord, le personnage ensuite. Une réplique qui parle
     de ce qui se passe vaut dix qui parlent dans le vide. */
  phraseFoule(m){
    const seaux = this.contexteFoule();
    if (seaux.length && Math.random() < 0.62) return piocher(FOULE_PHRASES[piocher(seaux)]);
    const perso = FOULE_PHRASES[m.ref.id];
    if (perso && Math.random() < 0.65) return piocher(perso);
    return piocher(FOULE_PHRASES.commun);
  },
});
