const ee = require('@google/earthengine')
const key = require('./credentials/gee-key.json')

ee.data.authenticateViaPrivateKey(key, () => {
  ee.initialize(null, null, () => {
    console.log('EE initialized successfully')

    const point = ee.Geometry.Point([78.4867, 17.3850]) // Hyderabad, example
    const image = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
      .filterBounds(point)
      .filterDate('2026-01-01', '2026-06-01')
      .sort('CLOUDY_PIXEL_PERCENTAGE')
      .first()

    const ndvi = image.normalizedDifference(['B8', 'B4'])

    ndvi.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: point.buffer(500),
      scale: 10
    }).evaluate((result) => {
      console.log('NDVI result:', result)
    })
  }, (err) => {
    console.error('Init error:', err)
  })
}, (err) => {
  console.error('Auth error:', err)
})
