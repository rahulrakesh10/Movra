import { useState } from "react";
import { ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import {
  useFitnessStore,
  computeGoalsFromProfile,
  type Profile,
  type Sex,
  type GoalType,
  type ActivityLevel,
} from "@/store/fitnessStore";

const GOAL_OPTIONS: { value: GoalType; label: string; desc: string }[] = [
  { value: "lose", label: "Lose weight", desc: "Cut fat, stay lean" },
  { value: "maintain", label: "Maintain", desc: "Stay where you are" },
  { value: "gain", label: "Build muscle", desc: "Add size & strength" },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: "sedentary", label: "Sedentary", desc: "Desk job, little movement" },
  { value: "light", label: "Light", desc: "Light walks, 1–2 workouts/wk" },
  { value: "moderate", label: "Moderate", desc: "Active job or 3–5 workouts" },
  { value: "active", label: "Active", desc: "Hard training 6–7 days" },
  { value: "athlete", label: "Athlete", desc: "2-a-days, physical job" },
];

export function Onboarding() {
  const completeOnboarding = useFitnessStore((s) => s.completeOnboarding);
  const setWeightUnit = useFitnessStore((s) => s.setWeightUnit);
  const [step, setStep] = useState(0);
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(25);
  const [unit, setUnit] = useState<"metric" | "imperial">("imperial");
  const [heightCm, setHeightCm] = useState(178);
  const [weightKg, setWeightKg] = useState(75);
  const [goalType, setGoalType] = useState<GoalType>("maintain");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [daysPerWeek, setDaysPerWeek] = useState(4);

  const totalSteps = 6;

  const profile: Profile = {
    sex,
    age,
    heightCm,
    weightKg,
    goalType,
    activity,
    daysPerWeek,
  };

  const previewGoals = computeGoalsFromProfile(profile);

  const next = () => setStep((s) => Math.min(5, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const finish = () => {
    setWeightUnit(unit === "imperial" ? "lb" : "kg");
    completeOnboarding(profile);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress bar */}
      <div className="h-1 w-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {step > 0 && (
          <button
            onClick={back}
            className="flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        )}

        {step === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Dumbbell className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Welcome to Movra</h1>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Let's set up your plan. Takes 60 seconds.
            </p>

            <div className="mt-10 w-full max-w-xs">
              <p className="mb-3 text-sm font-medium text-foreground">
                Which unit do you prefer?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <ToggleCard
                  selected={unit === "metric"}
                  onClick={() => setUnit("metric")}
                  label="Kilograms (kg)"
                />
                <ToggleCard
                  selected={unit === "imperial"}
                  onClick={() => setUnit("imperial")}
                  label="Pounds (lb)"
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                You can change this anytime in Profile.
              </p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <StepHeader title="What's your goal?" subtitle="We'll tune your calories around this." />
            <div className="flex flex-col gap-2">
              {GOAL_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.value}
                  selected={goalType === opt.value}
                  onClick={() => setGoalType(opt.value)}
                  label={opt.label}
                  desc={opt.desc}
                />
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <StepHeader
              title="Days per week"
              subtitle="How often will you train?"
            />
            <div className="rounded-xl bg-card p-6 text-center">
              <p className="text-6xl font-bold text-foreground">{daysPerWeek}</p>
              <p className="mt-1 text-sm text-muted-foreground">days / week</p>
            </div>
            <input
              type="range"
              min={1}
              max={7}
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>7</span>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              We'll auto-assign a split (push/pull/legs + cardio) you can edit later.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <StepHeader title="About you" subtitle="Used to calculate your calorie goal." />
            <div className="grid grid-cols-2 gap-2">
              <ToggleCard selected={sex === "male"} onClick={() => setSex("male")} label="Male" />
              <ToggleCard selected={sex === "female"} onClick={() => setSex("female")} label="Female" />
            </div>
            <NumberField label="Age" value={age} onChange={setAge} min={13} max={100} suffix="yrs" />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Units</span>
              <div className="flex rounded-lg bg-card p-1">
                <button
                  onClick={() => setUnit("imperial")}
                  className={`rounded-md px-3 py-1 text-xs font-medium ${
                    unit === "imperial" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  lb / ft
                </button>
                <button
                  onClick={() => setUnit("metric")}
                  className={`rounded-md px-3 py-1 text-xs font-medium ${
                    unit === "metric" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  kg / cm
                </button>
              </div>
            </div>

            {unit === "metric" ? (
              <>
                <NumberField
                  label="Height"
                  value={heightCm}
                  onChange={setHeightCm}
                  min={120}
                  max={230}
                  suffix="cm"
                />
                <NumberField
                  label="Weight"
                  value={weightKg}
                  onChange={setWeightKg}
                  min={30}
                  max={250}
                  suffix="kg"
                />
              </>
            ) : (
              <>
                <NumberField
                  label="Height"
                  value={Math.round(heightCm / 2.54)}
                  onChange={(v) => setHeightCm(Math.round(v * 2.54))}
                  min={48}
                  max={90}
                  suffix="in"
                />
                <NumberField
                  label="Weight"
                  value={Math.round(weightKg * 2.20462)}
                  onChange={(v) => setWeightKg(Math.round(v / 2.20462))}
                  min={70}
                  max={500}
                  suffix="lb"
                />
              </>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <StepHeader title="Activity outside the gym" subtitle="Be honest — affects your calories." />
            <div className="flex flex-col gap-2">
              {ACTIVITY_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.value}
                  selected={activity === opt.value}
                  onClick={() => setActivity(opt.value)}
                  label={opt.label}
                  desc={opt.desc}
                />
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col gap-4">
            <StepHeader title="Your daily targets" subtitle="You can tweak these anytime." />
            <div className="rounded-xl bg-card p-6 text-center">
              <p className="text-5xl font-bold text-foreground">{previewGoals.calories}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                calories / day
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <MacroCard label="Protein" value={previewGoals.protein} color="text-primary" />
              <MacroCard label="Carbs" value={previewGoals.carbs} color="text-blue-400" />
              <MacroCard label="Fat" value={previewGoals.fat} color="text-amber-400" />
            </div>
            <div className="rounded-xl bg-card p-4 text-sm text-muted-foreground">
              We'll set up a <span className="font-semibold text-foreground">{daysPerWeek}-day</span>{" "}
              split this week. Edit it anytime under{" "}
              <span className="font-semibold text-foreground">Routine</span>.
            </div>
          </div>
        )}

        <div className="mt-auto pt-4">
          <button
            onClick={step === 5 ? finish : next}
            className="flex w-full items-center justify-center gap-1 rounded-xl bg-primary py-3.5 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {step === 0 ? "Get started" : step === 5 ? "Start tracking" : "Continue"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  label,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-all ${
        selected
          ? "border-primary bg-primary/10"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <p className="text-base font-semibold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </button>
  );
}

function ToggleCard({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border py-4 text-sm font-semibold transition-all ${
        selected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-foreground hover:border-primary/40"
      }`}
    >
      {label}
    </button>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  suffix: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-card p-3">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-lg text-foreground"
        >
          −
        </button>
        <div className="min-w-[70px] text-center">
          <span className="text-lg font-bold text-foreground">{value}</span>
          <span className="ml-1 text-xs text-muted-foreground">{suffix}</span>
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-lg text-foreground"
        >
          +
        </button>
      </div>
    </div>
  );
}

function MacroCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-card p-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}g</p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}