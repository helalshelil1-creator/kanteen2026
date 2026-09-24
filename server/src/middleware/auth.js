import jwt from 'jsonwebtoken';
import { prisma } from '../server.js';

export async function requireAuth(req, res, next){
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if(!token) return res.status(401).json({ error: 'No token' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id:true, name:true, email:true, phone:true, role:true, loyaltyPoints:true }
    });
    if(!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch(e) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireAdmin(req, res, next){
  if(req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

export function requireDriver(req, res, next){
  if(!['driver','admin'].includes(req.user?.role)) return res.status(403).json({ error: 'Driver only' });
  next();
}

export function optionalAuth(req, _res, next){
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if(token){
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = payload.id;
    }
  } catch(e){}
  next();
}