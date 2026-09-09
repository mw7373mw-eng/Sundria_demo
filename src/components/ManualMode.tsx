import { useState } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import type { Demand, Inputs, Trend, Uncertainty } from '../demo/engine'
import { DEMAND_MW } from '../demo/engine'

export interface ManualState {
  trend: Trend
  socPct: number
  demand: Demand
  uncertainty: Uncertainty
}

export const DEFAULT_MANUAL: ManualState = { trend: 'falling', socPct: 65, demand: 'normal', uncertainty: 'low' }

/** Deterministic trajectory + weather for a manual configuration. */
export function manualInputs(m: ManualState): Inputs {
  const base = 78
  const shape: Record<Trend, [number, number, number, number]> = {
    falling: [-4, -13, -23, -29],
    stable: [-1, 1, -2, 0],
    rising: [5, 12, 18, 23],
  }
  const wobble: Record<Uncertainty, number> = { low: 0, medium: 1.5, high: 4 }
  const w = wobble[m.uncertainty]
  const signs = [1, -1, 1, -1]
  const forecast = shape[m.trend].map((d, i) => Math.round(base + d + signs[i] * w)) as [number, number, number, number]
  const weather: Record<Trend, Inputs['weather']> = {
    falling: { ghi: 715, dni: 574, dhi: 201, temp: 37, wind: 5.2, poa: 763 },
    stable: { ghi: 812, dni: 690, dhi: 163, temp: 35, wind: 3.8, poa: 861 },
    rising: { ghi: 884, dni: 761, dhi: 149, temp: 34, wind: 3.3, poa: 938 },
  }
  const wx = { ...weather[m.trend] }
  if (m.uncertainty === 'high') { wx.ghi -= 120; wx.dni -= 190; wx.dhi += 78; wx.wind += 3.1 }
  return { pvNow: base, forecast, weather: wx, socPct: m.socPct, demand: m.demand, uncertainty: m.uncertainty }
}

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <label className="control">
      <span>{label}</span>
      <div className="seg">
        {options.map(o => (
          <button key={o.v} type="button" className={value === o.v ? 'active' : ''} onClick={() => onChange(o.v)}>{o.l}</button>
        ))}
      </div>
    </label>
  )
}

export default function ManualMode({ onRun, running }: { onRun: (m: ManualState) => void; running: boolean }) {
  const [m, setM] = useState<ManualState>(DEFAULT_MANUAL)
  const set = <K extends keyof ManualState>(k: K, v: ManualState[K]) => setM(s => ({ ...s, [k]: v }))
  return (
    <section className="card">
      <div className="section-head">
        <div><p className="eyebrow">Try it yourself</p><h2>Set the conditions, then run Sundria</h2></div>
        <button className="why-btn" onClick={() => setM(DEFAULT_MANUAL)}><RotateCcw />Reset</button>
      </div>
      <div className="manual">
        <Seg label="Solar production trend" value={m.trend} onChange={v => set('trend', v)}
          options={[{ v: 'rising', l: 'Increasing' }, { v: 'stable', l: 'Stable' }, { v: 'falling', l: 'Falling' }]} />
        <label className="control">
          <span>Battery state of charge</span>
          <div className="slider-value">{m.socPct}%</div>
          <input type="range" min={10} max={100} step={1} value={m.socPct} onChange={e => set('socPct', Number(e.target.value))} />
        </label>
        <Seg label="Demand" value={m.demand} onChange={v => set('demand', v)}
          options={[{ v: 'low', l: 'Low' }, { v: 'normal', l: 'Normal' }, { v: 'high', l: 'High' }]} />
        <Seg label="Forecast uncertainty" value={m.uncertainty} onChange={v => set('uncertainty', v)}
          options={[{ v: 'low', l: 'Low' }, { v: 'medium', l: 'Medium' }, { v: 'high', l: 'High' }]} />
      </div>
      <div className="run-row">
        <button className="primary" onClick={() => onRun(m)} disabled={running}>
          <Play />{running ? 'Running…' : 'RUN SUNDRIA'}
        </button>
        <span className="muted">Demand profile {DEMAND_MW[m.demand]} MW · the full pipeline replays with your settings.</span>
      </div>
    </section>
  )
}
