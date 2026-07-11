/**
 * Equipment profiles for Travel Mode.
 * "full" = no restrictions (default gym).
 */
export type EquipmentProfile = "full" | "hotel" | "dumbbells" | "bodyweight" | "calisthenics";

export interface EquipmentProfileMeta {
  id: EquipmentProfile;
  label: string;
  emoji: string;
  description: string;
}

export const EQUIPMENT_PROFILES: EquipmentProfileMeta[] = [
  {
    id: "full",
    label: "Full Gym",
    emoji: "🏋️",
    description: "All equipment available",
  },
  {
    id: "hotel",
    label: "Hotel Gym",
    emoji: "🏨",
    description: "Dumbbells, cables & cardio machines",
  },
  {
    id: "dumbbells",
    label: "Dumbbells Only",
    emoji: "💪",
    description: "Dumbbells + bodyweight",
  },
  {
    id: "calisthenics",
    label: "Calisthenics Park",
    emoji: "🐒",
    description: "Pull-up bar & dip bars",
  },
  {
    id: "bodyweight",
    label: "Bodyweight",
    emoji: "🤸",
    description: "No equipment needed",
  },
];

/**
 * For each exercise name, the best alternative per equipment tier.
 * If an exercise has no entry, it means it already works with any equipment
 * (e.g. Push-ups, Plank, Dumbbell Curl) and needs no swap.
 *
 * hotel       = dumbbells + cable machines + cardio
 * dumbbells   = dumbbells + bodyweight only
 * calisthenics = pull-up bar, dip bars, bodyweight
 * bodyweight  = no equipment at all
 */
const SUBSTITUTION_MAP: Record<
  string,
  Partial<Record<Exclude<EquipmentProfile, "full">, string>>
> = {
  // ── Chest ──
  "Bench Press": {
    hotel: "Dumbbell Press",
    dumbbells: "Dumbbell Press",
    calisthenics: "Dips",
    bodyweight: "Push-ups",
  },
  "Incline Bench Press": {
    hotel: "Incline Dumbbell Press",
    dumbbells: "Incline Dumbbell Press",
    calisthenics: "Pike Push-ups",
    bodyweight: "Pike Push-ups",
  },
  "Close-Grip Bench Press": {
    hotel: "Dumbbell Press",
    dumbbells: "Diamond Push-ups",
    calisthenics: "Diamond Push-ups",
    bodyweight: "Diamond Push-ups",
  },
  "Chest Press Machine": {
    hotel: "Dumbbell Press",
    dumbbells: "Dumbbell Press",
    calisthenics: "Dips",
    bodyweight: "Push-ups",
  },
  "Cable Crossover": {
    hotel: "Dumbbell Fly",
    dumbbells: "Dumbbell Fly",
    calisthenics: "Push-ups",
    bodyweight: "Push-ups",
  },
  "Dips": {
    hotel: "Dips",
    dumbbells: "Diamond Push-ups",
    calisthenics: "Dips",
    bodyweight: "Diamond Push-ups",
  },

  // ── Back ──
  "Deadlift": {
    hotel: "Dumbbell Romanian Deadlift",
    dumbbells: "Dumbbell Romanian Deadlift",
    calisthenics: "Superman Hold",
    bodyweight: "Superman Hold",
  },
  "Barbell Row": {
    hotel: "Dumbbell Row",
    dumbbells: "Dumbbell Row",
    calisthenics: "Pull-ups",
    bodyweight: "Inverted Row",
  },
  "T-Bar Row": {
    hotel: "Dumbbell Row",
    dumbbells: "Dumbbell Row",
    calisthenics: "Pull-ups",
    bodyweight: "Inverted Row",
  },
  "Lat Pulldown": {
    hotel: "Dumbbell Row",
    dumbbells: "Dumbbell Row",
    calisthenics: "Pull-ups",
    bodyweight: "Pull-ups", // assuming they can find a door frame if they really want, otherwise inverted row
  },
  "Seated Cable Row": {
    hotel: "Dumbbell Row",
    dumbbells: "Dumbbell Row",
    calisthenics: "Pull-ups",
    bodyweight: "Inverted Row",
  },
  "Face Pull": {
    hotel: "Rear Delt Fly",
    dumbbells: "Rear Delt Fly",
    calisthenics: "Pull-ups",
    bodyweight: "Band Pull-apart",
  },

  // ── Shoulders ──
  "Overhead Press": {
    hotel: "Dumbbell Shoulder Press",
    dumbbells: "Dumbbell Shoulder Press",
    calisthenics: "Pike Push-ups",
    bodyweight: "Pike Push-ups",
  },
  "Upright Row": {
    hotel: "Dumbbell Lateral Raise",
    dumbbells: "Dumbbell Lateral Raise",
    calisthenics: "Pike Push-ups",
    bodyweight: "Pike Push-ups",
  },

  // ── Arms ──
  "Barbell Curl": {
    hotel: "Dumbbell Curl",
    dumbbells: "Dumbbell Curl",
    calisthenics: "Chin-ups",
    bodyweight: "Inverted Curl",
  },
  "Preacher Curl": {
    hotel: "Dumbbell Curl",
    dumbbells: "Dumbbell Curl",
    calisthenics: "Chin-ups",
    bodyweight: "Inverted Curl",
  },
  "Tricep Pushdown": {
    hotel: "Overhead Tricep Extension",
    dumbbells: "Overhead Tricep Extension",
    calisthenics: "Dips",
    bodyweight: "Diamond Push-ups",
  },
  "Skullcrushers": {
    hotel: "Overhead Tricep Extension",
    dumbbells: "Overhead Tricep Extension",
    calisthenics: "Dips",
    bodyweight: "Diamond Push-ups",
  },

  // ── Legs ──
  "Squat": {
    hotel: "Goblet Squat",
    dumbbells: "Goblet Squat",
    calisthenics: "Pistol Squat",
    bodyweight: "Bulgarian Split Squat",
  },
  "Front Squat": {
    hotel: "Goblet Squat",
    dumbbells: "Goblet Squat",
    calisthenics: "Pistol Squat",
    bodyweight: "Bulgarian Split Squat",
  },
  "Romanian Deadlift": {
    hotel: "Dumbbell Romanian Deadlift",
    dumbbells: "Dumbbell Romanian Deadlift",
    calisthenics: "Single-Leg Glute Bridge",
    bodyweight: "Single-Leg Glute Bridge",
  },
  "Leg Press": {
    hotel: "Dumbbell Goblet Squat",
    dumbbells: "Dumbbell Goblet Squat",
    calisthenics: "Pistol Squat",
    bodyweight: "Wall Sit",
  },
  "Leg Extension": {
    hotel: "Dumbbell Lunge",
    dumbbells: "Dumbbell Lunge",
    calisthenics: "Pistol Squat",
    bodyweight: "Reverse Lunge",
  },
  "Leg Curl": {
    hotel: "Dumbbell Romanian Deadlift",
    dumbbells: "Dumbbell Romanian Deadlift",
    calisthenics: "Nordic Hamstring Curl",
    bodyweight: "Nordic Hamstring Curl",
  },
  "Hip Thrust": {
    hotel: "Dumbbell Hip Thrust",
    dumbbells: "Dumbbell Hip Thrust",
    calisthenics: "Glute Bridge",
    bodyweight: "Glute Bridge",
  },

  // ── Core ──
  "Cable Crunch": {
    hotel: "Dumbbell Crunch",
    dumbbells: "Dumbbell Crunch",
    calisthenics: "Hanging Leg Raise",
    bodyweight: "Crunches",
  },
  "Ab Wheel Rollout": {
    hotel: "Plank",
    dumbbells: "Plank",
    calisthenics: "L-Sit",
    bodyweight: "Plank",
  },
  "Hanging Leg Raise": {
    hotel: "Hanging Leg Raise",
    dumbbells: "Lying Leg Raise",
    calisthenics: "Hanging Leg Raise",
    bodyweight: "Lying Leg Raise",
  },

  // ── Cardio ──
  "Treadmill Run": {
    hotel: "Treadmill Run",
    dumbbells: "HIIT Sprints",
    calisthenics: "Sprints",
    bodyweight: "HIIT Sprints",
  },
  "Stationary Bike": {
    hotel: "Stationary Bike",
    dumbbells: "Jump Rope",
    calisthenics: "High Knees",
    bodyweight: "Mountain Climbers",
  },
  "Rowing Machine": {
    hotel: "Rowing Machine",
    dumbbells: "Jump Rope",
    calisthenics: "Burpees",
    bodyweight: "Burpees",
  },
  "Stair Climber": {
    hotel: "Stair Climber",
    dumbbells: "Jump Rope",
    calisthenics: "Box Jumps",
    bodyweight: "Step-ups",
  },
  "Elliptical": {
    hotel: "Elliptical",
    dumbbells: "Jump Rope",
    calisthenics: "Sprints",
    bodyweight: "HIIT Sprints",
  },
};

/**
 * Return the best substitute exercise name for a given profile.
 * Returns null if no swap is needed (exercise already works in this profile).
 */
export function getSubstitute(
  exerciseName: string,
  profile: EquipmentProfile,
): string | null {
  if (profile === "full") return null;
  const subs = SUBSTITUTION_MAP[exerciseName];
  if (!subs) return null;
  return subs[profile] ?? null;
}

/**
 * Given a list of exercises and a profile, return a map of
 * exerciseId → substitute name (only for exercises that need swapping).
 */
export function buildSubstitutionOverlay(
  exercises: Array<{ id: string; name: string }>,
  profile: EquipmentProfile,
): Record<string, string> {
  const overlay: Record<string, string> = {};
  for (const ex of exercises) {
    const sub = getSubstitute(ex.name, profile);
    if (sub && sub !== ex.name) {
      overlay[ex.id] = sub;
    }
  }
  return overlay;
}
