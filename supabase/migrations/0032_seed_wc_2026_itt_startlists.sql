-- 0032_seed_wc_2026_itt_startlists.sql — startlists for both World Championship
-- time trials in Montréal (20.09.2026), from the PCS lists.
--   Männer ITT: 61 riders / 40 nations
--   Frauen ITT: 53 riders / 35 nations
-- As at the road race, riders.team holds the NATION and riders.country the ISO code.
--
-- NOTE: the PCS headers claim 64 and 54 starters, but list 61 and 53 — the remaining
-- places were not filled in yet (the men's list ends with Uruguay and no rider).
-- Re-run a reconcile before the start, like 0021 did for the Vuelta.
-- Idempotent.

insert into riders (tour_id, pcs_slug, name, team, country)
select t.id, v.slug, v.name, v.team, v.country
from tours t
cross join (values
  -- Belgien
  ('remco-evenepoel',            'Remco Evenepoel',            'Belgien',        'BE'),
  ('rune-herregodts',            'Rune Herregodts',            'Belgien',        'BE'),
  ('alec-segaert',               'Alec Segaert',               'Belgien',        'BE'),
  -- Bermuda
  ('kaden-hopkins',              'Kaden Hopkins',              'Bermuda',        'BM'),
  ('nicholas-narraway',          'Nicholas Narraway',          'Bermuda',        'BM'),
  -- Kanada
  ('nickolas-zukowsky',          'Nickolas Zukowsky',          'Kanada',         'CA'),
  ('michael-leonard',            'Michael Leonard',            'Kanada',         'CA'),
  -- China
  ('houwang-cao',                'Houwang Cao',                'China',          'CN'),
  ('chenglu-liu',                'Chenglu Liu',                'China',          'CN'),
  -- Kolumbien
  ('brandon-smith-rivera',       'Brandon Smith Rivera',       'Kolumbien',      'CO'),
  ('walter-vargas',              'Walter Vargas',              'Kolumbien',      'CO'),
  -- Dänemark
  ('mikkel-bjerg',               'Mikkel Bjerg',               'Dänemark',       'DK'),
  ('kasper-asgreen',             'Kasper Asgreen',             'Dänemark',       'DK'),
  -- Frankreich
  ('bruno-armirail',             'Bruno Armirail',             'Frankreich',     'FR'),
  ('paul-seixas',                'Paul Seixas',                'Frankreich',     'FR'),
  -- Deutschland
  ('jasha-sutterlin',            'Jasha Sutterlin',            'Deutschland',    'DE'),
  ('max-walscheid',              'Max Walscheid',              'Deutschland',    'DE'),
  -- Großbritannien
  ('ethan-hayter',               'Ethan Hayter',               'Großbritannien', 'GB'),
  ('callum-thornley',            'Callum Thornley',            'Großbritannien', 'GB'),
  -- Guinea-Bissau
  ('apolinario-ca',              'Apolinario Ca',              'Guinea-Bissau',  'GW'),
  ('gil-landim-gomes',           'Gil Landim Gomes',           'Guinea-Bissau',  'GW'),
  -- Ungarn
  ('janos-pelikan',              'Janos Pelikan',              'Ungarn',         'HU'),
  ('barnabas-peak',              'Barnabas Peak',              'Ungarn',         'HU'),
  -- Italien
  ('filippo-ganna',              'Filippo Ganna',              'Italien',        'IT'),
  ('matteo-sobrero',             'Matteo Sobrero',             'Italien',        'IT'),
  -- Kasachstan
  ('anton-kuzmin',               'Anton Kuzmin',               'Kasachstan',     'KZ'),
  ('daniil-marukhin',            'Daniil Marukhin',            'Kasachstan',     'KZ'),
  -- Mexiko
  ('edgar-david-cadena',         'Edgar David Cadena',         'Mexiko',         'MX'),
  ('isaac-del-toro',             'Isaac del Toro',             'Mexiko',         'MX'),
  -- Norwegen
  ('tobias-foss',                'Tobias Foss',                'Norwegen',       'NO'),
  ('andreas-leknessund',         'Andreas Leknessund',         'Norwegen',       'NO'),
  -- Portugal
  ('ivo-oliveira',               'Ivo Oliveira',               'Portugal',       'PT'),
  ('nelson-oliveira',            'Nelson Oliveira',            'Portugal',       'PT'),
  -- Ruanda
  ('samuel-niyonkuru',           'Samuel Niyonkuru',           'Ruanda',         'RW'),
  ('shemu-nsengiyumva',          'Shemu Nsengiyumva',          'Ruanda',         'RW'),
  -- Spanien
  ('pablo-castrillo',            'Pablo Castrillo',            'Spanien',        'ES'),
  ('ivan-romeo',                 'Ivan Romeo',                 'Spanien',        'ES'),
  -- Schweiz
  ('stefan-bissegger',           'Stefan Bissegger',           'Schweiz',        'CH'),
  ('stefan-kung',                'Stefan Kung',                'Schweiz',        'CH'),
  -- USA
  ('brandon-mcnulty',            'Brandon Mcnulty',            'USA',            'US'),
  ('artem-shmidt',               'Artem Shmidt',               'USA',            'US'),
  -- Australien
  ('conor-leahy',                'Conor Leahy',                'Australien',     'AU'),
  -- Belize
  ('derrick-chavarria',          'Derrick Chavarria',          'Belize',         'BZ'),
  -- Brasilien
  ('henrique-da-silva-avancini', 'Henrique da Silva Avancini', 'Brasilien',      'BR'),
  -- Kaimaninseln
  ('christopher-bodden',         'Christopher Bodden',         'Kaimaninseln',   'KY'),
  -- Tschechien
  ('mathias-vacek',              'Mathias Vacek',              'Tschechien',     'CZ'),
  -- Estland
  ('madis-mihkels',              'Madis Mihkels',              'Estland',        'EE'),
  -- Honduras
  ('fredd-matute',               'Fredd Matute',               'Honduras',       'HN'),
  -- Irland
  ('ryan-mullen',                'Ryan Mullen',                'Irland',         'IE'),
  -- Japan
  ('jo-hashikawa',               'Jo Hashikawa',               'Japan',          'JP'),
  -- Jordanien
  ('majid-abu-harrah',           'Majid Abu Harrah',           'Jordanien',      'JO'),
  -- Luxemburg
  ('arthur-kluckers',            'Arthur Kluckers',            'Luxemburg',      'LU'),
  -- Mauritius
  ('alexandre-mayer',            'Alexandre Mayer',            'Mauritius',      'MU'),
  -- Mongolei
  ('maral-erdene-batmunkh',      'Maral-Erdene Batmunkh',      'Mongolei',       'MN'),
  -- Niederlande
  ('daan-hoole',                 'Daan Hoole',                 'Niederlande',    'NL'),
  -- Polen
  ('michal-kwiatkowski',         'Michal Kwiatkowski',         'Polen',          'PL'),
  -- Serbien
  ('ognjen-ilic',                'Ognjen Ilic',                'Serbien',        'RS'),
  -- Slowenien
  ('jan-tratnik',                'Jan Tratnik',                'Slowenien',      'SI'),
  -- Südafrika
  ('byron-munton',               'Byron Munton',               'Südafrika',      'ZA'),
  -- Schweden
  ('jakob-soderqvist',           'Jakob Soderqvist',           'Schweden',       'SE'),
  -- Ukraine
  ('heorhii-antonenko',          'Heorhii Antonenko',          'Ukraine',        'UA')
) as v(slug, name, team, country)
where t.year = 2026 and t.pcs_slug = 'world-championship-itt'
on conflict (tour_id, pcs_slug) do nothing;

insert into riders (tour_id, pcs_slug, name, team, country)
select t.id, v.slug, v.name, v.team, v.country
from tours t
cross join (values
  -- Belgien
  ('lotte-claes',              'Lotte Claes',              'Belgien',           'BE'),
  ('lotte-kopecky',            'Lotte Kopecky',            'Belgien',           'BE'),
  -- Kanada
  ('olivia-baril',             'Olivia Baril',             'Kanada',            'CA'),
  ('nadia-gontova',            'Nadia Gontova',            'Kanada',            'CA'),
  -- China
  ('xin-tang',                 'Xin Tang',                 'China',             'CN'),
  ('shimeng-zhu',              'Shimeng Zhu',              'China',             'CN'),
  -- Estland
  ('ann-christine-allik',      'Ann-Christine Allik',      'Estland',           'EE'),
  ('janika-loiv',              'Janika Loiv',              'Estland',           'EE'),
  -- Frankreich
  ('juliette-berthet',         'Juliette Berthet',         'Frankreich',        'FR'),
  ('cedrine-kerbaol',          'Cedrine Kerbaol',          'Frankreich',        'FR'),
  -- Deutschland
  ('franziska-koch',           'Franziska Koch',           'Deutschland',       'DE'),
  ('antonia-niedermaier',      'Antonia Niedermaier',      'Deutschland',       'DE'),
  -- Großbritannien
  ('zoe-backstedt',            'Zoe Backstedt',            'Großbritannien',    'GB'),
  ('anna-morris',              'Anna Morris',              'Großbritannien',    'GB'),
  -- Italien
  ('vittoria-guazzini',        'Vittoria Guazzini',        'Italien',           'IT'),
  ('elisa-longo-borghini',     'Elisa Longo Borghini',     'Italien',           'IT'),
  -- Kenia
  ('monica-jelimo-kiplagat',   'Monica Jelimo Kiplagat',   'Kenia',             'KE'),
  ('kendra-masiga',            'Kendra Masiga',            'Kenia',             'KE'),
  -- Mexiko
  ('romina-hinojosa',          'Romina Hinojosa',          'Mexiko',            'MX'),
  ('sara-roel',                'Sara Roel',                'Mexiko',            'MX'),
  -- Niederlande
  ('lieke-nooijen',            'Lieke Nooijen',            'Niederlande',       'NL'),
  ('demi-vollering',           'Demi Vollering',           'Niederlande',       'NL'),
  -- Neuseeland
  ('henrietta-christie',       'Henrietta Christie',       'Neuseeland',        'NZ'),
  ('bronwyn-macgregor',        'Bronwyn Macgregor',        'Neuseeland',        'NZ'),
  -- Norwegen
  ('mie-bjorndal-ottestad',    'Mie Bjorndal Ottestad',    'Norwegen',          'NO'),
  ('katrine-aalerud',          'Katrine Aalerud',          'Norwegen',          'NO'),
  -- Spanien
  ('mireia-benito',            'Mireia Benito',            'Spanien',           'ES'),
  ('paula-blasi',              'Paula Blasi',              'Spanien',           'ES'),
  -- Schweiz
  ('jasmin-liechti',           'Jasmin Liechti',           'Schweiz',           'CH'),
  ('marlen-reusser',           'Marlen Reusser',           'Schweiz',           'CH'),
  -- Ruanda
  ('diane-ingabire',           'Diane Ingabire',           'Ruanda',            'RW'),
  ('xaveline-nirere',          'Xaveline Nirere',          'Ruanda',            'RW'),
  -- USA
  ('kristen-faulkner',         'Kristen Faulkner',         'USA',               'US'),
  ('taylor-knibb',             'Taylor Knibb',             'USA',               'US'),
  -- Simbabwe
  ('skye-davidson',            'Skye Davidson',            'Simbabwe',          'ZW'),
  ('rongina-ngandu',           'Rongina Ngandu',           'Simbabwe',          'ZW'),
  -- Australien
  ('lauretta-hanson',          'Lauretta Hanson',          'Australien',        'AU'),
  -- Österreich
  ('christina-schweinberger',  'Christina Schweinberger',  'Österreich',        'AT'),
  -- Bulgarien
  ('gergana-stoyanova',        'Gergana Stoyanova',        'Bulgarien',         'BG'),
  -- Kaimaninseln
  ('alyssa-burgess',           'Alyssa Burgess',           'Kaimaninseln',      'KY'),
  -- Kolumbien
  ('diana-penuela',            'Diana Penuela',            'Kolumbien',         'CO'),
  -- Finnland
  ('anniina-ahtosalo',         'Anniina Ahtosalo',         'Finnland',          'FI'),
  -- Indonesien
  ('firotika-magh-marenda',    'Firotika Magh Marenda',    'Indonesien',        'ID'),
  -- Japan
  ('karin-abe',                'Karin Abe',                'Japan',             'JP'),
  -- Kasachstan
  ('faina-potapova',           'Faina Potapova',           'Kasachstan',        'KZ'),
  -- Mauritius
  ('lucie-de-marigny-lagesse', 'Lucie de Marigny-Lagesse', 'Mauritius',         'MU'),
  -- Namibia
  ('vera-looser',              'Vera Looser',              'Namibia',           'NA'),
  -- Polen
  ('dominika-wlodarczyk',      'Dominika Wlodarczyk',      'Polen',             'PL'),
  -- Saudi-Arabien
  ('mashael-alhazmi',          'Mashael Alhazmi',          'Saudi-Arabien',     'SA'),
  -- Slowenien
  ('nika-bobnar',              'Nika Bobnar',              'Slowenien',         'SI'),
  -- Südafrika
  ('lucy-young',               'Lucy Young',               'Südafrika',         'ZA'),
  -- Trinidad & Tobago
  ('teniel-campbell',          'Teniel Campbell',          'Trinidad & Tobago', 'TT'),
  -- Ukraine
  ('valeriya-kononenko',       'Valeriya Kononenko',       'Ukraine',           'UA')
) as v(slug, name, team, country)
where t.year = 2026 and t.pcs_slug = 'world-championship-itt-we'
on conflict (tour_id, pcs_slug) do nothing;
