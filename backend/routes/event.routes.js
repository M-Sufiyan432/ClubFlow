const express = require('express');
const router = express.Router();
const {
  getAllEvents,
  createEvent,
  getEventById,
  updateEvent,
  rsvpEvent,
  markAttendance,
  cancelEvent
} = require('../controllers/event.controller');
const { protect, requireClubAdmin } = require('../middleware/auth');
const { createEventValidation, validate } = require('../middleware/validation');

router.get('/', getAllEvents);
router.post('/', protect, requireClubAdmin, createEventValidation, validate, createEvent);
router.get('/:eventId', getEventById);
router.put('/:eventId', protect, requireClubAdmin, updateEvent);
router.post('/:eventId/rsvp', protect, rsvpEvent);
router.post('/:eventId/attendance', protect, requireClubAdmin, markAttendance);
router.post('/:eventId/cancel', protect, requireClubAdmin, cancelEvent);

module.exports = router;