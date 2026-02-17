import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { List } from 'react-window'
import {
  Plus, Search, Edit2, Trash2, Eye, Filter, Users, FileText,
  ChevronUp, ChevronDown, ChevronRight, Clock, AlertTriangle, ShieldCheck,
} from 'lucide-react'
import { useCustomers } from '../context/CustomerContext'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import CustomerForm from '../components/CustomerForm'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import {
  INSURANCE_TYPES, getDaysUntilDeadline, getDeadlineStatus,
  formatDate, formatCurrency,
} from '../lib/constants'

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-10 w-48 rounded-xl" />
      <div className="skeleton h-14 rounded-xl" />
      <div className="skeleton h-96 rounded-2xl" />
    </div>
  )
}

const statusVars = {
  active: {
    bg: 'var(--status-active-bg)',
    text: 'var(--status-active-text)',
    dot: 'var(--status-active-dot)',
    row: 'transparent',
  },
  approaching: {
    bg: 'var(--status-approaching-bg)',
    text: 'var(--status-approaching-text)',
    dot: 'var(--status-approaching-dot)',
    row: 'var(--status-row-approaching)',
  },
  overdue: {
    bg: 'var(--status-overdue-bg)',
    text: 'var(--status-overdue-text)',
    dot: 'var(--status-overdue-dot)',
    row: 'var(--status-row-overdue)',
  },
}

export default function Customers() {
  const { customers, insurances, loading, remove, removeInsurance, getCustomerInsurances } = useCustomers()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState(null) // { type: 'addInsurance', customerId } | { type: 'editInsurance', insurance } | { type: 'editCustomer', customer } | null
  const [deleteTarget, setDeleteTarget] = useState(null) // { type: 'customer', item } | { type: 'insurance', item }
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [sortKey, setSortKey] = useState('name')
  const [sortAsc, setSortAsc] = useState(true)
  const [expanded, setExpanded] = useState({})

  // Sync from URL params (intentional: reads external URL state into component state)
  useEffect(() => {
    const q = searchParams.get('search')
    const s = searchParams.get('status')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q !== null) setSearch(q)
    if (s !== null) setStatusFilter(s)
    if (q !== null || s !== null) {
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Build enriched customer list with policy counts
  const enriched = useMemo(() => {
    return customers.map((c) => {
      const policies = getCustomerInsurances(c.id)
      const totalPremium = policies.reduce((sum, p) => sum + (Number(p.premium) || 0), 0)
      const policyCount = policies.length
      // Worst status across all policies
      let worstStatus = 'active'
      for (const p of policies) {
        const s = getDeadlineStatus(p.expiry_date)
        if (s === 'overdue') { worstStatus = 'overdue'; break }
        if (s === 'approaching') worstStatus = 'approaching'
      }
      return { ...c, policies, totalPremium, policyCount, worstStatus }
    })
  }, [customers, getCustomerInsurances])

  const filtered = useMemo(() => {
    let result = [...enriched]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((c) => {
        const matchesCustomer =
          c.name.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.address?.toLowerCase().includes(q) ||
          c.cust_code?.toLowerCase().includes(q) ||
          c.pan_number?.toLowerCase().includes(q) ||
          c.aadhar_number?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q)

        const matchesPolicies = c.policies.some((p) => {
          const details = p.details || {}
          return (
            p.policy_no?.toLowerCase().includes(q) ||
            p.insurer?.toLowerCase().includes(q) ||
            p.agency_code?.toLowerCase().includes(q) ||
            // Specialized details search
            Object.values(details).some(val =>
              val?.toString().toLowerCase().includes(q)
            )
          )
        })

        return matchesCustomer || matchesPolicies
      })
    }
    if (statusFilter) {
      result = result.filter((c) =>
        c.policies.some((p) => getDeadlineStatus(p.expiry_date) === statusFilter)
      )
    }
    result.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortKey === 'policies') cmp = a.policyCount - b.policyCount
      else if (sortKey === 'premium') cmp = a.totalPremium - b.totalPremium
      return sortAsc ? cmp : -cmp
    })
    return result
  }, [enriched, search, statusFilter, sortKey, sortAsc])

  const totalPremium = useMemo(
    () => filtered.reduce((sum, c) => sum + c.totalPremium, 0),
    [filtered]
  )

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc((a) => !a)
    else { setSortKey(key); setSortAsc(true) }
  }

  const toggleExpand = useCallback((id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] })), [])

  // Virtualization support
  const containerRef = useRef(null)
  const [listHeight, setListHeight] = useState(600)

  const ROW_HEIGHT = 56
  const POLICY_ROW_HEIGHT = 48

  const getItemSize = useCallback((index) => {
    const c = filtered[index]
    if (!expanded[c.id]) return ROW_HEIGHT
    if (c.policies.length === 0) return ROW_HEIGHT + POLICY_ROW_HEIGHT
    return ROW_HEIGHT + c.policies.length * POLICY_ROW_HEIGHT
  }, [filtered, expanded])

  // Calculate available height for virtual list
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setListHeight(Math.max(300, window.innerHeight - rect.top - 100))
      }
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [loading])

  const handleAddInsurance = useCallback((customerId) => {
    setFormMode({ type: 'addInsurance', customerId })
    setFormOpen(true)
  }, [])

  const handleEditInsurance = useCallback((insurance) => {
    setFormMode({ type: 'editInsurance', insurance })
    setFormOpen(true)
  }, [])

  const handleEditCustomer = useCallback((customer) => {
    setFormMode({ type: 'editCustomer', customer })
    setFormOpen(true)
  }, [])

  const handleNewCustomer = useCallback(() => {
    navigate('/customers/add')
  }, [navigate])

  const handleDelete = async () => {
    if (!deleteTarget) return
    if (deleteTarget.type === 'customer') {
      await remove(deleteTarget.item.id)
    } else {
      await removeInsurance(deleteTarget.item.id)
    }
    setDeleteTarget(null)
  }

  const exportPDF = () => {
    if (filtered.length === 0) return
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Customer Insurance Portfolio', 14, 22)
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 30)
    doc.text(`Total Premium: ${formatCurrency(totalPremium)}`, 14, 35)

    const tableColumn = ['Customer', 'Code', 'Insurance Type', 'Premium', 'Expiry', 'Status']
    const tableRows = []
    filtered.forEach((c) => {
      c.policies.forEach((p) => {
        const status = getDeadlineStatus(p.expiry_date)
        tableRows.push([
          c.name,
          c.cust_code || '-',
          p.insurance_type,
          formatCurrency(p.premium),
          formatDate(p.expiry_date),
          status,
        ])
      })
    })

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillStyle: '#10b981', textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
    })
    doc.save('customers_portfolio.pdf')
  }

  const SortIcon = ({ field }) => {
    if (sortKey !== field) return <ChevronUp className="w-3 h-3 inline ml-0.5 opacity-0 group-hover:opacity-40" />
    return sortAsc
      ? <ChevronUp className="w-3 h-3 inline ml-0.5 text-primary-600" />
      : <ChevronDown className="w-3 h-3 inline ml-0.5 text-primary-600" />
  }

  if (loading) return <LoadingSkeleton />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Customers</h1>
          <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
            {customers.length} customer{customers.length !== 1 ? 's' : ''} &middot; {insurances.length} polic{insurances.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 hover:bg-[var(--hover-bg)]"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            aria-label="Export customers to PDF"
          >
            <FileText className="w-4 h-4" aria-hidden="true" /> Download PDF
          </button>
          <button
            onClick={handleNewCustomer}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-md shadow-primary-500/25"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" /> Add Insurance
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div
          className="flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-200"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-input)' }}
        >
          <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by name, phone, code, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-[var(--text-muted)]"
            style={{ color: 'var(--text-primary)' }}
            aria-label="Search customers by name, phone, code, or address"
          />
        </div>
        <div className="flex items-center gap-2.5">
          <Filter className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all duration-200 min-w-[150px]"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
            aria-label="Filter by policy status"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="approaching">Approaching</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Desktop Table (Virtualized) */}
      <div
        ref={containerRef}
        className="rounded-2xl border overflow-hidden hidden sm:block"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {filtered.length === 0 ? (
          <EmptyState
            type={customers.length === 0 ? 'customers' : 'search'}
            title={customers.length === 0 ? 'No customers yet' : 'No results found'}
            description={customers.length === 0
              ? 'Click "Add Insurance" to add your first customer and policy.'
              : 'Try adjusting your search or filter.'}
          />
        ) : (
          <>
            {/* Grid Header */}
            <div
              className="grid text-xs font-bold uppercase tracking-wider"
              style={{
                gridTemplateColumns: '40px minmax(200px,2fr) minmax(100px,1fr) 100px 140px 110px 160px',
                borderBottom: '2px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              <div className="px-3 py-4" />
              {[
                { key: 'name', label: 'Customer' },
                { key: null, label: 'Phone' },
                { key: 'policies', label: 'Policies' },
                { key: 'premium', label: 'Total Premium' },
                { key: null, label: 'Status' },
                { key: null, label: '' },
              ].map(({ key, label }, i) => (
                <div
                  key={i}
                  className={`px-5 py-4 text-left group ${key ? 'cursor-pointer select-none' : ''}`}
                  onClick={key ? () => handleSort(key) : undefined}
                >
                  {label}
                  {key && <SortIcon field={key} />}
                </div>
              ))}
            </div>

            {/* Virtualized Rows */}
            <List
              style={{ height: listHeight, width: '100%' }}
              rowCount={filtered.length}
              rowHeight={getItemSize}
              overscanCount={5}
            >
              {({ index, style }) => (
                <VirtualRowWrapper
                  index={index}
                  style={style}
                  filtered={filtered}
                  expanded={expanded}
                  navigate={navigate}
                  toggleExpand={toggleExpand}
                  handleEditCustomer={handleEditCustomer}
                  setDeleteTarget={setDeleteTarget}
                  handleAddInsurance={handleAddInsurance}
                  handleEditInsurance={handleEditInsurance}
                />
              )}
            </List>
          </>
        )}

        {filtered.length > 0 && (
          <div
            className="px-5 py-3 border-t flex items-center justify-between"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Showing {filtered.length} of {customers.length} customer{customers.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              Total Premium: {formatCurrency(totalPremium)}
            </p>
          </div>
        )}
      </div>

      {/* Mobile Card Layout */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 ? (
          <div
            className="rounded-2xl border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <EmptyState
              type={customers.length === 0 ? 'customers' : 'search'}
              title={customers.length === 0 ? 'No customers yet' : 'No results found'}
              description={customers.length === 0
                ? 'Tap "Add Insurance" to get started.'
                : 'Try adjusting your search or filter.'}
            />
          </div>
        ) : (
          <>
            {filtered.map((c) => (
              <MobileCustomerCard
                key={c.id}
                customer={c}
                expanded={expanded[c.id]}
                onToggle={() => toggleExpand(c.id)}
                onView={() => navigate(`/customer/${c.id}`)}
                onEditCustomer={() => handleEditCustomer(c)}
                onDeleteCustomer={() => setDeleteTarget({ type: 'customer', item: c })}
                onAddPolicy={() => handleAddInsurance(c.id)}
                onEditPolicy={handleEditInsurance}
                onDeletePolicy={(p) => setDeleteTarget({ type: 'insurance', item: p })}
              />
            ))}
            <div
              className="rounded-2xl border px-4 py-3 flex items-center justify-between"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                Total: {formatCurrency(totalPremium)}
              </p>
            </div>
          </>
        )}
      </div>

      <CustomerForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setFormMode(null) }}
        mode={formMode}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget?.type === 'customer' ? 'Delete Customer' : 'Delete Insurance'}
        message={deleteTarget?.type === 'customer'
          ? `Are you sure you want to delete "${deleteTarget?.item?.name}"? All their insurance policies will also be deleted.`
          : `Are you sure you want to delete this ${deleteTarget?.item?.insurance_type || 'insurance'} policy? This action cannot be undone.`
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// ─── Grid column template (shared between header and virtual rows) ───
const GRID_COLS = '40px minmax(200px,2fr) minmax(100px,1fr) 100px 140px 110px 160px'

// ─── Virtual row wrapper for react-window v2 ──────────────────
// react-window v2 passes: { ...rowProps, index, style, ariaAttributes }
const VirtualRowWrapper = React.memo(function VirtualRowWrapper({
  index, style,
  filtered, expanded, navigate, toggleExpand,
  handleEditCustomer, setDeleteTarget, handleAddInsurance, handleEditInsurance,
}) {
  const c = filtered[index]
  if (!c) return null
  return (
    <div style={style}>
      <VirtualCustomerRow
        customer={c}
        isExpanded={expanded[c.id]}
        isEven={index % 2 === 0}
        onToggle={() => toggleExpand(c.id)}
        onView={() => navigate(`/customer/${c.id}`)}
        onEditCustomer={() => handleEditCustomer(c)}
        onDeleteCustomer={() => setDeleteTarget({ type: 'customer', item: c })}
        onAddPolicy={() => handleAddInsurance(c.id)}
        onEditPolicy={handleEditInsurance}
        onDeletePolicy={(p) => setDeleteTarget({ type: 'insurance', item: p })}
      />
    </div>
  )
})

// ─── Virtualized desktop customer row (div-based grid) ───────────

const VirtualCustomerRow = React.memo(function VirtualCustomerRow({
  customer: c, isExpanded, isEven, onToggle,
  onView, onEditCustomer, onDeleteCustomer, onAddPolicy,
  onEditPolicy, onDeletePolicy,
}) {
  const sv = statusVars[c.worstStatus]

  return (
    <div>
      {/* Main customer row */}
      <div
        className="grid items-center text-sm border-t transition-colors duration-150 hover:bg-[var(--hover-bg)] cursor-pointer"
        style={{
          gridTemplateColumns: GRID_COLS,
          borderColor: 'var(--border-color)',
          backgroundColor: isEven ? 'transparent' : 'var(--bg-input)',
          height: 56,
        }}
        onClick={onView}
      >
        <div
          className="px-3 flex items-center justify-center cursor-pointer hover:bg-primary-500/5 transition-colors h-full"
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          title={isExpanded ? 'Collapse' : 'Expand details'}
        >
          <ChevronRight
            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            style={{ color: 'var(--text-muted)' }}
          />
        </div>
        <div className="px-5 flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
            {c.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
            <p className="text-[11px] font-medium mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
              {c.cust_code}{c.address ? ` \u00B7 ${c.address}` : ''}
            </p>
          </div>
        </div>
        <div className="px-5 text-sm font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
          {c.phone || '-'}
        </div>
        <div className="px-5">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
            {c.policyCount} polic{c.policyCount !== 1 ? 'ies' : 'y'}
          </span>
        </div>
        <div className="px-5 font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
          {formatCurrency(c.totalPremium)}
        </div>
        <div className="px-5">
          {c.policyCount > 0 ? (
            <span
              className="text-[11px] px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1"
              style={{ backgroundColor: sv.bg, color: sv.text }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sv.dot }} />
              {c.worstStatus}
            </span>
          ) : (
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>No policies</span>
          )}
        </div>
        <div className="px-5">
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={onView} className="p-2 rounded-lg transition-all duration-200 hover:bg-primary-500/10 hover:text-primary-600" style={{ color: 'var(--text-muted)' }} aria-label={`View ${c.name} details`}>
              <Eye className="w-4 h-4" aria-hidden="true" />
            </button>
            <button onClick={() => onAddPolicy()} className="p-2 rounded-lg transition-all duration-200 hover:bg-primary-500/10 hover:text-primary-600" style={{ color: 'var(--text-muted)' }} aria-label={`Add policy for ${c.name}`}>
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>
            <button onClick={onEditCustomer} className="p-2 rounded-lg transition-all duration-200 hover:bg-primary-500/10 hover:text-primary-600" style={{ color: 'var(--text-muted)' }} aria-label={`Edit ${c.name}`}>
              <Edit2 className="w-4 h-4" aria-hidden="true" />
            </button>
            <button onClick={onDeleteCustomer} className="p-2 rounded-lg transition-all duration-200 hover:bg-red-500/10 hover:text-red-500" style={{ color: 'var(--text-muted)' }} aria-label={`Delete ${c.name}`}>
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded policy sub-rows */}
      {isExpanded && c.policies.length > 0 && c.policies.map((p) => {
        const days = getDaysUntilDeadline(p.expiry_date)
        const status = getDeadlineStatus(p.expiry_date)
        const psv = statusVars[status]
        return (
          <div
            key={p.id}
            className="grid items-center text-sm border-t"
            style={{
              gridTemplateColumns: GRID_COLS,
              borderColor: 'var(--border-color)',
              backgroundColor: psv.row !== 'transparent' ? psv.row : 'var(--bg-input)',
              height: 48,
            }}
          >
            <div className="px-3" />
            <div className="px-5 col-span-2 overflow-hidden">
              <div className="flex flex-col pl-6">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: psv.dot }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{p.insurance_type}</span>
                  {p.policy_no && <span className="text-[10px] font-bold text-[var(--text-muted)]">#{p.policy_no}</span>}
                </div>
                {(() => {
                  const details = p.details || {}
                  let snippet = []
                  if (p.insurance_type === 'General') {
                    if (details.regn_no) snippet.push(details.regn_no)
                    if (details.make) snippet.push(`${details.make} ${details.model || ''}`)
                  } else if (p.insurance_type === 'Health') {
                    if (details.scheme) snippet.push(details.scheme)
                    if (details.proposer_name) snippet.push(`Prop: ${details.proposer_name}`)
                  } else if (p.insurance_type === 'Life') {
                    if (details.plan) snippet.push(details.plan)
                    if (details.sum_assured) snippet.push(`Assured: ${formatCurrency(details.sum_assured)}`)
                  } else if (p.insurance_type === 'Personal Accident') {
                    if (details.proposer_name) snippet.push(details.proposer_name)
                    if (details.sum_insured) snippet.push(`Limit: ${formatCurrency(details.sum_insured)}`)
                  }
                  if (snippet.length === 0) return null
                  return (
                    <p className="text-[10px] font-medium mt-0.5 text-[var(--text-muted)] truncate ml-3.5">{snippet.join(' \u00B7 ')}</p>
                  )
                })()}
              </div>
            </div>
            <div className="px-5 font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{formatCurrency(p.premium)}</div>
            <div className="px-5 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{formatDate(p.expiry_date)}</div>
            <div className="px-5">
              <span className="text-[11px] px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1" style={{ backgroundColor: psv.bg, color: psv.text }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: psv.dot }} />
                {status === 'overdue' ? `${Math.abs(days)}d overdue` : `${days}d left`}
              </span>
            </div>
            <div className="px-5">
              <div className="flex gap-1">
                <button onClick={() => onEditPolicy(p)} className="p-2 rounded-lg transition-all duration-200 hover:bg-primary-500/10 hover:text-primary-600" style={{ color: 'var(--text-muted)' }} aria-label="Edit policy">
                  <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button onClick={() => onDeletePolicy(p)} className="p-2 rounded-lg transition-all duration-200 hover:bg-red-500/10 hover:text-red-500" style={{ color: 'var(--text-muted)' }} aria-label="Delete policy">
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        )
      })}

      {isExpanded && c.policies.length === 0 && (
        <div
          className="border-t text-center flex items-center justify-center"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-input)', height: 48 }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            No policies yet.{' '}
            <button onClick={() => onAddPolicy()} className="text-primary-600 hover:text-primary-700 font-semibold">Add one</button>
          </p>
        </div>
      )}
    </div>
  )
})

// ─── Mobile customer card ────────────────────────────────────

const MobileCustomerCard = React.memo(function MobileCustomerCard({
  customer: c, expanded: isExpanded, onToggle,
  onView, onEditCustomer, onDeleteCustomer, onAddPolicy,
  onEditPolicy, onDeletePolicy,
}) {
  const sv = statusVars[c.worstStatus]

  return (
    <div
      className="rounded-2xl border transition-all duration-200"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="p-4" onClick={onToggle}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {c.cust_code} &middot; {c.phone || 'No phone'} &middot; {c.policyCount} polic{c.policyCount !== 1 ? 'ies' : 'y'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {c.policyCount > 0 && (
              <span
                className="text-[11px] px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1 shrink-0"
                style={{ backgroundColor: sv.bg, color: sv.text }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sv.dot }} />
                {c.worstStatus}
              </span>
            )}
            <ChevronRight
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              style={{ color: 'var(--text-muted)' }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(c.totalPremium)}
          </p>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={onView} className="p-2.5 rounded-xl transition-all duration-200 hover:bg-primary-500/10 hover:text-primary-600" style={{ color: 'var(--text-muted)' }} aria-label={`View ${c.name}`}>
              <Eye className="w-4 h-4" aria-hidden="true" />
            </button>
            <button onClick={onEditCustomer} className="p-2.5 rounded-xl transition-all duration-200 hover:bg-primary-500/10 hover:text-primary-600" style={{ color: 'var(--text-muted)' }} aria-label={`Edit ${c.name}`}>
              <Edit2 className="w-4 h-4" aria-hidden="true" />
            </button>
            <button onClick={onDeleteCustomer} className="p-2.5 rounded-xl transition-all duration-200 hover:bg-red-500/10 hover:text-red-500" style={{ color: 'var(--text-muted)' }} aria-label={`Delete ${c.name}`}>
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded policies */}
      {isExpanded && (
        <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: 'var(--border-color)' }}>
          {c.policies.length === 0 ? (
            <p className="text-xs font-medium text-center py-2" style={{ color: 'var(--text-muted)' }}>
              No policies.{' '}
              <button onClick={() => onAddPolicy()} className="text-primary-600 font-semibold">Add one</button>
            </p>
          ) : c.policies.map((p) => {
            const days = getDaysUntilDeadline(p.expiry_date)
            const status = getDeadlineStatus(p.expiry_date)
            const psv = statusVars[status]
            return (
              <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border-color)' }}>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{p.insurance_type}</p>
                  <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    {formatCurrency(p.premium)} &middot; {formatDate(p.expiry_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                    style={{ backgroundColor: psv.bg, color: psv.text }}
                  >
                    {status === 'overdue' ? `${Math.abs(days)}d late` : `${days}d`}
                  </span>
                  <button onClick={() => onEditPolicy(p)} className="p-1.5 rounded-lg hover:bg-primary-500/10" style={{ color: 'var(--text-muted)' }} aria-label="Edit policy">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDeletePolicy(p)} className="p-1.5 rounded-lg hover:bg-red-500/10" style={{ color: 'var(--text-muted)' }} aria-label="Delete policy">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
          <button
            onClick={() => onAddPolicy()}
            className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-primary-600 hover:bg-primary-500/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Policy
          </button>
        </div>
      )}
    </div>
  )
})
