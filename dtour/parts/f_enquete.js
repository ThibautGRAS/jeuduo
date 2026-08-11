
/* ==================================================================
   NIVEAU 2 — L'AFFAIRE DE LA PIZZA AU CHORIZO
   ------------------------------------------------------------------
   Une mini-enquête dans un appartement vu en coupe. Le décor est une
   seule image très large ; la caméra glisse dessus. Tout est posé en
   POURCENTAGE de cette image, jamais en pixels d'écran : c'est ce qui
   permet au niveau de tenir aussi bien sur un ordinateur que sur un
   téléphone couché.

   Découpage demandé, et où il se trouve ici :
     LevelManager          -> Jeu.niveau + Progres
     CaseGenerator         -> Affaire
     InvestigationManager  -> Enquete
     EvidenceManager       -> Dossier
     InteractionManager    -> Enquete.zoneProche / inspecter
     SuspectManager        -> SUSPECTS + Enquete.interroger
     HortenseEventManager  -> HortenseApp
     PieProjectile         -> HortenseApp.tarte
     DodgeManager          -> HortenseApp.esquiver
================================================================== */

const ENQ_DUREE = 300;              /* cinq minutes */
const ENQ_OBJECTIF = 6;             /* indices à réunir */
const ENQ_PORTEE = 0.026;           /* portée pour les meubles, en fraction d'image */
/* Les gens s'abordent de plus loin qu'un tiroir ne s'ouvre : la portée
   de la parole est celle à laquelle leur nom s'affiche, pas moins. On
   voyait le nom sans pouvoir encore adresser la parole. */
const ENQ_PORTEE_GENS = ENQ_PORTEE * 2.2;
const ENQ_MARCHE = 0.20;            /* fraction d'image parcourue par seconde */
const ENQ_LIGNE = 0.920;   /* la ligne de sol du salon, relevée sur le décor */
/* Un adulte fait environ 70 % de la hauteur sous plafond, et la pièce
   occupe 88 % de l'image : 0,62 et pas un chiffre au jugé. À 0,46, les
   inspecteurs mesuraient un mètre trente et avaient l'air collés sur
   une carte postale plutôt que debout dans le salon. */
const ENQ_TAILLE = 0.62;
const ENQ_FOUILLE = 0.75;
const ENQ_ACCUSATIONS = 2;         /* on n'a droit qu'à deux noms */
const ENQ_MAUVAISE = 20;            /* secondes perdues sur une accusation ratée */
const ENQ_TARTE = 10;               /* secondes perdues sur une tarte reçue */
/* Part de la hauteur mangée par la barre de commandes HTML du niveau 2.
   Tout ce que le canevas écrit en dessous est invisible. */
const ENQ_BANDE_CMD = 0.19;
const ENQ_ESQUIVE_FENETRE = 0.62;   /* fenêtre d'esquive : 0,45 s était trop court au pouce */
const ENQ_ESQUIVE_PTS = 100;

/* ---------- les meubles fouillables ----------
   `pied` est l'abscisse où l'inspecteur s'arrête, parfois décalée pour
   ne pas se planter dans le meuble. */
const ZONES = [
  { id:"chaussures", nom:"les chaussures", dedans:"dans une chaussure",  x:0.038, y:0.74, pied:0.055 },
  { id:"manteaux",   nom:"les manteaux", dedans:"dans une poche de manteau",    x:0.078, y:0.42, pied:0.102 },
  { id:"sac",        nom:"le sac", dedans:"dans le sac",          x:0.156, y:0.74, pied:0.156 },
  { id:"biblio",     nom:"la bibliothèque", dedans:"derrière les livres", x:0.222, y:0.34, pied:0.222 },
  { id:"canape",     nom:"sous le canapé", dedans:"sous le canapé",  x:0.272, y:0.70, pied:0.272 },
  { id:"basse",      nom:"la table basse", dedans:"sous la table basse",  x:0.350, y:0.84, pied:0.350 },
  { id:"tv",         nom:"le meuble TV", dedans:"dans le meuble TV",    x:0.392, y:0.66, pied:0.392 },
  { id:"frigo",      nom:"le frigo", dedans:"au frigo",        x:0.503, y:0.56, pied:0.503 },
  { id:"four",       nom:"le four", dedans:"dans le four",         x:0.560, y:0.64, pied:0.560 },
  { id:"table",      nom:"la table", dedans:"sous la table",        x:0.608, y:0.76, pied:0.608 },
  { id:"placards",   nom:"les placards", dedans:"au fond d'un placard",    x:0.648, y:0.26, pied:0.654 },
  { id:"evier",      nom:"l'évier", dedans:"sous l'évier",         x:0.700, y:0.52, pied:0.700 },
  { id:"poubelle",   nom:"la poubelle", dedans:"à la poubelle",     x:0.752, y:0.72, pied:0.752 },
  { id:"commode",    nom:"la commode", dedans:"dans la commode",      x:0.842, y:0.72, pied:0.842 },
  { id:"portant",    nom:"le portant", dedans:"derrière les vêtements",      x:0.966, y:0.44, pied:0.958 },
  { id:"lit",        nom:"sous le lit", dedans:"sous le lit",     x:0.948, y:0.80, pied:0.912 },
];

/* ---------- la banque d'indices ----------
   `analyse` est ce que dit Pierre-François, qui sait lire une trace ;
   `brut` ce qu'en dit Thibaut, qui décrit ce qu'il voit. Quand `expert`
   est vrai, seul Pierre-François en tire quelque chose — et l'indice
   reste sur place, à récupérer avec le bon inspecteur. */
const INDICES = [
  { id:"poils", sprite:"ind_poils", nom:"Touffe de poils roux",
    analyse:"Poils de chat. Arrachés, pas tombés.", brut:"Du roux. Beaucoup de roux.", expert:true,
    q:"Une touffe de poils roux. Arrachée, pas tombée.",
    okR:"Il se débat quand on le porte. Tout le monde le sait, ici.",
    koR:"Il perd ses poils, c'est la saison. En août ? Oui. Enfin, il perd." },
  { id:"gamelle", sprite:"ind_gamelle", nom:"Gamelle renversée",
    analyse:"Renversée vers l'extérieur. Poussée, pas bousculée.", brut:"Une gamelle par terre.", expert:true,
    q:"La gamelle est renversée vers l'extérieur. Poussée.",
    okR:"C'est lui qui la pousse quand elle est vide. C'est son message.",
    koR:"Elle était déjà comme ça. Enfin : je ne l'ai pas touchée non plus." },
  { id:"collier", sprite:"ind_collier", nom:"Collier de chat",
    analyse:"Détaché à la boucle. Personne ne l'a arraché.", brut:"Un collier avec une médaille.", social:true,
    q:"Son collier était détaché. Proprement, à la boucle.",
    okR:"Il faut bien le lui enlever pour le brosser. Qui l'a brossé ?",
    koR:"Il l'enlève tout seul. Avec ses pattes. Il est très adroit." },
  { id:"croquettes", sprite:"ind_croquettes", nom:"Sachet de croquettes",
    analyse:"Ouvert ce soir. Le pli est encore vif.", brut:"Des croquettes ouvertes.", expert:true,
    q:"Le sachet a été ouvert ce soir.",
    okR:"Je l'ai nourri, oui. Comme tous les soirs. C'est interdit ?",
    koR:"Ah, ce sachet. Il était ouvert avant. Bien avant. La semaine dernière." },
  { id:"griffures", sprite:"ind_griffures", nom:"Griffures sur le bois",
    analyse:"Fraîches. L'écharde tient encore.", brut:"Du bois abîmé.",
    q:"Des griffures fraîches sur le meuble.",
    okR:"Il fait ça quand on l'enferme quelque part. Qui l'a enfermé ?",
    koR:"Ce chat griffe tout, tout le temps. Ça ne prouve rien." },
  { id:"souris", sprite:"ind_souris", nom:"Souris en peluche",
    analyse:"Retrouvée loin de son panier. Portée, pas jouée.", brut:"Une souris en tissu.", social:true,
    q:"Sa souris était à l'autre bout de l'appartement.",
    okR:"Il la traîne partout, il l'apporte à qui l'écoute.",
    koR:"Il l'a lancée. Les chats lancent leurs jouets. C'est connu." },
  { id:"pari", sprite:"ind_pari", nom:"Ticket de pari sportif",
    analyse:"Validé ce soir, 21 h 40. Perdant.", brut:"Un ticket avec des chiffres.", expert:true,
    q:"Un ticket de pari validé à 21 h 40. Perdant.",
    okR:"J'ai perdu douze euros. Vous voulez que je vous raconte le match ?",
    koR:"Ce n'est pas le mien. Enfin si. Mais il est vieux. De ce soir, mais vieux." },
  { id:"loto", sprite:"ind_loto", nom:"Grille de loto",
    analyse:"Cochée au stylo. Le même stylo que le carnet.", brut:"Une grille avec des croix.", social:true,
    q:"Cette grille est cochée avec le stylo du carnet.",
    okR:"On coche à plusieurs, c'est l'intérêt. On perd à plusieurs aussi.",
    koR:"N'importe quel stylo fait ces traits. Vous n'y connaissez rien." },
  { id:"de", sprite:"ind_de", nom:"Dé à six faces",
    analyse:"Un seul. Il en manque cinq autres.", brut:"Un dé.", social:true,
    q:"Un dé, tout seul. Il en manque cinq.",
    okR:"On a joué. Les autres doivent être sous le canapé, comme toujours.",
    koR:"Je ne joue pas aux dés. Jamais. Sauf le mardi. Pas ce soir." },
  { id:"cartes", sprite:"ind_cartes", nom:"Jeu de cartes",
    analyse:"Éparpillées. La partie s'est arrêtée d'un coup.", brut:"Des cartes par terre.", social:true,
    q:"La partie de cartes s'est arrêtée net.",
    okR:"Quelqu'un a crié dans la cuisine. On a tous levé la tête.",
    koR:"Elle s'est finie normalement. J'ai gagné. Enfin, on a arrêté." },
  { id:"badge_gym", sprite:"ind_badge_gym", nom:"Badge de salle de sport",
    analyse:"Pointé à 20 h 15. Il a quitté la salle avant.", brut:"Un badge noir.", expert:true,
    q:"Ce badge a été pointé à 20 h 15.",
    okR:"Séance courte, j'avais faim. C'est bien le problème de ce soir, non ?",
    koR:"Ce badge ne prouve rien. Il peut pointer tout seul. Ça arrive." },
  { id:"shaker_prot", sprite:"ind_shaker_prot", nom:"Shaker de protéines",
    analyse:"Reste encore humide. Bu il y a moins d'une heure.", brut:"Un gobelet avec du beige.", expert:true,
    q:"Le shaker est encore humide. Moins d'une heure.",
    okR:"Je bois ça après le sport. Ça coupe la faim. Mal, visiblement.",
    koR:"Il traîne depuis hier. La poudre reste humide longtemps. Très longtemps." },
  { id:"chaussure", sprite:"ind_chaussure", nom:"Chaussure boueuse",
    analyse:"Boue fraîche, semelle de course. Deux pointures possibles.", brut:"Une chaussure sale.",
    q:"Une chaussure de course, boue fraîche.",
    okR:"On était deux à courir ce soir. Demandez à l'autre.",
    koR:"Il n'a pas plu. Enfin, il a plu, mais pas là où j'étais." },
  { id:"chaussette", sprite:"ind_chaussette", nom:"Chaussette dépareillée",
    analyse:"De sport, tachée. Sans sa jumelle.", brut:"Une chaussette.", social:true,
    q:"Une chaussette de sport. Sans sa jumelle.",
    okR:"Cet appartement mange les chaussettes. Ce n'est pas une enquête, c'est un fait.",
    koR:"Elle n'est pas à moi. Je porte les miennes par paires. Toujours." },
  { id:"casque", sprite:"ind_casque", nom:"Casque de vélo",
    analyse:"Encore tiède à l'intérieur. Porté récemment.", brut:"Un casque rouge et noir.", expert:true,
    q:"Le casque est encore tiède à l'intérieur.",
    okR:"Je suis venue à vélo. Comme toujours. Comme tout le monde devrait.",
    koR:"Il fait chaud dans cette pièce. Tout est tiède. Ce casque, la pièce, tout." },
  { id:"rustine", sprite:"ind_rustine", nom:"Rustine et démonte-pneu",
    analyse:"Rustine neuve, colle encore collante.", brut:"Des outils de vélo.", expert:true,
    q:"Une rustine posée ce soir. La colle colle encore.",
    okR:"J'ai crevé en arrivant. Ça m'a pris vingt minutes, dans le couloir.",
    koR:"Je répare toujours mes pneus à l'avance. Par précaution. Voilà." },
  { id:"montre", sprite:"ind_montre", nom:"Montre connectée",
    analyse:"Arrêtée à 21 h 52. Détachée brusquement.", brut:"Une montre.", expert:true,
    q:"La montre s'est arrêtée à 21 h 52. Détachée d'un coup.",
    okR:"Le bracelet lâche tout le temps. J'en ai racheté deux.",
    koR:"Elle n'a pas d'heure, cette montre. Enfin si. Mais elle retarde." },
  { id:"verre_renverse", sprite:"ind_verre_renverse", nom:"Verre à vin renversé",
    analyse:"Vin renversé vers la porte. Quelqu'un est parti vite.", brut:"Un verre par terre, du rouge.", expert:true,
    q:"Le vin s'est renversé vers la porte.",
    okR:"Ça, c'est quand on a tous couru voir. On s'est bousculés.",
    koR:"Il est tombé tout seul. Les verres tombent. La table penche." },
  { id:"bouteille_vin", sprite:"ind_bouteille_vin", nom:"Bouteille de vin vide",
    analyse:"Débouchée ce soir. Le col est encore humide.", brut:"Une bouteille couchée.",
    q:"Cette bouteille a été ouverte ce soir.",
    okR:"On a bu, oui. C'est une soirée, pas un interrogatoire. Enfin, si.",
    koR:"Elle était vide en arrivant. Je l'ai trouvée vide. On me l'a donnée vide." },
  { id:"tirebouchon", sprite:"ind_tirebouchon", nom:"Tire-bouchon",
    analyse:"Rangé dans le mauvais tiroir. Rangé vite.", brut:"Un tire-bouchon.", expert:true,
    q:"Le tire-bouchon a été rangé dans le mauvais tiroir.",
    okR:"Personne ne range rien ici. C'est déjà bien qu'il soit dans un tiroir.",
    koR:"C'est son tiroir. Ça a toujours été son tiroir. Depuis toujours." },
  { id:"bouchon", sprite:"ind_bouchon", nom:"Bouchon de liège",
    analyse:"Percé deux fois. On s'y est repris.", brut:"Un bouchon.", social:true,
    q:"Ce bouchon a été percé deux fois.",
    okR:"Je n'ai jamais su ouvrir une bouteille. Tout le monde le sait.",
    koR:"Une seule fois. Proprement. Enfin, ce n'est pas moi qui l'ai ouverte." },
  { id:"capsule", sprite:"ind_capsule", nom:"Capsule de bière",
    analyse:"Tordue à la main. Pas de décapsuleur.", brut:"Une capsule.",
    q:"Cette capsule a été tordue à la main.",
    okR:"Il y a un décapsuleur sur le frigo. Personne ne s'en sert jamais.",
    koR:"Je ne bois pas de bière. Sauf quand il y en a. Il n'y en avait pas." },
  { id:"shaker_bar", sprite:"ind_shaker_bar", nom:"Shaker de bar",
    analyse:"Vient du D'Tour. Il n'a rien à faire ici.", brut:"Un shaker en métal.", expert:true,
    q:"Ce shaker vient du D'Tour. Il n'a rien à faire ici.",
    okR:"Il l'a apporté pour faire le malin. Il fait ça à chaque fois.",
    koR:"Il traîne ici depuis des mois. C'est un shaker d'appartement, maintenant." },
  { id:"citron", sprite:"ind_citron", nom:"Rondelle de citron",
    analyse:"Coupé fin. La même coupe que la tarte.", brut:"Une rondelle jaune.", expert:true,
    q:"Ce citron est coupé comme la tarte.",
    okR:"Elle est passée. Vous ne le saviez pas ? Vous le savez maintenant.",
    koR:"Un citron, c'est un citron. Ça se coupe d'une seule façon. Voilà." },
  { id:"tarte_part", sprite:"ind_tarte_part", nom:"Part de tarte entamée",
    analyse:"Tarte au citron. Une bouchée, pas plus.", brut:"Un morceau de tarte.", social:true,
    q:"Une part de tarte au citron. Une seule bouchée.",
    okR:"Personne n'ose finir ses tartes. C'est un principe de sécurité.",
    koR:"Je n'y ai pas touché. Enfin, une bouchée. Pour vérifier." },
  { id:"cendrier", sprite:"ind_cendrier", nom:"Cendrier",
    analyse:"Un seul mégot. Fumé jusqu'au filtre, très vite.", brut:"Un mégot.", expert:true,
    q:"Un seul mégot, fumé jusqu'au filtre. Vite.",
    okR:"Quelqu'un est sorti sur le balcon. Ça fume, dehors, ça discute.",
    koR:"Personne ne fume ici. C'est un vieux mégot. D'un ancien locataire." },
  { id:"pieces", sprite:"ind_pieces", nom:"Pièces de monnaie",
    analyse:"Trois pièces empilées. Posées, pas tombées.", brut:"Des pièces.", expert:true,
    q:"Trois pièces empilées. Posées avec soin.",
    okR:"Il compte tout, il empile tout. Vous l'avez vu faire ?",
    koR:"Elles sont tombées comme ça. Empilées. Ça arrive plus souvent qu'on croit." },
  { id:"cles", sprite:"ind_cles", nom:"Trousseau de clés",
    analyse:"Clés de l'appartement, sur la table, pas au crochet.", brut:"Des clés.",
    q:"Les clés étaient sur la table, pas au crochet.",
    okR:"Quand on rentre les mains pleines, on pose. On ne raccroche pas.",
    koR:"Elles étaient au crochet. Je les ai vues au crochet. J'en suis certain." },
  { id:"telephone", sprite:"ind_telephone", nom:"Téléphone allumé",
    analyse:"Écran allumé, un appel manqué à 21 h 47.", brut:"Un téléphone.", expert:true,
    q:"Un appel manqué à 21 h 47 sur ce téléphone.",
    okR:"C'était moi. Je cherchais quelqu'un. Personne n'a décroché.",
    koR:"Ce téléphone n'est pas le mien. Le mien est... ailleurs. En charge." },
  { id:"carnet", sprite:"ind_carnet", nom:"Carnet gribouillé",
    analyse:"Une page arrachée. Les traces suivantes sont lisibles.", brut:"Un carnet ouvert.", expert:true,
    q:"Une page a été arrachée de ce carnet.",
    okR:"J'arrache mes pages ratées. J'en rate beaucoup.",
    koR:"Il manque une page ? Elle a dû se détacher. Le papier vieillit." },
  { id:"stylo", sprite:"ind_stylo", nom:"Stylo mordillé",
    analyse:"Mâchouillé, toujours du même côté.", brut:"Un stylo abîmé.",
    q:"Ce stylo est mordillé, toujours du même côté.",
    okR:"C'est le mien. Je mords. C'est mieux que fumer.",
    koR:"Beaucoup de gens mordent leur stylo. C'est une manie très répandue." },
  { id:"lunettes_noires", sprite:"ind_lunettes_noires", nom:"Lunettes de soleil",
    analyse:"Pliées, posées à l'intérieur. À 22 h.", brut:"Des lunettes noires.", social:true,
    q:"Des lunettes de soleil, pliées, à l'intérieur, à 22 h.",
    okR:"Il les enlève pour manger. C'est la seule chose qui les lui fait enlever.",
    koR:"Ce ne sont pas les miennes. Les miennes sont sur mon nez. Regardez." },
  { id:"echarpe_grise", sprite:"ind_echarpe_grise", nom:"Écharpe grise",
    analyse:"Roulée en boule, encore tiède.", brut:"Une écharpe grise.", expert:true,
    q:"Cette écharpe est roulée en boule, encore tiède.",
    okR:"Je l'enlève en entrant et je la jette n'importe où. Toujours.",
    koR:"Il fait froid dehors. Elle est tiède parce que... la pièce est tiède." },
  { id:"pq", sprite:"ind_pq", nom:"Rouleau de papier toilette",
    analyse:"Neuf, hors des toilettes, entamé de deux feuilles.", brut:"Un rouleau de papier.", social:true,
    q:"Un rouleau de papier toilette, ici, dans le salon.",
    okR:"Ne posez pas la question. Vraiment. Ne la posez pas.",
    koR:"Il était là avant moi. Ce rouleau me suit. Ce n'est pas réciproque." },
  { id:"brassard", sprite:"ind_brassard", nom:"Brassard POLICE",
    analyse:"Un brassard de police. Le nôtre.", brut:"Un brassard orange.",
    q:"Ce brassard est à nous. Il était par terre.",
    okR:"Vous l'avez fait tomber en entrant. Tous les deux.",
    koR:"Je ne l'ai pas touché. J'ai failli, mais non." },
  { id:"echarpe_tri", sprite:"ind_echarpe_tri", nom:"Écharpe tricolore",
    analyse:"Écharpe de maire. Absente il y a une heure.", brut:"Une écharpe bleu blanc rouge.", social:true,
    q:"Une écharpe de maire. Elle n'était pas là il y a une heure.",
    okR:"Il la met pour tout. Pour un apéritif. Pour un ascenseur.",
    koR:"Je ne vois pas de quoi vous parlez. Quelle écharpe ? Celle-là ? Ah." },
  { id:"carton_pizza", sprite:"ind_carton_pizza", nom:"Carton à pizza",
    analyse:"Vide, plié en deux. Rangé, pas jeté.", brut:"Un carton plié.", expert:true,
    q:"Le carton est plié en deux et rangé. Pas jeté.",
    okR:"Quelqu'un a voulu faire disparaître le problème. Ça n'a pas marché.",
    koR:"Je plie tous les cartons. Question de place. Question de principe." },
  { id:"sauce",     sprite:"ind_sauce",     nom:"Sauce tomate",
    analyse:"Sauce tomate. Encore tiède.", brut:"C'est rouge.", expert:true,
    q:"On a trouvé de la sauce tomate. Encore tiède.", okR:"Alors c'était récent. Moi, ça fait une heure que je n'ai pas bougé.", koR:"Tiède ? Vous êtes sûrs ? Enfin, je veux dire : et alors ?" },
  { id:"chorizo",   sprite:"ind_chorizo",   nom:"Rondelle de chorizo",
    analyse:"Chorizo. Coupé fin, à la main.", brut:"Une rondelle. De quelque chose.",
    q:"Une rondelle de chorizo traînait. Coupée à la main.", okR:"Coupé à la main ? Alors ce n'est pas moi. Je déchire, je ne coupe pas.", koR:"À la main, oui... certains aiment le geste. Paraît-il." },
  { id:"miettes",   sprite:"ind_miettes",   nom:"Miettes de pâte",
    analyse:"Miettes de pâte. Semées vers la droite.", brut:"Des miettes. Partout.", expert:true,
    q:"Des miettes, semées en chemin. Ça vous parle ?", okR:"Je balaie derrière moi. Toujours. Demandez à qui vous voulez.", koR:"Des miettes, des miettes... tout le monde sème des miettes. C'est humain." },
  { id:"fromage",   sprite:"ind_fromage",   nom:"Fromage refroidi",
    analyse:"Fromage refroidi. {froid}, pas plus.", brut:"C'est collant.",
    q:"Le fromage a refroidi en {froid}. Le calcul est simple.", okR:"Alors comptez. À cette heure-là, on sait où j'étais.", koR:"{froid} ? C'est très... précis. On peut contester une durée ?" },
  /* `exige` limite un indice aux affaires qui le rendent lisible : des
     traces de pattes dans une affaire sans chat, c'est une piste qu'on
     ne peut jamais refermer. Les autres indices vont partout. */
  { id:"pattes",    sprite:"ind_pattes",    nom:"Traces de pattes", exige:"chat",
    analyse:"Empreintes. Quatre coussinets. Un félin.", brut:"Quelqu'un a marché dedans.", expert:true,
    q:"Des traces de pattes. Le chat a suivi quelqu'un.", okR:"Il ne me suit jamais, moi. Je ne sens rien d'intéressant.", koR:"Ce chat suit tout le monde ! Enfin... surtout ceux qui portent à manger." },
  { id:"serviette", sprite:"ind_serviette", nom:"Serviette froissée",
    analyse:"Serviette froissée. Quelqu'un s'est essuyé vite.", brut:"Un mouchoir. Bof.",
    q:"Une serviette froissée. On s'est essuyé en vitesse.", okR:"Je m'essuie lentement. C'est toute une éducation.", koR:"S'essuyer n'est pas un aveu. C'est de l'hygiène. Enfin, il me semble." },
  { id:"ticket",    sprite:"ind_ticket",    nom:"Ticket de livraison",
    analyse:"Ticket de livraison. {heure}. Une pizza chorizo.", brut:"Un papier. Avec des chiffres.",
    q:"Le ticket de livraison indique {heure}. Une chorizo.", okR:"Je n'ai rien entendu sonner. Ou alors j'ai le sommeil lourd.", koR:"{heure}... déjà ? Le temps passe vite quand... quand il passe." },
  { id:"menu",      sprite:"ind_ticket",    nom:"Menu du livreur", exige:"porte",
    analyse:"Un menu. Papier ordinaire, encre fraîche.",
    brut:"{livreur} ? Je le connais. Il ne monte jamais au {etage}.", social:true,
    q:"{livreur} ne monte jamais au {etage}. Quelqu'un est descendu.", okR:"Pas moi. Je ne descends jamais accueillir qui que ce soit.", koR:"Quelqu'un devait bien réceptionner. C'est du civisme." },
  { id:"assiette",  sprite:"ind_assiette",  nom:"Assiette utilisée",
    analyse:"Assiette utilisée. Jamais rapportée à l'évier.", brut:"Une assiette. Sale.",
    q:"Une assiette utilisée, jamais rapportée à l'évier.", okR:"Je rapporte toujours la mienne. C'est une question de principe.", koR:"Rapporter, ne pas rapporter... on refait le procès de la vaisselle ?" },
  { id:"boite",     sprite:"pizza_boite_ouverte", nom:"Boîte ouverte",
    analyse:"La boîte. Ouverte ici, pas à la cuisine.", brut:"La boîte ! Enfin, vide.",
    q:"On a la boîte. Ouverte au salon, pas à la cuisine.", okR:"Au salon ? Les gens ne respectent plus rien.", koR:"On ouvre où on peut ! Où on veut. Où c'était... pratique." },
  { id:"part",      sprite:"pizza_part",    nom:"Part abandonnée",
    analyse:"Une part sur {parts}, entamée puis reposée. Quelqu'un a été dérangé.", brut:"Une part ! On peut la manger ?",
    q:"Une part entamée, puis reposée. On a dérangé quelqu'un.", okR:"Reposer une part ? Quel gâchis. Ce n'est pas mon genre.", koR:"On peut être... interrompu. La vie interrompt. Ce soir-là, notamment." },
  { id:"billet",    sprite:"ind_billet",    nom:"Billet de cinq euros", exige:"argent",
    analyse:"Cinq euros. Posé bien à plat, pas tombé de poche.",
    brut:"Cinq euros ! On rachète une pizza ?",
    q:"Cinq euros, posés à plat. Quelqu'un a payé quelque chose.", okR:"Ce n'est pas à moi. Je ne paie qu'en pièces, demandez au D'Tour.", koR:"Payer n'est pas avouer ! Payer, c'est le contraire de voler, justement !" },
  { id:"manette",   sprite:"ind_serviette", nom:"Manette grasse", exige:"salon",
    analyse:"Une manette. Sale.", brut:"Des traces de doigts gras. Il a joué en mangeant.", social:true,
    q:"La manette est grasse. On a joué en mangeant.", okR:"Je ne touche pas à cette console. Elle me résiste.", koR:"On peut jouer ET manger. Le multitâche n'est pas un crime. Le gras non plus." },
];

/* ---------- ce que l'autre en dit ----------
   Trouver un indice déclenche un échange à deux voix : celui qui fouille
   annonce, l'autre commente. C'est ce qui fait qu'ils ont l'air de
   travailler ensemble plutôt que de se relayer. */
const ECHOS = {
  poils:["Arrachés. Quelqu'un l'a porté.", "Ou quelqu'un l'a poussé. Ça se discute."],
  gamelle:["Vers l'extérieur. Donc poussée de l'intérieur.", "Un chat qui range. On aura tout vu."],
  collier:["À la boucle. Donc des doigts.", "Ou des pattes très douées. Note-le quand même."],
  croquettes:["Ce soir. Le pli ne ment pas.", "Donc quelqu'un s'est occupé du chat. Pas de la pizza."],
  griffures:["Fraîches. Il était contrarié.", "Il n'est pas le seul, ce soir."],
  souris:["Portée jusqu'ici. Par lui ou par quelqu'un.", "Un chat qui offre un cadeau. Ou un alibi."],
  pari:["21 h 40. Il était devant son téléphone.", "Et pas devant la pizza. Dommage pour lui."],
  loto:["Le même stylo. Donc la même main.", "Ou la même table. Ne t'emballe pas."],
  de:["Cinq dés manquants. Ça s'est arrêté vite.", "Ou quelqu'un a ramassé. Vite aussi."],
  cartes:["Arrêtée net. Il s'est passé quelque chose.", "Et personne ne se souvient de quoi. Bien sûr."],
  badge_gym:["20 h 15. Il avait faim depuis longtemps.", "Deux heures de faim. C'est un mobile."],
  shaker_prot:["Moins d'une heure. Il était là.", "Et il avait encore faim. Ça se tient."],
  chaussure:["Deux pointures possibles. Ça n'aide pas.", "Ça élimine douze personnes. C'est déjà ça."],
  chaussette:["Sans sa jumelle. Comme toujours.", "Note-le. On ne sait jamais."],
  casque:["Tiède. Elle vient d'arriver.", "Ou elle vient de partir. Et de revenir."],
  rustine:["Vingt minutes dans le couloir. C'est un alibi.", "Ou une façon d'être dans le couloir vingt minutes."],
  montre:["21 h 52. Détachée d'un coup.", "Quelqu'un a couru. Ou s'est débattu."],
  verre_renverse:["Vers la porte. Quelqu'un sortait.", "Ou quelqu'un entrait. Tu conclus vite."],
  bouteille_vin:["Ouverte ce soir. Par quelqu'un d'ici.", "Par tout le monde d'ici, plutôt."],
  tirebouchon:["Le mauvais tiroir. Rangé par quelqu'un de pressé.", "Ou par quelqu'un qui ne vit pas ici."],
  bouchon:["Deux fois. Une main mal assurée.", "Ou une main pressée. Ça se ressemble."],
  capsule:["À la main. Il y a de la force ici.", "Ou de l'impatience. Je préfère l'impatience."],
  shaker_bar:["Il vient du bar. Donc quelqu'un vient du bar.", "Tout le monde vient du bar. C'est le quartier."],
  citron:["La même coupe que la tarte.", "Ne dis pas son nom. Il va lui arriver quelque chose."],
  tarte_part:["Une bouchée. Par politesse ou par peur.", "Les deux. Dans cet immeuble, les deux."],
  cendrier:["Fumé vite. Quelqu'un attendait quelque chose.", "Ou quelqu'un se cachait de quelqu'un."],
  pieces:["Empilées. Quelqu'un a pris son temps.", "Quelqu'un qui compte. Ça restreint."],
  cles:["Les mains pleines. De quoi ?", "De pizza, j'imagine. Mais je n'imagine rien."],
  telephone:["21 h 47. Quelqu'un ne répondait pas.", "Parce qu'il avait les mains prises."],
  carnet:["Une page arrachée. Et l'empreinte reste.", "Toujours. C'est ce que les gens oublient."],
  stylo:["Du même côté. C'est une signature.", "Une signature en salive. Charmant."],
  lunettes_noires:["Il les a enlevées. Donc il mangeait.", "Ou il voulait voir quelque chose de près."],
  echarpe_grise:["Tiède. Il vient d'entrer.", "Ou il n'est jamais sorti. C'est différent."],
  pq:["Je ne pose pas la question.", "Moi non plus. Notons-le et passons."],
  brassard:["C'est le tien.", "C'est le tien. Ramasse-le."],
  echarpe_tri:["Le maire est passé.", "Le maire passe partout. C'est son métier."],
  carton_pizza:["Rangé, pas jeté. C'est un aveu.", "C'est du rangement. Mais oui, c'est un aveu."],
  sauce:["Tiède ? Donc récent.", "Ne touche pas. Enfin, trop tard."],
  billet:["Personne ne paie pour un vol.", "Alors ce n'est pas un vol. C'est un remboursement."],
  menu:["Tu connais le livreur ?", "Je connais surtout ses horaires."],
  manette:["Gras. Donc il mangeait.", "Et il jouait. Les deux."],
  chorizo:["Coupé à la main. Personne ne fait ça.", "Moi je l'aurais mangée entière."],
  miettes:["Vers la droite, tu es sûr ?", "Quelqu'un est parti par là."],
  fromage:["Trente minutes. On l'a raté de peu.", "On était là il y a trente minutes."],
  pattes:["Un félin. On en connaît un.", "Il est juste là. Il nous regarde."],
  serviette:["Vite, et mal.", "Un coupable pressé, c'est déjà quelque chose."],
  ticket:["19 h 42. Note-le.", "Je note. Enfin, je retiens."],
  assiette:["Jamais rapportée. Ça en dit long.", "Ça en dit surtout sur cet appartement."],
  boite:["Ouverte ici. Pas à la cuisine.", "Donc on a mangé debout. Comme des sauvages."],
  part:["Reposée, pas jetée. On l'a dérangé.", "Ou il a eu honte."],
};

/* Un mot en entrant dans chaque pièce, une fois par partie. */
const PIECES = [
  { id:"entree",  jusqua:0.19, ligne:"L'entrée. On commence par le commencement." },
  { id:"salon",   jusqua:0.45, ligne:"Le salon. C'est ici que ça s'est joué." },
  { id:"cuisine", jusqua:0.80, ligne:"La cuisine. Le point de départ, en théorie." },
  { id:"chambre", jusqua:1.01, ligne:"La chambre. Personne ne mange une pizza ici." },
];

/* Remarques d'attente : ils se parlent quand on les laisse tranquilles. */
const BAVARDAGES = [
  [0, "On avance ?"], [1, "On avance."],
  [1, "J'ai faim."], [0, "Ce n'est pas le sujet."],
  [0, "Reprenons depuis le début."], [1, "On n'a pas encore de début."],
  [1, "Et si personne ne l'avait prise ?"], [0, "Alors elle serait là."],
  [0, "Note tout."], [1, "Je n'ai pas de carnet."],
];



/* ---------- ce dont on parle ----------
   Un sujet tient la question ET les réponses possibles. Avant, les
   questions défilaient d'un côté et les réponses de l'autre : on
   demandait l'heure et on s'entendait répondre qu'il y avait deux
   pizzas. Ici la réponse répond.

   Trois versions par sujet :
     pf  ce qu'on répond à Pierre-François, qui est de la famille ou de
         la bande — il n'obtient donc jamais de fait ;
     ok  ce qu'on répond à Thibaut quand on n'a rien fait ;
     ko  ce qu'on lui répond quand c'est nous.

   Pierre-François TUTOIE Teo et sa belle-sœur, et vouvoie Charles qu'il
   ne connaît pas. Thibaut vouvoie tout le monde : c'est un inconnu, et
   c'est précisément ce qui le rend efficace. */
const SUJETS = {
  mathilde:[
    { qPF:"Vous étiez où quand la porte a sonné ?", qTH:"Vous étiez dans quelle pièce ?",
      pf:"Elle répond comme on récite. Ça ne veut pas dire qu'elle ment.",
      ok:"Dans la cuisine. J'ai regardé l'heure, par réflexe. 21 h 12.",
      ko:"Quelque part par là. On ne note pas ces choses-là. Enfin, si, mais pas moi." },
    { qPF:"Vous reconstituez souvent les soirées ?", qTH:"Vous faites ça pour tout le monde ?",
      pf:"Elle enseigne. Elle ne peut pas s'en empêcher.",
      ok:"C'est mon métier. Une soirée, c'est une source. On la recoupe.",
      ko:"Je ne reconstitue rien du tout. J'observe. C'est différent. Très différent." },
    { qPF:"Qui avait faim, ce soir ?", qTH:"Qui parlait de manger avant la livraison ?",
      pf:"Elle a une liste. Bien sûr qu'elle a une liste.",
      ok:"Kevin, depuis huit heures et quart. Il donne l'heure exacte, demandez-lui.",
      ko:"Tout le monde avait faim. C'est une soirée. On a tous faim. Moi non." },
  ],

  tristan:[
    { qPF:"Vous êtes arrivé quand ?", qTH:"Vous êtes arrivé à quelle heure ?",
      pf:"Il répond avant qu'on ait fini. Ça peut être de l'honnêteté.",
      ok:"En courant, vers 21 h. Je viens toujours en courant, c'est plus rapide.",
      ko:"Juste avant vous. Enfin, bien avant. Le temps passe vite, non ?" },
    { qPF:"Vous avez bougé de la pièce ?", qTH:"Vous êtes resté assis un moment ?",
      pf:"Lui, rester assis. On aura tout entendu.",
      ok:"Jamais plus de deux minutes. Demandez à n'importe qui ici.",
      ko:"Je n'ai pas bougé. Pas une seule fois. C'est bien ça qui est étrange." },
    { qPF:"Solène était avec vous ?", qTH:"Vous étiez avec quelqu'un ?",
      pf:"Il cherche son nom avant de répondre. Ça se voit.",
      ok:"Elle nourrissait le chat. Elle fait ça dès qu'elle entre.",
      ko:"Solène ? Elle était là, oui. Enfin, dans l'appartement. Quelque part." },
  ],

  solene:[
    { qPF:"Ce chat est à vous ?", qTH:"Il est à qui, ce chat ?",
      pf:"Elle a répondu trop vite. Retenez ça.",
      ok:"Il est à moi le soir. Le reste du temps, il est à Gabi.",
      ko:"Bien sûr qu'il est à moi. Enfin. Il me choisit. C'est pareil." },
    { qPF:"Vous êtes venue comment ?", qTH:"Vous avez pris le vélo ?",
      pf:"À vélo. Elle vient toujours à vélo. Même sous la pluie.",
      ok:"À vélo, et j'ai crevé en arrivant. Vingt minutes dans le couloir.",
      ko:"En métro. Enfin, à vélo. Le vélo était en panne, alors le métro. Non, le vélo." },
    { qPF:"Vous l'avez nourri à quelle heure ?", qTH:"Vous avez nourri le chat ce soir ?",
      pf:"Elle sait où sont les croquettes. Pas où sont les assiettes.",
      ok:"Vers neuf heures. Il réclamait. Il réclame toujours à cette heure-là.",
      ko:"Je ne l'ai pas nourri. Enfin, un peu. Deux croquettes. Trois." },
  ],

  kevin:[
    { qPF:"Vous avez faim depuis quand ?", qTH:"Vous avez mangé, vous ?",
      pf:"Il donne l'heure à la minute. C'est un professeur de mathématiques.",
      ok:"20 h 15. J'ai badgé à la salle en sortant. Vous pouvez vérifier.",
      ko:"Depuis longtemps. Très longtemps. Je ne compte pas ces choses-là." },
    { qPF:"Vous avez compté les gens ?", qTH:"Vous avez compté combien de personnes ?",
      pf:"Il compte. Deux fois. Puis il recommence.",
      ok:"Six en comptant le chat. Et il en manquait une pendant dix minutes.",
      ko:"Je ne compte pas les gens. Je ne suis pas cet homme-là. Enfin, si, mais pas ce soir." },
    { qPF:"Vous êtes venu voir qui ?", qTH:"Vous êtes venu pour qui ?",
      pf:"Il ne dit jamais qu'il vient pour quelqu'un. Il vient, c'est tout.",
      ok:"Pour Tristan. Et pour manger. Dans cet ordre, ou l'inverse.",
      ko:"Pour personne. Je passais. On passe, dans ce quartier." },
  ],

  remy:[
    { qPF:"Vous avez regardé le match ?", qTH:"Tu as regardé le match ?",
      pf:"Il a répondu à la seconde. Trop vite pour quelqu'un qui cherche.",
      ok:"Jusqu'à la 87e. Après, j'ai éteint. Comme tout le monde.",
      ko:"Quel match ? Ah, ce match. Non. Enfin, un peu. La fin." },
    { qPF:"Vous avez parié combien ?", qTH:"Tu paries souvent ?",
      pf:"Il connaît tout le monde ici, et tout le monde connaît ses paris.",
      ok:"Douze euros. J'ai perdu. Ça arrive quatre fois par semaine.",
      ko:"Je ne parie plus. J'ai arrêté. Enfin, j'arrête. Depuis deux ans." },
    { qPF:"Vous connaissez qui, dans cette pièce ?", qTH:"Tu connais qui, ici ?",
      pf:"Il va tous les nommer. C'est un carrefour, ce type.",
      ok:"Tout le monde. C'est un problème quand on cherche un menteur, non ?",
      ko:"Personne, en fait. Je les croise. Ce n'est pas connaître." },
  ],

  marini:[
    { qPF:"On vous a invité ?", qTH:"Qui vous a fait entrer ?",
      pf:"Il porte son écharpe. Dans une cuisine.",
      ok:"On m'invite partout. C'est le principe d'un maire.",
      ko:"Bien sûr. Enfin, j'étais attendu. Enfin, j'étais dans l'immeuble." },
    { qPF:"Vous connaissez ces gens ?", qTH:"Vous les connaissez comment ?",
      pf:"Il serre des mains qu'on ne lui tend pas.",
      ok:"Ce sont mes administrés. Je les connais tous. Individuellement.",
      ko:"Ce sont des jeunes. Des jeunes très bien. Comment s'appellent-ils, déjà ?" },
    { qPF:"Vous avez vu la pizza arriver ?", qTH:"Vous étiez là à la livraison ?",
      pf:"Il parle de l'appartement comme d'un dossier municipal.",
      ok:"J'ai vu le livreur. Je lui ai serré la main. Il n'a pas compris.",
      ko:"Une pizza ? Il y avait une pizza ? On ne m'a rien proposé." },
  ],

  martin:[
    { qPF:"Vous avez noté les entrées ?", qTH:"Vous avez compté les allées et venues ?",
      pf:"Il tient un carnet qu'il ne montre à personne.",
      ok:"Vingt-deux entrées, dix-neuf sorties. Ça ne tombe jamais juste.",
      ko:"Je ne note rien. C'est un carnet personnel. Très personnel." },
    { qPF:"Vous faites la sécurité ici ?", qTH:"C'est vous, la sécurité ?",
      pf:"Personne ne le croit jamais. Il a l'habitude.",
      ok:"Oui, c'est moi la sécurité. Non, je ne vais pas grandir.",
      ko:"Je suis un ami. Un ami de quelqu'un. Ça ne vous regarde pas." },
    { qPF:"Quelle heure était-il ?", qTH:"Vous avez l'heure ?",
      pf:"Il annonce l'heure sans qu'on la lui demande. Toujours.",
      ok:"21 h 12 à la sonnerie. 21 h 47 quand ça a crié dans la cuisine.",
      ko:"Je n'ai pas de montre. Enfin, si. Mais elle retarde. Beaucoup." },
  ],

  francky:[
    { qPF:"Vous êtes monté pourquoi ?", qTH:"Qu'est-ce que vous montiez faire ?",
      pf:"Personne n'avait demandé de glaçons. Personne.",
      ok:"J'apportais des glaçons. On m'a remercié une fois sur deux.",
      ko:"Pour voir du monde. Un patron de bar, ça monte voir du monde." },
    { qPF:"Vous connaissez Mathilde ?", qTH:"Mathilde, vous la connaissez comment ?",
      pf:"Il la regarde chaque fois qu'elle parle. Chaque fois.",
      ok:"Je la sers depuis trois ans. C'est ma meilleure cliente. De loin.",
      ko:"Comme les autres. Exactement comme les autres. Pas plus." },
    { qPF:"Jojo était avec vous ?", qTH:"Vous êtes monté avec quelqu'un ?",
      pf:"Ils sont montés ensemble. Ils n'ont pas dit un mot dans l'escalier.",
      ok:"On est montés ensemble. Il n'a pas ouvert la bouche.",
      ko:"Jojo ? Il était en bas. Ou en haut. On ne se suit pas, nous deux." },
  ],

  jojo:[
    { qPF:"Vous connaissez Mathilde ?", qTH:"Mathilde, vous la connaissez comment ?",
      pf:"Personne ne dit non trois fois pour dire non une.",
      ok:"Je la sers. Ça ne veut pas dire que je l'apprécie.",
      ko:"Pas du tout. Enfin si, je la sers. Mais je ne la connais pas." },
    { qPF:"Vous avez rangé quelque chose ?", qTH:"Vous avez touché à quelque chose ?",
      pf:"Il a rangé quelque chose en nous voyant entrer. On l'a tous vu.",
      ok:"J'ai rangé un shaker. C'est le mien, je le reprends.",
      ko:"Je n'ai rien rangé. Je rangeais. Ce n'est pas la même chose." },
    { qPF:"Vous êtes resté dans quelle pièce ?", qTH:"Vous avez bougé dans l'appartement ?",
      pf:"Il change de pièce quand Mathilde parle. À chaque fois.",
      ok:"Je bouge quand elle parle. Ce n'est pas un crime, ça.",
      ko:"Je n'ai pas bougé. J'étais assis. Debout. Enfin, j'étais là." },
  ],

  gabi:[
    { qPF:"Tu étais où à {heure} ?", qTH:"Vous étiez où à {heure} ?",
      pf:"Chez moi. Comme tous les soirs. Passe dimanche.",
      ok:"Dans ma chambre. La porte du couloir grince, je l'aurais entendue.",
      ko:"Dans ma chambre. Enfin, pas tout le temps." },
    { qPF:"Tu as ouvert à quelqu'un ?", qTH:"Vous avez ouvert à quelqu'un ?",
      pf:"Tu me demandes ça à moi ? On en reparle à Noël.",
      ok:"Ma sœur est passée. Elle ne reste jamais longtemps.",
      ko:"J'ai ouvert, oui. Ce n'était pas le livreur." },
    { qPF:"Tu as mangé quoi ?", qTH:"Qu'avez-vous mangé ?",
      pf:"Tu diras à ta femme que j'ai appelé. Deux fois.",
      ok:"Rien. J'attendais que vous rentriez.",
      ko:"Un truc vite fait. Ne me regarde pas comme ça." },
  ],
  teo:[
    { qPF:"Tu as bougé de ce canapé ?", qTH:"Vous avez quitté cette pièce ?",
      pf:"Tu me connais. Assieds-toi plutôt.",
      ok:"Pas une fois. La manette peut en témoigner.",
      ko:"Deux minutes. Pour la cuisine. C'est tout." },
    { qPF:"Tu as entendu la porte ?", qTH:"Avez-vous entendu la porte ?",
      pf:"J'entends surtout que tu me soupçonnes.",
      ok:"Deux fois. Vers {heure}. La seconde plus discrète.",
      ko:"Non. J'avais le son fort." },
    { qPF:"Tu as touché au frigo ?", qTH:"Avez-vous ouvert le réfrigérateur ?",
      pf:"On ne va pas se fâcher pour un frigo.",
      ok:"Jamais. Je ne me sers pas chez les gens.",
      ko:"Ouvert, oui. Sans le toucher. C'est une manière de parler." },
  ],
  charles:[
    { qPF:"Vous êtes qui, exactement ?", qTH:"Vous êtes arrivé quand ?",
      pf:"Vous êtes de la famille, vous ? Ah. Alors rien.",
      ok:"Vers {heure}. La porte était déjà ouverte.",
      ko:"Je ne suis pas arrivé. Je veux dire : pas resté." },
    { qPF:"Vous connaissez qui, ici ?", qTH:"Vous êtes venu voir qui ?",
      pf:"Personne. Enfin, tout le monde. Enfin.",
      ok:"J'attendais quelqu'un. Elle n'est pas descendue.",
      ko:"Personne. Ne notez pas ça." },
    { qPF:"Vous avez dîné ?", qTH:"Vous avez mangé quelque chose ?",
      pf:"Vous posez des questions étranges.",
      ok:"Non. Je ne comptais pas rester.",
      ko:"J'ai rangé ce qui traînait. Ce n'est pas la même chose." },
  ],
  chat:[
    { qPF:"Risoto. Regarde-moi.", qTH:"Risoto ?",
      pf:"Il ronronne.", ok:"Il détourne la tête.", ko:"Il recule d'un pas." },
    { qPF:"Tu étais où ?", qTH:"Vous étiez où ?",
      pf:"Il se lèche la patte.", ok:"Il fixe la fenêtre.", ko:"Il a du rouge sur le poitrail." },
    { qPF:"Tu as faim ?", qTH:"Vous avez mangé ?",
      pf:"Il s'installe sur mes pieds.", ok:"Aucune déclaration.", ko:"Il se lèche la patte. Longuement." },
  ],
};

/* ---------- ce qu'on trouve quand on ne trouve rien ----------
   Deux lectures par meuble, jamais la même. Pierre-François décrit ce
   qu'il déduit, Thibaut ce qu'il ressent. Fouiller deux fois le même
   meuble avec l'autre inspecteur doit apprendre quelque chose, même
   quand il n'y a rien à trouver. */
const RIEN = {
  chaussures:{ pf:"Pointure {pointure}. Boueuses. Sorties récemment.", th:"Des chaussures. Rien dedans, heureusement." },
  manteaux:  { pf:"Trois manteaux, une seule poche vidée.", th:"Il fait froid dehors. Je dis ça." },
  sac:       { pf:"Un sac préparé à la hâte.", th:"Des clés, un chargeur, du désespoir." },
  biblio:    { pf:"Rangée par taille. Quelqu'un de méthodique vit ici.", th:"Beaucoup de livres. Aucun sur la pizza." },
  canape:    { pf:"Coussins déplacés. On s'est assis, puis relevé vite.", th:"Aucun suspect. Quelques chaussettes." },
  basse:     { pf:"Un cercle humide. Un verre a séjourné ici.", th:"Une télécommande. A servi à changer de chaîne." },
  tv:        { pf:"Éteinte, mais l'écran est tiède.", th:"Des câbles. Une enquête parallèle pourrait s'ouvrir." },
  frigo:     { pf:"Il manque une place au milieu de l'étagère.", th:"Beaucoup de choses. Pas la pizza." },
  four:      { pf:"Froid. Personne ne l'a allumé ce soir.", th:"Étonnamment, quelqu'un a pensé à regarder ici." },
  table:     { pf:"Quatre chaises, une seule écartée.", th:"Un verre vide. Enquête parallèle." },
  placards:  { pf:"Rangés par date de péremption. Ça se remarque.", th:"Des bocaux. Beaucoup de bocaux." },
  evier:     { pf:"Vaisselle faite. Ce soir, et vite.", th:"Propre. Suspect, dans cet appartement." },
  poubelle:  { pf:"Rien de gras. On n'a pas jeté de carton ici.", th:"Je regrette immédiatement cette décision." },
  commode:   { pf:"Un tiroir refermé de travers.", th:"Des tiroirs. Puis d'autres tiroirs." },
  portant:   { pf:"Un cintre vide au milieu. Quelqu'un s'est rhabillé.", th:"Aucun vêtement ne sent le chorizo." },
  lit:       { pf:"Couverture tirée d'un seul côté.", th:"Aucun suspect. Quelques chaussettes." },
};


/* ---------- les gens de l'appartement ----------
   Trois habitués, à des places fixes, et le chat. Ils ne sont pas
   interchangeables : chacun a un lien avec les deux inspecteurs, et ce
   lien change ce qu'on obtient de lui.

     GABI  colocataire. Sœur de celle qui lance des tartes,
                         et belle-sœur de Pierre-François. Elle ne dira
                         donc rien d'utile à Pierre-François.
     CHARLES             son amant. Personne n'est censé savoir qu'il
                         était là. C'est son seul mobile, et il vaut
                         toutes les pizzas du monde.
     TEOPEDO             ami de Pierre-François et d'Hortense. Prof
                         d'histoire. Un passé qu'il ne raconte pas, et
                         des gestes qui le racontent pour lui.
     RISOTO              le chat. Il ne dira rien, mais il laisse des
                         traces.

   Les répliques dépendent de QUI interroge : Pierre-François est de la
   famille et de la bande, on lui ménage la vérité ; Thibaut est un
   inconnu, on se surveille moins devant lui. C'est ce qui fait que les
   deux interrogatoires ne se valent pas. */
/* `bas` est la ligne sur laquelle le personnage POSE, relevée sur le
   décor : l'assise du canapé à 80 %, le plateau de la table à 73,5 %,
   le sol du couloir à 90 %, celui du salon à 92,5 %. Poser tout le monde
   sur la même ligne mettait Charles debout devant sa table et faisait
   flotter Teo au-dessus du canapé. */
/* ---------- les cinq places de l'appartement ----------
   Elles ne sont plus taillées pour une personne : n'importe qui peut
   occuper n'importe laquelle, à ceci près qu'une place ASSISE exige une
   pose assise. `bas` est la ligne du SOL, pas le meuble qui cache. */
const PLACES = [
  { id:"entree",  x:0.818, bas:0.900, taille:0.575, assise:false },
  { id:"cuisine", x:0.512, bas:0.905, taille:0.560, assise:false },
  { id:"chambre", x:0.930, bas:0.885, taille:0.520, assise:false },
  { id:"canape",  x:0.300, bas:0.860, taille:0.500, assise:true  },
  { id:"table",   x:0.632, bas:0.892, taille:0.505, assise:true  },
];
function spriteAssis(id){ return "assis_" + id; }
/* Se tenir DEBOUT demande une silhouette dans commun/ : les sprites du
   bar vivent dans n3, qui n'est pas garanti chargé au niveau 2. */
const DEBOUT_APPART = ["gabi", "marini", "martin", "mathilde", "francky", "jojo", "solene"];
/* Et s'ASSEOIR demande une pose assise. Solène n'en a pas : elle ne
   prendra que des places debout. */
const ASSIS_APPART = ["teo", "charles", "gabi", "marini", "martin",
                      "mathilde", "tristan", "francky", "jojo", "kevin", "remy"];
function spriteDebout(id){ return "pers_" + id; }

const PLACES_FIXES = {
  /* Les poses assises de la v6.21 sont des figures ENTIÈRES, pieds
     compris, dans une toile plus haute : la taille et la ligne du bas
     ont dû être reprises. L'ancien sprite était recadré au bassin. */
  /* Les personnages assis paraissaient petits, et Charles se retrouvait
     ASSIS SUR la table au lieu d'être attablé : sa ligne du bas était
     calée sur le plateau et non sur le sol. Les deux descendent au sol,
     et leur taille monte d'un cran. */
  teo:     { x:0.300, bas:0.860, taille:0.500 },  /* assis sur le canapé  */
  charles: { x:0.632, bas:0.892, taille:0.505 },  /* attablé, pieds au sol */
  gabi:   { x:0.818, bas:0.900, taille:0.575 },  /* debout dans le couloir */
  chat:    { x:0.452, bas:0.925, taille:0.170 },  /* par terre            */
};

/* ---------- qui connaît qui ----------
   La carte des liens du quartier, telle qu'elle est écrite dans
   PERSONNAGES.md. Elle sert à deux choses : conseiller l'inspecteur qui
   fera parler quelqu'un, et fabriquer les recoupements des affaires.
   `pf` et `th` valent true quand l'inspecteur a une prise sur la
   personne — amitié, parenté, ou simple connaissance. */
const LIENS = {
  teo:      { pf:true,  th:false, amis:["gabi", "hortense", "remy"] },
  gabi:     { pf:true,  th:false, amis:["solene", "teo", "charles"] },
  charles:  { pf:true,  th:false, amis:["gabi"] },
  mathilde: { pf:false, th:true,  amis:["solene", "remy", "kevin", "tristan"] },
  tristan:  { pf:true,  th:true,  amis:["solene", "kevin", "remy", "mathilde"] },
  solene:   { pf:false, th:false, amis:["tristan", "mathilde", "kevin", "gabi"] },
  kevin:    { pf:true,  th:true,  amis:["tristan", "mathilde", "solene", "remy"] },
  remy:     { pf:true,  th:true,  amis:["mathilde", "tristan", "kevin", "teo"] },
  marini:   { pf:false, th:false, amis:[] },
  martin:   { pf:false, th:false, amis:[] },
  francky:  { pf:false, th:false, amis:["mathilde"] },
  jojo:     { pf:false, th:false, amis:[], fache:["mathilde"] },
  chat:     { pf:false, th:false, amis:["gabi", "solene"] },
};

/* L'inspecteur qui a une prise : 0 pour PF, 1 pour Thibaut, -1 si
   personne — et -1 aussi quand les deux l'ont, parce qu'un conseil qui
   désigne tout le monde ne conseille rien. */
function conseilInspecteur(id){
  const l = LIENS[id];
  if (!l || (l.pf && l.th)) return -1;
  if (l.pf) return 0;
  if (l.th) return 1;
  return -1;
}

const SUSPECTS_BANQUE = [
  { id:"mathilde", nom:"MATHILDE", sprite:"assis_mathilde",
    role:"Petite amie de Thibaut. Professeure d'histoire.",
    fond:[
      "Elle reconstitue la soirée à voix haute, comme une bataille.",
      "Elle regarde l'heure sans regarder sa montre.",
      "Elle a rangé trois choses depuis qu'on est entrés.",
    ] },

  { id:"tristan", nom:"TRISTAN", sprite:"assis_tristan",
    role:"Ami de Thibaut. Boxe, court, sort.",
    fond:[
      "Il n'a pas cessé de bouger depuis notre arrivée.",
      "Il propose de refaire le trajet du livreur. En courant.",
      "Il répond avant qu'on ait fini la question.",
    ] },

  { id:"kevin", nom:"KEVIN", sprite:"assis_kevin",
    role:"Ami de Thibaut. Professeur de mathématiques.",
    fond:[
      "Il est en survêtement. Il est toujours en survêtement.",
      "Il compte les gens dans la pièce. Deux fois.",
      "Il dit qu'il a faim depuis 20 h 15. Il donne l'heure exacte.",
    ] },

  { id:"remy", nom:"RÉMY", sprite:"assis_remy",
    role:"Ami de Thibaut. Il connaît Pierre-François. Il parie.",
    fond:[
      "Il regarde son téléphone toutes les vingt secondes.",
      "Il connaît tout le monde ici. Vraiment tout le monde.",
      "Il a proposé un pari sur l'issue de l'enquête.",
    ] },

  { id:"marini", nom:"LE MAIRE", sprite:"assis_marini",
    role:"Maire de Compiègne. Personne ne l'a invité.",
    fond:[
      "Il porte son écharpe. Dans une cuisine.",
      "Il serre des mains qu'on ne lui tend pas.",
      "Il parle de l'appartement comme d'un dossier municipal.",
    ] },

  { id:"martin", nom:"MARTIN", sprite:"assis_martin",
    role:"Agent de sécurité. Il note tout.",
    fond:[
      "Il a compté les entrées et les sorties. Ça ne tombe pas juste.",
      "Il tient un carnet qu'il ne montre à personne.",
      "Il annonce l'heure sans qu'on la lui demande.",
    ] },

  { id:"francky", nom:"FRANCKY", sprite:"assis_francky",
    role:"Patron du D'Tour. Il adore Mathilde.",
    fond:[
      "Il est monté avec des glaçons. Personne n'a demandé de glaçons.",
      "Il regarde Mathilde chaque fois qu'elle parle.",
      "Il dit du mal de Jojo à voix basse. Puis à voix haute.",
    ] },

  { id:"jojo", nom:"JOJO", sprite:"assis_jojo",
    role:"Patron du D'Tour. Il ne supporte pas Mathilde.",
    fond:[
      "Il est monté avec Francky. Il n'a pas dit un mot dans l'escalier.",
      "Il change de pièce quand Mathilde parle.",
      "Il a rangé quelque chose en nous voyant entrer.",
    ] },

  { id:"solene", nom:"SOLÈNE", sprite:"pers_solene",
    role:"Amie de Mathilde. Elle nourrit le chat.",
    fond:[
      "Elle appelle le chat par un autre nom que Gabi.",
      "Elle sait où sont les croquettes. Pas où sont les assiettes.",
      "Elle rit à des choses qui ne sont pas drôles. Ou si.",
    ] },

  { id:"teo", nom:"TEOPEDO", sprite:"assis_teo",
    role:"Ami de Pierre-François. Professeur d'histoire.",
    fond:[
      "Il récite la chronologie exacte de la soirée. À la minute.",
      "Il connaît le nom du livreur. Et celui d'avant.",
      "Il dit qu'un lieu se lit par couches. Comme une fouille.",
    ] },

  { id:"charles", nom:"CHARLES", sprite:"assis_charles",
    role:"Personne ne sait pourquoi il est là.",
    fond:[
      "Il garde ses lunettes noires à l'intérieur.",
      "Il regarde la porte du couloir toutes les dix secondes.",
      "Il connaît l'appartement mieux qu'un visiteur.",
    ] },

  { id:"gabi", nom:"GABI", sprite:"pers_gabi",
    role:"Colocataire. Belle-sœur de Pierre-François.",
    fond:[
      "Elle a un rouleau de papier toilette dans la poche. Sans explication.",
      "Elle jette un œil au couloir chaque fois qu'on parle de la chambre.",
      "Elle dit « ma sœur » comme on dit « ce n'est pas moi ».",
    ] },

  { id:"chat", nom:"RISOTO", sprite:"susp_chat",
    role:"Le chat. Il était là avant tout le monde.",
    fond:[
      "Il se frotte contre la jambe. Ce n'est pas un aveu.",
      "Il fixe le meuble du bas. Depuis un moment.",
      "Il ronronne. C'est tout ce qu'on obtiendra.",
    ] },
];

/* Les quatre sont toujours là : ce sont les habitants, pas une
   distribution. Ce qui change, c'est ce qu'ils racontent. */
const SUSPECTS = [];

function composerSuspects(){
  SUSPECTS.length = 0;
  const parId = id => SUSPECTS_BANQUE.find(b => b.id === id);
  const sc = Affaire.scenario || {};

  /* 1. Le noyau : le coupable de l'affaire et son témoin clé. Sans eux
        l'affaire ne peut pas se résoudre — c'est cette règle qui permet
        de tirer le reste au sort sans réécrire un seul scénario. */
  const noyau = [];
  for (const id of [Affaire.bonneReponse(), sc.temoinCle].concat(sc.requis || [])){
    if (id && id !== "personne" && id !== "chat" && parId(id) && noyau.indexOf(id) < 0) noyau.push(id);
  }

  /* 2. On complète jusqu'à cinq, en préférant les PROCHES du noyau :
        une pièce doit ressembler à un groupe, pas à un tirage. */
  const eviter = sc.eviter || [];
  const reste = SUSPECTS_BANQUE.map(b => b.id)
    .filter(id => id !== "chat" && noyau.indexOf(id) < 0 && eviter.indexOf(id) < 0);
  melangerTableau(reste);
  const proche = id => noyau.some(n => LIENS[n] && LIENS[n].amis.indexOf(id) >= 0);
  reste.sort((a, b) => (proche(b) ? 1 : 0) - (proche(a) ? 1 : 0));
  const choisis = noyau.concat(reste).slice(0, PLACES.length);

  /* 3. Les places. On sert D'ABORD ceux qui ne peuvent pas rester
        debout, sinon ils se retrouvent sans place utilisable. */
  const places = PLACES.slice();
  melangerTableau(places);
  const assises = places.filter(p => p.assise);
  const debouts = places.filter(p => !p.assise);
  const paires = [];
  const prendre = (id, liste, secours, assis) => {
    const pl = liste.shift() || secours.shift();
    if (pl) paires.push([id, pl, !!pl.assise]);
  };
  for (const id of choisis) if (DEBOUT_APPART.indexOf(id) < 0) prendre(id, assises, debouts);
  for (const id of choisis) if (DEBOUT_APPART.indexOf(id) >= 0){
    /* qui ne sait pas s'asseoir ne prend qu'une place debout */
    prendre(id, debouts, ASSIS_APPART.indexOf(id) >= 0 ? assises : []);
  }
  paires.push(["chat", PLACES_FIXES.chat, false]);

  for (const [id, pl, assis] of paires){
    const b = parId(id);
    if (!b) continue;
    const coupable = Affaire.bonneReponse() === id;
    const sujets = (SUJETS[id] || []).slice();
    melangerTableau(sujets);
    const an = sc.anecdote;
    if (an && an.suspect === id) sujets.unshift(an);
    SUSPECTS.push({
      id, nom:b.nom, role:b.role,
      sprite:id === "chat" ? b.sprite : (assis ? spriteAssis(id) : spriteDebout(id)),
      x:pl.x, bas:pl.bas, taille:pl.taille,
      sujets, coupable,
      fond:piocher(b.fond),
      tour:0, vus:0, vusPF:0, coince:false,
    });
  }
  return SUSPECTS;
}

/* ---------- CaseGenerator -> Affaire ----------
   Dix affaires écrites, tirées au sort au début de la partie et figées
   jusqu'à la fin. Chacune fixe son coupable, ses cachettes possibles,
   les indices qui la portent, et ses quatre répliques. Le tirage part
   de la SOLUTION puis distribue ses indices : une enquête impossible ne
   peut donc pas sortir. */
const SCENARIOS = [
  /* --- la sœur --- */
  { id:"pour_hortense", tags:["porte"], coupable:"gabi", cachettes:["frigo", "placards"],
    porteurs:["ticket", "assiette", "serviette"],
    deduc:{
      ticket:[[1, "Une pizza chorizo, livrée à {heure}. La préférée d'Hortense, non ?"],
              [0, "La préférée d'Hortense. Note ça."]],
      assiette:[[0, "Assiette utilisée, mais pas une trace de gras de pizza."],
              [1, "Donc la pizza n'a pas été mangée. Elle a été déplacée."]],
      serviette:[[0, "Serviette pliée, pas jetée. On a essuyé quelque chose de propre."],
              [1, "On n'essuie pas ses mains. On essuie un plat qu'on range."]],
    },
    hypothese:[[1, "Je dis : le livreur. Il livre, il reprend, il revend."],
               [0, "Le livreur ne revend rien. Mais quelqu'un a manipulé cette pizza sans la manger."]],
    nerfs:["Vous comptez fouiller le frigo aussi ? Il y a un ordre, dans une maison.",
           "Si vous la trouvez, ne la touchez pas. Elle... elle est à quelqu'un."],
    piste:[[0, "Elle n'a pas été volée. Elle a été mise de côté."],
           [1, "Mise de côté pour qui ?"]],
    trouvaille:[[0, "{Ou}. Emballée. Étiquetée, presque."],
                [1, "On range une pizza comme ça pour quelqu'un qu'on aime."]],
    contradiction:"Vous l'avez rangée pour votre sœur. Elle repasse ce soir.",
    chute:"Elle la gardait pour Hortense. Personne n'a rien volé, et personne n'a rien dit." ,
    anecdote:{ suspect:"gabi", qTH:"Pourquoi au frigo, et pas sur le plan ?", qPF:"Pourquoi au frigo, et pas sur le plan ?", ok:"Parce qu'au frigo, ça se garde.", ko:"Elle se garde pour qui ?", pf:"Tu poses des questions de flic." }
  },

  { id:"la_porte", tags:["porte", "chat"], coupable:"gabi", cachettes:["commode", "portant"],
    porteurs:["ticket", "boite", "pattes"],
    deduc:{
      ticket:[[0, "Livrée à {heure}. La porte a sonné une fois."],
              [1, "Teo dit deux. La seconde, plus discrète."]],
      boite:[[0, "La boîte a voyagé. Ouverte ici, refermée ailleurs."],
              [1, "On ne promène pas une boîte. On la fait disparaître."]],
      pattes:[[0, "Des empreintes, de la porte au couloir."],
              [1, "Le chat a suivi quelqu'un. Les chats ne suivent que la nourriture."]],
    },
    hypothese:[[1, "C'est le chat. Il a ouvert la porte, mangé la pizza et refermé."],
               [0, "Les chats ne referment pas. Quelqu'un d'autre est entré ce soir."]],
    nerfs:["Vous vérifiez toutes les portes comme ça ?",
           "D'accord, quelqu'un est venu. Mais ce n'est pas ce que vous croyez."],
    piste:[[0, "Quelqu'un est entré sans sonner."],
           [1, "Donc quelqu'un lui a ouvert."]],
    trouvaille:[[0, "{Ou}. Sous du linge propre."],
                [1, "Il a fallu vouloir la cacher."]],
    contradiction:"Vous avez ouvert à quelqu'un. Ce n'était pas le livreur.",
    chute:"Elle a ouvert la porte à quelqu'un qui n'aurait pas dû venir. La pizza a payé le silence." ,
    anecdote:{ suspect:"gabi", qTH:"Qui avez-vous laissé entrer ?", qPF:"Qui avez-vous laissé entrer ?", ok:"Quelqu'un qui n'aurait pas dû monter.", ko:"Et vous n'avez rien dit.", pf:"Ne me fais pas dire ça." }
  },

  { id:"la_dette", tags:["argent", "salon"], coupable:"gabi", cachettes:["poubelle", "evier"],
    porteurs:["billet", "miettes", "boite"],
    deduc:{
      billet:[[0, "Cinq euros. Posé bien à plat, en évidence."],
              [1, "Ce n'est pas un oubli. C'est un paiement."]],
      miettes:[[0, "Des miettes en ligne droite. On a mangé en marchant."],
              [1, "Chez soi, on mange en marchant. Un invité s'assoit."]],
      boite:[[0, "Pliée, rangée. On a fait le tri après."],
              [1, "Un voleur ne trie pas ses déchets."]],
    },
    hypothese:[[1, "Un cambrioleur honnête. Il vole, il paie, il recycle."],
               [0, "Ce n'est pas un cambrioleur. C'est quelqu'un d'ici qui s'excuse."]],
    nerfs:["Cinq euros, c'est le prix d'une pizza, non ? Je demande.",
           "Bon. Le billet est à moi. Mais ce n'est pas un vol si on paie."],
    piste:[[0, "Des miettes, et cinq euros posés à côté."],
           [1, "Personne ne paie pour un vol."]],
    trouvaille:[[0, "{Ou}. La boîte, vide, pliée, rangée."],
                [1, "Elle a même fait le tri."]],
    contradiction:"Vous avez laissé cinq euros. On ne rembourse que ce qu'on a pris.",
    chute:"Nous étions sortis. Elle a tout mangé, laissé des miettes et un billet de cinq euros pour qu'on en rachète une. C'est presque de la politesse." ,
    anecdote:{ suspect:"gabi", qTH:"Ces cinq euros, ils sortent d'où ?", qPF:"Ces cinq euros, ils sortent d'où ?", ok:"De mon porte-monnaie. D'où veux-tu qu'ils sortent.", ko:"On ne rembourse que ce qu'on a pris.", pf:"Tu comptes vraiment l'argent, maintenant ?" }
  },

  /* --- Charles --- */
  { id:"amant", tags:["porte"], coupable:"charles", cachettes:["manteaux", "sac"],
    porteurs:["ticket", "serviette", "fromage"],
    deduc:{
      ticket:[[0, "Livrée à {heure}. Personne n'admet l'avoir réceptionnée."],
              [1, "Quelqu'un l'a bien prise. Quelqu'un qui n'était pas censé être là."]],
      serviette:[[0, "On s'est essuyé vite. Debout."],
              [1, "On mange debout quand on guette la porte."]],
      fromage:[[0, "Refroidi en {froid}. Elle a été mangée tout de suite."],
              [1, "Tout de suite, et en silence. Personne n'a entendu de dîner."]],
    },
    hypothese:[[1, "Quelqu'un avait très faim et très peur. Un jogger ?"],
               [0, "Un jogger ne monte pas au {etage}. Quelqu'un connaissait l'appartement."]],
    nerfs:["Je peux partir ? J'ai... un rendez-vous.",
           "Je n'étais pas là. Enfin, pas longtemps. Enfin, pas officiellement."],
    piste:[[0, "Il a mangé vite. Debout. Sans s'asseoir."],
           [1, "Quelqu'un qui ne voulait pas être vu."]],
    trouvaille:[[0, "{Ou}. Encore chaude."],
                [1, "Et ce n'est pas le sien."]],
    contradiction:"Vous n'étiez pas là. Alors pourquoi votre manteau sent le chorizo ?",
    chute:"Il n'était pas censé être là. Il a pris la pizza pour effacer sa visite. Il a effacé l'inverse." ,
    anecdote:{ suspect:"charles", qTH:"Ce manteau est à vous ?", qPF:"Ce manteau est à vous ?", ok:"Il traînait. J'avais froid.", ko:"Il sent le chorizo.", pf:"Il traînait, je vous dis." }
  },

  { id:"effacer", tags:["salon"], coupable:"charles", cachettes:["poubelle"],
    porteurs:["boite", "sauce", "assiette"],
    deduc:{
      boite:[[0, "Ouverte ici, pas à la cuisine."],
              [1, "Et pourtant tout le reste est impeccable. Trop."]],
      sauce:[[0, "Sauce tomate, encore tiède. La seule trace qu'on ait ratée."],
              [1, "Quand on efface tout sauf une tache, c'est qu'on était pressé."]],
      assiette:[[0, "Deux assiettes lavées, une seule utilisée."],
              [1, "On ne lave pas l'assiette d'un fantôme. Sauf si le fantôme dînait."]],
    },
    hypothese:[[1, "L'appartement s'est nettoyé tout seul. Ça existe, les femmes de ménage de nuit ?"],
               [0, "Personne ne nettoie ce qu'il n'a pas sali. Le ménage EST l'indice."]],
    nerfs:["Vous trouvez ça propre ? Moi je trouve ça normal.",
           "J'ai peut-être rangé deux ou trois choses. C'est un tort d'être ordonné ?"],
    piste:[[0, "Deux assiettes lavées. Une seule utilisée."],
           [1, "Quelqu'un a fait le ménage de sa propre présence."]],
    trouvaille:[[0, "{Ou}. Entière, sous le sac-poubelle."],
                [1, "On ne jette pas une pizza. On jette une preuve."]],
    contradiction:"Vous avez lavé deux assiettes. Vous dîniez seul ?",
    chute:"Il a tout nettoyé pour qu'on ne sache pas qu'il était venu. Y compris le dîner." ,
    anecdote:{ suspect:"charles", qTH:"Pourquoi deux assiettes lavées ?", qPF:"Pourquoi deux assiettes lavées ?", ok:"J'aime que ce soit propre.", ko:"Vous dîniez donc à deux.", pf:"C'est un crime, être ordonné ?" }
  },

  { id:"le_couloir", tags:["salon"], coupable:"charles", cachettes:["lit", "commode"],
    porteurs:["ticket", "miettes", "part"],
    deduc:{
      ticket:[[0, "Livrée à {heure}. Et aussitôt disparue du salon."],
              [1, "Une pizza ne traverse pas un appartement toute seule."]],
      miettes:[[0, "Des miettes jusqu'au couloir."],
              [1, "Elles vont vers la chambre. Personne ne mange une pizza dans une chambre."]],
      part:[[0, "Entamée, puis reposée. En plein milieu."],
              [1, "On ne repose pas une part. Sauf si on frappe à la porte."]],
    },
    hypothese:[[1, "Un somnambule. Il mange, il marche, il ignore tout."],
               [0, "Un somnambule ne s'interrompt pas. Quelqu'un a été dérangé, et il était réveillé."]],
    nerfs:["Ce couloir... il mène où, déjà ? Je demande pour un ami.",
           "On a frappé, d'accord ? On a frappé et j'ai paniqué."],
    piste:[[0, "Des miettes jusqu'au couloir."],
           [1, "Personne ne mange une pizza dans une chambre."]],
    trouvaille:[[0, "{Ou}. Avec une part entamée."],
                [1, "Il a été dérangé au milieu."]],
    contradiction:"Vous surveillez ce couloir depuis vingt minutes. Pourquoi ?",
    chute:"Il s'était réfugié dans la chambre avec la pizza. Quelqu'un a frappé. Il a tout laissé là." ,
    anecdote:{ suspect:"charles", qTH:"Qu'alliez-vous faire dans le couloir ?", qPF:"Qu'alliez-vous faire dans le couloir ?", ok:"Rien. Je cherchais la salle de bain.", ko:"Elle est de l'autre côté.", pf:"Elle est de ce côté, non ?" }
  },

  /* --- TeoPedo --- */
  { id:"vieux_reflexe", tags:["porte"], coupable:"teo", cachettes:["frigo", "four"],
    porteurs:["ticket", "fromage", "serviette"],
    deduc:{
      ticket:[[0, "Livrée à {heure}, rangée aussitôt. Quelqu'un savait où."],
              [1, "Quelqu'un qui connaît la maison. Ou qui l'a étudiée."]],
      fromage:[[0, "Refroidi en {froid}. Mangée bien après la livraison."],
              [1, "On a attendu. Un amateur n'attend pas."]],
      serviette:[[0, "Pas une trace de doigt nulle part. Même pas sur la poignée."],
              [1, "S'essuyer avant de toucher. Qui fait ça ?"]],
    },
    hypothese:[[1, "Personne n'a rien touché, donc personne n'est venu, donc la pizza s'est enfuie."],
               [0, "Pas de traces, ce n'est pas personne. C'est quelqu'un de très entraîné."]],
    nerfs:["Vous relevez les empreintes ? Vous n'en trouverez pas. Enfin, je suppose.",
           "Il y a des choses que je faisais avant d'enseigner. L'histoire retient ce qu'elle veut."],
    piste:[[0, "Aucune trace sur la poignée. Aucune."],
           [1, "Ça s'apprend, ça ?"]],
    trouvaille:[[0, "{Ou}. Refermé proprement. Trop proprement."],
                [1, "Un amateur laisse la porte ouverte."]],
    contradiction:"Vous avez ouvert le frigo sans le toucher. Où apprend-on ça ?",
    chute:"Il a ouvert, pris, refermé, sans une marque. Un vieux réflexe, dit-il. Il n'a pas dit de quand." ,
    anecdote:{ suspect:"teo", qTH:"Où avez-vous appris à ouvrir sans laisser de trace ?", qPF:"Où avez-vous appris à ouvrir sans laisser de trace ?", ok:"On apprend des choses, dans une vie.", ko:"Quelle vie, exactement ?", pf:"Tu ne veux pas savoir. Vraiment." }
  },

  { id:"le_prof", tags:["salon"], coupable:"teo", cachettes:["biblio", "tv"],
    porteurs:["ticket", "boite", "miettes"],
    deduc:{
      ticket:[[0, "{heure}. Teo nous l'a dit avant qu'on trouve le ticket."],
              [1, "Il connaissait l'heure avant nous. C'est ennuyeux."]],
      boite:[[0, "Rangée à plat, méthodiquement. Un geste de collectionneur."],
              [1, "Ou de professeur. Quelqu'un qui archive."]],
      miettes:[[0, "Semées vers la droite. Vers le canapé."],
              [1, "Le canapé où quelqu'un jure n'avoir pas bougé."]],
    },
    hypothese:[[1, "La pizza s'est archivée elle-même. Classement vertical."],
               [0, "Quelqu'un de méthodique l'a traitée comme un document. Ça réduit la liste."]],
    nerfs:["Vous datez les miettes, maintenant ? C'est... c'est de la bonne méthode.",
           "La chronologie exacte ? Je peux vous la donner. Trop exactement, oui, je sais."],
    piste:[[0, "Il connaît l'heure de la livraison à la minute."],
           [1, "Il connaît beaucoup de choses à la minute."]],
    trouvaille:[[0, "{Ou}. Rangée par taille."],
                [1, "Même en cachant, il classe."]],
    contradiction:"Vous savez tout de cette soirée. Sauf où vous étiez à {heure}.",
    chute:"Le prof d'histoire a daté la scène mieux que nous. Il en avait besoin : il en faisait partie." ,
    anecdote:{ suspect:"teo", qTH:"Comment connaissez-vous l'heure à la minute ?", qPF:"Comment connaissez-vous l'heure à la minute ?", ok:"Je date les choses. C'est mon métier.", ko:"On date ce qu'on a vécu.", pf:"Tu m'as déjà entendu dater une soirée ?" }
  },

  /* --- Risoto, et les chaînes --- */
  { id:"le_chat_seul", tags:["chat", "salon"], coupable:"chat", cachettes:["canape", "lit"],
    porteurs:["pattes", "boite", "chorizo"],
    deduc:{
      pattes:[[0, "Quatre coussinets. Un félin, seul."],
              [1, "Il nous regarde depuis tout à l'heure. Sans ciller."]],
      boite:[[0, "Tombée du plan de travail, puis poussée. Deux chutes."],
              [1, "On ne pousse pas une boîte avec des mains. On la porte."]],
      chorizo:[[0, "Une rondelle, léchée sur une seule face."],
              [1, "Léchée ? Les gens ne lèchent pas le chorizo. Enfin, pas en public."]],
    },
    hypothese:[[1, "Charles. Il a des lunettes noires, il est louche, c'est lui."],
               [0, "Les lunettes ne mangent pas de pizza. Les traces sont plus basses. Beaucoup plus basses."]],
    nerfs:["Il s'étire. Longuement. Comme quelqu'un qui gagne du temps.",
           "Il a du rouge sur le poitrail et il ne se lave plus. Il a abandonné."],
    piste:[[0, "Ce n'est pas une main qui a fait ça."],
           [1, "Ne me dis pas que c'est le chat."]],
    trouvaille:[[0, "{Ou}. Poussée jusque là. Regarde les traces."],
                [1, "Risoto. On doit parler."]],
    contradiction:"Vous n'avez pas de mains. C'est embêtant pour la boîte.",
    chute:"Il a poussé la boîte du plan de travail au sol, puis du sol au dessous. Le reste s'est fait tout seul." ,
    anecdote:{ suspect:"chat", qTH:"Risoto, cette boîte, c'était vous ?", qPF:"Risoto, cette boîte, c'était vous ?", ok:"Il fixe le meuble du bas.", ko:"Il ne dira rien de plus.", pf:"Il ronronne, ce qui n'est pas une réponse." }
  },

  { id:"la_chaine", tags:["chat", "salon"], coupable:"charles", cachettes:["sac", "poubelle"],
    porteurs:["pattes", "sauce", "boite"],
    deduc:{
      pattes:[[0, "Des empreintes autour du point de chute."],
              [1, "Le chat a fait tomber quelque chose. Ça, c'est sûr."]],
      sauce:[[0, "Une éclaboussure au sol. Nettoyée à moitié."],
              [1, "Le chat ne nettoie pas. Quelqu'un est passé derrière lui."]],
      boite:[[0, "Ramassée, puis cachée. Deux gestes, deux intentions."],
              [1, "On ramasse par réflexe. On cache par peur."]],
    },
    hypothese:[[1, "Le chat a un complice. Un gang. Le milieu féin... félin."],
               [0, "Pas un gang. Un témoin. Quelqu'un a vu la chute et n'a rien dit."]],
    nerfs:["Le chat, là. Il me fixe. Dites-lui d'arrêter.",
           "J'ai ramassé, c'est tout ! Être là, c'était déjà trop."],
    piste:[[0, "Le chat a renversé. Quelqu'un a ramassé."],
           [1, "Et n'a rien dit. C'est ça qui compte."]],
    trouvaille:[[0, "{Ou}. Emballée à la hâte."],
                [1, "Ramasser, ce n'est pas voler. Cacher, si."]],
    contradiction:"Vous avez ramassé après le chat. Pourquoi ne pas le dire ?",
    chute:"Risoto a fait tomber la boîte. Charles a ramassé — et caché, parce qu'être là suffisait à le condamner." ,
    anecdote:{ suspect:"charles", qTH:"Vous avez ramassé après le chat ?", qPF:"Vous avez ramassé après le chat ?", ok:"Quelqu'un devait le faire.", ko:"Ramasser, non. Cacher, oui.", pf:"Ce n'est pas un aveu." }
  },

  /* --- les invraisemblables --- */
  { id:"la_reconstitution", tags:["salon"], coupable:"teo", cachettes:["biblio", "tv", "commode"],
    porteurs:["ticket", "miettes", "assiette"],
    deduc:{
      ticket:[[0, "Le ticket a été défroissé. Repassé, presque."],
              [1, "Quelqu'un l'a relu. Plusieurs fois."]],
      miettes:[[0, "Deux couches de miettes. Deux repas au même endroit."],
              [1, "On a mangé cette pizza deux fois ? Ce n'est pas possible. Si ?"]],
      assiette:[[0, "Utilisée, replacée exactement sur sa marque."],
              [1, "Exactement. Qui replace une assiette exactement ?"]],
    },
    hypothese:[[1, "Deux pizzas. Des jumelles. Séparées à la naissance."],
               [0, "Une seule pizza, mangée deux fois. Quelqu'un a rejoué la scène."]],
    nerfs:["La disposition vous paraît correcte ? On a fait au mieux.",
           "Reconstituer, ce n'est pas voler. C'est de la méthode. J'ai peut-être remangé un peu."],
    piste:[[0, "Tout est disposé exactement comme au moment des faits."],
           [1, "Trop exactement."]],
    trouvaille:[[0, "{Ou}. Ce qu'il en reste est rangé par ordre de taille."],
                [1, "Il a refait la scène. En entier."]],
    contradiction:"Pour reconstituer un repas, il faut le refaire. Vous l'avez refait.",
    chute:"Il voulait comprendre comment ça s'était passé. Il a reconstitué la soirée, méthodiquement, et il a mangé la pizza deux fois pour être sûr.",
    anecdote:{ suspect:"teo", qTH:"Vous avez reconstitué la soirée ?", qPF:"Tu as encore tout reconstitué ?",
      ok:"Mentalement. C'est un exercice.", ko:"On ne reconstitue bien qu'en refaisant les gestes.",
      pf:"Tu sais que ça m'inquiète, quand tu fais ça." } },

  { id:"le_pari", tags:["chat", "salon"], coupable:"charles", cachettes:["basse", "sac"],
    porteurs:["chorizo", "serviette", "part"],
    deduc:{
      chorizo:[[0, "Des rondelles éjectées. On a mangé à toute vitesse."],
              [1, "On ne perd pas de chorizo en mangeant. Sauf en compétition."]],
      serviette:[[0, "Trempée. On a transpiré."],
              [1, "Transpirer en mangeant. Il y avait un enjeu."]],
      part:[[0, "La dernière part, abandonnée à deux bouchées de la fin."],
              [1, "Si près du but. Le temps a manqué."]],
    },
    hypothese:[[1, "Un concours de vitesse. Contre qui ? Le frigo ?"],
               [0, "Contre quelqu'un qui n'a pas mangé sa moitié. Regarde qui n'a pas faim."]],
    nerfs:["Quatre minutes, c'est jouable, non ? Pour une pizza entière. Je demande.",
           "Le chat n'a jamais dit oui. Mais il n'a pas dit non. Un pari est un pari."],
    piste:[[0, "Il a mangé vite. Très vite."],
           [1, "Trop vite pour quelqu'un qui avait faim."]],
    trouvaille:[[0, "{Ou}. Ce qu'il en reste tient dans une main."],
                [1, "Quatre minutes. Il a dû s'entraîner."]],
    contradiction:"On ne mange pas une pizza en quatre minutes sans raison.",
    chute:"Il a parié avec le chat qu'il la finirait en moins de quatre minutes. Le chat n'a pas relevé. Il a mangé quand même.",
    anecdote:{ suspect:"charles", qTH:"Vous avez parié quelque chose, ce soir ?", qPF:"Vous pariez souvent ?",
      ok:"Jamais. Je n'ai personne avec qui parier.", ko:"Avec le chat. Il ne compte pas.",
      pf:"Je ne vois pas le rapport avec la pizza." } },

  { id:"le_congelateur", temoinCle:"teo", tags:["porte"], coupable:null, cachettes:["frigo"],
    porteurs:["ticket", "fromage", "boite"],
    deduc:{
      ticket:[[0, "Livrée à {heure}, chaude. Et introuvable dix minutes plus tard."],
              [1, "Dix minutes. Personne ne mange en dix minutes. Enfin, presque personne."]],
      fromage:[[0, "Ce fromage a gelé, puis dégelé. Les cristaux le disent."],
              [1, "Gelé ? Dans un salon ?"]],
      boite:[[0, "Le carton a pris le froid. Il est rigide."],
              [1, "Une pizza qui a eu froid. L'affaire prend un tour météorologique."]],
    },
    hypothese:[[1, "Elle a été enlevée par un courant d'air très organisé."],
               [0, "Elle n'a pas quitté l'appartement. Elle a juste changé de température."]],
    nerfs:["Le congélateur conserve, c'est un fait scientifique. Je dis ça en passant.",
           "Bon. J'ai peut-être conseillé le froid. Conseiller n'est pas voler."],
    piste:[[0, "Elle est passée du chaud au froid en dix minutes."],
           [1, "Personne ne fait ça par accident."]],
    trouvaille:[[0, "{Ou}. Dure comme un carreau."],
                [1, "Quelqu'un a voulu la garder au chaud. En la congelant."]],
    contradiction:"On ne garde pas une pizza au chaud dans un congélateur.",
    chute:"Quelqu'un a voulu bien faire. Personne ne l'a volée : elle a été mise à congeler pour rester bonne, ce qui reste discutable.",
    anecdote:{ suspect:"teo", qTH:"Qui range les restes, ici ?", qPF:"C'est toi qui ranges les restes ?",
      ok:"Personne. C'est bien le problème de cet appartement.", ko:"Moi. Et je range bien.",
      pf:"Tu ranges toujours des choses au mauvais endroit." } },

  { id:"le_regime", tags:["argent", "salon"], coupable:"gabi", cachettes:["portant", "lit", "commode"],
    porteurs:["billet", "serviette", "chorizo"],
    deduc:{
      billet:[[0, "Cinq euros dans un pot de farine. On paie sa conscience."],
              [1, "On se rembourse soi-même ? C'est de la comptabilité intime."]],
      serviette:[[0, "Nouée. On a fermé quelque chose avec."],
              [1, "On emballe une pizza pour ne plus la voir. Ça n'a pas suffi."]],
      chorizo:[[0, "Une rondelle isolée, à mi-chemin de la cachette."],
              [1, "Le chemin du retour. On a craqué en route."]],
    },
    hypothese:[[1, "Quelqu'un protège cette pizza. Un garde du corps ?"],
               [0, "On la protège de quelqu'un. Peut-être de soi-même."]],
    nerfs:["Le régime commence demain. Ça n'a aucun rapport, mais je le dis.",
           "Quarante minutes ! J'ai tenu quarante minutes. Vous, vous auriez tenu combien ?"],
    piste:[[0, "Elle l'a cachée. Puis elle l'a retrouvée."],
           [1, "Se cacher quelque chose à soi-même, ça se paie."]],
    trouvaille:[[0, "{Ou}. Bien enfouie."],
                [1, "Elle l'a cachée d'elle-même. Et elle a perdu."]],
    contradiction:"Vous l'avez cachée pour ne pas la manger. Ça n'a pas suffi.",
    chute:"Elle commençait un régime le lendemain. Elle a caché la pizza pour tenir. Elle a tenu quarante minutes.",
    anecdote:{ suspect:"gabi", qTH:"Vous cachez souvent de la nourriture ?", qPF:"Tu caches encore des trucs à toi-même ?",
      ok:"Jamais. Je n'ai rien à me cacher.", ko:"Une fois. Ça n'a pas marché.",
      pf:"On avait dit qu'on ne parlait plus de ça." } },

  { id:"la_sieste", temoinCle:"teo", tags:["salon", "dodo"], coupable:null, cachettes:["four", "evier"],
    porteurs:["ticket", "assiette", "miettes"],
    deduc:{
      ticket:[[0, "Livrée avant notre départ. J'étais encore là."],
              [1, "Tu étais là. C'est noté."]],
      assiette:[[0, "Utilisée avant notre départ. Elle est sèche depuis."],
              [1, "Quelqu'un a mangé AVANT. L'enquête remonte le temps."]],
      miettes:[[0, "Ces miettes... elles vont vers la porte d'entrée."],
              [1, "Vers la sortie. Quelqu'un a mangé en partant. Qui est parti ?"]],
    },
    hypothese:[[1, "Le voleur nous a précédés. Un professionnel. Il connaissait nos horaires."],
               [0, "Il connaissait surtout la pizza. Ce demi-souvenir me chiffonne."]],
    nerfs:["Tu avais de la sauce sur le col en partant, Pierre-François. Je n'ai rien dit.",
           "La sieste efface tout, chez certains. Je ne vise personne. Si : toi."],
    piste:[[0, "Une assiette utilisée avant notre départ."],
           [1, "Avant notre départ ?"]],
    trouvaille:[[0, "{Ou}. Et ce qu'il en reste était déjà là quand nous sommes partis."],
                [1, "Pierre-François. Regarde-moi."]],
    contradiction:"Personne n'a rien pris après notre départ. Le problème est avant.",
    chute:"Personne n'a volé la pizza. Pierre-François en a mangé la moitié avant de sortir, puis a fait une sieste et a tout oublié. L'enquête aura duré cinq minutes de plus que nécessaire.",
    anecdote:{ suspect:"teo", qTH:"Vous les avez vus partir ?", qPF:"Tu nous as vus partir ?",
      ok:"Oui. L'un des deux avait l'air repu.", ko:"Je n'ai rien vu. Je jouais.",
      pf:"Tu me regardes bizarrement, là." } },

  { id:"le_double", tags:["argent", "porte"], coupable:"charles", cachettes:["sac", "manteaux", "poubelle"],
    porteurs:["ticket", "boite", "billet"],
    deduc:{
      ticket:[[0, "Deux tickets. Deux heures différentes."],
              [1, "Deux pizzas dans la même soirée. Le budget explose."]],
      boite:[[0, "Deux cartons. Un gras, un neuf."],
              [1, "On remplace une pizza comme on remplace un vase cassé."]],
      billet:[[0, "Un billet préparé pour le second livreur."],
              [1, "Payer en liquide, c'est ne pas laisser de trace. En théorie."]],
    },
    hypothese:[[1, "Le livreur est passé deux fois. Il s'ennuyait ?"],
               [0, "On ne commande pas deux fois par ennui. On commande pour couvrir la première."]],
    nerfs:["Deux pizzas, c'est une offre, parfois. Un menu duo. Ça existe.",
           "J'ai recommandé la même, d'accord ? À l'identique. Personne ne devait voir la différence."],
    piste:[[0, "Deux tickets. Une seule livraison enregistrée."],
           [1, "Il y en avait deux, donc."]],
    trouvaille:[[0, "{Ou}. La première. Intacte, jamais ouverte."],
                [1, "Il en a commandé une seconde pour cacher la première."]],
    contradiction:"Vous avez payé deux fois. Une seule pizza a été mangée.",
    chute:"Il en a commandé une deuxième pour que personne ne remarque la disparition de la première. Il a doublé le problème et le budget.",
    anecdote:{ suspect:"charles", qTH:"Combien de pizzas sont arrivées ce soir ?", qPF:"Vous comptez bien, vous ?",
      ok:"Une. J'ai vu passer le livreur une fois.", ko:"Une. Enfin, une à la fois.",
      pf:"Vous hésitez sur un chiffre simple." } },

  { id:"bonne_nuit", tags:["dodo", "salon", "argent"], coupable:"gabi", cachettes:["frigo", "placards"],
    porteurs:["ticket", "assiette", "billet"],
    deduc:{
      ticket:[[0, "Livrée à {heure}. Juste après la tournée de Francky."],
              [1, "La tournée « bonne nuit les petits ». Après ça, plus personne n'a rien vu."]],
      assiette:[[0, "Une seule assiette, couverts posés droits. On a mangé tranquillement."],
              [1, "Dans le calme. Le calme de tout un appartement endormi."]],
      billet:[[0, "Cinq euros, posés en évidence."],
              [1, "Payer des gens qui dorment. C'est délicat, au fond."]],
    },
    hypothese:[[1, "Tout le monde dormait, donc personne n'a mangé, donc la pizza dort aussi."],
               [0, "Quelqu'un ne dormait pas. Cherche qui a refusé le verre."]],
    nerfs:["Je ne bois jamais. C'est un choix de santé. Sans rapport.",
           "Ils ronflaient tous ! Qu'est-ce que vous vouliez que je fasse ? Qu'elle refroidisse ?"],
    piste:[[0, "Tout le monde dormait à {heure}. Tout le monde sauf une personne."],
           [1, "Celle qui n'avait rien bu."]],
    trouvaille:[[0, "{Ou}. Rangée pendant que les autres ronflaient."],
                [1, "Elle a eu tout le temps du monde."]],
    contradiction:"Vous n'avez pas touché au cocktail de Francky. Vous êtes la seule.",
    chute:"Francky avait servi sa tournée « bonne nuit les petits ». Tout le monde s'est effondré. Elle, non — elle ne boit pas. Elle a mangé tranquillement et rangé la boîte.",
    anecdote:{ suspect:"gabi", qTH:"Vous avez bu quelque chose ce soir ?", qPF:"Tu as bu, toi ?",
      ok:"Un verre d'eau. Je conduis demain.", ko:"Rien du tout. Je suis la seule à m'en souvenir.",
      pf:"Tu sais bien que je ne bois pas non plus. Enfin, presque." } },

  { id:"le_reveil", tags:["dodo", "alcool", "porte"], coupable:null, temoinCle:"teo",
    cachettes:["four", "evier", "placards"],
    porteurs:["ticket", "fromage", "menu"],
    deduc:{
      ticket:[[0, "Livrée à {heure}. Signée d'une main qui tremblait déjà."],
              [1, "La tournée de Francky était passée par là."]],
      fromage:[[0, "Refroidi sur place, longtemps. Personne ne l'a mangée chaude."],
              [1, "Une pizza qu'on paie et qu'on ne mange pas. Le crime parfait, sans criminel."]],
      menu:[[1, "{livreur} m'a dit avoir livré à des gens « très détendus »."],
              [0, "Détendus. C'est un mot pour endormis."]],
    },
    hypothese:[[1, "Un voleur les a endormis au gaz ! C'est un coup de professionnel."],
               [0, "Le gaz sentait le rhum. Cherche plutôt du côté du bar."]],
    nerfs:["Après le deuxième verre, mes souvenirs sont... des hypothèses.",
           "Je me souviens l'avoir posée quelque part de sûr. C'est le « où » qui manque."],
    piste:[[0, "Personne ne se souvient de rien après {heure}."],
           [1, "Ce n'est pas un alibi. C'est un cocktail."]],
    trouvaille:[[0, "{Ou}. Personne ne l'a bougée depuis."],
                [1, "Elle était là depuis le début. Nous, non."]],
    contradiction:"Vous ne vous rappelez de rien. Personne ne se rappelle de rien.",
    chute:"Personne n'a volé la pizza. Francky avait servi sa tournée maison, tout l'appartement s'est endormi, et au réveil plus personne ne savait où il l'avait posée.",
    anecdote:{ suspect:"teo", qTH:"Que retenez-vous de la soirée ?", qPF:"Tu te souviens de quoi, toi ?",
      ok:"Tout, jusqu'à un certain point. Après, un trou.", ko:"Un trou. Un beau trou bien net.",
      pf:"Tu m'inquiètes quand tu ne te souviens de rien." } },

  { id:"la_fuite", temoinCle:"teo", tags:["plomberie", "salon"], coupable:null,
    cachettes:["evier"],
    porteurs:["ticket", "sauce", "assiette"],
    deduc:{
      ticket:[[0, "Livrée à {heure}. La soirée était encore sèche, à ce moment-là."],
              [1, "Sèche ? Tu prépares quelque chose, toi."]],
      sauce:[[0, "De la sauce diluée. Il y avait de l'eau par terre."],
              [1, "De l'eau. Dans une affaire de pizza. Ça se complique."]],
      assiette:[[0, "Rangée dans le mauvais placard. Avec la vaisselle d'urgence."],
              [1, "La vaisselle d'urgence. Cet appartement a des procédures."]],
    },
    hypothese:[[1, "La pizza est tombée dans l'évier et a pris la fuite. Littéralement."],
               [0, "Personne n'a fui. On a déménagé un placard en catastrophe, et elle a suivi."]],
    nerfs:["Le siphon de Jojo tient très bien. Je tiens à le dire. Très bien.",
           "On a tout vidé en urgence ! Dans le noir ! La pizza était... quelque part dans le tas."],
    piste:[[0, "Le sol est humide sous le placard du bas."],
           [1, "On a vidé ce placard en urgence. Et tout remis dedans."]],
    trouvaille:[[0, "{Ou}. Entre une bassine et une clé de douze."],
                [1, "Personne ne l'a volée. On l'a déménagée."]],
    contradiction:"Vous avez vidé le placard pendant la fuite. Vous avez tout remis. Tout.",
    chute:"L'évier a fui vers la fin du repas. On a vidé le placard du bas en urgence, tout entassé, et la pizza est partie avec le reste. Jojo avait pourtant bien posé le siphon.",
    anecdote:{ suspect:"teo", qTH:"Il y a eu une fuite, ce soir ?", qPF:"Tu as encore bricolé quelque chose ?",
      ok:"Un filet d'eau. On a épongé.", ko:"Une vraie fuite. J'ai tout sorti de ce placard.",
      pf:"Tu bricoles toujours quand il ne faut pas." } },

  { id:"le_placard_haut", tags:["hauteur", "porte"], coupable:"gabi",
    cachettes:["placards"],
    porteurs:["ticket", "menu", "miettes"],
    deduc:{
      ticket:[[0, "Livrée à {heure}. Réceptionnée en bas, dit le ticket."],
              [1, "En bas ? Quelqu'un attendait en bas. Quelqu'un de patient."]],
      menu:[[1, "{livreur} m'a dit avoir croisé « une dame très grande » dans l'escalier."],
              [0, "Très grande. Voilà un signalement qui restreint."]],
      miettes:[[0, "Aucune miette au sol. Mais une, une seule, sur le haut du frigo."],
              [1, "En haut ? Personne ici n'atteint ça sans tabouret."]],
    },
    hypothese:[[1, "Un géant est entré, a mangé une miette, et est reparti. Sobre, le géant."],
               [0, "Pas un géant. Deux personnes : une qui demande, une qui atteint."]],
    nerfs:["Vous avez regardé en haut ? Non, rien. Continuez.",
           "Il m'a fallu de l'aide, d'accord ? On n'a pas tous des échelles dans les bras."],
    piste:[[0, "Elle est en haut. Bien en haut."],
           [1, "Personne ici n'atteint ça sans tabouret."]],
    trouvaille:[[0, "{Ou}. Sans une trace de tabouret par terre."],
                [1, "Il a donc fallu quelqu'un de grand. Ou de l'aide."]],
    contradiction:"Vous n'atteignez pas ce placard. Quelqu'un l'a fait pour vous.",
    chute:"Elle a demandé un coup de main à la femme de Jojo, qui attendait en bas et qui atteint tout sans monter sur rien. Deux personnes pour cacher une pizza : c'est une organisation.",
    anecdote:{ suspect:"gabi", qTH:"Qui vous a aidée à ranger, en haut ?", qPF:"Tu as fait ça toute seule ?",
      ok:"Personne. Je ne range jamais en haut.", ko:"On m'a tendu la boîte. Je n'ai fait que la pousser.",
      pf:"Tu ne montes jamais sur un tabouret, je le sais." } },

  { id:"les_deux_bars", tags:["alcool", "porte"], coupable:"charles",
    cachettes:["manteaux", "sac"],
    porteurs:["ticket", "serviette", "fromage"],
    deduc:{
      ticket:[[0, "Livrée à {heure}. Bien avant la fermeture du D'Tour."],
              [1, "Donc elle a attendu ici pendant que la soirée continuait ailleurs."]],
      serviette:[[0, "Une serviette en papier. D'un bar. Pas d'ici."],
              [1, "L'Entrepotes. Quelqu'un est passé chez Jojo cette nuit."]],
      fromage:[[0, "Refroidi en {froid}, puis déplacé froid."],
              [1, "On a emporté une pizza froide. Personne ne fait ça consciemment."]],
    },
    hypothese:[[1, "Deux bars, une pizza : c'est un itinéraire de contrebande."],
               [0, "C'est un itinéraire d'étourdi. Quelqu'un est repassé ici tard, et pas à jeun."]],
    nerfs:["Le D'Tour ferme à quelle heure, déjà ? Simple curiosité.",
           "Je suis remonté pour mon manteau ! La pizza... la pizza a dû suivre le manteau."],
    piste:[[0, "Deux additions. Deux bars. La même soirée."],
           [1, "Quelqu'un est rentré bien après les autres."]],
    trouvaille:[[0, "{Ou}. Froide, oubliée là."],
                [1, "Il l'a prise en partant, puis il a oublié qu'il l'avait prise."]],
    contradiction:"Vous êtes rentré du second bar. Personne ne vous a vu revenir.",
    chute:"Il a fini la soirée chez Jojo après le D'Tour, il est remonté chercher son manteau, et il a emporté la pizza sans y penser. Au matin, il ne s'en souvenait plus.",
    anecdote:{ suspect:"charles", qTH:"Vous êtes allé dans quel bar ?", qPF:"Vous buvez où, vous ?",
      ok:"Aucun. Je ne bois pas en semaine.", ko:"Le D'Tour. Puis l'autre. Je crois.",
      pf:"Vous avez une drôle de mémoire des lieux." } },

  { id:"le_siphon", tags:["plomberie", "salon"], coupable:"teo",
    cachettes:["placards", "commode"],
    porteurs:["ticket", "sauce", "assiette"],
    deduc:{
      ticket:[[0, "Livrée à {heure}. Pendant que quelqu'un travaillait sous l'évier."],
              [1, "Travailler pendant qu'on mange. Il y a plus discret comme alibi."]],
      sauce:[[0, "De la sauce sur un joint neuf."],
              [1, "On ne mange pas en bricolant. Enfin, on ne devrait pas."]],
      assiette:[[0, "Propre, mais avec des traces de mastic sur le bord."],
              [1, "Du mastic. Le dîneur avait les mains du plombier."]],
    },
    hypothese:[[1, "Jojo ! C'est son siphon, c'est sa sauce, c'est son crime."],
               [0, "Jojo a posé le siphon il y a un mois. Le mastic frais est d'un autre. Un amateur appliqué."]],
    nerfs:["Ce joint est parfaitement posé. Regardez ce travail. Regardez-le.",
           "J'avais les mains libres, elle était là... Le corps décide, parfois. Le siphon, lui, tient."],
    piste:[[0, "Des outils sortis, un joint neuf, et les mains propres."],
           [1, "Quelqu'un a travaillé, puis s'est lavé les mains. Avant ou après ?"]],
    trouvaille:[[0, "{Ou}. Posée là le temps de finir le chantier."],
                [1, "Et le chantier a duré."]],
    contradiction:"Vous avez démonté le siphon. On ne fait pas ça les mains vides.",
    chute:"Il a voulu réparer l'évier pendant que les autres mangeaient. Il a posé la pizza pour avoir les mains libres, a fini le joint, et a mangé sans réfléchir. Le siphon, lui, tient très bien.",
    anecdote:{ suspect:"teo", qTH:"Vous avez touché à la plomberie ce soir ?", qPF:"Tu as encore démonté un truc ?",
      ok:"Je regarde, je ne touche pas.", ko:"Un joint. Deux minutes. Et j'avais faim.",
      pf:"Tu vas finir par inonder l'immeuble." } },

  { id:"la_bassine", temoinCle:"gabi", tags:["plomberie", "porte"], coupable:null,
    cachettes:["evier", "poubelle"],
    porteurs:["ticket", "boite", "serviette"],
    deduc:{
      ticket:[[0, "Livrée à {heure}. Vingt minutes avant le début de la fuite."],
              [1, "Cette pizza a connu une soirée difficile."]],
      boite:[[0, "Le carton est gondolé. Il a pris l'eau par-dessous."],
              [1, "Une boîte à pizza qui prend l'eau. On aura tout vu."]],
      serviette:[[0, "Trempée, essorée, retrempée. Elle a servi de serpillière."],
              [1, "L'appartement entier a lutté contre quelque chose d'humide."]],
    },
    hypothese:[[1, "La pizza a été noyée. C'est un règlement de comptes."],
               [0, "Personne n'a noyé personne. On a improvisé avec ce qu'on avait sous la main."]],
    nerfs:["Ça gouttait, je précise. Beaucoup. Il fallait un récipient plat.",
           "La boîte était PLATE et ÉTANCHE. Enfin, étanche... plate."],
    piste:[[0, "Le carton est gondolé. Il a pris l'eau."],
           [1, "On s'est servi de la boîte comme d'une bassine."]],
    trouvaille:[[0, "{Ou}. Le carton a servi à autre chose qu'à transporter."],
                [1, "Personne ne l'a volée. Elle a fini par terre, sous une fuite."]],
    contradiction:"Vous avez pris la boîte pour la fuite. Vous n'avez pas regardé dedans.",
    chute:"Ça gouttait. La première chose plate à portée de main était la boîte. Elle a servi de bassine pendant vingt minutes, avec la pizza encore dedans.",
    anecdote:{ suspect:"gabi", qTH:"Qu'avez-vous mis sous la fuite ?", qPF:"Tu as mis quoi sous la fuite ?",
      ok:"Une casserole. Comme tout le monde.", ko:"Ce qui traînait. Je n'ai pas regardé quoi.",
      pf:"Tu ne regardes jamais ce que tu prends." } },

  { id:"le_tabouret", tags:["hauteur", "salon"], coupable:"charles",
    cachettes:["placards", "portant"],
    porteurs:["ticket", "miettes", "part"],
    deduc:{
      ticket:[[0, "Livrée à {heure}. Mangée en partie, aussitôt."],
              [1, "En partie. Quelqu'un s'est arrêté en route. Par prudence ?"]],
      miettes:[[0, "Des miettes au pied du tabouret. Et le tabouret a bougé."],
              [1, "Trente centimètres. On remet mal ce qu'on remet vite."]],
      part:[[0, "Une part entamée, emportée à moitié."],
              [1, "On garde une part pour plus tard quand on compte revenir."]],
    },
    hypothese:[[1, "Le tabouret a mangé la pizza. Non ? Bon."],
               [0, "Quelqu'un est monté dessus. On ne monte pas pour manger, on monte pour cacher."]],
    nerfs:["Ce tabouret a toujours été là. Enfin, par là. Dans cette zone.",
           "Je comptais revenir la chercher ! C'était une cachette, pas un vol. Une consigne."],
    piste:[[0, "Le tabouret de la cuisine a changé de place."],
           [1, "Quelqu'un est monté dessus. Puis l'a remis. Presque."]],
    trouvaille:[[0, "{Ou}. Il a fallu grimper."],
                [1, "Et redescendre discrètement."]],
    contradiction:"Le tabouret a bougé de trente centimètres. Vous êtes le seul à être monté.",
    chute:"Il l'a cachée en hauteur pour que personne ne la trouve avant son départ, et il a mal remis le tabouret. Trente centimètres, c'est tout ce qu'il a laissé derrière lui.",
    anecdote:{ suspect:"charles", qTH:"Vous êtes monté sur quelque chose ce soir ?", qPF:"Vous grimpez souvent chez les gens ?",
      ok:"Non. Je ne me sers de rien, ici.", ko:"Sur le tabouret. Pour atteindre une étagère.",
      pf:"Vous avez une réponse pour tout, vous." } },

  { id:"hors_de_portee", temoinCle:"teo", tags:["hauteur", "porte"], coupable:null,
    cachettes:["placards", "portant"],
    porteurs:["ticket", "fromage", "assiette"],
    deduc:{
      ticket:[[0, "Livrée à {heure}. Et rangée dans la minute."],
              [1, "Rangée. Pas volée, pas mangée : rangée. C'est presque décevant."]],
      fromage:[[0, "Refroidi lentement, à l'air libre. En hauteur, l'air circule."],
              [1, "En hauteur ? Pourquoi tu regardes le plafond ?"]],
      assiette:[[0, "Propre. Personne n'a mangé quoi que ce soit."],
              [1, "Une affaire de pizza sans consommation de pizza. On touche à l'absurde."]],
    },
    hypothese:[[1, "Elle s'est volatilisée. Littéralement. Vers le haut."],
               [0, "Tu plaisantes, mais les indices montent. Nous, on regarde à hauteur d'homme."]],
    nerfs:["Vous avez le cou raide, vous deux ? Vous ne levez jamais la tête ?",
           "Quelqu'un de grand a rangé. Point. La taille n'est pas un délit."],
    piste:[[0, "Nous avons regardé partout. À hauteur d'homme."],
           [1, "Personne n'a levé la tête."]],
    trouvaille:[[0, "{Ou}. À trente centimètres au-dessus de nos regards."],
                [1, "Elle nous a vus passer six fois."]],
    contradiction:"Personne ne l'a cachée. Personne n'a levé les yeux, c'est différent.",
    chute:"Elle avait été rangée en hauteur, tout simplement, par quelqu'un de grand qui n'y voyait rien d'extraordinaire. Deux inspecteurs sont passés dessous six fois.",
    anecdote:{ suspect:"teo", qTH:"Vous avez cherché en hauteur ?", qPF:"Tu as pensé à regarder en haut ?",
      ok:"Non. On ne pense jamais à lever la tête.", ko:"Je n'y ai pas pensé une seconde.",
      pf:"Tu es plus grand que moi, tu aurais pu." } },

  { id:"la_tournee", tags:["alcool", "salon"], coupable:"teo",
    cachettes:["tv", "basse", "canape"],
    porteurs:["ticket", "part", "serviette"],
    deduc:{
      ticket:[[0, "Livrée à {heure}. En pleine tournée générale."],
              [1, "Une tournée, ça se termine toujours par quelqu'un qui a faim."]],
      part:[[0, "Une part tombée à côté du canapé."],
              [1, "On lui a apporté la pizza. Au canapé. Comme un room service."]],
      serviette:[[0, "Coincée entre deux coussins."],
              [1, "Le dîneur n'a pas quitté sa place. Pas une fois."]],
    },
    hypothese:[[1, "Le canapé est le centre de cette affaire. Arrêtons le canapé."],
               [0, "Arrête plutôt celui qui n'en a pas bougé de la soirée."]],
    nerfs:["On m'a APPORTÉ des choses. Je n'ai rien demandé. Enfin, pas clairement.",
           "J'aimerais savoir qui me l'a apportée. Pour le remercier. Puis m'excuser."],
    piste:[[0, "Personne n'a compté les verres. Ni les parts."],
           [1, "Une tournée, ça se termine toujours par quelqu'un qui a faim."]],
    trouvaille:[[0, "{Ou}. Ce qu'il en reste a été mangé assis."],
                [1, "Sans se lever une seule fois."]],
    contradiction:"Vous n'avez pas quitté ce canapé. La pizza est venue à vous.",
    chute:"Après la tournée, il a eu faim sans avoir la force de se lever. Quelqu'un lui a apporté la pizza. Il n'a jamais su qui, et il a tout mangé.",
    anecdote:{ suspect:"teo", qTH:"Combien de verres, ce soir ?", qPF:"Tu as bu combien, toi ?",
      ok:"Deux. Peut-être trois.", ko:"Je ne compte pas. C'est le principe d'une tournée.",
      pf:"Tu ne comptes jamais, et c'est bien le problème." } },

  /* --- le maire --- */
  { id:"inauguration", temoinCle:"gabi", tags:["officiel", "porte"], coupable:null,
    cachettes:["commode", "manteaux"],
    porteurs:["ticket", "menu", "serviette"],
    deduc:{
      ticket:[[0, "Livrée à {heure}. Le soir même d'une visite officielle."],
              [1, "Une visite officielle ? Ici ? Il n'y avait rien à inaugurer."]],
      menu:[[1, "{livreur} dit avoir serré la main d'un monsieur « très élu »."],
              [0, "Très élu. Marini est monté jusqu'ici."]],
      serviette:[[0, "Une serviette avec un tampon de la mairie."],
              [1, "On tamponne les serviettes, maintenant. L'administration ne recule devant rien."]],
    },
    hypothese:[[1, "L'État a saisi la pizza. C'est fiscal."],
               [0, "Pas saisi : recouvert. Cherche sous quelque chose d'officiel."]],
    nerfs:["Le maire est resté longtemps. Il parlait, il signait, il posait des choses partout.",
           "Son parapheur ! Il l'a posé sur quelque chose de plat et il est parti serrer d'autres mains."],
    piste:[[0, "Un papier officiel signé ce soir, à cette adresse."],
           [1, "Il n'y avait rien à inaugurer ici."]],
    trouvaille:[[0, "{Ou}. Sous un parapheur de la mairie."],
                [1, "Personne ne l'a volée. Elle a été classée."]],
    contradiction:"On n'inaugure pas un dîner. Vous avez pourtant signé quelque chose.",
    chute:"Marini est monté serrer des mains, a fait signer un registre à tout le monde, a posé son parapheur sur la boîte et l'a oubliée là. Le document, lui, est parfaitement en règle.",
    anecdote:{ suspect:"gabi", qTH:"Qui vous a fait signer quelque chose ?", qPF:"Tu as signé un truc, toi ?",
      ok:"Le maire. Il fait signer tout le monde.", ko:"J'ai signé sans lire. Comme d'habitude.",
      pf:"Tu signes vraiment n'importe quoi." } },

  { id:"piece_a_conviction", temoinCle:"teo", tags:["officiel", "salon"], coupable:null,
    cachettes:["placards", "tv"],
    porteurs:["ticket", "assiette", "miettes"],
    deduc:{
      ticket:[[0, "Le ticket porte une annotation au stylo officiel : « NON CONFORME »."],
              [1, "On a contrôlé cette pizza. Administrativement."]],
      assiette:[[0, "Étiquetée. Il y a un numéro de scellé dessous."],
              [1, "Un scellé. Quelqu'un a pris cette soirée très au sérieux."]],
      miettes:[[0, "Alignées. On dirait qu'elles ont été... inventoriées."],
              [1, "Des miettes numérotées. Je ne sais plus si on enquête ou si on audite."]],
    },
    hypothese:[[1, "La pizza a été arrêtée. Il lui faut un avocat."],
               [0, "Saisie, plutôt. Cherche un document, un tampon, une procédure."]],
    nerfs:["Le maire a dit « buffet non conforme ». J'ai cru à une blague. Il avait le tampon.",
           "Elle est quelque part sous scellé municipal. Techniquement, la toucher est un délit."],
    piste:[[0, "La boîte porte un tampon. Un vrai tampon."],
           [1, "Quelqu'un a considéré cette pizza comme une affaire d'État."]],
    trouvaille:[[0, "{Ou}. Avec une étiquette collée dessus."],
                [1, "« Pièce à conviction ». Écrit à la main."]],
    contradiction:"Personne n'a volé. Quelqu'un a saisi. Ce n'est pas la même paperasse.",
    chute:"Le maire a déclaré le buffet non conforme, a saisi la pizza comme pièce à conviction municipale, l'a étiquetée, rangée — puis il est parti serrer d'autres mains.",
    anecdote:{ suspect:"teo", qTH:"Quelqu'un a-t-il étiqueté quelque chose ici ?", qPF:"Tu as vu ce tampon ?",
      ok:"Il étiquette tout. C'est plus fort que lui.", ko:"J'ai laissé faire. On ne discute pas avec un maire.",
      pf:"Tu aurais pu dire quelque chose." } },

  { id:"la_charmante", tags:["officiel", "porte"], coupable:"charles",
    cachettes:["manteaux", "sac", "commode"],
    porteurs:["ticket", "serviette", "menu"],
    deduc:{
      ticket:[[0, "Livrée à {heure}. Pile au début d'une conversation très longue."],
              [1, "Vingt minutes de conversation. Vingt minutes sans témoin côté cuisine."]],
      serviette:[[0, "Pliée en éventail. Quelqu'un a voulu faire bonne impression."],
              [1, "On ne plie pas en éventail pour un chat. Il y avait du beau monde."]],
      menu:[[1, "{livreur} dit qu'un vieux monsieur galant occupait tout le salon."],
              [0, "Galant et sonore. La diversion parfaite. Involontaire, mais parfaite."]],
    },
    hypothese:[[1, "Marini a hypnotisé l'appartement et mangé la pizza. À quatre-vingts ans."],
               [0, "Marini a hypnotisé, oui. Mais quelqu'un d'autre en a profité, en silence."]],
    nerfs:["Ce monsieur parlait fort, non ? On ne s'entendait plus penser.",
           "Tout le monde le regardait LUI. C'était... c'était le moment ou jamais."],
    piste:[[0, "Quelqu'un a monopolisé l'attention pendant vingt minutes."],
           [1, "Et pendant ce temps, personne ne regardait la cuisine."]],
    trouvaille:[[0, "{Ou}. Pendant que tout le monde écoutait poliment."],
                [1, "Il a profité d'un discours. C'est presque élégant."]],
    contradiction:"Vous n'écoutiez pas le maire. Vous étiez le seul.",
    chute:"Marini a passé vingt minutes à parler à la colocataire. Tout le monde regardait ailleurs. Charles a mis la pizza à l'abri sans que personne ne s'en aperçoive.",
    anecdote:{ suspect:"charles", qTH:"Vous écoutiez le discours ?", qPF:"Vous aimez les discours, vous ?",
      ok:"Comme tout le monde. On ne coupe pas un maire.", ko:"J'écoutais d'une oreille. J'avais à faire.",
      pf:"Vous aviez à faire quoi, exactement ?" } },

  /* --- l'agent de sécurité --- */
  { id:"le_registre", tags:["securite", "porte"], coupable:"gabi",
    cachettes:["commode", "portant", "lit"],
    porteurs:["ticket", "menu", "assiette"],
    deduc:{
      ticket:[[0, "Livrée à {heure}. Entrée numéro vingt-et-un du registre de Martin."],
              [1, "Martin compte les pizzas aussi ? Cet homme est un trésor."]],
      menu:[[1, "{livreur} confirme : Martin l'a fait signer en bas. À l'entrée ET à la sortie."],
              [0, "Un livreur tracé. Il ne nous manque que les habitants."]],
      assiette:[[0, "Utilisée entre deux rondes. La fenêtre est étroite."],
              [1, "Étroite, et à l'intérieur. Quelqu'un qui n'est jamais sorti."]],
    },
    hypothese:[[1, "Vingt-deux moins dix-neuf : trois suspects. Voire trois complices !"],
               [0, "Ou trois personnes restées, dont deux endormies. Le registre réduit tout."]],
    nerfs:["Martin note vraiment TOUT ? Les heures ? Les... allées et venues ?",
           "Je ne suis pas sortie, c'est vrai. Mais rester chez soi n'est pas un crime !"],
    piste:[[0, "Vingt-deux entrées, dix-neuf sorties."],
           [1, "Trois personnes sont restées. Une seule n'a jamais bougé."]],
    trouvaille:[[0, "{Ou}. Sans jamais avoir quitté l'étage."],
                [1, "Le registre ne se trompe pas. Les gens, si."]],
    contradiction:"Vous n'êtes jamais descendue. Le registre est formel.",
    chute:"Martin note tout, en bas, depuis neuf ans de comptabilité et trois ans de sécurité. Le registre disait qui était encore là. Il ne restait qu'une personne à qui poser la question.",
    anecdote:{ suspect:"gabi", qTH:"Vous êtes descendue à un moment ?", qPF:"Tu es sortie, toi ?",
      ok:"Deux fois. Le gardien vous le dira.", ko:"Pas une fois. Pourquoi je serais descendue ?",
      pf:"Tu n'aimes pas les escaliers, je sais." } },

  { id:"la_ronde", tags:["securite", "salon"], coupable:"charles",
    cachettes:["sac", "manteaux", "poubelle"],
    porteurs:["ticket", "miettes", "part"],
    deduc:{
      ticket:[[0, "Livrée à {heure}. Quelques minutes avant la ronde de Martin."],
              [1, "Une ronde à la minute près. Difficile de sortir un carton discrètement."]],
      miettes:[[0, "Des miettes dans l'escalier de service. Puis plus rien."],
              [1, "On est descendu, puis remonté. Vite."]],
      part:[[0, "Une part écrasée. On a posé le carton dessus, en catastrophe."],
              [1, "La catastrophe a une heure : celle de la ronde."]],
    },
    hypothese:[[1, "Martin a confisqué la pizza pendant sa ronde. Zèle professionnel."],
               [0, "Martin note, il ne confisque pas. Quelqu'un a croisé sa ronde et paniqué."]],
    nerfs:["Ce Martin... il est ponctuel comment, exactement ? À la minute ? À la seconde ?",
           "Je l'ai entendu monter ! Vous auriez fait quoi, vous, avec un carton dans les bras ?"],
    piste:[[0, "Une ronde à {heure}, à la minute près."],
           [1, "Et quelqu'un est descendu avec un carton plat juste après."]],
    trouvaille:[[0, "{Ou}. Prête à sortir de l'immeuble."],
                [1, "Il n'a pas eu le temps. La ronde est passée."]],
    contradiction:"Vous êtes descendu avec un carton plat. On vous a vu.",
    chute:"Il comptait l'emporter. La ronde de Martin est tombée au mauvais moment, il est remonté en vitesse et l'a laissée là où il a pu.",
    anecdote:{ suspect:"charles", qTH:"Vous êtes descendu vers {heure} ?", qPF:"Vous prenez souvent les escaliers ?",
      ok:"Non. Je suis resté à cet étage.", ko:"Une minute. J'ai fait demi-tour.",
      pf:"Vous faites beaucoup de demi-tours." } },

  { id:"le_comptage", tags:["securite", "argent", "salon"], coupable:"teo",
    cachettes:["canape", "basse", "tv"],
    porteurs:["ticket", "part", "billet"],
    deduc:{
      ticket:[[0, "Une pizza de {parts} parts, dit le ticket."],
              [1, "Martin dit qu'il en manque trois. Il a recompté. Deux fois."]],
      part:[[0, "Les parts restantes sont intactes. Découpe nette, aucune hésitation."],
              [1, "On a prélevé. Régulièrement. Trois fois exactement."]],
      billet:[[0, "Cinq euros. Le prix de trois parts, au prorata."],
              [1, "Quelqu'un a payé SA part. Au centime. C'est un comptable ou un maniaque."]],
    },
    hypothese:[[1, "Trois voleurs, une part chacun. Un gang discipliné."],
               [0, "Un seul, en trois services. La régularité est une signature."]],
    nerfs:["Trois parts, ce n'est pas une pizza. C'est une dégustation prolongée.",
           "J'ai payé au prorata ! Qui paie au prorata, à part un honnête homme ?"],
    piste:[[0, "Une pizza de {parts} parts. Il en manque exactement trois."],
           [1, "Trois. Pas deux, pas quatre."]],
    trouvaille:[[0, "{Ou}. Avec ce qu'il en reste, compté."],
                [1, "Quelqu'un ici sait compter aussi bien que Martin."]],
    contradiction:"Trois parts. Une toutes les vingt minutes. Vous n'avez pas bougé de là.",
    chute:"Il n'a pas volé une pizza : il en a mangé trois parts, régulièrement, sans se lever. Un ancien comptable a recompté et le total ne pardonne pas.",
    anecdote:{ suspect:"teo", qTH:"Combien de parts avez-vous mangées ?", qPF:"Tu en as pris combien ?",
      ok:"Une. Peut-être une et demie.", ko:"Je n'ai pas compté. Ça se compte, une pizza ?",
      pf:"Ça se compte très bien, figure-toi." } },

  { id:"la_tarte", temoinCle:"gabi", tags:["porte", "chat"], coupable:null, cachettes:["placards", "evier"],
    porteurs:["ticket", "chorizo", "assiette"],
    deduc:{
      ticket:[[0, "Livrée à {heure}. Et pourtant, une odeur de citron flotte encore."],
              [1, "Du citron dans une affaire de chorizo. Quelqu'un est venu avec autre chose."]],
      chorizo:[[0, "Une rondelle. Posée SUR une trace de meringue."],
              [1, "De la meringue. Elle est passée. ELLE."]],
      assiette:[[0, "Deux assiettes : une grasse, une sucrée."],
              [1, "Un échange. On a troqué quelque chose contre quelque chose."]],
    },
    hypothese:[[1, "Hortense a volé la pizza et laissé une bombe. Une tarte. Pareil."],
               [0, "Hortense ne vole pas. Elle échange, elle marque, elle repart. Cherche la tarte, tu trouveras la pizza."]],
    nerfs:["Ma sœur est passée, oui. En coup de vent. Un coup de vent au citron.",
           "Elle a laissé une tarte « en échange ». La pizza n'a pas bougé, je vous dis !"],
    piste:[[0, "Quelqu'un est venu, a échangé quelque chose, et est reparti."],
           [1, "Échangé ?"]],
    trouvaille:[[0, "{Ou}. À la place d'autre chose."],
                [1, "Il y avait une tarte au citron ici. Plus maintenant."]],
    contradiction:"Personne n'a volé. Quelqu'un a troqué.",
    chute:"Hortense est passée. Elle a laissé une tarte au citron et emporté l'idée. La pizza, elle, n'a jamais bougé." ,
    anecdote:{ suspect:"gabi", qTH:"Qu'est-ce qui a disparu du placard ?", qPF:"Qu'est-ce qui a disparu du placard ?", ok:"Une tarte au citron. Ma sœur adore ça.", ko:"Elle a donc échangé.", pf:"Elle passe, elle prend, elle repart." }
  },
];

const Affaire = {
  scenario:null, coupable:null, cachette:null, reels:[], plan:{}, hortenseFaite:false,

  generer(){
    this.scenario = piocher(SCENARIOS);

    /* Les détails de l'affaire sont tirés ICI, une seule fois, et tous
       les textes y puisent : l'heure du ticket est la même que celle
       que Thibaut oppose au suspect, et elle change à chaque partie.
       Écrits en dur, ils faisaient de dix-sept affaires une seule
       soirée répétée. */
    const h = entier(19, 21), mn = entier(0, 59);
    this.faits = {
      heure:h + " h " + (mn < 10 ? "0" : "") + mn,
      froid:piocher(["vingt", "vingt-cinq", "trente", "trente-cinq", "quarante"]) + " minutes",
      parts:piocher(["six", "huit"]),
      livreur:piocher(["Maurice", "Kevin", "Sofiane", "le grand blond", "celui du samedi"]),
      pointure:entier(38, 46),
      etage:piocher(["deuxième", "troisième", "quatrième"]),
    };
    this.coupable = this.scenario.coupable
      ? SUSPECTS_BANQUE.find(s => s.id === this.scenario.coupable) : null;
    this.cachette = piocher(this.scenario.cachettes);
    /* Le lieu de la cachette est un fait comme un autre : les textes de
       découverte le nomment par {ou}, sinon huit affaires sur dix-sept
       annonçaient un meuble alors que la pizza était dans un autre. */
    const zc = ZONES.find(z => z.id === this.cachette);
    this.faits.ou = (zc && zc.dedans) || "quelque part";
    this.faits.Ou = this.faits.ou.charAt(0).toUpperCase() + this.faits.ou.slice(1);
    const obligatoires = this.scenario.porteurs.slice();
    /* Le garnissage ne pioche que dans ce qui a du sens ici : les
       indices étiquetés n'apparaissent que si l'affaire porte la même
       étiquette. On garde des fausses pistes, mais des fausses pistes
       qu'on peut refermer. */
    const marques = this.scenario.tags || [];
    const reste = INDICES
      .filter(i => obligatoires.indexOf(i.id) < 0)
      .filter(i => !i.exige || marques.indexOf(i.exige) >= 0)
      .map(i => i.id);
    melangerTableau(reste);
    this.reels = obligatoires.concat(reste.slice(0, ENQ_OBJECTIF - obligatoires.length));

    /* Toute affaire doit contenir au moins une trace que seul
       Pierre-François sait lire, et au moins un détail que seul Thibaut
       comprend. Sans cette garantie, un tirage sur trois se bouclait
       avec un seul inspecteur et le bouton CHANGER ne servait à rien. */
    const a = id => INDICES.find(i => i.id === id) || {};
    /* Le repli écrasait la DERNIÈRE case quand aucun indice neutre
       n'était libre — y compris celle que le passage précédent venait de
       remplir. Avec beaucoup d'indices marqués, la garantie se mangeait
       elle-même et une affaire repartait avec cinq indices utiles. On
       protège donc les cases déjà acquises. */
    const protege = [];
    for (const trait of ["expert", "social"]){
      if (this.reels.some(id => a(id)[trait])) continue;
      const candidat = reste.find(id => a(id)[trait] && this.reels.indexOf(id) < 0);
      if (!candidat) continue;
      let ou = this.reels.findIndex((id, k) =>
        k >= obligatoires.length && protege.indexOf(k) < 0 && !a(id).expert && !a(id).social);
      if (ou < 0) ou = this.reels.findIndex((id, k) =>
        k >= obligatoires.length && protege.indexOf(k) < 0);
      if (ou < 0) continue;                    /* plus de place : on n'écrase rien */
      this.reels[ou] = candidat;
      protege.push(ou);
    }

    const places = ZONES.map(z => z.id).filter(id => id !== this.cachette);
    melangerTableau(places);
    this.plan = {};
    this.reels.forEach((id, k) => { this.plan[places[k]] = id; });
    this.hortenseFaite = false;
    return this;
  },

  bonneReponse(){ return this.coupable ? this.coupable.id : "personne"; },
  /* La lecture de CET indice dans CETTE affaire : c'est elle qui fait
     avancer l'histoire. L'écho générique ne sert plus qu'au garnissage. */
  deduc(id){
    const d = this.scenario && this.scenario.deduc && this.scenario.deduc[id];
    return d ? d.map(p => [p[0], remplir(p[1])]) : null;
  },
  /* La première théorie, à deux indices : Thibaut propose l'absurde,
     Pierre-François corrige. Elle est fausse exprès — c'est le chemin
     qui est drôle, pas l'arrivée. */
  hypothese(){
    const h = this.scenario && this.scenario.hypothese;
    return h ? h.map(p => [p[0], remplir(p[1])]) : null;
  },
  /* Ce que le témoin clé lâche sous la pression du dossier. */
  nerfs(n){
    const t = this.scenario && this.scenario.nerfs;
    return t && t[n] ? remplir(t[n]) : null;
  },
  /* Qui craque. Dans les affaires où personne n'a rien volé, il n'y a
     pas de coupable à confondre : c'est le témoin clé qui lâche la
     phrase qui change tout. Sans lui, trois affaires sur dix-sept
     n'avaient aucune contradiction atteignable. */
  temoinCle(){ return this.coupable ? this.coupable.id : (this.scenario.temoinCle || null); },
  titreSolution(){ return this.coupable ? this.coupable.nom : "PERSONNE"; },
  chute(){ return remplir(this.scenario.chute); },
  piste(){ return this.scenario.piste.map(p => [p[0], remplir(p[1])]); },
  trouvaille(){ return this.scenario.trouvaille.map(p => [p[0], remplir(p[1])]); },
  contradiction(){ return remplir(this.scenario.contradiction); },
};

/* Remplace les {marqueurs} par les faits de l'affaire en cours. Passer
   par un seul point garantit qu'un texte oublié se voit tout de suite :
   il reste des accolades à l'écran. */
function remplir(t){
  if (!t || t.indexOf("{") < 0) return t;
  const f = (Affaire && Affaire.faits) || {};
  return t.replace(/\{(\w+)\}/g, (m, k) => (f[k] !== undefined ? f[k] : m));
}

function melangerTableau(t){
  for (let i = t.length - 1; i > 0; i--){
    const j = entier(0, i); const v = t[i]; t[i] = t[j]; t[j] = v;
  }
  return t;
}

/* ---------- EvidenceManager -> Dossier ---------- */
const Dossier = {
  cartes:[],
  raz(){ this.cartes = []; },
  /* Une carte garde l'indice ET l'endroit. « Sauce tomate » ne veut
     rien dire sans « sur la table basse » : c'est le lieu qui fait la
     déduction, pas l'objet. */
  ajouter(ind, ou){
    if (this.cartes.some(c => c.id === ind.id)) return;
    this.cartes.push({ id:ind.id, nom:ind.nom, sprite:ind.sprite, ou:ou });
  },
  compte(){ return this.cartes.length; },
};

/* ---------- HortenseEventManager -> HortenseApp ----------
   Elle entre par un bord, regarde, prépare, lance et repart. La tarte
   n'est PAS la pizza recherchée : c'est le lien avec le niveau 1. */
const ETAT_H2 = {
  CACHEE:"CACHEE", ENTREE:"ENTREE", GUET:"GUET", PREPARE:"PREPARE",
  LANCE:"LANCE", RIRE:"RIRE", SORTIE:"SORTIE", FINI:"FINI",
};

const HortenseApp = {
  etat:ETAT_H2.CACHEE, x:0, vise:0, chrono:0, cible:0, tarte:null, quand:0, faite:false, phase:0, appelee:false,

  raz(){
    this.etat = ETAT_H2.CACHEE; this.faite = false; this.tarte = null;
    this.appelee = false;
    /* entre 35 % et 65 % de la durée : ni au tout début, ni à la fin */
    this.quand = ENQ_DUREE * hasard(0.35, 0.65);
  },

  /* Interroger sa sœur, c'est la prévenir. Une fois sur deux elle
     rapplique dans les secondes qui suivent ; sinon l'attente est
     franchement raccourcie, et insister finit toujours par payer. */
  provoquer(){
    if (this.faite || this.etat !== ETAT_H2.CACHEE) return false;
    const reste = this.quand - this.ecoule();
    if (Math.random() < 0.55){
      this.quand = this.ecoule() + hasard(3.5, 8);
      this.appelee = true;
      return true;
    }
    if (reste > 6) this.quand = this.ecoule() + reste * 0.55;
    return false;
  },
  ecoule(){ return ENQ_DUREE - Enquete.restant; },
  peutVenir(){
    return !this.faite && this.etat === ETAT_H2.CACHEE && Enquete.actif &&
           !Enquete.dossierOuvert && !Enquete.accusation && Enquete.gele <= 0 &&
           this.ecoule() >= this.quand;
  },
  declencher(){
    if (this.etat !== ETAT_H2.CACHEE) return;
    this.faite = true;
    const chef = Enquete.actifIns();
    this.cible = chef.heros;
    const cote = chef.x > 0.5 ? -1 : 1;
    this.x = borne(chef.x + cote * 0.17, -0.04, 1.04);
    this.vise = chef.x + cote * 0.08;
    this.etat = ETAT_H2.ENTREE;
    Enquete.dire(this.appelee ? "Elle n'a pas mis longtemps." : "Un silence. Puis quelqu'un.", 1.8);
    Enquete.dialogue([[1 - this.cible, this.appelee ? "Sa sœur l'a prévenue." : "Attends. Tu entends ?"]], 0.4);
    Sons.hortenseEntre();
  },
  majorer(dt){
    this.phase += dt * 7;
    if (this.etat === ETAT_H2.CACHEE){ if (this.peutVenir()) this.declencher(); return; }
    switch (this.etat){
      case ETAT_H2.ENTREE: {
        const r = this.vise - this.x;
        this.x += Math.sign(r) * Math.min(Math.abs(r), 0.24 * dt);
        if (Math.abs(this.vise - this.x) < 0.004){ this.etat = ETAT_H2.GUET; this.chrono = 0.4; }
        break;
      }
      case ETAT_H2.GUET:
        this.chrono -= dt;
        if (this.chrono <= 0){ this.etat = ETAT_H2.PREPARE; this.chrono = 0.55; Sons.hortensePrepare(); }
        break;
      case ETAT_H2.PREPARE:
        this.chrono -= dt;
        if (this.chrono <= 0) this.lancer();
        break;
      case ETAT_H2.LANCE:
        this.chrono -= dt;
        if (this.chrono <= 0 && !this.tarte){ this.etat = ETAT_H2.RIRE; this.chrono = 0.7; Sons.hortenseRit(); }
        break;
      case ETAT_H2.RIRE:
        this.chrono -= dt;
        if (this.chrono <= 0) this.etat = ETAT_H2.SORTIE;
        break;
      case ETAT_H2.SORTIE: {
        const dir = Math.sign(this.x - Enquete.actifIns().x) || 1;
        this.x += dir * 0.28 * dt;
        if (this.x < -0.06 || this.x > 1.06) this.etat = ETAT_H2.FINI;
        break;
      }
    }
    if (this.tarte) this.majorerTarte(dt);
  },
  lancer(){
    const ins = Enquete.inspecteurs[this.cible];
    this.etat = ETAT_H2.LANCE; this.chrono = 0.25;
    this.tarte = {
      x:this.x, y:0.52, x0:this.x, but:ins.x, t:0, rot:0, etat:"vol",
      duree:Math.max(0.9, Math.abs(this.x - ins.x) * 4.4),
    };
    Enquete.esquiveOuverte = false;
    Sons.tarteLancee();
  },
  resteAvantImpact(){
    const p = this.tarte;
    if (!p) return 1e9;
    return Math.max(0, (1 - Math.min(1, p.t / p.duree)) * p.duree);
  },
  majorerTarte(dt){
    const p = this.tarte;
    if (p.etat === "fini"){ this.tarte = null; Enquete.esquiveOuverte = false; return; }
    p.t += dt;
    const a = Math.min(1.3, p.t / p.duree);
    const fin = p.but + Math.sign(p.but - p.x0) * 0.10;
    p.x = melange(p.x0, fin, a);
    p.y = 0.52 - Math.sin(Math.PI * Math.min(1, a)) * 0.10 + a * 0.05;
    p.rot += dt * 9;
    Enquete.esquiveOuverte = p.etat === "vol" && this.resteAvantImpact() <= ENQ_ESQUIVE_FENETRE;
    if (p.etat === "vol" && a >= 1){
      p.etat = "fini";
      Enquete.recevoirTarte(this.cible);
    } else if (p.etat === "esquivee" && a >= 1.25){
      p.etat = "fini";
    }
  },
  esquiver(){
    const p = this.tarte;
    if (!p || p.etat !== "vol") return false;
    if (this.resteAvantImpact() > ENQ_ESQUIVE_FENETRE) return false;
    p.etat = "esquivee";
    Enquete.esquiveOuverte = false;
    return true;
  },
  visible(){ return this.etat !== ETAT_H2.CACHEE && this.etat !== ETAT_H2.FINI; },
};


/* ==================================================================
   LES VISITEURS
   ------------------------------------------------------------------
   Un appartement en pleine enquête, ce n'est pas un huis clos : des
   gens passent. Un voisin sonne, quelqu'un traverse, un livreur se
   trompe d'étage. La moitié n'a rien à dire ; l'autre moitié laisse
   tomber quelque chose de vrai.

   Le registre ci-dessous est fait pour grossir : un visiteur = un
   sprite, un nom, et ses répliques pour ne rien dire. Les répliques
   UTILES, elles, ne sont pas écrites d'avance — elles sont fabriquées
   à partir de l'affaire en cours, sinon un « indice » donné par un
   passant pourrait être faux.
================================================================== */

const VISITEUR_DELAI = [42, 78];    /* secondes entre deux visites */
const VISITEUR_UTILE = 0.45;        /* part de visites qui apprennent quelque chose */

/* Un visiteur peut avoir des répliques `lie` : elles ne sortent que si
   l'affaire en cours porte l'étiquette correspondante. C'est ce qui
   fait qu'un passant tombe parfois pile sur le sujet — et le reste du
   temps parle de sel. */
/* Un visiteur peut avoir des répliques `lie` : elles ne sortent que si
   l'affaire en cours porte l'étiquette correspondante. C'est ce qui
   fait qu'un passant tombe parfois pile sur le sujet — et le reste du
   temps parle de sel.

   Seuls des personnages écrits pour le jeu figurent ici. Les figurants
   pris dans la foule du niveau 1 ont été retirés : un passant sans
   histoire ne vaut pas la peine d'interrompre une enquête. */
const VISITEURS = [
  { id:"marini", nom:"MARINI, MAIRE DE COMPIÈGNE", sprite:"pers_marini", cote:-1, taille:0.98,
    banal:["Je passais serrer des mains. J'en ai serré deux cent quatorze aujourd'hui.",
           "Vous voterez, j'espère. On vote toujours, dans cet immeuble.",
           "Quatre-vingts ans et toutes mes dents. Enfin, la plupart."],
    lie:{
      officiel:["J'ai signé un papier ici, ce soir. Je signe beaucoup de papiers.",
                "Tout ce qui traîne dans un logement communal appartient un peu à la commune.",
                "Un buffet non déclaré, c'est un buffet saisi. La loi, c'est la loi.",
                "La demoiselle du couloir m'a ouvert. Charmante. Très charmante.",
                "J'ai passé un long moment à parler à la jeune femme. Un très long moment.",
                "Je ne me souviens pas de la pizza. Je me souviens très bien d'elle."],

      argent:["Cinq euros ? Dans ma commune, on ne se déplace pas pour moins.",
              "L'argent laisse toujours une trace. C'est bien le problème.",
              "Regardez qui a payé. Vous saurez qui a mangé."],
    } },
  { id:"mathilde", nom:"MATHILDE", sprite:"pers_mathilde", cote:-1, taille:0.96,
    banal:["Je cherche Thibaut. On m'a dit qu'il enquêtait. J'ai des doutes.",
           "Prof d'histoire. Je passe mes journées à reconstituer des trucs. Ça aide.",
           "J'ai couru dix kilomètres ce matin. Vous, vous avez couru après une pizza.",
           "Si vous ne trouvez rien, on fait une fête. Ça marche aussi."],
    lie:{
      /* Elle enseigne la méthode : sources, chronologie, recoupement.
         C'est la seule visiteuse qui parle de la FAÇON d'enquêter. */
      alcool:["Une soirée, ça se reconstitue comme une bataille : qui était où, et à quelle heure.",
              "Personne ne se souvient de rien après le deuxième verre. C'est documenté.",
              "J'ai vu la tournée passer. J'ai arrêté au premier, moi. Enfin, au deuxième.",
              "Cherchez qui a bu le moins. C'est lui qui se souvient — et c'est lui qui a mangé."],
      chat:["Ce chat a une tête de coupable, mais un chat n'a pas de mobile. Retenez ça.",
            "Il m'a regardée droit dans les yeux. Un innocent détourne le regard.",
            "Suivez les poils. Un animal laisse toujours son passage."],
    } },
  { id:"martin", nom:"MARTIN, AGENT DE SÉCURITÉ", sprite:"pers_martin", cote:1, taille:1.0,
    /* Tout le personnage tient dans l'écart entre ce qu'il dit et ce
       qu'il a l'air : un gamin mince au sac à dos qui annonce
       calmement qu'il fait la sécurité et qu'il a boxé. On ne corrige
       pas la contradiction, on l'écrit. */
    banal:["Je ne bois pas. Je ne mange pas en service. Je note.",
           "Vingt-deux entrées, dix-neuf sorties. Ça ne tombe jamais juste.",
           "J'ai boxé en amateur. Ça sert pour rester debout huit heures.",
           "Oui, c'est moi la sécurité. Non, je ne vais pas grandir.",
           "On me demande souvent ma carte d'identité. Je la sors avec le badge.",
           "Dans le sac ? Un carnet, deux stylos. Le reste, je le retiens."],
    lie:{
      securite:["J'étais en bas. J'ai noté tout le monde. Vous voulez le registre ?",
                "Une personne est descendue avec un carton plat. Je peux dire l'heure.",
                "Ma ronde est à {heure}, à la minute. Il n'y a pas eu d'exception ce soir."],
      porte:["La porte du bas ne se ferme pas seule. Quelqu'un l'a tenue.",
             "J'ai vu monter deux personnes. Je n'en ai vu redescendre qu'une.",
             "Les portes, c'est mon métier. Celle-ci a été ouverte de l'intérieur."],
      argent:["J'ai été comptable neuf ans. Un compte faux, ça se voit tout de suite.",
              "Il manque exactement trois parts. J'ai recompté.",
              "Cinq euros, c'est le prix d'une part et demie. C'est un remboursement partiel."],
    } },
  { id:"jojo", nom:"JOJO LE NAIN", sprite:"pers_jojo", cote:1, taille:1.0,
    banal:["Je tenais le bar de l'Entrepotes. Ce soir, c'est relâche.",
           "Francky met trop de sirop. Je le dis depuis dix ans.",
           "Ma femme m'attend en bas. Elle voit par-dessus les voitures."],
    lie:{
      plomberie:["Le siphon de l'évier, c'est moi qui l'ai posé. Il fuit encore ?",
                 "Quelqu'un a démonté sous l'évier. Et l'a remonté de travers.",
                 "Si ça a fui vers {heure}, on a forcément vidé le placard du bas."],
      hauteur:["Ma femme atteint les placards du haut sans monter sur rien.",
               "Ici, personne ne va là-haut sans tabouret. Sauf elle.",
               "Le placard du haut, c'est un cachette de grande personne."],
      alcool:["Ils sont passés chez moi après le D'Tour. Deux bars dans une soirée, ça se paie.",
              "Je sers, je ne juge pas. Mais là, j'ai jugé un peu.",
              "Le plus grand des deux ne se souvenait déjà plus de son prénom."],
    } },
  { id:"francky", nom:"FRANCKY, DU D'TOUR", sprite:"pers_francky", cote:-1, taille:1.02,
    banal:["Deux cocktails offerts. Vous les prenez maintenant ou après ?",
           "J'ai fermé plus tôt. Personne ne tenait debout.",
           "Le grand chauve, là, il m'en doit trois."],
    lie:{
      dodo:["Mon « bonne nuit les petits », c'est deux doses. Ce soir j'ai eu la main lourde.",
            "Ceux qui en boivent un ne se réveillent pas. C'est le principe.",
            "J'en ai servi un ici, vers {heure}. Après ça, plus personne n'a rien vu."],
      alcool:["Ils ont bu chez moi avant de monter. Beaucoup.",
              "Un cocktail comme le mien, ça efface une soirée entière.",
              "Vous voulez la vérité ? Demandez à quelqu'un qui n'a pas bu."],
    } },

];

const ETAT_V = { ABSENT:"ABSENT", ENTREE:"ENTREE", PARLE:"PARLE", SORTIE:"SORTIE" };

const Visiteurs = {
  etat:ETAT_V.ABSENT, qui:null, x:0, vise:0, dir:1, pas:0, chrono:0,
  prochain:0, comptes:0, utiles:0, dernier:null, dejaVus:[], vus:null, tournee:null,

  raz(){
    this.etat = ETAT_V.ABSENT; this.qui = null;
    this.comptes = 0; this.utiles = 0; this.dernier = null; this.dejaVus = [];
    this.composer();
    /* Chacun ne passe QU'UNE FOIS par partie : leur venue doit être un
       événement, pas une ronde. Quand ils sont tous passés, on n'en
       invente pas d'autres. */
    this.vus = {};
    this.prochain = hasard(VISITEUR_DELAI[0], VISITEUR_DELAI[1]);
  },

  /* La tournée du soir, décidée au lancement : tous ceux qui ont
     quelque chose à dire sur CETTE affaire, plus au plus un qui passait
     par là. Faire venir les quatre à chaque partie les transformait en
     ronde ; ainsi, chaque sonnerie a une raison d'être. */
  composer(){
    const marques = (Affaire.scenario && Affaire.scenario.tags) || [];
    const lies = VISITEURS.filter(v => v.lie && marques.some(t => v.lie[t]));
    const autres = VISITEURS.filter(v => lies.indexOf(v) < 0);
    const tournee = lies.slice();
    if (autres.length && Math.random() < 0.5) tournee.push(piocher(autres));
    if (!tournee.length && autres.length) tournee.push(piocher(autres));
    this.tournee = melangerTableau(tournee).map(v => v.id);
  },

  /* --------- ce qu'un passant peut savoir de vrai ---------
     Construit à partir de l'affaire en cours, jamais écrit d'avance :
     un passant qui invente serait pire que pas de passant du tout. */
  conseil(){
    const restants = Enquete.zones.filter(z => !z.fouillee && z.indice);
    const cle = SUSPECTS.find(x => x.id === Affaire.temoinCle());
    const choix = [];
    if (restants.length){
      const z = piocher(restants);
      choix.push("J'ai vu quelqu'un tourner autour de " + z.ref.nom + ".");
      choix.push("À votre place, je regarderais " + z.ref.nom + ".");
    }
    if (cle){
      /* Rien qui présume du genre : le témoin clé peut être n'importe
         lequel des quatre, chat compris. */
      choix.push("J'ai croisé " + cle.nom + " vers " + Affaire.faits.heure + ". Ça m'a marqué.");
      choix.push("Demandez à " + cle.nom + ". Il y a quelque chose qui cloche.");
    }
    if (Enquete.indices >= 3 && !Enquete.pizza){
      choix.push("Quelqu'un a fouillé " + Affaire.faits.ou + " avant vous.");
    }
    choix.push("Le livreur, c'était " + Affaire.faits.livreur + ". Il ne monte jamais.");
    return piocher(choix);
  },

  declencher(){
    if (this.etat !== ETAT_V.ABSENT || !Enquete.actif) return false;
    if (Enquete.dossierOuvert || Enquete.accusation || HortenseApp.visible()) return false;
    /* Rien ne s'invite tant qu'on parle : l'arrivée d'un visiteur au
       milieu d'un échange était la cause principale de confusion — trois
       bouches d'un coup, et on ne suivait plus rien. */
    if (Enquete.dialogueEnCours()) return false;
    if (!this.tournee) this.composer();
    const dispo = VISITEURS.filter(v => this.tournee.indexOf(v.id) >= 0 && !this.vus[v.id]);
    if (!dispo.length) return false;
    this.qui = piocher(dispo);
    this.vus[this.qui.id] = true;
    this.dernier = this.qui.id;
    this.dir = this.qui.cote >= 0 ? -1 : 1;         /* d'où il vient */
    this.x = this.dir > 0 ? -0.05 : 1.05;
    const chef = Enquete.actifIns();
    this.vise = borne(chef.x + this.dir * -0.085, 0.05, 0.95);
    this.etat = ETAT_V.ENTREE;
    this.comptes++;
    Sons.arrivee();
    return true;
  },

  parler(){
    this.etat = ETAT_V.PARLE;
    this.chrono = 2.6;
    /* Ordre de préférence : ce qui touche à l'affaire, puis ce qui
       aide, puis ce qui ne sert à rien. */
    const marques = (Affaire.scenario && Affaire.scenario.tags) || [];
    const liees = [];
    if (this.qui.lie){
      for (const tag of marques) if (this.qui.lie[tag]) liees.push.apply(liees, this.qui.lie[tag]);
    }
    let txt, utile = false;
    if (liees.length && Math.random() < 0.7){
      txt = remplir(piocher(liees)); utile = true;
    } else if (Math.random() < VISITEUR_UTILE){
      txt = this.conseil(); utile = true;
    } else {
      txt = remplir(piocher(this.qui.banal));
    }
    if (utile) this.utiles++;
    Enquete.direUn({ visiteur:true }, txt);
    /* Un des deux inspecteurs réagit, ce qui évite que la scène tombe
       à plat quand le passant ne sert à rien. */
    Enquete.dialogue([[Enquete.actifIdx, utile
      ? piocher(["Notez ça.", "Répétez ?", "Voilà qui aide."])
      : piocher(["Non.", "Ce n'est pas le moment.", "Merci. Au revoir."])]], 1.5);
  },

  majorer(dt){
    if (this.etat === ETAT_V.ABSENT){
      this.prochain -= dt;
      if (this.prochain <= 0){
        this.prochain = hasard(VISITEUR_DELAI[0], VISITEUR_DELAI[1]);
        this.declencher();
      }
      return;
    }
    switch (this.etat){
      case ETAT_V.ENTREE: {
        const r = this.vise - this.x;
        this.x += Math.sign(r) * Math.min(Math.abs(r), 0.26 * dt);
        this.pas += dt * 8;
        if (Math.abs(this.vise - this.x) < 0.004) this.parler();
        break;
      }
      case ETAT_V.PARLE:
        this.chrono -= dt;
        if (this.chrono <= 0){ this.etat = ETAT_V.SORTIE; this.dir = -this.dir; }
        break;
      case ETAT_V.SORTIE:
        this.x += this.dir * 0.30 * dt;
        this.pas += dt * 8;
        if (this.x < -0.07 || this.x > 1.07){ this.etat = ETAT_V.ABSENT; this.qui = null; }
        break;
    }
  },

  visible(){ return this.etat !== ETAT_V.ABSENT && !!this.qui; },
};

/* ================= InvestigationManager -> Enquete ================= */
const Enquete = {
  actif:false, restant:0, indices:0, fouilles:0, fausses:0, zones:[],
  inspecteurs:[], actifIdx:0, fini:null, secousse:0, message:null, messageT:0,
  messageDuree:1.6, dossierOuvert:false, accusation:false, choixAcc:0,
  pizza:null, esquiveOuverte:false, tarteRecue:false, tarteEsquivee:false,
  gele:0, badge:null, badgeT:0,

  /* Monter la scène ne lance pas la partie. L'introduction a besoin des
     deux inspecteurs pour les faire entrer à l'image, mais surtout pas
     du chrono ni des commandes. */
  monter(){
    Affaire.generer();
    Dossier.raz();
    HortenseApp.raz();
    Visiteurs.raz();
    composerSuspects();
    this.restant = ENQ_DUREE;
    this.indices = 0; this.fouilles = 0; this.fausses = 0;
    this.fini = null; this.secousse = 0; this.message = null;
    this.dossierOuvert = false; this.accusation = false; this.choixAcc = 0;
    this.pizza = null; this.esquiveOuverte = false;
    this.tarteRecue = false; this.tarteEsquivee = false;
    this.gele = 0; this.badge = null; this.badgeT = 0;
    this.dernier = null;
    this.actifIdx = 0;
    this.fileDial = []; this.dialCourante = null; this.dialT = 0;
    this.accusationsRestantes = ENQ_ACCUSATIONS;
    this.piecesVues = {};
    this.prochainBavardage = hasard(18, 30);
    this.pisteDite = false;

    this.zones = ZONES.map(z => ({
      ref:z, fouillee:false, indice:Affaire.plan[z.id] || null,
      cachette:z.id === Affaire.cachette, pulse:Math.random() * 6.28,
    }));
    /* Hors champ à gauche : c'est l'introduction qui les fait entrer. */
    this.inspecteurs = Heros.map((h, i) => ({
      heros:i, x:-0.06 - i * 0.05, dir:1, marche:0, pas:0, fouille:0, cible:-1, sale:0,
    }));
    this.actif = false;
    Camera.xEnq = 0;
  },

  /* Le chrono part ici, et pas avant. */
  lancer(){
    this.actif = true;
    this.restant = ENQ_DUREE;
  },

  demarrer(){
    this.monter();
    this.lancer();
  },

  /* Pendant l'introduction, l'enquête n'est pas encore montée : il n'y
     a pas d'inspecteurs. Renvoyer un sosie inoffensif plutôt que
     `undefined` évite qu'un simple affichage fasse tomber la boucle. */
  pretes(){ return this.inspecteurs.length === 2; },
  actifIns(){ return this.inspecteurs[this.actifIdx] || { heros:0, x:0.1, dir:1, marche:0, pas:0, fouille:0, cible:-1, sale:0 }; },
  autreIns(){ return this.inspecteurs[1 - this.actifIdx] || this.actifIns(); },
  estPF(ins){ return Heros[ins.heros].sprite === "pierre"; },
  changer(){ if (this.actif){ this.actifIdx = 1 - this.actifIdx; Sons.clic(); } },
  marcher(d){ if (this.actif && !this.dossierOuvert && !this.accusation) this.actifIns().marche = d; },
  dire(txt, duree){ this.message = txt; this.messageT = 0; this.messageDuree = duree || 1.8; },

  /* Une réplique après l'autre, cadencées par le chrono du jeu. Les
     empiler d'un coup les rendait illisibles ; un setTimeout les aurait
     laissées courir pendant le dossier. */
  /* `qui` est soit l'indice d'un inspecteur, soit { temoin:i } : la file
     sert aux deux, sinon la réponse d'un témoin aurait dû passer par un
     minuteur séparé. */
  /* Le temps de lire une réplique dépend de sa longueur : une cadence
     fixe faisait disparaître les longues avant qu'on les ait finies, et
     traîner les courtes. */
  /* Le plancher est passé de 2,2 s à 3,0 s : une réplique courte comme
     « Non. » disparaissait avant qu'on ait eu le temps de voir QUI
     l'avait dite. Le plafond monte aussi : une phrase longue se lit. */
  dureeLecture(txt){ return borne(2.0 + (txt ? txt.length : 0) * 0.060, 3.0, 6.4); },
  /* --------- le dialogue, une bulle à la fois ---------
     L'ancien système lâchait les répliques à l'échéance, plusieurs à la
     fois, et le calage les déplaçait à chaque image dès qu'une nouvelle
     arrivait : elles apparaissaient quelque part puis sautaient
     ailleurs, parfois loin de la bouche. Et quand un visiteur débarquait
     au milieu, on ne comprenait plus rien.
     Désormais : UNE bulle à l'écran, on tape pour la suivante, et rien
     ne s'invite tant que la file n'est pas vide. */
  dialogue(paires, delai){
    /* Le délai d'ouverture est ignoré : il datait du temps où les
       répliques partaient toutes seules. Il empêchait le compteur
       anti-double-tape d'avancer, donc bloquait le doigt. */
    void delai;
    this.fileDial = (this.fileDial || []).concat(
      paires.map(p => ({ qui:p[0], txt:p[1] })));
  },

  /* Une seule réplique, de n'importe qui : elle prend la file comme les
     autres. Rien ne doit court-circuiter la file, sinon deux bulles se
     retrouvent à l'écran et tout le bénéfice est perdu. */
  direUn(qui, txt){ this.dialogue([[qui, txt]], 0); },

  dialogueEnCours(){
    return !!(this.dialCourante || (this.fileDial && this.fileDial.length));
  },

  /* Appelé par le doigt et par le clavier. Rend true si quelque chose a
     bougé : l'appelant sait alors que le geste a servi à ça. */
  avancerDialogue(){
    if (!this.dialogueEnCours()) return false;
    /* 0,12 s : juste assez pour qu'un appui ne compte pas deux fois, pas
       assez pour qu'un tapement vif paraisse ignoré. À 0,25 s on avait
       l'impression que le décor ne répondait pas. */
    if (this.dialCourante && this.dialT < 0.12) return false;
    this.finirCourante();
    this.tirerSuivante();
    return true;
  },

  finirCourante(){
    if (!this.dialCourante) return;
    Effets.paroles = Effets.paroles.filter(p => p !== this.dialCourante.parole);
    this.dialCourante = null;
  },

  tirerSuivante(){
    if (!this.fileDial || !this.fileDial.length) return;
    const r = this.fileDial.shift();
    /* Deux formes de cible cohabitent : un INDEX d'inspecteur (0 ou 1,
       hérité de dialogue()) ou un OBJET déjà résolu ({heros}, {temoin},
       {visiteur}). Ne pas traiter la seconde faisait sauter en silence
       toutes les répliques posées par direUn — la question de
       l'inspecteur disparaissait et seule la réponse sortait. */
    const q = r.qui;
    const cible = (q && typeof q === "object")
      ? ((q.temoin !== undefined || q.visiteur || q.heros !== undefined) ? q : null)
      : (this.inspecteurs[q] ? { heros:this.inspecteurs[q].heros } : null);
    if (!cible) return this.tirerSuivante();
    /* Durée volontairement longue : c'est le doigt qui décide. Le
       compte à rebours ne sert que de filet, pour qu'une partie laissée
       en plan ne se bloque jamais. */
    /* Le filet, pour qui ne tape pas. À 2,6 fois le temps de lecture il
       durait jusqu'à seize secondes : trop long quand on a compris. */
    const filet = this.dureeLecture(r.txt) * 1.7;
    const parole = Effets.parole(cible, r.txt, filet);
    this.dialCourante = { r, parole };
    this.dialT = 0;
  },
  majDialogue(dt){
    if (this.dialCourante){
      this.dialT += dt;
      /* le filet : si personne ne tape, on avance quand même */
      if (Effets.paroles.indexOf(this.dialCourante.parole) < 0){
        this.dialCourante = null;
        this.tirerSuivante();
      }
      return;
    }
    this.tirerSuivante();
  },
  poserBadge(nom){ this.badge = nom; this.badgeT = 0; },

  /* --------- ce qui est à portée --------- */
  zoneProche(){
    const ins = this.actifIns();
    let meilleure = -1, dmin = ENQ_PORTEE;
    for (let i = 0; i < this.zones.length; i++){
      if (this.zones[i].fouillee) continue;
      const d = Math.abs(this.zones[i].ref.pied - ins.x);
      if (d < dmin){ dmin = d; meilleure = i; }
    }
    return meilleure;
  },
  suspectProche(){
    const ins = this.actifIns();
    let meilleur = -1, dmin = ENQ_PORTEE_GENS;
    for (let i = 0; i < SUSPECTS.length; i++){
      const d = Math.abs(SUSPECTS[i].x - ins.x);
      if (d < dmin){ dmin = d; meilleur = i; }
    }
    return meilleur;
  },

  /* --------- la pose d'un inspecteur ---------
     Elle se DÉDUIT de l'état, comme au niveau 3. Avant, trois poses
     seulement : marcher, fouiller, recevoir une tarte — et l'inspecteur
     était dessiné en train de marcher pendant qu'il interrogeait
     quelqu'un, immobile. */
  poseIns(i){
    const ins = this.inspecteurs[i];
    if (!ins) return "idle";
    if (ins.sale > 0) return "splat";
    if (this.esquiveOuverte) return "esquive";
    if (ins.fouille > 0) return "fouille";
    if (this.accusation) return "accuse";
    if (this.dossierOuvert) return "carnet";
    if (this.badge === "indice" && i === this.actifIdx) return "examine";
    /* qui parle prend la parole, l'autre écoute */
    const moi = Effets.paroles.some(p => p.cible.heros === ins.heros);
    if (moi) return "interroge";
    if (Effets.paroles.length) return "ecoute";
    if (ins.marche !== 0) return (Math.floor((ins.pas || 0) * 0.9) % 2) ? "marche2" : "marche1";
    return "idle";
  },

  /* --------- action contextuelle --------- */
  action(){
    if (this.esquiveOuverte) return this.esquiver();
    if (this.accusation) return this.valider();
    return this.inspecter();
  },
  inspecter(){
    if (!this.actif || this.gele > 0 || this.dossierOuvert) return false;
    const ins = this.actifIns();
    if (ins.fouille > 0) return false;
    const iz = this.zoneProche();
    if (iz >= 0){ ins.fouille = ENQ_FOUILLE; ins.cible = iz; ins.marche = 0; Sons.tarteVol(); return true; }
    /* On n'interroge PLUS ici : quand quelqu'un se tient devant un
       meuble, on ne savait pas ce que le bouton allait faire. Parler a
       sa propre commande. */
    this.dire("Aucun meuble à portée.", 1.2);
    return false;
  },

  resoudreFouille(ins){
    const z = this.zones[ins.cible];
    ins.fouille = 0;
    if (!z || z.fouillee){ ins.cible = -1; return; }
    const pf = this.estPF(ins);

    /* la cachette : la pizza n'apparaît que là, et pas avant trois indices */
    if (z.cachette){
      if (this.indices < 3){
        Enquete.direUn({ heros:ins.heros }, "Il y a quelque chose. Mais quoi ?");
        ins.cible = -1;
        return;
      }
      z.fouillee = true; this.fouilles++;
      this.pizza = { t:0, zone:ins.cible };
      this.gele = 0.15;
      this.poserBadge("pizza");
      Enquete.direUn({ heros:ins.heros }, "La voilà.");
      this.dialogue(Affaire.trouvaille(), 1.6);
      this.dire("Il reste à désigner qui. Bouton ACCUSER.", 3.2);
      Sons.tarteEsquive(); Sons.palier();
      ins.cible = -1;
      return;
    }

    if (z.indice){
      const ind = INDICES.find(i => i.id === z.indice);
      /* Symétrique de l'expertise : certaines choses ne parlent qu'à
         Thibaut, qui connaît les gens et les habitudes. Sans ça, on
         jouait tout le niveau avec Pierre-François. */
      if (ind.social && pf){
        this.fausses++;
        Enquete.direUn({ heros:ins.heros }, remplir(ind.analyse));
        this.dire("Thibaut connaît mieux la maison.", 2.0);
        Sons.bip(190, 0.16, "sine", 0.14, 130);
        ins.cible = -1;
        return;
      }
      if (ind.expert && !pf){
        /* Thibaut voit la chose sans la comprendre : l'indice reste à prendre */
        this.fausses++;
        Enquete.direUn({ heros:ins.heros }, remplir(ind.brut));
        this.dire("Pierre-François saurait quoi en faire.", 2.0);
        Sons.bip(190, 0.16, "sine", 0.14, 130);
        ins.cible = -1;
        return;
      }
      z.fouillee = true; this.fouilles++;
      this.indices++;
      Dossier.ajouter(ind, z.ref.nom);
      this.gele = 0.15;
      this.poserBadge("indice");
      /* On annonce ce qu'on a trouvé et où : sans le lieu, le dossier
         devient une liste d'objets sans enquête. */
      this.dernier = ind.nom + " — " + z.ref.nom;
      const annonce = remplir((pf && !ind.social) ? ind.analyse : ind.brut);
      Enquete.direUn({ heros:ins.heros }, annonce);
      /* Les indices porteurs se lisent dans CETTE affaire : les deux
         voix relient l'objet à l'histoire. Le garnissage garde son écho
         générique — une fausse piste ne mène nulle part, c'est le but. */
      const ded = Affaire.deduc(ind.id);
      if (ded) this.dialogue(ded, 1.2);
      else {
        const echo = ECHOS[ind.id];
        if (echo) this.dialogue([[1 - this.actifIdx, echo[pf ? 0 : 1]]], 1.2);
      }
      Sons.reussite(Math.min(7, this.indices));
      this.secousse = 0.25;
      /* Le raisonnement avance à voix haute : théorie de travers à deux
         indices, piste sérieuse à quatre. Entre les deux, on a le droit
         de se tromper — c'est même recommandé. */
      if (this.indices === 2){
        const h = Affaire.hypothese();
        if (h) this.dialogue(h, 1.0);
      }
      if (this.indices === 3) this.dire("Assez pour accuser. Mais où est la pizza ?", 2.8);
      else if (this.indices === 4 && !this.pisteDite){
        this.pisteDite = true;
        this.dialogue(Affaire.piste(), 1.0);
      }
    } else {
      z.fouillee = true; this.fouilles++;
      this.fausses++;
      const r = RIEN[z.ref.id];
      const lecture = remplir(r ? (pf ? r.pf : r.th) : "Rien.");
      Enquete.direUn({ heros:ins.heros }, lecture);
      Sons.bip(190, 0.16, "sine", 0.14, 130);
    }
    ins.cible = -1;
  },

  /* Commande « INTERROGER » : elle ne cherche que des gens. */
  parler(){
    if (!this.actif || this.gele > 0 || this.dossierOuvert) return false;
    const is = this.suspectProche();
    if (is < 0){ this.dire("Personne à portée.", 1.2); return false; }
    this.interroger(is);
    return true;
  },

  /* Le premier indice du dossier qu'on n'a pas encore opposé à cette
     personne. C'est ce qui fait qu'un interrogatoire n'est plus le même
     avant et après une fouille : on revient VOIR les gens. */
  confrontation(s){
    if (!s.confrontes) s.confrontes = {};
    const porteurs = Affaire.scenario.porteurs;
    const cartes = Dossier.cartes.map(c => c.id)
      .sort((a, b) => (porteurs.indexOf(b) >= 0) - (porteurs.indexOf(a) >= 0));
    for (const id of cartes){
      if (s.confrontes[id]) continue;
      const ind = INDICES.find(i => i.id === id);
      if (ind && ind.q) return ind;
    }
    return null;
  },

  interroger(is){
    const s = SUSPECTS[is];
    /* Le casting change à chaque partie : un indice de suspect gardé
       d'une partie à l'autre peut ne plus désigner personne. */
    if (!s) return false;
    const ins = this.actifIns();
    const pf = this.estPF(ins);
    const cle = s.id === Affaire.temoinCle();

    /* Thibaut oppose le dossier aux gens : chaque indice trouvé rouvre
       les entretiens, une fois par personne. L'innocent referme la
       piste ; le témoin clé s'enfonce d'un demi-aveu. Le premier
       passage reste à l'anecdote — c'est elle qui porte l'affaire — et
       le chat ne répond qu'aux sujets qui le concernent. */
    const conf = (!pf && s.id !== "chat" && s.tour > 0) ? this.confrontation(s) : null;
    if (conf){
      s.confrontes[conf.id] = true;
      s.vus++;
      const q = remplir(conf.q);
      Enquete.direUn({ heros:ins.heros }, q);
      Sons.bip(540, 0.08, "sine", 0.1);
      this.dialogue([[{ temoin:is }, remplir(cle ? conf.koR : conf.okR)]], 1.1);
      this.apresEntretien(s, is, pf, cle);
      return;
    }

    const sujet = s.sujets[s.tour % s.sujets.length];
    s.tour++;
    if (pf) s.vusPF++; else s.vus++;

    /* Question puis réponse, sur le MÊME sujet. Avant, les deux listes
       défilaient séparément : on demandait l'heure et on s'entendait
       répondre qu'il y avait deux pizzas. */
    const q = remplir(pf ? sujet.qPF : sujet.qTH);
    Enquete.direUn({ heros:ins.heros }, q);
    Sons.bip(pf ? 470 : 540, 0.08, "sine", 0.1);
    const reponse = pf ? sujet.pf : (s.coupable ? sujet.ko : sujet.ok);
    this.dialogue([[{ temoin:is }, remplir(reponse)]], 1.1);

    this.apresEntretien(s, is, pf, cle);
  },

  /* Tout ce qui suit une réponse, quel que soit le chemin qui y a mené :
     remarque de fond, provocation d'Hortense, nerfs, contradiction. */
  apresEntretien(s, is, pf, cle){
    /* Une remarque de fond au premier passage : ce qu'on voit, pas ce
       qu'on entend. Elle vaut pour les deux. */
    if (s.vus + s.vusPF === 1) this.dialogue([[1 - this.actifIdx, s.fond]], 1.0);

    /* Parler à la sœur d'Hortense revient à la prévenir. Elle le dit
       elle-même, pour qu'on comprenne ce qui va suivre. */
    if (s.id === "gabi" && HortenseApp.provoquer()){
      this.dialogue([[{ temoin:is }, piocher([
        "Je viens de prévenir ma sœur, au fait.",
        "Ma sœur adore ce genre d'histoires. Je lui envoie un message.",
        "Elle passait justement dans le quartier.",
      ])]], 1.0);
    }

    /* Le témoin clé craque par paliers : à trois indices il en dit trop,
       à cinq il ne tient plus. C'est le dossier qui parle, pas la
       question — les deux inspecteurs y ont droit. */
    if (cle){
      if (this.indices >= 5 && !s.nerf2){
        s.nerf2 = true; s.nerf1 = true;   /* le palier du dessous ne repassera pas après */
        const n = Affaire.nerfs(1);
        if (n) this.dialogue([[{ temoin:is }, n]], 1.2);
      } else if (this.indices >= 3 && !s.nerf1){
        s.nerf1 = true;
        const n = Affaire.nerfs(0);
        if (n) this.dialogue([[{ temoin:is }, n]], 1.2);
      }
    }

    if (pf){
      if (!s.gene){
        s.gene = true;
        this.dire(s.id === "gabi" ? "C'est sa belle-sœur. Thibaut ferait mieux."
                : s.id === "teo"   ? "C'est son ami. Thibaut ferait mieux."
                : "Thibaut poserait de meilleures questions.", 2.4);
      }
      return;
    }

    /* Assez d'indices en poche et la bonne personne en face : la
       contradiction saute aux yeux. Une seule fois. */
    if (this.indices >= 4 && cle && !s.coince){
      s.coince = true;
      this.dialogue([[this.actifIdx, Affaire.contradiction()]], 1.2);
      this.poserBadge("suspect");
      Sons.reussite(6);
    }
  },

  /* --------- dossier et accusation --------- */
  basculerDossier(){
    if (!this.actif) return;
    this.dossierOuvert = !this.dossierOuvert;
    if (this.dossierOuvert) this.accusation = false;
    Sons.clic();
  },
  /* Ce qu'il manque pour conclure, en clair. Le joueur ne doit pas
     avoir à deviner qu'il faut AUSSI avoir retrouvé la pizza. */
  peutConclure(){ return this.indices >= 3; },
  /* L'état du raisonnement, pour le dossier : la contradiction si elle
     est tombée, sinon la piste si elle est dite, sinon l'hypothèse de
     travers — le dossier raconte où en sont les têtes, pas seulement
     ce qu'il y a dans les poches. */
  theorie(){
    const coince = SUSPECTS.find(x => x.coince);
    if (coince) return ["« " + Affaire.contradiction() + " »", "— " + coince.nom + " n'a pas nié."];
    if (this.pisteDite) return Affaire.piste().map(p => "« " + p[1] + " »");
    if (this.indices >= 2){
      const h = Affaire.hypothese();
      if (h) return h.map(p => "« " + p[1] + " »");
    }
    return this.indices > 0 ? ["Trop tôt pour une théorie."] : [];
  },
  cePquiManque(){
    if (this.indices < 3) return "Il faut au moins trois indices.";
    if (!this.pizza) return "Il faut encore retrouver la pizza.";
    return null;
  },

  ouvrirAccusation(){
    if (!this.actif) return;
    if (this.indices < 3){ this.dire("Trois indices, au minimum.", 2.0); return; }
    this.accusation = true; this.dossierOuvert = false; this.choixAcc = 0;
    Sons.clic();
  },
  /* Toucher directement une ligne de la liste : sur un téléphone,
     naviguer avec deux flèches pour valider avec une troisième touche
     n'a aucun sens. */
  viserAccusation(fy){
    if (!this.accusation) return;
    const n = SUSPECTS.length + 1;
    const y0 = 0.30, pas = 0.10;
    const i = Math.round((fy - y0) / pas);
    if (i < 0 || i >= n) return;
    if (i === this.choixAcc){ this.valider(); return; }
    this.choixAcc = i;
    Sons.clic();
  },
  deplacerAccusation(d){
    if (!this.accusation) return;
    const n = SUSPECTS.length + 1;
    this.choixAcc = (this.choixAcc + d + n) % n;
    Sons.clic();
  },
  valider(){
    if (!this.accusation) return false;
    const rep = this.choixAcc < SUSPECTS.length ? SUSPECTS[this.choixAcc].id : "personne";
    this.accusation = false;
    if (rep !== Affaire.bonneReponse()){
      this.accusationsRestantes--;
      this.poserBadge("suspect");
      Sons.erreur();
      if (this.accusationsRestantes <= 0){
        /* Deux noms, pas trois : sans cette limite, on finissait par
           citer tout le monde jusqu'à tomber juste. */
        this.dialogue([[0, "On s'est trompés deux fois."], [1, "On ne nous laissera pas recommencer."]], 0.3);
        this.terminer(false);
        return false;
      }
      this.dire("Ça ne tient pas. Une seule autre chance.", 2.6);
      this.restant -= ENQ_MAUVAISE;
      return false;
    }
    if (!this.pizza){
      this.dire("Et la pizza, elle est où ?", 2.4);
      this.restant -= ENQ_MAUVAISE;
      return false;
    }
    this.terminer(true);
    return true;
  },

  recevoirTarte(i){
    this.tarteRecue = true;
    this.inspecteurs[i].sale = 3;
    this.restant -= ENQ_TARTE;
    this.secousse = 0.6;
    this.poserBadge("splat");
    this.dialogue([[i, "..."], [1 - i, "Ce n'est pas la pizza non plus."]], 0.8);
    Sons.tarteImpact();
  },
  esquiver(){
    if (!HortenseApp.esquiver()) return false;
    this.tarteEsquivee = true;
    Score.points += ENQ_ESQUIVE_PTS;
    this.poserBadge("esquive");
    this.dialogue([[this.actifIdx, "Encore elle."], [1 - this.actifIdx, "Ce n'est pas la pizza, ça."]], 0.6);
    Sons.tarteEsquive();
    /* En repartant, elle laisse tomber quelque chose. Le doute est
       permis ; la réponse, non. */
    if (!Affaire.hortenseFaite){
      const libres = this.zones.filter(z => !z.fouillee && !z.indice && !z.cachette);
      if (libres.length){
        piocher(libres).indice = "chorizo";
        Affaire.hortenseFaite = true;
        this.dire("Elle a fait tomber quelque chose.", 2.4);
      }
    }
    return true;
  },

  terminer(gagne){
    this.fini = { gagne, t:0 };
    this.actif = false;
    this.tempsPris = ENQ_DUREE - this.restant;
    if (gagne){
      Score.points += Math.round(this.restant * 8 + this.indices * 150);
      Sons.palier();
    } else Sons.fin();
    Jeu.phase = "fin";
    Jeu.finChrono = 0;
    Interface.sortirJeu();
  },

  /* --------- boucle --------- */
  pas(dt){
    if (this.fini){ this.fini.t += dt; return; }
    if (!this.actif) return;
    if (this.badge){ this.badgeT += dt; if (this.badgeT > 1.2) this.badge = null; }
    if (this.gele > 0){ this.gele -= dt; return; }
    if (this.pizza) this.pizza.t += dt;
    if (this.dossierOuvert || this.accusation){ Effets.majorer(dt); return; }

    this.restant -= dt;
    this.secousse = Math.max(0, this.secousse - dt * 2);
    if (this.message){ this.messageT += dt; if (this.messageT > this.messageDuree) this.message = null; }
    for (const z of this.zones) z.pulse += dt * 2.4;

    /* l'actif conduit, l'autre suit deux pas derrière */
    const chef = this.actifIns(), suit = this.autreIns();
    if (chef.marche !== 0 && chef.fouille <= 0){
      chef.x = borne(chef.x + chef.marche * ENQ_MARCHE * dt, 0.02, 0.98);
      chef.pas += Math.abs(chef.marche) * dt * 9;
      chef.dir = chef.marche;
    }
    const but = borne(chef.x - chef.dir * 0.048, 0.02, 0.98);
    const ecart = but - suit.x;
    if (Math.abs(ecart) > 0.006 && suit.fouille <= 0){
      const v = Math.sign(ecart) * Math.min(Math.abs(ecart), ENQ_MARCHE * 1.2 * dt);
      suit.x += v; suit.pas += Math.abs(v) * 9; suit.dir = Math.sign(v) || suit.dir;
    }

    for (const ins of this.inspecteurs){
      if (ins.fouille > 0){
        ins.fouille -= dt;
        if (ins.fouille <= 0) this.resoudreFouille(ins);
      }
      if (ins.sale > 0) ins.sale -= dt;
    }

    /* un mot en entrant dans une pièce, une seule fois */
    const piece = PIECES.find(p => chef.x < p.jusqua);
    if (piece && !this.piecesVues[piece.id]){
      this.piecesVues[piece.id] = true;
      if (this.fouilles > 0 || piece.id !== "entree") this.dialogue([[this.actifIdx, piece.ligne]], 0.2);
    }

    /* et de loin en loin, ils se parlent */
    this.prochainBavardage -= dt;
    if (this.prochainBavardage <= 0 && !(this.fileDial && this.fileDial.length)){
      this.prochainBavardage = hasard(22, 38);
      const k = entier(0, BAVARDAGES.length / 2 - 1) * 2;
      this.dialogue([BAVARDAGES[k], BAVARDAGES[k + 1]], 0);
    }
    this.majDialogue(dt);

    HortenseApp.majorer(dt);
    Visiteurs.majorer(dt);
    Camera.suivreEnq(chef.x, dt);

    if (this.restant <= 0){ this.restant = 0; this.terminer(false); }
    Effets.majorer(dt);
  },
};
