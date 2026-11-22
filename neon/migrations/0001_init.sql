-- Roots n Style: full schema, views and row level security for Neon Postgres.
-- STATUS: WRITTEN, NOT APPLIED. Nothing in the app runs this yet.
--
-- Before applying to a Neon branch:
--   1. Enable the Neon Data API on the branch (it provides auth.user_id() and the
--      `anonymous` and `authenticated` roles used by the policies below).
--   2. Create a login role named app_service in the Neon console (the server route handlers
--      connect as this role using DATABASE_URL). It is granted only what it needs, below.
--   3. Apply with: psql "$DIRECT_DATABASE_URL" -f neon/migrations/0001_init.sql
--
-- Times are salon wall clock (America/Toronto), stored as `timestamp` without time zone,
-- exactly like the app does. created_at columns use timestamptz.

begin;

create extension if not exists btree_gist;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tables

create table public.profiles (
  id             uuid primary key default gen_random_uuid(),
  auth_user_id   text not null unique,          -- Neon Auth user id (auth.user_id())
  display_name   text not null,
  role           text not null default 'frontdesk' check (role in ('owner', 'frontdesk')),
  created_at     timestamptz not null default now()
);

create table public.service_categories (
  id     text primary key check (id in ('hair', 'skin', 'brows', 'makeup')),
  label  text not null,
  sort   integer not null default 0
);

create table public.services (
  id            text primary key,
  category_id   text not null references public.service_categories (id),
  name          text not null check (char_length(name) between 2 and 80),
  description   text not null default '' check (char_length(description) <= 240),
  price         numeric(7, 2) check (price is null or price between 0 and 5000),   -- null = not set yet
  duration_min  integer check (duration_min is null or duration_min between 15 and 600), -- null = not set yet
  visible       boolean not null default true,
  sort          integer not null default 0
);
create index services_category_sort on public.services (category_id, sort);

create table public.clients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       char(10) not null unique check (phone ~ '^[0-9]{10}$'),
  email       text,
  created_at  timestamptz not null default now()
);

create table public.bookings (
  id                uuid primary key default gen_random_uuid(),
  service_id        text not null references public.services (id),
  client_id         uuid references public.clients (id),
  start_at          timestamp not null,
  duration_min      integer not null check (duration_min between 15 and 600),  -- copied from the service at booking time (60 when unset)
  end_at            timestamp generated always as (start_at + make_interval(mins => duration_min)) stored,
  name              text not null check (char_length(name) between 2 and 80),
  phone             char(10) not null check (phone ~ '^[0-9]{10}$'),
  email             text check (email is null or char_length(email) <= 120),
  note              text check (note is null or char_length(note) <= 500),
  marketing_opt_in  boolean not null default false,   -- CASL: opt in only, never pre-ticked
  status            text not null default 'new' check (status in ('new', 'confirmed', 'declined', 'done', 'cancelled')),
  suggested_start   timestamp,
  created_at        timestamptz not null default now(),
  -- Two confirmed bookings can never overlap (single chair). The route also checks first
  -- so the visitor gets a friendly message, but this is the real guarantee.
  constraint bookings_no_double_confirm
    exclude using gist (tsrange(start_at, end_at) with &&) where (status = 'confirmed')
);
create index bookings_start on public.bookings (start_at);
create index bookings_status on public.bookings (status, start_at);
create index bookings_phone on public.bookings (phone);
-- Cheap second guard: the same start cannot be confirmed twice.
create unique index bookings_one_confirmed_per_start on public.bookings (start_at) where status = 'confirmed';

create table public.gallery_photos (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (char_length(title) between 1 and 80),
  tag           text not null check (tag in ('colour', 'styling', 'cuts')),
  storage_key   text not null,                    -- key in Neon object storage, never a public hotlink
  alt           text not null check (char_length(alt) between 3 and 200),
  visible       boolean not null default true,
  sort          integer not null default 0,
  consent_ok    boolean not null default false,   -- the client agreed to share this photo
  created_at    timestamptz not null default now()
);

create table public.hours (
  day         smallint primary key check (day between 0 and 6),  -- 0 = Sunday
  open_time   time not null,
  close_time  time not null,
  closed      boolean not null default false,
  check (closed or open_time < close_time)
);

create table public.settings (
  id                 smallint primary key default 1 check (id = 1),
  accept_online      boolean not null default true,
  notify_owner       boolean not null default true,
  auto_confirm       boolean not null default false,
  contact_phone      text not null,
  contact_email      text not null,
  contact_address    text not null,
  contact_instagram  text not null default ''
);

create table public.sent_messages (
  id          uuid primary key default gen_random_uuid(),
  channel     text not null check (channel in ('sms', 'email')),
  kind        text not null,
  to_address  text not null,
  to_label    text not null,
  subject     text,
  body        text not null,
  booking_id  uuid references public.bookings (id) on delete set null,
  provider_id text,                                -- Twilio or Resend message id once live
  created_at  timestamptz not null default now()
);
create index sent_messages_created on public.sent_messages (created_at desc);

create table public.audit_log (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  actor      text not null default coalesce(current_setting('app.actor', true), 'system'),
  action     text not null,
  entity     text not null,
  entity_id  text,
  detail     jsonb
);

-- ---------------------------------------------------------------- audit trigger

create function public.audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log (action, entity, entity_id, detail)
  values (
    tg_op, tg_table_name,
    coalesce((to_jsonb(new) ->> 'id'), (to_jsonb(old) ->> 'id')),
    case tg_op
      when 'DELETE' then to_jsonb(old)
      when 'INSERT' then jsonb_build_object('new', to_jsonb(new) - 'email' - 'phone' - 'note')
      else jsonb_build_object('old', to_jsonb(old) - 'email' - 'phone' - 'note', 'new', to_jsonb(new) - 'email' - 'phone' - 'note')
    end
  );
  return null;
end $$;

create trigger audit_bookings after insert or update or delete on public.bookings for each row execute function public.audit_row();
create trigger audit_services after insert or update or delete on public.services for each row execute function public.audit_row();
create trigger audit_gallery after insert or update or delete on public.gallery_photos for each row execute function public.audit_row();
create trigger audit_hours after insert or update or delete on public.hours for each row execute function public.audit_row();
create trigger audit_settings after update on public.settings for each row execute function public.audit_row();

-- ---------------------------------------------------------------- public views
-- The public site reads ONLY through these. They expose visible rows and no personal data.

create view public.public_services as
  select s.id, s.category_id as category, s.name, s.description, s.price, s.duration_min as "durationMin", s.sort
  from public.services s where s.visible;

create view public.public_gallery_photos as
  select g.id, g.title, g.tag, g.storage_key, g.alt, g.sort
  from public.gallery_photos g where g.visible and g.consent_ok;

create view public.public_hours as
  select day, open_time, close_time, closed from public.hours;

create view public.public_settings as
  select accept_online, contact_phone, contact_email, contact_address, contact_instagram
  from public.settings where id = 1;

-- Which times are taken, with no names, phones or notes.
create view public.busy_intervals as
  select start_at, end_at from public.bookings where status = 'confirmed' and end_at >= now()::timestamp - interval '1 day';

-- ---------------------------------------------------------------- roles and grants
-- anonymous / authenticated come from the Neon Data API. app_service is the server role.

do $$ begin
  if exists (select from pg_roles where rolname = 'anonymous') then
    grant usage on schema public to anonymous;
    grant select on public.service_categories, public.public_services, public.public_gallery_photos,
                    public.public_hours, public.public_settings, public.busy_intervals to anonymous;
  end if;
  if exists (select from pg_roles where rolname = 'authenticated') then
    grant usage on schema public to authenticated;
    grant select on all tables in schema public to authenticated;
    grant insert, update on public.services, public.gallery_photos, public.hours, public.settings to authenticated;
    grant update on public.bookings to authenticated;
    grant insert on public.sent_messages to authenticated;
  end if;
  if exists (select from pg_roles where rolname = 'app_service') then
    -- The server route handlers. Creates bookings (never the browser), writes the sent log.
    grant usage on schema public to app_service;
    grant select on all tables in schema public to app_service;
    grant insert, update on public.bookings, public.clients to app_service;
    grant insert on public.sent_messages, public.audit_log to app_service;
    grant update on public.sent_messages to app_service;
  end if;
end $$;

-- Staff may never edit or delete the audit trail.
revoke update, delete, truncate on public.audit_log from public;

-- ---------------------------------------------------------------- row level security

alter table public.profiles          enable row level security;
alter table public.service_categories enable row level security;
alter table public.services          enable row level security;
alter table public.clients           enable row level security;
alter table public.bookings          enable row level security;
alter table public.gallery_photos    enable row level security;
alter table public.hours             enable row level security;
alter table public.settings          enable row level security;
alter table public.sent_messages     enable row level security;
alter table public.audit_log         enable row level security;

-- Who is calling? Reads the role from profiles using the Neon Auth user id.
create function public.staff_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where auth_user_id = auth.user_id()
$$;

create policy profiles_self_read   on public.profiles for select to authenticated using (auth_user_id = auth.user_id() or public.staff_role() = 'owner');
create policy profiles_owner_write on public.profiles for all    to authenticated using (public.staff_role() = 'owner') with check (public.staff_role() = 'owner');

-- Anonymous visitors may read category labels (not secret) and nothing else directly.
create policy categories_read on public.service_categories for select to anonymous, authenticated using (true);

create policy services_staff_read   on public.services for select to authenticated using (public.staff_role() is not null);
create policy services_owner_write  on public.services for all    to authenticated using (public.staff_role() = 'owner') with check (public.staff_role() = 'owner');

create policy clients_staff_read    on public.clients  for select to authenticated using (public.staff_role() is not null);

-- Bookings: staff read and update. INSERT has no policy for anonymous or authenticated on purpose.
-- Bookings are created by the server route using app_service (which bypasses RLS by grant), never by a browser.
create policy bookings_staff_read   on public.bookings for select to authenticated using (public.staff_role() is not null);
create policy bookings_staff_update on public.bookings for update to authenticated using (public.staff_role() is not null) with check (public.staff_role() is not null);

create policy gallery_staff_read    on public.gallery_photos for select to authenticated using (public.staff_role() is not null);
create policy gallery_staff_write   on public.gallery_photos for all    to authenticated using (public.staff_role() is not null) with check (public.staff_role() is not null);

create policy hours_staff_read      on public.hours for select to authenticated using (public.staff_role() is not null);
create policy hours_owner_write     on public.hours for all    to authenticated using (public.staff_role() = 'owner') with check (public.staff_role() = 'owner');

create policy settings_staff_read   on public.settings for select to authenticated using (public.staff_role() is not null);
create policy settings_owner_write  on public.settings for update to authenticated using (public.staff_role() = 'owner') with check (public.staff_role() = 'owner');

create policy sent_staff_read       on public.sent_messages for select to authenticated using (public.staff_role() is not null);
create policy sent_staff_insert     on public.sent_messages for insert to authenticated with check (public.staff_role() is not null);

create policy audit_owner_read      on public.audit_log for select to authenticated using (public.staff_role() = 'owner');

-- app_service needs to see rows the views and routes read. Give it explicit permissive policies
-- so it works even if the role is later changed to not bypass RLS.
do $$ begin
  if exists (select from pg_roles where rolname = 'app_service') then
    execute 'create policy svc_all_services on public.services for all to app_service using (true) with check (true)';
    execute 'create policy svc_all_clients  on public.clients  for all to app_service using (true) with check (true)';
    execute 'create policy svc_all_bookings on public.bookings for all to app_service using (true) with check (true)';
    execute 'create policy svc_all_gallery  on public.gallery_photos for select to app_service using (true)';
    execute 'create policy svc_all_hours    on public.hours    for select to app_service using (true)';
    execute 'create policy svc_all_settings on public.settings for select to app_service using (true)';
    execute 'create policy svc_all_sent     on public.sent_messages for all to app_service using (true) with check (true)';
    execute 'create policy svc_audit_insert on public.audit_log for insert to app_service with check (true)';
  end if;
end $$;

-- The public views run with the view owner's rights (security_invoker is off by default),
-- so anonymous can read visible rows through them without any direct table access.
-- Do not turn security_invoker on for these views.

commit;
