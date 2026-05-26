const { Worker } = require('bullmq');
const { getRedisConnection } = require('../config/redis');
const { logger } = require('../config/logger');
const QUEUE_NAMES = require('./queueNames');
const { enqueueDeadLetter } = require('./failureHandler');
const processEmailJob = require('./processors/email.processor');
const processNotificationJob = require('./processors/notification.processor');
const processAuditJob = require('./processors/audit.processor');
const processDeadLetterJob = require('./processors/deadLetter.processor');
const processScheduledJob = require('./processors/scheduled.processor');
const processTaskJob = require('./processors/task.processor');
const processAttachmentJob = require('./processors/attachmentScan.processor');

const workers = [];
const lastWorkerErrorLogAt = new Map();

const shouldLogWorkerError = (queueName, error) => {
  const key = `${queueName}:${error.code || error.message}`;
  const now = Date.now();
  const lastLoggedAt = lastWorkerErrorLogAt.get(key) || 0;
  const interval = Number(process.env.WORKER_ERROR_LOG_THROTTLE_MS || 30000);

  if (now - lastLoggedAt < interval) return false;

  lastWorkerErrorLogAt.set(key, now);
  return true;
};

const createWorker = (queueName, processor, concurrency) => {
  const worker = new Worker(queueName, processor, {
    connection: getRedisConnection({ connectionName: `worker:${queueName}` }),
    concurrency
  });

  worker.on('completed', (job) => {
    logger.info(`[${queueName}] completed ${job.name}:${job.id}`);
  });

  worker.on('failed', async (job, error) => {
    if (!job) {
      logger.error(`[${queueName}] worker failure: ${error.message}`);
      return;
    }

    logger.error(`[${queueName}] failed ${job.name}:${job.id}: ${error.message}`);
    try {
      await enqueueDeadLetter(job, error);
    } catch (deadLetterError) {
      logger.error(`[${queueName}] failed to enqueue dead-letter for ${job.name}:${job.id}: ${deadLetterError.message}`);
    }
  });

  worker.on('error', (error) => {
    if (shouldLogWorkerError(queueName, error)) {
      logger.error(`[${queueName}] worker error: ${error.message}`);
    }
  });

  workers.push(worker);
  return worker;
};

const startWorkers = () => {
  createWorker(QUEUE_NAMES.EMAIL, processEmailJob, Number(process.env.EMAIL_WORKER_CONCURRENCY || 5));
  createWorker(QUEUE_NAMES.NOTIFICATIONS, processNotificationJob, Number(process.env.NOTIFICATION_WORKER_CONCURRENCY || 10));
  createWorker(QUEUE_NAMES.AUDIT, processAuditJob, Number(process.env.AUDIT_WORKER_CONCURRENCY || 20));
  createWorker(QUEUE_NAMES.TASKS, processTaskJob, Number(process.env.TASK_WORKER_CONCURRENCY || 3));
  createWorker(QUEUE_NAMES.ATTACHMENTS, processAttachmentJob, Number(process.env.ATTACHMENT_SCAN_WORKER_CONCURRENCY || 2));
  createWorker(QUEUE_NAMES.MAINTENANCE, processScheduledJob, Number(process.env.MAINTENANCE_WORKER_CONCURRENCY || 2));
  createWorker(QUEUE_NAMES.DEAD_LETTER, processDeadLetterJob, Number(process.env.DEAD_LETTER_WORKER_CONCURRENCY || 2));

  logger.info(`Started ${workers.length} BullMQ workers`);
  return workers;
};

const closeWorkers = async () => {
  await Promise.all(workers.map((worker) => worker.close()));
  workers.length = 0;
};

module.exports = {
  closeWorkers,
  startWorkers
};
