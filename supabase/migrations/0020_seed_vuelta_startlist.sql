-- 0020_seed_vuelta_startlist.sql — provisional Vuelta a España 2026 startlist:
-- 94 source-confirmed riders across 23 teams (PCS provisional list; rosters not yet
-- complete — most teams have <8 riders). bib = null, is_active defaults true.
-- Nationalities added by hand (PCS list has none). Re-pull + reconcile once the full
-- 8-rider line-ups are announced, exactly like the TdF (see 0015).
-- Idempotent (on conflict do nothing).
insert into riders (tour_id, pcs_slug, name, team, country)
select t.id, v.slug, v.name, v.team, v.country
from tours t
cross join (values
  -- UAE Team Emirates - XRG
  ('tadej-pogacar',              'Tadej Pogacar',              'UAE Team Emirates - XRG',          'SI'),
  ('joao-almeida',               'Joao Almeida',               'UAE Team Emirates - XRG',          'PT'),
  ('jay-vine',                   'Jay Vine',                   'UAE Team Emirates - XRG',          'AU'),
  ('pavel-sivakov',              'Pavel Sivakov',              'UAE Team Emirates - XRG',          'FR'),
  ('pablo-torres',               'Pablo Torres',               'UAE Team Emirates - XRG',          'ES'),
  ('kevin-vermaerke',            'Kevin Vermaerke',            'UAE Team Emirates - XRG',          'US'),
  ('ivo-oliveira',               'Ivo Oliveira',               'UAE Team Emirates - XRG',          'PT'),
  ('domen-novak',                'Domen Novak',                'UAE Team Emirates - XRG',          'SI'),
  -- Equipo Kern Pharma
  ('ivan-cobo',                  'Ivan Cobo',                  'Equipo Kern Pharma',               'ES'),
  ('mats-wenzel',                'Mats Wenzel',                'Equipo Kern Pharma',               'LU'),
  ('diego-uriarte',              'Diego Uriarte',              'Equipo Kern Pharma',               'ES'),
  ('ivan-ramiro-sosa',           'Ivan Ramiro Sosa',           'Equipo Kern Pharma',               'CO'),
  ('ibon-ruiz',                  'Ibon Ruiz',                  'Equipo Kern Pharma',               'ES'),
  ('inigo-elosegui',             'Inigo Elosegui',             'Equipo Kern Pharma',               'ES'),
  ('marc-brustenga',             'Marc Brustenga',             'Equipo Kern Pharma',               'ES'),
  ('urko-berrade',               'Urko Berrade',               'Equipo Kern Pharma',               'ES'),
  -- Movistar Team
  ('pablo-castrillo',            'Pablo Castrillo',            'Movistar Team',                    'ES'),
  ('raul-garcia-pierna',         'Raul Garcia Pierna',         'Movistar Team',                    'ES'),
  ('cian-uijtdebroeks',          'Cian Uijtdebroeks',          'Movistar Team',                    'BE'),
  ('ivan-romeo',                 'Ivan Romeo',                 'Movistar Team',                    'ES'),
  ('jorge-arcas',                'Jorge Arcas',                'Movistar Team',                    'ES'),
  ('enric-mas',                  'Enric Mas',                  'Movistar Team',                    'ES'),
  ('nairo-quintana',             'Nairo Quintana',             'Movistar Team',                    'CO'),
  -- Team Visma - Lease a Bike
  ('wout-van-aert',              'Wout van Aert',              'Team Visma - Lease a Bike',        'BE'),
  ('menno-huising',              'Menno Huising',              'Team Visma - Lease a Bike',        'NL'),
  ('tijmen-graat',               'Tijmen Graat',               'Team Visma - Lease a Bike',        'NL'),
  ('steven-kruijswijk',          'Steven Kruijswijk',          'Team Visma - Lease a Bike',        'NL'),
  ('ben-tulett',                 'Ben Tulett',                 'Team Visma - Lease a Bike',        'GB'),
  ('jorgen-nordhagen',           'Jorgen Nordhagen',           'Team Visma - Lease a Bike',        'NO'),
  ('matthew-brennan',            'Matthew Brennan',            'Team Visma - Lease a Bike',        'GB'),
  -- XDS Astana Team
  ('victor-langellotti',         'Victor Langellotti',         'XDS Astana Team',                  'MC'),
  ('lorenzo-fortunato',          'Lorenzo Fortunato',          'XDS Astana Team',                  'IT'),
  ('cristian-rodriguez',         'Cristian Rodriguez',         'XDS Astana Team',                  'ES'),
  ('clement-champoussin',        'Clement Champoussin',        'XDS Astana Team',                  'FR'),
  ('harold-martin-lopez',        'Harold Martin Lopez',        'XDS Astana Team',                  'EC'),
  ('harold-tejada',              'Harold Tejada',              'XDS Astana Team',                  'CO'),
  ('henok-mulubrhan',            'Henok Mulubrhan',            'XDS Astana Team',                  'ER'),
  -- Soudal Quick-Step
  ('valentin-paret-peintre',     'Valentin Paret-Peintre',     'Soudal Quick-Step',                'FR'),
  ('mikel-landa',                'Mikel Landa',                'Soudal Quick-Step',                'ES'),
  ('alberto-dainese',            'Alberto Dainese',            'Soudal Quick-Step',                'IT'),
  ('ethan-hayter',               'Ethan Hayter',               'Soudal Quick-Step',                'GB'),
  ('steff-cras',                 'Steff Cras',                 'Soudal Quick-Step',                'BE'),
  ('filippo-zana',               'Filippo Zana',               'Soudal Quick-Step',                'IT'),
  -- Red Bull - BORA - hansgrohe
  ('alexander-hajek',            'Alexander Hajek',            'Red Bull - BORA - hansgrohe',      'AT'),
  ('laurence-pithie',            'Laurence Pithie',            'Red Bull - BORA - hansgrohe',      'NZ'),
  ('gianni-vermeersch',          'Gianni Vermeersch',          'Red Bull - BORA - hansgrohe',      'BE'),
  ('primoz-roglic',              'Primoz Roglic',              'Red Bull - BORA - hansgrohe',      'SI'),
  ('luke-tuckwell',              'Luke Tuckwell',              'Red Bull - BORA - hansgrohe',      'GB'),
  -- Uno-X Mobility
  ('fredrik-dversnes-lavik',     'Fredrik Dversnes Lavik',     'Uno-X Mobility',                   'NO'),
  ('torstein-traeen',            'Torstein Traeen',            'Uno-X Mobility',                   'NO'),
  ('andreas-leknessund',         'Andreas Leknessund',         'Uno-X Mobility',                   'NO'),
  ('andreas-kron',               'Andreas Kron',               'Uno-X Mobility',                   'DK'),
  ('magnus-cort',                'Magnus Cort',                'Uno-X Mobility',                   'DK'),
  -- Alpecin - Premier Tech
  ('luca-vergallito',            'Luca Vergallito',            'Alpecin - Premier Tech',           'IT'),
  ('oscar-riesebeek',            'Oscar Riesebeek',            'Alpecin - Premier Tech',           'NL'),
  ('gal-glivar',                 'Gal Glivar',                 'Alpecin - Premier Tech',           'SI'),
  ('hugo-houle',                 'Hugo Houle',                 'Alpecin - Premier Tech',           'CA'),
  -- Netcompany INEOS
  ('laurens-de-plus',            'Laurens de Plus',            'Netcompany INEOS',                 'BE'),
  ('carlos-rodriguez',           'Carlos Rodriguez',           'Netcompany INEOS',                 'ES'),
  ('oscar-onley',                'Oscar Onley',                'Netcompany INEOS',                 'GB'),
  ('axel-laurance',              'Axel Laurance',              'Netcompany INEOS',                 'FR'),
  -- Lidl - Trek
  ('mads-pedersen',              'Mads Pedersen',              'Lidl - Trek',                      'DK'),
  ('mattias-skjelmose',          'Mattias Skjelmose',          'Lidl - Trek',                      'DK'),
  ('thibau-nys',                 'Thibau Nys',                 'Lidl - Trek',                      'BE'),
  ('mathias-sunekaer-norsgaard', 'Mathias Sunekaer Norsgaard', 'Lidl - Trek',                      'DK'),
  -- Bahrain - Victorious
  ('roman-ermakov',              'Roman Ermakov',              'Bahrain - Victorious',             'RU'),
  ('santiago-buitrago',          'Santiago Buitrago',          'Bahrain - Victorious',             'CO'),
  ('pau-miquel',                 'Pau Miquel',                 'Bahrain - Victorious',             'ES'),
  -- Decathlon CMA CGM Team
  ('leo-bisiaux',                'Leo Bisiaux',                'Decathlon CMA CGM Team',           'FR'),
  ('felix-gall',                 'Felix Gall',                 'Decathlon CMA CGM Team',           'AT'),
  ('matthew-riccitello',         'Matthew Riccitello',         'Decathlon CMA CGM Team',           'US'),
  -- EF Education - EasyPost
  ('james-shaw',                 'James Shaw',                 'EF Education - EasyPost',          'GB'),
  ('richard-carapaz',            'Richard Carapaz',            'EF Education - EasyPost',          'EC'),
  ('marijn-van-den-berg',        'Marijn van den Berg',        'EF Education - EasyPost',          'NL'),
  -- Groupama - FDJ United
  ('clement-berthet',            'Clement Berthet',            'Groupama - FDJ United',            'FR'),
  ('rudy-molard',                'Rudy Molard',                'Groupama - FDJ United',            'FR'),
  ('guillaume-martin',           'Guillaume Martin',           'Groupama - FDJ United',            'FR'),
  -- Cofidis
  ('alexis-renard',              'Alexis Renard',              'Cofidis',                          'FR'),
  ('emanuel-buchmann',           'Emanuel Buchmann',           'Cofidis',                          'DE'),
  ('bryan-coquard',              'Bryan Coquard',              'Cofidis',                          'FR'),
  -- Pinarello Q36.5 Pro Cycling Team
  ('walter-calzoni',             'Walter Calzoni',             'Pinarello Q36.5 Pro Cycling Team', 'IT'),
  ('david-de-la-cruz',           'David de la Cruz',           'Pinarello Q36.5 Pro Cycling Team', 'ES'),
  ('milan-vader',                'Milan Vader',                'Pinarello Q36.5 Pro Cycling Team', 'NL'),
  -- NSN Cycling Team
  ('jan-hirt',                   'Jan Hirt',                   'NSN Cycling Team',                 'CZ'),
  ('alexey-lutsenko',            'Alexey Lutsenko',            'NSN Cycling Team',                 'KZ'),
  -- Team Jayco AlUla
  ('luke-plapp',                 'Luke Plapp',                 'Team Jayco AlUla',                 'AU'),
  ('paul-double',                'Paul Double',                'Team Jayco AlUla',                 'GB'),
  -- Team Picnic PostNL
  ('max-poole',                  'Max Poole',                  'Team Picnic PostNL',               'GB'),
  ('juan-guillermo-martinez',    'Juan Guillermo Martinez',    'Team Picnic PostNL',               'CO'),
  -- Tudor Pro Cycling Team
  ('marco-brenner',              'Marco Brenner',              'Tudor Pro Cycling Team',           'DE'),
  ('stefan-kung',                'Stefan Kung',                'Tudor Pro Cycling Team',           'CH'),
  -- Burgos Burpellet BH
  ('jose-manuel-diaz',           'Jose Manuel Diaz',           'Burgos Burpellet BH',              'ES'),
  ('jesus-herrada',              'Jesus Herrada',              'Burgos Burpellet BH',              'ES'),
  -- Lotto Intermarché
  ('jarno-widar',                'Jarno Widar',                'Lotto Intermarché',                'BE')
) as v(slug, name, team, country)
where t.year = 2026 and t.pcs_slug = 'vuelta-a-espana'
on conflict (tour_id, pcs_slug) do nothing;
