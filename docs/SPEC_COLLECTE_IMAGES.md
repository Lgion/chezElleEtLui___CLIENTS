# SPÉCIFICATION TECHNIQUE — Collecte d'images web
**Projet :** Salon Elle & Lui (Abidjan Cocody) — catalogue produits, prestations & planches de modèles
**Version :** 1.0 — 28/10/2026
**Statut :** À valider avant exécution

---

## 0. Résumé exécutif

| Objectif | Livrable |
|---|---|
| A. Illustrer **6 produits** du catalogue (`js/data/products.js`) | 1 visuel final / produit (+ 2 alternatives) |
| B. Illustrer **~18 prestations coiffure** et **~12 prestations esthétique** (`js/data/services.js`) | 1 visuel final / prestation |
| C. Constituer des **planches de modèles** (10–20 coiffures par image) à proposer aux clientes | ~12 planches thématiques + banque de modèles unitaires |

**Principe directeur : on collecte pour *s'inspirer, référencer et présenter des modèles*, mais on ne republie sur le site que des images dont les droits sont clairs** (voir §2). La collecte « inspiration » (Instagram, Pinterest) est stockée en interne ; le site public n'affiche que des images **libres de droits, licenciées, autorisées par leur auteur, ou produites par le salon**.

---

## 1. Périmètre — éléments à illustrer

### 1.1 Produits (`PRODUCTS_DATA`)
| ID | Produit | Catégorie | Type d'image recherchée |
|---|---|---|---|
| `prod-huile-pousse` | Élixir croissance & antichute (ricin noir/chébé) | Capillaire | Flacon compte-gouttes ambré/verre, huile de ricin noir jamaïcain, ricin + graines de chébé |
| `prod-masque-keratine` | Masque réparateur kératine & karité | Soin Cheveux | Pot de masque crème + beurre de karité brut |
| `prod-edge-control` | Gel Edge Control Extra Hold | Coiffage | Pot edge control + brosse à baby hairs / lissage tempes |
| `prod-meches-bresiliennes` | Mèches & tissages Remy 12A | Mèches | Paquets/bottes de cheveux Remy (lisse, ondulé, bouclé) |
| `prod-gommage-corps` | Gommage café & sucre roux | Esthétique K.V.S | Pot de gommage café, grains, sucre roux |
| `prod-huile-scintillante` | Huile sèche fleur de Tiaré | Esthétique K.V.S | Flacon spray huile + fleurs de tiaré/monoï |

### 1.2 Prestations coiffure (`coiffure-tresses`, `coiffure-soins`)
Tresses classiques, Marcoussis, non coupées (longues), tissage simple / rajout / coupe stylisée, chignon de cérémonie (Shion), mise en forme, coup de peigne, shampoing + bain d'huile, shampoing + brushing, babyliss/rouleaux, défrisage (×2), coloration/balayage, coupe homme, coupe enfant.

### 1.3 Prestations esthétique (`esthetic-spa`, `esthetic-ongles`)
Soin visage éclat/détox, massage relaxant, massage amincissant (couverture chauffante), rituel corps complet, duo manucure/pédicure, vernis semi-permanent, faux ongles/capsules, faux cils, épilation.

> Les sprites actuels (`assets/img/sprites-catalog.png`, classes `.sprite-<id>`) restent **fallback** tant qu'une vraie photo n'est pas livrée.

---

## 2. Cadre juridique & éthique (non négociable)

### 2.1 Réalité du droit d'auteur
Toute photo publiée sur Instagram/Pinterest/Google est protégée par défaut. **Télécharger ≠ pouvoir republier.** Republier sans accord sur le site d'un commerce expose le salon à des réclamations (mise en demeure, retrait d'hébergeur).

### 2.2 Trois niveaux de statut — chaque image reçoit obligatoirement un statut

| Statut | Signification | Usage autorisé |
|---|---|---|
| 🟢 **PUBLIABLE** | Domaine public, CC0, licence Unsplash/Pexels/Pixabay, image achetée, image créée par le salon, **ou accord écrit** de l'auteur | Site web, flyers, réseaux sociaux du salon |
| 🟡 **À CLARIFIER** | Source identifiée, accord en cours de demande | Interne uniquement |
| 🔴 **INSPIRATION SEULE** | Image tierce sans licence (Instagram, Pinterest, site concurrent) | **Interne uniquement** : catalogue de choix en salon / référence pour reproduire le modèle sur de vraies clientes |

### 2.3 Règles de conduite
1. **Respect des CGU** : pas de scraping automatisé massif d'Instagram/Facebook (interdit, risque de blocage). La collecte Instagram se fait **manuellement/semi-manuellement** ou via les outils officiels (§4.2).
2. **Aucune image de mineur identifiable** sans accord parental ; privilégier les photos **sans visage** (nuque, dos, détails de tresses).
3. **Pas de faux témoignage** : ne jamais présenter une photo d'une autre enseigne comme *réalisation du salon*. Sur le site : légende « Modèle d'inspiration » ou « Exemples de coiffures disponibles ».
4. **Traçabilité** : chaque image garde sa source (URL, auteur, date, licence) dans le registre §6.
5. **Retrait rapide** : si un auteur le demande, suppression sous 48 h.
6. **Planches « 10 à 20 modèles »** composées d'images tierces = compilations : usage **salon uniquement** (impression/tablette de choix) sauf si toutes les images sont 🟢.

### 2.4 Voie royale recommandée : partenariats & contenu original
- **Demande d'autorisation (DM)** aux coiffeuses/créatrices ivoiriennes ciblées (modèle §8).
- **Séance photo au salon** : Blandine réalise chaque style sur modèles consentantes → bibliothèque 100 % propre (1 demi-journée = 40+ photos).
- **Banques gratuites** pour les produits (§3.1).

---

## 3. Sources de collecte

### 3.1 Banques d'images libres (🟢) — **priorité 1 pour les produits**
| Source | Licence | À chercher |
|---|---|---|
| Unsplash | Licence Unsplash (usage commercial OK) | « shea butter », « castor oil bottle », « coffee scrub », « hair oil », « afro hair braids » |
| Pexels | Licence Pexels | idem + « braids », « natural hair », « hair salon » |
| Pixabay | Licence Pixabay | idem |
| Wikimedia Commons | CC / domaine public (attribution à vérifier) | Types de tresses (documentaire) |
| Burst (Shopify) | Libre | Cosmétiques / produits de beauté |
| Nappy.co | Libre — **photos de personnes noires** | Coiffures afro, tresses, cheveux texturés |

### 3.2 Réseaux sociaux (🔴 INSPIRATION → 🟡 si accord)
**Instagram** — hashtags de départ (à enrichir) :
- Tresses / nattes : `#tressesafricaines`, `#braidstyles`, `#boxbraids`, `#knotlessbraids`, `#nattescollees`, `#cornrows`, `#vanilles`, `#fulanibraids`, `#tressesabidjan`, `#coiffureabidjan`, `#coiffureivoirienne`, `#salondecoiffureabidjan`
- Tissage : `#tissageabidjan`, `#tissagebresilien`, `#closure`, `#frontalwig`
- Ongles : `#onglerieabidjan`, `#nailartabidjan`, `#manucurecotedivoire`
- Spa : `#spaabidjan`, `#massageabidjan`, `#soinvisageabidjan`
- Géolocalisation : Cocody, Riviera, Angré, Deux-Plateaux, Marcory, Plateau.

**Pinterest** — tableaux « African braids », « Box braids », « Coiffures ivoiriennes », « Hairstyles for kids » (excellent pour les planches multi-modèles).

**TikTok / YouTube** — captures de tutoriels (inspiration seule).
**Facebook** — pages de salons d'Abidjan, groupes beauté Côte d'Ivoire.

### 3.3 Sites de commerces / marques
- **Fabricants/distributeurs** des produits réellement vendus : sur accord, utiliser **leurs visuels officiels** (packshots) — demander le « kit revendeur ».
- Salons de référence (Afrique de l'Ouest, diaspora) pour **repérer les tendances**.
- Marketplaces beauté (Jumia CI, Afrikrea) pour repérer le style des packshots équivalents.

> ⚠️ Un packshot trouvé sur un site e-commerce **n'est pas libre**. Ne l'utiliser sur le site qu'avec accord ; sinon s'en servir pour **identifier le produit** à photographier soi-même.

### 3.4 Création (🟢) — filet de sécurité
- **Photos au salon** (§2.4).
- **Packshots maison** : fond neutre beige, lumière fenêtre, smartphone → 6 produits en 1 h.
- **Illustrations IA** pour décor/ambiance : à étiqueter « illustration » si elles représentent un produit précis.

---

## 4. Méthodologie technique

### 4.1 Pipeline

```
[1 Découverte] → [2 Capture] → [3 Tri/Qualité] → [4 Dédup] → [5 Tag + registre]
      → [6 Statut juridique] → [7 Traitement] → [8 Intégration site / Planches]
```

### 4.2 Découverte & capture (par ordre de préférence)
1. **Banques libres** : recherche manuelle ou **API officielles** (Unsplash, Pexels, Pixabay — clés gratuites) → script de téléchargement avec métadonnées de licence automatiques.
2. **Instagram/Pinterest manuel assisté** : collections « Sauvegardés » classées (*Tresses*, *Tissage*, *Chignons*, *Enfants*, *Hommes*, *Ongles*).
3. **Instagram Graph API** : uniquement pour **le compte du salon** (HD de ses propres publications).
4. **Navigateur agent** : navigation assistée à vitesse humaine avec capture URL + source (pas de crawl massif).

**Interdit :** contournement login/anti-bot, scraping en masse, comptes privés, usurpation.

### 4.3 Requêtes de recherche (modèles)
```
Produits :
  "castor oil dropper bottle white background"
  "shea butter jar african"
  "coffee body scrub brown sugar jar"
  "dry oil spray bottle hawaiian flower"
  "hair edge control gel jar"
  "virgin remy hair bundles straight wavy curly"

Coiffures (ajouter "back view" pour éviter les visages) :
  "box braids medium waist length"     "knotless braids"
  "cornrows designs feed-in"           "fulani braids beads"
  "natte collée vanille"               "tresses marcoussis"
  "tissage brésilien closure"          "tissage avec rajout"
  "chignon mariage afro"               "coiffure enfant perles"
  "coupe dégradé homme afro"           "balayage honey cheveux crépus"
```
Par requête : **10–15 candidats**, **3 meilleurs** retenus par élément.

### 4.4 Grille de qualité (/10)

| Critère | Seuil | Points |
|---|---|---|
| Résolution | ≥ 1200 px grand côté (produits ≥ 1000×1000) | 2 |
| Netteté / lumière | Pas de flou ni surexposition | 2 |
| Cadrage | Sujet centré, fond propre | 2 |
| Cohérence charte | Tons chauds, dorés, noirs, bruns | 1 |
| Représentativité | Correspond exactement au produit/prestation | 2 |
| Absence de logo/filigrane tiers | Pas de watermark | 1 |

**Retenu si ≥ 7/10.** Rejeter : mineurs identifiables, nudité, logos concurrents, retouches irréalistes.

### 4.5 Dédoublonnage
Hash perceptuel (`imagehash`/pHash), distance ≤ 8 = doublon ; garder la meilleure résolution.

### 4.6 Arborescence & nomenclature

```
assets/img/catalogue/
├── produits/<id-produit>.webp
├── services/coiffure/<id-service>.webp
├── services/esthetique/<id-service>.webp
└── _thumbs/                      (400×400)

collecte/                          (HORS dépôt public — .gitignore)
├── brut/<source>/<date>/
├── inspiration/<style>/           🔴 usage interne
├── planches/
└── registre.csv
```
Nom : `<id-catalogue>[-variante].webp` (reprend les `id` de `products.js` / `services.js`).

---

## 5. Planches de modèles (10–20 coiffures / image)

### 5.1 Planches à produire
| # | Planche | Nb modèles |
|---|---|---|
| 1 | Box braids (longueurs/épaisseurs/couleurs) | 12–16 |
| 2 | Knotless & Goddess braids | 12 |
| 3 | Nattes collées / cornrows (feed-in, zig-zag, cœurs, géométriques) | 16 |
| 4 | Vanilles & twists | 12 |
| 5 | Tresses Marcoussis (fines) | 12 |
| 6 | Fulani / avec perles | 12 |
| 7 | Tissages & closures | 12 |
| 8 | Chignons de cérémonie / mariée | 12 |
| 9 | Coiffures enfants | 12 |
| 10 | Coiffures hommes | 12 |
| 11 | Couleurs & balayages | 12 |
| 12 | Ongles : nail art / semi-permanent | 16 |

### 5.2 Spécification
- Grille **4×3 (12)**, **4×4 (16)** ou **5×4 (20)**, cellules 1:1, gouttière 12 px, fond ivoire `#FAF7F2`.
- Chaque cellule **numérotée** (« Modèle n°7 ») → la cliente dit « je veux le 7 » ; champ *référence modèle* ajoutable au formulaire de RDV.
- Titre, logo Elle & Lui, prix « à partir de », QR WhatsApp.
- Formats : **A4 300 dpi** (impression), **1080×1350** (Instagram/WhatsApp), **WebP 1600 px** (site).
- **Statut de la planche = statut le plus restrictif de ses images** (une seule 🔴 → planche interne).
- Génération automatisable :

```bash
montage tresses/*.webp -tile 4x3 -geometry 400x400+12+12 -background "#FAF7F2" planche-box-braids.png
```

---

## 6. Registre de traçabilité (`collecte/registre.csv`)

| Champ | Exemple |
|---|---|
| `id_image` | `IMG-0042` |
| `fichier` | `box-braids-014.webp` |
| `destination` | `tresses-classiques` / `planche-01` |
| `source_type` | `unsplash` / `instagram` / `pinterest` / `salon` / `fournisseur` |
| `source_url` | URL exacte |
| `auteur` | `@compte` ou nom |
| `date_collecte` | `2026-10-29` |
| `licence` | `Unsplash` / `CC0` / `Aucune` / `Accord écrit` |
| `statut` | `PUBLIABLE` / `A_CLARIFIER` / `INSPIRATION` |
| `preuve_accord` | lien capture DM/email |
| `score_qualite` | `8` |
| `visage_visible` / `mineur` | `oui/non` |
| `notes` | |

---

## 7. Traitement & intégration au site

### 7.1 Traitement
1. Recadrage **4:3** (cartes services) ou **1:1** (produits).
2. Conversion **WebP** q80 → **< 120 Ko** par image.
3. Suppression EXIF (GPS, appareil).
4. Miniatures 400 px.
5. Étalonnage léger cohérent (chaleur, contraste).

### 7.2 Intégration (changements de code ultérieurs)
- Renseigner `image:` de chaque entrée de `products.js` / `services.js`.
- Dans `renderModalProducts()` / `renderModalServices()` : remplacer `<div class="sprite-thumb sprite-<id>">` par `<img loading="lazy" decoding="async" width height alt>` avec **fallback sprite** (`onerror`).
- `alt` descriptif en français.
- Section « Modèles de coiffures » alimentée **uniquement par les images 🟢**.

---

## 8. Modèle de message d'autorisation (DM / WhatsApp)

> Bonjour @compte 👋 Je suis [Nom], du **Salon Elle & Lui** à Cocody (Abidjan). Nous adorons vos réalisations ! Seriez-vous d'accord pour que nous présentions votre photo [lien] sur notre site/catalogue, avec **mention de votre compte** et lien vers votre profil ? Merci d'avance 🙏

Conserver la **capture de la réponse** comme `preuve_accord`.

---

## 9. Plan d'exécution

| Phase | Tâches | Durée | Sortie |
|---|---|---|---|
| P0 | Validation spec + stratégie légale | 0,5 j | Go |
| P1 | Produits : banques libres + contact fournisseurs | 1 j | 6 visuels 🟢 |
| P2 | Esthétique (spa, ongles, cils) | 1 j | ~12 visuels 🟢 |
| P3 | Coiffure : banques + Nappy/Pexels (« back view ») | 1,5 j | ~18 visuels |
| P4 | Veille Instagram/Pinterest → 300 images classées | 2 j | Banque 🔴 |
| P5 | Demandes d'accord (top 40) | 1 j + délais | Statuts 🟡→🟢 |
| P6 | Génération des 12 planches | 1 j | PDF/PNG |
| P7 | Séance photo salon (recommandée) | 0,5 j | 40+ visuels 🟢 |
| P8 | Traitement + intégration + QA | 1 j | Site mis à jour |

---

## 10. Critères d'acceptation

- [ ] 100 % des éléments du catalogue ont une image 🟢 (sinon fallback sprite).
- [ ] Aucune image 🔴/🟡 dans le dépôt public ni sur le site.
- [ ] Registre complet, aucun `source_url` vide.
- [ ] Images < 120 Ko, WebP, `alt` renseigné, `loading="lazy"`.
- [ ] Aucun mineur identifiable sans accord.
- [ ] 12 planches générées, numérotées, statut indiqué.
- [ ] LCP de la modale catalogue non dégradé (< 2,5 s en 4G).

---

## 11. Risques & mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| Réclamation de droits | Retrait / litige | Statuts §2, registre, retrait 48 h, priorité 🟢 |
| Blocage Instagram | Perte d'accès | Collecte manuelle, pas d'automatisation massive |
| Produit réel ≠ image générique | Tromperie client | Packshot maison/fournisseur ; alt honnête |
| Planches non représentatives | Attentes déçues | Mention « modèles d'inspiration » ; séance photo |
| Alourdissement du site | Performance | WebP, lazy, miniatures |

---

## 12. Décisions arrêtées & Impact opérationnel

Suite aux retours client du 28/10/2026 :

| Question initiale | Décision validée | Impact opérationnel direct |
|---|---|---|
| **1. Usage des images Instagram / web tiers** | **Strictement en interne** (tablette / catalogue papier en salon) | • Zéro risque juridique sur le site public.<br>• Pas besoin de solliciter de DM d'autorisation pour chaque photo de modèle.<br>• Le site public conserve des visuels 100 % libres (Unsplash, Pexels, Nappy.co, Pixabay) ou des fallbacks propres.<br>• Les dossiers de planches `collecte/planches/` restent hors du déploiement web public (inclus dans `.gitignore`). |
| **2. Noms des marques des 6 produits** | **Non spécifiées / Inconnues** | • Utilisation de packshots génériques neutres et esthétiques haute résolution (flacons ambrés, pots de karité/soin, crème, mèches en bottes) issus de banques libres.<br>• Visuels valorisants sans logos de marques tierces visibles, parfaitement raccord avec les descriptions du catalogue. |
| **3. Séance photo salon par le personnel** | **Non retenue comme dépendance** (oubli/réticence du personnel en pratique) | • Le projet est 100 % autonome et ne dépend d'aucune action photo requise sur place.<br>• Les planches de modèles et les fiches du site sont entièrement alimentées par la collecte web calibrée. |
| **4. Compte Instagram du salon** | **Aucun compte Instagram actif** | • Suppression du flux Instagram Graph API.<br>• Collecte ciblée par recherche ouverte (Pinterest, Instagram public via navigateur, banques libres spécialisées coiffures afro/beauté). |
| **5. Planches de modèles (12 thèmes)** | **Validées** | • Modèles numérotés de 1 à 12/16/20 par planche pour faciliter le choix de la cliente en salon (« Je veux le modèle N°7 »). |

---

## 13. Prochaine étape immédiate

1. **Phase Produits (P1)** : Collecte et intégration des 6 visuels neutres libres de droits pour les produits phares (`products.js`).
2. **Phase Planches d'inspiration interne (P6)** : Constitution de la première planche pilote « Tresses & Nattes » (12 modèles numérotés) prête à imprimer ou afficher sur tablette en salon.
