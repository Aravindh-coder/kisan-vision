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
        resolve('no_data')
      }
    })
  })
}

function buildDateRange(monthsBack: number) {
  const now = new Date('2026-06-20')
  const start = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)
  const end = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1)
  const startStr = start.toISOString().split('T')[0]
  const endStr = end.toISOString().split('T')[0]
  return { startStr, endStr, label: start.toLocaleString('en-US', { month: 'short', year: 'numeric' }) }
}

export function getSentinel2Indices(lat: number, lon: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const point = ee.Geometry.Point([lon, lat])
    const { startStr, endStr } = buildDateRange(0)

    const image = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
      .filterBounds(point)
      .filterDate(startStr, endStr)
      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
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
    const savi = image.expression('1.5 * ((NIR - RED) / (NIR + RED + 0.5))', {
      NIR: image.select('B8'),
      RED: image.select('B4')
    }).clamp(-1, 1).rename('savi')

    ee.Image.cat([ndvi, ndwi, evi, savi]).reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: point.buffer(500),
      scale: 10,
      bestEffort: true
    }).evaluate((result: any, err: any) => {
      if (err) return reject(err)
      resolve({
        ...result,
        source: 'Sentinel-2',
        ndvi: parseFloat((result.ndvi || 0).toFixed(3)),
        ndwi: parseFloat((result.ndwi || 0).toFixed(3)),
        evi: parseFloat((result.evi || 0).toFixed(3)),
        savi: parseFloat((result.savi || 0).toFixed(3))
      })
    })
  })
}

export function getLandsatIndices(lat: number, lon: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const point = ee.Geometry.Point([lon, lat])
    const { startStr, endStr } = buildDateRange(0)

    const image = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
      .filterBounds(point)
      .filterDate(startStr, endStr)
      .filter(ee.Filter.lt('CLOUD_COVER', 30))
      .sort('CLOUD_COVER')
      .first()

    const ndvi = image.normalizedDifference(['B5', 'B4']).rename('ndvi')
    const ndwi = image.normalizedDifference(['B3', 'B5']).rename('ndwi')
    const evi = image.expression(
      '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))',
      {
        NIR: image.select('B5'),
        RED: image.select('B4'),
        BLUE: image.select('B2')
      }
    ).clamp(-1, 1).rename('evi')
    const savi = image.expression('1.5 * ((NIR - RED) / (NIR + RED + 0.5))', {
      NIR: image.select('B5'),
      RED: image.select('B4')
    }).clamp(-1, 1).rename('savi')

    ee.Image.cat([ndvi, ndwi, evi, savi]).reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: point.buffer(500),
      scale: 30,
      bestEffort: true
    }).evaluate((result: any, err: any) => {
      if (err) return reject(err)
      resolve({
        ...result,
        source: 'Landsat-8',
        ndvi: parseFloat((result.ndvi || 0).toFixed(3)),
        ndwi: parseFloat((result.ndwi || 0).toFixed(3)),
        evi: parseFloat((result.evi || 0).toFixed(3)),
        savi: parseFloat((result.savi || 0).toFixed(3))
      })
    })
  })
}

export function getSentinel1Indices(lat: number, lon: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const point = ee.Geometry.Point([lon, lat])
    const { startStr, endStr } = buildDateRange(0)

    const image = ee.ImageCollection('COPERNICUS/S1_GRD')
      .filterBounds(point)
      .filterDate(startStr, endStr)
      .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
      .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
      .filter(ee.Filter.eq('instrumentMode', 'IW'))
      .select(['VV', 'VH'])
      .mean()

    const ratio = image.select('VH').divide(image.select('VV')).rename('vhvv')
    const backscatter = image.select('VV').add(image.select('VH')).divide(2).rename('backscatter')
    const soilMoisture = image.select('VH').subtract(image.select('VV')).multiply(-0.04).add(0.35).rename('soilMoisture')

    ee.Image.cat([image.select('VV'), image.select('VH'), ratio, backscatter, soilMoisture]).reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: point.buffer(500),
      scale: 10,
      bestEffort: true
    }).evaluate((result: any, err: any) => {
      if (err) return reject(err)
      resolve({
        ...result,
        source: 'Sentinel-1/NISAR',
        vv: parseFloat((result.VV || 0).toFixed(3)),
        vh: parseFloat((result.VH || 0).toFixed(3)),
        vhvv: parseFloat((result.vhvv || 0).toFixed(3)),
        backscatter: parseFloat((result.backscatter || 0).toFixed(3)),
        soilMoisture: parseFloat((result.soilMoisture || 0).toFixed(3))
      })
    })
  })
}

export const getNISARIndices = getSentinel1Indices

export function getMultiSourceTimeSeries(lat: number, lon: number, months: number = 12): Promise<any[]> {
  const point = ee.Geometry.Point([lon, lat])
  const now = new Date('2026-06-20')
  const promises: Promise<any>[] = []

  for (let i = months - 1; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]
    const monthLabel = start.toLocaleString('en-US', { month: 'short', year: 'numeric' })

    const promise = new Promise((resolve) => {
      const s2Image = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
        .filterBounds(point)
        .filterDate(startStr, endStr)
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 40))
        .sort('CLOUDY_PIXEL_PERCENTAGE')
        .first()

      const ndvi = s2Image.normalizedDifference(['B8', 'B4']).rename('ndvi')

      const s1Image = ee.ImageCollection('COPERNICUS/S1_GRD')
        .filterBounds(point)
        .filterDate(startStr, endStr)
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .select(['VV', 'VH'])
        .mean()

      const vhvv = s1Image.select('VH').divide(s1Image.select('VV')).rename('vhvv')
      const combined = ee.Image.cat([ndvi, vhvv])

      combined.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: point.buffer(500),
        scale: 10,
        bestEffort: true
      }).evaluate((result: any, err: any) => {
        if (err) return resolve({ month: monthLabel, ndvi: null, vhvv: null, source: 'multisource' })
        resolve({
          month: monthLabel,
          ndvi: result.ndvi != null ? parseFloat(result.ndvi.toFixed(3)) : null,
          vhvv: result.vhvv != null ? parseFloat(result.vhvv.toFixed(3)) : null,
          source: 'Sentinel-2 + Sentinel-1'
        })
      })
    })
    promises.push(promise)
  }

  return Promise.all(promises)
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
