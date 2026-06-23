export interface LibraryExercise {
  name: string;
  defaultSets: number;
  defaultReps: string;
}

export interface ExerciseCategory {
  id: string;
  name: string;
  exercises: LibraryExercise[];
}

export const EXERCISE_LIBRARY: ExerciseCategory[] = [
  {
    id: "chest",
    name: "Chest",
    exercises: [
      { name: "Bench Press", defaultSets: 4, defaultReps: "6-8" },
      { name: "Incline Bench Press", defaultSets: 4, defaultReps: "8-10" },
      { name: "Incline Dumbbell Press", defaultSets: 3, defaultReps: "10-12" },
      { name: "Dumbbell Fly", defaultSets: 3, defaultReps: "12-15" },
      { name: "Cable Crossover", defaultSets: 3, defaultReps: "12-15" },
      { name: "Push-ups", defaultSets: 3, defaultReps: "AMRAP" },
      { name: "Dips", defaultSets: 3, defaultReps: "8-12" },
      { name: "Chest Press Machine", defaultSets: 3, defaultReps: "10-12" },
    ],
  },
  {
    id: "back",
    name: "Back",
    exercises: [
      { name: "Deadlift", defaultSets: 3, defaultReps: "5" },
      { name: "Pull-ups", defaultSets: 4, defaultReps: "6-10" },
      { name: "Chin-ups", defaultSets: 3, defaultReps: "8-10" },
      { name: "Barbell Row", defaultSets: 3, defaultReps: "8-10" },
      { name: "Dumbbell Row", defaultSets: 3, defaultReps: "10-12" },
      { name: "Lat Pulldown", defaultSets: 3, defaultReps: "10-12" },
      { name: "Seated Cable Row", defaultSets: 3, defaultReps: "10-12" },
      { name: "T-Bar Row", defaultSets: 3, defaultReps: "8-10" },
      { name: "Face Pull", defaultSets: 3, defaultReps: "15" },
    ],
  },
  {
    id: "shoulders",
    name: "Shoulders",
    exercises: [
      { name: "Overhead Press", defaultSets: 3, defaultReps: "8-10" },
      { name: "Dumbbell Shoulder Press", defaultSets: 3, defaultReps: "10-12" },
      { name: "Arnold Press", defaultSets: 3, defaultReps: "10-12" },
      { name: "Lateral Raise", defaultSets: 3, defaultReps: "12-15" },
      { name: "Front Raise", defaultSets: 3, defaultReps: "12-15" },
      { name: "Rear Delt Fly", defaultSets: 3, defaultReps: "12-15" },
      { name: "Upright Row", defaultSets: 3, defaultReps: "10-12" },
      { name: "Shrugs", defaultSets: 3, defaultReps: "12-15" },
    ],
  },
  {
    id: "arms",
    name: "Arms",
    exercises: [
      { name: "Barbell Curl", defaultSets: 3, defaultReps: "10-12" },
      { name: "Dumbbell Curl", defaultSets: 3, defaultReps: "10-12" },
      { name: "Hammer Curl", defaultSets: 3, defaultReps: "10-12" },
      { name: "Preacher Curl", defaultSets: 3, defaultReps: "10-12" },
      { name: "Tricep Pushdown", defaultSets: 3, defaultReps: "12-15" },
      { name: "Overhead Tricep Extension", defaultSets: 3, defaultReps: "10-12" },
      { name: "Skullcrushers", defaultSets: 3, defaultReps: "10-12" },
      { name: "Close-Grip Bench Press", defaultSets: 3, defaultReps: "8-10" },
    ],
  },
  {
    id: "legs",
    name: "Legs",
    exercises: [
      { name: "Squat", defaultSets: 4, defaultReps: "6-8" },
      { name: "Front Squat", defaultSets: 3, defaultReps: "8-10" },
      { name: "Romanian Deadlift", defaultSets: 3, defaultReps: "8-10" },
      { name: "Leg Press", defaultSets: 3, defaultReps: "10-12" },
      { name: "Lunges", defaultSets: 3, defaultReps: "10 each" },
      { name: "Bulgarian Split Squat", defaultSets: 3, defaultReps: "10 each" },
      { name: "Leg Extension", defaultSets: 3, defaultReps: "12-15" },
      { name: "Leg Curl", defaultSets: 3, defaultReps: "12-15" },
      { name: "Hip Thrust", defaultSets: 3, defaultReps: "10-12" },
      { name: "Calf Raise", defaultSets: 4, defaultReps: "15-20" },
    ],
  },
  {
    id: "core",
    name: "Core",
    exercises: [
      { name: "Plank", defaultSets: 3, defaultReps: "60s" },
      { name: "Side Plank", defaultSets: 3, defaultReps: "45s each" },
      { name: "Crunches", defaultSets: 3, defaultReps: "15-20" },
      { name: "Hanging Leg Raise", defaultSets: 3, defaultReps: "10-15" },
      { name: "Russian Twist", defaultSets: 3, defaultReps: "20" },
      { name: "Cable Crunch", defaultSets: 3, defaultReps: "12-15" },
      { name: "Mountain Climbers", defaultSets: 3, defaultReps: "30s" },
      { name: "Ab Wheel Rollout", defaultSets: 3, defaultReps: "8-12" },
    ],
  },
  {
    id: "cardio",
    name: "Cardio",
    exercises: [
      { name: "Treadmill Run", defaultSets: 1, defaultReps: "30 min" },
      { name: "Stationary Bike", defaultSets: 1, defaultReps: "30 min" },
      { name: "Rowing Machine", defaultSets: 1, defaultReps: "20 min" },
      { name: "Elliptical", defaultSets: 1, defaultReps: "25 min" },
      { name: "Stair Climber", defaultSets: 1, defaultReps: "20 min" },
      { name: "Jump Rope", defaultSets: 3, defaultReps: "3 min" },
      { name: "HIIT Sprints", defaultSets: 8, defaultReps: "30s" },
      { name: "Incline Walk", defaultSets: 1, defaultReps: "30 min" },
    ],
  },
];
