import { Navigate, Routes, Route, Outlet } from 'react-router-dom'
import { useAuth } from './context/useAuth'

import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Analytics from './pages/Analytics'
import Navbar from './Components/Navbar'
import Budgets from './pages/Budgets'

function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7FC]">
        <p className="text-sm font-medium text-slate-500">
          Loading your account...
        </p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-[#F5F7FC]">
      <Navbar />
      <Outlet />
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7FC]">
        <p className="text-sm font-medium text-slate-500">
          Loading Smart Expense Tracker...
        </p>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={user ? '/dashboard' : '/login'}
            replace
          />
        }
      />

      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      <Route
        path="/signup"
        element={user ? <Navigate to="/dashboard" replace /> : <Signup />}
      />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/budgets" element={<Budgets />} />
      </Route>
       
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}