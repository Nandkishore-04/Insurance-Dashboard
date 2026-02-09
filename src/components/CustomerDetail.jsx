import { X, User, MapPin, Calendar, Shield, IndianRupee, Clock, Edit2, Trash2 } from 'lucide-react'
import { getDaysUntilDeadline, getDeadlineStatus, formatDate, formatCurrency } from '../lib/constants'

const statusVars = {
  active: {
    bg: 'var(--status-active-bg)',
    text: 'var(--status-active-text)',
    dot: 'var(--status-active-dot)',
  },
  approaching: {
    bg: 'var(--status-approaching-bg)',
    text: 'var(--status-approaching-text)',
    dot: 'var(--status-approaching-dot)',
  },
  overdue: {
    bg: 'var(--status-overdue-bg)',
    text: 'var(--status-overdue-text)',
    dot: 'var(--status-overdue-dot)',
  },
}

const statusLabel = {
  active: 'Active',
  approaching: 'Approaching',
  overdue: 'Overdue',
}

function DetailRow({ icon: Icon, label, value }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-b-0" style={{ borderColor: 'var(--border-color)' }}>
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: 'var(--bg-input)' }}
      >
        <Icon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {value}
        </p>
      </div>
    </div>
  )
}

export default function CustomerDetail({ customer, open, onClose, onEdit, onDelete }) {
  if (!open || !customer) return null

  const days = getDaysUntilDeadline(customer.deadline)
  const status = getDeadlineStatus(customer.deadline)
  const sv = statusVars[status]
  const daysText = status === 'overdue'
    ? `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`
    : `${days} day${days !== 1 ? 's' : ''} remaining`

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        className="relative rounded-2xl w-full max-w-md border animate-slide-up"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl transition-all duration-200 hover:bg-[var(--hover-bg)]"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close details"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary-500/25 shrink-0">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 id="detail-title" className="text-lg font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {customer.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-[11px] px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1.5"
                  style={{ backgroundColor: sv.bg, color: sv.text }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sv.dot }} />
                  {statusLabel[status]}
                </span>
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  {daysText}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Premium highlight */}
        <div
          className="mx-6 mb-4 rounded-xl p-4 flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-input)' }}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Premium Amount
            </p>
            <p className="text-2xl font-bold tracking-tight mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(customer.amount)}
            </p>
          </div>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#05966918', color: '#059669' }}
          >
            <IndianRupee className="w-5 h-5" strokeWidth={2.2} aria-hidden="true" />
          </div>
        </div>

        {/* Detail fields */}
        <div className="px-6 pb-2">
          <DetailRow icon={Shield} label="Insurance Type" value={customer.insurance_type} />
          <DetailRow icon={User} label="Age" value={customer.age ? `${customer.age} years old` : null} />
          <DetailRow icon={Calendar} label="Date of Birth" value={customer.dob ? formatDate(customer.dob) : null} />
          <DetailRow icon={MapPin} label="Address" value={customer.address} />
          <DetailRow icon={Calendar} label="Issued On" value={formatDate(customer.issued_on)} />
          <DetailRow icon={Clock} label="Deadline" value={formatDate(customer.deadline)} />
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex gap-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={() => { onClose(); onEdit(customer) }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-md shadow-primary-500/25"
          >
            <Edit2 className="w-4 h-4" aria-hidden="true" />
            Edit
          </button>
          <button
            onClick={() => { onClose(); onDelete(customer) }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
