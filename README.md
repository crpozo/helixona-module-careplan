# Helixona · Care Plan

A mobile-first, patient-facing **Plan of Care (POC)** app for
[Helixona Wellness](https://helixona.com) — a functional, integrative and
longevity clinic. Patients see the care plan their provider created, track what
they need to do each week, watch their progress, and earn points, badges and
**gift cards / treatment discounts** along the way.

> Built to pair with **ECW (eClinicalWorks)**. Today, clinic staff enter the
> plan of care and log actual visits **manually** (see the Staff screen); the
> data model is shaped so an ECW sync can replace that entry later.

---

The UI is deliberately **simple and step-by-step** (guided like Duolingo, but
in Helixona's own all-gold identity): white background, one idea per screen,
big friendly buttons. Many patients live with brain fog, so every
patient-facing screen shows as little as possible at once.

## What it does

- **Login** — the entry gate: two tabs (**I'm a patient** / **Clinic staff**)
  and one big sign-in button (demo auth — any password works). The tab decides
  the role: patients land on Today, staff land on their console. Log out from
  the header/sidebar.
- **Today** — a minimal home: a greeting, one ring with "N things left", one
  big **Start today's check-in** button, and three glanceable tiles (streak,
  points, week).
- **Check-in** (`/checkin`) — the heart of the app: a full-screen guided flow
  that shows **one activity at a time** with two big answers — **"I did it!"**
  and **"Not yet"** — a progress bar on top, and a celebration screen at the
  end.
- **My Plan** — the goal in the patient's words, the care **journey**
  (Identification → Stabilization → Lead Actor 1/2/3 → Repair → Graduation) as
  a vertical path with "You are here", and the weekly activity list.
- **This Week** — direct logging: one row per activity with progress dots and
  a big **+** button; rows turn green when done.
- **Progress** — this week's ring, the streak, and a simple week-by-week bar
  list. No charts to decode.
- **Rewards** — points balance & tier, a catalog of redeemable **gift cards
  and treatment discounts**, redemption codes, and the badge wall.
- **Staff Entry** — the manual data-entry workhorse for clinic employees: set
  the stage/pacing/goal, edit activities, and log each week's actual visits.
  Only the **Staff** login can open it.

## Gamification

- **Points** for every completed activity (capped at the ordered frequency),
  plus an on-target weekly bonus and a perfect-week bonus.
- **Tiers** — a gold ladder: Initiate → Bronze → Silver → Gold → Platinum →
  Radiant, driven by lifetime points.
- **Streaks** — consecutive on-target weeks.
- **Badges** — milestones like First Step, On Target, Consistency, Perfect Week,
  Stabilized, and tier badges.
- **Rewards** — redeem points for discounts on the next treatment, free
  sessions/add-ons, and Helixona gift cards. Each redemption produces a code to
  show at the front desk.

## Tech

- **Vite + React 18 + TypeScript**, **React Router**, **Tailwind CSS**,
  **lucide-react**.
- Design system: a **light, guided** look — white canvas, Nunito, chunky
  press-down buttons, 2px-bordered cards — entirely in the Helixona **gold**
  palette (`brand`); done/success states are gold, never green.
- State lives in a small reducer-backed store (`src/store/store.tsx`) and
  **persists to `localStorage`**, so the demo keeps your progress between visits.
- All derived numbers (adherence, points, tiers, streaks, badges) are pure
  functions in `src/lib/gamification.ts`.

## Live demo

Deployed to GitHub Pages: **https://crpozo.github.io/helixona-module-careplan/**
(served from the committed `docs/` folder on `main` — "Deploy from a branch").

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173/helixona-module-careplan/
npm run build      # typecheck (tsc -b) + production build
npm run preview    # serve the production build at the same base path
```

The app is configured for project Pages (`base: /helixona-module-careplan/`)
and uses `HashRouter` so deep links work without server-side rewrites.

The app seeds a demo patient (Maya Alvarez) modeled on the clinic's POC sheets.
Use **Staff Entry → Reset demo data** to start fresh.

## Project structure

```
src/
  components/     shared UI (Card, KpiCard, Pill, ProgressRing/Bar, AppShell, …)
  data/seed.ts    the seeded patient, activities, rewards & badges
  lib/            colors, formatting, plan definitions, icons, gamification
  pages/          Today, Plan, Week, Progress, Rewards, Staff
  store/store.tsx reducer + localStorage + derived view-models
  types.ts        the domain model
```

---

_Internal proof-of-concept. Patient data shown is synthetic._
