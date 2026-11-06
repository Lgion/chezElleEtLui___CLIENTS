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

    // État de la Hiérarchie des Services (2 à 3 Niveaux)
    this.activeServiceFamilyId = null;
    this.activeServiceCatId = null;
    this.servicesSearchQuery = '';

    // État de la Modale Catalogue des Coiffures (Lookbook & Planches)
    this.activeHairCatId = 'cat1';
    this.activeHairStyle = 'all'; // 'all', 'style1', 'style2'
    this.hairSearchQuery = '';
    this.selectedBoardIdx = null; // Planche sélectionnée en premier
    this.isBannerUnfolded = false; // Bannière foldée par défaut
    this.currentLightboxBoards = [];
    this.currentLightboxIndex = 0;

    // État Booking Hiérarchique
    this.bookingFamily = null;
    this.bookingCategory = null;
    this.bookingModelNum = null;
    this.bookingModelName = null;
    this.bookingCalendarInstance = null;
    this.bookingDateFormat = 'fr';
    this.selectedBookingDate = new Date().toISOString().split('T')[0];

    this.init();
  }

  init() {
    this.cardOverridesKey = 'salon_elle_lui_card_overrides_v1';
    this.snapshotOriginalCardsData();
    this.loadCardOverrides();
    this.applySalonSettings();
    this.setupLiveStatus();
    this.setupCatalogModal();
    this.setupHairCatalogModal();
    this.setupCardEditorModal();
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
    this.handleUrlDeepLinking();
  }

  handleUrlDeepLinking() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('service')) {
        const sId = params.get('service');
        const service = SERVICES_DATA.find(s => s.id === sId);
        if (service) {
          setTimeout(() => {
            this.openCatalogModal(service.category.startsWith('coiffure-') ? 'coiffure' : 'esthetic');
            this.openServiceDetailModal(sId);
          }, 350);
        }
      } else if (params.has('produit')) {
        const pId = params.get('produit');
        const product = PRODUCTS_DATA.find(p => p.id === pId);
        if (product) {
          setTimeout(() => {
            this.openCatalogModal('produits');
            this.openProductDetailModal(pId);
          }, 350);
        }
      }
    } catch (err) {
      console.warn('Deep-linking init error:', err);
    }
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
     2. MODALE CATALOGUE DES SOINS & PRODUITS (HIÉRARCHIE 2 À 3 NIVEAUX & DRILL-DOWN)
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

    // Champ de Recherche des Produits Phares (dans filter-level-2)
    const prodSearchInput = document.getElementById('modalServiceSearchInput');
    const prodClearBtn = document.getElementById('modalSearchClearBtn');
    if (prodSearchInput) {
      prodSearchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        if (prodClearBtn) {
          prodClearBtn.style.display = this.searchQuery ? 'block' : 'none';
        }
        this.renderCatalogItems();
      });
    }

    if (prodClearBtn) {
      prodClearBtn.addEventListener('click', () => {
        if (prodSearchInput) {
          prodSearchInput.value = '';
          this.searchQuery = '';
          prodClearBtn.style.display = 'none';
          this.renderCatalogItems();
          prodSearchInput.focus();
        }
      });
    }

    // Champ de Recherche des Prestations (dans le fil d'Ariane pour Coiffure & Esthétique)
    const servicesSearchInput = document.getElementById('modalCatalogServicesSearchInput');
    if (servicesSearchInput) {
      servicesSearchInput.addEventListener('input', (e) => {
        this.servicesSearchQuery = e.target.value.toLowerCase().trim();
        this.renderCatalogItems();
      });
    }

    // Initialisation par défaut
    this.setCatalogRealm('coiffure');
  }

  setCatalogRealm(realm) {
    this.activeRealm = realm;
    this.activeCategory = 'all';
    this.activeServiceFamilyId = null;
    this.activeServiceCatId = null;
    this.servicesSearchQuery = '';

    const servInput = document.getElementById('modalCatalogServicesSearchInput');
    if (servInput) servInput.value = '';

    // Mettre à jour les boutons Niveau 1 et le thème de fond dédié
    const dialog = document.getElementById('catalogModalDialog');
    if (dialog) {
      dialog.classList.remove('realm-coiffure', 'realm-esthetic', 'realm-produits');
      dialog.classList.add(`realm-${realm}`);
      dialog.querySelectorAll('.level1-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.realm === realm);
      });
    }

    // Basculer l'affichage : .filter-level-2 masqué pour les services (réservé aux produits)
    const filterLevel2 = document.getElementById('catalogFilterLevel2');
    const breadcrumbBar = document.getElementById('catalogBreadcrumbBar');
    const servicesGrid = document.getElementById('modalServicesGrid');
    const productsGrid = document.getElementById('modalProductsGrid');

    if (realm === 'produits') {
      if (filterLevel2) filterLevel2.style.display = 'flex';
      if (breadcrumbBar) breadcrumbBar.style.display = 'none';
      if (servicesGrid) servicesGrid.style.display = 'none';
      if (productsGrid) productsGrid.style.display = 'grid';
      this.renderSubfilterChips();
    } else {
      if (filterLevel2) filterLevel2.style.display = 'none';
      if (breadcrumbBar) breadcrumbBar.style.display = 'flex';
      if (servicesGrid) servicesGrid.style.display = 'grid';
      if (productsGrid) productsGrid.style.display = 'none';
    }

    this.renderCatalogItems();
  }

  renderCatalogBreadcrumb() {
    const breadcrumb = document.getElementById('catalogBreadcrumb');
    if (!breadcrumb) return;

    const realmName = this.activeRealm === 'coiffure' ? 'Coiffure' : 'Institut Esthétique';
    const realmIcon = this.activeRealm === 'coiffure' ? '💇‍♀️' : '✨';
    const families = (typeof SERVICE_FAMILIES !== 'undefined')
      ? SERVICE_FAMILIES.filter(f => f.realm === this.activeRealm)
      : [];
    const activeFamily = this.activeServiceFamilyId
      ? families.find(f => f.id === this.activeServiceFamilyId)
      : null;

    // Niveau 1 : Vue d'ensemble des familles
    if (!this.activeServiceFamilyId) {
      breadcrumb.innerHTML = `
        <span class="breadcrumb-item current">${realmIcon} <strong>${realmName}</strong> (${families.length} familles de soins)</span>
      `;
      return;
    }

    // Niveau 2 : Une famille est sélectionnée (ex: Nattes ou Couleurs)
    if (this.activeServiceFamilyId && !this.activeServiceCatId) {
      breadcrumb.innerHTML = `
        <button type="button" class="breadcrumb-back-btn" id="btnBreadcrumbBack" title="Revenir aux familles">
          ← Retour aux familles
        </button>
        <span class="breadcrumb-item" data-breadcrumb-jump="root">${realmName}</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-item current">${activeFamily ? activeFamily.name : ''}</span>
      `;
    } else if (this.activeServiceFamilyId && this.activeServiceCatId) {
      // Niveau 3 : Une catégorie de nattes/tresses est sélectionnée
      let catTitle = `Catégorie ${this.activeServiceCatId.replace('cat', '')}`;
      if (typeof HAIR_CATALOG_DATA !== 'undefined') {
        const cData = HAIR_CATALOG_DATA.find(c => c.id === this.activeServiceCatId);
        if (cData) catTitle = cData.shortTitle;
      }
      breadcrumb.innerHTML = `
        <button type="button" class="breadcrumb-back-btn" id="btnBreadcrumbBack" title="Revenir aux catégories">
          ← Retour aux catégories
        </button>
        <span class="breadcrumb-item" data-breadcrumb-jump="root">${realmName}</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-item" data-breadcrumb-jump="family">${activeFamily ? activeFamily.shortName : ''}</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-item current">${catTitle}</span>
      `;
    }

    // Écouteurs sur le bouton retour et les miettes de pain
    const backBtn = breadcrumb.querySelector('#btnBreadcrumbBack');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (this.activeServiceCatId) {
          this.activeServiceCatId = null;
        } else {
          this.activeServiceFamilyId = null;
        }
        this.renderCatalogItems();
      });
    }

    breadcrumb.querySelectorAll('[data-breadcrumb-jump]').forEach(el => {
      el.addEventListener('click', () => {
        const jump = el.dataset.breadcrumbJump;
        if (jump === 'root') {
          this.activeServiceFamilyId = null;
          this.activeServiceCatId = null;
        } else if (jump === 'family') {
          this.activeServiceCatId = null;
        }
        this.renderCatalogItems();
      });
    });
  }

  renderSubfilterChips() {
    const container = document.getElementById('catalogSubfilterChips');
    if (!container) return;

    const allProdCount = PRODUCTS_DATA.length;
    const countBySub = (subId) => PRODUCTS_DATA.filter(p => p.subCategoryId === subId).length;

    const subfilters = [
      { id: 'all', name: 'Tous les produits', count: allProdCount, image: 'assets/img/coiffure-sieges.jpg' },
      { id: 'prod-capillaire', name: 'Soins Capillaires', count: countBySub('prod-capillaire'), image: 'assets/img/coiffure-postes.jpg' },
      { id: 'prod-meches', name: 'Mèches Remy', count: countBySub('prod-meches'), image: 'assets/img/coiffure-equipe.jpg' },
      { id: 'prod-spa', name: 'Soins Spa K.V.S', count: countBySub('prod-spa'), image: 'assets/img/esthetic-spa-ambiance.jpg' }
    ];

    container.innerHTML = subfilters.map(sub => `
      <button class="subfilter-chip ${this.activeCategory === sub.id ? 'active' : ''}" data-sub-id="${sub.id}">
        <img src="${sub.image}" alt="" class="subfilter-thumb-img" loading="lazy" />
        <span class="subfilter-label">${sub.name}</span>
        <span class="subfilter-count">(${sub.count})</span>
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

    this.renderCatalogBreadcrumb();

    // 1. Si une recherche textuelle est saisie
    if (this.servicesSearchQuery) {
      let filtered = SERVICES_DATA.filter(s => {
        const isCoiffure = s.category.startsWith('coiffure-');
        const matchesRealm = this.activeRealm === 'coiffure' ? isCoiffure : !isCoiffure;
        if (!matchesRealm) return false;
        const q = this.servicesSearchQuery;
        return s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          (s.tagline && s.tagline.toLowerCase().includes(q)) ||
          s.responsible.toLowerCase().includes(q);
      });

      if (filtered.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
            <p style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">Aucune prestation trouvée pour « ${this.servicesSearchQuery} »</p>
            <p style="font-size: 0.92rem;">Modifiez vos termes de recherche ou parcourez nos familles de services ci-dessous.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = this.renderServiceCardsHtml(filtered);
      this.attachServiceCardsEvents(container);
      return;
    }

    // 2. Navigation Hiérarchique Normale
    // CAS A : Niveau 1 - Affichage des Familles de l'Univers Actif (avec petites images représentatives)
    if (!this.activeServiceFamilyId) {
      const families = (typeof SERVICE_FAMILIES !== 'undefined')
        ? SERVICE_FAMILIES.filter(f => f.realm === this.activeRealm)
        : [];

      container.innerHTML = `
        <div class="service-families-grid" style="grid-column: 1/-1;">
          ${families.map(fam => `
            <article class="service-family-card" data-family-id="${fam.id}">
              <div class="family-card-header">
                <div class="family-card-thumb-wrap">
                  <img src="${fam.image}" alt="${fam.name}" class="family-card-thumb-img" loading="lazy" />
                  <span class="family-card-icon-pill" aria-hidden="true">${fam.icon}</span>
                </div>
                <span class="family-card-badge">${fam.badge}</span>
              </div>
              <div class="family-card-body">
                <h3>${fam.name}</h3>
                <p>${fam.tagline || fam.description}</p>
              </div>
              <div class="family-card-footer">
                <span class="family-card-price">${fam.priceRange}</span>
                <span class="family-card-cta">
                  <span>${fam.levels === 3 ? 'Voir les 6 catégories' : 'Découvrir'}</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </span>
              </div>
            </article>
          `).join('')}
        </div>
      `;

      container.querySelectorAll('.service-family-card').forEach(card => {
        card.addEventListener('click', () => {
          this.activeServiceFamilyId = card.dataset.familyId;
          this.activeServiceCatId = null;
          this.renderCatalogItems();
          const modalBody = document.querySelector('#catalogModalDialog .catalog-modal-body');
          if (modalBody) modalBody.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });
      return;
    }

    // CAS B : Une famille est sélectionnée
    const family = (typeof SERVICE_FAMILIES !== 'undefined')
      ? SERVICE_FAMILIES.find(f => f.id === this.activeServiceFamilyId)
      : null;

    if (!family) {
      this.activeServiceFamilyId = null;
      this.renderCatalogItems();
      return;
    }

    // SOUS-CAS B1 : Famille à 3 niveaux (ex: Nattes, Tresses & Vanilles)
    if (family.levels === 3) {
      // Si aucune catégorie n'est choisie -> Afficher les 6 Catégories (Cards 2nd niveau cliquables en entier)
      if (!this.activeServiceCatId) {
        const tressesServices = SERVICES_DATA.filter(s => s.familyId === family.id || s.category === 'coiffure-tresses');

        container.innerHTML = `
          <div style="grid-column: 1/-1; margin-bottom: 0.5rem;">
            <p style="font-size: 0.95rem; color: var(--text-muted);">
              Choisissez l'une des <strong>6 catégories</strong> de tresses et nattes réalisées au salon pour explorer ses modèles :
            </p>
          </div>
          ${this.renderLevel2CategoryCardsHtml(tressesServices, family)}
        `;
        this.attachLevel2CategoryCardsEvents(container, family);
        return;
      }

      // Niveau 3 : Les modèles de la catégorie choisie
      const catId = this.activeServiceCatId;
      const catData = (typeof HAIR_CATALOG_DATA !== 'undefined')
        ? HAIR_CATALOG_DATA.find(c => c.id === catId)
        : null;

      if (catData) {
        const allModels = [...(catData.style1Models || []), ...(catData.style2Models || [])];
        const defaultCatBadge = `Cat. ${catData.number} • ${catData.shortTitle.replace(/^\d+\.\s*/, '')}`;
        const gearSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

        container.innerHTML = `
          <div style="grid-column: 1/-1; background: #fffdf9; border: 1.5px solid rgba(212, 163, 115, 0.35); border-radius: 12px; padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
            <div>
              <h3 style="font-family: var(--font-heading); font-size: 1.25rem; color: var(--text-main); margin-bottom: 0.25rem;">${catData.title}</h3>
              <p style="font-size: 0.86rem; color: var(--text-muted);">${catData.description}</p>
            </div>
            <button type="button" class="btn-primary" id="btnOpenPlanchesFromCatalog" style="padding: 0.6rem 1.1rem; font-size: 0.88rem;">
              <span>🖼️ Consulter les Planches Visuelles</span>
            </button>
          </div>
          <div class="hair-models-grid" style="grid-column: 1/-1;">
            ${allModels.map(m => {
          const badgeText = m.categoryBadge || defaultCatBadge;
          const isStyle2 = Boolean(m.packs);
          return `
                <div class="hair-model-card">
                  ${m.image ? `
                    <div class="hair-model-img-wrap" data-zoom-single-img="${m.image}"
                      data-zoom-single-title="Modèle N°${m.num} — ${m.name.replace(/"/g, '&quot;')}"
                      data-zoom-single-sub="${badgeText} • Pose : ${m.pose} • Tenue : ${m.tenue}">
                      <img src="${m.image}" alt="Modèle ${m.num} - ${m.name.replace(/"/g, '&quot;')}" loading="lazy" />
                      <span class="hair-model-zoom-pill">🔍 Zoom</span>
                    </div>
                  ` : ''}
                  <div class="hair-model-card-body">
                    <div>
                      <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; margin-bottom: 0.45rem;">
                        <span class="hair-model-cat-inline-badge">🏷️ ${badgeText}</span>
                        <button type="button" class="card-gear-edit-btn"
                          data-edit-hair-model="${m.num}"
                          data-edit-hair-cat="${catData.id}"
                          data-edit-hair-style="${isStyle2 ? 'style2Models' : 'style1Models'}"
                          title="Modifier le contenu de cette carte"
                          aria-label="Modifier le modèle ${m.num} ${m.name.replace(/"/g, '&quot;')}">
                          ${gearSvg}
                        </button>
                      </div>
                      <div class="hair-model-top">
                        <span class="hair-model-num">${m.num}</span>
                        <div class="hair-model-title-box">
                          <strong>${m.name}</strong>
                          <span class="hair-model-style-tag">${isStyle2 ? 'Style 2 Lookbook' : 'Style 1 Mannequin'} • N°${m.num}</span>
                        </div>
                      </div>
                      <p class="hair-model-desc" style="margin-top: 0.45rem;">${m.desc}</p>
                    </div>
                    <div class="hair-model-bottom">
                      <div class="hair-model-badges">
                        <span class="hair-badge-chip">⏱️ ${m.pose}</span>
                        <span class="hair-badge-chip">📅 ${m.tenue}</span>
                      </div>
                      <button type="button" class="hair-model-choose-btn"
                        data-choose-hair-model="${m.name.replace(/"/g, '&quot;')}"
                        data-choose-hair-num="${m.num}"
                        data-choose-hair-cat="${catData.id}"
                        data-choose-hair-family="${family.name}">
                        Choisir ce modèle →
                      </button>
                    </div>
                  </div>
                </div>
              `;
        }).join('')}
          </div>
        `;

        const openPlanchesBtn = container.querySelector('#btnOpenPlanchesFromCatalog');
        if (openPlanchesBtn) {
          openPlanchesBtn.addEventListener('click', () => {
            this.openHairCatalogModal(catData.id);
          });
        }

        container.querySelectorAll('[data-choose-hair-model]').forEach(btn => {
          btn.addEventListener('click', () => {
            const modelName = btn.dataset.chooseHairModel;
            const modelNum = btn.dataset.chooseHairNum;
            const catId = btn.dataset.chooseHairCat;
            const catToServiceMap = {
              cat1: 'tresses-cat1-nattes-collees',
              cat2: 'tresses-cat2-box-knotless',
              cat3: 'tresses-cat3-tribales',
              cat4: 'tresses-cat4-vanilles-twists',
              cat5: 'tresses-cat5-boho-goddess',
              cat6: 'tresses-cat6-sculpturales-locs'
            };
            const targetServiceId = catToServiceMap[catId] || 'tresses-cat1-nattes-collees';

            this.openBookingModal(targetServiceId, {
              family: family.name,
              category: catData.shortTitle,
              modelNum,
              modelName
            });
          });
        });

        // Zoom sur les vignettes modèles
        container.querySelectorAll('[data-zoom-single-img]').forEach(el => {
          el.addEventListener('click', () => {
            this.currentLightboxBoards = [{
              image: el.dataset.zoomSingleImg,
              title: el.dataset.zoomSingleTitle,
              styleBadge: 'Modèle Individuel',
              subtitle: el.dataset.zoomSingleSub
            }];
            this.openHairBoardLightbox(0);
          });
        });
        return;
      }
    }

    // SOUS-CAS B2 : Famille à 2 niveaux (Tissages, Chignons, Shampoings, Couleurs, Ciseaux, Soins Visage, Massages, Onglerie, Épilations, Mariée)
    const familyServices = SERVICES_DATA.filter(s =>
      s.familyId === family.id || (family.serviceIds && family.serviceIds.includes(s.id))
    );

    container.innerHTML = this.renderServiceCardsHtml(familyServices);
    this.attachServiceCardsEvents(container, family.name);
  }

  renderServiceCardsHtml(services) {
    return services.map(service => {
      const isCoiffure = service.category.startsWith('coiffure-');
      const themeClass = isCoiffure ? 'theme-coiffure' : 'theme-esthetic';
      const mainEmoji = isCoiffure ? '💇‍♀️' : '✨';
      const mainTitle = isCoiffure ? 'Salon Coiffure' : 'Institut Esthétique';
      let subEmoji = '✂️';
      let subTitle = 'Soin Professionnel';
      if (service.category === 'coiffure-tresses') { subEmoji = '✂️'; subTitle = 'Tresses & Nattes'; }
      else if (service.category === 'coiffure-soins') { subEmoji = '🪄'; subTitle = 'Coiffure & Shampoings'; }
      else if (service.category === 'esthetic-spa') { subEmoji = '💆‍♀️'; subTitle = 'Visage & Massages'; }
      else if (service.category === 'esthetic-ongles') { subEmoji = '💅'; subTitle = 'Onglerie & Épilation'; }

      const durationHours = Math.floor(service.durationMinutes / 60);
      const durationMins = service.durationMinutes % 60;
      const durationStr = durationHours > 0
        ? `${durationHours}h${durationMins > 0 ? durationMins : ''}`
        : `${durationMins}m`;

      const permalink = `${window.location.origin}${window.location.pathname}?service=${service.id}`;
      const catBadgeLabel = service.categoryBadge || subTitle;
      const customBgStyle = service.customImage
        ? `style="background-image: url('${service.customImage.replace(/'/g, "\\'")}'); background-size: cover; background-position: top center;"`
        : '';

      return `
        <article class="service-card ${themeClass}" data-service-id="${service.id}">
          <a href="${permalink}" target="_blank" rel="noopener" class="card-seo-link-btn" title="Ouvrir le permalien de ${service.name} dans un nouvel onglet" aria-label="Permalien de ${service.name}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </a>

          <button type="button" class="card-gear-edit-btn" data-edit-card="service" data-target-id="${service.id}"
            title="Modifier le contenu de cette carte" aria-label="Modifier la carte ${service.name.replace(/"/g, '&quot;')}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>

          <div class="service-card-top" style="padding-left: 2.2rem; padding-right: 1.8rem;">
            <div class="sprite-thumb sprite-${service.id}" ${customBgStyle} aria-hidden="true"></div>
            <div class="service-meta-tags">
              <div class="card-hierarchical-badges">
                <span class="badge-main-cat" title="${mainTitle}">${mainEmoji} ${isCoiffure ? 'Coiffure' : 'Spa K.V.S'}</span>
                <span class="badge-sub-cat" title="${subTitle}">${subEmoji} ${catBadgeLabel}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
                ${service.featured ? `<span class="service-badge-pill">Phare</span>` : ''}
                <span class="service-duration-badge">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ~${durationStr}
                </span>
              </div>
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
              ${service.hairCatalogId ? `
                <button type="button" class="btn-service-planches" data-action="open-hair-cat" data-hair-cat="${service.hairCatalogId}" title="Voir les planches et les 51 modèles de cette catégorie">
                  📖 Planches
                </button>
              ` : ''}
              <button type="button" class="btn-service-detail" data-action="detail" data-service-id="${service.id}" title="Voir détails et description" aria-label="Voir les détails de ${service.name}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>

              <button type="button" class="btn-book-service" data-action="book" data-service-id="${service.id}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
                Réserver
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  attachServiceCardsEvents(container, defaultFamilyName = null) {
    container.querySelectorAll('[data-action="detail"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openServiceDetailModal(btn.dataset.serviceId);
      });
    });

    container.querySelectorAll('[data-action="open-hair-cat"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openHairCatalogModal(btn.dataset.hairCat);
      });
    });

    container.querySelectorAll('[data-edit-card="service"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openCardEditorModal({ kind: 'service', targetId: btn.dataset.targetId });
      });
    });

    container.querySelectorAll('[data-action="book"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const service = SERVICES_DATA.find(s => s.id === btn.dataset.serviceId);
        this.openBookingModal(btn.dataset.serviceId, {
          family: service ? service.familyName || defaultFamilyName : defaultFamilyName,
          category: service ? service.name : null
        });
      });
    });
  }

  renderLevel2CategoryCardsHtml(services, family) {
    return services.map(service => {
      const catData = (typeof HAIR_CATALOG_DATA !== 'undefined')
        ? HAIR_CATALOG_DATA.find(c => c.id === service.hairCatalogId)
        : null;

      const catNum = catData ? catData.number : (service.hairCatalogId ? service.hairCatalogId.replace('cat', '') : '1');
      let thumbImg = service.customImage || (family ? family.image : 'assets/img/families/fam-coiffure-tresses.jpg');
      if (!service.customImage && catData && catData.style1Models && catData.style1Models.length > 0 && catData.style1Models[0].image) {
        thumbImg = catData.style1Models[0].image;
      }

      const durationHours = Math.floor(service.durationMinutes / 60);
      const durationMins = service.durationMinutes % 60;
      const durationStr = durationHours > 0
        ? `${durationHours}h${durationMins > 0 ? durationMins : ''}`
        : `${durationMins}m`;

      const permalink = `${window.location.origin}${window.location.pathname}?service=${service.id}`;

      return `
        <article class="service-card theme-coiffure level2-category-card" data-cat-id="${service.hairCatalogId || 'cat1'}" data-service-id="${service.id}">
          <!-- Header : Miniature à gauche + Actions icônes alignées à droite -->
          <div class="level2-card-header">
            <div class="level2-card-thumb-wrap">
              <img src="${thumbImg}" alt="${service.name}" class="level2-card-thumb" loading="lazy" />
              <span class="level2-cat-num">Cat. ${catNum}</span>
            </div>
            <div class="level2-header-actions">
              <a href="${permalink}" target="_blank" rel="noopener" class="card-action-icon-btn card-seo-link-btn" title="Ouvrir le permalien de ${service.name}" aria-label="Permalien de ${service.name}" data-no-drill="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </a>
              <button type="button" class="card-action-icon-btn card-gear-edit-btn" data-edit-card="service" data-target-id="${service.id}" title="Modifier le contenu de cette carte" aria-label="Modifier la carte ${service.name.replace(/"/g, '&quot;')}" data-no-drill="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Corps de la carte (Épuré, AUCUNE icône dans le texte) -->
          <div class="service-card-content" style="padding: 0.25rem 0 0.5rem 0;">
            <h3 class="service-title" style="margin-bottom: 0.35rem; font-size: 1.12rem;">${service.name}</h3>
            <p class="service-desc" style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.45; margin: 0;">
              ${service.tagline || service.description}
            </p>
          </div>

          <!-- Badges tous alignés sur une rangée juste au-dessus du footer -->
          <div class="service-card-badges-row">
            <span class="service-models-count-badge">51 Modèles</span>
            <span class="badge-sub-cat">${service.categoryBadge || 'Nattes & Tresses'}</span>
            <span class="service-duration-badge">~${durationStr}</span>
            <span class="service-price-amount" style="margin-left: auto; font-weight: 700; color: var(--color-gold-700); font-size: 0.92rem;">${service.priceLabel}</span>
          </div>

          <!-- Footer : Actions espacées uniformément (spaced evenly) -->
          <div class="service-card-bottom" style="padding-top: 0.5rem;">
            <div class="level2-actions-spaced-evenly">
              <button type="button" class="btn-service-planches" data-action="open-hair-cat" data-hair-cat="${service.hairCatalogId || 'cat1'}" data-no-drill="true" title="Consulter les planches et le Lookbook">
                📖 Planches
              </button>
              <button type="button" class="btn-service-detail" data-action="detail" data-service-id="${service.id}" data-no-drill="true" title="Voir les détails de la prestation">
                👁️ Détails
              </button>
              <button type="button" class="btn-book-service" data-action="book" data-service-id="${service.id}" data-no-drill="true" title="Réserver cette catégorie">
                📅 Réserver
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  attachLevel2CategoryCardsEvents(container, family) {
    // 1. Clic sur la carte entière -> Passe au 3ème niveau (les modèles)
    container.querySelectorAll('.level2-category-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-no-drill="true"]')) return;
        const catId = card.dataset.catId;
        this.activeServiceCatId = catId;
        this.renderCatalogItems();
        const modalBody = document.querySelector('#catalogModalDialog .catalog-modal-body');
        if (modalBody) modalBody.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // 2. Boutons d'actions avec propagation arrêtée (ne ferment JAMAIS le catalogue)
    container.querySelectorAll('[data-action="open-hair-cat"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openHairCatalogModal(btn.dataset.hairCat);
      });
    });

    container.querySelectorAll('[data-action="detail"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openServiceDetailModal(btn.dataset.serviceId);
      });
    });

    container.querySelectorAll('[data-edit-card="service"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openCardEditorModal({ kind: 'service', targetId: btn.dataset.targetId });
      });
    });

    container.querySelectorAll('[data-action="book"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const service = SERVICES_DATA.find(s => s.id === btn.dataset.serviceId);
        this.openBookingModal(btn.dataset.serviceId, {
          family: family ? family.name : 'Nattes, Tresses & Vanilles',
          category: service ? service.name : null
        });
      });
    });
  }

  renderModalProducts() {
    const container = document.getElementById('modalProductsGrid');
    if (!container) return;

    let filtered = [...PRODUCTS_DATA];

    if (this.activeCategory !== 'all') {
      filtered = filtered.filter(p => p.subCategoryId === this.activeCategory || p.category === this.activeCategory);
    }

    if (this.searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(this.searchQuery) ||
        p.description.toLowerCase().includes(this.searchQuery) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(this.searchQuery)) ||
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

    container.innerHTML = filtered.map(product => {
      const permalink = `${window.location.origin}${window.location.pathname}?produit=${product.id}`;
      let subEmoji = '🌿';
      let subTitle = product.subCategory || 'Soin Capillaire';
      if (product.subCategoryId === 'prod-meches') {
        subEmoji = '💇‍♀️';
        subTitle = 'Mèches Remy';
      } else if (product.subCategoryId === 'prod-spa') {
        subEmoji = '🌸';
        subTitle = 'Soins Spa K.V.S';
      }
      const catBadgeLabel = product.categoryBadge || subTitle;
      const customBgStyle = product.customImage
        ? `style="background-image: url('${product.customImage.replace(/'/g, "\\'")}'); background-size: cover; background-position: center;"`
        : '';

      return `
        <article class="product-card theme-produits" data-product-id="${product.id}">
          <div class="product-media">
            <a href="${permalink}" target="_blank" rel="noopener" class="card-seo-link-btn" title="Ouvrir le permalien de ${product.name} dans un nouvel onglet" aria-label="Permalien de ${product.name}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </a>
            <button type="button" class="card-gear-edit-btn" data-edit-card="product" data-target-id="${product.id}"
              title="Modifier le contenu de cette carte produit" aria-label="Modifier le produit ${product.name.replace(/"/g, '&quot;')}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
            <div class="sprite-thumb sprite-${product.id}" ${customBgStyle} aria-label="${product.name}"></div>
            <span class="product-badge">${product.badge}</span>
          </div>
          <div class="product-body">
            <div class="card-hierarchical-badges">
              <span class="badge-main-cat" title="Produits Phares">🛍️ Produits</span>
              <span class="badge-sub-cat" title="${subTitle}">${subEmoji} ${catBadgeLabel}</span>
            </div>
            <h4 class="product-title">${product.name}</h4>
            <p class="product-desc">${product.description}</p>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.85rem;">
              <span style="font-size: 0.76rem; color: var(--text-light); font-weight: 600;">Contenance : ${product.volume || '1 unité'}</span>
            </div>
            <div class="product-footer">
              <span class="product-price">${product.priceLabel}</span>
              <div style="display: flex; align-items: center; gap: 0.45rem;">
                <button type="button" class="btn-service-detail" data-action="detail-product" data-product-id="${product.id}" title="Voir détails et fiche complète" aria-label="Voir les détails de ${product.name}">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
                <a href="${getWhatsAppProductUrl(product)}" target="_blank" rel="noopener" class="btn-whatsapp-order">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771z"/></svg>
                  Commander
                </a>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Écouteurs sur bouton œil produit et roue dentée
    container.querySelectorAll('[data-action="detail-product"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openProductDetailModal(btn.dataset.productId);
      });
    });

    container.querySelectorAll('[data-edit-card="product"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openCardEditorModal({ kind: 'product', targetId: btn.dataset.targetId });
      });
    });
  }

  openProductDetailModal(productId) {
    const dialog = document.getElementById('serviceDetailDialog');
    if (!dialog) return;

    const product = PRODUCTS_DATA.find(p => p.id === productId);
    if (!product) return;

    const catBadge = document.getElementById('detailBadgeCategory');
    if (catBadge) {
      catBadge.textContent = '🛍️ Produits Phares';
    }

    const subBadge = document.getElementById('detailBadgeSubcategory');
    if (subBadge) {
      subBadge.textContent = product.subCategory || product.category;
    }

    const specBadge = document.getElementById('detailBadgeSpecialist');
    if (specBadge) {
      specBadge.textContent = `✦ Sélection Salon Elle & Lui Cocody`;
    }

    const iconBox = document.getElementById('detailIconBox');
    if (iconBox) {
      iconBox.className = `sprite-thumb sprite-${product.id}`;
      iconBox.innerHTML = '';
    }

    const titleEl = document.getElementById('detailServiceName');
    if (titleEl) titleEl.textContent = product.name;

    const taglineEl = document.getElementById('detailServiceTagline');
    if (taglineEl) taglineEl.textContent = product.tagline ? `« ${product.tagline} »` : '';

    const priceEl = document.getElementById('detailPriceValue');
    if (priceEl) priceEl.textContent = product.priceLabel;

    const durationLabel = document.getElementById('detailDurationLabel');
    if (durationLabel) durationLabel.textContent = 'Contenance / Volume';

    const durationEl = document.getElementById('detailDurationValue');
    if (durationEl) {
      durationEl.textContent = product.volume || '1 unité';
    }

    const descEl = document.getElementById('detailServiceDescription');
    if (descEl) descEl.textContent = product.description;

    // Permalien SEO Produit
    const permalink = `${window.location.origin}${window.location.pathname}?produit=${product.id}`;
    const seoInput = document.getElementById('detailSeoUrlInput');
    if (seoInput) seoInput.value = permalink;

    const shareWaBtn = document.getElementById('detailShareWhatsAppBtn');
    if (shareWaBtn) {
      const shareMsg = `Découvrez le produit "${product.name}" (${product.priceLabel}) au Salon Elle & Lui Cocody : ${permalink}`;
      shareWaBtn.href = `https://wa.me/?text=${encodeURIComponent(shareMsg)}`;
    }

    // Gestion des boutons d'action
    const bookBtn = document.getElementById('detailBookBtn');
    const orderBtn = document.getElementById('detailOrderProductBtn');
    if (bookBtn) {
      bookBtn.style.display = 'none';
    }
    if (orderBtn) {
      orderBtn.style.display = 'inline-flex';
      orderBtn.href = getWhatsAppProductUrl(product);
    }

    const whatsappBtn = document.getElementById('detailWhatsAppBtn');
    if (whatsappBtn) {
      const msg = `Bonjour Salon Elle & Lui ! ✨
Je souhaite commander le produit suivant :
✦ *${product.name}* (${product.priceLabel})
Lien : ${permalink}`;
      whatsappBtn.href = `https://wa.me/2250759372441?text=${encodeURIComponent(msg)}`;
    }

    if (window.history.replaceState) {
      window.history.replaceState({ productId: product.id }, '', `?produit=${product.id}`);
    }

    dialog.showModal();
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
      btnText.textContent = `Galerie photos (${items.length} clichés)`;
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
        if (btnText) btnText.textContent = 'Masquer';
      } else {
        galleryGrid.classList.add('is-collapsed');
        btn.setAttribute('aria-expanded', 'false');
        if (btnText) btnText.textContent = `Galerie photos (${itemsCount} clichés)`;
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
      const isMobile = window.innerWidth <= 600;
      label.textContent = new Intl.DateTimeFormat('fr-FR', {
        weekday: isMobile ? 'short' : 'long',
        day: 'numeric',
        month: isMobile ? 'short' : 'long',
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
      closeBtn.addEventListener('click', () => {
        dialog.close();
        if (window.history.replaceState) {
          window.history.replaceState({}, '', window.location.pathname);
        }
      });
    }

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.close();
        if (window.history.replaceState) {
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    });

    const bookBtn = document.getElementById('detailBookBtn');
    if (bookBtn) {
      bookBtn.addEventListener('click', () => {
        const serviceId = bookBtn.dataset.serviceId;
        if (serviceId) {
          this.openBookingModal(serviceId);
        }
      });
    }

    // Bouton de copie du permalien SEO
    const copySeoBtn = document.getElementById('copyDetailSeoBtn');
    const seoInput = document.getElementById('detailSeoUrlInput');
    const copySeoText = document.getElementById('copyDetailSeoText');
    if (copySeoBtn && seoInput) {
      copySeoBtn.addEventListener('click', () => {
        const url = seoInput.value;
        if (navigator.clipboard && url) {
          navigator.clipboard.writeText(url).then(() => {
            copySeoBtn.classList.add('copied');
            if (copySeoText) copySeoText.textContent = 'Copié !';
            setTimeout(() => {
              copySeoBtn.classList.remove('copied');
              if (copySeoText) copySeoText.textContent = 'Copier';
            }, 2000);
          }).catch(() => {
            prompt('Copiez ce lien :', url);
          });
        }
      });
    }
  }

  openServiceDetailModal(serviceId) {
    const dialog = document.getElementById('serviceDetailDialog');
    if (!dialog) return;

    const service = SERVICES_DATA.find(s => s.id === serviceId);
    if (!service) return;

    const isCoiffure = service.category.startsWith('coiffure-');
    const catBadge = document.getElementById('detailBadgeCategory');
    if (catBadge) {
      catBadge.textContent = isCoiffure ? '💇‍♀️ Salon Coiffure' : '✨ Institut Esthétique';
    }

    const subBadge = document.getElementById('detailBadgeSubcategory');
    if (subBadge) {
      let subCatName = 'Soin Professionnel';
      if (service.category === 'coiffure-tresses') subCatName = '✂️ Tresses & Tissages';
      else if (service.category === 'coiffure-soins') subCatName = '🪄 Coiffure & Shampoings';
      else if (service.category === 'esthetic-spa') subCatName = '💆‍♀️ Visage & Massages';
      else if (service.category === 'esthetic-ongles') subCatName = '💅 Onglerie & Épilation';
      subBadge.textContent = subCatName;
    }

    const specBadge = document.getElementById('detailBadgeSpecialist');
    if (specBadge) {
      specBadge.textContent = isCoiffure ? `✦ Espace Salon Coiffure Cocody` : `✦ Espace Institut & Spa Cocody`;
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

    const durationLabel = document.getElementById('detailDurationLabel');
    if (durationLabel) durationLabel.textContent = 'Durée Estimée';

    const durationEl = document.getElementById('detailDurationValue');
    if (durationEl) {
      const hours = Math.floor(service.durationMinutes / 60);
      const mins = service.durationMinutes % 60;
      durationEl.textContent = hours > 0 ? `${hours}h${mins > 0 ? mins : ''}` : `${mins} min`;
    }

    const descEl = document.getElementById('detailServiceDescription');
    if (descEl) descEl.textContent = service.description;

    // Permalien SEO Prestation
    const permalink = `${window.location.origin}${window.location.pathname}?service=${service.id}`;
    const seoInput = document.getElementById('detailSeoUrlInput');
    if (seoInput) seoInput.value = permalink;

    const shareWaBtn = document.getElementById('detailShareWhatsAppBtn');
    if (shareWaBtn) {
      const shareMsg = `Découvrez la prestation "${service.name}" (${service.priceLabel}) au Salon Elle & Lui Cocody : ${permalink}`;
      shareWaBtn.href = `https://wa.me/?text=${encodeURIComponent(shareMsg)}`;
    }

    // Boutons d'action
    const bookBtn = document.getElementById('detailBookBtn');
    const orderBtn = document.getElementById('detailOrderProductBtn');
    if (bookBtn) {
      bookBtn.style.display = 'inline-flex';
      bookBtn.dataset.serviceId = service.id;
    }
    if (orderBtn) {
      orderBtn.style.display = 'none';
    }

    const whatsappBtn = document.getElementById('detailWhatsAppBtn');
    if (whatsappBtn) {
      const msg = `Bonjour Salon Elle & Lui ! ✨
Je souhaite des renseignements supplémentaires sur la prestation :
✦ *${service.name}* (${service.priceLabel})
Lien : ${permalink}`;
      whatsappBtn.href = `https://wa.me/2250759372441?text=${encodeURIComponent(msg)}`;
    }

    if (window.history.replaceState) {
      window.history.replaceState({ serviceId: service.id }, '', `?service=${service.id}`);
    }

    dialog.showModal();
  }

  /* ==========================================================================
     8. PRISE DE RENDEZ-VOUS CLIENT
     ========================================================================== */
  /* ==========================================================================
     8. PRISE DE RENDEZ-VOUS CLIENT (Cards Carrées 100x100px & Hiérarchie Fluide)
     ========================================================================== */
  populateServiceDropdown() {
    const catContainer = document.getElementById('bookingCategoryPills');
    const cardsGrid = document.getElementById('bookingServiceCardsGrid');
    const hiddenInput = document.getElementById('modalServiceSelect');
    if (!cardsGrid) return;

    // Familles & Catégories de filtres rapides
    const categories = [
      { id: 'all', name: 'Tous les soins' },
      { id: 'coiffure-tresses', name: 'Tresses & Nattes' },
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
             data-family="${s.familyName || ''}"
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
        const service = SERVICES_DATA.find(s => s.id === sId);
        this.bookingFamily = service ? service.familyName : null;
        this.bookingCategory = service ? service.name : null;
        this.bookingModelNum = null;
        this.bookingModelName = null;
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

      const isHairService = service.levels === 3 || service.category === 'coiffure-tresses' || Boolean(service.hairCatalogId);

      let modelExtraHtml = '';
      if (this.bookingModelNum || this.bookingModelName) {
        modelExtraHtml = `
          <div class="booking-summary-row" style="background: rgba(212, 163, 115, 0.15); padding: 0.35rem 0.6rem; border-radius: 6px; margin: 0.35rem 0; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap;">
            <div>
              <span style="color: var(--color-gold-700); font-weight: 700;">Modèle choisi :</span>
              <strong style="color: #1a1614; margin-left: 0.25rem;">N°${this.bookingModelNum || ''} ${this.bookingModelName || ''}</strong>
            </div>
            <button type="button" class="btn-choose-model-inline" id="btnChooseModelInline" data-cat-id="${service.hairCatalogId || 'overview'}" style="padding: 0.22rem 0.6rem; font-size: 0.75rem; border-radius: 4px; border: 1px solid var(--color-gold-600); background: #ffffff; color: var(--color-gold-800); font-weight: 700; cursor: pointer;">
              ✏️ Modifier
            </button>
          </div>
        `;
      } else if (isHairService) {
        modelExtraHtml = `
          <div class="booking-summary-row" style="background: rgba(212, 163, 115, 0.12); padding: 0.35rem 0.6rem; border-radius: 6px; margin: 0.35rem 0; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap;">
            <div>
              <span style="color: var(--color-gold-700); font-weight: 700;">Modèle choisi :</span>
              <strong style="color: var(--text-muted); margin-left: 0.25rem;">N.A</strong>
            </div>
            <button type="button" class="btn-choose-model-inline" id="btnChooseModelInline" data-cat-id="${service.hairCatalogId || 'overview'}" style="padding: 0.25rem 0.65rem; font-size: 0.75rem; border-radius: 4px; border: 1px solid var(--color-gold-600); background: #ffffff; color: var(--color-gold-800); font-weight: 700; cursor: pointer;">
              📖 Choisir dans le Lookbook
            </button>
          </div>
        `;
      }

      summaryBox.style.display = 'block';
      summaryBox.innerHTML = `
        <div class="booking-summary-row">
          <span>Prestation :</span>
          <strong>${service.name}</strong>
        </div>
        ${this.bookingFamily ? `
          <div class="booking-summary-row">
            <span>Famille :</span>
            <span>${this.bookingFamily}</span>
          </div>
        ` : ''}
        ${modelExtraHtml}
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

      const btnChooseInline = summaryBox.querySelector('#btnChooseModelInline');
      if (btnChooseInline) {
        btnChooseInline.addEventListener('click', (e) => {
          e.stopPropagation();
          const catId = btnChooseInline.dataset.catId || 'overview';
          this.openHairCatalogModal(catId);
        });
      }
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
    const backBtn = document.getElementById('btnBookingBackToPreviousModal');

    // Écoute du défilement horizontal naturel pour synchroniser le stepper et les points (4 étapes)
    if (viewport) {
      viewport.addEventListener('scroll', () => {
        const scrollLeft = viewport.scrollLeft;
        const width = viewport.clientWidth || 1;
        const step = Math.min(4, Math.max(1, Math.round(scrollLeft / width) + 1));
        if (step !== this.currentBookingStep) {
          this.currentBookingStep = step;
          this.updateWizardIndicators(step);
          if (step === 4) {
            this.populateBookingWizardRecap();
          }
        }
      }, { passive: true });
    }

    // Bouton Retour vers la modale précédente
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        const dialog = document.getElementById('bookingDialog');
        if (dialog) dialog.close();
      });
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

    // Raccourcis Date rapide (Aujourd'hui, Demain, Ce Samedi) & Synchronisation FullCalendar
    const btnToday = document.getElementById('btnDateToday');
    const btnTomorrow = document.getElementById('btnDateTomorrow');
    const btnSat = document.getElementById('btnDateSaturday');

    if (btnToday) {
      btnToday.addEventListener('click', () => {
        const todayStr = new Date().toISOString().split('T')[0];
        this.selectBookingDate(todayStr);
        if (this.bookingCalendarInstance) {
          this.bookingCalendarInstance.today();
        }
        this.showToast('Date : Aujourd\'hui. Choisissez votre créneau ci-dessous.');
      });
    }

    if (btnTomorrow) {
      btnTomorrow.addEventListener('click', () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const tomStr = d.toISOString().split('T')[0];
        this.selectBookingDate(tomStr);
        if (this.bookingCalendarInstance) {
          this.bookingCalendarInstance.gotoDate(tomStr);
        }
        this.showToast('Date : Demain. Choisissez votre créneau ci-dessous.');
      });
    }

    if (btnSat) {
      btnSat.addEventListener('click', () => {
        const d = new Date();
        const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
        const diff = dayOfWeek === 6 ? 7 : (6 - dayOfWeek);
        d.setDate(d.getDate() + diff);
        const satStr = d.toISOString().split('T')[0];
        this.selectBookingDate(satStr);
        if (this.bookingCalendarInstance) {
          this.bookingCalendarInstance.gotoDate(satStr);
        }
        this.showToast('Date : Samedi prochain. Choisissez votre créneau ci-dessous.');
      });
    }

    // Basculement des vues FullCalendar 2.0 (Mois, Semaine, Jour)
    const calViewBtns = document.querySelectorAll('.btn-cal-view');
    calViewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        calViewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const targetView = btn.dataset.calView;
        if (this.bookingCalendarInstance) {
          this.bookingCalendarInstance.changeView(targetView);
          setTimeout(() => this.bookingCalendarInstance.updateSize(), 50);
        }
      });
    });

    // Basculement de convention de format de date (JJ/MM/AAAA vs MM/JJ/AAAA)
    const btnToggleFormat = document.getElementById('btnToggleDateFormat');
    const formatTag = document.getElementById('bookingDateFormatTag');
    if (btnToggleFormat && formatTag) {
      btnToggleFormat.addEventListener('click', () => {
        this.bookingDateFormat = this.bookingDateFormat === 'fr' ? 'en' : 'fr';
        formatTag.textContent = this.bookingDateFormat === 'fr' ? 'JJ/MM/AAAA' : 'MM/JJ/AAAA';
        this.showToast(`Convention de date : ${this.bookingDateFormat === 'fr' ? 'Jour/Mois/Année (FR)' : 'Mois/Jour/Année (US)'}`);
        this.updateBookingDateLabel();
        if (this.currentBookingStep === 4) this.populateBookingWizardRecap();
      });
    }

    // Initialisation du Calendrier FullCalendar
    this.initBookingFullCalendar();
  }

  initBookingFullCalendar() {
    const calendarEl = document.getElementById('bookingFullCalendarEl');
    if (!calendarEl || typeof FullCalendar === 'undefined') return;

    const todayStr = new Date().toISOString().split('T')[0];
    const maxDateStr = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0];

    // Extraction des rendez-vous existants pour afficher les créneaux déjà réservés
    const appointments = this.dashboardManager ? this.dashboardManager.getAppointments() : [];
    const events = appointments.filter(a => a.status !== 'cancelled').map(apt => ({
      id: apt.id,
      title: 'Réservé',
      start: `${apt.date}T${apt.timeSlot}:00`,
      allDay: false,
      display: 'block',
      classNames: ['booking-calendar-busy-event']
    }));

    if (this.bookingCalendarInstance) {
      try { this.bookingCalendarInstance.destroy(); } catch (e) {}
    }

    this.bookingCalendarInstance = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      locale: 'fr',
      firstDay: 1, // Lundi en premier
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: ''
      },
      buttonText: {
        today: 'Aujourd\'hui'
      },
      businessHours: {
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Ouvert 7j/7 non-stop
        startTime: '08:30',
        endTime: '19:00'
      },
      slotMinTime: '08:30:00',
      slotMaxTime: '19:00:00',
      slotDuration: '00:15:00',
      slotLabelInterval: '01:00',
      allDaySlot: false,
      height: 'auto',
      aspectRatio: 1.42,
      validRange: {
        start: todayStr,
        end: maxDateStr
      },
      events: events,
      dateClick: (info) => {
        this.handleBookingCalendarDateClick(info);
      },
      eventClick: () => {
        this.showToast('Ce créneau horaire est déjà réservé.');
      }
    });

    this.bookingCalendarInstance.render();

    // Sélection de la date du jour par défaut
    this.selectBookingDate(todayStr);
  }

  handleBookingCalendarDateClick(info) {
    const rawStr = info.dateStr;

    // Si clic depuis une vue horaire (Semaine ou Jour) contenant "T"
    if (rawStr.includes('T')) {
      const parts = rawStr.split('T');
      const datePart = parts[0];
      const timePart = parts[1].slice(0, 5); // "HH:MM"

      // Vérifier si le créneau est déjà réservé
      const appointments = this.dashboardManager ? this.dashboardManager.getAppointments() : [];
      const isTaken = appointments.some(a => a.date === datePart && a.timeSlot === timePart && a.status !== 'cancelled');

      if (isTaken) {
        this.showToast(`Le créneau de ${timePart} le ${this.formatDisplayDate(datePart)} est déjà réservé.`);
        return;
      }

      this.selectBookingDate(datePart);
      this.selectedTimeSlot = timePart;
      this.renderTimeSlots(datePart);
      this.showToast(`Rendez-vous : ${this.formatDisplayDate(datePart)} à ${timePart}`);

      // Avancement fluide vers l'Étape 3 (Coordonnées)
      setTimeout(() => this.goToBookingStep(3), 220);
      return;
    }

    // Vue mensuelle (dayGridMonth) : sélection du jour et actualisation des créneaux
    this.selectBookingDate(rawStr);
    this.showToast(`Date : ${this.formatDisplayDate(rawStr)}. Choisissez votre créneau ci-dessous.`);
  }

  selectBookingDate(dateStr) {
    this.selectedBookingDate = dateStr;
    const dateInput = document.getElementById('modalBookingDate');
    if (dateInput) dateInput.value = dateStr;

    this.updateBookingDateLabel();

    // Surlignage du jour dans FullCalendar
    document.querySelectorAll('.fc-daygrid-day').forEach(el => {
      el.classList.toggle('selected-booking-day', el.dataset.date === dateStr);
    });

    // Actualisation des créneaux horaires pour ce jour
    this.renderTimeSlots(dateStr);
  }

  updateBookingDateLabel() {
    const label = document.getElementById('bookingSelectedDateLabel');
    if (!label) return;
    const dateStr = this.selectedBookingDate || document.getElementById('modalBookingDate')?.value;
    if (!dateStr) {
      label.textContent = 'Aujourd\'hui';
      return;
    }
    label.textContent = this.formatDisplayDate(dateStr);
  }

  formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;

    if (this.bookingDateFormat === 'en') {
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric', year: 'numeric' });
    }
    const str = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  goToBookingStep(step) {
    const clampedStep = Math.max(1, Math.min(4, step));
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

    // Ajustement de la géométrie FullCalendar lors du passage à l'étape 2
    if (clampedStep === 2 && this.bookingCalendarInstance) {
      setTimeout(() => {
        this.bookingCalendarInstance.updateSize();
      }, 80);
    }

    if (clampedStep === 4) {
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
      if (!this.selectedTimeSlot) {
        this.showToast('Veuillez sélectionner un créneau horaire.');
        return false;
      }
      return true;
    }

    if (step === 3) {
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

    // Construction hiérarchique pour le récapitulatif
    const isHair = service && (service.levels === 3 || service.category === 'coiffure-tresses' || Boolean(service.hairCatalogId));
    let prestationHierarchy = service ? service.name : 'Non sélectionnée';
    if (this.bookingFamily && this.bookingCategory && (this.bookingModelNum || this.bookingModelName)) {
      const modelPart = this.bookingModelNum ? `Modèle #${this.bookingModelNum} (${this.bookingModelName || ''})` : this.bookingModelName;
      prestationHierarchy = `${this.bookingFamily} › ${this.bookingCategory} › ${modelPart}`;
    } else if (this.bookingFamily && this.bookingCategory && this.bookingFamily !== this.bookingCategory) {
      prestationHierarchy = `${this.bookingFamily} › ${this.bookingCategory}${isHair ? ' › Modèle : N.A' : ''}`;
    } else if (this.bookingFamily && service && this.bookingFamily !== service.name) {
      prestationHierarchy = `${this.bookingFamily} › ${service.name}${isHair ? ' › Modèle : N.A' : ''}`;
    } else if (isHair && !this.bookingModelNum && !this.bookingModelName) {
      prestationHierarchy = `${prestationHierarchy} › Modèle : N.A`;
    }

    recapBox.innerHTML = `
      <div class="recap-row">
        <span class="recap-label">Prestation :</span>
        <strong class="recap-value" style="color: var(--text-main); font-size: 0.96rem;">${prestationHierarchy}</strong>
      </div>
      ${isHair ? `
        <div class="recap-row">
          <span class="recap-label">Modèle choisi :</span>
          <strong class="recap-value" style="color: ${this.bookingModelNum ? 'var(--color-gold-700)' : 'var(--text-muted)'};">
            ${this.bookingModelNum ? `N°${this.bookingModelNum} ${this.bookingModelName || ''}` : 'N.A (à choisir au salon ou dans le Lookbook)'}
          </strong>
        </div>
      ` : ''}
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

  openBookingModal(serviceId = null, meta = {}) {
    const dialog = document.getElementById('bookingDialog');
    if (!dialog) return;

    // Si le choix d'un modèle précis vient du Lookbook, fermer le Lookbook pour revenir au tunnel
    const hairModal = document.getElementById('hairCatalogModalDialog');
    if (hairModal && hairModal.open && meta && (meta.modelNum || meta.modelName)) {
      hairModal.close();
    }

    // Détection de la modale précédente encore ouverte pour configurer le bouton Retour
    const openModals = Array.from(document.querySelectorAll('dialog[open]')).filter(d => d !== dialog && d !== hairModal);
    const prevModal = openModals.length > 0 ? openModals[openModals.length - 1] : null;

    const backBtn = document.getElementById('btnBookingBackToPreviousModal');
    const backLabel = document.getElementById('bookingBackPrevLabel');

    if (backBtn && backLabel) {
      if (prevModal) {
        let labelText = 'Retour';
        if (prevModal.id === 'catalogModalDialog') {
          labelText = 'Catalogue';
        } else if (prevModal.id === 'hairCatalogModalDialog') {
          labelText = 'Lookbook';
        } else if (prevModal.id === 'serviceDetailDialog') {
          labelText = 'Prestation';
        } else if (prevModal.id === 'eventModalDialog') {
          labelText = 'Événements';
        }
        backLabel.textContent = labelText;
        backBtn.style.display = 'inline-flex';
      } else {
        backBtn.style.display = 'none';
      }
    }

    const dateInput = document.getElementById('modalBookingDate');
    const todayStr = new Date().toISOString().split('T')[0];
    dateInput.min = todayStr;
    if (!dateInput.value) {
      dateInput.value = todayStr;
    }

    this.selectBookingDate(dateInput.value || todayStr);

    // Mémorisation des métadonnées hiérarchiques
    if (meta && (meta.family || meta.category || meta.modelNum || meta.modelName)) {
      this.bookingFamily = meta.family || null;
      this.bookingCategory = meta.category || null;
      this.bookingModelNum = meta.modelNum || null;
      this.bookingModelName = meta.modelName || null;
    }

    if (serviceId) {
      const hiddenInput = document.getElementById('modalServiceSelect');
      if (hiddenInput) hiddenInput.value = serviceId;
      const cards = document.querySelectorAll('.service-card-square');
      cards.forEach(c => {
        c.classList.toggle('selected', c.dataset.serviceId === serviceId);
      });
      const s = SERVICES_DATA.find(serv => serv.id === serviceId);
      if (s && !this.bookingFamily) {
        this.bookingFamily = s.familyName || null;
        this.bookingCategory = s.name;
      }
      this.updateSelectedService(serviceId);
    }

    if (!dialog.open) {
      dialog.showModal();
    }

    // Actualisation géométrique FullCalendar et vue Mois par défaut
    if (this.bookingCalendarInstance) {
      this.bookingCalendarInstance.changeView('dayGridMonth');
      document.querySelectorAll('.btn-cal-view').forEach(b => {
        b.classList.toggle('active', b.dataset.calView === 'dayGridMonth');
      });
      setTimeout(() => {
        this.bookingCalendarInstance.updateSize();
      }, 100);
    }

    // Si le service est déjà spécifié (venant du catalogue ou lookbook), amener directement à l'étape 2 (Date & Heure)
    if (serviceId) {
      this.goToBookingStep(2);
    } else {
      this.goToBookingStep(1);
    }
  }

  renderTimeSlots(selectedDate = null) {
    const container = document.getElementById('timeSlotsContainer');
    if (!container) return;

    const dateStr = selectedDate || document.getElementById('modalBookingDate')?.value || this.selectedBookingDate;
    const appointments = this.dashboardManager ? this.dashboardManager.getAppointments() : [];
    const bookedForDay = new Set(
      appointments
        .filter(a => a.date === dateStr && a.status !== 'cancelled')
        .map(a => a.timeSlot)
    );

    const slots = generateTimeSlots();
    container.innerHTML = slots.map(slot => {
      const isBooked = bookedForDay.has(slot);
      const isSelected = this.selectedTimeSlot === slot;
      const chipClasses = ['time-slot-chip'];
      if (isSelected) chipClasses.push('selected');
      if (isBooked) chipClasses.push('booked');

      return `
        <div class="${chipClasses.join(' ')}" data-slot="${slot}" ${isBooked ? 'title="Créneau déjà réservé au salon"' : ''}>
          ${slot}
        </div>
      `;
    }).join('');

    container.querySelectorAll('.time-slot-chip:not(.booked)').forEach(chip => {
      chip.addEventListener('click', () => {
        container.querySelectorAll('.time-slot-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        this.selectedTimeSlot = chip.dataset.slot;
        // Défilement automatique doux vers l'étape suivante (Étape 3 : Coordonnées)
        setTimeout(() => this.goToBookingStep(3), 220);
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
    if (!date) {
      this.goToBookingStep(2);
      this.showToast('Veuillez choisir une date pour votre rendez-vous.');
      return;
    }
    if (!this.selectedTimeSlot) {
      this.goToBookingStep(2);
      this.showToast('Veuillez sélectionner un créneau horaire.');
      return;
    }
    if (!clientName || !clientPhone) {
      this.goToBookingStep(3);
      this.showToast('Veuillez renseigner votre nom et votre numéro de téléphone.');
      return;
    }

    const service = SERVICES_DATA.find(s => s.id === serviceId);

    const bookingPayload = {
      serviceId,
      serviceName: service.name,
      family: this.bookingFamily || service.familyName || null,
      category: this.bookingCategory || service.name,
      modelNum: this.bookingModelNum || null,
      modelName: this.bookingModelName || null,
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
    this.bookingFamily = null;
    this.bookingCategory = null;
    this.bookingModelNum = null;
    this.bookingModelName = null;
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
     9B. MODALE CATALOGUE VISUEL DES COIFFURES & PLANCHES DE MODÈLES
     ========================================================================== */
  setupHairCatalogModal() {
    const dialog = document.getElementById('hairCatalogModalDialog');
    if (!dialog || typeof HAIR_CATALOG_DATA === 'undefined') return;

    // Fallback light-dismiss pour les navigateurs ne supportant pas nativement closedby="any"
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('click', (event) => {
        if (event.target === dialog) {
          dialog.close();
        }
      });
    }

    this.renderHairCatalogCategoryTabs();

    // Recherche rapide de modèles dans l'en-tête (Raccourci escamotable)
    const searchWrap = document.getElementById('hairHeaderSearchWrap');
    const toggleSearchBtn = document.getElementById('btnToggleHairSearch');
    const clearSearchBtn = document.getElementById('btnClearHairSearch');
    const searchInput = document.getElementById('hairCatalogSearchInput');

    if (toggleSearchBtn && searchWrap && searchInput) {
      toggleSearchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        searchWrap.classList.toggle('active');
        if (searchWrap.classList.contains('active')) {
          setTimeout(() => searchInput.focus(), 80);
        } else {
          searchInput.value = '';
          this.hairSearchQuery = '';
          this.renderHairCatalogContent();
        }
      });
    }

    if (clearSearchBtn && searchInput) {
      clearSearchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        searchInput.value = '';
        this.hairSearchQuery = '';
        this.renderHairCatalogContent();
        searchInput.focus();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.hairSearchQuery = searchInput.value.trim().toLowerCase();
        if (this.hairSearchQuery && searchWrap) {
          searchWrap.classList.add('active');
        }
        this.renderHairCatalogContent();
      });
    }

    // Bouton Prendre RDV depuis le pied de modale
    const bookBtn = document.getElementById('btnBookFromHairCatalog');
    if (bookBtn) {
      bookBtn.addEventListener('click', () => {
        const catToServiceMap = {
          cat1: 'tresses-cat1-nattes-collees',
          cat2: 'tresses-cat2-box-knotless',
          cat3: 'tresses-cat3-tribales',
          cat4: 'tresses-cat4-vanilles-twists',
          cat5: 'tresses-cat5-boho-goddess',
          cat6: 'tresses-cat6-sculpturales-locs'
        };
        const activeCat = HAIR_CATALOG_DATA.find(c => c.id === this.activeHairCatId);
        this.openBookingModal(catToServiceMap[this.activeHairCatId] || 'tresses-cat1-nattes-collees', {
          family: 'Nattes, Tresses & Vanilles',
          category: activeCat ? activeCat.shortTitle : null
        });
      });
    }

    // Contrôles de la visionneuse plein écran (Lightbox)
    const lbClose = document.getElementById('hairLightboxCloseBtn');
    const lbPrev = document.getElementById('hairLightboxPrevBtn');
    const lbNext = document.getElementById('hairLightboxNextBtn');
    const lbStage = document.getElementById('hairLightboxStage');

    if (lbClose) lbClose.addEventListener('click', () => this.closeHairBoardLightbox());
    if (lbPrev) lbPrev.addEventListener('click', () => this.stepHairBoardLightbox(-1));
    if (lbNext) lbNext.addEventListener('click', () => this.stepHairBoardLightbox(1));
    if (lbStage) {
      lbStage.addEventListener('click', (e) => {
        if (e.target === lbStage) this.closeHairBoardLightbox();
      });
    }
  }

  openHairCatalogModal(categoryId = 'overview') {
    const dialog = document.getElementById('hairCatalogModalDialog');
    if (!dialog || typeof HAIR_CATALOG_DATA === 'undefined') return;

    this.activeHairCatId = categoryId || 'overview';
    this.selectedBoardIdx = null; // Réinitialiser le choix de planche pour montrer les planches d'abord
    this.isBannerUnfolded = false; // Bannière foldée par défaut
    this.hairSearchQuery = '';
    const searchInput = document.getElementById('hairCatalogSearchInput');
    if (searchInput) searchInput.value = '';
    const searchWrap = document.getElementById('hairHeaderSearchWrap');
    if (searchWrap) searchWrap.classList.remove('active');

    this.closeHairBoardLightbox();
    this.renderHairCatalogCategoryTabs();
    this.renderHairCatalogContent();
    dialog.showModal();
  }

  renderHairCatalogCategoryTabs() {
    const tabsContainer = document.getElementById('hairCatalogCategoryTabs');
    if (!tabsContainer || typeof HAIR_CATALOG_DATA === 'undefined') return;

    tabsContainer.innerHTML = HAIR_CATALOG_DATA.map(cat => {
      const isActive = cat.id === this.activeHairCatId;
      const totalBoards = (cat.boards || []).length;
      const badgeLabel = cat.id === 'overview'
        ? 'Panorama'
        : (totalBoards > 0 ? `${totalBoards} planches` : '51 fiches');

      return `
        <button type="button" class="hair-cat-tab-btn ${isActive ? 'active' : ''}"
          role="tab" aria-selected="${isActive ? 'true' : 'false'}"
          data-hair-cat-id="${cat.id}">
          <span>${cat.id === 'overview' ? '🌟 ' : ''}${cat.shortTitle}</span>
          <span class="hair-cat-tab-count">${badgeLabel}</span>
        </button>
      `;
    }).join('');

    tabsContainer.querySelectorAll('.hair-cat-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeHairCatId = btn.dataset.hairCatId;
        this.selectedBoardIdx = null; // Revenir à la vue des planches de la nouvelle catégorie
        this.isBannerUnfolded = false; // Foldé par défaut
        this.closeHairBoardLightbox();
        this.renderHairCatalogCategoryTabs();
        this.renderHairCatalogContent();
        const body = document.getElementById('hairCatalogModalBody');
        if (body) body.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  renderHairCatalogContent() {
    const body = document.getElementById('hairCatalogModalBody');
    if (!body || typeof HAIR_CATALOG_DATA === 'undefined') return;

    const cat = HAIR_CATALOG_DATA.find(c => c.id === this.activeHairCatId) || HAIR_CATALOG_DATA[0];
    if (!cat) return;

    const query = this.hairSearchQuery;
    const isFolded = !this.isBannerUnfolded;

    // 1. Bannière de la catégorie : Foldable & Foldée par défaut, metrics inline compactes
    let html = `
      <div class="hair-cat-banner ${isFolded ? 'folded' : 'unfolded'}" id="hairCatBanner">
        <div class="hair-cat-banner-header">
          <div class="hair-cat-banner-title-wrap">
            <h3 style="margin: 0; font-family: var(--font-heading); font-size: 1.25rem; color: #f7d794;">${cat.title}</h3>
            <button type="button" class="hair-banner-toggle-btn" id="hairBannerToggleBtn" title="${isFolded ? 'Afficher la description complète' : 'Réduire la bannière'}">
              <span>${isFolded ? 'En savoir plus ▾' : 'Réduire ▴'}</span>
            </button>
          </div>
          <div class="hair-cat-metrics compact">
            <span class="hair-metric-chip-inline" title="Temps moyen de réalisation">
              <span class="chip-label">Pose :</span> <strong>⏱️ ${cat.avgPose}</strong>
            </span>
            <span class="hair-metric-chip-inline" title="Durée de conservation conseillée">
              <span class="chip-label">Tenue :</span> <strong>📅 ${cat.avgTenue}</strong>
            </span>
            <span class="hair-metric-chip-inline" title="Niveau de tension sur le cuir chevelu">
              <span class="chip-label">Tension :</span> <strong>💆🏾‍♀️ ${cat.tension}</strong>
            </span>
          </div>
        </div>
        <div class="hair-cat-banner-info">
          <p>${cat.description}</p>
        </div>
      </div>
    `;

    // 2. Traitement selon la catégorie
    const defaultCatBadge = `Cat. ${cat.number} • ${cat.shortTitle.replace(/^\d+\.\s*/, '')}`;
    const gearSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

    // CAS SPÉCIAL : Vue d'ensemble (Overview)
    if (cat.id === 'overview') {
      const subCats = HAIR_CATALOG_DATA.filter(c => c.id !== 'overview');
      html += `
        <section>
          <div class="hair-cat-banner overview-banner" style="margin-bottom: 1.25rem;">
            <div class="hair-cat-banner-header">
              <div class="hair-cat-banner-title-wrap">
                <h4 style="margin: 0; font-family: var(--font-heading); font-size: 1.15rem; color: #f7d794;">🌟 Panorama Complet • Les 6 Catégories de Coiffures</h4>
              </div>
              <span style="font-size: 0.8rem; color: rgba(255,255,255,0.85);">Cliquez sur une catégorie pour afficher ses planches</span>
            </div>
          </div>
          <div class="hair-models-grid">
            ${subCats.map(sc => {
        const scBadge = sc.categoryBadge || `Cat. ${sc.number} • ${sc.shortTitle.replace(/^\d+\.\s*/, '')}`;
        return `
                <div class="hair-model-card">
                  ${sc.coverImage ? `
                    <div class="hair-model-img-wrap" data-jump-hair-cat="${sc.id}" title="Ouvrir ${sc.shortTitle}">
                      <span class="hair-model-cat-badge">${scBadge}</span>
                      <img src="${sc.coverImage}" alt="${sc.title.replace(/"/g, '&quot;')}" loading="lazy" />
                      <span class="hair-model-zoom-pill">📂 Voir les planches</span>
                    </div>
                  ` : ''}
                  <div class="hair-model-card-body">
                    <div>
                      <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; margin-bottom: 0.45rem;">
                        <span class="hair-model-cat-inline-badge">🏷️ ${scBadge}</span>
                        <button type="button" class="card-gear-edit-btn"
                          data-edit-overview-cat="${sc.id}"
                          title="Modifier le contenu de cette catégorie"
                          aria-label="Modifier la catégorie ${sc.shortTitle.replace(/"/g, '&quot;')}">
                          ${gearSvg}
                        </button>
                      </div>
                      <div class="hair-model-top">
                        <span class="hair-model-num">${sc.number}</span>
                        <div class="hair-model-title-box">
                          <strong>${sc.title}</strong>
                          <span class="hair-model-style-tag">${sc.boards.length} planches • 51 modèles</span>
                        </div>
                      </div>
                      <p class="hair-model-desc" style="margin-top: 0.45rem;">${sc.description}</p>
                    </div>
                    <div class="hair-model-bottom">
                      <div class="hair-model-badges">
                        <span class="hair-badge-chip">⏱️ ${sc.avgPose}</span>
                        <span class="hair-badge-chip">📅 ${sc.avgTenue}</span>
                      </div>
                      <button type="button" class="hair-model-choose-btn" data-jump-hair-cat="${sc.id}">
                        Consulter les planches →
                      </button>
                    </div>
                  </div>
                </div>
              `;
      }).join('')}
          </div>
        </section>
      `;
    } else if (query) {
      // CAS DE RECHERCHE : L'utilisateur recherche un modèle précis par mot-clé
      const allCategoryModels = [
        ...(cat.style1Models || []).map(m => ({ ...m, styleType: 'Style 1 Mannequin', styleKey: 'style1Models' })),
        ...(cat.style2Models || []).map(m => ({ ...m, styleType: 'Style 2 Lookbook', styleKey: 'style2Models' }))
      ];
      const matchedModels = allCategoryModels.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.desc.toLowerCase().includes(query) ||
        String(m.num) === query
      );

      html += `
        <section>
          <div class="hair-cat-banner search-banner" style="margin-bottom: 1.25rem;">
            <div class="hair-cat-banner-header">
              <div class="hair-cat-banner-title-wrap">
                <h4 style="margin: 0; font-family: var(--font-heading); font-size: 1.15rem; color: #f7d794;">🔍 Résultats de recherche pour « ${query} » (${matchedModels.length} modèle${matchedModels.length > 1 ? 's' : ''})</h4>
              </div>
              <span style="font-size: 0.8rem; color: rgba(255,255,255,0.85);">Effacez la recherche pour revenir aux planches</span>
            </div>
          </div>
          ${matchedModels.length === 0 ? `
            <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
              <p style="font-weight: 700; font-size: 1.1rem; margin-bottom: 0.4rem;">Aucun modèle trouvé pour cette recherche</p>
              <p style="font-size: 0.88rem;">Essayez un autre mot-clé ou effacez la recherche pour parcourir les planches.</p>
            </div>
          ` : `
            <div class="hair-models-grid">
              ${matchedModels.map(m => {
        const badgeText = m.categoryBadge || defaultCatBadge;
        return `
                  <div class="hair-model-card">
                    ${m.image ? `
                      <div class="hair-model-img-wrap" data-zoom-single-img="${m.image}"
                        data-zoom-single-title="Modèle N°${m.num} — ${m.name.replace(/"/g, '&quot;')}"
                        data-zoom-single-sub="${badgeText} • ${m.styleType} • Pose : ${m.pose} • Tenue : ${m.tenue}">
                        <img src="${m.image}" alt="Modèle ${m.num} - ${m.name.replace(/"/g, '&quot;')}" loading="lazy" />
                        <span class="hair-model-zoom-pill">🔍 Zoom</span>
                      </div>
                    ` : ''}
                    <div class="hair-model-card-body">
                      <div>
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; margin-bottom: 0.45rem;">
                          <span class="hair-model-cat-inline-badge">🏷️ ${badgeText}</span>
                          <button type="button" class="card-gear-edit-btn"
                            data-edit-hair-model="${m.num}"
                            data-edit-hair-cat="${cat.id}"
                            data-edit-hair-style="${m.styleKey}"
                            title="Modifier le contenu de cette carte"
                            aria-label="Modifier le modèle ${m.num} ${m.name.replace(/"/g, '&quot;')}">
                            ${gearSvg}
                          </button>
                        </div>
                        <div class="hair-model-top">
                          <span class="hair-model-num">${m.num}</span>
                          <div class="hair-model-title-box">
                            <strong>${m.name}</strong>
                            <span class="hair-model-style-tag">${m.styleType} • Modèle N°${m.num}</span>
                          </div>
                        </div>
                        <p class="hair-model-desc" style="margin-top: 0.45rem;">${m.desc}</p>
                      </div>
                      <div class="hair-model-bottom">
                        <div class="hair-model-badges">
                          <span class="hair-badge-chip">⏱️ ${m.pose}</span>
                          <span class="hair-badge-chip">📅 ${m.tenue}</span>
                        </div>
                        <button type="button" class="hair-model-choose-btn"
                          data-choose-hair-model="${m.name.replace(/"/g, '&quot;')}"
                          data-choose-hair-num="${m.num}"
                          data-choose-hair-style="${m.styleType}"
                          data-choose-hair-cat="${cat.id}">
                          Choisir ce modèle →
                        </button>
                      </div>
                    </div>
                  </div>
                `;
      }).join('')}
            </div>
          `}
        </section>
      `;
    } else if (this.selectedBoardIdx === null) {
      // CAS PRINCIPAL 1 : L'utilisateur choisit d'abord une planche (pas de fiches affichées dessous)
      const boards = cat.boards || [];
      this.currentLightboxBoards = boards;

      html += `
        <section>
          <div class="hair-cat-banner planches-banner" style="margin-bottom: 1.25rem;">
            <div class="hair-cat-banner-header">
              <div class="hair-cat-banner-title-wrap">
                <h4 style="margin: 0; font-family: var(--font-heading); font-size: 1.15rem; color: #f7d794;">🖼️ Planches Visuelles (${boards.length} planches disponibles)</h4>
              </div>
              <span style="font-size: 0.8rem; color: rgba(255,255,255,0.85);">Cliquez sur une planche pour révéler ses fiches modèles individuelles</span>
            </div>
          </div>
          ${boards.length === 0 ? `
            <div style="background: #fff9f2; border: 1.5px dashed var(--color-gold-600); border-radius: 12px; padding: 1.25rem; color: var(--text-main); font-size: 0.9rem;">
              <strong>✨ Planches en cours de finalisation studio</strong> — Les planches visuelles haute résolution pour cette catégorie sont en cours d'optimisation.
            </div>
          ` : `
            <div class="hair-boards-grid">
              ${boards.map((b, idx) => `
                <article class="hair-board-card" data-select-board-card="${idx}" style="cursor: pointer;" title="Cliquer pour afficher les fiches modèles de ${b.title}">
                  <div class="hair-board-img-wrap" data-select-board-card="${idx}">
                    <button type="button" class="board-eye-zoom-btn" data-zoom-board="${idx}" title="Aperçu grand format (Zoom plein écran)" aria-label="Agrandir la planche ${b.title}">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                    <img src="${b.image}" alt="${b.title}" loading="lazy" />
                    <span class="hair-board-click-tag">📂 Voir les fiches modèles</span>
                  </div>
                  <div class="hair-board-meta">
                    <strong>${b.title}</strong>
                    <span>${b.subtitle}</span>
                  </div>
                </article>
              `).join('')}
            </div>
          `}
        </section>
      `;
    } else {
      // CAS PRINCIPAL 2 : Une planche est sélectionnée -> Vue détaillée avec bouton retour sticky et fiches modèles
      const boards = cat.boards || [];
      const selectedBoard = boards[this.selectedBoardIdx] || boards[0];
      this.currentLightboxBoards = [selectedBoard];

      // Extraction des modèles correspondant précisément à cette planche
      let relevantModels = [];
      const isStyle1 = selectedBoard.style === 'style1';
      const modelsSource = isStyle1 ? (cat.style1Models || []) : (cat.style2Models || []);

      // Calcul de la tranche selon l'index de la planche
      if (isStyle1) {
        // Style 1 (3x3 = 9 modèles par planche)
        const startNum = (this.selectedBoardIdx * 9) + 1;
        const endNum = startNum + 8;
        relevantModels = modelsSource.filter(m => m.num >= startNum && m.num <= endNum);
        if (relevantModels.length === 0) relevantModels = modelsSource; // fallback
      } else {
        // Style 2 (3x2 = 6 modèles par planche)
        const s2Index = Math.max(0, this.selectedBoardIdx - (cat.boards.filter(b => b.style === 'style1').length));
        const startNum = (s2Index * 6) + 1;
        const endNum = startNum + 5;
        relevantModels = modelsSource.filter(m => m.num >= startNum && m.num <= endNum);
        if (relevantModels.length === 0) relevantModels = modelsSource; // fallback
      }

      html += `
        <div class="hair-board-detail-view">
          <!-- 1. En-tête collant (Sticky Top) sous la navigation sticky du Lookbook -->
          <div class="hair-board-sticky-header">
            <button type="button" class="btn-back-to-boards" id="btnBackToBoards" title="Revenir aux planches de la catégorie">
              ← Revenir aux planches
            </button>
            <div class="hair-board-sticky-title">
              <span class="hair-board-sticky-badge">${selectedBoard.styleBadge || 'Planche'}</span>
              <strong>${selectedBoard.title}</strong>
            </div>
            <button type="button" class="btn-secondary hair-board-sticky-zoom-btn" id="btnZoomCurrentBoard" title="Agrandir la planche en plein écran">
              👁️ Plein Écran
            </button>
          </div>

          <!-- 2. Hero fusionné compact (fusion de l'ancienne barre et du mini hero) -->
          <div class="hair-board-hero-unified">
            <div class="hair-board-hero-thumb-wrap" id="miniBoardImg" title="Cliquer pour inspecter en plein écran">
              <img src="${selectedBoard.image}" alt="${selectedBoard.title}" />
              <span class="hair-board-hero-zoom-badge">👁️ Agrandir</span>
            </div>
            <div class="hair-board-hero-content">
              <div class="hair-board-hero-tags">
                <span class="badge-gold">${selectedBoard.styleBadge || 'Planche Visuelle'}</span>
                <span class="badge-subtle">${selectedBoard.modelsRange || `${relevantModels.length} modèles`}</span>
              </div>
              <h3>${selectedBoard.title}</h3>
              <p>${selectedBoard.subtitle} — Sélectionnez ci-dessous la fiche du modèle de votre choix pour valider votre réservation immédiate.</p>
            </div>
          </div>

          <section>
            <div class="hair-cat-banner models-banner" style="margin-bottom: 1.25rem;">
              <div class="hair-cat-banner-header">
                <div class="hair-cat-banner-title-wrap">
                  <h4 style="margin: 0; font-family: var(--font-heading); font-size: 1.15rem; color: #f7d794;">📋 Fiches Modèles de cette planche (${relevantModels.length} modèles)</h4>
                </div>
                <span style="font-size: 0.8rem; color: rgba(255,255,255,0.85);">Cliquez sur « Choisir ce modèle » pour réserver</span>
              </div>
            </div>
            <div class="hair-models-grid">
              ${relevantModels.map(m => {
        const badgeText = m.categoryBadge || defaultCatBadge;
        const styleLabel = isStyle1 ? 'Style 1 Mannequin' : 'Style 2 Lookbook';
        return `
                  <div class="hair-model-card">
                    ${m.image ? `
                      <div class="hair-model-img-wrap" data-zoom-single-img="${m.image}"
                        data-zoom-single-title="Modèle N°${m.num} — ${m.name.replace(/"/g, '&quot;')}"
                        data-zoom-single-sub="${badgeText} • ${styleLabel} • Pose : ${m.pose} • Tenue : ${m.tenue}">
                        <img src="${m.image}" alt="Modèle ${m.num} - ${m.name.replace(/"/g, '&quot;')}" loading="lazy" />
                        <span class="hair-model-zoom-pill">🔍 Zoom</span>
                      </div>
                    ` : ''}
                    <div class="hair-model-card-body">
                      <div>
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; margin-bottom: 0.45rem;">
                          <span class="hair-model-cat-inline-badge">🏷️ ${badgeText}</span>
                          <button type="button" class="card-gear-edit-btn"
                            data-edit-hair-model="${m.num}"
                            data-edit-hair-cat="${cat.id}"
                            data-edit-hair-style="${isStyle1 ? 'style1Models' : 'style2Models'}"
                            title="Modifier le contenu de cette carte"
                            aria-label="Modifier le modèle ${m.num} ${m.name.replace(/"/g, '&quot;')}">
                            ${gearSvg}
                          </button>
                        </div>
                        <div class="hair-model-top">
                          <span class="hair-model-num">${m.num}</span>
                          <div class="hair-model-title-box">
                            <strong>${m.name}</strong>
                            <span class="hair-model-style-tag">${styleLabel} • N°${m.num}${m.packs ? ' • ' + m.packs : ''}</span>
                          </div>
                        </div>
                        <p class="hair-model-desc" style="margin-top: 0.45rem;">${m.desc}</p>
                      </div>
                      <div class="hair-model-bottom">
                        <div class="hair-model-badges">
                          <span class="hair-badge-chip">⏱️ ${m.pose}</span>
                          <span class="hair-badge-chip">📅 ${m.tenue}</span>
                        </div>
                        <button type="button" class="hair-model-choose-btn"
                          data-choose-hair-model="${m.name.replace(/"/g, '&quot;')}"
                          data-choose-hair-num="${m.num}"
                          data-choose-hair-style="${styleLabel}"
                          data-choose-hair-cat="${cat.id}">
                          Choisir ce modèle →
                        </button>
                      </div>
                    </div>
                  </div>
                `;
      }).join('')}
            </div>
          </section>
        </div>
      `;
    }

    body.innerHTML = html;

    // Mise à jour du texte explicatif du pied de modale selon la vue
    const footerText = document.getElementById('hairCatalogFooterText');
    if (footerText) {
      if (cat.id === 'overview') {
        footerText.innerHTML = '✦ <strong>Panorama Général</strong> : 6 grandes familles de tresses africaines. Cliquez sur une catégorie pour découvrir ses planches.';
      } else if (this.selectedBoardIdx !== null) {
        const board = cat.boards?.[this.selectedBoardIdx] || cat.boards?.[0];
        footerText.innerHTML = `✦ Planche : <strong>${board ? board.title : ''}</strong> • Cliquez sur « Choisir ce modèle » pour réserver immédiatement.`;
      } else {
        footerText.innerHTML = '✦ Cliquez sur l\'icône <strong>œil 👁️</strong> pour agrandir en plein écran, ou <strong>cliquez sur la carte</strong> pour révéler ses fiches modèles.';
      }
    }

    // --- GESTIONNAIRES D'ÉVÉNEMENTS LOOKBOOK ---

    // 1. Bouton Toggle Bannière Foldable
    const toggleBannerBtn = body.querySelector('#hairBannerToggleBtn');
    if (toggleBannerBtn) {
      toggleBannerBtn.addEventListener('click', () => {
        this.isBannerUnfolded = !this.isBannerUnfolded;
        const bannerEl = body.querySelector('#hairCatBanner');
        if (bannerEl) {
          bannerEl.classList.toggle('unfolded', this.isBannerUnfolded);
          bannerEl.classList.toggle('folded', !this.isBannerUnfolded);
          toggleBannerBtn.querySelector('span').textContent = this.isBannerUnfolded ? 'Réduire ▴' : 'En savoir plus ▾';
        }
      });
    }

    // 2. Sélection d'une Planche (affiche la vue détail des fiches)
    body.querySelectorAll('[data-select-board-card], [data-select-board-btn]').forEach(el => {
      el.addEventListener('click', (e) => {
        // Si clic sur l'icône zoom ou image directe, zoomer
        if (e.target.closest('[data-zoom-board]')) return;
        const idxStr = el.dataset.selectBoardCard || el.dataset.selectBoardBtn;
        this.selectedBoardIdx = parseInt(idxStr, 10) || 0;
        this.renderHairCatalogContent();
        body.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // 3. Bouton Retour aux Planches
    const backToBoardsBtn = body.querySelector('#btnBackToBoards');
    if (backToBoardsBtn) {
      backToBoardsBtn.addEventListener('click', () => {
        this.selectedBoardIdx = null;
        this.renderHairCatalogContent();
        body.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // 4. Zoom sur la planche depuis la vue détail
    const zoomCurrentBoardBtn = body.querySelector('#btnZoomCurrentBoard');
    const miniBoardImg = body.querySelector('#miniBoardImg');
    if (zoomCurrentBoardBtn) {
      zoomCurrentBoardBtn.addEventListener('click', () => this.openHairBoardLightbox(0));
    }
    if (miniBoardImg) {
      miniBoardImg.addEventListener('click', () => this.openHairBoardLightbox(0));
    }

    // 5. Zoom plein écran sur les planches de la vue générale
    body.querySelectorAll('[data-zoom-board]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(el.dataset.zoomBoard, 10) || 0;
        this.openHairBoardLightbox(idx);
      });
    });

    // 6. Zoom plein écran sur une vignette individuelle de modèle
    const singleImgEls = Array.from(body.querySelectorAll('[data-zoom-single-img]'));
    singleImgEls.forEach((el, idx) => {
      el.addEventListener('click', () => {
        this.currentLightboxBoards = singleImgEls.map(item => ({
          image: item.dataset.zoomSingleImg,
          title: item.dataset.zoomSingleTitle,
          styleBadge: 'Modèle Individuel',
          subtitle: item.dataset.zoomSingleSub
        }));
        this.openHairBoardLightbox(idx);
      });
    });

    // 7. Navigation vers une catégorie depuis le panorama
    body.querySelectorAll('[data-jump-hair-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeHairCatId = btn.dataset.jumpHairCat;
        this.selectedBoardIdx = null;
        this.isBannerUnfolded = false;
        this.renderHairCatalogCategoryTabs();
        this.renderHairCatalogContent();
        body.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // 8. Roue dentée (⚙️) sur les modèles
    body.querySelectorAll('[data-edit-hair-model]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openCardEditorModal({
          kind: 'hair-model',
          catId: btn.dataset.editHairCat,
          styleKey: btn.dataset.editHairStyle,
          targetId: btn.dataset.editHairModel
        });
      });
    });

    // 9. Roue dentée (⚙️) sur les catégories de l'overview
    body.querySelectorAll('[data-edit-overview-cat]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openCardEditorModal({
          kind: 'hair-category',
          targetId: btn.dataset.editOverviewCat
        });
      });
    });

    // 10. Bouton "Choisir ce modèle →" : ouverture de la réservation avec passage des 3 niveaux complets
    const catToServiceMap = {
      cat1: 'tresses-cat1-nattes-collees',
      cat2: 'tresses-cat2-box-knotless',
      cat3: 'tresses-cat3-tribales',
      cat4: 'tresses-cat4-vanilles-twists',
      cat5: 'tresses-cat5-boho-goddess',
      cat6: 'tresses-cat6-sculpturales-locs'
    };

    body.querySelectorAll('[data-choose-hair-model]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modelName = btn.dataset.chooseHairModel;
        const modelNum = btn.dataset.chooseHairNum;
        const modelStyle = btn.dataset.chooseHairStyle;
        const targetCatId = btn.dataset.chooseHairCat || cat.id;
        const targetCat = HAIR_CATALOG_DATA.find(c => c.id === targetCatId) || cat;

        const targetServiceId = catToServiceMap[targetCatId] || 'tresses-cat1-nattes-collees';
        this.openBookingModal(targetServiceId, {
          family: 'Nattes, Tresses & Vanilles',
          category: targetCat.shortTitle,
          modelNum,
          modelName,
          modelStyle
        });

        const notesInput = document.getElementById('modalClientNotes');
        if (notesInput) {
          notesInput.value = `Modèle choisi dans le Catalogue : ${targetCat.shortTitle} — Modèle N°${modelNum} ${modelName} (${modelStyle})`;
        }
        this.showToast(`Modèle sélectionné : N°${modelNum} ${modelName}`);
      });
    });
  }

  /* ==========================================================================
     9C. ÉDITEUR UNIVERSEL DE CARTE (BOUTON ROUE DENTÉE ⚙️ + LOCALSTORAGE)
     ========================================================================== */
  snapshotOriginalCardsData() {
    this.originalServicesSnapshot = typeof SERVICES_DATA !== 'undefined'
      ? JSON.parse(JSON.stringify(SERVICES_DATA))
      : [];
    this.originalProductsSnapshot = typeof PRODUCTS_DATA !== 'undefined'
      ? JSON.parse(JSON.stringify(PRODUCTS_DATA))
      : [];
    this.originalHairCatalogSnapshot = typeof HAIR_CATALOG_DATA !== 'undefined'
      ? JSON.parse(JSON.stringify(HAIR_CATALOG_DATA))
      : [];
  }

  getStoredCardOverrides() {
    try {
      const raw = localStorage.getItem(this.cardOverridesKey);
      return raw ? JSON.parse(raw) : { services: {}, products: {}, hairModels: {}, hairCategories: {} };
    } catch (e) {
      return { services: {}, products: {}, hairModels: {}, hairCategories: {} };
    }
  }

  saveStoredCardOverrides(overrides) {
    try {
      localStorage.setItem(this.cardOverridesKey, JSON.stringify(overrides));
    } catch (e) {
      console.warn('Impossible de sauvegarder dans localStorage:', e);
    }
  }

  loadCardOverrides() {
    const ov = this.getStoredCardOverrides();

    if (typeof SERVICES_DATA !== 'undefined' && ov.services) {
      SERVICES_DATA.forEach(s => {
        const custom = ov.services[s.id];
        if (custom) Object.assign(s, custom);
      });
    }

    if (typeof PRODUCTS_DATA !== 'undefined' && ov.products) {
      PRODUCTS_DATA.forEach(p => {
        const custom = ov.products[p.id];
        if (custom) Object.assign(p, custom);
      });
    }

    if (typeof HAIR_CATALOG_DATA !== 'undefined') {
      HAIR_CATALOG_DATA.forEach(cat => {
        if (ov.hairCategories && ov.hairCategories[cat.id]) {
          Object.assign(cat, ov.hairCategories[cat.id]);
        }
        ['style1Models', 'style2Models'].forEach(styleKey => {
          (cat[styleKey] || []).forEach(m => {
            const key = `${cat.id}__${styleKey}__${m.num}`;
            if (ov.hairModels && ov.hairModels[key]) {
              Object.assign(m, ov.hairModels[key]);
            }
          });
        });
      });
    }
  }

  setupCardEditorModal() {
    const dialog = document.getElementById('cardEditorModalDialog');
    const form = document.getElementById('cardEditorForm');
    const resetBtn = document.getElementById('cardEditorResetBtn');
    const fileInput = document.getElementById('cardEditorFileInput');
    const imageInput = document.getElementById('cardEditorImageInput');

    if (!dialog || !form) return;

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('click', (event) => {
        if (event.target === dialog) dialog.close();
      });
    }

    if (fileInput && imageInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          imageInput.value = ev.target.result;
          this.showToast('Photo chargée ! Cliquez sur Enregistrer pour valider.');
        };
        reader.readAsDataURL(file);
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCardEditorSave();
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.handleCardEditorReset();
      });
    }
  }

  openCardEditorModal({ kind, targetId, catId = '', styleKey = '' }) {
    const dialog = document.getElementById('cardEditorModalDialog');
    if (!dialog) return;

    document.getElementById('cardEditorKind').value = kind;
    document.getElementById('cardEditorTargetId').value = targetId;
    document.getElementById('cardEditorCatId').value = catId;
    document.getElementById('cardEditorStyleKey').value = styleKey;

    const typeTag = document.getElementById('cardEditorModalTypeTag');
    const nameInput = document.getElementById('cardEditorNameInput');
    const badgeInput = document.getElementById('cardEditorBadgeInput');
    const priceWrap = document.getElementById('cardEditorPriceWrap');
    const priceInput = document.getElementById('cardEditorPriceLabelInput');
    const taglineWrap = document.getElementById('cardEditorTaglineWrap');
    const taglineInput = document.getElementById('cardEditorTaglineInput');
    const poseWrap = document.getElementById('cardEditorPoseWrap');
    const poseInput = document.getElementById('cardEditorPoseInput');
    const tenueWrap = document.getElementById('cardEditorTenueWrap');
    const tenueInput = document.getElementById('cardEditorTenueInput');
    const packsWrap = document.getElementById('cardEditorPacksWrap');
    const packsInput = document.getElementById('cardEditorPacksInput');
    const descInput = document.getElementById('cardEditorDescInput');
    const imageInput = document.getElementById('cardEditorImageInput');

    if (kind === 'service') {
      const s = SERVICES_DATA.find(item => item.id === targetId);
      if (!s) return;
      if (typeTag) typeTag.textContent = '⚙️ Édition d’une Prestation du Salon';
      nameInput.value = s.name || '';
      badgeInput.value = s.categoryBadge || (s.category === 'coiffure-tresses' ? 'Tresses & Tissages' : 'Soin Salon');
      priceWrap.style.display = 'block';
      priceInput.value = s.priceLabel || '';
      taglineWrap.style.display = 'block';
      taglineInput.value = s.tagline || '';
      poseWrap.style.display = 'none';
      tenueWrap.style.display = 'none';
      packsWrap.style.display = 'none';
      descInput.value = s.description || '';
      imageInput.value = s.customImage || s.image || '';
    } else if (kind === 'product') {
      const p = PRODUCTS_DATA.find(item => item.id === targetId);
      if (!p) return;
      if (typeTag) typeTag.textContent = '⚙️ Édition d’un Produit de la Boutique';
      nameInput.value = p.name || '';
      badgeInput.value = p.categoryBadge || p.subCategory || 'Produit Phare';
      priceWrap.style.display = 'block';
      priceInput.value = p.priceLabel || '';
      taglineWrap.style.display = 'block';
      taglineInput.value = p.volume || p.tagline || '';
      poseWrap.style.display = 'none';
      tenueWrap.style.display = 'none';
      packsWrap.style.display = 'none';
      descInput.value = p.description || '';
      imageInput.value = p.customImage || p.image || '';
    } else if (kind === 'hair-model') {
      const cat = HAIR_CATALOG_DATA.find(c => c.id === catId);
      if (!cat) return;
      const m = (cat[styleKey] || []).find(item => String(item.num) === String(targetId));
      if (!m) return;
      const defaultCatBadge = `Cat. ${cat.number} • ${cat.shortTitle.replace(/^\d+\.\s*/, '')}`;
      if (typeTag) typeTag.textContent = `⚙️ Édition Modèle N°${m.num} (${cat.shortTitle})`;
      nameInput.value = m.name || '';
      badgeInput.value = m.categoryBadge || defaultCatBadge;
      priceWrap.style.display = 'none';
      taglineWrap.style.display = 'none';
      poseWrap.style.display = 'block';
      poseInput.value = m.pose || '';
      tenueWrap.style.display = 'block';
      tenueInput.value = m.tenue || '';
      packsWrap.style.display = styleKey === 'style2Models' ? 'block' : 'none';
      packsInput.value = m.packs || '';
      descInput.value = m.desc || '';
      imageInput.value = m.image || '';
    } else if (kind === 'hair-category') {
      const cat = HAIR_CATALOG_DATA.find(c => c.id === targetId);
      if (!cat) return;
      const defaultCatBadge = `Cat. ${cat.number} • ${cat.shortTitle.replace(/^\d+\.\s*/, '')}`;
      if (typeTag) typeTag.textContent = `⚙️ Édition Catégorie ${cat.number}`;
      nameInput.value = cat.title || '';
      badgeInput.value = cat.categoryBadge || defaultCatBadge;
      priceWrap.style.display = 'none';
      taglineWrap.style.display = 'none';
      poseWrap.style.display = 'block';
      poseInput.value = cat.avgPose || '';
      tenueWrap.style.display = 'block';
      tenueInput.value = cat.avgTenue || '';
      packsWrap.style.display = 'none';
      descInput.value = cat.description || '';
      imageInput.value = cat.coverImage || '';
    }

    dialog.showModal();
  }

  handleCardEditorSave() {
    const kind = document.getElementById('cardEditorKind').value;
    const targetId = document.getElementById('cardEditorTargetId').value;
    const catId = document.getElementById('cardEditorCatId').value;
    const styleKey = document.getElementById('cardEditorStyleKey').value;

    const name = document.getElementById('cardEditorNameInput').value.trim();
    const categoryBadge = document.getElementById('cardEditorBadgeInput').value.trim();
    const priceLabel = document.getElementById('cardEditorPriceLabelInput').value.trim();
    const tagline = document.getElementById('cardEditorTaglineInput').value.trim();
    const pose = document.getElementById('cardEditorPoseInput').value.trim();
    const tenue = document.getElementById('cardEditorTenueInput').value.trim();
    const packs = document.getElementById('cardEditorPacksInput').value.trim();
    const desc = document.getElementById('cardEditorDescInput').value.trim();
    const imgVal = document.getElementById('cardEditorImageInput').value.trim();

    const ov = this.getStoredCardOverrides();

    if (kind === 'service') {
      const s = SERVICES_DATA.find(item => item.id === targetId);
      if (s) {
        const patch = {
          name,
          categoryBadge,
          priceLabel: priceLabel || s.priceLabel,
          tagline,
          description: desc
        };
        if (imgVal) {
          patch.customImage = imgVal;
          patch.image = imgVal;
        }
        Object.assign(s, patch);
        ov.services = ov.services || {};
        ov.services[targetId] = patch;
        this.saveStoredCardOverrides(ov);
        this.renderCatalogItems();
        this.populateServiceDropdown();
      }
    } else if (kind === 'product') {
      const p = PRODUCTS_DATA.find(item => item.id === targetId);
      if (p) {
        const patch = {
          name,
          categoryBadge,
          priceLabel: priceLabel || p.priceLabel,
          volume: tagline || p.volume,
          description: desc
        };
        if (imgVal) {
          patch.customImage = imgVal;
          patch.image = imgVal;
        }
        Object.assign(p, patch);
        ov.products = ov.products || {};
        ov.products[targetId] = patch;
        this.saveStoredCardOverrides(ov);
        this.renderCatalogItems();
      }
    } else if (kind === 'hair-model') {
      const cat = HAIR_CATALOG_DATA.find(c => c.id === catId);
      const m = cat ? (cat[styleKey] || []).find(item => String(item.num) === String(targetId)) : null;
      if (m) {
        const patch = {
          name,
          categoryBadge,
          pose: pose || m.pose,
          tenue: tenue || m.tenue,
          packs: packs || m.packs,
          desc
        };
        if (imgVal) patch.image = imgVal;
        Object.assign(m, patch);
        ov.hairModels = ov.hairModels || {};
        ov.hairModels[`${catId}__${styleKey}__${targetId}`] = patch;
        this.saveStoredCardOverrides(ov);
        this.renderHairCatalogContent();
      }
    } else if (kind === 'hair-category') {
      const cat = HAIR_CATALOG_DATA.find(c => c.id === targetId);
      if (cat) {
        const patch = {
          title: name,
          categoryBadge,
          avgPose: pose || cat.avgPose,
          avgTenue: tenue || cat.avgTenue,
          description: desc
        };
        if (imgVal) patch.coverImage = imgVal;
        Object.assign(cat, patch);
        ov.hairCategories = ov.hairCategories || {};
        ov.hairCategories[targetId] = patch;
        this.saveStoredCardOverrides(ov);
        this.renderHairCatalogContent();
      }
    }

    const dialog = document.getElementById('cardEditorModalDialog');
    if (dialog) dialog.close();
    this.showToast('Carte mise à jour avec succès !');
  }

  handleCardEditorReset() {
    const kind = document.getElementById('cardEditorKind').value;
    const targetId = document.getElementById('cardEditorTargetId').value;
    const catId = document.getElementById('cardEditorCatId').value;
    const styleKey = document.getElementById('cardEditorStyleKey').value;

    const ov = this.getStoredCardOverrides();

    if (kind === 'service') {
      const orig = this.originalServicesSnapshot.find(item => item.id === targetId);
      const cur = SERVICES_DATA.find(item => item.id === targetId);
      if (orig && cur) {
        delete cur.customImage;
        Object.assign(cur, JSON.parse(JSON.stringify(orig)));
      }
      if (ov.services) delete ov.services[targetId];
      this.saveStoredCardOverrides(ov);
      this.renderCatalogItems();
      this.populateServiceDropdown();
    } else if (kind === 'product') {
      const orig = this.originalProductsSnapshot.find(item => item.id === targetId);
      const cur = PRODUCTS_DATA.find(item => item.id === targetId);
      if (orig && cur) {
        delete cur.customImage;
        Object.assign(cur, JSON.parse(JSON.stringify(orig)));
      }
      if (ov.products) delete ov.products[targetId];
      this.saveStoredCardOverrides(ov);
      this.renderCatalogItems();
    } else if (kind === 'hair-model') {
      const origCat = this.originalHairCatalogSnapshot.find(c => c.id === catId);
      const origM = origCat ? (origCat[styleKey] || []).find(item => String(item.num) === String(targetId)) : null;
      const curCat = HAIR_CATALOG_DATA.find(c => c.id === catId);
      const curM = curCat ? (curCat[styleKey] || []).find(item => String(item.num) === String(targetId)) : null;
      if (origM && curM) {
        delete curM.categoryBadge;
        Object.assign(curM, JSON.parse(JSON.stringify(origM)));
      }
      if (ov.hairModels) delete ov.hairModels[`${catId}__${styleKey}__${targetId}`];
      this.saveStoredCardOverrides(ov);
      this.renderHairCatalogContent();
    } else if (kind === 'hair-category') {
      const origCat = this.originalHairCatalogSnapshot.find(c => c.id === targetId);
      const curCat = HAIR_CATALOG_DATA.find(c => c.id === targetId);
      if (origCat && curCat) {
        delete curCat.categoryBadge;
        Object.assign(curCat, JSON.parse(JSON.stringify(origCat)));
      }
      if (ov.hairCategories) delete ov.hairCategories[targetId];
      this.saveStoredCardOverrides(ov);
      this.renderHairCatalogContent();
    }

    const dialog = document.getElementById('cardEditorModalDialog');
    if (dialog) dialog.close();
    this.showToast('Carte réinitialisée à ses valeurs d’origine.');
  }

  openHairBoardLightbox(index) {
    const lightbox = document.getElementById('hairBoardLightbox');
    const img = document.getElementById('hairLightboxImg');
    const caption = document.getElementById('hairLightboxCaption');
    if (!lightbox || !img || !this.currentLightboxBoards.length) return;

    this.currentLightboxIndex = Math.max(0, Math.min(index, this.currentLightboxBoards.length - 1));
    const board = this.currentLightboxBoards[this.currentLightboxIndex];

    img.src = board.image;
    img.alt = board.title;
    if (caption) {
      caption.innerHTML = `
        <strong>${board.title}</strong>
        <span>${board.styleBadge} • ${board.subtitle} (${this.currentLightboxIndex + 1}/${this.currentLightboxBoards.length})</span>
      `;
    }
    lightbox.hidden = false;
  }

  stepHairBoardLightbox(delta) {
    if (!this.currentLightboxBoards.length) return;
    const total = this.currentLightboxBoards.length;
    const nextIdx = (this.currentLightboxIndex + delta + total) % total;
    this.openHairBoardLightbox(nextIdx);
  }

  closeHairBoardLightbox() {
    const lightbox = document.getElementById('hairBoardLightbox');
    if (lightbox) lightbox.hidden = true;
  }

  /* ==========================================================================
     10. ÉCOUTEURS D'ÉVÉNEMENTS GLOBAUX & DÉCLENCHEURS DE MODALES
     ========================================================================== */
  setupEventListeners() {
    // Boutons flottants bas-gauche (3 boutons : Catalogue Coiffures, Soins & Produits, Mariée & Événements)
    const floatHairCatBtn = document.getElementById('btnFloatingHairCatalogModal');
    if (floatHairCatBtn) {
      floatHairCatBtn.addEventListener('click', () => this.openHairCatalogModal('overview'));
    }

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
