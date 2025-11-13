import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const httpServer = createServer(app);

// Configure CORS for Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:4000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

// In-memory session storage 
const sessions = new Map();

// Generate unique IDs 
const generateId = () => Math.random().toString(36).substring(2, 15).toUpperCase();

// Session management
const createSession = (sessionName, duration, leaderId, leaderName) => {
  const sessionId = generateId();
  const session = {
    sessionId,
    sessionName,
    leaderId,
    leaderName, // Store leader name for reconnection
    duration, // in seconds
    remainingTime: duration,
    status: "waiting", // waiting, active, paused, ended
    startTime: null,
    pausedAt: null,
    pausedDuration: 0,
    participants: [],
    createdAt: Date.now(),
  };
  sessions.set(sessionId, session);
  return session;
};

const getSession = (sessionId) => {
  if (!sessionId) return null;
  // Case-insensitive lookup
  const upperId = sessionId.toUpperCase();
  return sessions.get(upperId);
};

const updateSession = (sessionId, updates) => {
  if (!sessionId) return null;
  const upperId = sessionId.toUpperCase();
  const session = sessions.get(upperId);
  if (session) {
    Object.assign(session, updates);
    sessions.set(upperId, session);
  }
  return session;
};

// Timer logic
const timerIntervals = new Map();

const startTimer = (sessionId) => {
  const session = getSession(sessionId);
  if (!session || session.status === "active") return;

  const now = Date.now();
  if (session.status === "paused") {
    // Resume from pause
    session.pausedDuration += now - session.pausedAt;
    session.pausedAt = null;
  } else {
    // Start fresh
    session.startTime = now;
    session.pausedDuration = 0;
  }

  updateSession(sessionId, { status: "active", startTime: session.startTime });

  // Clear existing interval if any
  if (timerIntervals.has(sessionId)) {
    clearInterval(timerIntervals.get(sessionId));
  }

  // Calculate remaining time and broadcast
  const updateTimer = () => {
    const currentSession = getSession(sessionId);
    if (!currentSession || currentSession.status !== "active") return;

    const elapsed = Math.floor((Date.now() - currentSession.startTime - currentSession.pausedDuration) / 1000);
    const remaining = Math.max(0, currentSession.duration - elapsed);

    currentSession.remainingTime = remaining;

    // Update timeSpent for all active participants
    const timeIncrement = 1; // 1 second per update
    currentSession.participants.forEach((participant) => {
      if (participant.status === "active") {
        participant.timeSpent = (participant.timeSpent || 0) + timeIncrement;
      }
    });

    // Broadcast timer update
    io.to(sessionId).emit("timer-update", {
      remainingTime: remaining,
      status: currentSession.status,
    });

    // Broadcast leaderboard update with new timeSpent values
    broadcastLeaderboard(sessionId);

    if (remaining <= 0) {
      // Timer ended
      endTimer(sessionId);
    }
  };

  // Update immediately
  updateTimer();

  // Update every second
  const interval = setInterval(updateTimer, 1000);
  timerIntervals.set(sessionId, interval);
};

const pauseTimer = (sessionId) => {
  const session = getSession(sessionId);
  if (!session || session.status !== "active") return;

  session.pausedAt = Date.now();
  updateSession(sessionId, { status: "paused" });

  if (timerIntervals.has(sessionId)) {
    clearInterval(timerIntervals.get(sessionId));
    timerIntervals.delete(sessionId);
  }

  io.to(sessionId).emit("timer-update", {
    remainingTime: session.remainingTime,
    status: "paused",
  });
};

const resetTimer = (sessionId) => {
  const session = getSession(sessionId);
  if (!session) return;

  if (timerIntervals.has(sessionId)) {
    clearInterval(timerIntervals.get(sessionId));
    timerIntervals.delete(sessionId);
  }

  updateSession(sessionId, {
    status: "waiting",
    remainingTime: session.duration,
    startTime: null,
    pausedAt: null,
    pausedDuration: 0,
  });

  io.to(sessionId).emit("timer-update", {
    remainingTime: session.duration,
    status: "waiting",
  });
};

const endTimer = (sessionId) => {
  const session = getSession(sessionId);
  if (!session) return;

  if (timerIntervals.has(sessionId)) {
    clearInterval(timerIntervals.get(sessionId));
    timerIntervals.delete(sessionId);
  }

  updateSession(sessionId, {
    status: "ended",
    remainingTime: 0,
  });

  // Update all participants to completed
  session.participants.forEach((p) => {
    if (p.status === "active") {
      p.status = "completed";
    }
  });

  io.to(sessionId).emit("timer-update", {
    remainingTime: 0,
    status: "ended",
  });

  broadcastLeaderboard(sessionId);
};

// Leaderboard management
const calculateLeaderboard = (sessionId) => {
  const session = getSession(sessionId);
  if (!session) return [];

  return session.participants
    .filter((participant) => participant.status === "active") // Only show active participants
    .map((participant) => ({
      name: participant.name,
      userId: participant.userId,
      joinedAt: participant.joinedAt,
      status: participant.status,
      timeSpent: participant.timeSpent || 0,
    }))
    .sort((a, b) => {
      // Sort by timeSpent descending (most studied first)
      return b.timeSpent - a.timeSpent;
    })
    .map((p, index) => ({ ...p, rank: index + 1 }));
};

const broadcastLeaderboard = (sessionId) => {
  const leaderboard = calculateLeaderboard(sessionId);
  io.to(sessionId).emit("leaderboard-update", leaderboard);
};

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Create session (leader only)
  socket.on("create-session", ({ sessionName, duration, leaderName }) => {
    const leaderId = socket.id;
    const session = createSession(sessionName, duration, leaderId, leaderName);

    // Add leader as first participant
    session.participants.push({
      userId: leaderId,
      name: leaderName,
      joinedAt: Date.now(),
      status: "active",
      timeSpent: 0,
    });

    // Join room
    socket.join(session.sessionId);

    // Send session info to leader
    socket.emit("session-created", {
      sessionId: session.sessionId,
      session: {
        ...session,
        participants: calculateLeaderboard(session.sessionId),
      },
    });

    console.log(`Session created: ${session.sessionId} by ${leaderName}`);
  });

  // Join session (participant)
  socket.on("join-session", ({ sessionId, participantName }) => {
    // Normalize sessionId to uppercase
    const normalizedSessionId = sessionId ? sessionId.toUpperCase().trim() : null;
    if (!normalizedSessionId) {
      socket.emit("join-error", { message: "Invalid session ID" });
      return;
    }
    const session = getSession(normalizedSessionId);

    if (!session) {
      socket.emit("join-error", { message: "Session not found" });
      return;
    }

    if (session.status === "ended") {
      socket.emit("join-error", { message: "Session has ended" });
      return;
    }

    // Normalize participant name
    const normalizedName = participantName ? participantName.trim() : "";
    if (!normalizedName) {
      socket.emit("join-error", { message: "Invalid participant name" });
      return;
    }

    // Check if user is the leader (by name) for reconnection - do this first
    const isLeaderReconnect = session.leaderName && session.leaderName.toLowerCase().trim() === normalizedName.toLowerCase();
    if (isLeaderReconnect) {
      // Update leaderId for reconnection
      session.leaderId = socket.id;
    }

    // Check if user already in session (by name, not socket.id for reconnection support)
    // Find by name to handle reconnection (case-insensitive)
    const existingParticipantIndex = session.participants.findIndex(
      (p) => p.name.toLowerCase().trim() === normalizedName.toLowerCase()
    );
    
    if (existingParticipantIndex !== -1) {
      // User already exists - this is a reconnection
      const existingParticipant = session.participants[existingParticipantIndex];
      
      // Check if it's the same socket (duplicate request)
      if (existingParticipant.userId === socket.id) {
        // Same socket trying to join again - just send current state
        console.log(`[DUPLICATE] ${normalizedName} (socket ${socket.id}) already in session, ignoring`);
        socket.join(normalizedSessionId);
        socket.emit("session-joined", {
          sessionId: normalizedSessionId,
          session: {
            sessionName: session.sessionName,
            duration: session.duration,
            remainingTime: session.remainingTime,
            status: session.status,
            isLeader: session.leaderId === socket.id,
            participants: calculateLeaderboard(normalizedSessionId),
          },
        });
        // Don't broadcast leaderboard update for duplicate requests
        return;
      }
      
      // Different socket.id - this is a reconnection, update userId and status
      // Keep original joinedAt to preserve when they first joined
      const oldSocketId = existingParticipant.userId;
      existingParticipant.userId = socket.id;
      existingParticipant.status = "active";
      console.log(`[RECONNECT] ${normalizedName} reconnected (old: ${oldSocketId}, new: ${socket.id})`);
      // Continue to join room and send state
    } else {
      // User doesn't exist - add new participant
      session.participants.push({
        userId: socket.id,
        name: normalizedName,
        joinedAt: Date.now(),
        status: "active",
        timeSpent: 0,
      });
      console.log(`[NEW] ${normalizedName} joined session ${normalizedSessionId} for the first time`);
    }

    // Join room
    socket.join(normalizedSessionId);

    // Send current session state
    socket.emit("session-joined", {
      sessionId: normalizedSessionId,
      session: {
        sessionName: session.sessionName,
        duration: session.duration,
        remainingTime: session.remainingTime,
        status: session.status,
        isLeader: session.leaderId === socket.id,
        participants: calculateLeaderboard(normalizedSessionId),
      },
    });

    // Broadcast updated leaderboard to all
    broadcastLeaderboard(normalizedSessionId);

    console.log(`${participantName} joined session ${normalizedSessionId}`);
  });

  // Timer controls (leader only)
  socket.on("start-timer", ({ sessionId }) => {
    const normalizedSessionId = sessionId ? sessionId.toUpperCase().trim() : null;
    if (!normalizedSessionId) {
      socket.emit("error", { message: "Invalid session ID" });
      return;
    }
    const session = getSession(normalizedSessionId);
    if (!session || session.leaderId !== socket.id) {
      socket.emit("error", { message: "Unauthorized" });
      return;
    }
    startTimer(normalizedSessionId);
    broadcastLeaderboard(normalizedSessionId);
  });

  socket.on("pause-timer", ({ sessionId }) => {
    const normalizedSessionId = sessionId ? sessionId.toUpperCase().trim() : null;
    if (!normalizedSessionId) {
      socket.emit("error", { message: "Invalid session ID" });
      return;
    }
    const session = getSession(normalizedSessionId);
    if (!session || session.leaderId !== socket.id) {
      socket.emit("error", { message: "Unauthorized" });
      return;
    }
    pauseTimer(normalizedSessionId);
  });

  socket.on("reset-timer", ({ sessionId }) => {
    const normalizedSessionId = sessionId ? sessionId.toUpperCase().trim() : null;
    if (!normalizedSessionId) {
      socket.emit("error", { message: "Invalid session ID" });
      return;
    }
    const session = getSession(normalizedSessionId);
    if (!session || session.leaderId !== socket.id) {
      socket.emit("error", { message: "Unauthorized" });
      return;
    }
    resetTimer(normalizedSessionId);
    broadcastLeaderboard(normalizedSessionId);
  });

  socket.on("end-session", ({ sessionId }) => {
    const normalizedSessionId = sessionId ? sessionId.toUpperCase().trim() : null;
    if (!normalizedSessionId) {
      socket.emit("error", { message: "Invalid session ID" });
      return;
    }
    const session = getSession(normalizedSessionId);
    if (!session || session.leaderId !== socket.id) {
      socket.emit("error", { message: "Unauthorized" });
      return;
    }
    endTimer(normalizedSessionId);
  });

  // Update participant status
  socket.on("update-status", ({ sessionId, status }) => {
    const normalizedSessionId = sessionId ? sessionId.toUpperCase().trim() : null;
    if (!normalizedSessionId) return;
    const session = getSession(normalizedSessionId);
    if (!session) return;

    const participant = session.participants.find((p) => p.userId === socket.id);
    if (participant) {
      participant.status = status;
      broadcastLeaderboard(normalizedSessionId);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);

    // Mark participant as left in all their sessions
    sessions.forEach((session) => {
      const participant = session.participants.find((p) => p.userId === socket.id);
      if (participant && participant.status === "active") {
        participant.status = "left";
        broadcastLeaderboard(session.sessionId);
      }
    });
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", sessions: sessions.size });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io server ready`);
  console.log(`CORS enabled for: ${process.env.CLIENT_URL || "http://localhost:4000"}`);
});

