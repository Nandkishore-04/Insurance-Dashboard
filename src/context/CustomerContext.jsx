import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import {
  fetchCustomers, addCustomer, updateCustomer, deleteCustomer,
  fetchInsurances, addInsurance as apiAddInsurance,
  updateInsurance as apiUpdateInsurance, deleteInsurance as apiDeleteInsurance,
  acknowledgeRenewal,
} from '../lib/api'
import toast from 'react-hot-toast'

const CustomerContext = createContext()

export function CustomerProvider({ children }) {
  const [customers, setCustomers] = useState([])
  const [insurances, setInsurances] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [custData, insData] = await Promise.all([
        fetchCustomers(),
        fetchInsurances(),
      ])

      // Map legacy insurance type names to current ones
      const mappedInsurances = insData.map(ins => {
        let mappedType = ins.insurance_type
        if (mappedType === 'Motor') mappedType = 'General'
        else if (mappedType === 'Mediclaim') mappedType = 'Health'
        // Note: 'General' now means vehicle insurance — do NOT remap it to 'Life'

        return { ...ins, insurance_type: mappedType }
      })

      setCustomers(custData)
      setInsurances(mappedInsurances)
    } catch (err) {
      toast.error('Failed to load data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // ─── Customer CRUD ─────────────────────────────────────────

  const add = async (customer) => {
    const data = await addCustomer(customer)
    setCustomers((prev) => [data, ...prev])
    toast.success('Customer added successfully')
    return data
  }

  const update = async (id, updates) => {
    const data = await updateCustomer(id, updates)
    setCustomers((prev) => prev.map((c) => (c.id === id ? data : c)))
    toast.success('Customer updated successfully')
    return data
  }

  const remove = async (id) => {
    await deleteCustomer(id)
    setCustomers((prev) => prev.filter((c) => c.id !== id))
    setInsurances((prev) => prev.filter((ins) => ins.customer_id !== id))
    toast.success('Customer deleted successfully')
  }

  // ─── Insurance CRUD ────────────────────────────────────────

  const addIns = async (insurance) => {
    const data = await apiAddInsurance(insurance)
    setInsurances((prev) => [...prev, data])
    toast.success('Insurance added successfully')
    return data
  }

  const updateIns = async (id, updates) => {
    const data = await apiUpdateInsurance(id, updates)
    setInsurances((prev) => prev.map((ins) => (ins.id === id ? data : ins)))
    toast.success('Insurance updated successfully')
    return data
  }

  const removeIns = async (id) => {
    await apiDeleteInsurance(id)
    setInsurances((prev) => prev.filter((ins) => ins.id !== id))
    toast.success('Insurance deleted successfully')
  }

  const acknowledgePolicy = async (id) => {
    // Optimistically update local state to hide it instantly
    setInsurances((prev) => prev.map((ins) =>
      ins.id === id ? { ...ins, renewal_acknowledged: 1 } : ins
    ))

    // Call API in background
    try {
      await acknowledgeRenewal(id)
    } catch (err) {
      // Revert if failed
      setInsurances((prev) => prev.map((ins) =>
        ins.id === id ? { ...ins, renewal_acknowledged: 0 } : ins
      ))
      toast.error('Failed to acknowledge: ' + err.message)
      throw err
    }
  }

  // ─── Computed helpers ──────────────────────────────────────

  // Pre-index insurances by customer_id for O(1) lookups instead of O(N) filtering
  const insurancesByCustomer = useMemo(() => {
    const map = new Map()
    insurances.forEach((ins) => {
      const customerId = ins.customer_id
      if (!map.has(customerId)) {
        map.set(customerId, [])
      }
      map.get(customerId).push(ins)
    })
    return map
  }, [insurances])

  const getCustomerInsurances = useCallback(
    (customerId) => insurancesByCustomer.get(customerId) || [],
    [insurancesByCustomer]
  )

  const value = useMemo(() => ({
    customers,
    insurances,
    loading,
    reload: load,
    add,
    update,
    remove,
    addInsurance: addIns,
    updateInsurance: updateIns,
    removeInsurance: removeIns,
    acknowledgePolicy,
    getCustomerInsurances,
  }), [customers, insurances, loading, load, getCustomerInsurances])

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  )
}

export const useCustomers = () => useContext(CustomerContext)
