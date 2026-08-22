-- 0022_vuelta_start_times.sql — real départ times for all 21 stages (PCS, local
-- CEST = UTC+02), replacing the 12:00 placeholders from 0019. start_time is the
-- tip/reveal deadline.
update stages s
set start_time = (s.date::text || ' ' || v.t || ':00+02')::timestamptz
from tours t,
  (values
    ( 1, '16:17'), ( 2, '12:16'), ( 3, '13:21'), ( 4, '14:49'), ( 5, '13:34'),
    ( 6, '13:11'), ( 7, '13:40'), ( 8, '13:42'), ( 9, '12:26'), (10, '12:49'),
    (11, '14:08'), (12, '13:07'), (13, '12:41'), (14, '13:33'), (15, '12:46'),
    (16, '13:18'), (17, '13:24'), (18, '14:06'), (19, '14:06'), (20, '12:36'),
    (21, '16:23')
  ) as v(num, t)
where s.tour_id = t.id and t.pcs_slug = 'vuelta-a-espana' and s.number = v.num;

-- Pre-tour classifications (GC/points/kom) close at the Grand Départ (stage-1 start).
update classifications c
set deadline = timestamptz '2026-08-22 16:17:00+02'
from tours t
where c.tour_id = t.id and t.pcs_slug = 'vuelta-a-espana' and c.stage_id is null;
