
import { useEffect, useMemo, useState } from 'react'
import {
  Wallet,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ReceiptText,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Sparkles,
  CircleDollarSign,
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

const getInitialForm = () => ({
  title: '',
  amount: '',
  type: 'expense',
  category: 'Food',
  transaction_date: new Date().toISOString().split('T')[0],
  notes: '',
})

const currency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)

const formatDate = (date) => {
  if (!date) return '—'

  const parsed = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) return date

  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-[#102A43] outline-none transition duration-200 placeholder:text-slate-400 hover:border-[#C7D9EB] focus:border-[#3973B9] focus:bg-white focus:ring-4 focus:ring-[#3973B9]/10'

export default function Transactions() {
  const { user } = useAuth()
  const userId = user?.id

  const [transactions, setTransactions] = useState([])
  const [form, setForm] = useState(getInitialForm)
  const [editingId, setEditingId] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Fetch transactions from Supabase
  useEffect(() => {
    let active = true

    async function loadTransactions() {
      if (!userId) {
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
          .eq('user_id', userId)
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

    loadTransactions()

    return () => {
      active = false
    }
  }, [userId])

  // Handle form input changes
  function handleChange(e) {
    const { name, value } = e.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // Reset form
  function resetForm() {
    setForm(getInitialForm())
    setEditingId(null)
    setError('')
    setSuccess('')
  }

  // Add or update transaction
  async function handleSubmit(e) {
    e.preventDefault()

    if (!userId) {
      setError('Please sign in to continue.')
      return
    }

    if (!form.title.trim()) {
      setError('Please enter a transaction title.')
      return
    }

    const amount = Number(form.amount)

    if (!form.amount || !Number.isFinite(amount) || amount <= 0) {
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
      amount,
      type: form.type,
      category: form.category,
      transaction_date: form.transaction_date,
      notes: form.notes.trim() || null,
      user_id: userId,
    }

    try {
      let result

      if (editingId) {
        result = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', editingId)
          .eq('user_id', userId)
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
        return
      }

      if (editingId) {
        setTransactions((previous) =>
          previous
            .map((item) => item.id === editingId ? result.data : item)
            .sort((a, b) =>
              b.transaction_date.localeCompare(a.transaction_date),
            ),
        )

        setSuccess('Transaction updated successfully!')
      } else {
        setTransactions((previous) =>
          [result.data, ...previous].sort((a, b) =>
            b.transaction_date.localeCompare(a.transaction_date),
          ),
        )

        setSuccess('Transaction added successfully!')
      }

      setForm(getInitialForm())
      setEditingId(null)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Edit transaction
  function handleEdit(transaction) {
    setEditingId(transaction.id)

    setForm({
      title: transaction.title ?? '',
      amount: String(transaction.amount ?? ''),
      type: transaction.type ?? 'expense',
      category: transaction.category ?? 'Other',
      transaction_date: transaction.transaction_date ?? '',
      notes: transaction.notes ?? '',
    })

    setError('')
    setSuccess('')

    document.getElementById('transaction-form')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  // Delete transaction
  async function handleDelete(id) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this transaction?',
    )

    if (!confirmed || !userId) return

    setDeletingId(id)
    setError('')
    setSuccess('')

    try {
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (deleteError) {
        setError(deleteError.message)
      } else {
        setTransactions((previous) =>
          previous.filter((item) => item.id !== id),
        )

        setSuccess('Transaction deleted successfully!')

        if (editingId === id) {
          setForm(getInitialForm())
          setEditingId(null)
        }
      }
    } catch {
      setError('Unable to delete transaction. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  // Search and filters
  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase()

    return transactions.filter((item) => {
      const matchesSearch =
        item.title?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.notes?.toLowerCase().includes(query)

      const matchesType =
        typeFilter === 'all' || item.type === typeFilter

      const matchesCategory =
        categoryFilter === 'all' || item.category === categoryFilter

      return matchesSearch && matchesType && matchesCategory
    })
  }, [transactions, search, typeFilter, categoryFilter])

  // Financial calculations
  const totalIncome = transactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const totalExpenses = transactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F3F7FB] text-[#102A43]">

      <style>{`
        @keyframes pageEnter {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes softFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .page-enter {
          animation: pageEnter .55s ease-out both;
        }

        .delay-1 { animation-delay: .08s; }
        .delay-2 { animation-delay: .16s; }
        .delay-3 { animation-delay: .24s; }

        .float-icon {
          animation: softFloat 4s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .page-enter,
          .float-icon {
            animation: none !important;
          }

          * {
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">

        {/* Page heading */}
        <section className="page-enter mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D8E6F4] bg-[#EDF4FB] px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] text-[#3973B9]">
              <Sparkles size={13} />
              FINANCIAL OVERVIEW
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-[#102A43] sm:text-4xl">
              Transactions<span className="text-[#3973B9]">.</span>
            </h1>

            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Keep track of every rupee. Manage your income and expenses in one place.
            </p>
          </div>

          <a
            href="#transaction-form"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#102A43] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#102A43]/15 transition duration-300 hover:-translate-y-0.5 hover:bg-[#173D60] hover:shadow-xl active:scale-[0.98]"
          >
            <Plus size={18} />
            Add Transaction
          </a>
        </section>

        {/* Error and success messages */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3.5 text-sm text-rose-700"
          >
            <X size={17} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3.5 text-sm text-emerald-700"
          >
            <Sparkles size={17} className="mt-0.5 shrink-0" />
            {success}
          </div>
        )}

        {/* Summary cards */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2">

          <div className="page-enter delay-1 group rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/[0.05] sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Total Income
                </p>

                <p className="mt-3 text-2xl font-extrabold tracking-tight text-emerald-600 sm:text-3xl">
                  {currency(totalIncome)}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Money received
                </p>
              </div>

              <div className="float-icon rounded-2xl bg-emerald-50 p-3.5 text-emerald-600 transition group-hover:bg-emerald-100">
                <TrendingUp size={25} />
              </div>
            </div>

            <div className="mt-5 h-1 overflow-hidden rounded-full bg-emerald-50">
              <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
            </div>
          </div>

          <div className="page-enter delay-2 group rounded-2xl border border-rose-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-900/[0.05] sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Total Expenses
                </p>

                <p className="mt-3 text-2xl font-extrabold tracking-tight text-rose-600 sm:text-3xl">
                  {currency(totalExpenses)}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Money spent
                </p>
              </div>

              <div className="float-icon rounded-2xl bg-rose-50 p-3.5 text-rose-600 transition group-hover:bg-rose-100">
                <TrendingDown size={25} />
              </div>
            </div>

            <div className="mt-5 h-1 overflow-hidden rounded-full bg-rose-50">
              <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-rose-400 to-rose-600" />
            </div>
          </div>

        </section>

        {/* Add / Edit transaction form */}
        <section
          id="transaction-form"
          className="page-enter delay-2 mb-8 scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
        >
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-7">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#EDF4FB] p-2.5 text-[#3973B9]">
                {editingId
                  ? <Pencil size={20} />
                  : <CircleDollarSign size={21} />}
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-[#102A43]">
                  {editingId ? 'Edit Transaction' : 'Add New Transaction'}
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  {editingId
                    ? 'Update your transaction details below.'
                    : 'Enter the details of your financial activity.'}
                </p>
              </div>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 self-start rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-[#102A43] sm:self-center"
              >
                <X size={15} />
                Cancel editing
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-7">

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              <div>
                <label
                  htmlFor="title"
                  className="mb-2 block text-xs font-bold text-slate-600"
                >
                  Transaction Title
                </label>

                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Grocery shopping"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="amount"
                  className="mb-2 block text-xs font-bold text-slate-600"
                >
                  Amount (₹)
                </label>

                <input
                  id="amount"
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  min="0.01"
                  step="0.01"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="type"
                  className="mb-2 block text-xs font-bold text-slate-600"
                >
                  Transaction Type
                </label>

                <select
                  id="type"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="mb-2 block text-xs font-bold text-slate-600"
                >
                  Category
                </label>

                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="transaction_date"
                  className="mb-2 block text-xs font-bold text-slate-600"
                >
                  Transaction Date
                </label>

                <input
                  id="transaction_date"
                  type="date"
                  name="transaction_date"
                  value={form.transaction_date}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="mb-2 block text-xs font-bold text-slate-600"
                >
                  Notes <span className="font-normal text-slate-400">(Optional)</span>
                </label>

                <input
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Add a note..."
                  className={inputClass}
                />
              </div>

            </div>

            <div className="mt-6 flex flex-wrap gap-3">

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#102A43] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#102A43]/15 transition duration-300 hover:-translate-y-0.5 hover:bg-[#173D60] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <Plus size={17} />
                )}

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

        {/* Transaction history */}
        <section className="page-enter delay-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">

          <div className="border-b border-slate-100 p-5 sm:p-7">

            <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <ReceiptText size={20} className="text-[#3973B9]" />

                  <h2 className="text-lg font-extrabold text-[#102A43]">
                    Transaction History
                  </h2>
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  {filteredTransactions.length} of {transactions.length} transactions displayed
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                <CalendarDays size={14} />
                All activity
              </div>
            </div>

            {/* Search and filters */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_180px_190px]">

              <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 transition focus-within:border-[#3973B9] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#3973B9]/10">
                <Search size={17} className="shrink-0 text-slate-400" />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search transactions..."
                  aria-label="Search transactions"
                  className="w-full min-w-0 bg-transparent py-3 text-sm outline-none placeholder:text-slate-400"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                    className="text-slate-400 hover:text-[#102A43]"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="relative">
                <Filter
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  aria-label="Filter by transaction type"
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-9 pr-3 text-sm text-slate-600 outline-none transition focus:border-[#3973B9] focus:ring-4 focus:ring-[#3973B9]/10"
                >
                  <option value="all">All types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by category"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3 text-sm text-slate-600 outline-none transition focus:border-[#3973B9] focus:ring-4 focus:ring-[#3973B9]/10"
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

          {/* Loading state */}
          {loading ? (
            <div className="space-y-4 p-6 sm:p-8">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex animate-pulse items-center gap-4"
                >
                  <div className="h-11 w-11 rounded-xl bg-slate-100" />

                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 rounded bg-slate-100" />
                    <div className="h-2.5 w-1/4 rounded bg-slate-100" />
                  </div>

                  <div className="h-4 w-20 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (

            /* Empty state */
            <div className="px-5 py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EDF4FB] text-[#3973B9]">
                <ReceiptText size={30} />
              </div>

              <h3 className="font-bold text-[#102A43]">
                No transactions found
              </h3>

              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-400">
                {transactions.length === 0
                  ? 'Your transaction history is empty. Add your first transaction to get started.'
                  : 'Try changing your search or filters to find what you are looking for.'}
              </p>

              {transactions.length === 0 && (
                <a
                  href="#transaction-form"
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#102A43] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#173D60]"
                >
                  <Plus size={15} />
                  Add your first transaction
                </a>
              )}
            </div>

          ) : (
            <>

              {/* Desktop transaction table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">

                  <thead className="bg-[#F3F7FB] text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    <tr>
                      <th className="px-6 py-4 font-bold">Transaction</th>
                      <th className="px-5 py-4 font-bold">Category</th>
                      <th className="px-5 py-4 font-bold">Date</th>
                      <th className="px-5 py-4 font-bold">Amount</th>
                      <th className="px-5 py-4 font-bold">Type</th>
                      <th className="px-5 py-4 text-right font-bold">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((item) => {
                      const isIncome = item.type === 'income'

                      return (
                        <tr
                          key={item.id}
                          className="group transition duration-200 hover:bg-[#F3F7FB]"
                        >

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`rounded-xl p-2.5 ${
                                  isIncome
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'bg-rose-50 text-rose-600'
                                }`}
                              >
                                {isIncome
                                  ? <ArrowDownRight size={19} />
                                  : <ArrowUpRight size={19} />}
                              </div>

                              <div className="min-w-0">
                                <p className="max-w-48 truncate text-sm font-bold text-[#102A43]">
                                  {item.title}
                                </p>

                                {item.notes && (
                                  <p className="mt-1 max-w-48 truncate text-xs text-slate-400">
                                    {item.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-lg bg-[#EDF4FB] px-2.5 py-1.5 text-xs font-semibold text-[#3973B9]">
                              {item.category || 'Other'}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-slate-500">
                            {formatDate(item.transaction_date)}
                          </td>

                          <td
                            className={`whitespace-nowrap px-5 py-4 text-sm font-extrabold ${
                              isIncome ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isIncome ? '+' : '-'}{currency(item.amount)}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${
                                isIncome
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {isIncome ? 'INCOME' : 'EXPENSE'}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-1.5">

                              <button
                                type="button"
                                onClick={() => handleEdit(item)}
                                aria-label={`Edit ${item.title}`}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-[#EDF4FB] hover:text-[#3973B9]"
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                disabled={deletingId === item.id}
                                aria-label={`Delete ${item.title}`}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                              >
                                {deletingId === item.id ? (
                                  <span className="block h-4 w-4 animate-spin rounded-full border-2 border-rose-200 border-t-rose-600" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>

                            </div>
                          </td>

                        </tr>
                      )
                    })}
                  </tbody>

                </table>
              </div>

              {/* Mobile transaction cards */}
              <div className="divide-y divide-slate-100 md:hidden">
                {filteredTransactions.map((item) => {
                  const isIncome = item.type === 'income'

                  return (
                    <div
                      key={item.id}
                      className="p-4 transition hover:bg-[#F3F7FB]"
                    >
                      <div className="flex items-start gap-3">

                        <div
                          className={`shrink-0 rounded-xl p-3 ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          {isIncome
                            ? <ArrowDownRight size={20} />
                            : <ArrowUpRight size={20} />}
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-[#102A43]">
                                {item.title}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {item.category || 'Other'} · {formatDate(item.transaction_date)}
                              </p>
                            </div>

                            <p
                              className={`shrink-0 text-sm font-extrabold ${
                                isIncome ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {isIncome ? '+' : '-'}{currency(item.amount)}
                            </p>
                          </div>

                          {item.notes && (
                            <p className="mt-2 truncate text-xs text-slate-400">
                              {item.notes}
                            </p>
                          )}

                          <div className="mt-3 flex items-center justify-between">

                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                isIncome
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {isIncome ? 'INCOME' : 'EXPENSE'}
                            </span>

                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleEdit(item)}
                                aria-label={`Edit ${item.title}`}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-[#EDF4FB] hover:text-[#3973B9]"
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                disabled={deletingId === item.id}
                                aria-label={`Delete ${item.title}`}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                              >
                                {deletingId === item.id ? (
                                  <span className="block h-4 w-4 animate-spin rounded-full border-2 border-rose-200 border-t-rose-600" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            </div>

                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

            </>
          )}
        </section>

        {/* Footer note */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-center text-[11px] font-medium text-slate-400">
          <Wallet size={13} />
          Your financial data is private and secured to your account.
        </div>

      </div>
    </main>
  )
}
