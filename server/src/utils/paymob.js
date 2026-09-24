const PAYMOB_BASE = 'https://accept.paymob.com/api';

export async function paymobAuth(){
  const res = await fetch(`${PAYMOB_BASE}/auth/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: process.env.PAYMOB_API_KEY })
  });
  if(!res.ok) throw new Error('Paymob auth failed');
  const data = await res.json();
  return data.token;
}

export async function paymobCreateOrder(authToken, { amountCents, merchantOrderId, items }){
  const res = await fetch(`${PAYMOB_BASE}/ecommerce/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: 'EGP',
      merchant_order_id: merchantOrderId,
      items: items || []
    })
  });
  if(!res.ok) throw new Error('Paymob order creation failed');
  return res.json();
}

export async function paymobPaymentKey(authToken, { orderId, amountCents, billingData }){
  const res = await fetch(`${PAYMOB_BASE}/acceptance/payment_keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: authToken,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: orderId,
      currency: 'EGP',
      integration_id: Number(process.env.PAYMOB_INTEGRATION_ID),
      billing_data: billingData
    })
  });
  if(!res.ok) throw new Error('Paymob payment key failed');
  return res.json();
}

export function paymobIframeUrl(paymentToken){
  return `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;
}

export function verifyPaymobHmac(data, hmac){
  // HMAC verification — for webhook security
  // Order matters per Paymob docs
  const crypto = require('crypto');
  const keys = [
    'amount_cents','created_at','currency','error_occured','has_parent_transaction',
    'id','integration_id','is_3d_secure','is_auth','is_capture','is_refunded',
    'is_standalone_payment','is_voided','order.id','owner','pending','source_data.pan',
    'source_data.sub_type','source_data.type','success'
  ];
  const concatenated = keys.map(k => {
    const parts = k.split('.');
    return parts.reduce((o, p) => o?.[p], data) ?? '';
  }).join('');
  const computed = crypto
    .createHmac('sha512', process.env.PAYMOB_HMAC_SECRET)
    .update(concatenated)
    .digest('hex');
  return computed === hmac;
}