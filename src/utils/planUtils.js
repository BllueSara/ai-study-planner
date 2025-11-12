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

  if (totalDays === 1) {
    // All tasks go on the single day
    buckets[0] = [...tasks];
    return buckets;
  }

  // CRITICAL: ALL tasks must be included - never delete or skip any modules
  // Distribute all tasks across available days, allowing multiple tasks per day
  // This ensures every module is included regardless of date range length
  
  if (tasks.length >= totalDays) {
    // More or equal tasks than days: distribute all tasks evenly
    // Each day gets at least one task, remaining tasks distributed round-robin
    let taskIndex = 0;
    
    // First pass: give each day at least one task
    for (let dayIndex = 0; dayIndex < totalDays && taskIndex < tasks.length; dayIndex += 1) {
      buckets[dayIndex].push(tasks[taskIndex]);
      taskIndex += 1;
    }
    
    // Second pass: distribute remaining tasks round-robin (ensures all tasks are included)
    while (taskIndex < tasks.length) {
      for (let dayIndex = 0; dayIndex < totalDays && taskIndex < tasks.length; dayIndex += 1) {
        buckets[dayIndex].push(tasks[taskIndex]);
        taskIndex += 1;
      }
    }
  } else {
    // Fewer tasks than days: distribute all tasks evenly across the date range
    // Calculate optimal spacing to spread tasks throughout the timeline
    // All tasks are included, distributed logically across available days
    const spacing = totalDays / tasks.length;
    for (let i = 0; i < tasks.length; i += 1) {
      // Distribute tasks evenly across the timeline
      const dayIndex = Math.min(Math.floor(i * spacing), totalDays - 1);
      buckets[dayIndex].push(tasks[i]);
    }
    
    // All tasks are now included - no duplication needed
    // Some days may have multiple tasks, some may be empty - both are acceptable
    // The key principle: ALL modules must be included, never deleted
  }

  // Verify all tasks are included (safety check)
  // Use task identity based on course + lesson to track allocated tasks
  const allocatedTaskKeys = new Set();
  buckets.forEach((bucket) => {
    bucket.forEach((task) => {
      const taskKey = `${task.course}-${task.lesson}`;
      allocatedTaskKeys.add(taskKey);
    });
  });

  // Check if any tasks are missing and add them
  tasks.forEach((task) => {
    const taskKey = `${task.course}-${task.lesson}`;
    if (!allocatedTaskKeys.has(taskKey)) {
      // Add missing task to the first day with space, or last day if all are full
      let added = false;
      for (let dayIndex = 0; dayIndex < totalDays && !added; dayIndex += 1) {
        buckets[dayIndex].push(task);
        added = true;
      }
      if (!added && totalDays > 0) {
        buckets[totalDays - 1].push(task);
      }
    }
  });

  // Final count verification
  const totalAllocated = buckets.reduce((sum, bucket) => sum + bucket.length, 0);
  if (totalAllocated !== tasks.length) {
    console.error(`CRITICAL: Task allocation failed! ${totalAllocated} allocated vs ${tasks.length} total tasks`);
    // Emergency: add all remaining tasks to the last day
    const finalAllocatedKeys = new Set();
    buckets.forEach((bucket) => {
      bucket.forEach((task) => {
        finalAllocatedKeys.add(`${task.course}-${task.lesson}`);
      });
    });
    
    tasks.forEach((task) => {
      const taskKey = `${task.course}-${task.lesson}`;
      if (!finalAllocatedKeys.has(taskKey)) {
        buckets[totalDays - 1].push(task);
        finalAllocatedKeys.add(taskKey);
      }
    });
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

  // Ensure we have tasks to distribute - if not, return empty schedule
  if (!tasks.length) {
    return schedule;
  }

  // CRITICAL: Include ALL tasks - never skip or delete any modules
  // Some days may have multiple modules, some days may be empty - both are acceptable
  for (let dayIndex = 0; dayIndex < totalDays; dayIndex += 1) {
    const currentDate = new Date(start.getTime() + dayIndex * DAY_IN_MS);
    const iso = currentDate.toISOString().split("T")[0];
    const label = currentDate.toLocaleString("en-US", { month: "short", day: "numeric" });
    const tasksForDay = dayBuckets[dayIndex] || [];

    // Add ALL tasks for this day (can be 0, 1, 2, 3, 4, or more modules per day)
    // This ensures every module is included in the schedule
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

  // Final verification: ensure ALL tasks are in the schedule
  const scheduledTaskKeys = new Set(schedule.map((entry) => `${entry.course}-${entry.lesson}`));
  const missingTasks = tasks.filter((task) => {
    const taskKey = `${task.course}-${task.lesson}`;
    return !scheduledTaskKeys.has(taskKey);
  });

  if (missingTasks.length > 0) {
    console.warn(`Schedule incomplete: ${schedule.length} entries vs ${tasks.length} tasks. Adding ${missingTasks.length} missing tasks.`);
    // Add missing tasks to the last day to ensure nothing is lost
    const lastDayIndex = totalDays - 1;
    const lastDate = new Date(start.getTime() + lastDayIndex * DAY_IN_MS);
    const lastIso = lastDate.toISOString().split("T")[0];
    const lastLabel = lastDate.toLocaleString("en-US", { month: "short", day: "numeric" });
    
    missingTasks.forEach((task, index) => {
      schedule.push({
        ...task,
        id: `${planId || "plan"}-${lastIso}-missing-${index}`,
        dateISO: lastIso,
        date: lastLabel,
        week: Math.floor(lastDayIndex / 7) + 1,
        completed: false,
        notes: task.notes || "",
      });
    });
  }

  // Final count check
  if (schedule.length !== tasks.length) {
    console.error(`CRITICAL: Schedule count mismatch! ${schedule.length} scheduled vs ${tasks.length} tasks`);
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
  
  // Create all modules from all courses
  const tasks = createModuleBank(normalizedCourses);
  
  // Log for debugging
  const totalModules = normalizedCourses.reduce((sum, course) => sum + (course.included !== false ? Number(course.modules) || 1 : 0), 0);
  console.log(`Generating plan: ${normalizedCourses.length} courses, ${totalModules} total modules, ${tasks.length} tasks created`);
  
  // Distribute all tasks across dates
  const entries = distributeTasks(tasks, startDate, endDate, finalId, cleanName);
  
  // Verify final count
  if (entries.length !== tasks.length) {
    console.error(`WARNING: Entry count mismatch! ${entries.length} entries vs ${tasks.length} tasks`);
  } else {
    console.log(`✓ All ${tasks.length} modules successfully distributed across ${entries.length} schedule entries`);
  }
  
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
