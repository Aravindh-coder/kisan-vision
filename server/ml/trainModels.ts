import fs from 'fs'
import path from 'path'

type FeatureVector = number[]
type Weights = { bias: number; coefficients: number[] }

type MultiClassModel = {
  classes: string[]
  weights: Weights[]
}

type DatasetRow = { x: FeatureVector; y: number }

type ValidationMetrics = {
  samples: number
  accuracy: number
  macroF1: number
  top3Accuracy: number
}

const CROP_CLASSES = ['Rice','Cotton','Soybean','Maize','Sugarcane','Wheat','Mustard','Gram','Barley','Watermelon','Cucumber','Moong']
const PHENOLOGY_STAGES = ['Establishment','Early Vegetative','Mid Vegetative','Flowering','Maturation']

function seededRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

function softmax(scores: number[]) {
  const max = Math.max(...scores)
  const exps = scores.map((s) => Math.exp(s - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

function dot(coeffs: number[], features: number[]) {
  return coeffs.reduce((sum, c, idx) => sum + c * features[idx], 0)
}

function trainMultiClassModel(classes: string[], data: DatasetRow[], featureCount: number, iterations = 3000, lr = 0.01): MultiClassModel {
  const weights: Weights[] = classes.map(() => ({
    bias: (Math.random() - 0.5) * 0.1,
    coefficients: Array(featureCount).fill(0).map(() => (Math.random() - 0.5) * 0.1)
  }))

  for (let iter = 0; iter < iterations; iter += 1) {
    const grads = classes.map(() => ({ bias: 0, coefficients: Array(featureCount).fill(0) }))
    let loss = 0
    for (const { x, y } of data) {
      const logits = weights.map((w) => w.bias + dot(w.coefficients, x))
      const probs = softmax(logits)
      loss -= Math.log(Math.max(1e-12, probs[y]))
      for (let k = 0; k < classes.length; k += 1) {
        const error = probs[k] - (k === y ? 1 : 0)
        grads[k].bias += error
        for (let j = 0; j < featureCount; j += 1) {
          grads[k].coefficients[j] += error * x[j]
        }
      }
    }
    const n = data.length
    for (let k = 0; k < classes.length; k += 1) {
      weights[k].bias -= lr * grads[k].bias / n
      for (let j = 0; j < featureCount; j += 1) {
        weights[k].coefficients[j] -= lr * grads[k].coefficients[j] / n
      }
    }
    if (iter % 300 === 0) console.log('iter', iter, 'loss', (loss / n).toFixed(4))
  }

  return { classes, weights }
}

function predict(model: MultiClassModel, x: FeatureVector) {
  const logits = model.weights.map((w) => w.bias + dot(w.coefficients, x))
  const probs = softmax(logits)
  return probs
    .map((score, idx) => ({ className: model.classes[idx], score }))
    .sort((a, b) => b.score - a.score)
}

function evaluateModel(model: MultiClassModel, data: DatasetRow[]): ValidationMetrics {
  let correct = 0
  let top3Correct = 0
  const perClass = new Map<string, { tp: number; fp: number; fn: number }>()

  for (const row of data) {
    const ranked = predict(model, row.x)
    const predicted = ranked[0].className
    const top3 = ranked.slice(0, 3).map((item) => item.className)
    const target = model.classes[row.y]

    if (predicted === target) correct += 1
    if (top3.includes(target)) top3Correct += 1

    for (const label of model.classes) {
      const stats = perClass.get(label) || { tp: 0, fp: 0, fn: 0 }
      if (label === target) {
        if (predicted === target) stats.tp += 1
        else stats.fn += 1
      } else if (predicted === label) {
        stats.fp += 1
      }
      perClass.set(label, stats)
    }
  }

  let macroF1 = 0
  for (const label of model.classes) {
    const stats = perClass.get(label) || { tp: 0, fp: 0, fn: 0 }
    const precision = stats.tp / Math.max(1, stats.tp + stats.fp)
    const recall = stats.tp / Math.max(1, stats.tp + stats.fn)
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall)
    macroF1 += f1
  }
  macroF1 /= model.classes.length

  return {
    samples: data.length,
    accuracy: correct / data.length,
    macroF1,
    top3Accuracy: top3Correct / data.length
  }
}

function splitDataset(rows: DatasetRow[], split = 0.2) {
  const shuffled = [...rows]
  const rng = seededRandom(7)
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor((i + 1) * rng())
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const valSize = Math.max(1, Math.floor(shuffled.length * split))
  return {
    train: shuffled.slice(valSize),
    validation: shuffled.slice(0, valSize)
  }
}

function generateCropSample(crop: string, season: string, rng: () => number): DatasetRow {
  const basePatterns: Record<string, number[]> = {
    Rice: [0.2,0.35,0.55,0.7,0.8],
    Cotton: [0.12,0.25,0.48,0.64,0.6],
    Soybean: [0.18,0.36,0.55,0.62,0.52],
    Maize: [0.16,0.38,0.63,0.75,0.65],
    Sugarcane: [0.24,0.45,0.62,0.72,0.7],
    Wheat: [0.1,0.24,0.47,0.55,0.46],
    Mustard: [0.14,0.31,0.53,0.61,0.5],
    Gram: [0.08,0.21,0.44,0.52,0.42],
    Barley: [0.12,0.26,0.49,0.57,0.46],
    Watermelon: [0.16,0.38,0.58,0.67,0.55],
    Cucumber: [0.18,0.4,0.6,0.68,0.54],
    Moong: [0.11,0.24,0.5,0.58,0.46]
  }
  const base = basePatterns[crop] || [0.1,0.25,0.45,0.6,0.5]
  const noise = () => (rng() - 0.5) * 0.08
  const ndviSeries = base.map((v) => Math.min(0.95, Math.max(0.05, v + noise())))
  const current = ndviSeries[ndviSeries.length - 1]
  const avg = ndviSeries.reduce((a, b) => a + b, 0) / ndviSeries.length
  const peak = Math.max(...ndviSeries)
  const trend = ndviSeries[4] - ndviSeries[3]
  const ndviRange = peak - Math.min(...ndviSeries)
  const ndwi = Math.min(0.6, Math.max(-0.3, 0.15 + (current - 0.25) * 0.5 + noise()))
  const evi = Math.min(0.9, Math.max(0.05, current * 0.85 + 0.05 + noise() * 0.2))
  const savi = Math.min(0.9, Math.max(0.05, current * 1.1 + noise() * 0.1))
  const backscatter = Math.min(-6, Math.max(-16, -10 + (0.5 - ndwi) * 6 + noise() * 2))
  const seasonFlags = [season === 'Kharif' ? 1 : 0, season === 'Rabi' ? 1 : 0, season === 'Zaid' ? 1 : 0]
  return {
    x: [avg, peak, trend, ndviRange, current, ndwi, evi, savi, backscatter, ...seasonFlags],
    y: CROP_CLASSES.indexOf(crop)
  }
}

function generatePhenologySample(stage: string, rng: () => number): DatasetRow {
  const stagePatterns: Record<string, number[]> = {
    Establishment: [0.1,0.02,0.05,0.05],
    'Early Vegetative': [0.3,0.06,0.12,0.2],
    'Mid Vegetative': [0.48,0.04,0.22,0.25],
    Flowering: [0.62,-0.01,0.26,0.28],
    Maturation: [0.55,-0.04,0.18,0.17]
  }
  const base = stagePatterns[stage] || [0.2,0.02,0.05,0.05]
  const noise = () => (rng() - 0.5) * 0.04
  const current = Math.min(0.95, Math.max(0.05, base[0] + noise()))
  const trend = Math.min(0.25, Math.max(-0.1, base[1] + noise() * 0.5))
  const ndviRange = Math.min(0.5, Math.max(0.02, base[2] + noise() * 0.5))
  const peak = Math.min(0.95, Math.max(current, base[3] + current + noise() * 0.1))
  const minValue = Math.min(0.05, current - ndviRange)
  return {
    x: [current, trend, ndviRange, peak, minValue],
    y: PHENOLOGY_STAGES.indexOf(stage)
  }
}

function generateCropDataset(rng: () => number) {
  const rows: DatasetRow[] = []
  for (const season of ['Kharif','Rabi','Zaid']) {
    for (const crop of CROP_CLASSES) {
      for (let i = 0; i < 120; i += 1) {
        rows.push(generateCropSample(crop, season, rng))
      }
    }
  }
  return rows
}

function generatePhenologyDataset(rng: () => number) {
  const rows: DatasetRow[] = []
  for (const stage of PHENOLOGY_STAGES) {
    for (let i = 0; i < 200; i += 1) rows.push(generatePhenologySample(stage, rng))
  }
  return rows
}

function writeJson(fileName: string, payload: unknown) {
  fs.writeFileSync(path.resolve(__dirname, fileName), JSON.stringify(payload, null, 2))
}

function main() {
  const rng = seededRandom(42)
  const cropData = generateCropDataset(rng)
  const phenologyData = generatePhenologyDataset(rng)
  const cropSplit = splitDataset(cropData, 0.2)
  const phenologySplit = splitDataset(phenologyData, 0.2)

  const cropModel = trainMultiClassModel(CROP_CLASSES, cropSplit.train, 10, 1200, 0.035)
  const phenologyModel = trainMultiClassModel(PHENOLOGY_STAGES, phenologySplit.train, 5, 1200, 0.03)

  const cropMetrics = evaluateModel(cropModel, cropSplit.validation)
  const phenologyMetrics = evaluateModel(phenologyModel, phenologySplit.validation)

  writeJson('cropModel.json', cropModel)
  writeJson('phenologyModel.json', phenologyModel)
  writeJson('validationReport.json', {
    generatedAt: new Date().toISOString(),
    validationProtocol: '80/20 held-out split on class-balanced, synthetic NDVI time-series samples for prototype validation; field-labeled validation is the next step',
    models: {
      crop: {
        classes: CROP_CLASSES,
        samples: cropSplit.train.length + cropSplit.validation.length,
        trainSamples: cropSplit.train.length,
        validationSamples: cropSplit.validation.length,
        accuracy: Number(cropMetrics.accuracy.toFixed(4)),
        macroF1: Number(cropMetrics.macroF1.toFixed(4)),
        top3Accuracy: Number(cropMetrics.top3Accuracy.toFixed(4))
      },
      phenology: {
        classes: PHENOLOGY_STAGES,
        samples: phenologySplit.train.length + phenologySplit.validation.length,
        trainSamples: phenologySplit.train.length,
        validationSamples: phenologySplit.validation.length,
        accuracy: Number(phenologyMetrics.accuracy.toFixed(4)),
        macroF1: Number(phenologyMetrics.macroF1.toFixed(4)),
        top3Accuracy: Number(phenologyMetrics.top3Accuracy.toFixed(4))
      }
    }
  })

  console.log('Saved cropModel.json, phenologyModel.json and validationReport.json')
  console.log('Crop metrics:', cropMetrics)
  console.log('Phenology metrics:', phenologyMetrics)
}

main()
