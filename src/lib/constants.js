export const INSURANCE_TYPES = [
  'Life Insurance',
  'Health Insurance',
  'Auto Insurance',
  'Home Insurance',
  'Travel Insurance',
]

export const INSURANCE_COLORS = {
  'Life Insurance': '#059669',
  'Health Insurance': '#0891b2',
  'Auto Insurance': '#7c3aed',
  'Home Insurance': '#db2777',
  'Travel Insurance': '#ea580c',
}

export const getDaysUntilDeadline = (deadline) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadlineDate = new Date(deadline)
  deadlineDate.setHours(0, 0, 0, 0)
  const diffTime = deadlineDate - today
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export const getDeadlineStatus = (deadline) => {
  const days = getDaysUntilDeadline(deadline)
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
