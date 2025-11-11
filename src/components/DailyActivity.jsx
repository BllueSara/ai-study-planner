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


};

export default DailyActivity;
