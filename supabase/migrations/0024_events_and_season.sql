-- 0024_events_and_season.sql — multi-event support + season standings.
--   * tours.kind distinguishes a 21-stage grand tour from a one-day race
--     (monument, or a single World-Championship race). One-day events are modelled
--     as a tour with exactly one stage — same tip/leaderboard/reveal machinery.
--   * season_leaderboard sums the per-tour leaderboard across every tour of a
--     calendar year (a "season" = a year — no separate table needed). Per-event
--     weighting comes from scoring_config.stage_winner_points per tour (e.g. a
--     monument win can be worth more than one of 21 grand-tour stages).
alter table tours add column if not exists kind text not null default 'grand_tour'
  check (kind in ('grand_tour', 'one_day'));

create view season_leaderboard with (security_invoker = true) as
select
  t.year,
  l.user_id,
  l.display_name,
  sum(l.correct_winners) as correct_winners,
  sum(l.stage_points)    as stage_points,
  sum(l.special_points)  as special_points,
  sum(l.question_points) as question_points
from leaderboard l
join tours t on t.id = l.tour_id
group by t.year, l.user_id, l.display_name;

grant select on season_leaderboard to authenticated;
