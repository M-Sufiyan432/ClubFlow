const { logger } = require('../config/logger');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

module.exports = (io) => {
  // Authentication middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      logger.error(`Socket Auth Error: ${error.message}`);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.user.email}`);

    // Join user's personal room
    socket.join(`user_${socket.user._id}`);

    // Join club rooms
    socket.user.clubs.forEach(club => {
      socket.join(`club_${club.club}`);
    });

    // Join club room
    socket.on('join_club', (payload) => {
      const clubId = typeof payload === 'object' ? payload?.clubId : payload;
      if (!clubId) return;

      socket.join(`club_${clubId}`);
      socket.emit('room_joined', { clubId });
      logger.info(`User ${socket.user.email} joined club ${clubId}`);
    });

    // Leave club room
    socket.on('leave_club', (payload) => {
      const clubId = typeof payload === 'object' ? payload?.clubId : payload;
      if (!clubId) return;

      socket.leave(`club_${clubId}`);
      logger.info(`User ${socket.user.email} left club ${clubId}`);
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
      socket.to(`task_${data.taskId}`).emit('user_typing', {
        userId: socket.user._id,
        userName: socket.user.name,
        taskId: data.taskId
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(`task_${data.taskId}`).emit('user_stopped_typing', {
        userId: socket.user._id,
        taskId: data.taskId
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.user.email}`);
    });
  });

  logger.info('Socket.IO initialized');
};
