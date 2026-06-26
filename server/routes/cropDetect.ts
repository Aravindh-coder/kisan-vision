import express from 'express'
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
  const { base64, mediaType, farmerName, location, cropAge } = req.body
  if (!base64) return res.status(400).json({ error: 'No image provided' })

  const TIMEOUT_MS = 28000
  try {
    const aiPromise = generateWithRetry([
      { inlineData: { data: base64, mimeType: mediaType || 'image/jpeg' } },
      `You are an expert agricultural AI. Analyze this crop image and respond ONLY with valid JSON (no markdown, no backticks, no extra text):
{"cropType":"detected crop name","healthStatus":"HEALTHY or WARNING or SEVERE","healthSummary":"one sentence summary for farmer","problemName":"disease name or None detected","affectedArea":"where affected or Not applicable","severity":"how many plants affected or None","step1":"field cleanup instruction","medicineName":"specific medicine or No treatment needed","medicineDose":"exact mixing ratio","medicineApplication":"how to spray","medicineRepeat":"when to repeat","step3":"watering and nutrition advice","futureCropRotation":"next season advice","futureSeed":"seed selection advice","confidence":87}`
    ])
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI timeout after 28s')), TIMEOUT_MS)
    )
    const text = await Promise.race([aiPromise, timeoutPromise])
    const parsed = JSON.parse((text as string).replace(/```json|```/g, '').trim())
    res.json({ ...parsed, farmerName: farmerName || 'Farmer', location: location || 'Field', cropAge: cropAge || 'Not specified' })
  } catch (e: unknown) {
    console.error('Crop detect error — using fallback:', (e as Error).message?.slice(0, 80))
    res.json(fallbackAnalysis(farmerName, location, cropAge))
  }
})

export default router
