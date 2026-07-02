import { createFileRoute } from "@tanstack/react-router";
import {
  Flame,
  Trophy,
  TrendingUp,
  CalendarDays,
  UtensilsCrossed,
  Dumbbell,
  AlertTriangle,
  Award,
  BarChart3,
  Scale,
} from "lucide-react";
import { useFitnessStore, getTodayISO } from "@/store/fitnessStore";
import { useHydrated } from "@/hooks/useHydrated";
import {
  computeVolumeTrend,
  computePersonalRecords,
  computeMuscleGroupBalance,
  detectImbalances,
} from "@/lib/analytics";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from "recharts";
import { useMemo } from "react";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Movra" },
      { name: "description", content: "Track your fitness streaks and weekly progress." },
    ],
  }),
  component: ProgressPage,
});

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function ProgressPage() {
  const hydrated = useHydrated();
  if (!hydrated) {
    return <div className="flex min-h-screen flex-col gap-4 p-4" />;
  }
  return <ProgressContent />;
}

function ProgressContent() {
  const store = useFitnessStore();
  const weekProgress = store.getWeekProgress();
  const streak = store.streak;
  const goals = store.goals;

  // ----- Calorie tracking -----
  const todayLog = store.getDayLog(getTodayISO());
  const todayCalories = Math.round(todayLog.food.reduce((s, f) => s + f.calories, 0));
  const todayProtein = Math.round(todayLog.food.reduce((s, f) => s + f.protein, 0));
  const calPct = goals.calories > 0 ? Math.min(100, (todayCalories / goals.calories) * 100) : 0;

  // ----- Analytics data -----
  const volumeTrend = useMemo(() => computeVolumeTrend(store.logs, 6), [store.logs]);
  const personalRecords = useMemo(() => computePersonalRecords(store.logs), [store.logs]);
  const muscleBalance = useMemo(() => computeMuscleGroupBalance(store.logs, 1), [store.logs]);
  const imbalanceWarnings = useMemo(() => detectImbalances(muscleBalance), [muscleBalance]);

  // ----- Body weight data -----
  const weightUnit = store.weightUnit;
  const bodyWeightData = useMemo(() => {
    const entries = Object.entries(store.weightLog)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30);
    return entries.map(([date, kg]) => ({
      date: new Date(date + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      weight: weightUnit === "lb" ? Math.round(kg * 2.205 * 10) / 10 : kg,
    }));
  }, [store.weightLog, weightUnit]);

  // Build week data for display
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const weekDays = DAYS.map((day, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    const routineExercises = store.getTemplateForDay(day)?.exercises || [];
    const log = store.logs[iso] || { exercisesCompleted: [], food: [] };
    const completed =
      routineExercises.length > 0 && log.exercisesCompleted.length === routineExercises.length;
    const partial = routineExercises.length > 0 && log.exercisesCompleted.length > 0 && !completed;
    const isToday = iso === new Date().toISOString().split("T")[0];
    const hasRoutine = routineExercises.length > 0;
    const calories = Math.round(log.food.reduce((s, f) => s + f.calories, 0));

    return {
      day,
      label: day.slice(0, 3).toUpperCase(),
      completed,
      partial,
      isToday,
      hasRoutine,
      exerciseCount: routineExercises.length,
      completedCount: log.exercisesCompleted.length,
      calories,
    };
  });

  const maxWeekCals = Math.max(goals.calories, ...weekDays.map((d) => d.calories), 1);

  // Past weeks
  const pastWeeks = [];
  for (let w = 1; w <= 4; w++) {
    const weekMonday = new Date(monday);
    weekMonday.setDate(monday.getDate() - w * 7);

    let completedDays = 0;
    let totalDays = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekMonday);
      d.setDate(weekMonday.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const dayName = DAYS[i];
      const routineExercises = store.getTemplateForDay(dayName)?.exercises || [];
      const log = store.logs[iso];

      if (routineExercises.length > 0) {
        totalDays++;
        if (log && log.exercisesCompleted.length === routineExercises.length) {
          completedDays++;
        }
      }
    }

    if (totalDays > 0) {
      pastWeeks.push({
        label: `Week of ${weekMonday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        completed: completedDays,
        total: totalDays,
        rate: Math.round((completedDays / totalDays) * 100),
      });
    }
  }

  // Muscle balance chart colors
  const MUSCLE_COLORS = [
    "oklch(0.65 0.20 25)",   // Chest — warm red-orange
    "oklch(0.65 0.18 250)",  // Back — blue
    "oklch(0.70 0.18 50)",   // Shoulders — amber
    "oklch(0.65 0.18 320)",  // Arms — magenta
    "oklch(0.60 0.18 160)",  // Legs — teal
    "oklch(0.70 0.15 130)",  // Core — green
  ];

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Progress</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your fitness journey</p>
      </div>

      {/* Streak Card */}
      <div className="rounded-xl bg-card p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Flame className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{streak}</p>
            <p className="text-xs text-muted-foreground">Day streak</p>
          </div>
        </div>
      </div>

      {/* ── Body Weight Trend ── */}
      {bodyWeightData.length >= 2 && (
        <div className="rounded-xl bg-card p-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">Body Weight</h2>
            </div>
            <span className="text-sm font-bold text-primary">
              {bodyWeightData[bodyWeightData.length - 1].weight} {weightUnit}
            </span>
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bodyWeightData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  domain={["dataMin - 1", "dataMax + 1"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                    color: "var(--foreground)",
                  }}
                  formatter={(value: number) => [`${value} ${weightUnit}`, "Weight"]}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--primary)", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "var(--primary)", strokeWidth: 2, stroke: "var(--card)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ============ GYM SECTION ============ */}
      <div className="flex items-center gap-2">
        <Dumbbell className="h-3.5 w-3.5 text-primary" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Gym tracking
        </h2>
      </div>

      {/* This Week — gym */}
      <div className="rounded-xl bg-card p-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">This Week</h2>
          <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
            <TrendingUp className="h-3 w-3" />
            {weekProgress.total > 0
              ? `${Math.round((weekProgress.completed / weekProgress.total) * 100)}%`
              : "0%"}
          </div>
        </div>

        {/* Day Grid */}
        <div className="mb-2 grid grid-cols-7 gap-1.5">
          {weekDays.map((day) => (
            <div key={day.day} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {day.label}
              </span>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  day.isToday
                    ? "border-2 border-primary text-primary"
                    : day.completed
                      ? "bg-primary text-primary-foreground"
                      : day.partial
                        ? "bg-primary/30 text-primary"
                        : day.hasRoutine
                          ? "bg-surface text-muted-foreground"
                          : "bg-transparent text-muted-foreground/40"
                }`}
              >
                {day.completed ? (
                  <Trophy className="h-3 w-3" />
                ) : day.partial ? (
                  <span className="text-[10px]">
                    {day.completedCount}/{day.exerciseCount}
                  </span>
                ) : (
                  <span className="text-[10px]">-</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Completion</span>
          <span className="text-[10px] font-bold text-foreground">
            {weekProgress.completed}/{weekProgress.total} days
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-200"
            style={{
              width: `${weekProgress.total > 0 ? (weekProgress.completed / weekProgress.total) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* ── Volume Trends Chart ── */}
      {volumeTrend.length > 0 && volumeTrend.some((w) => w.totalVolume > 0) && (
        <div className="rounded-xl bg-card p-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">Volume Trend</h2>
            </div>
            <span className="text-[10px] text-muted-foreground">Last 6 weeks</span>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeTrend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                <XAxis
                  dataKey="weekLabel"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v === "This week" ? "This wk" : v.replace("Week of ", ""))}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                    color: "var(--foreground)",
                  }}
                  formatter={(value: number) => [`${value.toLocaleString()} vol`, "Volume"]}
                  labelFormatter={(label) => label}
                />
                <Line
                  type="monotone"
                  dataKey="totalVolume"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--primary)", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "var(--primary)", strokeWidth: 2, stroke: "var(--card)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Volume = sets × reps × weight</span>
            <span className="font-semibold text-foreground">
              {volumeTrend[volumeTrend.length - 1]?.totalSets ?? 0} sets this week
            </span>
          </div>
        </div>
      )}

      {/* ── Personal Records ── */}
      {personalRecords.length > 0 && (
        <div className="rounded-xl bg-card p-3">
          <div className="mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Personal Records</h2>
          </div>
          <div className="flex flex-col gap-1.5">
            {personalRecords.slice(0, 8).map((pr, i) => (
              <div
                key={pr.exerciseName}
                className="flex items-center gap-2.5 rounded-lg bg-surface px-3 py-2"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    i === 0
                      ? "bg-amber-500/15 text-amber-500"
                      : i === 1
                        ? "bg-gray-400/15 text-gray-400"
                        : i === 2
                          ? "bg-orange-700/15 text-orange-700"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {pr.exerciseName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {pr.bestWeight} × {pr.bestReps} reps
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-primary">{pr.estimated1RM}</p>
                  <p className="text-[9px] text-muted-foreground">est. 1RM</p>
                </div>
              </div>
            ))}
          </div>
          {personalRecords.length > 8 && (
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              +{personalRecords.length - 8} more exercises tracked
            </p>
          )}
        </div>
      )}

      {/* ── Muscle Group Balance ── */}
      {muscleBalance.length > 0 && muscleBalance.some((m) => m.setsPerWeek > 0) && (
        <div className="rounded-xl bg-card p-3">
          <div className="mb-3 flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Muscle Balance</h2>
            <span className="text-[10px] text-muted-foreground">sets / week</span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={muscleBalance}
                margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.3} vertical={false} />
                <XAxis
                  dataKey="group"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                    color: "var(--foreground)",
                  }}
                  formatter={(value: number) => [`${value} sets`, "Sets/week"]}
                />
                <ReferenceLine y={10} stroke="var(--primary)" strokeDasharray="4 4" strokeOpacity={0.4} />
                <Bar dataKey="setsPerWeek" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {muscleBalance.map((_, i) => (
                    <Cell key={i} fill={MUSCLE_COLORS[i % MUSCLE_COLORS.length]} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Dashed line = 10 sets (recommended minimum)</span>
          </div>
        </div>
      )}

      {/* ── Imbalance Warnings ── */}
      {imbalanceWarnings.length > 0 && (
        <div className="flex flex-col gap-2">
          {imbalanceWarnings.map((warning, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 rounded-xl bg-amber-500/10 px-3 py-2.5"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-amber-500">Imbalance detected: </span>
                {warning}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Past Weeks */}
      <div className="rounded-xl bg-card p-3">
        <h2 className="mb-2 text-base font-bold text-foreground">Past Weeks</h2>
        {pastWeeks.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">
            No history yet. Keep logging your workouts!
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {pastWeeks.map((week) => (
              <div key={week.label}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-foreground">{week.label}</span>
                  <span className="text-xs font-bold text-primary">
                    {week.completed}/{week.total}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${week.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============ CALORIE SECTION ============ */}
      <div className="flex items-center gap-2">
        <UtensilsCrossed className="h-3.5 w-3.5 text-primary" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Calorie tracking
        </h2>
      </div>

      {/* Today's calories */}
      <div className="rounded-xl bg-card p-3">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Today
            </p>
            <p className="text-2xl font-bold text-foreground">
              {todayCalories}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                / {goals.calories}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-base font-bold text-foreground">{todayProtein}g</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">protein</p>
          </div>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${calPct}%` }}
          />
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          {Math.max(0, goals.calories - todayCalories)} kcal left
        </p>
      </div>

      {/* Weekly calorie bars */}
      <div className="rounded-xl bg-card p-3">
        <h2 className="mb-2 text-base font-bold text-foreground">This Week</h2>
        <div className="flex h-24 items-end justify-between gap-1.5">
          {weekDays.map((d) => {
            const pct = Math.round((d.calories / maxWeekCals) * 100);
            const hitGoal =
              d.calories > 0 &&
              d.calories >= goals.calories * 0.9 &&
              d.calories <= goals.calories * 1.1;
            return (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-0.5">
                <span className="text-[10px] font-bold text-foreground">
                  {d.calories > 0 ? d.calories : ""}
                </span>
                <div className="flex h-16 w-full items-end overflow-hidden rounded-md bg-muted">
                  <div
                    className={`w-full rounded-md transition-all ${
                      hitGoal ? "bg-primary" : d.calories > 0 ? "bg-primary/40" : "bg-transparent"
                    }`}
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    d.isToday ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Goal: {goals.calories} kcal</span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-sm bg-primary" />
            on target
          </span>
        </div>
      </div>

      {/* Total Workouts */}
      <div className="rounded-xl bg-card p-3">
        <h2 className="mb-2 text-base font-bold text-foreground">All Time</h2>
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            label="Workouts Done"
            value={Object.values(store.logs).reduce(
              (sum, log) => sum + log.exercisesCompleted.length,
              0,
            )}
            icon={<Trophy className="h-4 w-4" />}
          />
          <StatCard
            label="Meals Logged"
            value={Object.values(store.logs).reduce((sum, log) => sum + log.food.length, 0)}
            icon={<CalendarDays className="h-4 w-4" />}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-surface p-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold text-foreground">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
