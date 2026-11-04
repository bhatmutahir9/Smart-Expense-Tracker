
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet,
  ArrowLeft,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  LogOut,
  ReceiptText,
  TrendingUp,
  TrendingDown,
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
  'Salary',
  'Freelance',
  'Other',
]

const initialForm = {
  title: '',
  amount: '',
  type: 'expense',
  category: 'Food',
  transaction_date: new Date().toISOString().split('T')[0],
  notes: '',
}

const currency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)

export default function Transactions() {
  const { user, logout } = useAuth()

  const [transactions, setTransactions] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Fetch transactions for the logged-in user
  useEffect(() => {
    let active = true

    async function loadTransactions() {
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

    loadTransactions()

    return () => {
      active = false
    }
  }, [user?.id])

  // Form input handler
  function handleChange(e) {
    const { name, value } = e.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // Reset form
  function resetForm() {
    setForm(initialForm)
    setEditingId(null)
  }

  // Add or update transaction
  async function handleSubmit(e) {
    e.preventDefault()

    if (!user?.id) {
      setError('Please sign in to continue.')
      return
    }

    if (!form.title.trim()) {
      setError('Please enter a transaction title.')
      return
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError('Please enter a valid amount.')
      return
    }

    if (!form.transaction_date) {
      setError('Please select a transaction date.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    const transactionData = {
      title: form.title.trim(),
      amount: Number(form.amount),
      type: form.type,
      category: form.category,
      transaction_date: form.transaction_date,
      notes: form.notes.trim() || null,
      user_id: user.id,
    }

    let result

    if (editingId) {
      result = await supabase
        .from('transactions')
        .update(transactionData)
        .eq('id', editingId)
        .eq('user_id', user.id)
        .select()
        .single()
    } else {
      result = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single()
    }

    if (result.error) {
      setError(result.error.message)
    } else if (editingId) {
      setTransactions((previous) =>
        previous.map((item) =>
          item.id === editingId ? result.data : item,
        ),
      )
      setSuccess('Transaction updated successfully!')
      resetForm()
    } else {
      setTransactions((previous) =>
        [result.data, ...previous].sort((a, b) =>
          b.transaction_date.localeCompare(a.transaction_date),
        ),
      )
      setSuccess('Transaction added successfully!')
      resetForm()
    }

    setSaving(false)
  }

  // Load transaction into form for editing
  function handleEdit(transaction) {
    setEditingId(transaction.id)

    setForm({
      title: transaction.title,
      amount: String(transaction.amount),
      type: transaction.type,
      category: transaction.category,
      transaction_date: transaction.transaction_date,
      notes: transaction.notes ?? '',
    })

    setError('')
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Delete transaction
  async function handleDelete(id) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this transaction?',
    )

    if (!confirmed || !user?.id) return

    setDeletingId(id)
    setError('')
    setSuccess('')

    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      setError(deleteError.message)
    } else {
      setTransactions((previous) =>
        previous.filter((item) => item.id !== id),
      )
      setSuccess('Transaction deleted successfully!')

      if (editingId === id) resetForm()
    }

    setDeletingId(null)
  }

  // Search and filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())

      const matchesType =
        typeFilter === 'all' || item.type === typeFilter

      const matchesCategory =
        categoryFilter === 'all' || item.category === categoryFilter

      return matchesSearch && matchesType && matchesCategory
    })
  }, [transactions, search, typeFilter, categoryFilter])

  const totalIncome = transactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + Number(item.amount), 0)

  const totalExpenses = transactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount), 0)

  async function handleLogout() {
    await logout()
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
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
                Personal finance tracker
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 p-2.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
              aria-label="Logout"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page heading */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              FINANCIAL ACTIVITY
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Transactions
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage and monitor your income and expenses.
            </p>
          </div>

          <a
            href="#transaction-form"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Transaction
          </a>
        </div>

        {/* Summary cards */}
        <section className="mb-8 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Total Income
              </p>
              <div className="rounded-xl bg-green-50 p-3 text-green-600">
                <TrendingUp size={21} />
              </div>
            </div>
            <p className="mt-4 text-2xl font-bold text-green-600">
              {currency(totalIncome)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Total Expenses
              </p>
              <div className="rounded-xl bg-red-50 p-3 text-red-600">
                <TrendingDown size={21} />
              </div>
            </div>
            <p className="mt-4 text-2xl font-bold text-red-600">
              {currency(totalExpenses)}
            </p>
          </div>
        </section>

        {/* Add/Edit form */}
        <section
          id="transaction-form"
          className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? 'Edit Transaction' : 'Add New Transaction'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Enter the details of your financial activity.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cancel editing"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Transaction title
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Grocery shopping"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  min="0.01"
                  step="0.01"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Transaction type
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Category
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Transaction date
                </label>
                <input
                  type="date"
                  name="transaction_date"
                  value={form.transaction_date}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Notes (optional)
                </label>
                <input
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Add a note"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            {success && (
              <p role="status" className="mt-5 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {success}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={17} />
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Update Transaction'
                    : 'Save Transaction'}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Transaction table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Transaction History
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {filteredTransactions.length} transaction(s) displayed
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
                  <Search size={17} className="shrink-0 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full min-w-0 py-2.5 text-sm outline-none"
                  />
                </div>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-blue-500"
                >
                  <option value="all">All types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-blue-500"
                >
                  <option value="all">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading transactions...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <ReceiptText className="mx-auto mb-3 text-slate-300" size={38} />
              <p className="font-semibold text-slate-700">
                No transactions found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your filters or add a new transaction.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Transaction</th>
                    <th className="px-6 py-4 font-semibold">Category</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Amount</th>
                    <th className="px-6 py-4 font-semibold">Type</th>
                    <th className="px-6 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((item) => {
                    const isIncome = item.type === 'income'

                    return (
                      <tr key={item.id} className="transition hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">
                            {item.title}
                          </p>
                          {item.notes && (
                            <p className="mt-1 max-w-48 truncate text-xs text-slate-400">
                              {item.notes}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {item.category}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-500">
                          {item.transaction_date}
                        </td>

                        <td className={`px-6 py-4 text-sm font-bold ${
                          isIncome ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isIncome ? '+' : '-'}{currency(item.amount)}
                        </td>

                        <td className="px-6 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            isIncome
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {isIncome ? 'Income' : 'Expense'}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                              aria-label={`Edit ${item.title}`}
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingId === item.id}
                              className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                              aria-label={`Delete ${item.title}`}
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="mt-6 text-center text-xs text-slate-400">
          Your transactions are private to your account.
        </p>
      </div>
    </main>
  )
}
