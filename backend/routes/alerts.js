const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const { protect, authorize } = require('../middleware/auth');

// GET /api/alerts
router.get('/', protect, async (req, res) => {
  try {
    const { status = 'active', severity } = req.query;
    const filter = { status };
    if (severity) filter.severity = severity;

    const alerts = await Alert.find(filter)
      .populate('visitorId', 'name phone flatNumber')
      .populate('reportedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/alerts/:id/dismiss
router.patch('/:id/dismiss', protect, authorize('admin', 'guard'), async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: 'dismissed', resolvedBy: req.user._id, resolvedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/alerts/:id/escalate
router.patch('/:id/escalate', protect, authorize('admin'), async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: 'escalated', resolvedBy: req.user._id, resolvedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/alerts - manual alert creation
router.post('/', protect, authorize('guard', 'admin'), async (req, res) => {
  try {
    const { title, description, severity, type, flatNumber, gateNumber, visitorId, audioData } = req.body;
    const alert = await Alert.create({
      title, description, severity, type, flatNumber, gateNumber,
      visitorId, reportedBy: req.user._id, audioData
    });
    const io = req.app.get('io');
    if (io) io.to('admins').emit('new_alert', { alert });
    res.status(201).json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
