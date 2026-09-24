import { Router } from 'express';
import { prisma } from '../server.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

/* ═══════ Cohort Analysis ═══════ */
router.get('/cohorts', async (_req, res, next) => {
  try {
    // Users grouped by signup month + their orders by month
    const users = await prisma.$queryRaw`
      SELECT 
        u.id,
        DATE_TRUNC('month', u."createdAt") as signup_month,
        DATE_TRUNC('month', o."createdAt") as order_month
      FROM "User" u
      LEFT JOIN "Order" o ON o."userId" = u.id
      WHERE u.role = 'customer'
      ORDER BY u."createdAt"
    `;
    
    // Build cohort matrix
    const cohorts = {};
    users.forEach(row => {
      const signup = row.signup_month ? new Date(row.signup_month).toISOString().slice(0, 7) : null;
      if(!signup) return;
      if(!cohorts[signup]) cohorts[signup] = { signup, users: new Set(), orders: {} };
      cohorts[signup].users.add(row.id);
      if(row.order_month){
        const om = new Date(row.order_month).toISOString().slice(0, 7);
        cohorts[signup].orders[om] = (cohorts[signup].orders[om] || 0) + 1;
      }
    });
    
    const result = Object.values(cohorts).map(c => {
      const size = c.users.size;
      const retention = {};
      const signupDate = new Date(c.signup + '-01');
      for(let i = 0; i < 12; i++){
        const d = new Date(signupDate);
        d.setMonth(d.getMonth() + i);
        const monthKey = d.toISOString().slice(0, 7);
        const count = c.orders[monthKey] || 0;
        retention[monthKey] = size ? +((count / size) * 100).toFixed(1) : 0;
      }
      return {
        signup: c.signup,
        size,
        retention
      };
    });
    
    res.json({ cohorts: result });
  } catch(e){ next(e); }
});

/* ═══════ LTV per Customer ═══════ */
router.get('/ltv', async (_req, res, next) => {
  try {
    const ltv = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(o.id)::int as order_count,
        COALESCE(SUM(o.total), 0)::float as total_spent,
        CASE WHEN COUNT(o.id) > 0 
          THEN (SUM(o.total) / COUNT(o.id))::float 
          ELSE 0 END as avg_order_value,
        MAX(o."createdAt") as last_order
      FROM "User" u
      LEFT JOIN "Order" o ON o."userId" = u.id
      WHERE u.role = 'customer'
      GROUP BY u.id, u.name, u.email
      ORDER BY total_spent DESC
      LIMIT 100
    `;
    res.json({ customers: ltv });
  } catch(e){ next(e); }
});

/* ═══════ Retention Curve ═══════ */
router.get('/retention', async (_req, res, next) => {
  try {
    const data = await prisma.$queryRaw`
      WITH user_first_order AS (
        SELECT "userId", MIN("createdAt") as first_order
        FROM "Order"
        WHERE "userId" IS NOT NULL
        GROUP BY "userId"
      ),
      user_orders AS (
        SELECT 
          o."userId",
          uf.first_order,
          o."createdAt" as order_date,
          EXTRACT(DAY FROM (o."createdAt" - uf.first_order))::int as days_since_first
        FROM "Order" o
        JOIN user_first_order uf ON uf."userId" = o."userId"
      )
      SELECT 
        CASE
          WHEN days_since_first = 0 THEN 'Day 0'
          WHEN days_since_first BETWEEN 1 AND 7 THEN 'Week 1'
          WHEN days_since_first BETWEEN 8 AND 30 THEN 'Month 1'
          WHEN days_since_first BETWEEN 31 AND 90 THEN 'Month 3'
          ELSE 'Month 6+'
        END as period,
        COUNT(DISTINCT "userId")::int as users
      FROM user_orders
      GROUP BY period
      ORDER BY MIN(days_since_first)
    `;
    res.json({ retention: data });
  } catch(e){ next(e); }
});

/* ═══════ Top Products ═══════ */
router.get('/top-products', async (_req, res, next) => {
  try {
    const top = await prisma.$queryRaw`
      SELECT 
        p.id,
        p."nameAr",
        p.emoji,
        p.brand,
        SUM(oi.qty)::int as total_sold,
        SUM(oi.qty * oi.price)::float as revenue
      FROM "OrderItem" oi
      JOIN "Product" p ON p.id = oi."productId"
      JOIN "Order" o ON o.id = oi."orderId"
      WHERE o.status != 'cancelled'
      GROUP BY p.id, p."nameAr", p.emoji, p.brand
      ORDER BY total_sold DESC
      LIMIT 20
    `;
    res.json({ products: top });
  } catch(e){ next(e); }
});

/* ═══════ Hourly/Daily Heatmap ═══════ */
router.get('/heatmap', async (_req, res, next) => {
  try {
    const data = await prisma.$queryRaw`
      SELECT
        EXTRACT(DOW FROM "createdAt")::int as day_of_week,
        EXTRACT(HOUR FROM "createdAt")::int as hour,
        COUNT(*)::int as orders
      FROM "Order"
      GROUP BY day_of_week, hour
      ORDER BY day_of_week, hour
    `;
    res.json({ heatmap: data });
  } catch(e){ next(e); }
});

/* ═══════ Funnel Analysis ═══════ */
router.get('/funnel', async (_req, res, next) => {
  try {
    const [totalVisits, totalCarts, totalCheckouts, totalOrders] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(DISTINCT id)::int FROM "User"`,
      prisma.$queryRaw`SELECT COUNT(DISTINCT id)::int FROM "User" WHERE id IN (SELECT DISTINCT "userId" FROM "Order")`,
      prisma.$queryRaw`SELECT COUNT(*)::int FROM "Order"`,
      prisma.$queryRaw`SELECT COUNT(*)::int FROM "Order" WHERE status != 'cancelled'`
    ]);
    
    res.json({
      funnel: [
        { stage: 'زيارات', count: totalVisits[0].count, pct: 100 },
        { stage: 'أضاف للسلة', count: totalCarts[0].count, pct: (totalCarts[0].count / totalVisits[0].count * 100).toFixed(1) },
        { stage: 'بدأ الشراء', count: totalCheckouts[0].count, pct: (totalCheckouts[0].count / totalVisits[0].count * 100).toFixed(1) },
        { stage: 'أكمل الطلب', count: totalOrders[0].count, pct: (totalOrders[0].count / totalVisits[0].count * 100).toFixed(1) }
      ]
    });
  } catch(e){ next(e); }
});

export default router;