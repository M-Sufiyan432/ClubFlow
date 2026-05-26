const User = require('../models/User.model');
const AuditLog = require('../models/AuditLog.model');
const { ErrorResponse } = require('../middleware/errorHandler');
const { logger } = require('../config/logger');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { enqueueEmail, isQueueEnabled } = require('../jobs');

const getId = (value) => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  return value._id || value.id || value;
};

const buildAuthUser = (user) => {
  if (!user) return null;

  const source = typeof user.toObject === 'function' ? user.toObject() : user;
  const memberships = Array.isArray(source.clubs) ? source.clubs : [];
  const clubs = memberships.map((membership) => ({
    club: membership.club,
    role: membership.role,
    joinedAt: membership.joinedAt
  }));

  return {
    id: getId(source),
    name: source.name,
    email: source.email,
    role: source.role,
    roles: source.role ? [source.role] : [],
    avatar: source.profilePhoto,
    profilePhoto: source.profilePhoto,
    clubId: getId(memberships[0]?.club),
    clubs
  };
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create user
    user = await User.create({
      name,
      email,
      password,
      authProvider: 'local'
    });

    // Log audit
    await AuditLog.logAction({
      user: user._id,
      action: 'user_created',
      entityType: 'User',
      entityId: user._id,
      description: `User registered: ${email}`,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    sendTokenResponse(user, 201, res, 'Registration successful');
  } catch (error) {
    logger.error(`Register Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error registering user'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user used Google OAuth
    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({
        success: false,
        message: 'Please login with Google'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log audit
    await AuditLog.logAction({
      user: user._id,
      action: 'user_login',
      entityType: 'User',
      entityId: user._id,
      description: `User logged in: ${email}`,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    logger.error(`Login Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error logging in'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id)
      .populate('clubs.club', 'name logo')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const authUser = buildAuthUser(user);
    
    res.status(200).json({
      success: true,
      data: authUser,
      user: authUser
    });
  } catch (error) {
    logger.error(`Get Me Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // Log audit
    await AuditLog.logAction({
      user: req.user._id,
      action: 'user_logout',
      entityType: 'User',
      entityId: req.user._id,
      description: `User logged out: ${req.user.email}`,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error(`Logout Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error logging out'
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email'
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please visit: \n\n ${resetUrl}`;

    try {
      const emailPayload = {
        email: user.email,
        subject: 'Password Reset Request',
        message
      };

      if (isQueueEnabled()) {
        await enqueueEmail(emailPayload, {
          jobId: `password-reset:${user._id}:${user.resetPasswordToken}`
        });
      } else {
        await sendEmail(emailPayload);
      }

      res.status(200).json({
        success: true,
        message: isQueueEnabled() ? 'Password reset email queued' : 'Password reset email sent'
      });
    } catch (err) {
      logger.error(`Email Send Error: ${err.message}`);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }
  } catch (error) {
    logger.error(`Forgot Password Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset'
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Log audit
    await AuditLog.logAction({
      user: user._id,
      action: 'password_changed',
      entityType: 'User',
      entityId: user._id,
      description: `Password reset for user: ${user.email}`,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    sendTokenResponse(user, 200, res, 'Password reset successful');
  } catch (error) {
    logger.error(`Reset Password Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    // Log audit
    await AuditLog.logAction({
      user: user._id,
      action: 'password_changed',
      entityType: 'User',
      entityId: user._id,
      description: `Password updated for user: ${user.email}`,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    sendTokenResponse(user, 200, res, 'Password updated successfully');
  } catch (error) {
    logger.error(`Update Password Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error updating password'
    });
  }
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
exports.googleCallback = (req, res) => {
  sendTokenResponse(req.user, 200, res, 'Google login successful');
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res, message) => {
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message,
      token,
      user: buildAuthUser(user)
    });
};
