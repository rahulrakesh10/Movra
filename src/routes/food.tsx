import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  X,
  ScanBarcode,
  Loader2,
  Settings as SettingsIcon,
  Check,
} from "lucide-react";
import {
  useFitnessStore,
  getTodayISO,
  MEAL_LABELS,
  type Goals,
} from "@/store/fitnessStore";
import { useHydrated } from "@/hooks/useHydrated";
import { lookupBarcode, searchFoods, type FoodResult } from "@/lib/foodApi";
import { BarcodeScanner } from "@/components/BarcodeScanner";

export const Route = createFileRoute("/food")({
  head: () => ({
    meta: [
      { title: "Food — Movra" },
      {
        name: "description",
        content:
          "Log meals, scan barcodes, search Open Food Facts, and track your daily macros.",
      },
    ],
  }),
  component: FoodPage,
});

interface CommonFood {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const COMMON_FOODS: CommonFood[] = [
  { name: "Chicken Breast (100g)", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: "Rice - White, cooked (1 cup)", calories: 200, protein: 4, carbs: 45, fat: 0.4 },
  { name: "Egg - Large", calories: 70, protein: 6, carbs: 0.6, fat: 5 },
  { name: "Oats - Cooked (1 cup)", calories: 150, protein: 5, carbs: 27, fat: 2.5 },
  { name: "Banana (1 medium)", calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { name: "Greek Yogurt (1 cup)", calories: 100, protein: 10, carbs: 6, fat: 0 },
  { name: "Salmon (100g)", calories: 208, protein: 20, carbs: 0, fat: 13 },
  { name: "Broccoli (1 cup)", calories: 55, protein: 3.7, carbs: 11, fat: 0.6 },
  { name: "Almonds (30g)", calories: 170, protein: 6, carbs: 6, fat: 15 },
  { name: "Protein Shake", calories: 120, protein: 25, carbs: 3, fat: 1 },
  { name: "Sweet Potato (1 medium)", calories: 115, protein: 2, carbs: 27, fat: 0.1 },
  { name: "Avocado (1/2)", calories: 160, protein: 2, carbs: 8.5, fat: 14.7 },
  { name: "Tuna - Canned (100g)", calories: 130, protein: 28, carbs: 0, fat: 1 },
  { name: "Brown Rice - Cooked (1 cup)", calories: 215, protein: 5, carbs: 45, fat: 1.8 },
  { name: "Spinach (2 cups)", calories: 15, protein: 2, carbs: 2, fat: 0.2 },
  { name: "Quinoa - Cooked (1 cup)", calories: 220, protein: 8, carbs: 39, fat: 3.5 },
  { name: "Peanut Butter (2 tbsp)", calories: 190, protein: 7, carbs: 7, fat: 17 },
  { name: "Apple (1 medium)", calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { name: "Whole Wheat Bread (1 slice)", calories: 80, protein: 4, carbs: 13, fat: 1 },
  { name: "Milk - Skim (1 cup)", calories: 85, protein: 8, carbs: 12, fat: 0.2 },
];

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
type MealType = (typeof MEAL_TYPES)[number];

function FoodPage() {
  const hydrated = useHydrated();
  if (!hydrated) {
    return <div className="flex min-h-screen flex-col gap-4 p-4" />;
  }
  return <FoodContent />;
}

function FoodContent() {
  const todayISO = getTodayISO();
  const store = useFitnessStore();
  const todayLog = store.getTodayLog();
  const goals = store.goals;

  const totalCalories = Math.round(
    todayLog.food.reduce((s, f) => s + f.calories, 0)
  );
  const totalProtein = Math.round(
    todayLog.food.reduce((s, f) => s + f.protein, 0)
  );
  const totalCarbs = Math.round(
    todayLog.food.reduce((s, f) => s + f.carbs, 0)
  );
  const totalFat = Math.round(todayLog.food.reduce((s, f) => s + f.fat, 0));

  const [showAdd, setShowAdd] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealType>("breakfast");

  const foodByMeal = MEAL_TYPES.map((meal) => ({
    meal,
    items: todayLog.food.filter((f) => f.mealType === meal),
  }));

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Food Log</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={() => setShowGoals(true)}
          className="rounded-full bg-card p-2 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Edit goals"
        >
          <SettingsIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Goals Summary */}
      <div className="rounded-xl bg-card p-4">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Calories
            </p>
            <p className="text-3xl font-bold text-foreground">
              {totalCalories}
              <span className="ml-1 text-base font-normal text-muted-foreground">
                / {goals.calories}
              </span>
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            {Math.max(0, goals.calories - totalCalories)} kcal left
          </div>
        </div>
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${Math.min(
                100,
                goals.calories > 0
                  ? (totalCalories / goals.calories) * 100
                  : 0
              )}%`,
            }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MacroProgress
            label="Protein"
            value={totalProtein}
            goal={goals.protein}
            color="bg-primary"
          />
          <MacroProgress
            label="Carbs"
            value={totalCarbs}
            goal={goals.carbs}
            color="bg-blue-500"
          />
          <MacroProgress
            label="Fat"
            value={totalFat}
            goal={goals.fat}
            color="bg-amber-500"
          />
        </div>
      </div>

      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Log Food
        </button>
      ) : (
        <AddFoodPanel
          selectedMeal={selectedMeal}
          onSelectMeal={setSelectedMeal}
          onClose={() => setShowAdd(false)}
          onAdd={(food) => {
            store.addFood(todayISO, { ...food, mealType: selectedMeal });
          }}
        />
      )}

      {/* Today's Food by Meal */}
      <div className="flex flex-col gap-3">
        {foodByMeal.map(({ meal, items }) => {
          if (items.length === 0) return null;
          const mealCals = Math.round(
            items.reduce((s, f) => s + f.calories, 0)
          );
          return (
            <div key={meal}>
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {MEAL_LABELS[meal]}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {mealCals} kcal
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {items.map((food) => (
                  <div
                    key={food.id}
                    className="flex items-center justify-between rounded-lg bg-card px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">
                        {food.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        P:{food.protein}g · C:{food.carbs}g · F:{food.fat}g
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {Math.round(food.calories)}
                      </span>
                      <button
                        onClick={() => store.removeFood(todayISO, food.id)}
                        className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {todayLog.food.length === 0 && !showAdd && (
          <div className="rounded-xl border border-dashed border-border py-8 text-center">
            <p className="text-sm text-muted-foreground">No food logged today</p>
            <p className="text-xs text-muted-foreground/60">
              Tap "Log Food" to get started
            </p>
          </div>
        )}
      </div>

      {showGoals && (
        <GoalsDialog
          goals={goals}
          onSave={(g) => {
            store.setGoals(g);
            setShowGoals(false);
          }}
          onClose={() => setShowGoals(false)}
        />
      )}
    </div>
  );
}

function MacroProgress({
  label,
  value,
  goal,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
}) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  return (
    <div className="rounded-lg bg-surface p-2 text-center">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-sm font-bold text-foreground">
        {value}
        <span className="text-[10px] font-normal text-muted-foreground">
          /{goal}g
        </span>
      </p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

/* -------------------- Add Food panel -------------------- */

function AddFoodPanel({
  selectedMeal,
  onSelectMeal,
  onClose,
  onAdd,
}: {
  selectedMeal: MealType;
  onSelectMeal: (m: MealType) => void;
  onClose: () => void;
  onAdd: (food: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<FoodResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredCommon = COMMON_FOODS.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Debounced live search against Open Food Facts
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (searchQuery.trim().length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const r = await searchFoods(searchQuery);
        setResults(r);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery]);

  async function handleBarcode(code: string) {
    setShowScanner(false);
    setScanError(null);
    setSearching(true);
    try {
      const product = await lookupBarcode(code);
      if (!product) {
        setScanError(`No product found for "${code}". Try again or add manually.`);
      } else {
        onAdd({
          name: product.brand
            ? `${product.brand} — ${product.name}${
                product.servingLabel ? ` (${product.servingLabel})` : ""
              }`
            : `${product.name}${
                product.servingLabel ? ` (${product.servingLabel})` : ""
              }`,
          calories: product.calories,
          protein: product.protein,
          carbs: product.carbs,
          fat: product.fat,
        });
      }
    } catch {
      setScanError("Lookup failed. Check your connection and try again.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <>
      <div className="rounded-xl bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Add Food</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Meal Type Selector */}
        <div className="mb-3 flex gap-1">
          {MEAL_TYPES.map((meal) => (
            <button
              key={meal}
              onClick={() => onSelectMeal(meal)}
              className={`flex-1 rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                selectedMeal === meal
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {MEAL_LABELS[meal]}
            </button>
          ))}
        </div>

        {/* Search + Barcode */}
        <div className="mb-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search foods…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              autoFocus
            />
          </div>
          <button
            onClick={() => {
              setScanError(null);
              setShowScanner(true);
            }}
            className="flex items-center gap-1 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            aria-label="Scan barcode"
          >
            <ScanBarcode className="h-4 w-4" />
            Scan
          </button>
        </div>

        {scanError && (
          <p className="mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {scanError}
          </p>
        )}

        {/* Results */}
        <div className="flex max-h-72 flex-col gap-1 overflow-y-auto no-scrollbar">
          {searching && (
            <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching…
            </div>
          )}

          {/* Common foods (when no query or short query) */}
          {searchQuery.trim().length < 3 &&
            filteredCommon.map((food) => (
              <FoodRow
                key={food.name}
                name={food.name}
                calories={food.calories}
                protein={food.protein}
                carbs={food.carbs}
                fat={food.fat}
                onAdd={() => onAdd(food)}
              />
            ))}

          {/* OFF search results */}
          {searchQuery.trim().length >= 3 &&
            !searching &&
            results.length === 0 && (
              <p className="py-3 text-center text-xs text-muted-foreground">
                No results from Open Food Facts. Try a custom entry below.
              </p>
            )}

          {searchQuery.trim().length >= 3 &&
            results.map((r, i) => (
              <FoodRow
                key={`${r.barcode || r.name}-${i}`}
                name={
                  r.brand
                    ? `${r.brand} — ${r.name}`
                    : r.name
                }
                subtitle={r.servingLabel}
                calories={r.calories}
                protein={r.protein}
                carbs={r.carbs}
                fat={r.fat}
                onAdd={() =>
                  onAdd({
                    name: `${r.brand ? r.brand + " — " : ""}${r.name}${
                      r.servingLabel ? ` (${r.servingLabel})` : ""
                    }`,
                    calories: r.calories,
                    protein: r.protein,
                    carbs: r.carbs,
                    fat: r.fat,
                  })
                }
              />
            ))}
        </div>

        {/* Custom food */}
        {!showCustom ? (
          <button
            onClick={() => setShowCustom(true)}
            className="mt-2 text-xs font-medium text-primary hover:underline"
          >
            + Add custom food
          </button>
        ) : (
          <CustomFoodForm
            onCancel={() => setShowCustom(false)}
            onAdd={(food) => {
              onAdd(food);
              setShowCustom(false);
              setSearchQuery("");
            }}
          />
        )}
      </div>

      {showScanner && (
        <BarcodeScanner
          onDetected={handleBarcode}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}

function FoodRow({
  name,
  subtitle,
  calories,
  protein,
  carbs,
  fat,
  onAdd,
}: {
  name: string;
  subtitle?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  onAdd: () => void;
}) {
  return (
    <button
      onClick={onAdd}
      className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {subtitle ? `${subtitle} · ` : ""}P:{protein}g · C:{carbs}g · F:{fat}g
        </p>
      </div>
      <span className="shrink-0 text-sm font-bold text-primary">
        {calories}
      </span>
    </button>
  );
}

function CustomFoodForm({
  onCancel,
  onAdd,
}: {
  onCancel: () => void;
  onAdd: (food: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
      <p className="text-xs font-bold text-foreground">Custom Food</p>
      <input
        type="text"
        placeholder="Food name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />
      <div className="grid grid-cols-4 gap-2">
        <input
          type="number"
          placeholder="Cal"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          className="rounded-lg border border-border bg-surface px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <input
          type="number"
          placeholder="P"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
          className="rounded-lg border border-border bg-surface px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <input
          type="number"
          placeholder="C"
          value={carbs}
          onChange={(e) => setCarbs(e.target.value)}
          className="rounded-lg border border-border bg-surface px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <input
          type="number"
          placeholder="F"
          value={fat}
          onChange={(e) => setFat(e.target.value)}
          className="rounded-lg border border-border bg-surface px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg bg-muted py-2 text-xs font-medium text-foreground"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (!name.trim()) return;
            onAdd({
              name: name.trim(),
              calories: parseInt(calories) || 0,
              protein: parseFloat(protein) || 0,
              carbs: parseFloat(carbs) || 0,
              fat: parseFloat(fat) || 0,
            });
          }}
          disabled={!name.trim()}
          className="flex-1 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground disabled:opacity-40"
        >
          Add Custom
        </button>
      </div>
    </div>
  );
}

/* -------------------- Goals Dialog -------------------- */

function GoalsDialog({
  goals,
  onSave,
  onClose,
}: {
  goals: Goals;
  onSave: (g: Partial<Goals>) => void;
  onClose: () => void;
}) {
  const [calories, setCalories] = useState(String(goals.calories));
  const [protein, setProtein] = useState(String(goals.protein));
  const [carbs, setCarbs] = useState(String(goals.carbs));
  const [fat, setFat] = useState(String(goals.fat));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Daily Goals</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <GoalInput label="Calories" unit="kcal" value={calories} onChange={setCalories} />
          <GoalInput label="Protein" unit="g" value={protein} onChange={setProtein} />
          <GoalInput label="Carbs" unit="g" value={carbs} onChange={setCarbs} />
          <GoalInput label="Fat" unit="g" value={fat} onChange={setFat} />
        </div>
        <button
          onClick={() =>
            onSave({
              calories: parseInt(calories) || 0,
              protein: parseInt(protein) || 0,
              carbs: parseInt(carbs) || 0,
              fat: parseInt(fat) || 0,
            })
          }
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Check className="h-4 w-4" />
          Save goals
        </button>
      </div>
    </div>
  );
}

function GoalInput({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 rounded border border-border bg-card px-2 py-1 text-right text-sm text-foreground focus:border-primary focus:outline-none"
        />
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </label>
  );
}