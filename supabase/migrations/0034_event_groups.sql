-- 0034_event_groups.sql — tie the races of one championship together.
--   The four elite World-Championship races in Montréal are four tours: each has
--   its own startlist, its own scoring weight and its own one-stage schedule, and
--   that stays right — a tip carries a tour_id, and the RLS write policy on
--   stage_tips insists the rider belongs to that very tour.
--   What was wrong was the UI consequence: tipping the Worlds meant picking each
--   of the four races from the race switcher in turn. event_group names the
--   championship the race belongs to, so the app can list and tip all of them on
--   one page. event_group_name is what that page is called.
--   Null for a standalone race (every Grand Tour, every monument) — nothing
--   changes for those.
alter table tours add column if not exists event_group text;
alter table tours add column if not exists event_group_name text;

-- both or neither: a group without a name has nothing to put in the header
alter table tours drop constraint if exists tours_event_group_named;
alter table tours add constraint tours_event_group_named
  check ((event_group is null) = (event_group_name is null));

create index if not exists tours_event_group on tours (event_group)
  where event_group is not null;

update tours
set event_group = 'wm-2026', event_group_name = 'WM Montréal 2026'
where year = 2026
  and pcs_slug in (
    'world-championship',        -- Straßenrennen Männer, 27.09.
    'world-championship-we',     -- Straßenrennen Frauen,  26.09.
    'world-championship-itt',    -- Einzelzeitfahren Männer, 20.09.
    'world-championship-itt-we'  -- Einzelzeitfahren Frauen, 20.09.
  );
