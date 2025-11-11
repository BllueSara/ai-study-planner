import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PlanCard from "./components/PlanCard";
import { loadPlans, savePlans, calculatePlanStats } from "./utils/planUtils";

const Home = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("plan-ai-template");
  const [planStats, setPlanStats] = useState({});

  useEffect(() => {
    const loadedPlans = loadPlans();
    setPlans(loadedPlans);

    const stats = {};
    loadedPlans.forEach((plan) => {
      stats[plan.id] = calculatePlanStats(plan.entries || []);
    });
    setPlanStats(stats);

    if (loadedPlans.length > 0) {
      setSelectedPlanId(loadedPlans[0].id);
    }
  }, []);

  const handleSelectPlan = (planId) => {
    setSelectedPlanId(planId);
    if (planId === "plan-ai-template") {
      navigate("/ai");
    } else {
      navigate(`/ai?plan=${planId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E10] font-inter text-gray-100">
      <div className="relative isolate">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-indigo-500/40 via-transparent to-transparent blur-3xl opacity-70" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-12 space-y-12">
          <header className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#181828]/90 via-[#101019]/90 to-[#09090f]/95 p-6 md:p-8 shadow-[0_25px_80px_rgba(8,8,15,0.65)] backdrop-blur space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-900/40 bg-indigo-500/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-indigo-300">
                  <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
                  KAUST Academy
                </div>
                <div className="space-y-3">
                  <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                    Welcome to the KAUST Study Planner
                  </h1>
                  <p className="text-gray-300 text-base md:text-lg max-w-3xl">
                    Build a personalized KAUST journey.
                    Define your program, courses, modules, and schedule all within one elegant dashboard.
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => navigate("/plan/new")}
                  className="inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-8 py-3 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(99,102,241,0.4)] transition hover:-translate-y-0.5"
                >
                  <span className="text-xl">+</span>
                  Add My Plan
                </button>
              </div>
            </div>
          </header>

          <section className="space-y-8">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Your Programs</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">All Study Plans</h2>
              <p className="mt-1 text-sm text-gray-400">
                {plans.length === 0
                  ? "Start your journey by clicking the Add My Plan button."
                  : `You have ${plans.length} plan${plans.length !== 1 ? "s" : ""} in progress.`}
              </p>
            </div>

            {plans.length === 0 ? (
              <div className="rounded-2xl border border-indigo-900/40 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent px-8 py-12 text-center">
                <p className="text-gray-300">No plans yet. Click the “Add My Plan” button to create your first study plan!</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                  <div key={plan.id} className="group relative">
                    <PlanCard
                      plan={plan}
                      stats={planStats[plan.id] || { total: 0, completed: 0, percent: 0 }}
                      isActive={selectedPlanId === plan.id}
                      onSelect={handleSelectPlan}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

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

    </div>
  );
};

export default Home;
