-- 0002_rls.sql — SECURITY DEFINER helpers, profile trigger, RLS policies, leaderboard view.
-- All policy-critical lookups go through private.* SECURITY DEFINER functions so the
-- deadline/reveal logic does NOT depend on the SELECT policies of stages/classifications
-- (avoids RLS coupling) and so is_active()/is_admin() cannot cause RLS recursion.

-- ---------------------------------------------------------------------------
-- Helper functions (run as owner -> bypass RLS; empty search_path -> fully qualified).
-- ---------------------------------------------------------------------------
create or replace function private.is_active(uid uuid)
  returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = uid and p.status = 'active');
$$;

create or replace function private.is_admin(uid uuid)
  returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = uid and p.status = 'active'),
    false);
$$;

create or replace function private.stage_start_time(sid uuid)
  returns timestamptz language sql stable security definer set search_path = '' as $$
  select s.start_time from public.stages s where s.id = sid;
$$;

create or replace function private.stage_tour(sid uuid)
  returns uuid language sql stable security definer set search_path = '' as $$
  select s.tour_id from public.stages s where s.id = sid;
$$;

create or replace function private.rider_tour(rid uuid)
  returns uuid language sql stable security definer set search_path = '' as $$
  select r.tour_id from public.riders r where r.id = rid;
$$;

create or replace function private.classification_deadline(cid uuid)
  returns timestamptz language sql stable security definer set search_path = '' as $$
  select c.deadline from public.classifications c where c.id = cid;
$$;

create or replace function private.classification_open(cid uuid)
  returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select c.is_open from public.classifications c where c.id = cid), false);
$$;

create or replace function private.classification_slots(cid uuid)
  returns int language sql stable security definer set search_path = '' as $$
  select c.slots from public.classifications c where c.id = cid;
$$;

create or replace function private.classification_tour(cid uuid)
  returns uuid language sql stable security definer set search_path = '' as $$
  select c.tour_id from public.classifications c where c.id = cid;
$$;

revoke execute on all functions in schema private from public;
grant usage on schema private to authenticated, anon;
grant execute on all functions in schema private to authenticated, anon;

-- ---------------------------------------------------------------------------
-- profiles auto-creation: every new auth user becomes pending / non-admin.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
  returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, status, is_admin) values (new.id, 'pending', false);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- keep stage_tips.updated_at honest
create or replace function public.touch_updated_at()
  returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger stage_tips_touch before update on stage_tips
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere.
-- ---------------------------------------------------------------------------
alter table tours                  enable row level security;
alter table profiles               enable row level security;
alter table riders                 enable row level security;
alter table stages                 enable row level security;
alter table stage_tips             enable row level security;
alter table classifications        enable row level security;
alter table classification_tips    enable row level security;
alter table classification_results enable row level security;
alter table scoring_config         enable row level security;
alter table notifications          enable row level security;

-- ---------------------------------------------------------------------------
-- profiles: own row always; active members can read all (for display names).
-- Writes limited to display_name via column grant in 0001; status/is_admin
-- can only change via service-role (admin) — never the client.
-- ---------------------------------------------------------------------------
create policy profiles_select on profiles for select
  using (id = auth.uid() or private.is_active(auth.uid()));
create policy profiles_update_own on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- Reference data: readable by active members; writes only via service-role.
-- ---------------------------------------------------------------------------
create policy tours_select   on tours   for select using (private.is_active(auth.uid()));
create policy stages_select  on stages  for select using (private.is_active(auth.uid()));
create policy riders_select  on riders  for select using (private.is_active(auth.uid()));
create policy cls_select     on classifications        for select using (private.is_active(auth.uid()));
create policy clsres_select  on classification_results for select using (private.is_active(auth.uid()));
create policy scoring_select on scoring_config          for select using (private.is_active(auth.uid()));

-- ---------------------------------------------------------------------------
-- stage_tips: own tip always readable; others ONLY at/after stage start.
-- Write/edit/delete only before the deadline, only own row, rider must belong
-- to the stage's tour (cross-tour / garbage-id guard). null start_time = closed.
-- ---------------------------------------------------------------------------
create policy stage_tips_select on stage_tips for select using (
  private.is_active(auth.uid())
  and (user_id = auth.uid() or private.stage_start_time(stage_id) <= now())
);
create policy stage_tips_insert on stage_tips for insert with check (
  private.is_active(auth.uid())
  and user_id = auth.uid()
  and coalesce(private.stage_start_time(stage_id) > now(), false)
  and tour_id = private.stage_tour(stage_id)
  and private.rider_tour(rider_id) = tour_id
);
create policy stage_tips_update on stage_tips for update using (
  user_id = auth.uid() and coalesce(private.stage_start_time(stage_id) > now(), false)
) with check (
  user_id = auth.uid()
  and coalesce(private.stage_start_time(stage_id) > now(), false)
  and tour_id = private.stage_tour(stage_id)
  and private.rider_tour(rider_id) = tour_id
);
create policy stage_tips_delete on stage_tips for delete using (
  user_id = auth.uid() and coalesce(private.stage_start_time(stage_id) > now(), false)
);

-- ---------------------------------------------------------------------------
-- classification_tips: reveal gated on DEADLINE timestamp (never on is_open).
-- Writes require is_open AND before deadline; slot within range; same-tour rider.
-- ---------------------------------------------------------------------------
create policy cls_tips_select on classification_tips for select using (
  private.is_active(auth.uid())
  and (user_id = auth.uid() or coalesce(private.classification_deadline(classification_id) <= now(), false))
);
create policy cls_tips_insert on classification_tips for insert with check (
  private.is_active(auth.uid())
  and user_id = auth.uid()
  and private.classification_open(classification_id)
  and coalesce(private.classification_deadline(classification_id) > now(), false)
  and tour_id = private.classification_tour(classification_id)
  and private.rider_tour(rider_id) = tour_id
  and slot <= private.classification_slots(classification_id)
);
create policy cls_tips_update on classification_tips for update using (
  user_id = auth.uid()
  and private.classification_open(classification_id)
  and coalesce(private.classification_deadline(classification_id) > now(), false)
) with check (
  user_id = auth.uid()
  and private.classification_open(classification_id)
  and coalesce(private.classification_deadline(classification_id) > now(), false)
  and tour_id = private.classification_tour(classification_id)
  and private.rider_tour(rider_id) = tour_id
  and slot <= private.classification_slots(classification_id)
);
create policy cls_tips_delete on classification_tips for delete using (
  user_id = auth.uid()
  and private.classification_open(classification_id)
  and coalesce(private.classification_deadline(classification_id) > now(), false)
);

-- ---------------------------------------------------------------------------
-- notifications: read/mark-read own only (read_at grant in 0001). Insert = service-role.
-- ---------------------------------------------------------------------------
create policy notifications_select on notifications for select using (user_id = auth.uid());
create policy notifications_update on notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- leaderboard view (security_invoker -> respects caller RLS; only finished
-- stages and resolved classifications contribute, both already past reveal time).
-- ---------------------------------------------------------------------------
create or replace view leaderboard with (security_invoker = true) as
with cfg as (
  select tour_id,
    coalesce(max(value) filter (where key = 'stage_winner_points'), 0)  as stage_winner,
    coalesce(max(value) filter (where key = 'gc_exact_points'), 0)      as gc_exact,
    coalesce(max(value) filter (where key = 'gc_in_top3_points'), 0)    as gc_in_top3,
    coalesce(max(value) filter (where key = 'jersey_correct_points'), 0) as jersey
  from scoring_config group by tour_id
),
stage_pts as (
  select st.tour_id, st.user_id,
    count(*) filter (where s.status = 'finished' and (
      s.winner_rider_id = st.rider_id
      or (s.type = 'ttt' and s.winner_team is not null and r.team = s.winner_team)
    )) as correct_winners
  from stage_tips st
  join stages s on s.id = st.stage_id
  join riders r on r.id = st.rider_id
  group by st.tour_id, st.user_id
),
cls_pts as (
  select ct.tour_id, ct.user_id,
    sum(
      case
        when c.ordered then
          case
            when exists (select 1 from classification_results cr
                         where cr.classification_id = ct.classification_id
                           and cr.rider_id = ct.rider_id and cr.rank = ct.slot) then cfg.gc_exact
            when exists (select 1 from classification_results cr
                         where cr.classification_id = ct.classification_id
                           and cr.rider_id = ct.rider_id) then cfg.gc_in_top3
            else 0 end
        else
          case when exists (select 1 from classification_results cr
                            where cr.classification_id = ct.classification_id
                              and cr.rider_id = ct.rider_id) then cfg.jersey
               else 0 end
      end
    ) as points
  from classification_tips ct
  join classifications c on c.id = ct.classification_id
  join cfg on cfg.tour_id = ct.tour_id
  group by ct.tour_id, ct.user_id
)
select
  t.id as tour_id,
  p.id as user_id,
  p.display_name,
  coalesce(sp.correct_winners, 0) * coalesce(cfg.stage_winner, 0)
    + coalesce(cp.points, 0) as total_points,
  coalesce(sp.correct_winners, 0) as correct_winners
from tours t
cross join profiles p
left join cfg      on cfg.tour_id = t.id
left join stage_pts sp on sp.tour_id = t.id and sp.user_id = p.id
left join cls_pts  cp  on cp.tour_id = t.id and cp.user_id = p.id
where p.status = 'active';

grant select on leaderboard to authenticated;
