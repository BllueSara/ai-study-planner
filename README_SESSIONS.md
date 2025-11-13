# Study Sessions Feature

Real-time synchronized study timer with live leaderboard powered by Supabase.

## Setup Instructions

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
- ✅ Real-time synchronized timer (client-side with Supabase Realtime sync)
- ✅ Live leaderboard with participant status
- ✅ Leader controls: Start, Pause, Reset, End
- ✅ Automatic reconnection handling
- ✅ Participant tracking (active, completed, left)
- ✅ Persistent session state in database

## Architecture

- **Backend**: Supabase (PostgreSQL + Realtime)
- **Frontend**: React + Supabase JS Client
- **Real-time**: Supabase Realtime subscriptions for instant updates
- **State**: Database maintains source of truth for sessions and participants
- **Timer**: Client-side calculation synchronized via database updates

## Production Deployment

1. Supabase project is already hosted (no separate backend deployment needed)
2. Update `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your hosting platform's environment variables
3. Build frontend: `npm run build`
4. Deploy frontend to Vercel/Netlify/any static host

## Database Schema

The application uses two main tables:
- `sessions`: Stores session information (name, duration, status, timer state)
- `participants`: Stores participant information (name, time spent, status)

See `supabase-schema.sql` for the complete schema definition.
