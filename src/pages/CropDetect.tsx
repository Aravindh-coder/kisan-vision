import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const COLORS = {
  bg: '#030a03',
  card: 'rgba(5,20,5,0.85)',
  border: 'rgba(74,222,128,0.2)',
  green: '#4ade80',
  greenDark: '#052e16',
  text: '#f0fdf4',
  muted: '#6b7280',
  yellow: '#fbbf24',
}

type HealthStatus = 'HEALTHY' | 'WARNING' | 'SEVERE'

interface CropReport {
  farmerName: string; location: string; cropType: string; cropAge: string
  healthStatus: HealthStatus; healthSummary: string; confidence: number
  problemName: string; affectedArea: string; severity: string
  step1: string; medicineName: string; medicineDose: string
  medicineApplication: string; medicineRepeat: string; step3: string
  futureCropRotation: string; futureSeed: string
}

export default function CropDetect() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [report, setReport] = useState<CropReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [farmerName, setFarmerName] = useState('')
  const [location, setLocation] = useState('')
  const [cropType, setCropType] = useState('')
  const [cropAge, setCropAge] = useState('')

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return }
    setImageFile(file); setReport(null); setError(null)
    const reader = new FileReader()
    reader.onload = e => setImage(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  const analyze = async () => {
    if (!imageFile) return
    if (!cropType.trim()) { setError('Please enter crop type for better accuracy.'); return }
    setLoading(true); setError(null)
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const img = new Image()
        const objUrl = URL.createObjectURL(imageFile)
        img.onload = () => {
          const MAX_DIM = 1280
          let { width, height } = img
          if (width > MAX_DIM || height > MAX_DIM) {
            const scale = MAX_DIM / Math.max(width, height)
            width = Math.round(width * scale)
            height = Math.round(height * scale)
          }
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) { rej(new Error('Canvas not supported')); return }
          ctx.drawImage(img, 0, 0, width, height)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
          URL.revokeObjectURL(objUrl)
          res(dataUrl.split(',')[1])
        }
        img.onerror = () => { URL.revokeObjectURL(objUrl); rej(new Error('Image load failed')) }
        img.src = objUrl
      })
      const response = await fetch('https://kisan-vision.onrender.com/api/crop-detect/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mediaType: 'image/jpeg', farmerName, location, cropType, cropAge })
      })
      if (!response.ok) throw new Error('Server error')
      const parsed = await response.json()
      setReport(parsed)
    } catch(e) { setError('Analysis failed. Please try again with a clearer crop image.'); console.error(e) }
    setLoading(false)
  }

  const downloadPdfReport = async () => {
    if (!report) return
    setDownloading(true)
    try {
      const response = await fetch('https://kisan-vision.onrender.com/api/crop-detect/report-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report })
      })
      if (!response.ok) throw new Error('PDF generation failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `crop-report-${(report.cropType||'report').replace(/\s+/g,'_').toLowerCase()}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError('Could not download PDF. Please try again.')
      console.error(e)
    }
    setDownloading(false)
  }

  const statusColor = (s: HealthStatus) => s==='HEALTHY'?'#4ade80':s==='WARNING'?'#fbbf24':'#ef4444'
  const statusEmoji = (s: HealthStatus) => s==='HEALTHY'?'🟢':s==='WARNING'?'🟡':'🔴'
  const statusBg = (s: HealthStatus) => s==='HEALTHY'?'rgba(74,222,128,0.08)':s==='WARNING'?'rgba(251,191,36,0.08)':'rgba(239,68,68,0.08)'
  const reportId = 'KV-REPORT'
  const statusBorder = (s: HealthStatus) => s==='HEALTHY'?'rgba(74,222,128,0.3)':s==='WARNING'?'rgba(251,191,36,0.3)':'rgba(239,68,68,0.3)'

  return (
    <div style={{minHeight:'100vh',color:COLORS.text,fontFamily:'system-ui,Arial,sans-serif',position:'relative'}}>
      <div style={{position:'fixed',inset:0,zIndex:0,backgroundImage:"url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1920&q=80')",backgroundSize:'cover',backgroundPosition:'center',filter:'brightness(0.3) saturate(0.8)'}}/>
      <div style={{position:'fixed',inset:0,zIndex:1,background:'linear-gradient(to bottom,rgba(1,10,1,0.8),rgba(1,20,5,0.6),rgba(1,10,1,0.9))'}}/>
      <div style={{position:'relative',zIndex:2}}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .ifield{background:rgba(0,0,0,0.4);border:1px solid rgba(74,222,128,0.2);border-radius:10px;padding:10px 14px;color:#f0fdf4;font-size:14px;outline:none;width:100%;box-sizing:border-box;transition:border-color 0.2s}
        .ifield:focus{border-color:rgba(74,222,128,0.6)}
        @media print{nav,.no-print{display:none!important}body{background:white!important;color:black!important}}
      `}</style>

      <nav style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 28px',borderBottom:`1px solid ${COLORS.border}`,background:'rgba(3,10,3,0.95)',backdropFilter:'blur(12px)',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <span style={{fontSize:'20px'}}>🌿</span>
          <span style={{fontWeight:800,fontSize:'16px',color:COLORS.green,letterSpacing:'0.05em'}}>CROP HEALTH INSPECTOR</span>
          <span style={{fontSize:'10px',background:'rgba(74,222,128,0.15)',border:`1px solid ${COLORS.border}`,borderRadius:'6px',padding:'2px 8px',color:COLORS.green}}>AI POWERED</span>
        </div>
        <div style={{display:'flex',gap:'10px'}}>
          <button onClick={()=>navigate('/satellite')} style={{background:'rgba(22,101,52,0.3)',color:COLORS.green,border:`1px solid ${COLORS.border}`,borderRadius:'10px',padding:'7px 16px',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>🛰️ Satellite</button>
          <button onClick={()=>navigate('/dashboard')} style={{background:'rgba(22,101,52,0.3)',color:COLORS.green,border:`1px solid ${COLORS.border}`,borderRadius:'10px',padding:'7px 16px',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>Dashboard</button>
        </div>
      </nav>

      <div style={{maxWidth:'900px',margin:'0 auto',padding:'40px 24px'}}>
        <div style={{textAlign:'center',marginBottom:'40px',animation:'fadeUp 0.5s ease both'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:'8px',background:'rgba(22,101,52,0.2)',border:`1px solid ${COLORS.border}`,borderRadius:'20px',padding:'6px 16px',marginBottom:'16px'}}>
            <span style={{width:'6px',height:'6px',borderRadius:'50%',background:COLORS.green,animation:'pulse 1.5s infinite',display:'inline-block'}}/>
            <span style={{color:COLORS.green,fontSize:'11px',fontWeight:700,letterSpacing:'0.1em'}}>SENTINEL AI · CROP DISEASE DETECTION</span>
          </div>
          <h1 style={{fontSize:'36px',fontWeight:900,margin:'0 0 10px',letterSpacing:'-0.02em'}}>
            Upload a Crop Photo<br/><span style={{color:COLORS.green}}>Get an Instant Health Report</span>
          </h1>
          <p style={{color:COLORS.muted,fontSize:'15px',margin:0}}>AI identifies diseases, pests, and deficiencies — with a full treatment plan</p>
        </div>

        <div style={{animation:'fadeUp 0.5s ease 0.1s both'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4, minmax(0,1fr))',gap:'12px',marginBottom:'20px'}}>
            {[{label:'Farmer Name',val:farmerName,set:setFarmerName,ph:'e.g. Rajan Kumar'},
              {label:'Field Location',val:location,set:setLocation,ph:'e.g. Thanjavur, TN'},
              {label:'Crop Type',val:cropType,set:setCropType,ph:'e.g. Rice, Cotton'},
              {label:'Crop Age',val:cropAge,set:setCropAge,ph:'e.g. 45 days old'}].map(f=>(
              <div key={f.label}>
                <label style={{display:'block',fontSize:'11px',fontWeight:700,color:COLORS.green,marginBottom:'6px',letterSpacing:'0.08em'}}>{f.label.toUpperCase()}</label>
                <input className="ifield" value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}/>
              </div>
            ))}
          </div>

          <div onClick={()=>fileRef.current?.click()} onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)} onDrop={onDrop}
            style={{border:`2px dashed ${dragOver?COLORS.green:COLORS.border}`,borderRadius:'16px',padding:image?'0':'60px 24px',textAlign:'center',cursor:'pointer',background:dragOver?'rgba(74,222,128,0.05)':COLORS.card,transition:'all 0.2s',overflow:'hidden',position:'relative',minHeight:image?'280px':'auto'}}>
            {image ? (
              <>
                <img src={image} alt="crop" style={{width:'100%',maxHeight:'380px',objectFit:'cover',display:'block'}}/>
                <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 60%,rgba(3,10,3,0.9))',pointerEvents:'none'}}/>
                <div style={{position:'absolute',bottom:'16px',left:'50%',transform:'translateX(-50%)',fontSize:'12px',color:COLORS.green,fontWeight:700,whiteSpace:'nowrap'}}>📸 {imageFile?.name} · Click to change</div>
              </>
            ) : (
              <>
                <div style={{fontSize:'48px',marginBottom:'16px'}}>🌿</div>
                <div style={{fontWeight:700,fontSize:'16px',marginBottom:'8px'}}>Drop your crop photo here</div>
                <div style={{color:COLORS.muted,fontSize:'13px',marginBottom:'16px'}}>or click to browse · JPG, PNG, WEBP supported</div>
                <div style={{display:'inline-block',background:'rgba(74,222,128,0.15)',border:`1px solid ${COLORS.border}`,borderRadius:'10px',padding:'8px 20px',fontSize:'13px',fontWeight:700,color:COLORS.green}}>Choose Photo</div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>e.target.files?.[0]&&handleFile(e.target.files[0])}/>

          {image && (
            <button onClick={analyze} disabled={loading} style={{width:'100%',marginTop:'16px',background:loading?'rgba(22,163,74,0.4)':'linear-gradient(135deg,#16a34a,#15803d)',border:'none',borderRadius:'14px',padding:'16px',color:'#fff',fontSize:'16px',fontWeight:800,cursor:loading?'not-allowed':'pointer',letterSpacing:'0.05em',boxShadow:loading?'none':'0 4px 24px rgba(22,163,74,0.3)'}}>
              {loading ? <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px'}}><span style={{display:'inline-block',width:'16px',height:'16px',border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/> Analyzing crop health with AI...</span> : '🔬 Analyze Crop Health'}
            </button>
          )}
          {error && <div style={{marginTop:'12px',padding:'12px 16px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'10px',color:'#ef4444',fontSize:'14px'}}>⚠️ {error}</div>}
        </div>

        {report && (
          <div style={{marginTop:'40px',animation:'fadeUp 0.5s ease both',background:COLORS.card,border:`1px solid ${statusBorder(report.healthStatus)}`,borderRadius:'20px',overflow:'hidden'}}>
            <div style={{background:`linear-gradient(135deg,${COLORS.greenDark},rgba(6,95,70,0.5))`,padding:'24px 28px',borderBottom:`1px solid ${COLORS.border}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'12px'}}>
                <div>
                  <div style={{fontSize:'11px',fontWeight:700,color:COLORS.green,letterSpacing:'0.12em',marginBottom:'6px'}}>📋 CROP HEALTH & TREATMENT REPORT</div>
                  <div style={{fontSize:'22px',fontWeight:900,marginBottom:'4px'}}>{report.cropType}</div>
                  <div style={{color:COLORS.muted,fontSize:'13px'}}>Generated on {new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</div>
                </div>
                <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                  <button className="no-print" onClick={()=>window.print()} style={{background:'rgba(74,222,128,0.1)',border:`1px solid ${COLORS.border}`,borderRadius:'10px',padding:'8px 16px',color:COLORS.green,fontSize:'13px',fontWeight:700,cursor:'pointer'}}>🖨️ Print Report</button>
                  <button className="no-print" onClick={downloadPdfReport} disabled={downloading} style={{background:downloading?'rgba(22,163,74,0.4)':'rgba(74,222,128,0.1)',border:`1px solid ${COLORS.border}`,borderRadius:'10px',padding:'8px 16px',color:COLORS.green,fontSize:'13px',fontWeight:700,cursor:downloading?'not-allowed':'pointer'}}>{downloading ? 'Generating PDF...' : '📄 Download PDF Report'}</button>
                </div>
              </div>
            </div>

            <div style={{padding:'20px 28px',borderBottom:`1px solid ${COLORS.border}`}}>
              <div style={{fontSize:'11px',fontWeight:700,color:COLORS.green,letterSpacing:'0.1em',marginBottom:'14px'}}>📍 FIELD INFO</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'12px'}}>
                {[{label:'Farmer Name',val:report.farmerName},{label:'Location',val:report.location},{label:'Crop Type',val:report.cropType},{label:'Crop Age',val:report.cropAge}].map(f=>(
                  <div key={f.label} style={{background:'rgba(0,0,0,0.3)',borderRadius:'10px',padding:'10px 14px'}}>
                    <div style={{fontSize:'10px',color:COLORS.muted,fontWeight:700,marginBottom:'4px'}}>{f.label}</div>
                    <div style={{fontSize:'14px',fontWeight:700}}>{f.val}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{padding:'20px 28px',borderBottom:`1px solid ${COLORS.border}`,background:statusBg(report.healthStatus)}}>
              <div style={{fontSize:'11px',fontWeight:700,color:statusColor(report.healthStatus),letterSpacing:'0.1em',marginBottom:'14px'}}>🚦 CURRENT HEALTH STATUS</div>
              <div style={{display:'flex',alignItems:'center',gap:'16px',flexWrap:'wrap'}}>
                <div style={{fontSize:'28px',fontWeight:900,color:statusColor(report.healthStatus)}}>{statusEmoji(report.healthStatus)} {report.healthStatus}</div>
                <div style={{flex:1,minWidth:'200px',fontSize:'14px',lineHeight:1.6}}>{report.healthSummary}</div>
                <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'12px',padding:'10px 18px',textAlign:'center'}}>
                  <div style={{fontSize:'24px',fontWeight:900,color:statusColor(report.healthStatus)}}>{report.confidence}%</div>
                  <div style={{fontSize:'10px',color:COLORS.muted,fontWeight:700}}>AI CONFIDENCE</div>
                </div>
              </div>
            </div>

            <div style={{padding:'20px 28px',borderBottom:`1px solid ${COLORS.border}`}}>
              <div style={{fontSize:'11px',fontWeight:700,color:COLORS.green,letterSpacing:'0.1em',marginBottom:'14px'}}>🔍 WHAT THE AI FOUND</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'12px'}}>
                {[{label:'Problem Name',val:report.problemName,icon:'🦠'},{label:'Where is the sickness?',val:report.affectedArea,icon:'📍'},{label:'How bad is it?',val:report.severity,icon:'📊'}].map(f=>(
                  <div key={f.label} style={{background:'rgba(0,0,0,0.3)',borderRadius:'12px',padding:'14px 16px',borderLeft:`3px solid ${COLORS.border}`}}>
                    <div style={{fontSize:'10px',color:COLORS.muted,fontWeight:700,marginBottom:'6px'}}>{f.icon} {f.label.toUpperCase()}</div>
                    <div style={{fontSize:'14px',fontWeight:600,lineHeight:1.5}}>{f.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {report.healthStatus !== 'HEALTHY' && (
              <div style={{padding:'20px 28px',borderBottom:`1px solid ${COLORS.border}`}}>
                <div style={{fontSize:'11px',fontWeight:700,color:COLORS.yellow,letterSpacing:'0.1em',marginBottom:'16px'}}>💊 CROP MEDICINE & TREATMENT PLAN</div>
                <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                  <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'12px',padding:'16px',borderLeft:'3px solid rgba(239,68,68,0.5)'}}>
                    <div style={{fontSize:'11px',fontWeight:700,color:'#ef4444',marginBottom:'8px'}}>STEP 1 · FIELD CLEANUP (IMMEDIATE)</div>
                    <div style={{fontSize:'14px',lineHeight:1.7}}>{report.step1}</div>
                  </div>
                  <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'12px',padding:'16px',borderLeft:'3px solid rgba(251,191,36,0.5)'}}>
                    <div style={{fontSize:'11px',fontWeight:700,color:COLORS.yellow,marginBottom:'10px'}}>STEP 2 · CROP MEDICINE</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'10px'}}>
                      {[{label:'Medicine Name',val:report.medicineName},{label:'How much to mix',val:report.medicineDose},{label:'How to apply',val:report.medicineApplication},{label:'When to repeat',val:report.medicineRepeat}].map(f=>(
                        <div key={f.label} style={{background:'rgba(251,191,36,0.05)',borderRadius:'8px',padding:'10px 12px'}}>
                          <div style={{fontSize:'10px',color:COLORS.yellow,fontWeight:700,marginBottom:'4px'}}>{f.label.toUpperCase()}</div>
                          <div style={{fontSize:'13px',lineHeight:1.5}}>{f.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'12px',padding:'16px',borderLeft:'3px solid rgba(74,222,128,0.5)'}}>
                    <div style={{fontSize:'11px',fontWeight:700,color:COLORS.green,marginBottom:'8px'}}>STEP 3 · WATERING & NUTRITION CARE</div>
                    <div style={{fontSize:'14px',lineHeight:1.7}}>{report.step3}</div>
                  </div>
                </div>
              </div>
            )}

            {report.healthStatus === 'HEALTHY' && (
              <div style={{padding:'40px 28px',borderBottom:`1px solid ${COLORS.border}`,background:'rgba(74,222,128,0.05)',textAlign:'center'}}>
                <div style={{fontSize:'48px',marginBottom:'12px'}}>🎉</div>
                <div style={{fontSize:'18px',fontWeight:800,color:COLORS.green,marginBottom:'8px'}}>Your Crop is Healthy!</div>
                <div style={{color:COLORS.muted,fontSize:'14px'}}>No treatment needed. Continue current practices and monitor weekly.</div>
              </div>
            )}

            <div style={{padding:'20px 28px'}}>
              <div style={{fontSize:'11px',fontWeight:700,color:COLORS.green,letterSpacing:'0.1em',marginBottom:'14px'}}>🌾 FUTURE PROTECTION (FOR NEXT SEASON)</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                {[{icon:'🔄',label:'CROP ROTATION',val:report.futureCropRotation},{icon:'🌱',label:'STRONGER SEEDS',val:report.futureSeed}].map(f=>(
                  <div key={f.label} style={{background:'rgba(0,0,0,0.3)',borderRadius:'12px',padding:'14px 16px',display:'flex',gap:'12px',alignItems:'flex-start'}}>
                    <div style={{fontSize:'20px',flexShrink:0}}>{f.icon}</div>
                    <div>
                      <div style={{fontSize:'11px',color:COLORS.muted,fontWeight:700,marginBottom:'6px'}}>{f.label}</div>
                      <div style={{fontSize:'13px',lineHeight:1.6}}>{f.val}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:'20px',paddingTop:'16px',borderTop:`1px solid ${COLORS.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'8px'}}>
                <div style={{fontSize:'11px',color:COLORS.muted}}>🛰️ KISAN-VISION · Powered by Claude AI + Sentinel-2</div>
                <div style={{fontSize:'11px',color:COLORS.muted}}>Report ID: {reportId}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}