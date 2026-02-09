const illustrations = {
  customers: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill="var(--status-active-bg)" opacity="0.5" />
      <circle cx="60" cy="44" r="16" stroke="var(--status-active-dot)" strokeWidth="2.5" fill="none" />
      <path d="M36 88c0-13.255 10.745-24 24-24s24 10.745 24 24" stroke="var(--status-active-dot)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="90" cy="36" r="8" stroke="var(--status-active-dot)" strokeWidth="2" fill="none" opacity="0.4" />
      <path d="M82 52c0-6.627 3.582-12 8-12s8 5.373 8 12" stroke="var(--status-active-dot)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
    </svg>
  ),
  search: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill="var(--status-approaching-bg)" opacity="0.5" />
      <circle cx="52" cy="52" r="20" stroke="var(--status-approaching-dot)" strokeWidth="2.5" fill="none" />
      <line x1="66" y1="66" x2="84" y2="84" stroke="var(--status-approaching-dot)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="44" y1="52" x2="60" y2="52" stroke="var(--status-approaching-dot)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <line x1="52" y1="44" x2="52" y2="60" stroke="var(--status-approaching-dot)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  chart: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill="var(--status-active-bg)" opacity="0.5" />
      <rect x="28" y="70" width="14" height="22" rx="4" fill="var(--status-active-dot)" opacity="0.3" />
      <rect x="48" y="50" width="14" height="42" rx="4" fill="var(--status-active-dot)" opacity="0.5" />
      <rect x="68" y="36" width="14" height="56" rx="4" fill="var(--status-active-dot)" opacity="0.7" />
      <line x1="24" y1="96" x2="96" y2="96" stroke="var(--status-active-dot)" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    </svg>
  ),
  calendar: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill="var(--status-active-bg)" opacity="0.5" />
      <rect x="30" y="36" width="60" height="52" rx="8" stroke="var(--status-active-dot)" strokeWidth="2.5" fill="none" />
      <line x1="30" y1="52" x2="90" y2="52" stroke="var(--status-active-dot)" strokeWidth="2.5" />
      <line x1="46" y1="28" x2="46" y2="44" stroke="var(--status-active-dot)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="74" y1="28" x2="74" y2="44" stroke="var(--status-active-dot)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="50" cy="66" r="3" fill="var(--status-active-dot)" opacity="0.5" />
      <circle cx="66" cy="66" r="3" fill="var(--status-active-dot)" opacity="0.5" />
      <circle cx="50" cy="78" r="3" fill="var(--status-active-dot)" opacity="0.3" />
    </svg>
  ),
}

export default function EmptyState({ type = 'customers', title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="mb-5">
        {illustrations[type]}
      </div>
      <p className="text-base font-semibold mb-1 text-center" style={{ color: 'var(--text-primary)' }}>
        {title}
      </p>
      {description && (
        <p className="text-sm font-medium text-center max-w-xs" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      )}
    </div>
  )
}
