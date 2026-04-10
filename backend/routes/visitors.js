const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const QRCode = require('qrcode');
const Visitor = require('../models/Visitor');
const Alert = require('../models/Alert');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// GET /api/visitors - list with filters
router.get('/', protect, async (req, res) => {
  try {
    const { status, purpose, date, flatNumber, search, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (req.user.role === 'resident') filter.flatNumber = req.user.flatNumber;
    if (status) filter.status = status;
    if (purpose) filter.purpose = purpose;
    if (flatNumber && req.user.role !== 'resident') filter.flatNumber = { $regex: new RegExp(`^${flatNumber}$`, 'i') };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { flatNumber: { $regex: search, $options: 'i' } },
    ];
    if (date) {
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(date); end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    const visitors = await Visitor.find(filter)
      .populate('residentId', 'name flatNumber')
      .populate('guardId', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Visitor.countDocuments(filter);
    res.json({ success: true, visitors, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/visitors - guard or resident creates entry
router.post('/', protect, authorize('guard', 'admin', 'resident'), async (req, res) => {
  try {
    if (req.user.role === 'resident') {
      req.body.flatNumber = req.user.flatNumber;
    }
    let { name, phone, purpose, flatNumber, entryMethod, passType, validDate, notes } = req.body;
    if (flatNumber) flatNumber = flatNumber.toUpperCase().trim();

    const resident = await User.findOne({ 
      flatNumber: { $regex: new RegExp(`^${flatNumber}$`, 'i') }, 
      role: 'resident' 
    });

    if (resident) flatNumber = resident.flatNumber; // Normalize to match the database exactly
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + (process.env.OTP_EXPIRY_MINUTES || 30) * 60 * 1000);

    const visitor = await Visitor.create({
      name, phone, purpose, flatNumber,
      residentId: resident?._id,
      guardId: req.user.role !== 'resident' ? req.user._id : undefined,
      entryMethod: entryMethod || 'manual',
      passType: passType || 'one-time',
      validDate: validDate ? new Date(validDate) : new Date(),
      notes,
      otp,
      otpExpiry,
      status: req.user.role === 'resident' ? 'approved' : 'pending',
    });

    // Auto-check against past flags
    const priorFlags = await Visitor.countDocuments({ phone, status: { $in: ['denied', 'flagged'] } });
    if (priorFlags >= 2) {
      visitor.isSuspicious = true;
      visitor.suspicionReason = `${priorFlags} prior denied entries`;
      await visitor.save();
      await Alert.create({
        title: `Repeated flagged visitor — ${flatNumber}`,
        description: `Visitor ${name} has ${priorFlags} prior denied entries. Current attempt at ${flatNumber}.`,
        severity: 'high',
        type: 'repeated_attempt',
        visitorId: visitor._id,
        reportedBy: req.user._id,
        flatNumber,
      });
    }

    // Emit to resident via socket if available
    const io = req.app.get('io');
    if (io && resident) {
      io.to(`user_${resident._id}`).emit('approval_request', {
        visitor: visitor.toObject(),
        message: `${name} is at the gate`,
      });
    }

    res.status(201).json({ success: true, visitor, otp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/visitors/:id/approve - resident approves
router.patch('/:id/approve', protect, authorize('resident', 'admin'), async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });

    if (req.user.role === 'resident' && visitor.flatNumber !== req.user.flatNumber) {
      return res.status(403).json({ success: false, message: 'Not authorized for this flat' });
    }

    visitor.status = 'approved';
    visitor.entryTime = new Date();
    await visitor.save();

    const io = req.app.get('io');
    if (io) {
      io.to('guards').emit('visitor_approved', { visitor: visitor.toObject() });
    }

    res.json({ success: true, visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/visitors/:id/deny
router.patch('/:id/deny', protect, async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });

    visitor.status = 'denied';
    visitor.flagCount = (visitor.flagCount || 0) + 1;
    if (visitor.flagCount >= 3) visitor.isWatchlisted = true;
    await visitor.save();

    const io = req.app.get('io');
    if (io) io.to('guards').emit('visitor_denied', { visitor: visitor.toObject() });

    res.json({ success: true, visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/visitors/verify-otp
router.post('/verify-otp', protect, authorize('guard', 'admin'), async (req, res) => {
  try {
    const { otp, phone } = req.body;
    const visitor = await Visitor.findOne({ otp, phone, otpUsed: false }).sort({ createdAt: -1 });

    if (!visitor) return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (visitor.otpExpiry < new Date()) {
      await Alert.create({
        title: 'OTP reuse attempt detected',
        description: `Visitor ${visitor.name} attempted entry with expired OTP for flat ${visitor.flatNumber}.`,
        severity: 'medium', type: 'otp_reuse',
        visitorId: visitor._id, reportedBy: req.user._id, flatNumber: visitor.flatNumber,
      });
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }
    if (visitor.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Visitor not approved yet' });
    }

    visitor.otpUsed = true;
    visitor.entryTime = new Date();
    await visitor.save();

    res.json({ success: true, message: 'OTP verified — entry granted', visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/visitors/verify-qr
router.post('/verify-qr', protect, authorize('guard', 'admin'), async (req, res) => {
  try {
    const { qrToken } = req.body;
    const visitor = await Visitor.findOne({ qrToken, qrUsed: false });

    if (!visitor) return res.status(400).json({ success: false, message: 'Invalid or used QR code' });
    if (visitor.status !== 'approved') return res.status(400).json({ success: false, message: 'Not approved' });
    if (visitor.passType === 'one-time') { visitor.qrUsed = true; }
    visitor.entryTime = new Date();
    await visitor.save();

    res.json({ success: true, message: 'QR verified — entry granted', visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/visitors/:id/qr - generate QR image
router.get('/:id/qr', protect, async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ success: false, message: 'Not found' });

    const qrData = JSON.stringify({ token: visitor.qrToken, id: visitor._id, name: visitor.name });
    const qrImage = await QRCode.toDataURL(qrData);
    res.json({ success: true, qr: qrImage });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/visitors/:id/exit
router.patch('/:id/exit', protect, authorize('guard', 'admin'), async (req, res) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      { exitTime: new Date(), status: 'exited' },
      { new: true }
    );
    res.json({ success: true, visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/visitors/:id/watchlist - toggle watchlist
router.patch('/:id/watchlist', protect, authorize('admin'), async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ success: false, message: 'Not found' });
    visitor.isWatchlisted = !visitor.isWatchlisted;
    await visitor.save();
    res.json({ success: true, visitor, watchlisted: visitor.isWatchlisted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/visitors/stats/today
router.get('/stats/today', protect, async (req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const filter = { createdAt: { $gte: start, $lte: end } };
    if (req.user.role === 'resident') filter.flatNumber = req.user.flatNumber;

    const [total, approved, denied, pending] = await Promise.all([
      Visitor.countDocuments(filter),
      Visitor.countDocuments({ ...filter, status: 'approved' }),
      Visitor.countDocuments({ ...filter, status: { $in: ['denied', 'flagged'] } }),
      Visitor.countDocuments({ ...filter, status: 'pending' }),
    ]);

    const hourly = await Visitor.aggregate([
      { $match: filter },
      { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const byPurpose = await Visitor.aggregate([
      { $match: filter },
      { $group: { _id: '$purpose', count: { $sum: 1 } } },
    ]);

    res.json({ success: true, stats: { total, approved, denied, pending, hourly, byPurpose } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
