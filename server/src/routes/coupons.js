import { Router } from 'express';
import { prisma } from '../server.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { validFrom: 'desc' } });
    res.json({ coupons });
  } catch(e){ next(e); }
});

router.post('/validate', async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    if(!code) return res.status(400).json({ error: 'Code required' });
    
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });
    
    if(!coupon || !coupon.active){
      return res.status(404).json({ error: 'كود غير صحيح' });
    }
    if(coupon.validUntil && new Date(coupon.validUntil) < new Date()){
      return res.status(400).json({ error: 'انتهت صلاحية الكود' });
    }
    if(subtotal && subtotal < Number(coupon.minOrder)){
      return res.status(400).json({ error: `الحد الأدنى ${coupon.minOrder} ج.م` });
    }
    if(coupon.usageLimit && coupon.usedCount >= coupon.usageLimit){
      return res.status(400).json({ error: 'تم استنفاد الكود' });
    }
    
    let discount = 0;
    if(coupon.type === 'pct') discount = Math.min(subtotal * Number(coupon.value) / 100, Number(coupon.maxDiscount));
    else if(coupon.type === 'fixed') discount = Math.min(Number(coupon.value), Number(coupon.maxDiscount));
    else if(coupon.type === 'ship') discount = 25;
    
    res.json({ coupon, discount });
  } catch(e){ next(e); }
});

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const coupon = await prisma.coupon.create({ data: req.body });
    res.status(201).json({ coupon });
  } catch(e){ next(e); }
});

export default router;