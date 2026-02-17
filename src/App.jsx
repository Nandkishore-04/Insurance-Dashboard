import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext'
import { CustomerProvider } from './context/CustomerContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'

// Lazy-load non-landing pages — only fetched when navigated to
const Customers = lazy(() => import('./pages/Customers'))
const Analytics = lazy(() => import('./pages/Analytics'))
const CustomerProfile = lazy(() => import('./pages/CustomerProfile'))
const AddCustomer = lazy(() => import('./pages/AddCustomer'))
const BackupRestore = lazy(() => import('./pages/BackupRestore'))

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return null // Or a loading spinner

  if (!isAuthenticated) return <Login />

  return (
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
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CustomerProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
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
        </CustomerProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
