import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, BarChart3, Shield, X, Settings } from 'lucide-react'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full flex flex-col
          border-r transition-all duration-300 ease-in-out
          lg:static lg:z-auto
          ${open ? 'w-[260px] translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 overflow-hidden border-none'}
        `}
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          borderColor: 'var(--border-color)',
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-6 h-16 border-b shrink-0"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md shadow-primary-500/20">
            <Shield className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            InsureTrack
          </span>
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg transition-colors hover:bg-[var(--hover-bg)] focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} aria-hidden="true" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          <p className="px-3 mb-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Menu
          </p>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2 ${isActive
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/25'
                  : 'hover:bg-[var(--hover-bg)]'
                }`
              }
              style={({ isActive }) =>
                isActive ? {} : { color: 'var(--text-secondary)' }
              }
              end={to === '/'}
            >
              <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t text-[11px] font-medium"
          style={{
            borderColor: 'var(--border-color)',
            color: 'var(--text-muted)',
          }}
        >
          InsureTrack v1.0
        </div>
      </aside>
    </>
  )
}
