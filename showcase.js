/* Kanteen personal showcase (KT_CONFIG.SHOWCASE_MODE). No real orders, payments, enrollment or business contact.
   Existing data is never touched; admin pages are not loaded with this file. */
(function () {
  'use strict';
  if (!window.KT_CONFIG || !KT_CONFIG.SHOWCASE_MODE) return;
  var NOTE = 'غير متاح في النسخة التجريبية';
  var isStore = !/(merchant|driver|admin)\.html/.test(location.pathname);
  var PH = /(\+?20)?0?1124169656|01124169656|201124169656/g;

  // 1) No Firestore / Auth writes from the public showcase (reads stay).
  function blockWrites() {
    if (!isStore) return; // private panels (merchant/driver) keep their existing behavior
    if (!window.KT_FB || KT_FB.__showcase) return;
    ['placeOrder', 'cancelOrder', 'merchantConfirmOrder', 'assignDriverToOrder', 'driverUpdateStatus', 'submitRating',
      'updateOrder', 'updateMerchant', 'deleteMerchant', 'saveNotification', 'markNotificationRead', 'deleteNotification',
      'saveProduct', 'deleteProduct', 'requestOrder', 'acceptOrder', 'cancelOrder2', 'syncStock', 'signUpEmail', 'saveOrder']
      .forEach(function (k) { KT_FB[k] = function () { return Promise.reject(new Error(NOTE)); }; });
    KT_FB.__showcase = true;
  }
  blockWrites();

  // 2) No real-world links out: WhatsApp, calls, mail.
  var realOpen = window.open;
  if (isStore) window.open = function (u) { if (/wa\.me|whatsapp|^tel:|^mailto:/i.test(String(u || ''))) return null; return realOpen.apply(window, arguments); };

  function disable(a) {
    a.removeAttribute('href'); a.removeAttribute('target');
    a.setAttribute('aria-disabled', 'true'); a.setAttribute('title', NOTE); a.setAttribute('data-demo-disabled', '1');
    a.style.opacity = '.5'; a.style.pointerEvents = 'none';
  }
  function scrub(root) {
    var i, list;
    list = root.querySelectorAll('a[href^="https://wa.me"],a[href^="http://wa.me"],a[href^="tel:"],a[href^="mailto:"],a[href*="facebook.com"]');
    for (i = 0; i < list.length; i++) { disable(list[i]); list[i].childNodes.forEach(function (n) { if (n.nodeType === 3) n.nodeValue = n.nodeValue.replace(/\+?\d[\d\s-]{8,}\d/g, '—'); }); }
    // enrollment entry points (merchant / driver sign-up)
    list = root.querySelectorAll('a[href$="merchant.html"],a[href$="merchant.html#register"],a[href$="driver.html"],[onclick*="ktShowDriverRegistration"],[onclick*="ktShowMerchantRegistration"]');
    for (i = 0; i < list.length; i++) {
      var el = list[i], txt = el.textContent || '';
      if (el.hasAttribute('onclick') || /سجّل|سجل|انضم|register|join/i.test(txt)) { el.style.display = 'none'; el.setAttribute('data-demo-hidden', '1'); }
    }
    // business phone numbers printed as text
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, hits = [];
    while ((n = w.nextNode())) { if (PH.test(n.nodeValue)) hits.push(n); PH.lastIndex = 0; }
    hits.forEach(function (t) { t.nodeValue = t.nodeValue.replace(PH, '—'); });
  }
  function run() { if (!isStore) return; try { scrub(document.body); } catch (e) {} }
  var pending = false;
  new MutationObserver(function () { if (pending) return; pending = true; setTimeout(function () { pending = false; run(); }, 60); })
    .observe(document.documentElement, { childList: true, subtree: true });

  // 3) Close merchant / driver enrollment (existing logins keep working).
  function closeEnrollment() {
    function notice() { var t = window.ktToast; if (typeof t === 'function') t('ℹ️ ' + 'التسجيل غير متاح في هذه النسخة التجريبية', 'info'); }
    ['ktShowRegister', 'ktMerchantRegister', 'ktShowDriverRegistration', 'ktSubmitDriverRegistration', 'ktShowMerchantRegistration']
      .forEach(function (k) { if (typeof window[k] === 'function') window[k] = notice; });
    var sw = window.ktSwitchAuthMode;
    if (typeof sw === 'function') window.ktSwitchAuthMode = function (m) { return sw.call(this, 'login'); };
    var st = document.createElement('style');
    st.textContent = '#registerForm,#tabSignup,.k-login-toggle,[data-demo-hidden]{display:none!important}';
    document.head.appendChild(st);
    var sg = document.querySelector('#tabSignup'); if (sg) sg.style.display = 'none';
    if (/register/.test(location.hash)) { try { history.replaceState(null, '', location.pathname); } catch (e) {} }
  }
  window.addEventListener('load', function () {
    blockWrites(); closeEnrollment(); run();
    setTimeout(function () { blockWrites(); closeEnrollment(); run(); }, 800);
  });
  document.addEventListener('DOMContentLoaded', run);
})();
