import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FlaskConical, Leaf, RefreshCw } from 'lucide-react'
import { PLANT, run, type Inputs } from './demo/engine'
import { SCENARIOS } from './demo/scenarios'
import Architecture from './components/Architecture'
import ForecastChart from './components/ForecastChart'
import ManualMode, { manualInputs, type ManualState } from './components/ManualMode'
import { AnalysisStage, BessStage, FinalStage, HorizonStrip, InputsStage, RiskStage } from './components/Stages'
import { Num, PipelineRail, Why } from './components/ui'

/** stage 0 = idle, 1 inputs, 2 forecast, 3 analysis, 4 bess, 5 grid risk, 6 final */
type Stage = 0 | 1 | 2 | 3 | 4 | 5 | 6
const RAIL_FOR: Record<Stage, number> = { 0: 0, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 4 }

/** Stage timings, ms. Fast enough that the whole run lands inside ~9 seconds. */
const STEP_MS = 1150
const POINT_MS = 300

export default function App() {
  const [mode, setMode] = useState<'scenario' | 'manual'>('scenario')
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id)
  const [manualInput, setManualInput] = useState<Inputs | null>(null)
  const [stage, setStage] = useState<Stage>(0)
  const [visible, setVisible] = useState(1)
  const timers = useRef<number[]>([])

  const scenario = SCENARIOS.find(s => s.id === scenarioId)!
  const inputs = mode === 'manual' && manualInput ? manualInput : scenario.inputs
  const result = useMemo(() => run(inputs), [inputs])

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const at = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)) }

  /** Plays the whole pipeline: stages advance, forecast points draw in one by one. */
  const play = useCallback(() => {
    clear()
    setStage(0)
    setVisible(1)
    at(60, () => setStage(1))
    at(60 + STEP_MS, () => setStage(2))
    for (let i = 1; i <= 4; i++) at(60 + STEP_MS + 260 + i * POINT_MS, () => setVisible(i + 1))
    at(60 + STEP_MS * 2 + 500, () => setStage(3))
    at(60 + STEP_MS * 3 + 500, () => setStage(4))
    at(60 + STEP_MS * 4 + 500, () => setStage(5))
    at(60 + STEP_MS * 5 + 500, () => setStage(6))
  }, [])

  useEffect(() => { play(); return clear }, [inputs, play])

  const running = stage > 0 && stage < 6
  const showEffective = stage >= 4

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><Leaf size={22} /></span>
          <div><strong>Sundria</strong><small>AI Solar Forecasting</small></div>
        </div>
        <span className="sim-badge"><FlaskConical />Interactive prototype — simulated data</span>
      </header>

      <div className="stack">
        <div className="section-head">
          <div>
            <p className="eyebrow">Forecast-driven grid decision support</p>
            <h1 style={{ margin: '6px 0 0', fontSize: 'clamp(26px,3.4vw,40px)', lineHeight: 1.08, color: '#123128', fontWeight: 650 }}>
              From weather input to grid action in four hours of lead time
            </h1>
          </div>
          <div className="mode-switch" role="group" aria-label="Demo mode">
            <button className={mode === 'scenario' ? 'active' : ''} onClick={() => { setMode('scenario'); setManualInput(null) }}>Scenarios</button>
            <button className={mode === 'manual' ? 'active' : ''} onClick={() => { setMode('manual'); setManualInput(i => i ?? manualInputs({ trend: 'falling', socPct: 65, demand: 'normal', uncertainty: 'low' })) }}>Try it yourself</button>
          </div>
        </div>

        {mode === 'scenario' && (
          <div className="scenario-row">
            {SCENARIOS.map(s => (
              <button key={s.id} className={`scenario${s.id === scenarioId ? ' active' : ''}`} onClick={() => setScenarioId(s.id)}>
                <span className="n">SCENARIO {s.n}</span>
                <b>{s.name}</b>
                <span>{s.tagline}</span>
                <em>DECISION · {s.expected.toUpperCase()}</em>
              </button>
            ))}
          </div>
        )}

        {mode === 'manual' && (
          <ManualMode
            running={running}
            onRun={(m: ManualState) => setManualInput(manualInputs(m))}
          />
        )}

        <PipelineRail index={RAIL_FOR[stage]} />

        <div className="hero">
          <article className="card now-card">
            <p className="eyebrow">Current PV output</p>
            <div className="now-value"><Num value={result.inputs.pvNow} />​<span className="now-unit">MW</span></div>
            <p className="now-sub">{PLANT.name} · {PLANT.pvCapacityMw} MW DC · demand profile {result.demandMw} MW</p>
            <div className="now-split">
              <div><small>Battery SOC</small><b><Num value={result.battery.socPct} />%</b></div>
              <div><small>Forecast horizon</small><b>1–4 h</b></div>
              <div><small>Prototype WAPE</small><b>{(PLANT.validatedWape * 100).toFixed(2)}%</b></div>
              <div><small>Uncertainty</small><b style={{ textTransform: 'capitalize' }}>{result.inputs.uncertainty}</b></div>
            </div>
          </article>

          <article className="card chart-card">
            <div className="section-head">
              <div><p className="eyebrow">Step 2 · PV forecast</p><h2>Expected PV production — next 4 hours</h2></div>
              <button className="why-btn" onClick={play} disabled={running}><RefreshCw />Replay</button>
            </div>
            <ForecastChart
              points={result.points}
              visible={stage >= 2 ? visible : 1}
              showBand={stage >= 2}
              showEffective={showEffective}
              demandMw={result.demandMw}
            />
            <div className="legend">
              <span><i className="dot" style={{ background: '#08795b' }} />PV forecast</span>
              <span><i className="dot" style={{ background: 'rgba(8,121,91,.22)' }} />Uncertainty band</span>
              <span><i className="dot" style={{ background: '#8fb832' }} />Effective supply with BESS</span>
              <span><i className="dot" style={{ background: '#c99b3f' }} />Demand {result.demandMw} MW</span>
            </div>
          </article>
        </div>

        {stage >= 2 && <HorizonStrip r={result} visible={stage >= 2 ? visible : 1} />}

        {stage >= 1 && <InputsStage r={result} />}
        {stage >= 3 && <AnalysisStage r={result} />}
        {stage >= 4 && <BessStage r={result} />}
        {stage >= 5 && <RiskStage r={result} after={stage >= 5} />}
        {stage >= 6 && <FinalStage r={result} />}

        <Architecture />

        <section className="card">
          <p className="eyebrow">Model evaluation</p>
          <h2 style={{ margin: '5px 0 8px', fontSize: 18 }}>{(PLANT.validatedWape * 100).toFixed(2)}% WAPE — validated prototype performance</h2>
          <p className="muted" style={{ maxWidth: 760 }}>
            Measured offline across the historical validation set at horizons +1h to +4h. It describes the forecasting model as a whole; it is not an error bar attached to the simulated prediction shown above.
          </p>
          <div style={{ marginTop: 12 }}>
            <Why
              title="Why is this number here?"
              text="Judges usually ask how good the forecast is. WAPE (weighted absolute percentage error) is the aggregate accuracy measured on held-out historical data during model validation. The values on this page are a deterministic simulation built to illustrate the decision pipeline, so no error metric is attached to them individually."
            />
          </div>
        </section>

        <footer className="foot">
          <span>Sundria — interactive prototype. All values on this page are simulated, not live measurements.</span>
          <span>Advisory system · a human operator approves every dispatch.</span>
        </footer>
      </div>
    </div>
  )
}
