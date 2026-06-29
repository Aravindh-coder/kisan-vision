import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

interface Props {
  satelliteContext?: {
    ndvi: number
    ndwi: number
    evi: number
    advisory: string
    landCover: string
    crop: string
    season: string
  }
}

const SUGGESTIONS = [
  '🌱 Is my crop healthy?',
  '💧 When should I irrigate?',
  '🌾 What to plant this season?',
  '📊 Explain my NDVI score',
  '🐛 How to prevent crop disease?',
]

export default function ChatAssistant({ satelliteContext }: Props) {
  const { token } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: "Hi there! 👋 I'm Kisan-AI, your personal farming assistant. I can help you with crop health, irrigation advice, and much more. What would you like to know today? 🌿"
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    setLoading(true)
    try {
      const res = await axios.post('https://kisan-vision.onrender.com/api/chat',
        { message: text, context: satelliteContext || null },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.reply }])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: '❌ Connection error. Please check your internet and try again.'
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 shadow-2xl transition-all hover:scale-110"
        title="Chat with Kisan-AI"
      >
        {open ? (
          <div className="bg-red-500 hover:bg-red-400 text-white rounded-full w-16 h-16 flex items-center justify-center text-xl font-bold">
            ✕
          </div>
        ) : (
          <div className="relative">
            <div className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-full w-16 h-16 flex items-center justify-center text-3xl shadow-lg">
              👩‍🌾
            </div>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              AI
            </span>
          </div>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-96 bg-gray-900 border border-green-700 rounded-2xl shadow-2xl flex flex-col"
          style={{ height: '560px' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-700 to-emerald-600 rounded-t-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow">
              👩‍🌾
            </div>
            <div>
              <p className="font-bold text-white text-base">Kisan-AI</p>
              <p className="text-green-200 text-xs flex items-center gap-1">
                <span className="w-2 h-2 bg-green-300 rounded-full inline-block animate-pulse" />
                {satelliteContext ? 'Using your field data' : 'Agricultural Assistant'}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 bg-green-700 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                    👩‍🌾
                  </div>
                )}
                <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-green-600 text-white rounded-br-none'
                    : 'bg-gray-800 text-gray-100 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                    👤
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-7 h-7 bg-green-700 rounded-full flex items-center justify-center text-sm">
                  👩‍🌾
                </div>
                <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-none">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="bg-gray-800 hover:bg-green-800 text-green-300 text-xs px-3 py-1.5 rounded-full border border-green-800 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-700 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
              placeholder="Ask Kisan-AI anything..."
              className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 px-4 py-2 rounded-xl text-sm font-bold transition"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  )
}
