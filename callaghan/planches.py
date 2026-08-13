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
  silhouette : le halo se mélange au magenta et laisse une bavure rose.
- Style : bande dessinée aux couleurs franches, contours nets, éclairage
  neutre et identique pour toutes les poses.
- Personnage vu de TROIS QUARTS, tourné vers la DROITE, corps entier,
  de la tête aux pieds."""


def charger_fiches():
    """Les fiches de personnage vivent dans PERSONNAGES.md, pas ici : un
    physique décrit à deux endroits diverge — le t-shirt de BruHell a
    changé entre deux planches pour cette raison."""
    p = pathlib.Path(__file__).parent / "fiches.json"
    if not p.exists():
        return {}
    return json.loads(p.read_text(encoding="utf-8"))


def fabriquer(perso, mouvements):
    fiches = charger_fiches()
    if perso not in fiches:
        sys.exit(f"ABANDON : aucune fiche pour « {perso} ».\n"
                 f"Connus : {', '.join(sorted(fiches)) or 'aucun'}\n"
                 f"Les fiches sont dans callaghan/fiches.json.")
    f = fiches[perso]

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
    if any(MOUVEMENTS[m].get("cycle") for m in mouvements):
        avert = ("\n\nAVERTISSEMENT SUR LES CYCLES. Les phases d'une marche ou "
                 "d'une course doivent différer sur le BAS DU CORPS : ce n'est "
                 "pas la même jambe qui est devant d'une phase à l'autre. Une "
                 "planche où toutes les poses ont le même pied en avant est "
                 "INUTILISABLE — l'animation semble bloquée. Ne pas se "
                 "contenter de changer la position des bras.")

    return f"""Planche de {len(poses)} poses d'un même personnage, côte à côte
sur une seule rangée.

LE PERSONNAGE — identique sur toutes les poses, sans aucune variation de
vêtement, de coupe ou de corpulence :
{f['physique']}

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
    H, L, _ = a.shape
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    fond = (r > 150) & (b > 150) & (g < 120)

    print(f"{chemin}  {L}x{H}")
    soucis = []

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
    obj = ndimage.binary_opening(~fond, np.ones((5, 5)))
    colonnes = obj.any(axis=0)
    ruptures = np.diff(colonnes.astype(int))
    debuts = list(np.nonzero(ruptures == 1)[0] + 1)
    fins = list(np.nonzero(ruptures == -1)[0] + 1)
    if colonnes[0]: debuts.insert(0, 0)
    if colonnes[-1]: fins.append(L)
    blocs = [(d, f) for d, f in zip(debuts, fins) if f - d > L * 0.01]
    print(f"  poses détectées       {len(blocs)}"
          + (f" (attendu {attendu})" if attendu else ""))
    if attendu and len(blocs) != attendu:
        soucis.append(f"{len(blocs)} poses séparables au lieu de {attendu} : "
                      "deux poses se touchent, ou une pose est fragmentée")

    ecarts = [debuts[i+1] - fins[i] for i in range(len(blocs) - 1)]
    if ecarts:
        print(f"  écart minimal         {min(ecarts)} px (il faut 80)")
        if min(ecarts) < 80:
            soucis.append(f"deux poses ne sont séparées que de {min(ecarts)} px")

    # 4. les têtes font-elles la même taille ?
    hauts, pieds, tetes = [], [], []
    for d, f in blocs:
        col = obj[:, d:f]
        ys = np.nonzero(col.any(axis=1))[0]
        if not len(ys): continue
        hauts.append(ys.min()); pieds.append(ys.max())
        haut = col[ys.min():ys.min() + max(1, int((ys.max()-ys.min()) * 0.18))]
        larg = [row.sum() for row in haut]
        tetes.append(np.median(larg) if larg else 0)
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
        for d, f in blocs:
            col = obj[:, d:f]
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


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    cmd = sys.argv[1]
    if cmd == "prompt":
        if len(sys.argv) < 4:
            sys.exit("usage : planches.py prompt <personnage> <mouvement...>\n"
                     f"mouvements : {', '.join(sorted(MOUVEMENTS))}")
        print(fabriquer(sys.argv[2], sys.argv[3:]))
    elif cmd == "verifier":
        if len(sys.argv) < 3:
            sys.exit("usage : planches.py verifier <planche.png> [nombre de poses]")
        att = int(sys.argv[3]) if len(sys.argv) > 3 else None
        sys.exit(verifier(sys.argv[2], att))
    elif cmd == "mouvements":
        for k, v in sorted(MOUVEMENTS.items()):
            print(f"  {k:10s} {len(v['phases'])} phase(s)  {v['titre']}")
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
