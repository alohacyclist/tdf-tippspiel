-- TTT team-tip scoring + per-classification point override (0004). Needs Docker.
-- Verifies: ttt tip scored by TEAM (not rider), and "gelbes Trikot" bonus uses its
-- own points (10) rather than the generic jersey points (15).
begin;
create extension if not exists pgtap;
select plan(4);

insert into auth.users (id, email) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ttt-c@example.com'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'ttt-d@example.com');
update profiles set status = 'active', display_name = 'TeamC'
  where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
update profiles set status = 'active', display_name = 'TeamD'
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

insert into tours (id, year, name, is_active)
  values ('99999999-9999-9999-9999-999999999999', 2098, 'TTT Test', false);

insert into scoring_config (tour_id, key, value) values
  ('99999999-9999-9999-9999-999999999999', 'stage_winner_points',   10),
  ('99999999-9999-9999-9999-999999999999', 'jersey_correct_points', 15);

insert into riders (id, tour_id, pcs_slug, name, team) values
  ('aaaa1111-0000-0000-0000-000000000000', '99999999-9999-9999-9999-999999999999', 'w1', 'Yellow', 'TeamW'),
  ('aaaa2222-0000-0000-0000-000000000000', '99999999-9999-9999-9999-999999999999', 'l1', 'Other',  'TeamL');

-- finished TTT, winning team = TeamW
insert into stages (id, tour_id, number, start_time, type, status, winner_team)
  values ('bbbb1111-0000-0000-0000-000000000000', '99999999-9999-9999-9999-999999999999',
          1, now() - interval '1 day', 'ttt', 'finished', 'TeamW');

-- C tips TeamW (correct, +10). D tips TeamL (wrong, 0).
insert into stage_tips (tour_id, user_id, stage_id, team) values
  ('99999999-9999-9999-9999-999999999999', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
   'bbbb1111-0000-0000-0000-000000000000', 'TeamW'),
  ('99999999-9999-9999-9999-999999999999', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
   'bbbb1111-0000-0000-0000-000000000000', 'TeamL');

-- yellow-jersey bonus: unordered, own points = 10 (must beat generic jersey 15).
insert into classifications (id, tour_id, key, name, type, slots, ordered, deadline, is_open, points)
  values ('cccc1111-0000-0000-0000-000000000000', '99999999-9999-9999-9999-999999999999',
          'yellow_s1', 'Gelbes Trikot nach Etappe 1', 'custom', 1, false,
          now() - interval '1 day', false, 10);
insert into classification_results (classification_id, rider_id, rank) values
  ('cccc1111-0000-0000-0000-000000000000', 'aaaa1111-0000-0000-0000-000000000000', 1);
-- C tips the correct rider (+10). D tips nothing.
insert into classification_tips (tour_id, user_id, classification_id, rider_id, slot) values
  ('99999999-9999-9999-9999-999999999999', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
   'cccc1111-0000-0000-0000-000000000000', 'aaaa1111-0000-0000-0000-000000000000', 1);

select is(
  (select stage_points from leaderboard where tour_id = '99999999-9999-9999-9999-999999999999'
     and user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  10::numeric, 'C stage_points = 10 (ttt team match)');
select is(
  (select special_points from leaderboard where tour_id = '99999999-9999-9999-9999-999999999999'
     and user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  10::numeric, 'C special_points = 10 yellow-bonus (own 10, not jersey 15)');
select is(
  (select correct_winners::int from leaderboard where tour_id = '99999999-9999-9999-9999-999999999999'
     and user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  1, 'C has 1 correct stage winner (ttt team match)');
select is(
  (select stage_points from leaderboard where tour_id = '99999999-9999-9999-9999-999999999999'
     and user_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  0::numeric, 'D wrong team = 0 stage points');

select * from finish();
rollback;
