/**
 * Produits phares vendus au Salon Elle & Lui (Abidjan Cocody)
 * Capillaires & Cosmétiques sélectionnés par Blandine et Judith.
 */

const PRODUCT_SUBCATEGORIES = [
  { id: 'all', name: 'Tous les produits', image: 'assets/img/blandine-coiffure.jpg' },
  { id: 'prod-capillaire', name: 'Soins Capillaires', image: 'assets/img/coiffure-postes.jpg' },
  { id: 'prod-meches', name: 'Mèches Remy', image: 'assets/img/coiffure-equipe.jpg' },
  { id: 'prod-spa', name: 'Soins Spa K.V.S', image: 'assets/img/esthetic-spa-ambiance.jpg' }
];

const PRODUCTS_DATA = [
  {
    id: 'prod-huile-pousse',
    slug: 'elixir-croissance-antichute',
    name: 'Élixir Capillaire Croissance & Antichute',
    mainCategory: 'Produits Phares',
    subCategory: 'Soins Capillaires',
    subCategoryId: 'prod-capillaire',
    category: 'Capillaire',
    tagline: 'Formule concentrée Ricin noir & Chébé',
    price: 5000,
    priceLabel: '5 000 FCFA',
    volume: '150 ml',
    badge: 'Best-Seller',
    image: 'assets/img/blandine-coiffure.jpg',
    description: 'Stimule la pousse des tempes et des longueurs, nourrit le cuir chevelu en profondeur et scelle l’hydratation après tressage.'
  },
  {
    id: 'prod-masque-keratine',
    slug: 'masque-reparateur-keratine',
    name: 'Masque Réparateur Intense Kératine & Karité Bio',
    mainCategory: 'Produits Phares',
    subCategory: 'Soins Capillaires',
    subCategoryId: 'prod-capillaire',
    category: 'Soin Cheveux',
    tagline: 'Nutrition pour cheveux défrisés ou naturels',
    price: 7500,
    priceLabel: '7 500 FCFA',
    volume: '300 ml',
    badge: 'Coup de Cœur Salon',
    image: 'assets/img/coiffure-postes.jpg',
    description: 'Restaure l’élasticité des cheveux cassants, apporte brillance miroir et facilite le démêlage sans douleur.'
  },
  {
    id: 'prod-edge-control',
    slug: 'gel-edge-control-extra-hold',
    name: 'Gel Fixateur Edge Control Extra Hold',
    mainCategory: 'Produits Phares',
    subCategory: 'Soins Capillaires',
    subCategoryId: 'prod-capillaire',
    category: 'Coiffage',
    tagline: 'Tenue 48h sans résidus blancs',
    price: 3500,
    priceLabel: '3 500 FCFA',
    volume: '100 g',
    badge: 'Indispensable Tresses',
    image: 'assets/img/coiffure-sieges.jpg',
    description: 'Plaque instantanément les petits cheveux de devant (baby hairs), résiste à la chaleur et à l’humidité d’Abidjan.'
  },
  {
    id: 'prod-meches-bresiliennes',
    slug: 'meches-tissages-remy-12a',
    name: 'Mèches & Tissages 100% Cheveux Humains Remy',
    mainCategory: 'Produits Phares',
    subCategory: 'Mèches Remy',
    subCategoryId: 'prod-meches',
    category: 'Mèches & Tissages',
    tagline: 'Grade 12A – Lisse, Ondulé ou Bouclé',
    price: 18000,
    priceLabel: 'À partir de 18 000 FCFA / paquet',
    volume: '100 g / botte (12" à 30")',
    badge: 'Qualité Supérieure',
    image: 'assets/img/coiffure-equipe.jpg',
    description: 'Tissage soyeux, ne s’emmêle pas, supporte la coloration, le fer et les décolorations. Tenue plus de 2 ans.'
  },
  {
    id: 'prod-gommage-corps',
    slug: 'gommage-corps-detox-cafe-sucre',
    name: 'Gommage Corps Détox Café & Sucre Roux',
    mainCategory: 'Produits Phares',
    subCategory: 'Soins Spa K.V.S',
    subCategoryId: 'prod-spa',
    category: 'Esthétique K.V.S',
    tagline: 'Peau satinée & grain affiné',
    price: 8000,
    priceLabel: '8 000 FCFA',
    volume: '250 g',
    badge: 'Soin Spa',
    image: 'assets/img/esthetic-spa-ambiance.jpg',
    description: 'Exfoliation douce formulée par Judith. Élimine les peaux mortes et prépare le corps au massage ou à l’exposition.'
  },
  {
    id: 'prod-huile-scintillante',
    slug: 'huile-seche-scintillante-tiare',
    name: 'Huile Sèche Scintillante Fleur de Tiaré',
    mainCategory: 'Produits Phares',
    subCategory: 'Soins Spa K.V.S',
    subCategoryId: 'prod-spa',
    category: 'Esthétique K.V.S',
    tagline: 'Reflets dorés pour sublimer votre éclat',
    price: 10000,
    priceLabel: '10 000 FCFA',
    volume: '100 ml',
    badge: 'Spécial Mariée',
    image: 'assets/img/esthetic-massage-bed.jpg',
    description: 'Nourrit intensément la peau sans effet gras et laisse un voile satiné pailleté envoûtant.'
  }
];
