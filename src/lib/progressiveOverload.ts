import type { DayLog, SetLog } from "@/store/fitnessStore";

/**
 * Scan all historical logs and return the most recent completed SetLog[]
 * for a given exercise **by name** (not ID, since IDs change across
 * template rebuilds).
 */
export function getLastSessionByName(
  logs: Record<string, DayLog>,
  exerciseName: string,
  beforeDate: string,
): SetLog[] | null {
  const lowerName = exerciseName.toLowerCase();

  // Collect every date that has setLogs
  const candidates: { date: string; sets: SetLog[] }[] = [];

  for (const [date, log] of Object.entries(logs)) {
    if (date >= beforeDate) continue;
    const setLogs = log.setLogs;
    if (!setLogs) continue;

    // We need to match by exercise name. The setLogs keys are exercise IDs,
    // so we look at the exerciseName field that we store alongside each entry.
    // Fallback: if the ID literally contains the exercise name, match that way.
    for (const [, sets] of Object.entries(setLogs)) {
      if (!sets || sets.length === 0) continue;
      // Check if any set in this array has a matching exerciseName
      const first = sets[0];
      if (first?.exerciseName?.toLowerCase() === lowerName) {
        candidates.push({ date, sets });
      }
    }
  }

  if (candidates.length === 0) return null;
  // Sort descending by date and return the most recent
  candidates.sort((a, b) => b.date.localeCompare(a.date));
  return candidates[0].sets;
}

/**
 * Parse a rep range like "6-8" or "10" into { low, high }.
 */
function parseRepRange(reps: string): { low: number; high: number } {
  const cleaned = reps.replace(/[^0-9-]/g, "");
  const parts = cleaned.split("-").map(Number).filter(Boolean);
  if (parts.length >= 2) return { low: parts[0], high: parts[1] };
  if (parts.length === 1) return { low: parts[0], high: parts[0] };
  return { low: 0, high: 0 };
}

/**
 * Suggest the next weight for a set based on previous performance.
 *
 * Logic:
 * - If user hit the TOP of the rep range → bump weight
 * - If user exceeded the rep range → bump weight
 * - If user didn't hit the bottom → keep same weight (or reduce if really low)
 * - Default bump: +2.5 for compounds (≤ 8 target reps), +1.25 for accessories
 */
export function suggestNextWeight(
  lastWeight: number,
  lastReps: number,
  targetRepRange: string,
  isCompound: boolean = true,
): number {
  const { low, high } = parseRepRange(targetRepRange);
  if (high === 0 || lastWeight === 0) return lastWeight;

  const increment = isCompound ? 2.5 : 1.25;

  if (lastReps >= high) {
    // User hit or exceeded the top — time to progress
    return Math.round((lastWeight + increment) * 4) / 4; // round to 0.25
  }
  if (lastReps < low && low > 0) {
    // User didn't hit the minimum — keep same weight
    return lastWeight;
  }
  // Within range — keep same weight (not yet time to bump)
  return lastWeight;
}

/**
 * Compounds are generally exercises with low default rep ranges
 * and multi-joint movements. Simple heuristic:
 */
const COMPOUND_NAMES = new Set([
  "bench press",
  "incline bench press",
  "overhead press",
  "squat",
  "front squat",
  "deadlift",
  "romanian deadlift",
  "barbell row",
  "t-bar row",
  "hip thrust",
  "leg press",
  "close-grip bench press",
  "dumbbell shoulder press",
  "arnold press",
]);

export function isCompoundExercise(name: string): boolean {
  return COMPOUND_NAMES.has(name.toLowerCase());
}
