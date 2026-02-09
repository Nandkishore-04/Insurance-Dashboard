import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Plus, Search, Edit2, Trash2, Eye, Filter, Users, FileText, ChevronUp, ChevronDown, Clock, AlertTriangle, ShieldCheck,
} from 'lucide-react'
import { useCustomers } from '../context/CustomerContext'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import CustomerForm from '../components/CustomerForm'
import ConfirmDialog from '../components/ConfirmDialog'
import CustomerDetail from '../components/CustomerDetail'
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
  const { customers, loading, remove } = useCustomers()
  const [searchParams, setSearchParams] = useSearchParams()
  const [formOpen, setFormOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewTarget, setViewTarget] = useState(null)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [sortKey, setSortKey] = useState('deadline')
  const [sortAsc, setSortAsc] = useState(true)

  // Sync from navbar search or dashboard status (URL params)
  useEffect(() => {
    const q = searchParams.get('search')
    const s = searchParams.get('status')
    if (q !== null) setSearch(q)
    if (s !== null) setStatusFilter(s)

    if (q !== null || s !== null) {
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const filtered = useMemo(() => {
    let result = [...customers]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.address?.toLowerCase().includes(q)
      )
    }
    if (typeFilter) {
      result = result.filter((c) => c.insurance_type === typeFilter)
    }
    if (statusFilter) {
      result = result.filter((c) => getDeadlineStatus(c.deadline) === statusFilter)
    }
    result.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'deadline') cmp = new Date(a.deadline) - new Date(b.deadline)
      else if (sortKey === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortKey === 'amount') cmp = a.amount - b.amount
      else if (sortKey === 'created_at') cmp = new Date(a.created_at) - new Date(b.created_at)
      return sortAsc ? cmp : -cmp
    })
    return result
  }, [customers, search, typeFilter, sortKey, sortAsc])

  const totalPremium = useMemo(
    () => filtered.reduce((sum, c) => sum + (Number(c.amount) || 0), 0),
    [filtered]
  )

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc((a) => !a)
    else { setSortKey(key); setSortAsc(true) }
  }

  const handleEdit = (customer) => { setEditData(customer); setFormOpen(true) }
  const handleAdd = () => { setEditData(null); setFormOpen(true) }
  const handleDelete = async () => {
    if (deleteTarget) { await remove(deleteTarget.id); setDeleteTarget(null) }
  }

  const exportPDF = () => {
    if (filtered.length === 0) return
    const doc = new jsPDF()

    // Header
    doc.setFontSize(18)
    doc.text('Customer Insurance Portfolio', 14, 22)
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 30)
    doc.text(`Total Premium: ${formatCurrency(totalPremium)}`, 14, 35)

    const tableColumn = ['Name', 'Insurance Type', 'Amount', 'Issued On', 'Deadline']
    const tableRows = filtered.map((c) => [
      c.name,
      c.insurance_type.replace(' Insurance', ''),
      formatCurrency(c.amount),
      formatDate(c.issued_on),
      formatDate(c.deadline),
    ])

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

  const StatusIcon = ({ status }) => {
    if (status === 'overdue') return <AlertTriangle className="w-3 h-3" />
    if (status === 'approaching') return <Clock className="w-3 h-3" />
    return <ShieldCheck className="w-3 h-3" />
  }

  if (loading) return <LoadingSkeleton />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Customers</h1>
          <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
            {customers.length} total customer{customers.length !== 1 ? 's' : ''} in your portfolio
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
            onClick={handleAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-md shadow-primary-500/25"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" /> Add Customer
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
            placeholder="Search by name or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-[var(--text-muted)]"
            style={{ color: 'var(--text-primary)' }}
            aria-label="Search customers by name or address"
          />
        </div>
        <div className="flex items-center gap-2.5">
          <Filter className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all duration-200"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
            aria-label="Filter by insurance type"
          >
            <option value="">All Types</option>
            {INSURANCE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusIcon status={statusFilter || 'active'} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all duration-200"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="approaching">Approaching</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div
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
              ? 'Click "Add Customer" to add your first customer.'
              : 'Try adjusting your search or filter.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  {[
                    { key: 'name', label: 'Customer' },
                    { key: null, label: 'Type' },
                    { key: 'amount', label: 'Premium' },
                    { key: 'deadline', label: 'Deadline' },
                    { key: null, label: 'Status' },
                    { key: null, label: '' },
                  ].map(({ key, label }, i) => (
                    <th
                      key={i}
                      className={`px-5 py-4 text-left text-xs font-bold uppercase tracking-wider group ${key ? 'cursor-pointer select-none' : ''}`}
                      style={{ color: 'var(--text-muted)' }}
                      onClick={key ? () => handleSort(key) : undefined}
                    >
                      {label}
                      {key && <SortIcon field={key} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => {
                  const days = getDaysUntilDeadline(c.deadline)
                  const status = getDeadlineStatus(c.deadline)
                  const sv = statusVars[status]
                  const isEven = idx % 2 === 0

                  return (
                    <tr
                      key={c.id}
                      className="border-t transition-colors duration-150 hover:bg-[var(--hover-bg)]"
                      style={{
                        borderColor: 'var(--border-color)',
                        backgroundColor: sv.row !== 'transparent' ? sv.row : isEven ? 'transparent' : 'var(--bg-input)',
                      }}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                            {c.address && (
                              <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.address}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                          {c.insurance_type.replace(' Insurance', '')}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(c.amount)}
                      </td>
                      <td className="px-5 py-4 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(c.deadline)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="text-[11px] px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1"
                          style={{
                            backgroundColor: sv.bg,
                            color: sv.text,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: sv.dot }}
                          />
                          {status === 'overdue' ? `${Math.abs(days)}d overdue` : `${days}d left`}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setViewTarget(c)}
                            className="p-2 rounded-lg transition-all duration-200 hover:bg-primary-500/10 hover:text-primary-600"
                            style={{ color: 'var(--text-muted)' }}
                            aria-label={`View ${c.name} details`}
                          >
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => handleEdit(c)}
                            className="p-2 rounded-lg transition-all duration-200 hover:bg-primary-500/10 hover:text-primary-600"
                            style={{ color: 'var(--text-muted)' }}
                            aria-label={`Edit ${c.name}`}
                          >
                            <Edit2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            className="p-2 rounded-lg transition-all duration-200 hover:bg-red-500/10 hover:text-red-500"
                            style={{ color: 'var(--text-muted)' }}
                            aria-label={`Delete ${c.name}`}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table footer with total premium */}
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
                ? 'Tap "Add Customer" to get started.'
                : 'Try adjusting your search or filter.'}
            />
          </div>
        ) : (
          <>
            {filtered.map((c) => {
              const days = getDaysUntilDeadline(c.deadline)
              const status = getDeadlineStatus(c.deadline)
              const sv = statusVars[status]

              return (
                <div
                  key={c.id}
                  className="rounded-2xl border p-4 transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-color)',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                        <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {c.insurance_type.replace(' Insurance', '')}
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-[11px] px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1 shrink-0"
                      style={{ backgroundColor: sv.bg, color: sv.text }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sv.dot }} />
                      {status === 'overdue' ? `${Math.abs(days)}d overdue` : `${days}d left`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(c.amount)}</p>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Due {formatDate(c.deadline)}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setViewTarget(c)}
                        className="p-2.5 rounded-xl transition-all duration-200 hover:bg-primary-500/10 hover:text-primary-600"
                        style={{ color: 'var(--text-muted)' }}
                        aria-label={`View ${c.name} details`}
                      >
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleEdit(c)}
                        className="p-2.5 rounded-xl transition-all duration-200 hover:bg-primary-500/10 hover:text-primary-600"
                        style={{ color: 'var(--text-muted)' }}
                        aria-label={`Edit ${c.name}`}
                      >
                        <Edit2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(c)}
                        className="p-2.5 rounded-xl transition-all duration-200 hover:bg-red-500/10 hover:text-red-500"
                        style={{ color: 'var(--text-muted)' }}
                        aria-label={`Delete ${c.name}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Mobile footer */}
            <div
              className="rounded-2xl border px-4 py-3 flex items-center justify-between"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
              }}
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

      <CustomerDetail
        customer={viewTarget}
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={(c) => { setEditData(c); setFormOpen(true) }}
        onDelete={(c) => setDeleteTarget(c)}
      />
      <CustomerForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditData(null) }}
        editData={editData}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
