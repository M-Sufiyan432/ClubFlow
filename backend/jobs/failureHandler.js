const QUEUE_NAMES = require('./queueNames');
const JOB_NAMES = require('./jobNames');
const { addJob } = require('./queueManager');
const { getJobOptions } = require('./retryStrategy');
const { logger } = require('../config/logger');

const shouldDeadLetter = (job) => {
  const maxAttempts = Number(job.opts.attempts || 1);
  return job.attemptsMade >= maxAttempts;
};

const enqueueDeadLetter = async (job, error) => {
  if (!shouldDeadLetter(job)) return;

  const payload = {
    queueName: job.queueName,
    jobName: job.name,
    jobId: String(job.id),
    attemptsMade: job.attemptsMade,
    failedReason: error?.message || job.failedReason,
    stacktrace: job.stacktrace,
    payload: job.data,
    failedAt: new Date().toISOString()
  };

  await addJob(
    QUEUE_NAMES.DEAD_LETTER,
    JOB_NAMES.DEAD_LETTER_CAPTURE,
    payload,
    getJobOptions('deadLetter', {
      jobId: `${payload.queueName}:${payload.jobId}`
    })
  );

  logger.error(`[${job.queueName}] job ${job.id} moved to dead-letter queue`);
};

module.exports = {
  enqueueDeadLetter,
  shouldDeadLetter
};
