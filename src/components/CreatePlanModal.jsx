import { useEffect, useState } from "react";
import { buildCourseBlueprint, generateCustomPlan } from "../utils/planUtils";

const CreatePlanModal = ({ onClose, onCreate }) => {
  const [programName, setProgramName] = useState("");
  const [courseCount, setCourseCount] = useState(3);
  const [courses, setCourses] = useState(() => buildCourseBlueprint(3));
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const today = new Date();
    const start = today.toISOString().split("T")[0];
    const end = new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    setStartDate(start);
    setEndDate(end);
  }, []);

  const handleCourseCountChange = (value) => {
    const next = Math.max(1, Math.min(10, Number(value) || 1));
    setCourseCount(next);
    setCourses((prev) => buildCourseBlueprint(next, prev));
  };

  const handleCourseFieldChange = (index, field, value) => {
    setCourses((prev) =>
      prev.map((course, idx) => {
        if (idx !== index) return course;
        if (field === "modules") {
          return { ...course, modules: Math.max(1, Number(value) || 1) };
        }
        return { ...course, [field]: value };
      }),
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!programName.trim()) {
      setError("Please enter a program name.");
      return;
    }

    if (courses.some((course) => !course.name.trim())) {
      setError("Please name every course.");
      return;
    }

    if (courses.some((course) => Number(course.modules) <= 0)) {
      setError("Each course must have at least one module.");
      return;
    }

    if (!startDate || !endDate) {
      setError("Select both start and end dates.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date must be before end date.");
      return;
    }

    const newPlan = generateCustomPlan({
      programName,
      courses,
      startDate,
      endDate,
      priority: "custom",
    });

    onCreate(newPlan);
  };

  const moveCourse = (index, direction) => {
    setCourses((prev) => {
      const updated = [...prev];
      if (direction === "up" && index > 0) {
        [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      }
      if (direction === "down" && index < updated.length - 1) {
        [updated[index + 1], updated[index]] = [updated[index], updated[index + 1]];
      }
      return updated;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="absolute inset-0 animate-gradient bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10" />
      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/10 bg-[#08080c]/95 shadow-[0_40px_120px_rgba(3,3,7,0.85)]">
        <div className="flex items-center justify-between border-b border-white/5 px-8 py-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-indigo-200/70">New KAUST Plan</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Design your custom journey</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 p-2 text-gray-400 transition hover:border-white/30 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto px-8 py-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-gray-300">
              Program Name
              <input
                type="text"
                value={programName}
                onChange={(event) => setProgramName(event.target.value)}
                placeholder="e.g., KAUST Robotics Track"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-gray-300">
              Number of Courses
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={courseCount}
                  onChange={(event) => handleCourseCountChange(event.target.value)}
                  className="flex-1 accent-indigo-500"
                />
                <span className="w-12 text-center text-xl font-semibold text-white">{courseCount}</span>
              </div>
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between text-sm text-gray-400">
              <p>Courses & modules</p>
              <p>Name each course and set its module count.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {courses.map((course, index) => (
                <div
                  key={`course-${index}`}
                  className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-gray-300"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-4">
                    <label className="flex-1 text-sm">
                      <span className="text-xs uppercase tracking-[0.35em] text-gray-500">Course {index + 1}</span>
                      <input
                        type="text"
                        value={course.name}
                        onChange={(event) => handleCourseFieldChange(index, "name", event.target.value)}
                        placeholder={`Course ${index + 1} name`}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-[#07070b]/80 px-4 py-3 text-base text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none"
                        required
                      />
                    </label>
                    <label className="md:w-32 text-sm">
                      <span className="text-xs uppercase tracking-[0.35em] text-gray-500">Modules</span>
                      <input
                        type="number"
                        min="1"
                        value={course.modules}
                        onChange={(event) => handleCourseFieldChange(index, "modules", event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-[#07070b]/80 px-3 py-2 text-center text-base text-white focus:border-indigo-500 focus:outline-none"
                        required
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-gray-300">
              Start Date
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white focus:border-indigo-500 focus:outline-none"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-gray-300">
              End Date
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white focus:border-indigo-500 focus:outline-none"
                required
              />
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <p>Priority order</p>
              <p>Reorder courses based on importance.</p>
            </div>
            <div className="space-y-3">
              {courses.map((course, index) => (
                <div
                  key={`priority-${course.name}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200"
                >
                  <div>
                    <p className="text-white">{course.name || `Course ${index + 1}`}</p>
                    <p className="text-xs text-gray-400">Modules: {course.modules}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => moveCourse(index, "up")}
                      className="rounded-full border border-white/20 px-3 py-1 text-gray-200 transition hover:border-white/40"
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCourse(index, "down")}
                      className="rounded-full border border-white/20 px-3 py-1 text-gray-200 transition hover:border-white/40"
                      disabled={index === courses.length - 1}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</p>}

          <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 px-6 py-3 text-sm font-semibold text-gray-300 transition hover:border-white/40 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/20"
            >
              <span className="text-lg leading-none">✦</span>
              Save Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePlanModal;
