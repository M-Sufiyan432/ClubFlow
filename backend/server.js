const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');

// Load environment variables
dotenv.config();

// Import configuration
const connectDB = require('./config/database');
const { logger, morganStream } = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const clubRoutes = require('./routes/club.routes');
const taskRoutes = require('./routes/task.routes');
const eventRoutes = require('./routes/event.routes');
const notificationRoutes = require('./routes/notification.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const adminRoutes = require('./routes/admin.routes');
const { protect } = require('./middleware/auth');
const { getAllTasks } = require('./controllers/task.controller');
const { getDashboardData } = require('./controllers/analytics.controller');

// Import Socket handlers
const socketHandler = require('./socket/socketHandler');

// Import cron jobs
const cronJobs = require('./utils/cronJobs');
const {
  closeQueues,
  closeRedisConnection,
  initializeQueues,
  isQueueEnabled
} = require('./jobs');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Trust the first proxy so rate limiting and auth logs use the real client IP.
app.set('trust proxy', parseInt(process.env.TRUST_PROXY || '1', 10));

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Connect to Database
connectDB();

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Data Sanitization
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP parameter pollution

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: morganStream }));
}

// Session configuration (for OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'clubflow-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

// Rate Limiting
app.use('/api/', rateLimiter);

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ClubFlow API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/tasks', taskRoutes);
app.get('/api/getAllTask', protect, getAllTasks);
app.get('/api/getAllTasks', protect, getAllTasks);
app.get('/api/dashboard', protect, getDashboardData);
app.use('/api/events', eventRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Error Handler (must be last)
app.use(errorHandler);

// Socket.IO Handler
socketHandler(io);

if (isQueueEnabled()) {
  initializeQueues({
    includeEvents: process.env.API_QUEUE_EVENTS_ENABLED === 'true'
  });
  logger.info('BullMQ producers initialized. Start workers with npm run worker.');
} else {
  cronJobs.startCronJobs(io);
}

// Server Configuration
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`🚀 ClubFlow Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
  logger.info(`🔌 Socket.IO server initialized`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    logger.info('HTTP server closed');
    await closeQueues();
    await closeRedisConnection();
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = { app, server, io };
