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
  if (days <= 60) return 'approaching'
  return 'active'
}

const MODE_MULTIPLIER = { YLY: 1, HLY: 2, QLY: 4, MLY: 12 }

export const getAnnualPremium = (policy) => {
  const premium = Number(policy.premium) || 0
  const mode = policy.details?.mode || ''
  const multiplier = MODE_MULTIPLIER[mode] || 1
  return premium * multiplier
}

export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
