import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../server.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/* ═══════ Get chat history ═══════ */
router.get('/:roomId/history', requireAuth, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const limit = Math.min(+req.query.limit || 50, 200);
    const before = req.query.before;
    
    const where = { roomId };
    if(before) where.createdAt = { lt: new Date(before) };
    
    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    
    res.json({ messages: messages.reverse() });
  } catch(e){ next(e); }
});

/* ═══════ Send message ═══════ */
router.post('/:roomId/send', requireAuth, async (req, res, next) => {
  try {
    const { text } = z.object({
      text: z.string().min(1).max(1000)
    }).parse(req.body);
    
    const message = await prisma.chatMessage.create({
      data: {
        roomId: req.params.roomId,
        senderId: req.user.id,
        senderRole: req.user.role,
        senderName: req.user.name,
        text
      }
    });
    
    res.json({ message });
  } catch(e){ next(e); }
});

/* ═══════ Mark as read ═══════ */
router.post('/:roomId/read', requireAuth, async (req, res, next) => {
  try {
    await prisma.chatMessage.updateMany({
      where: {
        roomId: req.params.roomId,
        senderId: { not: req.user.id },
        readAt: null
      },
      data: { readAt: new Date() }
    });
    res.json({ ok: true });
  } catch(e){ next(e); }
});

export default router;