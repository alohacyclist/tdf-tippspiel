-- Roles (0014): editor may manage content, admin additionally deletes + assigns roles.
-- Needs Docker.
begin;
create extension if not exists pgtap;
select plan(7);

insert into auth.users (id, email) values
  ('aa000000-0000-0000-0000-000000000001', 'role-admin@example.com'),
  ('ee000000-0000-0000-0000-000000000002', 'role-editor@example.com'),
  ('ff000000-0000-0000-0000-000000000003', 'role-member@example.com');
update profiles set status = 'active', role = 'admin',  display_name = 'RoleAdmin'
  where id = 'aa000000-0000-0000-0000-000000000001';
update profiles set status = 'active', role = 'editor', display_name = 'RoleEditor'
  where id = 'ee000000-0000-0000-0000-000000000002';
update profiles set status = 'active', role = 'member', display_name = 'RoleMember'
  where id = 'ff000000-0000-0000-0000-000000000003';

insert into tours (id, year, name, is_active)
  values ('66660000-0000-0000-0000-000000000001', 2095, 'Roles Test', false);

-- a tour-wide question to attempt deleting
insert into question (id, tour_id, kind, prompt, points, deadline, is_open) values
  ('b0000000-0000-0000-0000-000000000004', '66660000-0000-0000-0000-000000000001',
   'boolean', 'QX', 1, now() + interval '1 day', true);

-- ---- editor: content yes, delete/roles no ----
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', 'ee000000-0000-0000-0000-000000000002')::text, true);
select lives_ok(
  $$ select public.admin_create_question('66660000-0000-0000-0000-000000000001','boolean','q',1,
       null, now() + interval '1 day', null) $$,
  'editor can create content');
select throws_ok(
  $$ select public.admin_delete_question('b0000000-0000-0000-0000-000000000004') $$,
  '42501', 'editor cannot delete (admin only)');
select throws_ok(
  $$ select public.admin_set_role('ff000000-0000-0000-0000-000000000003','admin') $$,
  '42501', 'editor cannot assign roles');
reset role;

-- ---- member: no content ----
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', 'ff000000-0000-0000-0000-000000000003')::text, true);
select throws_ok(
  $$ select public.admin_create_question('66660000-0000-0000-0000-000000000001','boolean','q2',1,
       null, now() + interval '1 day', null) $$,
  '42501', 'member cannot create content');
reset role;

-- ---- admin: role management ----
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', 'aa000000-0000-0000-0000-000000000001')::text, true);
select lives_ok(
  $$ select public.admin_set_role('ff000000-0000-0000-0000-000000000003','editor') $$,
  'admin can assign a role');
select throws_ok(
  $$ select public.admin_set_role('aa000000-0000-0000-0000-000000000001','member') $$,
  'cannot remove the last admin');
reset role;

select is(
  (select role from profiles where id = 'ff000000-0000-0000-0000-000000000003'),
  'editor', 'role change persisted');

select * from finish();
rollback;
