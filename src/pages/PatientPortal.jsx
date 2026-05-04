import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import {
  IconSun, IconMoon, IconRefresh, IconCalendarPlus,
  IconCircleCheck, IconAlertCircle, IconClock, IconUsers,
  IconPhone, IconUser, IconStethoscope, IconCalendar, IconInbox,
} from '@tabler/icons-react'
import { supabase } from '../supabaseClient'
import { QUEUE_TABLE, APPOINTMENTS_TABLE } from '../supabaseTables'

const SERVICES = ['General Consultation', 'Vaccination', 'Prenatal Check-up', 'Dental', 'Lab Request']
const TIME_SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM']

const MOCK_QUEUE = { serving: 'A-003', ahead: 4, avgWait: 20, lastUpdated: new Date() }

function StatPill({ icon: Icon, label, value, color = '#00C9A7' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.625rem',
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: '0.625rem', padding: '0.75rem 1rem', flex: 1, minWidth: 0,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '8px', flexShrink: 0,
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>{value}</div>
      </div>
    </div>
  )
}

function FieldLabel({ children, required }) {
  return (
    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-muted)' }}>
      {children}{required && <span style={{ color: '#FF5F5F', marginLeft: 2 }}>*</span>}
    </label>
  )
}

function InputIcon({ icon: Icon, children, error }) {
  return (
    <div>
      <div style={{ position: 'relative' }}>
        <Icon size={15} style={{
          position: 'absolute', left: '0.75rem', top: '50%',
          transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
        }} />
        {children}
      </div>
      {error && <p style={{ color: '#FF5F5F', fontSize: '0.72rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: 4 }}>
        <IconAlertCircle size={12} />{error}
      </p>}
    </div>
  )
}

export default function PatientPortal() {
  const { theme, toggle } = useTheme()
  const [status, setStatus] = useState({ serving: '—', ahead: 0, avgWait: 0, lastUpdated: new Date() })
  const [refreshing, setRefreshing] = useState(false)
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [confirmed, setConfirmed] = useState(null)
  const [loading, setLoading] = useState(false)
  const [appointments, setAppointments] = useState([])
  const [showAppointments, setShowAppointments] = useState(false)

  const [form, setForm] = useState({ service: '', date: '', time: '', name: '', phone: '' })
  const [errors, setErrors] = useState({})

  const loadStatus = async () => {
    const { data, error } = await supabase.from(QUEUE_TABLE).select('*').order('created_at', { ascending: true })
    if (error) {
      console.warn('Supabase queue status error:', error)
      return
    }

    const rows = data.map(item => ({
      token: item.token ?? item.ticket ?? item.queue_no ?? 'TBD',
      status: item.status ?? 'waiting',
      waitMin: item.wait_min ?? item.waitMin ?? 0,
    }))

    const servingRow = rows.find(r => r.status === 'serving')
    const waiting = rows.filter(r => r.status === 'waiting')
    const avgWait = waiting.length ? Math.max(1, Math.round(waiting.reduce((sum, r) => sum + r.waitMin, 0) / waiting.length)) : 0

    setStatus({
      serving: servingRow ? servingRow.token : '—',
      ahead: waiting.length,
      avgWait,
      lastUpdated: new Date(),
    })
  }

  useEffect(() => {
    loadStatus()

    const channel = supabase.channel('patient-portal-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: QUEUE_TABLE }, () => {
        loadStatus()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo(s => s + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadStatus()
    setSecondsAgo(0)
    setRefreshing(false)
  }

  const validate = () => {
    const e = {}
    if (!form.service) e.service = 'Please select a service.'
    if (!form.date) e.date = 'Please choose a date.'
    if (!form.time) e.time = 'Please select a time slot.'
    if (form.name.trim().length < 2) e.name = 'Please enter your full name.'
    if (!/^09\d{9}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid PH mobile number (09XXXXXXXXX).'
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setLoading(true)

    try {
      // Generate token (e.g., A-001, A-002)
      const randomNum = Math.floor(Math.random() * 100000)
      const token = `A-${String(randomNum).padStart(3, '0')}`

      const { data, error } = await supabase.from(APPOINTMENTS_TABLE).insert([
        {
          token: token,
          name: form.name,
          phone: form.phone,
          service: form.service,
          date: form.date,
          time: form.time,
          status: 'pending',
        },
      ]).select()

      if (error) {
        throw error
      }

      setConfirmed({ token, ...form })
      await loadAppointments(form.phone)
    } catch (error) {
      console.error('Failed to book appointment:', error)
      setErrors({ submit: `Error: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  const loadAppointments = async (phone) => {
    const { data, error } = await supabase.from(APPOINTMENTS_TABLE).select('*').eq('phone', phone)
    if (error) {
      console.warn('Failed to load appointments:', error)
      return
    }
    setAppointments(data || [])
  }

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleViewAppointments = async () => {
    if (!form.phone && !confirmed?.phone) {
      setErrors({ phone: 'Enter your phone number to view appointments' })
      return
    }
    const phone = confirmed?.phone || form.phone
    await loadAppointments(phone)
    setShowAppointments(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '0 1.25rem', height: '56px',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: '8px', background: '#00C9A7',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ color: '#0D1117', fontWeight: 900, fontSize: '0.8rem' }}>W</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}>WaitLess</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Barangay Health Center</div>
        </div>
        <a href="/login" style={{
          fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none',
          padding: '0.375rem 0.75rem', border: '1px solid var(--border)', borderRadius: '0.375rem',
        }}>
          Staff Login
        </a>
        <button className="btn-secondary" onClick={toggle} style={{ padding: '0.375rem', border: 'none' }}>
          {theme === 'dark' ? <IconSun size={17} /> : <IconMoon size={17} />}
        </button>
      </header>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>

        {/* Live Queue Status */}
        <div className="card" style={{
          marginBottom: '1.25rem',
          borderColor: 'color-mix(in srgb, #00C9A7 35%, var(--border))',
          background: 'color-mix(in srgb, #00C9A7 4%, var(--surface))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: '#3DD68C',
                boxShadow: '0 0 6px #3DD68C',
              }} />
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Live Queue Status</span>
            </div>
            <button className="btn-secondary" onClick={handleRefresh} disabled={refreshing}
              style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', gap: '0.375rem' }}>
              <IconRefresh size={13} style={{ animation: refreshing ? 'spin 0.6s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>

          {/* Now Serving */}
          <div style={{ textAlign: 'center', padding: '1rem 0 0.75rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Now Serving
            </p>
            <div className="token token-pulse" style={{
              display: 'inline-block',
              fontSize: '3.5rem', fontWeight: 900, color: '#00C9A7',
              background: 'color-mix(in srgb, #00C9A7 10%, var(--surface))',
              border: '2px solid color-mix(in srgb, #00C9A7 40%, transparent)',
              borderRadius: '1rem', padding: '0.25rem 1.5rem',
              lineHeight: 1.3,
            }}>
              {status.serving}
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <StatPill icon={IconUsers} label="Patients Ahead" value={status.ahead} color="#F5A623" />
            <StatPill icon={IconClock} label="Est. Wait Time" value={`~${status.avgWait} min`} color="#00C9A7" />
          </div>

          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'right' }}>
            Last updated: {secondsAgo < 5 ? 'just now' : `${secondsAgo}s ago`}
          </p>
        </div>

        {/* Booking Form or Confirmation */}
        {confirmed ? (
          <div className="card" style={{
            borderColor: 'color-mix(in srgb, #3DD68C 35%, var(--border))',
            background: 'color-mix(in srgb, #3DD68C 4%, var(--surface))',
          }}>
            <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem' }}>
              <IconCircleCheck size={48} style={{ color: '#3DD68C', marginBottom: '0.75rem' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>Booking Confirmed!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                An SMS confirmation has been sent to your number.
              </p>
            </div>

            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                Your Queue Token
              </p>
              <div className="token" style={{
                display: 'inline-block', fontSize: '3rem', fontWeight: 900, color: '#3DD68C',
                background: 'color-mix(in srgb, #3DD68C 10%, var(--surface))',
                border: '2px solid color-mix(in srgb, #3DD68C 40%, transparent)',
                borderRadius: '1rem', padding: '0.25rem 1.5rem', lineHeight: 1.3,
              }}>
                {confirmed.token}
              </div>
            </div>

            <div className="card-2" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                ['Service', confirmed.service],
                ['Date', confirmed.date],
                ['Time', confirmed.time],
                ['Name', confirmed.name],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: '1rem', padding: '0.75rem', borderRadius: '0.5rem',
              background: 'color-mix(in srgb, #F5A623 10%, transparent)',
              border: '1px solid color-mix(in srgb, #F5A623 30%, transparent)',
              fontSize: '0.8rem', color: '#F5A623', display: 'flex', gap: '0.5rem',
            }}>
              <IconAlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              Please arrive 10 minutes before your scheduled time and bring a valid ID.
            </div>

            <button className="btn-secondary" onClick={() => { setConfirmed(null); setForm({ service: '', date: '', time: '', name: '', phone: '' }) }}
              style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}>
              Book Another Appointment
            </button>
          </div>
        ) : (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <IconCalendarPlus size={18} style={{ color: '#00C9A7' }} />
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Book an Appointment</h2>
            </div>

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Service */}
              <div>
                <FieldLabel required>Service Type</FieldLabel>
                <InputIcon icon={IconStethoscope} error={errors.service}>
                  <select className={`input-field ${errors.service ? 'error' : ''}`}
                    style={{ paddingLeft: '2.25rem', appearance: 'none', cursor: 'pointer' }}
                    value={form.service} onChange={set('service')}>
                    <option value="">Select a service...</option>
                    {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </InputIcon>
              </div>

              {/* Date */}
              <div>
                <FieldLabel required>Preferred Date</FieldLabel>
                <InputIcon icon={IconCalendar} error={errors.date}>
                  <input className={`input-field ${errors.date ? 'error' : ''}`}
                    style={{ paddingLeft: '2.25rem' }}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={form.date} onChange={set('date')} />
                </InputIcon>
              </div>

              {/* Time Slots */}
              <div>
                <FieldLabel required>Available Time Slots</FieldLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {TIME_SLOTS.map(t => (
                    <button key={t} type="button" onClick={() => setForm(f => ({ ...f, time: t }))}
                      style={{
                        padding: '0.375rem 0.875rem', borderRadius: '9999px', fontSize: '0.8rem',
                        fontWeight: 500, cursor: 'pointer', border: '1px solid',
                        borderColor: form.time === t ? '#00C9A7' : 'var(--border)',
                        background: form.time === t ? 'color-mix(in srgb, #00C9A7 15%, transparent)' : 'transparent',
                        color: form.time === t ? '#00C9A7' : 'var(--text-muted)',
                        transition: 'all 0.15s ease',
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
                {errors.time && <p style={{ color: '#FF5F5F', fontSize: '0.72rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IconAlertCircle size={12} />{errors.time}
                </p>}
              </div>

              {/* Name */}
              <div>
                <FieldLabel required>Full Name</FieldLabel>
                <InputIcon icon={IconUser} error={errors.name}>
                  <input className={`input-field ${errors.name ? 'error' : ''}`}
                    style={{ paddingLeft: '2.25rem' }}
                    type="text" placeholder="e.g. Juan dela Cruz"
                    value={form.name} onChange={set('name')} />
                </InputIcon>
              </div>

              {/* Phone */}
              <div>
                <FieldLabel required>Mobile Number</FieldLabel>
                <InputIcon icon={IconPhone} error={errors.phone}>
                  <input className={`input-field ${errors.phone ? 'error' : ''}`}
                    style={{ paddingLeft: '2.25rem' }}
                    type="tel" placeholder="09XX XXX XXXX"
                    value={form.phone} onChange={set('phone')} />
                </InputIcon>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Used for SMS confirmation only.
                </p>
              </div>

              <button className="btn-primary" type="submit" disabled={loading}
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                {loading ? <><span className="spinner" /> Confirming...</> : <><IconCalendarPlus size={16} /> Confirm Appointment</>}
              </button>
            </form>
          </div>
        )}

        {/* My Appointments List */}
        <div className="card" style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IconCalendarPlus size={18} style={{ color: '#00C9A7' }} />
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>My Appointments</h2>
            </div>
            <button className="btn-secondary" onClick={handleViewAppointments}
              style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
              Load My Appointments
            </button>
          </div>

          {showAppointments ? (
            appointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                <IconInbox size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.875rem' }}>No appointments found.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {appointments.map(appt => {
                  const statusColor = {
                    pending: '#F5A623',
                    confirmed: '#00C9A7',
                    completed: '#3DD68C',
                    cancelled: '#FF5F5F',
                  }[appt.status] || '#8B949E'
                  
                  return (
                    <div key={appt.id} className="card-2" style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.75rem 1rem',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                          {appt.service}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <IconCalendar size={12} />{appt.date}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <IconClock size={12} />{appt.time}
                          </span>
                        </div>
                      </div>
                      <div style={{
                        padding: '0.375rem 0.75rem', borderRadius: '0.375rem',
                        background: `color-mix(in srgb, ${statusColor} 15%, transparent)`,
                        color: statusColor, fontSize: '0.75rem', fontWeight: 600,
                        textTransform: 'capitalize',
                      }}>
                        {appt.status}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
              Click "Load My Appointments" and enter your phone number to see your bookings.
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)', padding: '1.25rem',
        textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem',
        background: 'var(--surface)',
      }}>
        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Barangay Health Center</p>
        <p>Monday – Friday &nbsp;·&nbsp; 8:00 AM – 5:00 PM &nbsp;·&nbsp; <a href="/login" style={{ color: '#00C9A7', textDecoration: 'none' }}>Staff Login</a></p>
      </footer>
    </div>
  )
}
