const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  profilePhoto: {
    type: String,
    default: 'https://res.cloudinary.com/clubflow/image/upload/v1/defaults/default-avatar.png'
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user'
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  clubs: [{
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club'
    },
    role: {
      type: String,
      enum: ['president', 'vicepresident', 'secretary', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notificationPreferences: {
    email: {
      taskAssigned: { type: Boolean, default: true },
      taskDueSoon: { type: Boolean, default: true },
      eventReminder: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      clubUpdates: { type: Boolean, default: true }
    },
    inApp: {
      taskAssigned: { type: Boolean, default: true },
      taskDueSoon: { type: Boolean, default: true },
      eventReminder: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      clubUpdates: { type: Boolean, default: true }
    }
  },
  lastLogin: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerificationToken: String,
  emailVerificationExpire: Date
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ 'clubs.club': 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  next();
});

// Match password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Get user's role in a specific club
userSchema.methods.getRoleInClub = function(clubId) {
  const membership = this.clubs.find(
    c => c.club.toString() === clubId.toString()
  );
  return membership ? membership.role : null;
};

// Check if user is member of club
userSchema.methods.isMemberOfClub = function(clubId) {
  return this.clubs.some(c => c.club.toString() === clubId.toString());
};

// Add club to user
userSchema.methods.joinClub = async function(clubId, role = 'member') {
  if (!this.isMemberOfClub(clubId)) {
    this.clubs.push({
      club: clubId,
      role: role,
      joinedAt: new Date()
    });
    await this.save();
  }
};

// Remove club from user
userSchema.methods.leaveClub = async function(clubId) {
  this.clubs = this.clubs.filter(c => c.club.toString() !== clubId.toString());
  await this.save();
};

// Update role in club
userSchema.methods.updateClubRole = async function(clubId, newRole) {
  const membership = this.clubs.find(
    c => c.club.toString() === clubId.toString()
  );
  if (membership) {
    membership.role = newRole;
    await this.save();
  }
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function() {
  const resetToken = require('crypto').randomBytes(20).toString('hex');
  
  this.resetPasswordToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);