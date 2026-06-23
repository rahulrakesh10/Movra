import { useState } from "react";
import { ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import {
  useFitnessStore,
  computeGoalsFromProfile,
  type Profile,
  type Sex,
  type GoalType,
  type ActivityLevel,
  type LiftingGoal,
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

const LIFTING_OPTIONS: { value: LiftingGoal; label: string; desc: string }[] = [
  { value: "strength", label: "Get stronger", desc: "Heavy 5×5 — max strength" },
  { value: "hypertrophy", label: "Build muscle", desc: "4×8–12 — size & shape" },
  { value: "endurance", label: "Muscular endurance", desc: "3×15–20 — lean & toned" },
  { value: "general", label: "General fitness", desc: "3×10 — balanced mix" },
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
  const [liftingGoal, setLiftingGoal] = useState<LiftingGoal>("hypertrophy");

  const totalSteps = 7;

  const profile: Profile = {
    sex,
    age,
    heightCm,
    weightKg,
    goalType,
    activity,
    daysPerWeek,
    liftingGoal,
  };

  const previewGoals = computeGoalsFromProfile(profile);

  const next = () => setStep((s) => Math.min(totalSteps - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const finish = () => {
    setWeightUnit(unit === "imperial" ? "lb" : "kg");
    completeOnboarding(profile);
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      {/* Progress bar */}
      <div className="h-1 w-full bg-muted flex-shrink-0">
        <div
          className="h-full bg-primary transition-all duration-150"
          style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Scrollable Step Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4 flex flex-col gap-4">
        {step > 0 && (
          <button
            onClick={back}
            className="flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        )}

        {step === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center text-center py-4">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Dumbbell className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Welcome to Movra</h1>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Let's set up your plan. Takes 60 seconds.
            </p>

            <div className="mt-8 w-full max-w-xs">
              <p className="mb-3 text-sm font-medium text-foreground">Which unit do you prefer?</p>
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
            <StepHeader
              title="What's your goal?"
              subtitle="We'll tune your calories around this."
            />
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
              title="What are you lifting for?"
              subtitle="We'll pick sets & reps that match."
            />
            <div className="flex flex-col gap-2">
              {LIFTING_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.value}
                  selected={liftingGoal === opt.value}
                  onClick={() => setLiftingGoal(opt.value)}
                  label={opt.label}
                  desc={opt.desc}
                />
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <StepHeader title="Days per week" subtitle="How often will you train?" />
            <div className="rounded-xl bg-card p-5 text-center">
              <p className="text-5xl font-bold text-foreground">{daysPerWeek}</p>
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
              We'll build a {daysPerWeek}-day split tuned to your lifting goal. Edit anytime.
            </p>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <StepHeader title="About you" subtitle="Used to calculate your calorie goal." />
            <div className="grid grid-cols-2 gap-2">
              <ToggleCard selected={sex === "male"} onClick={() => setSex("male")} label="Male" />
              <ToggleCard
                selected={sex === "female"}
                onClick={() => setSex("female")}
                label="Female"
              />
            </div>
            <NumberField
              label="Age"
              value={age}
              onChange={setAge}
              min={13}
              max={100}
              suffix="yrs"
            />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Units</span>
              <div className="flex rounded-lg bg-card p-1">
                <button
                  onClick={() => setUnit("imperial")}
                  className={`rounded-md px-3 py-1 text-xs font-medium ${
                    unit === "imperial"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  lb / ft
                </button>
                <button
                  onClick={() => setUnit("metric")}
                  className={`rounded-md px-3 py-1 text-xs font-medium ${
                    unit === "metric"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
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

        {step === 5 && (
          <div className="flex flex-col gap-4">
            <StepHeader
              title="Activity outside the gym"
              subtitle="Be honest — affects your calories."
            />
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

        {step === 6 && (
          <div className="flex flex-col gap-4">
            <StepHeader title="Your daily targets" subtitle="You can tweak these anytime." />
            <div className="rounded-xl bg-card p-5 text-center">
              <p className="text-4xl font-bold text-foreground">{previewGoals.calories}</p>
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
              We'll set up a{" "}
              <span className="font-semibold text-foreground">{daysPerWeek}-day</span>{" "}
              <span className="font-semibold text-foreground">
                {LIFTING_OPTIONS.find((o) => o.value === liftingGoal)?.label.toLowerCase()}
              </span>{" "}
              plan this week. Edit it anytime under{" "}
              <span className="font-semibold text-foreground">Routine</span>.
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom CTA Button */}
      <div
        className="px-5 pt-2 flex-shrink-0 bg-background border-t border-border/5"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={step === totalSteps - 1 ? finish : next}
          className="flex w-full items-center justify-center gap-1 rounded-xl bg-primary py-3 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {step === 0 ? "Get started" : step === totalSteps - 1 ? "Start tracking" : "Continue"}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
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
      className={`rounded-xl border p-3 text-left transition-all ${
        selected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <p className="text-sm font-semibold text-foreground">{label}</p>
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
