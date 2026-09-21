-- 0038_leaderboard_v6.sql — one number decides every standing: the count of
-- correct winner tips.
--
-- Until now the view also carried stage_points = correct_winners *
-- scoring_config.stage_winner_points. In the single-race table that was the same
-- ranking twice (10, 20, 30 … next to 1, 2, 3), and across the season it silently
-- reweighted races against each other — a World-Championship win counted 40, a
-- Vuelta stage 10, so a player with fewer correct tips could still lead. Neither
-- is what the game is about, so the column is gone and the rank is the count.
--
-- Second fix, and it applies to every race already ridden: a stage counted only
-- while status = 'finished'. A result entered without closing the stage (the
-- admin's "Etappe schließen" box unticked) left the tip green on the stage and
-- in the player breakdown while the standings still read zero for it. Scoring
-- now follows the same rule as the UI: there is a result and the stage was not
-- annulled. Voiding a stage still clears its winner (0030), so a void race
-- scores for nobody.
--
-- Tips are also grouped by the stage's own tour instead of the tour_id written
-- into the tip row, so a tip can never be counted towards a different race.
--
-- scoring_config.stage_winner_points is left in place but is no longer read by
-- anything; it stays for a future per-race weighting, should we ever want one.
drop view if exists season_leaderboard;
drop view if exists leaderboard;

create view leaderboard with (security_invoker = true) as
with stage_pts as (
  select s.tour_id, st.user_id,
    count(*) filter (where s.status is distinct from 'void' and (
      (s.type is distinct from 'ttt' and s.winner_rider_id = st.rider_id)
      or (s.type = 'ttt' and s.winner_team is not null and st.team = s.winner_team)
    )) as correct_winners
  from stage_tips st
  join stages s on s.id = st.stage_id
  group by s.tour_id, st.user_id
)
select
  t.id as tour_id,
  p.id as user_id,
  p.display_name,
  coalesce(sp.correct_winners, 0) as correct_winners
from tours t
cross join profiles p
left join stage_pts sp on sp.tour_id = t.id and sp.user_id = p.id
where p.status = 'active';

grant select on leaderboard to authenticated;

create view season_leaderboard with (security_invoker = true) as
select
  t.year, l.user_id, l.display_name,
  sum(l.correct_winners) as correct_winners
from leaderboard l
join tours t on t.id = l.tour_id
group by t.year, l.user_id, l.display_name;

grant select on season_leaderboard to authenticated;
