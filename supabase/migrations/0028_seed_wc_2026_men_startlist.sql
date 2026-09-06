-- 0028_seed_wc_2026_men_startlist.sql — provisional startlist for the 2026 World
-- Championships men's road race: 81 riders across 24 nations (PCS provisional list,
-- 06.09.2026). Slovenia is listed without riders yet and therefore absent.
-- At the Worlds riders race for their NATION, so riders.team holds the country
-- (German label) and riders.country the ISO code. Nations are display-only here —
-- the race is not a TTT, so no team validation depends on them.
-- Startlists for the Worlds stay volatile until race day; reconcile later like the
-- Vuelta did in 0021. Idempotent.
insert into riders (tour_id, pcs_slug, name, team, country)
select t.id, v.slug, v.name, v.team, v.country
from tours t
cross join (values
  -- Dänemark
  ('soren-kragh-andersen',       'Soren Kragh Andersen',       'Dänemark',    'DK'),
  ('michael-valgren',            'Michael Valgren',            'Dänemark',    'DK'),
  ('andreas-kron',               'Andreas Kron',               'Dänemark',    'DK'),
  ('mattias-skjelmose',          'Mattias Skjelmose',          'Dänemark',    'DK'),
  ('mikkel-frolich-honore',      'Mikkel Frolich Honore',      'Dänemark',    'DK'),
  ('mads-pedersen',              'Mads Pedersen',              'Dänemark',    'DK'),
  ('mikkel-bjerg',               'Mikkel Bjerg',               'Dänemark',    'DK'),
  ('kasper-asgreen',             'Kasper Asgreen',             'Dänemark',    'DK'),
  -- Niederlande
  ('menno-huising',              'Menno Huising',              'Niederlande', 'NL'),
  ('mathijs-paasschens',         'Mathijs Paasschens',         'Niederlande', 'NL'),
  ('pascal-eenkhoorn',           'Pascal Eenkhoorn',           'Niederlande', 'NL'),
  ('bauke-mollema',              'Bauke Mollema',              'Niederlande', 'NL'),
  ('tim-van-dijke',              'Tim van Dijke',              'Niederlande', 'NL'),
  ('bart-lemmen',                'Bart Lemmen',                'Niederlande', 'NL'),
  ('daan-hoole',                 'Daan Hoole',                 'Niederlande', 'NL'),
  ('mathieu-van-der-poel',       'Mathieu van der Poel',       'Niederlande', 'NL'),
  -- USA
  ('matteo-jorgenson',           'Matteo Jorgenson',           'USA',         'US'),
  ('larry-warbasse',             'Larry Warbasse',             'USA',         'US'),
  ('kevin-vermaerke',            'Kevin Vermaerke',            'USA',         'US'),
  ('artem-shmidt',               'Artem Shmidt',               'USA',         'US'),
  ('sean-quinn',                 'Sean Quinn',                 'USA',         'US'),
  ('neilson-powless',            'Neilson Powless',            'USA',         'US'),
  ('brandon-mcnulty',            'Brandon McNulty',            'USA',         'US'),
  ('quinn-simmons',              'Quinn Simmons',              'USA',         'US'),
  -- Mexiko
  ('jose-antonio-escarcega',     'Jose Antonio Escarcega',     'Mexiko',      'MX'),
  ('ulises-alfredo-castillo',    'Ulises Alfredo Castillo',    'Mexiko',      'MX'),
  ('edgar-david-cadena',         'Edgar David Cadena',         'Mexiko',      'MX'),
  ('eder-frayre',                'Eder Frayre',                'Mexiko',      'MX'),
  ('carlos-alfonso-garcia',      'Carlos Alfonso Garcia',      'Mexiko',      'MX'),
  ('isaac-del-toro',             'Isaac del Toro',             'Mexiko',      'MX'),
  ('tomas-aguirre-garza',        'Tomas Aguirre Garza',        'Mexiko',      'MX'),
  -- Kolumbien
  ('sergio-higuita',             'Sergio Higuita',             'Kolumbien',   'CO'),
  ('walter-vargas',              'Walter Vargas',              'Kolumbien',   'CO'),
  ('santiago-buitrago',          'Santiago Buitrago',          'Kolumbien',   'CO'),
  ('harold-tejada',              'Harold Tejada',              'Kolumbien',   'CO'),
  ('brandon-smith-rivera',       'Brandon Smith Rivera',       'Kolumbien',   'CO'),
  ('egan-bernal',                'Egan Bernal',                'Kolumbien',   'CO'),
  ('nairo-quintana',             'Nairo Quintana',             'Kolumbien',   'CO'),
  -- Kanada
  ('derek-gee-west',             'Derek Gee-West',             'Kanada',      'CA'),
  ('hugo-houle',                 'Hugo Houle',                 'Kanada',      'CA'),
  ('pier-andre-cote',            'Pier-Andre Cote',            'Kanada',      'CA'),
  ('nickolas-zukowsky',          'Nickolas Zukowsky',          'Kanada',      'CA'),
  ('michael-woods',              'Michael Woods',              'Kanada',      'CA'),
  ('michael-leonard',            'Michael Leonard',            'Kanada',      'CA'),
  -- Neuseeland
  ('laurence-pithie',            'Laurence Pithie',            'Neuseeland',  'NZ'),
  ('josh-kench',                 'Josh Kench',                 'Neuseeland',  'NZ'),
  ('george-bennett',             'George Bennett',             'Neuseeland',  'NZ'),
  ('finn-fisher-black',          'Finn Fisher-Black',          'Neuseeland',  'NZ'),
  ('corbin-strong',              'Corbin Strong',              'Neuseeland',  'NZ'),
  ('ben-oliver',                 'Ben Oliver',                 'Neuseeland',  'NZ'),
  -- Norwegen
  ('tobias-halland-johannessen', 'Tobias Halland Johannessen', 'Norwegen',    'NO'),
  ('anders-skaarseth',           'Anders Skaarseth',           'Norwegen',    'NO'),
  ('andreas-leknessund',         'Andreas Leknessund',         'Norwegen',    'NO'),
  ('jorgen-nordhagen',           'Jorgen Nordhagen',           'Norwegen',    'NO'),
  ('embret-svestad-bardseng',    'Embret Svestad-Bardseng',    'Norwegen',    'NO'),
  ('tobias-foss',                'Tobias Foss',                'Norwegen',    'NO'),
  -- Ecuador
  ('jefferson-alexander-cepeda', 'Jefferson Alexander Cepeda', 'Ecuador',     'EC'),
  ('jefferson-alveiro-cepeda',   'Jefferson Alveiro Cepeda',   'Ecuador',     'EC'),
  ('jhonatan-narvaez',           'Jhonatan Narvaez',           'Ecuador',     'EC'),
  ('richard-carapaz',            'Richard Carapaz',            'Ecuador',     'EC'),
  -- Irland
  ('ryan-mullen',                'Ryan Mullen',                'Irland',      'IE'),
  ('jamie-meehan',               'Jamie Meehan',               'Irland',      'IE'),
  ('darren-rafferty',            'Darren Rafferty',            'Irland',      'IE'),
  ('ben-healy',                  'Ben Healy',                  'Irland',      'IE'),
  -- Österreich
  ('patrick-konrad',             'Patrick Konrad',             'Österreich',  'AT'),
  ('felix-grossschartner',       'Felix Großschartner',        'Österreich',  'AT'),
  ('felix-gall',                 'Felix Gall',                 'Österreich',  'AT'),
  -- Belgien
  ('remco-evenepoel',            'Remco Evenepoel',            'Belgien',     'BE'),
  ('wout-van-aert',              'Wout van Aert',              'Belgien',     'BE'),
  -- Brasilien
  ('henrique-da-silva-avancini', 'Henrique da Silva Avancini', 'Brasilien',   'BR'),
  -- Frankreich
  ('paul-seixas',                'Paul Seixas',                'Frankreich',  'FR'),
  -- Italien
  ('alberto-bettiol',            'Alberto Bettiol',            'Italien',     'IT'),
  -- Japan
  ('jo-hashikawa',               'Jo Hashikawa',               'Japan',       'JP'),
  -- Mauritius
  ('alexandre-mayer',            'Alexandre Mayer',            'Mauritius',   'MU'),
  -- Monaco
  ('victor-langellotti',         'Victor Langellotti',         'Monaco',      'MC'),
  -- Polen
  ('michal-kwiatkowski',         'Michal Kwiatkowski',         'Polen',       'PL'),
  -- Portugal
  ('afonso-eulalio',             'Afonso Eulalio',             'Portugal',    'PT'),
  -- Südafrika
  ('byron-munton',               'Byron Munton',               'Südafrika',   'ZA'),
  -- Spanien
  ('juan-ayuso',                 'Juan Ayuso',                 'Spanien',     'ES'),
  -- Schweden
  ('jakob-soderqvist',           'Jakob Soderqvist',           'Schweden',    'SE'),
  -- Tschechien
  ('mathias-vacek',              'Mathias Vacek',              'Tschechien',  'CZ')
) as v(slug, name, team, country)
where t.year = 2026 and t.pcs_slug = 'world-championship'
on conflict (tour_id, pcs_slug) do nothing;
