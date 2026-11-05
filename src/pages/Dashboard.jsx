
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
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  PiggyBank,
  Target,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  LayoutDashboard,
  Lightbulb,
  Activity,
  Sparkles,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

const currency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)

const formatDate = (value) => {
  if (!value) return 'Date unavailable'

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const getTransactionDate = (value) => {
  if (!value) return null

  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value,
  )

  return Number.isNaN(date.getTime()) ? null : date
}

const quickActions = [
  {
    title: 'Transactions',
    subtitle: 'Manage your activity',
    icon: ReceiptText,
    path: '/transactions',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    title: 'Budgets',
    subtitle: 'Plan your spending',
    icon: Target,
    path: '/budgets',
    color: 'text-violet-600 bg-violet-50',
  },
  {
    title: 'Analytics',
    subtitle: 'Explore your finances',
    icon: BarChart3,
    path: '/analytics',
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    title: 'Savings Goals',
    subtitle: 'Build your savings',
    icon: PiggyBank,
    path: '/savings-goals',
    color: 'text-amber-600 bg-amber-50',
  },
]

const categoryColors = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
]

export default function Dashboard() {
  const { user } = useAuth()

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()

  const firstName =
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'there'

  const greeting =
    today.getHours() < 12
      ? 'Good morning'
      : today.getHours() < 17
        ? 'Good afternoon'
        : 'Good evening'

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

  // Fetch transactions
  useEffect(() => {
    let active = true

    async function loadTransactions() {
      if (!user?.id) {
        setTransactions([])
        setLoading(false)
        return
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false })

        if (!active) return
        if (fetchError) throw fetchError

        setTransactions(data || [])
        setError('')
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load transactions.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadTransactions()

    return () => {
      active = false
    }
  }, [user?.id])

  // Refresh dashboard
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
  const currentMonthStart = new Date(currentYear, currentMonth, 1)
  const nextMonthStart = new Date(currentYear, currentMonth + 1, 1)
  const previousMonthStart = new Date(currentYear, currentMonth - 1, 1)

  const currentMonthTransactions = transactions.filter((item) => {
    const date = getTransactionDate(item.transaction_date)
    return date && date >= currentMonthStart && date < nextMonthStart
  })

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

  const savings = monthlyIncome - monthlyExpenses

  const savingsRate =
    monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : null

  const spendingChange =
    previousMonthExpenses > 0
      ? ((monthlyExpenses - previousMonthExpenses) /
          previousMonthExpenses) *
        100
      : null

  const spendingAlert =
    spendingChange !== null && spendingChange > 20

  // Monthly expense forecast
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  const forecastExpenses =
    (monthlyExpenses / today.getDate()) * daysInMonth

  // Category spending
  const categorySpending = currentMonthTransactions
    .filter((item) => item.type === 'expense')
    .reduce((result, item) => {
      const category = item.category || 'Uncategorized'
      result[category] =
        (result[category] || 0) + Number(item.amount || 0)
      return result
    }, {})

  const categoryData = Object.entries(categorySpending)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const topCategory = categoryData[0]

  const totalCategorySpending = categoryData.reduce(
    (sum, item) => sum + item[1],
    0,
  )

  // Six-month financial trends
  // Calculated directly to avoid unnecessary useMemo dependencies.
  const trendData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      currentYear,
      currentMonth - 5 + index,
      1,
    )

    const records = transactions.filter((item) => {
      const transactionDate = getTransactionDate(
        item.transaction_date,
      )

      return (
        transactionDate &&
        transactionDate.getFullYear() === date.getFullYear() &&
        transactionDate.getMonth() === date.getMonth()
      )
    })

    return {
      month: date.toLocaleDateString('en-IN', {
        month: 'short',
      }),
      income: records
        .filter((item) => item.type === 'income')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
      expenses: records
        .filter((item) => item.type === 'expense')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    }
  })

  const hasTrendData = trendData.some(
    (item) => item.income > 0 || item.expenses > 0,
  )

  const recentTransactions = transactions.slice(0, 6)

  return (
    <main className="min-h-screen bg-[#F5F7FB] text-slate-900">
      <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">

        {/* Premium heading */}
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="min-w-0 w-full">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">
              <LayoutDashboard size={13} />
              Financial command center
            </div>

            <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-[42px]">
              {greeting},{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                {firstName}
              </span>
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              A clearer picture of your money, your spending, and your
              financial progress.
            </p>

            {/* Date left, Refresh right — same line on every screen */}
            <div className="mt-3 flex w-full items-center justify-between gap-3">
              <p className="flex min-w-0 items-center gap-2 text-[10px] font-medium text-slate-400 sm:text-xs">
                <CalendarDays size={14} className="shrink-0" />
                <span className="truncate">{fullDate}</span>
              </p>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all duration-200 sm:px-4 sm:py-3 ${
                  refreshing
                    ? 'border-blue-200 bg-blue-50 text-blue-600'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600'
                } disabled:cursor-not-allowed disabled:opacity-70`}
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? 'animate-spin' : ''}
                />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="font-bold">Unable to load data</p>
              <p className="mt-1 break-words text-xs">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-5">
            <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-28 animate-pulse rounded-2xl bg-white"
                />
              ))}
            </div>
            <div className="h-80 animate-pulse rounded-2xl bg-white" />
          </div>
        ) : (
          <>
            {/* Main financial overview */}
            <section className="relative overflow-hidden rounded-[28px] bg-[#111D35] text-white shadow-xl shadow-slate-900/10">
              <div className="pointer-events-none absolute -right-24 -top-36 h-96 w-96 rounded-full border border-white/[0.06]" />
              <div className="pointer-events-none absolute -right-8 -top-20 h-72 w-72 rounded-full border border-white/[0.06]" />
              <div className="pointer-events-none absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[1.3fr_0.7fr] lg:p-9">
                <div className="flex flex-col justify-between gap-7">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                      <Wallet size={16} />
                      Your total balance
                    </div>

                    <h2 className="mt-4 break-all text-3xl font-bold tracking-tight sm:text-5xl">
                      {currency(balance)}
                    </h2>

                    <p className="mt-3 max-w-md text-xs leading-5 text-slate-400">
                      Your overall net position based on all income and
                      expenses recorded in your account.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      to="/transactions"
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-[#14213A] transition hover:bg-blue-50"
                    >
                      <Plus size={16} />
                      Add Transaction
                    </Link>

                    <Link
                      to="/analytics"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-xs font-semibold text-white transition hover:bg-white/10"
                    >
                      View Analytics
                      <ArrowUpRight size={15} />
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-300">
                        Total Income
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
                        <TrendingUp size={17} />
                      </span>
                    </div>
                    <p className="mt-3 break-all text-xl font-bold sm:text-2xl">
                      {currency(income)}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      All recorded earnings
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-300">
                        Total Expenses
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-400/10 text-rose-400">
                        <TrendingDown size={17} />
                      </span>
                    </div>
                    <p className="mt-3 break-all text-xl font-bold sm:text-2xl">
                      {currency(expenses)}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      All recorded spending
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-5 py-3 text-[10px] text-slate-400 sm:px-9">
                <span className="flex items-center gap-2">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  Your financial overview
                </span>
                <span>{transactions.length} transactions recorded</span>
              </div>
            </section>

            {/* Monthly overview */}
            <section>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">
                    Monthly Overview
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Your financial performance for {monthName}
                  </p>
                </div>

                <Link
                  to="/analytics"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  View report <ArrowRight size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricCard
                  label="Monthly Income"
                  value={currency(monthlyIncome)}
                  icon={TrendingUp}
                  color="emerald"
                  detail="Money received"
                />

                <MetricCard
                  label="Monthly Expenses"
                  value={currency(monthlyExpenses)}
                  icon={TrendingDown}
                  color="rose"
                  detail="Money spent"
                />

                <MetricCard
                  label="Net Savings"
                  value={currency(savings)}
                  icon={PiggyBank}
                  color="blue"
                  detail={
                    savingsRate === null
                      ? 'Record income to calculate'
                      : `${savingsRate.toFixed(1)}% savings rate`
                  }
                />

                <MetricCard
                  label="Expense Forecast"
                  value={currency(forecastExpenses)}
                  icon={CalendarDays}
                  color="violet"
                  detail="Estimated month-end spending"
                />
              </div>
            </section>

            {/* Trends and category breakdown */}
            <section className="grid items-start gap-5 xl:grid-cols-[1.65fr_0.85fr]">
              <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <BarChart3 size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold">
                        Financial Performance
                      </h2>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        Income and expenses over time
                      </p>
                    </div>
                  </div>

                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-500">
                    LAST 6 MONTHS
                  </span>
                </div>

                {hasTrendData ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 px-4 pt-4 sm:px-6">
                      <div>
                        <p className="text-[10px] font-medium text-slate-400">
                          Income this month
                        </p>
                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {currency(monthlyIncome)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-slate-400">
                          Expenses this month
                        </p>
                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {currency(monthlyExpenses)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 h-[260px] w-full px-2 sm:h-[320px] sm:px-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={trendData}
                          margin={{
                            top: 10,
                            right: 8,
                            left: -18,
                            bottom: 0,
                          }}
                        >
                          <defs>
                            <linearGradient
                              id="dashboardIncomeGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                            </linearGradient>

                            <linearGradient
                              id="dashboardExpenseGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.16} />
                              <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                            </linearGradient>
                          </defs>

                          <CartesianGrid
                            stroke="#EDF1F6"
                            strokeDasharray="4 4"
                            vertical={false}
                          />

                          <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94A3B8', fontSize: 11 }}
                            dy={10}
                          />

                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            width={58}
                            tick={{ fill: '#94A3B8', fontSize: 10 }}
                            tickFormatter={(value) =>
                              value >= 1000
                                ? `₹${(value / 1000).toFixed(0)}k`
                                : `₹${value}`
                            }
                          />

                          <Tooltip
                            formatter={(value, name) => [
                              currency(value),
                              name === 'income' ? 'Income' : 'Expenses',
                            ]}
                            contentStyle={{
                              borderRadius: 12,
                              border: '1px solid #E2E8F0',
                              fontSize: 12,
                              boxShadow: '0 8px 30px rgba(15,23,42,0.08)',
                            }}
                          />

                          <Area
                            type="monotone"
                            dataKey="income"
                            name="income"
                            stroke="#2563EB"
                            strokeWidth={2.5}
                            fill="url(#dashboardIncomeGradient)"
                            activeDot={{ r: 5 }}
                          />

                          <Area
                            type="monotone"
                            dataKey="expenses"
                            name="expenses"
                            stroke="#F43F5E"
                            strokeWidth={2.5}
                            fill="url(#dashboardExpenseGradient)"
                            activeDot={{ r: 5 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex items-center justify-center gap-6 border-t border-slate-100 px-4 py-3">
                      <Legend color="bg-blue-600" label="Income" />
                      <Legend color="bg-rose-500" label="Expenses" />
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon={BarChart3}
                    title="No financial trends yet"
                    description="Add transactions to build your financial history."
                    link="/transactions"
                    linkText="Add Transaction"
                  />
                )}
              </div>

              {/* Category breakdown */}
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold">
                      Spending Breakdown
                    </h2>
                    <p className="mt-1 text-[10px] text-slate-400">
                      By category · {monthName}
                    </p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <CircleDollarSign size={18} />
                  </div>
                </div>

                {categoryData.length > 0 ? (
                  <>
                    <div className="mt-5 rounded-xl bg-slate-50 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Total categorized spending
                      </p>
                      <p className="mt-1 text-2xl font-bold tracking-tight">
                        {currency(totalCategorySpending)}
                      </p>
                    </div>

                    <div className="mt-5 space-y-5">
                      {categoryData.map(([category, amount], index) => {
                        const percentage =
                          totalCategorySpending > 0
                            ? (amount / totalCategorySpending) * 100
                            : 0

                        return (
                          <div key={category}>
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <span
                                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${categoryColors[index]}`}
                                />
                                <span className="truncate text-xs font-semibold text-slate-700">
                                  {category}
                                </span>
                              </div>
                              <span className="shrink-0 text-xs font-bold text-slate-800">
                                {percentage.toFixed(0)}%
                              </span>
                            </div>

                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full transition-all ${categoryColors[index]}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>

                            <p className="mt-1.5 text-[10px] text-slate-400">
                              {currency(amount)}
                            </p>
                          </div>
                        )
                      })}
                    </div>

                    <Link
                      to="/analytics"
                      className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-blue-600 transition hover:text-blue-800"
                    >
                      Explore all categories
                      <ArrowUpRight size={15} />
                    </Link>
                  </>
                ) : (
                  <EmptyState
                    icon={CircleDollarSign}
                    title="No spending recorded"
                    description="Your category breakdown will appear here."
                    link="/transactions"
                    linkText="Add Transaction"
                  />
                )}
              </div>
            </section>

            {/* Insights and navigation */}
            <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Sparkles size={19} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold">
                      Financial Insights
                    </h2>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Highlights from your recorded activity
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Highest spending category
                    </p>
                    <p className="mt-2 truncate text-lg font-bold text-slate-900">
                      {topCategory ? topCategory[0] : 'No data'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {topCategory
                        ? `${currency(topCategory[1])} spent this month`
                        : 'Add expenses to discover your top category.'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Compared with last month
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {spendingChange !== null &&
                        (spendingChange > 0 ? (
                          <TrendingUp size={18} className="text-rose-500" />
                        ) : (
                          <TrendingDown size={18} className="text-emerald-500" />
                        ))}
                      <p
                        className={`text-xl font-bold ${
                          spendingChange === null
                            ? 'text-slate-400'
                            : spendingChange > 0
                              ? 'text-rose-600'
                              : 'text-emerald-600'
                        }`}
                      >
                        {spendingChange === null
                          ? 'N/A'
                          : `${spendingChange > 0 ? '+' : ''}${spendingChange.toFixed(1)}%`}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {spendingChange === null
                        ? 'No previous month expense data'
                        : spendingChange > 0
                          ? 'Your expenses have increased'
                          : spendingChange < 0
                            ? 'Your expenses have decreased'
                            : 'Your spending is unchanged'}
                    </p>
                  </div>
                </div>

                <div
                  className={`mt-3 flex items-start gap-3 rounded-xl p-4 ${
                    spendingAlert
                      ? 'border border-rose-100 bg-rose-50'
                      : 'border border-blue-100 bg-blue-50'
                  }`}
                >
                  {spendingAlert ? (
                    <AlertTriangle
                      size={18}
                      className="mt-0.5 shrink-0 text-rose-600"
                    />
                  ) : (
                    <Lightbulb
                      size={18}
                      className="mt-0.5 shrink-0 text-blue-600"
                    />
                  )}

                  <p
                    className={`text-xs leading-5 ${
                      spendingAlert ? 'text-rose-700' : 'text-blue-700'
                    }`}
                  >
                    {spendingAlert
                      ? `Your expenses are ${spendingChange.toFixed(1)}% higher than last month. Review your spending to identify possible savings.`
                      : topCategory
                        ? `${topCategory[0]} is your highest spending category this month. Keep monitoring this category to stay on track.`
                        : 'Start recording transactions to receive useful financial insights here.'}
                  </p>
                </div>
              </div>

              {/* Quick navigation */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold">Quick Navigation</h2>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Your financial tools
                    </p>
                  </div>
                  <Activity size={19} className="text-slate-400" />
                </div>

                <div className="mt-4 space-y-2">
                  {quickActions.map((action) => {
                    const Icon = action.icon

                    return (
                      <Link
                        key={action.path}
                        to={action.path}
                        className="group flex items-center gap-3 rounded-xl border border-transparent p-2.5 transition hover:border-slate-100 hover:bg-slate-50"
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${action.color}`}
                        >
                          <Icon size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800">
                            {action.title}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {action.subtitle}
                          </p>
                        </div>

                        <ChevronRight
                          size={16}
                          className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600"
                        />
                      </Link>
                    )
                  })}
                </div>
              </div>
            </section>

            {/* Recent transactions */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <ReceiptText size={19} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold">
                      Recent Transactions
                    </h2>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Your latest financial activity
                    </p>
                  </div>
                </div>

                <Link
                  to="/transactions"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  View all
                  <ArrowRight size={14} />
                </Link>
              </div>

              {recentTransactions.length === 0 ? (
                <EmptyState
                  icon={ReceiptText}
                  title="No transactions yet"
                  description="Your latest income and expenses will appear here."
                  link="/transactions"
                  linkText="Add Transaction"
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentTransactions.map((item) => {
                    const isIncome = item.type === 'income'

                    return (
                      <div
                        key={item.id}
                        className="flex min-w-0 items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50 sm:px-6"
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          {isIncome ? (
                            <ArrowDownRight size={19} />
                          ) : (
                            <ArrowUpRight size={19} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-slate-800 sm:text-sm">
                            {item.title || 'Untitled transaction'}
                          </p>
                          <p className="mt-1 truncate text-[10px] text-slate-400 sm:text-xs">
                            {item.category || 'Uncategorized'}
                            <span className="mx-1.5">·</span>
                            {formatDate(item.transaction_date)}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p
                            className={`text-xs font-bold sm:text-sm ${
                              isIncome ? 'text-emerald-600' : 'text-slate-900'
                            }`}
                          >
                            {isIncome ? '+' : '-'}
                            {currency(item.amount)}
                          </p>
                          <p
                            className={`mt-1 text-[9px] font-semibold uppercase tracking-wider ${
                              isIncome ? 'text-emerald-500' : 'text-rose-500'
                            }`}
                          >
                            {item.type}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-6">
                <span className="text-[10px] text-slate-400">
                  Showing {recentTransactions.length} of {transactions.length} records
                </span>
                <Link
                  to="/transactions"
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800"
                >
                  Manage transactions
                </Link>
              </div>
            </section>

            {/* Footer */}
            <footer className="flex flex-col items-center justify-between gap-2 border-t border-slate-200 py-4 text-[10px] text-slate-400 sm:flex-row">
              <span>
                © {new Date().getFullYear()} Smart Expense. All rights reserved.
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} />
                Your finances, organized with confidence.
              </span>
            </footer>
          </>
        )}
      </div>
    </main>
  )
}

// Monthly metric card
function MetricCard({ label, value, icon: Icon, color, detail }) {
  const styles = {
    emerald: {
      icon: 'bg-emerald-50 text-emerald-600',
      accent: 'border-l-emerald-500',
    },
    rose: {
      icon: 'bg-rose-50 text-rose-600',
      accent: 'border-l-rose-500',
    },
    blue: {
      icon: 'bg-blue-50 text-blue-600',
      accent: 'border-l-blue-500',
    },
    violet: {
      icon: 'bg-violet-50 text-violet-600',
      accent: 'border-l-violet-500',
    },
  }

  const style = styles[color]

  return (
    <div
      className={`min-w-0 rounded-xl border border-slate-200 border-l-[3px] ${style.accent} bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-4`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold text-slate-500 sm:text-xs">
          {label}
        </p>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.icon}`}
        >
          <Icon size={16} />
        </div>
      </div>

      <p className="mt-3 break-all text-base font-bold tracking-tight text-slate-900 sm:text-xl">
        {value}
      </p>

      <p className="mt-1 truncate text-[10px] text-slate-400">
        {detail}
      </p>
    </div>
  )
}

// Chart legend
function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </div>
  )
}

// Empty state
function EmptyState({ icon: Icon, title, description, link, linkText }) {
  return (
    <div className="flex min-h-[210px] flex-col items-center justify-center px-5 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon size={23} />
      </div>
      <h3 className="mt-3 text-sm font-bold text-slate-800">
        {title}
      </h3>
      <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
        {description}
      </p>
      <Link
        to={link}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
      >
        {linkText}
        <ArrowRight size={14} />
      </Link>
    </div>
  )
}
