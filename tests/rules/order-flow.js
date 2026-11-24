/* Kanteen order flow (free, no Cloud Functions). NOT ACTIVE until KT_CONFIG.SECURE_ORDERS is on
   together with firestore.rules.next. Works with a compat Firestore `db`.
   1) requestOrder: customer writes a PENDING order request. Nothing is confirmed, stock is untouched.
   2) acceptOrder: merchant/owner runs ONE client transaction that re-reads the order, the trusted
      merchant catalog (merchants/{id}.products) and per-item stock docs (merchants/{id}/stock/{pid}),
      recomputes the payable total, and writes order->confirmed plus the exact stock decrements.
      Firestore transactions retry on contention, so two competing accepts cannot both take the last unit. */
(function (root) {
  function deliveryFor(merchant, subtotal) {
    if (merchant.deliveryFee !== undefined && merchant.deliveryFee !== null) return Number(merchant.deliveryFee);
    return subtotal >= 500 ? 0 : 25;
  }
  async function requestOrder(db, user, p) {
    if (!user) throw new Error('يجب تسجيل الدخول أولاً');
    if (!p.merchantId || !p.items || !p.items.length) throw new Error('بيانات الطلب ناقصة');
    var itemQty = {}, items = [];
    p.items.forEach(function (it) {
      var q = Math.max(1, parseInt(it.qty, 10) || 1);
      itemQty[String(it.id)] = (itemQty[String(it.id)] || 0) + q;
    });
    Object.keys(itemQty).forEach(function (id) {
      var src = p.items.find(function (x) { return String(x.id) === id; });
      items.push({ id: id, nameAr: src.nameAr || src.name || '', price: Number(src.price) || 0, qty: itemQty[id] });
    });
    var subtotal = items.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    var total = Math.max(0.01, subtotal + Number(p.delivery || 0) - Number(p.discount || 0));
    var ref = db.collection('orders').doc();
    var doc = {
      id: p.code, customerUid: user.uid, merchantId: p.merchantId, customer: p.customer || {},
      items: items, itemQty: itemQty, subtotal: subtotal, delivery: Number(p.delivery || 0),
      discount: Number(p.discount || 0), total: total, coupon: p.coupon || null,
      payment: p.payment || 'cod', paymentStatus: p.payment === 'cod' ? 'cod' : 'pending',
      status: 'placed', statusHistory: [{ status: 'placed', at: new Date().toISOString() }],
      createdAt: new Date().toISOString()
    };
    await ref.set(doc);           // throws on failure: caller must show it, never "sent"
    return { fbId: ref.id, status: 'placed' };
  }
  async function retrying(fn) {
    // A lost race can surface as aborted, failed-precondition or (when rules see the newer stock) permission-denied.
    // Retrying re-reads fresh state: a lost race then resolves; a genuine denial / insufficient stock still fails.
    for (var n = 0; ; n++) {
      try { return await fn(); }
      catch (e) {
        var retry = e && (e.code === 'aborted' || e.code === 'failed-precondition' || e.code === 'permission-denied');
        if (n < 8 && retry) { await new Promise(function (r) { setTimeout(r, 30 + Math.random() * 120); }); continue; }
        throw e;
      }
    }
  }
  /* opts.agreedQuote: the merchant records that the customer agreed (by WhatsApp/phone) to the merchant-quoted total.
     If the trusted recomputed total differs from the customer's submitted total and no agreement was recorded,
     NOTHING is confirmed and no stock moves: the order gets quoteStatus 'awaiting_customer'. */
  function acceptOrder(db, orderFbId, opts) { return retrying(function () { return acceptOnce(db, orderFbId, opts || {}); }); }
  function cancelOrder(db, orderFbId) { return retrying(function () { return cancelOnce(db, orderFbId); }); }
  function acceptOnce(db, orderFbId, opts) {
    return db.runTransaction(async function (t) {
      var oRef = db.collection('orders').doc(orderFbId);
      var o = await t.get(oRef);
      if (!o.exists) throw new Error('الطلب غير موجود');
      var od = o.data();
      if (od.status !== 'placed') throw new Error('الطلب ليس في حالة انتظار');
      var mRef = db.collection('merchants').doc(od.merchantId);
      var m = await t.get(mRef);
      if (!m.exists || m.data().status !== 'approved') throw new Error('المتجر غير معتمد');
      var catalog = m.data().products || [];
      var ids = Object.keys(od.itemQty || {});
      var stockRefs = ids.map(function (id) { return mRef.collection('stock').doc(id); });
      var stocks = [];
      for (var k = 0; k < stockRefs.length; k++) stocks.push(await t.get(stockRefs[k]));
      var coupon = null;
      if (od.coupon) { var cs = await t.get(db.collection('coupons').doc(od.coupon)); if (cs.exists) coupon = cs.data(); }
      var subtotal = 0, confirmedItems = [];
      ids.forEach(function (id, k) {
        var prod = catalog.find(function (x) { return String(x.id) === id; });
        if (!prod) throw new Error('المنتج غير موجود في كتالوج المتجر: ' + id);
        var qty = od.itemQty[id];
        if (!(qty > 0) || qty !== Math.floor(qty)) throw new Error('كمية غير صالحة');
        if (!stocks[k].exists || stocks[k].data().qty < qty) throw new Error('الكمية غير متاحة: ' + (prod.name || id));
        subtotal += Number(prod.price) * qty;
        confirmedItems.push({ id: id, name: prod.name, price: Number(prod.price), qty: qty });
      });
      var delivery = deliveryFor(m.data(), subtotal), discount = 0;
      if (coupon && subtotal >= (coupon.min || 0)) {
        if (coupon.type === 'pct') discount = Math.min(subtotal * coupon.value / 100, coupon.max || 999);
        else if (coupon.type === 'fixed') discount = Math.min(coupon.value, coupon.max || 999);
        else if (coupon.type === 'ship') delivery = 0;
      }
      var quoted = Math.max(0, subtotal + delivery - discount);
      var submitted = Number(od.total);
      var differs = Math.abs(quoted - submitted) > 0.009;
      var now = new Date().toISOString();
      if (differs) {
        var agreed = opts.agreedQuote === true && od.quoteStatus === 'awaiting_customer' && Math.abs(Number(od.quotedTotal) - quoted) <= 0.009;
        if (!agreed) {
          t.update(oRef, { quoteStatus: 'awaiting_customer', quotedTotal: quoted, quotedItems: confirmedItems });
          return { needsAgreement: true, confirmed: false, requestedTotal: submitted, quotedTotal: quoted };
        }
      }
      ids.forEach(function (id, k) {
        t.update(stockRefs[k], { qty: stocks[k].data().qty - od.itemQty[id], lastOrderId: orderFbId });
      });
      var hist = (od.statusHistory || []).concat([{ status: 'confirmed', at: now }]);
      var upd = { status: 'confirmed', confirmedAt: now, statusHistory: hist, stockTaken: true,
                  confirmedTotal: quoted, confirmedItems: confirmedItems, totalCorrected: differs };
      if (differs) { upd.quoteStatus = 'agreed_recorded_by_merchant'; upd.quoteAgreedAt = now; }
      t.update(oRef, upd);
      return { confirmed: true, needsAgreement: false, confirmedTotal: quoted, requestedTotal: submitted, totalCorrected: differs };
    });
  }
  function cancelOnce(db, orderFbId) {
    return db.runTransaction(async function (t) {
      var oRef = db.collection('orders').doc(orderFbId);
      var o = await t.get(oRef); if (!o.exists) throw new Error('الطلب غير موجود');
      var od = o.data();
      if (['placed', 'confirmed', 'preparing'].indexOf(od.status) < 0) throw new Error('لا يمكن إلغاء هذا الطلب');
      var now = new Date().toISOString();
      var hist = (od.statusHistory || []).concat([{ status: 'cancelled', at: now }]);
      if (od.stockTaken === true) {
        var mRef = db.collection('merchants').doc(od.merchantId);
        var ids = Object.keys(od.itemQty || {});
        var refs = ids.map(function (id) { return mRef.collection('stock').doc(id); });
        var snaps = []; for (var k = 0; k < refs.length; k++) snaps.push(await t.get(refs[k]));
        ids.forEach(function (id, k) {
          if (!snaps[k].exists) throw new Error('مخزون غير موجود');
          t.update(refs[k], { qty: snaps[k].data().qty + od.itemQty[id], lastOrderId: orderFbId });
        });
        t.update(oRef, { status: 'cancelled', stockTaken: false, statusHistory: hist });
        return { cancelled: true, stockRestored: true };
      }
      t.update(oRef, { status: 'cancelled', statusHistory: hist });
      return { cancelled: true, stockRestored: false };
    });
  }
  /* Keep per-product stock docs in step with the merchant's product list (owner/admin).
     Creates missing docs; raises qty when the list shows more; never lowers (decreases only happen via accepted orders). */
  async function syncStock(db, merchantId, products) {
    var res = { created: 0, raised: 0, lowerIgnored: [] };
    for (var i = 0; i < (products || []).length; i++) {
      var p = products[i]; if (p.id === undefined || p.id === null) continue;
      var want = Math.max(0, Math.floor(Number(p.stock === undefined ? 0 : p.stock)) || 0);
      var ref = db.collection('merchants').doc(merchantId).collection('stock').doc(String(p.id));
      var s = await ref.get();
      if (!s.exists) { await ref.set({ qty: want }); res.created++; }
      else if (want > s.data().qty) { await ref.update({ qty: want }); res.raised++; }
      else if (want < s.data().qty) res.lowerIgnored.push(String(p.id));
    }
    return res;
  }
  var api = { requestOrder: requestOrder, acceptOrder: acceptOrder, cancelOrder: cancelOrder, syncStock: syncStock };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.KT_ORDERS = api;
})(typeof window !== 'undefined' ? window : globalThis);
