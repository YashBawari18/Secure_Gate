const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  type: {
    type: String,
    enum: ['repeated_attempt', 'otp_reuse', 'tailgating', 'face_mismatch', 'suspicious_pattern', 'voice_emergency', 'other'],
    required: true,
  },
  status: { type: String, enum: ['active', 'dismissed', 'escalated'], default: 'active' },
  visitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor' },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  flatNumber: { type: String },
  gateNumber: { type: String },
  audioData:  { type: String },   // base64 audio for voice_emergency alerts
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  createdAt:  { type: Date, default: Date.now },
});

module.exports = mongoose.model('Alert', alertSchema);
