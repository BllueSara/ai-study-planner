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
  // Distribute all tasks across available days, preserving course order
  // The tasks array already comes in course order from createModuleBank
  
  // Group tasks by course to maintain course integrity and order
  const tasksByCourse = [];
  let currentCourse = null;
  let currentCourseTasks = [];
  
  tasks.forEach((task) => {
    const courseName = task.course || task.focus || "Unknown";
    if (courseName !== currentCourse) {
      // New course detected - save previous course's tasks
      if (currentCourse !== null && currentCourseTasks.length > 0) {
        tasksByCourse.push({ course: currentCourse, tasks: [...currentCourseTasks] });
      }
      // Start new course
      currentCourse = courseName;
      currentCourseTasks = [task];
    } else {
      // Same course - add to current course tasks
      currentCourseTasks.push(task);
    }
  });
  
  // Don't forget the last course
  if (currentCourse !== null && currentCourseTasks.length > 0) {
    tasksByCourse.push({ course: currentCourse, tasks: [...currentCourseTasks] });
  }

  // Calculate total tasks
  const totalTasks = tasks.length;
  
  console.log(`allocateTasksToDays: Distributing ${totalTasks} tasks across ${totalDays} days`);
  console.log(`Courses: ${tasksByCourse.map(c => `${c.course} (${c.tasks.length} tasks)`).join(', ')}`);
  
  // CRITICAL: ALL tasks must be distributed - distribute sequentially by course
  // Simple and guaranteed strategy: 
  // 1. Go through each course in order
  // 2. For each course, distribute all its modules
  // 3. Try to keep modules of same course together
  // 4. If a day already has this course, prefer adding to it
  // 5. Otherwise, add to current day and move forward
  // 6. GUARANTEE: Every single task will be added to a bucket
  
  let tasksAdded = 0;
  
  // Distribute tasks evenly across all days while preserving course order
  // Strategy: Distribute tasks evenly across all available days
  const allTasks = [];
  
  // Flatten all tasks while preserving course order
  tasksByCourse.forEach(({ course, tasks: courseTasks }) => {
    courseTasks.forEach((task) => {
      allTasks.push({ task, course });
    });
  });
  
  // Calculate how to distribute tasks evenly
  // If we have fewer tasks than days, distribute them evenly spaced
  // If we have more tasks than days, distribute them evenly across all days
  let currentTaskIndex = 0;
  
  if (totalTasks <= totalDays) {
    // Fewer tasks than days - distribute evenly spaced across the timeline
    const spacing = totalDays / totalTasks;
    for (let i = 0; i < totalTasks; i += 1) {
      const dayIndex = Math.min(Math.floor(i * spacing), totalDays - 1);
      buckets[dayIndex].push(allTasks[i].task);
      currentTaskIndex += 1;
      tasksAdded += 1;
    }
  } else {
    // More tasks than days - distribute evenly across all days
    const avgTasksPerDay = totalTasks / totalDays;
    const baseTasksPerDay = Math.floor(avgTasksPerDay);
    const extraTasks = totalTasks % totalDays;
    
    for (let dayIndex = 0; dayIndex < totalDays; dayIndex += 1) {
      // Calculate how many tasks this day should get
      const tasksForThisDay = baseTasksPerDay + (dayIndex < extraTasks ? 1 : 0);
      
      // Add tasks to this day
      for (let i = 0; i < tasksForThisDay && currentTaskIndex < allTasks.length; i += 1) {
        buckets[dayIndex].push(allTasks[currentTaskIndex].task);
        currentTaskIndex += 1;
        tasksAdded += 1;
      }
    }
  }
  
  // Ensure all remaining tasks are added (safety check)
  while (currentTaskIndex < allTasks.length) {
    // Find day with least tasks
    let bestDayIndex = 0;
    let minTasks = buckets[0].length;
    
    for (let d = 0; d < totalDays; d += 1) {
      if (buckets[d].length < minTasks) {
        minTasks = buckets[d].length;
        bestDayIndex = d;
      }
    }
    
    buckets[bestDayIndex].push(allTasks[currentTaskIndex].task);
    currentTaskIndex += 1;
    tasksAdded += 1;
  }
  
  console.log(`allocateTasksToDays: Added ${tasksAdded} tasks to buckets (expected ${totalTasks})`);

  // Verify all tasks are included (safety check)
  const allocatedTaskKeys = new Set();
  buckets.forEach((bucket) => {
    bucket.forEach((task) => {
      const taskKey = `${task.course || task.focus}-${task.lesson}`;
      allocatedTaskKeys.add(taskKey);
    });
  });

  // Check if any tasks are missing and add them
  tasks.forEach((task) => {
    const taskKey = `${task.course || task.focus}-${task.lesson}`;
    if (!allocatedTaskKeys.has(taskKey)) {
      // Add missing task to the day with least tasks
      let bestDayIndex = 0;
      let minTasks = buckets[0].length;
      
      for (let dayIndex = 0; dayIndex < totalDays; dayIndex += 1) {
        if (buckets[dayIndex].length < minTasks) {
          minTasks = buckets[dayIndex].length;
          bestDayIndex = dayIndex;
        }
      }
      
      buckets[bestDayIndex].push(task);
    }
  });

  // Final count verification - CRITICAL: ensure ALL tasks are distributed
  const totalAllocated = buckets.reduce((sum, bucket) => sum + bucket.length, 0);
  if (totalAllocated !== tasks.length) {
    console.error(`CRITICAL: Task allocation mismatch! ${totalAllocated} allocated vs ${tasks.length} total tasks`);
    console.error(`Courses: ${tasksByCourse.map(c => `${c.course} (${c.tasks.length} tasks)`).join(', ')}`);
    
    // Emergency: add all remaining tasks to ensure nothing is lost
    const finalAllocatedKeys = new Set();
    buckets.forEach((bucket) => {
      bucket.forEach((task) => {
        finalAllocatedKeys.add(`${task.course || task.focus}-${task.lesson}`);
      });
    });
    
    // Find all missing tasks and add them
    const missingTasks = [];
    tasks.forEach((task) => {
      const taskKey = `${task.course || task.focus}-${task.lesson}`;
      if (!finalAllocatedKeys.has(taskKey)) {
        missingTasks.push(task);
      }
    });
    
    // Add missing tasks to days with least tasks
    missingTasks.forEach((task) => {
      let bestDayIndex = 0;
      let minTasks = buckets[0].length;
      
      for (let dayIndex = 0; dayIndex < totalDays; dayIndex += 1) {
        if (buckets[dayIndex].length < minTasks) {
          minTasks = buckets[dayIndex].length;
          bestDayIndex = dayIndex;
        }
      }
      
      buckets[bestDayIndex].push(task);
      console.warn(`Added missing task: ${task.course || task.focus} - ${task.lesson} to day ${bestDayIndex}`);
    });
    
    // Final verification
    const finalTotal = buckets.reduce((sum, bucket) => sum + bucket.length, 0);
    if (finalTotal !== tasks.length) {
      console.error(`FATAL: Still missing tasks after emergency allocation! ${finalTotal} vs ${tasks.length}`);
    } else {
      console.log(`✓ All ${tasks.length} tasks successfully allocated after emergency fix`);
    }
  } else {
    // Log successful allocation for debugging
    const courseSummary = tasksByCourse.map(c => `${c.course}: ${c.tasks.length}`).join(', ');
    console.log(`✓ All ${tasks.length} tasks allocated across ${totalDays} days. Courses: ${courseSummary}`);
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
  // Parse dates correctly - use local time to avoid timezone issues
  // Parse YYYY-MM-DD format as local date (not UTC)
  let start, end;
  
  if (typeof startDate === 'string' && startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Parse as local date to avoid timezone shift
    const [year, month, day] = startDate.split('-').map(Number);
    start = new Date(year, month - 1, day);
  } else {
    start = new Date(startDate);
  }
  
  if (typeof endDate === 'string' && endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Parse as local date to avoid timezone shift
    const [year, month, day] = endDate.split('-').map(Number);
    end = new Date(year, month - 1, day);
  } else {
    end = new Date(endDate);
  }
  
  // Calculate total days correctly
  const totalDays = Math.max(1, Math.floor((end - start) / DAY_IN_MS) + 1);
  const schedule = [];
  
  // Verify dates match input
  const startISO = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
  const endISO = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
  
  console.log(`distributeTasks: Starting distribution of ${tasks.length} tasks across ${totalDays} days (${startDate} to ${endDate})`);
  console.log(`distributeTasks: Parsed dates - start: ${startISO}, end: ${endISO}, totalDays: ${totalDays}`);
  
  const dayBuckets = allocateTasksToDays(tasks, totalDays);
  
  // Verify buckets before creating schedule
  const totalInBuckets = dayBuckets.reduce((sum, bucket) => sum + bucket.length, 0);
  console.log(`distributeTasks: Buckets contain ${totalInBuckets} tasks (expected ${tasks.length})`);

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
    console.error(`Tasks breakdown:`, tasks.map(t => `${t.course || t.focus}-${t.lesson}`));
    console.error(`Schedule breakdown:`, schedule.map(s => `${s.course || s.focus}-${s.lesson}`));
  } else {
    console.log(`✓ distributeTasks: Successfully scheduled all ${tasks.length} tasks`);
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