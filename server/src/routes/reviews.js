import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../server.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/product/:productId', async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: +req.params.productId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json({ reviews });
  } catch(e){ next(e); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = z.object({
      productId: z.number().int(),
      rating: z.number().int().min(1).max(5),
      text: z.string().min(3).max(1000)
    }).parse(req.body);
    
    const review = await prisma.review.upsert({
      where: { productId_userId: { productId: data.productId, userId: req.user.id } },
      update: { rating: data.rating, text: data.text },
      create: { ...data, userId: req.user.id },
      include: { user: { select: { name: true } } }
    });
    
    // Recalc product rating
    const agg = await prisma.review.aggregate({
      where: { productId: data.productId },
      _avg: { rating: true },
      _count: { rating: true }
    });
    await prisma.product.update({
      where: { id: data.productId },
      data: {
        rating: agg._avg.rating || 0,
        reviews: agg._count.rating
      }
    });
    
    res.status(201).json({ review });
  } catch(e){ next(e); }
});

export default router;