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

const PRIORITY_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'senior', label: 'Senior' },
  { value: 'pwd', label: 'PWD' },
]

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

function QueueItem({ item, onSkip, onPromote }) {
  const meta = PRIORITY_META[item.priority]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.875rem',
      padding: '0.75rem 1rem', borderRadius: '0.625rem',
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      transition: 'border-color 0.15s ease',
      flexWrap: 'wrap',
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
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
        {item.priority !== 'urgent' && onPromote && (
          <button type="button" className="btn-secondary" style={{ padding: '0.25rem 0.625rem', fontSize: '0.72rem' }} onClick={() => onPromote(item)}>
            Prioritize
          </button>
        )}
        <button className="btn-danger" style={{ padding: '0.25rem 0.625rem', fontSize: '0.72rem' }} onClick={() => onSkip(item)}>
          <IconPlayerSkipForward size={13} />
        </button>
      </div>
    </div>
  )
}

export default function QueueDashboard() {
  'use no memo'
  const [queue, setQueue] = useState([])
  const [serving, setServing] = useState(null)
  const [servedCount, setServedCount] = useState(0)
  const [avgWait, setAvgWait] = useState(0)
  const [completion, setCompletion] = useState(0)
  const [callingNext, setCallingNext] = useState(false)
  const [doneBusy, setDoneBusy] = useState(false)
  const [smsBusy, setSmsBusy] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [walkInForm, setWalkInForm] = useState({ name: '', phone: '', service: '', priority: 'normal' })
  const [walkInErrors, setWalkInErrors] = useState({})
  const [walkInBusy, setWalkInBusy] = useState(false)
  const [walkInSuccess, setWalkInSuccess] = useState('')

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
      setQueue([])
      setServing(null)
      return
    }

    setFetchError('')

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
      const priorityA = PRIORITY_ORDER[a.priority] ?? PRIORITY_ORDER.normal
      const priorityB = PRIORITY_ORDER[b.priority] ?? PRIORITY_ORDER.normal
      if (priorityA !== priorityB) return priorityA - priorityB
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

    // Calculate average wait time for waiting patients
    const avgWaitTime = waiting.length > 0
      ? Math.round(waiting.reduce((sum, item) => sum + (item.waitMin || 0), 0) / waiting.length)
      : 0
    setAvgWait(avgWaitTime)

    // Calculate completion rate: served / (served + waiting + serving)
    const totalProcessed = served.length + waiting.length + (currentServing ? 1 : 0)
    const completionRate = totalProcessed > 0
      ? Math.round((served.length / totalProcessed) * 100)
      : 0
    setCompletion(completionRate)
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

  const validateWalkIn = () => {
    const errors = {}
    console.log('[Walk-in Validation] Form:', walkInForm)
    if (!walkInForm.name.trim()) errors.name = 'Patient name is required.'
    // Allow phone with spaces, dashes, or no separators - just check it starts with 09 and has 11 digits total
    const phoneDigits = walkInForm.phone.replace(/\D/g, '')
    if (!/^09\d{9}$/.test(phoneDigits)) errors.phone = 'Enter a valid PH mobile number (09XXXXXXXXX). Got: ' + phoneDigits
    if (!walkInForm.service) errors.service = 'Please select a service.'
    if (!walkInForm.priority) errors.priority = 'Please choose a priority.'
    console.log('[Walk-in Validation] Errors:', errors)
    return errors
  }

  const generateWalkInToken = () => {
    const sequence = queue.reduce((max, item) => {
      const match = String(item.token).match(/W-(\d{3})$/)
      if (!match) return max
      return Math.max(max, Number(match[1]))
    }, 0)
    return `W-${String(sequence + 1).padStart(3, '0')}`
  }

  const registerWalkIn = async () => {
    console.log('[Register Walk-in] Starting registration')
    const errors = validateWalkIn()
    console.log('[Register Walk-in] Validation errors:', errors)
    setWalkInErrors(errors)
    setWalkInSuccess('')
    if (Object.keys(errors).length > 0) {
      console.log('[Register Walk-in] Validation failed, stopping')
      return
    }

    setWalkInBusy(true)
    setFetchError('')
    try {
      const nextPosition = Math.max(0, ...(queue.map(item => item.position ?? 0)), serving?.position ?? 0) + 1
      const token = generateWalkInToken()
      console.log('[Register Walk-in] Generated token:', token, 'Position:', nextPosition)
      console.log('[Register Walk-in] Inserting:', {
        token,
        name: walkInForm.name.trim(),
        service: walkInForm.service,
        priority: walkInForm.priority,
        phone: walkInForm.phone.trim(),
        status: 'waiting',
        position: nextPosition,
        wait_min: 0,
      })
      const { data, error } = await supabase.from(QUEUE_TABLE).insert([
        {
          token,
          name: walkInForm.name.trim(),
          service: walkInForm.service,
          priority: walkInForm.priority,
          phone: walkInForm.phone.trim(),
          status: 'waiting',
          position: nextPosition,
          wait_min: 0,
        },
      ]).select()

      console.log('[Register Walk-in] Insert response:', { data, error })
      if (error || !data || !data.length) {
        throw error || new Error('No row was inserted.')
      }

      setWalkInForm({ name: '', phone: '', service: '', priority: 'normal' })
      setWalkInErrors({})
      setWalkInSuccess(`Walk-in registered as ${token}`)
      console.log('[Register Walk-in] Success! Reloading queue')
      await loadQueue()
    } catch (error) {
      console.error('Failed to register walk-in patient:', error)
      setFetchError(`Registration error: ${error.message}`)
    } finally {
      setWalkInBusy(false)
    }
  }

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

  const promotePriority = async (item) => {
    setFetchError('')
    try {
      const { error } = await supabase
        .from(QUEUE_TABLE)
        .update({ priority: 'urgent' })
        .eq('id', item.id)

      if (error) {
        throw error
      }

      await loadQueue()
    } catch (error) {
      console.error('Failed to prioritize patient:', error)
      setFetchError('Unable to prioritize patient. Please refresh and try again.')
    }
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
        <StatCard icon={IconClock}     label="Avg Wait"     value={`~${avgWait} min`} color="#00C9A7" />
        <StatCard icon={IconTrendingUp} label="Completion"  value={`${completion}%`} color="#00C9A7" sub="Today" />
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
                <QueueItem key={item.id} item={item} onSkip={confirmSkip} onPromote={promotePriority} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <IconInbox size={18} style={{ color: '#00C9A7' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Register Walk-in Patient</h2>
        </div>

        {Object.keys(walkInErrors).length > 0 && (
          <div className="card-2" style={{ padding: '0.85rem 1rem', marginBottom: '1rem', borderColor: '#FF5F5F', color: '#FF5F5F', background: 'color-mix(in srgb, #FF5F5F 8%, var(--surface))' }}>
            <strong>Validation Errors:</strong>
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
              {Object.entries(walkInErrors).map(([key, msg]) => (
                <li key={key} style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Full Name
            </label>
            <input
              className={`input-field ${walkInErrors.name ? 'error' : ''}`}
              type="text"
              placeholder="Patient name"
              value={walkInForm.name}
              onChange={e => setWalkInForm(prev => ({ ...prev, name: e.target.value }))}
            />
            {walkInErrors.name && <p style={{ color: '#FF5F5F', fontSize: '0.75rem', marginTop: '0.35rem' }}>{walkInErrors.name}</p>}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Mobile Number
            </label>
            <input
              className={`input-field ${walkInErrors.phone ? 'error' : ''}`}
              type="tel"
              placeholder="09XXXXXXXXX"
              value={walkInForm.phone}
              onChange={e => setWalkInForm(prev => ({ ...prev, phone: e.target.value }))}
            />
            {walkInErrors.phone && <p style={{ color: '#FF5F5F', fontSize: '0.75rem', marginTop: '0.35rem' }}>{walkInErrors.phone}</p>}
          </div>

          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Service
              </label>
              <select
                className={`input-field ${walkInErrors.service ? 'error' : ''}`}
                value={walkInForm.service}
                onChange={e => setWalkInForm(prev => ({ ...prev, service: e.target.value }))}
              >
                <option value="">Select a service...</option>
                <option value="General Consultation">General Consultation</option>
                <option value="Vaccination">Vaccination</option>
                <option value="Prenatal Check-up">Prenatal Check-up</option>
                <option value="Dental">Dental</option>
                <option value="Lab Request">Lab Request</option>
              </select>
              {walkInErrors.service && <p style={{ color: '#FF5F5F', fontSize: '0.75rem', marginTop: '0.35rem' }}>{walkInErrors.service}</p>}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Priority
              </label>
              <select
                className={`input-field ${walkInErrors.priority ? 'error' : ''}`}
                value={walkInForm.priority}
                onChange={e => setWalkInForm(prev => ({ ...prev, priority: e.target.value }))}
              >
                {PRIORITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {walkInErrors.priority && <p style={{ color: '#FF5F5F', fontSize: '0.75rem', marginTop: '0.35rem' }}>{walkInErrors.priority}</p>}
            </div>
          </div>

          {walkInSuccess && (
            <div className="card-2" style={{ padding: '0.85rem 1rem', borderColor: '#00C9A7', color: '#0B6E5B' }}>
              {walkInSuccess}
            </div>
          )}
          <button
            className="btn-primary"
            type="button"
            onClick={registerWalkIn}
            disabled={walkInBusy}
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
          >
            {walkInBusy ? <><span className="spinner" /> Registering...</> : 'Register Walk-in Patient'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}

