-- 0016_stage9_distance.sql — stage 9 route was shortened. Update distance only
-- (start/finish cities + type unchanged). Profile image replaced separately.
update stages
set distance_km = 155.5
from tours t
where stages.tour_id = t.id and t.year = 2026 and stages.number = 9;
