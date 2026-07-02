/**
 * Shared date utilities — used across analytics, progress, store, etc.
 * Avoids duplicating date logic in multiple files.
 */

export type Day = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const DAYS: Day[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const DAY_LABELS: Record<Day, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

/**
 * Get today's date as an ISO string (YYYY-MM-DD) in local time.
 */
export function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get the short day name (mon, tue, ...) for today.
 */
export function getDayName(): Day {
  const days: Day[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return days[new Date().getDay()];
}

/**
 * Get the Monday (start of week) for a given date.
 */
export function getMondayOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setDate(d.getDate() + mondayOffset);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Convert a date to ISO date string (YYYY-MM-DD).
 */
export function toISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Parse an ISO date string to a Date at noon (avoids timezone issues).
 */
export function fromISO(iso: string): Date {
  return new Date(iso + "T12:00:00");
}

/**
 * Format a date for display: "Jun 15"
 */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Format a date for display: "Monday, Jun 15"
 */
export function formatLongDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/**
 * Iterate over N weeks of ISO date strings, starting from the most recent Monday.
 * Yields `{ weekMonday, dates }` for each week, from oldest to newest.
 */
export function* iterateWeeks(numWeeks: number, from: Date = new Date()) {
  const thisMonday = getMondayOfWeek(from);
  const weeks = [];
  for (let w = 0; w < numWeeks; w++) {
    const weekMonday = new Date(thisMonday);
    weekMonday.setDate(thisMonday.getDate() - w * 7);
    const dates: string[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekMonday);
      day.setDate(weekMonday.getDate() + d);
      dates.push(toISO(day));
    }
    weeks.push({ weekMonday, dates, weekLabel: formatShortDate(weekMonday) });
  }
  yield* weeks.reverse();
}
