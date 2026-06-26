const KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2
].filter(Boolean) as string[]

let keyIndex = 0
function nextKey() {
  const key = KEYS[keyIndex % KEYS.length]
  keyIndex++
  return key
}

export async function generateWithRetry(
  parts: (string | { inlineData: { data: string; mimeType: string } })[],
  modelName: string = 'meta-llama/llama-4-scout-17b-16e-instruct',
  maxAttempts: number = KEYS.length * 2
): Promise<string> {
  // Build Groq messages from parts
  const content: any[] = []
  for (const part of parts) {
    if (typeof part === 'string') {
      content.push({ type: 'text', text: part })
    } else {
      content.push({
        type: 'image_url',
        image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` }
      })
    }
  }

  let lastErr: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const key = nextKey()
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: 'user', content }],
          max_tokens: 1024
        })
      })
      if (!res.ok) {
        const err: any = new Error('Groq error')
        err.status = res.status
        throw err
      }
      const data = await res.json()
      return (data as any).choices[0].message.content
    } catch (err: any) {
      lastErr = err
      if (err.status !== 429 && err.status !== 503) throw err
      const delay = Math.min(1000 * 2 ** attempt, 5000)
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw lastErr
}
