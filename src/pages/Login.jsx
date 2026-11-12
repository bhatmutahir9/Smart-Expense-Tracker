
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
  LoaderCircle,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
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
        password
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
    <main className="relative flex min-h-screen min-h-dvh items-center justify-center overflow-hidden bg-[#F3F7FB] px-4 py-8 sm:px-6">

      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#D8E6F4]/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#EDF4FB] blur-3xl" />

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-[#D8E6F4] bg-white shadow-2xl shadow-slate-300/40 lg:min-h-[680px] lg:grid-cols-2">

        {/* LEFT BRANDING PANEL */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#102A43] p-10 text-white lg:flex xl:p-14">

          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border border-white/10" />
          <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-white/[0.06]" />

          {/* Brand */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
              <Wallet size={25} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Smart Expense
              </h1>
              <p className="text-xs text-[#D8E6F4]">
                Personal Finance Manager
              </p>
            </div>
          </div>

          {/* Main content */}
          <div className="relative z-10 my-12 max-w-md">

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-[#D8E6F4]">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              YOUR FINANCES, SIMPLIFIED
            </div>

            <h2 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
              Take control of
              <br />
              your financial
              <br />
              <span className="text-[#A9C9EB]">
                future.
              </span>
            </h2>

            <p className="mt-6 max-w-sm text-sm leading-7 text-[#D8E6F4] sm:text-base">
              Track expenses, manage budgets and make
              smarter financial decisions with one
              powerful personal finance platform.
            </p>

            {/* Dashboard preview */}
            <div className="mt-10 rounded-2xl border border-white/20 bg-white/10 p-5 shadow-xl backdrop-blur-md">

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#D8E6F4]">
                    Financial management
                  </p>
                  <p className="mt-1 text-lg font-bold">
                    Everything in one place
                  </p>
                </div>

                <div className="rounded-xl bg-white/15 p-3">
                  <ChartNoAxesCombined size={24} />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">

                <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                  <TrendingUp size={19} className="text-emerald-300" />
                  <p className="mt-3 text-sm font-semibold">
                    Track income
                  </p>
                  <p className="mt-1 text-xs text-[#D8E6F4]">
                    Monitor your earnings
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                  <CreditCard size={19} className="text-[#A9C9EB]" />
                  <p className="mt-3 text-sm font-semibold">
                    Manage expenses
                  </p>
                  <p className="mt-1 text-xs text-[#D8E6F4]">
                    Control your spending
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-center gap-2 text-xs text-[#D8E6F4]">
            <ShieldCheck size={16} />
            Your personal finance companion
          </div>
        </section>

        {/* RIGHT LOGIN PANEL */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12 xl:px-16">

          <div className="w-full max-w-md">

            {/* Mobile branding */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#102A43] text-white shadow-lg shadow-[#102A43]/20">
                <Wallet size={23} />
              </div>

              <div>
                <h1 className="text-lg font-bold text-[#102A43]">
                  Smart Expense
                </h1>
                <p className="text-xs text-slate-500">
                  Personal Finance Manager
                </p>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF4FB] text-[#3973B9]">
                <Lock size={23} />
              </div>

              <p className="mb-2 text-sm font-semibold tracking-wide text-[#3973B9]">
                WELCOME BACK
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-[#102A43] sm:text-4xl">
                Sign in to your account
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Enter your account details to continue
                to your financial dashboard.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>

                <div className="flex min-h-[52px] items-center rounded-xl border border-[#D8E6F4] bg-[#F3F7FB] px-4 transition focus-within:border-[#3973B9] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#3973B9]/10">
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
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-[#3973B9] transition hover:text-[#102A43]"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="flex min-h-[52px] items-center rounded-xl border border-[#D8E6F4] bg-[#F3F7FB] px-4 transition focus-within:border-[#3973B9] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#3973B9]/10">
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
                    className="rounded-lg p-1 text-slate-400 transition hover:text-[#3973B9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3973B9]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-[#3973B9]"
                />
                Remember me
              </label>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-600"
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group flex min-h-[53px] w-full items-center justify-center gap-2 rounded-xl bg-[#102A43] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#102A43]/20 transition duration-200 hover:-translate-y-0.5 hover:bg-[#173D60] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in to dashboard
                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            {/* Signup */}
            <div className="mt-8 border-t border-[#D8E6F4] pt-6 text-center">
              <p className="text-sm text-slate-500">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="font-bold text-[#3973B9] transition hover:text-[#102A43]"
                >
                  Create account
                </Link>
              </p>
            </div>

            {/* Security */}
            <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={15} />
              Secure authentication powered by Supabase
            </div>

            <p className="mt-5 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} Smart Expense Tracker
            </p>

          </div>
        </section>
      </div>
    </main>
  )
}
