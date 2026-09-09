import { BatteryCharging, CloudSun, Cpu, ShieldAlert, Zap } from 'lucide-react'

const NODES = [
  { label: 'Weather + PV Data', Icon: CloudSun },
  { label: 'Forecasting Engine', Icon: Cpu },
  { label: 'Risk Analysis', Icon: ShieldAlert },
  { label: 'BESS Decision', Icon: BatteryCharging },
  { label: 'Grid Stability', Icon: Zap },
]

export default function Architecture() {
  return (
    <section className="card arch" aria-label="Sundria system architecture">
      {NODES.map((n, i) => (
        <div key={n.label} style={{ display: 'contents' }}>
          {i > 0 && <span className="arch-line" />}
          <div className="arch-node"><n.Icon /><b>{n.label}</b></div>
        </div>
      ))}
    </section>
  )
}
