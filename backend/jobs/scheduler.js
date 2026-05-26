const QUEUE_NAMES = require('./queueNames');
const JOB_NAMES = require('./jobNames');
const { addJob } = require('./queueManager');
const { getJobOptions } = require('./retryStrategy');
const { logger } = require('../config/logger');

const scheduleRepeatableJobs = async () => {
  const jobs = [
    {
      queueName: QUEUE_NAMES.TASKS,
      jobName: JOB_NAMES.TASK_OVERDUE_SCAN,
      cron: process.env.OVERDUE_TASKS_CRON || '0 9 * * *'
    },
    {
      queueName: QUEUE_NAMES.TASKS,
      jobName: JOB_NAMES.TASK_DUE_SOON_SCAN,
      cron: process.env.DUE_SOON_TASKS_CRON || '0 * * * *'
    },
    {
      queueName: QUEUE_NAMES.TASKS,
      jobName: JOB_NAMES.EVENT_REMINDER_SCAN,
      cron: process.env.EVENT_REMINDERS_CRON || '0 * * * *'
    },
    {
      queueName: QUEUE_NAMES.TASKS,
      jobName: JOB_NAMES.TASK_RECURRING_SCAN,
      cron: process.env.RECURRING_TASKS_CRON || '*/15 * * * *'
    },
    {
      queueName: QUEUE_NAMES.ATTACHMENTS,
      jobName: JOB_NAMES.ATTACHMENT_SCAN_CLEANUP,
      cron: process.env.ATTACHMENT_SCAN_CLEANUP_CRON || '*/30 * * * *'
    },
    {
      queueName: QUEUE_NAMES.MAINTENANCE,
      jobName: JOB_NAMES.NOTIFICATION_CLEANUP,
      cron: process.env.NOTIFICATION_CLEANUP_CRON || '0 0 * * 0'
    },
    {
      queueName: QUEUE_NAMES.MAINTENANCE,
      jobName: JOB_NAMES.AUDIT_LOG_CLEANUP,
      cron: process.env.AUDIT_CLEANUP_CRON || '0 0 1 * *'
    }
  ];

  await Promise.all(jobs.map((job) => addJob(
    job.queueName,
    job.jobName,
    {},
    getJobOptions('scheduled', {
      jobId: job.jobName,
      repeat: { pattern: job.cron }
    })
  )));

  logger.info(`Scheduled ${jobs.length} repeatable BullMQ jobs`);
};

module.exports = {
  scheduleRepeatableJobs
};
