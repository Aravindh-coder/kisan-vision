import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Satellite from './pages/Satellite'
import Landing from './pages/Landing'
import WeatherAlertPage from './pages/WeatherAlertPage'
import CropDetect from './pages/CropDetect'
import Hackathon from './pages/Hackathon'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/satellite" element={<Satellite />} />
          <Route path="/weather-alert" element={<WeatherAlertPage />} />
          <Route path="/crop-detect" element={<CropDetect />} />
          <Route path="/hackathon" element={<Hackathon />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
