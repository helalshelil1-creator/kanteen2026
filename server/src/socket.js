import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './server.js';

let io = null;

export function initSocket(httpServer){
  io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if(!origin || origin.endsWith('.vercel.app') || origin.includes('localhost')){
          cb(null, true);
        } else {
          cb(new Error('CORS'));
        }
      },
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  /* ═══════ Auth Middleware ═══════ */
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if(token){
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = payload.id;
        socket.userRole = payload.role;
      }
      next();
    } catch(e){
      // Allow guest connections for order tracking
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id, socket.userId || 'guest');

    /* ═══════ DRIVER: Join driver room ═══════ */
    socket.on('driver:join', async ({ driverId }) => {
      socket.join(`driver:${driverId}`);
      console.log(`🚴 Driver ${driverId} joined`);
    });

    /* ═══════ DRIVER: Send location ═══════ */
    socket.on('driver:location', async ({ orderId, lat, lng, speed, heading }) => {
      if(!socket.userId) return;
      
      const loc = {
        orderId,
        driverId: socket.userId,
        lat: Number(lat),
        lng: Number(lng),
        speed: Number(speed) || 0,
        heading: Number(heading) || 0,
        ts: Date.now()
      };

      // Broadcast to order room
      io.to(`order:${orderId}`).emit('driver:location:update', loc);
      
      // Save to DB (throttled - last known position)
      try {
        await prisma.order.updateMany({
          where: { orderCode: orderId, driverId: socket.userId },
          data: {
            // You can add driverLat, driverLng fields to Order model
          }
        });
      } catch(e){}
    });

    /* ═══════ CUSTOMER: Track order ═══════ */
    socket.on('order:track', ({ orderCode }) => {
      socket.join(`order:${orderCode}`);
      console.log(`📍 Client tracking order: ${orderCode}`);
    });

    socket.on('order:untrack', ({ orderCode }) => {
      socket.leave(`order:${orderCode}`);
    });

    /* ═══════ ADMIN: Track all drivers ═══════ */
    socket.on('admin:track', () => {
      if(socket.userRole !== 'admin') return;
      socket.join('admin:drivers');
    });

    /* ═══════ CHAT: Join room ═══════ */
    socket.on('chat:join', ({ roomId }) => {
      socket.join(`chat:${roomId}`);
      console.log(`💬 Socket ${socket.id} joined chat:${roomId}`);
    });

    /* ═══════ CHAT: Send message ═══════ */
    socket.on('chat:send', async ({ roomId, text, sender }) => {
      if(!text || !text.trim()) return;
      
      const message = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        roomId,
        text: text.trim().slice(0, 1000),
        sender: sender || { id: socket.userId, role: socket.userRole || 'customer' },
        ts: Date.now()
      };

      // Broadcast to everyone in room
      io.to(`chat:${roomId}`).emit('chat:message', message);

      // Persist message (optional - add ChatMessage model to Prisma)
      try {
        // await prisma.chatMessage.create({ data: { ... }});
      } catch(e){}
    });

    /* ═══════ CHAT: Typing indicator ═══════ */
    socket.on('chat:typing', ({ roomId, isTyping }) => {
      socket.to(`chat:${roomId}`).emit('chat:typing', {
        userId: socket.userId,
        isTyping
      });
    });

    /* ═══════ CHAT: Read receipt ═══════ */
    socket.on('chat:read', ({ roomId }) => {
      socket.to(`chat:${roomId}`).emit('chat:read', { userId: socket.userId });
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO(){ return io; }
export function emitToOrder(orderCode, event, data){
  if(io) io.to(`order:${orderCode}`).emit(event, data);
}
export function emitToDriver(driverId, event, data){
  if(io) io.to(`driver:${driverId}`).emit(event, data);
}