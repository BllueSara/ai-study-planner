// Auto-generate sequential study dates if not provided
export const generateDates = (startDate, durationWeeks, lessons) => {
    const result = [];
    let currentDate = new Date(startDate);
    const totalDays = durationWeeks * 7;

    for (let i = 0; i < lessons.length; i++) {
        const lesson = { ...lessons[i] };
        lesson.date = lesson.date || currentDate.toDateString().slice(4, 10);
        lesson.week = Math.floor(i / 7) + 1;
        result.push(lesson);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return result;
};
