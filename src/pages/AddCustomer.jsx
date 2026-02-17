import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import CustomerForm from '../components/CustomerForm'

export default function AddCustomer() {
    const navigate = useNavigate()
    const [formOpen, setFormOpen] = useState(true)

    const handleClose = () => {
        setFormOpen(false)
        navigate('/customers')
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/customers')}
                    className="p-2 rounded-xl hover:bg-[var(--hover-bg)] transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    aria-label="Go back to customers"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        Add New Customer & Insurance
                    </h1>
                    <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Enter customer details and their first insurance policy
                    </p>
                </div>
            </div>

            {/* Form */}
            <CustomerForm
                open={formOpen}
                onClose={handleClose}
                mode={null}
                asModal={false}
            />
        </div>
    )
}
