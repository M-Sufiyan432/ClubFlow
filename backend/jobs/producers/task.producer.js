const QUEUE_NAMES = require('../queueNames');
const JOB_NAMES = require('../jobNames');
const { addJob } = require('../queueManager');
const { getJobOptions } = require('../retryStrategy');

const DEFAULT_REMINDER_OFFSETS_MINUTES = [1440, 60];

const getReminderOffsets = () => {
  const configuredOffsets = process.env.TASK_REMINDER_OFFSETS_MINUTES;
  if (!configuredOffsets) return DEFAULT_REMINDER_OFFSETS_MINUTES;

  return configuredOffsets
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((left, right) => right - left);
};

const buildTaskReminderJobId = ({ taskId, userId, dueDate, reminderMinutesBefore }) =>
  `task-reminder:${taskId}:${userId}:${new Date(dueDate).getTime()}:${reminderMinutesBefore}`;

const enqueueTaskReminder = (payload, options = {}) => addJob(
  QUEUE_NAMES.TASKS,
  JOB_NAMES.TASK_REMINDER_SEND,
  payload,
  getJobOptions('notification', {
    jobId: options.jobId,
    delay: options.delay,
    priority: options.priority || 2
  })
);

const scheduleTaskReminders = async (taskLike, options = {}) => {
  const task = typeof taskLike.toObject === 'function' ? taskLike.toObject() : taskLike;
  const dueDate = task?.dueDate ? new Date(task.dueDate) : null;
  const assigneeIds = (task?.assignedTo || []).map((assignee) => (assignee?._id || assignee).toString());

  if (!task?._id || !dueDate || Number.isNaN(dueDate.getTime()) || assigneeIds.length === 0) {
    return [];
  }

  if (task.status === 'completed' || task.isArchived || dueDate <= new Date()) {
    return [];
  }

  const now = Date.now();
  const offsets = options.reminderOffsetsMinutes || getReminderOffsets();
  const jobs = [];

  for (const reminderMinutesBefore of offsets) {
    const reminderAt = dueDate.getTime() - reminderMinutesBefore * 60 * 1000;
    if (reminderAt >= dueDate.getTime()) continue;

    for (const userId of assigneeIds) {
      const reminderKey = `${task._id}:${userId}:${dueDate.getTime()}:${reminderMinutesBefore}`;
      const payload = {
        taskId: task._id.toString(),
        userId,
        dueDate: dueDate.toISOString(),
        reminderAt: new Date(reminderAt).toISOString(),
        reminderMinutesBefore,
        reminderKey
      };

      jobs.push(enqueueTaskReminder(payload, {
        jobId: buildTaskReminderJobId({
          taskId: payload.taskId,
          userId,
          dueDate,
          reminderMinutesBefore
        }),
        delay: Math.max(0, reminderAt - now)
      }));
    }
  }

  return Promise.all(jobs);
};

const enqueueTaskOverdueScan = (options = {}) => addJob(
  QUEUE_NAMES.TASKS,
  JOB_NAMES.TASK_OVERDUE_SCAN,
  {},
  getJobOptions('scheduled', options)
);

const enqueueTaskDueSoonScan = (options = {}) => addJob(
  QUEUE_NAMES.TASKS,
  JOB_NAMES.TASK_DUE_SOON_SCAN,
  {},
  getJobOptions('scheduled', options)
);

const enqueueRecurringTaskScan = (options = {}) => addJob(
  QUEUE_NAMES.TASKS,
  JOB_NAMES.TASK_RECURRING_SCAN,
  {},
  getJobOptions('scheduled', options)
);

const buildRecurringTaskJobId = ({ taskId, occurrenceKey }) =>
  `recurring-task:${taskId}:${occurrenceKey}`;

const enqueueRecurringTaskGeneration = (payload, options = {}) => addJob(
  QUEUE_NAMES.TASKS,
  JOB_NAMES.TASK_RECURRING_GENERATE,
  payload,
  getJobOptions('scheduled', {
    jobId: options.jobId || buildRecurringTaskJobId({
      taskId: payload.taskId,
      occurrenceKey: payload.occurrenceKey
    }),
    delay: options.delay,
    priority: options.priority || 3
  })
);

module.exports = {
  enqueueRecurringTaskGeneration,
  enqueueRecurringTaskScan,
  enqueueTaskReminder,
  scheduleTaskReminders,
  enqueueTaskDueSoonScan,
  enqueueTaskOverdueScan,
  buildTaskReminderJobId,
  buildRecurringTaskJobId,
  getReminderOffsets
};
