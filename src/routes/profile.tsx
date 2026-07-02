import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RotateCcw, Sun, Moon, Monitor, Scale, Download, Upload, Trash2 } from "lucide-react";
import { useState, useRef, useMemo } from "react";
import {
  useFitnessStore,
  getTodayISO,
  type WeightUnit,
  type Goals,
  type ThemePreference,
} from "@/store/fitnessStore";
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
  const navigate = useNavigate();
  const weightUnit = useFitnessStore((s) => s.weightUnit);
  const setWeightUnit = useFitnessStore((s) => s.setWeightUnit);
  const theme = useFitnessStore((s) => s.theme);
  const setTheme = useFitnessStore((s) => s.setTheme);
  const profile = useFitnessStore((s) => s.profile);
  const goals = useFitnessStore((s) => s.goals);
  const setGoals = useFitnessStore((s) => s.setGoals);
  const resetOnboarding = useFitnessStore((s) => s.resetOnboarding);

  if (!hydrated) {
    return <div className="flex min-h-screen flex-col p-3" />;
  }

  const units: { value: WeightUnit; label: string }[] = [
    { value: "kg", label: "Kilograms (kg)" },
    { value: "lb", label: "Pounds (lb)" },
  ];

  const themes: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Settings & preferences</p>
      </div>

      <section>
        <h2 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Appearance
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {themes.map((t) => {
            const Icon = t.icon;
            const active = theme === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 transition-all ${
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-xs font-semibold text-foreground">{t.label}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          System follows your device preference.
        </p>
      </section>

      <section>
        <h2 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Weight unit
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {units.map((u) => (
            <button
              key={u.value}
              onClick={() => setWeightUnit(u.value)}
              className={`rounded-xl border p-3 text-left transition-all ${
                weightUnit === u.value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <p className="text-sm font-semibold text-foreground">{u.label}</p>
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          Used for logging exercise weight.
        </p>
      </section>

      {/* ── Body Weight Tracking ── */}
      <BodyWeightSection />

      {profile && (
        <section>
          <h2 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            About you
          </h2>
          <div className="flex flex-col gap-1 rounded-xl bg-card p-3 text-xs">
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
        <h2 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Daily targets
        </h2>
        <GoalsEditor goals={goals} onSave={setGoals} />
      </section>

      {/* ── Export / Import Data ── */}
      <DataManagementSection />

      <button
        onClick={() => {
          if (confirm("Redo onboarding? Your routine and logs stay.")) {
            resetOnboarding();
            navigate({ to: "/" });
          }
        }}
        className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Redo onboarding
      </button>
    </div>
  );
}

/* ────── Body Weight Tracking ────── */
function BodyWeightSection() {
  const weightLog = useFitnessStore((s) => s.weightLog);
  const logBodyWeight = useFitnessStore((s) => s.logBodyWeight);
  const deleteWeightLog = useFitnessStore((s) => s.deleteWeightLog);
  const weightUnit = useFitnessStore((s) => s.weightUnit);
  const todayISO = getTodayISO();
  const todayWeight = weightLog[todayISO];

  const [draft, setDraft] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  // Sort entries by date descending
  const entries = useMemo(
    () =>
      Object.entries(weightLog)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 30),
    [weightLog],
  );

  // Sparkline data (last 14 entries, oldest first)
  const sparkData = useMemo(() => {
    const sorted = Object.entries(weightLog)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14);
    return sorted.map(([, w]) => w);
  }, [weightLog]);

  function handleLog() {
    const raw = parseFloat(draft);
    if (!raw || raw <= 0) return;
    // Convert lb to kg if needed
    const kg = weightUnit === "lb" ? raw / 2.205 : raw;
    logBodyWeight(todayISO, Math.round(kg * 10) / 10);
    setDraft("");
  }

  function displayWeight(kg: number): string {
    if (weightUnit === "lb") return (kg * 2.205).toFixed(1);
    return kg.toFixed(1);
  }

  return (
    <section>
      <h2 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Body weight
      </h2>
      <div className="rounded-xl bg-card p-3">
        {/* Today's weight input */}
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 shrink-0 text-primary" />
          <input
            type="number"
            inputMode="decimal"
            placeholder={todayWeight ? displayWeight(todayWeight) : `Today (${weightUnit})`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLog();
            }}
            className="no-spinner flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <button
            onClick={handleLog}
            disabled={!draft}
            className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Log
          </button>
        </div>

        {/* Sparkline */}
        {sparkData.length >= 2 && (
          <div className="mt-3">
            <MiniSparkline data={sparkData} />
            <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>
                {entries.length > 0
                  ? new Date(entries[entries.length - 1][0] + "T12:00:00").toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" },
                    )
                  : ""}
              </span>
              <span>
                Latest: {displayWeight(sparkData[sparkData.length - 1])} {weightUnit}
              </span>
            </div>
          </div>
        )}

        {/* Today badge */}
        {todayWeight && (
          <div className="mt-2 flex items-center justify-between rounded-md bg-primary/5 px-2.5 py-1.5">
            <span className="text-[11px] text-muted-foreground">Today's weight</span>
            <span className="text-sm font-bold text-primary">
              {displayWeight(todayWeight)} {weightUnit}
            </span>
          </div>
        )}

        {/* History toggle */}
        {entries.length > 0 && (
          <>
            <button
              onClick={() => setShowHistory((o) => !o)}
              className="mt-2 w-full text-center text-[10px] font-medium text-primary"
            >
              {showHistory ? "Hide history" : `Show history (${entries.length})`}
            </button>
            {showHistory && (
              <div className="mt-2 flex flex-col gap-1 max-h-48 overflow-y-auto">
                {entries.map(([date, kg]) => (
                  <div
                    key={date}
                    className="flex items-center justify-between rounded-md bg-surface px-2.5 py-1.5 text-xs"
                  >
                    <span className="text-muted-foreground">
                      {new Date(date + "T12:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {displayWeight(kg)} {weightUnit}
                      </span>
                      <button
                        onClick={() => deleteWeightLog(date)}
                        className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                        aria-label="Delete weight entry"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/* ────── Mini Sparkline (SVG) ────── */
function MiniSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 40;
  const w = 280;
  const padding = 4;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (w - padding * 2);
    const y = h - padding - ((v - min) / range) * (h - padding * 2);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last dot */}
      {(() => {
        const last = points[points.length - 1].split(",");
        return (
          <circle cx={last[0]} cy={last[1]} r="3" fill="var(--primary)" />
        );
      })()}
    </svg>
  );
}

/* ────── Export / Import Data ────── */
function DataManagementSection() {
  const store = useFitnessStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");

  function handleExport() {
    const state = useFitnessStore.getState();
    // Only export user data, not functions
    const exportData = {
      templates: state.templates,
      templateOrder: state.templateOrder,
      weekPlan: state.weekPlan,
      logs: state.logs,
      goals: state.goals,
      profile: state.profile,
      weightUnit: state.weightUnit,
      theme: state.theme,
      meals: state.meals,
      mealOrder: state.mealOrder,
      customExercises: state.customExercises,
      weightLog: state.weightLog,
      exportedAt: new Date().toISOString(),
      version: "movra-v1",
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `movra-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.version?.startsWith("movra")) {
          setImportStatus("error");
          return;
        }
        // Merge data into store
        useFitnessStore.setState({
          templates: data.templates ?? store.templates,
          templateOrder: data.templateOrder ?? store.templateOrder,
          weekPlan: data.weekPlan ?? store.weekPlan,
          logs: data.logs ?? store.logs,
          goals: data.goals ?? store.goals,
          profile: data.profile ?? store.profile,
          weightUnit: data.weightUnit ?? store.weightUnit,
          theme: data.theme ?? store.theme,
          meals: data.meals ?? store.meals,
          mealOrder: data.mealOrder ?? store.mealOrder,
          customExercises: data.customExercises ?? store.customExercises,
          weightLog: data.weightLog ?? store.weightLog,
          onboarded: true,
        });
        setImportStatus("success");
        setTimeout(() => setImportStatus("idle"), 3000);
      } catch {
        setImportStatus("error");
        setTimeout(() => setImportStatus("idle"), 3000);
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  // localStorage size
  const storageSize = useMemo(() => {
    try {
      const data = localStorage.getItem("fitness-tracker-storage");
      if (!data) return 0;
      return new Blob([data]).size;
    } catch {
      return 0;
    }
  }, [importStatus]); // re-calc after import
  const storageMB = (storageSize / (1024 * 1024)).toFixed(2);
  const storagePct = Math.min(100, (storageSize / (5 * 1024 * 1024)) * 100);

  return (
    <section>
      <h2 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Data
      </h2>
      <div className="flex flex-col gap-2">
        {/* Storage usage */}
        <div className="rounded-xl bg-card p-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-medium text-muted-foreground">Local storage</span>
            <span className="text-[10px] font-bold text-foreground">{storageMB} / 5 MB</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${
                storagePct > 80 ? "bg-amber-500" : storagePct > 95 ? "bg-destructive" : "bg-primary"
              }`}
              style={{ width: `${storagePct}%` }}
            />
          </div>
          {storagePct > 80 && (
            <p className="mt-1.5 text-[10px] text-amber-500">
              Storage is getting full. Consider exporting a backup.
            </p>
          )}
        </div>

        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40"
        >
          <Download className="h-3.5 w-3.5" />
          Export data (JSON)
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40"
        >
          <Upload className="h-3.5 w-3.5" />
          Import data
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
        {importStatus === "success" && (
          <p className="text-center text-[10px] font-semibold text-primary">
            ✓ Data imported successfully!
          </p>
        )}
        {importStatus === "error" && (
          <p className="text-center text-[10px] font-semibold text-destructive">
            ✗ Invalid file. Please use a Movra export file.
          </p>
        )}
      </div>
    </section>
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

function GoalsEditor({ goals, onSave }: { goals: Goals; onSave: (g: Partial<Goals>) => void }) {
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
