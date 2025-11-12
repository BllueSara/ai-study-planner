import { STUDY_PLAN } from "../data/studyPlan";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
export const STORAGE_KEY = "kaustPrograms";

const extractIsoFromId = (id = "", fallback = "") => {
  if (!id) return fallback;
  const match = id.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : fallback;
};

export const PRIORITY_OPTIONS = [
  { value: "balanced", label: "Balanced Flow", description: "Evenly distribute modules across the timeline." },
  { value: "intensive", label: "Intensive Start", description: "Front-load modules for an early momentum burst." },
  { value: "reflective", label: "Reflective Pace", description: "Gentler cadence with breathing room each week." },
];

export const generateId = (prefix = "plan") => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

export const buildCourseBlueprint = (count, current = []) => {
  const result = current.slice(0, count).map((course, index) => ({
    name: course.name || `Course ${index + 1}`,
    modules: Math.max(1, Number(course.modules) || 3),
    included: course.included !== false,
  }));
  while (result.length < count) {
    result.push({
      name: `Course ${result.length + 1}`,
      modules: 3,
      included: true,
    });
  }
  return result;
};

const normalizeEntries = () =>
  STUDY_PLAN.map((entry, index) => {
    const iso = entry.dateISO || extractIsoFromId(entry.id, `2025-11-${11 + index}`);
    const dateLabel = entry.date || new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric" });
    return {
      ...entry,
      id: entry.id || `${iso}-${index}`,
      dateISO: iso,
      date: dateLabel,
      completed: Boolean(entry.completed),
      notes: entry.notes || "",
    };
  });

export const createBasePlan = () => ({
  id: "plan-ai-template",
  programName: "AI Study Planner",
  summary: "Mathematics • Python • Data Science",
  startDate: "2025-11-11",
  endDate: "2025-12-04",
  priority: "balanced",
  createdAt: Date.now(),
  courses: [
    { id: "ai-math-track", name: "Mathematics Foundations", modules: 10 },
    { id: "ai-python-track", name: "Python Basics", modules: 5 },
    { id: "ai-data-track", name: "Data Science Essentials", modules: 4 },
  ],
  entries: normalizeEntries(),
});

const createModuleBank = (courses) => {
  const tasks = [];
  courses.forEach((course, courseIndex) => {
    if (course.included === false) return;
    const safeName = course.name?.trim() || `Course ${courseIndex + 1}`;
    const moduleCount = Math.max(1, Number(course.modules) || 1);
    for (let moduleIndex = 1; moduleIndex <= moduleCount; moduleIndex += 1) {
      tasks.push({
        focus: safeName,
        lesson: `Module ${moduleIndex}`,
        course: safeName,
        phase: `${safeName} Track`,
      });
    }
  });
  return tasks;
};

const allocateTasksToDays = (tasks, totalDays) => {
  const buckets = Array.from({ length: totalDays }, () => []);
  if (!tasks.length) return buckets;

  if (totalDays === 1 || tasks.length === 1) {
    buckets[0] = [...tasks];
    return buckets;
  }

  let assigned = 0;
  for (let dayIndex = 0; dayIndex < totalDays; dayIndex += 1) {
    const proportional = Math.round(((dayIndex + 1) * tasks.length) / totalDays);
    let count = proportional - assigned;
    if (dayIndex === totalDays - 1) {
      count = tasks.length - assigned;
    }
    count = Math.max(0, count);

    for (let step = 0; step < count && assigned < tasks.length; step += 1) {
      buckets[dayIndex].push(tasks[assigned]);
      assigned += 1;
    }
  }

  return buckets;
};

const buildBufferEntry = ({ planId, iso, label, dayIndex, programName }) => {
  const safeId = planId || "plan";
  const safeName = programName || "Study Plan";
  return {
    id: `${safeId}-${iso}-buffer-${dayIndex}`,
    dateISO: iso,
    date: label,
    week: Math.floor(dayIndex / 7) + 1,
    focus: `${safeName} Flex`,
    lesson: "Review / Catch-up",
    course: safeName,
    phase: "Flex Day",
    completed: false,
    notes: "Use this day to review, reflect, or prepare for the next modules.",
    isBuffer: true,
  };
};

export const distributeTasks = (tasks, startDate, endDate, planId, programName) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.max(1, Math.floor((end - start) / DAY_IN_MS) + 1);
  const schedule = [];
  const dayBuckets = allocateTasksToDays(tasks, totalDays);

  for (let dayIndex = 0; dayIndex < totalDays; dayIndex += 1) {
    const currentDate = new Date(start.getTime() + dayIndex * DAY_IN_MS);
    const iso = currentDate.toISOString().split("T")[0];
    const label = currentDate.toLocaleString("en-US", { month: "short", day: "numeric" });
    const tasksForDay = dayBuckets[dayIndex];

    if (!tasksForDay.length) {
      schedule.push(buildBufferEntry({ planId, iso, label, dayIndex, programName }));
      continue;
    }

    tasksForDay.forEach((task, slot) => {
      schedule.push({
        ...task,
        id: `${planId || "plan"}-${iso}-${slot}`,
        dateISO: iso,
        date: label,
        week: Math.floor(dayIndex / 7) + 1,
        completed: false,
        notes: task.notes || "",
      });
    });
  }

  return schedule;
};

export const generateCustomPlan = ({ programName, courses, startDate, endDate, priority, planId, createdAt }) => {
  const cleanName = programName.trim() || "KAUST Custom Track";
  const finalId = planId || generateId("plan");
  const normalizedCourses = courses.map((course, index) => ({
    ...course,
    modules: Math.max(1, Number(course.modules) || 1),
    id: course.id || generateId(`course-${index}`),
  }));
  const tasks = createModuleBank(normalizedCourses);
  const entries = distributeTasks(tasks, startDate, endDate, finalId, cleanName);
  const summary = normalizedCourses.map((course) => course.name?.trim()).filter(Boolean).slice(0, 3).join(" • ");

  return {
    id: finalId,
    programName: cleanName,
    summary: summary || "Custom KAUST Journey",
    startDate,
    endDate,
    priority,
    createdAt: createdAt || Date.now(),
    courses: normalizedCourses,
    entries,
  };
};

export const calculatePlanStats = (entries = []) => {
  const total = entries.length;
  const completed = entries.filter((entry) => entry.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, percent };
};

export const loadPlans = () => {
  if (typeof window === "undefined") return [createBasePlan()];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [createBasePlan()];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) {
      return [createBasePlan()];
    }
    return parsed;
  } catch (error) {
    console.warn("Failed to parse stored plans", error);
    return [createBasePlan()];
  }
};

export const savePlans = (plans) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
};
