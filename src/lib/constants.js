export const INSURANCE_TYPES = ['General', 'Life', 'Health', 'Personal Accident']

export const INSURANCE_COLORS = {
  General: '#7c3aed',
  Life: '#059669',
  Health: '#0891b2',
  'Personal Accident': '#f59e0b',
}

export const GENERAL_SUBTYPES = ['Pvt Car', 'Commercial Vehicle', 'Two Wheeler']

export const PAYMENT_MODES = ['YLY', 'HLY', 'QLY', 'MLY']

export const getDaysUntilDeadline = (expiryDate) => {
  if (!expiryDate) return Infinity
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(expiryDate)
  d.setHours(0, 0, 0, 0)
  const diffTime = d - today
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export const getDeadlineStatus = (expiryDate) => {
  if (!expiryDate) return 'active'
  const days = getDaysUntilDeadline(expiryDate)
  if (days < 0) return 'overdue'
  if (days <= 30) return 'approaching'
  return 'active'
}

export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
