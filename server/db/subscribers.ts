import fs from 'fs'
import path from 'path'

const DB_FILE = path.join(__dirname, 'subscribers.json')

export interface Subscriber {
  id: string
  name: string
  phone: string
  email: string
  lat: number
  lon: number
  locationName: string
  createdAt: string
}

export function getSubscribers(): Subscriber[] {
  try {
    if (!fs.existsSync(DB_FILE)) return []
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'))
  } catch {
    return []
  }
}

export function addSubscriber(sub: Omit<Subscriber, 'id' | 'createdAt'>): Subscriber {
  const subscribers = getSubscribers()
  const existing = subscribers.findIndex(s => s.phone === sub.phone || s.email === sub.email)
  const newSub: Subscriber = {
    ...sub,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  }
  if (existing >= 0) {
    subscribers[existing] = newSub
  } else {
    subscribers.push(newSub)
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(subscribers, null, 2))
  return newSub
}
