import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export const api = axios.create({ baseURL: API_BASE })

export async function fetchData() {
  const { data } = await api.get('/data?limit=1000')
  return data
}

export async function fetchMapData() {
  const { data } = await api.get('/map-data?limit=1000')
  return data
}

export async function fetchMetrics() {
  const { data } = await api.get('/metrics')
  return data
}

export async function triggerTrain() {
  const { data } = await api.post('/train')
  return data
}

export async function uploadDataset(file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  return data
}

export type PredictRow = {
  date: string
  lat: number
  lon: number
  region: string
  sea_temperature: number
  salinity: number
  biodiversity_index: number
  eDNA_detected_species: string[]
  invasive_species_flag: string
}

export async function predict(rows: PredictRow[]) {
  const { data } = await api.post('/predict', { rows })
  return data as {
    fish_stock_predictions: number[]
    biodiversity_risk_predictions: string[]
    recommendations: string[]
  }
}
