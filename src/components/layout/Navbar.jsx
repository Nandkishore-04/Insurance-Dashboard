import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Moon, Sun, Menu, Search, X, LogOut } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'

export default function Navbar({ onMenuClick }) {
  const { dark, toggle } = useTheme()
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const tag = document.activeElement?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape' && focused) {
        inputRef.current?.blur()
        setQuery('')
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [focused])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/customers?search=${encodeURIComponent(query.trim())}`)
      inputRef.current?.blur()
    }
  }

  return (
    <header
      className="sticky top-0 z-30 h-16 border-b flex items-center justify-between px-4 lg:px-8 shrink-0 backdrop-blur-xl"
      style={{
        backgroundColor: dark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl transition-all duration-200 hover:bg-[var(--hover-bg)] focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        <form onSubmit={handleSubmit} className="hidden sm:block" data-testid="navbar-search-form">
          <div
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl w-72 border transition-all duration-200"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: focused ? '#10b981' : 'var(--border-color)',
              boxShadow: focused ? '0 0 0 3px rgba(16,185,129,0.15)' : 'none',
            }}
          >
            <Search className="w-4 h-4 shrink-0" style={{ color: focused ? '#10b981' : 'var(--text-muted)' }} aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Search customers..."
              className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-[var(--text-muted)]"
              style={{ color: 'var(--text-primary)' }}
              aria-label="Search customers"
              data-testid="input-navbar-search"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-0.5 rounded hover:bg-[var(--hover-bg)]"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
              </button>
            ) : (
              <kbd
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md border hidden md:block"
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--bg-card)',
                }}
              >
                /
              </kbd>
            )}
          </div>
        </form>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="p-2.5 rounded-xl transition-all duration-200 hover:bg-[var(--hover-bg)] focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2"
          style={{ color: 'var(--text-secondary)' }}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          data-testid="btn-theme-toggle"
        >
          {dark ? <Sun className="w-[18px] h-[18px]" aria-hidden="true" /> : <Moon className="w-[18px] h-[18px]" aria-hidden="true" />}
        </button>

        <div className="w-px h-8 mx-1" style={{ backgroundColor: 'var(--border-color)' }} aria-hidden="true" />

        <div className="flex items-center gap-3 p-1.5 pr-3 rounded-xl group cursor-pointer" onClick={logout} data-testid="btn-logout">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold shadow-sm group-hover:shadow-primary-500/30 transition-shadow">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[var(--bg-card)] border-2 border-[var(--bg-card)] flex items-center justify-center rounded-full shadow-sm text-red-500 bg-red-500">
              <LogOut className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold leading-none group-hover:text-red-500 transition-colors" style={{ color: 'var(--text-primary)' }}>{user?.name || 'Admin'}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
