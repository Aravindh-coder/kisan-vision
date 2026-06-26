import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Satellite from './pages/Satellite'
import Landing from './pages/Landing'
import WeatherAlertPage from './pages/WeatherAlertPage'
import CropDetect from './pages/CropDetect'

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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
