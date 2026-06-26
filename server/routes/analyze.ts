import express from 'express'
import multer from 'multer'
import fs from 'fs'

const router = express.Router()
const upload = multer({ dest: 'server/uploads/' })

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' })

    const imageData = fs.readFileSync(req.file.path)
    const base64Image = imageData.toString('base64')

    const prompt = `You are an agricultural expert analyzing a crop photo. Look carefully at the image and identify the crop type and any visible disease or pest damage. Respond ONLY with valid JSON in this exact format, no extra text, no markdown:
{"crop":"string","disease":"string or None","severity":"Healthy or Mild or Moderate or Severe","symptoms":["string"],"treatment":["string"],"prevention":["string"]}`

    const llavaRes = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llava',
        prompt,
        images: [base64Image],
        stream: false,
        options: { temperature: 0.3, num_predict: 400 }
      })
    })

    const llavaData = await llavaRes.json() as any
    const text = llavaData.response || ''
    console.log('RAW LLAVA RESPONSE:', text)

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      fs.unlinkSync(req.file.path)
      return res.status(500).json({ error: 'Could not parse model response', raw: text })
    }

    const parsed = JSON.parse(jsonMatch[0])
    const toArray = (val: any) => Array.isArray(val) ? val : (val ? [val] : [])
    parsed.symptoms = toArray(parsed.symptoms)
    parsed.treatment = toArray(parsed.treatment)
    parsed.prevention = toArray(parsed.prevention)

    fs.unlinkSync(req.file.path)
    res.json(parsed)
  } catch (err: any) {
    console.error('ANALYZE ERROR:', err?.message || err)
    res.status(500).json({ error: err?.message || 'Analysis failed' })
  }
})

export default router
