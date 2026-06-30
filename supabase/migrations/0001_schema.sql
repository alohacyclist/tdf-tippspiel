-- 0001_schema.sql — tables, constraints, indexes, grants.
-- RLS, helper functions, triggers and the leaderboard view live in 0002_rls.sql.

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- tours: one row per edition (2026, 2027, …). Exactly one is_active at a time.
-- ---------------------------------------------------------------------------
create table tours (
  id         uuid primary key default gen_random_uuid(),
  year       int  not null unique,
  name       text not null,
  is_active  boolean not null default false,
  created_at timestamptz not null default now()
);
-- at most one active tour
create unique index tours_single_active on tours (is_active) where is_active;

-- ---------------------------------------------------------------------------
-- profiles: 1:1 with auth.users. Created by trigger as pending/non-admin.
-- email is NOT stored here (lives in auth.users) — profiles is world-ish readable.
-- ---------------------------------------------------------------------------
create table profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  status       text not null default 'pending' check (status in ('pending','active','blocked')),
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now()
);
-- case-insensitive unique display name (nulls allowed until onboarding)
create unique index profiles_display_name_ci on profiles (lower(display_name));

-- ---------------------------------------------------------------------------
-- riders: surrogate PK so the same PCS slug can recur across tours.
-- ---------------------------------------------------------------------------
create table riders (
  id         uuid primary key default gen_random_uuid(),
  tour_id    uuid not null references tours (id) on delete cascade,
  pcs_slug   text not null,
  name       text not null,
  team       text,
  country    text,
  bib        int,
  is_active  boolean not null default true,
  dnf_stage  int,
  unique (tour_id, pcs_slug)
);
create index riders_tour_active on riders (tour_id, is_active);

-- ---------------------------------------------------------------------------
-- stages
-- ---------------------------------------------------------------------------
create table stages (
  id              uuid primary key default gen_random_uuid(),
  tour_id         uuid not null references tours (id) on delete cascade,
  number          int  not null,
  date            date,
  start_time      timestamptz,                    -- UTC; deadline + reveal pivot
  name            text,
  start_city      text,
  finish_city     text,
  type            text check (type in ('flat','hilly','mountain','itt','ttt')),
  distance_km     numeric,
  status          text not null default 'upcoming'
                    check (status in ('upcoming','started','finished','void')),
  winner_rider_id uuid references riders (id),
  winner_team     text,                           -- only set for a team-time-trial
  unique (tour_id, number)
);
create index stages_tour_start on stages (tour_id, start_time);

-- ---------------------------------------------------------------------------
-- stage_tips: one tip per (user, stage), editable until deadline (RLS-enforced).
-- ---------------------------------------------------------------------------
create table stage_tips (
  id         uuid primary key default gen_random_uuid(),
  tour_id    uuid not null references tours (id) on delete cascade,
  user_id    uuid not null references profiles (id) on delete cascade,
  stage_id   uuid not null references stages (id) on delete cascade,
  rider_id   uuid not null references riders (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, stage_id)
);
create index stage_tips_stage on stage_tips (stage_id);
create index stage_tips_user on stage_tips (user_id);

-- ---------------------------------------------------------------------------
-- classifications: generic. GC = ordered, slots 3. Jerseys = unordered, slots 1.
-- Admin can add more mid-tour: just insert a row with its own deadline.
-- is_open = "accepting tips?"  deadline = "reveal time" (kept orthogonal).
-- ---------------------------------------------------------------------------
create table classifications (
  id         uuid primary key default gen_random_uuid(),
  tour_id    uuid not null references tours (id) on delete cascade,
  key        text not null,
  name       text not null,
  type       text not null check (type in ('gc','points','kom','youth','custom')),
  slots      int  not null default 1 check (slots between 1 and 10),
  ordered    boolean not null default false,
  deadline   timestamptz not null,
  is_open    boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tour_id, key)
);

create table classification_tips (
  id                uuid primary key default gen_random_uuid(),
  tour_id           uuid not null references tours (id) on delete cascade,
  user_id           uuid not null references profiles (id) on delete cascade,
  classification_id uuid not null references classifications (id) on delete cascade,
  rider_id          uuid not null references riders (id),
  slot              int  not null check (slot >= 1),
  created_at        timestamptz not null default now(),
  unique (user_id, classification_id, slot),    -- one rider per rank
  unique (user_id, classification_id, rider_id) -- no picking same rider twice
);
create index classification_tips_cls on classification_tips (classification_id);

create table classification_results (
  classification_id uuid not null references classifications (id) on delete cascade,
  rider_id          uuid not null references riders (id),
  rank              int  not null,
  primary key (classification_id, rank)
);

-- ---------------------------------------------------------------------------
-- scoring_config: per-tour, admin-editable point values.
-- ---------------------------------------------------------------------------
create table scoring_config (
  tour_id uuid not null references tours (id) on delete cascade,
  key     text not null,
  value   numeric not null,
  primary key (tour_id, key)
);

-- ---------------------------------------------------------------------------
-- notifications: in-app banner feed (Phase 6 also emails via Resend).
-- ---------------------------------------------------------------------------
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles (id) on delete cascade,
  type       text not null,
  payload    jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_unread on notifications (user_id) where read_at is null;

-- ---------------------------------------------------------------------------
-- Grants. RLS (0002) gates rows; column grant on profiles gates self-promotion.
-- Service-role bypasses RLS and is used only by the server-side pipeline.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on tours, stages, riders, classifications, classification_results, scoring_config, profiles
  to authenticated;

grant select, insert, update, delete on stage_tips, classification_tips to authenticated;

grant select on notifications to authenticated;
grant update (read_at) on notifications to authenticated;

-- A user may edit ONLY their own display name; status/is_admin are not grantable.
grant update (display_name) on profiles to authenticated;
