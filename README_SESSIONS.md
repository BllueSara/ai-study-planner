# Study Sessions Feature

Real-time synchronized study timer with live leaderboard.

## Setup Instructions

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

### 2. Configure Environment Variables

**Frontend (.env):**
```env
VITE_SOCKET_URL=http://localhost:3001
```

**Backend (server/.env):**
```env
PORT=3001
CLIENT_URL=http://localhost:4000
```

### 3. Start the Servers

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 4. Access the Feature

- Navigate to `/sessions` in your app
- Or click "Study Sessions" button in the main planner

## How It Works

### Creating a Session (Leader)
1. Click "Create Session"
2. Enter your name, session name, and duration
3. Share the generated Session ID with participants

### Joining a Session (Participant)
1. Click "Join Session"
2. Enter your name and the Session ID
3. View the synchronized timer and leaderboard

### Features
- ✅ Real-time synchronized timer (server-side)
- ✅ Live leaderboard with participant status
- ✅ Leader controls: Start, Pause, Reset, End
- ✅ Automatic reconnection handling
- ✅ Participant tracking (active, completed, left)

## Architecture

- **Backend**: Node.js + Express + Socket.io
- **Frontend**: React + Socket.io-client
- **Real-time**: WebSocket connections for instant updates
- **State**: Server maintains source of truth for timer

## Production Deployment

1. Deploy backend server (Railway, Render, etc.)
2. Update `VITE_SOCKET_URL` in frontend `.env`
3. Update `CLIENT_URL` in backend `.env`
4. Build and deploy frontend

