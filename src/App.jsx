import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ModalsProvider } from '@mantine/modals'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'

import PatientPortal        from './pages/PatientPortal'
import LoginPage            from './pages/LoginPage'
import QueueDashboard       from './pages/QueueDashboard'
import AppointmentsDashboard from './pages/AppointmentsDashboard'
import Analytics            from './pages/Analytics'
import Settings             from './pages/Settings'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"             element={<PatientPortal />} />
      <Route path="/login"        element={<LoginPage />} />
      <Route path="/dashboard"    element={<ProtectedRoute><QueueDashboard /></ProtectedRoute>} />
      <Route path="/appointments" element={<ProtectedRoute><AppointmentsDashboard /></ProtectedRoute>} />
      <Route path="/analytics"    element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/settings"     element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="*"             element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ModalsProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ModalsProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
