const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { logger } = require('../config/logger');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in cookies
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please login.'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token invalid.'
      });
    }

    // Check if user is active
    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    next();
  } catch (error) {
    logger.error(`Auth Middleware Error: ${error.message}`);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route.'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route.`
      });
    }
    next();
  };
};

// Check if user is member of club
exports.requireClubMembership = async (req, res, next) => {
  try {
    const clubId =
      req.params.clubId ||
      req.body.clubId ||
      req.body.club ||
      req.headers['x-club-id'];
    const isSuperAdmin = ['superadmin', 'super_admin'].includes(req.user.role);

    if (!clubId) {
      return res.status(400).json({
        success: false,
        message: 'Club ID is required'
      });
    }

    const isMember = req.user.isMemberOfClub(clubId);

    if (!isMember && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of this club to access this resource'
      });
    }

    req.clubId = clubId;
    next();
  } catch (error) {
    logger.error(`Club Membership Check Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error checking club membership'
    });
  }
};

// Check club admin privileges (president, vicepresident, secretary)
exports.requireClubAdmin = async (req, res, next) => {
  try {
    const clubId =
      req.params.clubId ||
      req.body.clubId ||
      req.body.club ||
      req.headers['x-club-id'];
    const Club = require('../models/Club.model');
    const isSuperAdmin = ['superadmin', 'super_admin'].includes(req.user.role);

    if (!clubId) {
      return res.status(400).json({
        success: false,
        message: 'Club ID is required'
      });
    }

    const club = await Club.findById(clubId);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    // Superadmin can access everything
    if (isSuperAdmin) {
      req.club = club;
      return next();
    }

    const isAdmin = club.isAdmin(req.user._id);

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You must be a club admin to perform this action'
      });
    }

    req.club = club;
    next();
  } catch (error) {
    logger.error(`Club Admin Check Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error checking club admin privileges'
    });
  }
};

// Check if user is club president
exports.requireClubPresident = async (req, res, next) => {
  try {
    const clubId =
      req.params.clubId ||
      req.body.clubId ||
      req.body.club ||
      req.headers['x-club-id'];
    const Club = require('../models/Club.model');

    if (!clubId) {
      return res.status(400).json({
        success: false,
        message: 'Club ID is required'
      });
    }

    const club = await Club.findById(clubId);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    // Superadmin can access everything
    if (req.user.role === 'superadmin') {
      req.club = club;
      return next();
    }

    const isPresident = club.isPresident(req.user._id);

    if (!isPresident) {
      return res.status(403).json({
        success: false,
        message: 'Only club president can perform this action'
      });
    }

    req.club = club;
    next();
  } catch (error) {
    logger.error(`Club President Check Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error checking club president privileges'
    });
  }
};

// Optional auth - sets req.user if token exists but doesn't require it
exports.optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (error) {
    // Token invalid but continue anyway
    next();
  }
};
