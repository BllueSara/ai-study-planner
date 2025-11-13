# Study Sessions Setup Guide

## Quick Start

### 1. Setup Supabase

1. Create a new project on [Supabase](https://supabase.com)
2. Copy your `SUPABASE_URL` and `SUPABASE_ANON_KEY` from project settings
3. Run the `supabase-schema.sql` file in the SQL Editor in Supabase Dashboard
4. Enable Realtime for `sessions` and `participants` tables in Supabase Dashboard

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create `.env` in root:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Start the Application

```bash
npm run dev
```

### 5. Access the Feature

- Open browser: `http://localhost:4000`
- Click "Study Sessions" button in the header
- Or navigate to: `http://localhost:4000/sessions`

## File Structure

```
project/
├── src/
│   ├── components/
│   │   ├── CreateSessionModal.jsx    # Create session form
│   │   ├── JoinSessionModal.jsx      # Join session form
│   │   └── LiveSessionView.jsx       # Timer + Leaderboard
│   ├── pages/
│   │   └── StudySessionPage.jsx      # Main session page
│   └── utils/
│       ├── supabase.js               # Supabase client setup
│       └── sessionService.js         # Session management functions
├── supabase-schema.sql               # Database schema
└── package.json                     # Frontend dependencies
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
- Client-side timer synchronized via Supabase Realtime
- Updates broadcast in real-time
- All participants see same countdown

✅ **Live Leaderboard**
- Shows all participants
- Real-time updates via Supabase Realtime
- Status tracking (active, completed, left)
- Ranked by time spent

✅ **Leader Controls**
- Start/Pause/Reset/End timer
- Full session management
- All changes synced via Supabase

✅ **Automatic Reconnection**
- Handles disconnections
- Updates status on reconnect
- Session state persisted in database

## Architecture

- **Backend**: Supabase (PostgreSQL + Realtime)
- **Frontend**: React + Supabase JS Client
- **Real-time**: Supabase Realtime subscriptions
- **State**: Database maintains source of truth

## Production Deployment

1. Deploy Supabase project (already hosted)
2. Update environment variables in your hosting platform
3. Build frontend: `npm run build`
4. Deploy frontend to Vercel/Netlify

## Troubleshooting

**Can't connect to Supabase:**
- Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`
- Verify Supabase project is active

**Timer not syncing:**
- Check browser console for errors
- Verify Realtime is enabled in Supabase Dashboard
- Check network tab for Supabase WebSocket connections

**Participants not appearing:**
- Verify database schema is set up correctly
- Check Supabase Dashboard logs
- Ensure RLS policies allow read operations
