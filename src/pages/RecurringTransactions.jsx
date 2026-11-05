
import { useEffect, useState } from 'react'
import {
  Plus, Repeat, Pencil, Trash2, Pause, Play, X,
  CalendarDays, TrendingDown, TrendingUp, CheckCircle2,
  Clock3, Wallet, Search, Check, History, RefreshCw,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabase'

const today = () => {
  const date = new Date()
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0]
}

const initialForm = {
  title: '',
  amount: '',
  type: 'expense',
  category: '',
  description: '',
  frequency: 'monthly',
  start_date: today(),
  end_date: '',
}

const currency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount || 0))

const dateFormat = (date) => {
  if (!date) return 'Not scheduled'

  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Fetch data without changing React state.
async function fetchRecurringData(userId) {
  const { error: syncError } = await supabase.rpc(
    'sync_recurring_payments'
  )

  if (syncError) throw syncError

  const [rulesResult, paymentsResult] = await Promise.all([
    supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),

    supabase
      .from('recurring_transaction_payments')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: false }),
  ])

  if (rulesResult.error) throw rulesResult.error
  if (paymentsResult.error) throw paymentsResult.error

  return {
    rules: rulesResult.data || [],
    payments: paymentsResult.data || [],
  }
}

export default function RecurringTransactions() {
  const { user } = useAuth()

  const [rules, setRules] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatingPayment, setUpdatingPayment] = useState(null)
  const [syncing, setSyncing] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState(initialForm)

  // Initial data loading.
  useEffect(() => {
    if (!user?.id) return

    let cancelled = false

    const loadData = async () => {
      try {
        const data = await fetchRecurringData(user.id)

        if (cancelled) return

        setRules(data.rules)
        setPayments(data.payments)
        setError('')
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not load recurring payment data.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  // Refresh data after user actions.
  const refreshData = async (showSyncMessage = false) => {
    if (!user?.id) return

    setSyncing(true)

    try {
      const data = await fetchRecurringData(user.id)

      setRules(data.rules)
      setPayments(data.payments)
      setError('')

      if (showSyncMessage) {
        setSuccess('Payment records refreshed successfully.')
      }
    } catch (err) {
      setError(err.message || 'Could not load recurring payment data.')
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }

  const updateField = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const openCreateModal = () => {
    setEditingId(null)
    setForm({ ...initialForm, start_date: today() })
    setError('')
    setModalOpen(true)
  }

  const openEditModal = (rule) => {
    setEditingId(rule.id)

    setForm({
      title: rule.title,
      amount: String(rule.amount),
      type: rule.type,
      category: rule.category,
      description: rule.description || '',
      frequency: rule.frequency,
      start_date: rule.start_date,
      end_date: rule.end_date || '',
    })

    setError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return

    setModalOpen(false)
    setEditingId(null)
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!user?.id) {
      setError('Please log in again.')
      return
    }

    if (!form.title.trim() || !form.category.trim()) {
      setError('Title and category are required.')
      return
    }

    if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) {
      setError('Enter a valid amount greater than zero.')
      return
    }

    if (form.end_date && form.end_date < form.start_date) {
      setError('End date cannot be before start date.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      title: form.title.trim(),
      amount: Number(form.amount),
      type: form.type,
      category: form.category.trim(),
      description: form.description.trim() || null,
      frequency: form.frequency,
      start_date: form.start_date,
      end_date: form.end_date || null,
    }

    try {
      if (editingId) {
        const { error: updateError } = await supabase
          .from('recurring_transactions')
          .update(payload)
          .eq('id', editingId)
          .eq('user_id', user.id)

        if (updateError) throw updateError

        setSuccess('Recurring transaction updated.')
      } else {
        const { error: insertError } = await supabase
          .from('recurring_transactions')
          .insert({
            ...payload,
            user_id: user.id,
            next_due_date: form.start_date,
          })

        if (insertError) throw insertError

        setSuccess('Recurring transaction created.')
      }

      setModalOpen(false)
      setEditingId(null)
      setForm({ ...initialForm, start_date: today() })

      await refreshData()
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  // Mark an individual billing cycle as paid or pending.
  const togglePayment = async (payment) => {
    if (!user?.id) return

    setUpdatingPayment(payment.id)
    setError('')
    setSuccess('')

    const isPaid = payment.payment_status === 'paid'

    try {
      const { error: updateError } = await supabase
        .from('recurring_transaction_payments')
        .update({
          payment_status: isPaid ? 'pending' : 'paid',
          paid_at: isPaid ? null : new Date().toISOString(),
        })
        .eq('id', payment.id)
        .eq('user_id', user.id)

      if (updateError) throw updateError

      await refreshData()

      setSuccess(
        isPaid
          ? 'Payment changed back to pending.'
          : 'Payment marked as paid!'
      )
    } catch (err) {
      setError(err.message || 'Could not update payment.')
    } finally {
      setUpdatingPayment(null)
    }
  }

  const toggleStatus = async (rule) => {
    setError('')
    setSuccess('')

    const { error: updateError } = await supabase
      .from('recurring_transactions')
      .update({ is_active: !rule.is_active })
      .eq('id', rule.id)
      .eq('user_id', user.id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    await refreshData()

    setSuccess(
      rule.is_active
        ? 'Recurring rule paused.'
        : 'Recurring rule resumed.'
    )
  }

  const deleteRule = async (id) => {
    if (!window.confirm(
      'Delete this recurring transaction and its payment history?'
    )) {
      return
    }

    setError('')
    setSuccess('')

    const { error: deleteError } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    await refreshData()
    setSuccess('Recurring transaction deleted.')
  }

  // Find the latest payment record for each recurring rule.
  const latestPaymentByRule = {}

  payments.forEach((payment) => {
    const existing =
      latestPaymentByRule[payment.recurring_transaction_id]

    if (!existing || payment.due_date > existing.due_date) {
      latestPaymentByRule[payment.recurring_transaction_id] = payment
    }
  })

  const activeRules = rules.filter((rule) => rule.is_active)

  const pendingPayments = payments.filter(
    (payment) => payment.payment_status === 'pending'
  )

  const paidPayments = payments.filter(
    (payment) => payment.payment_status === 'paid'
  )

  const monthlyExpenses = activeRules
    .filter(
      (rule) =>
        rule.type === 'expense' && rule.frequency === 'monthly'
    )
    .reduce((total, rule) => total + Number(rule.amount), 0)

  const monthlyIncome = activeRules
    .filter(
      (rule) =>
        rule.type === 'income' && rule.frequency === 'monthly'
    )
    .reduce((total, rule) => total + Number(rule.amount), 0)

  const ruleById = Object.fromEntries(
    rules.map((rule) => [rule.id, rule])
  )

  const filteredRules = rules.filter((rule) => {
    const matchesSearch =
      rule.title.toLowerCase().includes(search.toLowerCase()) ||
      rule.category.toLowerCase().includes(search.toLowerCase())

    const latestPayment = latestPaymentByRule[rule.id]

    const matchesFilter =
      filter === 'all' ||
      (filter === 'pending' &&
        latestPayment?.payment_status === 'pending') ||
      (filter === 'paid' &&
        latestPayment?.payment_status === 'paid') ||
      (filter === 'paused' && !rule.is_active)

    return matchesSearch && matchesFilter
  })

  const sortedPendingPayments = [...pendingPayments].sort(
    (a, b) => a.due_date.localeCompare(b.due_date)
  )

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">

        {/* Header */}
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-600">
              <Repeat size={17} />
              Financial Management
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Recurring Transactions
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage regular bills, subscriptions and recurring income.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => refreshData(true)}
              disabled={syncing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={syncing ? 'animate-spin' : ''}
              />
              Refresh Payments
            </button>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
            >
              <Plus size={19} />
              Add Recurring
            </button>
          </div>
        </header>

        {/* Alerts */}
        {error && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button onClick={() => setError('')} aria-label="Dismiss error">
              <X size={17} />
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <span>{success}</span>
            <button onClick={() => setSuccess('')} aria-label="Dismiss message">
              <X size={17} />
            </button>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Rules"
            value={rules.length}
            icon={<Repeat size={21} />}
            color="indigo"
          />

          <SummaryCard
            title="Pending Payments"
            value={pendingPayments.length}
            icon={<Clock3 size={21} />}
            color="amber"
          />

          <SummaryCard
            title="Completed Payments"
            value={paidPayments.length}
            icon={<CheckCircle2 size={21} />}
            color="emerald"
          />

          <SummaryCard
            title="Monthly Expenses"
            value={currency(monthlyExpenses)}
            icon={<TrendingDown size={21} />}
            color="rose"
          />
        </div>

        {/* Income and expenses */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <TrendingUp size={23} />
            </div>
            <div>
              <p className="text-sm text-slate-500">
                Monthly Recurring Income
              </p>
              <p className="mt-1 text-xl font-bold">
                {currency(monthlyIncome)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
            <div className="rounded-xl bg-rose-50 p-3 text-rose-600">
              <Wallet size={23} />
            </div>
            <div>
              <p className="text-sm text-slate-500">
                Monthly Recurring Expenses
              </p>
              <p className="mt-1 text-xl font-bold">
                {currency(monthlyExpenses)}
              </p>
            </div>
          </div>
        </div>

        {/* Upcoming payments */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
              <CalendarDays size={21} />
            </div>
            <div>
              <h2 className="font-bold">Upcoming &amp; Pending Payments</h2>
              <p className="text-xs text-slate-500">
                Individual billing cycles that need attention
              </p>
            </div>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Loading payments...
            </p>
          ) : sortedPendingPayments.length === 0 ? (
            <div className="rounded-xl bg-slate-50 py-8 text-center">
              <CheckCircle2
                className="mx-auto mb-2 text-emerald-500"
                size={30}
              />
              <p className="font-medium text-slate-700">
                You're all caught up!
              </p>
              <p className="mt-1 text-sm text-slate-500">
                No pending payment cycles found.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedPendingPayments.slice(0, 5).map((payment) => {
                const rule = ruleById[payment.recurring_transaction_id]

                return (
                  <div
                    key={payment.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-semibold">
                        {rule?.title || 'Recurring payment'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {rule?.category || 'Payment'} · Due{' '}
                        {dateFormat(payment.due_date)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <div className="sm:text-right">
                        <p className="font-bold">
                          {currency(payment.amount)}
                        </p>
                        <span className="text-xs font-medium text-amber-600">
                          Pending
                        </span>
                      </div>

                      <button
                        onClick={() => togglePayment(payment)}
                        disabled={updatingPayment === payment.id}
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {updatingPayment === payment.id
                          ? 'Updating...'
                          : 'Mark Paid'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Payment history */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:p-6">
            <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
              <History size={21} />
            </div>
            <div>
              <h2 className="font-bold">Payment History</h2>
              <p className="text-xs text-slate-500">
                Every billing cycle is tracked separately
              </p>
            </div>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Loading history...
            </p>
          ) : payments.length === 0 ? (
            <div className="py-12 text-center">
              <History className="mx-auto mb-2 text-slate-300" size={30} />
              <p className="font-medium text-slate-700">
                No payment history yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Payment records will appear here when billing cycles become due.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {payments.map((payment) => {
                const rule = ruleById[payment.recurring_transaction_id]
                const isPaid = payment.payment_status === 'paid'

                return (
                  <div
                    key={payment.id}
                    className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center sm:px-6"
                  >
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-slate-900">
                        {rule?.title || 'Recurring payment'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {rule?.category || 'Payment'} · Due{' '}
                        {dateFormat(payment.due_date)}
                      </p>

                      {isPaid && payment.paid_at && (
                        <p className="mt-1 text-xs text-slate-400">
                          Paid on{' '}
                          {new Date(payment.paid_at).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <p className="font-bold">
                        {currency(payment.amount)}
                      </p>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {isPaid ? 'Paid' : 'Pending'}
                      </span>

                      <button
                        onClick={() => togglePayment(payment)}
                        disabled={updatingPayment === payment.id}
                        title={isPaid ? 'Undo payment' : 'Mark as paid'}
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        {updatingPayment === payment.id ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : isPaid ? (
                          <Clock3 size={16} />
                        ) : (
                          <Check size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* All recurring rules */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-bold">
                  All Recurring Transactions
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Manage your recurring rules and schedules.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search transactions..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white sm:w-56"
                  />
                </div>

                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                >
                  <option value="all">All transactions</option>
                  <option value="pending">Latest cycle pending</option>
                  <option value="paid">Latest cycle paid</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-slate-500">
              Loading recurring transactions...
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
                <Repeat size={27} />
              </div>
              <h3 className="font-semibold text-slate-800">
                No transactions found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Add a recurring rule or change your search filter.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredRules.map((rule) => {
                const latestPayment = latestPaymentByRule[rule.id]

                return (
                  <div
                    key={rule.id}
                    className="flex flex-col justify-between gap-4 p-5 transition hover:bg-slate-50/70 lg:flex-row lg:items-center"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={`rounded-xl p-3 ${
                          rule.type === 'income'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {rule.type === 'income'
                          ? <TrendingUp size={21} />
                          : <TrendingDown size={21} />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words font-semibold">
                            {rule.title}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              latestPayment?.payment_status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700'
                                : latestPayment?.payment_status === 'pending'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {latestPayment
                              ? latestPayment.payment_status === 'paid'
                                ? 'Latest cycle paid'
                                : 'Latest cycle pending'
                              : 'No payment yet'}
                          </span>

                          {!rule.is_active && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                              Paused
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {rule.category} · {rule.frequency}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Next due: {dateFormat(rule.next_due_date)}
                        </p>

                        {rule.description && (
                          <p className="mt-1 break-words text-xs text-slate-400">
                            {rule.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
                      <p
                        className={`font-bold ${
                          rule.type === 'income'
                            ? 'text-emerald-600'
                            : 'text-slate-900'
                        }`}
                      >
                        {rule.type === 'income' ? '+' : '-'}
                        {currency(rule.amount)}
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => openEditModal(rule)}
                          title="Edit"
                          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => toggleStatus(rule)}
                          title={rule.is_active ? 'Pause' : 'Resume'}
                          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                        >
                          {rule.is_active
                            ? <Pause size={16} />
                            : <Play size={16} />}
                        </button>

                        <button
                          onClick={() => deleteRule(rule.id)}
                          title="Delete"
                          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Create / Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="my-auto w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    {editingId ? 'Edit Recurring Rule' : 'New Recurring Rule'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Enter the details of your regular transaction.
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={21} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Transaction Title</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={updateField}
                    placeholder="e.g. House Rent"
                    className="form-input"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="form-label">Amount (₹)</label>
                    <input
                      name="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.amount}
                      onChange={updateField}
                      placeholder="5000"
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Transaction Type</label>
                    <select
                      name="type"
                      value={form.type}
                      onChange={updateField}
                      className="form-input"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Category</label>
                  <input
                    name="category"
                    value={form.category}
                    onChange={updateField}
                    placeholder="e.g. Housing, Salary, Subscription"
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Frequency</label>
                  <select
                    name="frequency"
                    value={form.frequency}
                    onChange={updateField}
                    className="form-input"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="form-label">Start Date</label>
                    <input
                      name="start_date"
                      type="date"
                      value={form.start_date}
                      onChange={updateField}
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">End Date (Optional)</label>
                    <input
                      name="end_date"
                      type="date"
                      min={form.start_date}
                      value={form.end_date}
                      onChange={updateField}
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Description (Optional)</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    placeholder="Add a note..."
                    rows={3}
                    className="form-input resize-none"
                  />
                </div>

                {error && (
                  <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {saving
                      ? 'Saving...'
                      : editingId
                        ? 'Save Changes'
                        : 'Create Recurring Rule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .form-label {
          display: block;
          margin-bottom: 7px;
          color: #475569;
          font-size: 13px;
          font-weight: 600;
        }

        .form-input {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          padding: 11px 12px;
          color: #0f172a;
          outline: none;
          font-size: 14px;
          transition: border-color 150ms, box-shadow 150ms;
        }

        .form-input:focus {
          border-color: #818cf8;
          background: white;
          box-shadow: 0 0 0 3px rgb(99 102 241 / 10%);
        }

        .form-input option {
          background: white;
          color: #0f172a;
        }
      `}</style>
    </div>
  )
}

function SummaryCard({ title, value, icon, color }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`rounded-xl p-2.5 ${colors[color]}`}>
          {icon}
        </div>
      </div>

      <p className="mt-4 break-words text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  )
}
