import { lazy, Suspense, useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext'
import { CustomerProvider } from './context/CustomerContext'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'

// Lazy-load non-landing pages — only fetched when navigated to
const Customers = lazy(() => import('./pages/Customers'))
const Analytics = lazy(() => import('./pages/Analytics'))
const CustomerProfile = lazy(() => import('./pages/CustomerProfile'))
const AddCustomer = lazy(() => import('./pages/AddCustomer'))
const BackupRestore = lazy(() => import('./pages/BackupRestore'))

// ─── #5: Handle keyboard shortcuts from main process ──────────────
function ShortcutHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!window.electronAPI?.onShortcut) return

    window.electronAPI.onShortcut((action) => {
      switch (action) {
        case 'new-insurance':
          navigate('/customers/add')
          break
        case 'search':
        case 'nav-customers':
          navigate('/customers')
          // Focus search input after navigation
          setTimeout(() => {
            const input = document.querySelector('input[aria-label*="Search"]')
            if (input) input.focus()
          }, 100)
          break
        case 'nav-dashboard':
          navigate('/')
          break
        case 'nav-analytics':
          navigate('/analytics')
          break
        case 'backup':
          navigate('/settings')
          break
        case 'export-pdf':
          // Dispatch a custom event that Customers page listens for
          window.dispatchEvent(new CustomEvent('app:export-pdf'))
          break
      }
    })

    return () => {
      window.electronAPI?.removeShortcutListeners?.()
    }
  }, [navigate])

  return null
}

// ─── Update notification banner ──────────────────────────────────
function UpdateBanner() {
  const [update, setUpdate] = useState(null)

  useEffect(() => {
    if (!window.electronAPI?.onUpdateStatus) return

    window.electronAPI.onUpdateStatus((data) => {
      setUpdate(data)
    })

    return () => {
      window.electronAPI?.removeUpdateListeners?.()
    }
  }, [])

  if (!update) return null

  const handleRestart = () => {
    window.electronAPI?.installUpdate?.()
  }

  if (update.status === 'downloading') {
    return (
      <div style={{
        background: '#2563eb', color: '#fff', textAlign: 'center',
        padding: '8px 16px', fontSize: '13px', fontWeight: 500,
      }}>
        Downloading update... {update.percent}%
      </div>
    )
  }

  if (update.status === 'downloaded') {
    return (
      <div style={{
        background: '#059669', color: '#fff', textAlign: 'center',
        padding: '8px 16px', fontSize: '13px', fontWeight: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
      }}>
        <span>Update v{update.version} is ready!</span>
        <button
          onClick={handleRestart}
          style={{
            background: '#fff', color: '#059669', border: 'none', borderRadius: '6px',
            padding: '4px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Restart Now
        </button>
      </div>
    )
  }

  return null
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <CustomerProvider>
          <HashRouter>
            <UpdateBanner />
            <ShortcutHandler />
            <Suspense fallback={null}>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/customers/add" element={<AddCustomer />} />
                  <Route path="/customer/:id" element={<CustomerProfile />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<BackupRestore />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  fontSize: '13px',
                  fontWeight: 500,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12)',
                  padding: '12px 16px',
                },
                success: {
                  iconTheme: { primary: '#10b981', secondary: '#fff' },
                },
                error: {
                  iconTheme: { primary: '#ef4444', secondary: '#fff' },
                },
              }}
            />
          </HashRouter>
        </CustomerProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
