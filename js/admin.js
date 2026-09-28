/**
 * Admin Logic - Salon Elle & Lui
 * Gère les interactions et la persistance complète de la page d'administration :
 * - Rendez-vous (CRUD complet : Créer, Lire, Mettre à jour, Supprimer)
 * - Téléphones & WhatsApp (Gérante, Ligne directe, Lignes secondaires)
 * - Wave Payment
 * - Galerie Photos (CRUD complet avec prévisualisation)
 * - Réseaux Sociaux
 */

document.addEventListener('DOMContentLoaded', () => {
  // Instances des gestionnaires
  const settingsMgr = window.salonSettingsManager;
  const galleryMgr = window.salonGalleryManager;
  const dashboardMgr = new DashboardManager();

  // Toast Helper
  const showAdminToast = (msg) => {
    let toast = document.getElementById('adminToast');
    if (!toast) return;
    toast.textContent = '✨ ' + msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  };

  // ==========================================================================
  // 1. GESTION DES ONGLETS
  // ==========================================================================
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  const tabPanels = document.querySelectorAll('.admin-tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  // ==========================================================================
  // 2. GESTION DES RENDEZ-VOUS (CRUD COMPLET)
  // ==========================================================================
  let aptStatusFilter = 'all';
  let aptSearchQuery = '';

  const renderAdminAppointments = () => {
    const tbody = document.getElementById('adminAptTableBody');
    if (!tbody) return;

    let list = dashboardMgr.getAppointments();

    if (aptStatusFilter !== 'all') {
      list = list.filter(a => a.status === aptStatusFilter);
    }

    if (aptSearchQuery) {
      list = list.filter(a =>
        a.clientName.toLowerCase().includes(aptSearchQuery) ||
        a.clientPhone.toLowerCase().includes(aptSearchQuery) ||
        a.serviceName.toLowerCase().includes(aptSearchQuery)
      );
    }

    // Statistiques rapides
    const totalEl = document.getElementById('kpiAptTotal');
    const confirmedEl = document.getElementById('kpiAptConfirmed');
    const pendingEl = document.getElementById('kpiAptPending');
    const revEl = document.getElementById('kpiAptRevenue');

    const kpis = dashboardMgr.getKPIs();
    if (totalEl) totalEl.textContent = kpis.total;
    if (confirmedEl) confirmedEl.textContent = kpis.confirmed;
    if (pendingEl) pendingEl.textContent = dashboardMgr.getAppointments().filter(a => a.status === 'pending').length;
    if (revEl) revEl.textContent = kpis.revenueFormatted;

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">📅</div>
            <strong>Aucun rendez-vous trouvé</strong>
            <p style="font-size: 0.85rem;">Modifiez vos filtres ou inscrivez un nouveau rendez-vous.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(apt => {
      const cleanPhone = apt.clientPhone.replace(/\s+/g, '');
      const statusLabels = {
        pending: '⏳ En attente',
        confirmed: '✅ Confirmé',
        completed: '🎉 Terminé',
        cancelled: '❌ Annulé'
      };

      return `
        <tr data-apt-id="${apt.id}" style="border-bottom: 1px solid rgba(255,255,255,0.06);">
          <td style="padding: 1rem;">
            <strong>${apt.date}</strong><br>
            <span style="color: var(--color-gold-400); font-weight: 700;">${apt.timeSlot}</span>
          </td>
          <td style="padding: 1rem;">
            <strong>${apt.clientName}</strong><br>
            <a href="tel:${cleanPhone}" style="color: var(--text-muted); font-size: 0.85rem;">${apt.clientPhone}</a>
          </td>
          <td style="padding: 1rem;">
            <span style="color: #ffffff; font-weight: 600;">${apt.serviceName}</span><br>
            <small style="color: var(--color-gold-400);">${apt.specialist || 'Salon'}</small>
          </td>
          <td style="padding: 1rem; font-weight: 700; color: var(--color-gold-400);">
            ${apt.priceLabel || (apt.price ? apt.price + ' F' : '—')}
          </td>
          <td style="padding: 1rem;">
            <select class="admin-select apt-status-selector" data-apt-id="${apt.id}" style="padding: 0.35rem 0.65rem; font-size: 0.82rem; width: auto;">
              <option value="pending" ${apt.status === 'pending' ? 'selected' : ''}>⏳ En attente</option>
              <option value="confirmed" ${apt.status === 'confirmed' ? 'selected' : ''}>✅ Confirmé</option>
              <option value="completed" ${apt.status === 'completed' ? 'selected' : ''}>🎉 Terminé</option>
              <option value="cancelled" ${apt.status === 'cancelled' ? 'selected' : ''}>❌ Annulé</option>
            </select>
          </td>
          <td style="padding: 1rem; font-size: 0.85rem; color: var(--text-muted); max-width: 180px;">
            ${apt.notes || '—'}
          </td>
          <td style="padding: 1rem;">
            <div style="display: flex; gap: 0.4rem; align-items: center;">
              <a href="https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent('Bonjour ' + apt.clientName + ' ! Le Salon Elle & Lui confirme votre rendez-vous pour ' + apt.serviceName + ' le ' + apt.date + ' à ' + apt.timeSlot + '.')}" 
                 target="_blank" rel="noopener" class="btn-card-action edit" style="padding: 0.4rem 0.6rem; text-decoration: none;" title="WhatsApp">
                 💬
              </a>
              <button type="button" class="btn-card-action edit btn-edit-apt" data-apt-id="${apt.id}" title="Modifier">
                ✏️
              </button>
              <button type="button" class="btn-card-action delete btn-delete-apt" data-apt-id="${apt.id}" title="Supprimer">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Écouteurs de changement de statut
    tbody.querySelectorAll('.apt-status-selector').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const aptId = sel.dataset.aptId;
        dashboardMgr.updateStatus(aptId, e.target.value);
        showAdminToast('Statut mis à jour !');
        renderAdminAppointments();
      });
    });

    // Écouteurs d'édition de rendez-vous
    tbody.querySelectorAll('.btn-edit-apt').forEach(btn => {
      btn.addEventListener('click', () => {
        openEditAppointmentModal(btn.dataset.aptId);
      });
    });

    // Écouteurs de suppression de rendez-vous
    tbody.querySelectorAll('.btn-delete-apt').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Confirmez-vous la suppression définitive de ce rendez-vous ?')) {
          dashboardMgr.deleteAppointment(btn.dataset.aptId);
          showAdminToast('Rendez-vous supprimé.');
          renderAdminAppointments();
        }
      });
    });
  };

  // Filtres RDVs
  const searchInput = document.getElementById('adminAptSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      aptSearchQuery = e.target.value.toLowerCase().trim();
      renderAdminAppointments();
    });
  }

  const statusFilterSel = document.getElementById('adminAptStatusFilter');
  if (statusFilterSel) {
    statusFilterSel.addEventListener('change', (e) => {
      aptStatusFilter = e.target.value;
      renderAdminAppointments();
    });
  }

  // Export CSV
  const exportBtn = document.getElementById('btnAdminExportCSV');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      dashboardMgr.exportCSV();
      showAdminToast('Fichier CSV exporté !');
    });
  }

  // Modale d'Édition de RDV
  const editModal = document.getElementById('adminEditAptModal');
  const editForm = document.getElementById('adminEditAptForm');

  const openEditAppointmentModal = (aptId) => {
    const apt = dashboardMgr.getAppointmentById(aptId);
    if (!apt || !editModal) return;

    document.getElementById('editAptId').value = apt.id;
    document.getElementById('editAptClientName').value = apt.clientName || '';
    document.getElementById('editAptClientPhone').value = apt.clientPhone || '';
    document.getElementById('editAptServiceName').value = apt.serviceName || '';
    document.getElementById('editAptSpecialist').value = apt.specialist || 'Blandine Youbouet';
    document.getElementById('editAptDate').value = apt.date || '';
    document.getElementById('editAptTime').value = apt.timeSlot || '10:00';
    document.getElementById('editAptPrice').value = apt.price || '';
    document.getElementById('editAptStatus').value = apt.status || 'pending';
    document.getElementById('editAptNotes').value = apt.notes || '';

    editModal.showModal();
  };

  if (editForm) {
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const aptId = document.getElementById('editAptId').value;
      const updated = {
        clientName: document.getElementById('editAptClientName').value.trim(),
        clientPhone: document.getElementById('editAptClientPhone').value.trim(),
        serviceName: document.getElementById('editAptServiceName').value.trim(),
        specialist: document.getElementById('editAptSpecialist').value,
        date: document.getElementById('editAptDate').value,
        timeSlot: document.getElementById('editAptTime').value,
        price: Number(document.getElementById('editAptPrice').value) || 0,
        status: document.getElementById('editAptStatus').value,
        notes: document.getElementById('editAptNotes').value.trim()
      };

      dashboardMgr.updateAppointment(aptId, updated);
      editModal.close();
      showAdminToast('Rendez-vous mis à jour avec succès !');
      renderAdminAppointments();
    });
  }

  // Formulaire Nouvel Ajout RDV
  const newAptForm = document.getElementById('adminNewAptForm');
  if (newAptForm) {
    newAptForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newApt = {
        clientName: document.getElementById('newAptClientName').value.trim(),
        clientPhone: document.getElementById('newAptClientPhone').value.trim(),
        serviceName: document.getElementById('newAptServiceName').value.trim(),
        specialist: document.getElementById('newAptSpecialist').value,
        date: document.getElementById('newAptDate').value,
        timeSlot: document.getElementById('newAptTime').value,
        price: Number(document.getElementById('newAptPrice').value) || 0,
        status: document.getElementById('newAptStatus').value || 'pending',
        notes: document.getElementById('newAptNotes').value.trim()
      };

      dashboardMgr.addAppointment(newApt);
      newAptForm.reset();
      showAdminToast('Nouveau rendez-vous inscrit !');
      renderAdminAppointments();
    });
  }

  // ==========================================================================
  // 3. GESTION DES TÉLÉPHONES
  // ==========================================================================
  const renderPhoneSettings = () => {
    const settings = settingsMgr.getSettings();
    const phones = settings.phones;

    // Champs Principaux
    const waNumInput = document.getElementById('phoneWhatsappNumber');
    const waLabelInput = document.getElementById('phoneWhatsappLabel');
    const directNumInput = document.getElementById('phoneDirectNumber');
    const directLabelInput = document.getElementById('phoneDirectLabel');

    if (waNumInput) waNumInput.value = phones.whatsapp.number;
    if (waLabelInput) waLabelInput.value = phones.whatsapp.holder;
    if (directNumInput) directNumInput.value = phones.direct.number;
    if (directLabelInput) directLabelInput.value = phones.direct.label;

    // Lignes Secondaires
    const secContainer = document.getElementById('secondaryPhonesContainer');
    if (secContainer) {
      const secondaries = phones.secondaries || [];
      if (secondaries.length === 0) {
        secContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.88rem;">Aucune ligne secondaire configurée.</p>';
      } else {
        secContainer.innerHTML = secondaries.map(sec => `
          <div class="phone-item-row" data-sec-id="${sec.id}">
            <div class="phone-item-info">
              <span class="phone-type-badge secondary">${sec.label}</span>
              <span class="phone-number-display">${sec.number}</span>
            </div>
            <div class="phone-item-actions">
              <a href="tel:${sec.raw || sec.number}" class="btn-card-action edit" style="text-decoration:none;" title="Tester">📞</a>
              <button type="button" class="btn-phone-delete btn-del-secondary" data-sec-id="${sec.id}">Supprimer</button>
            </div>
          </div>
        `).join('');

        secContainer.querySelectorAll('.btn-del-secondary').forEach(btn => {
          btn.addEventListener('click', () => {
            if (confirm('Supprimer cette ligne secondaire ?')) {
              settingsMgr.deleteSecondaryPhone(btn.dataset.secId);
              showAdminToast('Ligne supprimée.');
              renderPhoneSettings();
            }
          });
        });
      }
    }
  };

  // Enregistrer Téléphones Principaux
  const primaryPhoneForm = document.getElementById('primaryPhonesForm');
  if (primaryPhoneForm) {
    primaryPhoneForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const waNumber = document.getElementById('phoneWhatsappNumber').value.trim();
      const waHolder = document.getElementById('phoneWhatsappLabel').value.trim();
      const directNumber = document.getElementById('phoneDirectNumber').value.trim();
      const directLabel = document.getElementById('phoneDirectLabel').value.trim();

      settingsMgr.updatePrimaryPhones(
        { number: waNumber, holder: waHolder },
        { number: directNumber, label: directLabel }
      );
      showAdminToast('Numéros principaux mis à jour !');
    });
  }

  // Ajouter Ligne Secondaire
  const addSecondaryForm = document.getElementById('addSecondaryPhoneForm');
  if (addSecondaryForm) {
    addSecondaryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const label = document.getElementById('newSecLabel').value.trim();
      const number = document.getElementById('newSecNumber').value.trim();
      if (!number) return;

      settingsMgr.addSecondaryPhone(label, number);
      addSecondaryForm.reset();
      showAdminToast('Nouvelle ligne secondaire ajoutée !');
      renderPhoneSettings();
    });
  }

  // ==========================================================================
  // 4. CONFIGURATION WAVE
  // ==========================================================================
  const renderWaveSettings = () => {
    const settings = settingsMgr.getSettings();
    const wave = settings.wave;

    const urlInput = document.getElementById('waveMerchantUrl');
    const nameInput = document.getElementById('waveAccountName');
    const phoneInput = document.getElementById('wavePhone');
    const amountInput = document.getElementById('waveDefaultAmount');
    const testLink = document.getElementById('waveTestLink');

    if (urlInput) urlInput.value = wave.merchantUrl;
    if (nameInput) nameInput.value = wave.accountName;
    if (phoneInput) phoneInput.value = wave.phone;
    if (amountInput) amountInput.value = wave.defaultAmount;
    if (testLink) testLink.href = wave.merchantUrl + wave.defaultAmount;
  };

  const waveForm = document.getElementById('waveSettingsForm');
  if (waveForm) {
    waveForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = document.getElementById('waveMerchantUrl').value.trim();
      const name = document.getElementById('waveAccountName').value.trim();
      const phone = document.getElementById('wavePhone').value.trim();
      const amount = document.getElementById('waveDefaultAmount').value;

      settingsMgr.updateWaveSettings(url, name, phone, amount);
      showAdminToast('Paramètres Wave enregistrés !');
      renderWaveSettings();
    });
  }

  // ==========================================================================
  // 5. CONFIGURATION WHATSAPP
  // ==========================================================================
  const renderWhatsAppSettings = () => {
    const settings = settingsMgr.getSettings();
    const msgs = settings.whatsappMessages;

    const genInput = document.getElementById('waMsgGeneral');
    const w1Input = document.getElementById('waMsgWedding1m');
    const w3Input = document.getElementById('waMsgWedding3m');
    const bookInput = document.getElementById('waMsgBooking');

    if (genInput) genInput.value = msgs.general || '';
    if (w1Input) w1Input.value = msgs.wedding1m || '';
    if (w3Input) w3Input.value = msgs.wedding3m || '';
    if (bookInput) bookInput.value = msgs.booking || '';
  };

  const whatsappForm = document.getElementById('whatsappSettingsForm');
  if (whatsappForm) {
    whatsappForm.addEventListener('submit', (e) => {
      e.preventDefault();
      settingsMgr.updateWhatsAppMessages({
        general: document.getElementById('waMsgGeneral').value.trim(),
        wedding1m: document.getElementById('waMsgWedding1m').value.trim(),
        wedding3m: document.getElementById('waMsgWedding3m').value.trim(),
        booking: document.getElementById('waMsgBooking').value.trim()
      });
      showAdminToast('Modèles WhatsApp sauvegardés !');
    });
  }

  // ==========================================================================
  // 6. GESTION DE LA GALERIE PHOTOS (CRUD COMPLET)
  // ==========================================================================
  const renderGalleryCards = () => {
    const grid = document.getElementById('adminGalleryGrid');
    if (!grid) return;

    const items = galleryMgr.getItems();
    if (items.length === 0) {
      grid.innerHTML = '<p style="color: var(--text-muted); padding: 2rem;">Aucune photo dans la galerie.</p>';
      return;
    }

    grid.innerHTML = items.map(item => `
      <div class="admin-gallery-card" data-gal-id="${item.id}">
        <div class="admin-gallery-thumb">
          <img src="${item.image}" alt="${item.title}" onerror="this.src='assets/img/devanture-facade.jpg'" />
          <span class="admin-gallery-badge">${item.category}</span>
          ${item.colSpan2 ? '<span style="position:absolute; bottom:0.6rem; right:0.6rem; background:rgba(0,0,0,0.7); font-size:0.7rem; padding:0.2rem 0.5rem; border-radius:4px; color:#fff;">Large (2 col)</span>' : ''}
        </div>
        <div class="admin-gallery-content">
          <div class="admin-gallery-title">${item.title}</div>
          <div class="admin-gallery-caption">${item.caption || 'Pas de description'}</div>
          <div class="admin-gallery-actions">
            <button type="button" class="btn-card-action edit btn-edit-photo" data-gal-id="${item.id}">Modifier</button>
            <button type="button" class="btn-card-action delete btn-delete-photo" data-gal-id="${item.id}">Supprimer</button>
          </div>
        </div>
      </div>
    `).join('');

    // Éditer photo
    grid.querySelectorAll('.btn-edit-photo').forEach(btn => {
      btn.addEventListener('click', () => {
        openEditPhotoModal(btn.dataset.galId);
      });
    });

    // Supprimer photo
    grid.querySelectorAll('.btn-delete-photo').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Supprimer cette photo de la galerie ?')) {
          galleryMgr.deleteItem(btn.dataset.galId);
          showAdminToast('Photo retirée de la galerie.');
          renderGalleryCards();
        }
      });
    });
  };

  // Modale d'Édition Photo
  const photoModal = document.getElementById('adminEditPhotoModal');
  const photoForm = document.getElementById('adminEditPhotoForm');

  const openEditPhotoModal = (galId) => {
    const item = galleryMgr.getItems().find(i => i.id === galId);
    if (!item || !photoModal) return;

    document.getElementById('editPhotoId').value = item.id;
    document.getElementById('editPhotoTitle').value = item.title;
    document.getElementById('editPhotoCategory').value = item.category;
    document.getElementById('editPhotoImage').value = item.image;
    document.getElementById('editPhotoCaption').value = item.caption || '';
    document.getElementById('editPhotoColSpan').checked = Boolean(item.colSpan2);

    photoModal.showModal();
  };

  if (photoForm) {
    photoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const galId = document.getElementById('editPhotoId').value;
      galleryMgr.updateItem(galId, {
        title: document.getElementById('editPhotoTitle').value.trim(),
        category: document.getElementById('editPhotoCategory').value.trim(),
        image: document.getElementById('editPhotoImage').value.trim(),
        caption: document.getElementById('editPhotoCaption').value.trim(),
        colSpan2: document.getElementById('editPhotoColSpan').checked
      });

      photoModal.close();
      showAdminToast('Photo mise à jour !');
      renderGalleryCards();
    });
  }

  // Formulaire Ajouter Photo
  const addPhotoForm = document.getElementById('adminAddPhotoForm');
  if (addPhotoForm) {
    addPhotoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newPhoto = {
        title: document.getElementById('newPhotoTitle').value.trim(),
        category: document.getElementById('newPhotoCategory').value.trim(),
        image: document.getElementById('newPhotoImage').value.trim(),
        caption: document.getElementById('newPhotoCaption').value.trim(),
        colSpan2: document.getElementById('newPhotoColSpan').checked
      };

      galleryMgr.addItem(newPhoto);
      addPhotoForm.reset();
      showAdminToast('Nouvelle photo ajoutée à la galerie !');
      renderGalleryCards();
    });
  }

  // ==========================================================================
  // 7. CONFIGURATION RÉSEAUX SOCIAUX
  // ==========================================================================
  const renderSocialsSettings = () => {
    const settings = settingsMgr.getSettings();
    const soc = settings.socials;

    const instaUrl = document.getElementById('socInstaUrl');
    const instaHandle = document.getElementById('socInstaHandle');
    const fbUrl = document.getElementById('socFbUrl');
    const fbHandle = document.getElementById('socFbHandle');
    const tiktokUrl = document.getElementById('socTiktokUrl');
    const tiktokHandle = document.getElementById('socTiktokHandle');
    const ytUrl = document.getElementById('socYtUrl');
    const ytHandle = document.getElementById('socYtHandle');

    if (instaUrl && soc.instagram) instaUrl.value = soc.instagram.url || '';
    if (instaHandle && soc.instagram) instaHandle.value = soc.instagram.handle || '';
    if (fbUrl && soc.facebook) fbUrl.value = soc.facebook.url || '';
    if (fbHandle && soc.facebook) fbHandle.value = soc.facebook.handle || '';
    if (tiktokUrl && soc.tiktok) tiktokUrl.value = soc.tiktok.url || '';
    if (tiktokHandle && soc.tiktok) tiktokHandle.value = soc.tiktok.handle || '';
    if (ytUrl && soc.youtube) ytUrl.value = soc.youtube.url || '';
    if (ytHandle && soc.youtube) ytHandle.value = soc.youtube.handle || '';
  };

  const socialsForm = document.getElementById('socialsSettingsForm');
  if (socialsForm) {
    socialsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      settingsMgr.updateSocials({
        instagram: {
          enabled: true,
          name: 'Instagram',
          url: document.getElementById('socInstaUrl').value.trim(),
          handle: document.getElementById('socInstaHandle').value.trim()
        },
        facebook: {
          enabled: true,
          name: 'Facebook',
          url: document.getElementById('socFbUrl').value.trim(),
          handle: document.getElementById('socFbHandle').value.trim()
        },
        tiktok: {
          enabled: true,
          name: 'TikTok',
          url: document.getElementById('socTiktokUrl').value.trim(),
          handle: document.getElementById('socTiktokHandle').value.trim()
        },
        youtube: {
          enabled: Boolean(document.getElementById('socYtUrl').value.trim()),
          name: 'YouTube',
          url: document.getElementById('socYtUrl').value.trim(),
          handle: document.getElementById('socYtHandle').value.trim()
        }
      });
      showAdminToast('Réseaux sociaux enregistrés !');
    });
  }

  // ==========================================================================
  // 8. RÉINITIALISATION DÉMO GLOBALE
  // ==========================================================================
  const resetBtn = document.getElementById('btnResetAllDemo');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Voulez-vous réinitialiser tous les paramètres, la galerie et les rendez-vous aux données initiales ?')) {
        settingsMgr.resetToDefaults();
        galleryMgr.resetToDefaults();
        dashboardMgr.saveAppointments(INITIAL_DEMO_APPOINTMENTS);
        showAdminToast('Données réinitialisées avec succès !');
        renderAdminAppointments();
        renderPhoneSettings();
        renderWaveSettings();
        renderWhatsAppSettings();
        renderGalleryCards();
        renderSocialsSettings();
      }
    });
  }

  // Modale Close Buttons
  document.querySelectorAll('[data-close-admin-modal]').forEach(b => {
    b.addEventListener('click', () => {
      const dlg = b.closest('dialog');
      if (dlg) dlg.close();
    });
  });

  // Initialisation au chargement
  renderAdminAppointments();
  renderPhoneSettings();
  renderWaveSettings();
  renderWhatsAppSettings();
  renderGalleryCards();
  renderSocialsSettings();
});
