import React from "react";

const trackSummary = (plan = [], keyword) => {
    const normalized = keyword.toLowerCase();
    const scoped = plan.filter((day) => day.phase?.toLowerCase().includes(normalized));
    const completed = scoped.filter((day) => day.completed).length;
    const total = scoped.length || 1;
    return {
        value: scoped.length ? Number(((completed / total) * 100).toFixed(1)) : 0,
        completed,
        total,
    };
};

const buildCourseStats = (plan = []) => {
    const courseMap = new Map();
    plan.forEach((entry) => {
        const label = entry.course || entry.phase || entry.focus;
        if (!label) return;
        if (!courseMap.has(label)) {
            courseMap.set(label, { total: 0, completed: 0 });
        }
        const stats = courseMap.get(label);
        stats.total += 1;
        if (entry.completed) stats.completed += 1;
    });
    return Array.from(courseMap.entries()).map(([label, stats]) => ({
        label,
        total: stats.total,
        completed: stats.completed,
        value: stats.total ? Number(((stats.completed / stats.total) * 100).toFixed(1)) : 0,
    }));
};

const icons = {
    completed: (
        <svg className="h-10 w-10 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" className="opacity-40" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l1.5 1.5L15 9.75" />
        </svg>
    ),
    remaining: (
        <svg className="h-10 w-10 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" className="opacity-40" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3 3" />
        </svg>
    ),
    streak: (
        <svg className="h-10 w-10 text-rose-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 3c-.5 2.5-2 3.5-3 5.5C7 10.5 7 12.5 8 14c1 1.5 2.5 2 4 2 3 0 5-2 5-5 0-2-1-3.5-2-5-.6 3-1.5 4.5-3 6" />
        </svg>
    ),
};

const ProgressSummary = ({ total, completed, streak, plan, goalDays, completedDays }) => {
    const normalizedGoal = goalDays ?? total;
    const normalizedCompleted = completedDays ?? completed;
    const progress = normalizedGoal ? Number(((normalizedCompleted / normalizedGoal) * 100).toFixed(1)) : 0;

    const tracks = [
        { label: "Mathematics", key: "mathematics", accent: "from-indigo-400 via-indigo-500 to-purple-500" },
        { label: "Python", key: "python", accent: "from-blue-500 via-indigo-500 to-indigo-400" },
        { label: "Data Science", key: "data science", accent: "from-sky-500 via-indigo-500 to-indigo-400" },
    ];
    const palette = [
        "from-[#6366F1] via-[#8B5CF6] to-[#EC4899]",
        "from-[#3B82F6] via-[#7C3AED] to-[#6D28D9]",
        "from-[#EC4899] via-[#F97316] to-[#8B5CF6]",
    ];

    const courseStats = buildCourseStats(plan)
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)
        .map((stat, index) => ({
            ...stat,
            accent: palette[index % palette.length],
        }));

    const fallbackTracks = tracks.map((track, index) => {
        const details = trackSummary(plan, track.key);
        return {
            label: track.label,
            value: details.value,
            completed: details.completed,
            total: details.total,
            accent: palette[index % palette.length],
        };
    });

    const displayTracks = courseStats.length ? courseStats : fallbackTracks;

    const stats = [
        { label: "Completed Days", value: normalizedCompleted, icon: icons.completed, accent: "from-emerald-500/20 to-emerald-500/5" },
        { label: "Remaining", value: Math.max(normalizedGoal - normalizedCompleted, 0), icon: icons.remaining, accent: "from-amber-400/20 to-transparent" },
        { label: "Streak", value: `${streak} days`, icon: icons.streak, accent: "from-rose-500/25 to-transparent" },
    ];

    return (
        <section className="space-y-6">
            <div className="rounded-2xl border border-indigo-900/30 bg-[#151518]/80 p-6 shadow-md shadow-indigo-900/20 backdrop-blur-md">
                <div>
                    <p className="text-sm text-gray-400">Overall Progress</p>
                    <div className="flex items-end gap-3">
                        <p className="text-4xl font-semibold text-white">{progress}%</p>
                        <span className="rounded-full bg-indigo-900/40 px-3 py-1 text-xs text-indigo-200">Live</span>
                    </div>
                </div>
                <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-[#1E1E24]">
                    <div
                        className="h-full rounded-full bg-[linear-gradient(110deg,#a5b4fc,45%,#7c3aed,55%,#a5b4fc)] bg-[length:200%_100%] shadow-[0_0_25px_rgba(99,102,241,0.6)] transition-all duration-500 animate-shimmer"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {displayTracks.map((track) => (
                        <div
                            key={track.label}
                            className="rounded-2xl border border-indigo-900/30 bg-gradient-to-br from-[#0F0F12] to-[#0A0A0D] p-4 shadow-inner shadow-indigo-900/10"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-400">{track.label}</p>
                                    <p className="mt-1 text-2xl font-semibold text-white">{track.value}%</p>
                                </div>
                                <div className="text-right text-xs text-gray-500">
                                    <p>{track.completed} done</p>
                                    <p>{track.total} total</p>
                                </div>
                            </div>
                            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#1E1E24]">
                                <div
                                    className={`h-full rounded-full bg-gradient-to-r ${track.accent} transition-all duration-500 animate-gradient`}
                                    style={{ width: `${track.value}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="group relative overflow-hidden rounded-2xl border border-indigo-900/30 bg-[#151518]/80 p-5 shadow-md shadow-indigo-900/20 backdrop-blur-md transition-all duration-300 hover:scale-[1.015]"
                    >
                        <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            <div className={`h-full w-full bg-gradient-to-br ${stat.accent}`} />
                        </div>
                        <div className="relative flex flex-col items-center gap-3 text-center">
                            <div className="rounded-full bg-black/20 p-3 shadow-inner shadow-black/20">
                                {stat.icon}
                            </div>
                            <p className="text-xs uppercase tracking-wide text-gray-400">{stat.label}</p>
                            <p className="text-3xl font-semibold text-white">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default ProgressSummary;
