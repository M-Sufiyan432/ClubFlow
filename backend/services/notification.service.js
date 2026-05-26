const Notification = require('../models/Notification.model');

const createNotificationOnce = async ({ uniqueQuery = {}, ...payload }) => {
  const existingNotification = await Notification.findOne(uniqueQuery);
  if (existingNotification) return existingNotification;

  return Notification.createNotification(payload);
};

const createTaskReminderNotification = async ({ task, recipient, reminderMinutesBefore, reminderKey }) => {
  const dueDate = new Date(task.dueDate);

  return createNotificationOnce({
    recipient,
    type: 'task_due_soon',
    title: 'Task Reminder',
    message: `Task "${task.title}" is due at ${dueDate.toLocaleString()}`,
    data: {
      taskId: task._id,
      clubId: task.club,
      metadata: {
        reminderKey,
        reminderMinutesBefore,
        dueDate: dueDate.toISOString()
      }
    },
    priority: reminderMinutesBefore <= 60 ? 'high' : 'medium',
    actionUrl: `/clubs/${task.club}/tasks/${task._id}`,
    uniqueQuery: {
      recipient,
      type: 'task_due_soon',
      'data.taskId': task._id,
      'data.metadata.reminderKey': reminderKey
    }
  });
};

module.exports = {
  createNotificationOnce,
  createTaskReminderNotification
};
