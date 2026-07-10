-- 0015_startlist_2026_fix.sql — reconcile the provisional 0005 startlist against
-- the official PCS startlist (176 starters, verified 10.07.2026).
--   1) add 39 confirmed riders missing from the provisional seed (incl. Max Kanter),
--   2) fix 5 riders seeded under a wrong name/slug (same person, PCS-confirmed),
--   3) deactivate 9 riders who did not make the final field or abandoned
--      (DNS/OTL/DSQ). is_active=false hides them from tip dropdowns while
--      preserving any tips already placed on them.
-- Result: 146 seeded - 9 deactivated + 39 added = 176 active riders.
-- Idempotent (re-run reactivates/updates, never duplicates).

-- ---------------------------------------------------------------------------
-- 1) Missing riders (bib still unassigned).
-- ---------------------------------------------------------------------------
insert into riders (tour_id, pcs_slug, name, team, country)
select t.id, v.slug, v.name, v.team, v.country
from tours t
cross join (values
  -- Red Bull - BORA - hansgrohe
  ('tim-van-dijke',        'Tim van Dijke',        'Red Bull - BORA - hansgrohe',   'NL'),
  -- Lidl - Trek
  ('derek-gee-west',       'Derek Gee-West',       'Lidl - Trek',                   'CA'),
  -- EF Education - EasyPost
  ('max-walker',           'Max Walker',           'EF Education - EasyPost',       'GB'),
  -- XDS Astana Team
  ('aaron-gate',           'Aaron Gate',           'XDS Astana Team',               'NZ'),
  ('max-kanter',           'Max Kanter',           'XDS Astana Team',               'DE'),
  ('nicolas-vinokurov',    'Nicolas Vinokurov',    'XDS Astana Team',               'KZ'),
  -- Bahrain - Victorious
  ('vlad-van-mechelen',    'Vlad Van Mechelen',    'Bahrain - Victorious',          'BE'),
  -- Netcompany INEOS
  ('joshua-tarling',       'Joshua Tarling',       'Netcompany INEOS',              'GB'),
  ('tobias-foss',          'Tobias Foss',          'Netcompany INEOS',              'NO'),
  -- Soudal Quick-Step
  ('dylan-van-baarle',     'Dylan van Baarle',     'Soudal Quick-Step',             'NL'),
  ('ilan-van-wilder',      'Ilan Van Wilder',      'Soudal Quick-Step',             'BE'),
  -- Uno-X Mobility
  ('anthon-charmig',       'Anthon Charmig',       'Uno-X Mobility',                'DK'),
  -- NSN Cycling Team
  ('george-bennett',       'George Bennett',       'NSN Cycling Team',              'NZ'),
  ('tom-van-asbroeck',     'Tom Van Asbroeck',     'NSN Cycling Team',              'BE'),
  -- Lotto Intermarché
  ('baptiste-veistroffer', 'Baptiste Veistroffer', 'Lotto Intermarché',             'FR'),
  ('huub-artz',            'Huub Artz',            'Lotto Intermarché',             'NL'),
  ('liam-slock',           'Liam Slock',           'Lotto Intermarché',             'BE'),
  -- Cofidis
  ('hugo-page',            'Hugo Page',            'Cofidis',                       'FR'),
  ('piet-allegaert',       'Piet Allegaert',       'Cofidis',                       'BE'),
  -- Pinarello Q36.5 Pro Cycling Team
  ('brent-van-moer',       'Brent Van Moer',       'Pinarello Q36.5 Pro Cycling Team', 'BE'),
  ('chris-harper',         'Chris Harper',         'Pinarello Q36.5 Pro Cycling Team', 'AU'),
  ('damien-howson',        'Damien Howson',        'Pinarello Q36.5 Pro Cycling Team', 'AU'),
  ('xandro-meurisse',      'Xandro Meurisse',      'Pinarello Q36.5 Pro Cycling Team', 'BE'),
  -- Groupama - FDJ United
  ('guillaume-martin',     'Guillaume Martin',     'Groupama - FDJ United',         'FR'),
  -- Tudor Pro Cycling Team
  ('rick-pluimers',        'Rick Pluimers',        'Tudor Pro Cycling Team',        'NL'),
  -- TotalEnergies
  ('joris-delbove',        'Joris Delbove',        'TotalEnergies',                 'FR'),
  ('mathis-le-berre',      'Mathis Le Berre',      'TotalEnergies',                 'FR'),
  ('nicolas-breuillard',   'Nicolas Breuillard',   'TotalEnergies',                 'FR'),
  ('thibault-guernalec',   'Thibault Guernalec',   'TotalEnergies',                 'FR'),
  -- Team Picnic PostNL
  ('frank-van-den-broek',  'Frank van den Broek',  'Team Picnic PostNL',            'NL'),
  ('frits-biesterbos',     'Frits Biesterbos',     'Team Picnic PostNL',            'NL'),
  ('julius-van-den-berg',  'Julius van den Berg',  'Team Picnic PostNL',            'NL'),
  ('niklas-markl',         'Niklas Markl',         'Team Picnic PostNL',            'DE'),
  ('robbe-dhondt',         'Robbe Dhondt',         'Team Picnic PostNL',            'BE'),
  -- Caja Rural - Seguros RGA
  ('abel-balderstone',     'Abel Balderstone',     'Caja Rural - Seguros RGA',      'ES'),
  ('jakub-otruba',         'Jakub Otruba',         'Caja Rural - Seguros RGA',      'CZ'),
  ('joel-nicolau',         'Joel Nicolau',         'Caja Rural - Seguros RGA',      'ES'),
  ('jose-felix-parra',     'José Félix Parra',     'Caja Rural - Seguros RGA',      'ES'),
  ('sebastian-berwick',    'Sebastian Berwick',    'Caja Rural - Seguros RGA',      'AU')
) as v(slug, name, team, country)
where t.year = 2026
on conflict (tour_id, pcs_slug) do update
  set name = excluded.name, team = excluded.team,
      country = excluded.country, is_active = true;

-- ---------------------------------------------------------------------------
-- 2) Same rider, wrong seed name/slug -> correct in place (keeps their tips).
-- ---------------------------------------------------------------------------
update riders r
set pcs_slug = c.new_slug, name = c.name, team = c.team,
    country = c.country, is_active = true
from tours t, (values
  ('alexis-louvel',    'matis-louvel',             'Matis Louvel',             'NSN Cycling Team',                  'FR'),
  ('alveiro-cepeda',   'jefferson-alveiro-cepeda', 'Jefferson Alveiro Cepeda', 'Movistar Team',                     'EC'),
  ('martin-skaarseth', 'anders-skaarseth',         'Anders Skaarseth',         'Uno-X Mobility',                    'NO'),
  ('matheo-vercher',   'matteo-vercher',           'Matteo Vercher',           'TotalEnergies',                     'FR'),
  ('xabier-azparren',  'xabier-mikel-azparren',    'Xabier Mikel Azparren',    'Pinarello Q36.5 Pro Cycling Team',  'ES')
) as c(old_slug, new_slug, name, team, country)
where r.tour_id = t.id and t.year = 2026 and r.pcs_slug = c.old_slug;

-- ---------------------------------------------------------------------------
-- 3) Not in the final startlist: replaced (Rodríguez, Bennett, Træen) or
--    DNS/OTL/DSQ (struck through in the PCS list). Keep the row, hide it.
-- ---------------------------------------------------------------------------
update riders r
set is_active = false
from tours t
where r.tour_id = t.id and t.year = 2026
  and r.pcs_slug in (
    'carlos-rodriguez', 'sam-bennett', 'torstein-traen',
    'arnaud-de-lie', 'arvid-de-kleijn', 'bert-van-lerberghe',
    'cian-uijtdebroeks', 'clement-berthet', 'kelland-obrien'
  );
