
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import { useAuth } from './context/AuthContext'
import Home from './Home'
import Dashboard from './pages/Dashboard'
import ResetPassword from './pages/ResetPassword'

function ProtectedRoute({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading HabitTracker...</div>
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  const { user } = useAuth()

  return (
    <BrowserRouter>
      <Routes>

        {/* HOME / LOGIN */}
        <Route
          path="/"
          element={
            user
              ? <Navigate to="/dashboard" replace />
              : <Home />
          }
        />

        {/* PASSWORD RESET */}
        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* UNKNOWN ROUTES */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App