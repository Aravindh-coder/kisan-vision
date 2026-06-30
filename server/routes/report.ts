import express from 'express'
import PDFDocument from 'pdfkit'

const router = express.Router()

router.post('/pdf', async (req, res) => {
  try {
    const {
      location, lat, lon,
      ndvi, ndwi, evi,
      advisory, landCover, crop, season,
      harvest, diseaseRisk, diseaseAdvice,
      irrigation, dryness,
      weather
    } = req.body

    const doc = new PDFDocument({ margin: 50, size: 'A4' })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="KisanVision_Report_${(location || 'Field').replace(/\s+/g, '_')}.pdf"`)
    doc.pipe(res)

    // Header
    doc.rect(0, 0, doc.page.width, 90).fill('#14532d')
    doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold')
       .text('KISAN-VISION', 50, 28)
    doc.fontSize(11).font('Helvetica').fillColor('#bbf7d0')
       .text('Satellite Crop Health & Land Report', 50, 58)
    doc.fontSize(9).fillColor('#86efac')
       .text(new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), 400, 30, { align: 'right', width: 145 })

    doc.moveDown(4)
    doc.fillColor('#000000')

    let y = 110
    const left = 50

    // Location block
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#14532d').text(`Location: ${location || 'Unknown'}`, left, y)
    y += 20
    doc.fontSize(10).font('Helvetica').fillColor('#555555')
       .text(`Coordinates: ${lat?.toFixed(4)}, ${lon?.toFixed(4)}`, left, y)
    y += 30

    // Section helper
    function sectionTitle(title: string, color: string) {
      doc.fontSize(13).font('Helvetica-Bold').fillColor(color).text(title, left, y)
      y += 18
      doc.moveTo(left, y).lineTo(545, y).strokeColor(color).lineWidth(1).stroke()
      y += 10
    }
    function row(label: string, value: string) {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333').text(`${label}:`, left, y, { continued: true })
      doc.font('Helvetica').fillColor('#000000').text(`  ${value}`)
      y += 16
    }

    // Weather
    if (weather) {
      sectionTitle('Weather Conditions', '#1d4ed8')
      row('Temperature', `${weather.temp}°C (feels ${weather.feels_like}°C)`)
      row('Humidity', `${weather.humidity}%`)
      row('Wind Speed', `${weather.wind_speed} m/s`)
      row('Condition', weather.description || 'N/A')
      row('Rainfall', `${weather.rain || 0} mm`)
      y += 10
    }

    // Satellite indices
    sectionTitle('Satellite Vegetation Indices', '#15803d')
    row('NDVI (Vegetation Health)', `${ndvi?.toFixed(3)} ${ndvi > 0.5 ? '(Healthy)' : ndvi > 0.2 ? '(Moderate)' : '(Poor)'}`)
    row('NDWI (Moisture Level)', `${ndwi?.toFixed(3)} ${ndwi > 0 ? '(Adequate)' : '(Low)'}`)
    row('EVI (Enhanced Vegetation)', `${evi?.toFixed(3)}`)
    row('Field Status', advisory || 'N/A')
    y += 10

    // Crop info
    sectionTitle('Crop Intelligence', '#a16207')
    row('Land Cover', landCover || 'N/A')
    row('Estimated Crop', crop || 'N/A')
    row('Season', season || 'N/A')
    if (typeof harvest === 'object' && harvest !== null) {
      if (harvest.estimatedHarvestDate) {
        row('Estimated Harvest Date', harvest.estimatedHarvestDate)
      }
      row('Estimation Method', harvest.method === 'ndvi-curve' ? 'NDVI Growth Curve Analysis' : 'Seasonal Cycle Estimate')
      doc.fontSize(9).font('Helvetica').fillColor('#666666')
         .text(harvest.message || '', left, y, { width: 495 })
      y += 30
    } else {
      row('Harvest Period', harvest || 'N/A')
    }
    y += 10

    // Disease risk
    sectionTitle('Disease Risk Assessment', '#b91c1c')
    row('Risk Level', diseaseRisk || 'N/A')
    doc.fontSize(10).font('Helvetica').fillColor('#444444')
       .text(diseaseAdvice || 'No specific advice available.', left, y, { width: 495 })
    y += 35

    // Irrigation
    sectionTitle('Irrigation Advisory', '#0369a1')
    doc.fontSize(10).font('Helvetica').fillColor('#000000').text(irrigation || 'N/A', left, y, { width: 495 })
    y += 25

    // Dryness
    sectionTitle('Soil Moisture Status', '#c2410c')
    doc.fontSize(10).font('Helvetica').fillColor('#000000').text(dryness || 'N/A', left, y, { width: 495 })
    y += 35

    // Footer
    doc.fontSize(8).fillColor('#888888')
       .text('Powered by KISAN-VISION Satellite Platform | Data from Sentinel-2 (Google Earth Engine) & OpenWeatherMap', left, 770, { width: 495, align: 'center' })

    doc.end()
  } catch (err: any) {
    console.error('PDF ERROR:', err?.message || err)
    res.status(500).json({ error: err?.message || 'PDF generation failed' })
  }
})

export default router
