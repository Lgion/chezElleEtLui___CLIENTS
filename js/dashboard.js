/**
 * Module Dashboard - Gestion des Rendez-vous du Salon Elle & Lui
 * Permet à Blandine Youbouet et à l'équipe de consulter, ajouter et gérer les réservations.
 */

const STORAGE_KEY = 'elle_et_lui_appointments_v2';

// Fonction utilitaire pour générer des dates relatives (ISO YYYY-MM-DD)
function getRelativeDateStr(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

// Données initiales réalistes pour démonstration immédiate du calendrier (Jour, Semaine, Mois)
const INITIAL_DEMO_APPOINTMENTS = [
  {
    id: 'apt-101',
    clientName: 'Aminata Touré',
    clientPhone: '+225 07 45 12 89 00',
    serviceId: 'tresses-marcoussis',
    serviceName: 'Tresses Marcoussis',
    specialist: 'Blandine Youbouet',
    price: 5000,
    priceLabel: '5 000 FCFA',
    date: getRelativeDateStr(0), // Aujourd'hui
    timeSlot: '09:00',
    durationMinutes: 90,
    status: 'confirmed',
    notes: 'Cheveux naturels mi-longs',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'apt-102',
    clientName: 'Carine Kouadio',
    clientPhone: '+225 05 88 23 11 44',
    serviceId: 'soin-visage-eclat',
    serviceName: 'Soin du Visage Éclat & Détox',
    specialist: 'Judith (K.V.S)',
    price: 15000,
    priceLabel: '15 000 FCFA',
    date: getRelativeDateStr(0), // Aujourd'hui
    timeSlot: '11:15',
    durationMinutes: 60,
    status: 'pending',
    notes: 'Première visite institut spa',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'apt-105',
    clientName: 'Fatou Diop',
    clientPhone: '+225 07 88 44 22 11',
    serviceId: 'massage-californien',
    serviceName: 'Massage Californien Relaxant',
    specialist: 'Judith (K.V.S)',
    price: 20000,
    priceLabel: '20 000 FCFA',
    date: getRelativeDateStr(0), // Aujourd'hui
    timeSlot: '15:30',
    durationMinutes: 60,
    status: 'confirmed',
    notes: 'Séance détente après travail',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'apt-103',
    clientName: 'Priscille Bamba',
    clientPhone: '+225 01 22 90 77 33',
    serviceId: 'tresses-non-coupees',
    serviceName: 'Tresses Non Coupées (Longues)',
    specialist: 'Blandine Youbouet',
    price: 15000,
    priceLabel: '15 000 FCFA',
    date: getRelativeDateStr(1), // Demain
    timeSlot: '14:30',
    durationMinutes: 180,
    status: 'confirmed',
    notes: 'Modèle avec perles dorées au bout',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: 'apt-104',
    clientName: 'Sandrine Koné',
    clientPhone: '+225 07 19 34 56 12',
    serviceId: 'duo-manucure-pedicure',
    serviceName: 'Duo Complet Manucure & Pédicure',
    specialist: 'Judith (K.V.S)',
    price: 10000,
    priceLabel: '10 000 FCFA',
    date: getRelativeDateStr(1), // Demain
    timeSlot: '16:00',
    durationMinutes: 75,
    status: 'confirmed',
    notes: 'Vernis nude naturel',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'apt-106',
    clientName: 'Aïcha Traoré',
    clientPhone: '+225 05 33 22 11 00',
    serviceId: 'tissage-simple',
    serviceName: 'Pose de Tissage Simple',
    specialist: 'Blandine Youbouet',
    price: 8000,
    priceLabel: '8 000 FCFA',
    date: getRelativeDateStr(2),
    timeSlot: '10:00',
    durationMinutes: 90,
    status: 'confirmed',
    notes: 'Mèches fournies par la cliente',
    createdAt: new Date(Date.now() - 3600000 * 16).toISOString()
  },
  {
    id: 'apt-107',
    clientName: 'Monique Gbagbo',
    clientPhone: '+225 01 44 55 66 77',
    serviceId: 'forfait-mariee-1mois',
    serviceName: 'Forfait Mariée Sublime (Cure 1 Mois)',
    specialist: 'Blandine & Judith',
    price: 120000,
    priceLabel: '120 000 FCFA',
    date: getRelativeDateStr(3),
    timeSlot: '14:00',
    durationMinutes: 120,
    status: 'confirmed',
    notes: 'Première séance rituel visage & gommage',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString()
  },
  {
    id: 'apt-108',
    clientName: 'Clarisse Brou',
    clientPhone: '+225 07 66 77 88 99',
    serviceId: 'soin-visage-anti-age',
    serviceName: 'Soin Visage Lift & Anti-Âge',
    specialist: 'Judith (K.V.S)',
    price: 18000,
    priceLabel: '18 000 FCFA',
    date: getRelativeDateStr(4),
    timeSlot: '11:00',
    durationMinutes: 75,
    status: 'pending',
    notes: 'Peau sensible',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'apt-109',
    clientName: 'Estelle N’Guessan',
    clientPhone: '+225 05 99 88 77 66',
    serviceId: 'tresses-classiques',
    serviceName: 'Tresses Classiques (Box Braids)',
    specialist: 'Blandine Youbouet',
    price: 10000,
    priceLabel: '10 000 FCFA',
    date: getRelativeDateStr(5),
    timeSlot: '09:30',
    durationMinutes: 120,
    status: 'confirmed',
    notes: 'Mèches couleur #30',
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString()
  }
];

class DashboardManager {
  constructor() {
    this.appointments = this.loadAppointments();
  }

  loadAppointments() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erreur chargement localStorage:', e);
    }
    // Si rien en mémoire, initialiser avec les démos
    this.saveAppointments(INITIAL_DEMO_APPOINTMENTS);
    return [...INITIAL_DEMO_APPOINTMENTS];
  }

  saveAppointments(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      this.appointments = list;
    } catch (e) {
      console.error('Erreur sauvegarde localStorage:', e);
    }
  }

  getAppointments() {
    return [...this.appointments];
  }

  addAppointment(aptData) {
    const newApt = {
      id: 'apt-' + Date.now(),
      createdAt: new Date().toISOString(),
      status: aptData.status || 'pending',
      ...aptData
    };
    this.appointments.unshift(newApt);
    this.saveAppointments(this.appointments);
    return newApt;
  }

  getAppointmentById(id) {
    return this.appointments.find(a => a.id === id) || null;
  }

  updateAppointment(id, updatedData) {
    const apt = this.appointments.find(a => a.id === id);
    if (apt) {
      Object.assign(apt, updatedData);
      if (updatedData.price !== undefined) {
        const numPrice = Number(updatedData.price) || 0;
        apt.price = numPrice;
        apt.priceLabel = numPrice.toLocaleString('fr-FR') + ' FCFA';
      }
      this.saveAppointments(this.appointments);
    }
    return apt;
  }

  updateStatus(id, newStatus) {
    const apt = this.appointments.find(a => a.id === id);
    if (apt) {
      apt.status = newStatus;
      this.saveAppointments(this.appointments);
    }
    return apt;
  }

  deleteAppointment(id) {
    this.appointments = this.appointments.filter(a => a.id !== id);
    this.saveAppointments(this.appointments);
  }

  getKPIs() {
    const todayStr = new Date().toISOString().split('T')[0];
    const total = this.appointments.length;
    const today = this.appointments.filter(a => a.date === todayStr).length;
    const confirmed = this.appointments.filter(a => a.status === 'confirmed').length;
    const estimatedRevenue = this.appointments
      .filter(a => a.status !== 'cancelled')
      .reduce((sum, a) => sum + (Number(a.price) || 0), 0);

    return {
      total,
      today,
      confirmed,
      revenueFormatted: new Intl.NumberFormat('fr-FR').format(estimatedRevenue) + ' F'
    };
  }

  getAppointmentsForDate(dateStr) {
    return this.appointments
      .filter(a => a.date === dateStr)
      .sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));
  }

  getAppointmentsForDateRange(startDateStr, endDateStr) {
    return this.appointments
      .filter(a => a.date >= startDateStr && a.date <= endDateStr)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.timeSlot || '').localeCompare(b.timeSlot || '');
      });
  }

  exportCSV() {
    const headers = ['ID', 'Date', 'Heure', 'Client', 'Telephone', 'Prestation', 'Specialiste', 'Prix (FCFA)', 'Statut', 'Notes'];
    const rows = this.appointments.map(a => [
      a.id,
      a.date,
      a.timeSlot,
      `"${a.clientName.replace(/"/g, '""')}"`,
      `"${a.clientPhone}"`,
      `"${a.serviceName.replace(/"/g, '""')}"`,
      `"${a.specialist || ''}"`,
      a.price,
      a.status,
      `"${(a.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `elle_et_lui_rdv_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
