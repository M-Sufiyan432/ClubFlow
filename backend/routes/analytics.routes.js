const express = require('express');
const router = express.Router();
const {
  getClubOverview,
  getTaskAnalytics,
  getMemberProductivity,
  getDashboardData
} = require('../controllers/analytics.controller');
const { protect, requireClubMembership } = require('../middleware/auth');

router.get('/club/:clubId/overview', protect, requireClubMembership, getClubOverview);
router.get('/club/:clubId/tasks', protect, requireClubMembership, getTaskAnalytics);
router.get('/club/:clubId/members', protect, requireClubMembership, getMemberProductivity);
router.get('/overview', protect, requireClubMembership, getClubOverview);
router.get('/tasks', protect, requireClubMembership, getTaskAnalytics);
router.get('/productivity', protect, requireClubMembership, getMemberProductivity);
router.get('/dashboard', protect, getDashboardData);

module.exports = router;
