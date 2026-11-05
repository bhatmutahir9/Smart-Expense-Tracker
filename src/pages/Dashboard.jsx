
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
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

// Currency formatter
const currency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)

// Date formatter
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

// Themes for summary cards
const themes = {
  blue: {
    icon: 'bg-blue-100 text-blue-700',
    accent: 'from-blue-600 to-indigo-600',
    border: 'hover:border-blue-200',
    dot: 'bg-blue-500',
  },
  green: {
    icon: 'bg-emerald-100 text-emerald-700',
    accent: 'from-emerald-500 to-teal-500',
    border: 'hover:border-emerald-200',
    dot: 'bg-emerald-500',
  },
  rose: {
    icon: 'bg-rose-100 text-rose-700',
    accent: 'from-rose-500 to-pink-500',
    border: 'hover:border-rose-200',
    dot: 'bg-rose-500',
  },
}

// Safely parse transaction dates
const getTransactionDate = (value) => {
  if (!value) return null

  const parsed = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T00:00:00`
      : value,
  )

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export default function Dashboard() {
  const { user } = useAuth()

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  // Load dashboard transactions
  async function loadDashboard(isRefresh = false) {
    if (!user?.id) {
      setTransactions([])
      setLoading(false)
      setRefreshing(false)
      return
    }

    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    try {
      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setTransactions(data ?? [])
      }
    } catch {
      setError('Unable to load transactions. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initial fetch and user change handling
  useEffect(() => {
    let active = true

    async function fetchDashboard() {
      if (!user?.id) {
        setTransactions([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

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
          setTransactions(data ?? [])
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

  // Overall financial calculations
  const income = transactions
    .filter((item) => item.type === 'income')
    .reduce((total, item) => total + Number(item.amount || 0), 0)

  const expenses = transactions
    .filter((item) => item.type === 'expense')
    .reduce((total, item) => total + Number(item.amount || 0), 0)

  const balance = income - expenses

  // Current and previous month boundaries
  const today = new Date()

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

  // Current month transactions
  const currentMonthTransactions = transactions.filter((item) => {
    const date = getTransactionDate(item.transaction_date)

    return (
      date &&
      date >= currentMonthStart &&
      date < nextMonthStart
    )
  })

  // Previous month transactions
  const previousMonthTransactions = transactions.filter((item) => {
    const date = getTransactionDate(item.transaction_date)

    return (
      date &&
      date >= previousMonthStart &&
      date < currentMonthStart
    )
  })

  // Monthly income and expenses
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

  // Category-wise spending
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

  // Savings rate
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
    (monthlyExpenses / today.getDate()) * daysInMonth

  // Spending alert
  const spendingAlert =
    spendingChange !== null && spendingChange > 20

  const monthName = today.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })

  // Summary cards
  const summaryCards = [
    {
      title: 'Total Balance',
      amount: balance,
      description: 'Your net financial position',
      icon: Wallet,
      theme: 'blue',
    },
    {
      title: 'Total Income',
      amount: income,
      description: 'All recorded earnings',
      icon: TrendingUp,
      theme: 'green',
    },
    {
      title: 'Total Expenses',
      amount: expenses,
      description: 'All recorded spending',
      icon: TrendingDown,
      theme: 'rose',
    },
  ]

  const recentTransactions = transactions.slice(0, 6)
  const firstName = user?.email?.split('@')[0] || 'there'

  return (
    <main className="min-h-screen overflow-hidden bg-[#F4F7FC]">

      <style>{`
        @keyframes dashboardEnter {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes dashboardFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }

        .dashboard-enter {
          animation: dashboardEnter .65s ease-out both;
        }

        .dashboard-delay-1 { animation-delay: .08s; }
        .dashboard-delay-2 { animation-delay: .16s; }
        .dashboard-delay-3 { animation-delay: .24s; }
        .dashboard-delay-4 { animation-delay: .32s; }

        .dashboard-float {
          animation: dashboardFloat 5s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .dashboard-enter,
          .dashboard-float {
            animation: none !important;
          }

          .dashboard-enter {
            opacity: 1;
            transform: none;
          }

          * {
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">

        {/* Welcome section */}
        <section className="dashboard-enter mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold tracking-wide text-blue-700">
              <Sparkles size={14} />
              YOUR FINANCIAL OVERVIEW
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {firstName}
              </span>
              !
            </h1>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Here's what's happening with your money.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={refreshing ? 'animate-spin' : ''}
              />
              Refresh
            </button>

            <Link
              to="/transactions"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-600/30"
            >
              <Plus size={19} />
              Add Transaction
              <ArrowUpRight
                size={16}
                className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </Link>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="dashboard-enter mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            <ShieldCheck size={19} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Something went wrong</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <section className="grid gap-5 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="flex justify-between">
                  <div className="h-4 w-28 rounded bg-slate-200" />
                  <div className="h-11 w-11 rounded-xl bg-slate-200" />
                </div>
                <div className="mt-7 h-9 w-40 rounded-lg bg-slate-200" />
                <div className="mt-4 h-3 w-32 rounded bg-slate-100" />
              </div>
            ))}
          </section>
        ) : (
          <>

            {/* Financial summary */}
            <section className="grid gap-5 md:grid-cols-3">
              {summaryCards.map((card, index) => {
                const Icon = card.icon
                const theme = themes[card.theme]

                return (
                  <div
                    key={card.title}
                    className={`dashboard-enter dashboard-delay-${index + 1} group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-slate-200/70 ${theme.border}`}
                  >
                    <div className={`absolute left-0 top-0 h-1 w-full bg-gradient-to-r ${theme.accent}`} />

                    <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-slate-50 transition-transform duration-500 group-hover:scale-150" />

                    <div className="relative flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-500">
                          {card.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {card.description}
                        </p>
                      </div>

                      <div className={`rounded-xl p-3 transition duration-300 group-hover:rotate-6 group-hover:scale-110 ${theme.icon}`}>
                        <Icon size={23} />
                      </div>
                    </div>

                    <div className="relative mt-7">
                      <p className="break-all text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                        {currency(card.amount)}
                      </p>

                      <div className="mt-4 flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${theme.dot}`} />
                        <span className="text-xs font-medium text-slate-400">
                          {card.title === 'Total Balance'
                            ? 'Income minus expenses'
                            : card.title === 'Total Income'
                              ? 'Recorded income'
                              : 'Recorded expenses'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </section>

            {/* Smart Spending Insights */}
            <section className="dashboard-enter mt-8">

              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                      <Lightbulb size={21} />
                    </div>

                    <h2 className="text-xl font-extrabold text-slate-900">
                      Smart Spending Insights
                    </h2>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    Your financial activity for {monthName}
                  </p>
                </div>

                <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                  <Sparkles size={13} className="mr-1 inline" />
                  AUTO ANALYSIS
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                {/* Top spending category */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-500">
                      Top Spending Category
                    </p>
                    <Target size={20} className="text-blue-600" />
                  </div>

                  <h3 className="mt-5 truncate text-xl font-extrabold text-slate-900">
                    {topCategory ? topCategory[0] : 'No data yet'}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {topCategory
                      ? `${currency(topCategory[1])} spent this month`
                      : 'Add expenses to discover your top category.'}
                  </p>
                </div>

                {/* Savings rate */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-500">
                      Savings Rate
                    </p>
                    <PiggyBank size={20} className="text-emerald-600" />
                  </div>

                  <h3 className={`mt-5 text-2xl font-extrabold ${
                    savingsRate === null
                      ? 'text-slate-400'
                      : savingsRate >= 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                  }`}>
                    {savingsRate === null
                      ? 'N/A'
                      : `${savingsRate.toFixed(1)}%`}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {savingsRate === null
                      ? 'Record income to calculate savings.'
                      : `${currency(savings)} net savings this month`}
                  </p>
                </div>

                {/* Spending comparison */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-500">
                      Spending Comparison
                    </p>

                    {spendingAlert
                      ? <AlertTriangle size={20} className="text-rose-500" />
                      : <TrendingUp size={20} className="text-blue-600" />}
                  </div>

                  <h3 className={`mt-5 text-2xl font-extrabold ${
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

                  <p className="mt-2 text-sm text-slate-500">
                    {spendingChange === null
                      ? 'Previous month data unavailable.'
                      : spendingChange > 0
                        ? 'More spending than last month.'
                        : spendingChange < 0
                          ? 'Less spending than last month.'
                          : 'Spending is unchanged.'}
                  </p>
                </div>

                {/* Monthly forecast */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-500">
                      Monthly Forecast
                    </p>
                    <CalendarDays size={20} className="text-indigo-600" />
                  </div>

                  <h3 className="mt-5 break-all text-xl font-extrabold text-slate-900">
                    {currency(forecastExpenses)}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Estimated expenses by month end.
                  </p>
                </div>

              </div>

              {/* Smart alert */}
              {spendingAlert ? (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <div className="rounded-lg bg-rose-100 p-2 text-rose-600">
                    <AlertTriangle size={20} />
                  </div>

                  <div>
                    <h3 className="font-bold text-rose-800">
                      Spending increased significantly!
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-rose-700">
                      Your expenses are {spendingChange.toFixed(1)}% higher
                      than the previous month. Review your spending categories
                      to identify where you can save.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                    <Lightbulb size={20} />
                  </div>

                  <div>
                    <h3 className="font-bold text-blue-900">
                      Keep tracking your finances
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-blue-700">
                      {topCategory
                        ? `${topCategory[0]} is currently your highest spending category. Keep monitoring it to maintain better financial habits.`
                        : 'Add your transactions to unlock personalized spending insights.'}
                    </p>
                  </div>
                </div>
              )}

            </section>

            {/* Main dashboard grid */}
            <section className="mt-8 grid items-start gap-6 lg:grid-cols-3">

              {/* Recent transactions */}
              <div className="dashboard-enter dashboard-delay-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:col-span-2">

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                        <ReceiptText size={19} />
                      </div>

                      <h2 className="text-lg font-bold text-slate-900">
                        Recent Transactions
                      </h2>
                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      Your latest financial activity
                    </p>
                  </div>

                  <Link
                    to="/transactions"
                    className="group inline-flex items-center gap-1 text-sm font-bold text-blue-600 transition hover:text-indigo-700"
                  >
                    View all
                    <ChevronRight
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                </div>

                {recentTransactions.length === 0 ? (
                  <div className="px-5 py-16 text-center sm:px-8">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <ReceiptText size={29} />
                    </div>

                    <h3 className="text-lg font-bold text-slate-800">
                      No transactions yet
                    </h3>

                    <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
                      Your financial activity will appear here once you add
                      your first transaction.
                    </p>

                    <Link
                      to="/transactions"
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:-translate-y-1 hover:bg-blue-700"
                    >
                      <Plus size={17} />
                      Add your first transaction
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentTransactions.map((item, index) => {
                      const isIncome = item.type === 'income'

                      return (
                        <div
                          key={item.id}
                          style={{ animationDelay: `${index * 70}ms` }}
                          className="dashboard-enter group flex items-center justify-between gap-3 px-5 py-4 transition duration-200 hover:bg-slate-50/90 sm:px-6"
                        >
                          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition duration-300 group-hover:scale-110 ${
                              isIncome
                                ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-600 group-hover:bg-rose-100'
                            }`}>
                              {isIncome
                                ? <ArrowDownRight size={22} />
                                : <ArrowUpRight size={22} />}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-800">
                                {item.title || 'Untitled transaction'}
                              </p>

                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                <span className="truncate">
                                  {item.category || 'Uncategorized'}
                                </span>
                                <span>·</span>
                                <span>
                                  {formatDate(item.transaction_date)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className={`text-sm font-extrabold ${
                              isIncome ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {isIncome ? '+' : '-'}{currency(item.amount)}
                            </p>

                            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isIncome
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}>
                              {isIncome ? 'INCOME' : 'EXPENSE'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
                  <p className="text-xs font-medium text-slate-500">
                    Showing {recentTransactions.length} of {transactions.length} transactions
                  </p>

                  <Link
                    to="/transactions"
                    className="text-xs font-bold text-blue-600 hover:text-indigo-700"
                  >
                    Manage records →
                  </Link>
                </div>
              </div>

              {/* Financial summary panel */}
              <aside className="dashboard-enter dashboard-delay-4 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#101B35] via-[#172B50] to-[#1D4ED8] p-6 text-white shadow-xl shadow-blue-950/15">

                <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/10" />
                <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full border border-white/10" />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm">
                      <CircleDollarSign size={25} />
                    </div>

                    <div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold tracking-wide text-emerald-200">
                      FINANCIAL SUMMARY
                    </div>
                  </div>

                  <h2 className="mt-7 text-2xl font-extrabold leading-tight">
                    Stay in control of your money.
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-blue-100/80">
                    Keep your records updated and review your financial
                    activity regularly to make smarter decisions.
                  </p>

                  <Link
                    to="/transactions"
                    className="group mt-7 flex w-full items-center justify-between rounded-xl bg-white px-4 py-3.5 text-sm font-bold text-blue-800 shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-blue-50"
                  >
                    Manage transactions
                    <ArrowUpRight
                      size={19}
                      className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                    />
                  </Link>

                  <div className="mt-8 border-t border-white/15 pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-blue-100/70">
                          Total recorded transactions
                        </p>

                        <p className="mt-2 text-4xl font-extrabold tracking-tight">
                          {transactions.length}
                        </p>
                      </div>

                      <div className="dashboard-float rounded-2xl border border-white/10 bg-white/10 p-4">
                        <ReceiptText size={29} className="text-blue-100" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-7 flex items-center gap-2 text-xs text-blue-100/70">
                    <ShieldCheck size={15} />
                    Your personal finance overview
                  </div>
                </div>
              </aside>
            </section>

            {/* Footer */}
            <footer className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200/80 py-6 text-xs text-slate-400 sm:flex-row">
              <p>
                © {new Date().getFullYear()} Smart Expense. All rights reserved.
              </p>

              <div className="flex items-center gap-2">
                <CalendarDays size={14} />
                <span>Manage your finances with confidence.</span>
              </div>
            </footer>

          </>
        )}
      </div>
    </main>
  )
}
