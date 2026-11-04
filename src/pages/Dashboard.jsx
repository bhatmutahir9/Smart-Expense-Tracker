
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
  LogOut,
  RefreshCw,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

const currency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)

export default function Dashboard() {
  const { user, logout } = useAuth()

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      if (!user?.id) return

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

      setLoading(false)
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [user?.id])

  const income = transactions
    .filter((item) => item.type === 'income')
    .reduce((total, item) => total + Number(item.amount), 0)

  const expenses = transactions
    .filter((item) => item.type === 'expense')
    .reduce((total, item) => total + Number(item.amount), 0)

  const balance = income - expenses

  const summaryCards = [
    {
      title: 'Total Balance',
      amount: balance,
      icon: Wallet,
      color: 'blue',
      description: 'Income minus expenses',
    },
    {
      title: 'Total Income',
      amount: income,
      icon: TrendingUp,
      color: 'green',
      description: 'All recorded income',
    },
    {
      title: 'Total Expenses',
      amount: expenses,
      icon: TrendingDown,
      color: 'red',
      description: 'All recorded expenses',
    },
  ]

  const recentTransactions = transactions.slice(0, 6)

  async function handleLogout() {
    const { error: logoutError } = await logout()
    if (logoutError) setError(logoutError.message)
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2.5 text-white">
              <Wallet size={23} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">
                Smart Expense
              </p>
              <p className="text-xs text-slate-500">
                Personal finance dashboard
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden max-w-48 truncate text-sm text-slate-500 sm:block">
              {user?.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              OVERVIEW
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Here's an overview of your financial activity.
            </p>
          </div>

          <Link
            to="/transactions"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Transaction
          </Link>
        </div>

        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            <RefreshCw className="mx-auto mb-3 animate-spin" size={24} />
            Loading your dashboard...
          </div>
        ) : (
          <>
            <section className="grid gap-5 md:grid-cols-3">
              {summaryCards.map((card) => {
                const Icon = card.icon

                const styles = {
                  blue: 'bg-blue-50 text-blue-600',
                  green: 'bg-green-50 text-green-600',
                  red: 'bg-red-50 text-red-600',
                }

                return (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-500">
                        {card.title}
                      </p>
                      <div className={`rounded-xl p-3 ${styles[card.color]}`}>
                        <Icon size={22} />
                      </div>
                    </div>

                    <p className="mt-5 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                      {currency(card.amount)}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      {card.description}
                    </p>
                  </div>
                )
              })}
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Recent Transactions
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Your latest financial activity
                    </p>
                  </div>

                  <Link
                    to="/transactions"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View all
                  </Link>
                </div>

                {recentTransactions.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 px-4 py-12 text-center">
                    <ReceiptText className="mx-auto mb-3 text-slate-400" size={32} />
                    <p className="font-medium text-slate-700">
                      No transactions yet
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Add your first transaction to get started.
                    </p>
                    <Link
                      to="/transactions"
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
                    >
                      Add transaction <ArrowUpRight size={16} />
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentTransactions.map((item) => {
                      const isIncome = item.type === 'income'

                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 py-4"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className={`rounded-xl p-3 ${
                              isIncome
                                ? 'bg-green-50 text-green-600'
                                : 'bg-red-50 text-red-600'
                            }`}>
                              {isIncome
                                ? <ArrowDownRight size={20} />
                                : <ArrowUpRight size={20} />}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-800">
                                {item.title}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {item.category} · {item.transaction_date}
                              </p>
                            </div>
                          </div>

                          <p className={`shrink-0 text-sm font-bold ${
                            isIncome ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {isIncome ? '+' : '-'}{currency(item.amount)}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-blue-600 p-6 text-white shadow-lg shadow-blue-600/20">
                <div className="rounded-xl bg-white/15 p-3 inline-flex">
                  <Wallet size={24} />
                </div>

                <h2 className="mt-6 text-xl font-bold">
                  Stay on top of your finances
                </h2>

                <p className="mt-3 text-sm leading-6 text-blue-100">
                  Keep your records updated and review your spending regularly
                  to make better financial decisions.
                </p>

                <Link
                  to="/transactions"
                  className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                >
                  Manage transactions
                  <ArrowUpRight size={17} />
                </Link>

                <div className="mt-8 border-t border-white/20 pt-5">
                  <p className="text-sm text-blue-100">
                    Total recorded transactions
                  </p>
                  <p className="mt-1 text-3xl font-bold">
                    {transactions.length}
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}
