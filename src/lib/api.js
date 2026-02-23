// ─── Web fallback (localStorage) — used when not running in Electron ─────────
function getLS(key) {
  try { return JSON.parse(localStorage.getItem(key)) || [] } catch { return [] }
}
function setLS(key, val) {
  localStorage.setItem(key, JSON.stringify(val))
}

const webAPI = {
  getCustomers: () => Promise.resolve(getLS('customers')),

  addCustomer: (customer) => {
    const customers = getLS('customers')
    const letter = (customer.name || 'A')[0].toUpperCase()
    const existing = customers.filter(c => c.cust_code?.startsWith(letter))
    const num = String(existing.length + 1).padStart(4, '0')
    const row = { ...customer, id: crypto.randomUUID(), cust_code: `${letter}${num}`, created_at: new Date().toISOString() }
    setLS('customers', [row, ...customers])
    return Promise.resolve(row)
  },

  updateCustomer: (id, updates) => {
    const customers = getLS('customers').map(c => c.id === id ? { ...c, ...updates } : c)
    setLS('customers', customers)
    return Promise.resolve(customers.find(c => c.id === id))
  },

  deleteCustomer: (id) => {
    setLS('customers', getLS('customers').filter(c => c.id !== id))
    setLS('insurances', getLS('insurances').filter(i => i.customer_id !== id))
    return Promise.resolve()
  },

  searchCustomers: (query) => {
    const q = (query || '').toLowerCase()
    return Promise.resolve(getLS('customers').filter(c =>
      c.name?.toLowerCase().includes(q) || c.cust_code?.toLowerCase().includes(q) || c.phone?.includes(q)
    ))
  },

  getInsurances: (customerId) => {
    const ins = getLS('insurances')
    return Promise.resolve(customerId ? ins.filter(i => i.customer_id === customerId) : ins)
  },

  addInsurance: (insurance) => {
    const insurances = getLS('insurances')
    const row = { ...insurance, id: crypto.randomUUID(), created_at: new Date().toISOString() }
    setLS('insurances', [...insurances, row])
    return Promise.resolve(row)
  },

  updateInsurance: (id, updates) => {
    const insurances = getLS('insurances').map(i => i.id === id ? { ...i, ...updates } : i)
    setLS('insurances', insurances)
    return Promise.resolve(insurances.find(i => i.id === id))
  },

  deleteInsurance: (id) => {
    setLS('insurances', getLS('insurances').filter(i => i.id !== id))
    return Promise.resolve()
  },

  acknowledgeRenewal: (id) => {
    const insurances = getLS('insurances').map(i => i.id === id ? { ...i, renewal_acknowledged: 1 } : i)
    setLS('insurances', insurances)
    return Promise.resolve(insurances.find(i => i.id === id))
  },
}

const api = window.electronAPI || webAPI

// ─── Customer operations ─────────────────────────────────────

export async function fetchCustomers() {
  return api.getCustomers()
}

export async function addCustomer(customer) {
  return api.addCustomer(customer)
}

export async function updateCustomer(id, updates) {
  return api.updateCustomer(id, updates)
}

export async function deleteCustomer(id) {
  return api.deleteCustomer(id)
}

export async function searchCustomers(query) {
  return api.searchCustomers(query)
}

// ─── Insurance operations ────────────────────────────────────

export async function fetchInsurances(customerId) {
  return api.getInsurances(customerId || null)
}

export async function addInsurance(insurance) {
  return api.addInsurance(insurance)
}

export async function updateInsurance(id, updates) {
  return api.updateInsurance(id, updates)
}

export async function acknowledgeRenewal(id) {
  return api.acknowledgeRenewal(id)
}

export async function deleteInsurance(id) {
  return api.deleteInsurance(id)
}
