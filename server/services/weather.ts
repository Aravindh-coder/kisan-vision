export async function getWeather(lat: number, lon: number) {
  const key = process.env.OPENWEATHER_API_KEY
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`
  const res = await fetch(url)
  return await res.json() as any
}
