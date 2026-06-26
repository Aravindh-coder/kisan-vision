import ee from '@google/earthengine'
// GEE key loaded from env on Render
const key = process.env.GEE_KEY ? JSON.parse(process.env.GEE_KEY) : null

let initialized = false

export function initGEE(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (initialized) return resolve()
    ee.data.authenticateViaPrivateKey(key, () => {
      ee.initialize(null, null, () => {
        initialized = true
        console.log('GEE initialized')
        resolve()
      }, (err: any) => reject(err))
    }, (err: any) => reject(err))
  })
}

export function getIndices(lat: number, lon: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const point = ee.Geometry.Point([lon, lat])

    const image = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
      .filterBounds(point)
      .filterDate('2026-01-01', '2026-06-20')
      .sort('CLOUDY_PIXEL_PERCENTAGE')
      .first()

    const ndvi = image.normalizedDifference(['B8', 'B4']).rename('ndvi')
    const ndwi = image.normalizedDifference(['B3', 'B8']).rename('ndwi')

    const evi = image.expression(
      '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))',
      {
        NIR: image.select('B8'),
        RED: image.select('B4'),
        BLUE: image.select('B2')
      }
    ).clamp(-1, 1).rename('evi')

    const combined = ndvi.addBands(ndwi).addBands(evi)

    combined.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: point.buffer(500),
      scale: 10
    }).evaluate((result: any, err: any) => {
      if (err) return reject(err)
      resolve(result)
    })
  })
}

export function getTimeSeries(lat: number, lon: number, months: number = 6): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const point = ee.Geometry.Point([lon, lat])
    const now = new Date('2026-06-20')
    const promises: Promise<any>[] = []

    for (let i = months - 1; i >= 0; i--) {
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const startStr = start.toISOString().split('T')[0]
      const endStr = end.toISOString().split('T')[0]
      const label = start.toLocaleString('en-US', { month: 'short', year: 'numeric' })

      const p = new Promise((res) => {
        const image = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
          .filterBounds(point)
          .filterDate(startStr, endStr)
          .sort('CLOUDY_PIXEL_PERCENTAGE')
          .first()

        const ndvi = image.normalizedDifference(['B8', 'B4']).rename('ndvi')

        ndvi.reduceRegion({
          reducer: ee.Reducer.mean(),
          geometry: point.buffer(500),
          scale: 10
        }).evaluate((result: any, err: any) => {
          if (err || !result || result.ndvi == null) {
            return res({ month: label, ndvi: null })
          }
          res({ month: label, ndvi: result.ndvi })
        })
      })
      promises.push(p)
    }

    Promise.all(promises).then(resolve).catch(reject)
  })
}

const KHARIF_CROPS = ['Rice', 'Cotton', 'Soybean', 'Maize', 'Sugarcane']
const RABI_CROPS = ['Wheat', 'Mustard', 'Gram', 'Barley']
const ZAID_CROPS = ['Watermelon', 'Cucumber', 'Moong']

function getSeason(month: number): { name: string; crops: string[] } {
  // month is 0-indexed (0 = Jan)
  if (month >= 5 && month <= 9) return { name: 'Kharif', crops: KHARIF_CROPS }
  if (month >= 10 || month <= 2) return { name: 'Rabi', crops: RABI_CROPS }
  return { name: 'Zaid', crops: ZAID_CROPS }
}

export function getLandCover(lat: number, lon: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const point = ee.Geometry.Point([lon, lat])

    const dw = ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1')
      .filterBounds(point)
      .filterDate('2025-09-01', '2026-06-20')
      .select('label')
      .mode()

    dw.reduceRegion({
      reducer: ee.Reducer.mode(),
      geometry: point.buffer(500),
      scale: 10,
      bestEffort: true
    }).evaluate((result: any, err: any) => {
      if (err) return reject(err)
      const classes: Record<number, string> = {
        0: 'water', 1: 'trees', 2: 'grass', 3: 'flooded_vegetation',
        4: 'crops', 5: 'shrub_and_scrub', 6: 'built', 7: 'bare', 8: 'snow_and_ice'
      }
      if (result && result.label != null) {
        resolve(classes[result.label] || 'unknown')
      } else {
        // DW had no data (cloud/no-coverage) — infer from NDVI passed via closure not available here
        // Return 'no_data' so caller can handle
        resolve('no_data')
      }
    })
  })
}

export function estimateCropType(landCover: string, ndvi: number): any {
  const now = new Date('2026-06-20')
  const season = getSeason(now.getMonth())

  // Override DW 'built' label when NDVI clearly shows vegetation
  // DW can misclassify rural cropland near roads as built
  let effectiveLandCover = landCover
  if ((landCover === 'built' || landCover === 'unknown' || landCover === 'no_data') && ndvi > 0.35) {
    effectiveLandCover = 'crops'
  } else if ((landCover === 'unknown' || landCover === 'no_data') && ndvi > 0.2) {
    effectiveLandCover = 'grass'
  }

  if (effectiveLandCover !== 'crops' && effectiveLandCover !== 'flooded_vegetation') {
    return {
      isCropland: false,
      landCover: effectiveLandCover,
      dwRaw: landCover !== effectiveLandCover ? landCover : undefined,
      message: `This location appears to be ${effectiveLandCover.replace(/_/g, ' ')}, not active cropland.`
    }
  }

  // Simple NDVI-based confidence + season-based candidate narrowing
  let candidates = season.crops
  if (ndvi > 0.5) {
    candidates = candidates.slice(0, 2) // assume denser canopy crops more likely
  }

  return {
    isCropland: true,
    landCover: effectiveLandCover,
    dwRaw: landCover !== effectiveLandCover ? landCover : undefined,
    season: season.name,
    likelyCrops: candidates,
    confidence: 'estimated',
    message: `Based on ${season.name} season and vegetation pattern, likely candidates: ${candidates.join(', ')}. This is an estimate, not a direct classification.`
  }
}

const CROP_DURATION_DAYS: Record<string, number> = {
  'Rice': 120,
  'Cotton': 165,
  'Soybean': 100,
  'Maize': 100,
  'Sugarcane': 330,
  'Wheat': 130,
  'Mustard': 100,
  'Gram': 110,
  'Barley': 120,
  'Watermelon': 85,
  'Cucumber': 60,
  'Moong': 65,
}

export function estimateHarvest(timeSeries: any[], crop: string, seasonName: string): any {
  const duration = CROP_DURATION_DAYS[crop] || 110
  const valid = timeSeries.filter(p => p.ndvi != null)

  let sowingIndex = -1
  for (let i = 1; i < valid.length; i++) {
    const prev = valid[i - 1].ndvi
    const curr = valid[i].ndvi
    if (prev < 0.3 && (curr - prev) >= 0.15) {
      sowingIndex = i
      break
    }
  }

  if (sowingIndex === -1) {
    return {
      method: 'season-estimate',
      message: `No clear sowing signal detected in the last 6 months. Based on the ${seasonName} season cycle, harvest is typically expected within ${duration} days of sowing.`,
      estimatedDurationDays: duration
    }
  }

  const sowingLabel = valid[sowingIndex].month
  const sowingDate = new Date(sowingLabel + ' 01')
  const harvestDate = new Date(sowingDate)
  harvestDate.setDate(harvestDate.getDate() + duration)

  return {
    method: 'ndvi-curve',
    sowingMonth: sowingLabel,
    estimatedDurationDays: duration,
    estimatedHarvestDate: harvestDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
    message: `NDVI rise detected around ${sowingLabel}, suggesting sowing began then. For ${crop}, expected growth cycle is ~${duration} days, projecting harvest around ${harvestDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}.`
  }
}
