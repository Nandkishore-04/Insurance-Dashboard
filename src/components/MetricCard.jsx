const gradients = {
  '#059669': 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(5,150,105,0.03) 100%)',
  '#f59e0b': 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(217,119,6,0.03) 100%)',
  '#ef4444': 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(220,38,38,0.03) 100%)',
  '#0891b2': 'linear-gradient(135deg, rgba(8,145,178,0.08) 0%, rgba(6,182,212,0.03) 100%)',
}

export default function MetricCard({ icon: Icon, label, value, color, subtext, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`group rounded-2xl p-6 border transition-all duration-300 ${onClick ? 'cursor-pointer' : 'cursor-default'} hover:-translate-y-0.5`}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
        background: gradients[color] || 'var(--bg-card)',
        boxShadow: 'var(--shadow-card)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)' }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-card)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-primary)' }}>
            {label}
          </p>
          <p className="text-4xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {value}
          </p>
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: `${color}18`, color }}
        >
          <Icon className="w-5 h-5" strokeWidth={2.2} />
        </div>
      </div>
      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        {subtext}
      </p>
    </div>
  )
}
