import { useState } from 'react'

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', native: 'اردو', flag: '🇵🇰' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली', flag: '🇳🇵' },
  { code: 'si', name: 'Sinhala', native: 'සිංහල', flag: '🇱🇰' },
  { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇵🇹' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili', flag: '🇰🇪' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩' },
]

const INTRO_TEXT: Record<string, { team: string; presents: string; tagline: string; tags: string[] }> = {
  en: { team: 'TEAM', presents: 'PRESENTS', tagline: 'Satellite Intelligence for Modern Agriculture', tags: ['🛰️ Sentinel-2', '🌿 NDVI Analysis', '🤖 AI Advisory', '📱 WhatsApp Alerts'] },
  hi: { team: 'टीम', presents: 'प्रस्तुत करती है', tagline: 'आधुनिक कृषि के लिए उपग्रह बुद्धिमत्ता', tags: ['🛰️ सेंटिनल-2', '🌿 NDVI विश्लेषण', '🤖 AI सलाह', '📱 व्हाट्सएप अलर्ट'] },
  ta: { team: 'குழு', presents: 'அறிமுகப்படுத்துகிறது', tagline: 'நவீன விவசாயத்திற்கான செயற்கைக்கோள் நுண்ணறிவு', tags: ['🛰️ செண்டினல்-2', '🌿 NDVI பகுப்பாய்வு', '🤖 AI ஆலோசனை', '📱 வாட்ஸ்அப் அலர்ட்'] },
  te: { team: 'జట్టు', presents: 'సమర్పిస్తోంది', tagline: 'ఆధునిక వ్యవసాయానికి ఉపగ్రహ మేధస్సు', tags: ['🛰️ సెంటినల్-2', '🌿 NDVI విశ్లేషణ', '🤖 AI సలహా', '📱 వాట్సాప్ హెచ్చరికలు'] },
  kn: { team: 'ತಂಡ', presents: 'ಪ್ರಸ್ತುತಪಡಿಸುತ್ತದೆ', tagline: 'ಆಧುನಿಕ ಕೃಷಿಗಾಗಿ ಉಪಗ್ರಹ ಬುದ್ಧಿಮತ್ತೆ', tags: ['🛰️ ಸೆಂಟಿನಲ್-2', '🌿 NDVI ವಿಶ್ಲೇಷಣೆ', '🤖 AI ಸಲಹೆ', '📱 ವಾಟ್ಸಾಪ್ ಎಚ್ಚರಿಕೆ'] },
  ml: { team: 'ടീം', presents: 'അവതരിപ്പിക്കുന്നു', tagline: 'ആധുനിക കൃഷിക്കായി ഉപഗ്രഹ ബുദ്ധി', tags: ['🛰️ സെന്റിനൽ-2', '🌿 NDVI വിശകലനം', '🤖 AI ഉപദേശം', '📱 വാട്സ്ആപ്പ് അലർട്ട്'] },
  mr: { team: 'टीम', presents: 'सादर करते', tagline: 'आधुनिक शेतीसाठी उपग्रह बुद्धिमत्ता', tags: ['🛰️ सेंटिनेल-2', '🌿 NDVI विश्लेषण', '🤖 AI सल्ला', '📱 व्हाट्सअॅप सूचना'] },
  gu: { team: 'ટીમ', presents: 'રજૂ કરે છે', tagline: 'આધુનિક કૃષિ માટે ઉપગ્રહ બુદ્ધિ', tags: ['🛰️ સેન્ટિનેલ-2', '🌿 NDVI વિશ્લેષણ', '🤖 AI સલાહ', '📱 વ્હોટ્સએપ એલર્ટ'] },
  pa: { team: 'ਟੀਮ', presents: 'ਪੇਸ਼ ਕਰਦੀ ਹੈ', tagline: 'ਆਧੁਨਿਕ ਖੇਤੀ ਲਈ ਸੈਟੇਲਾਈਟ ਬੁੱਧੀ', tags: ['🛰️ ਸੈਂਟੀਨਲ-2', '🌿 NDVI ਵਿਸ਼ਲੇਸ਼ਣ', '🤖 AI ਸਲਾਹ', '📱 ਵਟਸਐਪ ਅਲਰਟ'] },
  bn: { team: 'দল', presents: 'উপস্থাপন করছে', tagline: 'আধুনিক কৃষির জন্য স্যাটেলাইট বুদ্ধিমত্তা', tags: ['🛰️ সেন্টিনেল-2', '🌿 NDVI বিশ্লেষণ', '🤖 AI পরামর্শ', '📱 হোয়াটসঅ্যাপ সতর্কতা'] },
  or: { team: 'ଦଳ', presents: 'ଉପସ୍ଥାପନ କରୁଛି', tagline: 'ଆଧୁନିକ କୃଷି ପାଇଁ ଉପଗ୍ରହ ବୁଦ୍ଧି', tags: ['🛰️ ସେଣ୍ଟିନେଲ-2', '🌿 NDVI ବିଶ୍ଳେଷଣ', '🤖 AI ପରାମର୍ଶ', '📱 ହ୍ୱାଟ୍ସଆପ ସତର୍କତା'] },
  as: { team: 'দল', presents: 'উপস্থাপন কৰিছে', tagline: 'আধুনিক কৃষিৰ বাবে উপগ্ৰহ বুদ্ধিমত্তা', tags: ['🛰️ চেণ্টিনেল-2', '🌿 NDVI বিশ্লেষণ', '🤖 AI পৰামৰ্শ', '📱 হোৱাটচএপ সতৰ্কতা'] },
  ur: { team: 'ٹیم', presents: 'پیش کرتی ہے', tagline: 'جدید زراعت کے لیے سیٹلائٹ ذہانت', tags: ['🛰️ سینٹینل-2', '🌿 NDVI تجزیہ', '🤖 AI مشاورت', '📱 واٹس ایپ الرٹ'] },
  ne: { team: 'टोली', presents: 'प्रस्तुत गर्दछ', tagline: 'आधुनिक कृषिका लागि उपग्रह बुद्धिमत्ता', tags: ['🛰️ सेन्टिनल-2', '🌿 NDVI विश्लेषण', '🤖 AI सल्लाह', '📱 ह्वाट्सएप अलर्ट'] },
  si: { team: 'කණ්ඩායම', presents: 'ඉදිරිපත් කරයි', tagline: 'නවීන කෘෂිකර්මය සඳහා චන්ද්‍රිකා බුද්ධිය', tags: ['🛰️ සෙන්ටිනල්-2', '🌿 NDVI විශ්ලේෂණය', '🤖 AI උපදේශනය', '📱 WhatsApp ඇඟවීම්'] },
  zh: { team: '团队', presents: '荣誉出品', tagline: '面向现代农业的卫星智能', tags: ['🛰️ 哨兵-2', '🌿 NDVI分析', '🤖 AI建议', '📱 WhatsApp提醒'] },
  ar: { team: 'فريق', presents: 'يقدم', tagline: 'ذكاء الأقمار الصناعية للزراعة الحديثة', tags: ['🛰️ سنتينل-2', '🌿 تحليل NDVI', '🤖 نصيحة AI', '📱 تنبيهات واتساب'] },
  fr: { team: 'ÉQUIPE', presents: 'PRÉSENTE', tagline: 'Intelligence Satellite pour l\'Agriculture Moderne', tags: ['🛰️ Sentinel-2', '🌿 Analyse NDVI', '🤖 Conseil IA', '📱 Alertes WhatsApp'] },
  es: { team: 'EQUIPO', presents: 'PRESENTA', tagline: 'Inteligencia Satelital para la Agricultura Moderna', tags: ['🛰️ Sentinel-2', '🌿 Análisis NDVI', '🤖 Consejo IA', '📱 Alertas WhatsApp'] },
  pt: { team: 'EQUIPE', presents: 'APRESENTA', tagline: 'Inteligência Satelital para Agricultura Moderna', tags: ['🛰️ Sentinel-2', '🌿 Análise NDVI', '🤖 Conselho IA', '📱 Alertas WhatsApp'] },
  sw: { team: 'TIMU', presents: 'INAWASILISHA', tagline: 'Akili ya Satelaiti kwa Kilimo cha Kisasa', tags: ['🛰️ Sentinel-2', '🌿 Uchambuzi NDVI', '🤖 Ushauri wa AI', '📱 Arifa za WhatsApp'] },
  id: { team: 'TIM', presents: 'MEMPERSEMBAHKAN', tagline: 'Kecerdasan Satelit untuk Pertanian Modern', tags: ['🛰️ Sentinel-2', '🌿 Analisis NDVI', '🤖 Saran AI', '📱 Peringatan WhatsApp'] },
}

interface Props {
  onSelect: (lang: string, text: typeof INTRO_TEXT['en']) => void
}

export { INTRO_TEXT, LANGUAGES }

export default function LanguagePicker({ onSelect }: Props) {
  const [selected, setSelected] = useState('en')
  const [search, setSearch] = useState('')

  const filtered = LANGUAGES.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.native.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999, background: '#000',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, Arial, sans-serif'
    }}>
      {/* Animated grid bg */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(74,222,128,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.04) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', width: '100%', maxWidth: '700px', padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌾</div>
          <h1 style={{ color: '#4ade80', fontSize: '28px', fontWeight: 900, margin: '0 0 8px', letterSpacing: '0.05em' }}>KISAN-VISION</h1>
          <p style={{ color: '#365f45', fontSize: '14px', margin: 0 }}>Select your language to continue</p>
          <p style={{ color: '#1f2d1f', fontSize: '12px', margin: '4px 0 0' }}>अपनी भाषा चुनें · உங்கள் மொழியை தேர்ந்தெடுக்கவும் · మీ భాషను ఎంచుకోండి</p>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search language..."
          style={{
            width: '100%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(74,222,128,0.3)',
            borderRadius: '12px', padding: '12px 16px', color: '#f0fdf4', fontSize: '14px',
            outline: 'none', marginBottom: '20px', boxSizing: 'border-box'
          }}
        />

        {/* Language grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
          maxHeight: '360px', overflowY: 'auto', marginBottom: '24px',
          paddingRight: '4px'
        }}>
          {filtered.map(lang => (
            <button
              key={lang.code}
              onClick={() => setSelected(lang.code)}
              style={{
                background: selected === lang.code ? 'rgba(22,101,52,0.6)' : 'rgba(0,0,0,0.5)',
                border: `1px solid ${selected === lang.code ? 'rgba(74,222,128,0.6)' : 'rgba(74,222,128,0.15)'}`,
                borderRadius: '12px', padding: '12px 10px', cursor: 'pointer',
                transition: 'all 0.2s', textAlign: 'left',
                boxShadow: selected === lang.code ? '0 0 20px rgba(74,222,128,0.2)' : 'none'
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{lang.flag}</div>
              <div style={{ color: '#f0fdf4', fontSize: '13px', fontWeight: 700 }}>{lang.native}</div>
              <div style={{ color: '#365f45', fontSize: '11px' }}>{lang.name}</div>
            </button>
          ))}
        </div>

        {/* Continue button */}
        <button
          onClick={() => onSelect(selected, INTRO_TEXT[selected] || INTRO_TEXT['en'])}
          style={{
            width: '100%', background: 'linear-gradient(135deg, #16a34a, #065f46)',
            color: '#fff', border: 'none', borderRadius: '14px', padding: '16px',
            fontSize: '16px', fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 4px 30px rgba(22,163,74,0.4)', letterSpacing: '0.05em'
          }}
        >
          ✅ Continue in {LANGUAGES.find(l => l.code === selected)?.native || 'English'} →
        </button>
      </div>
    </div>
  )
}
