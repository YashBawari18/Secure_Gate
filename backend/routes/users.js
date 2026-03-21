const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET /api/users - admin gets all users
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users - admin creates user
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role, phone, flatNumber, gateAssigned } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });
    const user = await User.create({ name, email, password: password || 'changeme123', role, phone, flatNumber, gateAssigned });
    res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/users/:id
router.patch('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, phone, flatNumber, gateAssigned, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, phone, flatNumber, gateAssigned, isActive },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
