const cron = require('cron');
const Task = require('../models/Task.model');
const Event = require('../models/Event.model');
const Notification = require('../models/Notification.model');
const AuditLog = require('../models/AuditLog.model');
const { logger } = require('../config/logger');

let notificationIo = null;

const startOfDay = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const endOfDay = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

const emitUserNotification = (userId, notification) => {
  if (notificationIo && notification) {
    notificationIo.to(`user_${userId}`).emit('notificationCreated', notification);
  }
};

const createNotificationOnce = async ({ recipient, type, data, uniqueSince, ...payload }) => {
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

  const notification = await Notification.createNotification({
    recipient,
    type,
    data,
    ...payload
  });

  emitUserNotification(recipient, notification);
  return notification;
};

// Check for overdue tasks daily
const checkOverdueTasks = new cron.CronJob('0 9 * * *', async () => {
  try {
    logger.info('Running overdue tasks check...');
    
    const overdueTasks = await Task.find({
      status: { $ne: 'completed' },
      dueDate: { $lt: new Date() },
      isArchived: false
    }).populate('assignedTo');

    for (const task of overdueTasks) {
      for (const userId of task.assignedTo) {
        await createNotificationOnce({
          recipient: userId,
          type: 'task_overdue',
          title: 'Task Overdue',
          message: `Task "${task.title}" is overdue`,
          data: { taskId: task._id, clubId: task.club },
          priority: 'high',
          actionUrl: `/clubs/${task.club}/tasks/${task._id}`,
          uniqueSince: startOfDay()
        });
      }
    }

    logger.info(`Sent notifications for ${overdueTasks.length} overdue tasks`);
  } catch (error) {
    logger.error(`Overdue tasks check error: ${error.message}`);
  }
});

// Notify users for tasks due in the next 24 hours
const sendTaskDueSoonNotifications = new cron.CronJob('0 * * * *', async () => {
  try {
    logger.info('Running due-soon task notifications...');

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const dueSoonTasks = await Task.find({
      status: { $ne: 'completed' },
      dueDate: { $gte: now, $lte: in24Hours },
      isArchived: false
    }).select('title club assignedTo dueDate');

    let sentCount = 0;

    for (const task of dueSoonTasks) {
      for (const userId of task.assignedTo) {
        const notification = await createNotificationOnce({
          recipient: userId,
          type: 'task_due_soon',
          title: 'Task Due Soon',
          message: `Task "${task.title}" is due within 24 hours`,
          data: { taskId: task._id, clubId: task.club },
          priority: 'medium',
          actionUrl: `/clubs/${task.club}/tasks/${task._id}`,
          uniqueSince: startOfDay()
        });

        if (notification) sentCount += 1;
      }
    }

    logger.info(`Sent ${sentCount} due-soon task notifications`);
  } catch (error) {
    logger.error(`Due-soon task notifications error: ${error.message}`);
  }
});

// Send event reminders
const sendEventReminders = new cron.CronJob('0 * * * *', async () => {
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingEvents = await Event.find({
      startDate: { $gte: now, $lte: in24Hours },
      isCancelled: false
    }).select('title club startDate rsvp.responses reminders');

    let sentCount = 0;

    for (const event of upcomingEvents) {
      for (const rsvp of event.rsvp.responses) {
        if (rsvp.status === 'going') {
          const notification = await createNotificationOnce({
            recipient: rsvp.user,
            type: 'event_reminder',
            title: 'Event Reminder',
            message: `"${event.title}" starts in 24 hours`,
            data: { eventId: event._id, clubId: event.club },
            priority: 'medium',
            actionUrl: `/clubs/${event.club}/events/${event._id}`,
            uniqueSince: startOfDay()
          });

          if (notification) sentCount += 1;
        }
      }

      if (event.reminders.length > 0) {
        event.reminders.forEach((reminder) => {
          reminder.sent = true;
        });
        await event.save();
      }
    }

    logger.info(`Sent ${sentCount} event reminder notifications for ${upcomingEvents.length} events`);
  } catch (error) {
    logger.error(`Event reminders error: ${error.message}`);
  }
});

// Clean old notifications weekly
const cleanOldNotifications = new cron.CronJob('0 0 * * 0', async () => {
  try {
    const deletedCount = await Notification.deleteOldNotifications(90);
    logger.info(`Deleted ${deletedCount} old notifications`);
  } catch (error) {
    logger.error(`Clean notifications error: ${error.message}`);
  }
});

// Clean old audit logs monthly
const cleanOldAuditLogs = new cron.CronJob('0 0 1 * *', async () => {
  try {
    const deletedCount = await AuditLog.deleteOldLogs(365);
    logger.info(`Deleted ${deletedCount} old audit logs`);
  } catch (error) {
    logger.error(`Clean audit logs error: ${error.message}`);
  }
});

const sendDailyNotificationDigest = new cron.CronJob('30 8 * * *', async () => {
  try {
    logger.info('Running daily notification digest...');

    const tomorrow = endOfDay(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const taskCounts = await Task.aggregate([
      {
        $match: {
          status: { $ne: 'completed' },
          dueDate: { $lte: tomorrow },
          isArchived: false
        }
      },
      { $unwind: '$assignedTo' },
      {
        $group: {
          _id: '$assignedTo',
          count: { $sum: 1 }
        }
      }
    ]);

    let sentCount = 0;

    for (const item of taskCounts) {
      const notification = await createNotificationOnce({
        recipient: item._id,
        type: 'system',
        title: 'Daily Work Digest',
        message: `You have ${item.count} task${item.count === 1 ? '' : 's'} due or overdue soon`,
        data: { metadata: { taskCount: item.count } },
        priority: item.count > 3 ? 'high' : 'medium',
        actionUrl: '/tasks',
        uniqueSince: startOfDay()
      });

      if (notification) sentCount += 1;
    }

    logger.info(`Sent ${sentCount} daily digest notifications`);
  } catch (error) {
    logger.error(`Daily notification digest error: ${error.message}`);
  }
});

const startCronJobs = (io) => {
  notificationIo = io || notificationIo;
  checkOverdueTasks.start();
  sendTaskDueSoonNotifications.start();
  sendEventReminders.start();
  sendDailyNotificationDigest.start();
  cleanOldNotifications.start();
  cleanOldAuditLogs.start();
  logger.info('Cron jobs started');
};

module.exports = { startCronJobs };
