const Notification = require('../../models/Notification.model');

const processNotificationJob = async (job) => {
  const { recipient, type, title, message } = job.data;

  if (!recipient || !type || !title || !message) {
    throw new Error('Notification job requires recipient, type, title, and message');
  }

  return Notification.createNotification(job.data);
};

module.exports = processNotificationJob;
