
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Lightbulb,
  PiggyBank,
  Target,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Clock3,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

const currency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)

const formatDate = (date) => {
  if (!date) return 'Date unavailable'

  const parsed = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) return date

  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const getTransactionDate = (value) => {
  if (!value) return null

  const parsed = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T00:00:00`
      : value,
  )

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const quickActions = [
  {
    title: 'Transactions',
    description: 'Manage your money',
    icon: ReceiptText,
    path: '/transactions',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Budgets',
    description: 'Control your spending',
    icon: Target,
    path: '/budgets',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    title: 'Analytics',
    description: 'Understand your habits',
    icon: BarChart3,
    path: '/analytics',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: 'Savings Goals',
    description: 'Build your future',
    icon: PiggyBank,
    path: '/savings-goals',
    color: 'bg-amber-50 text-amber-600',
  },
]

export default function Dashboard() {
  const { user } = useAuth()

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const firstName =
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'there'

  const today = new Date()

  const monthName = today.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })

  const fullDate = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Fetch dashboard data
  useEffect(() => {
    let active = true

    async function fetchDashboard() {
      if (!user?.id) {
        if (active) {
          setTransactions([])
          setLoading(false)
        }
        return
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false })

        if (!active) return

        if (fetchError) {
          setError(fetchError.message)
        } else {
          setTransactions(data || [])
          setError('')
        }
      } catch {
        if (active) {
          setError('Unable to load transactions. Please try again.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    fetchDashboard()

    return () => {
      active = false
    }
  }, [user?.id])

  // Manual refresh
  async function handleRefresh() {
    if (!user?.id || refreshing) return

    setRefreshing(true)
    setError('')

    try {
      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })

      if (fetchError) throw fetchError

      setTransactions(data || [])
    } catch (err) {
      setError(err.message || 'Unable to refresh dashboard.')
    } finally {
      setRefreshing(false)
    }
  }

  // Overall totals
  const income = transactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const expenses = transactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const balance = income - expenses

  // Month boundaries
  const currentMonthStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    1,
  )

  const nextMonthStart = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    1,
  )

  const previousMonthStart = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    1,
  )

  // Current month records
  const currentMonthTransactions = transactions.filter((item) => {
    const date = getTransactionDate(item.transaction_date)

    return date && date >= currentMonthStart && date < nextMonthStart
  })

  // Previous month records
  const previousMonthTransactions = transactions.filter((item) => {
    const date = getTransactionDate(item.transaction_date)

    return date && date >= previousMonthStart && date < currentMonthStart
  })

  // Monthly totals
  const monthlyIncome = currentMonthTransactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const monthlyExpenses = currentMonthTransactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const previousMonthExpenses = previousMonthTransactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  // Spending comparison
  const spendingChange =
    previousMonthExpenses > 0
      ? ((monthlyExpenses - previousMonthExpenses) /
          previousMonthExpenses) * 100
      : null

  // Category analysis
  const categorySpending = currentMonthTransactions
    .filter((item) => item.type === 'expense')
    .reduce((result, item) => {
      const category = item.category || 'Uncategorized'

      result[category] =
        (result[category] || 0) + Number(item.amount || 0)

      return result
    }, {})

  const topCategory = Object.entries(categorySpending)
    .sort((a, b) => b[1] - a[1])[0]

  // Savings
  const savings = monthlyIncome - monthlyExpenses

  const savingsRate =
    monthlyIncome > 0
      ? (savings / monthlyIncome) * 100
      : null

  // Monthly expense forecast
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate()

  const forecastExpenses =
    today.getDate() > 0
      ? (monthlyExpenses / today.getDate()) * daysInMonth
      : monthlyExpenses

  const spendingAlert =
    spendingChange !== null && spendingChange > 20

  const recentTransactions = transactions.slice(0, 6)

  const greeting =
    today.getHours() < 12
      ? 'Good morning'
      : today.getHours() < 17
        ? 'Good afternoon'
        : 'Good evening'

  return (
    <main className="min-h-screen bg-[#F7F8FC] text-slate-900">

      <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 lg:px-10 lg:py-9">

        {/* Header */}
        <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              Personal Finance Overview
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
              {greeting},{' '}
              <span className="text-blue-600">{firstName}</span>
            </h1>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Here's your financial overview for today.
            </p>

            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-400">
              <CalendarDays size={14} />
              {fullDate}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? 'animate-spin' : ''}
              />
              Refresh
            </button>

            <Link
              to="/transactions"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/30"
            >
              <Plus size={18} />
              Add Transaction
            </Link>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            <AlertTriangle size={19} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Unable to load your data</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-2xl bg-white shadow-sm"
              />
            ))}
          </div>
        ) : (
          <>

            {/* Main financial overview */}
            <section className="grid gap-5 lg:grid-cols-3">

              {/* Balance card */}
              <div className="relative min-h-[235px] overflow-hidden rounded-3xl bg-gradient-to-br from-[#142B55] via-[#17468B] to-[#2563EB] p-6 text-white shadow-xl shadow-blue-950/10 sm:p-8 lg:col-span-1">

                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10" />
                <div className="pointer-events-none absolute -right-4 -top-8 h-40 w-40 rounded-full border border-white/10" />
                <div className="pointer-events-none absolute -bottom-24 -left-12 h-48 w-48 rounded-full bg-white/[0.04]" />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-100">
                    <Wallet size={18} />
                    Total Balance
                  </div>

                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold tracking-wider text-blue-100">
                    OVERALL
                  </span>
                </div>

                <div className="relative mt-9">
                  <p className="text-xs font-medium text-blue-100/80">
                    Your net financial position
                  </p>

                  <h2 className="mt-2 break-all text-3xl font-extrabold tracking-tight sm:text-4xl">
                    {currency(balance)}
                  </h2>
                </div>

                <div className="relative mt-8 flex items-center justify-between border-t border-white/15 pt-5">
                  <div>
                    <p className="text-[11px] text-blue-100/70">
                      Total transactions
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {transactions.length}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                    <CircleDollarSign size={23} />
                  </div>
                </div>
              </div>

              {/* Income */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-7">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <TrendingUp size={23} />
                  </div>

                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                    Income
                  </span>
                </div>

                <p className="mt-7 text-sm font-semibold text-slate-500">
                  Total Income
                </p>

                <h2 className="mt-2 break-all text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  {currency(income)}
                </h2>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-400">
                    All recorded earnings
                  </span>
                  <ArrowUpRight size={18} className="text-emerald-500" />
                </div>
              </div>

              {/* Expenses */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-7">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                    <TrendingDown size={23} />
                  </div>

                  <span className="rounded-full bg-rose-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                    Expenses
                  </span>
                </div>

                <p className="mt-7 text-sm font-semibold text-slate-500">
                  Total Expenses
                </p>

                <h2 className="mt-2 break-all text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  {currency(expenses)}
                </h2>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-400">
                    All recorded spending
                  </span>
                  <ArrowDownRight size={18} className="text-rose-500" />
                </div>
              </div>
            </section>

            {/* Monthly overview */}
            <section className="mt-8">

              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                    Monthly Overview
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Your financial activity for {monthName}
                  </p>
                </div>

                <Link
                  to="/analytics"
                  className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 transition hover:text-blue-800"
                >
                  View analytics
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

                {/* Monthly income */}
                <InsightCard
                  icon={TrendingUp}
                  label="Monthly Income"
                  value={currency(monthlyIncome)}
                  detail="Income received this month"
                  color="emerald"
                />

                {/* Monthly expenses */}
                <InsightCard
                  icon={TrendingDown}
                  label="Monthly Expenses"
                  value={currency(monthlyExpenses)}
                  detail="Expenses recorded this month"
                  color="rose"
                />

                {/* Savings rate */}
                <InsightCard
                  icon={PiggyBank}
                  label="Savings Rate"
                  value={
                    savingsRate === null
                      ? 'N/A'
                      : `${savingsRate.toFixed(1)}%`
                  }
                  detail={
                    savingsRate === null
                      ? 'Record income to calculate savings'
                      : `${currency(savings)} net savings this month`
                  }
                  color="blue"
                />

                {/* Forecast */}
                <InsightCard
                  icon={CalendarDays}
                  label="Monthly Forecast"
                  value={currency(forecastExpenses)}
                  detail="Estimated expenses by month end"
                  color="violet"
                />
              </div>
            </section>

            {/* Insights */}
            <section className="mt-8 grid gap-5 lg:grid-cols-2">

              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Sparkles size={21} />
                  </div>

                  <div>
                    <h2 className="font-extrabold text-slate-900">
                      Spending Insights
                    </h2>
                    <p className="text-xs text-slate-400">
                      Based on this month's transactions
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      Top Spending Category
                    </p>
                    <h3 className="mt-2 truncate text-xl font-extrabold text-slate-900">
                      {topCategory ? topCategory[0] : 'No data yet'}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {topCategory
                        ? `${currency(topCategory[1])} spent`
                        : 'Add expenses to see your top category.'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      Compared to Last Month
                    </p>
                    <h3 className={`mt-2 text-2xl font-extrabold ${
                      spendingChange === null
                        ? 'text-slate-400'
                        : spendingChange > 0
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                    }`}>
                      {spendingChange === null
                        ? 'N/A'
                        : `${spendingChange > 0 ? '+' : ''}${spendingChange.toFixed(1)}%`}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {spendingChange === null
                        ? 'Previous month data unavailable'
                        : spendingChange > 0
                          ? 'Spending has increased'
                          : spendingChange < 0
                            ? 'Spending has decreased'
                            : 'Spending is unchanged'}
                    </p>
                  </div>
                </div>

                <div className={`mt-7 flex items-start gap-3 rounded-2xl p-4 ${
                  spendingAlert
                    ? 'bg-rose-50'
                    : 'bg-blue-50'
                }`}>
                  <div className={`mt-0.5 ${
                    spendingAlert ? 'text-rose-600' : 'text-blue-600'
                  }`}>
                    {spendingAlert
                      ? <AlertTriangle size={19} />
                      : <Lightbulb size={19} />}
                  </div>

                  <div>
                    <p className={`text-sm font-bold ${
                      spendingAlert ? 'text-rose-800' : 'text-blue-900'
                    }`}>
                      {spendingAlert
                        ? 'Your spending needs attention'
                        : 'Keep building healthy money habits'}
                    </p>

                    <p className={`mt-1 text-xs leading-5 ${
                      spendingAlert ? 'text-rose-700' : 'text-blue-700'
                    }`}>
                      {spendingAlert
                        ? `Your expenses are ${spendingChange.toFixed(1)}% higher than last month. Review your spending to find opportunities to save.`
                        : topCategory
                          ? `${topCategory[0]} is your highest spending category this month. Keep an eye on it.`
                          : 'Start recording transactions to receive useful insights about your finances.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-extrabold text-slate-900">
                      Quick Access
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Everything you need in one place
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                    <Wallet size={19} />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {quickActions.map((action) => {
                    const Icon = action.icon

                    return (
                      <Link
                        key={action.path}
                        to={action.path}
                        className="group rounded-2xl border border-slate-100 p-4 transition duration-200 hover:border-blue-100 hover:bg-blue-50/40"
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.color}`}>
                          <Icon size={19} />
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-1">
                          <p className="text-sm font-bold text-slate-800">
                            {action.title}
                          </p>
                          <ChevronRight
                            size={15}
                            className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600"
                          />
                        </div>

                        <p className="mt-1 text-[11px] leading-4 text-slate-400">
                          {action.description}
                        </p>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </section>

            {/* Recent transactions */}
            <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">

              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-6 sm:px-7">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <ReceiptText size={19} />
                    </div>

                    <h2 className="text-lg font-extrabold text-slate-900">
                      Recent Transactions
                    </h2>
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    A quick look at your latest activity
                  </p>
                </div>

                <Link
                  to="/transactions"
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  View all
                  <ChevronRight size={15} />
                </Link>
              </div>

              {recentTransactions.length === 0 ? (
                <div className="px-5 py-16 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <ReceiptText size={27} />
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-900">
                    No transactions yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    Your recent financial activity will appear here. Add your
                    first transaction to get started.
                  </p>

                  <Link
                    to="/transactions"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    <Plus size={17} />
                    Add Transaction
                  </Link>
                </div>
              ) : (
                <>
                  <div className="hidden grid-cols-[minmax(0,2fr)_1fr_1fr_1fr] gap-4 bg-slate-50/80 px-7 py-3 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400 sm:grid">
                    <span>Transaction</span>
                    <span>Category</span>
                    <span>Date</span>
                    <span className="text-right">Amount</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {recentTransactions.map((item) => {
                      const isIncome = item.type === 'income'

                      return (
                        <div
                          key={item.id}
                          className="grid gap-3 px-5 py-4 transition hover:bg-slate-50/70 sm:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr] sm:items-center sm:gap-4 sm:px-7"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              isIncome
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-rose-50 text-rose-600'
                            }`}>
                              {isIncome
                                ? <ArrowDownRight size={20} />
                                : <ArrowUpRight size={20} />}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-800">
                                {item.title || 'Untitled transaction'}
                              </p>

                              <p className="mt-1 text-xs text-slate-400 sm:hidden">
                                {item.category || 'Uncategorized'} · {formatDate(item.transaction_date)}
                              </p>
                            </div>
                          </div>

                          <div className="hidden sm:block">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                              {item.category || 'Uncategorized'}
                            </span>
                          </div>

                          <div className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
                            <Clock3 size={13} />
                            {formatDate(item.transaction_date)}
                          </div>

                          <div className="flex items-center justify-between sm:justify-end">
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold sm:hidden ${
                              isIncome
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}>
                              {isIncome ? 'INCOME' : 'EXPENSE'}
                            </span>

                            <p className={`text-sm font-extrabold ${
                              isIncome ? 'text-emerald-600' : 'text-slate-900'
                            }`}>
                              {isIncome ? '+' : '-'}{currency(item.amount)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-7">
                <p className="text-xs font-medium text-slate-400">
                  Showing {recentTransactions.length} of {transactions.length} records
                </p>

                <Link
                  to="/transactions"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  Manage transactions
                  <ArrowRight size={14} />
                </Link>
              </div>
            </section>

            {/* Footer */}
            <footer className="mt-9 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-400 sm:flex-row">
              <p>
                © {new Date().getFullYear()} Smart Expense. All rights reserved.
              </p>

              <div className="flex items-center gap-2">
                <ShieldCheck size={14} />
                <span>Your finances, organized with confidence.</span>
              </div>
            </footer>
          </>
        )}
      </div>
    </main>
  )
}

// Reusable insight card
function InsightCard({ icon: Icon, label, value, detail, color }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">
          {label}
        </p>

        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${colors[color]}`}>
          <Icon size={18} />
        </div>
      </div>

      <h3 className="mt-5 break-all text-xl font-extrabold tracking-tight text-slate-900">
        {value}
      </h3>

      <p className="mt-2 text-xs leading-5 text-slate-400">
        {detail}
      </p>
    </div>
  )
}
