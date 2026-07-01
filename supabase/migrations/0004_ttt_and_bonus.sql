-- 0004_ttt_and_bonus.sql
-- Feature 1: on team-time-trial (ttt) stages a TIP is a TEAM, not a rider.
-- Feature 2: generic per-classification point override + "gelbes Trikot nach Etappe 1" bonus.

-- ---------------------------------------------------------------------------
-- Feature 1 — stage_tips carries EITHER rider_id (normal stages) OR team (ttt).
-- ---------------------------------------------------------------------------
alter table stage_tips alter column rider_id drop not null;
alter table stage_tips add column if not exists team text;
alter table stage_tips
  add constraint stage_tips_rider_xor_team
  check ((rider_id is not null) <> (team is not null));

-- helper: does this team exist among the tour's riders? (RLS write-guard for ttt tips)
create or replace function private.team_in_tour(tname text, tid uuid)
  returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.riders r where r.tour_id = tid and r.team = tname
  );
$$;
revoke execute on function private.team_in_tour(text, uuid) from public;
grant execute on function private.team_in_tour(text, uuid) to authenticated, anon;

-- rewrite write policies: validate rider OR team belongs to the stage's tour.
drop policy stage_tips_insert on stage_tips;
create policy stage_tips_insert on stage_tips for insert with check (
  private.is_active(auth.uid())
  and user_id = auth.uid()
  and coalesce(private.stage_start_time(stage_id) > now(), false)
  and tour_id = private.stage_tour(stage_id)
  and (
    (rider_id is not null and private.rider_tour(rider_id) = tour_id)
    or (team is not null and private.team_in_tour(team, tour_id))
  )
);

drop policy stage_tips_update on stage_tips;
create policy stage_tips_update on stage_tips for update using (
  user_id = auth.uid() and coalesce(private.stage_start_time(stage_id) > now(), false)
) with check (
  user_id = auth.uid()
  and coalesce(private.stage_start_time(stage_id) > now(), false)
  and tour_id = private.stage_tour(stage_id)
  and (
    (rider_id is not null and private.rider_tour(rider_id) = tour_id)
    or (team is not null and private.team_in_tour(team, tour_id))
  )
);

-- ---------------------------------------------------------------------------
-- Feature 2 — optional per-classification point value (overrides type default).
-- ---------------------------------------------------------------------------
alter table classifications add column if not exists points int;

-- ---------------------------------------------------------------------------
-- Leaderboard view: ttt scored by TEAM tip; classification points honor override.
-- ---------------------------------------------------------------------------
create or replace view leaderboard with (security_invoker = true) as
with cfg as (
  select tour_id,
    coalesce(max(value) filter (where key = 'stage_winner_points'), 0)   as stage_winner,
    coalesce(max(value) filter (where key = 'gc_exact_points'), 0)       as gc_exact,
    coalesce(max(value) filter (where key = 'gc_in_top3_points'), 0)     as gc_in_top3,
    coalesce(max(value) filter (where key = 'jersey_correct_points'), 0) as jersey
  from scoring_config group by tour_id
),
stage_pts as (
  select st.tour_id, st.user_id,
    count(*) filter (where s.status = 'finished' and (
      (s.type is distinct from 'ttt' and s.winner_rider_id = st.rider_id)
      or (s.type = 'ttt' and s.winner_team is not null and st.team = s.winner_team)
    )) as correct_winners
  from stage_tips st
  join stages s on s.id = st.stage_id
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
                              and cr.rider_id = ct.rider_id) then coalesce(c.points, cfg.jersey)
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

-- ---------------------------------------------------------------------------
-- Feature 2 seed — "Gelbes Trikot nach Etappe 1" (1 slot, 10 pts, deadline = stage-1 start).
-- Idempotent.
-- ---------------------------------------------------------------------------
insert into classifications (tour_id, key, name, type, slots, ordered, deadline, is_open, points)
select t.id, 'yellow_s1', 'Gelbes Trikot nach Etappe 1', 'custom', 1, false,
       (select s.start_time from stages s where s.tour_id = t.id and s.number = 1),
       true, 10
from tours t
where t.year = 2026
on conflict (tour_id, key) do nothing;
