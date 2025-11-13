import React, { useMemo } from "react";

const buildPlaceholder = () =>
    Array.from({ length: 7 }, (_, index) => ({ id: `placeholder-${index}`, date: `Day ${index + 1}`, completed: false }));

const DailyActivity = ({ data = [] }) => {
    const recentDays = data.length ? data.slice(-7) : buildPlaceholder();

    const analytics = useMemo(() => {
        let current = 0;
        let best = 0;
        let completed = 0;

        recentDays.forEach((day) => {
            if (day.completed) {
                completed += 1;
                current += 1;
                best = Math.max(best, current);
            } else {
                current = 0;
            }
        });

        const total = recentDays.length || 1;
        return {
            completed,
            remaining: total - completed,
            completionRate: Math.round((completed / total) * 100),
            streak: best,
        };
    }, [recentDays]);

    return (
        <section className="rounded-2xl border border-indigo-900/30 bg-[#151518]/80 p-6 shadow-md shadow-indigo-900/20 backdrop-blur-md">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm text-gray-400">Daily Activity (7 days)</p>
                    <p className="text-3xl font-semibold text-white">{analytics.completionRate}%</p>
                    <p className="text-xs text-gray-500">Completion rate</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-400">Current Streak</p>
                    <p className="text-2xl font-semibold text-white">{analytics.streak} day{analytics.streak === 1 ? "" : "s"}</p>
                    <p className="text-xs text-gray-500">
                        {analytics.completed} done • {analytics.remaining} remaining
                    </p>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-7 gap-3">
                {recentDays.map((day) => {
                    const isCompleted = Boolean(day.completed);
                    const label = day.date || "Day";
                    return (
                        <div
                            key={day.id || label}
                            className={`rounded-2xl border px-3 py-4 text-center transition ${
                                isCompleted
                                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                                    : "border-gray-700/40 bg-[#101014] text-gray-400"
                            }`}
                        >
                            <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
                            <div className="mt-3 text-xl font-semibold text-white">{isCompleted ? "✓" : "–"}</div>
                            <p className="mt-1 text-xs text-gray-400">{isCompleted ? "Completed" : "Pending"}</p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default DailyActivity;
