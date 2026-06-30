-- 0003_seed.sql — Tour 2026, scoring defaults, pre-tour classifications, stage 1.
-- Idempotent (on conflict do nothing) so it is safe to re-run.

-- ⚠️ START TIME MUST BE VERIFIED against the official ASO roadbook before launch.
--    Stored as UTC with explicit +02 offset (Barcelona / CEST in July).
--    Deadline = reveal pivot for both stage 1 tips AND all pre-tour classifications.

insert into tours (year, name, is_active)
values (2026, 'Tour de France 2026', true)
on conflict (year) do nothing;

insert into scoring_config (tour_id, key, value)
select t.id, v.key, v.value
from tours t
cross join (values
  ('stage_winner_points',   10),
  ('gc_exact_points',       15),
  ('gc_in_top3_points',      5),
  ('jersey_correct_points', 15)
) as v(key, value)
where t.year = 2026
on conflict (tour_id, key) do nothing;

-- Stage 1 only — remaining 20 stages are loaded by the pipeline / roadbook seed.
insert into stages (tour_id, number, date, start_time, name, start_city, finish_city, type, status)
select t.id, 1, date '2026-07-04',
       timestamptz '2026-07-04 12:30:00+02',   -- TODO verify exact départ-fictif time
       'Etappe 1', 'Barcelona', 'Barcelona', 'flat', 'upcoming'
from tours t where t.year = 2026
on conflict (tour_id, number) do nothing;

-- Pre-tour special classifications, deadline = stage-1 start, open for bets now.
insert into classifications (tour_id, key, name, type, slots, ordered, deadline, is_open)
select t.id, c.key, c.name, c.type, c.slots, c.ordered,
       (select s.start_time from stages s where s.tour_id = t.id and s.number = 1),
       c.is_open
from tours t
cross join (values
  ('gc',     'Gesamtwertung (Top 3)',       'gc',     3, true,  true),
  ('points', 'Grünes Trikot (Punkte)',      'points', 1, false, true),
  ('kom',    'Bergtrikot',                  'kom',    1, false, true),
  ('youth',  'Jungprofi (weißes Trikot)',   'youth',  1, false, true)
) as c(key, name, type, slots, ordered, is_open)
where t.year = 2026
on conflict (tour_id, key) do nothing;

-- ---------------------------------------------------------------------------
-- BOOTSTRAP ADMIN — run ONCE after your first magic-link login (you must exist
-- in auth.users first). Promotes + activates the owner. Idempotent.
-- ---------------------------------------------------------------------------
-- update profiles set is_admin = true, status = 'active'
-- where id = (select id from auth.users where email = 'christian.mueller@tiretask.de');
