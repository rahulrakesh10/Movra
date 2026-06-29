import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Flame,
  Plus,
  Sparkles,
  Shuffle,
  Trophy,
  Moon,
  Zap,
  TrendingUp,
  Utensils,
  Timer,
  Pause,
  Play,
  RotateCcw,
  X,
} from "lucide-react";
import { useFitnessStore, getTodayISO, getDayName, type Exercise } from "@/store/fitnessStore";
import { useHydrated } from "@/hooks/useHydrated";
import { Onboarding } from "@/components/Onboarding";
import { ExercisePickerModal } from "@/components/ExercisePicker";
import {
  getLastSessionByName,
  suggestNextWeight,
  isCompoundExercise,
} from "@/lib/progressiveOverload";

const REST_PRESETS = [30, 60, 90, 120, 180] as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Movra" },
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
  const adjustedGoals = store.getAdjustedGoals(todayISO);
  const isRestDay = !template;

  const todayFood = todayLog.food;
  const totalCalories = Math.round(todayFood.reduce((s, f) => s + f.calories, 0));
  const totalProtein = Math.round(todayFood.reduce((s, f) => s + f.protein, 0));
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

  // Context banner logic
  const isLegDay =
    template?.name.toLowerCase().includes("leg") || template?.name.toLowerCase().includes("lower");
  const workoutDoneNoFood = allDone && todayFood.length === 0;

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-foreground">Today</h1>
          <p className="mt-1 text-sm text-muted-foreground">{todayLabel}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm font-semibold text-primary">
          <Flame className="h-4 w-4" />
          <span>{store.streak} day streak</span>
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

        {isRestDay ? (
          /* ────── Rest Day Card ────── */
          <div className="rounded-lg border border-border/60 bg-surface p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <Moon className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Rest & Recover</p>
                <p className="text-[11px] text-muted-foreground">Stretch, walk, stay hydrated</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-md bg-blue-500/5 px-3 py-2">
              <Utensils className="h-3.5 w-3.5 text-blue-400" />
              <p className="text-[11px] text-muted-foreground">
                <span className="font-semibold text-blue-400">Rest day targets:</span>{" "}
                {adjustedGoals.calories} kcal · {adjustedGoals.protein}g protein ·{" "}
                {adjustedGoals.carbs}g carbs
              </p>
            </div>
            <Link to="/routine" className="mt-3 inline-block text-xs font-medium text-primary">
              Edit weekly plan →
            </Link>
          </div>
        ) : totalExercises === 0 ? (
          <div className="py-4 text-center">
            <p className="text-xs text-muted-foreground">
              No workout scheduled. Enjoy your rest day.
            </p>
            <Link to="/routine" className="mt-1 inline-block text-xs font-medium text-primary">
              Edit weekly plan →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {exercises.map((exercise, i) => {
              const prev = exercises[i - 1];
              const next = exercises[i + 1];
              const inSuperset = !!exercise.supersetId;
              const isFirstOfGroup = inSuperset && prev?.supersetId !== exercise.supersetId;
              const isLastOfGroup = inSuperset && next?.supersetId !== exercise.supersetId;
              return (
                <div key={exercise.id} className="relative">
                  {inSuperset && (
                    <div
                      className={`absolute left-0 top-0 h-full w-0.5 bg-primary/50 ${
                        isFirstOfGroup ? "rounded-t-full" : ""
                      } ${isLastOfGroup ? "rounded-b-full" : ""}`}
                    />
                  )}
                  <div className={inSuperset ? "pl-2" : ""}>
                    {isFirstOfGroup && (
                      <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-primary">
                        Superset
                      </div>
                    )}
                    <TodayExerciseCard
                      exercise={exercise}
                      date={todayISO}
                      isDone={todayLog.exercisesCompleted.includes(exercise.id)}
                      templateId={templateId}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalExercises > 0 && (
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            {completedCount}/{totalExercises} completed
          </p>
        )}
      </div>

      {/* ────── Context Banner ────── */}
      {!isRestDay && isLegDay && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2.5">
          <Zap className="h-4 w-4 text-amber-500" />
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-amber-500">Leg Day</span> — fuel up with extra carbs
            for performance
          </p>
        </div>
      )}
      {workoutDoneNoFood && (
        <Link
          to="/food"
          className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2.5 transition-colors hover:bg-primary/15"
        >
          <Utensils className="h-4 w-4 text-primary" />
          <p className="text-xs font-medium text-primary">
            Workout done! Log your post-workout meal →
          </p>
        </Link>
      )}

      {/* Food / Goals Summary */}
      <div className="rounded-xl bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground">Food Today</h2>
            {isRestDay && (
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-400">
                Rest day
              </span>
            )}
          </div>
          <Link to="/food" className="flex items-center gap-1 text-xs font-medium text-primary">
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
                    / {adjustedGoals.calories}
                  </span>
                </p>
                <p className="text-[10px] text-muted-foreground">calories</p>
              </div>
              <div className="text-right text-[10px] text-muted-foreground">
                {Math.max(0, adjustedGoals.calories - totalCalories)} left
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <MacroProgress
                label="Protein"
                value={totalProtein}
                goal={adjustedGoals.protein}
                color="bg-primary"
              />
              <MacroProgress
                label="Carbs"
                value={totalCarbs}
                goal={adjustedGoals.carbs}
                color="bg-blue-500"
              />
              <MacroProgress
                label="Fat"
                value={totalFat}
                goal={adjustedGoals.fat}
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

  // ── Rest timer state ──
  const [restDuration, setRestDuration] = useState(90); // default 90s
  const [timerActive, setTimerActive] = useState(false);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const prevDoneCountRef = useRef(doneCount);

  // Auto-start timer when a set is checked off (doneCount increases)
  useEffect(() => {
    if (doneCount > prevDoneCountRef.current && doneCount < exercise.sets) {
      // A set was just completed, and there are more sets to go
      setTimerSecondsLeft(restDuration);
      setTimerActive(true);
      setTimerPaused(false);
      setTimerDone(false);
    }
    prevDoneCountRef.current = doneCount;
  }, [doneCount, restDuration, exercise.sets]);

  // Countdown interval
  useEffect(() => {
    if (!timerActive || timerPaused) return;
    const interval = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          setTimerDone(true);
          // Vibrate if available
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timerPaused]);

  const dismissTimer = useCallback(() => {
    setTimerActive(false);
    setTimerDone(false);
    setTimerSecondsLeft(0);
    setTimerPaused(false);
  }, []);

  const restartTimer = useCallback(() => {
    setTimerSecondsLeft(restDuration);
    setTimerActive(true);
    setTimerPaused(false);
    setTimerDone(false);
  }, [restDuration]);

  // ── Progressive overload: fetch last session by exercise name ──
  const lastSession = getLastSessionByName(store.logs, exercise.name, date);
  const hasLastSession = lastSession && lastSession.some((s) => s.weight > 0);

  return (
    <div
      className={`rounded-lg border transition-all ${
        isDone ? "border-primary/30 bg-primary/10" : "border-border bg-surface"
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
                isDone ? "text-primary line-through opacity-70" : "text-foreground"
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
          {/* ── Rest Timer ── */}
          {(timerActive || timerDone) && (
            <RestTimerDisplay
              secondsLeft={timerSecondsLeft}
              totalSeconds={restDuration}
              isPaused={timerPaused}
              isDone={timerDone}
              onTogglePause={() => setTimerPaused((p) => !p)}
              onDismiss={dismissTimer}
              onRestart={restartTimer}
            />
          )}

          {/* ── Rest Duration Selector ── */}
          <div className="mb-2 flex items-center gap-1.5">
            <Timer className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Rest
            </span>
            <div className="flex gap-1 ml-auto">
              {REST_PRESETS.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setRestDuration(sec)}
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                    restDuration === sec
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  {sec < 120 ? `${sec}s` : `${sec / 60}m`}
                </button>
              ))}
            </div>
          </div>

          {/* ── Last Session Ghost Row (Progressive Overload) ── */}
          {hasLastSession && (
            <div className="mb-2 rounded-md bg-primary/5 px-2 py-1.5">
              <div className="mb-0.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-primary/70">
                <TrendingUp className="h-2.5 w-2.5" />
                Last session
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                {lastSession!.map((s, i) => (
                  <span key={i} className="text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground/70">
                      {s.weight}
                      {unit}
                    </span>{" "}
                    × {s.reps}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-1 grid grid-cols-[24px_1fr_1fr_32px] items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <span>Set</span>
            <span>{unit}</span>
            <span>Reps</span>
            <span />
          </div>
          <div className="flex flex-col gap-1">
            {setLogs.map((s, i) => {
              // Suggest next weight based on last session
              const suggested =
                lastSession && lastSession[i]
                  ? suggestNextWeight(
                      lastSession[i].weight,
                      lastSession[i].reps,
                      exercise.reps,
                      isCompoundExercise(exercise.name),
                    )
                  : null;
              return (
                <SetRow
                  key={i}
                  index={i}
                  set={s}
                  suggestedWeight={suggested}
                  onChange={(patch) => store.updateSetLog(date, exercise, i, patch)}
                />
              );
            })}
          </div>

          {/* ── Weight tracking nudge ── */}
          {(() => {
            const allCurrentZero = setLogs.every((s) => s.weight === 0);
            const lastAllZero = lastSession && lastSession.every((s) => s.weight === 0);
            const noHistory = !lastSession;

            if (allCurrentZero && isDone) {
              // User completed sets without weight — strong nudge
              return (
                <div className="mt-2 flex items-start gap-2 rounded-md bg-amber-500/10 px-2.5 py-2">
                  <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-semibold text-amber-500">
                      Add weight to track progress!
                    </span>{" "}
                    Logging your weight unlocks overload suggestions and personal records.
                  </p>
                </div>
              );
            }
            if (allCurrentZero && !isDone && lastAllZero) {
              // Repeat zero-weight sessions — gentle reminder
              return (
                <div className="mt-2 flex items-start gap-2 rounded-md bg-amber-500/5 px-2.5 py-1.5">
                  <TrendingUp className="mt-0.5 h-3 w-3 shrink-0 text-amber-500/70" />
                  <p className="text-[10px] text-muted-foreground">
                    You logged 0{unit} last time too — try adding your working weight to see
                    progress over time.
                  </p>
                </div>
              );
            }
            if (allCurrentZero && !isDone && noHistory) {
              // First time — soft hint
              return (
                <div className="mt-2 flex items-start gap-2 rounded-md bg-surface px-2.5 py-1.5">
                  <TrendingUp className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground">
                    <span className="font-medium text-foreground/70">Tip:</span> Enter your weight
                    to track progress and get smart recommendations next session.
                  </p>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}

      {swapOpen && templateId && (
        <ExercisePickerModal
          title={`Swap "${exercise.name}"`}
          currentExerciseName={exercise.name}
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
  suggestedWeight,
  onChange,
}: {
  index: number;
  set: { done: boolean; weight: number; reps: number };
  suggestedWeight: number | null;
  onChange: (patch: Partial<{ done: boolean; weight: number; reps: number }>) => void;
}) {
  const showSuggestion = suggestedWeight && suggestedWeight > 0 && !set.weight;
  return (
    <div
      className={`grid grid-cols-[24px_1fr_1fr_32px] items-center gap-2 rounded-md px-1 py-0.5 ${
        set.done ? "bg-primary/10" : ""
      }`}
    >
      <span className="text-center text-sm font-bold text-foreground">{index + 1}</span>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          pattern="[0-9]*"
          value={set.weight || ""}
          placeholder={showSuggestion ? String(suggestedWeight) : "0"}
          onChange={(e) => onChange({ weight: parseFloat(e.target.value) || 0 })}
          className={`no-spinner w-full rounded-md border px-1.5 py-2.5 text-center text-sm font-semibold text-foreground focus:border-primary focus:outline-none ${
            showSuggestion
              ? "border-primary/30 bg-primary/5 placeholder:text-primary/50"
              : "border-border bg-card"
          }`}
        />
      </div>
      <input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        value={set.reps || ""}
        placeholder="0"
        onChange={(e) => onChange({ reps: parseInt(e.target.value, 10) || 0 })}
        className="no-spinner w-full rounded-md border border-border bg-card px-1.5 py-2.5 text-center text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
      />
      <button
        onClick={() => onChange({ done: !set.done })}
        aria-label={set.done ? "Mark set undone" : "Mark set done"}
        className={`flex h-8 w-8 items-center justify-center rounded-md border-2 transition-colors ${
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

/* ────── Rest Timer Display ────── */
function RestTimerDisplay({
  secondsLeft,
  totalSeconds,
  isPaused,
  isDone,
  onTogglePause,
  onDismiss,
  onRestart,
}: {
  secondsLeft: number;
  totalSeconds: number;
  isPaused: boolean;
  isDone: boolean;
  onTogglePause: () => void;
  onDismiss: () => void;
  onRestart: () => void;
}) {
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 1;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const display = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <div
      className={`mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
        isDone ? "bg-primary/15 animate-pulse" : "bg-surface border border-border/60"
      }`}
    >
      {/* Circular progress */}
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
        <svg className="-rotate-90" width="64" height="64" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted/40"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={isDone ? "text-primary" : isPaused ? "text-amber-500" : "text-primary"}
            style={{ transition: "stroke-dashoffset 0.3s ease" }}
          />
        </svg>
        <span
          className={`absolute text-sm font-bold ${isDone ? "text-primary" : "text-foreground"}`}
        >
          {isDone ? "GO!" : display}
        </span>
      </div>

      {/* Info + controls */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold ${isDone ? "text-primary" : "text-foreground"}`}>
          {isDone ? "Rest complete — next set!" : isPaused ? "Timer paused" : "Resting..."}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {isDone ? "Tap dismiss or start your set" : `${totalSeconds}s rest between sets`}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex shrink-0 items-center gap-1">
        {!isDone && (
          <button
            onClick={onTogglePause}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-surface border border-border text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            aria-label={isPaused ? "Resume timer" : "Pause timer"}
          >
            {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </button>
        )}
        {isDone && (
          <button
            onClick={onRestart}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-surface border border-border text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            aria-label="Restart timer"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        )}
        <button
          onClick={onDismiss}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-surface border border-border text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
          aria-label="Dismiss timer"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
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
        <span className="text-[10px] font-normal text-muted-foreground">/{goal}g</span>
      </p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
