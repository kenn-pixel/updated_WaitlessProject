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

    alter table public.queue
    add column if not exists phone text;

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

-- Clinic settings table for operating hours and other admin-managed site values
create table if not exists public.clinic_settings (
    key text primary key,
    open_time text not null default '08:00',
    close_time text not null default '17:00',
    operating_days text not null default '1,2,3,4,5',
    updated_at timestamptz not null default now()
    );

-- Disable RLS for demo purposes (allow all operations)
alter table public.queue disable row level security;
alter table public.appointments disable row level security;
alter table public.clinic_settings disable row level security;
