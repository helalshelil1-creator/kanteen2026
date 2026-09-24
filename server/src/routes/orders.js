import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../server.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

const itemSchema = z.object({
  productId: z.number().int(),
  qty: z.number().int().min(1).max(99)
});

const orderSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  customerEmail: z.string().email().optional().nullable(),
  governorate: z.string().min(2),
  city: z.string().min(2),
  area: z.string().optional().nullable(),
  street: z.string().min(2),
  building: z.string().optional().nullable(),
  floor: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  paymentMethod: z.enum(['cod','card','wallet']).default('cod'),
  deliveryTime: z.enum(['asap','later']).default('asap'),
  couponCode: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1)
});

router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const data = orderSchema.parse(req.body);
    
    // Fetch products
    const productIds = data.items.map(i => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    if(products.length !== productIds.length) {
      return res.status(400).json({ error: 'بعض المنتجات غير متوفرة' });
    }
    
    // Calculate totals
    let subtotal = 0;
    const orderItemsData = data.items.map(item => {
      const p = products.find(x => x.id === item.productId);
      const price = Number(p.discount) > 0 ? Number(p.discount) : Number(p.price);
      subtotal += price * item.qty;
      return {
        productId: p.id,
        nameAr: p.nameAr,
        emoji: p.emoji,
        price: price,
        qty: item.qty
      };
    });
    
    // Coupon
    let discount = 0;
    let couponCode = null;
    if(data.couponCode){
      const coupon = await prisma.coupon.findUnique({
        where: { code: data.couponCode.toUpperCase() }
      });
      if(coupon && coupon.active && subtotal >= Number(coupon.minOrder)){
        couponCode = coupon.code;
        if(coupon.type === 'pct') {
          discount = Math.min(subtotal * Number(coupon.value) / 100, Number(coupon.maxDiscount));
        } else if(coupon.type === 'fixed') {
          discount = Math.min(Number(coupon.value), Number(coupon.maxDiscount));
        }
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } }
        });
      }
    }
    
    // Delivery
    const deliveryFee = (subtotal >= 500 || (data.couponCode === 'FREESHIP' && subtotal >= 200)) ? 0 : 25;
    
    const total = Math.max(0, subtotal + deliveryFee - discount);
    
    // Order code
    const year = new Date().getFullYear();
    const count = await prisma.order.count({ where: { orderCode: { startsWith: `KTN-${year}-` } } });
    const orderCode = `KTN-${year}-${String(count + 1).padStart(6, '0')}`;
    
    // Create order
    const order = await prisma.order.create({
      data: {
        orderCode,
        userId: req.userId || null,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        governorate: data.governorate,
        city: data.city,
        area: data.area,
        street: data.street,
        building: data.building,
        floor: data.floor,
        notes: data.notes,
        subtotal,
        deliveryFee,
        discount,
        total,
        couponCode,
        paymentMethod: data.paymentMethod,
        deliveryTime: data.deliveryTime,
        items: { create: orderItemsData }
      },
      include: { items: true }
    });
    
    // Loyalty points (1 point per 10 EGP)
    if(req.userId){
      const pts = Math.floor(total / 10);
      if(pts > 0){
        await prisma.user.update({
          where: { id: req.userId },
          data: { loyaltyPoints: { increment: pts } }
        });
        await prisma.notification.create({
          data: {
            userId: req.userId,
            icon: '🎁',
            title: `حصلت على ${pts} نقطة!`,
            body: `طلبك ${orderCode} — استمر في التسوق لجمع المزيد`
          }
        });
      }
    }
    
    res.status(201).json({ order });
  } catch(e){ next(e); }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ orders });
  } catch(e){ next(e); }
});

router.get('/:code', optionalAuth, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { orderCode: req.params.code },
      include: { items: true }
    });
    if(!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch(e){ next(e); }
});

export default router;