import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, AlertTriangle, Clock, ShieldCheck, Eye, Shield, Plus } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import MetricCard from '../components/MetricCard'
import EmptyState from '../components/EmptyState'
import RenewalDialog from '../components/RenewalDialog'
import CustomerForm from '../components/CustomerForm'
import { useCustomers } from '../context/CustomerContext'
import {
  INSURANCE_TYPES, INSURANCE_COLORS,
  getDaysUntilDeadline, getDeadlineStatus, formatDate, formatCurrency,
} from '../lib/constants'

const tooltipStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  color: 'var(--text-primary)',
  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
  padding: '10px 14px',
  fontSize: '13px',
  fontWeight: 500,
}

const statusVars = {
  active: {
    bg: 'var(--status-active-bg)',
    text: 'var(--status-active-text)',
    dot: 'var(--status-active-dot)',
  },
  approaching: {
    bg: 'var(--status-approaching-bg)',
    text: 'var(--status-approaching-text)',
    dot: 'var(--status-approaching-dot)',
  },
  overdue: {
    bg: 'var(--status-overdue-bg)',
    text: 'var(--status-overdue-text)',
    dot: 'var(--status-overdue-dot)',
  },
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-36 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 skeleton h-80 rounded-2xl" />
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, className = '', children }) {
  return (
    <div
      className={`rounded-2xl p-6 border ${className}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="mb-6">
        <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        {subtitle && <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function EmptyChart({ message, type = 'chart' }) {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <EmptyState type={type} title={message} />
    </div>
  )
}

export default function Dashboard() {
  const { customers, insurances, loading } = useCustomers()
  const navigate = useNavigate()
  const [renewalTarget, setRenewalTarget] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState(null)

  const handleRenewal = (policy) => {
    // Open the edit insurance form with the policy data
    setFormMode({ type: 'editInsurance', insurance: policy })
    setFormOpen(true)
  }

  const stats = useMemo(() => {
    const totalCustomers = customers.length
    const totalPolicies = insurances.length
    const overdue = insurances.filter((p) => getDeadlineStatus(p.expiry_date) === 'overdue').length
    const approaching = insurances.filter((p) => getDeadlineStatus(p.expiry_date) === 'approaching').length
    const active = insurances.filter((p) => getDeadlineStatus(p.expiry_date) === 'active').length
    return { totalCustomers, totalPolicies, overdue, approaching, active }
  }, [customers, insurances])

  const barData = useMemo(() => {
    const counts = {}
    INSURANCE_TYPES.forEach((t) => (counts[t] = 0))
    insurances.forEach((p) => {
      if (counts[p.insurance_type] !== undefined) counts[p.insurance_type]++
    })
    return INSURANCE_TYPES.map((t) => ({
      name: t,
      count: counts[t],
      fill: INSURANCE_COLORS[t],
    }))
  }, [insurances])

  const pieData = useMemo(() => {
    return barData.filter((d) => d.count > 0).map((d) => ({
      name: d.name,
      value: d.count,
      fill: d.fill,
    }))
  }, [barData])

  // Upcoming deadlines with customer name (exclude acknowledged renewals)
  const upcoming = useMemo(() => {
    const customerMap = new Map(customers.map((c) => [c.id, c]))
    return insurances
      .filter((p) => getDaysUntilDeadline(p.expiry_date) >= 0 && !p.renewal_acknowledged)
      .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
      .slice(0, 5)
      .map((p) => ({
        ...p,
        customerName: customerMap.get(p.customer_id)?.name || 'Unknown',
        customer: customerMap.get(p.customer_id),
      }))
  }, [insurances, customers])

  if (loading) return <LoadingSkeleton />

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
          <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
            Overview of your insurance portfolio
          </p>
        </div>
        <button
          onClick={() => navigate('/customers/add')}
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Insurance
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard icon={Users} label="Total Customers" value={stats.totalCustomers} color="#059669" subtext={`${stats.totalPolicies} policies`} onClick={() => navigate('/customers')} />
        <MetricCard icon={Clock} label="Approaching" value={stats.approaching} color="#f59e0b" subtext="Within 30 days" onClick={() => navigate('/customers?status=approaching')} />
        <MetricCard icon={AlertTriangle} label="Overdue" value={stats.overdue} color="#ef4444" subtext="Past deadline" onClick={() => navigate('/customers?status=overdue')} />
        <MetricCard icon={ShieldCheck} label="Active" value={stats.active} color="#0891b2" subtext="30+ days left" onClick={() => navigate('/customers?status=active')} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Policies by Type" subtitle="Distribution across insurance categories" className="lg:col-span-2">
          {insurances.length === 0 ? (
            <EmptyChart message="Add policies to see the chart" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} barSize={44}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--hover-bg)', radius: 8 }} />
                <Bar dataKey="count" name="Policies" radius={[8, 8, 0, 0]} animationDuration={800}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Distribution" subtitle="Policy type breakdown">
          {pieData.length === 0 ? (
            <EmptyChart message="No data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="42%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  animationDuration={800}
                  strokeWidth={0}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', fontWeight: 500 }}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Upcoming Deadlines */}
      <div
        className="rounded-2xl border"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Upcoming Deadlines</h3>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>Next 5 approaching deadlines</p>
          </div>
          <button
            onClick={() => navigate('/customers')}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-primary-500/10"
          >
            View All
          </button>
        </div>

        {upcoming.length === 0 ? (
          <EmptyState
            type="calendar"
            title="No upcoming deadlines"
            description="Add policies with future deadlines to see them here."
          />
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {upcoming.map((p) => {
              const days = getDaysUntilDeadline(p.expiry_date)
              const status = getDeadlineStatus(p.expiry_date)
              const sv = statusVars[status]
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-6 py-4 transition-colors duration-150 hover:bg-[var(--hover-bg)]"
                >
                  <div
                    className="flex items-center gap-4 flex-1 cursor-pointer"
                    onClick={() => navigate(`/customer/${p.customer_id}`)}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                      style={{
                        backgroundColor: sv.bg,
                        color: sv.dot,
                      }}
                    >
                      {p.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {p.customerName}
                      </p>
                      <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {p.insurance_type} &middot; {formatCurrency(p.premium)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(p.expiry_date)}
                      </p>
                      <span
                        className="text-[11px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap"
                        style={{
                          backgroundColor: sv.bg,
                          color: sv.text,
                        }}
                      >
                        {status === 'overdue'
                          ? `${Math.abs(days)}d overdue`
                          : `${days}d left`}
                      </span>
                    </div>
                    {status === 'approaching' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setRenewalTarget(p)
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors"
                      >
                        Mark as Renewed
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Renewal Dialog */}
      {renewalTarget && (
        <RenewalDialog
          policy={renewalTarget}
          customer={renewalTarget.customer}
          onClose={() => setRenewalTarget(null)}
          onRenew={handleRenewal}
        />
      )}

      {/* Edit Insurance Form */}
      {formOpen && (
        <CustomerForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          mode={formMode}
        />
      )}
    </div>
  )
}
