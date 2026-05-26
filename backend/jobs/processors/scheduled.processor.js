const Task = require('../../models/Task.model');
const Event = require('../../models/Event.model');
const Notification = require('../../models/Notification.model');
const AuditLog = require('../../models/AuditLog.model');
const JOB_NAMES = require('../jobNames');
const {
  generateRecurringTask,
  scanRecurringTaskTemplates
} = require('./recurringTask.processor');

const startOfDay = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const createNotificationOnce = async ({ uniqueSince, data, recipient, type, ...payload }) => {
  const query = {
    recipient,
    type,
    createdAt: { $gte: uniqueSince || startOfDay() }
  };

  if (data?.taskId) query['data.taskId'] = data.taskId;
  if (data?.eventId) query['data.eventId'] = data.eventId;
  if (data?.clubId) query['data.clubId'] = data.clubId;

  const existingNotification = await Notification.findOne(query);
  if (existingNotification) return null;

  return Notification.createNotification({
    recipient,
    type,
    data,
    ...payload
  });
};

const scanOverdueTasks = async () => {
  const overdueTasks = await Task.find({
    status: { $ne: 'completed' },
    dueDate: { $lt: new Date() },
    isArchived: false
  }).select('title club assignedTo dueDate');

  let sentCount = 0;

  for (const task of overdueTasks) {
    for (const userId of task.assignedTo) {
      const notification = await createNotificationOnce({
        recipient: userId,
        type: 'task_overdue',
        title: 'Task Overdue',
        message: `Task "${task.title}" is overdue`,
        data: { taskId: task._id, clubId: task.club },
        priority: 'high',
        actionUrl: `/clubs/${task.club}/tasks/${task._id}`,
        uniqueSince: startOfDay()
      });

      if (notification) sentCount += 1;
    }
  }

  return { overdueTasks: overdueTasks.length, sentCount };
};

const scanDueSoonTasks = async () => {
  const now = new Date();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const tasks = await Task.find({
    status: { $ne: 'completed' },
    dueDate: { $gte: now, $lte: next24Hours },
    isArchived: false
  }).select('title club assignedTo dueDate');

  let sentCount = 0;

  for (const task of tasks) {
    for (const userId of task.assignedTo) {
      const notification = await createNotificationOnce({
        recipient: userId,
        type: 'task_due_soon',
        title: 'Task Due Soon',
        message: `Task "${task.title}" is due soon`,
        data: { taskId: task._id, clubId: task.club },
        priority: 'medium',
        actionUrl: `/clubs/${task.club}/tasks/${task._id}`,
        uniqueSince: startOfDay()
      });

      if (notification) sentCount += 1;
    }
  }

  return { dueSoonTasks: tasks.length, sentCount };
};

const scanEventReminders = async () => {
  const now = new Date();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const events = await Event.find({
    startDate: { $gte: now, $lte: next24Hours },
    isCancelled: false,
    'reminders.sent': false
  }).select('title club startDate rsvp.responses reminders');

  let sentCount = 0;

  for (const event of events) {
    const shouldSend = event.reminders.some((reminder) => {
      if (reminder.sent || reminder.type !== 'inapp') return false;
      const reminderTime = new Date(event.startDate.getTime() - reminder.beforeMinutes * 60 * 1000);
      return reminderTime <= now;
    });

    if (!shouldSend) continue;

    for (const response of event.rsvp.responses) {
      if (response.status === 'not_going') continue;

      const notification = await createNotificationOnce({
        recipient: response.user,
        type: 'event_reminder',
        title: 'Event Reminder',
        message: `"${event.title}" starts soon`,
        data: { eventId: event._id, clubId: event.club },
        priority: 'medium',
        actionUrl: `/clubs/${event.club}/events/${event._id}`,
        uniqueSince: startOfDay()
      });

      if (notification) sentCount += 1;
    }

    event.reminders.forEach((reminder) => {
      if (reminder.type === 'inapp') reminder.sent = true;
    });
    await event.save();
  }

  return { events: events.length, sentCount };
};

const cleanupOldNotifications = async () => ({
  deletedCount: await Notification.deleteOldNotifications(Number(process.env.NOTIFICATION_RETENTION_DAYS || 90))
});

const cleanupOldAuditLogs = async () => ({
  deletedCount: await AuditLog.deleteOldLogs(Number(process.env.AUDIT_LOG_RETENTION_DAYS || 365))
});

const processScheduledJob = async (job) => {
  switch (job.name) {
    case JOB_NAMES.TASK_OVERDUE_SCAN:
      return scanOverdueTasks();
    case JOB_NAMES.TASK_DUE_SOON_SCAN:
      return scanDueSoonTasks();
    case JOB_NAMES.EVENT_REMINDER_SCAN:
      return scanEventReminders();
    case JOB_NAMES.NOTIFICATION_CLEANUP:
      return cleanupOldNotifications();
    case JOB_NAMES.AUDIT_LOG_CLEANUP:
      return cleanupOldAuditLogs();
    case JOB_NAMES.TASK_RECURRING_SCAN:
      return scanRecurringTaskTemplates();
    case JOB_NAMES.TASK_RECURRING_GENERATE:
      return generateRecurringTask(job);
    default:
      throw new Error(`Unknown scheduled job: ${job.name}`);
  }
};

module.exports = processScheduledJob;
