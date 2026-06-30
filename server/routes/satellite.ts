import express from 'express'
import { getWeather } from '../services/weather'
import { initGEE, getTimeSeries, getLandCover, estimateCropType, estimateHarvest, getSentinel1Indices, getSentinel2Indices, getLandsatIndices, getMultiSourceTimeSeries } from '../services/gee'
import { estimateCropTypeML, estimatePhenologyStage } from '../services/cropMl'

const router = express.Router()

// Initialize GEE once on startup
initGEE().then(() => console.log('GEE ready')).catch((e: any) => console.error('GEE init failed:', e?.message))

function calcIndicesFallback(lat: number, lon: number, humidity: number) {
  const seed = Math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453
  const rand = seed - Math.floor(seed)
  const ndvi = parseFloat(Math.min(0.85, Math.max(0.05, 0.25 + rand * 0.45)).toFixed(3))
  const ndwi = parseFloat(Math.min(0.6, Math.max(-0.3, -0.1 + (humidity / 100) * 0.5 + rand * 0.2)).toFixed(3))
  const evi  = parseFloat((ndvi * 0.85 + 0.02).toFixed(3))
  const savi = parseFloat((ndvi * 1.05).toFixed(3))
  return { ndvi, ndwi, evi, savi }
}

function getSAR(humidity: number, windSpeed: number) {
  const backscatter = parseFloat((-12 + humidity * 0.05 + windSpeed * 0.3).toFixed(1))
  return { backscatter, soilMoisture: humidity > 60 ? 'Moist' : 'Dry', surfaceType: 'Vegetated', coherence: 0.72 }
}

function fuseMultiSourceIndices(sentinel2: any, landsat: any, sentinel1: any, humidity: number) {
  const opticalSources: any[] = []
  if (sentinel2) opticalSources.push({ name: 'Sentinel-2', ...sentinel2 })
  if (landsat) opticalSources.push({ name: 'Landsat-8', ...landsat })

  const averages = {
    ndvi: null as number | null,
    ndwi: null as number | null,
    evi: null as number | null,
    savi: null as number | null
  }

  const availableOptical = opticalSources.filter(src => src && src.ndvi != null)
  if (availableOptical.length > 0) {
    averages.ndvi = parseFloat((availableOptical.reduce((sum, src) => sum + src.ndvi, 0) / availableOptical.length).toFixed(3))
    averages.ndwi = parseFloat((availableOptical.reduce((sum, src) => sum + (src.ndwi || 0), 0) / availableOptical.length).toFixed(3))
    averages.evi = parseFloat((availableOptical.reduce((sum, src) => sum + (src.evi || 0), 0) / availableOptical.length).toFixed(3))
    averages.savi = parseFloat((availableOptical.reduce((sum, src) => sum + (src.savi || 0), 0) / availableOptical.length).toFixed(3))
  }

  const sar = sentinel1 ? {
    vv: sentinel1.vv,
    vh: sentinel1.vh,
    vhvv: sentinel1.vhvv,
    backscatter: sentinel1.backscatter,
    soilMoisture: sentinel1.soilMoisture,
    source: 'Sentinel-1'
  } : null

  const opticalSourceNames = availableOptical.map(src => src.name)
  const dataSource = opticalSourceNames.length > 0 ? opticalSourceNames.join(' + ') : 'Optical fallback only'

  const moistureIndicator = sar?.soilMoisture || (humidity > 60 ? 'Moist' : 'Dry')

  return {
    ...averages,
    sar,
    moistureIndicator,
    dataSource,
    fusion: {
      method: 'optical-sar-fusion',
      sources: [...opticalSourceNames, sar ? 'Sentinel-1' : 'SAR fallback'],
      description: 'Fused optical vegetation indices with SAR backscatter and soil moisture signals.'
    }
  }
}

function advisory(ndvi: number, ndwi: number, sar: any) {
  const soilMoisture = sar?.soilMoisture
  const dryCondition = soilMoisture === 'Dry' || (typeof soilMoisture === 'number' && soilMoisture < 0.25)
  if (ndvi < 0.2) return { status: 'Poor Vegetation', message: 'Low vegetation health. Check for crop stress.' }
  if (ndwi < -0.2 || dryCondition) return { status: 'Water Stress', message: 'Low moisture detected. Irrigation recommended.' }
  if (ndvi < 0.5) return { status: 'Moderate Health', message: 'Vegetation is moderately healthy. Monitor closely.' }
  return { status: 'Healthy', message: 'Vegetation appears healthy with adequate moisture.' }
}

router.get('/', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string)
    const lon = parseFloat(req.query.lon as string)
    if (isNaN(lat) || isNaN(lon)) return res.status(400).json({ error: 'lat and lon required' })

    const weatherRaw = await getWeather(lat, lon).catch(() => null)
    const temp = weatherRaw?.main?.temp || 28
    const humidity = weatherRaw?.main?.humidity || 65
    const windSpeed = weatherRaw?.wind?.speed || 4
    const weatherDesc = weatherRaw?.weather?.[0]?.description || 'Partly cloudy'

    // Try real GEE data, fall back to simulated if GEE times out
    let ndvi: number, ndwi: number, evi: number, savi: number
    let timeSeries: any[]
    let landCoverRaw: string
    let dataSource: string

    try {
      const [s2Result, landsatResult, s1Result, seriesResult, landCoverResult] = await Promise.allSettled([
        getSentinel2Indices(lat, lon),
        getLandsatIndices(lat, lon),
        getSentinel1Indices(lat, lon),
        getMultiSourceTimeSeries(lat, lon, 6),
        getLandCover(lat, lon)
      ])

      const sentinel2 = s2Result.status === 'fulfilled' ? s2Result.value : null
      const landsat = landsatResult.status === 'fulfilled' ? landsatResult.value : null
      const sentinel1 = s1Result.status === 'fulfilled' ? s1Result.value : null
      const geeSeries = seriesResult.status === 'fulfilled' ? seriesResult.value : []
      const geeLand = landCoverResult.status === 'fulfilled' ? landCoverResult.value : 'unknown'

      const fused = fuseMultiSourceIndices(sentinel2, landsat, sentinel1, humidity)
      ndvi = fused.ndvi ?? sentinel2?.ndvi ?? landsat?.ndvi ?? 0.3
      ndwi = fused.ndwi ?? sentinel2?.ndwi ?? landsat?.ndwi ?? 0.0
      evi  = fused.evi ?? sentinel2?.evi ?? landsat?.evi ?? parseFloat((ndvi * 0.85).toFixed(3))
      savi = fused.savi ?? sentinel2?.savi ?? landsat?.savi ?? parseFloat((ndvi * 1.05).toFixed(3))
      timeSeries = geeSeries.map((p: any) => ({ month: p.month, ndvi: p.ndvi != null ? parseFloat(p.ndvi.toFixed(3)) : null, vhvv: p.vhvv || null }))

      if (geeLand === 'no_data' || geeLand === 'unknown') {
        if (ndvi > 0.4) landCoverRaw = 'crops'
        else if (ndvi > 0.25) landCoverRaw = 'grass'
        else if (ndvi > 0.1) landCoverRaw = 'bare'
        else landCoverRaw = 'built'
      } else {
        landCoverRaw = geeLand
      }

      dataSource = `${fused.dataSource}${sentinel1 ? ' + Sentinel-1' : ''} · Google Earth Engine`
      if (s1Result.status !== 'fulfilled') dataSource += ' (SAR fallback)'
    } catch (geeErr: any) {
      console.warn('GEE call failed, using fallback:', geeErr?.message?.slice(0, 80))
      const fb = calcIndicesFallback(lat, lon, humidity)
      ndvi = fb.ndvi; ndwi = fb.ndwi; evi = fb.evi; savi = fb.savi
      const months = ['Jan','Feb','Mar','Apr','May','Jun']
      timeSeries = months.map((month, i) => ({
        month,
        ndvi: parseFloat(Math.min(0.9, Math.max(0.05, ndvi - 0.15 + i * 0.05 + Math.random() * 0.1)).toFixed(3)),
        vhvv: null
      }))
      landCoverRaw = 'unknown'
      dataSource = 'Sentinel-2 Simulated · OpenWeatherMap'
    }

    const _m = new Date().getMonth() + 1
    const correctedSeason = (_m >= 6 && _m <= 10) ? 'Kharif' : (_m >= 11 || _m <= 3) ? 'Rabi' : 'Zaid'
    const cropEstimate = estimateCropType(landCoverRaw, ndvi)
    cropEstimate.season = correctedSeason
    const mlCropEstimate = estimateCropTypeML(timeSeries, ndvi, correctedSeason)
    const phenology = estimatePhenologyStage(timeSeries, ndvi, mlCropEstimate.cropType)
    const harvestInfo = cropEstimate.isCropland
      ? estimateHarvest(timeSeries, cropEstimate.likelyCrops?.[0] || mlCropEstimate.cropType || 'Rice', correctedSeason)
      : null

    const fusedSAR = await (async () => {
      try {
        const s1 = await getSentinel1Indices(lat, lon)
        return s1
      } catch {
        return null
      }
    })()

    res.json({
      ndvi, ndwi, evi, savi,
      landCover: landCoverRaw,
      cropEstimate,
      mlCropEstimate,
      phenology,
      sar: fusedSAR || getSAR(humidity, windSpeed),
      advisory: advisory(ndvi, ndwi, fusedSAR),
      timeSeries,
      weather: { temp, humidity, wind_speed: windSpeed, description: weatherDesc, pressure: weatherRaw?.main?.pressure || 1013, rain: weatherRaw?.rain?.["1h"] || 0, feels_like: weatherRaw?.main?.feels_like || temp - 2 },
      harvest: harvestInfo,
      source: dataSource,
      fusion: {
        method: 'multi-source SAR/optical fusion',
        detail: 'Sentinel-2, Landsat-8, and Sentinel-1 indexes fused to improve crop and moisture analysis.',
      },
      timestamp: new Date().toISOString()
    })
  } catch (err: any) {
    res.status(500).json({ error: err?.message })
  }
})

router.get('/timeseries', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string)
    const lon = parseFloat(req.query.lon as string)
    if (isNaN(lat) || isNaN(lon)) return res.status(400).json({ error: 'lat and lon required' })

    let timeSeries: any[]
    let source: string
    try {
      const series = await getTimeSeries(lat, lon, 12)
      timeSeries = series.map((p: any) => ({
        month: p.month,
        ndvi: p.ndvi != null ? parseFloat(p.ndvi.toFixed(3)) : null,
        ndwi: null
      }))
      source = 'Sentinel-2 · Google Earth Engine'
    } catch {
      const seed = Math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453
      const rand = seed - Math.floor(seed)
      const baseNdvi = Math.min(0.85, Math.max(0.05, 0.25 + rand * 0.45))
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      timeSeries = months.map((month, i) => ({
        month,
        ndvi: parseFloat(Math.min(0.9, Math.max(0.05, baseNdvi - 0.15 + i * 0.04 + Math.random() * 0.1)).toFixed(3)),
        ndwi: parseFloat(Math.min(0.6, Math.max(-0.3, -0.05 + Math.random() * 0.3)).toFixed(3))
      }))
      source = 'Sentinel-2 Simulated'
    }
    res.json({ timeSeries, source })
  } catch (err: any) {
    res.status(500).json({ error: err?.message })
  }
})

router.get('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lon } = req.query
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
      headers: { 'User-Agent': 'KISAN-VISION/1.0', 'Accept-Language': 'en' }
    })
    const data = await response.json()
    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err?.message })
  }
})

export default router
