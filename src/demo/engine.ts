/**
 * Sundria demo decision engine.
 *
 * Deterministic, dependency-free reproduction of the Sundria pipeline logic:
 *   INPUTS -> PV FORECAST -> FORECAST ANALYSIS -> BESS DECISION -> GRID RISK -> GRID ACTION
 *
 * No machine-learning model runs here. Forecast values are pre-computed
 * simulated trajectories; the analysis, battery and risk layers are the same
 * rule shapes used by the Sundria decision agent, evaluated in the browser.
 */

export type Trend = 'falling' | 'stable' | 'rising'
export type Demand = 'low' | 'normal' | 'high'
export type Uncertainty = 'low' | 'medium' | 'high'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'
export type Action = 'DISCHARGE' | 'CHARGE' | 'HOLD_RESERVE' | 'ESCALATE' | 'STANDBY'

/** Plant + storage nameplate used across the whole demo. */
export const PLANT = {
  name: 'Sundria Reference Plant',
  pvCapacityMw: 110,
  bessPowerMw: 40,
  bessEnergyMwh: 120,
  socFloorPct: 20,
  socCeilingPct: 95,
  featureCount: 23,
  validatedWape: 0.1903,
}

export const DEMAND_MW: Record<Demand, number> = { low: 60, normal: 75, high: 95 }
const UNCERTAINTY_BAND: Record<Uncertainty, number> = { low: 0.05, medium: 0.11, high: 0.2 }
const UNCERTAINTY_RISK: Record<Uncertainty, number> = { low: 0, medium: 7, high: 16 }

export interface Weather {
  ghi: number
  dni: number
  dhi: number
  temp: number
  wind: number
  poa: number
}

export interface Inputs {
  pvNow: number
  /** +1h .. +4h simulated PV forecast, MW */
  forecast: [number, number, number, number]
  weather: Weather
  socPct: number
  demand: Demand
  uncertainty: Uncertainty
}

export interface HorizonPoint {
  label: string
  hours: number
  pv: number
  lower: number
  upper: number
  /** PV + battery contribution, i.e. what the grid actually sees. */
  effective: number
  demand: number
}

export interface Analysis {
  trend: Trend
  headline: string
  startMw: number
  endMw: number
  deltaMw: number
  ratePerHour: number
  horizonHours: number
}

export interface Battery {
  socPct: number
  storedMwh: number
  usableMwh: number
  dischargeHeadroomMw: number
  chargeHeadroomMw: number
}

export interface Decision {
  action: Action
  title: string
  powerMw: number
  reasonShort: string
  reasonLong: string
  checks: { label: string; ok: boolean }[]
  reserveAfterPct: number
}

export interface Risk {
  level: RiskLevel
  score: number
  driver: string
  shortfallMw: number
  surplusMw: number
}

export interface Result {
  inputs: Inputs
  points: HorizonPoint[]
  analysis: Analysis
  battery: Battery
  decision: Decision
  riskBefore: Risk
  riskAfter: Risk
  gridStatus: 'STABLE' | 'MANAGED' | 'AT RISK'
  demandMw: number
}

const round = (n: number, d = 1) => Number(n.toFixed(d))
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

function describeTrend(deltaMw: number, base: number): Trend {
  const pct = deltaMw / Math.max(base, 1)
  if (pct <= -0.08) return 'falling'
  if (pct >= 0.08) return 'rising'
  return 'stable'
}

function battery(socPct: number): Battery {
  const storedMwh = (socPct / 100) * PLANT.bessEnergyMwh
  const usableMwh = Math.max(0, ((socPct - PLANT.socFloorPct) / 100) * PLANT.bessEnergyMwh)
  const headroomMwh = Math.max(0, ((PLANT.socCeilingPct - socPct) / 100) * PLANT.bessEnergyMwh)
  return {
    socPct: round(socPct, 0),
    storedMwh: round(storedMwh),
    usableMwh: round(usableMwh),
    // Instantaneous power is limited by the inverter rating, and by whatever
    // energy is left above (or below) the state-of-charge limits.
    dischargeHeadroomMw: round(Math.min(PLANT.bessPowerMw, usableMwh)),
    chargeHeadroomMw: round(Math.min(PLANT.bessPowerMw, headroomMwh)),
  }
}

/**
 * Hour-by-hour dispatch: the battery only covers the gap that actually exists
 * at each horizon, then the whole profile is scaled back if the energy it would
 * take exceeds what the pack can give (or absorb).
 */
function dispatch(
  forecast: number[],
  demandMw: number,
  bat: Battery,
  direction: 'discharge' | 'charge',
  depth: number,
): { contributions: number[]; energyMwh: number; capped: boolean } {
  const powerCap = direction === 'discharge' ? bat.dischargeHeadroomMw : bat.chargeHeadroomMw
  const energyCap = (direction === 'discharge' ? bat.usableMwh : ((PLANT.socCeilingPct - bat.socPct) / 100) * PLANT.bessEnergyMwh) * depth
  let raw = forecast.map(pv => {
    const gap = direction === 'discharge' ? demandMw - pv : pv - demandMw
    return clamp(gap, 0, powerCap) * depth
  })
  const needed = raw.reduce((a, b) => a + b, 0)
  const capped = needed > energyCap + 0.01 && needed > 0
  if (capped) {
    const scale = energyCap / needed
    raw = raw.map(v => round(v * scale))
  } else {
    raw = raw.map(v => round(v))
  }
  const energyMwh = round(raw.reduce((a, b) => a + b, 0))
  const sign = direction === 'discharge' ? 1 : -1
  return { contributions: raw.map(v => v * sign), energyMwh, capped }
}

function riskOf(shortfallMw: number, surplusMw: number, rampPct: number, uncertainty: Uncertainty, demandMw: number): Risk {
  const shortfallTerm = (Math.max(0, shortfallMw) / demandMw) * 110
  const surplusTerm = (Math.max(0, surplusMw) / demandMw) * 70
  const rampTerm = Math.max(0, rampPct) * 45
  const score = round(shortfallTerm + surplusTerm + rampTerm + UNCERTAINTY_RISK[uncertainty], 0)
  const level: RiskLevel = score >= 42 ? 'HIGH' : score >= 20 ? 'MEDIUM' : 'LOW'
  const driver =
    shortfallTerm >= surplusTerm && shortfallTerm > 6
      ? 'Forecast supply shortfall against demand'
      : surplusTerm > 6
        ? 'Excess generation / reverse-flow exposure'
        : rampTerm > 6
          ? 'Steep generation ramp'
          : UNCERTAINTY_RISK[uncertainty] > 8
            ? 'Wide forecast uncertainty band'
            : 'Supply and demand balanced'
  return { level, score, driver, shortfallMw: round(Math.max(0, shortfallMw)), surplusMw: round(Math.max(0, surplusMw)) }
}

export function run(inputs: Inputs): Result {
  const demandMw = DEMAND_MW[inputs.demand]
  const band = UNCERTAINTY_BAND[inputs.uncertainty]
  const bat = battery(inputs.socPct)

  const series = [inputs.pvNow, ...inputs.forecast]
  const endMw = series[series.length - 1]
  const deltaMw = round(endMw - inputs.pvNow)
  const trend = describeTrend(deltaMw, inputs.pvNow)

  const worstPv = Math.min(...inputs.forecast)
  const bestPv = Math.max(...inputs.forecast)
  const shortfall = round(demandMw - worstPv)
  const surplus = round(bestPv - demandMw)
  const rampPct = Math.abs(deltaMw) / Math.max(inputs.pvNow, 1)

  const riskBefore = riskOf(shortfall, surplus, rampPct, inputs.uncertainty, demandMw)

  // ---- battery decision rules -------------------------------------------
  let action: Action
  let reasonShort = ''
  let contributions = [0, 0, 0, 0]

  const wantsDischarge = shortfall > 0.5
  const wantsCharge = surplus > 0.5 && trend !== 'falling'

  if (inputs.uncertainty === 'high' && (wantsDischarge || wantsCharge) && bat.dischargeHeadroomMw > 0) {
    // Wide band: act at reduced depth and keep the rest of the pack in reserve.
    const dir = wantsDischarge ? 'discharge' : 'charge'
    const d = dispatch(inputs.forecast, demandMw, bat, dir, 0.4)
    action = 'HOLD_RESERVE'
    contributions = d.contributions
    reasonShort = 'Forecast uncertainty is high — Sundria holds battery headroom instead of dispatching to full depth.'
  } else if (wantsDischarge && bat.dischargeHeadroomMw > 0) {
    const d = dispatch(inputs.forecast, demandMw, bat, 'discharge', 1)
    contributions = d.contributions
    if (d.capped) {
      action = 'ESCALATE'
      reasonShort = 'Stored energy cannot cover the whole forecast shortfall — full discharge plus grid support / demand response.'
    } else {
      action = 'DISCHARGE'
      reasonShort = 'Expected solar generation shortfall detected — the battery holds enough energy to cover it.'
    }
  } else if (wantsCharge && bat.chargeHeadroomMw > 0) {
    const d = dispatch(inputs.forecast, demandMw, bat, 'charge', 1)
    contributions = d.contributions
    if (d.capped) {
      action = 'ESCALATE'
      reasonShort = 'Storage cannot absorb the whole forecast surplus — Sundria charges to the ceiling and escalates the remainder to curtailment / export scheduling.'
    } else {
      action = 'CHARGE'
      reasonShort = 'Generation is forecast to exceed demand — surplus energy is stored instead of curtailed or exported uncontrolled.'
    }
  } else if (wantsDischarge) {
    action = 'ESCALATE'
    reasonShort = 'A shortfall is forecast but the battery is at its reserve floor — Sundria escalates to grid support / demand response.'
  } else {
    action = 'STANDBY'
    reasonShort = 'Forecast generation tracks demand within tolerance across all four horizons — no dispatch required.'
  }

  // Peak power across the horizon is what the operator sees as "the dispatch".
  const powerMw = contributions.reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a), 0)
  // Signed: discharging drains the pack, charging refills it.
  const signedEnergyMwh = round(contributions.reduce((a, b) => a + b, 0))
  const reserveAfterPct = round(clamp(inputs.socPct - (signedEnergyMwh / PLANT.bessEnergyMwh) * 100, 0, 100), 0)

  const points: HorizonPoint[] = series.map((pv, i) => {
    const spread = pv * band * (i === 0 ? 0 : Math.min(1, i / 3))
    return {
      label: i === 0 ? 'Now' : `+${i}h`,
      hours: i,
      pv: round(pv),
      lower: round(pv - spread),
      upper: round(pv + spread),
      effective: round(pv + (i === 0 ? 0 : contributions[i - 1])),
      demand: demandMw,
    }
  })

  const residualShortfall = round(Math.max(0, demandMw - Math.min(...points.slice(1).map(p => p.effective))))
  const residualSurplus = round(Math.max(0, Math.max(...points.slice(1).map(p => p.effective)) - demandMw))
  const riskAfterRaw = riskOf(residualShortfall, residualSurplus, rampPct * (action === 'STANDBY' ? 1 : 0.35), inputs.uncertainty, demandMw)
  const riskAfter: Risk = { ...riskAfterRaw, driver: action === 'STANDBY' ? riskAfterRaw.driver : 'Residual imbalance after storage response' }

  const analysis: Analysis = {
    trend,
    headline:
      trend === 'falling'
        ? 'Significant PV ramp-down'
        : trend === 'rising'
          ? 'Solar surplus building'
          : inputs.uncertainty === 'high'
            ? 'Flat forecast, wide uncertainty band'
            : 'Stable generation profile',
    startMw: round(inputs.pvNow),
    endMw: round(endMw),
    deltaMw,
    ratePerHour: round(deltaMw / 4),
    horizonHours: 4,
  }

  const escalateTitle = powerMw < 0
    ? 'Charge to Ceiling + Escalate to Curtailment'
    : powerMw > 0
      ? 'Full Discharge + Escalate to Grid Support'
      : 'Escalate to Grid Support / Demand Response'
  const title: Record<Action, string> = {
    DISCHARGE: 'Discharge Battery',
    CHARGE: 'Charge Battery',
    HOLD_RESERVE: 'Maintain Reserve Headroom',
    ESCALATE: escalateTitle,
    STANDBY: 'Hold — No Dispatch',
  }

  const decision: Decision = {
    action,
    title: title[action],
    powerMw,
    reasonShort,
    reasonLong: buildExplanation(action, analysis, bat, shortfall, surplus, powerMw, inputs, demandMw),
    reserveAfterPct,
    checks: [
      { label: `Forecast ${trend === 'falling' ? 'ramp-down' : trend === 'rising' ? 'surplus' : 'plateau'} detected`, ok: true },
      { label: 'BESS available and within operating limits', ok: bat.dischargeHeadroomMw > 0 || bat.chargeHeadroomMw > 0 },
      { label: `${title[action]} recommended`, ok: true },
      { label: `Reserve maintained above ${PLANT.socFloorPct}% floor`, ok: reserveAfterPct >= PLANT.socFloorPct },
      { label: action === 'ESCALATE' ? 'Grid support / demand response requested' : 'Grid risk reduced', ok: action !== 'ESCALATE' },
    ],
  }

  const gridStatus: Result['gridStatus'] =
    riskAfter.level === 'LOW' ? 'STABLE' : riskAfter.level === 'MEDIUM' ? 'MANAGED' : 'AT RISK'

  return { inputs, points, analysis, battery: bat, decision, riskBefore, riskAfter, gridStatus, demandMw }
}

function buildExplanation(
  action: Action,
  a: Analysis,
  bat: Battery,
  shortfall: number,
  surplus: number,
  powerMw: number,
  inputs: Inputs,
  demandMw: number,
): string {
  const move = `${a.deltaMw > 0 ? 'increase' : 'decrease'} by ${Math.abs(a.deltaMw)} MW over the next four hours`
  switch (action) {
    case 'DISCHARGE':
      return `PV output is forecast to ${move}, leaving a ${shortfall} MW gap against ${demandMw} MW of demand. The battery holds ${bat.usableMwh} MWh above its reserve floor, so Sundria recommends discharging ${powerMw} MW to close the expected supply shortfall before it reaches the grid.`
    case 'CHARGE':
      return `PV output is forecast to ${move} and exceeds demand by up to ${surplus} MW. Charging headroom is ${bat.chargeHeadroomMw} MW, so Sundria recommends absorbing ${Math.abs(powerMw)} MW into storage rather than curtailing generation or exporting an uncontrolled surplus.`
    case 'HOLD_RESERVE':
      return `Forecast uncertainty is ${inputs.uncertainty}, so the ${Math.abs(a.deltaMw)} MW expected change cannot be trusted to full depth. Sundria limits dispatch to ${Math.abs(powerMw)} MW and holds the remaining ${bat.dischargeHeadroomMw} MW of headroom, keeping the battery able to respond in either direction once the band narrows.`
    case 'ESCALATE':
      if (powerMw < 0) {
        return `The forecast surplus reaches ${surplus} MW, but only ${bat.chargeHeadroomMw} MW of charging headroom and ${round(((95 - bat.socPct) / 100) * PLANT.bessEnergyMwh, 1)} MWh of empty capacity remain. Sundria charges to the ceiling and escalates the remainder to curtailment or export scheduling rather than pushing an uncontrolled surplus onto the grid.`
      }
      return `The forecast shortfall of ${shortfall} MW cannot be sustained from ${bat.usableMwh} MWh of usable storage across the four-hour horizon. Sundria recommends discharging everything available and simultaneously escalating to grid support / demand response so the residual gap is covered by an external resource.`
    default:
      return `Forecast generation tracks the ${demandMw} MW demand profile within tolerance across all four horizons. No dispatch is recommended; the battery stays at ${bat.socPct}% so it is available for the next event.`
  }
}
