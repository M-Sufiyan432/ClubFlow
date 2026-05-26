const QUEUE_NAMES = require('../queueNames');
const JOB_NAMES = require('../jobNames');
const { addJob } = require('../queueManager');
const { getJobOptions } = require('../retryStrategy');

const enqueueAuditLog = (payload, options = {}) => addJob(
  QUEUE_NAMES.AUDIT,
  JOB_NAMES.AUDIT_LOG_CREATE,
  payload,
  getJobOptions('audit', {
    jobId: options.jobId,
    delay: options.delay,
    priority: options.priority || 4
  })
);

module.exports = {
  enqueueAuditLog
};
