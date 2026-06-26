interface Props {
  lat?: number
  lon?: number
  locationName?: string
}

export default function WeatherAlert({ lat, lon, locationName }: Props) {
  const handleClick = () => {
    if (!lat || !lon) { alert('Please select a location on the map first!'); return }
    const url = `/weather-alert.html?lat=${lat}&lon=${lon}&location=${encodeURIComponent(locationName || '')}`
    window.open(url, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 left-6 z-50 bg-blue-600 hover:bg-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl shadow-2xl transition-all hover:scale-110"
      title="Weather Alerts"
    >
      🌤️
    </button>
  )
}
