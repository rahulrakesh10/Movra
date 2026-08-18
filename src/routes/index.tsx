import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Clock,
  Brain,
  Plane,
  MapPin,
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
import { generateCoachInsights, computeStrengthHistory } from "@/lib/analytics";
import {
  EQUIPMENT_PROFILES,
  buildSubstitutionOverlay,
  type EquipmentProfile,
} from "@/lib/equipmentSubstitutions";

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

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Crushing it tonight";
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

  // Coach Card insights
  const coachInsights = useMemo(
    () =>
      generateCoachInsights(
        store.logs,
        todayISO,
        exercises.map((e) => ({ name: e.name, reps: e.reps, sets: e.sets })),
        store.streak,
        adjustedGoals.calories,
        totalCalories,
        store.weekPlan,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.logs, todayISO, store.streak, totalCalories],
  );

  // Travel Mode
  const activeTravelMode = store.getActiveTravelMode();
  const [travelModalOpen, setTravelModalOpen] = useState(false);
  const substitutionOverlay = useMemo(
    () =>
      activeTravelMode && activeTravelMode !== "full"
        ? buildSubstitutionOverlay(exercises, activeTravelMode)
        : {},
    [exercises, activeTravelMode],
  );

  const completedCount = todayLog.exercisesCompleted.length;
  const totalExercises = exercises.length;
  const allDone = totalExercises > 0 && completedCount === totalExercises;

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const greeting = getGreeting();

  // Context banner logic
  const isLegDay =
    template?.name.toLowerCase().includes("leg") || template?.name.toLowerCase().includes("lower");
  const workoutDoneNoFood = allDone && todayFood.length === 0;

  // ── Workout duration timer ──
  const hasAnySetDone = useMemo(
    () => exercises.some((ex) => store.getSetLogs(todayISO, ex).some((s) => s.done)),
    [exercises, store, todayISO],
  );
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Start timer when first set is checked
  useEffect(() => {
    if (hasAnySetDone && !allDone && workoutStartTime === null) {
      setWorkoutStartTime(Date.now());
    }
  }, [hasAnySetDone, allDone, workoutStartTime]);

  // Tick every second while workout is in progress
  useEffect(() => {
    if (!workoutStartTime || allDone) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - workoutStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [workoutStartTime, allDone]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Calorie progress ring
  const calPct = adjustedGoals.calories > 0
    ? Math.min(100, (totalCalories / adjustedGoals.calories) * 100)
    : 0;

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4">
      {/* ─── Hero Header ─── */}
      <div
        className="fade-slide-up relative -mx-4 -mt-4 mb-0 overflow-hidden px-4 pb-5 pt-6"
        style={{ background: "var(--gradient-hero)" }}
      >
        {/* Decorative glow orb */}
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, oklch(0.7 0.19 285) 0%, transparent 70%)",
            filter: "blur(20px)",
          }}
        />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">
              {greeting} 👋
            </p>
            <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight text-foreground">
              Today
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{todayLabel}</p>
          </div>
          {/* Animated streak badge */}
          <div
            className="streak-badge flex shrink-0 items-center gap-1.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2"
          >
            <Flame className="fire-flicker h-4 w-4 text-amber-400" />
            <div className="text-right">
              <p className="stat-num text-base font-black leading-none text-amber-400">{store.streak}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-amber-500/70">
                day streak
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Coach Card ─── */}
      {coachInsights.length > 0 && (
        <div className="fade-slide-up flex flex-col gap-2">
          {coachInsights.map((insight, i) => (
            <CoachCard key={i} insight={insight} />
          ))}
        </div>
      )}

      {/* ─── Travel Mode Chip ─── */}
      {!isRestDay && (
        <TravelModeChip
          activeProfile={activeTravelMode}
          onOpen={() => setTravelModalOpen(true)}
        />
      )}

      {/* Workout Duration */}
      {workoutStartTime && !isRestDay && (
        <div className="fade-slide-up-delay-1 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
          <Clock className="h-3.5 w-3.5 text-primary/70" />
          <span className="text-xs text-muted-foreground">
            {allDone ? "Workout completed in" : "Workout in progress"}
          </span>
          <span className="ml-auto text-sm font-black tabular-nums text-primary">
            {formatDuration(elapsedSeconds)}
          </span>
        </div>
      )}

      {/* Workout Section */}
      <div className="gradient-border-top fade-slide-up-delay-1 rounded-xl bg-card p-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex-1 min-w-0">
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
          {/* Workout progress arc */}
          {totalExercises > 0 && (
            <WorkoutProgressRing
              completed={completedCount}
              total={totalExercises}
              allDone={allDone}
            />
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
                      substitutedName={substitutionOverlay[exercise.id] ?? null}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ────── Context Banners ────── */}
      {!isRestDay && isLegDay && (
        <div className="fade-slide-up-delay-2 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5">
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
          className="fade-slide-up-delay-2 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2.5 transition-colors hover:bg-primary/15"
        >
          <Utensils className="h-4 w-4 text-primary" />
          <p className="text-xs font-semibold text-primary">
            Workout done! Log your post-workout meal →
          </p>
        </Link>
      )}

      {/* ─── Food / Goals Summary ─── */}
      <div className="gradient-border-top fade-slide-up-delay-2 rounded-xl bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground">Nutrition</h2>
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
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-4 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            Log your first meal
          </Link>
        ) : (
          <>
            {/* Calorie display + macro rings */}
            <div className="flex items-center gap-4">
              {/* Calorie ring */}
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                <svg className="-rotate-90" width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="33" fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/30" />
                  <circle
                    cx="40" cy="40" r="33"
                    fill="none"
                    stroke="url(#calGrad)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 33}
                    strokeDashoffset={2 * Math.PI * 33 * (1 - calPct / 100)}
                    style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)" }}
                  />
                  <defs>
                    <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="oklch(0.7 0.19 285)" />
                      <stop offset="100%" stopColor="oklch(0.68 0.2 310)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute text-center">
                  <p className="text-sm font-black leading-none text-foreground">{totalCalories}</p>
                  <p className="text-[8px] font-medium text-muted-foreground">kcal</p>
                </div>
              </div>
              {/* Stats */}
              <div className="flex-1">
                <p className="text-[11px] text-muted-foreground">
                  <span className="text-lg font-extrabold text-foreground">{Math.round(calPct)}%</span>
                  {" "}of daily goal
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {Math.max(0, adjustedGoals.calories - totalCalories)} kcal remaining
                </p>
                <div
                  className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/40"
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${calPct}%`,
                      background: "var(--gradient-brand)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Macro Rings */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <MacroRing
                label="Protein"
                value={totalProtein}
                goal={adjustedGoals.protein}
                colorStart="oklch(0.7 0.19 285)"
                colorEnd="oklch(0.68 0.2 310)"
                glowColor="oklch(0.7 0.19 285 / 0.5)"
                gradientId="protGrad"
              />
              <MacroRing
                label="Carbs"
                value={totalCarbs}
                goal={adjustedGoals.carbs}
                colorStart="oklch(0.65 0.18 230)"
                colorEnd="oklch(0.7 0.15 200)"
                glowColor="oklch(0.65 0.18 230 / 0.5)"
                gradientId="carbGrad"
              />
              <MacroRing
                label="Fat"
                value={totalFat}
                goal={adjustedGoals.fat}
                colorStart="oklch(0.8 0.22 50)"
                colorEnd="oklch(0.75 0.2 35)"
                glowColor="oklch(0.8 0.22 50 / 0.5)"
                gradientId="fatGrad"
              />
            </div>
          </>
        )}
      </div>

      <TravelModeModal open={travelModalOpen} onClose={() => setTravelModalOpen(false)} />
    </div>
  );
}

function TodayExerciseCard({
  exercise,
  date,
  isDone,
  templateId,
  substitutedName,
}: {
  exercise: Exercise;
  date: string;
  isDone: boolean;
  templateId: string | null;
  substitutedName: string | null;
}) {
  const store = useFitnessStore();
  const unit = useFitnessStore((s) => s.weightUnit);
  // If travel mode has substituted this exercise, log under the substituted name
  const effectiveExercise: Exercise = substitutedName
    ? { ...exercise, name: substitutedName }
    : exercise;
  const setLogs = store.getSetLogs(date, effectiveExercise);
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
  const lastSession = getLastSessionByName(store.logs, effectiveExercise.name, date);
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
            {/* Original name (crossed out if substituted) */}
            <p
              className={`text-sm font-semibold truncate ${
                isDone ? "text-primary line-through opacity-70" : "text-foreground"
              }`}
            >
              {substitutedName ? (
                <>
                  <span className="line-through text-muted-foreground/50 mr-1">
                    {exercise.name}
                  </span>
                  <span className="text-amber-400">{substitutedName}</span>
                </>
              ) : (
                exercise.name
              )}
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

          {/* ── Strength Sparkline ── */}
          <StrengthSparkline exerciseName={exercise.name} unit={unit} />

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
                  onChange={(patch) => store.updateSetLog(date, effectiveExercise, i, patch)}
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
        onClick={() => {
          onChange({ done: !set.done });
          // Haptic feedback when checking a set
          if (!set.done && navigator.vibrate) {
            navigator.vibrate(50);
          }
        }}
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

/* ─── Workout Progress Ring ─── */
function WorkoutProgressRing({
  completed,
  total,
  allDone,
}: {
  completed: number;
  total: number;
  allDone: boolean;
}) {
  const pct = total > 0 ? completed / total : 0;
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  return (
    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
      {allDone && (
        <span
          className="absolute inset-0 rounded-full"
          style={{
            animation: "pulse-ring 1.2s cubic-bezier(0,0,0.2,1) infinite",
            border: "2px solid oklch(0.7 0.19 285 / 0.5)",
          }}
        />
      )}
      <svg className="-rotate-90" width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="3.5" className="text-muted/30" />
        <circle
          cx="28" cy="28" r={r}
          fill="none"
          stroke={allDone ? "url(#wkGradDone)" : "url(#wkGrad)"}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(0.22,1,0.36,1)" }}
        />
        <defs>
          <linearGradient id="wkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="oklch(0.7 0.19 285)" />
            <stop offset="100%" stopColor="oklch(0.68 0.2 310)" />
          </linearGradient>
          <linearGradient id="wkGradDone" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="oklch(0.7 0.18 160)" />
            <stop offset="100%" stopColor="oklch(0.68 0.2 200)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        {allDone ? (
          <Trophy className="h-4 w-4 text-primary" />
        ) : (
          <>
            <p className="text-xs font-black leading-none text-foreground">{completed}</p>
            <p className="text-[8px] text-muted-foreground">/{total}</p>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Macro Ring ─── */
function MacroRing({
  label,
  value,
  goal,
  colorStart,
  colorEnd,
  glowColor,
  gradientId,
}: {
  label: string;
  value: number;
  goal: number;
  colorStart: string;
  colorEnd: string;
  glowColor: string;
  gradientId: string;
}) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  const isOver = value > goal && goal > 0;
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-surface p-2">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <svg className="-rotate-90" width="56" height="56" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="3.5" className="text-muted/30" />
          <circle
            cx="28" cy="28" r={r}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 0.7s cubic-bezier(0.22,1,0.36,1)",
              filter: pct > 10 ? `drop-shadow(0 0 4px ${glowColor})` : undefined,
            }}
          />
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colorStart} />
              <stop offset="100%" stopColor={colorEnd} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute text-center">
          <p className="text-[11px] font-black leading-none text-foreground">{value}</p>
          <p className="text-[8px] text-muted-foreground">g</p>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`text-[9px] font-medium ${isOver ? "text-amber-400" : "text-muted-foreground/70"}`}>
          {goal > 0 ? `${Math.round(pct)}%` : "—"}
        </p>
      </div>
    </div>
  );
}

/* ────── Coach Card ────── */
function CoachCard({ insight }: { insight: import("@/lib/analytics").CoachInsight }) {
  const accentMap = {
    overload: "border-primary/30 bg-primary/8",
    imbalance: "border-amber-500/30 bg-amber-500/8",
    streak: "border-amber-500/30 bg-amber-500/8",
    nutrition: "border-emerald-500/30 bg-emerald-500/8",
    rest: "border-blue-500/30 bg-blue-500/8",
    pr: "border-amber-500/30 bg-amber-500/8",
  };
  const textMap = {
    overload: "text-primary",
    imbalance: "text-amber-400",
    streak: "text-amber-400",
    nutrition: "text-emerald-400",
    rest: "text-blue-400",
    pr: "text-amber-400",
  };
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
        accentMap[insight.type]
      }`}
    >
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-background/20">
        <Brain className={`h-4 w-4 ${textMap[insight.type]}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{insight.emoji}</span>
          <p className={`text-sm font-bold ${textMap[insight.type]}`}>{insight.title}</p>
          <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
            Movra Coach
          </span>
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{insight.body}</p>
      </div>
    </div>
  );
}

/* ────── Strength Sparkline ────── */
function StrengthSparkline({ exerciseName, unit }: { exerciseName: string; unit: string }) {
  const store = useFitnessStore();
  const history = useMemo(
    () => computeStrengthHistory(store.logs, exerciseName, 8),
    [store.logs, exerciseName],
  );

  if (history.length < 2) return null;

  const values = history.map((p) => p.estimated1RM);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const W = 200;
  const H = 36;
  const pad = 4;
  const stepX = (W - pad * 2) / (values.length - 1);

  const points = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  });

  const lastVal = values[values.length - 1];
  const firstVal = values[0];
  const pctChange = Math.round(((lastVal - firstVal) / firstVal) * 100);
  const isUp = pctChange >= 0;

  return (
    <div className="mb-2 rounded-md bg-primary/5 px-2 py-1.5">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-wider text-primary/70">
          Strength trend · est. 1RM
        </span>
        <span className={`text-[11px] font-black ${
          isUp ? "text-emerald-400" : "text-red-400"
        }`}>
          {isUp ? "↑" : "↓"} {Math.abs(pctChange)}%
        </span>
      </div>
      <div className="relative overflow-hidden rounded">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-9">
          {/* Fill */}
          <defs>
            <linearGradient id={`spark-grad-${exerciseName.replace(/\s/g, "-")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.7 0.19 285)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="oklch(0.7 0.19 285)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points={`${points.join(" ")} ${pad + (values.length - 1) * stepX},${H} ${pad},${H}`}
            fill={`url(#spark-grad-${exerciseName.replace(/\s/g, "-")})`}
          />
          {/* Line */}
          <polyline
            points={points.join(" ")}
            fill="none"
            stroke="oklch(0.7 0.19 285)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Last point dot */}
          <circle
            cx={points[points.length - 1].split(",")[0]}
            cy={points[points.length - 1].split(",")[1]}
            r="2.5"
            fill="oklch(0.7 0.19 285)"
          />
        </svg>
      </div>
      <div className="mt-0.5 flex items-center justify-between text-[9px] text-muted-foreground">
        <span>{history[0].date.slice(5)}</span>
        <span className="font-semibold text-foreground/60">{lastVal} est. 1RM</span>
        <span>{history[history.length - 1].date.slice(5)}</span>
      </div>
    </div>
  );
}

/* ────── Travel Mode Components ────── */
function TravelModeChip({
  activeProfile,
  onOpen,
}: {
  activeProfile: EquipmentProfile | null;
  onOpen: () => void;
}) {
  if (!activeProfile || activeProfile === "full") {
    return (
      <button
        onClick={onOpen}
        className="fade-slide-up flex items-center gap-2 rounded-xl border border-border/50 bg-surface/50 px-3 py-2 text-muted-foreground transition-colors hover:bg-surface"
      >
        <Plane className="h-4 w-4" />
        <span className="text-xs font-medium">Traveling today?</span>
      </button>
    );
  }

  const meta = EQUIPMENT_PROFILES.find((p) => p.id === activeProfile);
  return (
    <button
      onClick={onOpen}
      className="fade-slide-up flex w-full items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-left"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
        <Plane className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
          Travel Mode Active
        </p>
        <p className="text-sm font-medium text-foreground truncate">
          {meta?.emoji} {meta?.label}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-amber-400/50" />
    </button>
  );
}

function TravelModeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const store = useFitnessStore();
  const activeProfile = store.getActiveTravelMode() ?? "full";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-slide-up relative flex max-h-[85vh] flex-col rounded-t-3xl border-t bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Travel Mode</h2>
            <p className="text-xs text-muted-foreground">Auto-swaps exercises for today</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-muted-foreground hover:bg-surface/80 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          <div className="flex flex-col gap-2">
            {EQUIPMENT_PROFILES.map((profile) => (
              <button
                key={profile.id}
                onClick={() => {
                  store.setTravelMode(profile.id);
                  onClose();
                }}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                  activeProfile === profile.id
                    ? "border-amber-500/50 bg-amber-500/10"
                    : "border-border bg-surface hover:bg-surface/80"
                }`}
              >
                <div className="text-2xl leading-none">{profile.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold ${
                    activeProfile === profile.id ? "text-amber-400" : "text-foreground"
                  }`}>
                    {profile.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{profile.description}</p>
                </div>
                {activeProfile === profile.id && (
                  <Check className="h-5 w-5 text-amber-500" />
                )}
              </button>
            ))}
          </div>
          <p className="mt-4 text-center text-[10px] text-muted-foreground">
            Your saved routine is never modified. Travel mode automatically resets tomorrow.
          </p>
        </div>
      </div>
    </div>
  );
}
