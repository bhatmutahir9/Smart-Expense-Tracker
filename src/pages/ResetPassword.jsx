
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet,
  Lock,
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const [checking, setChecking] = useState(true)
  const [validSession, setValidSession] = useState(false)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let active = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return

      if (event === 'PASSWORD_RECOVERY' || session) {
        setValidSession(true)
        setChecking(false)
      }
    })

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return

      setValidSession(Boolean(data?.session) && !sessionError)
      setChecking(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Your password must contain at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      const { error: signOutError } = await supabase.auth.signOut()

      if (signOutError) {
        setError('Password updated, but automatic sign-out failed. Please sign in again.')
        return
      }

      setSuccess(true)
      setPassword('')
      setConfirmPassword('')
    } catch {
      setError('Unable to update your password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen min-h-dvh items-center justify-center bg-[#F3F7FB] px-4">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle size={20} className="animate-spin" />
          Verifying your recovery link...
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen min-h-dvh items-center justify-center bg-[#F3F7FB] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-[#D8E6F4] bg-white p-7 shadow-xl shadow-slate-300/30 sm:p-10">

        <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDF4FB] text-[#3973B9]">
          <Wallet size={27} />
        </div>

        {success ? (
          <>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={26} />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-[#102A43]">
              Password updated!
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Your password has been changed successfully.
              You can now sign in using your new password.
            </p>

            <Link
              to="/login"
              className="mt-7 flex min-h-[53px] w-full items-center justify-center rounded-xl bg-[#102A43] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#173D60]"
            >
              Continue to login
            </Link>
          </>
        ) : !validSession ? (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-[#102A43]">
              Recovery link expired
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              This password recovery link is invalid or has expired.
              Request a new recovery email to continue.
            </p>

            <Link
              to="/forgot-password"
              className="mt-7 flex min-h-[53px] w-full items-center justify-center rounded-xl bg-[#102A43] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#173D60]"
            >
              Request a new reset link
            </Link>
          </>
        ) : (
          <>
            <p className="mb-2 text-sm font-semibold tracking-wide text-[#3973B9]">
              ACCOUNT SECURITY
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-[#102A43]">
              Create new password
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Choose a strong password for your Smart Spend account.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">

              {/* New password */}
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  New password
                </label>

                <div className="flex min-h-[53px] items-center rounded-xl border border-[#D8E6F4] bg-[#F3F7FB] px-4 transition focus-within:border-[#3973B9] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#3973B9]/10">
                  <Lock size={18} className="shrink-0 text-slate-400" />

                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="rounded-lg p-1 text-slate-400 transition hover:text-[#3973B9]"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Confirm new password
                </label>

                <div className="flex min-h-[53px] items-center rounded-xl border border-[#D8E6F4] bg-[#F3F7FB] px-4 transition focus-within:border-[#3973B9] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#3973B9]/10">
                  <Lock size={18} className="shrink-0 text-slate-400" />

                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="rounded-lg p-1 text-slate-400 transition hover:text-[#3973B9]"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Error message */}
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
                className="flex min-h-[53px] w-full items-center justify-center gap-2 rounded-xl bg-[#102A43] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#102A43]/20 transition hover:bg-[#173D60] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Updating password...
                  </>
                ) : (
                  'Update password'
                )}
              </button>
            </form>
          </>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 border-t border-[#D8E6F4] pt-6 text-xs text-slate-400">
          <ShieldCheck size={15} />
          Secure authentication powered by Supabase
        </div>

      </div>
    </main>
  )
}
