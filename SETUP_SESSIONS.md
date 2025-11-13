# Study Sessions Setup Guide

## Quick Start

### 1. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd server
npm install
```

### 2. Start Both Servers

**Terminal 1 - Backend (Port 3001):**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend (Port 4000):**
```bash
npm run dev
```

### 3. Access the Feature

- Open browser: `http://localhost:4000`
- Click "Study Sessions" button in the header
- Or navigate to: `http://localhost:4000/sessions`

## File Structure

```
project/
├── server/
│   ├── index.js              # Socket.io server
│   └── package.json          # Backend dependencies
├── src/
│   ├── components/
│   │   ├── CreateSessionModal.jsx    # Create session form
│   │   ├── JoinSessionModal.jsx      # Join session form
│   │   └── LiveSessionView.jsx       # Timer + Leaderboard
│   ├── pages/
│   │   └── StudySessionPage.jsx      # Main session page
│   └── utils/
│       └── socket.js                  # Socket.io client setup
└── package.json              # Frontend dependencies (includes socket.io-client)
```

## How It Works

### Leader Flow:
1. Click "Create Session"
2. Enter name, session name, duration
3. Get Session ID
4. Share Session ID with participants
5. Control timer: Start, Pause, Reset, End

### Participant Flow:
1. Click "Join Session"
2. Enter name and Session ID
3. View synchronized timer
4. See live leaderboard

## Features

✅ **Real-time Synchronized Timer**
- Server-side timer (single source of truth)
- Updates broadcast every second
- All participants see same countdown

✅ **Live Leaderboard**
- Shows all participants
- Real-time updates
- Status tracking (active, completed, left)
- Ranked by join order

✅ **Leader Controls**
- Start/Pause/Reset/End timer
- Full session management

✅ **Automatic Reconnection**
- Handles disconnections
- Updates status on reconnect

## Environment Variables

Create `.env` in root:
```env
VITE_SOCKET_URL=http://localhost:3001
```

Create `server/.env`:
```env
PORT=3001
CLIENT_URL=http://localhost:4000
```

## Production Deployment

1. Deploy backend to Railway/Render/Heroku
2. Update `VITE_SOCKET_URL` in frontend `.env`
3. Update `CLIENT_URL` in backend `.env`
4. Build frontend: `npm run build`
5. Deploy frontend to Vercel/Netlify

## Troubleshooting

**Can't connect to server:**
- Check backend is running on port 3001
- Verify `VITE_SOCKET_URL` in `.env`

**Timer not syncing:**
- Check browser console for errors
- Verify Socket.io connection in Network tab

**Participants not appearing:**
- Check server logs
- Verify socket events are firing

