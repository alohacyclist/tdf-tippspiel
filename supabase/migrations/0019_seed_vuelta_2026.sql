-- 0019_seed_vuelta_2026.sql — Vuelta a España 2026 (route only; startlist + stage
-- profiles follow later). Tour starts is_active=false; flip at cutover when the
-- TdF is done. Idempotent (on conflict do nothing).
--
-- ⚠️ START TIMES ARE PLACEHOLDERS (12:00 CEST / +02 — Monaco/France/Andorra/Spain
--    are all +02 in Aug/Sep). deadline = reveal = start_time, so verify each stage
--    against the official roadbook before tips open and UPDATE stages.start_time.
-- Route: Wikipedia "2026 Vuelta a España" (22.08–13.09, Monaco → Granada). Rest days
--    31.08 + 07.09 are not stages. Stage types condensed to the app's enum
--    (medium-mountain/uphill → hilly, high-mountain/summit → mountain).

-- ---------------------------------------------------------------------------
-- Two Grand Tours share a year (TdF + Vuelta 2026): year alone can no longer be
-- unique. Key a tour by (year, pcs_slug) instead.
-- ---------------------------------------------------------------------------
do $$
declare c text;
begin
  -- drop the legacy unique-on-year (normally tours_year_key; resolve by columns
  -- so a differently-named constraint is still removed).
  select conname into c from pg_constraint
   where conrelid = 'public.tours'::regclass and contype = 'u'
     and conkey = array[(select attnum from pg_attribute
                          where attrelid = 'public.tours'::regclass
                            and attname = 'year' and not attisdropped)];
  if c is not null then
    execute format('alter table public.tours drop constraint %I', c);
  end if;

  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.tours'::regclass
                   and conname = 'tours_year_slug_key') then
    alter table public.tours add constraint tours_year_slug_key unique (year, pcs_slug);
  end if;
end $$;

insert into tours (year, name, is_active, pcs_slug)
values (2026, 'Vuelta a España 2026', false, 'vuelta-a-espana')
on conflict (year, pcs_slug) do nothing;

-- Scoring defaults (same as the TdF).
insert into scoring_config (tour_id, key, value)
select t.id, v.key, v.value
from tours t
cross join (values
  ('stage_winner_points',   10),
  ('gc_exact_points',       15),
  ('gc_in_top3_points',      5),
  ('jersey_correct_points', 15)
) as v(key, value)
where t.year = 2026 and t.pcs_slug = 'vuelta-a-espana'
on conflict (tour_id, key) do nothing;

-- 21 stages (rest days 31.08 + 07.09 omitted).
insert into stages (tour_id, number, date, start_time, name, start_city, finish_city, type, distance_km, status)
select t.id, v.num, v.d::date,
       (v.d || ' 12:00:00+02')::timestamptz,          -- ⚠️ placeholder start time
       'Etappe ' || v.num, v.sc, v.fc, v.type, v.km, 'upcoming'
from tours t
cross join (values
  ( 1, '2026-08-22', 'Monaco',                    'Monaco',                  'itt',        9.0),
  ( 2, '2026-08-23', 'Monaco',                    'Manosque',                'hilly',    215.5),
  ( 3, '2026-08-24', 'Gruissan',                  'Font Romeu',              'hilly',    166.7),
  ( 4, '2026-08-25', 'Andorra la Vella',          'Andorra la Vella',        'mountain', 104.9),
  ( 5, '2026-08-26', 'Falset',                    'Roquetes',                'hilly',    171.1),
  ( 6, '2026-08-27', 'Alcossebre',                'Castellón',               'hilly',    176.8),
  ( 7, '2026-08-28', 'Vall d''Alba',              'Aramón Valdelinares',     'mountain', 149.9),
  ( 8, '2026-08-29', 'Puçol',                     'Xeraco',                  'flat',     176.4),
  ( 9, '2026-08-30', 'Villajoyosa',               'Alto de Aitana',          'mountain', 187.5),
  (10, '2026-09-01', 'Alcaraz',                   'Elche de la Sierra',      'hilly',    184.5),
  (11, '2026-09-02', 'Cartagena',                 'Lorca',                   'flat',     156.1),
  (12, '2026-09-03', 'Vera',                      'Calar Alto',              'mountain', 166.5),
  (13, '2026-09-04', 'Almuñécar',                 'Loja',                    'hilly',    193.2),
  (14, '2026-09-05', 'Jaén',                      'Sierra de la Pandera',    'mountain', 152.7),
  (15, '2026-09-06', 'Palma del Río',             'Córdoba',                 'hilly',    181.2),
  (16, '2026-09-08', 'Cortegana',                 'Palos de la Frontera',    'flat',     186.0),
  (17, '2026-09-09', 'Dos Hermanas',              'Sevilla',                 'flat',     189.2),
  (18, '2026-09-10', 'El Puerto de Santa María',  'Jerez de la Frontera',    'itt',       32.5),
  (19, '2026-09-11', 'Vélez-Málaga',              'Peñas Blancas',           'hilly',    205.1),
  (20, '2026-09-12', 'La Calahorra',              'Collado del Alguacil',    'mountain', 187.0),
  (21, '2026-09-13', 'Granada',                   'Granada',                 'flat',      99.4)
) as v(num, d, sc, fc, type, km)
where t.year = 2026 and t.pcs_slug = 'vuelta-a-espana'
on conflict (tour_id, number) do nothing;

-- Pre-tour classifications (Vuelta jerseys: La Roja / green / Montaña — no youth
-- jersey at the Vuelta). Deadline = stage-1 start, open for bets now.
insert into classifications (tour_id, key, name, type, slots, ordered, deadline, is_open)
select t.id, c.key, c.name, c.type, c.slots, c.ordered,
       (select s.start_time from stages s where s.tour_id = t.id and s.number = 1),
       c.is_open
from tours t
cross join (values
  ('gc',     'Gesamtwertung (Top 3)',      'gc',     3, true,  true),
  ('points', 'Grünes Trikot (Punkte)',     'points', 1, false, true),
  ('kom',    'Bergtrikot (Montaña)',       'kom',    1, false, true)
) as c(key, name, type, slots, ordered, is_open)
where t.year = 2026 and t.pcs_slug = 'vuelta-a-espana'
on conflict (tour_id, key) do nothing;
