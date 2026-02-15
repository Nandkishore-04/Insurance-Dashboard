import { supabase } from './supabase'

const isElectron = typeof window !== 'undefined' && !!window.electronAPI

// ─── Customer operations ─────────────────────────────────────

export async function fetchCustomers() {
  if (isElectron) {
    return window.electronAPI.getCustomers()
  }
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addCustomer(customer) {
  if (isElectron) {
    return window.electronAPI.addCustomer(customer)
  }
  const { data, error } = await supabase
    .from('customers')
    .insert([customer])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCustomer(id, updates) {
  if (isElectron) {
    return window.electronAPI.updateCustomer(id, updates)
  }
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCustomer(id) {
  if (isElectron) {
    return window.electronAPI.deleteCustomer(id)
  }
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function searchCustomers(query) {
  if (isElectron) {
    return window.electronAPI.searchCustomers(query)
  }
  const q = `%${query}%`
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`name.ilike.${q},phone.ilike.${q},address.ilike.${q}`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ─── Insurance operations ────────────────────────────────────

export async function fetchInsurances(customerId) {
  if (isElectron) {
    return window.electronAPI.getInsurances(customerId || null)
  }
  let query = supabase.from('insurances').select('*')
  if (customerId) {
    query = query.eq('customer_id', customerId)
  }
  query = query.order('expiry_date', { ascending: true })
  const { data, error } = await query
  if (error) throw error
  return (data || []).map(row => ({
    ...row,
    details: typeof row.details === 'string' ? JSON.parse(row.details) : (row.details || {}),
  }))
}

export async function addInsurance(insurance) {
  if (isElectron) {
    return window.electronAPI.addInsurance(insurance)
  }
  const { data, error } = await supabase
    .from('insurances')
    .insert([insurance])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateInsurance(id, updates) {
  if (isElectron) {
    return window.electronAPI.updateInsurance(id, updates)
  }
  const { data, error } = await supabase
    .from('insurances')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteInsurance(id) {
  if (isElectron) {
    return window.electronAPI.deleteInsurance(id)
  }
  const { error } = await supabase
    .from('insurances')
    .delete()
    .eq('id', id)
  if (error) throw error
}
