import type { Inputs } from './engine'

export interface Scenario {
  id: string
  n: number
  name: string
  tagline: string
  expected: string
  inputs: Inputs
}

/** Three fixed, deterministic demo cases. Numbers are simulated, not measured. */
export const SCENARIOS: Scenario[] = [
  {
    id: 'ramp-down',
    n: 1,
    name: 'Cloud Ramp-Down',
    tagline: 'PV production is expected to fall rapidly.',
    expected: 'Discharge BESS',
    inputs: {
      pvNow: 82,
      forecast: [79, 68, 55, 52],
      weather: { ghi: 742, dni: 611, dhi: 188, temp: 38, wind: 4.6, poa: 795 },
      socPct: 76,
      demand: 'normal',
      uncertainty: 'low',
    },
  },
  {
    id: 'surplus',
    n: 2,
    name: 'Solar Surplus',
    tagline: 'PV production becomes higher than required.',
    expected: 'Charge BESS',
    inputs: {
      pvNow: 58,
      forecast: [67, 76, 84, 89],
      weather: { ghi: 905, dni: 788, dhi: 141, temp: 34, wind: 3.1, poa: 962 },
      socPct: 30,
      demand: 'low',
      uncertainty: 'low',
    },
  },
  {
    id: 'uncertainty',
    n: 3,
    name: 'High Forecast Uncertainty',
    tagline: 'Forecast uncertainty becomes high.',
    expected: 'Maintain reserve headroom',
    inputs: {
      pvNow: 71,
      forecast: [66, 73, 62, 68],
      weather: { ghi: 604, dni: 402, dhi: 264, temp: 36, wind: 7.9, poa: 641 },
      socPct: 54,
      demand: 'normal',
      uncertainty: 'high',
    },
  },
]

/** The 23 forecasting features, grouped the way Sundria groups them. */
export const FEATURE_GROUPS: { group: string; count: number; features: string[] }[] = [
  { group: 'PV History', count: 5, features: ['pv_lag_1h', 'pv_lag_2h', 'pv_lag_24h', 'pv_rolling_mean_3h', 'pv_rolling_std_3h'] },
  { group: 'Weather', count: 5, features: ['temp_air_2m', 'wind_speed_10m', 'relative_humidity', 'cloud_cover_total', 'pressure_msl'] },
  { group: 'Radiation', count: 5, features: ['ghi', 'dni', 'dhi', 'poa_global', 'clear_sky_index'] },
  { group: 'Solar / Time', count: 5, features: ['solar_zenith', 'solar_azimuth', 'hour_sin', 'hour_cos', 'day_of_year'] },
  { group: 'Plant Metadata', count: 3, features: ['tilt', 'azimuth', 'dc_capacity'] },
]

export const INPUT_SOURCES = [
  { key: 'pv', label: 'PV History', detail: 'Plant generation lags & rolling statistics' },
  { key: 'weather', label: 'Weather Forecast', detail: 'NWP fields at plant coordinates' },
  { key: 'radiation', label: 'Solar Irradiance', detail: 'GHI · DNI · DHI · POA' },
  { key: 'geometry', label: 'Solar Geometry', detail: 'Zenith, azimuth, time encodings' },
  { key: 'plant', label: 'Plant Information', detail: 'Tilt, azimuth, DC capacity' },
]
