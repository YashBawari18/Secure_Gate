const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const visitorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  purpose: {
    type: String,
    enum: ['guest', 'delivery', 'maintenance', 'cab', 'other'],
    required: true,
  },
  flatNumber: { type: String, required: true, trim: true },
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guardId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  status: {
    type: String,
    enum: ['pending', 'approved', 'denied', 'flagged', 'exited'],
    default: 'pending',
  },
  entryMethod: { type: String, enum: ['otp', 'qr', 'manual'], default: 'manual' },

  otp: { type: String },
  otpExpiry: { type: Date },
  otpUsed: { type: Boolean, default: false },

  qrToken: { type: String, default: () => uuidv4() },
  qrUsed: { type: Boolean, default: false },

  passType: { type: String, enum: ['one-time', 'day-pass', 'qr'], default: 'one-time' },
  validDate: { type: Date },

  entryTime: { type: Date },
  exitTime: { type: Date },

  isSuspicious: { type: Boolean, default: false },
  suspicionReason: { type: String },
  flagCount: { type: Number, default: 0 },
  isWatchlisted: { type: Boolean, default: false },

  trustScore: { type: Number, default: 50 },
  idVerified: { type: Boolean, default: false },
  faceMatchScore: { type: Number },

  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

visitorSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Visitor', visitorSchema);
