-- Phase 1: stage-attached classifications + admin RPCs (0007/0008). Needs Docker.
-- Verifies: XOR(stage_id, deadline) constraint, live-derived reveal deadline,
-- is_admin gate on RPCs, and the results-before-deadline guard.
begin;
create extension if not exists pgtap;
select plan(12);

-- users: A = admin, B = normal member
insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'admin-a@example.com'),
  ('b0000000-0000-0000-0000-000000000002', 'member-b@example.com');
update profiles set status = 'active', is_admin = true, display_name = 'AdminA'
  where id = 'a0000000-0000-0000-0000-000000000001';
update profiles set status = 'active', display_name = 'MemberB'
  where id = 'b0000000-0000-0000-0000-000000000002';

insert into tours (id, year, name, is_active)
  values ('77770000-0000-0000-0000-000000000001', 2097, 'Admin Test', false);

insert into riders (id, tour_id, pcs_slug, name, team) values
  ('51110000-0000-0000-0000-000000000001', '77770000-0000-0000-0000-000000000001', 'r1', 'Rider One', 'T1'),
  ('51110000-0000-0000-0000-000000000002', '77770000-0000-0000-0000-000000000001', 'r2', 'Rider Two', 'T1');

insert into stages (id, tour_id, number, start_time, type, status) values
  ('53330000-0000-0000-0000-000000000001', '77770000-0000-0000-0000-000000000001', 1, now() - interval '1 day', 'flat', 'upcoming'),
  ('53330000-0000-0000-0000-000000000002', '77770000-0000-0000-0000-000000000001', 2, now() + interval '1 day', 'flat', 'upcoming'),
  ('53330000-0000-0000-0000-000000000003', '77770000-0000-0000-0000-000000000001', 3, now() - interval '1 day', 'ttt',  'upcoming');

-- CS attached to the past stage (deadline null -> derived); CF attached to the future stage, open.
insert into classifications (id, tour_id, stage_id, key, name, type, slots, ordered, is_open) values
  ('c5550000-0000-0000-0000-000000000001', '77770000-0000-0000-0000-000000000001', '53330000-0000-0000-0000-000000000001', 'sprint_past',   'Sprint past',   'custom', 1, false, false),
  ('c5550000-0000-0000-0000-000000000002', '77770000-0000-0000-0000-000000000001', '53330000-0000-0000-0000-000000000002', 'sprint_future', 'Sprint future', 'custom', 1, false, true);

-- ---- constraint: XOR(stage_id, deadline) ----
select throws_ok(
  $$ insert into classifications (tour_id, stage_id, key, name, type, slots, ordered, deadline, is_open)
     values ('77770000-0000-0000-0000-000000000001','53330000-0000-0000-0000-000000000001',
             'bad_both','x','custom',1,false, now(), true) $$,
  '23514', 'cannot set both stage_id and deadline');

select throws_ok(
  $$ insert into classifications (tour_id, key, name, type, slots, ordered, is_open)
     values ('77770000-0000-0000-0000-000000000001','bad_neither','y','custom',1,false, true) $$,
  '23514', 'must set stage_id or deadline');

-- ---- live-derived reveal pivot ----
select is(
  private.classification_deadline('c5550000-0000-0000-0000-000000000001'),
  (select start_time from stages where id = '53330000-0000-0000-0000-000000000001'),
  'stage-attached classification deadline derives to the stage start_time');

-- B tips the future stage-attached classification (allowed: open, derived deadline still ahead)
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', 'b0000000-0000-0000-0000-000000000002')::text, true);

select lives_ok(
  $$ insert into classification_tips (tour_id, user_id, classification_id, rider_id, slot)
     values ('77770000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002',
             'c5550000-0000-0000-0000-000000000002','51110000-0000-0000-0000-000000000001',1) $$,
  'B can tip a stage-attached classification before the stage starts');

select throws_ok(
  $$ select public.admin_set_stage_result('53330000-0000-0000-0000-000000000001',
       '51110000-0000-0000-0000-000000000001', null, true) $$,
  '42501', 'non-admin is rejected by require_admin');
reset role;

-- ---- admin path ----
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', 'a0000000-0000-0000-0000-000000000001')::text, true);

select lives_ok(
  $$ select public.admin_set_stage_result('53330000-0000-0000-0000-000000000001',
       '51110000-0000-0000-0000-000000000001', null, true) $$,
  'admin sets the stage winner and closes the stage');

select throws_ok(
  $$ select public.admin_set_stage_result('53330000-0000-0000-0000-000000000003',
       '51110000-0000-0000-0000-000000000001', null, true) $$,
  'ttt stage needs a winning team, not a rider');

select throws_ok(
  $$ select public.admin_set_classification_results('c5550000-0000-0000-0000-000000000002',
       array['51110000-0000-0000-0000-000000000001']::uuid[]) $$,
  'cannot enter results before the deadline');

select lives_ok(
  $$ select public.admin_set_classification_results('c5550000-0000-0000-0000-000000000001',
       array['51110000-0000-0000-0000-000000000001']::uuid[]) $$,
  'admin enters results once the (derived) deadline has passed');

-- A cannot see B's future stage-attached tip yet (reveal pivot = future stage start)
select is(
  (select count(*)::int from classification_tips
   where classification_id = 'c5550000-0000-0000-0000-000000000002'
     and user_id = 'b0000000-0000-0000-0000-000000000002'),
  0, 'A cannot see B''s stage-attached tip before the stage starts (derived reveal)');
reset role;

-- ---- effects ----
select is(
  (select winner_rider_id from stages where id = '53330000-0000-0000-0000-000000000001'),
  '51110000-0000-0000-0000-000000000001'::uuid, 'stage winner persisted');
select is(
  (select status from stages where id = '53330000-0000-0000-0000-000000000001'),
  'finished', 'stage closed by admin RPC');
select is(
  (select rider_id from classification_results
   where classification_id = 'c5550000-0000-0000-0000-000000000001' and rank = 1),
  '51110000-0000-0000-0000-000000000001'::uuid, 'classification result stored at rank 1');

select * from finish();
rollback;
