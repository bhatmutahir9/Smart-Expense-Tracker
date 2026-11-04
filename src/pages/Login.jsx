
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  Wallet,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  ChartNoAxesCombined,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: loginError } = await login(
        email.trim(),
        password,
      )

      if (loginError) {
        setError(loginError.message)
        return
      }

      navigate('/dashboard', { replace: true })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen min-h-dvh items-center justify-center bg-[#F4F7FC] px-4 py-8 sm:px-6">

      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50 lg:min-h-[660px] lg:grid-cols-2">

        {/* Left branding panel */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 via-blue-700 to-indigo-700 p-10 text-white lg:flex xl:p-14">

          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full border border-white/10" />
          <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-white/[0.06]" />

          {/* Brand */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <Wallet size={25} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Smart Expense
              </h1>
              <p className="text-xs text-blue-100">
                Personal Finance Manager
              </p>
            </div>
          </div>

          {/* Main message */}
          <div className="relative z-10 my-12 max-w-md">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-100">
              Take control of your money
            </p>

            <h2 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
              Make smarter
              <br />
              financial decisions.
            </h2>

            <p className="mt-6 max-w-sm text-base leading-7 text-blue-100">
              Track your spending, manage your budgets and
              understand your finances — all in one place.
            </p>

            {/* Dashboard preview */}
            <div className="mt-10 rounded-2xl border border-white/20 bg-white/10 p-5 shadow-lg backdrop-blur-sm">

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-100">
                    Financial overview
                  </p>
                  <p className="mt-1 text-lg font-bold">
                    Your money, organized.
                  </p>
                </div>

                <div className="rounded-xl bg-white/15 p-3">
                  <ChartNoAxesCombined size={23} />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">

                <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                  <div className="flex items-center gap-2 text-blue-100">
                    <TrendingUp size={15} />
                    <span className="text-xs">Track income</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold">
                    Stay informed
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                  <div className="flex items-center gap-2 text-blue-100">
                    <CreditCard size={15} />
                    <span className="text-xs">Manage expenses</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold">
                    Spend wisely
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-center gap-2 text-xs text-blue-100">
            <ShieldCheck size={16} />
            <span>Your personal finance companion</span>
          </div>
        </section>

        {/* Login form */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12 xl:px-16">

          <div className="w-full max-w-md">

            {/* Mobile branding */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                <Wallet size={23} />
              </div>

              <div>
                <p className="text-lg font-bold text-slate-900">
                  Smart Expense
                </p>
                <p className="text-xs text-slate-500">
                  Personal Finance Manager
                </p>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <div className="mb-5 inline-flex rounded-xl bg-blue-50 p-3 text-blue-600">
                <Lock size={23} />
              </div>

              <p className="mb-2 text-sm font-semibold text-blue-600">
                Welcome back
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Sign in to your account
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Enter your account details to continue to your dashboard.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>

                <div className="flex min-h-[52px] items-center rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                  <Mail size={18} className="shrink-0 text-slate-400" />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="flex min-h-[52px] items-center rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                  <Lock size={18} className="shrink-0 text-slate-400" />

                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="rounded-lg p-1 text-slate-400 transition hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword
                      ? <EyeOff size={18} />
                      : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign in'}

                {!loading && (
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                )}
              </button>
            </form>

            {/* Signup link */}
            <div className="mt-8 border-t border-slate-100 pt-6 text-center">
              <p className="text-sm text-slate-500">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="font-semibold text-blue-600 transition hover:text-indigo-700"
                >
                  Create account
                </Link>
              </p>
            </div>

            {/* Footer */}
            <p className="mt-8 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} Smart Expense Tracker
            </p>

          </div>
        </section>
      </div>
    </main>
  )
}
