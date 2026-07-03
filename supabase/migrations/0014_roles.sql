-- 0014_roles.sql
-- Roles: member | editor | admin. Editors may MANAGE CONTENT (questions,
-- classifications, options, results, stage winners); admins additionally DELETE
-- content and assign roles. Replaces the profiles.is_admin flag.

alter table profiles
  add column if not exists role text not null default 'member'
  check (role in ('member', 'editor', 'admin'));

-- carry existing admins over to the new role before retiring is_admin.
update profiles set role = 'admin' where is_admin;

-- is_admin() now reads role; every existing caller keeps its admin-only meaning.
create or replace function private.is_admin(uid uuid)
  returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select p.role = 'admin' from public.profiles p where p.id = uid and p.status = 'active'),
    false);
$$;

-- content gate: editor OR admin.
create or replace function private.can_edit(uid uuid)
  returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select p.role in ('editor', 'admin') from public.profiles p where p.id = uid and p.status = 'active'),
    false);
$$;

revoke execute on all functions in schema private from public;
grant execute on all functions in schema private to authenticated, anon;

-- CONTENT gate. The Phase-1/2 content RPCs all call require_admin(); redefining it
-- here opens exactly those to editors without recreating each one. Admin-ONLY
-- operations (deletes, role assignment) are re-gated to require_admin_strict() below.
create or replace function private.require_admin()
  returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.can_edit(auth.uid()) then
    raise exception 'forbidden: editor or admin only' using errcode = '42501';
  end if;
end $$;
revoke execute on function private.require_admin() from public;
grant execute on function private.require_admin() to authenticated;

create or replace function private.require_admin_strict()
  returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin(auth.uid()) then
    raise exception 'forbidden: admin only' using errcode = '42501';
  end if;
end $$;
revoke execute on function private.require_admin_strict() from public;
grant execute on function private.require_admin_strict() to authenticated;

-- ---------------------------------------------------------------------------
-- Re-gate destructive ops to admin-only (bodies unchanged from 0010/0012, only the
-- gate switches from require_admin -> require_admin_strict now that require_admin
-- means "editor or admin").
-- ---------------------------------------------------------------------------
create or replace function public.admin_delete_classification(p_id uuid)
  returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin_strict();
  delete from public.classifications where id = p_id;
end $$;

create or replace function public.admin_delete_question(p_id uuid)
  returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin_strict();
  delete from public.question where id = p_id;
end $$;

create or replace function public.admin_delete_question_option(p_option_id uuid)
  returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin_strict();
  if exists (select 1 from public.question_answer where option_id = p_option_id) then
    raise exception 'option already has answers; cannot delete';
  end if;
  delete from public.question_option where id = p_option_id;
end $$;

-- ---------------------------------------------------------------------------
-- Assign a role (admin only). Refuses to demote the last remaining admin.
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_role(p_user_id uuid, p_role text)
  returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin_strict();
  if p_role not in ('member', 'editor', 'admin') then
    raise exception 'bad role';
  end if;
  -- serialize all role changes so the last-admin check can't race two concurrent
  -- cross-demotions (disjoint rows -> row locks don't help) into zero admins.
  perform pg_catalog.pg_advisory_xact_lock(hashtextextended('admin_set_role', 0));
  if p_role <> 'admin'
     and (select role from public.profiles where id = p_user_id) = 'admin'
     and (select count(*) from public.profiles where role = 'admin' and status = 'active') <= 1 then
    raise exception 'cannot remove the last admin';
  end if;
  update public.profiles set role = p_role where id = p_user_id;
end $$;
revoke execute on function public.admin_set_role(uuid, text) from public, anon;
grant  execute on function public.admin_set_role(uuid, text) to authenticated;

-- new signups default to 'member' (drop the is_admin insert before dropping the column).
create or replace function public.handle_new_user()
  returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, status) values (new.id, 'pending');
  return new;
end $$;

alter table profiles drop column is_admin;
