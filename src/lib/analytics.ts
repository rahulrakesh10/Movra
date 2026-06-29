import type { DayLog, SetLog, WorkoutTemplate } from "@/store/fitnessStore";
import { EXERCISE_LIBRARY } from "@/lib/exerciseLibrary";

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
