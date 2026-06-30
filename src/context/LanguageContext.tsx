/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, ReactNode } from 'react'

export type Lang = 'en' | 'hi' | 'ta'

const TRANSLATIONS = {
  en: {
    // Nav
    login: 'Login',
    getStarted: 'Get Started',
    satellite: '🛰️ Satellite',
    myLands: '🗺️ My Lands',
    registerLand: '➕ Register Land',
    dashboard: '🌾 Dashboard',
    logout: 'Logout',
    // Landing
    heroTitle: 'Satellite Intelligence for Indian Farmers',
    heroSub: 'Real-time crop monitoring, disease detection & AI advisory — powered by Sentinel-2',
    startFree: 'Start Free →',
    watchDemo: 'Watch Demo',
    // Features
    features: 'Everything a farmer needs',
    featTitle1: 'Live Satellite Data', featDesc1: 'Real-time NDVI, NDWI & EVI from Sentinel-2 satellite imagery',
    featTitle2: '3D Globe Explorer', featDesc2: 'Interactive 3D globe — click anywhere to analyze crop health',
    featTitle3: 'AI Crop Assistant', featDesc3: 'Ask KISAN AI anything about your crops in your language',
    featTitle4: 'Disease Detection', featDesc4: 'Upload crop photos for instant AI disease identification',
    featTitle5: 'WhatsApp Alerts', featDesc5: 'Daily crop health reports via WhatsApp and Email',
    featTitle6: '6-Month Trends', featDesc6: 'Track NDVI vegetation health over 6 months',
    featTitle7: 'Smart Irrigation', featDesc7: 'AI irrigation advisory based on satellite moisture data',
    featTitle8: 'Crop Calendar', featDesc8: 'Season-aware crop type estimation',
    // Dashboard
    cropDetection: 'Crop Disease Detection',
    cropDetectionSub: 'Upload a crop image for instant AI diagnosis',
    chooseImage: '📷 Choose Crop Image',
    changeImage: '📷 Change Image',
    analyzeCrop: '🔍 Analyze Crop',
    analyzing: '🔍 Scanning with AI...',
    cropType: '🌾 CROP TYPE',
    disease: '🦠 DISEASE',
    symptoms: '⚠️ SYMPTOMS',
    treatment: '💊 TREATMENT',
    prevention: '🛡️ PREVENTION',
    // Satellite
    satelliteTitle: 'Satellite Intelligence',
    satelliteSub: 'Click any location on the globe · Get instant NDVI, SAR, weather & crop analysis',
    selectLocation: '📍 SELECT LOCATION',
    country: '— Country —',
    state: '— State —',
    city: '— District / City —',
    registerThisLand: '➕ Register This Land',
    aiAdvisory: '💡 AI ADVISORY',
    askAI: 'Ask about your crops...',
    // AI Girl
    aiGreet: "Hello! I'm KISAN AI 🌾 Select a location on the globe or map and I'll analyze your land with satellite data!",
    aiWhen: 'When to irrigate?',
    aiDisease: 'Disease risk?',
    aiFertilizer: 'Best fertilizer?',
    aiHarvest: 'Harvest date?',
    // Land Map
    drawLand: 'Draw Your Land',
    farmerName: 'Farmer Name',
    phone: 'WhatsApp Number',
    email: 'Email Address',
    landName: 'Land Name (optional)',
    cropTypeLand: 'Crop Type (optional)',
    registerMyLand: '🌾 Register My Land',
    registrationSuccess: '✅ Land Registered!',
    // Email/WhatsApp
    emailSubject: '✅ Land Registration Confirmed — KISAN-VISION',
    emailGreeting: 'Dear',
    emailConfirm: 'your land has been successfully registered.',
    dailyReportTitle: 'Daily Farm Report',
    // Login
    signIn: 'Sign in to your account',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Password',
    loginBtn: 'Login',
    noAccount: "Don't have an account?",
    registerLink: 'Register',
    invalidLogin: 'Invalid email or password',
    // Register
    createAccount: 'Create your account',
    namePlaceholder: 'Full Name',
    confirmPassword: 'Confirm Password',
    registerBtn: 'Create Account',
    hasAccount: 'Already have an account?',
    loginLink: 'Login',
    passwordMismatch: 'Passwords do not match',
  },
  hi: {
    login: 'लॉगिन',
    getStarted: 'शुरू करें',
    satellite: '🛰️ उपग्रह',
    myLands: '🗺️ मेरी जमीन',
    registerLand: '➕ जमीन दर्ज करें',
    dashboard: '🌾 डैशबोर्ड',
    logout: 'लॉगआउट',
    heroTitle: 'भारतीय किसानों के लिए उपग्रह तकनीक',
    heroSub: 'सेंटिनल-2 द्वारा संचालित — रियल-टाइम फसल निगरानी, रोग पहचान और AI सलाह',
    startFree: 'मुफ्त शुरू करें →',
    watchDemo: 'डेमो देखें',
    features: 'किसान की हर जरूरत',
    featTitle1: 'लाइव सैटेलाइट डेटा', featDesc1: 'सेंटिनल-2 से रियल-टाइम NDVI, NDWI और EVI',
    featTitle2: '3D ग्लोब एक्सप्लोरर', featDesc2: 'इंटरेक्टिव 3D ग्लोब — कहीं भी क्लिक करके फसल स्वास्थ्य जांचें',
    featTitle3: 'AI फसल सहायक', featDesc3: 'KISAN AI से अपनी भाषा में फसल के बारे में पूछें',
    featTitle4: 'रोग पहचान', featDesc4: 'फसल की फोटो अपलोड करें — तुरंत AI रोग पहचान',
    featTitle5: 'WhatsApp अलर्ट', featDesc5: 'WhatsApp और Email पर दैनिक फसल स्वास्थ्य रिपोर्ट',
    featTitle6: '6 महीने का ट्रेंड', featDesc6: '6 महीने में NDVI वनस्पति स्वास्थ्य ट्रैक करें',
    featTitle7: 'स्मार्ट सिंचाई', featDesc7: 'उपग्रह नमी डेटा पर आधारित AI सिंचाई सलाह',
    featTitle8: 'फसल कैलेंडर', featDesc8: 'मौसम-आधारित फसल प्रकार अनुमान',
    cropDetection: 'फसल रोग पहचान',
    cropDetectionSub: 'तत्काल AI निदान के लिए फसल की फोटो अपलोड करें',
    chooseImage: '📷 फसल फोटो चुनें',
    changeImage: '📷 फोटो बदलें',
    analyzeCrop: '🔍 फसल विश्लेषण करें',
    analyzing: '🔍 AI से स्कैन हो रहा है...',
    cropType: '🌾 फसल प्रकार',
    disease: '🦠 रोग',
    symptoms: '⚠️ लक्षण',
    treatment: '💊 उपचार',
    prevention: '🛡️ बचाव',
    satelliteTitle: 'उपग्रह विश्लेषण',
    satelliteSub: 'ग्लोब पर कोई भी स्थान क्लिक करें — तुरंत NDVI, SAR, मौसम और फसल विश्लेषण',
    selectLocation: '📍 स्थान चुनें',
    country: '— देश —',
    state: '— राज्य —',
    city: '— जिला / शहर —',
    registerThisLand: '➕ यह जमीन दर्ज करें',
    aiAdvisory: '💡 AI सलाह',
    askAI: 'अपनी फसल के बारे में पूछें...',
    aiGreet: 'नमस्ते! मैं KISAN AI हूं 🌾 ग्लोब पर कोई स्थान चुनें और मैं आपकी जमीन का उपग्रह विश्लेषण करूंगा!',
    aiWhen: 'कब सिंचाई करें?',
    aiDisease: 'रोग का खतरा?',
    aiFertilizer: 'सबसे अच्छा उर्वरक?',
    aiHarvest: 'कटाई की तारीख?',
    drawLand: 'अपनी जमीन बनाएं',
    farmerName: 'किसान का नाम',
    phone: 'WhatsApp नंबर',
    email: 'ईमेल पता',
    landName: 'जमीन का नाम (वैकल्पिक)',
    cropTypeLand: 'फसल प्रकार (वैकल्पिक)',
    registerMyLand: '🌾 मेरी जमीन दर्ज करें',
    registrationSuccess: '✅ जमीन दर्ज हो गई!',
    emailSubject: '✅ जमीन पंजीकरण की पुष्टि — KISAN-VISION',
    emailGreeting: 'प्रिय',
    emailConfirm: 'आपकी जमीन सफलतापूर्वक दर्ज हो गई है।',
    dailyReportTitle: 'दैनिक खेत रिपोर्ट',
    signIn: 'अपने खाते में साइन इन करें',
    emailPlaceholder: 'ईमेल',
    passwordPlaceholder: 'पासवर्ड',
    loginBtn: 'लॉगिन',
    noAccount: 'खाता नहीं है?',
    registerLink: 'पंजीकरण करें',
    invalidLogin: 'गलत ईमेल या पासवर्ड',
    createAccount: 'अपना खाता बनाएं',
    namePlaceholder: 'पूरा नाम',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    registerBtn: 'खाता बनाएं',
    hasAccount: 'पहले से खाता है?',
    loginLink: 'लॉगिन',
    passwordMismatch: 'पासवर्ड मेल नहीं खाते',
  },
  ta: {
    login: 'உள்நுழைவு',
    getStarted: 'தொடங்கு',
    satellite: '🛰️ செயற்கைக்கோள்',
    myLands: '🗺️ என் நிலங்கள்',
    registerLand: '➕ நிலம் பதிவு',
    dashboard: '🌾 டாஷ்போர்டு',
    logout: 'வெளியேறு',
    heroTitle: 'இந்திய விவசாயிகளுக்கான செயற்கைக்கோள் தொழில்நுட்பம்',
    heroSub: 'செண்டினல்-2 மூலம் — நேரடி பயிர் கண்காணிப்பு, நோய் கண்டறிதல் மற்றும் AI ஆலோசனை',
    startFree: 'இலவசமாக தொடங்கு →',
    watchDemo: 'டெமோ பார்க்கவும்',
    features: 'விவசாயிக்கு தேவையான அனைத்தும்',
    featTitle1: 'நேரடி செயற்கைக்கோள் தரவு', featDesc1: 'செண்டினல்-2 இலிருந்து நேரடி NDVI, NDWI மற்றும் EVI',
    featTitle2: '3D கோளம் ஆய்வாளர்', featDesc2: 'எங்கும் கிளிக் செய்து பயிர் ஆரோக்கியம் பரிசோதிக்கவும்',
    featTitle3: 'AI பயிர் உதவியாளர்', featDesc3: 'KISAN AI யிடம் உங்கள் மொழியில் கேளுங்கள்',
    featTitle4: 'நோய் கண்டறிதல்', featDesc4: 'பயிர் புகைப்படம் பதிவேற்றி உடனடி AI நோய் கண்டறிதல்',
    featTitle5: 'WhatsApp அலர்ட்', featDesc5: 'WhatsApp மற்றும் Email வழியாக தினசரி பயிர் ஆரோக்கிய அறிக்கை',
    featTitle6: '6 மாத போக்கு', featDesc6: '6 மாதங்களில் NDVI தாவர ஆரோக்கியத்தை கண்காணிக்கவும்',
    featTitle7: 'நுண்ணிய நீர்ப்பாசனம்', featDesc7: 'செயற்கைக்கோள் ஈரப்பதம் தரவின் அடிப்படையில் AI நீர்ப்பாசன ஆலோசனை',
    featTitle8: 'பயிர் காலண்டர்', featDesc8: 'பருவகால பயிர் வகை மதிப்பீடு',
    cropDetection: 'பயிர் நோய் கண்டறிதல்',
    cropDetectionSub: 'உடனடி AI நோயறிதலுக்கு பயிர் படம் பதிவேற்றவும்',
    chooseImage: '📷 பயிர் படம் தேர்ந்தெடு',
    changeImage: '📷 படம் மாற்று',
    analyzeCrop: '🔍 பயிரை பகுப்பாய்வு செய்',
    analyzing: '🔍 AI மூலம் ஸ்கேன் ஆகிறது...',
    cropType: '🌾 பயிர் வகை',
    disease: '🦠 நோய்',
    symptoms: '⚠️ அறிகுறிகள்',
    treatment: '💊 சிகிச்சை',
    prevention: '🛡️ தடுப்பு',
    satelliteTitle: 'செயற்கைக்கோள் பகுப்பாய்வு',
    satelliteSub: 'கோளத்தில் எந்த இடத்திலும் கிளிக் செய்யுங்கள் — உடனடி NDVI, SAR, வானிலை மற்றும் பயிர் பகுப்பாய்வு',
    selectLocation: '📍 இடம் தேர்ந்தெடு',
    country: '— நாடு —',
    state: '— மாநிலம் —',
    city: '— மாவட்டம் / நகரம் —',
    registerThisLand: '➕ இந்த நிலத்தை பதிவு செய்',
    aiAdvisory: '💡 AI ஆலோசனை',
    askAI: 'உங்கள் பயிரைப் பற்றி கேளுங்கள்...',
    aiGreet: 'வணக்கம்! நான் KISAN AI 🌾 கோளத்தில் ஒரு இடத்தை தேர்ந்தெடுங்கள், நான் உங்கள் நிலத்தை செயற்கைக்கோள் மூலம் பகுப்பாய்வு செய்கிறேன்!',
    aiWhen: 'எப்போது நீர்ப்பாசனம்?',
    aiDisease: 'நோய் அபாயம்?',
    aiFertilizer: 'சிறந்த உரம்?',
    aiHarvest: 'அறுவடை தேதி?',
    drawLand: 'உங்கள் நிலத்தை வரையுங்கள்',
    farmerName: 'விவசாயி பெயர்',
    phone: 'WhatsApp எண்',
    email: 'மின்னஞ்சல் முகவரி',
    landName: 'நில பெயர் (விருப்பம்)',
    cropTypeLand: 'பயிர் வகை (விருப்பம்)',
    registerMyLand: '🌾 என் நிலத்தை பதிவு செய்',
    registrationSuccess: '✅ நிலம் பதிவாகிவிட்டது!',
    emailSubject: '✅ நில பதிவு உறுதிப்படுத்தல் — KISAN-VISION',
    emailGreeting: 'அன்பான',
    emailConfirm: 'உங்கள் நிலம் வெற்றிகரமாக பதிவு செய்யப்பட்டது.',
    dailyReportTitle: 'தினசரி வயல் அறிக்கை',
    signIn: 'உங்கள் கணக்கில் உள்நுழையவும்',
    emailPlaceholder: 'மின்னஞ்சல்',
    passwordPlaceholder: 'கடவுச்சொல்',
    loginBtn: 'உள்நுழைவு',
    noAccount: 'கணக்கு இல்லையா?',
    registerLink: 'பதிவு செய்யவும்',
    invalidLogin: 'தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்',
    createAccount: 'உங்கள் கணக்கை உருவாக்கவும்',
    namePlaceholder: 'முழு பெயர்',
    confirmPassword: 'கடவுச்சொல்லை உறுதிப்படுத்தவும்',
    registerBtn: 'கணக்கு உருவாக்கு',
    hasAccount: 'ஏற்கனவே கணக்கு உள்ளதா?',
    loginLink: 'உள்நுழைவு',
    passwordMismatch: 'கடவுச்சொற்கள் பொருந்தவில்லை',
  }
}

type Translations = typeof TRANSLATIONS['en']

interface LangContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: Translations
}

const LangContext = createContext<LangContextType>({
  lang: 'en',
  setLang: () => {},
  t: TRANSLATIONS['en']
})

export function LangProvider({ children }: { children: ReactNode }) {
  const saved = (localStorage.getItem('kisan_lang') || 'en') as Lang
  const [lang, setLangState] = useState<Lang>(saved)

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('kisan_lang', l)
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: TRANSLATIONS[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}

export { TRANSLATIONS }
