import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Flame,
  Plus,
  Sparkles,
  Shuffle,
  Trophy,
} from "lucide-react";
import {
  useFitnessStore,
  getTodayISO,
  getDayName,
  DAY_LABELS,
  type Exercise,
} from "@/store/fitnessStore";
import { useHydrated } from "@/hooks/useHydrated";
import { Onboarding } from "@/components/Onboarding";
import { ExercisePickerModal } from "@/components/ExercisePicker";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — FitTrack" },
      { name: "description", content: "Your daily workout and food log." },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const hydrated = useHydrated();
  const onboarded = useFitnessStore((s) => s.onboarded);

  // Avoid SSR hydration mismatch: `new Date()` and Zustand-persisted state
  // both differ between server render and client.
  if (!hydrated) {
    return <div className="flex min-h-screen flex-col gap-4 p-4" />;
  }
  if (!onboarded) {
    return <Onboarding />;
  }
  return <TodayContent />;
}

function TodayContent() {
  const todayISO = getTodayISO();
  const todayDay = getDayName();
  const store = useFitnessStore();
  const todayLog = store.getTodayLog();
  const template = store.getTodayTemplate();
  const exercises = template?.exercises || [];
  const templateId = store.weekPlan[todayDay] || null;
  const weekProgress = store.getWeekProgress();
  const goals = store.goals;

  const todayFood = todayLog.food;
  const totalCalories = Math.round(
    todayFood.reduce((s, f) => s + f.calories, 0)
  );
  const totalProtein = Math.round(
    todayFood.reduce((s, f) => s + f.protein, 0)
  );
  const totalCarbs = Math.round(todayFood.reduce((s, f) => s + f.carbs, 0));
  const totalFat = Math.round(todayFood.reduce((s, f) => s + f.fat, 0));

  const completedCount = todayLog.exercisesCompleted.length;
  const totalExercises = exercises.length;
  const allDone = totalExercises > 0 && completedCount === totalExercises;

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex min-h-screen flex-col gap-3 p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {DAY_LABELS[todayDay]}
          </p>
          <h1 className="text-xl font-bold text-foreground">{todayLabel}</h1>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs font-semibold text-primary">
          <Flame className="h-3.5 w-3.5" />
          <span>{store.streak} day streak</span>
        </div>
      </div>

      {/* Week Progress */}
      <div className="rounded-xl bg-card p-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            This week
          </span>
          <span className="text-xs font-bold text-foreground">
            {weekProgress.completed}/{weekProgress.total}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{
              width: `${
                weekProgress.total > 0
                  ? (weekProgress.completed / weekProgress.total) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* Workout Section */}
      <div className="rounded-xl bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">
                {template ? template.name : "Rest Day"}
              </h2>
              {template && (
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <Sparkles className="h-3 w-3" />
                  Recommended
                </span>
              )}
            </div>
            {template && (
              <p className="text-[11px] text-muted-foreground">
                Suggested plan — swap any exercise for one you prefer
              </p>
            )}
          </div>
          {allDone && (
            <span className="flex items-center gap-1 text-xs font-bold text-primary">
              <Trophy className="h-3.5 w-3.5" />
              Done!
            </span>
          )}
        </div>

        {totalExercises === 0 ? (
          <div className="py-4 text-center">
            <p className="text-xs text-muted-foreground">
              No workout scheduled. Enjoy your rest day.
            </p>
            <Link
              to="/routine"
              className="mt-1 inline-block text-xs font-medium text-primary"
            >
              Edit weekly plan →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {exercises.map((exercise) => (
              <TodayExerciseCard
                key={exercise.id}
                exercise={exercise}
                date={todayISO}
                isDone={todayLog.exercisesCompleted.includes(exercise.id)}
                templateId={templateId}
              />
            ))}
          </div>
        )}

        {totalExercises > 0 && (
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            {completedCount}/{totalExercises} completed
          </p>
        )}
      </div>

      {/* Food / Goals Summary */}
      <div className="rounded-xl bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Food Today</h2>
          <Link
            to="/food"
            className="flex items-center gap-1 text-xs font-medium text-primary"
          >
            Log food
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {todayFood.length === 0 ? (
          <Link
            to="/food"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            Add your first meal
          </Link>
        ) : (
          <>
            <div className="mb-2 flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {totalCalories}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    / {goals.calories}
                  </span>
                </p>
                <p className="text-[10px] text-muted-foreground">calories</p>
              </div>
              <div className="text-right text-[10px] text-muted-foreground">
                {Math.max(0, goals.calories - totalCalories)} left
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <MacroProgress
                label="Protein"
                value={totalProtein}
                goal={goals.protein}
                color="bg-primary"
              />
              <MacroProgress
                label="Carbs"
                value={totalCarbs}
                goal={goals.carbs}
                color="bg-blue-500"
              />
              <MacroProgress
                label="Fat"
                value={totalFat}
                goal={goals.fat}
                color="bg-amber-500"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TodayExerciseCard({
  exercise,
  date,
  isDone,
  templateId,
}: {
  exercise: Exercise;
  date: string;
  isDone: boolean;
  templateId: string | null;
}) {
  const store = useFitnessStore();
  const unit = useFitnessStore((s) => s.weightUnit);
  const setLogs = store.getSetLogs(date, exercise);
  const doneCount = setLogs.filter((s) => s.done).length;
  const [open, setOpen] = useState(!isDone);
  const [swapOpen, setSwapOpen] = useState(false);

  return (
    <div
      className={`rounded-lg border transition-all ${
        isDone
          ? "border-primary/30 bg-primary/10"
          : "border-border bg-surface"
      }`}
    >
      <div className="flex w-full items-center gap-2 p-2.5">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-2.5 text-left"
        >
          <div
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
              isDone
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/30"
            }`}
          >
            {isDone && <Check className="h-3 w-3" />}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-semibold truncate ${
                isDone
                  ? "text-primary line-through opacity-70"
                  : "text-foreground"
              }`}
            >
              {exercise.name}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {doneCount}/{exercise.sets} sets · target {exercise.reps}
            </p>
          </div>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${
              open ? "" : "-rotate-90"
            }`}
          />
        </button>
        {templateId && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSwapOpen(true);
            }}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-card hover:text-primary"
            aria-label="Swap exercise"
            title="Swap for another exercise"
          >
            <Shuffle className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="border-t border-border/60 px-2.5 pb-2.5 pt-2">
          <div className="mb-1 grid grid-cols-[24px_1fr_1fr_32px] items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <span>Set</span>
            <span>{unit}</span>
            <span>Reps</span>
            <span />
          </div>
          <div className="flex flex-col gap-1">
            {setLogs.map((s, i) => (
              <SetRow
                key={i}
                index={i}
                set={s}
                onChange={(patch) =>
                  store.updateSetLog(date, exercise, i, patch)
                }
              />
            ))}
          </div>
        </div>
      )}

      {swapOpen && templateId && (
        <ExercisePickerModal
          title={`Swap "${exercise.name}"`}
          onPick={(picked) => {
            store.replaceExerciseInTemplate(templateId, exercise.id, {
              name: picked.name,
              sets: picked.defaultSets,
              reps: picked.defaultReps,
            });
            setSwapOpen(false);
          }}
          onClose={() => setSwapOpen(false)}
        />
      )}
    </div>
  );
}

function SetRow({
  index,
  set,
  onChange,
}: {
  index: number;
  set: { done: boolean; weight: number; reps: number };
  onChange: (patch: Partial<{ done: boolean; weight: number; reps: number }>) => void;
}) {
  return (
    <div
      className={`grid grid-cols-[24px_1fr_1fr_32px] items-center gap-2 rounded-md px-1 py-0.5 ${
        set.done ? "bg-primary/10" : ""
      }`}
    >
      <span className="text-center text-sm font-bold text-foreground">
        {index + 1}
      </span>
      <input
        type="number"
        inputMode="decimal"
        pattern="[0-9]*"
        value={set.weight || ""}
        placeholder="0"
        onChange={(e) =>
          onChange({ weight: parseFloat(e.target.value) || 0 })
        }
        className="no-spinner w-full rounded-md border border-border bg-card px-1.5 py-1.5 text-center text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
      />
      <input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        value={set.reps || ""}
        placeholder="0"
        onChange={(e) =>
          onChange({ reps: parseInt(e.target.value, 10) || 0 })
        }
        className="no-spinner w-full rounded-md border border-border bg-card px-1.5 py-1.5 text-center text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
      />
      <button
        onClick={() => onChange({ done: !set.done })}
        aria-label={set.done ? "Mark set undone" : "Mark set done"}
        className={`flex h-7 w-7 items-center justify-center rounded-md border-2 transition-colors ${
          set.done
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/30 text-transparent hover:border-primary/60"
        }`}
      >
        <Check className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function MacroProgress({
  label,
  value,
  goal,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
}) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  return (
    <div className="rounded-lg bg-surface p-1.5 text-center">
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-sm font-bold text-foreground">
        {value}
        <span className="text-[10px] font-normal text-muted-foreground">
          /{goal}g
        </span>
      </p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}