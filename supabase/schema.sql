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

-- A service the business offers (e.g. "Haircut", "Beard trim"), with an
-- estimated duration used both as the cold-start ETA and as the customer
-- facing menu on the join page. Deactivating (rather than deleting) keeps
-- history in token_services intact for the rolling-average calculation.
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  name text not null,
  estimated_minutes int not null default 10,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Restricts a counter to a subset of services (e.g. a massage table that
-- can't also cut hair). No rows for a counter means it is unrestricted and
-- can serve any service — this is the default for a freshly created
-- counter, matching how most single-purpose-counter businesses work.
create table if not exists counter_services (
  counter_id uuid not null references counters (id) on delete cascade,
  service_id uuid not null references services (id) on delete cascade,
  primary key (counter_id, service_id)
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
  counter_id uuid references counters (id) on delete set null,
  created_at timestamptz not null default now(),
  called_at timestamptz,
  served_at timestamptz,
  skipped_at timestamptz,
  restored_at timestamptz,
  expired_at timestamptz
);

-- Which services a customer picked for this token, snapshotted by name and
-- duration at booking time so a later rename/re-estimate of the service
-- doesn't rewrite history. A token with no rows here is a plain,
-- catalog-less ticket (the default_service_time_minutes fallback applies).
create table if not exists token_services (
  id uuid primary key default gen_random_uuid(),
  token_id uuid not null references tokens (id) on delete cascade,
  service_id uuid references services (id) on delete set null,
  service_name text not null,
  estimated_minutes int not null,
  created_at timestamptz not null default now()
);
create index if not exists token_services_token_idx on token_services (token_id);

-- One business per owner account, and one business per contact email/phone.
-- The API already rejects these duplicates before insert/update (see
-- app/routers/business.py); these indexes are the DB-level backstop in
-- case of a race or a write that bypasses the API.
create unique index if not exists businesses_owner_id_unique_idx
  on businesses (owner_id) where owner_id is not null;
create unique index if not exists businesses_contact_email_unique_idx
  on businesses (contact_email);
create unique index if not exists businesses_contact_phone_unique_idx
  on businesses (contact_phone) where contact_phone is not null;

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
alter table services enable row level security;
alter table counter_services enable row level security;
alter table tokens enable row level security;
alter table token_services enable row level security;
alter table notification_log enable row level security;
alter table daily_analytics_snapshots enable row level security;
alter table push_subscriptions enable row level security;

create policy "Owners manage their own business" on businesses
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "Owners manage their own counters" on counters
  for all using (
    exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid())
  );

create policy "Owners manage their own services" on services
  for all using (
    exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid())
  );

create policy "Owners manage their own counter_services" on counter_services
  for all using (
    exists (
      select 1 from counters c
      join businesses b on b.id = c.business_id
      where c.id = counter_id and b.owner_id = auth.uid()
    )
  );

create policy "Owners manage their own tokens" on tokens
  for all using (
    exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid())
  );

-- No policy is defined for token_services: like push_subscriptions, it is
-- written and read only via the backend's service-role key (customers add
-- rows anonymously when issuing a token, and owners never write it
-- directly), so RLS enabled with zero policies denies direct client access.

-- No policy is defined for push_subscriptions or notification_log: both
-- are written and read only via the backend's service-role key, never
-- directly from the browser, so RLS enabled with zero policies denies
-- all client access by default while the backend still bypasses it.

-- Enable Realtime replication so the owner dashboard can subscribe to
-- token changes directly (scoped by the RLS policy above) instead of
-- polling.
alter publication supabase_realtime add table tokens;
