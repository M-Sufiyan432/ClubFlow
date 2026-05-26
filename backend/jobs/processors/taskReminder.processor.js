const Task = require('../../models/Task.model');
const { createTaskReminderNotification } = require('../../services/notification.service');

const idsMatch = (left, right) => left?.toString() === right?.toString();

const processTaskReminderJob = async (job) => {
  const {
    taskId,
    userId,
    dueDate,
    reminderMinutesBefore,
    reminderKey
  } = job.data;

  if (!taskId || !userId || !dueDate || !reminderMinutesBefore || !reminderKey) {
    throw new Error('Task reminder job requires taskId, userId, dueDate, reminderMinutesBefore, and reminderKey');
  }

  const task = await Task.findById(taskId).select('title club assignedTo status dueDate isArchived');
  if (!task) {
    return { skipped: true, reason: 'task_not_found' };
  }

  if (task.isArchived || task.status === 'completed') {
    return { skipped: true, reason: 'task_inactive' };
  }

  if (!task.dueDate || new Date(task.dueDate).getTime() !== new Date(dueDate).getTime()) {
    return { skipped: true, reason: 'stale_due_date' };
  }

  if (task.dueDate <= new Date()) {
    return { skipped: true, reason: 'task_already_due' };
  }

  const isAssigned = task.assignedTo.some((assigneeId) => idsMatch(assigneeId, userId));
  if (!isAssigned) {
    return { skipped: true, reason: 'user_not_assigned' };
  }

  const notification = await createTaskReminderNotification({
    task,
    recipient: userId,
    reminderMinutesBefore,
    reminderKey
  });

  return {
    skipped: false,
    notificationId: notification?._id
  };
};

module.exports = processTaskReminderJob;
