const PlanCard = ({ plan, stats = { total: 0, completed: 0, percent: 0 }, isActive, onSelect }) => {
  const duration = plan.startDate && plan.endDate
    ? `${new Date(plan.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(plan.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : "Flexible timeline";

  const tag = plan.id === "plan-ai-template" ? "AI Template" : "Custom Track";

  return (
    <button
      onClick={() => onSelect(plan.id)}
      className={`relative overflow-hidden group flex w-full flex-col rounded-[28px] border px-5 py-6 text-left shadow-[0_25px_60px_rgba(8,8,15,0.45)] transition ${
        isActive
          ? "border-indigo-400/60 bg-gradient-to-br from-[#1c1c2e] via-[#11111b] to-[#07070b]"
          : "border-white/10 bg-gradient-to-br from-[#14141f] via-[#0c0c13] to-[#060609]"
      }`}
    >
      <span className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100" aria-hidden="true">
        <span className="absolute -inset-10 rounded-[34px] bg-gradient-to-br from-indigo-500/20 via-transparent to-pink-500/25 blur-3xl" />
      </span>
      <span className="pointer-events-none absolute inset-[2px] rounded-[26px] border border-white/5" aria-hidden="true" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-indigo-300/80">{tag}</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{plan.programName}</h3>
            <p className="mt-1 text-sm text-gray-400">{duration}</p>
          </div>
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200">
            {plan.priority?.replace(/^\w/, (c) => c.toUpperCase()) || "Balanced"}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-400">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-gray-500">Courses</p>
            <p className="mt-1 text-xl font-semibold text-white">{plan.courses?.length || 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-gray-500">Modules</p>
            <p className="mt-1 text-xl font-semibold text-white">{stats.total}</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Progress</span>
            <span>
              {stats.completed}/{stats.total} modules
            </span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/5">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#EC4899] transition-[width] duration-500"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-gray-300">
          {plan.courses?.slice(0, 3).map((course, index) => (
            <span
              key={`${plan.id}-${course.name}-${index}`}
              className="rounded-full border border-white/10 px-3 py-1 text-gray-200 group-hover:border-indigo-400/60 group-hover:text-white"
            >
              {course.name || `Course ${index + 1}`}
            </span>
          ))}
          {plan.courses && plan.courses.length > 3 && (
            <span className="rounded-full border border-white/10 px-3 py-1 text-gray-400">
              +{plan.courses.length - 3} more
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default PlanCard;
