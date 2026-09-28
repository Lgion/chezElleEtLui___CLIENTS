/**
 * Application Principale - Salon de Coiffure & Beauté Elle & Lui
 * Abidjan Cocody N°39 (Blandine Youbouet & Judith K.V.S)
 */

class SalonApp {
  constructor() {
    this.dashboardManager = new DashboardManager();
    this.settingsManager = window.salonSettingsManager || (typeof SalonSettingsManager !== 'undefined' ? new SalonSettingsManager() : null);
    this.galleryManager = window.salonGalleryManager || (typeof SalonGalleryManager !== 'undefined' ? new SalonGalleryManager() : null);
    this.activeRealm = 'coiffure'; // 'coiffure', 'esthetic', 'produits'
    this.activeCategory = 'all';
    this.searchQuery = '';
    this.selectedTimeSlot = null;
    this.selectedService = null;
    this.waveQrCodeInstance = null;
    this.waveBaseUrl = 'https://pay.wave.com/m/M_ci_tk7yljaMIDFk/c/ci/?amount=';
    this.leafletMap = null;

    // État du Calendrier Espace Salon
    this.calendarView = 'daily'; // 'daily', 'weekly', 'monthly', 'table'
    this.calendarDate = new Date();
    this.dashSearchQuery = '';
    this.dashSpecialist = 'all';
    this.dashStatus = 'all';

    this.init();
  }

  init() {
    this.applySalonSettings();
    this.setupLiveStatus();
    this.setupCatalogModal();
    this.setupEventsModal();
    this.setupGalleryToggle();
    this.renderPublicGallery();
    this.setupLeafletMap();
    this.populateServiceDropdown();
    this.setupBookingWizard();
    this.setupEventListeners();
    this.setupScrollEffects();
    this.setupServiceDetailModal();
    this.setupWavePaymentModal();
    this.setupDashboardCalendar();
    this.setupEditAppointmentModal();
  }

  /* ==========================================================================
     1. INDICATEUR D'OUVERTURE EN DIRECT (7j/7 : 08h30 - 19h00 Abidjan)
     ========================================================================== */
  setupLiveStatus() {
    const badge = document.getElementById('liveStatusBadge');
    if (!badge) return;

    const checkStatus = () => {
      const now = new Date();
      const abidjanHour = now.getUTCHours();
      const abidjanMinutes = now.getUTCMinutes();
      const currentTimeInDec = abidjanHour + abidjanMinutes / 60;
      const openTimeInDec = SALON_OPEN_HOUR + SALON_OPEN_MINUTE / 60;

      const isOpen = currentTimeInDec >= openTimeInDec && currentTimeInDec < SALON_CLOSE_HOUR;

      if (isOpen) {
        badge.className = 'status-badge';
        badge.innerHTML = `<span class="status-dot"></span> Ouvert actuellement • Ferme à 19h00`;
      } else {
        badge.className = 'status-badge closed';
        badge.innerHTML = `<span class="status-dot"></span> Fermé actuellement • Ouvre à 08h30`;
      }
    };

    checkStatus();
    setInterval(checkStatus, 60000);
  }

  /* ==========================================================================
     2. MODALE CATALOGUE DES SOINS & PRODUITS (FUSIONNÉE + FILTRES IMBRIQUÉS)
     ========================================================================== */
  setupCatalogModal() {
    const dialog = document.getElementById('catalogModalDialog');
    if (!dialog) return;

    // Boutons de Niveau 1 (Univers : Coiffure, Esthétique, Produits)
    const level1Buttons = dialog.querySelectorAll('.level1-btn');
    level1Buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const realm = btn.dataset.realm;
        this.setCatalogRealm(realm);
      });
    });

    // Champ de Recherche du Catalogue
    const searchInput = document.getElementById('modalServiceSearchInput');
    const clearBtn = document.getElementById('modalSearchClearBtn');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        if (clearBtn) {
          clearBtn.style.display = this.searchQuery ? 'block' : 'none';
        }
        this.renderCatalogItems();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          this.searchQuery = '';
          clearBtn.style.display = 'none';
          this.renderCatalogItems();
          searchInput.focus();
        }
      });
    }

    // Initialisation par défaut
    this.renderSubfilterChips();
    this.renderCatalogItems();
  }

  setCatalogRealm(realm) {
    this.activeRealm = realm;
    this.activeCategory = 'all';

    // Mettre à jour les boutons Niveau 1
    const dialog = document.getElementById('catalogModalDialog');
    if (dialog) {
      dialog.querySelectorAll('.level1-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.realm === realm);
      });
    }

    // Basculer l'affichage des grilles
    const servicesGrid = document.getElementById('modalServicesGrid');
    const productsGrid = document.getElementById('modalProductsGrid');

    if (realm === 'produits') {
      if (servicesGrid) servicesGrid.style.display = 'none';
      if (productsGrid) productsGrid.style.display = 'grid';
    } else {
      if (servicesGrid) servicesGrid.style.display = 'grid';
      if (productsGrid) productsGrid.style.display = 'none';
    }

    this.renderSubfilterChips();
    this.renderCatalogItems();
  }

  renderSubfilterChips() {
    const container = document.getElementById('catalogSubfilterChips');
    if (!container) return;

    let subfilters = [];
    if (this.activeRealm === 'coiffure') {
      subfilters = [
        { id: 'all', name: 'Toutes les coiffures' },
        { id: 'coiffure-tresses', name: '✂️ Tresses & Tissages' },
        { id: 'coiffure-soins', name: '🪄 Coiffure & Shampoings' }
      ];
    } else if (this.activeRealm === 'esthetic') {
      subfilters = [
        { id: 'all', name: 'Tous les soins spa' },
        { id: 'esthetic-spa', name: '💆‍♀️ Visage & Massages' },
        { id: 'esthetic-ongles', name: '💅 Onglerie & Épilation' }
      ];
    } else {
      subfilters = [
        { id: 'all', name: 'Tous les produits' },
        { id: 'Capillaire', name: '🌿 Capillaires' },
        { id: 'Soin Cheveux', name: '🧴 Soins & Masques' },
        { id: 'Coiffage', name: '✨ Coiffage' },
        { id: 'Mèches & Tissages', name: '💇‍♀️ Mèches Remy' },
        { id: 'Esthétique K.V.S', name: '🌸 Soins Spa' }
      ];
    }

    container.innerHTML = subfilters.map(sub => `
      <button class="subfilter-chip ${this.activeCategory === sub.id ? 'active' : ''}" data-sub-id="${sub.id}">
        <span>${sub.name}</span>
      </button>
    `).join('');

    container.querySelectorAll('.subfilter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        container.querySelectorAll('.subfilter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeCategory = chip.dataset.subId;
        this.renderCatalogItems();
      });
    });
  }

  renderCatalogItems() {
    if (this.activeRealm === 'produits') {
      this.renderModalProducts();
    } else {
      this.renderModalServices();
    }
  }

  renderModalServices() {
    const container = document.getElementById('modalServicesGrid');
    if (!container) return;

    let filtered = SERVICES_DATA.filter(s => {
      const isCoiffure = s.category.startsWith('coiffure-');
      return this.activeRealm === 'coiffure' ? isCoiffure : !isCoiffure;
    });

    if (this.activeCategory !== 'all') {
      filtered = filtered.filter(s => s.category === this.activeCategory);
    }

    if (this.searchQuery) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(this.searchQuery) ||
        s.description.toLowerCase().includes(this.searchQuery) ||
        s.responsible.toLowerCase().includes(this.searchQuery)
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <p style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">Aucune prestation trouvée</p>
          <p style="font-size: 0.92rem;">Modifiez vos termes de recherche ou réinitialisez les sous-filtres.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(service => {
      const durationHours = Math.floor(service.durationMinutes / 60);
      const durationMins = service.durationMinutes % 60;
      const durationStr = durationHours > 0
        ? `${durationHours}h${durationMins > 0 ? durationMins : ''}`
        : `${durationMins}m`;

      return `
        <article class="service-card" data-service-id="${service.id}">
          <div class="service-card-top">
            <div class="sprite-thumb sprite-${service.id}" aria-hidden="true"></div>
            <div class="service-meta-tags">
              <div class="service-specialist-label">✦ ${service.responsible}</div>
              ${service.featured ? `<span class="service-badge-pill">Phare</span>` : ''}
              <span class="service-duration-badge">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ~${durationStr}
              </span>
            </div>
          </div>

          <div class="service-card-content">
            <h3 class="service-title">${service.name}</h3>
            ${service.tagline ? `<p class="service-subtagline">« ${service.tagline} »</p>` : ''}
          </div>

          <div class="service-card-bottom">
            <div class="service-price-wrap">
              <span class="service-price-small">Tarif</span>
              <span class="service-price-amount">${service.priceLabel}</span>
            </div>
            <div class="service-actions-group">
              <button class="btn-service-detail" data-action="detail" data-service-id="${service.id}" title="Voir détails et description" aria-label="Voir les détails de ${service.name}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>

              <button class="btn-book-service" data-action="book" data-service-id="${service.id}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
                Réserver
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Écouteurs sur bouton œil et réservation
    container.querySelectorAll('[data-action="detail"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openServiceDetailModal(btn.dataset.serviceId);
      });
    });

    container.querySelectorAll('[data-action="book"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const catalogDialog = document.getElementById('catalogModalDialog');
        if (catalogDialog) catalogDialog.close();
        this.openBookingModal(btn.dataset.serviceId);
      });
    });
  }

  renderModalProducts() {
    const container = document.getElementById('modalProductsGrid');
    if (!container) return;

    let filtered = [...PRODUCTS_DATA];

    if (this.activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category === this.activeCategory);
    }

    if (this.searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(this.searchQuery) ||
        p.description.toLowerCase().includes(this.searchQuery) ||
        p.category.toLowerCase().includes(this.searchQuery)
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <p style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">Aucun produit trouvé</p>
          <p style="font-size: 0.92rem;">Modifiez vos termes de recherche ou sélectionnez une autre catégorie.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(product => `
      <article class="product-card">
        <div class="product-media">
          <div class="sprite-thumb sprite-${product.id}" aria-label="${product.name}"></div>
          <span class="product-badge">${product.badge}</span>
        </div>
        <div class="product-body">
          <span class="product-category">${product.category}</span>
          <h4 class="product-title">${product.name}</h4>
          <p class="product-desc">${product.description}</p>
          <div class="product-footer">
            <span class="product-price">${product.priceLabel}</span>
            <a href="${getWhatsAppProductUrl(product)}" target="_blank" rel="noopener" class="btn-whatsapp-order">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771z"/></svg>
              Commander
            </a>
          </div>
        </div>
      </article>
    `).join('');
  }

  openCatalogModal(realm = 'coiffure') {
    const dialog = document.getElementById('catalogModalDialog');
    if (!dialog) return;
    this.setCatalogRealm(realm);
    dialog.showModal();
  }

  /* ==========================================================================
     3. MODALE DES PRISES EN CHARGE ÉVÉNEMENTIELLES (MARIÉE & GRAND JOUR)
     ========================================================================== */
  setupEventsModal() {
    const dialog = document.getElementById('eventModalDialog');
    if (!dialog) return;

    dialog.querySelectorAll('[data-book-wedding]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pkg = btn.dataset.bookWedding;
        const serviceId = pkg === '1mois' ? 'forfait-mariee-1mois' : 'forfait-mariee-3mois';
        dialog.close();
        this.openBookingModal(serviceId);
      });
    });
  }

  openEventsModal() {
    const dialog = document.getElementById('eventModalDialog');
    if (dialog) dialog.showModal();
  }

  /* ==========================================================================
     UTILITAIRE D'ÉCHAPPEMENT HTML
     ========================================================================== */
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ==========================================================================
     SYNCHRONISATION DES PARAMÈTRES SALON DYNAMIQUES (Settings & Contacts)
     ========================================================================== */
  applySalonSettings() {
    if (!this.settingsManager) return;
    const settings = this.settingsManager.getSettings();
    if (!settings) return;

    // Mise à jour de l'URL Wave
    if (settings.wave && settings.wave.merchantUrl) {
      this.waveBaseUrl = settings.wave.merchantUrl;
    }

    // TopBar Téléphones
    const topPhone = document.getElementById('topbarPhoneCall');
    if (topPhone && settings.phones?.direct) {
      topPhone.href = `tel:${settings.phones.direct.raw}`;
      topPhone.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
        <span>${this.escapeHtml(settings.phones.direct.number)}</span>
      `;
    }

    const topWa = document.getElementById('topbarPhoneWa');
    if (topWa && settings.phones?.whatsapp) {
      topWa.href = `https://wa.me/${settings.phones.whatsapp.raw}`;
      topWa.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771z"/>
        </svg>
        <span>WhatsApp : ${this.escapeHtml(settings.phones.whatsapp.number)}</span>
      `;
    }

    // Boutons Flottants (Appel & WhatsApp)
    const floatCall = document.getElementById('floatingCallBtn');
    const floatCallTooltip = document.getElementById('floatingCallTooltip');
    if (floatCall && settings.phones?.direct) {
      floatCall.href = `tel:${settings.phones.direct.raw}`;
      floatCall.setAttribute('aria-label', `Appeler directement le salon (${settings.phones.direct.number})`);
      if (floatCallTooltip) floatCallTooltip.textContent = `Appelez-nous : ${settings.phones.direct.number}`;
    }

    const floatWa = document.getElementById('floatingWaBtn');
    const floatWaTooltip = document.getElementById('floatingWaTooltip');
    if (floatWa && settings.phones?.whatsapp) {
      const waText = encodeURIComponent(settings.whatsappMessages?.general || 'Bonjour Salon Elle & Lui ! Je souhaite des renseignements.');
      floatWa.href = `https://wa.me/${settings.phones.whatsapp.raw}?text=${waText}`;
      if (floatWaTooltip) floatWaTooltip.textContent = `WhatsApp : ${settings.phones.whatsapp.number}`;
    }

    // Section Contact: WhatsApp Gérante
    const cWa = document.getElementById('contactPhoneWhatsapp');
    if (cWa && settings.phones?.whatsapp) {
      cWa.innerHTML = `
        <span class="phone-label">${this.escapeHtml(settings.phones.whatsapp.label || 'WhatsApp Gérante')} :</span>
        <a href="https://wa.me/${settings.phones.whatsapp.raw}" target="_blank" rel="noopener">${this.escapeHtml(settings.phones.whatsapp.number)}</a>
      `;
    }

    // Section Contact: Ligne Directe
    const cDir = document.getElementById('contactPhoneDirect');
    if (cDir && settings.phones?.direct) {
      cDir.innerHTML = `
        <span class="phone-label">${this.escapeHtml(settings.phones.direct.label || 'Ligne Salon directe')} :</span>
        <a href="tel:${settings.phones.direct.raw}">${this.escapeHtml(settings.phones.direct.number)}</a>
      `;
    }

    // Section Contact: Lignes Secondaires
    const cSec = document.getElementById('contactPhoneSecondaries');
    if (cSec && settings.phones?.secondaries) {
      const linksHtml = settings.phones.secondaries.map(sec => 
        `<a href="tel:${sec.raw}">${this.escapeHtml(sec.number)}</a>`
      ).join(' • ');
      cSec.innerHTML = `
        <span class="phone-label">Lignes secondaires :</span>
        <span class="phone-sec-links">${linksHtml || '<em>Aucune</em>'}</span>
      `;
    }

    // Section Contact: Réseaux Sociaux
    const cSocials = document.getElementById('contactSocialChips');
    if (cSocials && settings.socials) {
      const icons = {
        instagram: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
        facebook: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
        tiktok: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>',
        youtube: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>'
      };

      const chipsHtml = Object.entries(settings.socials)
        .filter(([_, s]) => s && s.enabled)
        .map(([key, s]) => `
          <a href="${this.escapeHtml(s.url)}" target="_blank" rel="noopener" class="social-chip ${key}" data-social="${key}" title="${this.escapeHtml(s.name)}">
            ${icons[key] || '🔗'}
            <span class="social-handle">${this.escapeHtml(s.handle)}</span>
          </a>
        `).join('');

      cSocials.innerHTML = chipsHtml || '<span style="color: var(--text-muted); font-size: 0.85rem;">Aucun réseau actif</span>';
    }
  }

  /* ==========================================================================
     4. GALERIE PHOTOS IMMERSION (Dynamique + Bouton Afficher / Masquer)
     ========================================================================== */
  renderPublicGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;

    const items = this.galleryManager ? this.galleryManager.getItems() : [];
    if (!items || items.length === 0) {
      galleryGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">Aucun cliché disponible dans la galerie.</p>';
      return;
    }

    galleryGrid.innerHTML = items.map(item => `
      <div class="gallery-item ${item.colSpan2 ? 'col-span-2' : ''}">
        <img src="${this.escapeHtml(item.image)}" alt="${this.escapeHtml(item.title)}" loading="lazy" />
        <div class="gallery-overlay">
          <span class="gallery-tag">${this.escapeHtml(item.category || 'Salon')}</span>
          <div class="gallery-caption">${this.escapeHtml(item.caption || item.title)}</div>
        </div>
      </div>
    `).join('');

    const btnText = document.getElementById('galleryToggleBtnText');
    if (btnText && galleryGrid.classList.contains('is-collapsed')) {
      btnText.textContent = `Afficher la galerie photos (${items.length} clichés)`;
    }
  }

  setupGalleryToggle() {
    const btn = document.getElementById('btnToggleGallery');
    const galleryGrid = document.getElementById('galleryGrid');
    const btnText = document.getElementById('galleryToggleBtnText');

    if (!btn || !galleryGrid) return;

    btn.addEventListener('click', () => {
      const itemsCount = this.galleryManager ? this.galleryManager.getItems().length : 6;
      const isCollapsed = galleryGrid.classList.contains('is-collapsed');
      if (isCollapsed) {
        galleryGrid.classList.remove('is-collapsed');
        btn.setAttribute('aria-expanded', 'true');
        if (btnText) btnText.textContent = 'Masquer la galerie photos';
      } else {
        galleryGrid.classList.add('is-collapsed');
        btn.setAttribute('aria-expanded', 'false');
        if (btnText) btnText.textContent = `Afficher la galerie photos (${itemsCount} clichés)`;
      }
    });
  }

  /* ==========================================================================
     5. CARTE INTERACTIVE LEAFLET PRESTIGE (Cocody N° 39 Pharmacie Saint Gil)
     ========================================================================== */
  setupLeafletMap() {
    const mapContainer = document.getElementById('salonMap');
    if (!mapContainer || typeof L === 'undefined') return;

    try {
      // Coordonnées de Cocody, Abidjan
      const salonCoords = [5.3489, -3.9885];

      this.leafletMap = L.map('salonMap', {
        center: salonCoords,
        zoom: 16,
        scrollWheelZoom: false
      });

      // Tuiles cartographiques ESRI World Street Map (100% ouvertes, sans clé API, sans blocage)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri &mdash; Sources: Esri, NAVTEQ, TomTom',
        maxZoom: 19
      }).addTo(this.leafletMap);

      // Marqueur Doré Personnalisé Prestige
      const goldIcon = L.divIcon({
        className: 'custom-gold-marker',
        html: `<div class="marker-pin"><span class="marker-inner-icon">✨</span></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 38],
        popupAnchor: [0, -36]
      });

      const popupContent = `
        <div class="map-popup-card">
          <div class="map-popup-header">Salon Elle &amp; Lui</div>
          <div class="map-popup-sub">Coiffure &amp; Institut K.V.S</div>
          <p class="map-popup-desc">
            📍 <strong>Abidjan, Cocody N°39</strong><br>
            À côté de la Pharmacie Saint Gil<br>
            🕒 Ouvert 7j/7 de 08h30 à 19h00
          </p>
          <a href="https://www.google.com/maps/dir/?api=1&destination=5.3489,-3.9885" target="_blank" rel="noopener" class="map-popup-btn">
            🧭 Itinéraire GPS Google Maps
          </a>
        </div>
      `;

      L.marker(salonCoords, { icon: goldIcon })
        .addTo(this.leafletMap)
        .bindPopup(popupContent);

      // Invalidation de la taille lors de l'affichage
      setTimeout(() => {
        if (this.leafletMap) this.leafletMap.invalidateSize();
      }, 500);
    } catch (e) {
      console.warn('Erreur initialisation Leaflet Map:', e);
    }
  }

  /* ==========================================================================
     6. GESTION DU CALENDRIER VISUEL DE L'ESPACE SALON (Jour, Semaine, Mois)
     ========================================================================== */
  setupDashboardCalendar() {
    // Boutons de changement de mode de vue
    const viewButtons = document.querySelectorAll('.cal-view-btn');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        viewButtons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        this.calendarView = btn.dataset.view;
        this.renderCalendar();
      });
    });

    // Contrôles de navigation dans le temps
    const prevBtn = document.getElementById('calPrevBtn');
    const todayBtn = document.getElementById('calTodayBtn');
    const nextBtn = document.getElementById('calNextBtn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.navigateCalendar(-1));
    }
    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        this.calendarDate = new Date();
        this.renderCalendar();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.navigateCalendar(1));
    }

    // Filtres du Dashboard
    const searchInput = document.getElementById('dashSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.dashSearchQuery = e.target.value.toLowerCase().trim();
        this.renderCalendar();
      });
    }

    const specialistFilter = document.getElementById('dashSpecialistFilter');
    if (specialistFilter) {
      specialistFilter.addEventListener('change', (e) => {
        this.dashSpecialist = e.target.value;
        this.renderCalendar();
      });
    }

    const statusFilter = document.getElementById('dashStatusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.dashStatus = e.target.value;
        this.renderCalendar();
      });
    }

    // Filtrage rapide par clic sur les puces KPIs compactes
    document.querySelectorAll('.kpi-chip[data-kpi-status]').forEach(chip => {
      chip.addEventListener('click', () => {
        const targetStatus = chip.dataset.kpiStatus;
        this.dashStatus = targetStatus;
        if (statusFilter) statusFilter.value = targetStatus;
        this.renderCalendar();
        this.showToast(`Filtre : ${targetStatus === 'all' ? 'Tous les statuts' : targetStatus}`);
      });
    });

    // Export CSV
    const exportBtn = document.getElementById('btnExportCSV');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.dashboardManager.exportCSV();
        this.showToast('Export CSV téléchargé !');
      });
    }

    // Toggle Formulaire Ajout Rapide
    const toggleQuickAdd = document.getElementById('btnToggleQuickAdd');
    const quickAddForm = document.getElementById('quickAddForm');
    const quickAddClose = document.getElementById('quickAddCloseBtn');

    if (toggleQuickAdd && quickAddForm) {
      toggleQuickAdd.addEventListener('click', () => {
        quickAddForm.classList.toggle('open');
      });
    }

    if (quickAddClose && quickAddForm) {
      quickAddClose.addEventListener('click', () => {
        quickAddForm.classList.remove('open');
      });
    }

    // Soumission Formulaire Ajout Rapide
    if (quickAddForm) {
      quickAddForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const clientName = document.getElementById('quickClientName').value.trim();
        const clientPhone = document.getElementById('quickClientPhone').value.trim();
        const serviceName = document.getElementById('quickServiceName').value.trim();
        const specialist = document.getElementById('quickSpecialist').value;
        const date = document.getElementById('quickDate').value;
        const timeSlot = document.getElementById('quickTime').value;
        const price = Number(document.getElementById('quickPrice').value) || 0;

        if (!clientName || !clientPhone || !serviceName || !date || !timeSlot) {
          alert('Veuillez remplir tous les champs obligatoires.');
          return;
        }

        this.dashboardManager.addAppointment({
          clientName,
          clientPhone,
          serviceName,
          specialist,
          date,
          timeSlot,
          price,
          priceLabel: new Intl.NumberFormat('fr-FR').format(price) + ' FCFA',
          status: 'confirmed',
          notes: 'Ajouté directement au salon'
        });

        quickAddForm.reset();
        quickAddForm.classList.remove('open');
        this.renderCalendar();
        this.showToast('Rendez-vous ajouté au planning !');
      });
    }
  }

  navigateCalendar(direction) {
    const d = new Date(this.calendarDate);
    if (this.calendarView === 'daily') {
      d.setDate(d.getDate() + direction);
    } else if (this.calendarView === 'weekly') {
      d.setDate(d.getDate() + direction * 7);
    } else if (this.calendarView === 'monthly') {
      d.setMonth(d.getMonth() + direction);
    } else {
      d.setDate(d.getDate() + direction);
    }
    this.calendarDate = d;
    this.renderCalendar();
  }

  openDashboardModal() {
    const dialog = document.getElementById('dashboardDialog');
    if (!dialog) return;
    this.renderCalendar();
    dialog.showModal();
  }

  renderCalendar() {
    // 1. Mettre à jour les KPIs compacts
    const kpis = this.dashboardManager.getKPIs();
    document.getElementById('kpiTotal').textContent = kpis.total;
    document.getElementById('kpiToday').textContent = kpis.today;
    document.getElementById('kpiConfirmed').textContent = kpis.confirmed;
    document.getElementById('kpiRevenue').textContent = kpis.revenueFormatted;

    // 2. Mettre à jour le libellé de date
    this.updateCalendarDateLabel();

    // 3. Basculer entre Calendar Container et Table Container
    const calendarContainer = document.getElementById('calendarViewContainer');
    const tableContainer = document.getElementById('tableViewWrapper');

    if (this.calendarView === 'table') {
      if (calendarContainer) calendarContainer.style.display = 'none';
      if (tableContainer) tableContainer.style.display = 'block';
      this.renderAppointmentsTable();
      return;
    }

    if (tableContainer) tableContainer.style.display = 'none';
    if (calendarContainer) calendarContainer.style.display = 'flex';

    if (this.calendarView === 'daily') {
      this.renderDailyCalendar();
    } else if (this.calendarView === 'weekly') {
      this.renderWeeklyCalendar();
    } else if (this.calendarView === 'monthly') {
      this.renderMonthlyCalendar();
    }
  }

  updateCalendarDateLabel() {
    const label = document.getElementById('calCurrentDateLabel');
    if (!label) return;

    const d = this.calendarDate;
    if (this.calendarView === 'daily') {
      label.textContent = new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(d);
    } else if (this.calendarView === 'weekly') {
      const { start, end } = this.getWeekRange(d);
      label.textContent = `Semaine du ${start.getDate()} ${start.toLocaleDateString('fr-FR', { month: 'short' })} au ${end.getDate()} ${end.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`;
    } else if (this.calendarView === 'monthly') {
      label.textContent = new Intl.DateTimeFormat('fr-FR', {
        month: 'long',
        year: 'numeric'
      }).format(d);
    } else {
      label.textContent = 'Tous les rendez-vous';
    }
  }

  getWeekRange(refDate) {
    const d = new Date(refDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi comme 1er jour
    const start = new Date(d.setDate(diff));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  }

  getFilteredAppointments() {
    let list = this.dashboardManager.getAppointments();

    if (this.dashSpecialist && this.dashSpecialist !== 'all') {
      list = list.filter(a => a.specialist === this.dashSpecialist);
    }

    if (this.dashStatus && this.dashStatus !== 'all') {
      list = list.filter(a => a.status === this.dashStatus);
    }

    if (this.dashSearchQuery) {
      list = list.filter(a =>
        a.clientName.toLowerCase().includes(this.dashSearchQuery) ||
        a.clientPhone.toLowerCase().includes(this.dashSearchQuery) ||
        a.serviceName.toLowerCase().includes(this.dashSearchQuery)
      );
    }

    return list;
  }

  /* --- Vue 1 : Quotidienne --- */
  renderDailyCalendar() {
    const container = document.getElementById('calendarViewContainer');
    if (!container) return;

    const dateStr = this.calendarDate.toISOString().split('T')[0];
    const appointments = this.getFilteredAppointments().filter(a => a.date === dateStr);

    // Créneaux horaires de 08:30 à 18:30
    const timeSlots = [
      '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00',
      '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
    ];

    container.innerHTML = `
      <div class="cal-daily-grid">
        ${timeSlots.map(slot => {
          const aptsInSlot = appointments.filter(a => a.timeSlot === slot);
          return `
            <div class="daily-slot-row">
              <div class="daily-time-col">${slot}</div>
              <div class="daily-content-col">
                ${aptsInSlot.length > 0 ? aptsInSlot.map(apt => `
                  <div class="daily-apt-card ${apt.status}" data-apt-id="${apt.id}">
                    <div class="daily-apt-left">
                      <div class="daily-apt-time-badge">${apt.timeSlot} • ${apt.priceLabel || apt.price + ' F'}</div>
                      <div class="daily-apt-client">
                        <span>${apt.clientName}</span>
                        <small style="color: var(--text-muted); font-weight: normal;">(${apt.clientPhone})</small>
                        <span class="daily-apt-spec-pill">${apt.specialist || 'Salon'}</span>
                      </div>
                      <div class="daily-apt-service">${apt.serviceName} ${apt.notes ? `• <em>${apt.notes}</em>` : ''}</div>
                    </div>
                    <div class="daily-apt-actions">
                      <select class="dash-select status-changer" data-apt-id="${apt.id}" style="padding: 0.25rem 0.5rem; font-size: 0.78rem;">
                        <option value="pending" ${apt.status === 'pending' ? 'selected' : ''}>En attente</option>
                        <option value="confirmed" ${apt.status === 'confirmed' ? 'selected' : ''}>Confirmé</option>
                        <option value="completed" ${apt.status === 'completed' ? 'selected' : ''}>Terminé</option>
                        <option value="cancelled" ${apt.status === 'cancelled' ? 'selected' : ''}>Annulé</option>
                      </select>
                      <a href="https://wa.me/${apt.clientPhone.replace(/\s+/g, '').replace('+', '')}?text=${encodeURIComponent('Bonjour ' + apt.clientName + ' ! Le Salon Elle & Lui confirme votre RDV pour ' + apt.serviceName + ' à ' + apt.timeSlot + '.')}"
                         target="_blank" rel="noopener" class="btn-icon-action whatsapp" title="WhatsApp client">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771z"/></svg>
                      </a>
                      <button class="btn-icon-action edit" data-edit-apt-id="${apt.id}" title="Modifier">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button class="btn-icon-action delete" data-delete-apt-id="${apt.id}" title="Supprimer">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                `).join('') : `
                  <div class="daily-free-slot-hint" data-free-slot="${slot}" data-free-date="${dateStr}">
                    <span>+</span> Créneau disponible à ${slot}
                  </div>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.wireCalendarCardEvents(container);

    // Écouteur sur les créneaux libres pour ouvrir prérempli
    container.querySelectorAll('[data-free-slot]').forEach(btn => {
      btn.addEventListener('click', () => {
        const slot = btn.dataset.freeSlot;
        const date = btn.dataset.freeDate;
        const quickAdd = document.getElementById('quickAddForm');
        if (quickAdd) {
          quickAdd.classList.add('open');
          document.getElementById('quickTime').value = slot;
          document.getElementById('quickDate').value = date;
          document.getElementById('quickClientName').focus();
        }
      });
    });
  }

  /* --- Vue 2 : Hebdomadaire (Scroll Horizontal Fluide J-7 à J+7 avec Aujourd'hui sur la gauche) --- */
  renderWeeklyCalendar() {
    const container = document.getElementById('calendarViewContainer');
    if (!container) return;

    // Référence: la date sélectionnée (ou aujourd'hui)
    const baseDate = new Date(this.calendarDate);
    baseDate.setHours(0, 0, 0, 0);

    const todayIso = new Date().toISOString().split('T')[0];
    const daysData = [];

    // Fenêtre glissante de 15 jours : de J-7 à J+7
    for (let offset = -7; offset <= 7; offset++) {
      const cur = new Date(baseDate);
      cur.setDate(baseDate.getDate() + offset);
      const isoStr = cur.toISOString().split('T')[0];
      const isToday = isoStr === todayIso;

      const rawDayName = cur.toLocaleDateString('fr-FR', { weekday: 'short' });
      const dayName = rawDayName.charAt(0).toUpperCase() + rawDayName.slice(1).replace('.', '');
      const dayNum = cur.getDate();
      const monthShort = cur.toLocaleDateString('fr-FR', { month: 'short' });

      daysData.push({
        dateObj: cur,
        isoStr,
        offset,
        dayName,
        dayNum,
        monthShort,
        isToday,
        appointments: this.getFilteredAppointments().filter(a => a.date === isoStr)
      });
    }

    container.innerHTML = `
      <!-- Barre d'aide au défilement hebdomadaire -->
      <div class="weekly-scroll-toolbar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; padding: 0.5rem 0.85rem; background: var(--bg-surface-soft); border-radius: var(--radius-sm); border: 1px solid rgba(212, 163, 115, 0.25);">
        <button type="button" class="btn-text-action" id="btnScrollWeekPast" style="font-size: 0.82rem; font-weight: 700; color: var(--color-gold-700); cursor: pointer; background: none; border: none; display: flex; align-items: center; gap: 0.35rem;">
          ◀ 7 jours passés
        </button>
        <button type="button" class="btn-text-action" id="btnScrollWeekToday" style="font-size: 0.82rem; font-weight: 700; color: #1a1614; background: var(--gradient-gold); padding: 0.35rem 0.95rem; border-radius: var(--radius-full); border: none; cursor: pointer; box-shadow: 0 2px 8px rgba(212, 163, 115, 0.35);">
          ✦ Aujourd'hui
        </button>
        <button type="button" class="btn-text-action" id="btnScrollWeekFuture" style="font-size: 0.82rem; font-weight: 700; color: var(--color-gold-700); cursor: pointer; background: none; border: none; display: flex; align-items: center; gap: 0.35rem;">
          7 jours futurs ▶
        </button>
      </div>

      <div class="cal-weekly-grid" id="calWeeklyGrid">
        ${daysData.map(d => `
          <div class="weekly-day-col ${d.isToday ? 'is-today' : ''}" data-iso="${d.isoStr}">
            <div class="weekly-col-header">
              <div class="weekly-day-name">${d.dayName}</div>
              <div class="weekly-day-num" style="display: flex; align-items: baseline; justify-content: center; gap: 0.25rem;">
                <span>${d.dayNum}</span>
                <span style="font-size: 0.72rem; font-weight: 500; opacity: 0.85;">${d.monthShort}</span>
              </div>
              <small style="font-size: 0.72rem; opacity: 0.85;">${d.appointments.length} RDV</small>
            </div>
            <div class="weekly-col-body">
              ${d.appointments.length > 0 ? d.appointments.map(apt => `
                <div class="weekly-apt-card ${apt.status}" data-apt-id="${apt.id}">
                  <div class="weekly-apt-time">${apt.timeSlot}</div>
                  <div class="weekly-apt-client" title="${apt.clientName}">${apt.clientName}</div>
                  <div class="weekly-apt-service" title="${apt.serviceName}">${apt.serviceName}</div>
                  <div style="margin-top: 0.4rem; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.72rem; font-weight: 700; color: var(--color-gold-700);">${apt.priceLabel || apt.price + ' F'}</span>
                    <a href="https://wa.me/${apt.clientPhone.replace(/\s+/g, '').replace('+', '')}" target="_blank" rel="noopener" class="btn-icon-action whatsapp" style="width: 22px; height: 22px;">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771z"/></svg>
                    </a>
                  </div>
                </div>
              `).join('') : `
                <div style="text-align: center; padding: 2rem 0.5rem; color: var(--text-light); font-size: 0.76rem;">
                  Libre
                </div>
              `}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    const grid = container.querySelector('#calWeeklyGrid');
    const todayCol = container.querySelector('.weekly-day-col.is-today') || container.querySelector('.weekly-day-col[data-iso="' + todayIso + '"]');

    const scrollToToday = () => {
      if (todayCol && grid) {
        grid.scrollTo({
          left: todayCol.offsetLeft - grid.offsetLeft,
          behavior: 'smooth'
        });
      }
    };

    // Aligner Aujourd'hui en premier sur la gauche dès l'affichage
    setTimeout(() => {
      if (todayCol && grid) {
        grid.scrollLeft = todayCol.offsetLeft - grid.offsetLeft;
      }
    }, 60);

    const btnToday = container.querySelector('#btnScrollWeekToday');
    if (btnToday) btnToday.addEventListener('click', scrollToToday);

    const btnPast = container.querySelector('#btnScrollWeekPast');
    if (btnPast) {
      btnPast.addEventListener('click', () => {
        if (grid) grid.scrollBy({ left: -360, behavior: 'smooth' });
      });
    }

    const btnFuture = container.querySelector('#btnScrollWeekFuture');
    if (btnFuture) {
      btnFuture.addEventListener('click', () => {
        if (grid) grid.scrollBy({ left: 360, behavior: 'smooth' });
      });
    }

    this.wireCalendarCardEvents(container);
  }

  /* --- Vue 3 : Mensuelle (Grille Mois standard) --- */
  renderMonthlyCalendar() {
    const container = document.getElementById('calendarViewContainer');
    if (!container) return;

    const ref = this.calendarDate;
    const year = ref.getFullYear();
    const month = ref.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay(); // 0 is Sunday
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // 0 is Monday

    const totalDaysInMonth = lastDay.getDate();
    const todayIso = new Date().toISOString().split('T')[0];

    const allApts = this.getFilteredAppointments();

    const calendarCells = [];

    // Jours du mois précédent
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const iso = prevDate.toISOString().split('T')[0];
      calendarCells.push({
        iso,
        dayNum,
        isOtherMonth: true,
        isToday: false,
        appointments: allApts.filter(a => a.date === iso)
      });
    }

    // Jours du mois courant
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const curDate = new Date(year, month, day);
      const iso = curDate.toISOString().split('T')[0];
      calendarCells.push({
        iso,
        dayNum: day,
        isOtherMonth: false,
        isToday: iso === todayIso,
        appointments: allApts.filter(a => a.date === iso)
      });
    }

    // Jours du mois suivant pour compléter la grille (multiple de 7)
    const remaining = (7 - (calendarCells.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextDate = new Date(year, month + 1, day);
      const iso = nextDate.toISOString().split('T')[0];
      calendarCells.push({
        iso,
        dayNum: day,
        isOtherMonth: true,
        isToday: false,
        appointments: allApts.filter(a => a.date === iso)
      });
    }

    container.innerHTML = `
      <div class="cal-monthly-grid">
        <div class="monthly-header-row">
          <div>Lun</div><div>Mar</div><div>Mer</div><div>Jeu</div><div>Ven</div><div>Sam</div><div>Dim</div>
        </div>
        <div class="monthly-body-grid">
          ${calendarCells.map(cell => `
            <div class="monthly-day-cell ${cell.isOtherMonth ? 'is-other-month' : ''} ${cell.isToday ? 'is-today' : ''}" data-day-iso="${cell.iso}">
              <div class="monthly-day-num">${cell.dayNum}</div>
              <div class="day-apt-list">
                ${cell.appointments.slice(0, 2).map(apt => `
                  <div class="monthly-apt-pill ${apt.status}" title="${apt.timeSlot} - ${apt.clientName} (${apt.serviceName})">
                    ${apt.timeSlot} ${apt.clientName}
                  </div>
                `).join('')}
                ${cell.appointments.length > 2 ? `
                  <div class="monthly-more-pill">+${cell.appointments.length - 2} autres</div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Clic sur un jour du mois : bascule directement sur la vue quotidienne de ce jour !
    container.querySelectorAll('.monthly-day-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const iso = cell.dataset.dayIso;
        if (iso) {
          this.calendarDate = new Date(iso + 'T12:00:00');
          this.calendarView = 'daily';
          document.querySelectorAll('.cal-view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === 'daily');
          });
          this.renderCalendar();
        }
      });
    });
  }

  wireCalendarCardEvents(container) {
    // Changement de statut dans le calendrier
    container.querySelectorAll('.status-changer').forEach(select => {
      select.addEventListener('change', (e) => {
        this.dashboardManager.updateStatus(select.dataset.aptId, e.target.value);
        this.renderCalendar();
        this.showToast('Statut mis à jour !');
      });
    });

    // Modification d'un rendez-vous via bouton dédié
    container.querySelectorAll('[data-edit-apt-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openEditAppointmentModal(btn.dataset.editAptId);
      });
    });

    // Modification via clic direct sur une carte hebdomadaire
    container.querySelectorAll('.weekly-apt-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('button') || e.target.closest('select')) return;
        this.openEditAppointmentModal(card.dataset.aptId);
      });
    });

    // Suppression d'un rendez-vous
    container.querySelectorAll('[data-delete-apt-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Confirmer la suppression de cette réservation ?')) {
          this.dashboardManager.deleteAppointment(btn.dataset.deleteAptId);
          this.renderCalendar();
          this.showToast('Rendez-vous supprimé du planning');
        }
      });
    });
  }

  /* --- Vue 4 : Tableau Classique --- */
  renderAppointmentsTable() {
    const tableBody = document.getElementById('appointmentsTableBody');
    if (!tableBody) return;

    const list = this.getFilteredAppointments();

    if (list.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-dash-state">
            <div class="empty-dash-icon">📅</div>
            <p>Aucun rendez-vous trouvé pour ces critères.</p>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = list.map(apt => {
      const cleanPhone = apt.clientPhone.replace(/\s+/g, '');
      return `
        <tr data-apt-id="${apt.id}">
          <td>
            <strong>${apt.date}</strong><br>
            <span style="color: var(--color-gold-600); font-weight: 700;">${apt.timeSlot}</span>
          </td>
          <td>
            <div class="client-name-cell">${apt.clientName}</div>
            <a href="tel:${cleanPhone}" class="client-phone-link">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              ${apt.clientPhone}
            </a>
          </td>
          <td>
            <span class="service-cell-tag">${apt.serviceName}</span><br>
            <span class="service-cell-meta">${apt.specialist || ''} (${apt.priceLabel || apt.price + ' F'})</span>
          </td>
          <td>
            <select class="dash-select status-changer" data-apt-id="${apt.id}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">
              <option value="pending" ${apt.status === 'pending' ? 'selected' : ''}>En attente</option>
              <option value="confirmed" ${apt.status === 'confirmed' ? 'selected' : ''}>Confirmé</option>
              <option value="completed" ${apt.status === 'completed' ? 'selected' : ''}>Terminé</option>
              <option value="cancelled" ${apt.status === 'cancelled' ? 'selected' : ''}>Annulé</option>
            </select>
          </td>
          <td>
            <span style="font-size: 0.82rem; color: var(--text-muted);">${apt.notes || '—'}</span>
          </td>
          <td>
            <div class="row-actions">
              <button class="btn-icon-action edit btn-table-edit-apt" data-edit-apt-id="${apt.id}" title="Modifier le rendez-vous">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <a href="https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent('Bonjour ' + apt.clientName + ' ! Le Salon Elle & Lui confirme votre rendez-vous pour ' + apt.serviceName + ' le ' + apt.date + ' à ' + apt.timeSlot + '.')}" 
                 target="_blank" rel="noopener" class="btn-icon-action whatsapp" title="Contacter sur WhatsApp">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771z"/></svg>
              </a>
              <button class="btn-icon-action delete" data-delete-apt-id="${apt.id}" title="Supprimer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    this.wireCalendarCardEvents(tableBody);
  }

  /* ==========================================================================
     MODALE D'ÉDITION DE RENDEZ-VOUS (ACCESSIBLE DEPUIS L'ESPACE SALON)
     ========================================================================== */
  setupEditAppointmentModal() {
    const dialog = document.getElementById('appEditAptModal');
    const form = document.getElementById('appEditAptForm');
    if (!dialog || !form) return;

    dialog.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => dialog.close());
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const aptId = document.getElementById('modalEditAptId').value;
      if (!aptId) return;

      const updated = {
        clientName: document.getElementById('modalEditAptClientName').value.trim(),
        clientPhone: document.getElementById('modalEditAptClientPhone').value.trim(),
        serviceName: document.getElementById('modalEditAptServiceName').value.trim(),
        specialist: document.getElementById('modalEditAptSpecialist').value,
        date: document.getElementById('modalEditAptDate').value,
        timeSlot: document.getElementById('modalEditAptTime').value,
        price: parseInt(document.getElementById('modalEditAptPrice').value, 10) || 0,
        status: document.getElementById('modalEditAptStatus').value,
        notes: document.getElementById('modalEditAptNotes').value.trim()
      };

      this.dashboardManager.updateAppointment(aptId, updated);
      dialog.close();
      this.renderCalendar();
      this.showToast('✅ Rendez-vous modifié et enregistré avec succès !');
    });
  }

  openEditAppointmentModal(aptId) {
    const dialog = document.getElementById('appEditAptModal');
    if (!dialog) return;

    const apt = this.dashboardManager.getAppointmentById(aptId);
    if (!apt) {
      alert('Rendez-vous introuvable');
      return;
    }

    document.getElementById('modalEditAptId').value = apt.id;
    document.getElementById('modalEditAptClientName').value = apt.clientName || '';
    document.getElementById('modalEditAptClientPhone').value = apt.clientPhone || '';
    document.getElementById('modalEditAptServiceName').value = apt.serviceName || '';
    document.getElementById('modalEditAptSpecialist').value = apt.specialist || 'Blandine Youbouet';
    document.getElementById('modalEditAptDate').value = apt.date || '';
    document.getElementById('modalEditAptTime').value = apt.timeSlot || '09:00';
    document.getElementById('modalEditAptPrice').value = apt.price || '';
    document.getElementById('modalEditAptStatus').value = apt.status || 'confirmed';
    document.getElementById('modalEditAptNotes').value = apt.notes || '';

    dialog.showModal();
  }

  /* ==========================================================================
     7. MODALE DE DÉTAIL D'UNE PRESTATION (Bouton Œil)
     ========================================================================== */
  setupServiceDetailModal() {
    const dialog = document.getElementById('serviceDetailDialog');
    if (!dialog) return;

    const closeBtn = document.getElementById('closeDetailDialogBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => dialog.close());
    }

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });

    const bookBtn = document.getElementById('detailBookBtn');
    if (bookBtn) {
      bookBtn.addEventListener('click', () => {
        const serviceId = bookBtn.dataset.serviceId;
        dialog.close();
        if (serviceId) {
          this.openBookingModal(serviceId);
        }
      });
    }
  }

  openServiceDetailModal(serviceId) {
    const dialog = document.getElementById('serviceDetailDialog');
    if (!dialog) return;

    const service = SERVICES_DATA.find(s => s.id === serviceId);
    if (!service) return;

    const catBadge = document.getElementById('detailBadgeCategory');
    if (catBadge) {
      const categoryObj = SERVICE_CATEGORIES.find(c => c.id === service.category);
      catBadge.textContent = categoryObj ? categoryObj.name : 'Soin Professionnel';
    }

    const specBadge = document.getElementById('detailBadgeSpecialist');
    if (specBadge) {
      specBadge.textContent = `✦ Par ${service.responsible}`;
    }

    const iconBox = document.getElementById('detailIconBox');
    if (iconBox) {
      iconBox.className = `sprite-thumb sprite-${service.id}`;
      iconBox.innerHTML = '';
    }

    const titleEl = document.getElementById('detailServiceName');
    if (titleEl) titleEl.textContent = service.name;

    const taglineEl = document.getElementById('detailServiceTagline');
    if (taglineEl) taglineEl.textContent = service.tagline ? `« ${service.tagline} »` : '';

    const priceEl = document.getElementById('detailPriceValue');
    if (priceEl) priceEl.textContent = service.priceLabel;

    const durationEl = document.getElementById('detailDurationValue');
    if (durationEl) {
      const hours = Math.floor(service.durationMinutes / 60);
      const mins = service.durationMinutes % 60;
      durationEl.textContent = hours > 0 ? `${hours}h${mins > 0 ? mins : ''}` : `${mins} min`;
    }

    const descEl = document.getElementById('detailServiceDescription');
    if (descEl) descEl.textContent = service.description;

    const bookBtn = document.getElementById('detailBookBtn');
    if (bookBtn) bookBtn.dataset.serviceId = service.id;

    const whatsappBtn = document.getElementById('detailWhatsAppBtn');
    if (whatsappBtn) {
      const msg = `Bonjour Salon Elle & Lui ! ✨
Je souhaite des renseignements supplémentaires sur la prestation :
✦ *${service.name}* (${service.priceLabel})
Pouvez-vous m'en dire plus sur la disponibilité ?`;
      whatsappBtn.href = `https://wa.me/2250759372441?text=${encodeURIComponent(msg)}`;
    }

    dialog.showModal();
  }

  /* ==========================================================================
     8. PRISE DE RENDEZ-VOUS CLIENT
     ========================================================================== */
  /* ==========================================================================
     8. PRISE DE RENDEZ-VOUS CLIENT (Cards Carrées 100x100px & Scroll Horizontal)
     ========================================================================== */
  populateServiceDropdown() {
    const catContainer = document.getElementById('bookingCategoryPills');
    const cardsGrid = document.getElementById('bookingServiceCardsGrid');
    const hiddenInput = document.getElementById('modalServiceSelect');
    if (!cardsGrid) return;

    // Catégories de filtres rapides
    const categories = [
      { id: 'all', name: 'Tous les soins' },
      { id: 'coiffure-tresses', name: 'Tresses Phares' },
      { id: 'coiffure-soins', name: 'Coiffure & Soins' },
      { id: 'esthetic-spa', name: 'Institut Spa' },
      { id: 'esthetic-ongles', name: 'Onglerie' },
      { id: 'mariee', name: 'Forfaits Mariée' }
    ];

    if (catContainer) {
      catContainer.innerHTML = categories.map(c => `
        <button type="button" class="service-cat-pill ${c.id === 'all' ? 'active' : ''}" data-cat="${c.id}">
          ${c.name}
        </button>
      `).join('');

      catContainer.querySelectorAll('.service-cat-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          catContainer.querySelectorAll('.service-cat-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const cat = btn.dataset.cat;
          const cards = cardsGrid.querySelectorAll('.service-card-square');
          cards.forEach(card => {
            if (cat === 'all' || card.dataset.category === cat) {
              card.style.display = 'flex';
            } else {
              card.style.display = 'none';
            }
          });
        });
      });
    }

    // Rendu des cartes carrées 100px x 100px
    cardsGrid.innerHTML = SERVICES_DATA.map(s => {
      const priceClean = s.priceLabel.replace('À partir de ', '').replace(' FCFA', ' F');
      return `
        <div class="service-card-square ${this.selectedService?.id === s.id ? 'selected' : ''}" 
             data-service-id="${s.id}" 
             data-category="${s.category}" 
             title="${s.name} - ${s.priceLabel} (${s.responsible})">
          ${s.image ? 
            `<img src="${s.image}" alt="${s.name}" class="service-card-img" loading="lazy" />` : 
            `<div class="service-card-icon-fallback">✦</div>`}
          <div class="service-card-name">${s.name}</div>
          <div class="service-card-price">${priceClean}</div>
        </div>
      `;
    }).join('');

    // Clic sur une carte carrée 100x100
    cardsGrid.querySelectorAll('.service-card-square').forEach(card => {
      card.addEventListener('click', () => {
        cardsGrid.querySelectorAll('.service-card-square').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const sId = card.dataset.serviceId;
        if (hiddenInput) hiddenInput.value = sId;
        this.updateSelectedService(sId);
        // Défilement automatique horizontal vers l'Étape 2 (Date)
        setTimeout(() => this.goToBookingStep(2), 200);
      });
    });
  }

  updateSelectedService(serviceId) {
    const service = SERVICES_DATA.find(s => s.id === serviceId);
    this.selectedService = service || null;
    const summaryBox = document.getElementById('bookingSummaryBox');

    if (service && summaryBox) {
      const hours = Math.floor(service.durationMinutes / 60);
      const mins = service.durationMinutes % 60;
      const durStr = hours > 0 ? `${hours}h${mins > 0 ? mins : ''}` : `${mins} min`;

      summaryBox.style.display = 'block';
      summaryBox.innerHTML = `
        <div class="booking-summary-row">
          <span>Prestation :</span>
          <strong>${service.name}</strong>
        </div>
        <div class="booking-summary-row">
          <span>Spécialiste :</span>
          <span>${service.responsible}</span>
        </div>
        <div class="booking-summary-row">
          <span>Durée estimée :</span>
          <span>~${durStr}</span>
        </div>
        <div class="booking-summary-row total">
          <span>Tarif indicatif :</span>
          <span>${service.priceLabel}</span>
        </div>
      `;
    } else if (summaryBox) {
      summaryBox.style.display = 'none';
    }
  }

  /* ==========================================================================
     8. WIZARD HORIZONTAL 5 ÉTAPES - PRISE DE RENDEZ-VOUS (SCROLL HORIZONTAL)
     ========================================================================== */
  setupBookingWizard() {
    this.currentBookingStep = 1;
    const submitBtn = document.getElementById('btnSubmitBooking');
    const stepperItems = document.querySelectorAll('.booking-step-item');
    const dots = document.querySelectorAll('.wizard-dot');
    const viewport = document.getElementById('bookingSliderViewport');

    // Écoute du défilement horizontal naturel pour synchroniser le stepper et les points
    if (viewport) {
      viewport.addEventListener('scroll', () => {
        const scrollLeft = viewport.scrollLeft;
        const width = viewport.clientWidth || 1;
        const step = Math.min(5, Math.max(1, Math.round(scrollLeft / width) + 1));
        if (step !== this.currentBookingStep) {
          this.currentBookingStep = step;
          this.updateWizardIndicators(step);
          if (step === 5) {
            this.populateBookingWizardRecap();
          }
        }
      }, { passive: true });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        this.handleBookingSubmit();
      });
    }

    // Navigation par clic sur les étapes du stepper
    stepperItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetStep = parseInt(item.dataset.step, 10);
        this.goToBookingStep(targetStep);
      });
    });

    // Clic sur les points indicateurs
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const targetStep = parseInt(dot.dataset.step, 10);
        this.goToBookingStep(targetStep);
      });
    });

    // Raccourcis Date rapide (Aujourd'hui, Demain, Ce Samedi)
    const btnToday = document.getElementById('btnDateToday');
    const btnTomorrow = document.getElementById('btnDateTomorrow');
    const btnSat = document.getElementById('btnDateSaturday');
    const dateInput = document.getElementById('modalBookingDate');

    if (btnToday && dateInput) {
      btnToday.addEventListener('click', () => {
        const todayStr = new Date().toISOString().split('T')[0];
        dateInput.value = todayStr;
        this.showToast('Date sélectionnée : Aujourd\'hui !');
        setTimeout(() => this.goToBookingStep(3), 180);
      });
    }

    if (btnTomorrow && dateInput) {
      btnTomorrow.addEventListener('click', () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        dateInput.value = d.toISOString().split('T')[0];
        this.showToast('Date sélectionnée : Demain !');
        setTimeout(() => this.goToBookingStep(3), 180);
      });
    }

    if (btnSat && dateInput) {
      btnSat.addEventListener('click', () => {
        const d = new Date();
        const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
        const diff = dayOfWeek === 6 ? 7 : (6 - dayOfWeek);
        d.setDate(d.getDate() + diff);
        dateInput.value = d.toISOString().split('T')[0];
        this.showToast('Date sélectionnée : Samedi prochain !');
        setTimeout(() => this.goToBookingStep(3), 180);
      });
    }
  }

  goToBookingStep(step) {
    const clampedStep = Math.max(1, Math.min(5, step));
    this.currentBookingStep = clampedStep;

    const viewport = document.getElementById('bookingSliderViewport');
    if (viewport) {
      const width = viewport.clientWidth;
      viewport.scrollTo({
        left: (clampedStep - 1) * width,
        behavior: 'smooth'
      });
    }

    this.updateWizardIndicators(clampedStep);

    if (clampedStep === 5) {
      this.populateBookingWizardRecap();
    }
  }

  updateWizardIndicators(step) {
    const stepperItems = document.querySelectorAll('.booking-step-item');
    stepperItems.forEach(item => {
      const itemStep = parseInt(item.dataset.step, 10);
      item.classList.toggle('active', itemStep === step);
      item.classList.toggle('completed', itemStep < step);
    });

    const dots = document.querySelectorAll('.wizard-dot');
    dots.forEach(dot => {
      const dotStep = parseInt(dot.dataset.step, 10);
      dot.classList.toggle('active', dotStep === step);
    });
  }

  validateBookingStep(step) {
    if (step === 1) {
      const hiddenInput = document.getElementById('modalServiceSelect');
      if (!hiddenInput || !hiddenInput.value) {
        this.showToast('Veuillez sélectionner une prestation.');
        return false;
      }
      return true;
    }

    if (step === 2) {
      const dateInput = document.getElementById('modalBookingDate');
      if (!dateInput || !dateInput.value) {
        this.showToast('Veuillez choisir une date pour votre rendez-vous.');
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!this.selectedTimeSlot) {
        this.showToast('Veuillez sélectionner un créneau horaire.');
        return false;
      }
      return true;
    }

    if (step === 4) {
      const clientName = document.getElementById('modalClientName');
      const clientPhone = document.getElementById('modalClientPhone');
      if (!clientName || !clientName.value.trim() || !clientPhone || !clientPhone.value.trim()) {
        this.showToast('Veuillez renseigner votre nom et votre numéro WhatsApp.');
        return false;
      }
      return true;
    }

    return true;
  }

  populateBookingWizardRecap() {
    const recapBox = document.getElementById('bookingWizardRecap');
    if (!recapBox) return;

    const hiddenInput = document.getElementById('modalServiceSelect');
    const serviceId = hiddenInput ? hiddenInput.value : null;
    const service = SERVICES_DATA.find(s => s.id === serviceId);

    const dateVal = document.getElementById('modalBookingDate')?.value;
    let formattedDate = dateVal;
    if (dateVal) {
      const d = new Date(dateVal + 'T00:00:00');
      formattedDate = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    }

    const clientName = document.getElementById('modalClientName')?.value.trim() || 'Non renseigné';
    const clientPhone = document.getElementById('modalClientPhone')?.value.trim() || 'Non renseigné';

    recapBox.innerHTML = `
      <div class="recap-row">
        <span class="recap-label">Prestation :</span>
        <strong class="recap-value">${service ? service.name : 'Non sélectionnée'}</strong>
      </div>
      <div class="recap-row">
        <span class="recap-label">Responsable &amp; Cadre :</span>
        <span class="recap-value">${service ? service.responsible : '-'}</span>
      </div>
      <div class="recap-row">
        <span class="recap-label">Date du RDV :</span>
        <strong class="recap-value">${formattedDate || '-'}</strong>
      </div>
      <div class="recap-row">
        <span class="recap-label">Heure d'arrivée :</span>
        <strong class="recap-value" style="color: var(--color-gold-700);">${this.selectedTimeSlot || '-'}</strong>
      </div>
      <div class="recap-row">
        <span class="recap-label">Client :</span>
        <span class="recap-value">${clientName}</span>
      </div>
      <div class="recap-row">
        <span class="recap-label">WhatsApp :</span>
        <span class="recap-value">${clientPhone}</span>
      </div>
      <div class="recap-row" style="margin-top: 0.25rem;">
        <span class="recap-label">Tarif indicatif :</span>
        <strong class="recap-value highlight">${service ? service.priceLabel : '-'}</strong>
      </div>
    `;
  }

  openBookingModal(serviceId = null) {
    const dialog = document.getElementById('bookingDialog');
    if (!dialog) return;

    const dateInput = document.getElementById('modalBookingDate');
    const todayStr = new Date().toISOString().split('T')[0];
    dateInput.min = todayStr;
    if (!dateInput.value) {
      dateInput.value = todayStr;
    }

    this.renderTimeSlots();

    if (serviceId) {
      const hiddenInput = document.getElementById('modalServiceSelect');
      if (hiddenInput) hiddenInput.value = serviceId;
      const cards = document.querySelectorAll('.service-card-square');
      cards.forEach(c => {
        c.classList.toggle('selected', c.dataset.serviceId === serviceId);
      });
      this.updateSelectedService(serviceId);
    }

    dialog.showModal();
    this.goToBookingStep(1);
  }

  renderTimeSlots() {
    const container = document.getElementById('timeSlotsContainer');
    if (!container) return;

    const slots = generateTimeSlots();
    container.innerHTML = slots.map(slot => `
      <div class="time-slot-chip ${this.selectedTimeSlot === slot ? 'selected' : ''}" data-slot="${slot}">
        ${slot}
      </div>
    `).join('');

    container.querySelectorAll('.time-slot-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        container.querySelectorAll('.time-slot-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        this.selectedTimeSlot = chip.dataset.slot;
        // Défilement automatique doux vers l'étape suivante (Coordonnées)
        setTimeout(() => this.goToBookingStep(4), 220);
      });
    });
  }

  handleBookingSubmit() {
    const serviceSelect = document.getElementById('modalServiceSelect');
    const serviceId = serviceSelect ? serviceSelect.value : null;
    const date = document.getElementById('modalBookingDate').value;
    const clientName = document.getElementById('modalClientName').value.trim();
    const clientPhone = document.getElementById('modalClientPhone').value.trim();
    const notes = document.getElementById('modalClientNotes').value.trim();

    if (!serviceId) {
      this.goToBookingStep(1);
      this.showToast('Veuillez sélectionner une prestation.');
      return;
    }
    if (!this.selectedTimeSlot) {
      this.goToBookingStep(3);
      this.showToast('Veuillez sélectionner un créneau horaire.');
      return;
    }
    if (!clientName || !clientPhone) {
      this.goToBookingStep(4);
      this.showToast('Veuillez renseigner votre nom et votre numéro de téléphone.');
      return;
    }

    const service = SERVICES_DATA.find(s => s.id === serviceId);

    const bookingPayload = {
      serviceId,
      serviceName: service.name,
      specialist: service.responsible,
      price: service.price,
      priceLabel: service.priceLabel,
      durationMinutes: service.durationMinutes,
      date,
      timeSlot: this.selectedTimeSlot,
      clientName,
      clientPhone,
      notes,
      status: 'pending'
    };

    this.dashboardManager.addAppointment(bookingPayload);
    const whatsappUrl = getWhatsAppBookingUrl(bookingPayload);

    document.getElementById('bookingDialog').close();
    document.getElementById('bookingForm').reset();
    this.selectedTimeSlot = null;
    this.selectedService = null;
    this.goToBookingStep(1);
    const summaryBox = document.getElementById('bookingSummaryBox');
    if (summaryBox) summaryBox.style.display = 'none';

    this.showToast('Rendez-vous enregistré ! Ouverture de WhatsApp...');

    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
    }, 600);
  }

  /* ==========================================================================
     9. MODALE PAIEMENT WAVE
     ========================================================================== */
  setupWavePaymentModal() {
    const dialog = document.getElementById('wavePaymentDialog');
    const openBtn = document.getElementById('navWavePayBtn');
    const closeBtn = document.getElementById('closeWaveDialogBtn');
    const amountInput = document.getElementById('waveAmountInput');
    const quickBtns = document.querySelectorAll('.wave-quick-btn');
    const copyBtn = document.getElementById('copyWaveLinkBtn');
    const copyText = document.getElementById('copyWaveLinkText');

    if (!dialog) return;

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        const defaultAmount = amountInput ? parseInt(amountInput.value, 10) || 10000 : 10000;
        this.updateWavePayment(defaultAmount);
        dialog.showModal();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => dialog.close());
    }

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });

    if (amountInput) {
      amountInput.addEventListener('input', () => {
        let val = parseInt(amountInput.value, 10);
        if (isNaN(val) || val < 0) val = 0;
        quickBtns.forEach(btn => {
          btn.classList.toggle('active', parseInt(btn.dataset.amount, 10) === val);
        });
        this.updateWavePayment(val);
      });
    }

    quickBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const amount = parseInt(btn.dataset.amount, 10);
        if (amountInput) amountInput.value = amount;
        quickBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.updateWavePayment(amount);
      });
    });

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const directLink = document.getElementById('waveDirectPayLink');
        const url = directLink ? directLink.href : (this.waveBaseUrl + '10000');
        navigator.clipboard.writeText(url).then(() => {
          if (copyText) copyText.textContent = 'Copié !';
          this.showToast('Lien Wave copié !');
          setTimeout(() => {
            if (copyText) copyText.textContent = 'Copier lien';
          }, 2500);
        }).catch(() => {
          this.showToast('Lien Wave : ' + url);
        });
      });
    }
  }

  updateWavePayment(amount) {
    const qrBox = document.getElementById('waveQrCodeBox');
    const amountLabel = document.getElementById('waveQrAmountLabel');
    const directLink = document.getElementById('waveDirectPayLink');

    const paymentUrl = this.waveBaseUrl + (amount > 0 ? amount : '');

    if (directLink) directLink.href = paymentUrl;
    if (amountLabel) amountLabel.textContent = (amount > 0 ? amount.toLocaleString('fr-FR') : '0') + ' FCFA';

    if (!qrBox || typeof QRCode === 'undefined') return;

    try {
      if (!this.waveQrCodeInstance) {
        qrBox.innerHTML = '';
        this.waveQrCodeInstance = new QRCode(qrBox, {
          text: paymentUrl,
          width: 190,
          height: 190,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.M
        });
      } else {
        this.waveQrCodeInstance.makeCode(paymentUrl);
      }
    } catch (err) {
      console.warn('Erreur génération QRCode Wave:', err);
    }
  }

  /* ==========================================================================
     10. ÉCOUTEURS D'ÉVÉNEMENTS GLOBAUX & DÉCLENCHEURS DE MODALES
     ========================================================================== */
  setupEventListeners() {
    // Boutons flottants bas-gauche
    const floatProdBtn = document.getElementById('btnFloatingProductsModal');
    if (floatProdBtn) {
      floatProdBtn.addEventListener('click', () => this.openCatalogModal('coiffure'));
    }

    const floatEventsBtn = document.getElementById('btnFloatingEventsModal');
    if (floatEventsBtn) {
      floatEventsBtn.addEventListener('click', () => this.openEventsModal());
    }

    // Déclencheurs de Modale de Catalogue (Nav, Hero, Footer)
    document.querySelectorAll('[data-trigger-catalog]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const realm = btn.dataset.triggerCatalog || 'coiffure';
        this.openCatalogModal(realm);
      });
    });

    // Déclencheurs de Modale Événementielle (Nav & Footer)
    document.querySelectorAll('[data-trigger-events]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openEventsModal();
      });
    });

    // Déclencheurs Dashboard Espace Salon
    document.querySelectorAll('[data-trigger-dashboard]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openDashboardModal();
      });
    });

    // Gestion globale du scroll lock et des modales
    const updateModalScrollLock = () => {
      const anyOpen = document.querySelectorAll('dialog[open]').length > 0;
      if (anyOpen) {
        document.body.classList.add('modal-open');
      } else {
        document.body.classList.remove('modal-open');
      }
    };

    // Écouter l'ouverture et la fermeture de tous les dialogues
    document.querySelectorAll('dialog').forEach(dialog => {
      // Observer le changement d'attribut 'open'
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.attributeName === 'open') {
            updateModalScrollLock();
          }
        });
      });
      observer.observe(dialog, { attributes: true });

      // Événement standard close
      dialog.addEventListener('close', () => {
        updateModalScrollLock();
      });

      // Fermeture au clic sur le backdrop
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          dialog.close();
        }
      });
    });

    // Bouton Fermer générique de dialogue ([data-close-modal])
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dialog = e.target.closest('dialog');
        if (dialog) dialog.close();
      });
    });

    // Formulaire de réservation
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
      bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleBookingSubmit();
      });
    }

    // Boutons Prendre RDV dans le Hero et Nav
    const heroBookBtn = document.getElementById('heroBookBtn');
    if (heroBookBtn) heroBookBtn.addEventListener('click', () => this.openBookingModal());

    const navBookBtn = document.getElementById('navBookBtn');
    if (navBookBtn) navBookBtn.addEventListener('click', () => this.openBookingModal());

    // Mobile Navigation Drawer Toggle
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const mainNav = document.getElementById('mainNav');
    if (mobileToggle && mainNav) {
      mobileToggle.addEventListener('click', () => {
        mainNav.classList.toggle('mobile-open');
      });

      mainNav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          mainNav.classList.remove('mobile-open');
        });
      });
    }
  }

  setupScrollEffects() {
    const header = document.querySelector('.main-header');
    if (!header) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  showToast(message) {
    let toast = document.getElementById('appToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'appToast';
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#25d366" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      <span>${message}</span>
    `;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3800);
  }
}

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  window.salonApp = new SalonApp();
});
