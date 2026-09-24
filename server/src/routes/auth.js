import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../server.js';
import { hashPassword, comparePassword, generateReferralCode } from '../utils/hash.js';
import { signToken } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  phone: z.string().min(8).max(20).optional(),
  password: z.string().min(6).max(100),
  referralCode: z.string().optional()
});

router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if(exists) return res.status(409).json({ error: 'البريد مسجل بالفعل' });
    
    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        referralCode: generateReferralCode(),
        referredBy: data.referralCode || null
      },
      select: { id:true, name:true, email:true, phone:true, role:true, referralCode:true, loyaltyPoints:true }
    });
    
    const token = signToken(user);
    res.status(201).json({ user, token });
  } catch(e){ next(e); }
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1)
});

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if(!user) return res.status(401).json({ error: 'بيانات خاطئة' });
    
    const ok = await comparePassword(data.password, user.passwordHash);
    if(!ok) return res.status(401).json({ error: 'بيانات خاطئة' });
    
    const token = signToken(user);
    const { passwordHash, ...safe } = user;
    res.json({ user: safe, token });
  } catch(e){ next(e); }
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const data = z.object({
      name: z.string().min(2).optional(),
      phone: z.string().min(8).optional()
    }).parse(req.body);
    
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id:true, name:true, email:true, phone:true, role:true, loyaltyPoints:true }
    });
    res.json({ user });
  } catch(e){ next(e); }
});

export default router;