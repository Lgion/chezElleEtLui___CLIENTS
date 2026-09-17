/**
 * Module Booking - Moteur de Prise de Rendez-vous du Salon Elle & Lui
 * Gère les créneaux horaires par 15 min, la validation et la redirection WhatsApp.
 */

const SALON_WHATSAPP_NUMBER = '2250711084866'; // Numéro officiel de Blandine / Salon
const SALON_OPEN_HOUR = 8;
const SALON_OPEN_MINUTE = 30;
const SALON_CLOSE_HOUR = 19;
const SALON_CLOSE_MINUTE = 0;

/**
 * Génère les créneaux horaires disponibles par tranches de 15 minutes.
 * De 08h30 à 18h30 (dernier créneau possible pour clôture à 19h00).
 */
function generateTimeSlots() {
  const slots = [];
  let currentHour = SALON_OPEN_HOUR;
  let currentMinute = SALON_OPEN_MINUTE;

  while (currentHour < 18 || (currentHour === 18 && currentMinute <= 30)) {
    const formattedHour = String(currentHour).padStart(2, '0');
    const formattedMinute = String(currentMinute).padStart(2, '0');
    slots.push(`${formattedHour}:${formattedMinute}`);

    currentMinute += 15;
    if (currentMinute >= 60) {
      currentMinute = 0;
      currentHour += 1;
    }
  }
  return slots;
}

/**
 * Formate une date AAAA-MM-JJ en chaîne littéraire française (ex: "Jeudi 17 Septembre 2026")
 */
function formatDateFR(dateString) {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

/**
 * Construit le message WhatsApp pré-rempli pour confirmation immédiate
 */
function buildWhatsAppBookingMessage({
  serviceName,
  specialist,
  priceLabel,
  date,
  timeSlot,
  durationMinutes,
  clientName,
  clientPhone,
  notes
}) {
  const dateFR = formatDateFR(date);
  const durationText = durationMinutes >= 60
    ? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 ? (durationMinutes % 60) + 'm' : ''}`
    : `${durationMinutes} min`;

  return `✨ *RÉSERVATION - SALON DE BEAUTÉ ELLE & LUI* ✨
📍 *Abidjan Cocody N°39*

Bonjour l'équipe, je souhaite confirmer mon rendez-vous :
💆‍♀️ *Prestation :* ${serviceName}
👩‍🦱 *Spécialiste :* ${specialist || 'Salon Elle & Lui'}
📅 *Date :* ${dateFR}
⏰ *Créneau :* ${timeSlot} (durée estimée : ~${durationText})
💰 *Tarif :* ${priceLabel}

*Mes Coordonnées :*
👤 *Nom :* ${clientName}
📱 *Téléphone :* ${clientPhone}
${notes ? `📝 *Remarques :* ${notes}\n` : ''}
Pouvez-vous me confirmer ce créneau ? Merci beaucoup !`;
}

/**
 * Crée l'URL WhatsApp d'envoi direct
 */
function getWhatsAppBookingUrl(bookingData) {
  const message = buildWhatsAppBookingMessage(bookingData);
  return `https://wa.me/${SALON_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Crée l'URL WhatsApp pour commander un produit
 */
function getWhatsAppProductUrl(product) {
  const message = `Bonjour Salon Elle & Lui ! ✨
Je souhaite commander le produit suivant repéré sur votre site :
🛍️ *Produit :* ${product.name}
🏷️ *Prix :* ${product.priceLabel} (${product.volume || ''})
📍 Livraison à Abidjan ou retrait en salon à Cocody.

Est-il actuellement disponible en stock ? Merci !`;
  return `https://wa.me/${SALON_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
