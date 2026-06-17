import { useState } from "react";
import { Check, ChevronLeft, Plus, Search, X } from "lucide-react";
import {
  EXERCISE_LIBRARY,
  type ExerciseCategory,
  type LibraryExercise,
} from "@/lib/exerciseLibrary";

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

  const filtered = category
    ? category.exercises.filter((e) =>
        e.name.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-2xl bg-card sm:rounded-2xl"
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
          <h3 className="flex-1 text-base font-bold text-foreground">
            {category
              ? `${category.emoji} ${category.name}`
              : title || "Pick a category"}
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
          <div className="grid grid-cols-2 gap-2 overflow-y-auto p-3">
            {EXERCISE_LIBRARY.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat)}
                className="flex flex-col items-start gap-1 rounded-xl bg-surface p-3 text-left transition-colors hover:bg-primary/10"
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-sm font-bold text-foreground">
                  {cat.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {cat.exercises.length} exercises
                </span>
              </button>
            ))}
          </div>
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
            <div className="flex flex-col gap-1 overflow-y-auto p-2.5">
              {filtered.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No matches
                </p>
              )}
              {filtered.map((ex) => {
                const added = existingNames.includes(ex.name.toLowerCase());
                return (
                  <button
                    key={ex.name}
                    onClick={() => onPick(ex)}
                    className="flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2 text-left transition-colors hover:bg-primary/10"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {ex.name}
                      </p>
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