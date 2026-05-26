const Notification = require('../models/Notification.model');
const mongoose = require('mongoose');
const { logger } = require('../config/logger');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead, type } = req.query;
    const query = { recipient: req.user._id };
    
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }
    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      data: notifications,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    logger.error(`Get Notifications Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error fetching notifications' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user._id);
    res.status(200).json({ success: true, count });
  } catch (error) {
    logger.error(`Get Unread Count Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error fetching count' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification id' });
    }

    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await notification.markAsRead();
    res.status(200).json({ success: true, message: 'Marked as read', data: notification });
  } catch (error) {
    logger.error(`Mark Read Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error marking as read' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      updated: result.modifiedCount
    });
  } catch (error) {
    logger.error(`Mark All Read Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error marking all as read' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification id' });
    }

    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    logger.error(`Delete Notification Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error deleting notification' });
  }
};

exports.deleteAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ recipient: req.user._id });

    res.status(200).json({
      success: true,
      message: 'Notifications deleted',
      deleted: result.deletedCount
    });
  } catch (error) {
    logger.error(`Delete All Notifications Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error deleting notifications' });
  }
};

module.exports = exports;
