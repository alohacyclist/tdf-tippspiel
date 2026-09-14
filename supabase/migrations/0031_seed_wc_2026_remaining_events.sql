-- 0031_seed_wc_2026_remaining_events.sql — the three remaining elite World
-- Championship events in Montréal 2026, each a one_day tour with a single stage
-- (0027 already seeded the men's road race):
--   20.09. Einzelzeitfahren Frauen + Männer, 39.2 km, Montréal
--   26.09. Straßenrennen Frauen, 180.1 km, Brossard → Montréal
-- Schedule and distances: Wikipedia "2026 UCI Road World Championships".
--
-- ⚠️ START TIMES ARE PLACEHOLDERS (-04 = EDT). start_time is the tip deadline, so
--    verify each against the official timetable before tips open. For a time trial
--    it is the first starter.
-- ⚠️ VERIFY THE PCS SLUGS against the live site: they drive the results link, the
--    profile-image folder AND the automated ingester. A wrong slug fails safely
--    (nothing is found, the winner stays manual) but the link would 404.
-- Points: road race 40, time trial 30 — identical for women and men.
-- Startlists follow separately, like every other race here.

insert into tours (year, name, is_active, pcs_slug, kind)
values
  (2026, 'WM Einzelzeitfahren Männer 2026', false, 'world-championship-itt', 'one_day'),
  (2026, 'WM Straßenrennen Frauen 2026',    false, 'world-championship-we', 'one_day'),
  (2026, 'WM Einzelzeitfahren Frauen 2026', false, 'world-championship-itt-we', 'one_day')
on conflict (year, pcs_slug) do nothing;

insert into scoring_config (tour_id, key, value)
select t.id, 'stage_winner_points', v.points
from tours t
join (values
  ('world-championship-itt',    30),
  ('world-championship-we',     40),
  ('world-championship-itt-we', 30)
) as v(slug, points) on v.slug = t.pcs_slug
where t.year = 2026
on conflict (tour_id, key) do nothing;

insert into stages (tour_id, number, date, start_time, name, start_city, finish_city, type, distance_km, status)
select t.id, 1, v.d::date, (v.d || ' ' || v.t)::timestamptz,
       v.name, v.sc, v.fc, v.type, v.km, 'upcoming'
from tours t
join (values
  ('world-championship-itt',    '2026-09-20', '13:00:00-04', 'Einzelzeitfahren Männer',  'Montréal', 'Montréal',  'itt',    39.2),
  ('world-championship-itt-we', '2026-09-20', '10:00:00-04', 'Einzelzeitfahren Frauen',  'Montréal', 'Montréal',  'itt',    39.2),
  ('world-championship-we',     '2026-09-26', '10:00:00-04', 'Straßenrennen Frauen',     'Brossard', 'Montréal',  'hilly', 180.1)
) as v(slug, d, t, name, sc, fc, type, km) on v.slug = t.pcs_slug
where t.year = 2026
on conflict (tour_id, number) do nothing;

-- Same source now lists the men's road race as 273.4 km (0027 seeded 273.7).
update stages s
set distance_km = 273.4
from tours t
where s.tour_id = t.id and t.year = 2026
  and t.pcs_slug = 'world-championship' and s.number = 1;
