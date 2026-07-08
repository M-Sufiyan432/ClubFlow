const express = require('express');
const router = express.Router();
const { getClubTimeline, getTaskTimeline } = require('../controllers/activity.controller');
const { protect } = require('../middleware/auth');

router.get('/tasks/:taskId/timeline', protect, getTaskTimeline);
router.get('/clubs/:clubId/timeline', protect, getClubTimeline);

module.exports = router;
