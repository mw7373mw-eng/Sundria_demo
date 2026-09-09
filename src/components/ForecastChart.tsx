import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { HorizonPoint } from '../demo/engine'

interface Props {
  points: HorizonPoint[]
  /** how many horizon points are revealed so far (progressive draw) */
  visible: number
  showBand: boolean
  showEffective: boolean
  demandMw: number
}

export default function ForecastChart({ points, visible, showBand, showEffective, demandMw }: Props) {
  const data = points.slice(0, Math.max(1, visible)).map(p => ({
    ...p,
    band: showBand ? [p.lower, p.upper] : undefined,
    effective: showEffective ? p.effective : undefined,
  }))
  const all = points.flatMap(p => [p.lower, p.upper, p.effective, demandMw])
  const min = Math.floor((Math.min(...all) - 8) / 5) * 5
  const max = Math.ceil((Math.max(...all) + 8) / 5) * 5

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 14, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="#e8eeeb" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#dde7e2' }} tick={{ fontSize: 11, fill: '#7c908a' }} />
          <YAxis
            domain={[min, max]}
            unit=" MW"
            tickLine={false}
            axisLine={false}
            width={62}
            tick={{ fontSize: 11, fill: '#7c908a' }}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #dfe8e4', fontSize: 12, boxShadow: '0 10px 26px rgba(30,72,59,.10)' }}
            formatter={(v: any, n: any) => {
              if (n === 'band') return [`${(v as number[])[0]} – ${(v as number[])[1]} MW`, 'Uncertainty band']
              return [`${v} MW`, n === 'pv' ? 'PV forecast' : n === 'effective' ? 'Effective supply' : 'Demand']
            }}
          />
          <ReferenceLine
            y={demandMw}
            stroke="#c99b3f"
            strokeDasharray="5 5"
            strokeWidth={1.6}
            label={{ value: `DEMAND ${demandMw} MW`, position: 'insideTopRight', fill: '#a8842f', fontSize: 9, fontWeight: 800, letterSpacing: 0.6, dy: -4 }}
          />
          {showBand && <Area dataKey="band" stroke="none" fill="#08795b" fillOpacity={0.1} isAnimationActive animationDuration={520} />}
          <Line
            dataKey="pv"
            stroke="#08795b"
            strokeWidth={3}
            dot={{ r: 4, fill: '#fff', stroke: '#08795b', strokeWidth: 2.5 }}
            activeDot={{ r: 6 }}
            isAnimationActive
            animationDuration={420}
          />
          {showEffective && (
            <Line
              dataKey="effective"
              stroke="#8fb832"
              strokeWidth={3}
              strokeDasharray="6 4"
              dot={{ r: 3.5, fill: '#fff', stroke: '#8fb832', strokeWidth: 2.5 }}
              isAnimationActive
              animationDuration={700}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
