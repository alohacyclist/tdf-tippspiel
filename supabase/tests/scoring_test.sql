-- Scoring / leaderboard correctness. Run: `supabase test db` (needs Docker).
-- Verifies flat stage points + GC partial credit (exact vs in-top3) aggregate correctly.
begin;
create extension if not exists pgtap;
select plan(4);

-- ids
-- T tour, A/B players, r1 winner, r2 loser, g1..g3 GC riders, s1 finished stage, c1 GC classification
insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'score-a@example.com'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'score-b@example.com');
update profiles set status = 'active', display_name = 'ScoreA'
  where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
update profiles set status = 'active', display_name = 'ScoreB'
  where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

insert into tours (id, year, name, is_active)
  values ('11111111-1111-1111-1111-111111111111', 2099, 'Scoring Test', false);

insert into scoring_config (tour_id, key, value) values
  ('11111111-1111-1111-1111-111111111111', 'stage_winner_points',   10),
  ('11111111-1111-1111-1111-111111111111', 'gc_exact_points',       15),
  ('11111111-1111-1111-1111-111111111111', 'gc_in_top3_points',      5),
  ('11111111-1111-1111-1111-111111111111', 'jersey_correct_points', 15);

insert into riders (id, tour_id, pcs_slug, name, team) values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'r1', 'Winner', 'TeamW'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'r2', 'Loser',  'TeamL'),
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'g1', 'GC1', 'A'),
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'g2', 'GC2', 'B'),
  ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'g3', 'GC3', 'C');

insert into stages (id, tour_id, number, start_time, type, status, winner_rider_id)
  values ('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111',
          1, now() - interval '1 day', 'flat', 'finished',
          '22222222-2222-2222-2222-222222222222');

insert into classifications (id, tour_id, key, name, type, slots, ordered, deadline, is_open)
  values ('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111',
          'gc', 'GC', 'gc', 3, true, now() - interval '1 day', false);

-- actual GC podium: g1=1, g3=2, g2=3
insert into classification_results (classification_id, rider_id, rank) values
  ('88888888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', 1),
  ('88888888-8888-8888-8888-888888888888', '66666666-6666-6666-6666-666666666666', 2),
  ('88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', 3);

-- A: stage winner r1 (correct, +10). GC slots 1=g1(exact +15), 2=g2(in-top3 wrong pos +5), 3=g3(in-top3 wrong pos +5) => 25. Total 35.
insert into stage_tips (tour_id, user_id, stage_id, rider_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222');
insert into classification_tips (tour_id, user_id, classification_id, rider_id, slot) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '88888888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', 1),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', 2),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '88888888-8888-8888-8888-888888888888', '66666666-6666-6666-6666-666666666666', 3);

-- B: stage winner r2 (wrong, 0). No GC. Total 0.
insert into stage_tips (tour_id, user_id, stage_id, rider_id) values
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   '77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333');

select is(
  (select stage_points from leaderboard where tour_id = '11111111-1111-1111-1111-111111111111' and user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  10::numeric, 'A stage_points = 10 (only the stage winner counts for the rank)');
select is(
  (select special_points from leaderboard where tour_id = '11111111-1111-1111-1111-111111111111' and user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  25::numeric, 'A special_points = 25 GC (separate column, not in the rank)');
select is(
  (select correct_winners::int from leaderboard where tour_id = '11111111-1111-1111-1111-111111111111' and user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1, 'A has 1 correct stage winner');
select is(
  (select stage_points from leaderboard where tour_id = '11111111-1111-1111-1111-111111111111' and user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0::numeric, 'B stage_points = 0');

select * from finish();
rollback;
