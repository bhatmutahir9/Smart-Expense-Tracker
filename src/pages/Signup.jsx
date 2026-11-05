
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
  Check,
  CircleCheck,
  X,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'

export default function Signup() {
  const { signup, user } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  if (user) return <Navigate to="/dashboard" replace />

  const passwordChecks = [
    { label: 'At least 6 characters', valid: password.length >= 6 },
    { label: 'Contains a number', valid: /\d/.test(password) },
    { label: 'Contains an uppercase letter', valid: /[A-Z]/.test(password) },
  ]

  const strength = passwordChecks.filter((item) => item.valid).length
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword

  const fieldClass =
    'flex min-h-[52px] items-center rounded-xl border border-slate-200 bg-white px-4 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10'

  const inputClass =
    'min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')

    const cleanEmail = email.trim()

    if (!cleanEmail) {
      setError('Please enter your email address.')
      return
    }

    if (strength !== 3) {
      setError('Please fulfill all password requirements.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const { data, error: signupError } = await signup(
        cleanEmail,
        password,
      )

      if (signupError) {
        const errorMessage = signupError.message || ''

        if (errorMessage.toLowerCase().includes('already registered')) {
          setError('This email is already registered. Please sign in.')
        } else {
          setError(errorMessage || 'Unable to create your account.')
        }
        return
      }

      if (data?.session) {
        navigate('/dashboard', { replace: true })
      } else {
        setMessage(
          'Account created successfully! Please check your email and confirm your account before signing in.',
        )
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen min-h-dvh items-center justify-center bg-[#F4F7FC] px-4 py-8 sm:px-6">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-25px_rgba(15,23,42,0.18)] lg:min-h-[700px] lg:grid-cols-[0.95fr_1.05fr]">

        {/* Branding panel */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#1E40AF] p-10 text-white lg:flex xl:p-12">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-600/40 via-transparent to-indigo-950/50" />

          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/10" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-700">
              <Wallet size={23} />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Smart Expense
              </h1>
              <p className="text-xs text-blue-200">
                Personal Finance Manager
              </p>
            </div>
          </div>

          <div className="relative z-10 my-12">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
              Better financial habits start here
            </p>

            <h2 className="max-w-md text-4xl font-bold leading-[1.2] tracking-tight xl:text-5xl">
              Your finances,
              <br />
              under control.
            </h2>

            <p className="mt-6 max-w-sm text-sm leading-7 text-blue-100">
              One place to track your transactions, manage budgets
              and make smarter decisions about your money.
            </p>

            <div className="mt-10 max-w-sm rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-200">
                    Financial overview
                  </p>
                  <p className="mt-1 text-base font-semibold">
                    Stay on top of your money
                  </p>
                </div>

                <div className="rounded-xl bg-white/15 p-3">
                  <TrendingUp size={22} />
                </div>
              </div>

              <div className="mt-6 flex h-20 items-end gap-2">
                {[35, 55, 42, 75, 52, 85, 65, 95, 70, 100, 78, 90].map(
                  (height, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-t-sm bg-white/70"
                      style={{ height: `${height}%` }}
                    />
                  ),
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-white/15 pt-4 text-xs text-blue-100">
                <CircleCheck size={15} />
                <span>Everything organized in one dashboard</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 text-xs text-blue-200">
            <ShieldCheck size={16} />
            <span>Designed for smarter money management</span>
          </div>
        </section>

        {/* Signup form */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">

            {/* Mobile brand */}
            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Wallet size={23} />
              </div>

              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  Smart Expense
                </h1>
                <p className="text-xs text-slate-500">
                  Personal Finance Manager
                </p>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Wallet size={22} />
              </div>

              <p className="mb-2 text-sm font-semibold text-blue-600">
                Create your account
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Get started today.
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Enter your details below to create your personal account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label htmlFor="signup-email" className="mb-2 block text-sm font-semibold text-slate-700">
                  Email address
                </label>

                <div className={fieldClass}>
                  <Mail size={18} className="shrink-0 text-slate-400" />

                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError('')
                      setMessage('')
                    }}
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="signup-password" className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>

                <div className={fieldClass}>
                  <Lock size={18} className="shrink-0 text-slate-400" />

                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError('')
                      setMessage('')
                    }}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    required
                    className={inputClass}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="rounded-md p-1 text-slate-400 transition hover:text-blue-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {password.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-2 flex gap-1.5">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            strength >= level
                              ? strength === 3
                                ? 'bg-emerald-500'
                                : 'bg-blue-500'
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      {passwordChecks.map((item) => (
                        <div
                          key={item.label}
                          className={`flex items-center gap-2 text-xs ${
                            item.valid ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        >
                          {item.valid ? <Check size={13} /> : <X size={13} />}
                          {item.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-slate-700">
                  Confirm password
                </label>

                <div className={fieldClass}>
                  <Lock size={18} className="shrink-0 text-slate-400" />

                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setError('')
                      setMessage('')
                    }}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    required
                    className={inputClass}
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="rounded-md p-1 text-slate-400 transition hover:text-blue-600"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {confirmPassword.length > 0 && (
                  <p className={`mt-2 flex items-center gap-1.5 text-xs ${
                    passwordsMatch ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {passwordsMatch ? <Check size={13} /> : <X size={13} />}
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
                  {error}
                </div>
              )}

              {/* Success */}
              {message && (
                <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
                  {message}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || strength !== 3 || !passwordsMatch}
                className="group flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition duration-200 hover:bg-blue-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Creating account...' : 'Create account'}

                {!loading && (
                  <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
                )}
              </button>
            </form>

            {/* Login */}
            <div className="mt-8 border-t border-slate-100 pt-6 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-blue-600 transition hover:text-blue-700">
                  Sign in
                </Link>
              </p>
            </div>

            {/* Footer */}
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={14} />
              <span>© {new Date().getFullYear()} Smart Expense Tracker</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
