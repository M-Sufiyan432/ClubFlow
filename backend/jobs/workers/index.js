require('dotenv').config();
require('../../config/telemetry').initTelemetry();
const { captureException, initSentry } = require('../../config/sentry');
initSentry();

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

  logger.info('worker_process.started');
};

const shutdown = async (signal) => {
  logger.info(`${signal} received: shutting down workers`);
  await closeWorkers();
  await closeQueues();
  await closeRedisConnection();
  await require('../../config/telemetry').shutdownTelemetry();
  await mongoose.connection.close(false);
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (error) => {
  logger.error('worker_process.unhandled_rejection', { error: error.message, stack: error.stack });
  captureException(error);
});

process.on('uncaughtException', (error) => {
  logger.error('worker_process.uncaught_exception', { error: error.message, stack: error.stack });
  captureException(error);
  process.exit(1);
});

start().catch((error) => {
  logger.error('worker_process.boot_failed', { error: error.message, stack: error.stack });
  captureException(error);
  process.exit(1);
});
