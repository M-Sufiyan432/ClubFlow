const User = require('../models/User.model');
const Club = require('../models/Club.model');
const Task = require('../models/Task.model');
const Event = require('../models/Event.model');
const AuditLog = require('../models/AuditLog.model');
const { logger } = require('../config/logger');

exports.getDashboard = async (req, res) => {
  try {
    const [totalUsers, totalClubs, totalTasks, totalEvents] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Club.countDocuments({ isActive: true }),
      Task.countDocuments({ isArchived: false }),
      Event.countDocuments({ isCancelled: false })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalClubs,
        totalTasks,
        totalEvents
      }
    });
  } catch (error) {
    logger.error(`Admin Dashboard Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error fetching dashboard' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const users = await User.find({})
      .select('name email role profilePhoto isActive lastLogin createdAt clubs')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await User.countDocuments({});

    res.status(200).json({
      success: true,
      data: users,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (error) {
    logger.error(`Admin Users Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
};

exports.getClubs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const clubs = await Club.find({})
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await Club.countDocuments({});

    res.status(200).json({
      success: true,
      data: clubs,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (error) {
    logger.error(`Admin Clubs Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error fetching clubs' });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const tasks = await Task.find({ isArchived: false })
      .populate('club', 'name')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await Task.countDocuments({ isArchived: false });

    res.status(200).json({
      success: true,
      data: tasks,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (error) {
    logger.error(`Admin Tasks Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error fetching tasks' });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, entityType } = req.query;
    const query = {};
    
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;

    const logs = await AuditLog.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await AuditLog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: logs,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    logger.error(`Get Audit Logs Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error fetching logs' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    await AuditLog.logAction({
      user: req.user._id,
      action: 'role_changed',
      entityType: 'User',
      entityId: user._id,
      description: `Changed user role to ${role}`,
      severity: 'warning'
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    logger.error(`Update Role Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error updating role' });
  }
};

module.exports = exports;
