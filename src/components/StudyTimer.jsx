import React, { useState, useEffect, useRef } from "react";

const StudyTimer = ({ planId, isShared = false }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0); // time in seconds
  const [targetTime, setTargetTime] = useState(0); // target time for progress calculation
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);
  const [participants, setParticipants] = useState(0);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Format time as HH:MM:SS for longer sessions
  const formatTimeLong = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Start timer
  const handleStart = () => {
    if (!isRunning) {
      setIsRunning(true);
      setIsPaused(false);
      const startFrom = pausedTimeRef.current || 0;
      startTimeRef.current = Date.now() - (startFrom * 1000);
      
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setTime(elapsed);
        pausedTimeRef.current = elapsed;
        
        // Sync with shared timer if enabled
        if (isShared && planId) {
          syncTimerState({ running: true, time: elapsed, startTime: startTimeRef.current });
        }
      }, 100);
    }
  };

  // Pause timer
  const handlePause = () => {
    if (isRunning) {
      setIsRunning(false);
      setIsPaused(true);
      pausedTimeRef.current = time;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      if (isShared && planId) {
        syncTimerState({ running: false, time: time, paused: true });
      }
    }
  };

  // Resume timer
  const handleResume = () => {
    if (isPaused) {
      setIsRunning(true);
      setIsPaused(false);
      startTimeRef.current = Date.now() - (pausedTimeRef.current * 1000);
      
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setTime(elapsed);
        pausedTimeRef.current = elapsed;
        
        if (isShared && planId) {
          syncTimerState({ running: true, time: elapsed, startTime: startTimeRef.current });
        }
      }, 100);
    }
  };

  // Reset timer
  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTime(0);
    setTargetTime(0);
    pausedTimeRef.current = 0;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (isShared && planId) {
      syncTimerState({ running: false, time: 0, reset: true });
    }
  };

  // Sync timer state with shared timer (Firebase or WebSocket)
  const syncTimerState = (state) => {
    // TODO: Implement Firebase sync
    // For now, we'll use localStorage as a simple sync mechanism
    if (planId) {
      localStorage.setItem(`timer_${planId}`, JSON.stringify({
        ...state,
        timestamp: Date.now(),
      }));
    }
  };

  // Listen for timer updates from other users
  useEffect(() => {
    if (isShared && planId) {
      const syncInterval = setInterval(() => {
        const stored = localStorage.getItem(`timer_${planId}`);
        if (stored) {
          try {
            const data = JSON.parse(stored);
            // Only sync if the data is recent (within 2 seconds) and not from current session
            if (Date.now() - data.timestamp < 2000 && data.timestamp !== startTimeRef.current) {
              if (data.reset) {
                // Another user reset the timer
                if (isRunning || isPaused) {
                  handleReset();
                }
              } else if (data.running && !isRunning && !isPaused) {
                // Another user started the timer
                pausedTimeRef.current = data.time || 0;
                setTime(data.time || 0);
                handleStart();
              } else if (!data.running && isRunning && data.paused) {
                // Another user paused the timer
                pausedTimeRef.current = data.time || 0;
                setTime(data.time || 0);
                if (isRunning) {
                  handlePause();
                }
              } else if (data.running && isPaused) {
                // Another user resumed the timer
                pausedTimeRef.current = data.time || 0;
                setTime(data.time || 0);
                handleResume();
              }
            }
          } catch (e) {
            console.warn("Failed to parse timer sync data", e);
          }
        }
      }, 500);

      return () => clearInterval(syncInterval);
    }
  }, [isShared, planId, isRunning, isPaused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const displayTime = time >= 3600 ? formatTimeLong(time) : formatTime(time);
  // Progress calculation: show progress based on time elapsed (for visual feedback)
  // You can set a target time (e.g., 25 minutes = 1500 seconds) for Pomodoro-style timer
  const targetSeconds = targetTime || (time > 0 ? time : 1);
  const progress = time > 0 ? Math.min((time / targetSeconds) * 100, 100) : 0;

  return (
    <div className="rounded-2xl border border-indigo-900/40 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent p-6 shadow-lg shadow-indigo-900/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-indigo-200">
            <svg className="h-4 w-4 inline-block mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Study Timer
          </div>
          {isShared && (
            <div className="flex items-center gap-2 text-xs text-indigo-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Shared Session</span>
            </div>
          )}
        </div>
        {participants > 0 && (
          <div className="text-xs text-gray-400">
            {participants} {participants === 1 ? "person" : "people"} studying
          </div>
        )}
      </div>

      <div className="text-center mb-6">
        <div className="text-6xl md:text-7xl font-mono font-bold text-white mb-2 tracking-tight">
          {displayTime}
        </div>
        <div className="text-sm text-gray-400">
          {isRunning ? "Studying..." : isPaused ? "Paused" : "Ready to start"}
        </div>
      </div>

      {/* Progress ring */}
      <div className="relative w-32 h-32 mx-auto mb-6">
        <svg className="transform -rotate-90 w-32 h-32">
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-indigo-900/30"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 56}`}
            strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
            className="text-indigo-400 transition-all duration-300"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xs text-gray-400">Progress</div>
            <div className="text-lg font-semibold text-indigo-200">{Math.round(progress)}%</div>
          </div>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-center gap-3">
        {!isRunning && !isPaused && (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-600/20 px-6 py-3 text-sm font-semibold text-emerald-200 shadow-[0_8px_20px_rgba(16,185,129,0.25)] transition hover:bg-emerald-600/30 hover:scale-105"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Start
          </button>
        )}

        {isRunning && (
          <button
            onClick={handlePause}
            className="flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-600/20 px-6 py-3 text-sm font-semibold text-amber-200 shadow-[0_8px_20px_rgba(245,158,11,0.25)] transition hover:bg-amber-600/30 hover:scale-105"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
            Pause
          </button>
        )}

        {isPaused && (
          <>
            <button
              onClick={handleResume}
              className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-600/20 px-6 py-3 text-sm font-semibold text-emerald-200 shadow-[0_8px_20px_rgba(16,185,129,0.25)] transition hover:bg-emerald-600/30 hover:scale-105"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Resume
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-2xl border border-gray-700 bg-gray-800/50 px-6 py-3 text-sm font-semibold text-gray-300 transition hover:bg-gray-700/50 hover:scale-105"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
              Reset
            </button>
          </>
        )}

        {isRunning && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-2xl border border-gray-700 bg-gray-800/50 px-6 py-3 text-sm font-semibold text-gray-300 transition hover:bg-gray-700/50 hover:scale-105"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            Reset
          </button>
        )}
      </div>

      {/* Study stats */}
      {time > 0 && (
        <div className="mt-6 pt-6 border-t border-indigo-900/30">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-400 mb-1">Hours</div>
              <div className="text-lg font-semibold text-white">{Math.floor(time / 3600)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Minutes</div>
              <div className="text-lg font-semibold text-white">{Math.floor((time % 3600) / 60)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Seconds</div>
              <div className="text-lg font-semibold text-white">{time % 60}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyTimer;

