import { useEffect, useState, useRef } from "react";
import {
  subscribeToSession,
  subscribeToParticipants,
  unsubscribe,
  getSession,
  getParticipants,
  startTimer,
  pauseTimer,
  resetTimer,
  endSession,
  updateParticipantTime,
} from "../utils/sessionService";

const LiveSessionView = ({ sessionId, userId, isLeader, initialSession, onLeave }) => {
  const [session, setSession] = useState(initialSession);
  const [remainingTime, setRemainingTime] = useState(initialSession?.remaining_time || initialSession?.remainingTime || 0);
  const [status, setStatus] = useState(initialSession?.status || "waiting");
  const [leaderboard, setLeaderboard] = useState(initialSession?.participants || []);
  const [error, setError] = useState("");
  
  const timerIntervalRef = useRef(null);
  const sessionChannelRef = useRef(null);
  const participantsChannelRef = useRef(null);
  const lastUpdateTimeRef = useRef(Date.now());
  const sessionRef = useRef(session);
  const previousStatusRef = useRef(status);
  
  // Keep sessionRef in sync with session state
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Play sound when session ends
  const playEndSound = () => {
    try {
      // Use your custom sound file from public folder
      const audio = new Audio('/session-end-sound.m4a');
      audio.volume = 0.7; // Adjust volume (0.0 to 1.0)
      
      // Preload the audio to avoid issues
      audio.preload = 'auto';
      
      // Handle play promise with better error handling
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Audio started playing successfully
            console.log('Session end sound played successfully');
          })
          .catch(error => {
            // Auto-play was prevented or other error occurred
            // This is expected in some browsers due to autoplay policies
            // Silently fail - the user can still see the visual indication
            if (error.name !== 'NotAllowedError' && error.name !== 'NotSupportedError') {
              console.warn('Could not play session end sound:', error.message);
            }
          });
      }
    } catch (error) {
      // Silently handle errors - visual indication is more important
      if (error.name !== 'NotAllowedError' && error.name !== 'NotSupportedError') {
        console.warn('Error initializing sound:', error.message);
      }
    }
  };

  // Monitor status changes and play sound when session ends
  useEffect(() => {
    if (previousStatusRef.current !== "ended" && status === "ended") {
      playEndSound();
    }
    previousStatusRef.current = status;
  }, [status]);

  // Calculate remaining time based on session state
  const calculateRemainingTime = (sessionData) => {
    if (!sessionData || sessionData.status !== "active") {
      return sessionData?.remaining_time || 0;
    }

    const now = Date.now();
    const startTime = sessionData.start_time;
    const pausedDuration = sessionData.paused_duration || 0;

    if (!startTime) {
      return sessionData.remaining_time || 0;
    }

    const elapsed = Math.floor((now - startTime - pausedDuration) / 1000);
    const remaining = Math.max(0, sessionData.duration - elapsed);
    return remaining;
  };

  // Update timer every second when active
  useEffect(() => {
    if (status === "active" && session) {
      timerIntervalRef.current = setInterval(() => {
        const currentSession = sessionRef.current;
        if (!currentSession || currentSession.status !== "active") return;

        const newRemainingTime = calculateRemainingTime(currentSession);
        setRemainingTime(newRemainingTime);

        // Update participant time spent
        if (userId && newRemainingTime > 0) {
          const timeSpent = currentSession.duration - newRemainingTime;
          updateParticipantTime(sessionId, userId, timeSpent).catch(console.error);
        }

        // Check if timer ended
        if (newRemainingTime <= 0) {
          if (isLeader) {
            endSession(sessionId, userId).catch(console.error);
          }
        }
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [status, session, sessionId, userId, isLeader]);

  // Subscribe to session updates
  useEffect(() => {
    if (!sessionId) return;

    // Subscribe to session changes
    sessionChannelRef.current = subscribeToSession(sessionId, async (payload) => {
      try {
        const updatedSession = await getSession(sessionId);
        const newRemainingTime = calculateRemainingTime(updatedSession);
        
        setSession(updatedSession);
        setRemainingTime(newRemainingTime);
        setStatus(updatedSession.status);
        lastUpdateTimeRef.current = Date.now();
      } catch (error) {
        console.error("Error updating session:", error);
        setError(error.message || "Failed to update session");
      }
    });

    // Subscribe to participant changes
    participantsChannelRef.current = subscribeToParticipants(sessionId, (participants) => {
      setLeaderboard(participants);
    });

    // Initial fetch
    const loadSession = async () => {
      try {
        const sessionData = await getSession(sessionId);
        const participants = await getParticipants(sessionId);
        const newRemainingTime = calculateRemainingTime(sessionData);

        setSession(sessionData);
        setRemainingTime(newRemainingTime);
        setStatus(sessionData.status);
        setLeaderboard(participants);
      } catch (error) {
        console.error("Error loading session:", error);
        setError(error.message || "Failed to load session");
      }
    };

    loadSession();

    return () => {
      if (sessionChannelRef.current) {
        unsubscribe(sessionChannelRef.current);
      }
      if (participantsChannelRef.current) {
        unsubscribe(participantsChannelRef.current);
      }
    };
  }, [sessionId]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleStart = async () => {
    if (!isLeader || !userId) return;
    try {
      await startTimer(sessionId, userId);
    } catch (error) {
      console.error("Error starting timer:", error);
      setError(error.message || "Failed to start timer");
    }
  };

  const handlePause = async () => {
    if (!isLeader || !userId) return;
    try {
      await pauseTimer(sessionId, userId);
    } catch (error) {
      console.error("Error pausing timer:", error);
      setError(error.message || "Failed to pause timer");
    }
  };

  const handleReset = async () => {
    if (!isLeader || !userId) return;
    try {
      await resetTimer(sessionId, userId);
    } catch (error) {
      console.error("Error resetting timer:", error);
      setError(error.message || "Failed to reset timer");
    }
  };

  const handleEnd = async () => {
    if (!isLeader || !userId) return;
    try {
      await endSession(sessionId, userId);
    } catch (error) {
      console.error("Error ending session:", error);
      setError(error.message || "Failed to end session");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-emerald-400";
      case "paused":
        return "text-amber-400";
      case "ended":
        return "text-gray-400";
      default:
        return "text-indigo-400";
    }
  };

  const getStatusBadgeColor = (participantStatus) => {
    switch (participantStatus) {
      case "active":
        return "bg-emerald-500/20 text-emerald-200 border-emerald-500/40";
      case "completed":
        return "bg-indigo-500/20 text-indigo-200 border-indigo-500/40";
      case "left":
        return "bg-gray-500/20 text-gray-400 border-gray-500/40";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/40";
    }
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
        <div className="w-full max-w-md rounded-2xl border border-rose-500/40 bg-[#08080c] p-6">
          <p className="text-rose-100 mb-4">{error}</p>
          <button
            onClick={onLeave}
            className="w-full rounded-2xl border border-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-400">Connecting to session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E10] font-inter text-gray-100">
      <div className="relative isolate">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-indigo-500/40 via-transparent to-transparent blur-3xl opacity-70" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-8">
          {/* Header */}
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-900/40 bg-indigo-500/10 px-4 py-1.5 text-xs uppercase tracking-[0.35em] text-indigo-300">
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
                Live Session
              </div>
              <h1 className="text-3xl md:text-5xl font-semibold text-white bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent">
                {session.session_name || session.sessionName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-2 rounded-full border border-indigo-900/30 bg-indigo-500/10 px-3 py-1.5">
                  <span className="text-gray-400">Session ID:</span>
                  <span className="font-mono text-indigo-300 font-semibold">{sessionId}</span>
                </div>
                {isLeader && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-emerald-200 text-xs font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    Leader
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onLeave}
              className="rounded-2xl border border-gray-700/50 bg-gray-900/70 px-6 py-3 text-sm font-medium text-gray-200 transition-all duration-300 hover:scale-[1.02] hover:bg-gray-800 hover:border-gray-600"
            >
              Leave Session
            </button>
          </header>

          <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
            {/* Timer Section - Takes 2 columns */}
            <div className="lg:col-span-2 lg:sticky lg:top-10 rounded-3xl border border-indigo-900/40 bg-gradient-to-br from-[#151518]/90 to-[#0F0F12]/90 p-8 shadow-xl shadow-indigo-900/20 backdrop-blur-sm">
              <div className="text-center space-y-8">
                <div className="space-y-4">
                  <p className="text-sm uppercase tracking-wider text-gray-400">Time Remaining</p>
                  <div className="relative inline-block">
                    <div className={`text-7xl md:text-8xl font-mono font-bold ${getStatusColor(status)} drop-shadow-2xl`}>
                      {formatTime(remainingTime)}
                    </div>
                    {status === "active" && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent animate-shimmer"></div>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${status === "active" ? "bg-emerald-400 animate-pulse" : status === "paused" ? "bg-amber-400" : "bg-gray-400"}`}></div>
                    <p className={`text-sm uppercase tracking-wider font-medium ${getStatusColor(status)}`}>
                      {status === "active" ? "Running" : status === "paused" ? "Paused" : status === "ended" ? "Ended" : "Waiting"}
                    </p>
                  </div>
                </div>

                {isLeader && (
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-6 border-t border-indigo-900/30">
                    {status === "waiting" && (
                      <button
                        onClick={handleStart}
                        className="group relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(16,185,129,0.25)] transition-all hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-[0_16px_40px_rgba(16,185,129,0.35)]"
                      >
                        <span className="relative z-10">▶ Start</span>
                      </button>
                    )}
                    {status === "active" && (
                      <button
                        onClick={handlePause}
                        className="group relative overflow-hidden rounded-2xl border border-amber-500/40 bg-amber-600 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(245,158,11,0.25)] transition-all hover:-translate-y-0.5 hover:bg-amber-500 hover:shadow-[0_16px_40px_rgba(245,158,11,0.35)]"
                      >
                        <span className="relative z-10">⏸ Pause</span>
                      </button>
                    )}
                    {status === "paused" && (
                      <>
                        <button
                          onClick={handleStart}
                          className="group relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(16,185,129,0.25)] transition-all hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-[0_16px_40px_rgba(16,185,129,0.35)]"
                        >
                          <span className="relative z-10">▶ Resume</span>
                        </button>
                        <button
                          onClick={handleReset}
                          className="group relative overflow-hidden rounded-2xl border border-indigo-500/40 bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(79,70,229,0.25)] transition-all hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-[0_16px_40px_rgba(79,70,229,0.35)]"
                        >
                          <span className="relative z-10">↻ Reset</span>
                        </button>
                      </>
                    )}
                    {(status === "active" || status === "paused") && (
                      <button
                        onClick={handleEnd}
                        className="group relative overflow-hidden rounded-2xl border border-rose-500/40 bg-rose-600 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(244,63,94,0.25)] transition-all hover:-translate-y-0.5 hover:bg-rose-500 hover:shadow-[0_16px_40px_rgba(244,63,94,0.35)]"
                      >
                        <span className="relative z-10">⏹ End Session</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Leaderboard Section */}
            <div className="rounded-3xl border border-indigo-900/40 bg-[#151518]/90 p-6 shadow-xl shadow-indigo-900/20 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-indigo-900/30">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Leaderboard
                </h2>
                <span className="rounded-full bg-indigo-500/20 border border-indigo-500/40 px-3 py-1 text-xs font-medium text-indigo-200">
                  {leaderboard.length}
                </span>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">👥</div>
                    <p className="text-gray-500 text-sm">No participants yet</p>
                    <p className="text-gray-600 text-xs mt-1">Waiting for others to join...</p>
                  </div>
                ) : (
                  leaderboard.map((participant, index) => {
                    const isTopThree = index < 3;
                    const formatTime = (seconds) => {
                      const hours = Math.floor(seconds / 3600);
                      const minutes = Math.floor((seconds % 3600) / 60);
                      if (hours > 0) {
                        return `${hours}h ${minutes}m`;
                      }
                      return `${minutes}m`;
                    };
                    
                    return (
                      <div
                        key={participant.userId}
                        className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:scale-[1.02] ${
                          participant.status === "active" && isTopThree
                            ? index === 0
                              ? "border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
                              : index === 1
                              ? "border-cyan-500/50 bg-cyan-500/10 shadow-md shadow-cyan-500/15"
                              : index === 2
                              ? "border-amber-500/50 bg-amber-500/10 shadow-md shadow-amber-500/15"
                              : "border-indigo-900/20 bg-[#0F0F12]/80 hover:border-indigo-500/30"
                            : "border-indigo-900/20 bg-[#0F0F12]/80 hover:border-indigo-500/30"
                        } p-4`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-full font-bold text-base ${
                              participant.status === "active" && isTopThree
                                ? index === 0
                                  ? "bg-gradient-to-br from-emerald-500/40 to-emerald-600/20 text-emerald-200 border-2 border-emerald-500/50"
                                  : index === 1
                                  ? "bg-gradient-to-br from-cyan-500/40 to-cyan-600/20 text-cyan-200 border-2 border-cyan-500/50"
                                  : index === 2
                                  ? "bg-gradient-to-br from-amber-500/40 to-amber-600/20 text-amber-200 border-2 border-amber-500/50"
                                  : "bg-indigo-500/20 text-indigo-200 border border-indigo-500/30"
                                : "bg-indigo-500/20 text-indigo-200 border border-indigo-500/30"
                            }`}>
                              #{participant.rank}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold truncate">{participant.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {formatTime(participant.timeSpent || 0)} studied
                              </p>
                            </div>
                          </div>
                          <span
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${getStatusBadgeColor(participant.status)}`}
                          >
                            {participant.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveSessionView;

