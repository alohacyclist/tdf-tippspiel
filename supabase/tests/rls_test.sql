-- RLS boundary tests — the launch-critical reveal/deadline logic. Run: `supabase test db`.
-- NOTE: the auth.users seed below uses the minimal (id, email) form. If your local
-- auth schema version requires more NOT NULL columns, extend the insert accordingly.
begin;
create extension if not exists pgtap;
select plan(6);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'rls-a@example.com'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'rls-b@example.com'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'rls-c@example.com');
update profiles set status = 'active', display_name = 'RlsA' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
update profiles set status = 'active', display_name = 'RlsB' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
-- C stays 'pending'

insert into tours (id, year, name, is_active)
  values ('11111111-1111-1111-1111-111111111111', 2098, 'RLS Test', false);
insert into riders (id, tour_id, pcs_slug, name) values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'x1', 'X1'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'x2', 'X2');
insert into stages (id, tour_id, number, start_time, status) values
  ('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 1, now() + interval '1 day', 'upcoming'),
  ('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 2, now() - interval '1 day', 'finished');
-- B has tips on both stages
insert into stage_tips (tour_id, user_id, stage_id, rider_id) values
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222');

-- ===================== act as A (active) =====================
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')::text, true);

select is(
  (select count(*)::int from stage_tips
   where stage_id = '77777777-7777-7777-7777-777777777777'
     and user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0, 'A cannot see B''s tip before the stage starts (no leak)');

select is(
  (select count(*)::int from stage_tips
   where stage_id = '88888888-8888-8888-8888-888888888888'
     and user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  1, 'A sees B''s tip once the stage has started (reveal)');

select lives_ok(
  $$ select count(*) from stage_tips $$,
  'is_active() helper does not trigger RLS recursion');

select lives_ok(
  $$ insert into stage_tips (tour_id, user_id, stage_id, rider_id)
     values ('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
             '77777777-7777-7777-7777-777777777777','33333333-3333-3333-3333-333333333333') $$,
  'A can tip before the deadline');

select throws_ok(
  $$ insert into stage_tips (tour_id, user_id, stage_id, rider_id)
     values ('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
             '88888888-8888-8888-8888-888888888888','33333333-3333-3333-3333-333333333333') $$,
  '42501', 'A cannot tip after the deadline (RLS WITH CHECK)');

reset role;

-- ===================== act as C (pending) =====================
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', 'cccccccc-cccc-cccc-cccc-cccccccccccc')::text, true);

select is(
  (select count(*)::int from stages),
  0, 'pending user reads no reference data');

reset role;
select * from finish();
rollback;
