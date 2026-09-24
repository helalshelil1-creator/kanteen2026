import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import couponRoutes from './routes/coupons.js';
import reviewRoutes from './routes/reviews.js';
import adminRoutes from './routes/admin.js';

import { errorHandler, notFound } from './middleware/error.js';
import { apiLimiter } from './middleware/rateLimit.js';

dotenv.config();

const app = express();
export const prisma = new PrismaClient();

/* ═══════ SECURITY ═══════ */
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

/* ═══════ CORS ═══════ */
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if(!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')){
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

/* ═══════ BODY PARSERS ═══════ */
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

/* ═══════ RATE LIMIT ═══════ */
app.use('/api', apiLimiter);

/* ═══════ HEALTH CHECK ═══════ */
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, ts: Date.now(), db: 'connected' });
  } catch(e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* ═══════ ROUTES ═══════ */
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

/* ═══════ 404 + ERROR ═══════ */
app.use(notFound);
app.use(errorHandler);

/* ═══════ START ═══════ */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Kanteen API running on :${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌍 CORS allowed: ${allowedOrigins.join(', ')}`);
});

/* ═══════ GRACEFUL SHUTDOWN ═══════ */
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing...');
  await prisma.$disconnect();
  process.exit(0);
});