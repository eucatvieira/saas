-- ============================================================
-- SecretarIA — Schema Supabase
-- Rodar no SQL Editor do Supabase na ordem abaixo
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- CLINICS
-- ============================================================
create table public.clinics (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  name                    text not null,
  phone                   text not null,
  zapi_instance_id        text,
  zapi_token              text,
  zapi_client_token       text,
  plan                    text not null default 'trial' check (plan in ('trial','basic','pro','elite')),
  plan_status             text not null default 'trial' check (plan_status in ('active','inactive','trial')),
  stripe_customer_id      text,
  stripe_subscription_id  text,
  google_calendar_token   jsonb,
  google_calendar_id      text,
  business_hours          jsonb not null default '{
    "monday":    {"open": "08:00", "close": "18:00", "enabled": true},
    "tuesday":   {"open": "08:00", "close": "18:00", "enabled": true},
    "wednesday": {"open": "08:00", "close": "18:00", "enabled": true},
    "thursday":  {"open": "08:00", "close": "18:00", "enabled": true},
    "friday":    {"open": "08:00", "close": "18:00", "enabled": true},
    "saturday":  {"open": "08:00", "close": "13:00", "enabled": false},
    "sunday":    {"open": "08:00", "close": "12:00", "enabled": false}
  }',
  onboarding_completed    boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.clinics enable row level security;

create policy "clinic owner full access"
  on public.clinics for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- SERVICES
-- ============================================================
create table public.services (
  id               uuid primary key default uuid_generate_v4(),
  clinic_id        uuid not null references public.clinics(id) on delete cascade,
  name             text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price            numeric(10,2) not null check (price >= 0),
  description      text,
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

alter table public.services enable row level security;

create policy "clinic owner manages services"
  on public.services for all
  using (
    exists (select 1 from public.clinics where id = clinic_id and user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.clinics where id = clinic_id and user_id = auth.uid())
  );

-- ============================================================
-- PROFESSIONALS
-- ============================================================
create table public.professionals (
  id          uuid primary key default uuid_generate_v4(),
  clinic_id   uuid not null references public.clinics(id) on delete cascade,
  name        text not null,
  specialties text[] not null default '{}',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.professionals enable row level security;

create policy "clinic owner manages professionals"
  on public.professionals for all
  using (
    exists (select 1 from public.clinics where id = clinic_id and user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.clinics where id = clinic_id and user_id = auth.uid())
  );

-- ============================================================
-- CLIENTS
-- ============================================================
create table public.clients (
  id                    uuid primary key default uuid_generate_v4(),
  clinic_id             uuid not null references public.clinics(id) on delete cascade,
  name                  text,
  whatsapp              text not null,
  total_appointments    integer not null default 0,
  last_appointment_at   timestamptz,
  reactivation_sent_at  timestamptz,
  created_at            timestamptz not null default now(),
  unique (clinic_id, whatsapp)
);

alter table public.clients enable row level security;

create policy "clinic owner manages clients"
  on public.clients for all
  using (
    exists (select 1 from public.clinics where id = clinic_id and user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.clinics where id = clinic_id and user_id = auth.uid())
  );

-- ============================================================
-- APPOINTMENTS
-- ============================================================
create table public.appointments (
  id                       uuid primary key default uuid_generate_v4(),
  clinic_id                uuid not null references public.clinics(id) on delete cascade,
  client_id                uuid not null references public.clients(id) on delete cascade,
  service_id               uuid not null references public.services(id),
  professional_id          uuid not null references public.professionals(id),
  scheduled_at             timestamptz not null,
  status                   text not null default 'pending'
                             check (status in ('pending','confirmed','cancelled','no_show','completed')),
  reminder_sent            boolean not null default false,
  google_calendar_event_id text,
  notes                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index appointments_clinic_scheduled_idx on public.appointments(clinic_id, scheduled_at);
create index appointments_reminder_idx on public.appointments(scheduled_at, reminder_sent) where status = 'pending';

alter table public.appointments enable row level security;

create policy "clinic owner manages appointments"
  on public.appointments for all
  using (
    exists (select 1 from public.clinics where id = clinic_id and user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.clinics where id = clinic_id and user_id = auth.uid())
  );

-- ============================================================
-- MESSAGES
-- ============================================================
create table public.messages (
  id                uuid primary key default uuid_generate_v4(),
  clinic_id         uuid not null references public.clinics(id) on delete cascade,
  client_id         uuid references public.clients(id) on delete set null,
  whatsapp          text not null,
  direction         text not null check (direction in ('inbound','outbound')),
  content           text not null,
  zapi_message_id   text,
  created_at        timestamptz not null default now()
);

create index messages_clinic_whatsapp_idx on public.messages(clinic_id, whatsapp, created_at desc);

alter table public.messages enable row level security;

create policy "clinic owner reads messages"
  on public.messages for all
  using (
    exists (select 1 from public.clinics where id = clinic_id and user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.clinics where id = clinic_id and user_id = auth.uid())
  );

-- ============================================================
-- BOT SESSIONS
-- ============================================================
create table public.bot_sessions (
  id          uuid primary key default uuid_generate_v4(),
  clinic_id   uuid not null references public.clinics(id) on delete cascade,
  whatsapp    text not null,
  state       text not null default 'idle'
              check (state in ('idle','selecting_service','selecting_professional',
                               'selecting_date','selecting_time','confirming','human_takeover')),
  context     jsonb not null default '{}',
  updated_at  timestamptz not null default now(),
  unique (clinic_id, whatsapp)
);

alter table public.bot_sessions enable row level security;

-- Bot sessions are written by the backend service role, not by the logged-in user.
-- The backend uses the service_role key so RLS doesn't block it.
-- The clinic owner can read sessions via the panel (select only).
create policy "clinic owner reads bot sessions"
  on public.bot_sessions for select
  using (
    exists (select 1 from public.clinics where id = clinic_id and user_id = auth.uid())
  );

-- ============================================================
-- FAQ ITEMS
-- ============================================================
create table public.faq_items (
  id          uuid primary key default uuid_generate_v4(),
  clinic_id   uuid not null references public.clinics(id) on delete cascade,
  question    text not null,
  answer      text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.faq_items enable row level security;

create policy "clinic owner manages faq"
  on public.faq_items for all
  using (
    exists (select 1 from public.clinics where id = clinic_id and user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.clinics where id = clinic_id and user_id = auth.uid())
  );

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger clinics_updated_at
  before update on public.clinics
  for each row execute function public.set_updated_at();

create trigger appointments_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

create trigger bot_sessions_updated_at
  before update on public.bot_sessions
  for each row execute function public.set_updated_at();

-- ============================================================
-- TRIGGER: incrementa total_appointments no client
-- ============================================================
create or replace function public.increment_client_appointments()
returns trigger language plpgsql as $$
begin
  if new.status = 'completed' and (old.status is null or old.status <> 'completed') then
    update public.clients
    set
      total_appointments  = total_appointments + 1,
      last_appointment_at = new.scheduled_at
    where id = new.client_id;
  end if;
  return new;
end;
$$;

create trigger appointments_completed_trigger
  after insert or update on public.appointments
  for each row execute function public.increment_client_appointments();
