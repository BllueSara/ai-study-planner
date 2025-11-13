import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildCourseBlueprint, generateCustomPlan, loadPlans, savePlans } from "../utils/planUtils";

const CreatePlanPage = () => {
  const navigate = useNavigate();
  const [programName, setProgramName] = useState("");
  const [courseCount, setCourseCount] = useState(3);
  const [courses, setCourses] = useState(() => buildCourseBlueprint(3));
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const today = new Date();
    const start = today.toISOString().split("T")[0];
    const end = new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    setStartDate(start);
    setEndDate(end);
  }, []);

  const handleCourseCountChange = (value) => {
    const count = Math.max(1, Math.min(10, Number(value) || 1));
    setCourseCount(count);
    setCourses((prev) => buildCourseBlueprint(count, prev));
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!programName.trim()) {
      setError("Please enter a program name.");
      return;
    }

    if (courses.some((course) => !course.name.trim())) {
      setError("Please name every course.");
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

    setIsSaving(true);
    try {
      const newPlan = generateCustomPlan({
        programName,
        courses,
        startDate,
        endDate,
        priority: "custom",
      });

      const storedPlans = loadPlans();
      savePlans([...storedPlans, newPlan]);
      navigate(`/ai?plan=${newPlan.id}`);
    } catch (creationError) {
      console.error(creationError);
      setError("Something went wrong while generating your plan. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-gray-100">
      <div className="relative isolate flex min-h-screen flex-col items-center px-4 py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.22),_transparent_55%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-indigo-500/20 via-transparent to-transparent blur-3xl" />

        <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/10 bg-[#08080c]/95 shadow-[0_40px_120px_rgba(3,3,7,0.85)]">
          <div className="flex items-center justify-between border-b border-white/5 px-8 py-6">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.35em] text-indigo-200/70">Planner Lab</p>
              <h2 className="text-2xl font-semibold text-white">Create My KAUST Plan</h2>

            </div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-full border border-white/10 px-3 py-1 text-gray-400 transition hover:border-white/30 hover:text-white"
            >
              Close
            </button>
          </div>

          <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto px-8 py-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-gray-300">
                <span>Program Name</span>
                <input
                  type="text"
                  value={programName}
                  onChange={(event) => setProgramName(event.target.value)}
                  placeholder="e.g., Artificial Intelligence Specialization"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none"
                />
              </label>
              <label className="space-y-2 text-sm text-gray-300">
                <span>Number of Courses</span>
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

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-gray-300">
                <span>Start date</span>
                <input
                  type="date"
                  className="w-full rounded-2xl border border-white/10 bg-[#09090B] px-4 py-3 text-gray-100 focus:border-indigo-400 focus:outline-none"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </label>
              <label className="space-y-2 text-sm text-gray-300">
                <span>End date</span>
                <input
                  type="date"
                  className="w-full rounded-2xl border border-white/10 bg-[#09090B] px-4 py-3 text-gray-100 focus:border-indigo-400 focus:outline-none"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </label>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between text-sm text-gray-400">
                <p>Courses and modules</p>
                <p>Name each course, set modules, and include/exclude as needed.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {courses.map((course, index) => (
                  <div key={`course-${index}`} className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-gray-300">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                        <label className="flex-1 text-sm">
                          <span className="text-xs uppercase tracking-[0.35em] text-gray-500">Course {index + 1}</span>
                          <input
                            type="text"
                            value={course.name}
                            onChange={(event) => handleCourseFieldChange(index, "name", event.target.value)}
                            placeholder={`Course ${index + 1} name`}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-[#07070b]/80 px-4 py-3 text-base text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none"
                          />
                        </label>
                        <label className="w-full text-sm sm:w-40">
                          <span className="text-xs uppercase tracking-[0.35em] text-gray-500">Modules</span>
                          <input
                            type="number"
                            min="1"
                            value={course.modules}
                            onChange={(event) => handleCourseFieldChange(index, "modules", event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-[#07070b]/80 px-3 py-2 text-center text-base text-white focus:border-indigo-500 focus:outline-none"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                        className="rounded-full border border-white/20 px-3 py-1 text-gray-200 transition hover:border-white/40 disabled:opacity-30"
                        disabled={index === 0}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveCourse(index, "down")}
                        className="rounded-full border border-white/20 px-3 py-1 text-gray-200 transition hover:border-white/40 disabled:opacity-30"
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

            <div className="flex flex-col gap-4 pb-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-2xl border border-white/10 px-6 py-3 text-sm font-semibold text-gray-300 transition hover:border-white/40 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-6 py-3 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(99,102,241,0.4)] transition hover:scale-[1.01] disabled:opacity-40"
              >
                {isSaving ? "Generating..." : "Generate Plan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePlanPage;
