require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../../config/database');
const { logger } = require('../../config/logger');
const { closeRedisConnection } = require('../../config/redis');
const { initializeQueues, closeQueues } = require('../queueManager');
const { scheduleRepeatableJobs } = require('../scheduler');
const { closeWorkers, startWorkers } = require('../workerManager');

const start = async () => {
  await connectDB();
  initializeQueues({
    includeEvents: process.env.WORKER_QUEUE_EVENTS_ENABLED === 'true'
  });
  await scheduleRepeatableJobs();
  startWorkers();

  logger.info('ClubFlow worker process is running');
};

const shutdown = async (signal) => {
  logger.info(`${signal} received: shutting down workers`);
  await closeWorkers();
  await closeQueues();
  await closeRedisConnection();
  await mongoose.connection.close(false);
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (error) => {
  logger.error(`Worker unhandled rejection: ${error.message}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Worker uncaught exception: ${error.message}`);
  process.exit(1);
});

start().catch((error) => {
  logger.error(`Worker boot failed: ${error.message}`);
  process.exit(1);
});
