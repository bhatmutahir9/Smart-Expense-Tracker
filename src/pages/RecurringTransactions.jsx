
import { useEffect, useMemo, useState } from 'react'
import {
  Plus, Repeat, Pencil, Trash2, Pause, Play, X,
  CalendarDays, TrendingDown, TrendingUp, CheckCircle2,
  Clock3, Search, Check, History, RefreshCw,
  ArrowUpRight, ArrowDownRight,
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

  const parsedDate = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) return 'Invalid date'

  return parsedDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

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

  const ruleById = useMemo(
    () => Object.fromEntries(rules.map((rule) => [rule.id, rule])),
    [rules]
  )

  // Fetch recurring rules and payment history.
  useEffect(() => {
    let cancelled = false

    async function loadData() {
      if (!user?.id) {
        setRules([])
        setPayments([])
        setLoading(false)
        return
      }

      setLoading(true)

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
        if (!cancelled) setLoading(false)
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  // Refresh recurring rules and payments.
  const refreshData = async (showSyncMessage = false) => {
    if (!user?.id) return false

    setSyncing(true)

    try {
      const data = await fetchRecurringData(user.id)

      setRules(data.rules)
      setPayments(data.payments)
      setError('')

      if (showSyncMessage) {
        setSuccess('Payment records refreshed successfully.')
      }

      return true
    } catch (err) {
      setError(err.message || 'Could not refresh recurring payments.')
      return false
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }

  // Update form fields.
  // Switching to income automatically clears the end date.
  const updateField = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'type' && value === 'income'
        ? { end_date: '' }
        : {}),
    }))
  }

  // Open create modal.
  const openCreateModal = () => {
    setEditingId(null)
    setForm({ ...initialForm, start_date: today() })
    setError('')
    setSuccess('')
    setModalOpen(true)
  }

  // Open edit modal.
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
      end_date: rule.type === 'expense' ? rule.end_date || '' : '',
    })

    setError('')
    setSuccess('')
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return

    setModalOpen(false)
    setEditingId(null)
    setError('')
  }

  // Create or update recurring rule.
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

    if (
      !Number.isFinite(Number(form.amount)) ||
      Number(form.amount) <= 0
    ) {
      setError('Enter a valid amount greater than zero.')
      return
    }

    // End-date validation applies only to expenses.
    if (
      form.type === 'expense' &&
      form.end_date &&
      form.end_date < form.start_date
    ) {
      setError('End date cannot be before start date.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    // Income always has NULL end_date.
    // Expenses retain their optional end date.
    const payload = {
      title: form.title.trim(),
      amount: Number(form.amount),
      type: form.type,
      category: form.category.trim(),
      description: form.description.trim() || null,
      frequency: form.frequency,
      start_date: form.start_date,
      end_date:
        form.type === 'income'
          ? null
          : form.end_date || null,
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

  // Mark income as received or expense as paid.
  const togglePayment = async (payment) => {
    if (!user?.id || updatingPayment) return

    const rule = ruleById[payment.recurring_transaction_id]
    const isIncome = rule?.type === 'income'
    const isPaid = payment.payment_status === 'paid'

    setUpdatingPayment(payment.id)
    setError('')
    setSuccess('')

    try {
      const { error: rpcError } = await supabase.rpc(
        'set_recurring_payment_status',
        {
          p_payment_id: payment.id,
          p_mark_paid: !isPaid,
        }
      )

      if (rpcError) throw rpcError

      const refreshed = await refreshData()

      if (refreshed) {
        if (isPaid) {
          setSuccess(
            isIncome
              ? 'Income changed back to pending. Linked transaction removed.'
              : 'Payment changed back to pending. Linked transaction removed.'
          )
        } else {
          setSuccess(
            isIncome
              ? 'Income marked as received! Transaction added successfully.'
              : 'Payment marked as paid! Transaction added successfully.'
          )
        }
      }
    } catch (err) {
      console.error('Recurring payment update failed:', err)
      setError(err.message || 'Could not update payment. Please try again.')
    } finally {
      setUpdatingPayment(null)
    }
  }

  // Pause or resume a recurring rule.
  const toggleStatus = async (rule) => {
    if (!user?.id) return

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

  // Delete a recurring rule.
  const deleteRule = async (id) => {
    if (!user?.id) return

    if (
      !window.confirm(
        'Delete this recurring transaction and its payment history?'
      )
    ) {
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

  // Find the latest payment for every recurring rule.
  const latestPaymentByRule = useMemo(() => {
    const latest = {}

    payments.forEach((payment) => {
      const existing = latest[payment.recurring_transaction_id]

      if (!existing || payment.due_date > existing.due_date) {
        latest[payment.recurring_transaction_id] = payment
      }
    })

    return latest
  }, [payments])

  // --------------------------------------------------
  // RECURRING TOTALS
  // --------------------------------------------------

  const currentDate = today()

  // Include active rules that have started and have not expired.
  // Income has no end date, so it will not expire automatically.
  const activeRules = useMemo(
    () =>
      rules.filter((rule) => {
        const hasStarted =
          !rule.start_date || rule.start_date <= currentDate

        const hasNotExpired =
          rule.type === 'income' ||
          !rule.end_date ||
          rule.end_date >= currentDate

        return (
          rule.is_active === true &&
          hasStarted &&
          hasNotExpired
        )
      }),
    [rules, currentDate]
  )

  // Total active recurring income.
  const totalRecurringIncome = useMemo(
    () =>
      activeRules
        .filter((rule) => rule.type === 'income')
        .reduce(
          (total, rule) => total + Number(rule.amount || 0),
          0
        ),
    [activeRules]
  )

  // Total active recurring expenses.
  const totalRecurringExpenses = useMemo(
    () =>
      activeRules
        .filter((rule) => rule.type === 'expense')
        .reduce(
          (total, rule) => total + Number(rule.amount || 0),
          0
        ),
    [activeRules]
  )

  // Separate monthly expenses total.
  const monthlyExpenses = useMemo(
    () =>
      activeRules
        .filter(
          (rule) =>
            rule.type === 'expense' &&
            rule.frequency === 'monthly'
        )
        .reduce(
          (total, rule) => total + Number(rule.amount || 0),
          0
        ),
    [activeRules]
  )

  // --------------------------------------------------
  // PAYMENT SUMMARY
  // --------------------------------------------------

  const pendingPayments = payments.filter(
    (payment) => payment.payment_status === 'pending'
  )

  const paidPayments = payments.filter(
    (payment) => payment.payment_status === 'paid'
  )

  // Search and filter recurring rules.
  const filteredRules = rules.filter((rule) => {
    const matchesSearch =
      (rule.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (rule.category || '').toLowerCase().includes(search.toLowerCase())

    const latestPayment = latestPaymentByRule[rule.id]

    const matchesFilter =
      filter === 'all' ||
      (filter === 'pending' && latestPayment?.payment_status === 'pending') ||
      (filter === 'paid' && latestPayment?.payment_status === 'paid') ||
      (filter === 'paused' && !rule.is_active)

    return matchesSearch && matchesFilter
  })

  const sortedPendingPayments = [...pendingPayments].sort(
    (a, b) => a.due_date.localeCompare(b.due_date)
  )

  return (
    <div className="min-h-screen bg-[#f6f7fb] px-3 py-5 text-slate-900 sm:px-5 lg:px-7">
      <div className="mx-auto max-w-7xl space-y-5">

        {/* Header */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">
              <Repeat size={15} />
              Financial Management
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">
              Recurring Transactions
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Keep track of regular bills, subscriptions and income.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => refreshData(true)}
              disabled={syncing}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-60 sm:flex-none"
            >
              <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
              Refresh
            </button>

            <button
              onClick={openCreateModal}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 sm:flex-none"
            >
              <Plus size={17} />
              Add Recurring
            </button>
          </div>
        </header>

        {/* Alerts */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
          />
        )}

        {success && (
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess('')}
          />
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <SummaryCard
            title="Total Rules"
            value={rules.length}
            icon={<Repeat size={18} />}
            color="indigo"
          />

          <SummaryCard
            title="Pending"
            value={pendingPayments.length}
            icon={<Clock3 size={18} />}
            color="amber"
          />

          <SummaryCard
            title="Completed"
            value={paidPayments.length}
            icon={<CheckCircle2 size={18} />}
            color="emerald"
          />

          <SummaryCard
            title="Monthly Expenses"
            value={currency(monthlyExpenses)}
            icon={<TrendingDown size={18} />}
            color="rose"
          />
        </div>

        {/* Income and Expense Overview */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

          {/* Recurring Income Card */}
          <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Active Recurring Income
              </p>

              <p className="mt-1 text-xl font-bold tracking-tight text-emerald-600">
                {currency(totalRecurringIncome)}
              </p>

              <p className="mt-1 text-[11px] text-slate-400">
                Total of all active income rules
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <ArrowUpRight size={21} />
            </div>
          </div>

          {/* Recurring Expense Card */}
          <div className="flex items-center justify-between rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Active Recurring Expenses
              </p>

              <p className="mt-1 text-xl font-bold tracking-tight text-rose-600">
                {currency(totalRecurringExpenses)}
              </p>

              <p className="mt-1 text-[11px] text-slate-400">
                Total of all active expense rules
              </p>
            </div>

            <div className="rounded-xl bg-rose-50 p-2.5 text-rose-600">
              <ArrowDownRight size={21} />
            </div>
          </div>
        </div>

        {/* Upcoming and Pending */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <SectionHeading
            icon={<CalendarDays size={19} />}
            title="Upcoming & Pending"
            subtitle="Billing cycles waiting for confirmation"
            color="indigo"
          />

          {loading ? (
            <LoadingState text="Loading payments..." />
          ) : sortedPendingPayments.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 size={27} />}
              title="You're all caught up!"
              description="No pending payment cycles found."
            />
          ) : (
            <div className="space-y-2.5">
              {sortedPendingPayments.slice(0, 5).map((payment) => {
                const rule = ruleById[payment.recurring_transaction_id]
                const isIncome = rule?.type === 'income'

                return (
                  <div
                    key={payment.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-slate-200 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {isIncome ? (
                          <TrendingUp size={18} />
                        ) : (
                          <TrendingDown size={18} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {rule?.title || 'Recurring transaction'}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {rule?.category || 'Transaction'} · Due {dateFormat(payment.due_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <div className="sm:text-right">
                        <p className="text-sm font-bold text-slate-900">
                          {isIncome ? '+' : '-'}{currency(payment.amount)}
                        </p>

                        <span className="text-[11px] font-semibold text-amber-600">
                          Pending
                        </span>
                      </div>

                      <button
                        onClick={() => togglePayment(payment)}
                        disabled={updatingPayment !== null}
                        className={`min-w-[125px] rounded-lg px-3 py-2 text-xs font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          isIncome
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                      >
                        {updatingPayment === payment.id
                          ? 'Updating...'
                          : isIncome
                            ? 'Mark Received'
                            : 'Mark as Paid'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Payment History */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
            <SectionHeading
              icon={<History size={19} />}
              title="Payment History"
              subtitle="A record of every recurring billing cycle"
              color="violet"
            />
          </div>

          {loading ? (
            <LoadingState text="Loading history..." />
          ) : payments.length === 0 ? (
            <EmptyState
              icon={<History size={27} />}
              title="No payment history yet"
              description="Your billing cycles will appear here."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {payments.map((payment) => {
                const rule = ruleById[payment.recurring_transaction_id]
                const isPaid = payment.payment_status === 'paid'
                const isIncome = rule?.type === 'income'

                return (
                  <div
                    key={payment.id}
                    className="flex flex-col justify-between gap-3 px-4 py-3.5 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:px-5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {isIncome ? (
                          <TrendingUp size={17} />
                        ) : (
                          <TrendingDown size={17} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {rule?.title || 'Recurring transaction'}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {rule?.category || 'Transaction'} · {dateFormat(payment.due_date)}
                        </p>

                        {isPaid && payment.paid_at && (
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {isIncome ? 'Received' : 'Paid'} on{' '}
                            {new Date(payment.paid_at).toLocaleDateString('en-IN')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <p className={`text-sm font-bold ${isIncome ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {isIncome ? '+' : '-'}{currency(payment.amount)}
                      </p>

                      <span
                        className={`min-w-[75px] rounded-full px-2.5 py-1 text-center text-[11px] font-bold ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {isPaid
                          ? isIncome
                            ? 'Received'
                            : 'Paid'
                          : 'Pending'}
                      </span>

                      <button
                        onClick={() => togglePayment(payment)}
                        disabled={updatingPayment !== null}
                        title={
                          isPaid
                            ? isIncome ? 'Undo received' : 'Undo paid'
                            : isIncome ? 'Mark received' : 'Mark paid'
                        }
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
                      >
                        {updatingPayment === payment.id ? (
                          <RefreshCw size={15} className="animate-spin" />
                        ) : isPaid ? (
                          <Clock3 size={15} />
                        ) : (
                          <Check size={15} />
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* All Recurring Rules */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  All Recurring Transactions
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Manage your recurring rules and schedules.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search transactions..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none transition focus:border-indigo-400 focus:bg-white sm:w-52"
                  />
                </div>

                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-indigo-400"
                >
                  <option value="all">All transactions</option>
                  <option value="pending">Latest cycle pending</option>
                  <option value="paid">Latest cycle completed</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <LoadingState text="Loading recurring transactions..." />
          ) : filteredRules.length === 0 ? (
            <EmptyState
              icon={<Repeat size={27} />}
              title="No transactions found"
              description="Add a recurring rule or change your search filter."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredRules.map((rule) => {
                const latestPayment = latestPaymentByRule[rule.id]
                const isIncome = rule.type === 'income'

                return (
                  <div
                    key={rule.id}
                    className="flex flex-col justify-between gap-3 p-4 transition hover:bg-slate-50/60 sm:flex-row sm:items-center sm:px-5"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {isIncome ? (
                          <TrendingUp size={19} />
                        ) : (
                          <TrendingDown size={19} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-sm font-bold text-slate-800">
                            {rule.title}
                          </h3>

                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              latestPayment?.payment_status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700'
                                : latestPayment?.payment_status === 'pending'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {latestPayment
                              ? latestPayment.payment_status === 'paid'
                                ? isIncome ? 'Received' : 'Paid'
                                : 'Pending'
                              : 'No payment yet'}
                          </span>

                          {!rule.is_active && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                              Paused
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          {rule.category} · {rule.frequency}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                          Next due: {dateFormat(rule.next_due_date)}
                        </p>

                        {rule.description && (
                          <p className="mt-1 break-words text-xs text-slate-400">
                            {rule.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                      <p className={`text-sm font-bold ${isIncome ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {isIncome ? '+' : '-'}{currency(rule.amount)}
                      </p>

                      <div className="flex items-center gap-1.5">
                        <ActionButton
                          title="Edit"
                          onClick={() => openEditModal(rule)}
                        >
                          <Pencil size={15} />
                        </ActionButton>

                        <ActionButton
                          title={rule.is_active ? 'Pause' : 'Resume'}
                          onClick={() => toggleStatus(rule)}
                        >
                          {rule.is_active ? (
                            <Pause size={15} />
                          ) : (
                            <Play size={15} />
                          )}
                        </ActionButton>

                        <ActionButton
                          title="Delete"
                          danger
                          onClick={() => deleteRule(rule.id)}
                        >
                          <Trash2 size={15} />
                        </ActionButton>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-3 backdrop-blur-[3px]">
            <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingId ? 'Edit Recurring Rule' : 'New Recurring Rule'}
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Set up your regular income or expense.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={19} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5 p-5 sm:px-6 sm:py-5">
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

                <div className="grid grid-cols-2 gap-3">
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

                <div className={form.type === 'expense' ? 'grid grid-cols-2 gap-3' : ''}>
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

                  {/* End Date is only available for expenses. */}
                  {form.type === 'expense' && (
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
                  )}
                </div>

                {form.type === 'income' && (
                  <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    Income will continue without an end date. You can pause it whenever you want.
                  </p>
                )}

                <div>
                  <label className="form-label">Description (Optional)</label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    placeholder="Add a note..."
                    rows={2}
                    className="form-input resize-none"
                  />
                </div>

                {error && (
                  <p className="rounded-lg border border-red-100 bg-red-50 p-2.5 text-xs text-red-600">
                    {error}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
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
          margin-bottom: 6px;
          color: #475569;
          font-size: 12px;
          font-weight: 650;
        }

        .form-input {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          padding: 10px 11px;
          color: #0f172a;
          outline: none;
          font-size: 13px;
          transition: border-color 150ms, box-shadow 150ms, background 150ms;
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

// Summary Card Component
function SummaryCard({ title, value, icon, color }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-500">{title}</p>

        <div className={`rounded-xl p-2 ${colors[color]}`}>
          {icon}
        </div>
      </div>

      <p className="mt-3 break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        {value}
      </p>
    </div>
  )
}

// Alert Component
function Alert({ type, message, onClose }) {
  const styles = type === 'error'
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700'

  return (
    <div className={`flex items-start justify-between gap-3 rounded-xl border px-3.5 py-3 text-xs font-medium ${styles}`}>
      <span className="break-words">{message}</span>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss message"
      >
        <X size={15} />
      </button>
    </div>
  )
}

// Section Heading Component
function SectionHeading({ icon, title, subtitle, color }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    violet: 'bg-violet-50 text-violet-600',
  }

  return (
    <div className="mb-4 flex items-center gap-3">
      <div className={`rounded-xl p-2.5 ${colors[color]}`}>
        {icon}
      </div>

      <div>
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>
      </div>
    </div>
  )
}

// Loading Component
function LoadingState({ text }) {
  return (
    <div className="py-9 text-center text-xs text-slate-500">
      <RefreshCw size={18} className="mx-auto mb-2 animate-spin text-indigo-500" />
      {text}
    </div>
  )
}

// Empty State Component
function EmptyState({ icon, title, description }) {
  return (
    <div className="rounded-xl bg-slate-50/80 px-4 py-8 text-center">
      <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
        {icon}
      </div>

      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  )
}

// Action Button Component
function ActionButton({ children, title, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded-lg border border-slate-200 p-2 transition ${
        danger
          ? 'text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600'
          : 'text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600'
      }`}
    >
      {children}
    </button>
  )
}
