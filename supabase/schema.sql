-- Turn-Token core schema, per PRD_Turn_Token.md section 10.
-- Run in the Supabase SQL editor, or via `supabase db push`.

create extension if not exists "pgcrypto";

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete set null,
  name text not null,
  category text not null,
  contact_email text not null,
  contact_phone text,
  grace_timer_minutes int not null default 5,
  hold_window_minutes int not null default 15,
  active_counters int not null default 1,
  default_service_time_minutes int not null default 10,
  almost_up_threshold int not null default 2,
  is_paused boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists counters (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  label text not null,
  active boolean not null default true
);

create type token_status as enum (
  'waiting', 'called', 'serving', 'done',
  'skipped', 'restored', 'expired', 'cancelled'
);

create table if not exists tokens (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  position int not null,
  status token_status not null default 'waiting',
  service_type text,
  created_at timestamptz not null default now(),
  called_at timestamptz,
  served_at timestamptz,
  skipped_at timestamptz,
  restored_at timestamptz,
  expired_at timestamptz
);

create index if not exists tokens_business_position_idx on tokens (business_id, position);
create index if not exists tokens_business_status_idx on tokens (business_id, status);

create table if not exists notification_log (
  id uuid primary key default gen_random_uuid(),
  token_id uuid not null references tokens (id) on delete cascade,
  channel text not null,
  type text not null,
  sent_at timestamptz not null default now(),
  delivery_status text not null default 'sent'
);

-- One browser push subscription per token; the customer opts in from their
-- own status page, so this needs no owner/session context to write.
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  token_id uuid not null references tokens (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique (token_id, endpoint)
);

create table if not exists daily_analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  date date not null,
  customers_served int not null default 0,
  average_wait_minutes numeric not null default 0,
  peak_hour int,
  no_show_count int not null default 0,
  no_show_rate numeric not null default 0,
  unique (business_id, date)
);

-- Row Level Security: owners manage their own business; the queue and
-- token status endpoints are read via the service role from the backend,
-- so customer-facing reads do not require a Supabase session. The one
-- exception is the owner dashboard's live queue, which subscribes to
-- Realtime directly as the authenticated owner and relies on this same
-- policy to scope which row changes it is allowed to receive.
alter table businesses enable row level security;
alter table counters enable row level security;
alter table tokens enable row level security;
alter table notification_log enable row level security;
alter table daily_analytics_snapshots enable row level security;
alter table push_subscriptions enable row level security;

create policy "Owners manage their own business" on businesses
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "Owners manage their own counters" on counters
  for all using (
    exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid())
  );

create policy "Owners manage their own tokens" on tokens
  for all using (
    exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid())
  );

-- No policy is defined for push_subscriptions or notification_log: both
-- are written and read only via the backend's service-role key, never
-- directly from the browser, so RLS enabled with zero policies denies
-- all client access by default while the backend still bypasses it.

-- Enable Realtime replication so the owner dashboard can subscribe to
-- token changes directly (scoped by the RLS policy above) instead of
-- polling.
alter publication supabase_realtime add table tokens;
