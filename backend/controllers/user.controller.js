const User = require('../models/User.model');
const { logger } = require('../config/logger');

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
      .populate('clubs.club', 'name logo')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    logger.error(`Get Users Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('clubs.club', 'name logo category');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    logger.error(`Get User Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error fetching user' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, profilePhoto } = req.body;
    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (profilePhoto) user.profilePhoto = profilePhoto;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    logger.error(`Update Profile Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
};

exports.updateNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.notificationPreferences = req.body;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated'
    });
  } catch (error) {
    logger.error(`Update Preferences Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error updating preferences' });
  }
};

exports.deactivateAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    logger.error(`Deactivate Account Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error deactivating account' });
  }
};

module.exports = exports;