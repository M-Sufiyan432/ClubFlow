const QUEUE_NAMES = require('../queueNames');
const JOB_NAMES = require('../jobNames');
const { addJob } = require('../queueManager');
const { getJobOptions } = require('../retryStrategy');

const enqueueNotification = (payload, options = {}) => addJob(
  QUEUE_NAMES.NOTIFICATIONS,
  JOB_NAMES.NOTIFICATION_CREATE,
  payload,
  getJobOptions('notification', {
    jobId: options.jobId,
    delay: options.delay,
    priority: options.priority || 3
  })
);

const enqueueNotifications = (items = []) =>
  Promise.all(items.map(({ payload, options }) => enqueueNotification(payload, options)));

module.exports = {
  enqueueNotification,
  enqueueNotifications
};
