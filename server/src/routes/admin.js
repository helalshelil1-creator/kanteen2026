import { Router } from 'express';
import { prisma } from '../server.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/stats', async (_req, res, next) => {
  try {
    const [totalOrders, revenue, totalUsers, totalProducts, ordersByStatus] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'cancelled' } } }),
      prisma.user.count({ where: { role: 'customer' } }),
      prisma.product.count(),
      prisma.order.groupBy({ by: ['status'], _count: true })
    ]);
    
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { items: true }
    });
    
    const last7Days = await prisma.$queryRaw`
      SELECT DATE(created_at) as day, SUM(total)::float as revenue, COUNT(*)::int as orders
      FROM "Order"
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY day
    `;
    
    res.json({
      totalOrders,
      revenue: revenue._sum.total || 0,
      totalUsers,
      totalProducts,
      ordersByStatus,
      recentOrders,
      last7Days
    });
  } catch(e){ next(e); }
});

router.patch('/orders/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['placed','confirmed','preparing','out','delivered','cancelled'];
    if(!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status }
    });
    
    if(order.userId){
      await prisma.notification.create({
        data: {
          userId: order.userId,
          icon: '📦',
          title: `تحديث طلبك ${order.orderCode}`,
          body: `الحالة الجديدة: ${status}`
        }
      });
    }
    res.json({ order });
  } catch(e){ next(e); }
});

router.post('/products', async (req, res, next) => {
  try {
    const product = await prisma.product.create({ data: req.body });
    res.status(201).json({ product });
  } catch(e){ next(e); }
});

router.patch('/products/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.update({
      where: { id: +req.params.id },
      data: req.body
    });
    res.json({ product });
  } catch(e){ next(e); }
});

router.delete('/products/:id', async (req, res, next) => {
  try {
    await prisma.product.delete({ where: { id: +req.params.id } });
    res.json({ ok: true });
  } catch(e){ next(e); }
});

export default router;