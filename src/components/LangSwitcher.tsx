import { useLang } from '../context/LanguageContext'

export default function LangSwitcher() {
  const { lang, setLang } = useLang()
  return (
    <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px', padding: '4px' }}>
      {(['en', 'hi', 'ta'] as const).map(l => (
        <button key={l} onClick={() => setLang(l)} style={{
          padding: '4px 10px', borderRadius: '7px', fontSize: '12px', fontWeight: 700,
          cursor: 'pointer', border: 'none',
          background: lang === l ? '#16a34a' : 'transparent',
          color: lang === l ? '#fff' : '#4ade80', transition: 'all 0.2s'
        }}>
          {l === 'en' ? 'EN' : l === 'hi' ? 'हि' : 'த'}
        </button>
      ))}
    </div>
  )
}
