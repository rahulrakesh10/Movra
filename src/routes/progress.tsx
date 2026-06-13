import { createFileRoute } from "@tanstack/react-router";
import { Flame, Trophy, TrendingUp, CalendarDays, UtensilsCrossed, Dumbbell } from "lucide-react";
import { useFitnessStore, getTodayISO } from "@/store/fitnessStore";
import { useHydrated } from "@/hooks/useHydrated";

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
  const todayCalories = Math.round(
    todayLog.food.reduce((s, f) => s + f.calories, 0)
  );
  const todayProtein = Math.round(
    todayLog.food.reduce((s, f) => s + f.protein, 0)
  );
  const calPct = goals.calories > 0
    ? Math.min(100, (todayCalories / goals.calories) * 100)
    : 0;

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
    const completed = routineExercises.length > 0 && log.exercisesCompleted.length === routineExercises.length;
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

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Progress</h1>
        <p className="text-sm text-muted-foreground">Your fitness journey</p>
      </div>

      {/* Streak Card */}
      <div className="rounded-xl bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Flame className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{streak}</p>
            <p className="text-sm text-muted-foreground">Day streak</p>
          </div>
        </div>
      </div>

      {/* ============ GYM SECTION ============ */}
      <div className="flex items-center gap-2 pt-1">
        <Dumbbell className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Gym tracking
        </h2>
      </div>

      {/* This Week — gym */}
      <div className="rounded-xl bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">This Week</h2>
          <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
            <TrendingUp className="h-3.5 w-3.5" />
            {weekProgress.total > 0
              ? `${Math.round((weekProgress.completed / weekProgress.total) * 100)}%`
              : "0%"}
          </div>
        </div>

        {/* Day Grid */}
        <div className="mb-3 grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div key={day.day} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {day.label}
              </span>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
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
                  <Trophy className="h-4 w-4" />
                ) : day.partial ? (
                  <span className="text-xs">
                    {day.completedCount}/{day.exerciseCount}
                  </span>
                ) : (
                  <span className="text-xs">-</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Completion</span>
          <span className="text-xs font-bold text-foreground">
            {weekProgress.completed}/{weekProgress.total} days
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{
              width: `${weekProgress.total > 0 ? (weekProgress.completed / weekProgress.total) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Past Weeks */}
      <div className="rounded-xl bg-card p-4">
        <h2 className="mb-3 text-lg font-bold text-foreground">Past Weeks</h2>
        {pastWeeks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No history yet. Keep logging your workouts!
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {pastWeeks.map((week) => (
              <div key={week.label}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-foreground">{week.label}</span>
                  <span className="text-sm font-bold text-primary">
                    {week.completed}/{week.total}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
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
      <div className="flex items-center gap-2 pt-2">
        <UtensilsCrossed className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Calorie tracking
        </h2>
      </div>

      {/* Today's calories */}
      <div className="rounded-xl bg-card p-4">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Today
            </p>
            <p className="text-3xl font-bold text-foreground">
              {todayCalories}
              <span className="ml-1 text-base font-normal text-muted-foreground">
                / {goals.calories}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">{todayProtein}g</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              protein
            </p>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${calPct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {Math.max(0, goals.calories - todayCalories)} kcal left
        </p>
      </div>

      {/* Weekly calorie bars */}
      <div className="rounded-xl bg-card p-4">
        <h2 className="mb-3 text-lg font-bold text-foreground">This Week</h2>
        <div className="flex h-32 items-end justify-between gap-2">
          {weekDays.map((d) => {
            const pct = Math.round((d.calories / maxWeekCals) * 100);
            const hitGoal =
              d.calories > 0 &&
              d.calories >= goals.calories * 0.9 &&
              d.calories <= goals.calories * 1.1;
            return (
              <div
                key={d.day}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <span className="text-[10px] font-bold text-foreground">
                  {d.calories > 0 ? d.calories : ""}
                </span>
                <div className="flex h-20 w-full items-end overflow-hidden rounded-md bg-muted">
                  <div
                    className={`w-full rounded-md transition-all ${
                      hitGoal
                        ? "bg-primary"
                        : d.calories > 0
                          ? "bg-primary/40"
                          : "bg-transparent"
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
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Goal: {goals.calories} kcal</span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-primary" />
            on target
          </span>
        </div>
      </div>

      {/* Total Workouts */}
      <div className="rounded-xl bg-card p-4">
        <h2 className="mb-3 text-lg font-bold text-foreground">All Time</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Workouts Done"
            value={Object.values(store.logs).reduce(
              (sum, log) => sum + log.exercisesCompleted.length,
              0
            )}
            icon={<Trophy className="h-5 w-5" />}
          />
          <StatCard
            label="Meals Logged"
            value={Object.values(store.logs).reduce(
              (sum, log) => sum + log.food.length,
              0
            )}
            icon={<CalendarDays className="h-5 w-5" />}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
