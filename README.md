# Movra

**Movra** is a premium, PWA-ready fitness, workout routing, and food tracker designed to streamline your daily training and nutrition. With a sleek dark/light user interface, offline persistence, barcode search capabilities, and customizable workout templates, Movra helps you stay consistent and hit your macro goals.

---

## What Movra Does

### 1. Workout Routing & Custom Templates
* **Weekly Planner:** Assign workout templates to days of the week (e.g., Monday = Push, Wednesday = Pull, Friday = Legs).
* **Flexible Custom Templates:** Rename, delete, and reorganize templates as your training split changes.
* **Sets, Reps, and Weight Configurator:** Edit target sets and reps inline. View and update weight recommendations per set.
* **Supersets:** Pair exercises together dynamically to optimize training density.

### 2. Live Daily Tracker
* **Today view:** Displays your scheduled workout template for the day.
* **Set-by-Set Logging:** Check off individual sets with real-time feedback.
* **Exercise Swap:** Swap scheduled exercises on the fly for any other library/custom exercise.
* **Streak Tracker:** Keep your momentum going with streak calculations based on completed workouts.

### 3. Persistent Custom Exercises
* **Inline Creation:** Add new, custom exercises from within search lists or straight from the root picker view.
* **Smart Categorization:** Assign custom exercises to categories (Chest, Back, Shoulders, Arms, Legs, Core, Cardio). Custom exercises persist across reloads and are merged into lists automatically.

### 4. Interactive Food & Macro Tracker
* **Daily Macro Progress:** Log your meals and monitor Calories, Protein, Carbs, and Fats against customized target goals.
* **Open Food Facts Integration:** Search thousands of products instantly.
* **Barcode Scanner:** Use the live camera scanner to identify foods and fetch their official nutritional statistics automatically. Includes visual error handlers for camera access across HTTPS / insecure domains.

---

## Technology Stack

* **Core Framework:** React 19, TypeScript
* **Routing:** `@tanstack/react-router`
* **State Management:** `zustand` (with persistent localStorage storage)
* **Styling:** CSS variables, Tailwind CSS
* **Build System:** Vite
* **API Integrations:** Open Food Facts (for food searches & barcode lookup)

---

## Local Development Setup

To run Movra locally on your computer:

### 1. Prerequisites
Ensure you have [Bun](https://bun.sh/) or [Node.js](https://nodejs.org/) installed.

### 2. Install Dependencies
```bash
bun install
# or
npm install
```

### 3. Run the Development Server
```bash
bun run dev
# or
npm run dev
```
The server runs over **HTTPS** at `https://localhost:8081/` using `@vitejs/plugin-basic-ssl` to ensure secure context permissions for the camera/barcode scanner.

---

## Project Structure

```
├── public/                 # Favicons, logo assets, and webapp manifest
├── src/
│   ├── components/         # Reusable UI widgets (BarcodeScanner, ExercisePicker, Onboarding)
│   ├── hooks/              # Custom React hooks (SSR hydration guards, mobile utilities)
│   ├── integrations/       # Database & API connectors
│   ├── lib/                # Static libraries and data schemas (exercise lists, food API calls)
│   ├── routes/             # TanStack router page declarations (Today, Routine, Food, Profile)
│   ├── store/              # Zustand global state (workout logs, streak, settings, goals)
│   └── styles.css          # Tailwind configurations & theme styles
├── vite.config.ts          # Vite build server config
└── package.json            # Scripts and packages list
```
