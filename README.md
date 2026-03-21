# SecureGate — Apartment Visitor Security Platform

Full-stack: React 18 + Node.js/Express + MongoDB + Socket.io

## Quick Start

### Backend
```bash
cd backend && cp .env.example .env
npm install && node seed.js && npm run dev
# Runs on http://localhost:5000
```

### Frontend
```bash
cd frontend && npm install && npm start
# Runs on http://localhost:3000
```

## Demo Login
| Role     | Email                       | Password    |
|----------|-----------------------------|-------------|
| Admin    | admin@securegate.com        | admin123    |
| Guard    | guard@securegate.com        | guard123    |
| Resident | resident@securegate.com     | resident123 |

## Pages built
- Login (3-role quick-fill cards)
- Admin: Dashboard, Analytics, Alerts, Visitor Log, Suspicious Activity, Face Verify, Residents, Passes, Watchlist
- Guard: Entry Check, Gate Log, Alerts, QR Scanner
- Resident: Approvals, Invite Visitor, History, Notifications, Trust Score

## Key security features
- OTP: 4-digit, 30-min expiry, single-use, phone-bound
- QR: UUID token, one-time or day-pass modes
- Auto-flag: 2+ denied entries per phone triggers alert
- Watchlist: 3+ flags auto-watchlists visitor, all guards notified
- Socket.io: real-time resident push on visitor arrival
- JWT + bcrypt, rate limiting, role-based middleware
