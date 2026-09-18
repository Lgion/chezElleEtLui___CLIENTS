# Génération de la Sprite Sheet CSS (Prestations & Produits)

Ce plan détaille la création d'une image sprite sheet unique en PNG regroupant l'ensemble des représentations visuelles des prestations et des produits phares, ainsi que son intégration via les CSS Sprites dans des carrés de 100x100 px pour chaque carte.

## User Review Required

> [!NOTE]
> **Structure de la Sprite Sheet (600x600 px) :**
> - **Grille régulière** : 6 colonnes × 6 lignes de cellules de **100×100 px**.
> - **Prestations (Lignes 0 à 4)** : Coiffure (tresses, tissages, coupes, soins) et Esthétique (visage, massages, onglerie, forfaits mariée).
> - **Produits phares (Ligne 5)** : Les 6 produits phares du salon (huiles, masque kératine, edge control, mèches, gommage, huile scintillante).
> - **Technique CSS Sprites** : Une seule requête HTTP pour charger l'image globale, et positionnement exact via `background-position: -Xpx -Ypx` sur un conteneur carré de `100px × 100px`.

---

## Proposed Changes

### 1. Génération & Assemblage de la Sprite Sheet

#### [NEW] [assets/img/sprites-catalog.png](file:///home/nihongo/Bureau/tests/chezElleEtLui___CLIENTS/assets/img/sprites-catalog.png)
- Génération des visuels thématiques (sans photos de téléphone personnelles) et assemblage automatisé via Python (Pillow) dans une feuille de sprites PNG de 600×600 px.
- Découpage précis en 36 cases de 100×100 px avec fond esthétique harmonisé au design system (tons or, terracotta, ambre, rose poudré et spa).

---

### 2. Styles CSS (`css/components.css`)

#### [MODIFY] [css/components.css](file:///home/nihongo/Bureau/tests/chezElleEtLui___CLIENTS/css/components.css)
- Création de la classe générique `.sprite-thumb` :
  - `width: 100px; height: 100px; border-radius: var(--radius-sm);`
  - `background-image: url('../assets/img/sprites-catalog.png');`
  - `background-size: 600px 600px;`
- Définition des coordonnées exactes pour chaque service (`.sprite-tresses-classiques`, etc.) et chaque produit (`.sprite-prod-huile-pousse`, etc.).
- Intégration ergonomique du carré de 100×100 px dans la structure des cartes de services et des cartes de produits phares.

---

### 3. Logique JavaScript & Données (`js/data/services.js`, `js/data/products.js`, `js/app.js`)

#### [MODIFY] [js/data/services.js](file:///home/nihongo/Bureau/tests/chezElleEtLui___CLIENTS/js/data/services.js) & [js/data/products.js](file:///home/nihongo/Bureau/tests/chezElleEtLui___CLIENTS/js/data/products.js)
- Ajout de la classe ou de l'index de sprite correspondant à chaque élément.

#### [MODIFY] [js/app.js](file:///home/nihongo/Bureau/tests/chezElleEtLui___CLIENTS/js/app.js)
- Rendu du conteneur sprite `<div class="sprite-thumb sprite-${service.id}"></div>` dans chaque carte de prestation.
- Rendu du conteneur sprite dans chaque carte de produit phare.
- Intégration du sprite dans la modale de détails.

---

## Verification Plan

### Automated / Browser Verification
1. **Génération de l'image** : Vérifier que le fichier `assets/img/sprites-catalog.png` est bien généré en PNG aux dimensions exactes 600×600 px.
2. **Affichage dans le navigateur** :
   - Vérifier que chaque carte de prestation affiche son carré de 100×100 px avec le bon sprite aligné au pixel près.
   - Vérifier que chaque produit phare affiche son carré de 100×100 px avec son visuel dédié.
   - Vérifier que la modale de détails s'ouvre avec le visuel approprié.
