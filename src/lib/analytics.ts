import type { DayLog, SetLog, WorkoutTemplate } from "@/store/fitnessStore";
import { EXERCISE_LIBRARY } from "@/lib/exerciseLibrary";
import { getLastSessionByName, suggestNextWeight, isCompoundExercise } from "@/lib/progressiveOverload";

/* ── Coach Insights ─────────────────────────────────────────────── */

export type InsightType = "overload" | "imbalance" | "streak" | "nutrition" | "rest" | "pr";

export interface CoachInsight {
  type: InsightType;
  emoji: string;
  title: string;
  body: string;
  /** Higher = more important, shown first */
  priority: number;
}

/**
 * Generate 1-3 data-driven coaching insights for today.
 * Uses existing analytics functions — no new data needed.
 */
export function generateCoachInsights(
  logs: Record<string, DayLog>,
  todayISO: string,
  todayExercises: Array<{ name: string; reps: string; sets: number }>,
  streak: number,
  calorieGoal: number,
  todayCalories: number,
  weekPlan: Record<string, string | null>,
): CoachInsight[] {
  const insights: CoachInsight[] = [];

  // ── 1. Progressive overload opportunity ──
  // Find the first exercise in today's workout that's ready for a weight bump
  for (const ex of todayExercises) {
    const lastSession = getLastSessionByName(logs, ex.name, todayISO);
    if (!lastSession || lastSession.length === 0) continue;
    const lastSet = lastSession[0];
    if (!lastSet || lastSet.weight <= 0) continue;

    const suggested = suggestNextWeight(
      lastSet.weight,
      lastSet.reps,
      ex.reps,
      isCompoundExercise(ex.name),
    );
    if (suggested > lastSet.weight) {
      insights.push({
        type: "overload",
        emoji: "⬆️",
        title: "Time to progress",
        body: `You hit ${lastSet.weight}×${lastSet.reps} on ${ex.name} last session. Try ${suggested} today.`,
        priority: 10,
      });
      break; // Only show one overload tip
    }
  }

  // ── 2. Streak motivation ──
  if (streak >= 3 && streak < 7) {
    insights.push({
      type: "streak",
      emoji: "🔥",
      title: `${streak}-day streak`,
      body: "You're on a roll. Keep it going — 7 days builds a real habit.",
      priority: 4,
    });
  } else if (streak >= 7) {
    insights.push({
      type: "streak",
      emoji: "🏆",
      title: `${streak}-day streak!`,
      body: "Incredible consistency. You're in the top tier of Movra users.",
      priority: 6,
    });
  } else if (streak === 0) {
    insights.push({
      type: "streak",
      emoji: "💪",
      title: "Start your streak today",
      body: "Complete today's workout to begin a new streak. Day 1 is the hardest.",
      priority: 2,
    });
  }

  // ── 3. Nutrition reminder ──
  const hour = new Date().getHours();
  if (calorieGoal > 0 && todayCalories === 0 && hour >= 12) {
    insights.push({
      type: "nutrition",
      emoji: "🍽️",
      title: "Don't forget to log meals",
      body: `You have ${calorieGoal} kcal to hit today. Log your meals to stay on track.`,
      priority: 5,
    });
  } else if (calorieGoal > 0 && todayCalories > 0 && hour >= 19) {
    const remaining = calorieGoal - todayCalories;
    if (remaining > 300) {
      insights.push({
        type: "nutrition",
        emoji: "🍽️",
        title: `${remaining} kcal remaining`,
        body: "Evening — log your last meal to hit your daily goal.",
        priority: 5,
      });
    }
  }

  // Sort by priority descending, return top 2
  return insights.sort((a, b) => b.priority - a.priority).slice(0, 2);
}


/* ── Volume Trends ──────────────────────────────────────────────── */

export interface WeekVolume {
  weekLabel: string;
  weekStartISO: string;
  totalVolume: number; // sets × reps × weight
  totalSets: number;
}

/**
 * Compute total weekly volume (sets × reps × weight) for the last N weeks.
 */
export function computeVolumeTrend(
  logs: Record<string, DayLog>,
  numWeeks: number = 4,
): WeekVolume[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() + mondayOffset);

  const weeks: WeekVolume[] = [];

  for (let w = 0; w < numWeeks; w++) {
    const weekMonday = new Date(thisMonday);
    weekMonday.setDate(thisMonday.getDate() - w * 7);
    let totalVolume = 0;
    let totalSets = 0;

    for (let d = 0; d < 7; d++) {
      const day = new Date(weekMonday);
      day.setDate(weekMonday.getDate() + d);
      const iso = day.toISOString().split("T")[0];
      const log = logs[iso];
      if (!log?.setLogs) continue;

      for (const sets of Object.values(log.setLogs)) {
        if (!sets) continue;
        for (const s of sets) {
          if (s.done && s.weight > 0 && s.reps > 0) {
            totalVolume += s.weight * s.reps;
            totalSets++;
          }
        }
      }
    }

    weeks.push({
      weekLabel:
        w === 0
          ? "This week"
          : `Week of ${weekMonday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      weekStartISO: weekMonday.toISOString().split("T")[0],
      totalVolume: Math.round(totalVolume),
      totalSets,
    });
  }

  return weeks.reverse(); // oldest first for charting
}

/* ── Personal Records ───────────────────────────────────────────── */

export interface PersonalRecord {
  exerciseName: string;
  bestWeight: number;
  bestReps: number;
  estimated1RM: number;
  date: string;
}

/**
 * Epley formula: 1RM = weight × (1 + reps / 30)
 */
function epley1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/**
 * Compute the best estimated 1RM per exercise name across all logs.
 */
export function computePersonalRecords(logs: Record<string, DayLog>): PersonalRecord[] {
  const best: Record<string, PersonalRecord> = {};

  for (const [date, log] of Object.entries(logs)) {
    if (!log.setLogs) continue;
    for (const sets of Object.values(log.setLogs)) {
      if (!sets || sets.length === 0) continue;
      for (const s of sets) {
        const name = s.exerciseName;
        if (!name || !s.done || s.weight <= 0) continue;

        const e1rm = epley1RM(s.weight, s.reps);
        const existing = best[name];
        if (!existing || e1rm > existing.estimated1RM) {
          best[name] = {
            exerciseName: name,
            bestWeight: s.weight,
            bestReps: s.reps,
            estimated1RM: Math.round(e1rm * 10) / 10,
            date,
          };
        }
      }
    }
  }

  return Object.values(best).sort((a, b) => b.estimated1RM - a.estimated1RM);
}

/* ── Muscle Group Balance ───────────────────────────────────────── */

export interface MuscleGroupBalance {
  group: string;
  setsPerWeek: number;
}

// Build a lookup: exercise name → muscle group
const EXERCISE_TO_GROUP: Record<string, string> = {};
for (const cat of EXERCISE_LIBRARY) {
  for (const ex of cat.exercises) {
    EXERCISE_TO_GROUP[ex.name.toLowerCase()] = cat.name;
  }
}

/**
 * Count sets per muscle group for the current week based on completed set logs.
 */
export function computeMuscleGroupBalance(
  logs: Record<string, DayLog>,
  numWeeks: number = 1,
): MuscleGroupBalance[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() + mondayOffset);

  const startDate = new Date(thisMonday);
  startDate.setDate(thisMonday.getDate() - (numWeeks - 1) * 7);
  const startISO = startDate.toISOString().split("T")[0];

  const endDate = new Date(thisMonday);
  endDate.setDate(thisMonday.getDate() + 7);
  const endISO = endDate.toISOString().split("T")[0];

  const groupSets: Record<string, number> = {};

  for (const [date, log] of Object.entries(logs)) {
    if (date < startISO || date >= endISO) continue;
    if (!log.setLogs) continue;

    for (const sets of Object.values(log.setLogs)) {
      if (!sets) continue;
      for (const s of sets) {
        if (!s.done || !s.exerciseName) continue;
        const group = EXERCISE_TO_GROUP[s.exerciseName.toLowerCase()] || "Other";
        groupSets[group] = (groupSets[group] || 0) + 1;
      }
    }
  }

  // Ensure all main groups appear even if zero
  const MAIN_GROUPS = ["Chest", "Back", "Shoulders", "Arms", "Legs", "Core"];
  for (const g of MAIN_GROUPS) {
    if (!groupSets[g]) groupSets[g] = 0;
  }

  return Object.entries(groupSets)
    .filter(([g]) => MAIN_GROUPS.includes(g))
    .map(([group, setsPerWeek]) => ({
      group,
      setsPerWeek: Math.round(setsPerWeek / numWeeks),
    }))
    .sort((a, b) => {
      const ai = MAIN_GROUPS.indexOf(a.group);
      const bi = MAIN_GROUPS.indexOf(b.group);
      return ai - bi;
    });
}

/**
 * Detect push/pull imbalance: if push sets > 2× pull sets, that's a warning.
 */
export function detectImbalances(balance: MuscleGroupBalance[]): string[] {
  const warnings: string[] = [];
  const chest = balance.find((b) => b.group === "Chest")?.setsPerWeek || 0;
  const shoulders = balance.find((b) => b.group === "Shoulders")?.setsPerWeek || 0;
  const back = balance.find((b) => b.group === "Back")?.setsPerWeek || 0;
  const pushSets = chest + shoulders;
  const pullSets = back;

  if (pushSets > 0 && pullSets > 0 && pushSets > pullSets * 2) {
    warnings.push("Push volume is 2× your pull volume. Add more back work.");
  }
  if (pullSets > 0 && pushSets > 0 && pullSets > pushSets * 2) {
    warnings.push("Pull volume is 2× your push volume. Add more chest/shoulder work.");
  }

  const legs = balance.find((b) => b.group === "Legs")?.setsPerWeek || 0;
  const upper = chest + shoulders + back;
  if (upper > 0 && legs === 0) {
    warnings.push("No leg work logged this week. Don't skip leg day!");
  }

  return warnings;
}

/* ── Strength History (for sparklines) ─────────────────────────── */

export interface StrengthPoint {
  date: string;
  estimated1RM: number;
}

/**
 * Return the last N sessions' estimated 1RM for a given exercise,
 * oldest first (for charting left-to-right progress).
 */
export function computeStrengthHistory(
  logs: Record<string, DayLog>,
  exerciseName: string,
  numSessions: number = 8,
): StrengthPoint[] {
  const lowerName = exerciseName.toLowerCase();
  const points: StrengthPoint[] = [];

  for (const [date, log] of Object.entries(logs)) {
    if (!log.setLogs) continue;
    for (const sets of Object.values(log.setLogs)) {
      if (!sets || sets.length === 0) continue;
      const first = sets[0];
      if (first?.exerciseName?.toLowerCase() !== lowerName) continue;

      // Best set of the session
      let best1RM = 0;
      for (const s of sets) {
        if (s.done && s.weight > 0 && s.reps > 0) {
          const e1rm = s.weight * (1 + s.reps / 30);
          if (e1rm > best1RM) best1RM = e1rm;
        }
      }
      if (best1RM > 0) {
        points.push({ date, estimated1RM: Math.round(best1RM * 10) / 10 });
      }
    }
  }

  return points
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-numSessions);
}

/* ── Weekly Report Card ─────────────────────────────────────────── */

export interface WeeklyReportCard {
  weekLabel: string;
  workoutsCompleted: number;
  workoutsPlanned: number;
  completionPct: number;
  completionGrade: "A" | "B" | "C" | "D" | "F";
  volumeChange: number | null; // % change vs prior week, null if no prior data
  newPRs: string[]; // exercise names that hit a new 1RM this week
  muscleGroupsHit: number; // how many of 6 main groups trained
  topInsight: string; // one sentence summary
}

export function computeWeeklyReportCard(
  logs: Record<string, DayLog>,
  weekPlan: Record<string, string | null>,
  getTemplateForDay: (day: string) => WorkoutTemplate | null,
): WeeklyReportCard {
  const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  // Last completed week (Mon–Sun before this week)
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() + mondayOffset - 7);

  let workoutsCompleted = 0;
  let workoutsPlanned = 0;
  let weekVolume = 0;

  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(lastMonday);
    d.setDate(lastMonday.getDate() + i);
    weekDates.push(d.toISOString().split("T")[0]);
  }

  // Muscle group tracking
  const groupsHit = new Set<string>();
  const EXERCISE_TO_GROUP: Record<string, string> = {};
  for (const cat of EXERCISE_LIBRARY) {
    for (const ex of cat.exercises) {
      EXERCISE_TO_GROUP[ex.name.toLowerCase()] = cat.name;
    }
  }

  for (let i = 0; i < 7; i++) {
    const iso = weekDates[i];
    const dayName = DAYS[i];
    const template = getTemplateForDay(dayName);
    const log = logs[iso];

    if (template && template.exercises.length > 0) {
      workoutsPlanned++;
      if (log && log.exercisesCompleted.length === template.exercises.length) {
        workoutsCompleted++;
      }
    }

    if (log?.setLogs) {
      for (const sets of Object.values(log.setLogs)) {
        if (!sets) continue;
        for (const s of sets) {
          if (s.done && s.weight > 0 && s.reps > 0) {
            weekVolume += s.weight * s.reps;
            const group = s.exerciseName ? EXERCISE_TO_GROUP[s.exerciseName.toLowerCase()] : null;
            if (group) groupsHit.add(group);
          }
        }
      }
    }
  }

  // Prior week volume for comparison
  const priorMonday = new Date(lastMonday);
  priorMonday.setDate(lastMonday.getDate() - 7);
  let priorVolume = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(priorMonday);
    d.setDate(priorMonday.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    const log = logs[iso];
    if (log?.setLogs) {
      for (const sets of Object.values(log.setLogs)) {
        if (!sets) continue;
        for (const s of sets) {
          if (s.done && s.weight > 0 && s.reps > 0) priorVolume += s.weight * s.reps;
        }
      }
    }
  }

  const volumeChange = priorVolume > 0
    ? Math.round(((weekVolume - priorVolume) / priorVolume) * 100)
    : null;

  // New PRs this week
  const allPRs = computePersonalRecords(logs);
  const newPRs = allPRs
    .filter((pr) => weekDates.includes(pr.date))
    .map((pr) => pr.exerciseName);

  // Grade
  const completionPct = workoutsPlanned > 0
    ? Math.round((workoutsCompleted / workoutsPlanned) * 100)
    : 0;
  const completionGrade: WeeklyReportCard["completionGrade"] =
    completionPct >= 90 ? "A"
    : completionPct >= 75 ? "B"
    : completionPct >= 50 ? "C"
    : completionPct >= 25 ? "D"
    : "F";

  // Top insight sentence
  let topInsight = "";
  if (completionPct === 100) {
    topInsight = "Perfect week — every session completed. 🏆";
  } else if (newPRs.length > 0) {
    topInsight = `New PR on ${newPRs[0]}${newPRs.length > 1 ? ` (+${newPRs.length - 1} more)` : ""}. 💪`;
  } else if (volumeChange !== null && volumeChange > 10) {
    topInsight = `Volume up ${volumeChange}% vs last week. Great progress!`;
  } else if (volumeChange !== null && volumeChange < -10) {
    topInsight = `Volume down ${Math.abs(volumeChange)}% — aim to beat last week.`;
  } else if (completionPct >= 75) {
    topInsight = "Solid week. Stay consistent and the results will come.";
  } else {
    topInsight = "Missed sessions happen. This week, aim for one more than last.";
  }

  const weekLabel = lastMonday.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return {
    weekLabel,
    workoutsCompleted,
    workoutsPlanned,
    completionPct,
    completionGrade,
    volumeChange,
    newPRs,
    muscleGroupsHit: groupsHit.size,
    topInsight,
  };
}
