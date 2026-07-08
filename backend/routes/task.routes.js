const express = require('express');
const router = express.Router();
const {
  getAllTasks,
  getTasksByClub,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
  assignTask,
  addComment,
  uploadTaskAttachment,
  createTaskAttachmentUploadUrl,
  completeTaskAttachmentUpload,
  getTaskAttachmentDownloadUrl,
  moderateTaskAttachment,
  addSubtask,
  toggleSubtask,
  updateSubtask,
  deleteSubtask,
  duplicateTask
} = require('../controllers/task.controller');
const { getTaskTimeline } = require('../controllers/activity.controller');
const { protect, requireClubMembership } = require('../middleware/auth');
const { createTaskValidation, updateTaskValidation, addCommentValidation, validate } = require('../middleware/validation');
const { requireTaskCreatePermission } = require('../middlewares/taskPermissions');
const { upload, uploadLimiter } = require('../middlewares/upload');

router.get('/', protect, getAllTasks);
router.get('/getAllTask', protect, getAllTasks);
router.get('/getAllTasks', protect, getAllTasks);
router.post('/', protect, requireTaskCreatePermission, createTaskValidation, validate, createTask);
router.get('/club/:clubId', protect, requireClubMembership, getTasksByClub);
router.get('/:taskId', protect, getTaskById);
router.get('/:taskId/timeline', protect, getTaskTimeline);
router.put('/:taskId', protect, updateTaskValidation, validate, updateTask);
router.delete('/:taskId', protect, deleteTask);
router.patch('/:taskId/status', protect, updateTaskStatus);
router.post('/:taskId/assign', protect, assignTask);
router.post('/:taskId/comments', protect, addCommentValidation, validate, addComment);
router.post('/:taskId/attachments/signed-upload', protect, createTaskAttachmentUploadUrl);
router.post('/:taskId/attachments/complete', protect, completeTaskAttachmentUpload);
router.get('/:taskId/attachments/:attachmentId/download', protect, getTaskAttachmentDownloadUrl);
router.patch('/:taskId/attachments/:attachmentId/moderation', protect, moderateTaskAttachment);
router.post('/:taskId/attachments', protect, uploadLimiter, upload.single('file'), uploadTaskAttachment);
router.post('/:taskId/subtasks', protect, addSubtask);
router.patch('/:taskId/subtasks/:subtaskId', protect, toggleSubtask);
router.put('/:taskId/subtasks/:subtaskId', protect, updateSubtask);
router.delete('/:taskId/subtasks/:subtaskId', protect, deleteSubtask);
router.post('/:taskId/duplicate', protect, duplicateTask);

module.exports = router;
