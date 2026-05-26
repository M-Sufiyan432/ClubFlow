const mongoose = require('mongoose');
const crypto = require('crypto');

const clubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a club name'],
    trim: true,
    maxlength: [100, 'Club name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  logo: {
    type: String,
    default: 'https://res.cloudinary.com/clubflow/image/upload/v1/defaults/default-club-logo.png'
  },
  coverImage: {
    type: String,
    default: null
  },
  category: {
    type: String,
    enum: ['technical', 'cultural', 'sports', 'social', 'academic', 'other','professional'],
    default: 'other'
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['president', 'vicepresident', 'secretary', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inviteToken: {
    type: String,
    unique: true,
    sparse: true
  },
  inviteTokenExpiry: {
    type: Date
  },
  settings: {
    allowPublicJoin: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: true
    },
    maxMembers: {
      type: Number,
      default: null
    }
  },
  stats: {
    totalTasks: {
      type: Number,
      default: 0
    },
    completedTasks: {
      type: Number,
      default: 0
    },
    totalEvents: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
clubSchema.index({ name: 1 });
clubSchema.index({ createdBy: 1 });
clubSchema.index({ 'members.user': 1 });
clubSchema.index({ visibility: 1 });
clubSchema.index({ isActive: 1 });
clubSchema.index({ inviteToken: 1 });
clubSchema.index({ category: 1 });

// Virtual for member count
clubSchema.virtual('memberCount').get(function() {
  return Array.isArray(this.members) ? this.members.length : 0;
});

// Generate invite token
clubSchema.methods.generateInviteToken = function() {
  const token = crypto.randomBytes(16).toString('hex');
  this.inviteToken = token;
  this.inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  return token;
};

// Check if invite token is valid
clubSchema.methods.isInviteTokenValid = function() {
  return this.inviteToken && this.inviteTokenExpiry > new Date();
};

// Add member to club
clubSchema.methods.addMember = async function(userId, role = 'member', invitedBy = null) {
  const existingMember = this.members.find(
    m => m.user.toString() === userId.toString()
  );
  
  if (existingMember) {
    throw new Error('User is already a member of this club');
  }
  
  // Check max members limit
  if (this.settings.maxMembers && this.members.length >= this.settings.maxMembers) {
    throw new Error('Club has reached maximum member capacity');
  }
  
  this.members.push({
    user: userId,
    role: role,
    joinedAt: new Date(),
    invitedBy: invitedBy
  });
  
  await this.save();
};

// Remove member from club
clubSchema.methods.removeMember = async function(userId) {
  this.members = this.members.filter(
    m => m.user.toString() !== userId.toString()
  );
  await this.save();
};

// Update member role
clubSchema.methods.updateMemberRole = async function(userId, newRole) {
  const member = this.members.find(
    m => m.user.toString() === userId.toString()
  );
  
  if (!member) {
    throw new Error('User is not a member of this club');
  }
  
  member.role = newRole;
  await this.save();
};

// Get member role
clubSchema.methods.getMemberRole = function(userId) {
  const member = this.members.find(
    m => m.user.toString() === userId.toString()
  );
  return member ? member.role : null;
};

// Check if user is member
clubSchema.methods.isMember = function(userId) {
  return this.members.some(m => m.user.toString() === userId.toString());
};

// Check if user has admin role (president, vicepresident, secretary)
clubSchema.methods.isAdmin = function(userId) {
  const member = this.members.find(
    m => m.user.toString() === userId.toString()
  );
  return member && ['president', 'vicepresident', 'secretary'].includes(member.role);
};

// Check if user is president
clubSchema.methods.isPresident = function(userId) {
  const member = this.members.find(
    m => m.user.toString() === userId.toString()
  );
  return member && member.role === 'president';
};

// Transfer ownership
clubSchema.methods.transferOwnership = async function(currentPresidentId, newPresidentId) {
  // Demote current president to member
  const currentPresident = this.members.find(
    m => m.user.toString() === currentPresidentId.toString()
  );
  if (currentPresident) {
    currentPresident.role = 'member';
  }
  
  // Promote new president
  const newPresident = this.members.find(
    m => m.user.toString() === newPresidentId.toString()
  );
  if (!newPresident) {
    throw new Error('New president is not a member of this club');
  }
  
  newPresident.role = 'president';
  await this.save();
};

// Ensure JSON includes virtuals
clubSchema.set('toJSON', { virtuals: true });
clubSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Club', clubSchema);
