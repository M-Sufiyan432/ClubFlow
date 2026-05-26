const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an event title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventType: {
    type: String,
    enum: ['meeting', 'workshop', 'social', 'competition', 'deadline', 'other'],
    default: 'meeting'
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide a start date']
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value >= this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  location: {
    type: {
      type: String,
      enum: ['physical', 'online', 'hybrid'],
      default: 'physical'
    },
    address: String,
    room: String,
    onlineLink: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  capacity: {
    type: Number,
    min: 0
  },
  rsvp: {
    required: {
      type: Boolean,
      default: false
    },
    deadline: Date,
    responses: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['going', 'maybe', 'not_going'],
        default: 'going'
      },
      respondedAt: {
        type: Date,
        default: Date.now
      },
      note: String
    }]
  },
  attendance: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    checkedInAt: Date,
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'inapp'],
      default: 'inapp'
    },
    beforeMinutes: {
      type: Number,
      required: true
    },
    sent: {
      type: Boolean,
      default: false
    }
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  attachments: [{
    filename: String,
    url: String,
    fileType: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrence: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: null
    },
    interval: {
      type: Number,
      default: 1
    },
    endDate: Date,
    daysOfWeek: [Number] // 0-6 (Sunday-Saturday)
  },
  isCancelled: {
    type: Boolean,
    default: false
  },
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: String,
  visibility: {
    type: String,
    enum: ['public', 'members_only', 'invited_only'],
    default: 'members_only'
  }
}, {
  timestamps: true
});

// Indexes
eventSchema.index({ club: 1, startDate: 1 });
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ eventType: 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ 'rsvp.responses.user': 1 });
eventSchema.index({ isCancelled: 1 });

// Virtual for RSVP count
eventSchema.virtual('rsvpCount').get(function() {
  if (!this.rsvp.responses) return 0;
  return {
    going: this.rsvp.responses.filter(r => r.status === 'going').length,
    maybe: this.rsvp.responses.filter(r => r.status === 'maybe').length,
    notGoing: this.rsvp.responses.filter(r => r.status === 'not_going').length,
    total: this.rsvp.responses.length
  };
});

// Virtual for attendance count
eventSchema.virtual('attendanceCount').get(function() {
  return this.attendance.length;
});

// Virtual for capacity status
eventSchema.virtual('isFull').get(function() {
  if (!this.capacity) return false;
  const going = this.rsvp.responses.filter(r => r.status === 'going').length;
  return going >= this.capacity;
});

// Virtual for event status
eventSchema.virtual('eventStatus').get(function() {
  const now = new Date();
  if (this.isCancelled) return 'cancelled';
  if (this.endDate && this.endDate < now) return 'past';
  if (this.startDate > now) return 'upcoming';
  if (this.startDate <= now && (!this.endDate || this.endDate >= now)) return 'ongoing';
  return 'upcoming';
});

// Add RSVP response
eventSchema.methods.addRsvp = async function(userId, status, note = null) {
  // Check capacity
  if (this.capacity && status === 'going') {
    const goingCount = this.rsvp.responses.filter(r => 
      r.status === 'going' && r.user.toString() !== userId.toString()
    ).length;
    
    if (goingCount >= this.capacity) {
      throw new Error('Event is at full capacity');
    }
  }
  
  // Check RSVP deadline
  if (this.rsvp.deadline && new Date() > this.rsvp.deadline) {
    throw new Error('RSVP deadline has passed');
  }
  
  // Remove existing RSVP if any
  this.rsvp.responses = this.rsvp.responses.filter(
    r => r.user.toString() !== userId.toString()
  );
  
  // Add new RSVP
  this.rsvp.responses.push({
    user: userId,
    status,
    respondedAt: new Date(),
    note
  });
  
  await this.save();
};

// Mark attendance
eventSchema.methods.markAttendance = async function(userId, checkedInBy) {
  const existingAttendance = this.attendance.find(
    a => a.user.toString() === userId.toString()
  );
  
  if (existingAttendance) {
    throw new Error('User already checked in');
  }
  
  this.attendance.push({
    user: userId,
    checkedInAt: new Date(),
    checkedInBy
  });
  
  await this.save();
};

// Remove attendance
eventSchema.methods.removeAttendance = async function(userId) {
  this.attendance = this.attendance.filter(
    a => a.user.toString() !== userId.toString()
  );
  await this.save();
};

// Cancel event
eventSchema.methods.cancelEvent = async function(userId, reason = null) {
  this.isCancelled = true;
  this.cancelledAt = new Date();
  this.cancelledBy = userId;
  this.cancellationReason = reason;
  await this.save();
};

// Check if user has RSVP'd
eventSchema.methods.hasUserRsvped = function(userId) {
  return this.rsvp.responses.some(r => r.user.toString() === userId.toString());
};

// Get user's RSVP status
eventSchema.methods.getUserRsvpStatus = function(userId) {
  const rsvp = this.rsvp.responses.find(r => r.user.toString() === userId.toString());
  return rsvp ? rsvp.status : null;
};

// Ensure JSON includes virtuals
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);