import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { fetchCustomers, addCustomer, updateCustomer, deleteCustomer } from '../lib/api'
import toast from 'react-hot-toast'

const CustomerContext = createContext()

export function CustomerProvider({ children }) {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchCustomers()
      setCustomers(data)
    } catch (err) {
      toast.error('Failed to load customers: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

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
    toast.success('Customer deleted successfully')
  }

  return (
    <CustomerContext.Provider value={{ customers, loading, reload: load, add, update, remove }}>
      {children}
    </CustomerContext.Provider>
  )
}

export const useCustomers = () => useContext(CustomerContext)
