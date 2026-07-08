const Club = require('../models/Club.model');
const { PERMISSIONS, can, getClubRole } = require('../services/permission.service');

const resolveClubId = (req) => req.params.clubId || req.body.clubId || req.body.club || req.headers['x-club-id'];

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
  async (req, res, next) => {
    const decision = await can(req.user, PERMISSIONS.TASK_CREATE, { club: req.taskClub });
    if (decision.allowed) {
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
  async (req, res, next) => {
    const decision = await can(req.user, PERMISSIONS.TASK_ASSIGN, { club: req.taskClub });
    if (decision.allowed) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Only president and vice president roles can assign tasks'
    });
  }
];

