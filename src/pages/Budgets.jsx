
import { useEffect, useMemo, useState } from 'react'
import {
  Target,
  Plus,
  Pencil,
  Trash2,
  X,
  Wallet,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Utensils,
  ShoppingBag,
  Car,
  Receipt,
  Film,
  HeartPulse,
  GraduationCap,
  Briefcase,
  MoreHorizontal,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

const categories = [
  'Food',
  'Shopping',
  'Transport',
  'Bills',
  'Entertainment',
  'Health',
  'Education',
  'Other',
]

const categoryIcons = {
  Food: Utensils,
  Shopping: ShoppingBag,
  Transport: Car,
  Bills: Receipt,
  Entertainment: Film,
  Health: HeartPulse,
  Education: GraduationCap,
  Other: MoreHorizontal,
}

const currency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0)

const getCurrentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

const getMonthLabel = (month) => {
  const date = new Date(`${month}T12:00:00`)
  return date.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
}

const getMonthRange = (month) => {
  const start = month
  const date = new Date(`${month}T12:00:00`)
  date.setMonth(date.getMonth() + 1)

  const end = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`

  return { start, end }
}

export default function Budgets() {
  const { user } = useAuth()

  const [budgets, setBudgets] = useState([])
  const [transactions, setTransactions] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [form, setForm] = useState({
    category: 'Food',
    monthly_limit: '',
  })

  async function loadBudgets(isRefresh = false) {
    if (!user?.id) return

    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    setError('')

    try {
      const { start, end } = getMonthRange(selectedMonth)

      const [budgetResult, transactionResult] = await Promise.all([
        supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id)
          .eq('month', selectedMonth)
          .order('created_at', { ascending: false }),

        supabase
          .from('transactions')
          .select('id, amount, type, category, transaction_date')
          .eq('user_id', user.id)
          .eq('type', 'expense')
          .gte('transaction_date', start)
          .lt('transaction_date', end),
      ])

      if (budgetResult.error) throw budgetResult.error
      if (transactionResult.error) throw transactionResult.error

      setBudgets(budgetResult.data || [])
      setTransactions(transactionResult.data || [])
    } catch (err) {
      console.error('Budget loading error:', err)
      setError('Unable to load your budgets. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    let active = true

    async function fetchData() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const { start, end } = getMonthRange(selectedMonth)

        const [budgetResult, transactionResult] = await Promise.all([
          supabase
            .from('budgets')
            .select('*')
            .eq('user_id', user.id)
            .eq('month', selectedMonth)
            .order('created_at', { ascending: false }),

          supabase
            .from('transactions')
            .select('id, amount, type, category, transaction_date')
            .eq('user_id', user.id)
            .eq('type', 'expense')
            .gte('transaction_date', start)
            .lt('transaction_date', end),
        ])

        if (budgetResult.error) throw budgetResult.error
        if (transactionResult.error) throw transactionResult.error

        if (active) {
          setBudgets(budgetResult.data || [])
          setTransactions(transactionResult.data || [])
        }
      } catch (err) {
        console.error('Budget loading error:', err)

        if (active) {
          setError('Unable to load your budgets. Please try again.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchData()

    return () => {
      active = false
    }
  }, [user?.id, selectedMonth])

  const spendingByCategory = useMemo(() => {
    return transactions.reduce((result, transaction) => {
      const category = transaction.category || 'Other'

      result[category] =
        (result[category] || 0) + Number(transaction.amount || 0)

      return result
    }, {})
  }, [transactions])

  const budgetStats = useMemo(() => {
    const totalBudget = budgets.reduce(
      (sum, budget) => sum + Number(budget.monthly_limit || 0),
      0
    )

    const totalSpent = budgets.reduce(
      (sum, budget) =>
        sum + (spendingByCategory[budget.category] || 0),
      0
    )

    const remaining = totalBudget - totalSpent

    return {
      totalBudget,
      totalSpent,
      remaining,
      percentage:
        totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
    }
  }, [budgets, spendingByCategory])

  function openAddForm() {
    setEditingId(null)

    const availableCategory = categories.find(
      (category) =>
        !budgets.some((budget) => budget.category === category)
    )

    setForm({
      category: availableCategory || 'Food',
      monthly_limit: '',
    })

    setFormOpen(true)
  }

  function openEditForm(budget) {
    setEditingId(budget.id)

    setForm({
      category: budget.category,
      monthly_limit: String(budget.monthly_limit),
    })

    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)

    setForm({
      category: 'Food',
      monthly_limit: '',
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!user?.id) {
      setError('Please sign in again to manage budgets.')
      return
    }

    const amount = Number(form.monthly_limit)

    if (!form.category || !Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid category and monthly budget amount.')
      return
    }

    const duplicate = budgets.some(
      (budget) =>
        budget.category === form.category &&
        budget.id !== editingId
    )

    if (duplicate) {
      setError('A budget for this category already exists this month.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const payload = {
        user_id: user.id,
        category: form.category,
        monthly_limit: amount,
        month: selectedMonth,
      }

      if (editingId) {
        const { error: updateError } = await supabase
          .from('budgets')
          .update(payload)
          .eq('id', editingId)
          .eq('user_id', user.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('budgets')
          .insert([payload])

        if (insertError) throw insertError
      }

      closeForm()
      await loadBudgets(true)
    } catch (err) {
      console.error('Budget save error:', err)

      setError(
        err.code === '23505'
          ? 'A budget for this category already exists this month.'
          : 'Unable to save the budget. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!user?.id) return

    const confirmed = window.confirm(
      'Are you sure you want to delete this budget?'
    )

    if (!confirmed) return

    setDeletingId(id)
    setError('')

    try {
      const { error: deleteError } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      setBudgets((current) =>
        current.filter((budget) => budget.id !== id)
      )
    } catch (err) {
      console.error('Budget delete error:', err)
      setError('Unable to delete this budget. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F7FC] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Heading */}
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#3973B9]">
              <Target size={17} />
              Budget planning
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-[#102A43] sm:text-3xl">
              Manage Your Budgets
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Set spending limits and stay in control of your finances.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="month"
              value={selectedMonth.slice(0, 7)}
              onChange={(event) => {
                const value = event.target.value
                if (value) setSelectedMonth(`${value}-01`)
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#3973B9] focus:ring-4 focus:ring-[#D8E6F4]"
              aria-label="Select budget month"
            />

            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#102A43] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#102A43]/20 transition hover:bg-[#173D60]"
            >
              <Plus size={18} />
              Add Budget
            </button>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-red-600">{error}</p>

            <button
              type="button"
              onClick={() => setError('')}
              className="text-sm font-bold text-red-600 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Summary */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: 'Total Budget',
              value: budgetStats.totalBudget,
              icon: Wallet,
              color: 'text-[#3973B9]',
              bg: 'bg-[#EDF4FB]',
            },
            {
              title: 'Total Spent',
              value: budgetStats.totalSpent,
              icon: TrendingUp,
              color: 'text-rose-600',
              bg: 'bg-rose-50',
            },
            {
              title: 'Remaining',
              value: budgetStats.remaining,
              icon: CheckCircle2,
              color:
                budgetStats.remaining >= 0
                  ? 'text-emerald-600'
                  : 'text-rose-600',
              bg:
                budgetStats.remaining >= 0
                  ? 'bg-emerald-50'
                  : 'bg-rose-50',
            },
            {
              title: 'Budget Usage',
              value: `${budgetStats.percentage.toFixed(1)}%`,
              icon: Target,
              color: 'text-[#3973B9]',
              bg: 'bg-[#EDF4FB]',
              isPercentage: true,
            },
          ].map((card) => {
            const Icon = card.icon

            return (
              <div
                key={card.title}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className={`rounded-xl p-3 ${card.bg} ${card.color}`}>
                    <Icon size={21} />
                  </div>

                  <span className={`text-xs font-bold ${card.color}`}>
                    {card.title === 'Budget Usage' ? 'Monthly' : 'Overview'}
                  </span>
                </div>

                <p className="mt-5 text-sm font-medium text-slate-500">
                  {card.title}
                </p>

                <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#102A43]">
                  {loading
                    ? '...'
                    : card.isPercentage
                      ? card.value
                      : currency(card.value)}
                </h2>
              </div>
            )
          })}
        </section>

        {/* Overall progress */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-[#102A43]">
                Monthly Budget Progress
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {getMonthLabel(selectedMonth)}
              </p>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${
                budgetStats.percentage >= 100
                  ? 'bg-rose-50 text-rose-600'
                  : budgetStats.percentage >= 80
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {loading
                ? 'Calculating...'
                : budgetStats.percentage >= 100
                  ? 'Budget exceeded'
                  : budgetStats.percentage >= 80
                    ? 'Approaching limit'
                    : 'On track'}
            </span>
          </div>

          <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                budgetStats.percentage >= 100
                  ? 'bg-rose-500'
                  : budgetStats.percentage >= 80
                    ? 'bg-amber-500'
                    : 'bg-[#3973B9]'
              }`}
              style={{
                width: `${Math.min(budgetStats.percentage, 100)}%`,
              }}
            />
          </div>

          <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs font-semibold text-slate-500">
            <span>{currency(budgetStats.totalSpent)} spent</span>
            <span>{currency(budgetStats.totalBudget)} budgeted</span>
          </div>
        </section>

        {/* Category budgets */}
        <section>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-[#102A43]">
                Category Budgets
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Track spending for each category.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadBudgets(true)}
              disabled={refreshing || loading}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:border-[#D8E6F4] hover:bg-[#F3F7FB] hover:text-[#3973B9] disabled:opacity-50"
              aria-label="Refresh budgets"
            >
              <RefreshCw
                size={17}
                className={refreshing ? 'animate-spin' : ''}
              />
            </button>
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-52 animate-pulse rounded-2xl bg-white"
                />
              ))}
            </div>
          ) : budgets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDF4FB] text-[#3973B9]">
                <Target size={27} />
              </div>

              <h3 className="mt-4 text-lg font-bold text-[#102A43]">
                No budgets for this month
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                Start planning your finances by creating your first category budget.
              </p>

              <button
                type="button"
                onClick={openAddForm}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#102A43] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#173D60]"
              >
                <Plus size={17} />
                Create first budget
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {budgets.map((budget) => {
                const Icon =
                  categoryIcons[budget.category] || Briefcase

                const spent =
                  spendingByCategory[budget.category] || 0

                const limit = Number(budget.monthly_limit || 0)
                const percentage =
                  limit > 0 ? (spent / limit) * 100 : 0

                const remaining = limit - spent
                const exceeded = percentage >= 100
                const warning = percentage >= 80 && !exceeded

                return (
                  <article
                    key={budget.id}
                    className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-[#EDF4FB] p-3 text-[#3973B9]">
                          <Icon size={21} />
                        </div>

                        <div>
                          <h3 className="font-bold text-[#102A43]">
                            {budget.category}
                          </h3>

                          <p className="mt-0.5 text-xs text-slate-400">
                            Monthly budget
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditForm(budget)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-[#EDF4FB] hover:text-[#3973B9]"
                          aria-label={`Edit ${budget.category} budget`}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(budget.id)}
                          disabled={deletingId === budget.id}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                          aria-label={`Delete ${budget.category} budget`}
                        >
                          {deletingId === budget.id ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          Amount spent
                        </p>

                        <p className="mt-1 text-xl font-extrabold text-[#102A43]">
                          {currency(spent)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-medium text-slate-400">
                          Budget limit
                        </p>

                        <p className="mt-1 font-bold text-slate-700">
                          {currency(limit)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          exceeded
                            ? 'bg-rose-500'
                            : warning
                              ? 'bg-amber-500'
                              : 'bg-[#3973B9]'
                        }`}
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                        }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-bold ${
                          exceeded
                            ? 'text-rose-600'
                            : warning
                              ? 'text-amber-600'
                              : 'text-[#3973B9]'
                        }`}
                      >
                        {percentage.toFixed(1)}% used
                      </span>

                      <span className="text-xs font-semibold text-slate-500">
                        {currency(Math.abs(remaining))}{' '}
                        {remaining >= 0 ? 'left' : 'over'}
                      </span>
                    </div>

                    {(warning || exceeded) && (
                      <div
                        className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-xs font-semibold ${
                          exceeded
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        <AlertTriangle size={15} />
                        {exceeded
                          ? 'You have exceeded this budget.'
                          : 'You are approaching your budget limit.'}
                      </div>
                    )}

                    {!warning && !exceeded && (
                      <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 size={15} />
                        Spending is within your budget.
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <footer className="pb-4 text-center text-xs text-slate-400">
          Budget tracking is based on your recorded expense transactions.
        </footer>
      </div>

      {/* Add / Edit Modal */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm()
          }}
        >
          <div className="my-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#102A43]">
                  {editingId ? 'Edit Budget' : 'Create Budget'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Set a monthly spending limit.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close budget form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="budget-category"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Category
                </label>

                <select
                  id="budget-category"
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#3973B9] focus:ring-4 focus:ring-[#D8E6F4]"
                >
                  {categories.map((category) => {
                    const alreadyUsed = budgets.some(
                      (budget) =>
                        budget.category === category &&
                        budget.id !== editingId
                    )

                    return (
                      <option
                        key={category}
                        value={category}
                        disabled={alreadyUsed}
                      >
                        {category}{alreadyUsed ? ' (Budget exists)' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label
                  htmlFor="monthly-limit"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Monthly Limit (₹)
                </label>

                <input
                  id="monthly-limit"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.monthly_limit}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      monthly_limit: event.target.value,
                    }))
                  }
                  placeholder="e.g. 5000"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#3973B9] focus:ring-4 focus:ring-[#D8E6F4]"
                />
              </div>

              <div className="rounded-xl border border-[#D8E6F4] bg-[#EDF4FB] p-4">
                <p className="text-xs font-semibold text-[#3973B9]">
                  Budget period
                </p>

                <p className="mt-1 font-bold text-[#102A43]">
                  {getMonthLabel(selectedMonth)}
                </p>

                <p className="mt-1 text-xs text-[#3973B9]">
                  This budget applies only to the selected month.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#102A43] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#102A43]/20 transition hover:bg-[#173D60] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus size={17} />
                    {editingId ? 'Update Budget' : 'Create Budget'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
