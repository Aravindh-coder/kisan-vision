export type CropTypePrediction = {
  cropType: string
  confidence: number
  method: string
  candidates: string[]
  season: string
  note: string
  features: {
    averageNdvi: number
    currentNdvi: number
    peakNdvi: number
    trend: number
  }
}

import { buildCropFeatures, buildPhenologyFeatures, predictModel } from './mlModel'

export type PhenologyStage = {
  stage: string
  confidence: number
  message: string
}

const CROP_PROFILES: Record<string, number[]> = {
  Rice: [0.15, 0.28, 0.5, 0.68, 0.74],
  Cotton: [0.1, 0.22, 0.45, 0.62, 0.55],
  Soybean: [0.2, 0.38, 0.55, 0.62, 0.5],
  Maize: [0.18, 0.4, 0.63, 0.72, 0.6],
  Sugarcane: [0.25, 0.46, 0.62, 0.7, 0.68],
  Wheat: [0.12, 0.28, 0.52, 0.58, 0.45],
  Mustard: [0.14, 0.3, 0.52, 0.6, 0.42],
  Gram: [0.08, 0.22, 0.45, 0.55, 0.4],
  Barley: [0.13, 0.27, 0.5, 0.57, 0.44],
  Watermelon: [0.16, 0.37, 0.58, 0.64, 0.53],
  Cucumber: [0.18, 0.39, 0.6, 0.66, 0.52],
  Moong: [0.12, 0.28, 0.48, 0.55, 0.42]
}

const SEASON_CROPS: Record<string, string[]> = {
  Kharif: ['Rice', 'Cotton', 'Soybean', 'Maize', 'Sugarcane'],
  Rabi: ['Wheat', 'Mustard', 'Gram', 'Barley'],
  Zaid: ['Watermelon', 'Cucumber', 'Moong']
}

function normalizeSeries(values: number[]): number[] {
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (max === min) return values.map(() => 0)
  return values.map(v => (v - min) / (max - min))
}

function euclideanDistance(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length)
  let sum = 0
  for (let i = 0; i < len; i += 1) {
    const diff = a[i] - b[i]
    sum += diff * diff
  }
  return Math.sqrt(sum)
}

function createSeries(series: any[]): number[] {
  const values = series
    .slice(-5)
    .map((p: any) => (typeof p.ndvi === 'number' ? p.ndvi : null))
    .filter((v: number | null) => v !== null) as number[]
  if (values.length === 0) return [0, 0, 0, 0, 0]
  const filled = [...values]
  while (filled.length < 5) {
    filled.unshift(filled[0])
  }
  return filled
}

export function estimateCropTypeML(timeSeries: any[], currentNdvi: number, season: string): CropTypePrediction {
  const cleaned = createSeries(timeSeries)
  const avgNdvi = cleaned.reduce((sum, v) => sum + v, 0) / cleaned.length
  const peakNdvi = Math.max(...cleaned)
  const trend = cleaned.length >= 2 ? cleaned[cleaned.length - 1] - cleaned[cleaned.length - 2] : 0
  const normalized = normalizeSeries(cleaned)
  const modelFeatures = buildCropFeatures(timeSeries, currentNdvi, season)
  const modelResult = predictModel('cropModel.json', modelFeatures)

  if (currentNdvi < 0.18 || peakNdvi < 0.28 || !modelResult) {
    if (!modelResult) {
      console.warn('Crop ML model not available; falling back to heuristic matcher.')
    }

    if (currentNdvi < 0.18 || peakNdvi < 0.28) {
      return {
        cropType: 'Unknown',
        confidence: 0.12,
        method: 'NDVI-profile heuristic',
        candidates: [],
        season,
        note: 'No strong crop signal detected. Likely fallow, bare soil, or non-cropland.',
        features: { averageNdvi: parseFloat(avgNdvi.toFixed(3)), currentNdvi: parseFloat(currentNdvi.toFixed(3)), peakNdvi: parseFloat(peakNdvi.toFixed(3)), trend: parseFloat(trend.toFixed(3)) }
      }
    }
  }

  if (modelResult) {
    return {
      cropType: modelResult.predicted,
      confidence: parseFloat(modelResult.confidence.toFixed(2)),
      method: 'trained NDVI-season classifier',
      candidates: modelResult.candidates,
      season,
      note: 'Crop type inferred using a trained model on NDVI dynamics and seasonal information.',
      features: { averageNdvi: parseFloat(avgNdvi.toFixed(3)), currentNdvi: parseFloat(currentNdvi.toFixed(3)), peakNdvi: parseFloat(peakNdvi.toFixed(3)), trend: parseFloat(trend.toFixed(3)) }
    }
  }

  const candidates = SEASON_CROPS[season] || Object.keys(CROP_PROFILES)
  let bestCrop = 'Unknown'
  let bestDistance = Infinity
  const scored: { crop: string; distance: number; score: number }[] = []

  for (const crop of candidates) {
    const profile = CROP_PROFILES[crop]
    if (!profile) continue
    const profileNorm = normalizeSeries(profile)
    const dist = euclideanDistance(normalized, profileNorm)
    const score = 1 / (1 + dist)
    scored.push({ crop, distance: dist, score })
    if (dist < bestDistance) {
      bestDistance = dist
      bestCrop = crop
    }
  }

  const confidence = Math.min(0.99, Math.max(0.15, 1 - bestDistance * 0.7))
  const sorted = scored.sort((a,b) => b.score - a.score).slice(0, 3).map(x => x.crop)

  return {
    cropType: bestCrop,
    confidence: parseFloat(confidence.toFixed(2)),
    method: 'seasonal NDVI pattern matching',
    candidates: sorted,
    season,
    note: `Estimated from the last 5 monthly NDVI values and seasonal crop patterns. Use this as a probabilistic crop-type signal for field-level advisory.`,
    features: { averageNdvi: parseFloat(avgNdvi.toFixed(3)), currentNdvi: parseFloat(currentNdvi.toFixed(3)), peakNdvi: parseFloat(peakNdvi.toFixed(3)), trend: parseFloat(trend.toFixed(3)) }
  }
}

export function estimatePhenologyStage(timeSeries: any[], currentNdvi: number, cropType: string): PhenologyStage {
  const cleaned = createSeries(timeSeries)
  const peakNdvi = Math.max(...cleaned)
  const minNdvi = Math.min(...cleaned)
  const trend = cleaned.length >= 2 ? cleaned[cleaned.length - 1] - cleaned[cleaned.length - 2] : 0
  const currentPhase = currentNdvi
  const modelFeatures = buildPhenologyFeatures(timeSeries, currentNdvi)
  const modelResult = predictModel('phenologyModel.json', modelFeatures)

  if (modelResult) {
    return {
      stage: modelResult.predicted,
      confidence: parseFloat(modelResult.confidence.toFixed(2)),
      message: `Predicted phenological stage using a trained NDVI stage classifier. Recent trend: ${trend.toFixed(3)}. ${cropType !== 'Unknown' ? `Crop signal: ${cropType}.` : ''}`
    }
  }

  const stage = (() => {
    if (trend > 0.05 && currentPhase < 0.35) return 'Early vegetative stage'
    if (trend > 0.03 && currentPhase >= 0.35 && currentPhase < 0.55) return 'Mid vegetative / branching stage'
    if (trend >= -0.02 && currentPhase >= 0.55 && currentPhase < 0.72) return 'Flowering / grain fill stage'
    if (trend < -0.02 && currentPhase >= 0.5) return 'Maturation / harvest preparation'
    if (currentPhase < 0.25) return 'Establishment / sowing stage'
    return 'Steady growth stage'
  })()

  const confidence = Math.min(0.98, Math.max(0.25, 0.35 + Math.abs(trend) * 0.45 + (peakNdvi - minNdvi) * 0.15))
  const message = `The field is currently in ${stage}, based on the recent NDVI trend (${trend.toFixed(3)}) and current vegetation density (${currentPhase.toFixed(3)}).` +
    (cropType !== 'Unknown' ? ` Crop-type signal: ${cropType}.` : '')

  return {
    stage,
    confidence: parseFloat(confidence.toFixed(2)),
    message
  }
}
