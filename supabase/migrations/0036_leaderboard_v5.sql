-- 0036_leaderboard_v5.sql — standings rank ONLY on correct winner tips per race/stage.
-- Classifications (jerseys, podium) stay tippable but score ZERO: they are no longer
-- read here. Questions are gone (0035). Columns: correct_winners + stage_points only.
create view leaderboard with (security_invoker = true) as
with cfg as (
  select tour_id,
    coalesce(max(value) filter (where key = 'stage_winner_points'), 0) as stage_winner
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
)
select
  t.id as tour_id,
  p.id as user_id,
  p.display_name,
  coalesce(sp.correct_winners, 0) as correct_winners,
  coalesce(sp.correct_winners, 0) * coalesce(cfg.stage_winner, 0) as stage_points
from tours t
cross join profiles p
left join cfg          on cfg.tour_id = t.id
left join stage_pts sp on sp.tour_id = t.id and sp.user_id = p.id
where p.status = 'active';

grant select on leaderboard to authenticated;

create view season_leaderboard with (security_invoker = true) as
select
  t.year, l.user_id, l.display_name,
  sum(l.correct_winners) as correct_winners,
  sum(l.stage_points)    as stage_points
from leaderboard l
join tours t on t.id = l.tour_id
group by t.year, l.user_id, l.display_name;

grant select on season_leaderboard to authenticated;
