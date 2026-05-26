const Event = require('../models/Event.model');
const Club = require('../models/Club.model');
const { logger } = require('../config/logger');

exports.getAllEvents = async (req, res) => {
  try {
    const { club, page = 1, limit = 20, dateFrom, dateTo } = req.query;
    const query = { isCancelled: false };

    if (club) {
      query.club = club;
    }

    if (dateFrom || dateTo) {
      query.startDate = {};
      if (dateFrom) query.startDate.$gte = new Date(dateFrom);
      if (dateTo) query.startDate.$lte = new Date(dateTo);
    }

    const events = await Event.find(query)
      .populate('club', 'name logo')
      .populate('createdBy', 'name email profilePhoto')
      .populate('rsvp.responses.user', 'name email profilePhoto')
      .sort({ startDate: 1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      data: events,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
    });
  } catch (error) {
    logger.error(`Get Events Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error fetching events' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, description, club, startDate, endDate, location, capacity, eventType, image } = req.body;

    const clubDoc = await Club.findById(club);
    if (!clubDoc) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    const event = await Event.create({
      title,
      description,
      club,
      createdBy: req.user._id,
      startDate,
      endDate,
      location,
      capacity,
      eventType,
      image,
    });

    const populatedEvent = await Event.findById(event._id)
      .populate('club', 'name logo')
      .populate('createdBy', 'name email profilePhoto')
      .populate('rsvp.responses.user', 'name email profilePhoto');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: populatedEvent,
    });
  } catch (error) {
    logger.error(`Create Event Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error creating event' });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('club', 'name logo')
      .populate('createdBy', 'name email profilePhoto')
      .populate('rsvp.responses.user', 'name email profilePhoto')
      .populate('attendance.user', 'name email profilePhoto');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({ success: true, data: event });
  } catch (error) {
    logger.error(`Get Event Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error fetching event' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const allowedFields = ['title', 'description', 'startDate', 'endDate', 'location', 'capacity', 'eventType', 'image'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });

    await event.save();

    const updatedEvent = await Event.findById(event._id)
      .populate('club', 'name logo')
      .populate('createdBy', 'name email profilePhoto')
      .populate('rsvp.responses.user', 'name email profilePhoto');

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent,
    });
  } catch (error) {
    logger.error(`Update Event Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error updating event' });
  }
};

exports.rsvpEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).populate('rsvp.responses.user', 'name email profilePhoto');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    await event.addRsvp(req.user._id, req.body.status, req.body.note);
    await event.populate('rsvp.responses.user', 'name email profilePhoto');

    const attendee = event.rsvp.responses.find(
      (response) => response.user && response.user._id.toString() === req.user._id.toString()
    );

    res.status(200).json({
      success: true,
      message: 'RSVP updated successfully',
      data: attendee,
    });
  } catch (error) {
    logger.error(`RSVP Event Error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message || 'Error updating RSVP' });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).populate('attendance.user', 'name email profilePhoto');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const existing = event.attendance.find(
      (entry) => entry.user && entry.user.toString() === req.body.userId
    );

    if (!existing) {
      event.attendance.push({
        user: req.body.userId,
        checkedInAt: new Date(),
        checkedInBy: req.user._id,
      });
      await event.save();
    }

    await event.populate('attendance.user', 'name email profilePhoto');

    const attendee = event.attendance.find(
      (entry) => entry.user && entry.user._id && entry.user._id.toString() === req.body.userId
    );

    res.status(200).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: attendee
        ? {
            user: attendee.user,
            status: 'going',
            checkedInAt: attendee.checkedInAt,
            respondedAt: attendee.checkedInAt,
          }
        : null,
    });
  } catch (error) {
    logger.error(`Mark Attendance Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error recording attendance' });
  }
};

exports.cancelEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    event.isCancelled = true;
    event.cancelledAt = new Date();
    event.cancelledBy = req.user._id;
    event.cancellationReason = req.body.reason;
    await event.save();

    res.status(200).json({ success: true, message: 'Event cancelled successfully' });
  } catch (error) {
    logger.error(`Cancel Event Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error cancelling event' });
  }
};
