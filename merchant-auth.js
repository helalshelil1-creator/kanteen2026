/* Kanteen merchant secure auth (Firebase Auth email/password with a synthetic email).
   NOT ACTIVE: nothing in the app calls this until KT_CONFIG.SECURE_MERCHANT_AUTH is switched on
   together with firestore.rules.next. Works with the compat SDK objects (auth, db). */
(function (root) {
  function normPhone(p) {
    p = String(p || '').replace(/[^\d+]/g, '');
    if (p.indexOf('+') === 0) return p.slice(1);
    if (p.indexOf('0') === 0) return '20' + p.slice(1);
    return p;
  }
  function emailFor(phone) { return normPhone(phone) + '@merchants.kanteen.invalid'; }
  function checkPassword(pw) { if (!pw || pw.length < 8) throw new Error('weak-password'); }
  function randomCode() {
    var a = new Uint8Array(16);
    (root.crypto || require('crypto').webcrypto).getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }

  // New merchant: Auth user first, then a pending merchant doc already owned by that user. No password is stored.
  async function register(auth, db, data, password) {
    checkPassword(password);
    var cred = await auth.createUserWithEmailAndPassword(emailFor(data.phone), password);
    var doc = Object.assign({}, data, { status: 'pending', ownerUid: cred.user.uid });
    delete doc.password;
    var ref = await db.collection('merchants').add(doc);
    return { uid: cred.user.uid, merchantId: ref.id };
  }

  async function login(auth, db, phone, password) {
    var cred = await auth.signInWithEmailAndPassword(emailFor(phone), password);
    var snap = await db.collection('merchants').where('ownerUid', '==', cred.user.uid).limit(1).get();
    if (snap.empty) throw new Error('no-merchant');
    return { uid: cred.user.uid, merchantId: snap.docs[0].id, data: snap.docs[0].data() };
  }

  // Existing merchant activates once with an admin-issued code and picks a new password.
  async function claim(auth, db, code, phone, password) {
    checkPassword(password);
    var actRef = db.collection('merchantActivations').doc(code);
    var cred;
    try { cred = await auth.createUserWithEmailAndPassword(emailFor(phone), password); }
    catch (e) { if (e.code === 'auth/email-already-in-use') cred = await auth.signInWithEmailAndPassword(emailFor(phone), password); else throw e; }
    var act = await actRef.get();
    if (!act.exists) throw new Error('invalid-code');
    var merchantId = act.data().merchantId;
    var batch = db.batch();
    batch.update(db.collection('merchants').doc(merchantId), { ownerUid: cred.user.uid, activationId: code });
    batch.update(actRef, { used: true, usedBy: cred.user.uid, usedAt: Date.now() });
    await batch.commit();
    return { uid: cred.user.uid, merchantId: merchantId };
  }

  // Admin only (enforced by rules): one-time code valid for `hours`.
  async function adminIssueCode(db, merchantId, hours, serverTs, tsFrom) {
    var code = randomCode();
    await db.collection('merchantActivations').doc(code).set({
      merchantId: merchantId, used: false,
      expiresAt: tsFrom(Date.now() + (hours || 48) * 3600 * 1000), createdAt: serverTs
    });
    return code;
  }


  // ---- public projection + migration (admin / approved owner) ----
  var PUBLIC_KEYS = ['name','address','phone','whatsapp','lat','lng','products','hours','description','photoURL','category','deliveryFee','type','area','city','id'];
  function toPublic(m, nowIso) {
    var out = {};
    PUBLIC_KEYS.forEach(function (k) { if (m[k] !== undefined && m[k] !== null) out[k] = m[k]; });
    out.status = 'approved'; out.updatedAt = nowIso || new Date().toISOString();
    return out;
  }
  function stripSecrets(obj) { var c = JSON.parse(JSON.stringify(obj || {})); delete c.password; return c; }
  async function syncPublic(db, merchantId, data) {
    if (data.status !== 'approved') return unpublish(db, merchantId);
    await db.collection('merchantsPublic').doc(merchantId).set(toPublic(stripSecrets(data)));
  }
  async function unpublish(db, merchantId) { try { await db.collection('merchantsPublic').doc(merchantId).delete(); } catch (e) { if (e.code !== 'not-found') throw e; } }
  // Admin one-off: publish projections for approved merchants, delete legacy password fields, seed stock docs.
  // `deleteField` is firebase.firestore.FieldValue.delete(); `syncStock` comes from order-flow.js. Idempotent.
  async function adminMigrate(db, deleteField, syncStock) {
    var snap = await db.collection('merchants').get();
    var r = { merchants: snap.size, published: 0, unpublished: 0, passwordsRemoved: 0, stockCreated: 0, errors: [] };
    for (var i = 0; i < snap.docs.length; i++) {
      var d = snap.docs[i], data = d.data();
      try {
        if (data.password !== undefined) { await d.ref.update({ password: deleteField }); r.passwordsRemoved++; }
        if (data.status === 'approved') {
          await syncPublic(db, d.id, data); r.published++;
          if (syncStock) { var s = await syncStock(db, d.id, data.products || []); r.stockCreated += s.created; }
        } else { await unpublish(db, d.id); r.unpublished++; }
      } catch (e) { r.errors.push(d.id + ':' + (e.code || e.message)); }
    }
    return r;
  }

  var api = { toPublic: toPublic, syncPublic: syncPublic, unpublish: unpublish, adminMigrate: adminMigrate, emailFor: emailFor, register: register, login: login, claim: claim, adminIssueCode: adminIssueCode, normPhone: normPhone };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.KT_MERCH_AUTH = api;
})(typeof window !== 'undefined' ? window : globalThis);
