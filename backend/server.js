require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', methods: ['GET', 'POST'] },
});

connectDB();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Too many requests' });
app.use('/api/', limiter);

app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/users', require('./routes/users'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_room', (data) => {
    if (data.userId) socket.join(`user_${data.userId}`);
    if (data.role === 'guard') socket.join('guards');
    if (data.role === 'admin') socket.join('admins');
    console.log(`Socket ${socket.id} joined as ${data.role}`);
  });

  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

const PORT = process.env.PORT || 5001; // Port 5001 avoids macOS Airplay conflict
server.listen(PORT, () => console.log(`SecureGate server running on port ${PORT}`));
