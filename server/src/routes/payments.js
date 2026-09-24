import { Router } from 'express';
import { prisma } from '../server.js';
import { optionalAuth, requireAuth, requireAdmin } from '../middleware/auth.js';
import {
  paymobAuth, paymobCreateOrder, paymobPaymentKey,
  paymobIframeUrl, verifyPaymobHmac
} from '../utils/paymob.js';

const router = Router();

router.post('/paymob/init', optionalAuth, async (req, res, next) => {
  try {
    const { orderCode } = req.body;
    if(!orderCode) return res.status(400).json({ error: 'orderCode required' });
    
    const order = await prisma.order.findUnique({
      where: { orderCode },
      include: { items: true }
    });
    if(!order) return res.status(404).json({ error: 'Order not found' });
    if(order.paymentStatus === 'paid') return res.status(400).json({ error: 'Order already paid' });
    
    const authToken = await paymobAuth();
    
    const paymobOrder = await paymobCreateOrder(authToken, {
      amountCents: Math.round(Number(order.total) * 100),
      merchantOrderId: order.orderCode,
      items: order.items.map(i => ({
        name: i.nameAr,
        amount_cents: Math.round(Number(i.price) * 100),
        quantity: i.qty
      }))
    });
    
    const paymentKey = await paymobPaymentKey(authToken, {
      orderId: paymobOrder.id,
      amountCents: Math.round(Number(order.total) * 100),
      billingData: {
        first_name: order.customerName.split(' ')[0] || 'Customer',
        last_name: order.customerName.split(' ').slice(1).join(' ') || 'Kanteen',
        phone_number: order.customerPhone,
        email: order.customerEmail || 'customer@kanteen.app',
        country: 'EG',
        city: order.city,
        street: order.street,
        building: order.building || 'NA',
        floor: order.floor || 'NA',
        apartment: 'NA',
        state: order.governorate
      }
    });
    
    await prisma.order.update({
      where: { id: order.id },
      data: { paymobOrderId: String(paymobOrder.id) }
    });
    
    res.json({ iframe_url: paymobIframeUrl(paymentKey.token) });
  } catch(e){ next(e); }
});

router.post('/paymob/webhook', async (req, res, next) => {
  try {
    const { obj, hmac } = req.body;
    if(!verifyPaymobHmac(obj, hmac)){
      console.warn('⚠️ Invalid Paymob HMAC');
      return res.status(401).send('Invalid HMAC');
    }
    
    const orderCode = obj.order?.merchant_order_id;
    const success = obj.success === true;
    
    await prisma.order.updateMany({
      where: { orderCode },
      data: {
        paymentStatus: success ? 'paid' : 'failed',
        status: success ? 'confirmed' : 'placed'
      }
    });
    
    if(success){
      const order = await prisma.order.findUnique({ where: { orderCode } });
      if(order?.userId){
        await prisma.notification.create({
          data: {
            userId: order.userId,
            icon: '✅',
            title: 'تم استلام الدفع',
            body: `طلبك ${orderCode} تم تأكيده`
          }
        });
      }
    }
    
    res.status(200).send('OK');
  } catch(e){ next(e); }
});

router.get('/paymob/verify/:orderCode', requireAuth, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { orderCode: req.params.orderCode },
      select: { orderCode:true, paymentStatus:true, status:true, total:true }
    });
    if(!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch(e){ next(e); }
});

export default router;