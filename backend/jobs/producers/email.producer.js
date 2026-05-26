const QUEUE_NAMES = require('../queueNames');
const JOB_NAMES = require('../jobNames');
const { addJob } = require('../queueManager');
const { getJobOptions } = require('../retryStrategy');

const enqueueEmail = (payload, options = {}) => addJob(
  QUEUE_NAMES.EMAIL,
  JOB_NAMES.EMAIL_SEND,
  payload,
  getJobOptions('email', {
    jobId: options.jobId,
    delay: options.delay,
    priority: options.priority || 2
  })
);

module.exports = {
  enqueueEmail
};
