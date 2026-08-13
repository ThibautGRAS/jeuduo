#!/usr/bin/env python3
"""planches.py — fabriquer et contrôler les planches d'images.

Deux commandes :

    python3 callaghan/planches.py prompt thibaut course marche
    python3 callaghan/planches.py verifier planche.png 6

POURQUOI CE SCRIPT EXISTE

Quatorze prompts étaient écrits à la main dans PROMPTS.md, chacun avec sa
propre copie des règles communes. Trois conséquences, toutes constatées :

- les règles DÉRIVENT. Un prompt rappelle l'espacement, le suivant
  l'oublie ; celui d'après invente une formulation différente.
- le vocabulaire de pose est réinventé à chaque planche. C'est ainsi
  qu'on s'est retrouvé avec deux poses de course ayant la MÊME jambe
  devant : personne n'avait écrit ce qu'était une phase de foulée.
- les contrôles se font à l'œil, après coup, souvent après découpage.

Ici, un prompt s'ASSEMBLE — règles + fiche du personnage + mouvements
choisis — exactement comme `index.html` s'assemble depuis `parts/`. On
n'écrit plus un prompt, on le demande. Et une planche livrée se contrôle
par une commande avant qu'on la découpe.
"""
import sys, pathlib, json

# ─────────────────────────────────────────────────────────────────────
# LE CATALOGUE DE MOUVEMENTS
#
# Un mouvement dit COMBIEN de phases il compte et ce que chaque phase
# montre. C'est le morceau qui manquait : sans définition écrite d'une
# phase, l'IA rend deux fois la même jambe devant, et on ne s'en aperçoit
# qu'en jouant.
#
# Règle de fond pour tout cycle : les phases doivent se distinguer sur le
# BAS DU CORPS, pas sur une nuance de bras. Une foulée qui alterne se
# vérifie sur la position des pieds.
# ─────────────────────────────────────────────────────────────────────
MOUVEMENTS = {
    "idle": {
        "titre": "au repos",
        "phases": ["debout, poids sur les deux pieds, bras le long du corps, "
                   "regard vers l'avant"],
    },
    "marche": {
        "titre": "marche",
        "cycle": True,
        "phases": [
            "jambe DROITE tendue devant, talon droit au sol, jambe gauche "
            "en arrière ; bras gauche en avant",
            "les deux jambes se croisent sous le corps, poids sur la droite ; "
            "bras presque le long du corps",
            "jambe GAUCHE tendue devant, talon gauche au sol, jambe droite "
            "en arrière ; bras droit en avant",
            "les deux jambes se croisent sous le corps, poids sur la gauche ; "
            "bras presque le long du corps",
        ],
    },
    "course": {
        "titre": "course",
        "cycle": True,
        "phases": [
            "jambe DROITE lancée loin devant, genou haut, jambe gauche "
            "tendue en arrière ; bras gauche en avant, coudes pliés",
            "suspension : les DEUX pieds décollés, jambes en train de se "
            "croiser sous le corps, buste penché en avant",
            "jambe GAUCHE lancée loin devant, genou haut, jambe droite "
            "tendue en arrière ; bras droit en avant, coudes pliés",
            "suspension inverse : les DEUX pieds décollés, jambes croisées, "
            "buste penché en avant",
        ],
    },
    "saut": {
        "titre": "saut",
        "phases": [
            "flexion : genoux pliés, buste en avant, bras en arrière, juste "
            "avant l'impulsion",
            "montée : jambes tendues vers le bas, bras levés, corps étiré",
            "sommet : genoux ramenés vers la poitrine",
            "réception : genoux fléchis, un pied touche le sol, bras écartés "
            "pour l'équilibre",
        ],
    },
    "roulade": {
        "titre": "roulade avant",
        "cycle": True,
        "phases": [
            "élan : course cassée, buste plongeant vers l'avant, une épaule "
            "en avant, bras tendu vers le sol",
            "contact : l'épaule touche, la tête est rentrée contre la "
            "poitrine, le dos s'arrondit, jambes encore tendues en arrière",
            "roulé : le corps est en boule, dos au sol, genoux repliés contre "
            "le torse, vu de côté — la tête est en bas et les pieds en haut",
            "sortie : un pied se pose, le buste se redresse encore penché, "
            "bras qui accompagnent le relevé",
        ],
    },
    "roulade_cote": {
        "titre": "roulade latérale (esquive)",
        "phases": [
            "détente sur le côté, jambes qui poussent, corps à l'horizontale",
            "épaule au sol, corps en boule sur le flanc",
            "relevé sur un genou, l'autre pied à plat, prêt à repartir",
        ],
    },
    "accroupi": {
        "titre": "accroupi",
        "phases": [
            "accroupi, talons au sol, avant-bras sur les genoux, tête haute",
            "accroupi en train de se relever, une main au sol",
        ],
    },
    "frein": {
        "titre": "arrêt brutal",
        "phases": ["talons plantés, buste rejeté en arrière, bras écartés, "
                   "chaussures qui dérapent"],
    },
    "touche": {
        "titre": "encaisse un coup",
        "phases": [
            "le buste part en arrière, tête rejetée, bras qui se lèvent",
            "plié en deux, mains sur le ventre",
        ],
    },
    "chute": {
        "titre": "chute",
        "phases": [
            "déséquilibre, un genou à terre, une main qui cherche le sol",
            "à plat sur le côté, immobile, membres relâchés",
        ],
    },
}

# ─────────────────────────────────────────────────────────────────────
# LES RÈGLES COMMUNES, à un seul endroit.
# Elles étaient recopiées dans chaque prompt et divergeaient.
# ─────────────────────────────────────────────────────────────────────
REGLES = """CONTRAINTES TECHNIQUES — elles priment sur tout le reste.

LA PLUS IMPORTANTE, ET LA PLUS SOUVENT RATÉE : L'ESPACEMENT.
Chaque pose doit être séparée de sa voisine par au moins 80 pixels de
fond VIDE. Un doigt pointé, un bras tendu, un coude, un pied de course,
un objet tenu : RIEN ne doit entrer dans la colonne d'à côté. Deux poses
qui se touchent, même par un seul doigt, ne peuvent pas être séparées
automatiquement, et toute la planche est à refaire.
Test à faire mentalement : entre deux poses voisines, peut-on tracer un
trait vertical du haut en bas de l'image sans jamais toucher un
personnage ? Si non, écarter davantage.
Dans le doute, ÉCARTER PLUS. Une planche trop aérée se découpe très bien.

AUCUNE POSE N'INTERAGIT AVEC SA VOISINE. Chaque pose est un personnage
SEUL, qui sera découpé en image indépendante. Si une pose tend la main,
brandit un objet ou s'adresse à quelqu'un, ce quelqu'un est INVISIBLE et
n'est pas dessiné — surtout pas la pose d'à côté. Deux poses qui se
répondent forment une illustration, et une illustration ne se découpe pas.

TOUTES LES POSES REGARDENT DU MÊME CÔTÉ : vers la DROITE. Aucune pose
retournée vers la gauche, aucune pose de face si les autres sont de trois
quarts. Le jeu retourne les images lui-même quand il en a besoin.

AUCUNE OMBRE PORTÉE AU SOL, aucune ellipse sombre sous les pieds : le jeu
dessine l'ombre lui-même, et celle de la planche viendrait s'y ajouter.

AUCUN TITRE, AUCUNE LÉGENDE, AUCUN NUMÉRO. Ni au-dessus des poses, ni en
haut de la planche. Le texte blanc laisse un halo qui se mélange au fond.

- Fond MAGENTA PUR uni #FF00FF sur toute l'image. Aucun dégradé, aucune
  ombre portée, aucun décor, aucun élément de mobilier, aucun sol
  dessiné, aucun cadre, aucune bordure.
- AUCUN TEXTE, aucun chiffre, aucune légende, aucun numéro de pose.
- Toutes les poses sur UNE SEULE RANGÉE horizontale, alignées.
- Au moins 80 pixels de fond magenta VIDE entre deux poses voisines.
  Aucune partie d'un personnage — bras tendu, jambe de course, objet
  tenu — ne doit entrer dans la colonne de sa voisine. On doit pouvoir
  tracer un trait vertical entièrement magenta entre deux poses.
- Au moins 60 pixels de magenta vide sur les QUATRE bords de l'image.
  Une lueur ou un vêtement coupé par le bord ne peut pas être détouré
  proprement.
- MÊME ÉCHELLE pour toutes les poses : la tête doit avoir exactement la
  même taille d'une pose à l'autre. C'est le défaut le plus fréquent.
- Les PIEDS de toutes les poses reposent sur la même ligne horizontale
  imaginaire, sauf pour les phases où le personnage est explicitement en
  l'air.
- Aucune lueur, aucun halo, aucun effet lumineux qui déborde de la
  silhouette. Mesuré sur une planche livrée : une bande rose de 15 à
  30 px de couleur (134, 58, 116) tout autour du sujet — du magenta
  délavé, que rien ne sait retirer puisqu'on ignore la couleur qui était
  dessous. Le bord doit être FRANC.
- Le fond magenta ne teinte RIEN. Aucun reflet rose ou violet sur la
  peau, les cheveux, les vêtements ou les contours : l'éclairage du
  personnage est neutre.
- Style : bande dessinée aux couleurs franches, contours nets, éclairage
  neutre et identique pour toutes les poses.
- Personnage vu de TROIS QUARTS, tourné vers la DROITE, corps entier,
  de la tête aux pieds."""


# ─────────────────────────────────────────────────────────────────────
# LES SCÈNES — un jeu de poses par niveau.
#
# Les mouvements ci-dessus sont génériques : ils valent pour n'importe
# quel personnage de n'importe quel jeu. Les SCÈNES, elles, disent ce
# dont un niveau précis a besoin, avec ses poses propres — attendre dans
# une file, fouiller un meuble, servir un verre.
#
# `costume` n'est renseigné que si le niveau habille le personnage
# AUTREMENT que la référence. C'est le cas du niveau 1, où les héros sont
# en tenue de rue. Sans cette possibilité, régénérer le niveau 1 depuis
# une référence du bar leur mettrait un polo dans la file d'attente.
# ─────────────────────────────────────────────────────────────────────
SCENES = {
  "n1": {
    "titre": "la file d'attente",
    "prefixe": {"thibaut": "thibaut", "pf": "pierre"},
    # SA PROPRE RÉFÉRENCE. Les héros y sont en tenue de rue — blouson
    # pour Thibaut, manteau pour PF. Tant que le niveau n'avait pas son
    # image, il fallait décrire ce costume par écrit et dire à la
    # référence du bar de ne pas faire foi sur les vêtements : deux
    # consignes qui se marchaient dessus. Une image par tenue est plus
    # simple et plus sûre qu'une bascule dans le texte.
    "ref": "-2",
    "poses": [
      ("idle", "debout, détendu, les bras le long du corps, léger sourire"),
      ("attente", "debout, les bras croisés, poids sur une jambe, l'air de "
                  "patienter depuis un moment"),
      ("marche", "un pas en avant, tranquille, bras relâchés"),
      ("regarde", "tourné de trois quarts, la tête pivotée vers le côté, "
                  "une main en visière au-dessus des yeux"),
      ("surpris", "sursaut : yeux écarquillés, sourcils hauts, épaules "
                  "remontées, mains ouvertes à hauteur de poitrine"),
      ("stress", "crispé : sourcils froncés, une main qui frotte la nuque, "
                 "poids déporté en arrière"),
      ("tendue", "tension maximale : poings serrés, mâchoire crispée, buste "
                 "penché en avant"),
      ("victoire", "les deux bras levés en V, tête en arrière, grand sourire, "
                   "un pied décollé du sol"),
      # ESQUIVE ET SPLAT MANQUAIENT. Le niveau 1 lance des tartes — le mot
      # y apparaît quarante-cinq fois — mais aucun sprite ne disait ce qui
      # arrive quand elle touche : le code affichait « surpris », la même
      # pose que pour l'esquive, la fin de partie et une interpellation.
      # Quatre situations sous une seule image. Le niveau 2, lui, a bien
      # ses deux poses.
      # LES DEUX GESTES DU NIVEAU, et c'est TOUT son jeu : saluer au bon
      # moment, ou tendre la main dans le vide. Le code les distingue
      # depuis toujours — `gesteHeros(h, "poignee")` et `"vide"` — mais
      # les deux s'affichaient avec « tendue », une pose de STRESS.
      # Réussir et rater donnaient donc la même image.
      # LE PARTENAIRE EST INVISIBLE, et il faut le DIRE. Écrit « serre la
      # main de quelqu'un hors cadre », le générateur a compris que ce
      # quelqu'un était la POSE VOISINE : il a dessiné les deux se serrant
      # la main, à six pixels l'une de l'autre, et retourné la seconde
      # vers la gauche. Deux poses inutilisables, et c'était ma formule.
      ("poignee", "le bras droit tendu vers la DROITE à hauteur de taille, "
                  "la main refermée en poignée de main, comme s'il serrait "
                  "une main qu'on NE VOIT PAS. Aucune autre personne, aucun "
                  "autre bras, aucune autre main dessinés. Sourire franc, "
                  "regard vers la droite"),
      # ATTENTION, COLLISION DE NOM : `vide` désigne ici une main tendue
      # que personne ne prend, et au niveau 3 un VERRE vide brandi. Deux
      # choses opposées sous un même mot. Les préfixes de fichier les
      # séparent — `thibaut_vide` et `bar_th_vide` — mais un humain qui
      # lit « vide » dans un prompt ne peut pas deviner lequel. D'où ce
      # rappel, et la description qui commence par ce qu'on voit.
      ("vide", "le même bras droit tendu vers la DROITE, mais main OUVERTE "
               "paume verticale, doigts détendus : personne ne l'a prise. "
               "Aucune autre personne dessinée. Épaules qui retombent, "
               "sourcils remontés au milieu, bouche pincée, léger recul du "
               "buste. La gêne, pas la colère."),
      ("esquive", "esquive vive : le buste se jette sur le côté, les deux "
                  "bras montent devant le visage, un pied décollé"),
      ("splat", "touché en pleine figure : tête rejetée en arrière, yeux "
                "fermés, bras écartés, un pas de recul, épaules remontées"),
    ],
    # DOUZE poses : deux planches de six. La coupure tombe entre les
    # attitudes d'attente et les gestes qui font le jeu.
    "scinder": 6,
  },
  "n2": {
    "titre": "l'enquête de l'appartement",
    "prefixe": {"thibaut": "enq_th", "pf": "enq_pf"},
    # LA TENUE DE POLICIER, partagée avec la ruelle. Les deux niveaux se
    # jouent dans la même soirée d'enquête : brassard, holster, manteau
    # pour PF, blouson pour Thibaut. Une seule image pour les deux, donc
    # aucun risque qu'ils divergent.
    "ref": "-3",
    # ONZE POSES, et c'est ce que le jeu consomme réellement. Le prompt
    # n'en demandait que cinq : il en oubliait six, dont l'esquive et le
    # splat, qui n'existent qu'ici. Une planche générée dessus aurait été
    # à moitié inutilisable, et on ne s'en serait aperçu qu'au découpage.
    #
    # Onze dépasse le maximum de neuf par planche : elles sont donc
    # SCINDÉES en deux, avec la même référence jointe aux deux.
    "poses": [
      ("idle", "debout, en alerte, le regard qui balaie la pièce"),
      ("marche1", "jambe DROITE tendue devant, talon au sol, jambe gauche "
                  "en arrière ; bras gauche en avant"),
      ("marche2", "jambe GAUCHE tendue devant, talon au sol, jambe droite "
                  "en arrière ; bras droit en avant"),
      ("fouille", "accroupi, une main qui ouvre un tiroir invisible devant "
                  "lui, l'autre en appui sur le genou"),
      ("examine", "debout, un petit objet tenu à hauteur des yeux entre le "
                  "pouce et l'index, sourcils froncés"),
      ("interroge", "de trois quarts, une main ouverte tendue devant lui à "
                    "hauteur de taille, comme pour poser une question"),
      ("ecoute", "debout, une main au menton, tête légèrement inclinée, "
                 "l'autre bras replié sous le coude"),
      ("carnet", "un carnet ouvert dans une main, un stylo dans l'autre, "
                 "regard baissé sur la page"),
      ("accuse", "bras tendu à l'horizontale, index pointé loin devant, "
                 "buste tourné dans le même sens, mâchoire serrée"),
      ("esquive", "accroupi en torsion, les deux bras croisés devant le "
                  "visage pour se protéger, un pied en arrière"),
      ("splat", "touché en pleine figure : tête rejetée en arrière, bras "
                "écartés, corps qui recule d'un pas"),
    ],
    # deux planches : le maximum est de neuf poses
    "scinder": 6,
  },
  "n3": {
    "titre": "la tournée du bar",
    "prefixe": {"thibaut": "bar_th", "pf": "bar_pf"},
    # QUATORZE POSES. Le prompt n'en demandait que neuf — les
    # déplacements — et ignorait TOUT ce qui touche au verre : attraper,
    # tenir, boire, vider, jeter, tituber. Or c'est le cœur du niveau :
    # la tournée consiste à boire ou à jeter. Une planche générée sur
    # l'ancien prompt n'aurait pas permis de jouer.
    #
    # `attrape → tient → boit → vide` est une SÉQUENCE : elle se lit
    # comme un geste continu, donc les quatre poses doivent s'enchaîner.
    "poses": [
      ("idle", "debout, détendu, les mains vides le long du corps"),
      ("marche1", "jambe DROITE tendue devant, talon au sol, jambe gauche "
                  "en arrière ; bras gauche en avant"),
      ("marche2", "les deux jambes se croisent sous le corps, poids sur la "
                  "droite ; bras presque le long du corps"),
      ("marche3", "jambe GAUCHE tendue devant, talon au sol, jambe droite "
                  "en arrière ; bras droit en avant"),
      ("marche4", "les deux jambes se croisent sous le corps, poids sur la "
                  "gauche ; bras presque le long du corps"),
      ("course1", "jambe DROITE lancée loin devant, genou haut, jambe gauche "
                  "tendue en arrière ; bras gauche en avant, coudes pliés"),
      ("course2", "suspension : les DEUX pieds décollés, jambes croisées "
                  "sous le corps, buste penché en avant"),
      # course3 et course4 N'EXISTENT PAS ENCORE en jeu : ce sont les deux
      # phases avec l'AUTRE jambe devant, sans lesquelles la foulée ne
      # peut pas alterner. Elles sont demandées ici pour qu'une seule
      # planche règle la question.
      ("course3", "jambe GAUCHE lancée loin devant, genou haut, jambe droite "
                  "tendue en arrière ; bras droit en avant, coudes pliés"),
      ("course4", "suspension inverse : les DEUX pieds décollés, jambes "
                  "croisées, buste penché en avant"),
      ("frein", "talons plantés, buste rejeté en arrière, bras écartés, "
                "chaussures qui dérapent"),
      # la séquence du verre, dans l'ordre
      ("attrape", "le bras tendu de côté vers un comptoir invisible, la main "
                  "qui se referme sur un verre à hauteur de taille, buste "
                  "légèrement penché"),
      ("tient", "debout, un verre plein tenu contre la poitrine, regard vers "
                "l'avant, l'autre main libre"),
      ("boit", "la tête rejetée en arrière, le verre porté aux lèvres et "
               "incliné, yeux fermés, coude haut"),
      # même nom qu'au niveau 1, sens opposé : voir la note là-bas
      ("vide", "le verre vide brandi à bout de bras au-dessus de l'épaule, "
               "grand sourire, l'autre poing serré"),
      ("jette", "en plein lancer : le bras part vers l'arrière puis se "
                "détend, le verre encore dans la main, buste tourné, "
                "grimace de dégoût"),
      ("titube", "ivre : les jambes écartées et molles, le buste qui part de "
                 "côté, un bras battant l'air pour l'équilibre, paupières "
                 "lourdes"),
    ],
    # SEIZE poses, donc deux planches. La coupure tombe entre le
    # déplacement et le verre : neuf d'un côté, sept de l'autre, et
    # chaque planche reste un ensemble cohérent qu'on peut juger d'un
    # coup d'œil.
    "scinder": 9,
  },
  "n4": {
    "titre": "la ruelle",
    "prefixe": {"thibaut": "ruel_th", "pf": "ruel_pf"},
    "ref": "-3",   # la même tenue de policier qu'au niveau 2
    # QUATORZE POSES. Le prompt n'en demandait que cinq : troisième niveau
    # de suite avec le même défaut, après le n2 (5 sur 11) et le n3
    # (9 sur 16). Elles sont tirées de POSES_RUEL_TH et POSES_RUEL_PF.
    #
    # Les deux héros n'ont PAS exactement les mêmes : Thibaut a `debout`,
    # `vise1`/`vise2` et `fumee` ; PF a `vise` tout court. Le prompt
    # demande l'union, et on prend ce dont on a besoin — une pose en trop
    # sur une planche ne coûte rien, une pose manquante coûte une
    # régénération.
    "poses": [
      ("debout", "debout derrière la barricade, arme le long du corps, "
                 "regard vers la droite"),
      ("vise", "de profil vers la DROITE, arme tendue à deux mains, bras "
               "alignés, buste légèrement penché en avant, œil dans la "
               "ligne de mire"),
      ("vise1", "même visée, l'arme un peu plus basse, épaules détendues"),
      ("vise2", "même visée, l'arme un peu plus haute, épaules remontées"),
      ("tir", "au moment du départ du coup : bras encore tendus, épaule "
              "remontée, mâchoire serrée, yeux plissés"),
      ("recul1", "le recul soulève l'avant-bras, le poignet casse vers le "
                 "haut, le buste part légèrement en arrière"),
      ("recul2", "recul maximal : l'arme pointe vers le haut, l'épaule est "
                 "rejetée, le pied arrière se cale"),
      ("fumee", "après le tir : l'arme retombe lentement, le bras se "
                "détend, le regard reste sur la cible"),
      ("arme1", "recharge, premier temps : l'arme ramenée contre la "
                "poitrine, une main qui saisit le chargeur"),
      ("arme2", "recharge, second temps : la main pousse le chargeur en "
                "place, le regard baissé sur l'arme"),
      ("baisse", "arme baissée le long de la cuisse, corps de trois quarts, "
                 "il souffle"),
      ("accroupi", "accroupi derrière un abri, arme ramenée contre la "
                   "poitrine, tête rentrée dans les épaules"),
      ("leve1", "début du relevé : un genou encore à terre, une main en "
                "appui sur l'abri"),
      ("leve2", "fin du relevé : presque debout, l'arme qui remonte vers "
                "la ligne de tir"),
    ],
    # quatorze poses : deux planches de sept, la coupure entre le tir et
    # ce qui l'entoure
    "scinder": 7,
  },
}


def charger_fiches():
    """Les fiches de personnage vivent dans PERSONNAGES.md, pas ici : un
    physique décrit à deux endroits diverge — le t-shirt de BruHell a
    changé entre deux planches pour cette raison."""
    p = pathlib.Path(__file__).parent / "fiches.json"
    if not p.exists():
        return {}
    return json.loads(p.read_text(encoding="utf-8"))


# ─────────────────────────────────────────────────────────────────────
# TROIS MODES, et ils correspondent à trois moments différents.
#
# Une description ÉCRITE est lossy par nature : elle est relue et
# réinterprétée à chaque planche. Le t-shirt de BruHell a changé entre
# deux planches pour cette raison, et rien dans le texte n'avait bougé.
# Une image de référence supprime cette réinterprétation.
#
# D'où la règle : le texte sert à créer, l'image sert à REPRODUIRE.
# ─────────────────────────────────────────────────────────────────────
MODES = {
    # Premier contact : le personnage n'existe pas encore en sprite.
    "texte": None,

    # Un visage réel à transposer. Le costume reste écrit, parce qu'une
    # photo de visage n'en dit rien.
    "photo": """RÉFÉRENCE DE VISAGE — l'image jointe est une photographie.

Reproduire fidèlement le VISAGE de cette photo : structure du crâne,
implantation et couleur des cheveux, forme du nez, des yeux, de la
bouche, pilosité. Le personnage dessiné doit être RECONNAISSABLE comme
cette personne.

Ne rien reprendre d'autre de la photo : ni le cadrage, ni les vêtements,
ni le fond, ni l'éclairage, ni l'expression. Le costume est décrit
ci-dessous et prime sur ce que porte la photo.

Traduire le visage dans le style dessiné décrit plus bas — ce n'est pas
un photomontage.""",

    # Même personne, AUTRE tenue. Le niveau 1 met les héros en tenue de
    # rue : la référence doit faire foi sur l'identité et sur rien
    # d'autre. Ce mode est écrit en entier plutôt que dérivé du suivant
    # par des remplacements de phrases — rapiécer de la prose produit des
    # textes qui se contredisent deux lignes plus bas, ce qui est
    # exactement arrivé.
    "poses_costume": """RÉFÉRENCE DE PERSONNAGE — l'image jointe montre ce personnage tel
qu'il existe déjà.

Elle fait FOI sur le VISAGE, la coupe de cheveux, la pilosité, la
corpulence et le style de dessin — trait, palette, éclairage. Reproduire
ces éléments à l'identique : une planche qui change la coupe d'une barbe,
la morphologie ou les traits est inutilisable, elle ne se raccorde pas
aux images déjà en jeu.

Elle ne fait PAS foi sur les VÊTEMENTS. Ce niveau habille le personnage
autrement, et le costume décrit ci-dessous remplace entièrement celui de
la référence — coupe, couleurs, chaussures comprises.

En dehors du costume et des poses, ne rien réinventer, ne rien
moderniser, ne rien « améliorer ».""",

    # Le cas le PLUS fréquent, et celui qui doit devenir le défaut : le
    # personnage existe déjà en jeu, on lui ajoute des poses.
    "poses": """RÉFÉRENCE DE PERSONNAGE — l'image jointe montre ce personnage tel
qu'il existe déjà.

Elle fait FOI sur tout ce qui le définit : visage, coupe de cheveux,
pilosité, corpulence, vêtements, couleurs, chaussures, accessoires, et
le style de dessin lui-même — trait, palette, éclairage.

Reproduire ces éléments à l'identique. Ne rien réinventer, ne rien
moderniser, ne rien « améliorer ». Une planche qui change la couleur d'un
vêtement ou la coupe d'une barbe est inutilisable : elle ne se raccorde
pas aux images déjà en jeu.

SEULES les poses décrites ci-dessous changent.

SI L'IMAGE DE RÉFÉRENCE EST SUR FOND MAGENTA : ce fond est un fond de
travail, rien d'autre. Il ne fait PAS partie du personnage. Ne pas en
tirer de lumière rose ou violette sur la peau, les cheveux, les
vêtements ou les contours. L'éclairage du personnage doit rester neutre,
identique à celui de la référence une fois le fond mis de côté.""",
}


def fabriquer(perso, mouvements, mode="texte"):
    """`perso` à None = un prompt commun, où seule l'image jointe change."""
    fiches = charger_fiches()
    if perso is not None and perso not in fiches:
        sys.exit(f"ABANDON : aucune fiche pour « {perso} ».\n"
                 f"Connus : {', '.join(sorted(fiches)) or 'aucun'}\n"
                 f"Les fiches sont dans callaghan/fiches.json.")
    f = fiches.get(perso, {})

    poses, details = [], []
    for m in mouvements:
        if m not in MOUVEMENTS:
            sys.exit(f"ABANDON : mouvement inconnu « {m} ».\n"
                     f"Connus : {', '.join(sorted(MOUVEMENTS))}")
        mv = MOUVEMENTS[m]
        for i, ph in enumerate(mv["phases"], 1):
            nom = f"{m}{i}" if len(mv["phases"]) > 1 else m
            poses.append(nom)
            details.append(f"{len(poses)}. [{nom}] {ph}")

    avert = ""
    if any(m in ("marche", "course") for m in mouvements):
        avert = ("\n\nAVERTISSEMENT SUR LES CYCLES. Les phases d'une marche ou "
                 "d'une course doivent différer sur le BAS DU CORPS : ce n'est "
                 "pas la même jambe qui est devant d'une phase à l'autre. Une "
                 "planche où toutes les poses ont le même pied en avant est "
                 "INUTILISABLE — l'animation semble bloquée. Ne pas se "
                 "contenter de changer la position des bras.")

    if mode not in MODES:
        sys.exit(f"ABANDON : mode inconnu « {mode} ». "
                 f"Connus : {', '.join(MODES)}")

    if mode == "texte":
        bloc = ("LE PERSONNAGE — identique sur toutes les poses, sans aucune "
                "variation de\nvêtement, de coupe ou de corpulence :\n"
                + f["physique"])
    elif mode == "photo":
        bloc = (MODES["photo"] + "\n\nLE COSTUME, qui prime sur la photo :\n"
                + f["costume"])
    else:
        # Avec une référence de poses, on ne REDÉCRIT PAS le personnage :
        # une description qui accompagne une image entre en concurrence
        # avec elle, et le générateur tranche au hasard. On se contente
        # d'un rappel court, formulé comme une confirmation.
        # PAS DE RAPPEL, ici non plus. Il avait été retiré des prompts de
        # héros une heure plus tôt, et laissé chez les méchants : une
        # correction appliquée à moitié laisse le défaut vivant là où on
        # n'a pas regardé.
        #
        # Conséquence : les cinq prompts de méchants deviennent identiques,
        # et un seul suffit — comme pour les héros.
        bloc = MODES["poses"]

    # AU-DELÀ DE NEUF POSES, LA QUALITÉ CHUTE. Une rangée trop longue
    # oblige le générateur à rétrécir chaque sujet, et les têtes cessent
    # d'être égales — le défaut le plus coûteux au découpage. On refuse
    # plutôt que de livrer une planche qu'on sait mauvaise.
    if len(poses) > 9:
        sys.exit(f"ABANDON : {len(poses)} poses demandées, 9 au maximum.\n"
                 f"Au-delà, le générateur rétrécit les sujets et les têtes "
                 f"cessent d'être égales.\nDemander deux planches, en "
                 f"joignant la MÊME référence aux deux.")

    # Le nom de la référence est ÉCRIT dans le prompt. Un personnage peut
    # en avoir plusieurs — une par tenue — et sans ce nom on ne sait pas
    # laquelle joindre.
    qui = perso or "<le personnage voulu>"
    ligne_ref = (f"Image de référence à joindre : reference/{qui}.png\n"
                 if mode == "poses" else "")

    return f"""Planche de {len(poses)} poses d'un même personnage, côte à côte
sur une seule rangée.
{ligne_ref}
{bloc}

LES POSES, de gauche à droite :
{chr(10).join(details)}
{avert}

{REGLES}"""


# ─────────────────────────────────────────────────────────────────────
# LE CONTRÔLE D'UNE PLANCHE LIVRÉE
#
# Trois des cinq contrôles de PROMPTS.md se faisaient à l'œil, après
# découpage. Ils se font ici en une commande, avant.
# ─────────────────────────────────────────────────────────────────────
def verifier(chemin, attendu=None):
    import numpy as np
    from PIL import Image
    from scipy import ndimage

    im = Image.open(chemin).convert("RGB")
    a = np.asarray(im).astype(int)

    # RECADRAGE AUTOMATIQUE. Les planches arrivent souvent en capture
    # d'écran, avec des bandes noires en haut et en bas. Sans ce
    # recadrage, tous les contrôles de bord et de proportion sont faux et
    # l'outil rejette une planche parfaitement bonne.
    r0, g0, b0 = a[..., 0], a[..., 1], a[..., 2]
    zone = (r0 > 110) & (b0 > 110) & (g0 < 130)
    if zone.any():
        ys, xs = np.nonzero(zone)
        if (ys.max() - ys.min() + 1) < a.shape[0] * 0.98:
            a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
            print(f"  (recadré sur le magenta : {a.shape[1]}x{a.shape[0]})")

    H, L, _ = a.shape
    r, g, b = a[..., 0], a[..., 1], a[..., 2]

    # LA COULEUR DU FOND SE MESURE, elle ne se suppose pas. Le magenta
    # d'une capture d'écran n'est pas #FF00FF : mesuré à (216, 2, 213) sur
    # une planche livrée. Le seuil en dur rejetait le fond comme du rose
    # parasite — 98 % du contour signalé sur une planche saine.
    coins = np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3),
                            a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)])
    fr, fg, fb = np.median(coins, axis=0)
    print(f"  fond mesuré           ({fr:.0f}, {fg:.0f}, {fb:.0f})")
    # est du fond ce qui est PROCHE de cette couleur
    fond = (np.abs(r - fr) < 42) & (np.abs(g - fg) < 42) & (np.abs(b - fb) < 42)

    print(f"{chemin}  {L}x{H}")
    soucis = []

    # 0. LE MAGENTA A-T-IL DÉTEINT SUR LE PERSONNAGE ? Mesuré une fois
    #    sur une planche livrée : une bande rose de (134, 58, 116) sur
    #    15 à 30 px autour du sujet. Elle n'est pas retirable — on ignore
    #    la couleur qui était dessous. Il faut donc la refuser AVANT
    #    découpage, pas la rattraper après.
    #    L'anneau se prend À L'EXTÉRIEUR du sujet, pas à l'intérieur : la
    #    bavure est DANS le fond, entre la silhouette et le magenta pur.
    #    Première version fautive, prise à l'intérieur : 0,2 % sur une
    #    planche volontairement rosie, contre 83 % avec le bon anneau.
    obj0 = ndimage.binary_opening(~fond, np.ones((5, 5)))
    bord_sujet = ndimage.binary_dilation(obj0, np.ones((13, 13))) & ~obj0
    if bord_sujet.sum() > 100:
        br, bg, bb = r[bord_sujet], g[bord_sujet], b[bord_sujet]
        # rose délavé : rouge et bleu dominent le vert, sans être du
        # magenta pur — celui-ci est le fond légitime
        # rose parasite = teinté magenta MAIS assez loin du fond pour ne
        # pas être le fond lui-même
        loin = (np.abs(br - fr) > 42) | (np.abs(bg - fg) > 42) | (np.abs(bb - fb) > 42)
        rose = ((br > bg + 25) & (bb > bg + 25) & loin).mean()
        print(f"  bord rosi             {rose*100:5.1f} % (il faut < 12)")
        if rose > 0.12:
            soucis.append(f"{rose*100:.0f} % du contour est rosi : le fond "
                          "magenta a déteint sur le sujet, ou une lueur "
                          "déborde. Rien ne sait le retirer.")

    # 1. le fond est-il bien magenta, et majoritaire ?
    part = fond.mean()
    print(f"  fond magenta          {part*100:5.1f} %")
    if part < 0.35:
        soucis.append("le fond magenta couvre moins de 35 % : mauvaise couleur "
                      "de fond, ou décor dessiné")

    # 2. les bords sont-ils libres ?
    m = 60
    bords = [fond[:m].mean(), fond[-m:].mean(), fond[:, :m].mean(), fond[:, -m:].mean()]
    pire = min(bords)
    print(f"  bords libres          {pire*100:5.1f} % (il faut ~100)")
    if pire < 0.985:
        soucis.append(f"un bord est occupé à {(1-pire)*100:.1f} % : "
                      "silhouette ou lueur coupée par le cadre")

    # 3. combien de poses, et sont-elles séparées ?
    #    ON DÉTECTE LES RANGÉES D'ABORD. Une planche de dix poses arrive
    #    souvent sur deux rangées de cinq. En cherchant les colonnes sur
    #    l'image entière, les sujets d'une rangée se superposent à ceux de
    #    l'autre et tout fusionne : mesuré, 3 blocs détectés au lieu de 10,
    #    et un écart de tête de 50 % qui n'existait pas.
    obj = ndimage.binary_opening(~fond, np.ones((5, 5)))
    lignes = obj.any(axis=1)
    dl = np.diff(lignes.astype(int))
    rd = list(np.nonzero(dl == 1)[0] + 1); rf = list(np.nonzero(dl == -1)[0] + 1)
    if lignes[0]: rd.insert(0, 0)
    if lignes[-1]: rf.append(H)
    rangees = [(d, f) for d, f in zip(rd, rf) if f - d > H * 0.10]
    if not rangees: rangees = [(0, H)]
    if len(rangees) > 1:
        print(f"  rangées               {len(rangees)}")

    blocs, ecarts = [], []
    for (ry, rfin) in rangees:
        bande = obj[ry:rfin]
        colonnes = bande.any(axis=0)
        ruptures = np.diff(colonnes.astype(int))
        debuts = list(np.nonzero(ruptures == 1)[0] + 1)
        fins = list(np.nonzero(ruptures == -1)[0] + 1)
        if colonnes[0]: debuts.insert(0, 0)
        if colonnes[-1]: fins.append(L)
        b2 = [(d, f) for d, f in zip(debuts, fins) if f - d > L * 0.01]
        for i in range(len(b2) - 1):
            ecarts.append(b2[i + 1][0] - b2[i][1])
        blocs += [(d, f, ry, rfin) for d, f in b2]
    print(f"  poses détectées       {len(blocs)}"
          + (f" (attendu {attendu})" if attendu else ""))
    if attendu and len(blocs) != attendu:
        soucis.append(f"{len(blocs)} poses séparables au lieu de {attendu} : "
                      "deux poses se touchent, ou une pose est fragmentée")

    if ecarts:
        print(f"  écart minimal         {min(ecarts)} px (il faut 80)")
        if min(ecarts) < 80:
            soucis.append(f"deux poses ne sont séparées que de {min(ecarts)} px")

    # 4. les têtes font-elles la même taille ?
    hauts, pieds, tetes = [], [], []
    for d, f, ry, rfin in blocs:
        col = obj[ry:rfin, d:f]
        ys = np.nonzero(col.any(axis=1))[0]
        if not len(ys): continue
        hauts.append(ys.min()); pieds.append(ys.max())
        # LA LARGEUR DU CRÂNE, pas la largeur du haut de l'image. Prendre
        # la médiane des 18 % supérieurs comptait un BRAS LEVÉ comme une
        # tête : mesuré, 32 % d'écart signalé sur une planche dont les
        # hauteurs allaient de 440 à 453 px — donc parfaitement à
        # l'échelle. On mesure le plus long segment CONTINU de chaque
        # ligne : un bras tendu à côté du crâne forme un segment séparé.
        haut = col[ys.min():ys.min() + max(1, int((ys.max() - ys.min()) * 0.14))]
        runs = []
        for row in haut:
            best = cur = 0
            for v in row:
                cur = cur + 1 if v else 0
                if cur > best: best = cur
            if best: runs.append(best)
        tetes.append(np.median(runs) if runs else 0)
    if len(tetes) > 1:
        ecart = (max(tetes) - min(tetes)) / max(1, max(tetes))
        print(f"  écart de taille de tête {ecart*100:5.1f} % (il faut < 12)")
        if ecart > 0.12:
            soucis.append(f"les têtes varient de {ecart*100:.0f} % : "
                          "poses à des échelles différentes")
    if len(pieds) > 1:
        dp = max(pieds) - min(pieds)
        print(f"  ligne des pieds       {dp} px d'écart (il faut < 5 % de la hauteur)")
        if dp > H * 0.05:
            soucis.append(f"les pieds sont désalignés de {dp} px")

    # 5. POUR UN CYCLE : les jambes alternent-elles ?
    if len(blocs) >= 2:
        avants = []
        for d, f, ry, rfin in blocs:
            col = obj[ry:rfin, d:f]
            ys = np.nonzero(col.any(axis=1))[0]
            if not len(ys): continue
            hh = ys.max() - ys.min() + 1
            torse = col[ys.min():ys.min() + int(hh * 0.35)]
            ty, tx = np.nonzero(torse)
            bas = col[ys.max() - int(hh * 0.14):ys.max() + 1]
            by, bx = np.nonzero(bas)
            if not len(tx) or not len(bx): continue
            avants.append(bx.mean() - tx.mean())
        if avants:
            memes = all(x > 0 for x in avants) or all(x < 0 for x in avants)
            print(f"  décalage pied/torse   {[round(x) for x in avants]}")
            if memes and len(avants) >= 3:
                soucis.append("TOUTES les poses ont le même pied en avant : "
                              "si c'est un cycle de marche ou de course, "
                              "l'animation semblera bloquée")

    print()
    if soucis:
        print(f"{len(soucis)} PROBLÈME(S) — ne pas découper avant correction :")
        for s in soucis: print(f"  - {s}")
        return 1
    print("planche conforme, elle peut être découpée")
    return 0


def fabriquer_scene(niveau, perso=None, part=None):
    """Le prompt d'un niveau. `perso` à None = le prompt commun aux deux
    héros, qui ne diffèrent que par l'image jointe.

    Un niveau demande soit des poses qui lui sont propres — attendre dans
    une file, fouiller un meuble — soit des mouvements du catalogue. Les
    deux passent par la même fabrique, donc par les mêmes règles."""
    sc = SCENES[niveau]
    if "mouvements" in sc:
        details, n = [], 0
        for m in sc["mouvements"]:
            for i, ph in enumerate(MOUVEMENTS[m]["phases"], 1):
                n += 1
                nom = f"{m}{i}" if len(MOUVEMENTS[m]["phases"]) > 1 else m
                details.append(f"{n}. [{nom}] {ph}")
        cycle = any(MOUVEMENTS[m].get("cycle") and m in ("marche", "course")
                    for m in sc["mouvements"])
    else:
        poses = sc["poses"]
        # SCINDÉE : au-delà de neuf poses, deux planches. La même
        # référence est jointe aux deux, c'est ce qui les raccorde.
        coupe = sc.get("scinder")
        if coupe and part:
            poses = poses[:coupe] if part == 1 else poses[coupe:]
        details = [f"{i}. [{nom}] {d}" for i, (nom, d) in enumerate(poses, 1)]
        cycle = any(nom.startswith(("marche", "course")) for nom, _ in poses)

    cost = (sc.get("costume") or {}).get(perso) if perso else None
    if cost:
        ident = (MODES["poses_costume"]
                 + "\n\nLE COSTUME DE CE NIVEAU, qui remplace celui de la "
                   "référence :\n" + cost)
    else:
        # PAS DE RAPPEL ÉCRIT. Il venait de la fiche du personnage, qui
        # décrit UNE tenue — celle du bar. Le niveau 1 joint la référence
        # en tenue de rue : le rappel contredisait donc son image, ce qui
        # est exactement le défaut qu'une référence est censée supprimer.
        #
        # Conséquence heureuse : le texte devient IDENTIQUE pour les deux
        # héros, et un seul prompt par niveau suffit.
        ident = MODES["poses"]

    avert = ""
    if cycle:
        avert = ("\n\nAVERTISSEMENT SUR LES CYCLES. Les phases d'une marche ou "
                 "d'une course doivent différer sur le BAS DU CORPS : ce n'est "
                 "pas la même jambe qui est devant d'une phase à l'autre. Une "
                 "planche où toutes les poses ont le même pied en avant est "
                 "INUTILISABLE — l'animation semble bloquée.")

    suff = sc.get("ref", "")
    # Le personnage n'apparaît plus que dans le nom du fichier à joindre :
    # un seul prompt sert donc aux deux héros.
    qui = "<thibaut ou pf>" if perso is None else perso
    if len(details) > 9:
        sys.exit(f"ABANDON : {len(details)} poses pour {niveau}/{perso}. "
                 f"Ajouter « scinder » à la scène.")
    surtitre = ""
    if sc.get("scinder") and part:
        surtitre = (f"\nPlanche {part} sur 2 — joindre la MÊME image de "
                    f"référence aux deux, c'est ce qui les raccorde.")
    return f"""Planche de {len(details)} poses d'un même personnage, côte à côte
sur une seule rangée.

Scène : {sc['titre']}.{surtitre}
Image de référence à joindre : reference/{qui}{suff}.png

{ident}

LES POSES, de gauche à droite :
{chr(10).join(details)}
{avert}

{REGLES}"""


def tout():
    """Régénère TOUT : références et prompts, pour tous les niveaux.

    C'est la commande qui donne son intérêt à l'organisation. Le jour où
    une image de référence change — un personnage redessiné, un style
    resserré — on relance ceci et les quatre niveaux repartent alignés
    sur elle. Sans ça, il faudrait se souvenir de quels prompts la
    citaient."""
    base = pathlib.Path(__file__).parent / "prompts"
    for niveau, sc in SCENES.items():
        d = base / niveau
        d.mkdir(parents=True, exist_ok=True)
        for f in d.glob("*.txt"): f.unlink()
        # UN SEUL PROMPT PAR NIVEAU. Les deux héros partageaient un texte
        # identique à deux lignes près, dont une qui était fausse. Ce qui
        # les distingue est l'IMAGE jointe, pas le texte.
        if sc.get("scinder"):
            for part in (1, 2):
                (d / f"heros-{part}.txt").write_text(
                    fabriquer_scene(niveau, None, part), encoding="utf-8")
        else:
            (d / "heros.txt").write_text(
                fabriquer_scene(niveau, None), encoding="utf-8")
    # les méchants n'appartiennent qu'à la ruelle
    d = base / "n4"
    for f in d.glob("mechant_*.txt"): f.unlink()
    (d / "mechants.txt").write_text(
        fabriquer(None, ["course", "touche", "chute"], "poses"), encoding="utf-8")
    # les mouvements de réserve : un prompt commun aux deux héros, comme
    # partout ailleurs. Ils n'étaient dupliqués que parce que le rappel
    # écrit les distinguait — et il n'existe plus.
    sup = base / "sup"
    sup.mkdir(parents=True, exist_ok=True)
    for f in sup.glob("*.txt"): f.unlink()
    (sup / "saut.txt").write_text(fabriquer(None, ["saut"], "poses"), encoding="utf-8")
    (sup / "roulades.txt").write_text(
        fabriquer(None, ["roulade", "roulade_cote"], "poses"), encoding="utf-8")

    ref = base / "reference"
    ref.mkdir(exist_ok=True)
    for perso in ["thibaut", "pf", "depar", "dsk", "jubi", "abbe", "bruh"]:
        try: reference(perso, ref)
        except SystemExit: print(f"  (aucun sprite pour {perso})")
    n = len(list(base.rglob("*.txt")))
    print(f"\n{n} prompts et {len(list(ref.glob('*.png')))} références régénérés")


def reference(perso, dossier=None):
    """Fabrique l'image de référence à joindre au prompt : deux ou trois
    poses du personnage TELLES QU'ELLES SONT EN JEU, sur fond neutre.

    Elle est fabriquée et non choisie à la main pour une raison précise :
    la référence doit montrer le personnage comme le jeu l'affiche
    aujourd'hui, pas comme une planche d'origine le montrait. Entre les
    deux, il y a eu des redécoupages et des corrections de sprites."""
    from PIL import Image
    racine = pathlib.Path(__file__).parent / "img"
    # on cherche le personnage là où il vit, dans l'ordre de préférence
    candidats = []
    # `sous` et non `dossier` : la boucle écrasait le PARAMÈTRE du même
    # nom, et la fonction écrivait ensuite dans « n4/thibaut.png ». Une
    # variable de boucle qui porte le nom d'un paramètre est un piège muet.
    for sous, prefixe, poses in (
            ("n3", f"bar_{'th' if perso == 'thibaut' else perso}", ["idle", "marche1", "attrape"]),
            ("n4", f"enn_{perso}", ["run1", "run3", "arret"]),
            ("n4", f"ruel_{'th' if perso == 'thibaut' else perso}", ["vise1", "vise", "tir"])):
        trouve = [racine / sous / f"{prefixe}_{po}.webp" for po in poses]
        trouve = [f for f in trouve if f.exists()]
        if len(trouve) >= 2:
            candidats = trouve[:3]; break
    if not candidats:
        sys.exit(f"ABANDON : aucun sprite trouvé pour « {perso} ». "
                 "Un personnage qui n'existe pas encore se demande en mode "
                 "`photo` ou `texte`.")

    ims = [Image.open(f).convert("RGBA") for f in candidats]
    h = max(i.height for i in ims)
    marge = int(h * 0.10)
    L = sum(i.width for i in ims) + marge * (len(ims) + 1)
    # fond gris neutre : ni magenta (qu'on ne veut pas voir recopié),
    # ni blanc (qui écrase les vêtements clairs)
    out = Image.new("RGB", (L, h + marge * 2), (128, 128, 132))
    x = marge
    for i in ims:
        out.paste(i, (x, marge + h - i.height), i)
        x += i.width + marge
    dst = (dossier or (pathlib.Path(__file__).parent / "prompts")) / f"{perso}.png"
    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst, "PNG", optimize=True)
    print(f"  {dst}  {out.size[0]}x{out.size[1]}  "
          f"({len(ims)} poses : {', '.join(f.stem for f in candidats)})")
    return dst


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    cmd = sys.argv[1]
    if cmd == "prompt":
        if len(sys.argv) < 4:
            sys.exit("usage : planches.py prompt <personnage> <mouvement...>\n"
                     f"mouvements : {', '.join(sorted(MOUVEMENTS))}")
        args = [a for a in sys.argv[3:] if not a.startswith("--")]
        mode = "texte"
        for a in sys.argv[3:]:
            if a.startswith("--mode="): mode = a[7:]
        print(fabriquer(sys.argv[2], args, mode))
    elif cmd == "verifier":
        if len(sys.argv) < 3:
            sys.exit("usage : planches.py verifier <planche.png> [nombre de poses]")
        att = int(sys.argv[3]) if len(sys.argv) > 3 else None
        sys.exit(verifier(sys.argv[2], att))
    elif cmd == "tout":
        tout()
    elif cmd == "reference":
        if len(sys.argv) < 3:
            sys.exit("usage : planches.py reference <personnage>")
        reference(sys.argv[2])
    elif cmd == "mouvements":
        for k, v in sorted(MOUVEMENTS.items()):
            print(f"  {k:10s} {len(v['phases'])} phase(s)  {v['titre']}")
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
