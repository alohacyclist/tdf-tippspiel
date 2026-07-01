-- 0005_seed_2026.sql — Tour de France 2026: full route (21 stages) + provisional startlist.
--
-- ⚠️⚠️ START TIMES ARE PLACEHOLDERS (12:00 CEST / +02). deadline = reveal = start_time,
--       so a wrong time closes tips at the wrong moment. Verify EVERY stage against the
--       official ASO roadbook before launch and UPDATE stages.start_time accordingly.
-- ⚠️ Startlist is PROVISIONAL (pre-team-presentation, 30.06.2026). Bib numbers are not yet
--    assigned (null). Only source-confirmed riders are seeded (~145 of the planned 184);
--    garbled/uncertain source entries were omitted. Re-pull after the 01.07 team
--    presentation for the final rosters + bibs.
-- Route double-verified (cyclingstage.com + cyclingnews.com). Stage types 2/10/17 differ
--    between sources; chosen: 2=hilly, 10=mountain, 17=hilly.
-- Idempotent (on conflict do nothing / targeted update).

-- ---------------------------------------------------------------------------
-- Stage 1 is a TEAM TIME TRIAL — 0003 seeded it as 'flat'. Correct it.
-- ---------------------------------------------------------------------------
update stages
set type = 'ttt', distance_km = 19.6
from tours t
where stages.tour_id = t.id and t.year = 2026 and stages.number = 1;

-- ---------------------------------------------------------------------------
-- Stages 2–21 (rest days 13.07 + 20.07 are not stages).
-- ---------------------------------------------------------------------------
insert into stages (tour_id, number, date, start_time, name, start_city, finish_city, type, distance_km, status)
select t.id, v.num, v.d::date,
       (v.d || ' 12:00:00+02')::timestamptz,          -- ⚠️ placeholder start time
       'Etappe ' || v.num, v.sc, v.fc, v.type, v.km, 'upcoming'
from tours t
cross join (values
  ( 2, '2026-07-05', 'Tarragona',        'Barcelona',            'hilly',    168.5),
  ( 3, '2026-07-06', 'Granollers',       'Les Angles',           'mountain', 195.9),
  ( 4, '2026-07-07', 'Carcassonne',      'Foix',                 'hilly',    181.9),
  ( 5, '2026-07-08', 'Lannemezan',       'Pau',                  'flat',     158.3),
  ( 6, '2026-07-09', 'Pau',              'Gavarnie-Gèdre',       'mountain', 186.2),
  ( 7, '2026-07-10', 'Hagetmau',         'Bordeaux',             'flat',     175.1),
  ( 8, '2026-07-11', 'Périgueux',        'Bergerac',             'flat',     180.4),
  ( 9, '2026-07-12', 'Malemort',         'Ussel',                'hilly',    185.5),
  (10, '2026-07-14', 'Aurillac',         'Le Lioran',            'mountain', 166.6),
  (11, '2026-07-15', 'Vichy',            'Nevers',               'flat',     161.3),
  (12, '2026-07-16', 'Magny-Cours',      'Chalon-sur-Saône',     'flat',     179.1),
  (13, '2026-07-17', 'Dole',             'Belfort',              'hilly',    205.8),
  (14, '2026-07-18', 'Mulhouse',         'Le Markstein',         'mountain', 155.3),
  (15, '2026-07-19', 'Champagnole',      'Plateau de Solaison',  'mountain', 183.9),
  (16, '2026-07-21', 'Évian-les-Bains',  'Thonon-les-Bains',     'itt',       26.1),
  (17, '2026-07-22', 'Chambéry',         'Voiron',               'hilly',    174.7),
  (18, '2026-07-23', 'Voiron',           'Orcières-Merlette',    'mountain', 185.2),
  (19, '2026-07-24', 'Gap',              'Alpe d''Huez',         'mountain', 127.9),
  (20, '2026-07-25', 'Le Bourg d''Oisans','Alpe d''Huez',        'mountain', 170.9),
  (21, '2026-07-26', 'Thoiry',           'Paris',                'flat',     133.0)
) as v(num, d, sc, fc, type, km)
where t.year = 2026
on conflict (tour_id, number) do nothing;

-- ---------------------------------------------------------------------------
-- Startlist (provisional, source-confirmed riders only). bib = null (unassigned).
-- ---------------------------------------------------------------------------
insert into riders (tour_id, pcs_slug, name, team, country)
select t.id, v.slug, v.name, v.team, v.country
from tours t
cross join (values
  -- UAE Team Emirates - XRG
  ('tadej-pogacar',        'Tadej Pogačar',        'UAE Team Emirates - XRG',       'SI'),
  ('isaac-del-toro',       'Isaac del Toro',       'UAE Team Emirates - XRG',       'MX'),
  ('felix-grossschartner', 'Felix Großschartner',  'UAE Team Emirates - XRG',       'AT'),
  ('brandon-mcnulty',      'Brandon McNulty',      'UAE Team Emirates - XRG',       'US'),
  ('nils-politt',          'Nils Politt',          'UAE Team Emirates - XRG',       'DE'),
  ('florian-vermeersch',   'Florian Vermeersch',   'UAE Team Emirates - XRG',       'BE'),
  ('tim-wellens',          'Tim Wellens',          'UAE Team Emirates - XRG',       'BE'),
  ('adam-yates',           'Adam Yates',           'UAE Team Emirates - XRG',       'GB'),
  -- Team Visma - Lease a Bike
  ('jonas-vingegaard',     'Jonas Vingegaard',     'Team Visma - Lease a Bike',     'DK'),
  ('edoardo-affini',       'Edoardo Affini',       'Team Visma - Lease a Bike',     'IT'),
  ('bruno-armirail',       'Bruno Armirail',       'Team Visma - Lease a Bike',     'FR'),
  ('victor-campenaerts',   'Victor Campenaerts',   'Team Visma - Lease a Bike',     'BE'),
  ('per-strand-hagenes',   'Per Strand Hagenes',   'Team Visma - Lease a Bike',     'NO'),
  ('matteo-jorgenson',     'Matteo Jorgenson',     'Team Visma - Lease a Bike',     'US'),
  ('sepp-kuss',            'Sepp Kuss',            'Team Visma - Lease a Bike',     'US'),
  ('davide-piganzoli',     'Davide Piganzoli',     'Team Visma - Lease a Bike',     'IT'),
  -- Red Bull - BORA - hansgrohe
  ('remco-evenepoel',      'Remco Evenepoel',      'Red Bull - BORA - hansgrohe',   'BE'),
  ('jai-hindley',          'Jai Hindley',          'Red Bull - BORA - hansgrohe',   'AU'),
  ('florian-lipowitz',     'Florian Lipowitz',     'Red Bull - BORA - hansgrohe',   'DE'),
  ('mattia-cattaneo',      'Mattia Cattaneo',      'Red Bull - BORA - hansgrohe',   'IT'),
  ('nico-denz',            'Nico Denz',            'Red Bull - BORA - hansgrohe',   'DE'),
  ('maxim-van-gils',       'Maxim Van Gils',       'Red Bull - BORA - hansgrohe',   'BE'),
  ('jan-tratnik',          'Jan Tratnik',          'Red Bull - BORA - hansgrohe',   'SI'),
  -- Lidl - Trek
  ('mads-pedersen',        'Mads Pedersen',        'Lidl - Trek',                   'DK'),
  ('juan-ayuso',           'Juan Ayuso',           'Lidl - Trek',                   'ES'),
  ('mattias-skjelmose',    'Mattias Skjelmose',    'Lidl - Trek',                   'DK'),
  ('quinn-simmons',        'Quinn Simmons',        'Lidl - Trek',                   'US'),
  ('toms-skujins',         'Toms Skujiņš',         'Lidl - Trek',                   'LV'),
  ('mathias-vacek',        'Mathias Vacek',        'Lidl - Trek',                   'CZ'),
  ('carlos-verona',        'Carlos Verona',        'Lidl - Trek',                   'ES'),
  -- Decathlon CMA CGM Team
  ('paul-seixas',          'Paul Seixas',          'Decathlon CMA CGM Team',        'FR'),
  ('tiesj-benoot',         'Tiesj Benoot',         'Decathlon CMA CGM Team',        'BE'),
  ('cees-bol',             'Cees Bol',             'Decathlon CMA CGM Team',        'NL'),
  ('daan-hoole',           'Daan Hoole',           'Decathlon CMA CGM Team',        'NL'),
  ('olav-kooij',           'Olav Kooij',           'Decathlon CMA CGM Team',        'NL'),
  ('aurelien-paret-peintre','Aurélien Paret-Peintre','Decathlon CMA CGM Team',      'FR'),
  ('nicolas-prodhomme',    'Nicolas Prodhomme',    'Decathlon CMA CGM Team',        'FR'),
  ('matthew-riccitello',   'Matthew Riccitello',   'Decathlon CMA CGM Team',        'US'),
  -- Netcompany INEOS
  ('thymen-arensman',      'Thymen Arensman',      'Netcompany INEOS',              'NL'),
  ('egan-bernal',          'Egan Bernal',          'Netcompany INEOS',              'CO'),
  ('filippo-ganna',        'Filippo Ganna',        'Netcompany INEOS',              'IT'),
  ('michal-kwiatkowski',   'Michał Kwiatkowski',   'Netcompany INEOS',              'PL'),
  ('carlos-rodriguez',     'Carlos Rodríguez',     'Netcompany INEOS',              'ES'),
  ('kevin-vauquelin',      'Kévin Vauquelin',      'Netcompany INEOS',              'FR'),
  ('dorian-godon',         'Dorian Godon',         'Netcompany INEOS',              'FR'),
  -- Alpecin - Premier Tech
  ('mathieu-van-der-poel', 'Mathieu van der Poel', 'Alpecin - Premier Tech',        'NL'),
  ('jasper-philipsen',     'Jasper Philipsen',     'Alpecin - Premier Tech',        'BE'),
  ('jonas-rickaert',       'Jonas Rickaert',       'Alpecin - Premier Tech',        'BE'),
  ('silvan-dillier',       'Silvan Dillier',       'Alpecin - Premier Tech',        'CH'),
  ('edward-planckaert',    'Edward Planckaert',    'Alpecin - Premier Tech',        'BE'),
  ('emiel-verstrynge',     'Emiel Verstrynge',     'Alpecin - Premier Tech',        'BE'),
  ('tim-marsman',          'Tim Marsman',          'Alpecin - Premier Tech',        'NL'),
  ('ramses-debruyne',      'Ramses Debruyne',      'Alpecin - Premier Tech',        'BE'),
  -- Bahrain - Victorious
  ('matej-mohoric',        'Matej Mohorič',        'Bahrain - Victorious',          'SI'),
  ('damiano-caruso',       'Damiano Caruso',       'Bahrain - Victorious',          'IT'),
  ('antonio-tiberi',       'Antonio Tiberi',       'Bahrain - Victorious',          'IT'),
  ('lenny-martinez',       'Lenny Martinez',       'Bahrain - Victorious',          'FR'),
  ('phil-bauhaus',         'Phil Bauhaus',         'Bahrain - Victorious',          'DE'),
  ('kamil-gradek',         'Kamil Gradek',         'Bahrain - Victorious',          'PL'),
  ('robert-stannard',      'Robert Stannard',      'Bahrain - Victorious',          'AU'),
  -- EF Education - EasyPost
  ('ben-healy',            'Ben Healy',            'EF Education - EasyPost',        'IE'),
  ('richard-carapaz',      'Richard Carapaz',      'EF Education - EasyPost',        'EC'),
  ('kasper-asgreen',       'Kasper Asgreen',       'EF Education - EasyPost',        'DK'),
  ('alex-baudin',          'Alex Baudin',          'EF Education - EasyPost',        'FR'),
  ('sean-quinn',           'Sean Quinn',           'EF Education - EasyPost',        'US'),
  ('georg-steinhauser',    'Georg Steinhauser',    'EF Education - EasyPost',        'DE'),
  ('michael-valgren',      'Michael Valgren',      'EF Education - EasyPost',        'DK'),
  -- Groupama - FDJ United
  ('romain-gregoire',      'Romain Grégoire',      'Groupama - FDJ United',          'FR'),
  ('clement-berthet',      'Clément Berthet',      'Groupama - FDJ United',          'FR'),
  ('clement-braz-afonso',  'Clément Braz Afonso',  'Groupama - FDJ United',          'FR'),
  ('lorenzo-germani',      'Lorenzo Germani',      'Groupama - FDJ United',          'IT'),
  ('quentin-pacher',       'Quentin Pacher',       'Groupama - FDJ United',          'FR'),
  ('clement-russo',        'Clément Russo',        'Groupama - FDJ United',          'FR'),
  ('ewen-costiou',         'Ewen Costiou',         'Groupama - FDJ United',          'FR'),
  -- Team Jayco AlUla
  ('michael-matthews',     'Michael Matthews',     'Team Jayco AlUla',              'AU'),
  ('pascal-ackermann',     'Pascal Ackermann',     'Team Jayco AlUla',              'DE'),
  ('luke-durbridge',       'Luke Durbridge',       'Team Jayco AlUla',              'AU'),
  ('felix-engelhardt',     'Felix Engelhardt',     'Team Jayco AlUla',              'DE'),
  ('kelland-obrien',       'Kelland O''Brien',     'Team Jayco AlUla',              'AU'),
  ('ben-oconnor',          'Ben O''Connor',        'Team Jayco AlUla',              'AU'),
  ('luke-plapp',           'Luke Plapp',           'Team Jayco AlUla',              'AU'),
  ('mauro-schmid',         'Mauro Schmid',         'Team Jayco AlUla',              'CH'),
  -- Lotto Intermarché
  ('arnaud-de-lie',        'Arnaud De Lie',        'Lotto Intermarché',             'BE'),
  ('lennert-van-eetvelt',  'Lennert Van Eetvelt',  'Lotto Intermarché',             'BE'),
  ('jenno-berckmoes',      'Jenno Berckmoes',      'Lotto Intermarché',             'BE'),
  ('lars-craps',           'Lars Craps',           'Lotto Intermarché',             'BE'),
  ('georg-zimmermann',     'Georg Zimmermann',     'Lotto Intermarché',             'DE'),
  -- Movistar Team
  ('pablo-castrillo',      'Pablo Castrillo',      'Movistar Team',                 'ES'),
  ('alveiro-cepeda',       'Alveiro Cepeda',       'Movistar Team',                 'CO'),
  ('raul-garcia-pierna',   'Raúl García Pierna',   'Movistar Team',                 'ES'),
  ('michel-hessmann',      'Michel Hessmann',      'Movistar Team',                 'DE'),
  ('nelson-oliveira',      'Nelson Oliveira',      'Movistar Team',                 'PT'),
  ('javier-romo',          'Javier Romo',          'Movistar Team',                 'ES'),
  ('einer-rubio',          'Einer Rubio',          'Movistar Team',                 'CO'),
  ('cian-uijtdebroeks',    'Cian Uijtdebroeks',    'Movistar Team',                 'BE'),
  -- NSN Cycling Team
  ('biniam-girmay',        'Biniam Girmay',        'NSN Cycling Team',              'ER'),
  ('sam-bennett',          'Sam Bennett',          'NSN Cycling Team',              'IE'),
  ('lewis-askey',          'Lewis Askey',          'NSN Cycling Team',              'GB'),
  ('marco-frigo',          'Marco Frigo',          'NSN Cycling Team',              'IT'),
  ('alexis-louvel',        'Alexis Louvel',        'NSN Cycling Team',              'FR'),
  ('krists-neilands',      'Krists Neilands',      'NSN Cycling Team',              'LV'),
  ('jake-stewart',         'Jake Stewart',         'NSN Cycling Team',              'GB'),
  -- Team Picnic PostNL
  ('warren-barguil',       'Warren Barguil',       'Team Picnic PostNL',            'FR'),
  ('john-degenkolb',       'John Degenkolb',       'Team Picnic PostNL',            'DE'),
  ('pavel-bittner',        'Pavel Bittner',        'Team Picnic PostNL',            'CZ'),
  -- Soudal Quick-Step
  ('tim-merlier',          'Tim Merlier',          'Soudal Quick-Step',             'BE'),
  ('valentin-paret-peintre','Valentin Paret-Peintre','Soudal Quick-Step',          'FR'),
  ('pascal-eenkhoorn',     'Pascal Eenkhoorn',     'Soudal Quick-Step',             'NL'),
  ('bert-van-lerberghe',   'Bert Van Lerberghe',   'Soudal Quick-Step',             'BE'),
  ('jasper-stuyven',       'Jasper Stuyven',       'Soudal Quick-Step',             'BE'),
  ('louis-vervaeke',       'Louis Vervaeke',       'Soudal Quick-Step',             'BE'),
  -- Uno-X Mobility
  ('tobias-halland-johannessen','Tobias Halland Johannessen','Uno-X Mobility',      'NO'),
  ('anders-halland-johannessen','Anders Halland Johannessen','Uno-X Mobility',      'NO'),
  ('jonas-abrahamsen',     'Jonas Abrahamsen',     'Uno-X Mobility',                'NO'),
  ('magnus-cort',          'Magnus Cort',          'Uno-X Mobility',                'DK'),
  ('martin-skaarseth',     'Martin Skaarseth',     'Uno-X Mobility',                'NO'),
  ('torstein-traen',       'Torstein Træen',       'Uno-X Mobility',                'NO'),
  ('soren-waerenskjold',   'Søren Wærenskjold',    'Uno-X Mobility',                'NO'),
  -- XDS Astana Team
  ('davide-ballerini',     'Davide Ballerini',     'XDS Astana Team',               'IT'),
  ('simone-velasco',       'Simone Velasco',       'XDS Astana Team',               'IT'),
  ('sergio-higuita',       'Sergio Higuita',       'XDS Astana Team',               'CO'),
  ('harold-tejada',        'Harold Tejada',        'XDS Astana Team',               'CO'),
  ('mike-teunissen',       'Mike Teunissen',       'XDS Astana Team',               'NL'),
  -- Tudor Pro Cycling Team
  ('julian-alaphilippe',   'Julian Alaphilippe',   'Tudor Pro Cycling Team',        'FR'),
  ('marc-hirschi',         'Marc Hirschi',         'Tudor Pro Cycling Team',        'CH'),
  ('matteo-trentin',       'Matteo Trentin',       'Tudor Pro Cycling Team',        'IT'),
  ('michael-storer',       'Michael Storer',       'Tudor Pro Cycling Team',        'AU'),
  ('marco-haller',         'Marco Haller',         'Tudor Pro Cycling Team',        'AT'),
  ('arvid-de-kleijn',      'Arvid de Kleijn',      'Tudor Pro Cycling Team',        'NL'),
  ('yannis-voisard',       'Yannis Voisard',       'Tudor Pro Cycling Team',        'CH'),
  -- Pinarello Q36.5 Pro Cycling Team
  ('tom-pidcock',          'Tom Pidcock',          'Pinarello Q36.5 Pro Cycling Team','GB'),
  ('fred-wright',          'Fred Wright',          'Pinarello Q36.5 Pro Cycling Team','GB'),
  ('quinten-hermans',      'Quinten Hermans',      'Pinarello Q36.5 Pro Cycling Team','BE'),
  ('xabier-azparren',      'Xabier Azparren',      'Pinarello Q36.5 Pro Cycling Team','ES'),
  -- Cofidis
  ('ion-izagirre',         'Ion Izagirre',         'Cofidis',                       'ES'),
  ('alex-aranburu',        'Alex Aranburu',        'Cofidis',                       'ES'),
  ('jenthe-biermans',      'Jenthe Biermans',      'Cofidis',                       'BE'),
  ('milan-fretin',         'Milan Fretin',         'Cofidis',                       'BE'),
  ('alex-kirsch',          'Alex Kirsch',          'Cofidis',                       'LU'),
  ('benjamin-thomas',      'Benjamin Thomas',      'Cofidis',                       'FR'),
  -- TotalEnergies
  ('anthony-turgis',       'Anthony Turgis',       'TotalEnergies',                 'FR'),
  ('jordan-jegat',         'Jordan Jegat',         'TotalEnergies',                 'FR'),
  ('matheo-vercher',       'Mathéo Vercher',       'TotalEnergies',                 'FR'),
  ('alexandre-delettre',   'Alexandre Delettre',   'TotalEnergies',                 'FR'),
  -- Caja Rural - Seguros RGA
  ('fernando-gaviria',     'Fernando Gaviria',     'Caja Rural - Seguros RGA',      'CO'),
  ('stefano-oldani',       'Stefano Oldani',       'Caja Rural - Seguros RGA',      'IT')
) as v(slug, name, team, country)
where t.year = 2026
on conflict (tour_id, pcs_slug) do nothing;
