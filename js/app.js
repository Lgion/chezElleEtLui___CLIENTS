/**
 * Application Principale - Salon de Coiffure & Beauté Elle & Lui
 * Abidjan Cocody N°39
 */

// import { SERVICES_DATA, SERVICE_CATEGORIES } from './data/services.js';
// import { PRODUCTS_DATA } from './data/products.js';
// import { DashboardManager } from './dashboard.js';
// import {
//   generateTimeSlots,
//   getWhatsAppBookingUrl,
//   getWhatsAppProductUrl,
//   SALON_OPEN_HOUR,
//   SALON_OPEN_MINUTE,
//   SALON_CLOSE_HOUR
// } from './booking.js';
console.log("PRODUCTS_DATA");
console.log(PRODUCTS_DATA);
console.log("SERVICES_DATA, SERVICE_CATEGORIES");
console.log("SERVICES_DATA, SERVICE_CATEGORIES chargées avec succès.");

class SalonApp {
  constructor() {
    this.dashboardManager = new DashboardManager();
    this.activeRealm = 'coiffure'; // 'coiffure' ou 'esthetic'
    this.activeCategory = 'all';
    this.searchQuery = '';
    this.selectedTimeSlot = null;
    this.selectedService = null;
    this.waveQrCodeInstance = null;
    this.waveBaseUrl = 'https://pay.wave.com/m/M_ci_tk7yljaMIDFk/c/ci/?amount=';

    this.init();
  }

  init() {
    this.setupLiveStatus();
    this.setupRealmSwitchers();
    this.renderCategoryTabs();
    this.renderServices();
    this.renderProducts();
    this.populateServiceDropdown();
    this.setupEventListeners();
    this.setupScrollEffects();
    this.initScrollSpy();
    this.setupServiceDetailModal();
    this.setupWavePaymentModal();
  }

  /* --- 1. Indicateur d'Ouverture en Direct --- */
  setupLiveStatus() {
    const badge = document.getElementById('liveStatusBadge');
    if (!badge) return;

    const checkStatus = () => {
      // Heure d'Abidjan (UTC+0 / GMT)
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

  /* --- 2. Switcher d'Univers (Coiffure vs Esthétique vs Produits) --- */
  setupRealmSwitchers() {
    // Switcher vertical fixe (gauche)
    document.querySelectorAll('.switcher-realm-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const realm = btn.dataset.realm;
        if (realm === 'produits') {
          this.setRealm('produits');
          const prodSection = document.getElementById('produits');
          if (prodSection) {
            prodSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          return;
        }

        this.setRealm(realm);
        const section = document.getElementById('prestations');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Switcher intégré en tête de catalogue
    document.querySelectorAll('.realm-segment-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const realm = btn.dataset.realm;
        if (realm === 'produits') {
          this.setRealm('produits');
          const prodSection = document.getElementById('produits');
          if (prodSection) {
            prodSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          return;
        }

        this.setRealm(realm);
      });
    });
  }

  setRealm(realm) {
    if (this.activeRealm === realm) return;
    this.activeRealm = realm;

    // Mise à jour de l'état actif sur les deux switchers
    document.querySelectorAll('.switcher-realm-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.realm === realm);
    });

    document.querySelectorAll('.realm-segment-btn').forEach(b => {
      const isActive = b.dataset.realm === realm;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    if (realm === 'produits') {
      return;
    }

    this.activeCategory = 'all';
    this.renderCategoryTabs();
    this.renderServices();
  }

  /* --- 3. Rendu des Filtres de Catégories par Univers --- */
  renderCategoryTabs() {
    const container = document.getElementById('categoryTabs');
    if (!container) return;

    let categories = [];
    if (this.activeRealm === 'coiffure') {
      categories = [
        { id: 'all', name: 'Toutes les coiffures', icon: 'sparkles' },
        { id: 'coiffure-tresses', name: 'Tresses & Tissages', icon: 'scissors' },
        { id: 'coiffure-soins', name: 'Coiffure & Shampoings', icon: 'wand' }
      ];
    } else {
      categories = [
        { id: 'all', name: 'Tous les soins spa', icon: 'sparkles' },
        { id: 'esthetic-spa', name: 'Soins Visage & Massages', icon: 'heart' },
        { id: 'esthetic-ongles', name: 'Onglerie & Épilation', icon: 'gem' },
        { id: 'mariee', name: 'Forfaits Mariée', icon: 'crown' }
      ];
    }

    container.innerHTML = categories.map(cat => `
      <button class="cat-tab-btn ${this.activeCategory === cat.id ? 'active' : ''}" data-cat-id="${cat.id}">
        ${this.getCategoryIcon(cat.icon)}
        <span>${cat.name}</span>
      </button>
    `).join('');

    container.querySelectorAll('.cat-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeCategory = btn.dataset.catId;
        container.querySelectorAll('.cat-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderServices();
      });
    });
  }

  getCategoryIcon(iconName) {
    switch (iconName) {
      case 'scissors':
        return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>`;
      case 'heart':
        return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
      case 'gem':
        return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l4 6-10 12L2 9Z"/></svg>`;
      case 'wand':
        return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 4-2 2M15 4l2 2M15 4v4M15 4h4M9 9l-7 7a2.83 2.83 0 0 0 4 4l7-7"/></svg>`;
      case 'crown':
        return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>`;
      default:
        return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>`;
    }
  }

  getServiceCategoryIcon(category) {
    if (category === 'coiffure-tresses') return this.getCategoryIcon('scissors');
    if (category === 'coiffure-soins') return this.getCategoryIcon('wand');
    if (category === 'esthetic-spa') return this.getCategoryIcon('heart');
    if (category === 'esthetic-ongles') return this.getCategoryIcon('gem');
    if (category === 'mariee') return this.getCategoryIcon('crown');
    return this.getCategoryIcon('sparkles');
  }

  /* --- 4. Rendu des Cartes de Services (Compactes avec Icônes & Bouton Œil) --- */
  renderServices() {
    const container = document.getElementById('servicesGrid');
    if (!container) return;

    // 1. Filtrage strict par univers (Coiffure vs Esthétique)
    let filtered = SERVICES_DATA.filter(s => {
      const isCoiffure = s.category.startsWith('coiffure-');
      return this.activeRealm === 'coiffure' ? isCoiffure : !isCoiffure;
    });

    // 2. Filtrage par sous-catégorie
    if (this.activeCategory !== 'all') {
      filtered = filtered.filter(s => s.category === this.activeCategory);
    }

    // 3. Filtrage par recherche
    if (this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.responsible.toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3.5rem 1rem; color: var(--text-muted);">
          <p style="font-size: 1.2rem; font-weight: 600; margin-bottom: 0.5rem;">Aucune prestation trouvée</p>
          <p style="font-size: 0.92rem;">Essayez un autre mot-clé ou réinitialisez les filtres.</p>
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
              <!-- Bouton avec icône œil pour ouvrir la modale détaillée -->
              <button class="btn-service-detail" data-action="detail" data-service-id="${service.id}" title="Voir détails et description" aria-label="Voir les détails de ${service.name}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>

              <!-- Bouton direct de réservation -->
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

    // Écouteurs UNIQUEMENT sur le bouton œil pour ouvrir la modale de détails
    container.querySelectorAll('[data-action="detail"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openServiceDetailModal(btn.dataset.serviceId);
      });
    });

    // Écouteurs sur le bouton "Réserver"
    container.querySelectorAll('[data-action="book"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openBookingModal(btn.dataset.serviceId);
      });
    });
  }

  /* --- 5. Modale de Détails Prestation Officielle --- */
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

  /* --- 6. ScrollSpy : Détection de Section & Coloration Header & Switcher --- */
  initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.main-nav .nav-link');
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${id}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });

          // Sync vertical realm switcher if in #produits or #prestations
          if (id === 'produits') {
            document.querySelectorAll('.switcher-realm-btn').forEach(b => {
              b.classList.toggle('active', b.dataset.realm === 'produits');
            });
            document.querySelectorAll('.realm-segment-btn').forEach(b => {
              b.classList.toggle('active', b.dataset.realm === 'produits');
            });
          } else if (id === 'prestations') {
            const currentRealm = (this.activeRealm === 'produits') ? 'coiffure' : this.activeRealm;
            this.activeRealm = currentRealm;
            document.querySelectorAll('.switcher-realm-btn').forEach(b => {
              b.classList.toggle('active', b.dataset.realm === currentRealm);
            });
            document.querySelectorAll('.realm-segment-btn').forEach(b => {
              b.classList.toggle('active', b.dataset.realm === currentRealm);
            });
          }
        }
      });
    }, {
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    });

    sections.forEach(sec => observer.observe(sec));
  }

  /* --- 4. Rendu des Produits Phares --- */
  renderProducts() {
    const container = document.getElementById('productsGrid');
    if (!container) return;

    container.innerHTML = PRODUCTS_DATA.map(product => `
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

  /* --- 5. Remplissage du Sélecteur de Prestations dans le Modal --- */
  populateServiceDropdown() {
    const select = document.getElementById('modalServiceSelect');
    if (!select) return;

    select.innerHTML = '<option value="">-- Choisissez une prestation --</option>' +
      SERVICES_DATA.map(s => `
        <option value="${s.id}">${s.name} (${s.priceLabel}) - ${s.responsible}</option>
      `).join('');

    select.addEventListener('change', (e) => {
      this.updateSelectedService(e.target.value);
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

  /* --- 6. Modal de Réservation --- */
  openBookingModal(serviceId = null) {
    const dialog = document.getElementById('bookingDialog');
    if (!dialog) return;

    // Définir la date minimale à aujourd'hui
    const dateInput = document.getElementById('modalBookingDate');
    const todayStr = new Date().toISOString().split('T')[0];
    dateInput.min = todayStr;
    if (!dateInput.value) {
      dateInput.value = todayStr;
    }

    // Générer les créneaux
    this.renderTimeSlots();

    // Présélectionner le service si fourni
    if (serviceId) {
      const select = document.getElementById('modalServiceSelect');
      select.value = serviceId;
      this.updateSelectedService(serviceId);
    }

    dialog.showModal();
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
      });
    });
  }

  /* --- 7. Tableau de Bord Salon (Gestion des RDVs) --- */
  openDashboardModal() {
    const dialog = document.getElementById('dashboardDialog');
    if (!dialog) return;

    this.renderDashboard();
    dialog.showModal();
  }

  renderDashboard() {
    const kpis = this.dashboardManager.getKPIs();
    document.getElementById('kpiTotal').textContent = kpis.total;
    document.getElementById('kpiToday').textContent = kpis.today;
    document.getElementById('kpiConfirmed').textContent = kpis.confirmed;
    document.getElementById('kpiRevenue').textContent = kpis.revenueFormatted;

    this.renderAppointmentsTable();
  }

  renderAppointmentsTable() {
    const tableBody = document.getElementById('appointmentsTableBody');
    const filterDate = document.getElementById('dashDateFilter').value;
    const searchVal = document.getElementById('dashSearchInput').value.toLowerCase().trim();

    let list = this.dashboardManager.getAppointments();
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    if (filterDate === 'today') {
      list = list.filter(a => a.date === todayStr);
    } else if (filterDate === 'tomorrow') {
      list = list.filter(a => a.date === tomorrow);
    }

    if (searchVal) {
      list = list.filter(a =>
        a.clientName.toLowerCase().includes(searchVal) ||
        a.clientPhone.toLowerCase().includes(searchVal) ||
        a.serviceName.toLowerCase().includes(searchVal)
      );
    }

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
              <a href="https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent('Bonjour ' + apt.clientName + ' ! Le Salon Elle & Lui vous confirme votre rendez-vous pour ' + apt.serviceName + ' le ' + apt.date + ' à ' + apt.timeSlot + '.')}" 
                 target="_blank" rel="noopener" class="btn-icon-action whatsapp" title="Contacter sur WhatsApp">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              </a>
              <button class="btn-icon-action delete" data-delete-apt-id="${apt.id}" title="Supprimer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Écouteurs de changement de statut
    tableBody.querySelectorAll('.status-changer').forEach(select => {
      select.addEventListener('change', (e) => {
        this.dashboardManager.updateStatus(select.dataset.aptId, e.target.value);
        this.renderDashboard();
        this.showToast('Statut mis à jour !');
      });
    });

    // Écouteurs de suppression
    tableBody.querySelectorAll('[data-delete-apt-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Confirmer la suppression de cette réservation ?')) {
          this.dashboardManager.deleteAppointment(btn.dataset.deleteAptId);
          this.renderDashboard();
          this.showToast('Rendez-vous supprimé');
        }
      });
    });
  }

  /* --- 8. Écouteurs d'Événements Globaux --- */
  setupEventListeners() {
    // Barre de recherche
    const searchInput = document.getElementById('serviceSearchInput');
    const clearBtn = document.getElementById('searchClearBtn');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        if (clearBtn) {
          clearBtn.style.display = this.searchQuery ? 'block' : 'none';
        }
        this.renderServices();
      });
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        this.searchQuery = '';
        clearBtn.style.display = 'none';
        this.renderServices();
        searchInput.focus();
      });
    }

    // Modals Close
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dialog = e.target.closest('dialog');
        if (dialog) dialog.close();
      });
    });

    // Clic en dehors du modal pour fermer
    ['bookingDialog', 'dashboardDialog'].forEach(id => {
      const dialog = document.getElementById(id);
      if (dialog) {
        dialog.addEventListener('click', (e) => {
          if (e.target === dialog) {
            dialog.close();
          }
        });
      }
    });

    // Formulaire de réservation Client
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
      bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleBookingSubmit();
      });
    }

    // Déclencheur Espace Salon (Bouton Header + Lien Footer)
    document.querySelectorAll('[data-trigger-dashboard]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openDashboardModal();
      });
    });

    // Filtres Dashboard
    const dashDateFilter = document.getElementById('dashDateFilter');
    if (dashDateFilter) {
      dashDateFilter.addEventListener('change', () => this.renderAppointmentsTable());
    }

    const dashSearch = document.getElementById('dashSearchInput');
    if (dashSearch) {
      dashSearch.addEventListener('input', () => this.renderAppointmentsTable());
    }

    // Export CSV Dashboard
    const exportBtn = document.getElementById('btnExportCSV');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.dashboardManager.exportCSV();
        this.showToast('Export CSV téléchargé !');
      });
    }

    // Toggle Formulaire Ajout Rapide Salon
    const toggleQuickAdd = document.getElementById('btnToggleQuickAdd');
    const quickAddForm = document.getElementById('quickAddForm');
    if (toggleQuickAdd && quickAddForm) {
      toggleQuickAdd.addEventListener('click', () => {
        quickAddForm.classList.toggle('open');
      });
    }

    // Soumission Formulaire Ajout Rapide Salon
    if (quickAddForm) {
      quickAddForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const clientName = document.getElementById('quickClientName').value.trim();
        const clientPhone = document.getElementById('quickClientPhone').value.trim();
        const serviceName = document.getElementById('quickServiceName').value.trim();
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
          specialist: 'Salon Elle & Lui',
          date,
          timeSlot,
          price,
          priceLabel: new Intl.NumberFormat('fr-FR').format(price) + ' FCFA',
          status: 'confirmed',
          notes: 'Ajouté directement au salon'
        });

        quickAddForm.reset();
        quickAddForm.classList.remove('open');
        this.renderDashboard();
        this.showToast('Rendez-vous ajouté avec succès !');
      });
    }

    // Mobile Navigation Drawer Toggle
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const mainNav = document.getElementById('mainNav');
    if (mobileToggle && mainNav) {
      mobileToggle.addEventListener('click', () => {
        mainNav.classList.toggle('mobile-open');
      });

      // Fermer le menu lors du clic sur un lien
      mainNav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          mainNav.classList.remove('mobile-open');
        });
      });
    }

    // Réservation Forfait Mariée direct
    document.querySelectorAll('[data-book-wedding]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pkg = btn.dataset.bookWedding;
        const serviceId = pkg === '1mois' ? 'forfait-mariee-1mois' : 'forfait-mariee-3mois';
        this.openBookingModal(serviceId);
      });
    });

    // Bouton Prendre RDV dans le Hero
    const heroBookBtn = document.getElementById('heroBookBtn');
    if (heroBookBtn) {
      heroBookBtn.addEventListener('click', () => {
        this.openBookingModal();
      });
    }
    const navBookBtn = document.getElementById('navBookBtn');
    if (navBookBtn) {
      navBookBtn.addEventListener('click', () => {
        this.openBookingModal();
      });
    }
  }

  /* --- 9. Traitement de la Réservation Client --- */
  handleBookingSubmit() {
    const serviceSelect = document.getElementById('modalServiceSelect');
    const serviceId = serviceSelect.value;
    const date = document.getElementById('modalBookingDate').value;
    const clientName = document.getElementById('modalClientName').value.trim();
    const clientPhone = document.getElementById('modalClientPhone').value.trim();
    const notes = document.getElementById('modalClientNotes').value.trim();

    if (!serviceId) {
      alert('Veuillez sélectionner une prestation.');
      return;
    }
    if (!this.selectedTimeSlot) {
      alert('Veuillez sélectionner un créneau horaire.');
      return;
    }
    if (!clientName || !clientPhone) {
      alert('Veuillez renseigner votre nom et votre numéro de téléphone.');
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

    // 1. Sauvegarder dans le système local du salon
    this.dashboardManager.addAppointment(bookingPayload);

    // 2. Générer l'URL WhatsApp
    const whatsappUrl = getWhatsAppBookingUrl(bookingPayload);

    // 3. Fermer le modal et réinitialiser
    document.getElementById('bookingDialog').close();
    document.getElementById('bookingForm').reset();
    this.selectedTimeSlot = null;
    this.selectedService = null;
    document.getElementById('bookingSummaryBox').style.display = 'none';

    // 4. Notification et ouverture WhatsApp
    this.showToast('Rendez-vous enregistré ! Ouverture de WhatsApp...');

    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
    }, 600);
  }

  /* --- 9. Modale de Paiement Sécurisé Wave Côte d'Ivoire --- */
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
        // Mettre à jour l'état actif des boutons de montants rapides
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
          this.showToast('Lien de paiement Wave copié dans le presse-papier !');
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

    if (directLink) {
      directLink.href = paymentUrl;
    }

    if (amountLabel) {
      amountLabel.textContent = (amount > 0 ? amount.toLocaleString('fr-FR') : '0') + ' FCFA';
    }

    if (!qrBox) return;

    if (typeof QRCode === 'undefined') {
      qrBox.innerHTML = '<p style="font-size:0.8rem; color:#888;">Module QRCode en cours de chargement...</p>';
      return;
    }

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

  /* --- 10. Effets de Défilement (Header Sticky Blur) --- */
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

  /* --- 11. Toast Notification --- */
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
