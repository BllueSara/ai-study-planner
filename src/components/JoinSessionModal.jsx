import { useState } from "react";

const JoinSessionModal = ({ onClose, onJoin, isLoading }) => {
  const [sessionId, setSessionId] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!sessionId.trim()) {
      setError("Please enter a session ID.");
      return;
    }

    if (!participantName.trim()) {
      setError("Please enter your name.");
      return;
    }

    onJoin({
      sessionId: sessionId.trim().toUpperCase(),
      participantName: participantName.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="absolute inset-0 animate-gradient bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10" />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-[#08080c]/95 shadow-[0_40px_120px_rgba(3,3,7,0.85)]">
        <div className="flex items-center justify-between border-b border-white/5 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 border border-emerald-500/40">
              <svg className="w-5 h-5 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-indigo-200/70">Study Session</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Join Session</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 p-2 text-gray-400 transition hover:border-white/30 hover:text-white hover:bg-white/5"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
          <label className="flex flex-col gap-2 text-sm text-gray-300">
            Your Name
            <input
              type="text"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="Enter your name"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-gray-300">
            Session ID
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value.toUpperCase())}
              placeholder="Enter session ID"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none font-mono tracking-wider"
              required
            />
            <p className="text-xs text-gray-500">Get the session ID from the session leader</p>
          </label>

          {error && <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</p>}

          <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-2xl border border-gray-700/50 bg-gray-900/50 px-6 py-3 text-sm font-semibold text-gray-300 transition hover:border-gray-600 hover:bg-gray-800/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(16,185,129,0.25)] transition-all hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-[0_16px_40px_rgba(16,185,129,0.35)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Joining...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Join Session
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinSessionModal;

