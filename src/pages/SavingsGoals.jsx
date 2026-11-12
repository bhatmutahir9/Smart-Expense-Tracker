
import { useEffect, useState } from 'react'
import {
  Target,
  Plus,
  Wallet,
  PiggyBank,
  CalendarDays,
  TrendingUp,
  Trash2,
  Pencil,
  X,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react'

import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

const currency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)

const initialForm = {
  title: '',
  target_amount: '',
  saved_amount: '0',
  target_date: '',
}

export default function SavingsGoals() {
  const { user } = useAuth()

  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [contributions, setContributions] = useState({})

  // Refresh goals after create, update, delete or contribution
  const fetchGoals = async () => {
    if (!user?.id) return

    try {
      const { data, error: fetchError } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setGoals(data || [])
      setError('')
    } catch (err) {
      console.error('Error fetching savings goals:', err)
      setError('Unable to refresh savings goals. Please try again.')
    }
  }

  // Initial fetch and user change
  useEffect(() => {
    let active = true

    const loadGoals = async () => {
      if (!user?.id) {
        setGoals([])
        setLoading(false)
        return
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('savings_goals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (!active) return

        if (fetchError) {
          setError(fetchError.message)
        } else {
          setGoals(data || [])
          setError('')
        }
      } catch {
        if (active) {
          setError('Unable to load savings goals. Please try again.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadGoals()

    return () => {
      active = false
    }
  }, [user?.id])

  // Open create form
  const openCreateForm = () => {
    setEditingGoal(null)
    setForm(initialForm)
    setError('')
    setSuccess('')
    setShowForm(true)
  }

  // Open edit form
  const openEditForm = (goal) => {
    setEditingGoal(goal)

    setForm({
      title: goal.title,
      target_amount: String(goal.target_amount),
      saved_amount: String(goal.saved_amount),
      target_date: goal.target_date || '',
    })

    setError('')
    setSuccess('')
    setShowForm(true)
  }

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // Create or update goal
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!user?.id) return

    const target = Number(form.target_amount)
    const saved = Number(form.saved_amount)

    if (!form.title.trim()) {
      setError('Please enter a goal title.')
      return
    }

    if (!Number.isFinite(target) || target <= 0) {
      setError('Target amount must be greater than zero.')
      return
    }

    if (!Number.isFinite(saved) || saved < 0) {
      setError('Saved amount cannot be negative.')
      return
    }

    if (saved > target) {
      setError('Saved amount cannot exceed the target amount.')
      return
    }

    if (form.target_date) {
      const selectedDate = new Date(`${form.target_date}T00:00:00`)

      if (Number.isNaN(selectedDate.getTime())) {
        setError('Please enter a valid target date.')
        return
      }
    }

    setSaving(true)
    setError('')
    setSuccess('')

    const goalData = {
      title: form.title.trim(),
      target_amount: target,
      saved_amount: saved,
      target_date: form.target_date || null,
    }

    try {
      let result

      if (editingGoal) {
        result = await supabase
          .from('savings_goals')
          .update({
            ...goalData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingGoal.id)
          .eq('user_id', user.id)
      } else {
        result = await supabase
          .from('savings_goals')
          .insert({
            ...goalData,
            user_id: user.id,
          })
      }

      if (result.error) {
        setError(result.error.message)
      } else {
        setSuccess(
          editingGoal
            ? 'Savings goal updated successfully!'
            : 'Savings goal created successfully!'
        )

        setShowForm(false)
        setEditingGoal(null)
        setForm(initialForm)

        await fetchGoals()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Add savings contribution
  const addContribution = async (goal) => {
    if (!user?.id) return

    const amount = Number(contributions[goal.id])

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid contribution amount.')
      return
    }

    const remaining = Math.max(
      0,
      Number(goal.target_amount) - Number(goal.saved_amount)
    )

    if (amount > remaining) {
      setError(
        `You can add a maximum of ${currency(remaining)} to this goal.`
      )
      return
    }

    setError('')
    setSuccess('')

    try {
      const { error: updateError } = await supabase
        .from('savings_goals')
        .update({
          saved_amount: Number(goal.saved_amount) + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', goal.id)
        .eq('user_id', user.id)

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess('Savings contribution added successfully!')

        setContributions((previous) => ({
          ...previous,
          [goal.id]: '',
        }))

        await fetchGoals()
      }
    } catch {
      setError('Unable to add contribution. Please try again.')
    }
  }

  // Delete goal
  const deleteGoal = async (goalId) => {
    if (!user?.id) return

    const confirmed = window.confirm(
      'Are you sure you want to delete this savings goal?'
    )

    if (!confirmed) return

    setError('')
    setSuccess('')

    try {
      const { error: deleteError } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', user.id)

      if (deleteError) {
        setError(deleteError.message)
      } else {
        setSuccess('Savings goal deleted successfully!')
        await fetchGoals()
      }
    } catch {
      setError('Unable to delete this goal. Please try again.')
    }
  }

  // Summary calculations
  const totalTarget = goals.reduce(
    (sum, goal) => sum + Number(goal.target_amount),
    0
  )

  const totalSaved = goals.reduce(
    (sum, goal) => sum + Number(goal.saved_amount),
    0
  )

  const completedGoals = goals.filter(
    (goal) => Number(goal.saved_amount) >= Number(goal.target_amount)
  ).length

  const overallProgress =
    totalTarget > 0
      ? Math.min((totalSaved / totalTarget) * 100, 100)
      : 0

  return (
    <main className="min-h-screen bg-[#F5F7FC]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D8E6F4] bg-[#EDF4FB] px-3 py-1.5 text-xs font-bold text-[#3973B9]">
              <Sparkles size={14} />
              PLAN YOUR FINANCIAL FUTURE
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-[#102A43] sm:text-4xl">
              Savings Goals
            </h1>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Set goals, track your savings, and make your plans happen.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#102A43] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#102A43]/20 transition hover:-translate-y-1 hover:bg-[#173D60] hover:shadow-xl"
          >
            <Plus size={19} />
            Create New Goal
          </button>
        </section>

        {/* Notifications */}
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700"
          >
            {success}
          </div>
        )}

        {/* Summary cards */}
        <section className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: 'Total Goals',
              value: goals.length,
              icon: Target,
              color: 'text-[#3973B9] bg-[#EDF4FB]',
            },
            {
              title: 'Total Saved',
              value: currency(totalSaved),
              icon: Wallet,
              color: 'text-emerald-600 bg-emerald-50',
            },
            {
              title: 'Total Target',
              value: currency(totalTarget),
              icon: PiggyBank,
              color: 'text-[#3973B9] bg-[#EDF4FB]',
            },
            {
              title: 'Completed Goals',
              value: completedGoals,
              icon: CheckCircle2,
              color: 'text-amber-600 bg-amber-50',
            },
          ].map((item) => {
            const Icon = item.icon

            return (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-500">
                    {item.title}
                  </p>

                  <div className={`rounded-xl p-3 ${item.color}`}>
                    <Icon size={21} />
                  </div>
                </div>

                <h2 className="mt-5 break-all text-2xl font-extrabold text-[#102A43]">
                  {item.value}
                </h2>
              </div>
            )
          })}
        </section>

        {/* Overall progress */}
        <section className="mb-8 rounded-2xl border border-[#173D60] bg-[#102A43] p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-[#D8E6F4]">
                Overall savings progress
              </p>

              <h2 className="mt-2 text-3xl font-extrabold">
                {overallProgress.toFixed(1)}%
              </h2>

              <p className="mt-2 text-sm text-[#D8E6F4]">
                {currency(totalSaved)} saved out of {currency(totalTarget)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <TrendingUp size={34} />
            </div>
          </div>

          <div className="mt-7 h-3 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-700"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </section>

        {/* Create / Edit form */}
        {showForm && (
          <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#102A43]">
                  {editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Define what you're saving for.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-[#F3F7FB] hover:text-[#102A43]"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Goal Name
                </label>

                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Buy a new laptop"
                  maxLength={80}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#3973B9] focus:ring-4 focus:ring-[#D8E6F4]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Target Amount (₹)
                </label>

                <input
                  name="target_amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.target_amount}
                  onChange={handleChange}
                  placeholder="60000"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#3973B9] focus:ring-4 focus:ring-[#D8E6F4]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Already Saved (₹)
                </label>

                <input
                  name="saved_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.saved_amount}
                  onChange={handleChange}
                  placeholder="0"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#3973B9] focus:ring-4 focus:ring-[#D8E6F4]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Target Date
                </label>

                <input
                  name="target_date"
                  type="date"
                  value={form.target_date}
                  onChange={handleChange}
                  min={new Date().toLocaleDateString('en-CA')}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#3973B9] focus:ring-4 focus:ring-[#D8E6F4]"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-[#F3F7FB]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#102A43] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#173D60] disabled:opacity-60"
                >
                  {saving && <Loader2 size={17} className="animate-spin" />}

                  {saving
                    ? 'Saving...'
                    : editingGoal
                      ? 'Update Goal'
                      : 'Create Goal'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Goals list */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-extrabold text-[#102A43]">
              Your Goals
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Track every step towards your targets.
            </p>
          </div>

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="h-64 animate-pulse rounded-2xl bg-slate-200"
                />
              ))}
            </div>
          ) : goals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EDF4FB] text-[#3973B9]">
                <Target size={30} />
              </div>

              <h3 className="mt-5 text-lg font-bold text-[#102A43]">
                No savings goals yet
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Create your first goal and start building your savings.
              </p>

              <button
                type="button"
                onClick={openCreateForm}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#102A43] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#173D60]"
              >
                <Plus size={18} />
                Create Your First Goal
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {goals.map((goal) => {
                const target = Number(goal.target_amount)
                const saved = Number(goal.saved_amount)

                const progress =
                  target > 0
                    ? Math.min((saved / target) * 100, 100)
                    : 0

                const remaining = Math.max(target - saved, 0)
                const completed = saved >= target

                return (
                  <article
                    key={goal.id}
                    className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="rounded-xl bg-[#EDF4FB] p-3 text-[#3973B9]">
                          <Target size={23} />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-bold text-[#102A43]">
                            {goal.title}
                          </h3>

                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                            <CalendarDays size={13} />
                            {goal.target_date
                              ? new Date(`${goal.target_date}T00:00:00`).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'No target date'}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => openEditForm(goal)}
                          aria-label={`Edit ${goal.title}`}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-[#EDF4FB] hover:text-[#3973B9]"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteGoal(goal.id)}
                          aria-label={`Delete ${goal.title}`}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-7 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-400">
                          SAVED AMOUNT
                        </p>

                        <p className="mt-1 text-2xl font-extrabold text-[#102A43]">
                          {currency(saved)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-400">
                          TARGET
                        </p>

                        <p className="mt-1 text-lg font-bold text-slate-700">
                          {currency(target)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500">Progress</span>

                      <span className={completed ? 'text-emerald-600' : 'text-[#3973B9]'}>
                        {progress.toFixed(1)}%
                      </span>
                    </div>

                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          completed
                            ? 'bg-emerald-500'
                            : 'bg-[#3973B9]'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        {completed
                          ? 'Goal achieved!'
                          : `${currency(remaining)} remaining`}
                      </span>

                      {completed && (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                          <CheckCircle2 size={14} />
                          Completed
                        </span>
                      )}
                    </div>

                    {!completed && (
                      <div className="mt-6 border-t border-slate-100 pt-5">
                        <label className="mb-2 block text-xs font-bold text-slate-600">
                          Add savings contribution
                        </label>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            type="number"
                            min="0.01"
                            max={remaining}
                            step="0.01"
                            placeholder="Enter amount"
                            value={contributions[goal.id] || ''}
                            onChange={(e) =>
                              setContributions((previous) => ({
                                ...previous,
                                [goal.id]: e.target.value,
                              }))
                            }
                            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#3973B9] focus:ring-4 focus:ring-[#D8E6F4]"
                          />

                          <button
                            type="button"
                            onClick={() => addContribution(goal)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#102A43] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#173D60]"
                          >
                            <Plus size={16} />
                            Add Money
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-10 border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          Small savings today, bigger achievements tomorrow.
        </footer>

      </div>
    </main>
  )
}
