// ─── Customer operations ─────────────────────────────────────

export async function fetchCustomers() {
  return window.electronAPI.getCustomers()
}

export async function addCustomer(customer) {
  return window.electronAPI.addCustomer(customer)
}

export async function updateCustomer(id, updates) {
  return window.electronAPI.updateCustomer(id, updates)
}

export async function deleteCustomer(id) {
  return window.electronAPI.deleteCustomer(id)
}

export async function searchCustomers(query) {
  return window.electronAPI.searchCustomers(query)
}

// ─── Insurance operations ────────────────────────────────────

export async function fetchInsurances(customerId) {
  return window.electronAPI.getInsurances(customerId || null)
}

export async function addInsurance(insurance) {
  return window.electronAPI.addInsurance(insurance)
}

export async function updateInsurance(id, updates) {
  return window.electronAPI.updateInsurance(id, updates)
}

export async function acknowledgeRenewal(id) {
  return window.electronAPI.acknowledgeRenewal(id)
}

export async function deleteInsurance(id) {
  return window.electronAPI.deleteInsurance(id)
}

export async function seedLargeData(count) {
  return window.electronAPI.seedLargeData(count)
}
