import express from 'express'
import PDFDocument from 'pdfkit'
import { generateWithRetry } from '../services/geminiClient'
const router = express.Router()

function fallbackAnalysis(farmerName: string, location: string, cropAge: string) {
  return {
    cropType: 'Unknown Crop',
    healthStatus: 'WARNING',
    healthSummary: 'Could not get a precise AI reading this time. Based on common crop health patterns, here is general guidance — please monitor your crop closely.',
    problemName: 'General advisory (try uploading again for a precise AI reading)',
    affectedArea: 'Manual inspection required',
    severity: 'Unknown — please inspect field directly',
    step1: 'Walk your field and check for yellowing leaves, spots, wilting, or unusual discoloration on plants.',
    medicineName: 'Consult local agricultural officer',
    medicineDose: 'Follow label instructions',
    medicineApplication: 'Spray early morning or late evening',
    medicineRepeat: 'As directed by agronomist',
    step3: 'Ensure proper drainage and avoid waterlogging. Apply balanced NPK fertilizer if growth seems slow.',
    futureCropRotation: 'Rotate with legumes (beans, lentils) next season to restore soil nutrients.',
    futureSeed: 'Buy certified disease-resistant seeds from your nearest agricultural supply store.',
    confidence: 0,
    farmerName: farmerName || 'Farmer',
    location: location || 'Field',
    cropAge: cropAge || 'Not specified',
    isFallback: true
  }
}

router.post('/analyze', async (req, res) => {
  const { base64, mediaType, farmerName, location, cropType, cropAge } = req.body
  if (!base64) return res.status(400).json({ error: 'No image provided' })

  let timeoutId: NodeJS.Timeout | null = null
  const TIMEOUT_MS = 28000
  try {
    const aiPromptCropType = cropType ? `Crop Type: ${cropType}.` : ''
    const aiPromise = generateWithRetry([
      { inlineData: { data: base64, mimeType: mediaType || 'image/jpeg' } },
      `You are an expert agricultural AI. ${aiPromptCropType} Analyze this crop image and respond ONLY with valid JSON (no markdown, no backticks, no extra text):
{"cropType":"detected crop name","healthStatus":"HEALTHY or WARNING or SEVERE","healthSummary":"one sentence summary for farmer","problemName":"disease name or None detected","affectedArea":"where affected or Not applicable","severity":"how many plants affected or None","step1":"field cleanup instruction","medicineName":"specific medicine or No treatment needed","medicineDose":"exact mixing ratio","medicineApplication":"how to spray","medicineRepeat":"when to repeat","step3":"watering and nutrition advice","futureCropRotation":"next season advice","futureSeed":"seed selection advice","confidence":87}`
    ])
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('AI timeout after 28s')), TIMEOUT_MS)
    })
    const text = await Promise.race([aiPromise, timeoutPromise])
    const parsed = JSON.parse((text as string).replace(/```json|```/g, '').trim())
    if (timeoutId) clearTimeout(timeoutId)
    res.json({ ...parsed, farmerName: farmerName || 'Farmer', location: location || 'Field', cropType: parsed.cropType || cropType || 'Unknown Crop', cropAge: cropAge || 'Not specified' })
  } catch (e: unknown) {
    if (timeoutId) clearTimeout(timeoutId)
    console.error('Crop detect error — using fallback:', (e as Error).message?.slice(0, 80))
    res.json({ ...fallbackAnalysis(farmerName, location, cropAge), cropType: cropType || 'Unknown Crop' })
  }
})

router.post('/report-pdf', async (req, res) => {
  try {
    const { report } = req.body
    if (!report) return res.status(400).json({ error: 'Report data required' })

    const doc = new PDFDocument({ size: 'A4', margin: 40 })
    const chunks: Uint8Array[] = []
    doc.on('data', chunk => chunks.push(chunk))
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="crop-report-${(report.cropType||'report').replace(/\s+/g,'_').toLowerCase()}.pdf"`)
      res.send(pdfBuffer)
    })

    doc.fontSize(22).fillColor('#0d5620').text('KISAN-VISION Crop Health Report', { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(12).fillColor('#4b5563').text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}`, { align: 'center' })
    doc.moveDown(1)
    doc.fontSize(14).fillColor('#111827').text('Field Details', { underline: true })
    doc.moveDown(0.3)
    const fieldPairs = [
      ['Farmer Name', report.farmerName],
      ['Location', report.location],
      ['Crop Type', report.cropType],
      ['Crop Age', report.cropAge]
    ]
    fieldPairs.forEach(([k, v]) => doc.fontSize(11).fillColor('#111827').text(`${k}: `, { continued: true }).font('Helvetica-Bold').text(v || 'Not provided').font('Helvetica'))
    doc.moveDown(0.8)

    doc.fontSize(14).fillColor('#111827').text('Health Summary', { underline: true })
    doc.moveDown(0.3)
    doc.fontSize(11).fillColor('#111827').text(report.healthSummary || 'No summary available.', { align: 'justify' })
    doc.moveDown(0.8)

    doc.fontSize(14).fillColor('#111827').text('Diagnosis', { underline: true })
    doc.moveDown(0.3)
    doc.fontSize(11).text(`Problem: ${report.problemName}`)
    doc.text(`Affected Area: ${report.affectedArea}`)
    doc.text(`Severity: ${report.severity}`)
    doc.moveDown(0.8)

    doc.fontSize(14).fillColor('#111827').text('Treatment Plan', { underline: true })
    doc.moveDown(0.3)
    doc.fontSize(11).text(`1. ${report.step1}`)
    doc.moveDown(0.3)
    doc.text(`Medicine: ${report.medicineName}`)
    doc.text(`Dose: ${report.medicineDose}`)
    doc.text(`Application: ${report.medicineApplication}`)
    doc.text(`Repeat: ${report.medicineRepeat}`)
    doc.moveDown(0.3)
    doc.text(`3. ${report.step3}`)
    doc.moveDown(0.8)

    doc.fontSize(14).fillColor('#111827').text('Future Recommendations', { underline: true })
    doc.moveDown(0.3)
    doc.fontSize(11).text(`Crop Rotation: ${report.futureCropRotation}`)
    doc.text(`Seed Selection: ${report.futureSeed}`)
    doc.moveDown(1)
    doc.fontSize(10).fillColor('#6b7280').text('This report is generated by KISAN-VISION AI to assist farmers with early crop health diagnosis.', { align: 'center' })

    doc.end()
  } catch (err: any) {
    console.error('PDF generation failed:', err.message)
    res.status(500).json({ error: 'Failed to generate PDF' })
  }
})

export default router
