import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CreateSessionModal from "../components/CreateSessionModal";
import JoinSessionModal from "../components/JoinSessionModal";
import LiveSessionView from "../components/LiveSessionView";
import {
  createSession,
  joinSession,
  getSession,
  getParticipants,
} from "../utils/sessionService";

const StudySessionPage = () => {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLeader, setIsLeader] = useState(false);

  // Load session from localStorage on mount
  useEffect(() => {
    if (currentSession) return;

    const savedSession = localStorage.getItem("studySession");
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession);
        const { sessionId, participantName, userId: savedUserId, isLeader: savedIsLeader } = sessionData;
        
        if (sessionId && participantName) {
          // Reconnect to session
          reconnectToSession(sessionId, participantName, savedUserId, savedIsLeader);
        }
      } catch (error) {
        console.error("Error loading session:", error);
        localStorage.removeItem("studySession");
      }
    }
  }, []);

  const reconnectToSession = async (sessionId, participantName, savedUserId, savedIsLeader) => {
    try {
      const result = await joinSession(sessionId, participantName);
      const session = await getSession(sessionId);
      const participants = await getParticipants(sessionId);

      setUserId(result.userId);
      setIsLeader(result.session.isLeader);
      setCurrentSession({
        sessionId: result.sessionId,
        session: {
          ...session,
          participants,
          isLeader: result.session.isLeader,
        },
      });

      // Update localStorage
      localStorage.setItem("studySession", JSON.stringify({
        sessionId: result.sessionId,
        participantName,
        userId: result.userId,
        isLeader: result.session.isLeader,
      }));
    } catch (error) {
      console.error("Reconnection error:", error);
      alert(error.message || "Failed to reconnect to session");
      localStorage.removeItem("studySession");
    }
  };

  const handleCreateSession = async ({ sessionName, duration, leaderName }) => {
    try {
      const result = await createSession(sessionName, duration, leaderName);
      const session = await getSession(result.sessionId);
      const participants = await getParticipants(result.sessionId);

      setUserId(result.userId);
      setIsLeader(true);
      setCurrentSession({
        sessionId: result.sessionId,
        session: {
          ...session,
          participants,
          isLeader: true,
        },
      });
      setShowCreateModal(false);

      // Save to localStorage
      localStorage.setItem("studySession", JSON.stringify({
        sessionId: result.sessionId,
        participantName: leaderName,
        userId: result.userId,
        isLeader: true,
      }));
    } catch (error) {
      console.error("Session error:", error);
      alert(error.message || "Failed to create session");
    }
  };

  const handleJoinSession = async ({ sessionId, participantName }) => {
    try {
      const result = await joinSession(sessionId, participantName);
      const session = await getSession(result.sessionId);
      const participants = await getParticipants(result.sessionId);

      setUserId(result.userId);
      setIsLeader(result.session.isLeader);
      setCurrentSession({
        sessionId: result.sessionId,
        session: {
          ...session,
          participants,
          isLeader: result.session.isLeader,
        },
      });
      setShowJoinModal(false);

      // Save to localStorage
      localStorage.setItem("studySession", JSON.stringify({
        sessionId: result.sessionId,
        participantName,
        userId: result.userId,
        isLeader: result.session.isLeader,
      }));
    } catch (error) {
      console.error("Session error:", error);
      alert(error.message || "Failed to join session");
    }
  };

  const handleLeaveSession = async () => {
    if (currentSession && userId) {
      try {
        const { updateParticipantStatus } = await import("../utils/sessionService");
        await updateParticipantStatus(currentSession.sessionId, userId, "left");
      } catch (error) {
        console.error("Error updating participant status:", error);
      }
    }
    setCurrentSession(null);
    setUserId(null);
    setIsLeader(false);
    // Clear localStorage
    localStorage.removeItem("studySession");
  };

  if (currentSession) {
    return (
      <LiveSessionView
        sessionId={currentSession.sessionId}
        userId={userId}
        isLeader={isLeader}
        initialSession={currentSession.session}
        onLeave={handleLeaveSession}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E10] font-inter text-gray-100">
      <div className="relative isolate">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-indigo-500/40 via-transparent to-transparent blur-3xl opacity-70" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 py-16">
          <div className="text-center space-y-6 mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-900/40 bg-indigo-500/10 px-4 py-1.5 text-xs uppercase tracking-[0.35em] text-indigo-300">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
              Study Sessions
            </div>
            <h1 className="text-4xl md:text-6xl font-semibold text-white bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-200 bg-clip-text text-transparent">
              Real-Time Study Sessions
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Create or join a synchronized study session with a live timer and leaderboard. Study together in real-time!
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Create Session Card */}
            <div className="group relative overflow-hidden rounded-3xl border border-indigo-900/40 bg-gradient-to-br from-[#151518]/90 to-[#0F0F12]/90 p-8 shadow-xl shadow-indigo-900/20 hover:scale-[1.02] transition-all duration-300 hover:border-indigo-500/50">
              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-indigo-600/20 border border-indigo-500/40 shadow-lg shadow-indigo-500/20">
                  <svg className="w-10 h-10 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold text-white">Create Session</h2>
                  <p className="text-gray-400 leading-relaxed">
                    Start a new study session. Set the duration and invite others to join. You'll be the leader with full control over the timer.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-500/40 bg-indigo-600 px-6 py-4 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(79,70,229,0.25)] transition-all hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-[0_16px_40px_rgba(79,70,229,0.35)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Session
                </button>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>

            {/* Join Session Card */}
            <div className="group relative overflow-hidden rounded-3xl border border-indigo-900/40 bg-gradient-to-br from-[#151518]/90 to-[#0F0F12]/90 p-8 shadow-xl shadow-indigo-900/20 hover:scale-[1.02] transition-all duration-300 hover:border-indigo-500/50">
              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
                  <svg className="w-10 h-10 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold text-white">Join Session</h2>
                  <p className="text-gray-400 leading-relaxed">
                    Join an existing study session using the session ID provided by the leader. See the timer and leaderboard in real-time.
                  </p>
                </div>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-600 px-6 py-4 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(16,185,129,0.25)] transition-all hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-[0_16px_40px_rgba(16,185,129,0.35)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Join Session
                </button>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={() => navigate("/ai")}
              className="text-sm text-gray-400 hover:text-white transition inline-flex items-center gap-2"
            >
              <span>←</span>
              <span>Back to Study Planner</span>
            </button>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateSessionModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateSession}
        />
      )}

      {showJoinModal && (
        <JoinSessionModal
          onClose={() => setShowJoinModal(false)}
          onJoin={handleJoinSession}
        />
      )}
    </div>
  );
};

export default StudySessionPage;

