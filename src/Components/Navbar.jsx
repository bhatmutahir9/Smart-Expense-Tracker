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
} from 'lucide-react'
import { useAuth } from '../context/useAuth'

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: ReceiptText },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Budgets', path: '/budgets', icon: Target },
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
    `flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 ${
      isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-sm shadow-slate-900/[0.02] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to="/dashboard"
          className="flex items-center gap-3"
          onClick={() => setMobileOpen(false)}
        >
            <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 text-white shadow-lg shadow-blue-600/20">
              <Wallet size={22} />
            </div>

          <div>
            <p className="text-base font-extrabold tracking-tight text-slate-900">
              Smart Expense
            </p>
            <p className="text-[10px] font-semibold tracking-wider text-slate-400">
              PERSONAL FINANCE TRACKER
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={navLinkClass}
              >
                <Icon size={17} />
                {item.name}
              </NavLink>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="hidden items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 lg:flex"
          >
            <LogOut size={16} />
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50 lg:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-slate-100 bg-white p-4 shadow-lg lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-2">
            {navItems.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={navLinkClass}
                >
                  <Icon size={18} />
                  {item.name}
                </NavLink>
              )
            })}

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              <LogOut size={18} />
              {loggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </nav>
      )}
    </header>
  )
}