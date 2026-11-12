
import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  RefreshCw,
  ReceiptText,
  CalendarDays,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

const categoryColors = [
  'bg-[#102A43]',
  'bg-[#3973B9]',
  'bg-[#5B8FC5]',
  'bg-[#7BA6D2]',
  'bg-[#A0BDDC]',
  'bg-[#315F8D]',
  'bg-[#648BB4]',
  'bg-[#8CAAC9]',
]

const currency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0)

function getMonthKey(dateValue) {
  if (!dateValue) return ''

  const date = new Date(`${dateValue}T12:00:00`)

  if (Number.isNaN(date.getTime())) return ''

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatDate(dateValue) {
  if (!dateValue) return '—'

  const date = new Date(`${dateValue}T12:00:00`)

  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function Analytics() {
  const { user } = useAuth()

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  async function loadAnalytics(isRefresh = false) {
    if (!user?.id) return

    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    try {
      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select(
          'id, title, amount, type, category, transaction_date, notes'
        )
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })

      if (fetchError) throw fetchError

      setTransactions(data || [])
    } catch (err) {
      console.error('Analytics fetch error:', err)
      setError('Unable to load analytics. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    let active = true

    async function fetchTransactions() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const { data, error: fetchError } = await supabase
          .from('transactions')
          .select(
            'id, title, amount, type, category, transaction_date, notes'
          )
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false })

        if (fetchError) throw fetchError

        if (active) {
          setTransactions(data || [])
        }
      } catch (err) {
        console.error('Analytics fetch error:', err)

        if (active) {
          setError('Unable to load analytics. Please try again.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchTransactions()

    return () => {
      active = false
    }
  }, [user?.id])

  const analytics = useMemo(() => {
    const income = transactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)

    const expenses = transactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)

    const savings = income - expenses

    const now = new Date()

    const monthlyData = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - (5 - index),
        1
      )

      const key = getMonthKey(
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
      )

      const monthTransactions = transactions.filter(
        (item) => getMonthKey(item.transaction_date) === key
      )

      return {
        key,
        label: date.toLocaleDateString('en-IN', { month: 'short' }),
        income: monthTransactions
          .filter((item) => item.type === 'income')
          .reduce((sum, item) => sum + Number(item.amount || 0), 0),
        expenses: monthTransactions
          .filter((item) => item.type === 'expense')
          .reduce((sum, item) => sum + Number(item.amount || 0), 0),
      }
    })

    const categoryMap = {}

    transactions
      .filter((item) => item.type === 'expense')
      .forEach((item) => {
        const category = item.category || 'Other'
        categoryMap[category] =
          (categoryMap[category] || 0) + Number(item.amount || 0)
      })

    const categories = Object.entries(categoryMap)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: expenses > 0 ? (amount / expenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)

    const totalTransactions = transactions.length

    const expenseTransactions = transactions.filter(
      (item) => item.type === 'expense'
    )

    const averageExpense =
      expenseTransactions.length > 0
        ? expenses / expenseTransactions.length
        : 0

    return {
      income,
      expenses,
      savings,
      monthlyData,
      categories,
      totalTransactions,
      averageExpense,
      expenseCount: expenseTransactions.length,
    }
  }, [transactions])

  const maxMonthlyValue = Math.max(
    ...analytics.monthlyData.map((item) =>
      Math.max(item.income, item.expenses)
    ),
    1
  )

  const hasTransactions = transactions.length > 0

  return (
    <main className="min-h-screen bg-[#F3F7FB] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Page heading */}
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#3973B9]">
              <BarChart3 size={17} />
              Financial insights
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-[#102A43] sm:text-3xl">
              Analytics Overview
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Understand your income, expenses and spending habits.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadAnalytics(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#102A43] shadow-sm transition hover:border-[#C7D9EB] hover:bg-[#F3F7FB] hover:text-[#3973B9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? 'animate-spin' : ''}
            />
            Refresh data
          </button>
        </section>

        {/* Error state */}
        {error && (
          <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-red-600">{error}</p>

            <button
              type="button"
              onClick={() => loadAnalytics()}
              className="text-sm font-bold text-red-700 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Summary cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: 'Total Income',
              value: analytics.income,
              icon: TrendingUp,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
              sign: <ArrowUpRight size={16} />,
            },
            {
              title: 'Total Expenses',
              value: analytics.expenses,
              icon: TrendingDown,
              color: 'text-rose-600',
              bg: 'bg-rose-50',
              sign: <ArrowDownRight size={16} />,
            },
            {
              title: 'Net Savings',
              value: analytics.savings,
              icon: Wallet,
              color:
                analytics.savings >= 0
                  ? 'text-[#3973B9]'
                  : 'text-rose-600',
              bg:
                analytics.savings >= 0
                  ? 'bg-[#EDF4FB]'
                  : 'bg-rose-50',
              sign: null,
            },
            {
              title: 'Transactions',
              value: analytics.totalTransactions,
              isCount: true,
              icon: ReceiptText,
              color: 'text-[#3973B9]',
              bg: 'bg-[#EDF4FB]',
              sign: null,
            },
          ].map((card) => {
            const Icon = card.icon

            return (
              <div
                key={card.title}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/[0.04]"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`rounded-xl p-3 ${card.bg} ${card.color}`}
                  >
                    <Icon size={21} />
                  </div>

                  <span className={card.color}>{card.sign}</span>
                </div>

                <p className="mt-5 text-sm font-medium text-slate-500">
                  {card.title}
                </p>

                <h2 className="mt-1 break-words text-2xl font-extrabold tracking-tight text-[#102A43]">
                  {loading
                    ? '...'
                    : card.isCount
                      ? card.value.toLocaleString('en-IN')
                      : currency(card.value)}
                </h2>
              </div>
            )
          })}
        </section>

        {/* Charts section */}
        <section className="grid gap-6 lg:grid-cols-3">

          {/* Monthly comparison */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-[#102A43]">
                  Income vs Expenses
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your financial activity over the last six months
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#3973B9]" />
                  Income
                </span>

                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  Expenses
                </span>
              </div>
            </div>

            {loading ? (
              <div className="mt-8 h-64 animate-pulse rounded-xl bg-slate-100" />
            ) : !hasTransactions ? (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <BarChart3 size={34} className="text-slate-300" />
                <p className="mt-3 font-semibold text-[#102A43]">
                  No financial data yet
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Add transactions to see your monthly trends.
                </p>
              </div>
            ) : (
              <div className="mt-8">
                <div className="flex h-56 items-end justify-between gap-2 border-b border-slate-100 pb-2 sm:gap-5">
                  {analytics.monthlyData.map((month) => {
                    const incomeHeight =
                      (month.income / maxMonthlyValue) * 100

                    const expenseHeight =
                      (month.expenses / maxMonthlyValue) * 100

                    return (
                      <div
                        key={month.key}
                        className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                      >
                        <div className="flex h-full w-full items-end justify-center gap-1 sm:gap-2">
                          <div
                            title={`Income: ${currency(month.income)}`}
                            className="w-full max-w-8 rounded-t-md bg-[#3973B9] transition-all duration-500 hover:bg-[#102A43]"
                            style={{
                              height: `${Math.max(incomeHeight, month.income > 0 ? 2 : 0)}%`,
                            }}
                          />

                          <div
                            title={`Expenses: ${currency(month.expenses)}`}
                            className="w-full max-w-8 rounded-t-md bg-rose-400 transition-all duration-500 hover:bg-rose-500"
                            style={{
                              height: `${Math.max(expenseHeight, month.expenses > 0 ? 2 : 0)}%`,
                            }}
                          />
                        </div>

                        <span className="mt-3 text-xs font-semibold text-slate-500">
                          {month.label}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#EDF4FB] p-3">
                    <p className="text-xs font-medium text-[#3973B9]">
                      Total income
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#102A43]">
                      {currency(
                        analytics.monthlyData.reduce(
                          (sum, item) => sum + item.income,
                          0
                        )
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-rose-50 p-3">
                    <p className="text-xs font-medium text-rose-600">
                      Total expenses
                    </p>
                    <p className="mt-1 text-lg font-bold text-rose-800">
                      {currency(
                        analytics.monthlyData.reduce(
                          (sum, item) => sum + item.expenses,
                          0
                        )
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Expense categories */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#EDF4FB] p-2.5 text-[#3973B9]">
                <PieChart size={20} />
              </div>

              <div>
                <h2 className="font-bold text-[#102A43]">
                  Spending Categories
                </h2>
                <p className="text-xs text-slate-500">
                  Expense distribution
                </p>
              </div>
            </div>

            {loading ? (
              <div className="mt-6 h-48 animate-pulse rounded-xl bg-slate-100" />
            ) : analytics.categories.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-center">
                <PieChart size={30} className="text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  No expenses recorded
                </p>
              </div>
            ) : (
              <div className="mt-7 space-y-5">
                {analytics.categories.slice(0, 7).map((category, index) => (
                  <div key={category.name}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${categoryColors[index % categoryColors.length]}`}
                        />
                        <span className="truncate text-sm font-semibold text-[#102A43]">
                          {category.name}
                        </span>
                      </div>

                      <span className="shrink-0 text-xs font-bold text-slate-600">
                        {currency(category.amount)}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${categoryColors[index % categoryColors.length]}`}
                        style={{
                          width: `${category.percentage}%`,
                        }}
                      />
                    </div>

                    <p className="mt-1 text-right text-[11px] text-slate-400">
                      {category.percentage.toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Insights */}
        <section className="grid gap-6 md:grid-cols-2">

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                <CalendarDays size={20} />
              </div>

              <h2 className="font-bold text-[#102A43]">
                Financial Summary
              </h2>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">
                  Average expense per transaction
                </span>
                <span className="font-bold text-[#102A43]">
                  {loading ? '...' : currency(analytics.averageExpense)}
                </span>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">
                  Expense transactions
                </span>
                <span className="font-bold text-[#102A43]">
                  {loading ? '...' : analytics.expenseCount}
                </span>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">
                  Highest spending category
                </span>
                <span className="max-w-[50%] truncate text-right font-bold text-[#102A43]">
                  {loading
                    ? '...'
                    : analytics.categories[0]?.name || 'No data'}
                </span>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-[#102A43] p-6 text-white shadow-lg shadow-[#102A43]/15">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#3973B9]/20 blur-2xl" />
            <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-[#5B8FC5]/20 blur-2xl" />

            <div className="relative">
              <div className="flex items-center gap-2 text-[#C7D9EB]">
                <Wallet size={19} />
                <span className="text-sm font-semibold">
                  Savings overview
                </span>
              </div>

              <h2 className="mt-5 text-3xl font-extrabold tracking-tight">
                {loading ? '...' : currency(analytics.savings)}
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#D8E6F4]">
                {loading
                  ? 'Calculating your financial overview...'
                  : analytics.savings >= 0
                    ? 'Your recorded income is higher than your expenses. Keep building healthy financial habits!'
                    : 'Your recorded expenses are higher than your income. Review your spending categories to identify areas to adjust.'}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-xs text-[#C7D9EB]">Income</p>
                  <p className="mt-1 font-bold">
                    {loading ? '...' : currency(analytics.income)}
                  </p>
                </div>

                <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-xs text-[#C7D9EB]">Expenses</p>
                  <p className="mt-1 font-bold">
                    {loading ? '...' : currency(analytics.expenses)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent transactions */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-[#102A43]">
                Recent Transactions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Your latest financial activity
              </p>
            </div>

            <a
              href="/transactions"
              className="text-sm font-bold text-[#3973B9] transition hover:text-[#102A43]"
            >
              View all transactions →
            </a>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-14 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <ReceiptText
                size={34}
                className="mx-auto text-slate-300"
              />
              <p className="mt-3 font-semibold text-[#102A43]">
                No transactions found
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Add your first transaction to see your analytics.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.slice(0, 5).map((item) => {
                const isIncome = item.type === 'income'

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-[#F3F7FB] sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`shrink-0 rounded-xl p-2.5 ${
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

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#102A43]">
                          {item.title || 'Untitled transaction'}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-400">
                          {item.category || 'Other'} ·{' '}
                          {formatDate(item.transaction_date)}
                        </p>
                      </div>
                    </div>

                    <p
                      className={`shrink-0 text-sm font-extrabold ${
                        isIncome ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {currency(Number(item.amount || 0))}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <footer className="pb-4 text-center text-xs text-slate-400">
          Analytics are calculated from your recorded transactions.
        </footer>
      </div>
    </main>
  )
}
