-- 0025_admin_set_status.sql — activate / block / reset a player from the admin UI
-- instead of hand-written SQL. Admin only; refuses to deactivate yourself (lockout).
create or replace function public.admin_set_status(p_user_id uuid, p_status text)
  returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin_strict();
  if p_status not in ('pending', 'active', 'blocked') then
    raise exception 'bad status';
  end if;
  if p_user_id = auth.uid() and p_status <> 'active' then
    raise exception 'cannot deactivate yourself';
  end if;
  update public.profiles set status = p_status where id = p_user_id;
end $$;
revoke execute on function public.admin_set_status(uuid, text) from public, anon;
grant  execute on function public.admin_set_status(uuid, text) to authenticated;
