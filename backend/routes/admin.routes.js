const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getUsers,
  getClubs,
  getTasks,
  getAuditLogs,
  updateUserRole
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin', 'superadmin'));

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.get('/clubs', getClubs);
router.get('/tasks', getTasks);
router.get('/audit-logs', getAuditLogs);
router.put('/users/:id/role', updateUserRole);

module.exports = router;
