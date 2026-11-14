
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, Mail, ArrowLeft, LoaderCircle, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        })

      if (resetError) {
        setError(resetError.message)
        return
      }

      setSuccess(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen min-h-dvh items-center justify-center bg-[#F3F7FB] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-[#D8E6F4] bg-white p-7 shadow-xl shadow-slate-300/30 sm:p-10">

        <Link to="/login" className="mb-9 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#3973B9]">
          <ArrowLeft size={17} />
          Back to login
        </Link>

        <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDF4FB] text-[#3973B9]">
          <Wallet size={27} />
        </div>

        <p className="mb-2 text-sm font-semibold tracking-wide text-[#3973B9]">
          ACCOUNT RECOVERY
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-[#102A43]">
          Forgot your password?
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Enter the email address linked to your Smart Spend account.
          We’ll send you a link to reset your password.
        </p>

        {success ? (
          <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center gap-2 font-semibold text-emerald-700">
              <CheckCircle2 size={20} />
              Recovery email requested
            </div>
            <p className="mt-2 text-sm leading-6 text-emerald-700">
              If an account exists for this email, Supabase will send a
              password reset link. Check your inbox and spam folder.
            </p>
            <p className="mt-3 break-all text-sm font-semibold text-[#102A43]">
              {email.trim()}
            </p>
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="mt-4 text-sm font-semibold text-[#3973B9] hover:text-[#102A43]"
            >
              Try another email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="recovery-email" className="mb-2 block text-sm font-semibold text-slate-700">
                Email address
              </label>

              <div className="flex min-h-[53px] items-center rounded-xl border border-[#D8E6F4] bg-[#F3F7FB] px-4 transition focus-within:border-[#3973B9] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#3973B9]/10">
                <Mail size={18} className="shrink-0 text-slate-400" />
                <input
                  id="recovery-email"
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

            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-[53px] w-full items-center justify-center gap-2 rounded-xl bg-[#102A43] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#102A43]/20 transition hover:bg-[#173D60] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Sending recovery link...
                </>
              ) : (
                <>
                  Send reset link
                  <Mail size={18} />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 border-t border-[#D8E6F4] pt-6 text-xs text-slate-400">
          <ShieldCheck size={15} />
          Secure authentication powered by Supabase
        </div>
      </div>
    </main>
  )
}
