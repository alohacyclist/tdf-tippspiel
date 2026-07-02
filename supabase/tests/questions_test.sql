-- Phase 2/3: free-form questions (0009/0010) + leaderboard v3 scoring (0011). Needs Docker.
-- Verifies value/shape constraints, cross-question option guard, admin gate, the
-- result-before-deadline guard, reveal timing, and additive no-double-count scoring.
begin;
create extension if not exists pgtap;
select plan(11);

insert into auth.users (id, email) values
  ('a1000000-0000-0000-0000-000000000001', 'q-admin@example.com'),
  ('b2000000-0000-0000-0000-000000000002', 'q-b@example.com'),
  ('c3000000-0000-0000-0000-000000000003', 'q-c@example.com');
update profiles set status = 'active', is_admin = true, display_name = 'QAdmin'
  where id = 'a1000000-0000-0000-0000-000000000001';
update profiles set status = 'active', display_name = 'QB'
  where id = 'b2000000-0000-0000-0000-000000000002';
update profiles set status = 'active', display_name = 'QC'
  where id = 'c3000000-0000-0000-0000-000000000003';

insert into tours (id, year, name, is_active)
  values ('77771111-0000-0000-0000-000000000001', 2096, 'Questions Test', false);

insert into stages (id, tour_id, number, start_time, type, status) values
  ('53331111-0000-0000-0000-000000000002', '77771111-0000-0000-0000-000000000001', 1, now() + interval '1 day', 'flat', 'upcoming');

-- tour-wide questions, deadline past; QU stays unresolved (must score 0)
insert into question (id, tour_id, kind, prompt, points, deadline, is_open, is_resolved) values
  ('b0b00000-0000-0000-0000-000000000001', '77771111-0000-0000-0000-000000000001', 'boolean', 'QB', 5, now() - interval '1 day', false, true),
  ('cc000000-0000-0000-0000-000000000002', '77771111-0000-0000-0000-000000000001', 'choice',  'QC', 7, now() - interval '1 day', false, true),
  ('dd000000-0000-0000-0000-000000000003', '77771111-0000-0000-0000-000000000001', 'boolean', 'QU', 9, now() - interval '1 day', false, false);
-- stage-attached (deadline derived = future stage start), open for the reveal test
insert into question (id, tour_id, stage_id, kind, prompt, points, is_open) values
  ('ee000000-0000-0000-0000-000000000004', '77771111-0000-0000-0000-000000000001', '53331111-0000-0000-0000-000000000002', 'boolean', 'QS', 3, true);

insert into question_option (id, question_id, label, sort_order) values
  ('a1100000-0000-0000-0000-000000000001', 'cc000000-0000-0000-0000-000000000002', 'Option A', 0),
  ('a2200000-0000-0000-0000-000000000002', 'cc000000-0000-0000-0000-000000000002', 'Option B', 1);

insert into question_result (question_id, bool_value) values
  ('b0b00000-0000-0000-0000-000000000001', true);
insert into question_result (question_id, option_id) values
  ('cc000000-0000-0000-0000-000000000002', 'a1100000-0000-0000-0000-000000000001');

-- answers (direct inserts bypass RLS as owner; table constraints still apply)
insert into question_answer (tour_id, user_id, question_id, bool_value) values
  ('77771111-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000002', 'b0b00000-0000-0000-0000-000000000001', true),   -- B correct +5
  ('77771111-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000003', 'b0b00000-0000-0000-0000-000000000001', false),  -- C wrong 0
  ('77771111-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000002', 'dd000000-0000-0000-0000-000000000003', true),   -- B unresolved -> 0
  ('77771111-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000002', 'ee000000-0000-0000-0000-000000000004', true);   -- B future (reveal)
insert into question_answer (tour_id, user_id, question_id, option_id) values
  ('77771111-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000002', 'cc000000-0000-0000-0000-000000000002', 'a1100000-0000-0000-0000-000000000001'),  -- B correct +7
  ('77771111-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000003', 'cc000000-0000-0000-0000-000000000002', 'a2200000-0000-0000-0000-000000000002');  -- C wrong 0

-- ---- scoring ----
select is(
  (select total_points from leaderboard where tour_id = '77771111-0000-0000-0000-000000000001'
     and user_id = 'b2000000-0000-0000-0000-000000000002'),
  12::numeric, 'B = 5 boolean + 7 choice = 12 (unresolved QU contributes 0)');
select is(
  (select total_points from leaderboard where tour_id = '77771111-0000-0000-0000-000000000001'
     and user_id = 'c3000000-0000-0000-0000-000000000003'),
  0::numeric, 'C wrong answers = 0');

-- ---- constraints ----
select throws_ok(
  $$ insert into question_answer (tour_id, user_id, question_id, option_id, bool_value)
     values ('77771111-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001',
             'cc000000-0000-0000-0000-000000000002','a1100000-0000-0000-0000-000000000001', true) $$,
  '23514', 'answer cannot carry both option and bool (qa_one_value)');
select throws_ok(
  $$ insert into question_answer (tour_id, user_id, question_id, option_id)
     values ('77771111-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001',
             'b0b00000-0000-0000-0000-000000000001','a1100000-0000-0000-0000-000000000001') $$,
  '23503', 'choosing another question''s option violates the composite FK');

-- ---- admin gate (B is not admin) ----
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', 'b2000000-0000-0000-0000-000000000002')::text, true);
select throws_ok(
  $$ select public.admin_create_question('77771111-0000-0000-0000-000000000001','boolean','x',1,
       null, now() + interval '1 day', null) $$,
  '42501', 'non-admin cannot create a question');
select throws_ok(
  $$ select public.admin_set_question_result('b0b00000-0000-0000-0000-000000000001', true, null) $$,
  '42501', 'non-admin cannot set a result');
reset role;

-- ---- admin path ----
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', 'a1000000-0000-0000-0000-000000000001')::text, true);
select throws_ok(
  $$ select public.admin_set_question_result('ee000000-0000-0000-0000-000000000004', true, null) $$,
  'cannot enter a result before the deadline');
select throws_ok(
  $$ select public.admin_set_question_result('b0b00000-0000-0000-0000-000000000001', null,
       'a1100000-0000-0000-0000-000000000001') $$,
  'result shape mismatch for question kind');
select lives_ok(
  $$ select public.admin_set_question_result('b0b00000-0000-0000-0000-000000000001', true, null) $$,
  'admin sets a boolean result after the deadline');
select is(
  (select count(*)::int from question_answer
   where question_id = 'ee000000-0000-0000-0000-000000000004'
     and user_id = 'b2000000-0000-0000-0000-000000000002'),
  0, 'A cannot see B''s stage-attached answer before the stage starts');
-- resolved question: admin_update_question must NOT push the deadline into the future
select public.admin_update_question('b0b00000-0000-0000-0000-000000000001', 'QB', 5, true,
  now() + interval '5 days');
reset role;

select ok(
  (select deadline from question where id = 'b0b00000-0000-0000-0000-000000000001') <= now(),
  'admin_update_question does not extend the deadline of a resolved question');

select * from finish();
rollback;
