import { useEffect, useRef, useState } from 'react'
import { Battery, Database, HelpCircle, LineChart, ShieldAlert, Zap } from 'lucide-react'

/** Smoothly counts a displayed number toward its target — makes value changes readable. */
export function useCountUp(target: number, ms = 700) {
  const [value, setValue] = useState(target)
  const from = useRef(target)
  useEffect(() => {
    const start = performance.now()
    const a = from.current
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(a + (target - a) * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
      else from.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return value
}

export function Num({ value, digits = 0 }: { value: number; digits?: number }) {
  const v = useCountUp(value)
  return <>{v.toFixed(digits)}</>
}

export const RAIL = [
  { key: 'data', label: 'DATA', Icon: Database },
  { key: 'forecast', label: 'FORECAST', Icon: LineChart },
  { key: 'risk', label: 'RISK', Icon: ShieldAlert },
  { key: 'bess', label: 'BESS', Icon: Battery },
  { key: 'grid', label: 'GRID DECISION', Icon: Zap },
] as const

/** Workflow indicator — always visible, highlights the active stage. */
export function PipelineRail({ index }: { index: number }) {
  return (
    <div className="card rail" role="list" aria-label="Sundria pipeline">
      {RAIL.map((s, i) => (
        <div key={s.key} style={{ display: 'contents' }}>
          {i > 0 && <span className={`rail-arrow${index >= i ? ' filled' : ''}`}><i /></span>}
          <div className={`rail-step${index === i ? ' active' : index > i ? ' done' : ''}`} role="listitem">
            <s.Icon /><b>{s.label}</b>
          </div>
        </div>
      ))}
    </div>
  )
}

/** "Why?" disclosure attached to any decision or status. */
export function Why({ title, text, dark = false }: { title: string; text: string; dark?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button className={`why-btn${dark ? ' on-dark' : ''}`} onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <HelpCircle />{open ? 'Hide explanation' : title}
      </button>
      {open && <div className={`why-panel${dark ? ' on-dark' : ''}`}>{text}</div>}
    </div>
  )
}
