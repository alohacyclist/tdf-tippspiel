-- 0033_seed_wc_2026_road_startlists.sql — final startlists for both World
-- Championship road races in Montréal.
--   Männer 27.09.: 190 riders / 59 nations — supersedes the provisional 81 of 0028
--   Frauen 26.09.: 148 riders / 55 nations
-- riders.team holds the NATION, riders.country the ISO code.
-- The men's insert upserts (a provisional entry is corrected and reactivated); the
-- six riders from 0028 who did not make the final squad are deactivated, so they
-- disappear from the tip pickers while any tip already placed on them survives.
-- Idempotent.

insert into riders (tour_id, pcs_slug, name, team, country)
select t.id, v.slug, v.name, v.team, v.country
from tours t
cross join (values
  -- Belgien
  ('remco-evenepoel',            'Remco Evenepoel',            'Belgien',        'BE'),
  ('wout-van-aert',              'Wout van Aert',              'Belgien',        'BE'),
  ('tiesj-benoot',               'Tiesj Benoot',               'Belgien',        'BE'),
  ('quinten-hermans',            'Quinten Hermans',            'Belgien',        'BE'),
  ('thibau-nys',                 'Thibau Nys',                 'Belgien',        'BE'),
  ('alec-segaert',               'Alec Segaert',               'Belgien',        'BE'),
  ('maxim-van-gils',             'Maxim van Gils',             'Belgien',        'BE'),
  ('gianni-vermeersch',          'Gianni Vermeersch',          'Belgien',        'BE'),
  -- Dänemark
  ('mikkel-frolich-honore',      'Mikkel Frolich Honore',      'Dänemark',       'DK'),
  ('kasper-asgreen',             'Kasper Asgreen',             'Dänemark',       'DK'),
  ('mikkel-bjerg',               'Mikkel Bjerg',               'Dänemark',       'DK'),
  ('mads-pedersen',              'Mads Pedersen',              'Dänemark',       'DK'),
  ('andreas-kron',               'Andreas Kron',               'Dänemark',       'DK'),
  ('michael-valgren',            'Michael Valgren',            'Dänemark',       'DK'),
  ('soren-kragh-andersen',       'Soren Kragh Andersen',       'Dänemark',       'DK'),
  ('anthon-charmig',             'Anthon Charmig',             'Dänemark',       'DK'),
  -- Frankreich
  ('paul-seixas',                'Paul Seixas',                'Frankreich',     'FR'),
  ('pavel-sivakov',              'Pavel Sivakov',              'Frankreich',     'FR'),
  ('bruno-armirail',             'Bruno Armirail',             'Frankreich',     'FR'),
  ('jordan-labrosse',            'Jordan Labrosse',            'Frankreich',     'FR'),
  ('valentin-paret-peintre',     'Valentin Paret-Peintre',     'Frankreich',     'FR'),
  ('nicolas-prodhomme',          'Nicolas Prodhomme',          'Frankreich',     'FR'),
  ('alex-baudin',                'Alex Baudin',                'Frankreich',     'FR'),
  ('jordan-jegat',               'Jordan Jegat',               'Frankreich',     'FR'),
  -- Großbritannien
  ('tom-pidcock',                'Tom Pidcock',                'Großbritannien', 'GB'),
  ('mark-donovan',               'Mark Donovan',               'Großbritannien', 'GB'),
  ('oscar-onley',                'Oscar Onley',                'Großbritannien', 'GB'),
  ('finlay-pickering',           'Finlay Pickering',           'Großbritannien', 'GB'),
  ('james-shaw',                 'James Shaw',                 'Großbritannien', 'GB'),
  ('callum-thornley',            'Callum Thornley',            'Großbritannien', 'GB'),
  ('fred-wright',                'Fred Wright',                'Großbritannien', 'GB'),
  ('adam-yates',                 'Adam Yates',                 'Großbritannien', 'GB'),
  -- Italien
  ('alberto-bettiol',            'Alberto Bettiol',            'Italien',        'IT'),
  ('mattia-cattaneo',            'Mattia Cattaneo',            'Italien',        'IT'),
  ('giulio-ciccone',             'Giulio Ciccone',             'Italien',        'IT'),
  ('lorenzo-mark-finn',          'Lorenzo Mark Finn',          'Italien',        'IT'),
  ('giulio-pellizzari',          'Giulio Pellizzari',          'Italien',        'IT'),
  ('davide-piganzoli',           'Davide Piganzoli',           'Italien',        'IT'),
  ('christian-scaroni',          'Christian Scaroni',          'Italien',        'IT'),
  ('matteo-trentin',             'Matteo Trentin',             'Italien',        'IT'),
  -- Niederlande
  ('mathieu-van-der-poel',       'Mathieu van der Poel',       'Niederlande',    'NL'),
  ('daan-hoole',                 'Daan Hoole',                 'Niederlande',    'NL'),
  ('bart-lemmen',                'Bart Lemmen',                'Niederlande',    'NL'),
  ('tim-van-dijke',              'Tim van Dijke',              'Niederlande',    'NL'),
  ('bauke-mollema',              'Bauke Mollema',              'Niederlande',    'NL'),
  ('pascal-eenkhoorn',           'Pascal Eenkhoorn',           'Niederlande',    'NL'),
  ('menno-huising',              'Menno Huising',              'Niederlande',    'NL'),
  ('mathijs-paasschens',         'Mathijs Paasschens',         'Niederlande',    'NL'),
  -- Spanien
  ('juan-ayuso',                 'Juan Ayuso',                 'Spanien',        'ES'),
  ('ivan-romeo',                 'Ivan Romeo',                 'Spanien',        'ES'),
  ('raul-garcia-pierna',         'Raul Garcia Pierna',         'Spanien',        'ES'),
  ('carlos-verona',              'Carlos Verona',              'Spanien',        'ES'),
  ('igor-arrieta',               'Igor Arrieta',               'Spanien',        'ES'),
  ('markel-beloki',              'Markel Beloki',              'Spanien',        'ES'),
  ('enric-mas',                  'Enric Mas',                  'Spanien',        'ES'),
  ('marcel-camprubi',            'Marcel Camprubi',            'Spanien',        'ES'),
  -- USA
  ('quinn-simmons',              'Quinn Simmons',              'USA',            'US'),
  ('matteo-jorgenson',           'Matteo Jorgenson',           'USA',            'US'),
  ('brandon-mcnulty',            'Brandon Mcnulty',            'USA',            'US'),
  ('neilson-powless',            'Neilson Powless',            'USA',            'US'),
  ('sean-quinn',                 'Sean Quinn',                 'USA',            'US'),
  ('artem-shmidt',               'Artem Shmidt',               'USA',            'US'),
  ('kevin-vermaerke',            'Kevin Vermaerke',            'USA',            'US'),
  ('larry-warbasse',             'Larry Warbasse',             'USA',            'US'),
  -- Slowenien
  ('tilen-finkst',               'Tilen Finkst',               'Slowenien',      'SI'),
  ('gal-glivar',                 'Gal Glivar',                 'Slowenien',      'SI'),
  ('matevz-govekar',             'Matevz Govekar',             'Slowenien',      'SI'),
  ('luka-mezgec',                'Luka Mezgec',                'Slowenien',      'SI'),
  ('matej-mohoric',              'Matej Mohoric',              'Slowenien',      'SI'),
  ('jan-tratnik',                'Jan Tratnik',                'Slowenien',      'SI'),
  ('primoz-roglic',              'Primoz Roglic',              'Slowenien',      'SI'),
  -- Australien
  ('jack-haig',                  'Jack Haig',                  'Australien',     'AU'),
  ('jai-hindley',                'Jai Hindley',                'Australien',     'AU'),
  ('michael-matthews',           'Michael Matthews',           'Australien',     'AU'),
  ('ben-oconnor',                'Ben O''Connor',              'Australien',     'AU'),
  ('michael-storer',             'Michael Storer',             'Australien',     'AU'),
  ('luke-tuckwell',              'Luke Tuckwell',              'Australien',     'AU'),
  -- Kanada
  ('derek-gee-west',             'Derek Gee-West',             'Kanada',         'CA'),
  ('hugo-houle',                 'Hugo Houle',                 'Kanada',         'CA'),
  ('michael-leonard',            'Michael Leonard',            'Kanada',         'CA'),
  ('michael-woods',              'Michael Woods',              'Kanada',         'CA'),
  ('nickolas-zukowsky',          'Nickolas Zukowsky',          'Kanada',         'CA'),
  ('pier-andre-cote',            'Pier-Andre Cote',            'Kanada',         'CA'),
  -- Kolumbien
  ('nairo-quintana',             'Nairo Quintana',             'Kolumbien',      'CO'),
  ('brandon-smith-rivera',       'Brandon Smith Rivera',       'Kolumbien',      'CO'),
  ('harold-tejada',              'Harold Tejada',              'Kolumbien',      'CO'),
  ('santiago-buitrago',          'Santiago Buitrago',          'Kolumbien',      'CO'),
  ('sergio-higuita',             'Sergio Higuita',             'Kolumbien',      'CO'),
  ('wilmar-andres-paredes',      'Wilmar Andres Paredes',      'Kolumbien',      'CO'),
  -- Deutschland
  ('florian-lipowitz',           'Florian Lipowitz',           'Deutschland',    'DE'),
  ('marco-brenner',              'Marco Brenner',              'Deutschland',    'DE'),
  ('georg-zimmermann',           'Georg Zimmermann',           'Deutschland',    'DE'),
  ('felix-engelhardt',           'Felix Engelhardt',           'Deutschland',    'DE'),
  ('nico-denz',                  'Nico Denz',                  'Deutschland',    'DE'),
  ('maximilian-schachmann',      'Maximilian Schachmann',      'Deutschland',    'DE'),
  -- Mexiko
  ('isaac-del-toro',             'Isaac del Toro',             'Mexiko',         'MX'),
  ('eder-frayre',                'Eder Frayre',                'Mexiko',         'MX'),
  ('edgar-david-cadena',         'Edgar David Cadena',         'Mexiko',         'MX'),
  ('ulises-alfredo-castillo',    'Ulises Alfredo Castillo',    'Mexiko',         'MX'),
  ('jose-antonio-escarcega',     'Jose Antonio Escarcega',     'Mexiko',         'MX'),
  ('carlos-alfonso-garcia',      'Carlos Alfonso Garcia',      'Mexiko',         'MX'),
  -- Norwegen
  ('tobias-halland-johannessen', 'Tobias Halland Johannessen', 'Norwegen',       'NO'),
  ('tobias-foss',                'Tobias Foss',                'Norwegen',       'NO'),
  ('embret-svestad-bardseng',    'Embret Svestad-Bardseng',    'Norwegen',       'NO'),
  ('jorgen-nordhagen',           'Jorgen Nordhagen',           'Norwegen',       'NO'),
  ('andreas-leknessund',         'Andreas Leknessund',         'Norwegen',       'NO'),
  ('anders-skaarseth',           'Anders Skaarseth',           'Norwegen',       'NO'),
  -- Portugal
  ('afonso-eulalio',             'Afonso Eulalio',             'Portugal',       'PT'),
  ('ivo-oliveira',               'Ivo Oliveira',               'Portugal',       'PT'),
  ('tiago-antunes',              'Tiago Antunes',              'Portugal',       'PT'),
  ('nelson-oliveira',            'Nelson Oliveira',            'Portugal',       'PT'),
  ('antonio-morgado',            'Antonio Morgado',            'Portugal',       'PT'),
  ('joao-almeida',               'Joao Almeida',               'Portugal',       'PT'),
  -- Schweiz
  ('fabio-christen',             'Fabio Christen',             'Schweiz',        'CH'),
  ('jan-christen',               'Jan Christen',               'Schweiz',        'CH'),
  ('marc-hirschi',               'Marc Hirschi',               'Schweiz',        'CH'),
  ('mauro-schmid',               'Mauro Schmid',               'Schweiz',        'CH'),
  ('stefan-bissegger',           'Stefan Bissegger',           'Schweiz',        'CH'),
  ('stefan-kung',                'Stefan Kung',                'Schweiz',        'CH'),
  -- Eritrea
  ('amanuel-ghebreigzabhier',    'Amanuel Ghebreigzabhier',    'Eritrea',        'ER'),
  ('biniam-girmay',              'Biniam Girmay',              'Eritrea',        'ER'),
  ('merhawi-kudus',              'Merhawi Kudus',              'Eritrea',        'ER'),
  ('henok-mulubrhan',            'Henok Mulubrhan',            'Eritrea',        'ER'),
  ('natnael-tesfatsion',         'Natnael Tesfatsion',         'Eritrea',        'ER'),
  -- Neuseeland
  ('ben-oliver',                 'Ben Oliver',                 'Neuseeland',     'NZ'),
  ('corbin-strong',              'Corbin Strong',              'Neuseeland',     'NZ'),
  ('finn-fisher-black',          'Finn Fisher-Black',          'Neuseeland',     'NZ'),
  ('george-bennett',             'George Bennett',             'Neuseeland',     'NZ'),
  ('laurence-pithie',            'Laurence Pithie',            'Neuseeland',     'NZ'),
  -- Irland
  ('ben-healy',                  'Ben Healy',                  'Irland',         'IE'),
  ('darren-rafferty',            'Darren Rafferty',            'Irland',         'IE'),
  ('jamie-meehan',               'Jamie Meehan',               'Irland',         'IE'),
  ('ryan-mullen',                'Ryan Mullen',                'Irland',         'IE'),
  -- Lettland
  ('kristians-belohvosciks',     'Kristians Belohvosciks',     'Lettland',       'LV'),
  ('emils-liepins',              'Emils Liepins',              'Lettland',       'LV'),
  ('martins-pluto',              'Martins Pluto',              'Lettland',       'LV'),
  ('toms-skujins',               'Toms Skujins',               'Lettland',       'LV'),
  -- Polen
  ('michal-kwiatkowski',         'Michal Kwiatkowski',         'Polen',          'PL'),
  ('mateusz-gajdulewicz',        'Mateusz Gajdulewicz',        'Polen',          'PL'),
  ('jakub-kaczmarek',            'Jakub Kaczmarek',            'Polen',          'PL'),
  ('piotr-pekala',               'Piotr Pekala',               'Polen',          'PL'),
  -- Österreich
  ('felix-gall',                 'Felix Gall',                 'Österreich',     'AT'),
  ('felix-grossschartner',       'Felix Großschartner',        'Österreich',     'AT'),
  ('patrick-konrad',             'Patrick Konrad',             'Österreich',     'AT'),
  -- Tschechien
  ('mathias-vacek',              'Mathias Vacek',              'Tschechien',     'CZ'),
  ('jakub-otruba',               'Jakub Otruba',               'Tschechien',     'CZ'),
  ('pavel-novak',                'Pavel Novak',                'Tschechien',     'CZ'),
  -- Ecuador
  ('jhonatan-narvaez',           'Jhonatan Narvaez',           'Ecuador',        'EC'),
  ('jefferson-alveiro-cepeda',   'Jefferson Alveiro Cepeda',   'Ecuador',        'EC'),
  ('jefferson-alexander-cepeda', 'Jefferson Alexander Cepeda', 'Ecuador',        'EC'),
  -- Bermuda
  ('kaden-hopkins',              'Kaden Hopkins',              'Bermuda',        'BM'),
  ('nicholas-narraway',          'Nicholas Narraway',          'Bermuda',        'BM'),
  -- Guatemala
  ('manuel-rodas',               'Manuel Rodas',               'Guatemala',      'GT'),
  ('juan-mardoqueo-vasquez',     'Juan Mardoqueo Vasquez',     'Guatemala',      'GT'),
  -- Kasachstan
  ('anton-kuzmin',               'Anton Kuzmin',               'Kasachstan',     'KZ'),
  ('daniil-marukhin',            'Daniil Marukhin',            'Kasachstan',     'KZ'),
  -- Luxemburg
  ('arno-wallenborn',            'Arno Wallenborn',            'Luxemburg',      'LU'),
  ('arthur-kluckers',            'Arthur Kluckers',            'Luxemburg',      'LU'),
  -- Uruguay
  ('eric-antonio-fagundez',      'Eric Antonio Fagundez',      'Uruguay',        'UY'),
  ('guillermo-thomas-silva',     'Guillermo Thomas Silva',     'Uruguay',        'UY'),
  -- Venezuela
  ('orluis-aular',               'Orluis Aular',               'Venezuela',      'VE'),
  ('francisco-joel-penuela',     'Francisco Joel Penuela',     'Venezuela',      'VE'),
  -- Algerien
  ('oussama-abdellah-mimouni',   'Oussama Abdellah Mimouni',   'Algerien',       'DZ'),
  -- Belize
  ('derrick-chavarria',          'Derrick Chavarria',          'Belize',         'BZ'),
  -- Brasilien
  ('henrique-da-silva-avancini', 'Henrique da Silva Avancini', 'Brasilien',      'BR'),
  -- Chile
  ('vicente-rojas',              'Vicente Rojas',              'Chile',          'CL'),
  -- China
  ('you-li',                     'You Li',                     'China',          'CN'),
  -- Costa Rica
  ('luis-daniel-oses',           'Luis Daniel Oses',           'Costa Rica',     'CR'),
  -- Zypern
  ('andreas-miltiadis',          'Andreas Miltiadis',          'Zypern',         'CY'),
  -- Dominica
  ('kohath-baron',               'Kohath Baron',               'Dominica',       'DM'),
  -- Estland
  ('madis-mihkels',              'Madis Mihkels',              'Estland',        'EE'),
  -- Guinea-Bissau
  ('gil-landim-gomes',           'Gil Landim Gomes',           'Guinea-Bissau',  'GW'),
  -- Griechenland
  ('nikiforos-arvanitou',        'Nikiforos Arvanitou',        'Griechenland',   'GR'),
  -- Honduras
  ('fredd-matute',               'Fredd Matute',               'Honduras',       'HN'),
  -- Ungarn
  ('attila-valter',              'Attila Valter',              'Ungarn',         'HU'),
  -- Israel
  ('nadav-raisberg',             'Nadav Raisberg',             'Israel',         'IL'),
  -- Japan
  ('jo-hashikawa',               'Jo Hashikawa',               'Japan',          'JP'),
  -- Mauritius
  ('alexandre-mayer',            'Alexandre Mayer',            'Mauritius',      'MU'),
  -- Monaco
  ('victor-langellotti',         'Victor Langellotti',         'Monaco',         'MC'),
  -- Mongolei
  ('maral-erdene-batmunkh',      'Maral-Erdene Batmunkh',      'Mongolei',       'MN'),
  -- Panama
  ('christofer-robin-jurado',    'Christofer Robin Jurado',    'Panama',         'PA'),
  -- Rumänien
  ('iustin-ioan-vaidian',        'Iustin-Ioan Vaidian',        'Rumänien',       'RO'),
  -- Saudi-Arabien
  ('ali-al-shaikhahmed',         'Ali Al Shaikhahmed',         'Saudi-Arabien',  'SA'),
  -- Serbien
  ('mihajlo-stolic',             'Mihajlo Stolic',             'Serbien',        'RS'),
  -- Slowakei
  ('martin-svrcek',              'Martin Svrcek',              'Slowakei',       'SK'),
  -- Südafrika
  ('byron-munton',               'Byron Munton',               'Südafrika',      'ZA'),
  -- Schweden
  ('jakob-soderqvist',           'Jakob Soderqvist',           'Schweden',       'SE'),
  -- Thailand
  ('athit-poulard',              'Athit Poulard',              'Thailand',       'TH'),
  -- Ukraine
  ('heorhii-antonenko',          'Heorhii Antonenko',          'Ukraine',        'UA'),
  -- Usbekistan
  ('samandar-janikulov',         'Samandar Janikulov',         'Usbekistan',     'UZ')
) as v(slug, name, team, country)
where t.year = 2026 and t.pcs_slug = 'world-championship'
on conflict (tour_id, pcs_slug) do update
  set name = excluded.name, team = excluded.team,
      country = excluded.country, is_active = true;

update riders r
set is_active = false
from tours t
where r.tour_id = t.id and t.year = 2026 and t.pcs_slug = 'world-championship'
  and r.pcs_slug in (
    'egan-bernal',
    'josh-kench',
    'mattias-skjelmose',
    'richard-carapaz',
    'tomas-aguirre-garza',
    'walter-vargas'
  );

insert into riders (tour_id, pcs_slug, name, team, country)
select t.id, v.slug, v.name, v.team, v.country
from tours t
cross join (values
  -- Kanada
  ('adele-normand',               'Adele Normand',               'Kanada',            'CA'),
  ('alison-jackson',              'Alison Jackson',              'Kanada',            'CA'),
  ('magdeleine-vallieres',        'Magdeleine Vallieres',        'Kanada',            'CA'),
  ('maggie-coles-lyster',         'Maggie Coles-Lyster',         'Kanada',            'CA'),
  ('nadia-gontova',               'Nadia Gontova',               'Kanada',            'CA'),
  ('olivia-baril',                'Olivia Baril',                'Kanada',            'CA'),
  ('sarah-van-dam',               'Sarah van Dam',               'Kanada',            'CA'),
  -- Frankreich
  ('juliette-berthet',            'Juliette Berthet',            'Frankreich',        'FR'),
  ('cedrine-kerbaol',             'Cedrine Kerbaol',             'Frankreich',        'FR'),
  ('marie-le-net',                'Marie le Net',                'Frankreich',        'FR'),
  ('celia-gery',                  'Celia Gery',                  'Frankreich',        'FR'),
  ('lea-curinier',                'Lea Curinier',                'Frankreich',        'FR'),
  ('maeva-squiban',               'Maeva Squiban',               'Frankreich',        'FR'),
  ('evita-muzic',                 'Evita Muzic',                 'Frankreich',        'FR'),
  -- Italien
  ('elisa-longo-borghini',        'Elisa Longo Borghini',        'Italien',           'IT'),
  ('francesca-barale',            'Francesca Barale',            'Italien',           'IT'),
  ('sara-casasola',               'Sara Casasola',               'Italien',           'IT'),
  ('eleonora-camilla-gasparrini', 'Eleonora Camilla Gasparrini', 'Italien',           'IT'),
  ('erica-magnaldi',              'Erica Magnaldi',              'Italien',           'IT'),
  ('silvia-persico',              'Silvia Persico',              'Italien',           'IT'),
  ('monica-trinca-colonel',       'Monica Trinca Colonel',       'Italien',           'IT'),
  -- Niederlande
  ('demi-vollering',              'Demi Vollering',              'Niederlande',       'NL'),
  ('riejanne-markus',             'Riejanne Markus',             'Niederlande',       'NL'),
  ('lieke-nooijen',               'Lieke Nooijen',               'Niederlande',       'NL'),
  ('puck-pieterse',               'Puck Pieterse',               'Niederlande',       'NL'),
  ('karlijn-swinkels',            'Karlijn Swinkels',            'Niederlande',       'NL'),
  ('femke-de-vries',              'Femke de Vries',              'Niederlande',       'NL'),
  ('amber-kraak',                 'Amber Kraak',                 'Niederlande',       'NL'),
  -- Belgien
  ('shari-bossuyt',               'Shari Bossuyt',               'Belgien',           'BE'),
  ('lotte-claes',                 'Lotte Claes',                 'Belgien',           'BE'),
  ('lotte-kopecky',               'Lotte Kopecky',               'Belgien',           'BE'),
  ('julie-van-de-velde',          'Julie van de Velde',          'Belgien',           'BE'),
  ('margot-vanpachtenbeke',       'Margot Vanpachtenbeke',       'Belgien',           'BE'),
  ('sandrine-tas',                'Sandrine Tas',                'Belgien',           'BE'),
  -- Großbritannien
  ('zoe-backstedt',               'Zoe Backstedt',               'Großbritannien',    'GB'),
  ('lauren-dickson',              'Lauren Dickson',              'Großbritannien',    'GB'),
  ('pfeiffer-georgi',             'Pfeiffer Georgi',             'Großbritannien',    'GB'),
  ('anna-henderson',              'Anna Henderson',              'Großbritannien',    'GB'),
  ('flora-perkins',               'Flora Perkins',               'Großbritannien',    'GB'),
  ('josie-nelson',                'Josie Nelson',                'Großbritannien',    'GB'),
  -- Spanien
  ('paula-blasi',                 'Paula Blasi',                 'Spanien',           'ES'),
  ('sara-martin',                 'Sara Martin',                 'Spanien',           'ES'),
  ('mireia-benito',               'Mireia Benito',               'Spanien',           'ES'),
  ('usoa-ostolaza',               'Usoa Ostolaza',               'Spanien',           'ES'),
  ('mavi-garcia',                 'Mavi Garcia',                 'Spanien',           'ES'),
  ('sandra-alonso',               'Sandra Alonso',               'Spanien',           'ES'),
  -- Schweiz
  ('ginia-caluori',               'Ginia Caluori',               'Schweiz',           'CH'),
  ('steffi-haberlin',             'Steffi Haberlin',             'Schweiz',           'CH'),
  ('noemi-ruegg',                 'Noemi Ruegg',                 'Schweiz',           'CH'),
  ('linda-zanetti',               'Linda Zanetti',               'Schweiz',           'CH'),
  ('jasmin-liechti',              'Jasmin Liechti',              'Schweiz',           'CH'),
  ('marlen-reusser',              'Marlen Reusser',              'Schweiz',           'CH'),
  -- USA
  ('grace-arlandson',             'Grace Arlandson',             'USA',               'US'),
  ('kate-courtney',               'Kate Courtney',               'USA',               'US'),
  ('kristen-faulkner',            'Kristen Faulkner',            'USA',               'US'),
  ('alexis-magner',               'Alexis Magner',               'USA',               'US'),
  ('natalie-quinn',               'Natalie Quinn',               'USA',               'US'),
  ('lauren-stephens',             'Lauren Stephens',             'USA',               'US'),
  -- Deutschland
  ('franziska-koch',              'Franziska Koch',              'Deutschland',       'DE'),
  ('ricarda-bauernfeind',         'Ricarda Bauernfeind',         'Deutschland',       'DE'),
  ('liane-lippert',               'Liane Lippert',               'Deutschland',       'DE'),
  ('antonia-niedermaier',         'Antonia Niedermaier',         'Deutschland',       'DE'),
  ('linda-riedmann',              'Linda Riedmann',              'Deutschland',       'DE'),
  -- Norwegen
  ('katrine-aalerud',             'Katrine Aalerud',             'Norwegen',          'NO'),
  ('mie-bjorndal-ottestad',       'Mie Bjorndal Ottestad',       'Norwegen',          'NO'),
  ('sigrid-ytterhus-haugset',     'Sigrid Ytterhus Haugset',     'Norwegen',          'NO'),
  ('tiril-jorgensen',             'Tiril Jorgensen',             'Norwegen',          'NO'),
  ('marte-berg-edseth',           'Marte Berg Edseth',           'Norwegen',          'NO'),
  -- Polen
  ('dominika-wlodarczyk',         'Dominika Wlodarczyk',         'Polen',             'PL'),
  ('kasia-niewiadoma',            'Kasia Niewiadoma',            'Polen',             'PL'),
  ('marta-lach',                  'Marta Lach',                  'Polen',             'PL'),
  ('marta-jaskulska',             'Marta Jaskulska',             'Polen',             'PL'),
  ('kaja-rysz',                   'Kaja Rysz',                   'Polen',             'PL'),
  -- Australien
  ('amanda-spratt',               'Amanda Spratt',               'Australien',        'AU'),
  ('georgia-baker',               'Georgia Baker',               'Australien',        'AU'),
  ('sarah-gigante',               'Sarah Gigante',               'Australien',        'AU'),
  ('lauretta-hanson',             'Lauretta Hanson',             'Australien',        'AU'),
  -- Mexiko
  ('romina-hinojosa',             'Romina Hinojosa',             'Mexiko',            'MX'),
  ('sara-roel',                   'Sara Roel',                   'Mexiko',            'MX'),
  ('andrea-ramirez',              'Andrea Ramirez',              'Mexiko',            'MX'),
  ('lizbeth-yareli-salazar',      'Lizbeth Yareli Salazar',      'Mexiko',            'MX'),
  -- Neuseeland
  ('bronwyn-macgregor',           'Bronwyn Macgregor',           'Neuseeland',        'NZ'),
  ('ella-wyllie',                 'Ella Wyllie',                 'Neuseeland',        'NZ'),
  ('henrietta-christie',          'Henrietta Christie',          'Neuseeland',        'NZ'),
  ('niamh-fisher-black',          'Niamh Fisher-Black',          'Neuseeland',        'NZ'),
  -- Südafrika
  ('lisa-bone',                   'Lisa Bone',                   'Südafrika',         'ZA'),
  ('tiffany-keep',                'Tiffany Keep',                'Südafrika',         'ZA'),
  ('ashleigh-moolman-pasio',      'Ashleigh Moolman-Pasio',      'Südafrika',         'ZA'),
  ('hayley-preen',                'Hayley Preen',                'Südafrika',         'ZA'),
  -- Österreich
  ('katharina-sadnik',            'Katharina Sadnik',            'Österreich',        'AT'),
  ('carina-schrempf',             'Carina Schrempf',             'Österreich',        'AT'),
  ('christina-schweinberger',     'Christina Schweinberger',     'Österreich',        'AT'),
  -- China
  ('zhaoqi-feng',                 'Zhaoqi Feng',                 'China',             'CN'),
  ('xin-tang',                    'Xin Tang',                    'China',             'CN'),
  ('shimeng-zhu',                 'Shimeng Zhu',                 'China',             'CN'),
  -- Kolumbien
  ('paula-patino',                'Paula Patino',                'Kolumbien',         'CO'),
  ('diana-penuela',               'Diana Penuela',               'Kolumbien',         'CO'),
  ('laura-daniela-rojas',         'Laura Daniela Rojas',         'Kolumbien',         'CO'),
  -- Estland
  ('ann-christine-allik',         'Ann-Christine Allik',         'Estland',           'EE'),
  ('janika-loiv',                 'Janika Loiv',                 'Estland',           'EE'),
  ('aidi-gerde-tuisk',            'Aidi Gerde Tuisk',            'Estland',           'EE'),
  -- Kenia
  ('nancy-debe',                  'Nancy Debe',                  'Kenia',             'KE'),
  ('monica-jelimo-kiplagat',      'Monica Jelimo Kiplagat',      'Kenia',             'KE'),
  ('kendra-masiga',               'Kendra Masiga',               'Kenia',             'KE'),
  -- Portugal
  ('daniela-campos',              'Daniela Campos',              'Portugal',          'PT'),
  ('raquel-queiros',              'Raquel Queiros',              'Portugal',          'PT'),
  ('beatriz-roxo',                'Beatriz Roxo',                'Portugal',          'PT'),
  -- Ruanda
  ('diane-ingabire',              'Diane Ingabire',              'Ruanda',            'RW'),
  ('xaveline-nirere',             'Xaveline Nirere',             'Ruanda',            'RW'),
  ('claudette-nyirarukundo',      'Claudette Nyirarukundo',      'Ruanda',            'RW'),
  -- Dänemark
  ('cecilie-uttrup-ludwig',       'Cecilie Uttrup Ludwig',       'Dänemark',          'DK'),
  ('solbjork-minke-anderson',     'Solbjork Minke Anderson',     'Dänemark',          'DK'),
  -- Griechenland
  ('varvara-fasoi',               'Varvara Fasoi',               'Griechenland',      'GR'),
  ('argiro-milaki',               'Argiro Milaki',               'Griechenland',      'GR'),
  -- Mauritius
  ('lucie-de-marigny-lagesse',    'Lucie de Marigny-Lagesse',    'Mauritius',         'MU'),
  ('kim-le-court-pienaar',        'Kim le Court-Pienaar',        'Mauritius',         'MU'),
  -- Schweden
  ('caroline-andersson',          'Caroline Andersson',          'Schweden',          'SE'),
  ('julia-borgstrom',             'Julia Borgstrom',             'Schweden',          'SE'),
  -- Ukraine
  ('valeriya-kononenko',          'Valeriya Kononenko',          'Ukraine',           'UA'),
  ('olha-kulynych',               'Olha Kulynych',               'Ukraine',           'UA'),
  -- Simbabwe
  ('skye-davidson',               'Skye Davidson',               'Simbabwe',          'ZW'),
  ('rongina-ngandu',              'Rongina Ngandu',              'Simbabwe',          'ZW'),
  -- Algerien
  ('nesrine-houili',              'Nesrine Houili',              'Algerien',          'DZ'),
  -- Brasilien
  ('ana-vitoria-magalhaes',       'Ana Vitoria Magalhaes',       'Brasilien',         'BR'),
  -- Bulgarien
  ('gergana-stoyanova',           'Gergana Stoyanova',           'Bulgarien',         'BG'),
  -- Chile
  ('catalina-anais-soto',         'Catalina Anais Soto',         'Chile',             'CL'),
  -- Komoren
  ('ramadhan-najma',              'Ramadhan Najma',              'Komoren',           'KM'),
  -- Zypern
  ('antri-christoforou',          'Antri Christoforou',          'Zypern',            'CY'),
  -- Eritrea
  ('monalisa-araya',              'Monalisa Araya',              'Eritrea',           'ER'),
  -- Finnland
  ('ursula-linden',               'Ursula Linden',               'Finnland',          'FI'),
  -- Guatemala
  ('jasmin-gabriela-soto',        'Jasmin Gabriela Soto',        'Guatemala',         'GT'),
  -- Ungarn
  ('petra-zsanko',                'Petra Zsanko',                'Ungarn',            'HU'),
  -- Indonesien
  ('firotika-magh-marenda',       'Firotika Magh Marenda',       'Indonesien',        'ID'),
  -- Israel
  ('rotem-gafinovitz',            'Rotem Gafinovitz',            'Israel',            'IL'),
  -- Japan
  ('karin-abe',                   'Karin Abe',                   'Japan',             'JP'),
  -- Kasachstan
  ('faina-potapova',              'Faina Potapova',              'Kasachstan',        'KZ'),
  -- Luxemburg
  ('nina-berton',                 'Nina Berton',                 'Luxemburg',         'LU'),
  -- Namibia
  ('vera-looser',                 'Vera Looser',                 'Namibia',           'NA'),
  -- Panama
  ('wendy-ducreux',               'Wendy Ducreux',               'Panama',            'PA'),
  -- Paraguay
  ('agua-marina-espinola',        'Agua Marina Espinola',        'Paraguay',          'PY'),
  -- Philippinen
  ('mary-joyce-monton',           'Mary Joyce Monton',           'Philippinen',       'PH'),
  -- Saudi-Arabien
  ('mashael-alhazmi',             'Mashael Alhazmi',             'Saudi-Arabien',     'SA'),
  -- Slowakei
  ('tereza-kurnicka',             'Tereza Kurnicka',             'Slowakei',          'SK'),
  -- Slowenien
  ('nika-bobnar',                 'Nika Bobnar',                 'Slowenien',         'SI'),
  -- Thailand
  ('pittayapron-seatun',          'Pittayapron Seatun',          'Thailand',          'TH'),
  -- Trinidad & Tobago
  ('teniel-campbell',             'Teniel Campbell',             'Trinidad & Tobago', 'TT'),
  -- Usbekistan
  ('madina-kakhkhorova',          'Madina Kakhkhorova',          'Usbekistan',        'UZ'),
  -- Venezuela
  ('lilibeth-chacon',             'Lilibeth Chacon',             'Venezuela',         'VE')
) as v(slug, name, team, country)
where t.year = 2026 and t.pcs_slug = 'world-championship-we'
on conflict (tour_id, pcs_slug) do nothing;

-- Vuelta stage 3 was abandoned (weather): annul it so it scores nothing and the
-- automated ingester stops trying to give it a winner.
update stages s
set status = 'void', winner_rider_id = null, winner_team = null
from tours t
where s.tour_id = t.id and t.year = 2026
  and t.pcs_slug = 'vuelta-a-espana' and s.number = 3;
