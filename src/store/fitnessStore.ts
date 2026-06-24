import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weights?: number[];
  supersetId?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: Exercise[];
}

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
}

export interface MealItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  id: string;
  name: string;
  items: MealItem[];
}

export interface DayLog {
  exercisesCompleted: string[];
  food: FoodEntry[];
  setLogs?: Record<string, SetLog[]>;
}

export interface SetLog {
  done: boolean;
  weight: number;
  reps: number;
}

export interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type Sex = "male" | "female";
export type GoalType = "lose" | "maintain" | "gain";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "athlete";
export type WeightUnit = "kg" | "lb";
export type LiftingGoal = "strength" | "hypertrophy" | "endurance" | "general";
export type ThemePreference = "light" | "dark" | "system";

export interface Profile {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  goalType: GoalType;
  activity: ActivityLevel;
  daysPerWeek: number;
  liftingGoal: LiftingGoal;
}

export interface StoreLibraryExercise {
  name: string;
  defaultSets: number;
  defaultReps: string;
}

export interface FitnessState {
  templates: Record<string, WorkoutTemplate>;
  templateOrder: string[];
  weekPlan: Record<string, string | null>;
  logs: Record<string, DayLog>;
  streak: number;
  lastWorkoutDate: string | null;
  goals: Goals;
  profile: Profile | null;
  onboarded: boolean;
  weightUnit: WeightUnit;
  theme: ThemePreference;
  meals: Record<string, Meal>;
  mealOrder: string[];
  customExercises: Record<string, StoreLibraryExercise[]>;

  createTemplate: (name: string) => string;
  renameTemplate: (templateId: string, name: string) => void;
  deleteTemplate: (templateId: string) => void;
  addExerciseToTemplate: (templateId: string, exercise: Omit<Exercise, "id">) => void;
  updateExerciseInTemplate: (
    templateId: string,
    exerciseId: string,
    patch: Partial<Omit<Exercise, "id">>,
  ) => void;
  removeExerciseFromTemplate: (templateId: string, exerciseId: string) => void;
  replaceExerciseInTemplate: (
    templateId: string,
    exerciseId: string,
    exercise: Omit<Exercise, "id">,
  ) => void;
  addSupersetToExercise: (
    templateId: string,
    afterExerciseId: string,
    exercise: Omit<Exercise, "id">,
  ) => void;
  unlinkSuperset: (templateId: string, exerciseId: string) => void;
  assignTemplateToDay: (day: string, templateId: string | null) => void;
  getTodayTemplate: () => WorkoutTemplate | null;
  getTemplateForDay: (day: string) => WorkoutTemplate | null;

  toggleExerciseComplete: (date: string, exerciseId: string) => void;
  getSetLogs: (date: string, exercise: Exercise) => SetLog[];
  updateSetLog: (date: string, exercise: Exercise, index: number, patch: Partial<SetLog>) => void;
  addFood: (date: string, entry: Omit<FoodEntry, "id">) => void;
  removeFood: (date: string, entryId: string) => void;
  getDayLog: (date: string) => DayLog;
  getTodayLog: () => DayLog;
  getWeekProgress: () => { completed: number; total: number };
  getStreak: () => number;
  setGoals: (goals: Partial<Goals>) => void;
  completeOnboarding: (profile: Profile) => void;
  resetOnboarding: () => void;
  setWeightUnit: (unit: WeightUnit) => void;
  setTheme: (theme: ThemePreference) => void;
  createMeal: (name: string, items: MealItem[]) => string;
  updateMeal: (mealId: string, patch: Partial<Omit<Meal, "id">>) => void;
  deleteMeal: (mealId: string) => void;
  logMeal: (date: string, mealId: string, mealType: FoodEntry["mealType"]) => void;
  addCustomExercise: (categoryId: string, exercise: StoreLibraryExercise) => void;
}

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const DEFAULT_TEMPLATES: Record<string, WorkoutTemplate> = {
  push: {
    id: "push",
    name: "Push",
    exercises: [
      { id: "p1", name: "Bench Press", sets: 4, reps: "6-8" },
      { id: "p2", name: "Overhead Press", sets: 3, reps: "8-10" },
      { id: "p3", name: "Incline Dumbbell Press", sets: 3, reps: "10-12" },
      { id: "p4", name: "Lateral Raise", sets: 3, reps: "12-15" },
      { id: "p5", name: "Tricep Pushdown", sets: 3, reps: "12-15" },
    ],
  },
  pull: {
    id: "pull",
    name: "Pull",
    exercises: [
      { id: "pl1", name: "Deadlift", sets: 3, reps: "5" },
      { id: "pl2", name: "Pull-ups", sets: 4, reps: "6-10" },
      { id: "pl3", name: "Barbell Row", sets: 3, reps: "8-10" },
      { id: "pl4", name: "Face Pull", sets: 3, reps: "15" },
      { id: "pl5", name: "Bicep Curl", sets: 3, reps: "10-12" },
    ],
  },
  legs: {
    id: "legs",
    name: "Legs",
    exercises: [
      { id: "l1", name: "Squat", sets: 4, reps: "6-8" },
      { id: "l2", name: "Romanian Deadlift", sets: 3, reps: "8-10" },
      { id: "l3", name: "Leg Press", sets: 3, reps: "10-12" },
      { id: "l4", name: "Leg Curl", sets: 3, reps: "12-15" },
      { id: "l5", name: "Calf Raise", sets: 4, reps: "15-20" },
    ],
  },
  cardio: {
    id: "cardio",
    name: "Cardio",
    exercises: [
      { id: "c1", name: "Run / Bike", sets: 1, reps: "30 min" },
      { id: "c2", name: "Plank", sets: 3, reps: "60s" },
    ],
  },
};

const DEFAULT_WEEK_PLAN: Record<string, string | null> = {
  mon: "push",
  tue: "pull",
  wed: "legs",
  thu: "push",
  fri: "pull",
  sat: "cardio",
  sun: null,
};

const DEFAULT_GOALS: Goals = {
  calories: 2200,
  protein: 150,
  carbs: 250,
  fat: 70,
};

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const ACTIVITY_MULT: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

export function computeGoalsFromProfile(p: Profile): Goals {
  // Mifflin-St Jeor
  const bmr =
    p.sex === "male"
      ? 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + 5
      : 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age - 161;
  const tdee = bmr * ACTIVITY_MULT[p.activity];
  const adjust = p.goalType === "lose" ? -500 : p.goalType === "gain" ? 300 : 0;
  const calories = Math.max(1200, Math.round((tdee + adjust) / 10) * 10);
  const proteinPerKg = p.goalType === "lose" ? 2.2 : p.goalType === "gain" ? 1.8 : 1.6;
  const protein = Math.round(p.weightKg * proteinPerKg);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { calories, protein, carbs, fat };
}

// Split keys, mon..sun, per training frequency.
const SPLITS: Record<number, (string | null)[]> = {
  1: ["full", null, null, null, null, null, null],
  2: ["upper", null, null, "lower", null, null, null],
  3: ["push", null, "pull", null, "legs", null, null],
  4: ["upper", "lower", null, "upper", "lower", null, null],
  5: ["push", "pull", "legs", null, "upper", "lower", null],
  6: ["push", "pull", "legs", "push", "pull", "legs", null],
  7: ["push", "pull", "legs", "push", "pull", "legs", "cardio"],
};

// Goal-tuned set/rep scheme.
const SCHEMES: Record<
  LiftingGoal,
  { sets: number; reps: string; bigSets: number; bigReps: string }
> = {
  strength: { sets: 5, reps: "5", bigSets: 5, bigReps: "5" },
  hypertrophy: { sets: 4, reps: "8-12", bigSets: 4, bigReps: "6-8" },
  endurance: { sets: 3, reps: "15-20", bigSets: 3, bigReps: "12-15" },
  general: { sets: 3, reps: "10", bigSets: 3, bigReps: "8-10" },
};

// Base exercise lists per template kind. `big` = primary compound.
type BaseEx = { name: string; big?: boolean };
const BASE: Record<string, { name: string; exercises: BaseEx[] }> = {
  push: {
    name: "Push",
    exercises: [
      { name: "Bench Press", big: true },
      { name: "Overhead Press", big: true },
      { name: "Incline Dumbbell Press" },
      { name: "Lateral Raise" },
      { name: "Tricep Pushdown" },
    ],
  },
  pull: {
    name: "Pull",
    exercises: [
      { name: "Deadlift", big: true },
      { name: "Pull-ups", big: true },
      { name: "Barbell Row" },
      { name: "Face Pull" },
      { name: "Bicep Curl" },
    ],
  },
  legs: {
    name: "Legs",
    exercises: [
      { name: "Squat", big: true },
      { name: "Romanian Deadlift", big: true },
      { name: "Leg Press" },
      { name: "Leg Curl" },
      { name: "Calf Raise" },
    ],
  },
  upper: {
    name: "Upper",
    exercises: [
      { name: "Bench Press", big: true },
      { name: "Barbell Row", big: true },
      { name: "Overhead Press" },
      { name: "Pull-ups" },
      { name: "Bicep Curl" },
      { name: "Tricep Pushdown" },
    ],
  },
  lower: {
    name: "Lower",
    exercises: [
      { name: "Squat", big: true },
      { name: "Romanian Deadlift", big: true },
      { name: "Leg Press" },
      { name: "Leg Curl" },
      { name: "Calf Raise" },
    ],
  },
  full: {
    name: "Full Body",
    exercises: [
      { name: "Squat", big: true },
      { name: "Bench Press", big: true },
      { name: "Barbell Row", big: true },
      { name: "Overhead Press" },
      { name: "Bicep Curl" },
    ],
  },
  cardio: {
    name: "Cardio",
    exercises: [{ name: "Run / Bike" }, { name: "Plank" }],
  },
};

export function buildPlanFromProfile(
  daysPerWeek: number,
  liftingGoal: LiftingGoal,
): {
  templates: Record<string, WorkoutTemplate>;
  templateOrder: string[];
  weekPlan: Record<string, string | null>;
} {
  const days = Math.max(1, Math.min(7, daysPerWeek));
  const split = SPLITS[days] || SPLITS[3];
  const scheme = SCHEMES[liftingGoal];
  const isCardio = (kind: string) => kind === "cardio";

  const used = new Set<string>();
  split.forEach((k) => k && used.add(k));

  const templates: Record<string, WorkoutTemplate> = {};
  const templateOrder: string[] = [];
  for (const kind of used) {
    const base = BASE[kind];
    if (!base) continue;
    const id = kind; // stable ids so day plan can reference
    templates[id] = {
      id,
      name: base.name,
      exercises: base.exercises.map((e, i) => ({
        id: `${id}-${i}`,
        name: e.name,
        sets: isCardio(kind) ? (e.name === "Plank" ? 3 : 1) : e.big ? scheme.bigSets : scheme.sets,
        reps: isCardio(kind)
          ? e.name === "Plank"
            ? "60s"
            : "30 min"
          : e.big
            ? scheme.bigReps
            : scheme.reps,
      })),
    };
    templateOrder.push(id);
  }

  const weekPlan: Record<string, string | null> = {};
  DAYS.forEach((d, i) => {
    const k = split[i];
    weekPlan[d] = k && templates[k] ? k : null;
  });

  return { templates, templateOrder, weekPlan };
}

export function getTodayISO(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

export function getDayName(): string {
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return days[new Date().getDay()];
}

function computeStreak(logs: Record<string, DayLog>): number {
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    const log = logs[iso];
    if (log && log.exercisesCompleted.length > 0) {
      streak++;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }
  return streak;
}

function findLastSetLogs(
  logs: Record<string, DayLog>,
  exerciseId: string,
  beforeDate: string,
): SetLog[] | null {
  const dates = Object.keys(logs)
    .filter((d) => d < beforeDate && logs[d]?.setLogs?.[exerciseId])
    .sort()
    .reverse();
  for (const d of dates) {
    const arr = logs[d].setLogs?.[exerciseId];
    if (arr && arr.length > 0) return arr;
  }
  return null;
}

export const useFitnessStore = create<FitnessState>()(
  persist(
    (set, get) => ({
      templates: DEFAULT_TEMPLATES,
      templateOrder: ["push", "pull", "legs", "cardio"],
      weekPlan: DEFAULT_WEEK_PLAN,
      logs: {},
      streak: 0,
      lastWorkoutDate: null,
      goals: DEFAULT_GOALS,
      profile: null,
      onboarded: false,
      weightUnit: "kg",
      theme: "system",
      meals: {},
      mealOrder: [],
      customExercises: {},

      createTemplate: (name) => {
        const id = uid("tpl");
        set((state) => ({
          templates: {
            ...state.templates,
            [id]: { id, name: name.trim() || "Untitled", exercises: [] },
          },
          templateOrder: [...state.templateOrder, id],
        }));
        return id;
      },

      renameTemplate: (templateId, name) =>
        set((state) => {
          const tpl = state.templates[templateId];
          if (!tpl) return state;
          return {
            templates: {
              ...state.templates,
              [templateId]: { ...tpl, name: name.trim() || tpl.name },
            },
          };
        }),

      deleteTemplate: (templateId) =>
        set((state) => {
          const { [templateId]: _gone, ...rest } = state.templates;
          const newPlan: Record<string, string | null> = { ...state.weekPlan };
          for (const d of Object.keys(newPlan)) {
            if (newPlan[d] === templateId) newPlan[d] = null;
          }
          return {
            templates: rest,
            templateOrder: state.templateOrder.filter((id) => id !== templateId),
            weekPlan: newPlan,
          };
        }),

      addExerciseToTemplate: (templateId, exercise) =>
        set((state) => {
          const tpl = state.templates[templateId];
          if (!tpl) return state;
          const newEx: Exercise = { ...exercise, id: uid("ex") };
          return {
            templates: {
              ...state.templates,
              [templateId]: { ...tpl, exercises: [...tpl.exercises, newEx] },
            },
          };
        }),

      removeExerciseFromTemplate: (templateId, exerciseId) =>
        set((state) => {
          const tpl = state.templates[templateId];
          if (!tpl) return state;
          return {
            templates: {
              ...state.templates,
              [templateId]: {
                ...tpl,
                exercises: tpl.exercises.filter((e) => e.id !== exerciseId),
              },
            },
          };
        }),

      replaceExerciseInTemplate: (templateId, exerciseId, exercise) =>
        set((state) => {
          const tpl = state.templates[templateId];
          if (!tpl) return state;
          const newId = uid("ex");
          return {
            templates: {
              ...state.templates,
              [templateId]: {
                ...tpl,
                exercises: tpl.exercises.map((e) =>
                  e.id === exerciseId ? { ...exercise, id: newId } : e,
                ),
              },
            },
          };
        }),

      addSupersetToExercise: (templateId, afterExerciseId, exercise) =>
        set((state) => {
          const tpl = state.templates[templateId];
          if (!tpl) return state;
          const idx = tpl.exercises.findIndex((e) => e.id === afterExerciseId);
          if (idx === -1) return state;
          const anchor = tpl.exercises[idx];
          const supersetId = anchor.supersetId || uid("ss");
          const newEx: Exercise = { ...exercise, id: uid("ex"), supersetId };
          const exercises = [...tpl.exercises];
          if (!anchor.supersetId) {
            exercises[idx] = { ...anchor, supersetId };
          }
          exercises.splice(idx + 1, 0, newEx);
          return {
            templates: {
              ...state.templates,
              [templateId]: { ...tpl, exercises },
            },
          };
        }),

      unlinkSuperset: (templateId, exerciseId) =>
        set((state) => {
          const tpl = state.templates[templateId];
          if (!tpl) return state;
          const target = tpl.exercises.find((e) => e.id === exerciseId);
          if (!target || !target.supersetId) return state;
          const ssId = target.supersetId;
          // Remove supersetId from this exercise
          let exercises = tpl.exercises.map((e) =>
            e.id === exerciseId ? { ...e, supersetId: undefined } : e,
          );
          // If only one exercise remains in the group, clear its supersetId too
          const remaining = exercises.filter((e) => e.supersetId === ssId);
          if (remaining.length === 1) {
            exercises = exercises.map((e) =>
              e.supersetId === ssId ? { ...e, supersetId: undefined } : e,
            );
          }
          return {
            templates: {
              ...state.templates,
              [templateId]: { ...tpl, exercises },
            },
          };
        }),

      updateExerciseInTemplate: (templateId, exerciseId, patch) =>
        set((state) => {
          const tpl = state.templates[templateId];
          if (!tpl) return state;
          return {
            templates: {
              ...state.templates,
              [templateId]: {
                ...tpl,
                exercises: tpl.exercises.map((e) => {
                  if (e.id !== exerciseId) return e;
                  const merged = { ...e, ...patch };
                  // Keep weights array length in sync with sets
                  if (typeof merged.sets === "number") {
                    const cur = merged.weights || e.weights || [];
                    const next = Array.from({ length: merged.sets }, (_, i) =>
                      typeof cur[i] === "number" ? cur[i] : 0,
                    );
                    merged.weights = next;
                  }
                  return merged;
                }),
              },
            },
          };
        }),

      assignTemplateToDay: (day, templateId) =>
        set((state) => ({
          weekPlan: { ...state.weekPlan, [day]: templateId },
        })),

      getTodayTemplate: () => {
        const id = get().weekPlan[getDayName()];
        return id ? get().templates[id] || null : null;
      },

      getTemplateForDay: (day) => {
        const id = get().weekPlan[day];
        return id ? get().templates[id] || null : null;
      },

      toggleExerciseComplete: (date, exerciseId) =>
        set((state) => {
          const log = state.logs[date] || { exercisesCompleted: [], food: [] };
          const completed = log.exercisesCompleted.includes(exerciseId);
          const newCompleted = completed
            ? log.exercisesCompleted.filter((id) => id !== exerciseId)
            : [...log.exercisesCompleted, exerciseId];

          const newLogs = {
            ...state.logs,
            [date]: { ...log, exercisesCompleted: newCompleted },
          };

          const streak = computeStreak(newLogs);
          const lastWorkoutDate = streak > 0 ? date : state.lastWorkoutDate;

          return { logs: newLogs, streak, lastWorkoutDate };
        }),

      getSetLogs: (date, exercise) => {
        const log = get().logs[date] || { exercisesCompleted: [], food: [] };
        const stored = log.setLogs?.[exercise.id];
        const defaultReps = parseInt(exercise.reps, 10) || 0;
        const prev = stored ? null : findLastSetLogs(get().logs, exercise.id, date);
        return Array.from({ length: exercise.sets }, (_, i) => {
          const s = stored?.[i];
          const p = prev?.[i];
          return {
            done: s?.done ?? false,
            weight: s?.weight ?? p?.weight ?? exercise.weights?.[i] ?? 0,
            reps: s?.reps ?? p?.reps ?? defaultReps,
          };
        });
      },

      updateSetLog: (date, exercise, index, patch) =>
        set((state) => {
          const log = state.logs[date] || { exercisesCompleted: [], food: [] };
          const defaultReps = parseInt(exercise.reps, 10) || 0;
          const cur = log.setLogs?.[exercise.id];
          const prev = cur ? null : findLastSetLogs(state.logs, exercise.id, date);
          const arr: SetLog[] = Array.from({ length: exercise.sets }, (_, i) => {
            const s = cur?.[i];
            const p = prev?.[i];
            return {
              done: s?.done ?? false,
              weight: s?.weight ?? p?.weight ?? exercise.weights?.[i] ?? 0,
              reps: s?.reps ?? p?.reps ?? defaultReps,
            };
          });
          arr[index] = { ...arr[index], ...patch };

          const allDone = arr.every((s) => s.done);
          const wasCompleted = log.exercisesCompleted.includes(exercise.id);
          let exercisesCompleted = log.exercisesCompleted;
          if (allDone && !wasCompleted) {
            exercisesCompleted = [...exercisesCompleted, exercise.id];
          } else if (!allDone && wasCompleted) {
            exercisesCompleted = exercisesCompleted.filter((id) => id !== exercise.id);
          }

          const newLogs = {
            ...state.logs,
            [date]: {
              ...log,
              exercisesCompleted,
              setLogs: { ...(log.setLogs || {}), [exercise.id]: arr },
            },
          };

          const streak = computeStreak(newLogs);
          const lastWorkoutDate = streak > 0 ? date : state.lastWorkoutDate;
          return { logs: newLogs, streak, lastWorkoutDate };
        }),

      addFood: (date, entry) =>
        set((state) => {
          const log = state.logs[date] || { exercisesCompleted: [], food: [] };
          const newEntry = { ...entry, id: uid("food") };
          return {
            logs: {
              ...state.logs,
              [date]: { ...log, food: [...log.food, newEntry] },
            },
          };
        }),

      removeFood: (date, entryId) =>
        set((state) => {
          const log = state.logs[date] || { exercisesCompleted: [], food: [] };
          return {
            logs: {
              ...state.logs,
              [date]: { ...log, food: log.food.filter((f) => f.id !== entryId) },
            },
          };
        }),

      getDayLog: (date) => {
        return get().logs[date] || { exercisesCompleted: [], food: [] };
      },

      getTodayLog: () => {
        return get().logs[getTodayISO()] || { exercisesCompleted: [], food: [] };
      },

      getWeekProgress: () => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset);

        let completed = 0;
        let total = 0;

        for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          const iso = d.toISOString().split("T")[0];
          const dayName = DAYS[i];
          const tpl = get().getTemplateForDay(dayName);
          const routineExercises = tpl?.exercises || [];
          const log = get().logs[iso] || { exercisesCompleted: [], food: [] };

          if (routineExercises.length > 0) {
            total++;
            if (log.exercisesCompleted.length === routineExercises.length) {
              completed++;
            }
          }
        }

        return { completed, total };
      },

      getStreak: () => computeStreak(get().logs),

      setGoals: (goals) => set((state) => ({ goals: { ...state.goals, ...goals } })),

      completeOnboarding: (profile) =>
        set(() => {
          const goals = computeGoalsFromProfile(profile);
          const { templates, templateOrder, weekPlan } = buildPlanFromProfile(
            profile.daysPerWeek,
            profile.liftingGoal,
          );
          return {
            profile,
            goals,
            templates,
            templateOrder,
            weekPlan,
            logs: {},
            onboarded: true,
          };
        }),

      resetOnboarding: () => set(() => ({ onboarded: false })),

      setWeightUnit: (unit) => set(() => ({ weightUnit: unit })),

      setTheme: (theme) => set(() => ({ theme })),

      createMeal: (name, items) => {
        const id = uid("meal");
        set((state) => ({
          meals: {
            ...state.meals,
            [id]: { id, name: name.trim() || "Untitled meal", items },
          },
          mealOrder: [...state.mealOrder, id],
        }));
        return id;
      },

      updateMeal: (mealId, patch) =>
        set((state) => {
          const m = state.meals[mealId];
          if (!m) return state;
          return {
            meals: { ...state.meals, [mealId]: { ...m, ...patch } },
          };
        }),

      deleteMeal: (mealId) =>
        set((state) => {
          const { [mealId]: _gone, ...rest } = state.meals;
          return {
            meals: rest,
            mealOrder: state.mealOrder.filter((id) => id !== mealId),
          };
        }),

      logMeal: (date, mealId, mealType) =>
        set((state) => {
          const meal = state.meals[mealId];
          if (!meal) return state;
          const log = state.logs[date] || { exercisesCompleted: [], food: [] };
          const totals = meal.items.reduce(
            (acc, it) => ({
              calories: acc.calories + it.calories,
              protein: acc.protein + it.protein,
              carbs: acc.carbs + it.carbs,
              fat: acc.fat + it.fat,
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 },
          );
          const newEntry: FoodEntry = {
            id: uid("food"),
            name: meal.name,
            calories: Math.round(totals.calories),
            protein: Math.round(totals.protein * 10) / 10,
            carbs: Math.round(totals.carbs * 10) / 10,
            fat: Math.round(totals.fat * 10) / 10,
            mealType,
          };
          return {
            logs: {
              ...state.logs,
              [date]: { ...log, food: [...log.food, newEntry] },
            },
          };
        }),

      addCustomExercise: (categoryId, exercise) =>
        set((state) => {
          const list = state.customExercises[categoryId] || [];
          if (list.some((ex) => ex.name.toLowerCase() === exercise.name.toLowerCase())) {
            return state;
          }
          return {
            customExercises: {
              ...state.customExercises,
              [categoryId]: [...list, exercise],
            },
          };
        }),
    }),
    {
      name: "fitness-tracker-storage",
      version: 7,
      migrate: (persistedState: unknown, version: number) => {
        if (!persistedState) return persistedState;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const persisted = persistedState as any;
        if (version < 2) {
          // Upgrade from v1 (routine: Record<day, Exercise[]>) to templates+weekPlan
          const oldRoutine = persisted.routine || {};
          const templates: Record<string, WorkoutTemplate> = { ...DEFAULT_TEMPLATES };
          const weekPlan: Record<string, string | null> = { ...DEFAULT_WEEK_PLAN };
          for (const day of DAYS) {
            const exercises = oldRoutine[day];
            if (Array.isArray(exercises) && exercises.length > 0) {
              const id = `legacy-${day}`;
              templates[id] = {
                id,
                name: day.charAt(0).toUpperCase() + day.slice(1) + " Day",
                exercises,
              };
              weekPlan[day] = id;
            }
          }
          return {
            ...persisted,
            templates,
            templateOrder: Object.keys(templates),
            weekPlan,
            goals: persisted.goals || DEFAULT_GOALS,
            profile: persisted.profile ?? null,
            onboarded: true, // existing users skip onboarding
          };
        }
        if (version < 3) {
          return {
            ...persisted,
            profile: persisted.profile ?? null,
            onboarded: true, // existing users skip onboarding
          };
        }
        if (version < 4) {
          return {
            ...persisted,
            weightUnit: persisted.weightUnit ?? "kg",
          };
        }
        if (version < 5) {
          return {
            ...persisted,
            theme: persisted.theme ?? "system",
          };
        }
        if (version < 6) {
          return {
            ...persisted,
            meals: persisted.meals ?? {},
            mealOrder: persisted.mealOrder ?? [],
          };
        }
        if (version < 7) {
          return {
            ...persisted,
            customExercises: persisted.customExercises ?? {},
          };
        }
        return persisted;
      },
    },
  ),
);

export const DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};
