import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronDown,
} from "lucide-react";
import {
  useFitnessStore,
  type Exercise,
  type WorkoutTemplate,
  DAY_LABELS,
} from "@/store/fitnessStore";
import { useHydrated } from "@/hooks/useHydrated";
import { type LibraryExercise } from "@/lib/exerciseLibrary";
import { ExercisePickerModal } from "@/components/ExercisePicker";

export const Route = createFileRoute("/routine")({
  head: () => ({
    meta: [
      { title: "Routine — FitTrack" },
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
    return <div className="flex min-h-screen flex-col gap-3 p-3" />;
  }

  return (
    <div className="flex min-h-screen flex-col gap-4 p-3">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Weekly Routine</h1>
        <p className="text-xs text-muted-foreground">
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
      <h2 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Week schedule
      </h2>
      <div className="flex flex-col gap-1.5 rounded-xl bg-card p-2">
        {DAYS.map((day) => {
          const assignedId = store.weekPlan[day];
          return (
            <div
              key={day}
              className="flex items-center justify-between gap-3 rounded-lg px-3 py-1.5"
            >
              <span className="w-16 text-xs font-semibold text-foreground">
                {DAY_LABELS[day]}
              </span>
              <div className="relative flex-1">
                <select
                  value={assignedId || ""}
                  onChange={(e) =>
                    store.assignTemplateToDay(day, e.target.value || null)
                  }
                  className="w-full appearance-none rounded-lg border border-border bg-surface px-3 py-1.5 pr-8 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">Rest day</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.exercises.length})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
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
      <h2 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Workout templates
      </h2>

      <div className="mb-2 flex gap-2">
        <input
          type="text"
          placeholder="New template (e.g. Push, Pull, Legs)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
          }}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <button
          onClick={handleCreate}
          disabled={!newName.trim()}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {templates.length === 0 && (
          <p className="rounded-xl border border-dashed border-border py-4 text-center text-xs text-muted-foreground">
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
      <div className="flex items-center gap-2 p-2.5">
        <button
          onClick={onToggle}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${
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
              className="rounded border border-primary bg-surface px-2 py-1 text-xs font-bold text-foreground focus:outline-none"
            />
          ) : (
            <div className="flex flex-1 items-baseline gap-2 min-w-0">
              <span className="text-sm font-bold text-foreground truncate">
                {template.name}
              </span>
              <span className="text-[10px] text-muted-foreground shrink-0">
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
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          aria-label="Rename"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteTemplate();
          }}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label="Delete template"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-border p-2.5">
          <div className="flex flex-col gap-1.5">
            {template.exercises.length === 0 && (
              <p className="py-2 text-center text-[11px] text-muted-foreground">
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
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Plus className="h-3 w-3" />
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
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            className={`h-3 w-3 shrink-0 text-muted-foreground transition-transform ${
              open ? "" : "-rotate-90"
            }`}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{exercise.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {exercise.sets} × {exercise.reps}
              {weights.some((w) => w > 0) &&
                ` · ${Math.max(...weights)}${weightUnit}`}
            </p>
          </div>
        </button>
        <button
          onClick={onDelete}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label="Remove exercise"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-2 border-t border-border px-2.5 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-muted-foreground">
                Sets
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateSets(exercise.sets - 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-md bg-card text-foreground hover:bg-primary/10"
                  aria-label="Fewer sets"
                >
                  −
                </button>
                <span className="w-5 text-center text-sm font-bold text-foreground">
                  {exercise.sets}
                </span>
                <button
                  onClick={() => updateSets(exercise.sets + 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-md bg-card text-foreground hover:bg-primary/10"
                  aria-label="More sets"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex flex-1 items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-muted-foreground">
                Reps
              </span>
              <input
                value={exercise.reps}
                onChange={(e) => updateReps(e.target.value)}
                className="w-16 rounded-md border border-border bg-card px-2 py-1 text-center text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              Starting weight per set ({weightUnit})
            </span>
            {Array.from({ length: exercise.sets }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md bg-card px-2 py-1"
              >
                <span className="w-8 shrink-0 text-[10px] font-semibold text-muted-foreground">
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
                  className="no-spinner w-full flex-1 rounded-md border border-border bg-surface px-2 py-1.5 text-center text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
                />
                <span className="w-5 shrink-0 text-[10px] font-medium text-muted-foreground">
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