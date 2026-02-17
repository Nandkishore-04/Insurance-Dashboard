import { useState, useEffect, useMemo } from 'react'
import { X, UserPlus, Save, Search, ChevronRight, ArrowLeft, Plus } from 'lucide-react'
import { INSURANCE_TYPES, GENERAL_SUBTYPES, PAYMENT_MODES } from '../lib/constants'
import { useCustomers } from '../context/CustomerContext'
import toast from 'react-hot-toast'

/**
 * mode prop shapes:
 *   null                          → full 2-step flow (new customer + new insurance)
 *   { type: 'addInsurance', customerId }  → skip step 1, go to step 2 for existing customer
 *   { type: 'editInsurance', insurance }  → skip step 1, edit existing insurance
 *   { type: 'editCustomer', customer }    → edit customer details only (no step 2)
 */

const emptyCustomer = {
  name: '',
  dob: '',
  sex: '',
  email: '',
  phone: '',
  address: '',
  pan_number: '',
  aadhar_number: '',
  pob: '',
  father_name: '',
  mother_name: '',
  spouse_name: '',
  nominee: '',
  nominee_dob: '',
  nominee_pan: '',
  relation: ''
}

const emptyInsurance = {
  insurance_type: '',
  policy_no: '',
  insurer: '',
  premium: '',
  agency_code: '',
  // General (Vehicles)
  vehicle_type: '',
  regn_no: '',
  make: '',
  model: '',
  mfg_year: '',
  cc: '',
  gvw: '',
  regn_validity: '',
  od_expiry: '',
  tp_expiry: '',
  cpa_expiry: '',
  comp_expiry: '',
  idv: '',
  nil_depreciation: 'No',
  // Health (formerly Mediclaim)
  proposer_name: '',
  prop_dob: '',
  family_size: '',
  scheme: '',
  sum_insured: '',
  policy_expiry: '',
  // General
  plan: '',
  term: '',
  ppt: '',
  mode: '',
  due_date: '',
  // Life
  sum_assured: '',
  policy_start: '',
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1.5 uppercase tracking-[0.1em]" style={{ color: error ? '#ef4444' : 'var(--text-primary)' }}>
        {label} {required && <span className="text-primary-600">*</span>}
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

function inputStyle(error) {
  return {
    backgroundColor: 'var(--bg-input)',
    borderColor: error ? '#ef4444' : 'var(--border-color)',
    color: 'var(--text-primary)',
  }
}

function selectStyle(error, hasValue) {
  return {
    backgroundColor: 'var(--bg-input)',
    borderColor: error ? '#ef4444' : 'var(--border-color)',
    color: hasValue ? 'var(--text-primary)' : 'var(--text-muted)',
  }
}

export default function CustomerForm({ open, onClose, mode, asModal = true }) {
  const { customers, add, update, addInsurance, updateInsurance } = useCustomers()

  const [_step, setStep] = useState(1)
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [customerForm, setCustomerForm] = useState(emptyCustomer)
  const [insuranceForm, setInsuranceForm] = useState(emptyInsurance)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [selectionMade, setSelectionMade] = useState(false)

  // Reset form on open/mode change
  useEffect(() => {
    if (!open) return
    setErrors({})
    setSubmitting(false)
    setSelectionMade(false)
    setCustomerSearch('')
    if (mode?.type === 'editCustomer') {
      setStep('editCustomer')
      setCustomerForm({
        name: mode.customer.name || '',
        dob: mode.customer.dob || '',
        sex: mode.customer.sex || '',
        email: mode.customer.email || '',
        phone: mode.customer.phone || '',
        address: mode.customer.address || '',
        pan_number: mode.customer.pan_number || '',
        aadhar_number: mode.customer.aadhar_number || '',
        pob: mode.customer.pob || '',
        father_name: mode.customer.father_name || '',
        mother_name: mode.customer.mother_name || '',
        spouse_name: mode.customer.spouse_name || '',
        nominee: mode.customer.nominee || '',
        nominee_dob: mode.customer.nominee_dob || '',
        nominee_pan: mode.customer.nominee_pan || '',
        relation: mode.customer.relation || '',
      })
      setSelectedCustomer(mode.customer)
      setSelectionMade(true)
    } else if (mode?.type === 'addInsurance') {
      const cust = customers.find((c) => c.id === mode.customerId)
      setStep(2)
      setSelectedCustomer(cust)
      setIsNewCustomer(false)
      setSelectionMade(true)
      setInsuranceForm({ ...emptyInsurance })
    } else if (mode?.type === 'editInsurance') {
      const ins = mode.insurance
      const cust = customers.find((c) => c.id === ins.customer_id)
      setStep(2)
      setSelectedCustomer(cust)
      setIsNewCustomer(false)
      setSelectionMade(true)
      // Populate from top-level fields + details JSON
      const details = ins.details || {}
      setInsuranceForm({
        ...emptyInsurance,
        insurance_type: ins.insurance_type || '',
        policy_no: ins.policy_no || '',
        insurer: ins.insurer || '',
        premium: ins.premium?.toString() || '',
        agency_code: ins.agency_code || '',
        // Spread details to populate type-specific fields
        ...Object.fromEntries(
          Object.entries(details).map(([k, v]) => [k, v?.toString() || ''])
        ),
      })
    } else {
      setStep(1)
      setSelectedCustomer(null)
      setIsNewCustomer(false)
      setSelectionMade(false)
      setCustomerForm(emptyCustomer)
      setInsuranceForm({ ...emptyInsurance })
    }
  }, [open, mode, customers])

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  const searchResults = useMemo(() => {
    if (!customerSearch.trim()) return []
    const q = customerSearch.toLowerCase()
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.pan_number?.toLowerCase().includes(q) ||
        c.cust_code?.toLowerCase().includes(q)
    ).slice(0, 5)
  }, [customerSearch, customers])

  const validateCustomer = () => {
    const errs = {}
    if (!customerForm.name.trim()) errs.name = 'Name is required'

    // Phone validation (10 digits)
    const phone = customerForm.phone.trim()
    if (phone && !/^\d{10}$/.test(phone)) {
      errs.phone = 'Phone number must be exactly 10 digits'
    }

    // PAN validation (5 letters, 4 digits, 1 letter)
    const pan = customerForm.pan_number.trim().toUpperCase()
    if (pan && !/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(pan)) {
      errs.pan_number = 'Invalid PAN format (e.g., ABCDE1234F)'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateInsurance = () => {
    const errs = {}
    const f = insuranceForm
    if (!f.insurance_type) errs.insurance_type = 'Select a type'
    if (!f.premium || isNaN(Number(f.premium)) || Number(f.premium) <= 0)
      errs.premium = 'Enter a valid premium'

    if (f.insurance_type === 'General') {
      if (!f.regn_no?.trim()) errs.regn_no = 'Registration number required'
      if (!f.make?.trim()) errs.make = 'Make is required'
      if (!f.model?.trim()) errs.model = 'Model is required'
    } else if (f.insurance_type === 'Health') {
      if (!f.proposer_name?.trim()) errs.proposer_name = 'Proposer name required'
      if (!f.sum_insured || isNaN(Number(f.sum_insured))) errs.sum_insured = 'Sum insured required'
      if (!f.policy_expiry) errs.policy_expiry = 'Policy expiry required'
    } else if (f.insurance_type === 'Life') {
      if (!f.policy_no?.trim()) errs.policy_no = 'Policy number required'
      if (!f.due_date) errs.due_date = 'Due date required'
    } else if (f.insurance_type === 'Personal Accident') {
      if (!f.policy_no?.trim()) errs.policy_no = 'Policy number required'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSelectCustomer = (cust) => {
    setSelectedCustomer(cust)
    setIsNewCustomer(false)
    setCustomerForm({
      ...emptyCustomer,
      name: cust.name || '',
      dob: cust.dob || '',
      sex: cust.sex || '',
      email: cust.email || '',
      phone: cust.phone || '',
      address: cust.address || '',
      pan_number: cust.pan_number || '',
      aadhar_number: cust.aadhar_number || '',
      pob: cust.pob || '',
      father_name: cust.father_name || '',
      mother_name: cust.mother_name || '',
      spouse_name: cust.spouse_name || '',
      nominee: cust.nominee || '',
      nominee_dob: cust.nominee_dob || '',
      nominee_pan: cust.nominee_pan || '',
      relation: cust.relation || '',
    })
    setErrors({})
  }

  const handleSubmitEditCustomer = async (e) => {
    e.preventDefault()
    if (!validateCustomer()) return
    setSubmitting(true)
    try {
      await update(mode.customer.id, {
        ...customerForm,
        name: customerForm.name.trim(),
        phone: customerForm.phone.trim() || null,
        address: customerForm.address.trim() || null,
      })
      onClose()
    } catch (err) {
      toast.error('Failed to update customer: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const buildPayload = () => {
    const f = insuranceForm
    let details = {}
    let expiry_date = null

    if (f.insurance_type === 'General') {
      details = {
        vehicle_type: f.vehicle_type || null,
        regn_no: f.regn_no?.trim() || null,
        make: f.make?.trim() || null,
        model: f.model?.trim() || null,
        mfg_year: f.mfg_year || null,
        cc: f.cc || null,
        gvw: f.gvw || null,
        regn_validity: f.regn_validity || null,
        od_expiry: f.od_expiry || null,
        tp_expiry: f.tp_expiry || null,
        cpa_expiry: f.cpa_expiry || null,
        comp_expiry: f.comp_expiry || null,
        idv: f.idv || null,
        nil_depreciation: f.nil_depreciation || 'No',
      }
      // expiry_date = earliest of the expiry dates
      const dates = [f.od_expiry, f.tp_expiry, f.cpa_expiry, f.comp_expiry].filter(Boolean)
      expiry_date = dates.length > 0 ? dates.sort()[0] : null
    } else if (f.insurance_type === 'Health') {
      details = {
        proposer_name: f.proposer_name?.trim() || null,
        prop_dob: f.prop_dob || null,
        family_size: f.family_size || null,
        scheme: f.scheme?.trim() || null,
        sum_insured: f.sum_insured || null,
      }
      expiry_date = f.policy_expiry || null
    } else if (f.insurance_type === 'Life') {
      details = {
        plan: f.plan?.trim() || null,
        sum_assured: f.sum_assured || null,
        term: f.term || null,
        ppt: f.ppt || null,
        mode: f.mode || null,
      }
      expiry_date = f.due_date || null
    } else if (f.insurance_type === 'Personal Accident') {
      details = {
        proposer_name: f.proposer_name?.trim() || null,
        prop_dob: f.prop_dob || null,
        policy_start: f.policy_start || null,
        sum_insured: f.sum_insured || null,
      }
      expiry_date = f.policy_expiry || null
    }

    return {
      insurance_type: f.insurance_type,
      policy_no: f.policy_no?.trim() || null,
      insurer: f.insurer?.trim() || null,
      premium: Number(f.premium) || 0,
      agency_code: f.agency_code?.trim() || null,
      expiry_date,
      details,
    }
  }

  const handleSubmitInsurance = async (e) => {
    e.preventDefault()
    if (!validateInsurance()) return
    setSubmitting(true)
    try {
      let customerId = selectedCustomer?.id

      if (isNewCustomer && !customerId) {
        const newCust = await add({
          ...customerForm,
          name: customerForm.name.trim(),
          phone: customerForm.phone.trim() || null,
          address: customerForm.address.trim() || null,
        })
        customerId = newCust.id
      }

      const payload = { customer_id: customerId, ...buildPayload() }

      if (mode?.type === 'editInsurance') {
        await updateInsurance(mode.insurance.id, payload)
      } else {
        await addInsurance(payload)
      }
      onClose()
    } catch (err) {
      toast.error('Operation failed: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const setIns = (key, value) => {
    setInsuranceForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const setCust = (key, value) => {
    setCustomerForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  if (!open) return null

  const isEdit = mode?.type === 'editInsurance'
  const isEditCustomer = mode?.type === 'editCustomer'
  const title = isEditCustomer
    ? 'Edit Customer'
    : isEdit
      ? 'Edit Insurance'
      : 'Issue New Policy'
  const subtitle = isEditCustomer
    ? 'Update customer information'
    : isEdit
      ? 'Update policy details'
      : 'Enter customer and policy details'

  const insuranceType = insuranceForm.insurance_type

  return (
    <div
      className={asModal ? "fixed inset-0 z-[100] flex flex-col bg-[var(--bg-secondary)]" : "flex flex-col bg-[var(--bg-secondary)] rounded-2xl overflow-hidden"}
      role="dialog"
      aria-modal={asModal ? "true" : undefined}
      aria-labelledby="form-title"
      data-testid="customer-form-dialog"
    >
      <div
        className="flex-1 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-8 py-4 border-b shrink-0"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-card)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-xl transition-all duration-200 hover:bg-[var(--hover-bg)]"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Back"
              data-testid="btn-form-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
              {isEditCustomer || isEdit
                ? <Save className="w-5 h-5 text-primary-600" aria-hidden="true" />
                : <UserPlus className="w-5 h-5 text-primary-600" aria-hidden="true" />
              }
            </div>
            <div>
              <h2 id="form-title" className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {title}
              </h2>
              <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Unified Form Mode */}
        {!isEditCustomer && (
          <div className="flex-1 overflow-y-auto animate-fade-in custom-scrollbar">
            {!mode && !selectionMade ? (
              <div className="h-full flex flex-col items-center justify-center p-8 lg:p-12 animate-fade-in">
                <div className="max-w-4xl w-full">
                  <div className="text-center mb-12">
                    <h3 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Welcome</h3>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Choose how you'd like to start this policy issuance</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Choice 1: Existing Customer */}
                    <button
                      type="button"
                      onClick={() => { setSelectionMade(true); setIsNewCustomer(false); }}
                      className="group relative flex flex-col items-center p-10 rounded-3xl border-2 bg-[var(--bg-card)] transition-all duration-300 hover:border-primary-500 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-2 text-center"
                      style={{ borderColor: 'var(--border-color)' }}
                      data-testid="btn-existing-customer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[22px]" />
                      <div className="w-20 h-20 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Search className="w-10 h-10 text-primary-600" />
                      </div>
                      <h4 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Existing Customer</h4>
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Search and issue a policy for someone already in your database</p>
                      <div className="mt-8 px-6 py-2 rounded-xl bg-primary-500 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                        Continue to Search
                      </div>
                    </button>

                    {/* Choice 2: New Customer */}
                    <button
                      type="button"
                      onClick={() => { setSelectionMade(true); setIsNewCustomer(true); setCustomerForm(emptyCustomer); }}
                      className="group relative flex flex-col items-center p-10 rounded-3xl border-2 bg-[var(--bg-card)] transition-all duration-300 hover:border-primary-500 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-2 text-center"
                      style={{ borderColor: 'var(--border-color)' }}
                      data-testid="btn-new-customer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[22px]" />
                      <div className="w-20 h-20 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <UserPlus className="w-10 h-10 text-primary-600" />
                      </div>
                      <h4 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>New Customer</h4>
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Register a new profile and issue their first policy immediately</p>
                      <div className="mt-8 px-6 py-2 rounded-xl bg-primary-500 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                        Start Fresh
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitInsurance} className="w-full p-8 lg:p-10 space-y-12 animate-slide-up" data-testid="insurance-form">
                {/* Back to selection link */}
                {!isEdit && !mode && (
                  <button
                    type="button"
                    onClick={() => setSelectionMade(false)}
                    className="flex items-center gap-2 text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to welcome screen
                  </button>
                )}

                {/* Search Section (Only for new insurance and when no customer selected) */}
                {!isEdit && !isNewCustomer && !selectedCustomer && (
                  <div className="h-full flex flex-col items-center justify-center py-20 animate-fade-in">
                    <div className="max-w-2xl w-full space-y-8">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-6">
                          <Search className="w-8 h-8 text-primary-600" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Find Existing Customer</h3>
                        <p className="text-sm font-semibold text-[var(--text-secondary)]">Search by name, phone number, or customer code</p>
                      </div>

                      <div
                        className="flex items-center gap-4 px-6 py-4 rounded-3xl border-2 transition-all duration-300 focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10"
                        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
                      >
                        <Search className="w-6 h-6 shrink-0" style={{ color: 'var(--text-secondary)' }} aria-hidden="true" />
                        <input
                          type="text"
                          placeholder="Type to search..."
                          value={customerSearch}
                          autoFocus
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="flex-1 bg-transparent text-lg font-semibold outline-none placeholder:text-[var(--text-muted)]"
                          style={{ color: 'var(--text-primary)' }}
                        />
                      </div>

                      {searchResults.length > 0 && (
                        <div className="grid grid-cols-1 gap-3 animate-fade-in">
                          {searchResults.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleSelectCustomer(c)}
                              className="group flex items-center gap-4 px-6 py-4 rounded-2xl border bg-[var(--bg-card)] transition-all hover:border-primary-500 hover:shadow-lg text-left"
                              style={{ borderColor: 'var(--border-color)' }}
                            >
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                                <p className="text-xs font-semibold opacity-70" style={{ color: 'var(--text-secondary)' }}>{c.phone || c.cust_code || 'No details'}</p>
                              </div>
                              <ArrowLeft className="w-4 h-4 rotate-180 text-[var(--text-muted)] group-hover:text-primary-600 transition-colors" />
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="pt-8 border-t text-center" style={{ borderColor: 'var(--border-color)' }}>
                        <button
                          type="button"
                          onClick={() => setSelectionMade(false)}
                          className="text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          Cancel and go back
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {(isNewCustomer || selectedCustomer || isEdit) && (
                  <>
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                      {/* Selected Customer Summary or Edit Form */}
                      <div className="xl:col-span-12 2xl:col-span-5 space-y-10 2xl:pr-12 2xl:border-r" style={{ borderColor: 'var(--border-color)' }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-primary-500/10 border border-primary-500/20">
                              <UserPlus className="w-6 h-6 text-primary-600" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                {selectedCustomer ? 'Customer Profile' : 'New Registration'}
                              </h3>
                              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)] opacity-80">
                                {selectedCustomer ? 'Issuing policy for selected record' : 'Enter profile details below'}
                              </p>
                            </div>
                          </div>
                          {!isEdit && !mode && (
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedCustomer) {
                                  setSelectedCustomer(null);
                                  setCustomerSearch('');
                                } else {
                                  setSelectionMade(false);
                                }
                              }}
                              className="text-xs font-bold text-primary-600 hover:text-primary-700"
                            >
                              Change
                            </button>
                          )}
                        </div>

                        {selectedCustomer && !isEditCustomer ? (
                          <div className="p-6 rounded-3xl bg-primary-500/5 border border-primary-500/10 space-y-6">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                {selectedCustomer.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{selectedCustomer.name}</h4>
                                <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{selectedCustomer.cust_code || 'ID: ' + selectedCustomer.id?.slice(0, 8)}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Phone</p>
                                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedCustomer.phone || '-'}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Email</p>
                                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedCustomer.email || '-'}</p>
                              </div>
                            </div>
                            <div className="pt-4 border-t border-primary-500/10">
                              <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1">Address</p>
                              <p className="text-xs font-semibold leading-relaxed" style={{ color: 'var(--text-primary)' }}>{selectedCustomer.address || '-'}</p>
                            </div>
                          </div>
                        ) : (
                          <CustomerFormSection form={isEditCustomer ? customerForm : customerForm} setForm={setCust} errors={errors} isStep1 />
                        )}
                      </div>

                      {/* Right Column: Policy Details */}
                      <div className="xl:col-span-12 2xl:col-span-7 space-y-12 animate-fade-in" style={{ animationDelay: '100ms' }}>
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                            <Save className="w-6 h-6 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Policy Specifics</h3>
                            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)] opacity-80">Insurance Coverage Parameters</p>
                          </div>
                        </div>

                        <div className="space-y-10">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                            <Field label="Insurance Type" required error={errors.insurance_type}>
                              <select
                                value={insuranceForm.insurance_type}
                                onChange={(e) => setIns('insurance_type', e.target.value)}
                                className={inputClass}
                                style={selectStyle(errors.insurance_type, !!insuranceForm.insurance_type)}
                                data-testid="select-insurance-type"
                              >
                                <option value="">Select Category...</option>
                                {INSURANCE_TYPES.map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </Field>
                            <Field label="Policy No.">
                              <input type="text" value={insuranceForm.policy_no} onChange={(e) => setIns('policy_no', e.target.value)}
                                className={inputClass} style={inputStyle(errors.policy_no)} placeholder="POL-XXX-XXX" data-testid="input-policy-no" />
                            </Field>
                            <Field label="Insurer / Carrier">
                              <input type="text" value={insuranceForm.insurer} onChange={(e) => setIns('insurer', e.target.value)}
                                className={inputClass} style={inputStyle()} placeholder="e.g. LIC, TATA AIG" />
                            </Field>
                            <Field label="Agency Code">
                              <input type="text" value={insuranceForm.agency_code} onChange={(e) => setIns('agency_code', e.target.value)}
                                className={inputClass} style={inputStyle()} placeholder="Code-001" />
                            </Field>
                            <Field label="Net Premium (₹)" required error={errors.premium}>
                              <input type="number" value={insuranceForm.premium} onChange={(e) => setIns('premium', e.target.value)}
                                className={inputClass} style={inputStyle(errors.premium)} placeholder="Amount in INR" data-testid="input-premium" />
                            </Field>
                          </div>
                        </div>

                        {/* Dynamically Rendered Domain-Specific Fields */}
                        {insuranceType === 'General' && (
                          <div className="space-y-8 p-8 rounded-3xl border bg-[var(--bg-input)] shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                              <Field label="Vehicle Type">
                                <select value={insuranceForm.vehicle_type} onChange={(e) => setIns('vehicle_type', e.target.value)}
                                  className={inputClass} style={selectStyle(false, !!insuranceForm.vehicle_type)}>
                                  <option value="">Select...</option>
                                  {GENERAL_SUBTYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </Field>
                              <Field label="Registration #" required error={errors.regn_no}>
                                <input type="text" value={insuranceForm.regn_no} onChange={(e) => setIns('regn_no', e.target.value.toUpperCase())}
                                  className={inputClass} style={inputStyle(errors.regn_no)} placeholder="DL01AA0001" />
                              </Field>
                              <Field label="Make" required error={errors.make}>
                                <input type="text" value={insuranceForm.make} onChange={(e) => setIns('make', e.target.value)}
                                  className={inputClass} style={inputStyle(errors.make)} placeholder="Manufacturer" />
                              </Field>
                              <Field label="Model" required error={errors.model}>
                                <input type="text" value={insuranceForm.model} onChange={(e) => setIns('model', e.target.value)}
                                  className={inputClass} style={inputStyle(errors.model)} placeholder="Vehicle Model" />
                              </Field>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                              <Field label="Mfg Year">
                                <input type="text" value={insuranceForm.mfg_year} onChange={(e) => setIns('mfg_year', e.target.value)}
                                  className={inputClass} style={inputStyle()} placeholder="YYYY" />
                              </Field>
                              <Field label="CC / Power">
                                <input type="text" value={insuranceForm.cc} onChange={(e) => setIns('cc', e.target.value)}
                                  className={inputClass} style={inputStyle()} placeholder="Cubic Capacity" />
                              </Field>
                              <Field label="GVW">
                                <input type="text" value={insuranceForm.gvw} onChange={(e) => setIns('gvw', e.target.value)}
                                  className={inputClass} style={inputStyle()} placeholder="In KG" />
                              </Field>
                              <Field label="IDV (Value)">
                                <input type="text" value={insuranceForm.idv} onChange={(e) => setIns('idv', e.target.value)}
                                  className={inputClass} style={inputStyle()} placeholder="Sum Insured" />
                              </Field>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                              <Field label="Reg. Validity">
                                <input type="date" value={insuranceForm.regn_validity} onChange={(e) => setIns('regn_validity', e.target.value)}
                                  className={inputClass} style={inputStyle()} />
                              </Field>
                              <Field label="OD Expiry">
                                <input type="date" value={insuranceForm.od_expiry} onChange={(e) => setIns('od_expiry', e.target.value)}
                                  className={inputClass} style={inputStyle()} />
                              </Field>
                              <Field label="TP Expiry">
                                <input type="date" value={insuranceForm.tp_expiry} onChange={(e) => setIns('tp_expiry', e.target.value)}
                                  className={inputClass} style={inputStyle()} />
                              </Field>
                              <Field label="CPA Expiry">
                                <input type="date" value={insuranceForm.cpa_expiry} onChange={(e) => setIns('cpa_expiry', e.target.value)}
                                  className={inputClass} style={inputStyle()} />
                              </Field>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                              <Field label="Comp Expiry">
                                <input type="date" value={insuranceForm.comp_expiry} onChange={(e) => setIns('comp_expiry', e.target.value)}
                                  className={inputClass} style={inputStyle()} />
                              </Field>
                              <Field label="Zero Dep?">
                                <select value={insuranceForm.nil_depreciation} onChange={(e) => setIns('nil_depreciation', e.target.value)}
                                  className={inputClass} style={selectStyle(false, true)}>
                                  <option value="No">No (Normal)</option>
                                  <option value="Yes">Yes (Nil Dep)</option>
                                </select>
                              </Field>
                            </div>
                          </div>
                        )}

                        {insuranceType === 'Health' && (
                          <div className="space-y-8 p-8 rounded-3xl border bg-[var(--bg-input)] shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                              <Field label="Proposer Name" required error={errors.proposer_name}>
                                <input type="text" value={insuranceForm.proposer_name} onChange={(e) => setIns('proposer_name', e.target.value)}
                                  className={inputClass} style={inputStyle(errors.proposer_name)} placeholder="Insured Person" />
                              </Field>
                              <Field label="Proposer DOB">
                                <input type="date" value={insuranceForm.prop_dob} onChange={(e) => setIns('prop_dob', e.target.value)}
                                  className={inputClass} style={inputStyle()} />
                              </Field>
                              <Field label="Family Coverage">
                                <input type="number" value={insuranceForm.family_size} onChange={(e) => setIns('family_size', e.target.value)}
                                  className={inputClass} style={inputStyle()} placeholder="Size" />
                              </Field>
                              <Field label="Plan Scheme">
                                <input type="text" value={insuranceForm.scheme} onChange={(e) => setIns('scheme', e.target.value)}
                                  className={inputClass} style={inputStyle()} placeholder="Silver/Gold" />
                              </Field>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Field label="Sum Insured (Floating)" required error={errors.sum_insured}>
                                <input type="number" value={insuranceForm.sum_insured} onChange={(e) => setIns('sum_insured', e.target.value)}
                                  className={inputClass} style={inputStyle(errors.sum_insured)} placeholder="Limit" />
                              </Field>
                              <Field label="Renewal Due / Expiry" required error={errors.policy_expiry}>
                                <input type="date" value={insuranceForm.policy_expiry} onChange={(e) => setIns('policy_expiry', e.target.value)}
                                  className={inputClass} style={inputStyle(errors.policy_expiry)} />
                              </Field>
                            </div>
                          </div>
                        )}

                        {insuranceType === 'Life' && (
                          <div className="space-y-8 p-8 rounded-3xl border bg-[var(--bg-input)] shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                              <Field label="Plan Name">
                                <input type="text" value={insuranceForm.plan} onChange={(e) => setIns('plan', e.target.value)}
                                  className={inputClass} style={inputStyle()} placeholder="Policy Plan" />
                              </Field>
                              <Field label="Sum Assured (₹)">
                                <input type="number" value={insuranceForm.sum_assured} onChange={(e) => setIns('sum_assured', e.target.value)}
                                  className={inputClass} style={inputStyle()} placeholder="Cover Amount" />
                              </Field>
                              <Field label="Term">
                                <input type="text" value={insuranceForm.term} onChange={(e) => setIns('term', e.target.value)}
                                  className={inputClass} style={inputStyle()} placeholder="Years" />
                              </Field>
                              <Field label="PPT (Pay Term)">
                                <input type="text" value={insuranceForm.ppt} onChange={(e) => setIns('ppt', e.target.value)}
                                  className={inputClass} style={inputStyle()} placeholder="Years" />
                              </Field>
                              <Field label="Payment Mode">
                                <select value={insuranceForm.mode} onChange={(e) => setIns('mode', e.target.value)}
                                  className={inputClass} style={selectStyle(false, !!insuranceForm.mode)}>
                                  <option value="">Select...</option>
                                  {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                                </select>
                              </Field>
                            </div>
                            <div className="w-full lg:w-1/3">
                              <Field label="Next Due Date" required error={errors.due_date}>
                                <input type="date" value={insuranceForm.due_date} onChange={(e) => setIns('due_date', e.target.value)}
                                  className={inputClass} style={inputStyle(errors.due_date)} />
                              </Field>
                            </div>
                          </div>
                        )}

                        {insuranceType === 'Personal Accident' && (
                          <div className="space-y-8 p-8 rounded-3xl border bg-[var(--bg-input)] shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              <Field label="Insured Name">
                                <input type="text" value={insuranceForm.proposer_name} onChange={(e) => setIns('proposer_name', e.target.value)}
                                  className={inputClass} style={inputStyle()} placeholder="Full Name" />
                              </Field>
                              <Field label="Insured DOB">
                                <input type="date" value={insuranceForm.prop_dob} onChange={(e) => setIns('prop_dob', e.target.value)}
                                  className={inputClass} style={inputStyle()} />
                              </Field>
                              <Field label="Sum Insured (₹)">
                                <input type="number" value={insuranceForm.sum_insured} onChange={(e) => setIns('sum_insured', e.target.value)}
                                  className={inputClass} style={inputStyle()} placeholder="Limit" />
                              </Field>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Field label="Policy Start Date">
                                <input type="date" value={insuranceForm.policy_start} onChange={(e) => setIns('policy_start', e.target.value)}
                                  className={inputClass} style={inputStyle()} />
                              </Field>
                              <Field label="Policy Expiry Date">
                                <input type="date" value={insuranceForm.policy_expiry} onChange={(e) => setIns('policy_expiry', e.target.value)}
                                  className={inputClass} style={inputStyle()} />
                              </Field>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-12 border-t flex flex-col md:flex-row items-center justify-end gap-5 max-w-[1920px] mx-auto pb-12" style={{ borderColor: 'var(--border-color)' }}>
                      <button
                        type="button"
                        onClick={onClose}
                        className="w-full md:w-64 px-8 py-4 rounded-2xl text-base font-bold border transition-all duration-300 hover:bg-[var(--hover-bg)] hover:shadow-lg active:scale-95"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                      >
                        Discard Changes
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full md:w-96 px-12 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 transition-all duration-300 shadow-2xl shadow-primary-500/25 flex items-center justify-center gap-3 active:scale-[0.98]"
                        data-testid="btn-submit-insurance"
                      >
                        {submitting ? (
                          <>
                            <span className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                            Saving and Issuing...
                          </>
                        ) : (
                          <>
                            <Save className="w-6 h-6" />
                            {isEdit ? 'Finalize Changes' : 'Record & Issue Policy'}
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        )}

        {isEditCustomer && (
          <div className="flex-1 overflow-y-auto p-12">
            <form onSubmit={handleSubmitEditCustomer} className="max-w-4xl mx-auto space-y-12">
              <CustomerFormSection form={customerForm} setForm={setCust} errors={errors} isStep1={false} />
              <div className="pt-12 border-t">
                <FormActions onClose={onClose} submitting={submitting} label="Update Profile" />
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

function FormActions({ onClose, submitting, label }) {
  return (
    <div className="flex gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
      <button
        type="button"
        onClick={onClose}
        className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold border transition-all duration-200 hover:bg-[var(--hover-bg)]"
        style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
        data-testid="btn-form-cancel"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 transition-all duration-200 shadow-md shadow-primary-500/25"
        data-testid="btn-form-submit"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
            Saving...
          </span>
        ) : label}
      </button>
    </div>
  )
}

function CustomerFormSection({ form, setForm, errors, isStep1 }) {
  const containerClass = isStep1
    ? "space-y-6"
    : "space-y-8"

  return (
    <div className={containerClass}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Field label="Full Name" required error={errors.name}>
            <input type="text" value={form.name} onChange={(e) => setForm('name', e.target.value)}
              className={inputClass} style={inputStyle(errors.name)} placeholder="e.g. Rajesh Kumar" data-testid="input-customer-name" />
          </Field>
        </div>
        <Field label="DOB">
          <input type="date" value={form.dob} onChange={(e) => setForm('dob', e.target.value)}
            className={inputClass} style={inputStyle()} />
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Sex">
          <select value={form.sex} onChange={(e) => setForm('sex', e.target.value)}
            className={inputClass} style={selectStyle(false, !!form.sex)}>
            <option value="">Select...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </Field>
        <Field label="Mobile Number" error={errors.phone}>
          <input type="text" value={form.phone} onChange={(e) => setForm('phone', e.target.value)}
            className={inputClass} style={inputStyle(errors.phone)} placeholder="9876543210" data-testid="input-customer-phone" />
        </Field>
        <Field label="Email Address">
          <input type="email" value={form.email} onChange={(e) => setForm('email', e.target.value)}
            className={inputClass} style={inputStyle()} placeholder="name@example.com" data-testid="input-customer-email" />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Place of Birth (POB)">
          <input type="text" value={form.pob} onChange={(e) => setForm('pob', e.target.value)}
            className={inputClass} style={inputStyle()} placeholder="City Name" />
        </Field>
        <Field label="PAN Number" error={errors.pan_number}>
          <input type="text" value={form.pan_number} onChange={(e) => setForm('pan_number', e.target.value.toUpperCase())}
            className={inputClass} style={inputStyle(errors.pan_number)} placeholder="ABCDE1234F" data-testid="input-customer-pan" />
        </Field>
        <Field label="Aadhar Number">
          <input type="text" value={form.aadhar_number} onChange={(e) => setForm('aadhar_number', e.target.value)}
            className={inputClass} style={inputStyle()} placeholder="1234 5678 9012" />
        </Field>
      </div>
      <Field label="Full Address">
        <textarea value={form.address} onChange={(e) => setForm('address', e.target.value)}
          className={`${inputClass} min-h-[80px]`} style={inputStyle()} placeholder="123, Street Name, Area, City" data-testid="input-customer-address" />
      </Field>



      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Father's Name">
          <input type="text" value={form.father_name} onChange={(e) => setForm('father_name', e.target.value)}
            className={inputClass} style={inputStyle()} placeholder="Full Name" />
        </Field>
        <Field label="Mother's Name">
          <input type="text" value={form.mother_name} onChange={(e) => setForm('mother_name', e.target.value)}
            className={inputClass} style={inputStyle()} placeholder="Full Name" />
        </Field>
        <Field label={form.sex === 'Male' ? "Wife's Name" : form.sex === 'Female' ? "Husband's Name" : "Spouse Name"}>
          <input type="text" value={form.spouse_name} onChange={(e) => setForm('spouse_name', e.target.value)}
            className={inputClass} style={inputStyle()} placeholder="Full Name" />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Field label="Nominee Name">
            <input type="text" value={form.nominee} onChange={(e) => setForm('nominee', e.target.value)}
              className={inputClass} style={inputStyle()} placeholder="Full Name" />
          </Field>
        </div>
        <Field label="Relation">
          <input type="text" value={form.relation} onChange={(e) => setForm('relation', e.target.value)}
            className={inputClass} style={inputStyle()} placeholder="e.g. Son, Wife" />
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Nominee DOB">
          <input type="date" value={form.nominee_dob} onChange={(e) => setForm('nominee_dob', e.target.value)}
            className={inputClass} style={inputStyle()} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Nominee PAN">
            <input type="text" value={form.nominee_pan} onChange={(e) => setForm('nominee_pan', e.target.value.toUpperCase())}
              className={inputClass} style={inputStyle()} placeholder="ABCDE1234F" />
          </Field>
        </div>
      </div>
    </div>
  )
}
