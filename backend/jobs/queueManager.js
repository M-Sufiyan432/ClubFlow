const { Queue, QueueEvents } = require('bullmq');
const { getRedisConnection } = require('../config/redis');
const QUEUE_NAMES = require('./queueNames');
const { logger } = require('../config/logger');

const queues = new Map();
const queueEvents = new Map();
const lastQueueErrorLogAt = new Map();

const shouldLogQueueError = (name, error) => {
  const key = `${name}:${error.code || error.message}`;
  const now = Date.now();
  const lastLoggedAt = lastQueueErrorLogAt.get(key) || 0;
  const interval = Number(process.env.QUEUE_ERROR_LOG_THROTTLE_MS || 30000);

  if (now - lastLoggedAt < interval) return false;

  lastQueueErrorLogAt.set(key, now);
  return true;
};

const logQueueError = (label, error) => {
  if (shouldLogQueueError(label, error)) {
    logger.error(`[${label}] queue connection error: ${error.message}`);
  }
};

const getQueue = (queueName) => {
  if (queues.has(queueName)) return queues.get(queueName);

  const queue = new Queue(queueName, {
    connection: getRedisConnection({ connectionName: `queue:${queueName}` }),
    defaultJobOptions: {
      removeOnComplete: {
        age: Number(process.env.JOB_COMPLETE_RETENTION_SECONDS || 86400),
        count: Number(process.env.JOB_COMPLETE_RETENTION_COUNT || 1000)
      },
      removeOnFail: false
    }
  });

  queue.on('error', (error) => logQueueError(queueName, error));

  queues.set(queueName, queue);
  return queue;
};

const getQueueEvents = (queueName) => {
  if (queueEvents.has(queueName)) return queueEvents.get(queueName);

  const events = new QueueEvents(queueName, {
    connection: getRedisConnection({ connectionName: `queue-events:${queueName}` })
  });

  events.on('error', (error) => logQueueError(`events:${queueName}`, error));

  events.on('failed', ({ jobId, failedReason }) => {
    logger.error(`[${queueName}] job ${jobId} failed: ${failedReason}`);
  });

  events.on('stalled', ({ jobId }) => {
    logger.warn(`[${queueName}] job ${jobId} stalled`);
  });

  queueEvents.set(queueName, events);
  return events;
};

const addJob = async (queueName, jobName, data, options = {}) => {
  const queue = getQueue(queueName);
  return queue.add(jobName, data, options);
};

const initializeQueues = (options = {}) => {
  const includeEvents = options.includeEvents === true;

  Object.values(QUEUE_NAMES).forEach((queueName) => {
    getQueue(queueName);
    if (includeEvents) getQueueEvents(queueName);
  });
};

const closeQueues = async () => {
  await Promise.all([...queueEvents.values()].map((events) => events.close()));
  await Promise.all([...queues.values()].map((queue) => queue.close()));
  queueEvents.clear();
  queues.clear();
};

module.exports = {
  addJob,
  closeQueues,
  getQueue,
  getQueueEvents,
  initializeQueues
};
