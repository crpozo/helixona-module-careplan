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

## What it does

- **Today** — a warm home screen: this week's adherence ring, streak, tier,
  today's at-home to-dos (one-tap to log), next appointments and a reward nudge.
- **My Plan** — the full POC: the care **journey** (Identification → Stabilization
  → Lead Actor 1/2/3 → Repair → Graduation), the **pacing** (Gentle / Standard /
  Aggressive), the goal & focus, and every in-office + at-home activity with its
  ordered frequency.
- **This Week** — the engagement loop: a checklist of every activity with
  ordered-vs-actual and a +/− stepper to log completions, plus a "Total" line
  that mirrors the clinic's POC sheet (e.g. _Total Treatment 8 / 3 / 37.5%_).
- **Progress** — weekly adherence trend, per-activity adherence, points per week
  and the stage journey, all on-brand (Recharts).
- **Rewards** — the gamification hub: points balance & tier, a catalog of
  redeemable **gift cards and treatment discounts**, redemption codes, and an
  achievements/badge wall.
- **Staff Entry** — the manual data-entry workhorse for clinic employees: set
  the stage/pacing/goal, edit activities, and log each week's actual visits.

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
  **Recharts**, **lucide-react**.
- Design system follows **`STYLE.md`** — a luxe **gold / black / white** clinical
  aesthetic (`brand` + `ink` palettes).
- State lives in a small reducer-backed store (`src/store/store.tsx`) and
  **persists to `localStorage`**, so the demo keeps your progress between visits.
- All derived numbers (adherence, points, tiers, streaks, badges) are pure
  functions in `src/lib/gamification.ts`.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck (tsc -b) + production build
npm run preview    # serve the production build
```

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
