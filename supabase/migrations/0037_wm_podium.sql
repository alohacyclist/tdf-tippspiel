-- 0037_wm_podium.sql — make places 1–3 tippable for the individual World-Championship
-- races (road + ITT, men + women; not the mixed relay). Modelled as a stage-attached
-- classification (3 ordered slots) reusing the existing tip/reveal/result machinery.
-- Scores zero (leaderboard ignores classifications since 0036) — info only.
insert into classifications (tour_id, stage_id, key, name, type, slots, ordered, deadline, is_open, points)
select t.id,
       (select s.id from stages s where s.tour_id = t.id and s.number = 1),
       'podium', 'Podium (Top 3)', 'custom', 3, true, null, true, 0
from tours t
where t.year = 2026
  and t.pcs_slug in (
    'world-championship', 'world-championship-we',
    'world-championship-itt', 'world-championship-itt-we'
  )
on conflict (tour_id, key) do nothing;
