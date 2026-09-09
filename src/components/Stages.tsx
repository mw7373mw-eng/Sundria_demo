import {
  AlertTriangle, ArrowRight, BatteryCharging, CheckCircle2, CircleAlert, CloudSun, Database,
  Gauge, MoveDown, MoveRight, MoveUp, Ruler, ShieldCheck, Sun, SunMedium, TrendingUp,
} from 'lucide-react'
import { PLANT, type Result } from '../demo/engine'
import { FEATURE_GROUPS, INPUT_SOURCES } from '../demo/scenarios'
import { Num, Why } from './ui'

const round1 = (n: number) => Number(n.toFixed(1))

const SOURCE_ICONS: Record<string, any> = { pv: TrendingUp, weather: CloudSun, radiation: SunMedium, geometry: Sun, plant: Ruler }

/* ---------------- STEP 1 · INPUTS ---------------- */
export function InputsStage({ r }: { r: Result }) {
  const w = r.inputs.weather
  const tiles = [
    ['GHI', `${w.ghi} W/m²`], ['DNI', `${w.dni} W/m²`], ['DHI', `${w.dhi} W/m²`],
    ['Temperature', `${w.temp} °C`], ['Wind speed', `${w.wind} m/s`], ['Forecast POA', `${w.poa} W/m²`],
  ]
  return (
    <section className="card stack reveal">
      <div className="section-head">
        <div><p className="eyebrow">Step 1 · Input data</p><h2>What Sundria reads before it forecasts</h2></div>
        <span className="pill"><Database size={13} />{PLANT.featureCount} forecasting features</span>
      </div>
      <div className="source-row">
        {INPUT_SOURCES.map(s => {
          const Icon = SOURCE_ICONS[s.key]
          return <article className="source" key={s.key}><Icon /><b>{s.label}</b><span>{s.detail}</span></article>
        })}
      </div>
      <div className="tile-row">
        {tiles.map(([k, v]) => <article className="tile" key={k}><small>{k}</small><strong>{v}</strong></article>)}
      </div>
      <details className="features">
        <summary>Show the {PLANT.featureCount} features by category</summary>
        <div className="feature-grid">
          {FEATURE_GROUPS.map(g => (
            <section key={g.group}>
              <h4>{g.group} · {g.count}</h4>
              {g.features.map(f => <code key={f}>{f}</code>)}
            </section>
          ))}
        </div>
      </details>
      <p className="muted" style={{ margin: 0 }}>
        Weather, radiation and geometry are aligned to the plant’s coordinates and merged with its own generation history — one feature row per forecast origin.
      </p>
    </section>
  )
}

/* ---------------- STEP 2 · FORECAST STRIP ---------------- */
export function HorizonStrip({ r, visible }: { r: Result; visible: number }) {
  return (
    <section className="horizon-strip reveal">
      {r.points.map((p, i) => (
        <div key={p.label} className={i < visible ? '' : 'pending'}>
          <small>{i === 0 ? 'Current' : `+${i} hour${i > 1 ? 's' : ''}`}</small>
          {i < visible
            ? <b><Num value={p.pv} digits={0} /> MW</b>
            : <b className="dim">— MW</b>}
          <i>{i === 0 ? 'measured origin' : `forecast horizon +${i}h`}</i>
        </div>
      ))}
    </section>
  )
}

/* ---------------- STEP 3 · ANALYSIS ---------------- */
export function AnalysisStage({ r }: { r: Result }) {
  const down = r.analysis.deltaMw < 0
  const flat = r.analysis.trend === 'stable'
  const Glyph = flat ? CircleAlert : down ? AlertTriangle : TrendingUp
  return (
    <section className={`card analysis reveal${down || flat ? '' : ' up'}`}>
      <span className="glyph"><Glyph size={24} /></span>
      <div>
        <p className="eyebrow">Step 3 · Forecast analysis</p>
        <h2>{r.analysis.headline}</h2>
        <div className="delta-flow">
          <span>{r.analysis.startMw} MW</span>
          <MoveRight />
          <span>{r.analysis.endMw} MW</span>
          <span className={`delta-chip ${flat ? 'flat' : down ? 'down' : 'up'}`}>
            {down ? <MoveDown size={15} /> : flat ? null : <MoveUp size={15} />}
            {Math.abs(r.analysis.deltaMw)} MW<span>over {r.analysis.horizonHours}h</span>
          </span>
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          Rate of change {r.analysis.ratePerHour} MW/h · demand profile {r.demandMw} MW · forecast uncertainty {r.inputs.uncertainty}
        </p>
      </div>
      <Why
        title="Why is this flagged?"
        text={`Sundria compares each forecast horizon against the plant’s demand profile of ${r.demandMw} MW. The largest deviation across +1h to +4h is ${r.riskBefore.shortfallMw > 0 ? `a ${r.riskBefore.shortfallMw} MW shortfall` : `a ${r.riskBefore.surplusMw} MW surplus`}, which crosses the threshold for an operator-visible event.`}
      />
    </section>
  )
}

/* ---------------- STEP 4 · BESS ---------------- */
export function BessStage({ r }: { r: Result }) {
  const charging = r.decision.powerMw < 0
  const circumference = 2 * Math.PI * 50
  const offset = circumference * (1 - r.battery.socPct / 100)
  // Show the horizon where the battery does the most work.
  const peak = r.points.slice(1).reduce((a, b) => (Math.abs(b.effective - b.pv) > Math.abs(a.effective - a.pv) ? b : a), r.points[1])
  const supportPv = peak.pv
  const support = Math.abs(round1(peak.effective - peak.pv))
  const chipClass = r.decision.action === 'CHARGE' ? 'charge'
    : r.decision.action === 'HOLD_RESERVE' ? 'hold'
      : r.decision.action === 'ESCALATE' ? 'escalate' : ''
  return (
    <section className="bess reveal">
      <article className="card">
        <p className="eyebrow">Step 4 · Battery state</p>
        <h2 style={{ margin: '4px 0 0', fontSize: 18 }}>BESS availability</h2>
        <div className="soc-wrap">
          <div className="soc-ring">
            <svg width="116" height="116" viewBox="0 0 116 116">
              <circle className="track" cx="58" cy="58" r="50" />
              <circle
                className={`fill${charging ? ' charging' : ''}`}
                cx="58" cy="58" r="50"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <b><Num value={r.battery.socPct} />%</b>
          </div>
          <div className="soc-meta">
            <div><small>Stored energy</small><b><Num value={r.battery.storedMwh} digits={1} /> MWh</b></div>
            <div><small>Discharge headroom</small><b><Num value={r.battery.dischargeHeadroomMw} digits={1} /> MW</b></div>
            <div><small>Charge headroom</small><b><Num value={r.battery.chargeHeadroomMw} digits={1} /> MW</b></div>
          </div>
        </div>
        <p className="muted">
          {PLANT.bessPowerMw} MW / {PLANT.bessEnergyMwh} MWh storage · reserve floor {PLANT.socFloorPct}% state of charge.
        </p>
      </article>

      <article className="card decision-card">
        <p className="eyebrow">BESS decision</p>
        <span className={`action-chip ${chipClass}`}><BatteryCharging size={14} />{r.decision.action.replace('_', ' ')}</span>
        <h2>{r.decision.title}</h2>
        <p>{r.decision.reasonShort}</p>
        <div className="balance">
          <div><small>PV at {peak.label}</small><b>{supportPv} MW</b></div>
          <span className="op">{charging ? '−' : '+'}</span>
          <div><small>{charging ? 'Battery absorbs' : 'Battery support'}</small><b className="support">{support} MW</b></div>
          <span className="op">=</span>
          <div><small>Effective supply</small><b>{round1(peak.effective)} MW</b></div>
        </div>
        <div style={{ marginTop: 16 }}>
          <Why dark title={`Why ${r.decision.action === 'CHARGE' ? 'charge' : r.decision.action === 'HOLD_RESERVE' ? 'hold reserve' : 'discharge'}?`} text={r.decision.reasonLong} />
        </div>
      </article>
    </section>
  )
}

/* ---------------- STEP 5 · GRID RISK ---------------- */
export function RiskStage({ r, after }: { r: Result; after: boolean }) {
  const shown = after ? r.riskAfter : r.riskBefore
  return (
    <section className="card risk-card reveal">
      <div className="section-head">
        <div><p className="eyebrow">Step 5 · Grid risk</p><h2>Imbalance exposure before and after the storage response</h2></div>
        <span className="pill"><Gauge size={13} />Driver: {shown.driver}</span>
      </div>
      <div className="risk-flow">
        <div className={`risk-box${after ? ' dimmed' : ''}`}>
          <small>Without Sundria · before intervention</small>
          <span className={`risk-level ${r.riskBefore.level}`}>{r.riskBefore.level} RISK</span>
          <span className="muted">{r.riskBefore.shortfallMw > 0 ? `${r.riskBefore.shortfallMw} MW forecast shortfall` : `${r.riskBefore.surplusMw} MW uncontrolled surplus`}</span>
        </div>
        <div className="risk-arrow"><ArrowRight /><span>BESS RESPONSE</span></div>
        <div className={`risk-box${after ? '' : ' dimmed'}`}>
          <small>With Sundria · after BESS response</small>
          <span className={`risk-level ${after ? r.riskAfter.level : 'MEDIUM'}`}>{after ? r.riskAfter.level : '…'} RISK</span>
          <span className="muted">{after ? (r.riskAfter.shortfallMw > 0 ? `${r.riskAfter.shortfallMw} MW residual gap` : 'Residual imbalance within tolerance') : 'Evaluating dispatch effect'}</span>
        </div>
      </div>
      <div className="risk-meter"><i style={{ left: `${Math.min(96, Math.max(4, (after ? r.riskAfter.score : r.riskBefore.score)))}%` }} /></div>
      <Why
        title="Why does the risk change?"
        text={`Grid risk is scored from the forecast supply–demand gap, the steepness of the ramp and the width of the uncertainty band. Acting on the forecast ${Math.abs(r.decision.powerMw) > 0 ? `moves ${Math.abs(r.decision.powerMw)} MW of storage into the horizon before the gap materialises` : 'keeps the battery ready without dispatching'}, taking the score from ${r.riskBefore.score} to ${r.riskAfter.score}.`}
      />
    </section>
  )
}

/* ---------------- STEP 6 · FINAL DECISION ---------------- */
export function FinalStage({ r }: { r: Result }) {
  const stable = r.gridStatus === 'STABLE'
  return (
    <section className="final reveal">
      <article className="card">
        <p className="eyebrow">Step 6 · Final decision</p>
        <h2 style={{ margin: '5px 0 0', fontSize: 21 }}>Sundria decision</h2>
        <ul className="checks">
          {r.decision.checks.map((c, i) => (
            <li key={c.label} className={c.ok ? '' : 'warn'} style={{ animationDelay: `${i * 90}ms` }}>
              {c.ok ? <CheckCircle2 /> : <AlertTriangle />}{c.label}
            </li>
          ))}
        </ul>
        <p className="muted" style={{ marginTop: 16 }}>
          Advisory output. Sundria recommends; the operator dispatches.
        </p>
      </article>
      <article className={`card grid-status${stable ? '' : ' risk'}`}>
        <span className="halo">{stable ? <ShieldCheck /> : <AlertTriangle />}</span>
        <p className="eyebrow">Grid status</p>
        <strong>{r.gridStatus}</strong>
        <span className="muted">Reserve after action {r.decision.reserveAfterPct}% · risk score {r.riskAfter.score}</span>
      </article>
    </section>
  )
}
