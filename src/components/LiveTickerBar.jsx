import { useEffect, useState } from 'react'
import { IconRadio } from '@tabler/icons-react'
import { supabase } from '../supabaseClient'
import { QUEUE_TABLE } from '../supabaseTables'

export default function LiveTickerBar() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const loadTicker = async () => {
    const { data, error } = await supabase
      .from(QUEUE_TABLE)
      .select('id, token, name, service, status, position, created_at')
      .in('status', ['waiting', 'serving'])
      .order('position', { ascending: true, nulls: 'last' })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Ticker fetch error:', error)
      setItems([])
      setLoading(false)
      return
    }

    const normalized = (data || []).map(item => ({
      token: item.token ?? item.ticket ?? item.queue_no ?? 'TBD',
      name: item.name ?? item.patient_name ?? 'Unknown',
      service: item.service ?? item.department ?? 'General',
      status: item.status ?? 'waiting',
    }))

    normalized.sort((a, b) => {
      const aRank = a.status === 'serving' ? 0 : 1
      const bRank = b.status === 'serving' ? 0 : 1
      return aRank - bRank
    })

    setItems(normalized.slice(0, 10))
    setLoading(false)
  }

  useEffect(() => {
    loadTicker()

    const channel = supabase.channel('queue-ticker')
      .on('postgres_changes', { event: '*', schema: 'public', table: QUEUE_TABLE }, () => {
        loadTicker()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const tickerItems = loading
    ? [{ token: 'Loading...', name: 'Fetching live queue', service: '' }]
    : items.length > 0
      ? items
      : [{ token: 'No waiting patients', name: 'Queue is empty', service: '' }]

  const displayItems = [...tickerItems, ...tickerItems]

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

      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div className="ticker-track">
          {displayItems.map((item, i) => (
            <span key={`${item.token}-${item.name}-${i}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              padding: '0 1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
            }}>
              <span className="token" style={{ color: '#00C9A7', fontWeight: 700 }}>
                {item.token}
              </span>
              <span>{item.name}</span>
              {item.service && (
                <>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{item.service}</span>
                </>
              )}
              {item.status === 'serving' && (
                <span style={{ color: '#00C9A7', fontSize: '0.72rem', fontWeight: 700 }}>Now serving</span>
              )}
              <span style={{ color: 'var(--border)', marginLeft: '0.75rem' }}>|</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
