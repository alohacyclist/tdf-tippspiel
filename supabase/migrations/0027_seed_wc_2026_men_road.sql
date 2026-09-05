-- 0027_seed_wc_2026_men_road.sql — first one-day event: UCI Road World Championships
-- 2026, Men's Elite road race (Montréal, 27.09.2026, 273.7 km). Modelled as a
-- one_day tour with a single stage — reuses all tip/leaderboard/reveal machinery.
-- Startlist + profile image follow later (route-first, like the Vuelta).
--
-- ⚠️ START TIME IS A PLACEHOLDER (09:00 EDT / -04). start_time = tip deadline —
--    verify against the official start before tips open.
-- A one-day win is weighted higher than a grand-tour stage: stage_winner_points = 40,
-- so it counts for more in the season standings.

insert into tours (year, name, is_active, pcs_slug, kind)
values (2026, 'WM Straßenrennen Männer 2026', false, 'world-championship', 'one_day')
on conflict (year, pcs_slug) do nothing;

insert into scoring_config (tour_id, key, value)
select t.id, 'stage_winner_points', 40
from tours t
where t.year = 2026 and t.pcs_slug = 'world-championship'
on conflict (tour_id, key) do nothing;

insert into stages (tour_id, number, date, start_time, name, start_city, finish_city, type, distance_km, status)
select t.id, 1, date '2026-09-27',
       timestamptz '2026-09-27 09:00:00-04',   -- ⚠️ placeholder start time (EDT)
       'Straßenrennen Männer', 'Brossard', 'Montréal', 'hilly', 273.7, 'upcoming'
from tours t
where t.year = 2026 and t.pcs_slug = 'world-championship'
on conflict (tour_id, number) do nothing;
