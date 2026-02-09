import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext'
import { CustomerProvider } from './context/CustomerContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Analytics from './pages/Analytics'

export default function App() {
  return (
    <ThemeProvider>
      <CustomerProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/analytics" element={<Analytics />} />
            </Route>
          </Routes>
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
    </ThemeProvider>
  )
}
