import { IconRadio } from '@tabler/icons-react'

const MOCK_TICKER = [
  { token: 'A-003', name: 'Maria Santos', service: 'Consultation' },
  { token: 'A-004', name: 'Jose Reyes', service: 'Vaccination' },
  { token: 'A-005', name: 'Ana Cruz', service: 'Prenatal' },
  { token: 'A-006', name: 'Pedro Lim', service: 'Lab Request' },
  { token: 'A-007', name: 'Rosa Dela Cruz', service: 'Dental' },
]

export default function LiveTickerBar() {
  const items = [...MOCK_TICKER, ...MOCK_TICKER] // duplicate for seamless loop

  return (
    <div
      style={{
        background: 'color-mix(in srgb, #00C9A7 10%, var(--surface))',
        borderBottom: '1px solid var(--border)',
        borderTop: '1px solid color-mix(in srgb, #00C9A7 30%, transparent)',
        height: '32px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Label */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.375rem',
        padding: '0 0.875rem', borderRight: '1px solid var(--border)',
        height: '100%', flexShrink: 0,
        color: '#00C9A7', fontSize: '0.7rem', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        background: 'var(--surface)',
      }}>
        <IconRadio size={12} />
        Live
      </div>

      {/* Scrolling track */}
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div className="ticker-track">
          {items.map((item, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              padding: '0 1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
            }}>
              <span className="token" style={{ color: '#00C9A7', fontWeight: 700 }}>
                {item.token}
              </span>
              <span>{item.name}</span>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{item.service}</span>
              <span style={{ color: 'var(--border)', marginLeft: '0.75rem' }}>|</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
