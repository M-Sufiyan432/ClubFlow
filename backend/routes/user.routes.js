const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateProfile,
  updateNotificationPreferences,
  deactivateAccount
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin', 'superadmin'), getAllUsers);
router.get('/:id', protect, getUserById);
router.put('/profile', protect, updateProfile);
router.put('/preferences', protect, updateNotificationPreferences);
router.delete('/account', protect, deactivateAccount);

module.exports = router;