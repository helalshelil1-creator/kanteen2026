/* ═══════════════════════════════════════════════════════════
   🔥 KANTEEN — Firebase Helpers v3.0 (No Cloud Functions)
   Spark Plan Compatible — Uses Firestore Transactions
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var _fb = null, _db = null, _auth = null, _msg = null;
  var _initialized = false;

  function fbInit() {
    if (_initialized && _fb && _db) {
      return { fb: _fb, db: _db, auth: _auth, messaging: _msg };
    }
    if (!window.firebase || !window.KT_FIREBASE_CONFIG) {
      console.warn('⚠️ Firebase SDK or config missing');
      return null;
    }
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(window.KT_FIREBASE_CONFIG);
      }
      _fb = firebase;
      _db = firebase.firestore();
      _auth = firebase.auth ? firebase.auth() : null;
      _msg = (firebase.messaging && typeof firebase.messaging === 'function') ? firebase.messaging() : null;
      _initialized = true;
      console.log('✅ Firebase initialized (Spark mode)');
      return { fb: _fb, db: _db, auth: _auth, messaging: _msg };
    } catch (e) {
      console.error('❌ Firebase init failed:', e);
      return null;
    }
  }

  /* ═══════════════════════════════════════════════════════
     AUTH
     ═══════════════════════════════════════════════════════ */
  async function fbSignInEmail(email, password) {
    var i = fbInit(); if (!i || !i.auth) throw new Error('Auth not ready');
    return (await i.auth.signInWithEmailAndPassword(email, password)).user;
  }

  async function fbSignUpEmail(email, password, displayName) {
    var i = fbInit(); if (!i || !i.auth) throw new Error('Auth not ready');
    var cred = await i.auth.createUserWithEmailAndPassword(email, password);
    if (displayName) await cred.user.updateProfile({ displayName: displayName });
    await i.db.collection('users').doc(cred.user.uid).set({
      email: email, name: displayName || '', createdAt: new Date().toISOString()
    }, { merge: true });
    return cred.user;
  }

  async function fbSignOut() {
    var i = fbInit(); if (!i || !i.auth) return;
    await i.auth.signOut();
  }

  function fbOnAuth(cb) {
    var i = fbInit(); if (!i || !i.auth) return function(){};
    return i.auth.onAuthStateChanged(cb);
  }

  function fbCurrentUser() {
    var i = fbInit(); if (!i || !i.auth) return null;
    return i.auth.currentUser;
  }

  async function fbIsAdmin(uid) {
    var i = fbInit(); if (!i || !uid) return false;
    try {
      var doc = await i.db.collection('admins').doc(uid).get();
      return doc.exists;
    } catch (e) { return false; }
  }

  /* ═══════════════════════════════════════════════════════
     ORDERS — Firestore Transaction (بدل Cloud Function)
     ═══════════════════════════════════════════════════════ */
  async function fbPlaceOrder(payload) {
    var i = fbInit(); if (!i) throw new Error('Firebase not ready');
    var user = i.auth.currentUser;
    if (!user) throw new Error('يجب تسجيل الدخول أولاً');

    var merchantId = payload.merchantId;
    var items = payload.items || [];
    var customer = payload.customer || {};
    var payment = payload.payment || 'cod';
    var paymentMethod = payload.paymentMethod || null;
    var coupon = payload.coupon;

    if (!merchantId || !items.length) throw new Error('بيانات الطلب ناقصة');
    if (!customer.phone || !customer.street) throw new Error('بيانات العميل ناقصة');

    var merchantRef = i.db.collection('merchants').doc(merchantId);
    var orderId = 'KTN-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 999999)).padStart(6, '0');

    var result = await i.db.runTransaction(async function (t) {
      var merchantDoc = await t.get(merchantRef);
      if (!merchantDoc.exists) throw new Error('المتجر غير موجود');
      var merchant = merchantDoc.data();
      if (merchant.status !== 'approved') throw new Error('المتجر غير معتمد');

      // Validate + deduct stock
      var products = merchant.products || [];
      var subtotal = 0;
      var validItems = [];
      for (var k = 0; k < items.length; k++) {
        var it = items[k];
        var p = products.find(function (x) { return String(x.id) === String(it.id); });
        if (!p) throw new Error('المنتج غير موجود');
        var qty = Math.max(1, parseInt(it.qty) || 1);
        if (p.stock !== undefined && p.stock < qty) throw new Error('الكمية غير متاحة: ' + p.name);
        p.stock = (p.stock === undefined) ? undefined : (p.stock - qty);
        subtotal += Number(p.price) * qty;
        validItems.push({
          id: p.id, nameAr: p.name, nameEn: p.name,
          emoji: p.emoji || '🛒', price: Number(p.price), qty: qty,
          image: p.image || null
        });
      }

      // Delivery fee
      var delivery = 25;
      if (subtotal >= 500) delivery = 0;
      if (merchant.deliveryFee !== undefined) delivery = Number(merchant.deliveryFee);

      // Coupon
      var discount = 0;
      if (coupon && coupon.code) {
        var cpDoc = await t.get(i.db.collection('coupons').doc(coupon.code));
        if (cpDoc.exists) {
          var c = cpDoc.data();
          if (subtotal >= (c.min || 0)) {
            if (c.type === 'pct') discount = Math.min(subtotal * c.value / 100, c.max || 999);
            else if (c.type === 'fixed') discount = Math.min(c.value, c.max || 999);
            else if (c.type === 'ship') delivery = 0;
          }
        }
      }

      var total = Math.max(0, subtotal + delivery - discount);

      // Update stock
      t.update(merchantRef, { products: products });

      // Create order
      var orderRef = i.db.collection('orders').doc();
      t.set(orderRef, {
        id: orderId,
        customerUid: user.uid,
        merchantId: merchantId,
        merchantName: merchant.name,
        merchantPhone: merchant.phone,
        ownerUid: merchant.ownerUid || null,
        customer: {
          name: customer.name || 'عميل',
          phone: customer.phone,
          email: customer.email || '',
          gov: customer.gov || '', city: customer.city || '',
          area: customer.area || '', street: customer.street || '',
          building: customer.building || '', floor: customer.floor || '',
          notes: customer.notes || '',
          lat: customer.lat || null, lng: customer.lng || null
        },
        items: validItems,
        subtotal: subtotal,
        delivery: delivery,
        discount: discount,
        total: total,
        coupon: coupon ? coupon.code : null,
        payment: payment,
        paymentStatus: payment === 'cod' ? 'cod' : 'pending',
        paymentMethod: paymentMethod,
        status: 'placed',
        statusHistory: [{ status: 'placed', at: new Date().toISOString() }],
        createdAt: new Date().toISOString(),
        _serverCreatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Create notification for admin
      var notifRef = i.db.collection('notifications').doc();
      t.set(notifRef, {
        type: 'new_order',
        orderId: orderId,
        orderFbId: orderRef.id,
        merchantId: merchantId,
        merchantName: merchant.name,
        customer: { name: customer.name || 'عميل', phone: customer.phone },
        total: total,
        method: payment,
        area: customer.area || customer.city || '',
        createdAt: new Date().toISOString(),
        read: false,
        _serverCreatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return { orderId: orderId, fbId: orderRef.id };
    });

    return result;
  }

  async function fbCancelOrder(orderIdOrFb, reason) {
    var i = fbInit(); if (!i) throw new Error('Firebase not ready');
    var user = i.auth.currentUser;
    if (!user) throw new Error('سجّل دخولك');

    // Try both: by _fbId first, then by `id` field
    var orderRef, orderDoc;
    try { orderRef = i.db.collection('orders').doc(orderIdOrFb); orderDoc = await orderRef.get(); } catch (e) { orderDoc = null; }
    if (!orderDoc || !orderDoc.exists) {
      var snap = await i.db.collection('orders').where('id', '==', orderIdOrFb).limit(1).get();
      if (snap.empty) throw new Error('الطلب غير موجود');
      orderRef = snap.docs[0].ref;
      orderDoc = snap.docs[0];
    }
    var order = orderDoc.data();

    // Admin check
    var adminDoc = await i.db.collection('admins').doc(user.uid).get();
    var isAdmin = adminDoc.exists;
    if (order.customerUid !== user.uid && !isAdmin) throw new Error('غير مصرح');
    if (['placed', 'pending_payment'].indexOf(order.status) === -1) throw new Error('لا يمكن الإلغاء الآن');

    await i.db.runTransaction(async function (t) {
      var mRef = i.db.collection('merchants').doc(order.merchantId);
      var mDoc = await t.get(mRef);
      if (mDoc.exists) {
        var products = mDoc.data().products || [];
        order.items.forEach(function (it) {
          var p = products.find(function (x) { return String(x.id) === String(it.id); });
          if (p && p.stock !== undefined) p.stock += it.qty;
        });
        t.update(mRef, { products: products });
      }
      t.update(orderRef, {
        status: 'cancelled',
        cancellationReason: reason || 'بدون سبب',
        cancelledBy: user.uid,
        cancelledAt: new Date().toISOString(),
        paymentStatus: order.paymentStatus === 'cod' ? 'cod' : 'refunded'
      });
    });
    return { success: true };
  }

  async function fbMerchantConfirmOrder(fbId) {
    var i = fbInit(); if (!i) throw new Error('Firebase not ready');
    var user = i.auth.currentUser;
    if (!user) throw new Error('سجّل دخولك');

    var orderRef = i.db.collection('orders').doc(fbId);
    var orderDoc = await orderRef.get();
    if (!orderDoc.exists) throw new Error('غير موجود');
    var order = orderDoc.data();

    var mDoc = await i.db.collection('merchants').doc(order.merchantId).get();
    if (!mDoc.exists || mDoc.data().ownerUid !== user.uid) throw new Error('غير مصرح');

    await orderRef.update({
      status: 'confirmed',
      confirmedAt: new Date().toISOString(),
      statusHistory: firebase.firestore.FieldValue.arrayUnion(
        { status: 'confirmed', at: new Date().toISOString() }
      )
    });
    return { success: true };
  }

  async function fbAssignDriverToOrder(fbId) {
    var i = fbInit(); if (!i) throw new Error('Firebase not ready');
    var user = i.auth.currentUser;
    if (!user) throw new Error('سجّل دخولك');

    var driverDoc = await i.db.collection('drivers').doc(user.uid).get();
    if (!driverDoc.exists) throw new Error('سجّل كمندوب');
    var driver = driverDoc.data();
    if (driver.status !== 'approved') throw new Error('حسابك غير معتمد');

    var orderRef = i.db.collection('orders').doc(fbId);
    var result = await i.db.runTransaction(async function (t) {
      var orderDoc = await t.get(orderRef);
      if (!orderDoc.exists) throw new Error('غير موجود');
      var order = orderDoc.data();
      if (order.driverId) throw new Error('مقبول مسبقاً');
      if (['placed', 'confirmed'].indexOf(order.status) === -1) throw new Error('غير متاح');
      t.update(orderRef, {
        driverId: user.uid,
        driver: {
          name: driver.name, phone: driver.phone,
          lat: driver.lat || null, lng: driver.lng || null
        },
        status: 'preparing',
        acceptedAt: new Date().toISOString(),
        statusHistory: firebase.firestore.FieldValue.arrayUnion(
          { status: 'preparing', at: new Date().toISOString() }
        )
      });
      return { order: order };
    });
    return { success: true, order: result.order };
  }

  async function fbDriverUpdateStatus(orderIdOrFb, newStatus) {
    var i = fbInit(); if (!i) throw new Error('Firebase not ready');
    var user = i.auth.currentUser;
    if (!user) throw new Error('سجّل دخولك');

    var orderRef, orderDoc;
    try { orderRef = i.db.collection('orders').doc(orderIdOrFb); orderDoc = await orderRef.get(); } catch (e) { orderDoc = null; }
    if (!orderDoc || !orderDoc.exists) {
      var snap = await i.db.collection('orders').where('id', '==', orderIdOrFb).limit(1).get();
      if (snap.empty) throw new Error('غير موجود');
      orderRef = snap.docs[0].ref;
      orderDoc = snap.docs[0];
    }
    var order = orderDoc.data();
    if (order.driverId !== user.uid) throw new Error('غير مصرح');

    var valid = { preparing: ['out'], out: ['delivered'] };
    if (!valid[order.status] || valid[order.status].indexOf(newStatus) === -1) throw new Error('تبديل غير صحيح');

    var updates = {
      status: newStatus,
      statusHistory: firebase.firestore.FieldValue.arrayUnion(
        { status: newStatus, at: new Date().toISOString() }
      )
    };
    if (newStatus === 'out') updates.pickedAt = new Date().toISOString();
    if (newStatus === 'delivered') {
      updates.deliveredAt = new Date().toISOString();
      if (order.paymentStatus === 'cod') updates.paymentStatus = 'paid';
    }

    await orderRef.update(updates);

    if (newStatus === 'delivered') {
      try {
        await i.db.collection('drivers').doc(user.uid).update({
          completedToday: firebase.firestore.FieldValue.increment(1),
          completedTotal: firebase.firestore.FieldValue.increment(1),
          earnings: firebase.firestore.FieldValue.increment(15),
          monthlyOrders: firebase.firestore.FieldValue.increment(1)
        });
      } catch (e) { console.warn('driver stats:', e); }
    }

    return { success: true };
  }

  async function fbSubmitRating(payload) {
    var i = fbInit(); if (!i) throw new Error('Firebase not ready');
    var user = i.auth.currentUser;
    if (!user) throw new Error('سجّل دخولك');

    var orderId = payload.orderId;
    var driverRating = Math.min(5, Math.max(1, Number(payload.driverRating) || 5));
    var merchantRating = Math.min(5, Math.max(1, Number(payload.merchantRating) || 5));
    var comment = String(payload.comment || '').slice(0, 500);

    // Find order
    var snap = await i.db.collection('orders').where('id', '==', orderId).limit(1).get();
    if (snap.empty) throw new Error('الطلب غير موجود');
    var order = snap.docs[0].data();
    if (order.customerUid !== user.uid) throw new Error('غير مصرح');
    if (order.status !== 'delivered') throw new Error('لم يتم التسليم');

    var existing = await i.db.collection('ratings').where('orderId', '==', orderId).limit(1).get();
    if (!existing.empty) throw new Error('قيّمت مسبقاً');

    await i.db.collection('ratings').add({
      orderId: orderId,
      customerUid: user.uid,
      driverId: order.driverId || null,
      merchantId: order.merchantId,
      driverRating: driverRating,
      merchantRating: merchantRating,
      comment: comment,
      createdAt: new Date().toISOString(),
      _serverCreatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Update averages (client-side, simple)
    await updateAvg(i, 'drivers', order.driverId, 'rating', driverRating);
    await updateAvg(i, 'merchants', order.merchantId, 'rating', merchantRating);
    return { success: true };
  }

  async function updateAvg(i, col, id, field, value) {
    if (!id) return;
    try {
      var ref = i.db.collection(col).doc(id);
      var doc = await ref.get();
      if (!doc.exists) return;
      var data = doc.data();
      var cur = data[field] || 5;
      var count = data.ratingCount || 0;
      var newAvg = ((cur * count) + value) / (count + 1);
      await ref.update({
        [field]: Math.round(newAvg * 10) / 10,
        ratingCount: count + 1
      });
    } catch (e) { console.warn('updateAvg:', e); }
  }

  /* ═══════════════════════════════════════════════════════
     MERCHANTS
     ═══════════════════════════════════════════════════════ */
  async function fbGetMerchants() {
    var i = fbInit(); if (!i) return [];
    try {
      var snap = await i.db.collection('merchants').orderBy('_serverCreatedAt', 'desc').limit(200).get();
      return snap.docs.map(function (d) { return Object.assign({ _fbId: d.id }, d.data()); });
    } catch (e) {
      // Fallback: without orderBy (in case index not ready yet)
      var snap2 = await i.db.collection('merchants').limit(200).get();
      return snap2.docs.map(function (d) { return Object.assign({ _fbId: d.id }, d.data()); });
    }
  }

  function fbListenMerchants(cb) {
    var i = fbInit(); if (!i) return null;
    return i.db.collection('merchants').onSnapshot(function (snap) {
      var arr = snap.docs.map(function (d) { return Object.assign({ _fbId: d.id }, d.data()); });
      if (typeof cb === 'function') cb(arr);
    }, function (e) { console.error('listenMerchants:', e); });
  }

  async function fbUpdateMerchant(fbId, data) {
    var i = fbInit(); if (!i) return false;
    try { await i.db.collection('merchants').doc(fbId).update(data); return true; }
    catch (e) { console.error('updateMerchant:', e); return false; }
  }

  async function fbDeleteMerchant(fbId) {
    var i = fbInit(); if (!i) return false;
    try { await i.db.collection('merchants').doc(fbId).delete(); return true; }
    catch (e) { return false; }
  }

  /* ═══════════════════════════════════════════════════════
     ORDERS — Listeners
     ═══════════════════════════════════════════════════════ */
  async function fbGetOrders(limit) {
    var i = fbInit(); if (!i) return [];
    try {
      var snap = await i.db.collection('orders').orderBy('_serverCreatedAt', 'desc').limit(limit || 200).get();
      return snap.docs.map(function (d) { return Object.assign({ _fbId: d.id }, d.data()); });
    } catch (e) {
      var snap2 = await i.db.collection('orders').limit(limit || 200).get();
      return snap2.docs.map(function (d) { return Object.assign({ _fbId: d.id }, d.data()); });
    }
  }

  function fbListenOrders(cb, filter) {
    var i = fbInit(); if (!i) return null;
    var ref = i.db.collection('orders');
    if (filter && filter.merchantId) ref = ref.where('merchantId', '==', filter.merchantId);
    if (filter && filter.driverId) ref = ref.where('driverId', '==', filter.driverId);
    if (filter && filter.customerUid) ref = ref.where('customerUid', '==', filter.customerUid);
    if (filter && filter.status) ref = ref.where('status', '==', filter.status);
    // orderBy آخر — عشان لو الـ index مش موجود، يفشل بلطف
    try {
      ref = ref.orderBy('_serverCreatedAt', 'desc').limit(200);
    } catch (e) {}
    return ref.onSnapshot(function (snap) {
      var arr = snap.docs.map(function (d) { return Object.assign({ _fbId: d.id }, d.data()); });
      if (typeof cb === 'function') cb(arr);
    }, function (e) {
      console.error('listenOrders error:', e);
      // Fallback: بدون orderBy
      var fallback = i.db.collection('orders');
      if (filter && filter.merchantId) fallback = fallback.where('merchantId', '==', filter.merchantId);
      if (filter && filter.driverId) fallback = fallback.where('driverId', '==', filter.driverId);
      if (filter && filter.customerUid) fallback = fallback.where('customerUid', '==', filter.customerUid);
      fallback.limit(200).onSnapshot(function (snap2) {
        var arr2 = snap2.docs.map(function (d) { return Object.assign({ _fbId: d.id }, d.data()); });
        if (typeof cb === 'function') cb(arr2);
      });
    });
  }

  async function fbUpdateOrder(fbId, data) {
    var i = fbInit(); if (!i) return false;
    try { await i.db.collection('orders').doc(fbId).update(data); return true; }
    catch (e) { console.error('updateOrder:', e); return false; }
  }

  /* ═══════════════════════════════════════════════════════
     NOTIFICATIONS
     ═══════════════════════════════════════════════════════ */
  async function fbSaveNotification(notif) {
    var i = fbInit(); if (!i) return null;
    try {
      var ref = await i.db.collection('notifications').add(Object.assign({}, notif, {
        _serverCreatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }));
      return ref.id;
    } catch (e) { console.error('saveNotification:', e); return null; }
  }

  function fbListenNotifications(cb) {
    var i = fbInit(); if (!i) return null;
    try {
      return i.db.collection('notifications').orderBy('_serverCreatedAt', 'desc').limit(100)
        .onSnapshot(function (snap) {
          var arr = snap.docs.map(function (d) { return Object.assign({ _fbId: d.id }, d.data()); });
          if (typeof cb === 'function') cb(arr);
        }, function (e) {
          console.error('listenNotifs error:', e);
          // Fallback بدون orderBy
          i.db.collection('notifications').limit(100).onSnapshot(function (s2) {
            var a2 = s2.docs.map(function (d) { return Object.assign({ _fbId: d.id }, d.data()); });
            if (typeof cb === 'function') cb(a2);
          });
        });
    } catch (e) { return null; }
  }

  async function fbMarkNotificationRead(fbId) {
    var i = fbInit(); if (!i) return false;
    try { await i.db.collection('notifications').doc(fbId).update({ read: true }); return true; }
    catch (e) { return false; }
  }

  async function fbDeleteNotification(fbId) {
    var i = fbInit(); if (!i) return false;
    try { await i.db.collection('notifications').doc(fbId).delete(); return true; }
    catch (e) { return false; }
  }

  /* ═══════════════════════════════════════════════════════
     RATINGS
     ═══════════════════════════════════════════════════════ */
  function fbListenRatings(filter, cb) {
    var i = fbInit(); if (!i) return null;
    var ref = i.db.collection('ratings');
    if (filter && filter.driverId) ref = ref.where('driverId', '==', filter.driverId);
    if (filter && filter.merchantId) ref = ref.where('merchantId', '==', filter.merchantId);
    ref = ref.limit(50);
    return ref.onSnapshot(function (snap) {
      var arr = snap.docs.map(function (d) { return Object.assign({ _fbId: d.id }, d.data()); });
      if (typeof cb === 'function') cb(arr);
    }, function (e) { console.error('listenRatings:', e); });
  }

  /* ═══════════════════════════════════════════════════════
     TEST
     ═══════════════════════════════════════════════════════ */
  async function fbTest() {
    try {
      var i = fbInit(); if (!i) return false;
      // ✅ قراءة بدل كتابة (تجنب permission-denied)
      await i.db.collection('merchants').limit(1).get();
      return true;
    } catch (e) {
      // لو حتى القراءة فشلت، Firebase نفسه شغال
      if (e && e.code === 'permission-denied') return true;
      console.warn('fbTest:', e);
      return false;
    }
  }

  /* ═══════════════════════════════════════════════════════
     PUBLIC API
     ═══════════════════════════════════════════════════════ */
  window.KT_FB = {
    init: fbInit,
    test: fbTest,
    // Auth
    signInEmail: fbSignInEmail,
    signUpEmail: fbSignUpEmail,
    signOut: fbSignOut,
    onAuth: fbOnAuth,
    currentUser: fbCurrentUser,
    isAdmin: fbIsAdmin,
    // Orders
    placeOrder: fbPlaceOrder,
    cancelOrder: fbCancelOrder,
    merchantConfirmOrder: fbMerchantConfirmOrder,
    assignDriverToOrder: fbAssignDriverToOrder,
    driverUpdateStatus: fbDriverUpdateStatus,
    submitRating: fbSubmitRating,
    getOrders: fbGetOrders,
    listenOrders: fbListenOrders,
    updateOrder: fbUpdateOrder,
    // Merchants
    getMerchants: fbGetMerchants,
    listenMerchants: fbListenMerchants,
    updateMerchant: fbUpdateMerchant,
    deleteMerchant: fbDeleteMerchant,
    // Notifications
    saveNotification: fbSaveNotification,
    listenNotifications: fbListenNotifications,
    markNotificationRead: fbMarkNotificationRead,
    deleteNotification: fbDeleteNotification,
    // Ratings
    listenRatings: fbListenRatings
  };

  console.log('📦 Firebase Helpers v3.0 (Spark mode) loaded');
})();