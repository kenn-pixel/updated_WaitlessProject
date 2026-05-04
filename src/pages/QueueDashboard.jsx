import { useEffect, useState } from 'react'
import { modals } from '@mantine/modals'
import {
  IconPlayerSkipForward, IconCircleCheck, IconArrowRight,
  IconMessageCircle, IconUsers, IconClock, IconTrendingUp,
  IconAlertTriangle, IconInbox, IconStethoscope,
} from '@tabler/icons-react'
import DashboardLayout from '../components/DashboardLayout'
import { supabase } from '../supabaseClient'
import { QUEUE_TABLE } from '../supabaseTables'

const PRIORITY_ORDER = { urgent: 0, senior: 1, pwd: 2, normal: 3 }

const PRIORITY_META = {
  urgent: { label: 'Urgent', color: '#FF5F5F' },
  senior: { label: 'Senior', color: '#F5A623' },
  pwd:    { label: 'PWD',    color: '#00C9A7' },
  normal: { label: 'Normal', color: '#8B949E' },
}

function StatCard({ icon: Icon, label, value, color = '#00C9A7', sub }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
      <div style={{
        width: 44, height: 44, borderRadius: '10px', flexShrink: 0,
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, lineHeight: 1.2 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{sub}</div>}
      </div>
    </div>
  )
}

function QueueItem({ item, onSkip }) {
  const meta = PRIORITY_META[item.priority]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.875rem',
      padding: '0.75rem 1rem', borderRadius: '0.625rem',
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      transition: 'border-color 0.15s ease',
    }}>
      <span className="token" style={{ fontSize: '1rem', fontWeight: 700, color: '#00C9A7', minWidth: '3.5rem' }}>
        {item.token}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.name}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <IconStethoscope size={11} />{item.service}
        </div>
      </div>
      <span className="badge" style={{
        background: `color-mix(in srgb, ${meta.color} 15%, transparent)`,
        color: meta.color,
      }}>
        {meta.label}
      </span>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, minWidth: '3.5rem', justifyContent: 'flex-end' }}>
        <IconClock size={11} />{item.waitMin}m
      </div>
      <button className="btn-danger" style={{ padding: '0.25rem 0.625rem', fontSize: '0.72rem' }} onClick={() => onSkip(item)}>
        <IconPlayerSkipForward size={13} />
      </button>
    </div>
  )
}

export default function QueueDashboard() {
  'use no memo'
  const [queue, setQueue] = useState([])
  const [serving, setServing] = useState(null)
  const [servedCount, setServedCount] = useState(0)
  const [callingNext, setCallingNext] = useState(false)
  const [doneBusy, setDoneBusy] = useState(false)
  const [smsBusy, setSmsBusy] = useState(false)
  const [fetchError, setFetchError] = useState('')

  const loadQueue = async () => {
    const { data, error } = await supabase.from(QUEUE_TABLE).select('*').order('created_at', { ascending: true })
    console.log('Queue fetch result:', { dataLength: data?.length, data, error })
    if (error) {
      console.error('Supabase queue fetch error:', error)
      setFetchError(`Failed to load queue: ${error.message}`)
      return
    }
    if (!data || data.length === 0) {
      console.warn('No queue data returned - likely RLS is blocking access. Data:', data)
      setFetchError('No queue data found. Check Supabase RLS policies.')
      return
    }

    const entries = data.map((item) => ({
      id: item.id,
      token: item.token ?? item.ticket ?? item.queue_no ?? 'TBD',
      name: item.name ?? item.patient_name ?? 'Unknown',
      service: item.service ?? item.department ?? 'General',
      priority: item.priority ?? item.priority_level ?? 'normal',
      waitMin: item.wait_min ?? item.waitMin ?? 0,
      status: item.status ?? 'waiting',
      position: item.position ?? 0,
      createdAt: item.created_at,
    }))

    const sorted = entries.sort((a, b) => {
      const positionDiff = (a.position ?? 0) - (b.position ?? 0)
      if (positionDiff !== 0) return positionDiff
      return new Date(a.createdAt) - new Date(b.createdAt)
    })

    const currentServing = sorted.find(item => item.status === 'serving') || null
    const waiting = sorted.filter(item => item.status === 'waiting')
    const served = sorted.filter(item => item.status === 'served')

    setServing(currentServing)
    setQueue(waiting)
    setServedCount(served.length)
  }

  useEffect(() => {
    loadQueue()

    const channel = supabase.channel('queue-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: QUEUE_TABLE }, () => {
        loadQueue()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const callNext = async () => {
    if (!queue.length) return
    setCallingNext(true)
    setFetchError('')

    try {
      const next = queue[0]

      if (serving?.id) {
        const { error: servedError } = await supabase
          .from(QUEUE_TABLE)
          .update({ status: 'served' })
          .eq('id', serving.id)

        if (servedError) {
          throw servedError
        }
      }

      const { error: servingError } = await supabase
        .from(QUEUE_TABLE)
        .update({ status: 'serving' })
        .eq('id', next.id)

      if (servingError) {
        throw servingError
      }

      await loadQueue()
    } catch (error) {
      console.error('Failed to call next patient:', error)
      setFetchError('Unable to advance the queue. Please refresh and try again.')
    } finally {
      setCallingNext(false)
    }
  }

  const markDone = async () => {
    if (!serving?.id) return
    setDoneBusy(true)
    await supabase.from(QUEUE_TABLE).update({ status: 'served' }).eq('id', serving.id)
    await loadQueue()
    setDoneBusy(false)
  }

  const confirmSkip = (item) => {
    modals.openConfirmModal({
      title: 'Skip Patient',
      children: (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Skip <strong style={{ color: 'var(--text)' }}>{item.name}</strong> ({item.token})?
          They will be moved to the end of the queue.
        </p>
      ),
      labels: { confirm: 'Yes, Skip', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const maxPosition = Math.max(
          0,
          ...(queue.map(i => i.position ?? 0)),
          serving?.position ?? 0
        )
        const next = queue.find(i => i.id !== item.id)

        if (serving?.id === item.id) {
          await supabase.from(QUEUE_TABLE).update({ status: 'waiting', position: maxPosition + 1 }).eq('id', item.id)
          if (next?.id) {
            await supabase.from(QUEUE_TABLE).update({ status: 'serving' }).eq('id', next.id)
          }
        } else {
          await supabase.from(QUEUE_TABLE).update({ position: maxPosition + 1 }).eq('id', item.id)
        }

        await loadQueue()
      },
    })
  }

  const sendSMS = async () => {
    if (!serving) return
    setSmsBusy(true)
    await new Promise(r => setTimeout(r, 800))
    setSmsBusy(false)
  }

  return (
    <DashboardLayout>
      {/* Page title */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Queue Management</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manage today's patient queue in real time.</p>
      </div>

      {fetchError && (
        <div className="card-2" style={{ marginBottom: '1rem', color: '#F5A623' }}>
          {fetchError}
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '0.875rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <StatCard icon={IconUsers}     label="Waiting"      value={queue.length}  color="#F5A623" />
        <StatCard icon={IconCircleCheck} label="Served Today" value={servedCount}  color="#3DD68C" />
        <StatCard icon={IconClock}     label="Avg Wait"     value="~18 min"       color="#00C9A7" />
        <StatCard icon={IconTrendingUp} label="Completion"  value="87%"           color="#00C9A7" sub="Today" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        {/* Now Serving */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div className="card" style={{
            borderColor: serving
              ? 'color-mix(in srgb, #00C9A7 40%, var(--border))'
              : 'var(--border)',
            background: serving
              ? 'color-mix(in srgb, #00C9A7 4%, var(--surface))'
              : 'var(--surface)',
            transition: 'all 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                Now Serving
              </span>
              {serving && (
                <span className="badge badge-primary">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C9A7', display: 'inline-block' }} />
                  Active
                </span>
              )}
            </div>

            {serving ? (
              <>
                <div style={{ textAlign: 'center', padding: '0.75rem 0' }}>
                  <div className="token token-pulse" style={{
                    display: 'inline-block', fontSize: '3.5rem', fontWeight: 900, color: '#00C9A7',
                    background: 'color-mix(in srgb, #00C9A7 10%, var(--surface))',
                    border: '2px solid color-mix(in srgb, #00C9A7 40%, transparent)',
                    borderRadius: '1rem', padding: '0.25rem 1.5rem', lineHeight: 1.3,
                  }}>
                    {serving.token}
                  </div>
                  <div style={{ marginTop: '0.75rem', fontWeight: 700, fontSize: '1.05rem' }}>{serving.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: '0.25rem' }}>
                    <IconStethoscope size={13} />{serving.service}
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <span className="badge" style={{
                      background: `color-mix(in srgb, ${PRIORITY_META[serving.priority].color} 15%, transparent)`,
                      color: PRIORITY_META[serving.priority].color,
                    }}>
                      {PRIORITY_META[serving.priority].label}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <button className="btn-success" disabled={doneBusy} onClick={markDone} style={{ flex: 1 }}>
                    {doneBusy ? <><span className="spinner" />Processing...</> : <><IconCircleCheck size={15} />Done</>}
                  </button>
                  <button className="btn-danger" onClick={() => confirmSkip(serving)} style={{ flex: 1 }}>
                    <IconPlayerSkipForward size={15} />Skip
                  </button>
                  <button className="btn-secondary" disabled={smsBusy} onClick={sendSMS} style={{ flex: 1 }}>
                    {smsBusy ? <><span className="spinner" />Sending...</> : <><IconMessageCircle size={15} />SMS</>}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                <IconInbox size={40} style={{ opacity: 0.35, marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.875rem' }}>No patient currently being served.</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Click "Call Next" to begin.</p>
              </div>
            )}
          </div>

          {/* Call Next */}
          <button className="btn-primary" onClick={callNext}
            disabled={callingNext || !queue.length}
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}>
            {callingNext
              ? <><span className="spinner" />Calling...</>
              : <><IconArrowRight size={16} />Call Next Patient</>}
          </button>

          {!queue.length && !serving && (
            <div className="card-2" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <IconAlertTriangle size={16} style={{ color: '#F5A623', marginBottom: 4 }} />
              <p>Queue is empty for today.</p>
            </div>
          )}
        </div>

        {/* Waiting Queue */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Waiting Queue</span>
            <span className="badge badge-warning">{queue.length} waiting</span>
          </div>

          {queue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
              <IconInbox size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.8rem' }}>No patients in queue.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: '420px' }}>
              {queue.map(item => (
                <QueueItem key={item.id} item={item} onSkip={confirmSkip} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
