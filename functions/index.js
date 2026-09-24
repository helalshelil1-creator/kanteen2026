/* ═══════════════════════════════════════════════════════════
   كانتِين | Kanteen — Cloud Functions v2.0
   ═══════════════════════════════════════════════════════════ */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();
const REGION = 'europe-west1';
const DELIVERY_FEE_DEFAULT = 25;
const FREE_DELIVERY_THRESHOLD = 500;

async function pushToUser(uid, title, body, data) {
  data = data || {};
  try {
    const tokenDoc = await db.collection('fcmTokens').where('uid', '==', uid).get();
    if (tokenDoc.empty) return;
    const tokens = tokenDoc.docs.map(function(d){ return d.id; });
    if (!tokens.length) return;
    await messaging.sendEachForMulticast({
      tokens: tokens,
      notification: { title: title, body: body },
      data: Object.fromEntries(Object.entries(data).map(function(e){ return [e[0], String(e[1])]; })),
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } }
    });
  } catch (e) { console.error('pushToUser:', e); }
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ═══ placeOrder ═══ */
exports.placeOrder = functions.region(REGION).https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'يجب تسجيل الدخول');
  const uid = context.auth.uid;
  const { merchantId, items, customer, payment, paymentMethod, coupon } = data || {};

  if (!merchantId || !Array.isArray(items) || !items.length)
    throw new functions.https.HttpsError('invalid-argument', 'بيانات ناقصة');
  if (!customer || !customer.phone || !customer.street)
    throw new functions.https.HttpsError('invalid-argument', 'بيانات العميل ناقصة');

  const merchantRef = db.collection('merchants').doc(merchantId);
  const merchantDoc = await merchantRef.get();
  if (!merchantDoc.exists)
    throw new functions.https.HttpsError('not-found', 'المتجر غير موجود');
  const merchant = merchantDoc.data();
  if (merchant.status !== 'approved')
    throw new functions.https.HttpsError('failed-precondition', 'المتجر غير معتمد');

  if (merchant.lat && merchant.lng && customer.lat && customer.lng) {
    const dist = distanceKm(merchant.lat, merchant.lng, customer.lat, customer.lng);
    if (dist > 10) throw new functions.https.HttpsError('out-of-range', 'خارج النطاق (' + dist.toFixed(1) + ' كم)');
  }

  const merchantProducts = merchant.products || [];
  let subtotal = 0;
  const validItems = [];
  for (const it of items) {
    const p = merchantProducts.find(function(x){ return String(x.id) === String(it.id); });
    if (!p) throw new functions.https.HttpsError('not-found', 'المنتج غير موجود');
    const qty = Math.max(1, parseInt(it.qty) || 1);
    const price = Number(p.price) || 0;
    subtotal += price * qty;
    validItems.push({ id: p.id, nameAr: p.name, nameEn: p.name, emoji: p.emoji || '🛒', price: price, qty: qty, image: p.image || null });
  }

  let delivery = DELIVERY_FEE_DEFAULT;
  if (subtotal >= FREE_DELIVERY_THRESHOLD) delivery = 0;
  if (merchant.deliveryFee !== undefined) delivery = Number(merchant.deliveryFee);

  let discount = 0;
  if (coupon && coupon.code) {
    const cp = await db.collection('coupons').doc(coupon.code).get();
    if (cp.exists) {
      const c = cp.data();
      if (subtotal >= (c.min || 0)) {
        if (c.type === 'pct') discount = Math.min(subtotal * c.value / 100, c.max || 999);
        else if (c.type === 'fixed') discount = Math.min(c.value, c.max || 999);
        else if (c.type === 'ship') delivery = 0;
      }
    }
  }

  const total = Math.max(0, subtotal + delivery - discount);
  const orderId = 'KTN-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 999999)).padStart(6, '0');

  const result = await db.runTransaction(async function(t) {
    const freshMerchant = await t.get(merchantRef);
    const freshProducts = freshMerchant.data().products || [];
    for (const it of validItems) {
      const p = freshProducts.find(function(x){ return String(x.id) === String(it.id); });
      if (!p || (p.stock !== undefined && p.stock < it.qty))
        throw new functions.https.HttpsError('failed-precondition', 'الكمية غير متاحة');
    }
    for (const it of validItems) {
      const p = freshProducts.find(function(x){ return String(x.id) === String(it.id); });
      if (p.stock !== undefined) p.stock -= it.qty;
    }
    t.update(merchantRef, { products: freshProducts });

    const orderRef = db.collection('orders').doc();
    t.set(orderRef, {
      id: orderId, customerUid: uid, merchantId: merchantId,
      merchantName: merchant.name, merchantPhone: merchant.phone,
      customer: {
        name: customer.name || 'عميل', phone: customer.phone, email: customer.email || '',
        gov: customer.gov || '', city: customer.city || '', area: customer.area || '',
        street: customer.street || '', building: customer.building || '', floor: customer.floor || '',
        notes: customer.notes || '', lat: customer.lat || null, lng: customer.lng || null
      },
      items: validItems, subtotal: subtotal, delivery: delivery, discount: discount, total: total,
      coupon: coupon ? coupon.code : null, payment: payment || 'cod',
      paymentStatus: payment === 'cod' ? 'cod' : 'pending',
      paymentMethod: paymentMethod || null, status: 'placed',
      statusHistory: [{ status: 'placed', at: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      _serverCreatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { orderId: orderId, fbId: orderRef.id };
  });

  if (merchant.ownerUid) {
    pushToUser(merchant.ownerUid, '🔔 طلب جديد', 'طلب ' + orderId + ' — ' + total + ' ج.م', { orderId: orderId, type: 'new_order' });
  }

  return result;
});

/* ═══ cancelOrder ═══ */
exports.cancelOrder = functions.region(REGION).https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'سجّل دخولك');
  const uid = context.auth.uid;
  const { orderId, reason } = data || {};
  if (!orderId) throw new functions.https.HttpsError('invalid-argument', 'orderId مطلوب');

  const orderRef = db.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();
  if (!orderDoc.exists) throw new functions.https.HttpsError('not-found', 'الطلب غير موجود');
  const order = orderDoc.data();

  const adminDoc = await db.collection('admins').doc(uid).get();
  const isAdmin = adminDoc.exists;
  if (order.customerUid !== uid && !isAdmin)
    throw new functions.https.HttpsError('permission-denied', 'غير مصرح');
  if (['placed', 'pending_payment'].indexOf(order.status) === -1)
    throw new functions.https.HttpsError('failed-precondition', 'لا يمكن الإلغاء الآن');

  await db.runTransaction(async function(t) {
    const mRef = db.collection('merchants').doc(order.merchantId);
    const mDoc = await t.get(mRef);
    if (mDoc.exists) {
      const products = mDoc.data().products || [];
      for (const it of order.items) {
        const p = products.find(function(x){ return String(x.id) === String(it.id); });
        if (p && p.stock !== undefined) p.stock += it.qty;
      }
      t.update(mRef, { products: products });
    }
    t.update(orderRef, {
      status: 'cancelled', cancellationReason: reason || 'بدون سبب',
      cancelledBy: uid, cancelledAt: new Date().toISOString(),
      paymentStatus: order.paymentStatus === 'cod' ? 'cod' : 'refunded'
    });
  });

  return { success: true };
});

/* ═══ merchantConfirmOrder ═══ */
exports.merchantConfirmOrder = functions.region(REGION).https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'سجّل دخولك');
  const uid = context.auth.uid;
  const { orderId } = data || {};
  const orderRef = db.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();
  if (!orderDoc.exists) throw new functions.https.HttpsError('not-found', 'غير موجود');
  const order = orderDoc.data();

  const mDoc = await db.collection('merchants').doc(order.merchantId).get();
  if (!mDoc.exists || mDoc.data().ownerUid !== uid)
    throw new functions.https.HttpsError('permission-denied', 'غير مصرح');

  await orderRef.update({
    status: 'confirmed', confirmedAt: new Date().toISOString(),
    statusHistory: admin.firestore.FieldValue.arrayUnion({ status: 'confirmed', at: new Date().toISOString() })
  });

  pushToUser(order.customerUid, '✅ تم تأكيد طلبك', 'طلب ' + order.id + ' في الطريق', { orderId: order.id, type: 'order_confirmed' });
  return { success: true };
});

/* ═══ assignDriverToOrder ═══ */
exports.assignDriverToOrder = functions.region(REGION).https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'سجّل دخولك');
  const driverId = context.auth.uid;
  const { orderId } = data || {};

  const driverDoc = await db.collection('drivers').doc(driverId).get();
  if (!driverDoc.exists) throw new functions.https.HttpsError('permission-denied', 'سجّل كمندوب');
  const driver = driverDoc.data();
  if (driver.status !== 'approved') throw new functions.https.HttpsError('permission-denied', 'حسابك غير معتمد');

  const orderRef = db.collection('orders').doc(orderId);
  const result = await db.runTransaction(async function(t) {
    const orderDoc = await t.get(orderRef);
    if (!orderDoc.exists) throw new functions.https.HttpsError('not-found', 'غير موجود');
    const order = orderDoc.data();
    if (order.driverId) throw new functions.https.HttpsError('already-exists', 'مقبول مسبقاً');
    if (order.status !== 'placed' && order.status !== 'confirmed')
      throw new functions.https.HttpsError('failed-precondition', 'غير متاح');
    t.update(orderRef, {
      driverId: driverId,
      driver: { name: driver.name, phone: driver.phone, lat: driver.lat || null, lng: driver.lng || null },
      status: 'preparing', acceptedAt: new Date().toISOString(),
      statusHistory: admin.firestore.FieldValue.arrayUnion({ status: 'preparing', at: new Date().toISOString() })
    });
    return { order: order };
  });

  pushToUser(result.order.customerUid, '🛵 مندوب في الطريق', 'تم قبول طلبك من ' + driver.name, { orderId: orderId, type: 'driver_assigned' });
  return { success: true };
});

/* ═══ driverUpdateStatus ═══ */
exports.driverUpdateStatus = functions.region(REGION).https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'سجّل دخولك');
  const uid = context.auth.uid;
  const { orderId, newStatus } = data || {};

  const orderRef = db.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();
  if (!orderDoc.exists) throw new functions.https.HttpsError('not-found', 'غير موجود');
  const order = orderDoc.data();
  if (order.driverId !== uid) throw new functions.https.HttpsError('permission-denied', 'غير مصرح');

  const valid = { preparing: ['out'], out: ['delivered'] };
  if (!valid[order.status] || valid[order.status].indexOf(newStatus) === -1)
    throw new functions.https.HttpsError('failed-precondition', 'تبديل غير صحيح');

  const updates = {
    status: newStatus,
    statusHistory: admin.firestore.FieldValue.arrayUnion({ status: newStatus, at: new Date().toISOString() })
  };
  if (newStatus === 'out') updates.pickedAt = new Date().toISOString();
  if (newStatus === 'delivered') {
    updates.deliveredAt = new Date().toISOString();
    if (order.paymentStatus === 'cod') updates.paymentStatus = 'paid';
  }

  await orderRef.update(updates);

  if (newStatus === 'delivered') {
    await db.collection('drivers').doc(uid).update({
      completedToday: admin.firestore.FieldValue.increment(1),
      completedTotal: admin.firestore.FieldValue.increment(1),
      earnings: admin.firestore.FieldValue.increment(15),
      monthlyOrders: admin.firestore.FieldValue.increment(1)
    });
  }

  const msg = {
    out: { t: '🚚 طلبك في الطريق', b: 'المندوب خرج للتوصيل' },
    delivered: { t: '🎉 تم التسليم', b: 'قيّم تجربتك' }
  }[newStatus];
  if (msg) pushToUser(order.customerUid, msg.t, msg.b, { orderId: orderId, type: newStatus });

  return { success: true };
});

/* ═══ submitRating ═══ */
exports.submitRating = functions.region(REGION).https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'سجّل دخولك');
  const uid = context.auth.uid;
  const { orderId, driverRating, merchantRating, comment } = data || {};

  const orderDoc = await db.collection('orders').doc(orderId).get();
  if (!orderDoc.exists) throw new functions.https.HttpsError('not-found', 'غير موجود');
  const order = orderDoc.data();
  if (order.customerUid !== uid) throw new functions.https.HttpsError('permission-denied', 'غير مصرح');
  if (order.status !== 'delivered') throw new functions.https.HttpsError('failed-precondition', 'لم يتم التسليم');

  const existing = await db.collection('ratings').where('orderId', '==', orderId).limit(1).get();
  if (!existing.empty) throw new functions.https.HttpsError('already-exists', 'قيّمت مسبقاً');

  await db.collection('ratings').add({
    orderId: orderId, customerUid: uid, driverId: order.driverId || null, merchantId: order.merchantId,
    driverRating: Math.min(5, Math.max(1, Number(driverRating) || 5)),
    merchantRating: Math.min(5, Math.max(1, Number(merchantRating) || 5)),
    comment: String(comment || '').slice(0, 500),
    createdAt: new Date().toISOString(),
    _serverCreatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await updateAvg('drivers', order.driverId, 'rating', Number(driverRating) || 5);
  await updateAvg('merchants', order.merchantId, 'rating', Number(merchantRating) || 5);

  return { success: true };
});

async function updateAvg(col, id, field, value) {
  if (!id) return;
  const ref = db.collection(col).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return;
  const cur = doc.data()[field] || 5;
  const count = doc.data()['ratingCount'] || 0;
  const newAvg = ((cur * count) + value) / (count + 1);
  await ref.update({ [field]: Math.round(newAvg * 10) / 10, ratingCount: count + 1 });
}

/* ═══ Triggers ═══ */
exports.onNewMerchant = functions.region(REGION).firestore.document('merchants/{id}').onCreate(async function(snap) {
  await db.collection('notifications').add({
    type: 'new_merchant', merchantId: snap.id, merchantName: snap.data().name,
    owner: snap.data().owner, phone: snap.data().phone,
    createdAt: new Date().toISOString(), read: false,
    _serverCreatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
});

exports.onNewDriver = functions.region(REGION).firestore.document('drivers/{id}').onCreate(async function(snap) {
  await db.collection('notifications').add({
    type: 'new_driver', driverId: snap.id, driverName: snap.data().name,
    phone: snap.data().phone, area: snap.data().area, vehicle: snap.data().vehicle,
    createdAt: new Date().toISOString(), read: false,
    _serverCreatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
});

/* ═══ checkLateOrders (كل 5 دقائق) ═══ */
exports.checkLateOrders = functions.region(REGION).pubsub.schedule('every 5 minutes').onRun(async function() {
  const now = Date.now();
  const twentyMinAgo = new Date(now - 20 * 60 * 1000).toISOString();
  const snap = await db.collection('orders')
    .where('status', 'in', ['preparing', 'out'])
    .where('acceptedAt', '<', twentyMinAgo)
    .limit(50).get();

  const batch = db.batch();
  snap.forEach(function(doc) {
    const o = doc.data();
    batch.set(db.collection('notifications').doc('late_' + doc.id), {
      type: 'late_driver', orderId: o.id, driverId: o.driverId,
      driverName: o.driver ? o.driver.name : '—',
      minutesLate: Math.floor((now - new Date(o.acceptedAt).getTime()) / 60000),
      createdAt: new Date().toISOString(), read: false,
      _serverCreatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  });
  await batch.commit();
  console.log('Checked ' + snap.size + ' orders');
});

/* ═══ bootstrapAdmin ═══ */
exports.bootstrapAdmin = functions.region(REGION).https.onCall(async function(data, context) {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'سجّل دخولك');
  const adminsSnap = await db.collection('admins').limit(1).get();
  if (!adminsSnap.empty) throw new functions.https.HttpsError('already-exists', 'يوجد admin');
  if (data.secret !== 'KANTEEN_BOOTSTRAP_2026')
    throw new functions.https.HttpsError('permission-denied', 'secret خطأ');
  await db.collection('admins').doc(context.auth.uid).set({
    email: context.auth.token.email || '',
    createdAt: new Date().toISOString(), role: 'superadmin'
  });
  return { success: true };
});