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