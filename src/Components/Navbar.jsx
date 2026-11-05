
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Wallet,
  LayoutDashboard,
  ReceiptText,
  BarChart3,
  LogOut,
  Menu,
  Target,
  X,
  Repeat,
  ChevronRight,
} from 'lucide-react'

import { useAuth } from '../context/useAuth'

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: ReceiptText },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Budgets', path: '/budgets', icon: Target },
  { name: 'Savings Goals', path: '/savings-goals', icon: Target },
  { name: 'Recurring', path: '/recurring-transactions', icon: Repeat },
]

export default function Navbar() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    if (loggingOut) return

    setLoggingOut(true)

    try {
      await logout()
      setMobileOpen(false)
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setLoggingOut(false)
    }
  }

  const navLinkClass = ({ isActive }) =>
    `group relative flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/70'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`

  const mobileLinkClass = ({ isActive }) =>
    `flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-200 ${
      isActive
        ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-2xl">
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-4 sm:px-6 xl:px-10">

        {/* Brand */}
        <Link
          to="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="group flex shrink-0 items-center gap-3"
        >
          <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-lg shadow-blue-600/20 transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-blue-600/30">
            <Wallet size={22} strokeWidth={2.2} />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20" />
          </div>

          <div className="leading-none">
            <p className="text-[17px] font-extrabold tracking-tight text-slate-900">
              Smart<span className="text-blue-600">Expense</span>
            </p>
            <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.19em] text-slate-400">
              Personal Finance
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1 xl:flex"
        >
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={navLinkClass}
              >
                <Icon
                  size={16}
                  strokeWidth={2}
                  className="transition-transform duration-200 group-hover:scale-105"
                />
                <span>{item.name}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Desktop Actions + Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 xl:flex"
          >
            <LogOut size={16} />
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 xl:hidden"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-slate-100 bg-white px-4 pb-5 pt-4 shadow-xl shadow-slate-900/5 xl:hidden sm:px-6"
        >
          <div className="mx-auto max-w-2xl">

            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Navigation
              </p>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                {navItems.length} Sections
              </span>
            </div>

            <nav aria-label="Mobile navigation" className="grid gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={mobileLinkClass}
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100/80">
                        <Icon size={18} />
                      </span>
                      <span className="text-sm font-semibold">
                        {item.name}
                      </span>
                    </span>

                    <ChevronRight size={17} className="opacity-50" />
                  </NavLink>
                )
              })}
            </nav>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
              >
                <LogOut size={17} />
                {loggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
