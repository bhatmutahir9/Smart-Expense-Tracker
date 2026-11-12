
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
    `relative flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-white text-[#102A43] shadow-sm ring-1 ring-slate-200/80'
        : 'text-slate-500 hover:bg-white/70 hover:text-[#102A43]'
    }`

  const mobileLinkClass = ({ isActive }) =>
    `flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-200 ${
      isActive
        ? 'bg-[#EDF4FB] text-[#102A43] ring-1 ring-[#D8E6F4]'
        : 'text-slate-600 hover:bg-slate-50 hover:text-[#102A43]'
    }`

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-[0_3px_16px_rgba(16,42,67,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-[74px] max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 xl:px-8">

        {/* Brand */}
        <Link
          to="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="group flex shrink-0 items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#102A43] shadow-md shadow-[#102A43]/15 transition-all duration-300 group-hover:bg-[#173D60] group-hover:shadow-lg">
            <Wallet
              className="h-[21px] w-[21px] text-white"
              strokeWidth={2.1}
            />
          </div>

          <div className="flex flex-col leading-none">
            <span className="text-[19px] font-extrabold tracking-[-0.7px] text-[#102A43]">
              Smart <span className="text-[#3973B9]">Spend</span>
            </span>

            <span className="mt-1.5 text-[9px] font-semibold tracking-[2px] text-slate-400">
              PERSONAL FINANCE
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-50/80 p-1 xl:flex">
          {navItems.map(({ name, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={navLinkClass}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={16}
                    strokeWidth={isActive ? 2.2 : 1.9}
                    className={
                      isActive
                        ? 'text-[#3973B9]'
                        : 'text-slate-400 transition-colors group-hover:text-[#3973B9]'
                    }
                  />

                  <span>{name}</span>

                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-[#3973B9]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Logout */}
        <div className="hidden shrink-0 items-center xl:flex">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="group flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition-all duration-200 hover:border-red-100 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#102A43] transition-all duration-200 hover:border-[#C7D9EB] hover:bg-[#F3F7FB] xl:hidden"
        >
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="border-t border-slate-200/80 bg-white px-4 pb-5 pt-4 shadow-lg shadow-slate-900/5 animate-in slide-in-from-top-2 duration-200 xl:hidden">
          <div className="mx-auto max-w-[1500px] space-y-2">

            <p className="px-4 pb-1 text-[10px] font-bold uppercase tracking-[1.8px] text-slate-400">
              Navigation
            </p>

            {navItems.map(({ name, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={mobileLinkClass}
              >
                {({ isActive }) => (
                  <>
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          isActive
                            ? 'bg-white text-[#3973B9]'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Icon size={17} />
                      </span>

                      <span className="text-sm font-semibold">{name}</span>
                    </span>

                    <ChevronRight
                      size={17}
                      className={isActive ? 'text-[#3973B9]' : 'text-slate-300'}
                    />
                  </>
                )}
              </NavLink>
            ))}

            <div className="my-3 border-t border-slate-100" />

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                <LogOut size={17} />
              </span>

              {loggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
