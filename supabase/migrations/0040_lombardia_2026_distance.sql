-- 0040_lombardia_2026_distance.sql — Il Lombardia 2026 is 239 km (PCS startlist
-- header, 10.10.2026). 0029 left the route NULL; start/finish cities and the start
-- time are still unconfirmed and stay as they are.
update stages
set distance_km = 239
from tours t
where stages.tour_id = t.id and t.year = 2026 and t.pcs_slug = 'il-lombardia'
  and stages.number = 1;
