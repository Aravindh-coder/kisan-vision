import express from 'express'
import dotenv from 'dotenv'
dotenv.config()
const router = express.Router()

function getSmartAnswer(question: string, context: string, lang: string): string {
  const q = question.toLowerCase()
  const ctx = context || ''
  
  const ndviMatch = ctx.match(/NDVI=([0-9.]+)/)
  const ndvi = ndviMatch ? parseFloat(ndviMatch[1]) : 0.5
  const humMatch = ctx.match(/Humidity=([0-9]+)/)
  const humidity = humMatch ? parseInt(humMatch[1]) : 65
  const tempMatch = ctx.match(/Temp=([0-9.]+)/)
  const temp = tempMatch ? parseFloat(tempMatch[1]) : 28

  const ndviStatus = ndvi > 0.6 ? 'excellent' : ndvi > 0.4 ? 'moderate' : ndvi > 0.2 ? 'poor' : 'critical'
  const irrigationNeeded = humidity < 50

  const answers: Record<string, Record<string, string>> = {
    irrigat: {
      en: `Based on your satellite data (NDVI=${ndvi}, Humidity=${humidity}%), ${irrigationNeeded ? 'irrigation is recommended immediately. Apply 40-50mm of water per session, preferably in early morning (5-7 AM) to reduce evaporation. Given the temperature of ' + temp + '°C, drip irrigation is most efficient — it saves 30-40% water compared to flood irrigation. Schedule irrigation every 3-4 days and monitor soil moisture daily. Consider installing soil moisture sensors at 15cm depth for precise monitoring.' : 'irrigation is NOT needed today. Soil moisture at ' + humidity + '% is adequate. Resume monitoring in 2 days and irrigate only if humidity drops below 50%. Overwatering can cause root rot and fungal diseases, especially at temperatures above 25°C.'}`,
      hi: `आपके उपग्रह डेटा (NDVI=${ndvi}, आर्द्रता=${humidity}%) के आधार पर, ${irrigationNeeded ? 'तुरंत सिंचाई की आवश्यकता है। प्रति सत्र 40-50mm पानी दें, सुबह 5-7 बजे सिंचाई करें। ' + temp + '°C तापमान में ड्रिप सिंचाई सबसे कुशल है — यह 30-40% पानी बचाती है। हर 3-4 दिन में सिंचाई करें।' : 'आज सिंचाई की आवश्यकता नहीं है। मिट्टी की नमी ' + humidity + '% पर्याप्त है। 2 दिन बाद दोबारा जांचें।'}`,
      ta: `உங்கள் செயற்கைக்கோள் தரவின்படி (NDVI=${ndvi}, ஈரப்பதம்=${humidity}%), ${irrigationNeeded ? 'உடனடி நீர்ப்பாசனம் தேவை. ஒவ்வொரு அமர்விலும் 40-50mm தண்ணீர் கொடுங்கள், காலை 5-7 மணிக்கு நீர்ப்பாசனம் செய்யுங்கள். சொட்டு நீர்ப்பாசனம் 30-40% தண்ணீரை மிச்சப்படுத்தும்.' : 'இன்று நீர்ப்பாசனம் தேவையில்லை. மண் ஈரப்பதம் ' + humidity + '% போதுமானது. 2 நாட்களில் மீண்டும் சரிபார்க்கவும்.'}`
    },
    diseas: {
      en: `Your NDVI of ${ndvi} indicates ${ndviStatus} vegetation health. ${humidity > 75 ? 'WARNING: High humidity (' + humidity + '%) combined with temperature ' + temp + '°C creates HIGH disease risk. Immediately inspect crops for fungal symptoms — look for yellowing leaves, brown spots, white powder (powdery mildew), or dark lesions. Apply copper-based fungicide (Bordeaux mixture 1%) preventively. Remove infected plant material. Improve field drainage and air circulation.' : 'Disease risk is currently LOW to MODERATE. Continue regular monitoring every 3 days. Watch for early warning signs like leaf curl, color change, or stunted growth. Maintain proper plant spacing for air circulation.'}`,
      hi: `आपका NDVI ${ndvi} ${ndviStatus} वनस्पति स्वास्थ्य दर्शाता है। ${humidity > 75 ? 'चेतावनी: उच्च आर्द्रता (' + humidity + '%) और तापमान ' + temp + '°C से रोग का उच्च खतरा है। तुरंत फसल की जांच करें — पीले पत्ते, भूरे धब्बे, सफेद पाउडर या काले घाव देखें। तांबे आधारित कवकनाशी (बोर्डो मिश्रण 1%) लगाएं।' : 'रोग का खतरा कम है। हर 3 दिन में निगरानी जारी रखें।'}`,
      ta: `உங்கள் NDVI ${ndvi} ${ndviStatus} தாவர ஆரோக்கியத்தை காட்டுகிறது। ${humidity > 75 ? 'எச்சரிக்கை: அதிக ஈரப்பதம் (' + humidity + '%) மற்றும் வெப்பநிலை ' + temp + '°C நோய் அபாயத்தை அதிகரிக்கிறது। உடனடியாக பயிர்களை பரிசோதிக்கவும். செம்பு அடிப்படையிலான பூஞ்சைக் கொல்லியை தெளிக்கவும்.' : 'நோய் அபாயம் குறைவாக உள்ளது. ஒவ்வொரு 3 நாட்களுக்கும் கண்காணிப்பை தொடரவும்.'}`
    },
    fertil: {
      en: `With NDVI=${ndvi} (${ndviStatus} vegetation), here are fertilizer recommendations: ${ndvi < 0.3 ? 'URGENT — Apply Urea (46-0-0) at 50kg/acre immediately for nitrogen boost. Follow with DAP (18-46-0) at 25kg/acre after 10 days. Add micronutrients: Zinc Sulphate 5kg/acre and Boron 1kg/acre. Consider foliar spray of 2% Urea solution for quick green-up.' : ndvi < 0.5 ? 'Apply balanced NPK 19-19-19 at 30kg/acre. Add Potassium Sulphate 15kg/acre for fruit/grain quality. Micronutrient mix spray every 15 days. Monitor NDVI weekly.' : 'Vegetation is healthy. Maintain current fertilizer schedule. Apply top-dressing of Urea 20kg/acre if needed. Focus on Potassium for grain filling stage.'}`,
      hi: `NDVI=${ndvi} (${ndviStatus}) के साथ उर्वरक सिफारिशें: ${ndvi < 0.3 ? 'तत्काल — यूरिया (46-0-0) 50 किग्रा/एकड़ तुरंत डालें। 10 दिन बाद DAP 25 किग्रा/एकड़ डालें। जिंक सल्फेट 5 किग्रा/एकड़ और बोरॉन 1 किग्रा/एकड़ जोड़ें।' : ndvi < 0.5 ? 'संतुलित NPK 19-19-19, 30 किग्रा/एकड़ डालें। पोटेशियम सल्फेट 15 किग्रा/एकड़ डालें।' : 'वनस्पति स्वस्थ है। वर्तमान उर्वरक कार्यक्रम बनाए रखें।'}`,
      ta: `NDVI=${ndvi} (${ndviStatus}) உடன் உர பரிந்துரைகள்: ${ndvi < 0.3 ? 'அவசரம் — யூரியா (46-0-0) 50 கிலோ/ஏக்கர் உடனடியாக இடுங்கள். 10 நாட்கள் பிறகு DAP 25 கிலோ/ஏக்கர். துத்தநாக சல்பேட் 5 கிலோ/ஏக்கர் சேர்க்கவும்.' : ndvi < 0.5 ? 'சமச்சீர் NPK 19-19-19, 30 கிலோ/ஏக்கர் இடுங்கள்.' : 'தாவரங்கள் ஆரோக்கியமாக உள்ளன. தற்போதைய உர அட்டவணையை பராமரிக்கவும்.'}`
    },
    harvest: {
      en: `Based on NDVI trend analysis (current NDVI=${ndvi}): ${ndvi > 0.5 ? 'Crops are in active growth phase. Based on satellite data and seasonal patterns, harvest is estimated in 45-75 days. Monitor NDVI weekly — when it starts declining from peak, harvest is approaching within 2-3 weeks. Key indicators: grain hardness test, moisture content below 20%, leaf color turning yellow-brown.' : 'Vegetation stress detected. Harvest timeline may be delayed by 2-3 weeks. Focus on recovery through proper irrigation and fertilization before estimating harvest date. Current NDVI needs to reach 0.6+ for optimal yield.'}`,
      hi: `NDVI ट्रेंड विश्लेषण (वर्तमान NDVI=${ndvi}): ${ndvi > 0.5 ? 'फसलें सक्रिय विकास चरण में हैं। कटाई 45-75 दिनों में अनुमानित है। जब NDVI शीर्ष से घटने लगे, 2-3 सप्ताह में कटाई होगी।' : 'वनस्पति तनाव पाया गया। कटाई 2-3 सप्ताह देरी हो सकती है।'}`,
      ta: `NDVI போக்கு பகுப்பாய்வு (தற்போதைய NDVI=${ndvi}): ${ndvi > 0.5 ? 'பயிர்கள் செயலில் வளர்ச்சி கட்டத்தில் உள்ளன. அறுவடை 45-75 நாட்களில் மதிப்பிடப்படுகிறது.' : 'தாவர அழுத்தம் கண்டறியப்பட்டது. அறுவடை 2-3 வாரங்கள் தாமதமாகலாம்.'}`
    },
    ndvi: {
      en: `NDVI (Normalized Difference Vegetation Index) measures plant health using Sentinel-2 satellite bands. Your current NDVI is ${ndvi}, indicating ${ndviStatus} vegetation. Scale: 0-0.2 = bare soil/urban, 0.2-0.4 = sparse vegetation, 0.4-0.6 = moderate crops, 0.6-0.9 = dense healthy crops. Your ${ndvi} means ${ndvi > 0.6 ? 'crops are thriving with dense green canopy — excellent photosynthesis activity' : ndvi > 0.4 ? 'crops are growing moderately — some areas may need attention' : 'vegetation is stressed — immediate intervention required'}. Monitor weekly and aim for NDVI above 0.6 for optimal yield.`,
      hi: `NDVI (नॉर्मलाइज्ड डिफरेंस वेजिटेशन इंडेक्स) सेंटिनल-2 उपग्रह से पौधों के स्वास्थ्य को मापता है। आपका NDVI ${ndvi} है जो ${ndviStatus} वनस्पति दर्शाता है। स्केल: 0-0.2 = नंगी मिट्टी, 0.2-0.4 = विरल, 0.4-0.6 = मध्यम, 0.6-0.9 = घनी स्वस्थ फसल।`,
      ta: `NDVI (நார்மலைஸ்டு டிஃபரன்ஸ் வெஜிடேஷன் இன்டெக்ஸ்) செண்டினல்-2 மூலம் தாவர ஆரோக்கியத்தை அளவிடுகிறது. உங்கள் NDVI ${ndvi} ஆகும், இது ${ndviStatus} தாவர நிலையை காட்டுகிறது।`
    }
  }

  // Match question to topic
  let topic = 'ndvi'
  if (q.includes('irrigat') || q.includes('water') || q.includes('सिंचाई') || q.includes('நீர்')) topic = 'irrigat'
  else if (q.includes('diseas') || q.includes('pest') || q.includes('रोग') || q.includes('நோய்')) topic = 'diseas'
  else if (q.includes('fertil') || q.includes('उर्वरक') || q.includes('உரம்')) topic = 'fertil'
  else if (q.includes('harvest') || q.includes('कटाई') || q.includes('அறுவடை')) topic = 'harvest'
  else if (q.includes('ndvi') || q.includes('vegetation') || q.includes('वनस्पति')) topic = 'ndvi'
  else {
    // Generic response
    const generic: Record<string, string> = {
      en: `Based on your satellite data (NDVI=${ndvi}, Temperature=${temp}°C, Humidity=${humidity}%): Your vegetation health is ${ndviStatus}. Key recommendations: ${ndvi < 0.4 ? '1) Apply fertilizer immediately 2) Check irrigation schedule 3) Inspect for diseases' : '1) Maintain current practices 2) Monitor weekly 3) Prepare for harvest'}. The NDVI trend shows ${ndvi > 0.5 ? 'positive growth momentum' : 'stress that needs attention'}. For specific advice, ask about irrigation, disease, fertilizer, or harvest timing.`,
      hi: `आपके उपग्रह डेटा के आधार पर (NDVI=${ndvi}, तापमान=${temp}°C, आर्द्रता=${humidity}%): वनस्पति स्वास्थ्य ${ndvi > 0.6 ? 'उत्कृष्ट' : ndvi > 0.4 ? 'मध्यम' : 'कम'} है। मुख्य सिफारिशें: ${ndvi < 0.4 ? '1) तुरंत उर्वरक डालें 2) सिंचाई कार्यक्रम जांचें 3) रोगों की जांच करें' : '1) वर्तमान प्रथाओं को बनाए रखें 2) साप्ताहिक निगरानी करें 3) कटाई की तैयारी करें'}। NDVI प्रवृत्ति ${ndvi > 0.5 ? 'सकारात्मक वृद्धि दर्शाती है' : 'तनाव दर्शाती है जिस पर ध्यान देना जरूरी है'}। सिंचाई, रोग, उर्वरक या कटाई के बारे में विशिष्ट प्रश्न पूछें।`,
      ta: `உங்கள் செயற்கைக்கோள் தரவின்படி (NDVI=${ndvi}, வெப்பநிலை=${temp}°C, ஈரப்பதம்=${humidity}%): தாவர ஆரோக்கியம் ${ndvi > 0.6 ? 'சிறப்பானது' : ndvi > 0.4 ? 'மிதமானது' : 'குறைவானது'}. முக்கிய பரிந்துரைகள்: ${ndvi < 0.4 ? '1) உடனடியாக உரம் இடுங்கள் 2) நீர்ப்பாசன அட்டவணை சரிபார்க்கவும் 3) நோய்களை ஆய்வு செய்யவும்' : '1) தற்போதைய நடைமுறைகளை பராமரிக்கவும் 2) வாராந்திர கண்காணிப்பு 3) அறுவடைக்கு தயாரிக்கவும்'}. NDVI போக்கு ${ndvi > 0.5 ? 'நேர்மறையான வளர்ச்சியை காட்டுகிறது' : 'கவனம் தேவைப்படும் அழுத்தத்தை காட்டுகிறது'}. நீர்ப்பாசனம், நோய், உரம் அல்லது அறுவடை நேரம் பற்றி கேளுங்கள்।`,
    }
    return generic[lang] || generic['en']
  }

  const topicAnswers = answers[topic]
  if (topicAnswers) {
    return topicAnswers[lang] || topicAnswers['en']
  }

  return lang === 'hi' ? 'कृपया सिंचाई, रोग, उर्वरक या कटाई के बारे में पूछें।'
    : lang === 'ta' ? 'நீர்ப்பாசனம், நோய், உரம் அல்லது அறுவடை பற்றி கேளுங்கள்.'
    : 'Please ask about irrigation, disease, fertilizer, or harvest timing.'
}

router.post('/ask', async (req, res) => {
  try {
    const { question, context, lang } = req.body
    const apiKey = process.env.GEMINI_API_KEY

    // Try Gemini first
    if (apiKey && !apiKey.includes('PLACEHOLDER') && !apiKey.includes('YOUR_')) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `You are KISAN AI, expert agricultural scientist. Satellite data: ${context}. Question: ${question}. ${lang === 'hi' ? 'Answer in Hindi.' : lang === 'ta' ? 'Answer in Tamil.' : 'Answer in English.'} Give detailed expert answer with specific quantities and actionable advice in 5-6 sentences.` }] }],
              generationConfig: { maxOutputTokens: 800, temperature: 0.7 }
            })
          }
        )
        const data = await response.json() as any
        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (answer) return res.json({ answer })
      } catch(e) {
        console.log('Gemini failed, using smart fallback')
      }
    }

    // Smart rule-based fallback
    const answer = getSmartAnswer(question, context, lang || 'en')
    res.json({ answer })

  } catch (err: any) {
    console.error('Chat error:', err.message)
    const fallback = getSmartAnswer(req.body?.question || '', req.body?.context || '', req.body?.lang || 'en')
    res.json({ answer: fallback })
  }
})


router.post('/groq', async (req: any, res: any) => {
  try {
    const { question, context, lang } = req.body
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY not set in .env' })
    const systemPrompt = lang === 'ta'
      ? 'You are KISAN AI, expert agricultural scientist. Reply in Tamil. Give detailed farming advice.'
      : lang === 'hi'
      ? 'You are KISAN AI, expert agricultural scientist. Reply in Hindi. Give detailed farming advice.'
      : 'You are KISAN AI, an expert agricultural scientist specializing in Indian farming, crops, soil science, and satellite remote sensing. Give comprehensive, detailed, actionable advice with specific quantities, product names, and timelines relevant to Indian agriculture.'
    const userPrompt = context ? 'Farm data: ' + context + ' | Question: ' + question : question
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1200,
        temperature: 0.7
      })
    })
    const data = await response.json() as any
    if (data.error) return res.status(500).json({ error: data.error.message })
    const answer = data.choices?.[0]?.message?.content
    res.json({ answer: answer || 'No response from Groq' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
