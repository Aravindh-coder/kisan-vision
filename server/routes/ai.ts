import express from 'express'
const router = express.Router()

router.post('/groq', async (req: any, res: any) => {
  try {
    const { messages, max_tokens } = req.body
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.GROQ_API_KEY },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, max_tokens: max_tokens || 800, temperature: 0.7 })
    })
    const d = await r.json()
    res.json(d)
  } catch(e: any) {
    res.status(500).json({ error: e.message })
  }
})

export default router
