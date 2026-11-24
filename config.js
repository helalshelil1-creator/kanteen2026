/* ═══════════════════════════════════════════════════════════
   كانتِين | Kanteen — Public Config (no secrets)
   ═══════════════════════════════════════════════════════════ */
window.KT_CONFIG = {
  WA_NUMBER: '201124169656',
  FB_URL: 'https://www.facebook.com/share/1d75yqdVA9/',
  INSTAPAY_NUMBER: '01124169656',
  VODAFONE_NUMBER: '01124169656',
  SUPPORT_PHONE: '01124169656',
  EMAIL: 'hello@kanteen.app',

  // OFF until firestore.rules.next is deployed and tested live (see MERCHANT_AUTH_MIGRATION.md)
  // Personal showcase/demo (PAUSED, default off): when true, no real orders, payments or order messages are sent. Set false only for a real commercial launch.
  SHOWCASE_MODE: true,
  SECURE_ORDERS: false,
  SECURE_MERCHANT_AUTH: false,

  DELIVERY_FEE_DEFAULT: 25,
  FREE_DELIVERY_THRESHOLD: 500,
  DELIVERY_RADIUS_KM: 10,

  FEATURES: {
    RATINGS: true,
    CANCEL_ORDER: true,
    PUSH_NOTIFICATIONS: true,
    VOICE_SEARCH: true,
    SCHEDULED_ORDERS: true,
    BARCODE_SEARCH: true
  }
};
console.log('⚙️ Kanteen config loaded');