import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <div
        className="relative rounded-2xl p-6 w-full max-w-sm border animate-slide-up"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-all duration-200 hover:bg-[var(--hover-bg)]"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" aria-hidden="true" />
          </div>
          <h3 id="confirm-title" className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h3>
          <p id="confirm-message" className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
            {message}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 hover:bg-[var(--hover-bg)]"
            style={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-all duration-200 shadow-sm shadow-red-500/25"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
