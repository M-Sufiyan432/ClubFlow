const JOB_NAMES = require('../jobNames');
const processScheduledJob = require('./scheduled.processor');
const processTaskReminderJob = require('./taskReminder.processor');

const processTaskJob = async (job) => {
  if (job.name === JOB_NAMES.TASK_REMINDER_SEND) {
    return processTaskReminderJob(job);
  }

  return processScheduledJob(job);
};

module.exports = processTaskJob;
