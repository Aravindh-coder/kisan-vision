# 🛰️ KISAN-VISION

> AI-Powered Satellite Farm Intelligence Platform for Indian Farmers

**🌐 Live Demo:** [https://kisan-vision.onrender.com](https://kisan-vision.onrender.com)

## 🚀 Features

- 📡 **Real-time Satellite Analysis** — NDVI, NDWI, EVI indices via Sentinel-2 / Google Earth Engine
- 🤖 **KISAN AI Chat** — Groq LLaMA 3.3 70B powered farm advisor with live satellite context
- 🗺️ **Land Registration** — Draw farm boundaries on interactive map, auto-detect location
- 🌾 **Crop Disease Detection** — Upload photos for instant AI disease diagnosis
- 🌦️ **Weather Alerts** — Live weather with farming advisories
- 📱 **WhatsApp Notifications** — Daily farm reports via Twilio
- 📧 **Email Reports** — Automated daily satellite farm summaries
- 🌐 **Trilingual** — English, Hindi, Tamil support
- 🔐 **User Authentication** — Private land data per farmer account

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | MySQL (Aiven Cloud) |
| ORM | Drizzle ORM |
| AI Chat | Groq API (LLaMA 3.3 70B) |
| AI Vision | Google Gemini 2.5 Flash |
| Satellite | Google Earth Engine, Sentinel-2 |
| Maps | Leaflet.js |
| Notifications | Twilio WhatsApp, Nodemailer |
| Process Manager | PM2 |
| Hosting | Render.com |

## 🔧 Local Setup

```bash
git clone https://github.com/Aravindh-coder/kisan-vision.git
cd kisan-vision
npm install
cp .env.example .env   # Add your API keys
npm run build
node dist/server/index.js
```

## 👨‍💻 Developer

**Aravindh A** — B.Tech CSE (AI), 3rd Year
[LinkedIn](https://linkedin.com/in/aravindh-a-1290b8326) · [GitHub](https://github.com/Aravindh-coder)

---
*Built for ISRO Hackathon 2024 — Empowering Indian farmers with satellite intelligence*
