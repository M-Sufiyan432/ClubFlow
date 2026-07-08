const Activity = require('../models/Activity.model');

const createActivity = async ({
  req,
  task,
  type,
  summary,
  metadata = {},
  changes
}) => Activity.create({
  club: task.club?._id || task.club,
  task: task._id,
  actor: req.user._id,
  type,
  summary,
  metadata,
  changes,
  requestId: req.requestId
});

const listTaskActivities = ({ taskId, limit = 30, before }) => {
  const query = { task: taskId };
  if (before) query.createdAt = { $lt: new Date(before) };

  return Activity.find(query)
    .populate('actor', 'name email profilePhoto')
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 30, 100))
    .lean();
};

const listClubActivities = ({ clubId, limit = 30, before }) => {
  const query = { club: clubId };
  if (before) query.createdAt = { $lt: new Date(before) };

  return Activity.find(query)
    .populate('actor', 'name email profilePhoto')
    .populate('task', 'title status priority')
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 30, 100))
    .lean();
};

module.exports = {
  createActivity,
  listClubActivities,
  listTaskActivities
};
