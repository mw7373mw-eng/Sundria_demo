import { useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { EXPERIMENTS, SITE, STUDY, type StoredExperiment } from '../demo/experiments'

/* Layout, chart, cards, tables and badges below are the Sundria platform's own
   Forecast page markup (frontend/src/pages/ForecastPage.tsx + components/ProductUI.tsx),
   reused verbatim so this section is visually the same interface. */

const kw = (v: number | null | undefined, d = 1) =>
  typeof v === 'number' && Number.isFinite(v) ? `${v.toFixed(d)} kW` : '—'
const pct = (v: number | null | undefined, d = 2) =>
  typeof v === 'number' && Number.isFinite(v) ? `${(v * 100).toFixed(d)}%` : '—'
const pctRaw = (v: number | null | undefined, d = 2) =>
  typeof v === 'number' && Number.isFinite(v) ? `${v.toFixed(d)}%` : '—'
const stamp = (iso: string) => new Date(iso).toUTCString().replace(' GMT', ' UTC')

function TruthBadge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'good' | 'warning' | 'neutral' | 'dark' }) {
  return <span className={`truth-badge ${tone}`}>{children}</span>
}

export default function TryOurModel() {
  const [id, setId] = useState(EXPERIMENTS[0].id)
  const [revealed, setRevealed] = useState(false)
  const exp = EXPERIMENTS.find(e => e.id === id) as StoredExperiment

  function select(next: string) {
    setId(next)
    setRevealed(false)
  }

  const series = [
    ...exp.history.map(h => ({ label: h.label, actual: h.pv, forecast: null as number | null, history: h.pv })),
    ...exp.points.map(p => ({
      label: p.label,
      forecast: p.forecast,
      actual: revealed || p.horizon === 0 ? p.actual : null,
      history: p.horizon === 0 ? p.actual : null,
    })),
  ]

  return (
    <section className="sundria-forecast product-page" id="try-our-model">
      <div className="section-head">
        <div>
          <p className="eyebrow">Try our model</p>
          <h2>Previously evaluated forecasting experiments</h2>
          <p className="muted" style={{ maxWidth: 720 }}>
            These are previously evaluated forecasting runs from our Sundria forecasting pipeline. Select an
            experiment to see what information was available at forecast time and how Sundria predicted PV
            production over the next four hours.
          </p>
        </div>
        <div className="truth-row">
          <TruthBadge tone="good">RECORDED EXPERIMENT</TruthBadge>
          <TruthBadge tone="good">REAL MEASURED PV</TruthBadge>
          <TruthBadge tone="warning">NOT A LIVE FORECAST</TruthBadge>
        </div>
      </div>

      <article className="card historical-control">
        <label>
          <span>SELECT A PREVIOUS EXPERIMENT</span>
          <select value={id} onChange={e => select(e.target.value)} aria-label="Select a previous experiment">
            {EXPERIMENTS.map(e => (
              <option value={e.id} key={e.id}>
                {e.code} — {e.name} · {new Date(e.originUtc).toISOString().slice(0, 16).replace('T', ' ')} UTC
              </option>
            ))}
          </select>
        </label>
        <button className="primary" onClick={() => setRevealed(r => !r)}>
          {revealed ? 'Hide Actual' : 'Show Actual'}
        </button>
      </article>

      <div className="experiment-chips">
        {EXPERIMENTS.map(e => (
          <button key={e.id} className={`experiment-chip${e.id === id ? ' active' : ''}`} onClick={() => select(e.id)}>
            <small>{e.code}</small>
            <b>{e.name}</b>
          </button>
        ))}
      </div>

      <section className="truth-row">
        <TruthBadge tone="good">STRICT CAUSAL REPLAY</TruthBadge>
        <TruthBadge tone="neutral">Future PV visible during forecast: NO</TruthBadge>
        <TruthBadge tone="neutral">{STUDY.weatherSource}</TruthBadge>
      </section>

      <article className="card">
        <div className="section-head">
          <div>
            <p className="eyebrow">FORECAST ORIGIN</p>
            <h2>{stamp(exp.originUtc)}</h2>
            <p className="muted" style={{ maxWidth: 640 }}>{exp.note}</p>
          </div>
          <TruthBadge tone="dark">{exp.code} · {exp.name.toUpperCase()}</TruthBadge>
        </div>

        <div className="chart tall">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 10, right: 18, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="#e8eeeb" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#7c908a' }} axisLine={{ stroke: '#dde7e2' }} tickLine={false} />
              <YAxis unit=" kW" width={70} tick={{ fontSize: 11, fill: '#7c908a' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #dfe8e4', fontSize: 12 }}
                formatter={(v: any, n: any) => [`${Number(v).toFixed(1)} kW`, n === 'history' ? 'Historical PV' : n === 'forecast' ? 'Forecast PV' : 'Actual PV']}
              />
              <Legend />
              <Line dataKey="history" name="Historical PV" stroke="#173f34" strokeWidth={3} dot={{ r: 3 }} />
              <Line dataKey="forecast" name="Forecast PV" stroke="#08795b" strokeWidth={3} dot={{ r: 4 }} />
              {revealed && <Line dataKey="actual" name="Actual PV" stroke="#c99b3f" strokeWidth={3} dot={{ r: 4 }} />}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="forecast-result-table">
          <div className="table-head">
            <span>Horizon</span><span>Valid time</span><span>Forecast</span><span>Actual</span>
            <span>Absolute error</span><span>Percentage error</span>
          </div>
          {exp.points.filter(p => p.horizon > 0).map(p => (
            <div key={p.horizon}>
              <b>+{p.horizon}h</b>
              <span>{p.validTime ? stamp(p.validTime) : '—'}</span>
              <span>{kw(p.forecast)}</span>
              <span>{revealed ? kw(p.actual) : 'Hidden until reveal'}</span>
              <span>{revealed ? kw(p.absError) : '—'}</span>
              <span>{revealed ? pctRaw(p.pctError) : '—'}</span>
            </div>
          ))}
        </div>
      </article>

      <section className="horizon-strip five">
        <div>
          <small>Current PV</small>
          <b>{exp.points[0].actual.toFixed(0)} kW</b>
        </div>
        {exp.points.filter(p => p.horizon > 0).map(p => (
          <div key={p.horizon}>
            <small>+{p.horizon}h forecast</small>
            <b>{p.forecast.toFixed(0)} kW</b>
          </div>
        ))}
      </section>

      {revealed && (
        <section className="metric-strip four">
          <CaseMetric label="Case WAPE" value={pct(exp.caseMetrics.wape)} />
          <CaseMetric label="Case MAE" value={kw(exp.caseMetrics.mae)} />
          <CaseMetric label="Case RMSE" value={kw(exp.caseMetrics.rmse)} />
          <CaseMetric label="Case bias" value={kw(exp.caseMetrics.bias)} />
        </section>
      )}

      <div className="page-grid">
        <article className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">FORECAST INPUTS AT ORIGIN</p>
              <h2>Weather and radiation</h2>
            </div>
            <TruthBadge tone="warning">REPRESENTATIVE VALUES</TruthBadge>
          </div>
          <section className="metric-strip">
            <Tile label="GHI" value={exp.weather.ghi} unit="W/m²" />
            <Tile label="DNI" value={exp.weather.dni} unit="W/m²" />
            <Tile label="DHI" value={exp.weather.dhi} unit="W/m²" />
            <Tile label="Forecast POA" value={exp.forecastWeather.poa} unit="W/m²" />
            <Tile label="Temperature" value={exp.weather.temp.toFixed(1)} unit="°C" />
          </section>
          <section className="metric-strip four" style={{ marginTop: 12 }}>
            <Tile label="Wind speed" value={exp.weather.wind.toFixed(1)} unit="m/s" />
            <Tile label="Solar zenith" value={exp.weather.zenith.toFixed(1)} unit="degrees" />
            <Tile label="Solar azimuth" value={exp.weather.azimuth.toFixed(1)} unit="degrees" />
            <Tile label="Clearness index" value={exp.weather.clearnessIndex.toFixed(2)} unit="kt" />
          </section>
          <p className="muted" style={{ marginTop: 14 }}>
            Solar geometry is computed from the site's real coordinates and this origin's real timestamp. The
            meteorological fields are representative: the study's weather archive is not bundled with the repository.
          </p>
        </article>

        <article className="card">
          <p className="eyebrow">VALIDATED FORECASTING PERFORMANCE</p>
          <div className="hero-wape-inline">
            <strong>{pct(STUDY.overallWape)}</strong>
            <span>WAPE · {STUDY.horizons} horizon</span>
          </div>
          <section className="horizon-strip four" style={{ marginTop: 16 }}>
            {STUDY.horizonWape.map((w, i) => (
              <div key={i}><small>+{i + 1}h WAPE</small><b>{pct(w)}</b></div>
            ))}
          </section>
          <p className="muted" style={{ marginTop: 14 }}>
            Based on the validated forecasting evaluation across {STUDY.origins} origins and {STUDY.forecasts.toLocaleString()} forecasts —
            not this single example.
          </p>
        </article>
      </div>

      <details className="card technical">
        <summary>Experiment Details</summary>
        <dl className="detail-list">
          <div><dt>Forecast origin time</dt><dd>{stamp(exp.originUtc)}</dd></div>
          <div><dt>Forecast horizon</dt><dd>+1 h to +4 h, hourly</dd></div>
          <div><dt>Model</dt><dd>{STUDY.model} — {STUDY.catboost.iterations} iterations, depth {STUDY.catboost.depth}, lr {STUDY.catboost.learningRate}, seed {STUDY.catboost.seed}</dd></div>
          <div><dt>Number of features</dt><dd>{STUDY.featureCount}</dd></div>
          <div><dt>Experiment</dt><dd>{STUDY.experimentId} · origin index {exp.originIndex} of {STUDY.origins}</dd></div>
          <div><dt>Weather source</dt><dd>{STUDY.weatherSource} · issue semantics {STUDY.issueSemantics}</dd></div>
          <div><dt>Historical PV inputs</dt><dd>{exp.history.map(h => `${h.label} ${h.pv.toFixed(1)} kW`).join(' · ')} · T0 {exp.points[0].actual.toFixed(1)} kW</dd></div>
          <div><dt>Forecast weather inputs (valid +2 h)</dt><dd>GHI {exp.forecastWeather.ghi} · DNI {exp.forecastWeather.dni} · DHI {exp.forecastWeather.dhi} W/m² · {exp.forecastWeather.temp} °C · {exp.forecastWeather.wind} m/s</dd></div>
          <div><dt>Forecast POA</dt><dd>{exp.forecastWeather.poa} W/m² (isotropic transposition, {SITE.tiltDeg}° tilt / {SITE.azimuthDeg}° azimuth)</dd></div>
          <div><dt>Solar geometry</dt><dd>zenith {exp.weather.zenith}° · azimuth {exp.weather.azimuth}° · elevation {exp.weather.elevation}° · clear-sky GHI {exp.weather.clearskyGhi} W/m²</dd></div>
          <div><dt>Site</dt><dd>{SITE.id} — {SITE.name}, {SITE.location} · {SITE.capacityKwDc} kW DC · {SITE.latitude}, {SITE.longitude} · {SITE.timezone}</dd></div>
          <div><dt>Future target visible during forecast</dt><dd>NO</dd></div>
        </dl>
      </details>
    </section>
  )
}

function CaseMetric({ label, value }: { label: string; value: string }) {
  return <article className="metric-tile"><small>{label}</small><strong>{value}</strong><span>Single stored experiment</span></article>
}
function Tile({ label, value, unit }: { label: string; value: string | number; unit: string }) {
  return (
    <article className="metric-tile compact">
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{unit}</span>
    </article>
  )
}
