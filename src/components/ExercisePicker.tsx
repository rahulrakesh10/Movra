import { useState } from "react";
import {
  Activity,
  ArrowUp,
  Check,
  ChevronLeft,
  Dumbbell,
  Flame,
  Footprints,
  HeartPulse,
  Plus,
  Search,
  Target,
  X,
} from "lucide-react";
import {
  EXERCISE_LIBRARY,
  type ExerciseCategory,
  type LibraryExercise,
} from "@/lib/exerciseLibrary";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  chest: Dumbbell,
  back: Activity,
  shoulders: ArrowUp,
  arms: Target,
  legs: Footprints,
  core: Flame,
  cardio: HeartPulse,
};

export function ExercisePickerModal({
  existingNames = [],
  title,
  onPick,
  onClose,
}: {
  existingNames?: string[];
  title?: string;
  onPick: (ex: LibraryExercise) => void;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<ExerciseCategory | null>(null);
  const [query, setQuery] = useState("");
  const [customName, setCustomName] = useState("");

  const filtered = category
    ? category.exercises.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  const hasExactMatch = category
    ? category.exercises.some((e) => e.name.toLowerCase() === query.trim().toLowerCase())
    : false;

  const CategoryIcon = category ? CATEGORY_ICONS[category.id] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="sheet-animate flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl bg-card sm:rounded-2xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center gap-2 border-b border-border p-3">
          {category && (
            <button
              onClick={() => {
                setCategory(null);
                setQuery("");
              }}
              className="rounded p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
              aria-label="Back"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
            {CategoryIcon && <CategoryIcon className="h-4 w-4 text-primary" />}
            {category ? category.name : title || "Pick a category"}
          </h3>
          <button
            onClick={onClose}
            className="rounded p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!category ? (
          <>
            <div className="grid flex-1 min-h-0 grid-cols-2 gap-2 overflow-y-auto p-3">
              {EXERCISE_LIBRARY.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.id];
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat)}
                    className="flex flex-col items-start gap-2 rounded-xl bg-surface p-3 text-left transition-colors hover:bg-primary/10"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {Icon && <Icon className="h-4 w-4" />}
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-sm font-bold text-foreground">{cat.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {cat.exercises.length} exercises
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="border-t border-border p-3 bg-card rounded-b-2xl">
              <p className="mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Or create a custom exercise directly
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customName.trim()) {
                    onPick({ name: customName.trim(), defaultSets: 3, defaultReps: "10" });
                  }
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  placeholder="e.g. Kettlebell Swing"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!customName.trim()}
                  className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  Create
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            <div className="border-b border-border p-2.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search exercises"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface py-1.5 pl-7 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="flex flex-1 min-h-0 flex-col gap-1 overflow-y-auto p-2.5">
              {!hasExactMatch && query.trim().length > 0 && (
                <button
                  onClick={() => onPick({ name: query.trim(), defaultSets: 3, defaultReps: "10" })}
                  className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-left hover:bg-primary/10 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-primary">Create custom exercise</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      "{query.trim()}" (3 sets × 10 reps)
                    </p>
                  </div>
                  <Plus className="h-4 w-4 text-primary shrink-0" />
                </button>
              )}
              {filtered.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  {query.trim().length > 0
                    ? "No exact match found. You can add it as a custom exercise above!"
                    : "No exercises found."}
                </p>
              )}
              {filtered.map((ex) => {
                const added = existingNames.includes(ex.name.toLowerCase());
                return (
                  <button
                    key={ex.name}
                    disabled={added}
                    onClick={() => !added && onPick(ex)}
                    className={`flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2 text-left transition-colors ${
                      added ? "cursor-default opacity-60" : "hover:bg-primary/10"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{ex.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {ex.defaultSets} × {ex.defaultReps}
                      </p>
                    </div>
                    {added ? (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
