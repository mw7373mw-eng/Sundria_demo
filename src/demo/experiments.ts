/**
 * Stored forecasting experiments for the "Try Our Model" section.
 *
 * PV values are RECORDED OUTPUT from the Sundria forecast feature study
 * (Sundria/renewable-grid-agent/experiments/forecast_feature_study_v2), experiment
 * ECMWF_WEATHER_PLUS_RADIATION — the validated best experiment at 19.03% WAPE.
 * `forecast` is the CatBoost prediction the study recorded for that origin and
 * `actual` is the measured PVDAQ 2107 output at the matching valid time, both in kW.
 * Origin timestamps come from the study's own provenance audit; per-case errors are
 * computed from those recorded pairs.
 *
 * Solar geometry (zenith, azimuth, elevation) is computed from the site's real
 * coordinates and the real origin timestamp with the NOAA algorithm.
 *
 * The meteorological fields (GHI, DNI, DHI, POA, temperature, wind) are
 * REPRESENTATIVE, not recorded: the study's weather archive is not bundled with the
 * repository, so they are reconstructed from the recorded output and a clear-sky
 * model. Every screen that shows them labels them as representative.
 *
 * No model runs in the browser. Nothing here is a live forecast.
 */

export const SITE = {
  id: 'PVDAQ_2107',
  name: 'Farm Solar Array',
  location: 'Arbuckle, California',
  latitude: 38.996306,
  longitude: -122.134111,
  elevationM: 10,
  capacityKwDc: 893,
  tiltDeg: 25,
  azimuthDeg: 180,
  timezone: 'PST8PDT (UTC−7 at these origins)',
}

/** Real study-level results for ECMWF_WEATHER_PLUS_RADIATION. */
export const STUDY = {
  experimentId: 'ECMWF_WEATHER_PLUS_RADIATION',
  model: 'CatBoost',
  featureCount: 23,
  horizons: '1–4 hours',
  weatherSource: 'ECMWF via Open-Meteo Previous Runs API · fixed 24 h lead',
  issueSemantics: 'valid_time − 24 h',
  origins: 864,
  forecasts: 3456,
  overallWape: 0.1903445,
  mae: 0.02819062,
  rmse: 0.06396229,
  bias: -0.00828918,
  horizonWape: [0.16119216, 0.19345992, 0.20271513, 0.20401083],
  catboost: { iterations: 350, depth: 6, learningRate: 0.05, loss: 'RMSE', seed: 42 },
}

export interface ExperimentPoint {
  label: string
  horizon: number
  forecast: number
  actual: number
  validTime?: string
  absError?: number
  pctError?: number | null
}

export interface ExperimentWeather {
  ghi: number
  dni: number
  dhi: number
  poa: number
  temp: number
  wind: number
  zenith: number
  azimuth: number
  elevation: number
  clearnessIndex: number
  clearskyGhi: number
}

export interface StoredExperiment {
  id: string
  code: string
  name: string
  note: string
  originUtc: string
  originIndex: number
  history: { label: string; offset: number; pv: number }[]
  points: ExperimentPoint[]
  weather: ExperimentWeather
  forecastWeather: ExperimentWeather
  caseMetrics: { wape: number; mae: number; rmse: number; bias: number }
}

export const EXPERIMENTS: StoredExperiment[] = [
  {
    "id": "clear-sky",
    "code": "Experiment 01",
    "name": "Clear Sky",
    "note": "A settled autumn midday. Irradiance is smooth and the model tracks the plateau almost exactly.",
    "originUtc": "2024-09-28T18:00:00Z",
    "originIndex": 38,
    "history": [
      {
        "label": "-3h",
        "offset": -3,
        "pv": 60.5
      },
      {
        "label": "-2h",
        "offset": -2,
        "pv": 228.2
      },
      {
        "label": "-1h",
        "offset": -1,
        "pv": 379.5
      }
    ],
    "points": [
      {
        "label": "Now",
        "horizon": 0,
        "forecast": 490.6,
        "actual": 490.6
      },
      {
        "label": "+1h",
        "horizon": 1,
        "forecast": 550.7,
        "actual": 551.0,
        "validTime": "2024-09-28T19:00:00Z",
        "absError": 0.3,
        "pctError": 0.05
      },
      {
        "label": "+2h",
        "horizon": 2,
        "forecast": 565.0,
        "actual": 565.0,
        "validTime": "2024-09-28T20:00:00Z",
        "absError": 0.0,
        "pctError": 0.0
      },
      {
        "label": "+3h",
        "horizon": 3,
        "forecast": 544.1,
        "actual": 542.4,
        "validTime": "2024-09-28T21:00:00Z",
        "absError": 1.7,
        "pctError": 0.31
      },
      {
        "label": "+4h",
        "horizon": 4,
        "forecast": 496.0,
        "actual": 487.7,
        "validTime": "2024-09-28T22:00:00Z",
        "absError": 8.3,
        "pctError": 1.7
      }
    ],
    "weather": {
      "ghi": 498,
      "dni": 636,
      "dhi": 85,
      "poa": 639,
      "temp": 27.7,
      "wind": 3.7,
      "zenith": 49.64,
      "azimuth": 139.43,
      "elevation": 40.36,
      "clearnessIndex": 0.766,
      "clearskyGhi": 649
    },
    "forecastWeather": {
      "ghi": 575,
      "dni": 630,
      "dhi": 103,
      "poa": 736,
      "temp": 28.6,
      "wind": 3.4,
      "zenith": 41.45,
      "azimuth": 180.41,
      "elevation": 48.55,
      "clearnessIndex": 0.756,
      "clearskyGhi": 761
    },
    "caseMetrics": {
      "wape": 0.0048,
      "mae": 2.6,
      "rmse": 4.2,
      "bias": 2.4
    }
  },
  {
    "id": "cloud-ramp-down",
    "code": "Experiment 02",
    "name": "Cloud Ramp-Down",
    "note": "Cloud arrives mid-afternoon and generation collapses faster than the 24-hour-lead weather field anticipated.",
    "originUtc": "2024-10-28T19:00:00Z",
    "originIndex": 759,
    "history": [
      {
        "label": "-3h",
        "offset": -3,
        "pv": 231.8
      },
      {
        "label": "-2h",
        "offset": -2,
        "pv": 437.4
      },
      {
        "label": "-1h",
        "offset": -1,
        "pv": 580.0
      }
    ],
    "points": [
      {
        "label": "Now",
        "horizon": 0,
        "forecast": 651.4,
        "actual": 651.4
      },
      {
        "label": "+1h",
        "horizon": 1,
        "forecast": 481.3,
        "actual": 596.2,
        "validTime": "2024-10-28T20:00:00Z",
        "absError": 114.9,
        "pctError": 19.27
      },
      {
        "label": "+2h",
        "horizon": 2,
        "forecast": 414.7,
        "actual": 614.7,
        "validTime": "2024-10-28T21:00:00Z",
        "absError": 200.0,
        "pctError": 32.54
      },
      {
        "label": "+3h",
        "horizon": 3,
        "forecast": 355.2,
        "actual": 302.1,
        "validTime": "2024-10-28T22:00:00Z",
        "absError": 53.1,
        "pctError": 17.58
      },
      {
        "label": "+4h",
        "horizon": 4,
        "forecast": 213.7,
        "actual": 140.0,
        "validTime": "2024-10-28T23:00:00Z",
        "absError": 73.7,
        "pctError": 52.64
      }
    ],
    "weather": {
      "ghi": 580,
      "dni": 821,
      "dhi": 96,
      "poa": 848,
      "temp": 27.3,
      "wind": 4.0,
      "zenith": 53.87,
      "azimuth": 164.22,
      "elevation": 36.13,
      "clearnessIndex": 0.99,
      "clearskyGhi": 586
    },
    "forecastWeather": {
      "ghi": 545,
      "dni": 790,
      "dhi": 90,
      "poa": 800,
      "temp": 27.2,
      "wind": 3.8,
      "zenith": 54.83,
      "azimuth": 200.29,
      "elevation": 35.17,
      "clearnessIndex": 0.955,
      "clearskyGhi": 571
    },
    "caseMetrics": {
      "wape": 0.2672,
      "mae": 110.4,
      "rmse": 123.9,
      "bias": -47.0
    }
  },
  {
    "id": "variable-irradiance",
    "code": "Experiment 03",
    "name": "Variable Irradiance",
    "note": "Broken cloud. Output swings hundreds of kilowatts hour to hour and the model holds a smoothed central path.",
    "originUtc": "2024-10-27T17:00:00Z",
    "originIndex": 733,
    "history": [
      {
        "label": "-3h",
        "offset": -3,
        "pv": 0.0
      },
      {
        "label": "-2h",
        "offset": -2,
        "pv": 17.3
      },
      {
        "label": "-1h",
        "offset": -1,
        "pv": 212.2
      }
    ],
    "points": [
      {
        "label": "Now",
        "horizon": 0,
        "forecast": 378.6,
        "actual": 378.6
      },
      {
        "label": "+1h",
        "horizon": 1,
        "forecast": 411.2,
        "actual": 552.3,
        "validTime": "2024-10-27T18:00:00Z",
        "absError": 141.1,
        "pctError": 25.55
      },
      {
        "label": "+2h",
        "horizon": 2,
        "forecast": 422.2,
        "actual": 659.5,
        "validTime": "2024-10-27T19:00:00Z",
        "absError": 237.3,
        "pctError": 35.98
      },
      {
        "label": "+3h",
        "horizon": 3,
        "forecast": 430.5,
        "actual": 400.8,
        "validTime": "2024-10-27T20:00:00Z",
        "absError": 29.7,
        "pctError": 7.41
      },
      {
        "label": "+4h",
        "horizon": 4,
        "forecast": 430.6,
        "actual": 612.3,
        "validTime": "2024-10-27T21:00:00Z",
        "absError": 181.7,
        "pctError": 29.67
      }
    ],
    "weather": {
      "ghi": 318,
      "dni": 648,
      "dhi": 52,
      "poa": 493,
      "temp": 25.0,
      "wind": 4.0,
      "zenith": 65.79,
      "azimuth": 133.17,
      "elevation": 24.21,
      "clearnessIndex": 0.816,
      "clearskyGhi": 390
    },
    "forecastWeather": {
      "ghi": 590,
      "dni": 829,
      "dhi": 97,
      "poa": 859,
      "temp": 27.4,
      "wind": 4.0,
      "zenith": 53.55,
      "azimuth": 164.11,
      "elevation": 36.45,
      "clearnessIndex": 0.998,
      "clearskyGhi": 591
    },
    "caseMetrics": {
      "wape": 0.2651,
      "mae": 147.4,
      "rmse": 165.9,
      "bias": -132.6
    }
  },
  {
    "id": "morning-ramp-up",
    "code": "Experiment 04",
    "name": "Morning Ramp-Up",
    "note": "Sunrise ramp from zero. The model captures the shape but is conservative on the climb rate.",
    "originUtc": "2024-10-24T15:00:00Z",
    "originIndex": 659,
    "history": [
      {
        "label": "-3h",
        "offset": -3,
        "pv": 0.0
      },
      {
        "label": "-2h",
        "offset": -2,
        "pv": 0.0
      },
      {
        "label": "-1h",
        "offset": -1,
        "pv": 0.0
      }
    ],
    "points": [
      {
        "label": "Now",
        "horizon": 0,
        "forecast": 25.9,
        "actual": 25.9
      },
      {
        "label": "+1h",
        "horizon": 1,
        "forecast": 125.4,
        "actual": 251.8,
        "validTime": "2024-10-24T16:00:00Z",
        "absError": 126.4,
        "pctError": 50.2
      },
      {
        "label": "+2h",
        "horizon": 2,
        "forecast": 304.3,
        "actual": 461.6,
        "validTime": "2024-10-24T17:00:00Z",
        "absError": 157.3,
        "pctError": 34.08
      },
      {
        "label": "+3h",
        "horizon": 3,
        "forecast": 422.8,
        "actual": 599.7,
        "validTime": "2024-10-24T18:00:00Z",
        "absError": 176.9,
        "pctError": 29.5
      },
      {
        "label": "+4h",
        "horizon": 4,
        "forecast": 487.3,
        "actual": 679.4,
        "validTime": "2024-10-24T19:00:00Z",
        "absError": 192.1,
        "pctError": 28.27
      }
    ],
    "weather": {
      "ghi": 13,
      "dni": 5,
      "dhi": 13,
      "poa": 34,
      "temp": 20.5,
      "wind": 3.2,
      "zenith": 84.91,
      "azimuth": 110.01,
      "elevation": 5.09,
      "clearnessIndex": 0.266,
      "clearskyGhi": 50
    },
    "forecastWeather": {
      "ghi": 396,
      "dni": 782,
      "dhi": 65,
      "poa": 601,
      "temp": 25.6,
      "wind": 4.3,
      "zenith": 65.0,
      "azimuth": 132.45,
      "elevation": 25.0,
      "clearnessIndex": 0.981,
      "clearskyGhi": 404
    },
    "caseMetrics": {
      "wape": 0.3276,
      "mae": 163.2,
      "rmse": 165.0,
      "bias": -163.2
    }
  },
  {
    "id": "afternoon-ramp-down",
    "code": "Experiment 05",
    "name": "Afternoon Ramp-Down",
    "note": "The daily sunset ramp, with the forecast running slightly ahead of the observed decline.",
    "originUtc": "2024-10-29T21:00:00Z",
    "originIndex": 785,
    "history": [
      {
        "label": "-3h",
        "offset": -3,
        "pv": 596.8
      },
      {
        "label": "-2h",
        "offset": -2,
        "pv": 681.8
      },
      {
        "label": "-1h",
        "offset": -1,
        "pv": 700.6
      }
    ],
    "points": [
      {
        "label": "Now",
        "horizon": 0,
        "forecast": 677.0,
        "actual": 677.0
      },
      {
        "label": "+1h",
        "horizon": 1,
        "forecast": 526.4,
        "actual": 595.7,
        "validTime": "2024-10-29T22:00:00Z",
        "absError": 69.3,
        "pctError": 11.63
      },
      {
        "label": "+2h",
        "horizon": 2,
        "forecast": 343.4,
        "actual": 466.4,
        "validTime": "2024-10-29T23:00:00Z",
        "absError": 123.0,
        "pctError": 26.37
      },
      {
        "label": "+3h",
        "horizon": 3,
        "forecast": 185.1,
        "actual": 205.6,
        "validTime": "2024-10-30T00:00:00Z",
        "absError": 20.5,
        "pctError": 9.97
      },
      {
        "label": "+4h",
        "horizon": 4,
        "forecast": 44.0,
        "actual": 22.2,
        "validTime": "2024-10-30T01:00:00Z",
        "absError": 21.8,
        "pctError": 98.2
      }
    ],
    "weather": {
      "ghi": 577,
      "dni": 843,
      "dhi": 95,
      "poa": 882,
      "temp": 27.3,
      "wind": 3.9,
      "zenith": 55.15,
      "azimuth": 200.19,
      "elevation": 34.85,
      "clearnessIndex": 1.02,
      "clearskyGhi": 566
    },
    "forecastWeather": {
      "ghi": 347,
      "dni": 795,
      "dhi": 57,
      "poa": 607,
      "temp": 25.4,
      "wind": 4.1,
      "zenith": 68.64,
      "azimuth": 229.64,
      "elevation": 21.36,
      "clearnessIndex": 1.02,
      "clearskyGhi": 340
    },
    "caseMetrics": {
      "wape": 0.1819,
      "mae": 58.7,
      "rmse": 72.2,
      "bias": -47.8
    }
  }
]
