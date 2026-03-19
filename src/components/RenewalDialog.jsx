import React, { useState } from 'react'
import { X, Check, AlertCircle } from 'lucide-react'
import { useCustomers } from '../context/CustomerContext'
import { formatDate } from '../lib/constants'
import toast from 'react-hot-toast'

export default function RenewalDialog({ policy, customer, onClose, onRenew }) {
    const [renewed, setRenewed] = useState(null) // null | 'yes' | 'no'
    const [loading, setLoading] = useState(false)
    const { acknowledgePolicy } = useCustomers()

    const handleAcknowledge = async () => {
        if (renewed === null) {
            toast.error('Please select if the policy was renewed or not')
            return
        }

        setLoading(true)
        try {
            if (renewed === 'yes') {
                // Acknowledge the renewal and navigate to edit form
                await acknowledgePolicy(policy.id)
                onClose()
                // Call the onRenew callback to open edit form
                if (onRenew) {
                    onRenew(policy)
                }
                toast.success('Please update the renewed policy details')
            } else {
                // Just acknowledge without renewal
                await acknowledgePolicy(policy.id)
                toast.success('Reminder dismissed')
                onClose()
            }
        } catch (error) {
            toast.error('Failed to update: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!policy) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={onClose}
        >
            <div
                className="rounded-2xl border max-w-md w-full p-6"
                style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-color)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                                Renewal Status
                            </h3>
                            <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                {customer?.name} • {policy.insurance_type}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Policy Info */}
                <div
                    className="rounded-xl p-4 mb-6"
                    style={{ backgroundColor: 'var(--bg-input)' }}
                >
                    <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        Policy #{policy.policy_no || 'N/A'}
                    </p>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Insurer: {policy.insurer || 'N/A'} • Premium: ₹{policy.premium?.toLocaleString('en-IN') || '0'}
                    </p>
                    <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
                        Expiry: {formatDate(policy.expiry_date)}
                    </p>
                </div>

                {/* Question */}
                <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Has the client renewed this policy?
                </p>

                {/* Options */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                        onClick={() => setRenewed('yes')}
                        className={`p-4 rounded-xl border-2 transition-all ${renewed === 'yes' ? 'border-primary-500 bg-primary-500/10' : 'border-[var(--border-color)] hover:border-primary-500/50'
                            }`}
                    >
                        <Check className={`w-6 h-6 mx-auto mb-2 ${renewed === 'yes' ? 'text-primary-500' : 'text-[var(--text-muted)]'}`} />
                        <p className={`text-sm font-bold ${renewed === 'yes' ? 'text-primary-500' : 'text-[var(--text-secondary)]'}`}>
                            Yes, Renewed
                        </p>
                    </button>
                    <button
                        onClick={() => setRenewed('no')}
                        className={`p-4 rounded-xl border-2 transition-all ${renewed === 'no' ? 'border-red-500 bg-red-500/10' : 'border-[var(--border-color)] hover:border-red-500/50'
                            }`}
                    >
                        <X className={`w-6 h-6 mx-auto mb-2 ${renewed === 'no' ? 'text-red-500' : 'text-[var(--text-muted)]'}`} />
                        <p className={`text-sm font-bold ${renewed === 'no' ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
                            No, Not Renewed
                        </p>
                    </button>
                </div>

                {/* Info Message */}
                {renewed === 'yes' && (
                    <div
                        className="rounded-xl p-3 mb-4"
                        style={{ backgroundColor: 'var(--status-active-bg)' }}
                    >
                        <p className="text-xs font-medium" style={{ color: 'var(--status-active-text)' }}>
                            ✓ You'll be able to update the new policy details after confirming
                        </p>
                    </div>
                )}
                {renewed === 'no' && (
                    <div
                        className="rounded-xl p-3 mb-4"
                        style={{ backgroundColor: 'var(--status-overdue-bg)' }}
                    >
                        <p className="text-xs font-medium" style={{ color: 'var(--status-overdue-text)' }}>
                            This reminder will be dismissed and won't show again
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl border font-semibold text-sm transition-colors hover:bg-[var(--hover-bg)]"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAcknowledge}
                        disabled={renewed === null || loading}
                        className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    )
}
