
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  X,
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

const transactionCategories = [
  'Food',
  'Shopping',
  'Transport',
  'Bills',
  'Entertainment',
  'Health',
  'Education',
  'Salary',
  'Freelance',
  'Other',
]

const getInitialTransactionForm = () => ({
  title: '',
  amount: '',
  type: 'expense',
  category: 'Food',
  transaction_date: new Date().toISOString().split('T')[0],
  notes: '',
})

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
    color: 'text-[#3973B9] bg-[#EDF4FB]',
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
  'bg-[#3973B9]',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
]

export default function Dashboard() {
  const { user } = useAuth()

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [transactionForm, setTransactionForm] = useState(getInitialTransactionForm)
  const [savingTransaction, setSavingTransaction] = useState(false)
  const [transactionModalError, setTransactionModalError] = useState('')
  const [transactionNotice, setTransactionNotice] = useState('')

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

      setLoading(true)

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

  function openTransactionModal() {
    setTransactionForm(getInitialTransactionForm())
    setTransactionModalError('')
    setIsTransactionModalOpen(true)
  }

  function closeTransactionModal() {
    if (savingTransaction) return
    setIsTransactionModalOpen(false)
    setTransactionModalError('')
  }

  function handleTransactionFormChange(event) {
    const { name, value } = event.target
    setTransactionForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  async function handleAddTransaction(event) {
    event.preventDefault()

    if (!user?.id) {
      setTransactionModalError('Please sign in to add a transaction.')
      return
    }

    if (!transactionForm.title.trim()) {
      setTransactionModalError('Please enter a transaction title.')
      return
    }

    const amount = Number(transactionForm.amount)
    if (!transactionForm.amount || !Number.isFinite(amount) || amount <= 0) {
      setTransactionModalError('Please enter a valid amount.')
      return
    }

    if (!transactionForm.transaction_date) {
      setTransactionModalError('Please select a transaction date.')
      return
    }

    setSavingTransaction(true)
    setTransactionModalError('')

    const transactionData = {
      title: transactionForm.title.trim(),
      amount,
      type: transactionForm.type,
      category: transactionForm.category,
      transaction_date: transactionForm.transaction_date,
      notes: transactionForm.notes.trim() || null,
      user_id: user.id,
    }

    try {
      const { data, error: insertError } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single()

      if (insertError) throw insertError

      setTransactions((previous) =>
        [data, ...previous].sort((a, b) =>
          (b.transaction_date || '').localeCompare(a.transaction_date || ''),
        ),
      )

      setIsTransactionModalOpen(false)
      setTransactionForm(getInitialTransactionForm())
      setTransactionNotice('Transaction added successfully.')
      window.setTimeout(() => setTransactionNotice(''), 3500)
    } catch (err) {
      setTransactionModalError(
        err.message || 'Unable to save transaction. Please try again.',
      )
    } finally {
      setSavingTransaction(false)
    }
  }

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

  const allCategoryData = Object.entries(categorySpending)
    .sort((a, b) => b[1] - a[1])

  const categoryData = allCategoryData.slice(0, 5)
  const topCategory = categoryData[0]

  const totalCategorySpending = allCategoryData.reduce(
    (sum, item) => sum + item[1],
    0,
  )

  // Six-month financial trends
  const trendData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(currentYear, currentMonth - 5 + index, 1)

    const records = transactions.filter((item) => {
      const transactionDate = getTransactionDate(item.transaction_date)

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
    <main className="min-h-screen bg-[#F5F8FC] text-[#102A43]">
      <div className="mx-auto max-w-[1500px] space-y-7 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* Dashboard heading */}
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-[#DCE8F4] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#3973B9]">
              <LayoutDashboard size={13} />
              Financial overview
            </div>

           <h1 className="text-3xl font-extrabold tracking-[-0.045em] text-[#102A43] sm:text-4xl lg:text-[42px]">
  {greeting},{' '}
  <span className="text-[#3973B9]">
    {firstName.replace(/[^a-zA-Z]/g, '').toLowerCase().replace(/^./, char => char.toUpperCase())}
  </span>
</h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              A clear view of your money, spending habits, and financial progress.
            </p>

            <div className="mt-4 flex w-full items-center justify-between gap-3">
              <p className="flex min-w-0 items-center gap-2 text-[10px] font-medium text-slate-400 sm:text-xs">
                <CalendarDays size={14} className="shrink-0 text-[#3973B9]" />
                <span className="truncate">{fullDate}</span>
              </p>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:border-[#B8CFE6] hover:bg-[#EDF4FB] hover:text-[#102A43] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
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

        {/* Error message */}
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
            <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-28 animate-pulse rounded-xl bg-white"
                />
              ))}
            </div>
            <div className="h-80 animate-pulse rounded-xl bg-white" />
          </div>
        ) : (
          <>
            {/* Main balance overview */}
            <section className="relative overflow-hidden rounded-2xl bg-[#102A43] text-white shadow-lg shadow-[#102A43]/10">
              <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border border-white/[0.07]" />
              <div className="pointer-events-none absolute -right-8 -top-16 h-64 w-64 rounded-full border border-white/[0.07]" />
              <div className="pointer-events-none absolute bottom-0 right-1/3 h-48 w-48 rounded-full bg-[#3973B9]/15 blur-3xl" />

              <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[1.3fr_0.7fr] lg:p-9">
                <div className="flex flex-col justify-between gap-7">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                      <Wallet size={16} className="text-[#9FC3E8]" />
                      Your total balance
                    </div>

                    <h2 className="mt-4 break-all text-3xl font-bold tracking-tight sm:text-5xl">
                      {currency(balance)}
                    </h2>

                    <p className="mt-3 max-w-md text-xs leading-5 text-slate-300/75">
                      Your overall net position based on all income and expenses recorded in your account.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={openTransactionModal}
                      className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-xs font-bold text-[#102A43] transition-all duration-200 hover:bg-[#EDF4FB] hover:shadow-md"
                    >
                      <Plus size={16} />
                      Add Transaction
                    </button>

                    <Link
                      to="/analytics"
                      className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/[0.06] px-4 py-3 text-xs font-semibold text-white transition-all duration-200 hover:border-white/30 hover:bg-white/10"
                    >
                      View Analytics
                      <ArrowUpRight size={15} />
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-xl border border-white/10 bg-white/[0.07] p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-300">
                        Total Income
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
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

                  <div className="rounded-xl border border-white/10 bg-white/[0.07] p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-300">
                        Total Expenses
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-400/10 text-rose-300">
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

              <div className="relative flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-5 py-3 text-[10px] text-slate-300/70 sm:px-9">
                <span className="flex items-center gap-2">
                  <ShieldCheck size={13} className="text-emerald-300" />
                  Your financial overview
                </span>
                <span>{transactions.length} transactions recorded</span>
              </div>
            </section>

            {/* Monthly overview */}
            <section>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-[#102A43]">
                    Monthly Overview
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Your financial performance for {monthName}
                  </p>
                </div>

                <Link
                  to="/analytics"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#3973B9] transition hover:text-[#102A43]"
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

            {/* Financial performance and categories */}
            <section className="grid items-start gap-5 xl:grid-cols-[1.65fr_0.85fr]">
              <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(16,42,67,0.035)] transition-shadow duration-300 hover:shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF4FB] text-[#3973B9]">
                      <BarChart3 size={19} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#102A43]">
                        Financial Performance
                      </h2>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        Income and expenses over time
                      </p>
                    </div>
                  </div>

                  <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-500">
                    LAST 6 MONTHS
                  </span>
                </div>

                {hasTrendData ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 px-4 pt-5 sm:px-6">
                      <div>
                        <p className="text-[10px] font-medium text-slate-400">
                          Income this month
                        </p>
                        <p className="mt-1 text-lg font-bold text-[#102A43]">
                          {currency(monthlyIncome)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-slate-400">
                          Expenses this month
                        </p>
                        <p className="mt-1 text-lg font-bold text-[#102A43]">
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
                              <stop offset="5%" stopColor="#3973B9" stopOpacity={0.18} />
                              <stop offset="95%" stopColor="#3973B9" stopOpacity={0} />
                            </linearGradient>

                            <linearGradient
                              id="dashboardExpenseGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="5%" stopColor="#E16B72" stopOpacity={0.14} />
                              <stop offset="95%" stopColor="#E16B72" stopOpacity={0} />
                            </linearGradient>
                          </defs>

                          <CartesianGrid
                            stroke="#EAF0F6"
                            strokeDasharray="4 5"
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
                              borderRadius: 10,
                              border: '1px solid #E2E8F0',
                              fontSize: 12,
                              boxShadow: '0 8px 24px rgba(16,42,67,0.08)',
                            }}
                          />

                          <Area
                            type="monotone"
                            dataKey="income"
                            name="income"
                            stroke="#3973B9"
                            strokeWidth={2.5}
                            fill="url(#dashboardIncomeGradient)"
                            activeDot={{ r: 5, fill: '#3973B9' }}
                          />

                          <Area
                            type="monotone"
                            dataKey="expenses"
                            name="expenses"
                            stroke="#E16B72"
                            strokeWidth={2.5}
                            fill="url(#dashboardExpenseGradient)"
                            activeDot={{ r: 5, fill: '#E16B72' }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex items-center justify-center gap-6 border-t border-slate-100 px-4 py-3">
                      <Legend color="bg-[#3973B9]" label="Income" />
                      <Legend color="bg-[#E16B72]" label="Expenses" />
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon={BarChart3}
                    title="No financial trends yet"
                    description="Add transactions to build your financial history."
                    onAddTransaction={openTransactionModal}
                    linkText="Add Transaction"
                  />
                )}
              </div>

              {/* Category breakdown */}
              <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(16,42,67,0.035)] sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-[#102A43]">
                      Spending Breakdown
                    </h2>
                    <p className="mt-1 text-[10px] text-slate-400">
                      By category · {monthName}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF4FB] text-[#3973B9]">
                    <CircleDollarSign size={19} />
                  </div>
                </div>

                {categoryData.length > 0 ? (
                  <>
                    <div className="mt-5 rounded-xl border border-slate-100 bg-[#F7F9FC] p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Total categorized spending
                      </p>
                      <p className="mt-1 text-2xl font-bold tracking-tight text-[#102A43]">
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
                              <span className="shrink-0 text-xs font-bold text-[#102A43]">
                                {percentage.toFixed(0)}%
                              </span>
                            </div>

                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${categoryColors[index]}`}
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
                      className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-[#3973B9] transition hover:text-[#102A43]"
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
                    onAddTransaction={openTransactionModal}
                    linkText="Add Transaction"
                  />
                )}
              </div>
            </section>

            {/* Financial insights and quick navigation */}
            <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(16,42,67,0.035)] sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF4FB] text-[#3973B9]">
                    <Sparkles size={19} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#102A43]">
                      Financial Insights
                    </h2>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Highlights from your recorded activity
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 bg-[#F7F9FC] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Highest spending category
                    </p>
                    <p className="mt-2 truncate text-lg font-bold text-[#102A43]">
                      {topCategory ? topCategory[0] : 'No data'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {topCategory
                        ? `${currency(topCategory[1])} spent this month`
                        : 'Add expenses to discover your top category.'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-[#F7F9FC] p-4">
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
                  className={`mt-3 flex items-start gap-3 rounded-xl border p-4 ${
                    spendingAlert
                      ? 'border-rose-100 bg-rose-50'
                      : 'border-[#DCE8F4] bg-[#EDF4FB]'
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
                      className="mt-0.5 shrink-0 text-[#3973B9]"
                    />
                  )}

                  <p
                    className={`text-xs leading-5 ${
                      spendingAlert ? 'text-rose-700' : 'text-[#315C85]'
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
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(16,42,67,0.035)] sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-[#102A43]">
                      Quick Navigation
                    </h2>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Your financial tools
                    </p>
                  </div>
                  <Activity size={19} className="text-[#3973B9]" />
                </div>

                <div className="mt-4 space-y-2">
                  {quickActions.map((action) => {
                    const Icon = action.icon

                    return (
                      <Link
                        key={action.path}
                        to={action.path}
                        className="group flex items-center gap-3 rounded-xl border border-transparent p-2.5 transition-all duration-200 hover:border-[#E2EAF2] hover:bg-[#F7F9FC]"
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${action.color}`}
                        >
                          <Icon size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#102A43]">
                            {action.title}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {action.subtitle}
                          </p>
                        </div>

                        <ChevronRight
                          size={16}
                          className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#3973B9]"
                        />
                      </Link>
                    )
                  })}
                </div>
              </div>
            </section>

            {/* Recent transactions */}
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(16,42,67,0.035)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF4FB] text-[#3973B9]">
                    <ReceiptText size={19} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#102A43]">
                      Recent Transactions
                    </h2>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Your latest financial activity
                    </p>
                  </div>
                </div>

                <Link
                  to="/transactions"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#3973B9] transition hover:text-[#102A43]"
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
                  onAddTransaction={openTransactionModal}
                  linkText="Add Transaction"
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentTransactions.map((item) => {
                    const isIncome = item.type === 'income'

                    return (
                      <div
                        key={item.id}
                        className="flex min-w-0 items-center gap-3 px-4 py-3.5 transition-colors duration-200 hover:bg-[#F8FAFC] sm:px-6"
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
                          <p className="truncate text-xs font-bold text-[#102A43] sm:text-sm">
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
                              isIncome ? 'text-emerald-600' : 'text-[#102A43]'
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

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-[#F8FAFC] px-4 py-3 sm:px-6">
                <span className="text-[10px] text-slate-400">
                  Showing {recentTransactions.length} of {transactions.length} records
                </span>
                <Link
                  to="/transactions"
                  className="text-[10px] font-bold text-[#3973B9] transition hover:text-[#102A43]"
                >
                  Manage transactions
                </Link>
              </div>
            </section>

            {/* Footer */}
            <footer className="flex flex-col items-center justify-between gap-2 border-t border-slate-200 py-4 text-[10px] text-slate-400 sm:flex-row">
              <span>
                © {new Date().getFullYear()} Smart Expense. All rights reserved.<span><br></br> # Designed and developed by Mutahir Showket
                  </span>
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-[#3973B9]" />
                Your finances, organized with confidence.
              </span>
            </footer>
          </>
        )}
      </div>

      {transactionNotice && (
        <div
          role="status"
          className="fixed right-4 top-4 z-[70] flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-xl"
        >
          <ShieldCheck size={17} />
          {transactionNotice}
        </div>
      )}

      {isTransactionModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#07182B]/60 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeTransactionModal()
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-transaction-modal-title"
            className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl shadow-[#07182B]/25"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EDF4FB] text-[#3973B9]">
                  <CircleDollarSign size={22} />
                </div>
                <div>
                  <h2
                    id="dashboard-transaction-modal-title"
                    className="text-lg font-extrabold text-[#102A43] sm:text-xl"
                  >
                    Add New Transaction
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Record income or an expense in your account.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeTransactionModal}
                disabled={savingTransaction}
                aria-label="Close transaction form"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-[#102A43] disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="p-5 sm:p-7">
              {transactionModalError && (
                <div
                  role="alert"
                  className="mb-5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700"
                >
                  {transactionModalError}
                </div>
              )}

              <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() =>
                    setTransactionForm((previous) => ({
                      ...previous,
                      type: 'expense',
                    }))
                  }
                  className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                    transactionForm.type === 'expense'
                      ? 'bg-white text-rose-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <TrendingDown size={16} /> Expense
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setTransactionForm((previous) => ({
                      ...previous,
                      type: 'income',
                    }))
                  }
                  className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                    transactionForm.type === 'income'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <TrendingUp size={16} /> Income
                  </span>
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-slate-600">Transaction Title</span>
                  <input
                    name="title"
                    value={transactionForm.title}
                    onChange={handleTransactionFormChange}
                    placeholder="e.g. Grocery shopping"
                    required
                    maxLength={100}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-[#102A43] outline-none transition placeholder:text-slate-400 focus:border-[#3973B9] focus:bg-white focus:ring-4 focus:ring-[#3973B9]/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-slate-600">Amount (₹)</span>
                  <input
                    type="number"
                    name="amount"
                    value={transactionForm.amount}
                    onChange={handleTransactionFormChange}
                    placeholder="Enter amount"
                    min="0.01"
                    step="0.01"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-[#102A43] outline-none transition placeholder:text-slate-400 focus:border-[#3973B9] focus:bg-white focus:ring-4 focus:ring-[#3973B9]/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-slate-600">Category</span>
                  <select
                    name="category"
                    value={transactionForm.category}
                    onChange={handleTransactionFormChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-[#102A43] outline-none transition focus:border-[#3973B9] focus:bg-white focus:ring-4 focus:ring-[#3973B9]/10"
                  >
                    {transactionCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-slate-600">Transaction Date</span>
                  <input
                    type="date"
                    name="transaction_date"
                    value={transactionForm.transaction_date}
                    onChange={handleTransactionFormChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-[#102A43] outline-none transition focus:border-[#3973B9] focus:bg-white focus:ring-4 focus:ring-[#3973B9]/10"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-xs font-bold text-slate-600">
                    Notes <span className="font-normal text-slate-400">(Optional)</span>
                  </span>
                  <input
                    name="notes"
                    value={transactionForm.notes}
                    onChange={handleTransactionFormChange}
                    placeholder="Add a note..."
                    maxLength={500}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-[#102A43] outline-none transition placeholder:text-slate-400 focus:border-[#3973B9] focus:bg-white focus:ring-4 focus:ring-[#3973B9]/10"
                  />
                </label>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeTransactionModal}
                  disabled={savingTransaction}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTransaction}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#102A43] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#102A43]/15 transition hover:bg-[#173D60] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingTransaction ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <Plus size={17} />
                  )}
                  {savingTransaction ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

// Monthly metric card
function MetricCard({ label, value, icon: Icon, color, detail }) {
  const styles = {
    emerald: {
      icon: 'bg-emerald-50 text-emerald-600',
      accent: 'border-t-emerald-500',
    },
    rose: {
      icon: 'bg-rose-50 text-rose-600',
      accent: 'border-t-rose-500',
    },
    blue: {
      icon: 'bg-[#EDF4FB] text-[#3973B9]',
      accent: 'border-t-[#3973B9]',
    },
    violet: {
      icon: 'bg-violet-50 text-violet-600',
      accent: 'border-t-violet-500',
    },
  }

  const style = styles[color]

  return (
    <div
      className={`min-w-0 rounded-xl border border-slate-200/80 border-t-[3px] ${style.accent} bg-white p-3.5 shadow-[0_2px_10px_rgba(16,42,67,0.035)] transition-all duration-200 hover:-translate-y-1 hover:shadow-md sm:p-4`}
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

      <p className="mt-3 break-all text-base font-bold tracking-tight text-[#102A43] sm:text-xl">
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
function EmptyState({ icon: Icon, title, description, link, linkText, onAddTransaction }) {
  return (
    <div className="flex min-h-[210px] flex-col items-center justify-center px-5 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EDF4FB] text-[#3973B9]">
        <Icon size={23} />
      </div>

      <h3 className="mt-3 text-sm font-bold text-[#102A43]">
        {title}
      </h3>

      <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
        {description}
      </p>

      {onAddTransaction ? (
        <button
          type="button"
          onClick={onAddTransaction}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#102A43] px-4 py-2.5 text-xs font-bold text-white transition-all duration-200 hover:bg-[#173D60] hover:shadow-md"
        >
          {linkText}
          <Plus size={14} />
        </button>
      ) : (
        <Link
          to={link}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#102A43] px-4 py-2.5 text-xs font-bold text-white transition-all duration-200 hover:bg-[#173D60] hover:shadow-md"
        >
          {linkText}
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  )
}
