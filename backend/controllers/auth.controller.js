const User = require('../models/User.model');
const AuditLog = require('../models/AuditLog.model');
const { ErrorResponse } = require('../middleware/errorHandler');
const { logger } = require('../config/logger');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { enqueueEmail, isQueueEnabled } = require('../jobs');
const {
  issueTokenPair,
  listUserSessions,
  revokeAllUserSessions,
  revokeRefreshToken,
  revokeSession,
  rotateRefreshToken
} = require('../services/token.service');

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

    await sendTokenResponse(user, 201, req, res, 'Registration successful');
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

    await sendTokenResponse(user, 200, req, res, 'Login successful');
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
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (refreshToken) await revokeRefreshToken(refreshToken, 'logout');
    if (req.user?.sessionId) await revokeSession(req.user.sessionId, 'logout');

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

    clearAuthCookies(res);

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

// @desc    Rotate refresh token and issue a new access token
// @route   POST /api/auth/refresh
// @access  Public
exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const pair = await rotateRefreshToken(refreshToken, req);
    setAuthCookies(res, pair);

    res.status(200).json({
      success: true,
      message: 'Token refreshed',
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken,
      token: pair.accessToken,
      sessionId: pair.sessionId,
      user: buildAuthUser(pair.user)
    });
  } catch (error) {
    logger.warn('Refresh Token Error', { error: error.message });
    clearAuthCookies(res);
    res.status(error.statusCode || 401).json({
      success: false,
      message: error.message || 'Unable to refresh session'
    });
  }
};

// @desc    List active refresh-token sessions
// @route   GET /api/auth/sessions
// @access  Private
exports.getSessions = async (req, res) => {
  try {
    const sessions = await listUserSessions(req.user._id);
    res.status(200).json({
      success: true,
      data: sessions,
      sessions
    });
  } catch (error) {
    logger.error(`Get Sessions Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching sessions'
    });
  }
};

// @desc    Revoke one session
// @route   DELETE /api/auth/sessions/:sessionId
// @access  Private
exports.revokeSessionById = async (req, res) => {
  try {
    await revokeSession(req.params.sessionId, 'user_revoked');
    res.status(200).json({
      success: true,
      message: 'Session revoked'
    });
  } catch (error) {
    logger.error(`Revoke Session Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error revoking session'
    });
  }
};

// @desc    Revoke all sessions and invalidate access tokens
// @route   POST /api/auth/logout-all
// @access  Private
exports.logoutAll = async (req, res) => {
  try {
    await revokeAllUserSessions(req.user._id, 'logout_all');
    await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: 'All sessions revoked'
    });
  } catch (error) {
    logger.error(`Logout All Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error revoking sessions'
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
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    await revokeAllUserSessions(user._id, 'password_reset');

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

    await sendTokenResponse(user, 200, req, res, 'Password reset successful');
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
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    await revokeAllUserSessions(user._id, 'password_changed');

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

    await sendTokenResponse(user, 200, req, res, 'Password updated successfully');
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
  sendTokenResponse(req.user, 200, req, res, 'Google login successful');
};

// Helper function to get token from model, create cookie and send response
const getCookieOptions = (maxAge) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge
});

const setAuthCookies = (res, pair) => {
  res.cookie('accessToken', pair.accessToken, getCookieOptions(Number(process.env.ACCESS_TOKEN_COOKIE_MS || 15 * 60 * 1000)));
  res.cookie('refreshToken', pair.refreshToken, getCookieOptions(Number(process.env.REFRESH_TOKEN_COOKIE_MS || 30 * 24 * 60 * 60 * 1000)));
  res.cookie('token', pair.accessToken, getCookieOptions(Number(process.env.ACCESS_TOKEN_COOKIE_MS || 15 * 60 * 1000)));
};

const clearAuthCookies = (res) => {
  ['accessToken', 'refreshToken', 'token'].forEach((name) => {
    res.cookie(name, 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });
  });
};

const sendTokenResponse = async (user, statusCode, req, res, message) => {
  const pair = await issueTokenPair(user, req);
  setAuthCookies(res, pair);

  res
    .status(statusCode)
    .json({
      success: true,
      message,
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken,
      token: pair.accessToken,
      sessionId: pair.sessionId,
      user: buildAuthUser(user)
    });
};
