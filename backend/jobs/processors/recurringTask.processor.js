const Task = require('../../models/Task.model');
const { enqueueRecurringTaskGeneration, scheduleTaskReminders } = require('../producers/task.producer');
const { logger } = require('../../config/logger');

const VALID_FREQUENCIES = ['daily', 'weekly', 'monthly'];

const occurrenceKeyForDate = (date) => new Date(date).toISOString().slice(0, 10);

const addMonthsClamped = (date, months) => {
  const value = new Date(date);
  const day = value.getDate();

  value.setDate(1);
  value.setMonth(value.getMonth() + months);

  const daysInTargetMonth = new Date(value.getFullYear(), value.getMonth() + 1, 0).getDate();
  value.setDate(Math.min(day, daysInTargetMonth));

  return value;
};

const addInterval = (date, frequency, interval = 1) => {
  const value = new Date(date);
  const safeInterval = Math.max(Number(interval) || 1, 1);

  if (frequency === 'daily') {
    value.setDate(value.getDate() + safeInterval);
    return value;
  }

  if (frequency === 'weekly') {
    value.setDate(value.getDate() + safeInterval * 7);
    return value;
  }

  if (frequency === 'monthly') {
    return addMonthsClamped(value, safeInterval);
  }

  throw new Error(`Unsupported recurrence frequency: ${frequency}`);
};

const getNextOccurrenceDate = (task, now = new Date()) => {
  const frequency = task.recurrence?.frequency;
  const interval = task.recurrence?.interval || 1;

  if (!VALID_FREQUENCIES.includes(frequency)) return null;
  if (!task.dueDate) return null;

  let nextDate = task.recurrence?.nextRunAt
    ? new Date(task.recurrence.nextRunAt)
    : addInterval(task.dueDate, frequency, interval);

  let guard = 0;
  while (nextDate <= now && guard < 500) {
    nextDate = addInterval(nextDate, frequency, interval);
    guard += 1;
  }

  if (task.recurrence?.endDate && nextDate > new Date(task.recurrence.endDate)) {
    return null;
  }

  return nextDate;
};

const scanRecurringTaskTemplates = async () => {
  const now = new Date();
  const limit = Number(process.env.RECURRING_TASK_SCAN_LIMIT || 100);

  const templates = await Task.find({
    isRecurring: true,
    isArchived: false,
    dueDate: { $exists: true, $ne: null },
    'recurrence.frequency': { $in: VALID_FREQUENCIES },
    $or: [
      { 'recurrence.parentTask': { $exists: false } },
      { 'recurrence.parentTask': null }
    ],
    $and: [
      {
        $or: [
          { 'recurrence.endDate': { $exists: false } },
          { 'recurrence.endDate': null },
          { 'recurrence.endDate': { $gte: now } }
        ]
      },
      {
        $or: [
          { 'recurrence.nextRunAt': { $lte: now } },
          {
            dueDate: { $lte: now },
            $or: [
              { 'recurrence.nextRunAt': { $exists: false } },
              { 'recurrence.nextRunAt': null }
            ]
          }
        ]
      }
    ]
  })
    .select('dueDate recurrence isRecurring isArchived')
    .sort({ 'recurrence.nextRunAt': 1, dueDate: 1 })
    .limit(limit)
    .lean();

  const queuedJobs = [];

  for (const template of templates) {
    const nextDueDate = getNextOccurrenceDate(template, now);
    if (!nextDueDate) continue;

    const occurrenceKey = occurrenceKeyForDate(nextDueDate);
    queuedJobs.push(enqueueRecurringTaskGeneration({
      taskId: template._id.toString(),
      nextDueDate: nextDueDate.toISOString(),
      occurrenceKey
    }));
  }

  await Promise.all(queuedJobs);

  return {
    scanned: templates.length,
    queued: queuedJobs.length
  };
};

const buildRecurringTaskPayload = (sourceTask, nextDueDate, occurrenceKey) => ({
  title: sourceTask.title,
  description: sourceTask.description,
  club: sourceTask.club,
  createdBy: sourceTask.createdBy,
  assignedTo: sourceTask.assignedTo,
  priority: sourceTask.priority,
  status: 'todo',
  dueDate: nextDueDate,
  tags: sourceTask.tags,
  attachments: [],
  isRecurring: false,
  recurrence: {
    frequency: sourceTask.recurrence.frequency,
    interval: sourceTask.recurrence.interval,
    endDate: sourceTask.recurrence.endDate,
    parentTask: sourceTask._id,
    rootTask: sourceTask.recurrence.rootTask || sourceTask._id,
    occurrenceKey
  },
  dependencies: sourceTask.dependencies,
  subtasks: sourceTask.subtasks.map((subtask) => ({
    title: subtask.title,
    completed: false
  })),
  estimatedHours: sourceTask.estimatedHours,
  history: [{
    user: sourceTask.createdBy,
    action: 'created',
    field: 'recurrence.parentTask',
    oldValue: sourceTask._id,
    newValue: occurrenceKey,
    timestamp: new Date()
  }]
});

const generateRecurringTask = async (job) => {
  const { taskId, nextDueDate, occurrenceKey } = job.data;
  if (!taskId || !nextDueDate || !occurrenceKey) {
    throw new Error('Recurring task generation requires taskId, nextDueDate, and occurrenceKey');
  }

  const sourceTask = await Task.findById(taskId);
  if (!sourceTask || !sourceTask.isRecurring || sourceTask.isArchived) {
    return { created: false, reason: 'source task not found or inactive' };
  }

  if (!VALID_FREQUENCIES.includes(sourceTask.recurrence?.frequency)) {
    return { created: false, reason: 'unsupported recurrence frequency' };
  }

  const dueDate = new Date(nextDueDate);
  if (Number.isNaN(dueDate.getTime())) {
    throw new Error('Recurring task nextDueDate is invalid');
  }

  if (sourceTask.recurrence?.endDate && dueDate > new Date(sourceTask.recurrence.endDate)) {
    return { created: false, reason: 'recurrence ended' };
  }

  const existingTask = await Task.findOne({
    'recurrence.parentTask': sourceTask._id,
    'recurrence.occurrenceKey': occurrenceKey
  }).select('_id');

  if (existingTask) {
    return { created: false, duplicate: true, taskId: existingTask._id };
  }

  let task;
  try {
    task = await Task.create(buildRecurringTaskPayload(sourceTask, dueDate, occurrenceKey));
  } catch (error) {
    if (error.code === 11000) {
      const duplicate = await Task.findOne({
        'recurrence.parentTask': sourceTask._id,
        'recurrence.occurrenceKey': occurrenceKey
      }).select('_id');
      return { created: false, duplicate: true, taskId: duplicate?._id };
    }

    throw error;
  }

  const candidateFollowingRunAt = addInterval(dueDate, sourceTask.recurrence.frequency, sourceTask.recurrence.interval);
  const followingRunAt = sourceTask.recurrence?.endDate && candidateFollowingRunAt > new Date(sourceTask.recurrence.endDate)
    ? null
    : candidateFollowingRunAt;

  await Task.updateOne(
    { _id: sourceTask._id },
    {
      $set: {
        'recurrence.lastGeneratedAt': new Date(),
        'recurrence.nextRunAt': followingRunAt
      }
    }
  );

  try {
    await scheduleTaskReminders(task);
  } catch (error) {
    logger.error(`Recurring task reminder scheduling error: ${error.message}`);
  }

  return { created: true, taskId: task._id, occurrenceKey, nextRunAt: followingRunAt };
};

module.exports = {
  addInterval,
  generateRecurringTask,
  getNextOccurrenceDate,
  occurrenceKeyForDate,
  scanRecurringTaskTemplates
};
