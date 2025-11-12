import React, { useEffect, useMemo, useState } from "react";

const StudyTracker = ({ plan, toggleComplete }) => {
    const weeks = useMemo(() => [...new Set(plan.map((item) => item.week))].sort((a, b) => a - b), [plan]);
    const [openWeek, setOpenWeek] = useState(() => weeks[0] ?? null);

    // Check if this is the AI plan (has focus field and phase field, typical of original AI plan structure)
    const isAIPlan = useMemo(() => {
        return plan.length > 0 && plan.some((item) => item.focus && item.phase);
    }, [plan]);

    useEffect(() => {
        if (weeks.length === 0) return;
        setOpenWeek((prev) => {
            if (prev && weeks.includes(prev)) {
                return prev;
            }
            return weeks[0] ?? null;
        });
    }, [weeks]);

    return (
        <section className="space-y-4">
            <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-900/40 bg-indigo-500/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-indigo-200">
                    <svg className="h-4 w-4 text-indigo-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.75h16.5M3.75 9.75h16.5M6.75 13.75h10.5M9.75 17.75h4.5" />
                    </svg>
                    Schedule
                </div>
                <h2 className="text-2xl font-semibold text-white">Study Tracker</h2>
                <p className="text-sm text-gray-400">Open a week to review tasks and mark them complete.</p>
            </div>

            <div className="space-y-4">
                {weeks.map((week) => {
                    const weekItems = plan.filter((item) => item.week === week);
                    const isOpen = openWeek === week;
                    const startLabel = weekItems[0]?.date;
                    const endLabel = weekItems[weekItems.length - 1]?.date;

                    return (
                        <div key={week} className="rounded-2xl border border-indigo-900/40 bg-[#151518]/80 shadow-md shadow-indigo-900/20 backdrop-blur-md">
                            <button
                                onClick={() => setOpenWeek((prev) => (prev === week ? null : week))}
                                className="flex w-full items-center justify-between gap-4 rounded-2xl px-6 py-5 text-left transition-all duration-300 hover:scale-[1.01]"
                            >
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-gray-500">Week {week}</p>
                                    {startLabel && endLabel && (
                                        <p className="text-sm text-gray-400">
                                            {startLabel} — {endLabel}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                    <span className="rounded-full bg-indigo-900/40 px-3 py-1 text-indigo-200">
                                        {weekItems.filter((day) => day.completed).length}/{weekItems.length} done
                                    </span>
                                    <svg
                                        className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
                                    </svg>
                                </div>
                            </button>

                            {isOpen && (
                                <div className="space-y-3 border-t border-indigo-900/30 px-6 py-5">
                                    {weekItems.filter((day) => !day.isBuffer && (isAIPlan ? true : day.lesson)).map((day) => (
                                        <article
                                            key={day.id}
                                            className="relative overflow-hidden rounded-2xl border border-indigo-900/20 bg-[#0F0F12]/80 p-4 shadow-inner shadow-black/20 transition-all duration-300 hover:scale-[1.01]"
                                        >
                                            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-indigo-400 to-transparent" />
                                            {isAIPlan ? (
                                                // Original AI plan structure with focus, course, lesson, date
                                                <>
                                                    <div className="flex flex-wrap items-center gap-3 pl-4 text-xs text-gray-400">
                                                        <span className="rounded-full bg-indigo-900/40 px-3 py-1 text-indigo-200">{day.date}</span>
                                                        {day.lesson && (
                                                            <span className="rounded-full border border-indigo-900/40 px-3 py-1 text-gray-300">{day.lesson}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-3 pl-4 md:flex-row md:items-center md:justify-between">
                                                        <div>
                                                            {day.focus && (
                                                                <p className="text-base font-semibold text-white">{day.focus}</p>
                                                            )}
                                                            {day.course && (
                                                                <p className="text-sm text-gray-400">{day.course}</p>
                                                            )}
                                                            {day.notes && (
                                                                <p className="text-xs text-gray-500">{day.notes}</p>
                                                            )}
                                                        </div>
                                                        <label className="flex items-center justify-center gap-3 text-sm text-gray-300 md:self-center" htmlFor={`task-${day.id}`}>
                                                            <input
                                                                type="checkbox"
                                                                checked={day.completed}
                                                                onChange={() => toggleComplete(day.id)}
                                                                className="peer sr-only"
                                                                id={`task-${day.id}`}
                                                            />
                                                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-indigo-500/40 bg-[#0B0B0E] text-transparent shadow-[0_0_12px_rgba(79,70,229,0.35)] transition-all duration-300 peer-checked:border-indigo-200 peer-checked:bg-indigo-500 peer-checked:text-white peer-checked:shadow-[0_0_18px_rgba(79,70,229,0.65)]">
                                                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12.5l4 4L18 8.5" />
                                                                </svg>
                                                            </span>
                                                            <span className="text-xs uppercase tracking-wide text-gray-400">Mark complete</span>
                                                        </label>
                                                    </div>
                                                </>
                                            ) : (
                                                // Custom plan structure: course + lesson only
                                                <div className="flex flex-col gap-3 pl-4 md:flex-row md:items-center md:justify-between">
                                                    <div>
                                                        {day.course && (
                                                            <p className="text-base font-semibold text-white">{day.course}</p>
                                                        )}
                                                        {day.lesson && (
                                                            <p className="text-sm text-gray-400">{day.lesson}</p>
                                                        )}
                                                    </div>
                                                    <label className="flex items-center justify-center gap-3 text-sm text-gray-300 md:self-center" htmlFor={`task-${day.id}`}>
                                                        <input
                                                            type="checkbox"
                                                            checked={day.completed}
                                                            onChange={() => toggleComplete(day.id)}
                                                            className="peer sr-only"
                                                            id={`task-${day.id}`}
                                                        />
                                                        <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-indigo-500/40 bg-[#0B0B0E] text-transparent shadow-[0_0_12px_rgba(79,70,229,0.35)] transition-all duration-300 peer-checked:border-indigo-200 peer-checked:bg-indigo-500 peer-checked:text-white peer-checked:shadow-[0_0_18px_rgba(79,70,229,0.65)]">
                                                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12.5l4 4L18 8.5" />
                                                            </svg>
                                                        </span>
                                                        <span className="text-xs uppercase tracking-wide text-gray-400">Mark complete</span>
                                                    </label>
                                                </div>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default StudyTracker;
