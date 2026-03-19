import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo.componentStack)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null })
    window.location.hash = '/'
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#e2e8f0',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '2rem',
        }}
      >
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: 28,
            }}
          >
            !
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24, lineHeight: 1.6 }}>
            The app encountered an unexpected error. Your data is safe — try reloading the page.
          </p>
          {this.state.error && (
            <pre
              style={{
                fontSize: 11,
                color: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 24,
                textAlign: 'left',
                overflow: 'auto',
                maxHeight: 120,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={this.handleReload}
              style={{
                padding: '10px 24px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(to right, #10b981, #059669)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reload App
            </button>
            <button
              onClick={this.handleGoHome}
              style={{
                padding: '10px 24px',
                borderRadius: 12,
                border: '1px solid #334155',
                background: 'transparent',
                color: '#94a3b8',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }
}
