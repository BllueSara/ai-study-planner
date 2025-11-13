import React, { useEffect, useMemo, useState } from "react";
import { STUDY_PLAN, MOTIVATIONAL_QUOTES } from "./data/studyPlan";
import ProgressSummary from "./components/ProgressSummary";
import StudyTracker from "./components/StudyTracker";
import DailyActivity from "./components/DailyActivity";
import { distributeTasks, generateCustomPlan, loadPlans, savePlans } from "./utils/planUtils";

const TRACKS = [
  {
    id: "mathematics",
    label: "Mathematics",
    description: "Linear algebra, calculus, and probability modules",
    focuses: ["Linear Algebra", "Calculus", "Probability & Statistics"],
  },
  {
    id: "dataScience",
    label: "Data Science",
    description: "Hands-on data manipulation and analysis",
    focuses: ["Introduction to Data Science"],
  },
  {
    id: "pythonBasics",
    label: "Python Basics",
    description: "Python foundations, functions, and files",
    focuses: ["Python Basics", "Functions, Files, and Dictionaries", "Data Collection and Processing with Python", "Python Classes and Inheritance"],
  },
];

const COMMUNITY_LINKS = [
  {
    id: "telegram-channel",
    label: "Telegram Channel",
    description: "Announcements, shared resources, and everything related to the program in one place.",
    href: "https://t.me/Ice_KaustAI",
    badge: "Resources",
  },
  {
    id: "telegram-discussion",
    label: "Discussion Group",
    description: "Chat with others, ask questions, and get support directly from the community.",
    href: "https://t.me/Ice_KaustAIChat",
    badge: "Community",
  },
];

const DEFAULT_TRACK_IDS = TRACKS.map((track) => track.id);
const DAY_IN_MS = 1000 * 60 * 60 * 24;

const buildModalTracksFromCourses = (courses = []) =>
  courses.map((course, index) => ({
    id: course.id || `course-${index}`,
    label: course.name || `Course ${index + 1}`,
    description: `${course.modules || 1} modules`,
    course,
  }));

const extractIsoFromId = (id = "", fallback = "") => {
  if (!id) return fallback;
  const match = id.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : fallback;
};

const getUniqueDayCount = (entries = []) => {
  const seen = new Set();
  entries.forEach((entry, index) => {
    const iso = entry.dateISO || extractIsoFromId(entry.id, `${entry.date || "day"}-${index}`);
    seen.add(iso);
  });
  return seen.size;
};

const getCompletedDayCount = (entries = []) => {
  const seen = new Set();
  entries.forEach((entry, index) => {
    if (!entry.completed) return;
    const iso = entry.dateISO || extractIsoFromId(entry.id, `${entry.date || "day"}-${index}`);
    seen.add(iso);
  });
  return seen.size;
};

const App = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const customPlanId = searchParams.get("plan");
  const [plan, setPlan] = useState([]);
  const [planMeta, setPlanMeta] = useState({
    programName: "AI Study Planner",
    summary: "Mathematics • Python • Data Science",
    startDate: "2025-11-11",
    endDate: "2025-12-04",
    createdAt: Date.now(),
  });
  const [planCourses, setPlanCourses] = useState([]);
  const [quote, setQuote] = useState("");
  const [streak, setStreak] = useState(0);
  const [isCustomModalOpen, setCustomModalOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [trackOrder, setTrackOrder] = useState(() => [...DEFAULT_TRACK_IDS]);
  const [selectedTrackIds, setSelectedTrackIds] = useState(() => [...DEFAULT_TRACK_IDS]);
  const [modalTracks, setModalTracks] = useState(() => [...TRACKS]);
  const [modalError, setModalError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isSourcesOpen, setSourcesOpen] = useState(false);

  const trackModulesMap = useMemo(() => {
    const map = {};
    TRACKS.forEach((track) => {
      map[track.id] = STUDY_PLAN.filter((module) => track.focuses.includes(module.focus));
    });
    return map;
  }, []);

  const modalTrackMap = useMemo(() => {
    const map = new Map();
    modalTracks.forEach((track) => {
      map.set(track.id, track);
    });
    return map;
  }, [modalTracks]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const customPlanId = params.get("plan");

    if (customPlanId) {
      const storedPlans = loadPlans();
      const targetPlan = storedPlans.find((p) => p.id === customPlanId);
      if (targetPlan) {
        setPlan(targetPlan.entries || []);
        setPlanMeta({
          programName: targetPlan.programName,
          summary: targetPlan.summary || "",
          startDate: targetPlan.startDate || "",
          endDate: targetPlan.endDate || "",
          createdAt: targetPlan.createdAt,
        });
        setPlanCourses(targetPlan.courses || []);
        setModalTracks(buildModalTracksFromCourses(targetPlan.courses || []));
        setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
        return;
      }
    }

    const savedRaw = localStorage.getItem("studyPlan");
    let initialPlan = STUDY_PLAN;

    if (savedRaw) {
      try {
        const parsed = JSON.parse(savedRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialPlan = parsed;
        }
      } catch (error) {
        console.warn("Failed to parse saved plan, falling back to default.", error);
      }
    } else {
      localStorage.setItem("studyPlan", JSON.stringify(STUDY_PLAN));
    }

    setPlan(initialPlan);
    setPlanMeta({
      programName: "AI Study Planner",
      summary: "Mathematics • Python • Data Science",
      startDate: "2025-11-11",
      endDate: "2025-12-04",
      createdAt: Date.now(),
    });
    setPlanCourses([]);
    setModalTracks([...TRACKS]);
    setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
  }, []);

  useEffect(() => {
    if (!plan.length) return;
    const params = new URLSearchParams(window.location.search);
    const customPlanId = params.get("plan");

    if (customPlanId) {
      const stored = loadPlans();
      const updated = stored.map((storedPlan) =>
        storedPlan.id === customPlanId ? { ...storedPlan, entries: plan } : storedPlan,
      );
      savePlans(updated);
    } else {
      localStorage.setItem("studyPlan", JSON.stringify(plan));
    }

    const completedDays = plan.filter((day) => day.completed);
    setStreak(completedDays.length ? Math.min(completedDays.length, 7) : 0);
  }, [plan, customPlanId]);

  const toggleComplete = (id) => {
    setPlan((prev) => prev.map((day) => (day.id === id ? { ...day, completed: !day.completed } : day)));
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(""), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (!isCustomModalOpen) return undefined;

    const body = document.body;
    const previous = {
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      touchAction: body.style.touchAction,
    };
    const scrollY = window.scrollY;
    const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    body.style.touchAction = "none";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    if (scrollbarGap > 0) {
      body.style.paddingRight = `${scrollbarGap}px`;
    }

    return () => {
      body.style.overflow = previous.overflow;
      body.style.touchAction = previous.touchAction;
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      body.style.paddingRight = previous.paddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [isCustomModalOpen]);

  const completedCount = plan.filter((d) => d.completed).length;
  const totalCount = plan.length;
  
  // Calculate goalDayCount from actual start and end dates, not from entries
  // This ensures the count reflects the actual date range selected
  const goalDayCount = useMemo(() => {
    if (!planMeta.startDate || !planMeta.endDate) {
      // Fallback to unique day count if dates not available
      const fallback = getUniqueDayCount(plan);
      console.log('goalDayCount: Using fallback (unique days)', fallback);
      return fallback;
    }
    const start = new Date(planMeta.startDate);
    const end = new Date(planMeta.endDate);
    const days = Math.max(1, Math.floor((end - start) / DAY_IN_MS) + 1);
    console.log(`goalDayCount: ${days} days (${planMeta.startDate} to ${planMeta.endDate})`);
    return days;
  }, [planMeta.startDate, planMeta.endDate, plan]);
  
  const completedDayCount = useMemo(() => getCompletedDayCount(plan), [plan]);

  const resetPlan = () => {
    if (customPlanId) return;
    localStorage.setItem("studyPlan", JSON.stringify(STUDY_PLAN));
    setPlan(STUDY_PLAN);
    setPlanMeta({
      programName: "AI Study Planner",
      summary: "Mathematics • Python • Data Science",
      startDate: "2025-11-11",
      endDate: "2025-12-04",
    });
    setPlanCourses([]);
    setModalTracks([...TRACKS]);
    setTrackOrder([...DEFAULT_TRACK_IDS]);
    setSelectedTrackIds([...DEFAULT_TRACK_IDS]);
    setStreak(0);
  };

  const initializeCustomPlanForm = () => {
    const today = new Date();
    const startISO = planMeta.startDate || today.toISOString().split("T")[0];
    const defaultEnd = planMeta.endDate || new Date(today.getTime() + 27 * DAY_IN_MS).toISOString().split("T")[0];
    setCustomStartDate(startISO);
    setCustomEndDate(defaultEnd);

    if (customPlanId && planCourses.length) {
      const tracks = buildModalTracksFromCourses(planCourses);
      const trackIds = tracks.map((track) => track.id);
      setModalTracks(tracks);
      setTrackOrder(trackIds);
      setSelectedTrackIds(trackIds);
    } else {
      setModalTracks([...TRACKS]);
      setTrackOrder([...DEFAULT_TRACK_IDS]);
      setSelectedTrackIds([...DEFAULT_TRACK_IDS]);
    }
    setModalError("");
  };

  const openCustomModal = () => {
    initializeCustomPlanForm();
    setCustomModalOpen(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "custom") {
      openCustomModal();
      params.delete("mode");
      const query = params.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    }
  }, []);

  const closeCustomModal = () => {
    setCustomModalOpen(false);
  };

  const toggleTrackSelection = (id) => {
    setSelectedTrackIds((prev) => (prev.includes(id) ? prev.filter((trackId) => trackId !== id) : [...prev, id]));
  };

  const moveTrack = (id, direction) => {
    setTrackOrder((prev) => {
      const currentIndex = prev.indexOf(id);
      if (currentIndex === -1) return prev;
      const newOrder = [...prev];
      if (direction === "up" && currentIndex > 0) {
        [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
      }
      if (direction === "down" && currentIndex < newOrder.length - 1) {
        [newOrder[currentIndex + 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex + 1]];
      }
      return newOrder;
    });
  };

  const createCustomPlanEntries = (modules, startISO, endISO, planId, programName) => {
    if (!modules.length) return [];
    const safeProgramName = programName?.trim() || planMeta.programName || "KAUST Study Planner";
    const sanitized = modules.map((module, index) => {
      const baseLabel =
        module.trackLabel ||
        module.phase?.replace(/ track$/i, "") ||
        module.course ||
        module.focus ||
        `Course ${index + 1}`;
      return {
        ...module,
        phase: module.phase || `${baseLabel} Track`,
        course: module.course || baseLabel,
      };
    });
    return distributeTasks(sanitized, startISO, endISO, planId || "custom-plan", safeProgramName);
  };

  const handleCustomPlanSubmit = (event) => {
    event.preventDefault();
    setModalError("");

    if (!customStartDate || !customEndDate) {
      setModalError("Please choose both a start date and an end date.");
      return;
    }

    const start = new Date(customStartDate);
    const end = new Date(customEndDate);
    if (start > end) {
      setModalError("Start date must be before the end date.");
      return;
    }

    const prioritizedTracks = trackOrder.filter((id) => selectedTrackIds.includes(id));
    if (!prioritizedTracks.length) {
      setModalError("Select at least one course to include in your plan.");
      return;
    }

    if (customPlanId && planCourses.length) {
      const prioritizedCourses = prioritizedTracks
        .map((trackId) => modalTrackMap.get(trackId)?.course)
        .filter(Boolean);

      if (!prioritizedCourses.length) {
        setModalError("Include at least one course before saving.");
        return;
      }

      const updatedPlan = generateCustomPlan({
        programName: planMeta.programName,
        courses: prioritizedCourses,
        startDate: customStartDate,
        endDate: customEndDate,
        priority: "custom",
        planId: customPlanId,
        createdAt: planMeta.createdAt,
      });

      setPlan(updatedPlan.entries);
      setPlanMeta({
        programName: updatedPlan.programName,
        summary: updatedPlan.summary,
        startDate: updatedPlan.startDate,
        endDate: updatedPlan.endDate,
        createdAt: updatedPlan.createdAt,
      });
      setPlanCourses(updatedPlan.courses);
      const stored = loadPlans();
      savePlans(stored.map((storedPlan) => (storedPlan.id === customPlanId ? updatedPlan : storedPlan)));
      setCustomModalOpen(false);
      setToastMessage("Plan updated successfully!");
      return;
    }

    // Preserve the exact structure from STUDY_PLAN - use modules directly with their original focus, course, and phase
    const modulesToSchedule = [];
    prioritizedTracks.forEach((trackId) => {
      const track = TRACKS.find((t) => t.id === trackId);
      const modules = trackModulesMap[trackId] || [];
      console.log(`handleCustomPlanSubmit: Track ${track?.label || trackId} has ${modules.length} modules`);
      // Use modules directly from STUDY_PLAN to preserve exact structure (focus, course, phase, lesson)
      modules.forEach((module) => {
        modulesToSchedule.push({
          ...module, // Preserve all original fields: focus, course, phase, lesson
          trackLabel: track?.label || module.phase || "Custom",
        });
      });
    });

    console.log(`handleCustomPlanSubmit: Total modules to schedule: ${modulesToSchedule.length}`);
    console.log(`handleCustomPlanSubmit: Selected tracks: ${prioritizedTracks.join(', ')}`);

    if (!modulesToSchedule.length) {
      setModalError("No modules found for the selected tracks.");
      return;
    }

    // Use modules directly with their original structure from STUDY_PLAN
    // Distribute them across the new date range while preserving focus, course, phase, and lesson
    const previewPlanId = customPlanId || "custom-plan-preview";
    
    // Distribute modules directly using distributeTasks to preserve exact structure
    const customPlanEntries = distributeTasks(
      modulesToSchedule,
      customStartDate,
      customEndDate,
      previewPlanId,
      planMeta.programName || "Custom Study Plan"
    );

    if (!customPlanEntries || !customPlanEntries.length) {
      setModalError("Unable to generate a schedule for the selected range.");
      return;
    }

    // Extract courses from entries to match default plan structure
    const courseMap = new Map();
    const studyPlanFocusOrder = [];
    const seenFocuses = new Set();
    
    // Get order from STUDY_PLAN
    STUDY_PLAN.forEach((entry) => {
      if (entry.focus && !seenFocuses.has(entry.focus)) {
        studyPlanFocusOrder.push(entry.focus);
        seenFocuses.add(entry.focus);
      }
    });
    
    // Count modules per focus (course) from the generated entries
    customPlanEntries.forEach((entry) => {
      if (entry.focus && entry.course) {
        const courseName = entry.focus; // Use focus as course name like default plan
        if (!courseMap.has(courseName)) {
          courseMap.set(courseName, {
            name: courseName,
            modules: 0,
            included: true,
          });
        }
        courseMap.get(courseName).modules += 1;
      }
    });

    // Create courses array in STUDY_PLAN order
    const coursesArray = studyPlanFocusOrder
      .filter(focus => courseMap.has(focus))
      .map(focus => courseMap.get(focus));

    const customPlanData = {
      id: previewPlanId,
      programName: planMeta.programName || "Custom Study Plan",
      summary: coursesArray.map(c => c.name).slice(0, 3).join(" • ") || "Custom Plan",
      startDate: customStartDate,
      endDate: customEndDate,
      priority: "custom",
      createdAt: planMeta.createdAt || Date.now(),
      courses: coursesArray,
      entries: customPlanEntries,
    };

    if (!customPlanData.entries || !customPlanData.entries.length) {
      setModalError("Unable to generate a schedule for the selected range.");
      return;
    }

    setPlan(customPlanData.entries);
    setPlanMeta((prev) => ({
      ...prev,
      programName: customPlanData.programName,
      summary: customPlanData.summary,
      startDate: customPlanData.startDate,
      endDate: customPlanData.endDate,
    }));
    setPlanCourses(customPlanData.courses);
    const stored = loadPlans();
    if (customPlanId) {
      // Update existing plan
      savePlans(stored.map((storedPlan) => (storedPlan.id === customPlanId ? customPlanData : storedPlan)));
    } else {
      // Save new plan
      savePlans([...stored, customPlanData]);
    }
    setCustomModalOpen(false);
    setToastMessage("Your AI study plan has been updated!");
  };

  return (
    <div className="min-h-screen bg-[#0E0E10] font-inter text-gray-100">
      <div className="relative isolate">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-indigo-500/40 via-transparent to-transparent blur-3xl opacity-70" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-10">
          <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-900/40 bg-indigo-500/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-indigo-300">
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
                {planMeta.programName}
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold text-white">{planMeta.programName}</h1>
              <p className="text-gray-400 text-sm md:text-base">{planMeta.summary}</p>
              {planMeta.startDate && planMeta.endDate && (
                <p className="text-xs text-gray-500">
                  {planMeta.startDate} → {planMeta.endDate}
                </p>
              )}
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <button
                  onClick={openCustomModal}
                  className="flex-1 rounded-2xl border border-indigo-500/40 bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(79,70,229,0.25)] transition hover:-translate-y-0.5 hover:bg-indigo-500 sm:flex-none"
                >
                  Create Custom Plan
                </button>
                <button
                  onClick={resetPlan}
                  className="flex-1 rounded-2xl border border-gray-700 bg-gray-900/70 px-5 py-3 text-sm font-medium text-gray-200 transition-all duration-300 hover:scale-[1.01] hover:bg-gray-800 sm:flex-none"
                  disabled={Boolean(customPlanId)}
                >
                  Restart
                </button>
                <button
                  onClick={() => setSourcesOpen(true)}
                  className="flex-1 rounded-2xl border border-indigo-500/40 bg-transparent px-5 py-3 text-sm font-semibold text-indigo-200 transition hover:border-indigo-400 hover:text-white sm:flex-none"
                >
                  Sources
                </button>
              </div>
            </div>
          </header>

          <blockquote className="rounded-2xl border border-indigo-900/40 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent px-6 py-4 text-center text-sm text-indigo-200 shadow-lg shadow-indigo-900/20">
            “{quote}”
          </blockquote>

          <ProgressSummary plan={plan} total={totalCount} completed={completedCount} streak={streak} goalDays={goalDayCount} completedDays={completedDayCount} />
          <StudyTracker plan={plan} toggleComplete={toggleComplete} />
          <DailyActivity data={plan.slice(-7)} />

          <footer className="rounded-2xl border border-indigo-900/40 bg-[#0B0B0E]/80 px-6 py-6 text-center text-gray-300 shadow-inner shadow-black/30">
            <p className="text-sm text-gray-200">Built with love to make studying and planning a little easier.</p>
            <p className="mt-1 text-xs text-gray-400">
              Use it to stay organized, track your learning, and keep moving forward & if it helps you, please keep me in your prayers 🤍
            </p>
            <p className="mt-3 text-sm text-indigo-200">Sara Alluhaibi</p>
            <div className="mt-4 flex items-center justify-center gap-4 text-gray-400">
              {[
                {
                  label: "GitHub", href: "https://github.com/BllueSara", icon: (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.28-.01-1.02-.02-2-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.35-1.76-1.35-1.76-1.1-.75.08-.74.08-.74 1.22.09 1.86 1.25 1.86 1.25 1.08 1.85 2.84 1.31 3.53 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.12-.3-.54-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.23 0 4.63-2.81 5.66-5.49 5.96.43.37.81 1.1.81 2.22 0 1.6-.02 2.89-.02 3.28 0 .32.22.69.83.57C20.57 21.79 24 17.29 24 12c0-6.63-5.37-12-12-12Z" />
                    </svg>
                  )
                },
                {
                  label: "LinkedIn", href: "https://www.linkedin.com/in/sara-alluhaibi-08a162320/", icon: (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4.98 3.5a2.5 2.5 0 1 1-.01 5.01 2.5 2.5 0 0 1 .01-5.01ZM3 9h3.96v12H3V9Zm6.74 0H14v1.71h.06c.56-1.05 1.94-2.16 3.99-2.16 4.27 0 5.06 2.81 5.06 6.47V21H19.1v-5.46c0-1.3-.02-2.97-1.81-2.97-1.81 0-2.09 1.42-2.09 2.88V21H11.7V9Z" />
                    </svg>
                  )
                },
                {
                  label: "Twitter", href: "https://x.com/BllueStar1", icon: (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.21 3h3.1l-6.79 7.78L21 21h-5.4l-4.23-6.03L6.37 21H3.27l7.25-8.32L3 3h5.54l3.82 5.44L17.21 3Zm-1.08 16h1.72L7.96 4.9H6.1L16.13 19Z" />
                    </svg>
                  )
                },
              ].map((item) => (
                <a key={item.label} href={item.href} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-indigo-900/40 bg-[#101014] text-gray-300 transition hover:text-white">
                  <span className="sr-only">{item.label}</span>
                  {item.icon}
                </a>
              ))}
            </div>
          </footer>
        </div>
      </div>
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 py-10 backdrop-blur-md overscroll-contain overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-indigo-900/40 bg-[#0F0F12]/95 p-6 shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto overscroll-contain">
            <button
              onClick={closeCustomModal}
              className="absolute right-4 top-4 rounded-full border border-gray-700/50 bg-black/30 p-2 text-gray-400 transition hover:text-white"
              aria-label="Close custom plan builder"
            >
              ✕
            </button>
            <div className="space-y-1 pr-8">
              <p className="text-sm uppercase tracking-[0.4em] text-indigo-300">Planner Lab</p>
              <h3 className="text-2xl font-semibold text-white">Customize My Schedule</h3>
              <p className="text-sm text-gray-400">Pick dates, choose tracks, and prioritize what matters most.</p>
            </div>
            <form onSubmit={handleCustomPlanSubmit} className="mt-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-gray-300">
                  <span>Start date</span>
                  <input
                    type="date"
                    className="w-full rounded-2xl border border-indigo-900/30 bg-[#09090B] px-4 py-3 text-gray-100 focus:border-indigo-400 focus:outline-none"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </label>
                <label className="space-y-2 text-sm text-gray-300">
                  <span>End date</span>
                  <input
                    type="date"
                    className="w-full rounded-2xl border border-indigo-900/30 bg-[#09090B] px-4 py-3 text-gray-100 focus:border-indigo-400 focus:outline-none"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <p>Choose and prioritize your focus tracks</p>
                  <p>Toggle a track or reorder it using arrows.</p>
                </div>
                {trackOrder.map((trackId) => {
                  const track = modalTrackMap.get(trackId);
                  const isActive = selectedTrackIds.includes(trackId);
                  if (!track) return null;
                  return (
                    <div
                      key={track.id}
                      className={`rounded-2xl border px-4 py-4 ${isActive ? "border-indigo-500/40 bg-[#13131A]" : "border-gray-800 bg-[#0B0B0E] opacity-70"} transition`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-base font-semibold text-white">{track.label}</p>
                          <p className="text-sm text-gray-400">{track.description}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <button
                            type="button"
                            onClick={() => moveTrack(track.id, "up")}
                            className="rounded-full border border-indigo-900/30 bg-black/40 px-3 py-1 text-indigo-300 transition hover:text-white"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveTrack(track.id, "down")}
                            className="rounded-full border border-indigo-900/30 bg-black/40 px-3 py-1 text-indigo-300 transition hover:text-white"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleTrackSelection(track.id)}
                            className={`rounded-full border px-3 py-1 transition ${isActive ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border-gray-700 bg-black/30 text-gray-400"}`}
                          >
                            {isActive ? "Included" : "Excluded"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {modalError && <p className="text-sm text-rose-400">{modalError}</p>}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeCustomModal}
                  className="rounded-2xl border border-gray-700 bg-transparent px-5 py-3 text-sm font-medium text-gray-300 transition hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl border border-indigo-500/40 bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(79,70,229,0.25)] transition hover:-translate-y-0.5 hover:bg-indigo-500"
                >
                  Save Custom Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-40">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-[#101016] px-5 py-3 text-sm text-gray-100 shadow-lg shadow-emerald-900/30">
            <span className="text-lg">✅</span>
            <p>{toastMessage}</p>
            <button
              onClick={() => setToastMessage("")}
              className="text-gray-400 transition hover:text-white"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {isSourcesOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSourcesOpen(false)} />
          <div className="relative z-10 w-full max-w-2xl rounded-[28px] border border-indigo-900/40 bg-[#0B0B12] p-6 shadow-[0_40px_120px_rgba(3,3,7,0.85)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-indigo-300/70">Sources</p>
                <h3 className="mt-1 text-2xl font-semibold text-white">Sources</h3>
                <p className="mt-1 text-sm text-gray-400">Note: Everything related to the program lives here—announcements, resources, and contact links for support.</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/10 px-3 py-1 text-gray-400 transition hover:border-white/40 hover:text-white"
                onClick={() => setSourcesOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-6 space-y-4">
              {COMMUNITY_LINKS.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col rounded-2xl border border-indigo-900/30 bg-[#0F0F1B]/80 p-5 transition hover:-translate-y-0.5 hover:border-indigo-500/40 hover:bg-[#1A1A2C]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <span className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.35em] text-indigo-200">
                        {resource.badge}
                      </span>
                      <div>
                        <p className="text-xl font-semibold text-white">{resource.label}</p>
                        <p className="mt-1 text-sm text-gray-400">{resource.description}</p>
                      </div>
                    </div>
                    <span className="text-indigo-300 transition group-hover:text-white">↗</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
