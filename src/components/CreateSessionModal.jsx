import { useState } from "react";

const CreateSessionModal = ({ onClose, onCreate }) => {
  const [sessionName, setSessionName] = useState("");
  const [duration, setDuration] = useState(3600); // Default 1 hour in seconds
  const [leaderName, setLeaderName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!sessionName.trim()) {
      setError("Please enter a session name.");
      return;
    }

    if (!leaderName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (duration <= 0) {
      setError("Duration must be greater than 0.");
      return;
    }

    onCreate({
      sessionName: sessionName.trim(),
      duration: parseInt(duration, 10),
      leaderName: leaderName.trim(),
    });
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="absolute inset-0 animate-gradient bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10" />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-[#08080c]/95 shadow-[0_40px_120px_rgba(3,3,7,0.85)]">
        <div className="flex items-center justify-between border-b border-white/5 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-indigo-600/20 border border-indigo-500/40">
              <svg className="w-5 h-5 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-indigo-200/70">Study Session</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Create Session</h2>
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
              value={leaderName}
              onChange={(e) => setLeaderName(e.target.value)}
              placeholder="Enter your name"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-gray-300">
            Session Name
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g., Math Study Group"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-gray-300">
            Duration
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <input
                  type="range"
                  min="300"
                  max="14400"
                  step="300"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                  className="flex-1 accent-indigo-500"
                />
                <span className="w-24 text-center text-lg font-semibold text-white">{formatDuration(duration)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1800, 3600, 7200].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setDuration(sec)}
                    className={`rounded-xl border px-3 py-2 text-sm transition ${
                      duration === sec
                        ? "border-indigo-500 bg-indigo-500/20 text-indigo-200"
                        : "border-white/10 bg-white/5 text-gray-300 hover:border-white/30"
                    }`}
                  >
                    {formatDuration(sec)}
                  </button>
                ))}
              </div>
            </div>
          </label>

          {error && <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</p>}

          <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-gray-700/50 bg-gray-900/50 px-6 py-3 text-sm font-semibold text-gray-300 transition hover:border-gray-600 hover:bg-gray-800/50 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-500/40 bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(79,70,229,0.25)] transition-all hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-[0_16px_40px_rgba(79,70,229,0.35)]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSessionModal;

