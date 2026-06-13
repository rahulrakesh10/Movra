import { createFileRoute } from "@tanstack/react-router";
import { User, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useFitnessStore, type WeightUnit, type Goals } from "@/store/fitnessStore";
import { useHydrated } from "@/hooks/useHydrated";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Movra" },
      { name: "description", content: "Manage your units and preferences." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const hydrated = useHydrated();
  const weightUnit = useFitnessStore((s) => s.weightUnit);
  const setWeightUnit = useFitnessStore((s) => s.setWeightUnit);
  const profile = useFitnessStore((s) => s.profile);
  const goals = useFitnessStore((s) => s.goals);
  const setGoals = useFitnessStore((s) => s.setGoals);
  const resetOnboarding = useFitnessStore((s) => s.resetOnboarding);

  if (!hydrated) {
    return <div className="flex min-h-screen flex-col p-4" />;
  }

  const units: { value: WeightUnit; label: string }[] = [
    { value: "kg", label: "Kilograms (kg)" },
    { value: "lb", label: "Pounds (lb)" },
  ];

  return (
    <div className="flex min-h-screen flex-col gap-6 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-sm text-muted-foreground">Settings & preferences</p>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Weight unit
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {units.map((u) => (
            <button
              key={u.value}
              onClick={() => setWeightUnit(u.value)}
              className={`rounded-xl border p-4 text-left transition-all ${
                weightUnit === u.value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <p className="text-base font-semibold text-foreground">{u.label}</p>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Used for logging exercise weight.
        </p>
      </section>

      {profile && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            About you
          </h2>
          <div className="flex flex-col gap-1 rounded-xl bg-card p-4 text-sm">
            <Row label="Sex" value={profile.sex} />
            <Row label="Age" value={`${profile.age} yrs`} />
            <Row label="Height" value={`${profile.heightCm} cm`} />
            <Row label="Weight" value={`${profile.weightKg} kg`} />
            <Row label="Goal" value={profile.goalType} />
            <Row label="Activity" value={profile.activity} />
            <Row label="Days / week" value={String(profile.daysPerWeek)} />
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Daily targets
        </h2>
        <GoalsEditor goals={goals} onSave={setGoals} />
      </section>

      <button
        onClick={() => {
          if (confirm("Redo onboarding? Your routine and logs stay.")) {
            resetOnboarding();
          }
        }}
        className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <RotateCcw className="h-4 w-4" />
        Redo onboarding
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium capitalize text-foreground">{value}</span>
    </div>
  );
}

function GoalsEditor({
  goals,
  onSave,
}: {
  goals: Goals;
  onSave: (g: Partial<Goals>) => void;
}) {
  const [draft, setDraft] = useState(goals);
  const dirty =
    draft.calories !== goals.calories ||
    draft.protein !== goals.protein ||
    draft.carbs !== goals.carbs ||
    draft.fat !== goals.fat;

  const fields: { key: keyof Goals; label: string; suffix: string }[] = [
    { key: "calories", label: "Calories", suffix: "kcal" },
    { key: "protein", label: "Protein", suffix: "g" },
    { key: "carbs", label: "Carbs", suffix: "g" },
    { key: "fat", label: "Fat", suffix: "g" },
  ];

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-card p-3">
      {fields.map((f) => (
        <div
          key={f.key}
          className="flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2"
        >
          <span className="text-sm font-medium text-foreground">{f.label}</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={draft[f.key]}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  [f.key]: Math.max(0, parseInt(e.target.value) || 0),
                }))
              }
              className="w-20 rounded-md border border-border bg-card px-2 py-1 text-right text-sm text-foreground focus:border-primary focus:outline-none"
            />
            <span className="w-10 text-xs text-muted-foreground">{f.suffix}</span>
          </div>
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => setDraft(goals)}
          disabled={!dirty}
          className="flex-1 rounded-lg bg-surface py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
        >
          Reset
        </button>
        <button
          onClick={() => onSave(draft)}
          disabled={!dirty}
          className="flex-1 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </div>
  );
}