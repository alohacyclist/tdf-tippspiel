-- 0029_seed_lombardia_2026.sql — Il Lombardia 2026 (10.10.2026), the last monument
-- of the 2026 season (the spring monuments are already past). One-day tour with a
-- single stage, like the Worlds.
--
-- ⚠️ ROUTE NOT PUBLISHED YET: start/finish cities and distance are left NULL and the
--    start time is a placeholder (10:00 CEST / +02). The race alternates between
--    Como and Bergamo, so the direction is deliberately NOT guessed. Fill in via
--    UPDATE (or the admin UI) once RCS publishes the route, and verify the start
--    time before tips open — start_time is the tip deadline.
-- Monument win = 30 points (below the Worlds' 40, above a grand-tour stage's 10);
-- adjust in scoring_config if you want a different weighting.

insert into tours (year, name, is_active, pcs_slug, kind)
values (2026, 'Il Lombardia 2026', false, 'il-lombardia', 'one_day')
on conflict (year, pcs_slug) do nothing;

insert into scoring_config (tour_id, key, value)
select t.id, 'stage_winner_points', 30
from tours t
where t.year = 2026 and t.pcs_slug = 'il-lombardia'
on conflict (tour_id, key) do nothing;

insert into stages (tour_id, number, date, start_time, name, type, status)
select t.id, 1, date '2026-10-10',
       timestamptz '2026-10-10 10:00:00+02',   -- ⚠️ placeholder start time
       'Il Lombardia', 'mountain', 'upcoming'
from tours t
where t.year = 2026 and t.pcs_slug = 'il-lombardia'
on conflict (tour_id, number) do nothing;
