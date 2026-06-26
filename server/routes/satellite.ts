import express from 'express'
import { getWeather } from '../services/weather'
import { initGEE, getIndices, getTimeSeries, getLandCover, estimateCropType, estimateHarvest } from '../services/gee'

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

function advisory(ndvi: number, ndwi: number) {
  if (ndvi < 0.2) return { status: 'Poor Vegetation', message: 'Low vegetation health. Check for crop stress.' }
  if (ndwi < -0.2) return { status: 'Water Stress', message: 'Low moisture detected. Irrigation recommended.' }
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
      const [geeIndices, geeSeries, geeLand] = await Promise.all([
        getIndices(lat, lon),
        getTimeSeries(lat, lon, 6),
        getLandCover(lat, lon)
      ])

      ndvi = parseFloat((geeIndices.ndvi ?? 0.3).toFixed(3))
      ndwi = parseFloat((geeIndices.ndwi ?? 0.0).toFixed(3))
      evi  = parseFloat((geeIndices.evi  ?? ndvi * 0.85).toFixed(3))
      savi = parseFloat((ndvi * 1.05).toFixed(3))
      timeSeries = geeSeries.map((p: any) => ({ month: p.month, ndvi: p.ndvi != null ? parseFloat(p.ndvi.toFixed(3)) : null }))
      // If DW had no coverage, infer from NDVI
      if (geeLand === 'no_data' || geeLand === 'unknown') {
        if (ndvi > 0.4) landCoverRaw = 'crops'
        else if (ndvi > 0.25) landCoverRaw = 'grass'
        else if (ndvi > 0.1) landCoverRaw = 'bare'
        else landCoverRaw = 'built'
      } else {
        landCoverRaw = geeLand
      }
      dataSource = 'Sentinel-2 · Google Earth Engine'
    } catch (geeErr: any) {
      console.warn('GEE call failed, using fallback:', geeErr?.message?.slice(0, 80))
      const fb = calcIndicesFallback(lat, lon, humidity)
      ndvi = fb.ndvi; ndwi = fb.ndwi; evi = fb.evi; savi = fb.savi
      const months = ['Jan','Feb','Mar','Apr','May','Jun']
      timeSeries = months.map((month, i) => ({
        month,
        ndvi: parseFloat(Math.min(0.9, Math.max(0.05, ndvi - 0.15 + i * 0.05 + Math.random() * 0.1)).toFixed(3))
      }))
      landCoverRaw = 'unknown'
      dataSource = 'Sentinel-2 Simulated · OpenWeatherMap'
    }

    const cropEstimate = estimateCropType(landCoverRaw, ndvi)
    const _m = new Date().getMonth() + 1
    const correctedSeason = (_m >= 6 && _m <= 10) ? 'Kharif' : (_m >= 11 || _m <= 3) ? 'Rabi' : 'Zaid'
    cropEstimate.season = correctedSeason
    const harvestInfo = cropEstimate.isCropland
      ? estimateHarvest(timeSeries, cropEstimate.likelyCrops?.[0] || 'Rice', correctedSeason)
      : null

    res.json({
      ndvi, ndwi, evi, savi,
      landCover: landCoverRaw,
      cropEstimate,
      sar: getSAR(humidity, windSpeed),
      advisory: advisory(ndvi, ndwi),
      timeSeries,
      weather: { temp, humidity, wind_speed: windSpeed, description: weatherDesc, pressure: weatherRaw?.main?.pressure || 1013, rain: weatherRaw?.rain?.["1h"] || 0, feels_like: weatherRaw?.main?.feels_like || temp - 2 },
      harvest: harvestInfo,
      source: dataSource,
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
