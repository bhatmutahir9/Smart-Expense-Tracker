
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
    <main className="flex min-h-screen min-h-dvh items-center justify-center bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 sm:rounded-3xl lg:min-h-[650px] lg:grid-cols-2">

        {/* Left branding section */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-blue-600 p-10 text-white lg:flex xl:p-14">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-blue-500/50" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="rounded-xl bg-white/15 p-3">
              <Wallet size={27} />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Smart Expense
            </span>
          </div>

          <div className="relative z-10 max-w-lg">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
              Your money, your control
            </p>

            <h1 className="text-4xl font-bold leading-[1.2] tracking-tight xl:text-5xl">
              Track smarter.
              <br />
              Spend better.
              <br />
              Save more.
            </h1>

            <p className="mt-6 max-w-md text-base leading-8 text-blue-100">
              Manage your income, track your expenses and stay
              on top of your financial goals with one simple
              platform.
            </p>

            <div className="mt-10 flex items-center gap-3 text-sm text-blue-100">
              <ShieldCheck size={20} />
              <span>Your personal finance companion</span>
            </div>
          </div>

          <p className="relative z-10 text-xs text-blue-100/80">
            Smart Expense Tracker
          </p>
        </section>

        {/* Login form */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-10 sm:py-14 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">

            {/* Mobile branding */}
            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <div className="rounded-xl bg-blue-600 p-3 text-white shadow-lg shadow-blue-600/20">
                <Wallet size={25} />
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight text-slate-900">
                  Smart Expense
                </p>
                <p className="text-xs text-slate-500">
                  Manage money smarter
                </p>
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                Welcome back
              </p>

              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Sign in to your account
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                Enter your credentials to access your personal dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>

                <div className="flex min-h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                  <Mail size={19} className="shrink-0 text-slate-400" />

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

                <div className="flex min-h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                  <Lock size={19} className="shrink-0 text-slate-400" />

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
                    className="shrink-0 rounded-md p-1 text-slate-400 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword
                      ? <EyeOff size={19} />
                      : <Eye size={19} />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600"
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign in'}

                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            {/* Signup link */}
            <div className="mt-8 border-t border-slate-100 pt-6 text-center">
              <p className="text-sm leading-6 text-slate-500">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="font-semibold text-blue-600 transition hover:text-blue-800"
                >
                  Create account
                </Link>
              </p>
            </div>

            <p className="mt-8 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} Smart Expense Tracker
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
