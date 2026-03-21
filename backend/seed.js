require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Visitor = require('./models/Visitor');
const Alert = require('./models/Alert');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({});
  await Visitor.deleteMany({});
  await Alert.deleteMany({});

  const users = await User.create([
    {
      name: 'Admin Sharma',
      email: 'admin@securegate.com',
      password: 'admin123',
      role: 'admin',
      phone: '9800000001',
    },
    {
      name: 'Guard Ravi',
      email: 'guard@securegate.com',
      password: 'guard123',
      role: 'guard',
      phone: '9800000002',
      gateAssigned: 'Gate 1',
    },
    {
      name: 'Resident Sneha',
      email: 'resident@securegate.com',
      password: 'resident123',
      role: 'resident',
      phone: '9800000003',
      flatNumber: '2A',
    },
    {
      name: 'Amit Sharma',
      email: 'amit@securegate.com',
      password: 'resident123',
      role: 'resident',
      phone: '9800000004',
      flatNumber: '7C',
    },
  ]);

  console.log('Users seeded:', users.map(u => `${u.role}: ${u.email}`));

  const adminId = users[0]._id;
  const guardId = users[1]._id;
  const residentId = users[2]._id;

  await Visitor.create([
    { name: 'Rahul Kumar', phone: '9811111111', purpose: 'delivery', flatNumber: '4B', residentId, guardId, status: 'approved', entryMethod: 'otp', otp: '7316', otpExpiry: new Date(Date.now() + 30 * 60 * 1000), entryTime: new Date(), trustScore: 92, idVerified: true },
    { name: 'Priya Joshi', phone: '9822222222', purpose: 'maintenance', flatNumber: '7C', residentId: users[3]._id, guardId, status: 'approved', entryMethod: 'qr', entryTime: new Date(Date.now() - 30 * 60 * 1000), trustScore: 88, idVerified: true },
    { name: 'Unknown Visitor', phone: '0000000000', purpose: 'other', flatNumber: 'N/A', guardId, status: 'denied', isSuspicious: true, suspicionReason: 'No ID provided', flagCount: 4, isWatchlisted: true },
    { name: 'M. Shah', phone: '9833333333', purpose: 'guest', flatNumber: '2A', residentId, guardId, status: 'pending', entryMethod: 'manual', trustScore: 61 },
  ]);

  await Alert.create([
    { title: 'Repeated unknown visitor — Gate 1', description: 'Same individual attempted entry 4 times in 2 hours without resident approval.', severity: 'high', type: 'repeated_attempt', reportedBy: guardId, flatNumber: 'Gate 1' },
    { title: 'OTP reuse attempt — Flat 3D', description: 'Visitor attempted entry using an expired OTP from 2 days ago.', severity: 'medium', type: 'otp_reuse', reportedBy: guardId, flatNumber: '3D' },
    { title: 'Tailgating detected — B-Block', description: '2 individuals entered on single QR scan. Second person unregistered.', severity: 'medium', type: 'tailgating', reportedBy: adminId, gateNumber: 'Gate 2' },
  ]);

  console.log('Seed complete!');
  console.log('\nDemo credentials:');
  console.log('  Admin:    admin@securegate.com / admin123');
  console.log('  Guard:    guard@securegate.com / guard123');
  console.log('  Resident: resident@securegate.com / resident123');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
