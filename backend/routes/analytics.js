const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const Alert = require('../models/Alert');
const { protect, authorize } = require('../middleware/auth');

// GET /api/analytics/overview
router.get('/overview', protect, authorize('admin'), async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [total, unique, incidents, watchlisted] = await Promise.all([
      Visitor.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Visitor.distinct('phone', { createdAt: { $gte: thirtyDaysAgo } }).then(r => r.length),
      Alert.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Visitor.countDocuments({ isWatchlisted: true }),
    ]);

    const weekly = await Visitor.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          denied: { $sum: { $cond: [{ $in: ['$status', ['denied', 'flagged']] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const byPurpose = await Visitor.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$purpose', count: { $sum: 1 } } },
    ]);

    const topFlats = await Visitor.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$flatNumber', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({ success: true, data: { total, unique, incidents, watchlisted, weekly, byPurpose, topFlats } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
