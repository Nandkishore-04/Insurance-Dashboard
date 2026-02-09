import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { IndianRupee, TrendingUp, PieChart as PieIcon } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { Download } from 'lucide-react'
import { useCustomers } from '../context/CustomerContext'
import EmptyState from '../components/EmptyState'
import {
  INSURANCE_TYPES, INSURANCE_COLORS,
  getDeadlineStatus, formatCurrency,
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

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-10 w-48 rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 skeleton h-96 rounded-2xl" />
        <div className="skeleton h-96 rounded-2xl" />
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

function EmptyChart({ message }) {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <EmptyState type="chart" title={message} />
    </div>
  )
}

export default function Analytics() {
  const { customers, loading } = useCustomers()
  const navigate = useNavigate()

  const typeStats = useMemo(() => {
    const stats = {}
    INSURANCE_TYPES.forEach((t) => { stats[t] = { count: 0, totalAmount: 0 } })
    customers.forEach((c) => {
      if (stats[c.insurance_type]) {
        stats[c.insurance_type].count++
        stats[c.insurance_type].totalAmount += Number(c.amount) || 0
      }
    })
    return INSURANCE_TYPES.map((t) => ({
      name: t.replace(' Insurance', ''),
      fullName: t,
      count: stats[t].count,
      totalAmount: stats[t].totalAmount,
      avgAmount: stats[t].count > 0 ? Math.round(stats[t].totalAmount / stats[t].count) : 0,
      fill: INSURANCE_COLORS[t],
    }))
  }, [customers])

  const statusData = useMemo(() => {
    const counts = { active: 0, approaching: 0, overdue: 0 }
    customers.forEach((c) => { counts[getDeadlineStatus(c.deadline)]++ })
    return [
      { name: 'Active', value: counts.active, fill: '#059669' },
      { name: 'Approaching', value: counts.approaching, fill: '#f59e0b' },
      { name: 'Overdue', value: counts.overdue, fill: '#ef4444' },
    ].filter((d) => d.value > 0)
  }, [customers])

  const monthlyData = useMemo(() => {
    const months = {}
    customers.forEach((c) => {
      const d = new Date(c.deadline)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      if (!months[key]) months[key] = { key, month: label, count: 0, amount: 0 }
      months[key].count++
      months[key].amount += Number(c.amount) || 0
    })
    return Object.values(months).sort((a, b) => a.key.localeCompare(b.key))
  }, [customers])

  const ageDistribution = useMemo(() => {
    const brackets = [
      { label: '18-25', min: 18, max: 25, count: 0 },
      { label: '26-35', min: 26, max: 35, count: 0 },
      { label: '36-45', min: 36, max: 45, count: 0 },
      { label: '46-55', min: 46, max: 55, count: 0 },
      { label: '56-65', min: 56, max: 65, count: 0 },
      { label: '65+', min: 66, max: 200, count: 0 },
    ]
    customers.forEach((c) => {
      if (c.age) {
        const b = brackets.find((br) => c.age >= br.min && c.age <= br.max)
        if (b) b.count++
      }
    })
    return brackets.map((b) => ({ name: b.label, count: b.count }))
  }, [customers])

  const totalPremium = customers.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
  const avgPremium = customers.length > 0 ? Math.round(totalPremium / customers.length) : 0

  const exportPDF = () => {
    if (customers.length === 0) return
    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.setTextColor(16, 185, 129) // primary-500
    doc.text('Insurance Portfolio Analytics', 14, 22)

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 30)

    // Summary Section
    doc.setFontSize(14)
    doc.setTextColor(0)
    doc.text('Executive Summary', 14, 42)

    const summaryData = [
      ['Total Premium Value', formatCurrency(totalPremium)],
      ['Average Premium', formatCurrency(avgPremium)],
      ['Total Customers', customers.length.toString()],
      ['Types of Insurance', INSURANCE_TYPES.length.toString()]
    ]

    doc.autoTable({
      body: summaryData,
      startY: 46,
      theme: 'plain',
      styles: { fontSize: 11, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
    })

    // Type Breakdown Section
    doc.setFontSize(14)
    doc.text('Insurance Type Breakdown', 14, doc.lastAutoTable.finalY + 12)

    const tableColumn = ['Insurance Type', 'Customers', 'Total Premium', 'Avg Premium']
    const tableRows = typeStats.map(t => [
      t.fullName,
      t.count.toString(),
      formatCurrency(t.totalAmount),
      formatCurrency(t.avgAmount)
    ])

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: doc.lastAutoTable.finalY + 16,
      theme: 'grid',
      headStyles: { fillStyle: '#10b981', textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
    })

    doc.save('insurance_analytics_report.pdf')
  }

  if (loading) return <LoadingSkeleton />

  const statCards = [
    { label: 'Total Premium Value', value: formatCurrency(totalPremium), icon: IndianRupee, color: '#059669', path: '/customers' },
    { label: 'Average Premium', value: formatCurrency(avgPremium), icon: TrendingUp, color: '#0891b2', path: '/customers' },
    { label: 'Types Active', value: `${typeStats.filter((t) => t.count > 0).length} / ${INSURANCE_TYPES.length}`, icon: PieIcon, color: '#7c3aed', path: '/customers' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Analytics</h1>
          <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
            Detailed insights into your insurance portfolio
          </p>
        </div>
        <button
          onClick={exportPDF}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-md shadow-primary-500/25"
        >
          <Download className="w-4 h-4" aria-hidden="true" /> Download Report
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {statCards.map(({ label, value, icon: Icon, color, path }) => (
          <div
            key={label}
            onClick={() => path && navigate(path)}
            className={`group rounded-2xl p-6 border transition-all duration-300 ${path ? 'cursor-pointer' : 'cursor-default'} hover:-translate-y-0.5`}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--shadow-card)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-card)' }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${color}18`, color }}
              >
                <Icon className="w-5 h-5" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <p className="text-2xl font-bold tracking-tight mt-0.5" style={{ color: 'var(--text-primary)' }}>{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Premium by Type" subtitle="Total premium amount per category" className="lg:col-span-2">
          {customers.length === 0 ? (
            <EmptyChart message="No data available" />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={typeStats} barSize={44}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={tooltipStyle} cursor={{ fill: 'var(--hover-bg)', radius: 8 }} />
                <Bar dataKey="totalAmount" name="Total Amount" radius={[8, 8, 0, 0]} animationDuration={800}>
                  {typeStats.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Policy Status" subtitle="Active vs approaching vs overdue">
          {statusData.length === 0 ? (
            <EmptyChart message="No data" />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="42%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" animationDuration={800} strokeWidth={0}>
                  {statusData.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Deadlines Timeline" subtitle="Upcoming deadlines by month">
          {monthlyData.length === 0 ? (
            <EmptyChart message="No data available" />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="count" name="Deadlines" stroke="#10b981" fill="url(#greenGradient)" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }} animationDuration={800} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Age Distribution" subtitle="Customer age brackets">
          {customers.length === 0 ? (
            <EmptyChart message="No data available" />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={ageDistribution} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--hover-bg)', radius: 8 }} />
                <Bar dataKey="count" name="Customers" fill="#0891b2" radius={[8, 8, 0, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Type breakdown table */}
      <ChartCard title="Insurance Type Breakdown" subtitle="Detailed comparison across all types">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Type</th>
                <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Customers</th>
                <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total Premium</th>
                <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Avg Premium</th>
              </tr>
            </thead>
            <tbody>
              {typeStats.map((t, idx) => (
                <tr
                  key={t.fullName}
                  className="border-t transition-colors duration-150 hover:bg-[var(--hover-bg)]"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: idx % 2 !== 0 ? 'var(--bg-input)' : 'transparent',
                  }}
                >
                  <td className="py-3.5 px-4 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.fill }} />
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t.fullName}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold" style={{ color: 'var(--text-primary)' }}>{t.count}</td>
                  <td className="py-3.5 px-4 text-right font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(t.totalAmount)}</td>
                  <td className="py-3.5 px-4 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(t.avgAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  )
}
