/**
 * Settings & Configuration Manager - Salon Elle & Lui
 * Gère la persistance locale de tous les paramètres administrables du salon :
 * - Numéros de téléphone (Gérante, Ligne directe, Lignes secondaires)
 * - Paramétrage Wave (URL marchand, montant, compte)
 * - Modèles de messages WhatsApp
 * - Réseaux sociaux (Instagram, Facebook, TikTok, etc.)
 * - Galerie photos (CRUD complet des médias exposés)
 */

const SALON_SETTINGS_KEY = 'elle_et_lui_salon_settings_v1';
const SALON_GALLERY_KEY = 'elle_et_lui_gallery_v1';

const DEFAULT_SALON_SETTINGS = {
  // Numéros de téléphone administrables
  phones: {
    whatsapp: {
      label: 'WhatsApp Gérante',
      number: '+225 07 59 37 24 41',
      raw: '2250759372441',
      holder: 'Blandine Youbouet'
    },
    direct: {
      label: 'Ligne Salon directe',
      number: '+225 07 11 08 48 66',
      raw: '2250711084866'
    },
    secondaries: [
      { id: 'sec-1', label: 'Ligne secondaire 1', number: '+225 07 98 81 37 06', raw: '2250798813706' },
      { id: 'sec-2', label: 'Ligne secondaire 2', number: '+225 01 01 12 70 94', raw: '2250101127094' }
    ]
  },

  // Configuration du paiement Wave
  wave: {
    merchantUrl: 'https://pay.wave.com/m/M_ci_tk7yljaMIDFk/c/ci/?amount=',
    accountName: 'Salon Elle & Lui • Cocody',
    phone: '+225 07 59 37 24 41',
    defaultAmount: 10000
  },

  // Modèles de messages WhatsApp
  whatsappMessages: {
    general: 'Bonjour Blandine et Judith ! Je souhaite des renseignements sur vos prestations au Salon Elle & Lui.',
    wedding1m: 'Bonjour ! Je souhaite des informations sur le Forfait Mariée Sublime (1 mois).',
    wedding3m: 'Bonjour ! Je souhaite des informations sur le Forfait Reine de Beauté (3 mois).',
    booking: 'Bonjour Salon Elle & Lui ! Je confirme ma demande de réservation pour {serviceName} le {date} à {timeSlot}.'
  },

  // Liens Réseaux Sociaux (avec données par défaut)
  socials: {
    instagram: {
      enabled: true,
      name: 'Instagram',
      handle: '@elle_et_lui_cocody',
      url: 'https://instagram.com/elle_et_lui_cocody'
    },
    facebook: {
      enabled: true,
      name: 'Facebook',
      handle: 'Salon Elle & Lui Abidjan',
      url: 'https://facebook.com/salonelleetlui.abidjan'
    },
    tiktok: {
      enabled: true,
      name: 'TikTok',
      handle: '@elleetlui_abidjan',
      url: 'https://tiktok.com/@elleetlui_abidjan'
    },
    youtube: {
      enabled: false,
      name: 'YouTube',
      handle: '@SalonElleEtLui',
      url: 'https://youtube.com/@SalonElleEtLui'
    }
  }
};

const DEFAULT_GALLERY_ITEMS = [
  {
    id: 'gal-1',
    title: 'Façade du salon Elle & Lui Cocody',
    category: 'Devanture & Accès',
    image: 'assets/img/devanture-facade.jpg',
    caption: 'Salon Elle & Lui • Cocody N°39 (Près de la Pharmacie)',
    colSpan2: true
  },
  {
    id: 'gal-2',
    title: 'Postes de coiffure et miroirs',
    category: 'Espace Coiffure',
    image: 'assets/img/coiffure-postes.jpg',
    caption: 'Miroirs & fauteuils de coiffage ergonomiques',
    colSpan2: false
  },
  {
    id: 'gal-3',
    title: 'Cabine esthétique et table de massage',
    category: 'Espace Spa K.V.S',
    image: 'assets/img/esthetic-spa-ambiance.jpg',
    caption: 'Cabine feutrée climatisée & table de massage',
    colSpan2: false
  },
  {
    id: 'gal-4',
    title: 'Blandine Youbouet au bac à shampoing',
    category: 'Savoir-Faire',
    image: 'assets/img/blandine-coiffure.jpg',
    caption: 'Blandine au bac à shampoing & soins nourrissants',
    colSpan2: false
  },
  {
    id: 'gal-5',
    title: 'Espace Manucure et soins des ongles',
    category: 'Institut & Onglerie',
    image: 'assets/img/esthetic-blandine.jpg',
    caption: 'Espace manucure, pédicure & bar à vernis',
    colSpan2: false
  },
  {
    id: 'gal-6',
    title: "Vue d'ensemble du salon de coiffure",
    category: 'Ambiance Salon',
    image: 'assets/img/coiffure-sieges.jpg',
    caption: 'Un cadre lumineux, propre et convivial',
    colSpan2: true
  }
];

class SalonSettingsManager {
  constructor() {
    this.settings = this.loadSettings();
  }

  loadSettings() {
    try {
      const stored = localStorage.getItem(SALON_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_SALON_SETTINGS,
          ...parsed,
          phones: {
            ...DEFAULT_SALON_SETTINGS.phones,
            ...(parsed.phones || {})
          },
          wave: {
            ...DEFAULT_SALON_SETTINGS.wave,
            ...(parsed.wave || {})
          },
          whatsappMessages: {
            ...DEFAULT_SALON_SETTINGS.whatsappMessages,
            ...(parsed.whatsappMessages || {})
          },
          socials: {
            ...DEFAULT_SALON_SETTINGS.socials,
            ...(parsed.socials || {})
          }
        };
      }
    } catch (e) {
      console.warn('Erreur chargement paramètres localStorage:', e);
    }
    this.saveSettings(DEFAULT_SALON_SETTINGS);
    return JSON.parse(JSON.stringify(DEFAULT_SALON_SETTINGS));
  }

  saveSettings(newSettings) {
    try {
      this.settings = newSettings;
      localStorage.setItem(SALON_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Erreur sauvegarde paramètres localStorage:', e);
    }
  }

  getSettings() {
    return JSON.parse(JSON.stringify(this.settings));
  }

  // --- Gestion des Téléphones ---
  updatePrimaryPhones(whatsappObj, directObj) {
    if (whatsappObj) {
      this.settings.phones.whatsapp = {
        ...this.settings.phones.whatsapp,
        ...whatsappObj,
        raw: whatsappObj.number.replace(/\D+/g, '')
      };
    }
    if (directObj) {
      this.settings.phones.direct = {
        ...this.settings.phones.direct,
        ...directObj,
        raw: directObj.number.replace(/\D+/g, '')
      };
    }
    this.saveSettings(this.settings);
  }

  addSecondaryPhone(label, number) {
    const raw = number.replace(/\D+/g, '');
    const newPhone = {
      id: 'sec-' + Date.now(),
      label: label.trim() || 'Ligne secondaire',
      number: number.trim(),
      raw
    };
    if (!this.settings.phones.secondaries) this.settings.phones.secondaries = [];
    this.settings.phones.secondaries.push(newPhone);
    this.saveSettings(this.settings);
    return newPhone;
  }

  deleteSecondaryPhone(id) {
    if (!this.settings.phones.secondaries) return;
    this.settings.phones.secondaries = this.settings.phones.secondaries.filter(p => p.id !== id);
    this.saveSettings(this.settings);
  }

  // --- Gestion Wave ---
  updateWaveSettings(merchantUrl, accountName, phone, defaultAmount) {
    this.settings.wave = {
      merchantUrl: merchantUrl || this.settings.wave.merchantUrl,
      accountName: accountName || this.settings.wave.accountName,
      phone: phone || this.settings.wave.phone,
      defaultAmount: Number(defaultAmount) || 10000
    };
    this.saveSettings(this.settings);
  }

  // --- Gestion Réseaux Sociaux ---
  updateSocials(socialsObj) {
    this.settings.socials = {
      ...this.settings.socials,
      ...socialsObj
    };
    this.saveSettings(this.settings);
  }

  // --- Gestion Messages WhatsApp ---
  updateWhatsAppMessages(messagesObj) {
    this.settings.whatsappMessages = {
      ...this.settings.whatsappMessages,
      ...messagesObj
    };
    this.saveSettings(this.settings);
  }

  resetToDefaults() {
    this.saveSettings(JSON.parse(JSON.stringify(DEFAULT_SALON_SETTINGS)));
    return this.settings;
  }
}

class SalonGalleryManager {
  constructor() {
    this.items = this.loadGallery();
  }

  loadGallery() {
    try {
      const stored = localStorage.getItem(SALON_GALLERY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erreur chargement galerie localStorage:', e);
    }
    this.saveGallery(DEFAULT_GALLERY_ITEMS);
    return JSON.parse(JSON.stringify(DEFAULT_GALLERY_ITEMS));
  }

  saveGallery(items) {
    try {
      this.items = items;
      localStorage.setItem(SALON_GALLERY_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Erreur sauvegarde galerie localStorage:', e);
    }
  }

  getItems() {
    return JSON.parse(JSON.stringify(this.items));
  }

  addItem(itemData) {
    const newItem = {
      id: 'gal-' + Date.now(),
      title: itemData.title || 'Photo du Salon',
      category: itemData.category || 'Ambiance Salon',
      image: itemData.image || 'assets/img/devanture-facade.jpg',
      caption: itemData.caption || '',
      colSpan2: Boolean(itemData.colSpan2)
    };
    this.items.push(newItem);
    this.saveGallery(this.items);
    return newItem;
  }

  updateItem(id, itemData) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      Object.assign(item, itemData);
      this.saveGallery(this.items);
    }
    return item;
  }

  deleteItem(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.saveGallery(this.items);
  }

  resetToDefaults() {
    this.saveGallery(JSON.parse(JSON.stringify(DEFAULT_GALLERY_ITEMS)));
    return this.items;
  }
}

// Instance globale prête à l'emploi
window.salonSettingsManager = new SalonSettingsManager();
window.salonGalleryManager = new SalonGalleryManager();
