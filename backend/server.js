require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const https = require('https');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : 'http://localhost:3000', 
    methods: ['GET', 'POST'],
    credentials: true
  },
});

connectDB();

app.use(cors({ 
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : 'http://localhost:3000', 
  credentials: true 
}));
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

// Serving Static Assets in Production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // For any route that is NOT /api, serve the index.html from React
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'frontend', 'build', 'index.html'));
  });
}

app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f8fafc; color: #1e293b;">
      <h1 style="color: #4f46e9;">SecureGate API</h1>
      <p style="font-weight: 500;">Status: <span style="color: #10b981;">Online</span></p>
      <p style="font-size: 14px; color: #64748b;">Visit <a href="/api/health" style="color: #4f46e9;">/api/health</a> for system status.</p>
    </div>
  `);
});

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

// Render Auto-Ping Anti-Sleep Strategy
setInterval(() => {
  https.get('https://secure-gate-2.onrender.com/api/health', (res) => {
    console.log(`[Anti-Sleep] Pinged self, status: ${res.statusCode}`);
  }).on('error', (e) => {
    console.error(`[Anti-Sleep] Error: ${e.message}`);
  });
}, 14 * 60 * 1000); // Ping every 14 mins

const PORT = process.env.PORT || 5001; // Port 5001 avoids macOS Airplay conflict
server.listen(PORT, () => console.log(`SecureGate server running on port ${PORT}`));
