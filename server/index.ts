import path from 'path'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import analyzeRoutes from './routes/analyze'
import landRoutes from './routes/lands'
import satelliteRoutes from './routes/satellite'
import chatRoutes from './routes/chat'
import alertRoutes from './routes/alerts'
import reportRoutes from './routes/report'
import cropDetectRoutes from './routes/cropDetect'
import aiRoutes from './routes/ai'
import cron from 'node-cron'
import { sendAllDailyReports } from './services/dailyReport'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())
const distPath = path.join(__dirname, '..')
app.use(express.static(distPath))
app.use('/api/auth', authRoutes)
app.use('/api/analyze', analyzeRoutes)
app.use('/api/lands', landRoutes)
app.use('/api/satellite', satelliteRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/crop-detect', cropDetectRoutes)
app.use('/api/report', reportRoutes)
app.use('/api/ai', aiRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'KISAN-VISION API running' })
})

// Daily report at 6 AM every day
cron.schedule('0 6 * * *', async () => {
  console.log('Running daily report job...')
  await sendAllDailyReports()
})

// Send test report 3 seconds after server starts

app.get('/*splat', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
