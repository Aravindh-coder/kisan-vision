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

## 🧠 ML Architecture & Validation

KISAN-VISION includes a satellite-driven machine learning layer for two tasks:

1. Crop-type classification from NDVI time-series and seasonal context.
2. Phenology-stage estimation for growth-stage mapping.

### Model pipeline
- Feature extraction from Sentinel-2-derived NDVI/NDWI/EVI/SAVI and seasonal metadata.
- Lightweight multiclass classifier trained on synthetic but structured NDVI profiles.
- Inference exposed through the satellite analysis route for live advisory generation.
- Fallback heuristic logic preserved so the experience remains robust even when model weights are unavailable.

### Validation protocol
- Held-out validation using an 80/20 split on class-balanced synthetic samples.
- Reported metrics include accuracy, macro-F1, and top-3 accuracy.
- Validation artifacts are stored in [server/ml/validationReport.json](server/ml/validationReport.json).

### Current validation metrics
- Crop classification: accuracy 0.1667, macro-F1 0.0836, top-3 accuracy 0.5972
- Phenology stage mapping: accuracy 0.6150, macro-F1 0.5006, top-3 accuracy 1.0000

> These numbers should be presented as a prototype validation baseline rather than a field-deployed production benchmark. The next step is to replace the synthetic training set with field-labeled data from agronomists and satellite observations.

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
