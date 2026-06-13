import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronLeft,
  Search,
} from "lucide-react";
import {
  useFitnessStore,
  type Exercise,
  type WorkoutTemplate,
  DAY_LABELS,
} from "@/store/fitnessStore";
import { useHydrated } from "@/hooks/useHydrated";
import {
  EXERCISE_LIBRARY,
  type ExerciseCategory,
  type LibraryExercise,
} from "@/lib/exerciseLibrary";

export const Route = createFileRoute("/routine")({
  head: () => ({
    meta: [
      { title: "Routine — Movra" },
      {
        name: "description",
        content:
          "Build reusable workout templates and assign one to each day of the week.",
      },
    ],
  }),
  component: RoutinePage,
});

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

function RoutinePage() {
  const hydrated = useHydrated();
  const store = useFitnessStore();

  if (!hydrated) {
    return <div className="flex min-h-screen flex-col gap-4 p-4" />;
  }

  return (
    <div className="flex min-h-screen flex-col gap-6 p-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Weekly Routine</h1>
        <p className="text-sm text-muted-foreground">
          Build workout templates, then assign one to each day.
        </p>
      </div>

      <WeekAssignmentSection />
      <TemplatesSection />
    </div>
  );
}

function WeekAssignmentSection() {
  const store = useFitnessStore();
  const templates = store.templateOrder
    .map((id) => store.templates[id])
    .filter(Boolean);

  return (
    <section>
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Week schedule
      </h2>
      <div className="flex flex-col gap-2 rounded-xl bg-card p-2">
        {DAYS.map((day) => {
          const assignedId = store.weekPlan[day];
          return (
            <div
              key={day}
              className="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
            >
              <span className="w-20 text-sm font-semibold text-foreground">
                {DAY_LABELS[day]}
              </span>
              <div className="relative flex-1">
                <select
                  value={assignedId || ""}
                  onChange={(e) =>
                    store.assignTemplateToDay(day, e.target.value || null)
                  }
                  className="w-full appearance-none rounded-lg border border-border bg-surface px-3 py-2 pr-8 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">Rest day</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.exercises.length})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TemplatesSection() {
  const store = useFitnessStore();
  const [newName, setNewName] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const templates = store.templateOrder
    .map((id) => store.templates[id])
    .filter(Boolean);

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    const id = store.createTemplate(name);
    setNewName("");
    setExpanded(id);
  }

  return (
    <section>
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Workout templates
      </h2>

      <div className="mb-3 flex gap-2">
        <input
          type="text"
          placeholder="New template (e.g. Push, Pull, Legs)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
          }}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <button
          onClick={handleCreate}
          disabled={!newName.trim()}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {templates.length === 0 && (
          <p className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
            No templates yet. Create one above.
          </p>
        )}
        {templates.map((tpl) => (
          <TemplateCard
            key={tpl.id}
            template={tpl}
            isOpen={expanded === tpl.id}
            onToggle={() =>
              setExpanded((cur) => (cur === tpl.id ? null : tpl.id))
            }
          />
        ))}
      </div>
    </section>
  );
}

function TemplateCard({
  template,
  isOpen,
  onToggle,
}: {
  template: WorkoutTemplate;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const store = useFitnessStore();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(template.name);
  const [pickerOpen, setPickerOpen] = useState(false);

  const usedOn = DAYS.filter((d) => store.weekPlan[d] === template.id);

  function handlePick(ex: LibraryExercise) {
    store.addExerciseToTemplate(template.id, {
      name: ex.name,
      sets: ex.defaultSets,
      reps: ex.defaultReps,
    });
  }

  function handleDeleteTemplate() {
    if (
      confirm(
        `Delete "${template.name}"? This will unassign it from any days using it.`
      )
    ) {
      store.deleteTemplate(template.id);
    }
  }

  return (
    <div className="rounded-xl bg-card">
      <div className="flex items-center gap-2 p-3">
        <button
          onClick={onToggle}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
              isOpen ? "" : "-rotate-90"
            }`}
          />
          {editingName ? (
            <input
              autoFocus
              value={nameDraft}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={() => {
                store.renameTemplate(template.id, nameDraft);
                setEditingName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  store.renameTemplate(template.id, nameDraft);
                  setEditingName(false);
                }
              }}
              className="rounded border border-primary bg-surface px-2 py-1 text-sm font-bold text-foreground focus:outline-none"
            />
          ) : (
            <div className="flex flex-1 items-baseline gap-2">
              <span className="text-base font-bold text-foreground">
                {template.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {template.exercises.length} ex
                {usedOn.length > 0 &&
                  ` · ${usedOn.map((d) => d.toUpperCase()).join(", ")}`}
              </span>
            </div>
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setNameDraft(template.name);
            setEditingName(true);
          }}
          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          aria-label="Rename"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteTemplate();
          }}
          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label="Delete template"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-border p-3">
          <div className="flex flex-col gap-2">
            {template.exercises.length === 0 && (
              <p className="py-3 text-center text-xs text-muted-foreground">
                No exercises yet
              </p>
            )}
            {template.exercises.map((ex) => (
              <ExerciseRow
                key={ex.id}
                exercise={ex}
                templateId={template.id}
                onDelete={() =>
                  store.removeExerciseFromTemplate(template.id, ex.id)
                }
              />
            ))}
          </div>

          <button
            onClick={() => setPickerOpen(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            Add exercise
          </button>

          {pickerOpen && (
            <ExercisePickerModal
              existingNames={template.exercises.map((e) => e.name.toLowerCase())}
              onPick={handlePick}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ExercisePickerModal({
  existingNames,
  onPick,
  onClose,
}: {
  existingNames: string[];
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
            {category ? `${category.emoji} ${category.name}` : "Pick a category"}
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
                className="flex flex-col items-start gap-1 rounded-xl bg-surface p-4 text-left transition-colors hover:bg-primary/10"
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-sm font-bold text-foreground">
                  {cat.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {cat.exercises.length} exercises
                </span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="border-b border-border p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search exercises"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface py-2 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 overflow-y-auto p-3">
              {filtered.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No matches
                </p>
              )}
              {filtered.map((ex) => {
                const added = existingNames.includes(ex.name.toLowerCase());
                return (
                  <button
                    key={ex.name}
                    onClick={() => onPick(ex)}
                    className="flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2.5 text-left transition-colors hover:bg-primary/10"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {ex.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ex.defaultSets} × {ex.defaultReps}
                      </p>
                    </div>
                    {added ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Plus className="h-4 w-4 text-muted-foreground" />
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

function ExerciseRow({
  exercise,
  templateId,
  onDelete,
}: {
  exercise: Exercise;
  templateId: string;
  onDelete: () => void;
}) {
  const store = useFitnessStore();
  const weightUnit = useFitnessStore((s) => s.weightUnit);
  const [open, setOpen] = useState(false);

  const weights =
    exercise.weights && exercise.weights.length === exercise.sets
      ? exercise.weights
      : Array.from({ length: exercise.sets }, (_, i) => exercise.weights?.[i] ?? 0);

  function updateSets(next: number) {
    const sets = Math.max(1, Math.min(20, next));
    store.updateExerciseInTemplate(templateId, exercise.id, { sets });
  }

  function updateReps(reps: string) {
    store.updateExerciseInTemplate(templateId, exercise.id, { reps });
  }

  function updateWeight(index: number, value: number) {
    const next = [...weights];
    next[index] = isNaN(value) ? 0 : value;
    store.updateExerciseInTemplate(templateId, exercise.id, { weights: next });
  }

  return (
    <div className="rounded-lg bg-surface">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${
              open ? "" : "-rotate-90"
            }`}
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{exercise.name}</p>
            <p className="text-xs text-muted-foreground">
              {exercise.sets} × {exercise.reps}
              {weights.some((w) => w > 0) &&
                ` · ${Math.max(...weights)}${weightUnit}`}
            </p>
          </div>
        </button>
        <button
          onClick={onDelete}
          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label="Remove exercise"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-3 border-t border-border px-3 py-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Sets
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateSets(exercise.sets - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-card text-foreground hover:bg-primary/10"
                  aria-label="Fewer sets"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-bold text-foreground">
                  {exercise.sets}
                </span>
                <button
                  onClick={() => updateSets(exercise.sets + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-card text-foreground hover:bg-primary/10"
                  aria-label="More sets"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex flex-1 items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Reps
              </span>
              <input
                value={exercise.reps}
                onChange={(e) => updateReps(e.target.value)}
                className="w-20 rounded-md border border-border bg-card px-2 py-1 text-center text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Starting weight per set ({weightUnit})
            </span>
            {Array.from({ length: exercise.sets }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md bg-card px-2 py-1.5"
              >
                <span className="w-10 shrink-0 text-xs font-semibold text-muted-foreground">
                  Set {i + 1}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  value={weights[i] || ""}
                  placeholder="0"
                  onChange={(e) =>
                    updateWeight(i, parseFloat(e.target.value) || 0)
                  }
                  className="no-spinner w-full flex-1 rounded-md border border-border bg-surface px-2 py-2 text-center text-base font-semibold text-foreground focus:border-primary focus:outline-none"
                />
                <span className="w-6 shrink-0 text-xs font-medium text-muted-foreground">
                  {weightUnit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}