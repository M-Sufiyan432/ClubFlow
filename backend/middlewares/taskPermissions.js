const Club = require('../models/Club.model');

const GLOBAL_ADMIN_ROLES = ['admin', 'superadmin', 'super_admin'];
const TASK_CREATOR_ROLES = ['president', 'vicepresident', 'secretary'];
const TASK_ASSIGNER_ROLES = ['president', 'vicepresident'];

const isGlobalAdmin = (user) => GLOBAL_ADMIN_ROLES.includes(user?.role);

const resolveClubId = (req) => req.params.clubId || req.body.clubId || req.body.club || req.headers['x-club-id'];

const getClubRole = (club, userId) => {
  const member = club?.members?.find((entry) => entry.user.toString() === userId.toString());
  return member?.role || null;
};

const loadTaskClub = async (req, res, next) => {
  const clubId = resolveClubId(req);

  if (!clubId) {
    return res.status(400).json({
      success: false,
      message: 'clubId is required for task operations'
    });
  }

  const club = await Club.findById(clubId);
  if (!club) {
    return res.status(404).json({
      success: false,
      message: 'Club not found'
    });
  }

  req.taskClub = club;
  req.taskClubRole = getClubRole(club, req.user._id);
  req.body.club = clubId;
  next();
};

exports.requireTaskClubId = loadTaskClub;

exports.requireTaskCreatePermission = [
  loadTaskClub,
  (req, res, next) => {
    if (isGlobalAdmin(req.user) || TASK_CREATOR_ROLES.includes(req.taskClubRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Only president, vice president, and secretary roles can create tasks'
    });
  }
];

exports.requireTaskAssignPermission = [
  loadTaskClub,
  (req, res, next) => {
    if (isGlobalAdmin(req.user) || TASK_ASSIGNER_ROLES.includes(req.taskClubRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Only president and vice president roles can assign tasks'
    });
  }
];

