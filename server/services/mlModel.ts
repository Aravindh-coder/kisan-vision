import fs from 'fs'
import path from 'path'

type WeightRecord = {
  bias: number
  coefficients: number[]
}

type ModelFile = {
  classes: string[]
  weights: WeightRecord[]
}

function softmax(logits: number[]) {
  const max = Math.max(...logits)
  const exps = logits.map((v) => Math.exp(v - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((v) => v / sum)
}

function dot(coeffs: number[], features: number[]) {
  return coeffs.reduce((sum, c, i) => sum + c * (features[i] || 0), 0)
}

function loadModel(filename: string): ModelFile | null {
  try {
    const filePath = path.resolve(__dirname, '../ml', filename)
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as ModelFile
  } catch {
    return null
  }
}

export function predictModel(filename: string, features: number[]) {
  const model = loadModel(filename)
  if (!model || !model.weights.length) {
    return null
  }

  const logits = model.weights.map((w) => w.bias + dot(w.coefficients, features))
  const probs = softmax(logits)
  const sorted = probs
    .map((score, idx) => ({ className: model.classes[idx], score }))
    .sort((a, b) => b.score - a.score)

  return {
    predicted: sorted[0].className,
    confidence: sorted[0].score,
    candidates: sorted.slice(0, 3).map((item) => item.className),
    all: sorted
  }
}

export function buildCropFeatures(timeSeries: any[], currentNdvi: number, season: string) {
  const values = timeSeries
    .slice(-5)
    .map((p: any) => (typeof p.ndvi === 'number' ? p.ndvi : null))
    .filter((v: number | null) => v !== null) as number[]
  const series = values.length ? values : [currentNdvi, currentNdvi, currentNdvi, currentNdvi, currentNdvi]
  while (series.length < 5) series.unshift(series[0])

  const avg = series.reduce((sum, v) => sum + v, 0) / series.length
  const peak = Math.max(...series)
  const minVal = Math.min(...series)
  const trend = series[4] - series[3]
  const ndviRange = peak - minVal
  const ndwi = Math.min(0.6, Math.max(-0.3, 0.18 + (currentNdvi - 0.25) * 0.55))
  const evi = Math.min(0.95, Math.max(0.05, currentNdvi * 0.82 + 0.06))
  const savi = Math.min(0.95, Math.max(0.05, currentNdvi * 1.08 + 0.03))
  const backscatter = Math.min(-6, Math.max(-16, -10 + (0.5 - ndwi) * 5))
  const seasonFlags = [season === 'Kharif' ? 1 : 0, season === 'Rabi' ? 1 : 0, season === 'Zaid' ? 1 : 0]

  return [avg, peak, trend, ndviRange, currentNdvi, ndwi, evi, savi, backscatter, ...seasonFlags]
}

export function buildPhenologyFeatures(timeSeries: any[], currentNdvi: number) {
  const values = timeSeries
    .slice(-5)
    .map((p: any) => (typeof p.ndvi === 'number' ? p.ndvi : null))
    .filter((v: number | null) => v !== null) as number[]
  const series = values.length ? values : [currentNdvi, currentNdvi, currentNdvi, currentNdvi, currentNdvi]
  while (series.length < 5) series.unshift(series[0])

  const current = series[4]
  const trend = series[4] - series[3]
  const peak = Math.max(...series)
  const minVal = Math.min(...series)
  const ndviRange = peak - minVal

  return [current, trend, ndviRange, peak, minVal]
}
