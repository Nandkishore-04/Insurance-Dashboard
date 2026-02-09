import { useState, useEffect } from 'react'
import { X, UserPlus, Save } from 'lucide-react'
import { INSURANCE_TYPES } from '../lib/constants'
import { useCustomers } from '../context/CustomerContext'
import toast from 'react-hot-toast'

const emptyForm = {
  name: '',
  age: '',
  address: '',
  dob: '',
  insurance_type: '',
  amount: '',
  issued_on: '',
  deadline: '',
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: error ? '#ef4444' : 'var(--text-muted)' }}>
        {label} {required && <span className="text-primary-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[11px] font-medium text-red-500 mt-1.5 flex items-center gap-1" role="alert">
          <span className="w-1 h-1 rounded-full bg-red-500" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}

const inputClass = "w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200"

export default function CustomerForm({ open, onClose, editData }) {
  const { add, update } = useCustomers()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (editData) {
      setForm({
        name: editData.name || '',
        age: editData.age?.toString() || '',
        address: editData.address || '',
        dob: editData.dob || '',
        insurance_type: editData.insurance_type || '',
        amount: editData.amount?.toString() || '',
        issued_on: editData.issued_on || '',
        deadline: editData.deadline || '',
      })
    } else {
      setForm(emptyForm)
    }
    setErrors({})
  }, [editData, open])

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.insurance_type) errs.insurance_type = 'Select a type'
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      errs.amount = 'Enter a valid amount'
    if (!form.issued_on) errs.issued_on = 'Select issue date'
    if (!form.deadline) errs.deadline = 'Select deadline'
    if (form.age && (isNaN(Number(form.age)) || Number(form.age) < 0 || Number(form.age) > 150))
      errs.age = 'Enter a valid age'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        age: form.age ? Number(form.age) : null,
        address: form.address.trim() || null,
        dob: form.dob || null,
        insurance_type: form.insurance_type,
        amount: Number(form.amount),
        issued_on: form.issued_on,
        deadline: form.deadline,
      }

      if (editData) {
        await update(editData.id, payload)
      } else {
        await add(payload)
      }
      onClose()
    } catch (err) {
      toast.error('Operation failed: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="form-title">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        className="relative rounded-2xl w-full max-w-lg border animate-slide-up"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
              {editData
                ? <Save className="w-5 h-5 text-primary-600" aria-hidden="true" />
                : <UserPlus className="w-5 h-5 text-primary-600" aria-hidden="true" />
              }
            </div>
            <div>
              <h2 id="form-title" className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {editData ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                {editData ? 'Update customer details' : 'Fill in the customer information'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-all duration-200 hover:bg-[var(--hover-bg)]"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close form"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <Field label="Full Name" required error={errors.name}>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={inputClass}
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: errors.name ? '#ef4444' : 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
              placeholder="e.g. John Doe"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Age" error={errors.age}>
              <input
                type="number"
                value={form.age}
                onChange={(e) => set('age', e.target.value)}
                className={inputClass}
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: errors.age ? '#ef4444' : 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
                placeholder="30"
              />
            </Field>
            <Field label="Date of Birth">
              <input
                type="date"
                value={form.dob}
                onChange={(e) => set('dob', e.target.value)}
                className={inputClass}
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </Field>
          </div>

          <Field label="Address">
            <input
              type="text"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              className={inputClass}
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
              placeholder="123 Main St, City, State"
            />
          </Field>

          <Field label="Insurance Type" required error={errors.insurance_type}>
            <select
              value={form.insurance_type}
              onChange={(e) => set('insurance_type', e.target.value)}
              className={inputClass}
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: errors.insurance_type ? '#ef4444' : 'var(--border-color)',
                color: form.insurance_type ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              <option value="">Select type...</option>
              {INSURANCE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>

          <Field label="Premium Amount (₹)" required error={errors.amount}>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              className={inputClass}
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: errors.amount ? '#ef4444' : 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
              placeholder="50,000"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Issued On" required error={errors.issued_on}>
              <input
                type="date"
                value={form.issued_on}
                onChange={(e) => set('issued_on', e.target.value)}
                className={inputClass}
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: errors.issued_on ? '#ef4444' : 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </Field>
            <Field label="Deadline" required error={errors.deadline}>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => set('deadline', e.target.value)}
                className={inputClass}
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: errors.deadline ? '#ef4444' : 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </Field>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold border transition-all duration-200 hover:bg-[var(--hover-bg)]"
              style={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 transition-all duration-200 shadow-md shadow-primary-500/25"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                  Saving...
                </span>
              ) : editData ? 'Update Customer' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
