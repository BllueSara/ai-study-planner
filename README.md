# AI Study Planner

An interactive dashboard that helps you plan your learning journey in Mathematics, Python, and Data Science. Built with **React + Vite** and **TailwindCSS**, it stores progress locally so nothing gets lost.

## Features

- **Progress summary** showing overall completion and per-track progress.
- **Weekly tracker** that groups lessons by week and supports checking off days.
- **Daily activity pulse** highlighting the last 7 days (Planned vs Done).
- **Custom plan builder**: choose start/end dates, select tracks, reorder priorities, and auto-distribute modules.

> **Local storage note**: On first launch the default plan is saved to `localStorage`. If you edit `studyPlan.js`, click **Restart** in the header to reload the updated plan.

## Requirements

- Node.js 18+
- npm 9+

## Getting Started

```bash
git clone <repo-url>
cd ai-study-planner
npm install
npm run dev
```

- Open the browser on the address printed by Vite (usually `http://localhost:5173`).
- For production build: `npm run build` then `npm run preview`.

## How it works

1. The default plan lives in `src/data/studyPlan.js`.
2. On the first load it’s copied to `localStorage` and used every time after.
3. Any action in the UI (checking a task, creating a custom plan) updates `localStorage` immediately.
4. The **Restart** button resets storage to whatever is currently in `studyPlan.js`.

## Create a custom plan

1. Click **Create Custom Plan** in the header.
2. Pick the start and end dates (any length).
3. Toggle tracks on/off and reorder them to set priority.
4. When you save, modules are distributed evenly across the range—multiple modules per day if needed.

## Folder structure

```
ai-study-planner/
├── src/
│   ├── App.jsx                 # UI entry point
│   ├── components/             # ProgressSummary, StudyTracker, DailyActivity
│   ├── data/studyPlan.js       # Default plan + quotes
│   └── styles/global.css       # Tailwind overrides and background styles
├── public/
├── index.html                  # قالب Vite الأساسي
└── README.md
```

## Tech stack

- React 18 + Vite
- TailwindCSS 3
- LocalStorage for persistence

## Future ideas

- Cloud sync for individual accounts
- Artwork or branding per track
- Notifications reminding you of daily tasks

Enjoy planning your learning journey—and if it helps, don’t forget to share feedback and ideas ❤️
