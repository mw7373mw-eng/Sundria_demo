# Sundria_demo

Interactive hackathon prototype for **Sundria** — a lightweight, frontend-only walkthrough of the
full decision workflow, built to be handed to a judge who then understands the product in under
two minutes without a presenter.

> **Interactive prototype — simulated data.** No machine-learning model, dataset, backend or
> external API is involved. Every number on the page is a deterministic simulation designed to be
> technically realistic. Nothing here is a live measurement.

This project is completely separate from the main `Sundria` repository and does not read from,
write to, or depend on it.

---

## The workflow it shows

```
INPUT DATA → PV FORECAST → FORECAST ANALYSIS → BESS DECISION → GRID RISK → FINAL GRID ACTION
```

A persistent workflow rail (`DATA → FORECAST → RISK → BESS → GRID DECISION`) highlights the active
stage while the simulation runs. Each stage animates in:

| Step | What appears |
|---|---|
| 1 · Inputs | Five input sources, six live weather cards (GHI/DNI/DHI/temp/wind/POA), a "23 forecasting features" pill with an expandable category breakdown |
| 2 · Forecast | Animated line chart drawing Now → +1h → +2h → +3h → +4h one point at a time, with an uncertainty band and a demand reference line, plus a five-cell horizon strip |
| 3 · Analysis | The detected event (e.g. "Significant PV ramp-down"), start → end MW, the delta and the rate of change |
| 4 · BESS | Animated state-of-charge ring, stored energy, discharge/charge headroom, the decision card and the `PV + battery = effective supply` balance |
| 5 · Grid risk | HIGH/MEDIUM/LOW before intervention, animated transition to the level after the storage response, plus a risk-score meter |
| 6 · Final decision | Checklist of what Sundria concluded and the resulting grid status |

A compact architecture strip (`Weather + PV Data → Forecasting Engine → Risk Analysis → BESS
Decision → Grid Stability`) sits at the bottom of the page, after the *Try Our Model* section.

Every decision and status carries a **"Why?"** button with a short plain-language explanation.

## Scenarios

Three preset cases, switchable without a page reload — the chart, weather, battery, risk and
recommendation all re-animate:

1. **Cloud Ramp-Down** — 82 MW falling to 52 MW over four hours → **discharge the BESS** (HIGH → LOW risk).
2. **Solar Surplus** — 58 MW rising to 89 MW against low demand → **charge the BESS** (HIGH → LOW risk).
3. **High Forecast Uncertainty** — a flat forecast with a wide band → **maintain reserve headroom**, no aggressive dispatch (MEDIUM → MEDIUM, grid *managed* rather than *stable*).

## Try it yourself

The manual mode exposes four controls and a `RUN SUNDRIA` button that replays the whole pipeline:

- **Solar production trend** — Increasing / Stable / Falling
- **Battery state of charge** — 10 % … 100 % slider
- **Demand** — Low (60 MW) / Normal (75 MW) / High (95 MW)
- **Forecast uncertainty** — Low / Medium / High

## Decision rules

All logic lives in `src/demo/engine.ts` and is deterministic — the same inputs always produce the
same recommendation.

Reference plant: 110 MW DC PV, 40 MW / 120 MWh BESS, 20 % state-of-charge reserve floor, 95 % ceiling.

1. **Uncertainty is high** → `HOLD_RESERVE`: dispatch only to 40 % depth and keep the rest of the pack available.
2. **Forecast falling with a shortfall vs demand, and usable energy above the floor** → `DISCHARGE`.
3. **Shortfall larger than the stored energy can sustain across the horizon** → `ESCALATE`: full discharge *and* grid support / demand response.
4. **Forecast rising with a surplus and charging headroom** → `CHARGE`.
5. **Surplus larger than the pack can absorb** → `ESCALATE`: charge to the ceiling, escalate the remainder to curtailment / export scheduling.
6. **Otherwise** → `STANDBY`.

Dispatch is computed hour by hour: the battery covers only the gap that actually exists at each
horizon, capped by the inverter rating, then the whole profile is scaled back if the energy it
would take exceeds what the pack can give or absorb. Grid risk is scored from the supply–demand
gap, the steepness of the ramp and the width of the uncertainty band, and rescored on the
post-dispatch profile.

## Running locally

```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # type-checks with tsc, then builds to dist/
npm run preview
```

## Deploying to Vercel

No environment variables, no secrets, no backend.

**From the dashboard**

1. Push this folder to its own Git repository (GitHub / GitLab / Bitbucket).
2. In Vercel choose **Add New → Project** and import that repository.
3. If `Sundria_demo` is a subfolder of a larger repo, set **Root Directory** to `Sundria_demo`.
4. Framework preset **Vite** is detected automatically; build command `npm run build`, output directory `dist`.
5. **Deploy.**

**From the CLI**

```bash
npm i -g vercel
cd Sundria_demo
vercel          # preview deployment
vercel --prod   # production deployment
```

`vercel.json` already pins the framework, build command, output directory and an SPA rewrite.

## Structure

```
Sundria_demo/
├─ index.html
├─ package.json          # react, react-dom, recharts, lucide-react, vite, typescript
├─ vercel.json
├─ tsconfig.json / tsconfig.app.json
└─ src/
   ├─ main.tsx
   ├─ App.tsx            # stage runner + page composition
   ├─ styles.css         # Sundria design tokens and card system
   ├─ demo/
   │  ├─ engine.ts       # deterministic forecast analysis, dispatch and risk rules
   │  ├─ scenarios.ts    # the three preset cases + the 23-feature catalogue
   │  └─ experiments.ts  # five recorded forecasting experiments (Try Our Model)
   └─ components/
      ├─ ui.tsx          # pipeline rail, count-up numbers, "Why?" disclosure
      ├─ ForecastChart.tsx
      ├─ Stages.tsx      # steps 1, 3, 4, 5, 6
      ├─ ManualMode.tsx
      ├─ TryOurModel.tsx # stored forecasting experiments, Sundria Forecast-page UI
      └─ Architecture.tsx
```

## Design

Colours, typography, card style and spacing are carried over from the Sundria platform frontend so
the demo reads as part of the same product: forest `#12382f`, green `#08795b`, lime `#b7d84b`,
gold `#c99b3f`, page `#f4f7f5`, 16 px cards with a `1px #dfe8e4` border and a soft shadow, Georgia
for large figures, uppercase letter-spaced eyebrow labels. Light theme, responsive from 320 px up.
