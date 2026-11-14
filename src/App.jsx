
import { Navigate, Routes, Route, Outlet } from 'react-router-dom'
import { useAuth } from './context/useAuth'

import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Analytics from './pages/Analytics'
import Budgets from './pages/Budgets'
import SavingsGoals from './pages/SavingsGoals'
import RecurringTransactions from './pages/RecurringTransactions'

import Navbar from './Components/Navbar'

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
        element={<Navigate to={user ? '/dashboard' : '/login'} replace />}
      />

      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      <Route
        path="/signup"
        element={user ? <Navigate to="/dashboard" replace /> : <Signup />}
      />

      {/* Password recovery routes */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/savings-goals" element={<SavingsGoals />} />

        <Route
          path="/recurring-transactions"
          element={<RecurringTransactions />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
