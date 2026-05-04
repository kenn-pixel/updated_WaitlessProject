    -- Supabase schema for WaitLess frontend

    -- Queue table
    create table if not exists public.queue (
    id bigint generated always as identity primary key,
    token text not null,
    name text not null,
    service text not null,
    priority text not null default 'normal',
    wait_min integer not null default 0,
    created_at timestamptz not null default now()
    );

    alter table public.queue
    add column if not exists status text not null default 'waiting';

    alter table public.queue
    add column if not exists position integer not null default 0;

    -- Appointments table
    create table if not exists public.appointments (
    id bigint generated always as identity primary key,
    token text not null,
    name text not null,
    phone text,
    service text not null,
    date date not null,
    time text,
    status text not null default 'pending',
    created_at timestamptz not null default now()
    );

-- Disable RLS for demo purposes (allow all operations)
alter table public.queue disable row level security;
alter table public.appointments disable row level security;

-- Sample queue data
insert into public.queue (token, name, service, priority, wait_min, status, position)
values
  ('A-003', 'Maria Santos', 'Consultation', 'urgent', 35, 'serving', 1),
  ('A-004', 'Jose Reyes', 'Vaccination', 'senior', 28, 'waiting', 2),
  ('A-005', 'Ana Cruz', 'Prenatal', 'normal', 22, 'waiting', 3),
  ('A-006', 'Pedro Lim', 'Lab Request', 'pwd', 18, 'waiting', 4),
  ('A-007', 'Rosa Dela Cruz', 'Dental', 'normal', 12, 'waiting', 5);

-- Sample appointments data
insert into public.appointments (token, name, phone, service, date, time, status)
values
  ('A-041', 'Maria Santos', '09171234567', 'Consultation', '2025-07-14', '08:00 AM', 'pending'),
  ('A-042', 'Jose Reyes', '09281234567', 'Vaccination', '2025-07-14', '09:00 AM', 'confirmed'),
  ('A-043', 'Ana Cruz', '09391234567', 'Prenatal', '2025-07-14', '10:00 AM', 'pending'),
  ('A-044', 'Pedro Lim', '09451234567', 'Lab Request', '2025-07-15', '08:00 AM', 'completed'),
  ('A-045', 'Rosa Dela Cruz', '09561234567', 'Dental', '2025-07-15', '02:00 PM', 'cancelled');
