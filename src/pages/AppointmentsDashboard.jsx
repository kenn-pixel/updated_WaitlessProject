import { useState } from 'react'
import { modals } from '@mantine/modals'
import {
  IconCalendarEvent, IconSearch, IconFilter,
  IconCircleCheck, IconX, IconClock, IconStethoscope,
  IconPhone, IconUser, IconInbox,
} from '@tabler/icons-react'
import DashboardLayout from '../components/DashboardLayout'

const MOCK_APPOINTMENTS = [
  { id: 1, token: 'A-041', name: 'Maria Santos',   phone: '09171234567', service: 'Consultation', date: '2025-07-14', time: '8:00 AM',  status: 'pending' },
  { id: 2, token: 'A-042', name: 'Jose Reyes',     phone: '09281234567', service: 'Vaccination',  date: '2025-07-14', time: '9:00 AM',  status: 'confirmed' },
  { id: 3, token: 'A-043', name: 'Ana Cruz',       phone: '09391234567', service: 'Prenatal',     date: '2025-07-14', time: '10:00 AM', status: 'pending' },
  { id: 4, token: 'A-044', name: 'Pedro Lim',      phone: '09451234567', service: 'Lab Request',  date: '2025-07-15', time: '8:00 AM',  status: 'completed' },
  { id: 5, token: 'A-045', name: 'Rosa Dela Cruz', phone: '09561234567', service: 'Dental',       date: '2025-07-15', time: '2:00 PM',  status: 'cancelled' },
  { id: 6, token: 'A-046', name: 'Carlos Bautista',phone: '09671234567', service: 'Consultation', date: '2025-07-16', time: '11:00 AM', status: 'pending' },
]

const STATUS_META = {
  pending:   { label: 'Pending',   color: '#F5A623', cls: 'badge-warning' },
  confirmed: { label: 'Confirmed', color: '#00C9A7', cls: 'badge-primary' },
  completed: { label: 'Completed', color: '#3DD68C', cls: 'badge-success' },
  cancelled: { label: 'Cancelled', color: '#FF5F5F', cls: 'badge-error'   },
}

const SERVICES = ['All Services', 'Consultation', 'Vaccination', 'Prenatal', 'Lab Request', 'Dental']

export default function AppointmentsDashboard() {
  'use no memo'
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS)
  const [search, setSearch] = useState('')
  const [filterService, setFilterService] = useState('All Services')
  const [filterDate, setFilterDate] = useState('')
  const [busyId, setBusyId] = useState(null)

  const filtered = appointments.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.token.includes(search.toUpperCase())
    const matchService = filterService === 'All Services' || a.service === filterService
    const matchDate = !filterDate || a.date === filterDate
    return matchSearch && matchService && matchDate
  })

  const updateStatus = async (id, status) => {
    setBusyId(id)
    await new Promise(r => setTimeout(r, 700))
    setAppointments(list => list.map(a => a.id === id ? { ...a, status } : a))
    setBusyId(null)
  }

  const confirmCancel = (appt) => {
    modals.openConfirmModal({
      title: 'Cancel Appointment',
      children: (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Cancel appointment for <strong style={{ color: 'var(--text)' }}>{appt.name}</strong> ({appt.token})?
          This action cannot be undone.
        </p>
      ),
      labels: { confirm: 'Yes, Cancel', cancel: 'Keep' },
      confirmProps: { color: 'red' },
      onConfirm: () => updateStatus(appt.id, 'cancelled'),
    })
  }

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Appointments</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manage and track all patient appointments.</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <IconSearch size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-field" style={{ paddingLeft: '2.25rem' }}
            placeholder="Search by name or token..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={{ position: 'relative', flex: '1 1 160px' }}>
          <IconStethoscope size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <select className="input-field" style={{ paddingLeft: '2.25rem', appearance: 'none', cursor: 'pointer' }}
            value={filterService} onChange={e => setFilterService(e.target.value)}>
            {SERVICES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ position: 'relative', flex: '1 1 160px' }}>
          <IconFilter size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-field" style={{ paddingLeft: '2.25rem' }}
            type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        </div>

        {(search || filterDate || filterService !== 'All Services') && (
          <button className="btn-secondary" style={{ fontSize: '0.75rem' }}
            onClick={() => { setSearch(''); setFilterDate(''); setFilterService('All Services') }}>
            <IconX size={13} />Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <IconInbox size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.875rem' }}>No appointments found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                  {['Token', 'Patient', 'Service', 'Date & Time', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => {
                  const meta = STATUS_META[a.status]
                  const busy = busyId === a.id
                  return (
                    <tr key={a.id} style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.1s ease',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className="token" style={{ color: '#00C9A7', fontWeight: 700 }}>{a.token}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600 }}>{a.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <IconPhone size={10} />{a.phone}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          <IconStethoscope size={12} />{a.service}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 500 }}>{a.date}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <IconClock size={10} />{a.time}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className={`badge ${meta.cls}`}>{meta.label}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          {a.status === 'pending' && (
                            <button className="btn-primary" disabled={busy}
                              style={{ padding: '0.25rem 0.625rem', fontSize: '0.72rem' }}
                              onClick={() => updateStatus(a.id, 'confirmed')}>
                              {busy ? <span className="spinner" /> : <><IconCircleCheck size={12} />Confirm</>}
                            </button>
                          )}
                          {a.status === 'confirmed' && (
                            <button className="btn-success" disabled={busy}
                              style={{ padding: '0.25rem 0.625rem', fontSize: '0.72rem' }}
                              onClick={() => updateStatus(a.id, 'completed')}>
                              {busy ? <span className="spinner" /> : <><IconCircleCheck size={12} />Complete</>}
                            </button>
                          )}
                          {(a.status === 'pending' || a.status === 'confirmed') && (
                            <button className="btn-danger" disabled={busy}
                              style={{ padding: '0.25rem 0.625rem', fontSize: '0.72rem' }}
                              onClick={() => confirmCancel(a)}>
                              <IconX size={12} />Cancel
                            </button>
                          )}
                          {(a.status === 'completed' || a.status === 'cancelled') && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
