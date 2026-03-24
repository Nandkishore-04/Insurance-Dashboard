import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft, MapPin, Phone, IndianRupee, Edit2, Trash2, Plus,
    ShieldCheck, Clock, AlertTriangle, ExternalLink, Mail, CreditCard
} from 'lucide-react'
import { useCustomers } from '../context/CustomerContext'
import {
    getDaysUntilDeadline, getDeadlineStatus, formatDate,
    formatCurrency, getAnnualPremium, INSURANCE_COLORS
} from '../lib/constants'
import { useState, useMemo } from 'react'
import CustomerForm from '../components/CustomerForm'
import ConfirmDialog from '../components/ConfirmDialog'

const statusVars = {
    active: {
        bg: 'var(--status-active-bg)',
        text: 'var(--status-active-text)',
        dot: 'var(--status-active-dot)',
        border: 'rgba(16, 185, 129, 0.1)',
    },
    approaching: {
        bg: 'var(--status-approaching-bg)',
        text: 'var(--status-approaching-text)',
        dot: 'var(--status-approaching-dot)',
        border: 'rgba(245, 158, 11, 0.1)',
    },
    overdue: {
        bg: 'var(--status-overdue-bg)',
        text: 'var(--status-overdue-text)',
        dot: 'var(--status-overdue-dot)',
        border: 'rgba(239, 68, 68, 0.1)',
    },
}

export default function CustomerProfile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { customers, getCustomerInsurances, remove, removeInsurance } = useCustomers()

    const [formOpen, setFormOpen] = useState(false)
    const [formMode, setFormMode] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)

    const customer = customers.find(c => c.id === id)
    const policies = useMemo(() => customer ? getCustomerInsurances(customer.id) : [], [customer, getCustomerInsurances])
    const totalPremium = policies.reduce((sum, p) => sum + getAnnualPremium(p), 0)

    if (!customer) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold mb-2">Customer Not Found</h2>
                <p className="text-sm text-[var(--text-muted)] mb-6">The customer you are looking for does not exist or has been removed.</p>
                <button
                    onClick={() => navigate('/customers')}
                    className="px-6 py-2.5 rounded-xl bg-[var(--bg-input)] font-semibold text-sm hover:bg-[var(--hover-bg)] transition-colors"
                >
                    Back to Customers
                </button>
            </div>
        )
    }

    const handleAddPolicy = () => {
        setFormMode({ type: 'addInsurance', customerId: customer.id })
        setFormOpen(true)
    }

    const handleEditPolicy = (p) => {
        setFormMode({ type: 'editInsurance', insurance: p })
        setFormOpen(true)
    }

    const handleDeletePolicy = (p) => {
        setDeleteTarget({ type: 'insurance', item: p })
    }

    const handleDeleteCustomer = () => {
        setDeleteTarget({ type: 'customer', item: customer })
    }

    const confirmDelete = async () => {
        if (!deleteTarget) return
        if (deleteTarget.type === 'customer') {
            await remove(deleteTarget.item.id)
            navigate('/customers')
        } else {
            await removeInsurance(deleteTarget.item.id)
        }
        setDeleteTarget(null)
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/customers')}
                    className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-semibold"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Customers
                </button>

                <div className="flex gap-3">
                    <button
                        onClick={() => { setFormMode({ type: 'editCustomer', customer }); setFormOpen(true); }}
                        className="p-2.5 rounded-xl border border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition-all text-[var(--text-secondary)]"
                        title="Edit Customer"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleDeleteCustomer}
                        className="p-2.5 rounded-xl border border-[var(--border-color)] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all text-[var(--text-secondary)]"
                        title="Delete Customer"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Customer Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div
                        className="p-8 rounded-3xl border bg-[var(--bg-card)] shadow-[var(--shadow-card)] sticky top-6"
                        style={{ borderColor: 'var(--border-color)' }}
                    >
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-4xl font-bold shadow-2xl shadow-primary-500/40 mb-5 ring-4 ring-white dark:ring-primary-900/20">
                                {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                                {customer.name}
                            </h1>
                            {customer.cust_code && (
                                <div className="mt-2 px-3 py-1 rounded-full bg-[var(--bg-input)] text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">
                                    {customer.cust_code}
                                </div>
                            )}
                        </div>

                        <div className="space-y-8 pt-6 border-t border-[var(--border-color)]">
                            {/* Personal Details */}
                            <div className="space-y-3">
                                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Personal Information
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-bold uppercase text-[var(--text-muted)]">DOB</p>
                                        <p className="text-sm font-semibold text-[var(--text-primary)]">{formatDate(customer.dob) || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-bold uppercase text-[var(--text-muted)]">Sex</p>
                                        <p className="text-sm font-semibold text-[var(--text-primary)]">{customer.sex || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-bold uppercase text-[var(--text-muted)]">PAN Number</p>
                                        <p className="text-sm font-semibold text-[var(--text-primary)]">{customer.pan_number || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-bold uppercase text-[var(--text-muted)]">Aadhar Number</p>
                                        <p className="text-sm font-semibold text-[var(--text-primary)]">{customer.aadhar_number || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-3">
                                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5" /> Contact & Residence
                                </p>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
                                            <Phone className="w-3.5 h-3.5 text-primary-600" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold uppercase text-[var(--text-muted)] mb-0.5">Mobile</p>
                                            <p className="text-sm font-semibold text-[var(--text-primary)]">{customer.phone || 'Not available'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
                                            <Mail className="w-3.5 h-3.5 text-primary-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold uppercase text-[var(--text-muted)] mb-0.5">Email</p>
                                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{customer.email || 'Not available'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
                                            <MapPin className="w-3.5 h-3.5 text-primary-600" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold uppercase text-[var(--text-muted)] mb-0.5">Place of Birth (POB)</p>
                                            <p className="text-sm font-semibold text-[var(--text-primary)]">{customer.pob || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
                                            <MapPin className="w-3.5 h-3.5 text-primary-600" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold uppercase text-[var(--text-muted)] mb-0.5">Address</p>
                                            <p className="text-sm font-semibold text-[var(--text-primary)] leading-relaxed">{customer.address || 'Not available'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Family Details */}
                            <div className="space-y-3">
                                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Family Information
                                </p>
                                <div className="grid grid-cols-1 gap-3 px-2">
                                    <div className="flex justify-between border-b border-[var(--border-color)] pb-2">
                                        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Father</span>
                                        <span className="text-sm font-semibold text-[var(--text-primary)]">{customer.father_name || '-'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-[var(--border-color)] pb-2">
                                        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Mother</span>
                                        <span className="text-sm font-semibold text-[var(--text-primary)]">{customer.mother_name || '-'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-[var(--border-color)] pb-2">
                                        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Spouse</span>
                                        <span className="text-sm font-semibold text-[var(--text-primary)]">{customer.spouse_name || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Nominee Details */}
                            <div className="p-4 rounded-2xl bg-[var(--bg-input)] space-y-3 border border-[var(--border-color)]">
                                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-primary-600" /> Nominee Details
                                </p>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Name</span>
                                        <span className="text-sm font-bold text-[var(--text-primary)]">{customer.nominee || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Relation</span>
                                        <span className="text-sm font-bold text-[var(--text-primary)]">{customer.relation || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase">DOB</span>
                                        <span className="text-sm font-bold text-[var(--text-primary)]">{formatDate(customer.nominee_dob) || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase">PAN</span>
                                        <span className="text-sm font-bold text-[var(--text-primary)]">{customer.nominee_pan || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl bg-gradient-to-br from-primary-500/5 to-primary-600/[0.02] border border-primary-500/10">
                                <p className="text-xs font-bold uppercase tracking-wider text-primary-600 mb-2">Total Managed Premium</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-[var(--text-primary)]">{formatCurrency(totalPremium)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Policies List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                            Policies List
                            <span className="px-2.5 py-0.5 rounded-full bg-[var(--bg-input)] text-xs font-bold text-[var(--text-muted)]">
                                {policies.length}
                            </span>
                        </h2>
                        <button
                            onClick={handleAddPolicy}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/25"
                        >
                            <Plus className="w-4 h-4" strokeWidth={2.5} />
                            Add New Policy
                        </button>
                    </div>

                    {policies.length === 0 ? (
                        <div className="p-12 text-center rounded-3xl border border-dashed border-[var(--border-color)] bg-[var(--bg-input)]/50">
                            <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck className="w-8 h-8 text-primary-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-1">No Active Policies</h3>
                            <p className="text-sm text-[var(--text-muted)] mb-6">This customer doesn't have any insurance policies listed yet.</p>
                            <button
                                onClick={handleAddPolicy}
                                className="px-6 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition-all"
                            >
                                Add First Policy
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {policies.map((p) => {
                                const days = getDaysUntilDeadline(p.expiry_date)
                                const status = getDeadlineStatus(p.expiry_date)
                                const sv = statusVars[status]
                                const typeColor = INSURANCE_COLORS[p.insurance_type] || '#6366f1'
                                const details = p.details || {}

                                return (
                                    <div
                                        key={p.id}
                                        className="group p-6 rounded-3xl border bg-[var(--bg-card)] shadow-[var(--shadow-card)] hover:shadow-xl transition-all relative overflow-hidden"
                                        style={{ borderColor: 'var(--border-color)' }}
                                    >
                                        <div
                                            className="absolute left-0 top-0 bottom-0 w-1.5"
                                            style={{ backgroundColor: sv.dot }}
                                        />

                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2"
                                                    style={{ borderColor: `${typeColor}30`, backgroundColor: `${typeColor}10` }}
                                                >
                                                    <ShieldCheck className="w-6 h-6" style={{ color: typeColor }} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-[var(--bg-input)]" style={{ color: typeColor }}>
                                                            {p.insurance_type}
                                                        </span>
                                                        <span className="text-xs font-bold text-[var(--text-muted)]">
                                                            #{p.policy_no || 'NO POLICY NO'}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-lg font-bold text-[var(--text-primary)] mb-1">
                                                        {p.insurer || 'Private Insurer'}
                                                    </h4>

                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-[var(--text-muted)]">
                                                        {p.insurance_type === 'General' && details.regn_no && (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-primary-600">Reg:</span> {details.regn_no}
                                                            </div>
                                                        )}
                                                        {p.insurance_type === 'General' && details.make && (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-primary-600">Veh:</span> {details.make} {details.model}
                                                            </div>
                                                        )}
                                                        {p.insurance_type === 'Health' && details.scheme && (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-primary-600">Scheme:</span> {details.scheme}
                                                            </div>
                                                        )}
                                                        {p.insurance_type === 'Life' && details.sum_assured && (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-primary-600">Sum Assured:</span> {formatCurrency(details.sum_assured)}
                                                            </div>
                                                        )}
                                                        {p.insurance_type === 'Personal Accident' && (
                                                            <>
                                                                {details.proposer_name && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-primary-600">Name:</span> {details.proposer_name}
                                                                    </div>
                                                                )}
                                                                {details.sum_insured && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-primary-600">Sum Insured:</span> {formatCurrency(details.sum_insured)}
                                                                    </div>
                                                                )}
                                                                {details.policy_start && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-primary-600">Start:</span> {formatDate(details.policy_start)}
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-[var(--border-color)]/50">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Premium</p>
                                                    <p className="text-lg font-black text-[var(--text-primary)]">{formatCurrency(p.premium)}</p>
                                                </div>
                                                <div
                                                    className="px-3 py-1.5 rounded-xl border flex items-center gap-2"
                                                    style={{ backgroundColor: sv.bg, borderColor: sv.border, color: sv.text }}
                                                >
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span className="text-[11px] font-black uppercase">
                                                        {status === 'overdue' ? `${Math.abs(days)}d Late` : `${days}d Left`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-[var(--border-color)]/50 flex justify-between items-center">
                                            <div className="flex gap-4">
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)]">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    Expiry: {formatDate(p.expiry_date)}
                                                </div>
                                                {p.agency_code && (
                                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)]">
                                                        <ShieldCheck className="w-3.5 h-3.5" />
                                                        Agency: {p.agency_code}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditPolicy(p)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-input)] text-[var(--text-secondary)] text-[11px] font-bold hover:bg-[var(--hover-bg)]"
                                                >
                                                    <Edit2 className="w-3 h-3" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePolicy(p)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-input)] text-red-500 text-[11px] font-bold hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="w-3 h-3" /> Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
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
                    ? `Are you sure you want to delete "${deleteTarget?.item?.name}"? All their insurance policies will also be deleted from the database.`
                    : `Permanently delete this ${deleteTarget?.item?.insurance_type} policy? This action cannot be undone.`
                }
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    )
}
