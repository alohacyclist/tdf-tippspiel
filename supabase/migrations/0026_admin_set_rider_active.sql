-- 0026_admin_set_rider_active.sql — mark a rider abandoned (DNF) / reactivate them
-- from the admin UI, without SQL. Content gate (editor+admin), like other race-data
-- edits. Reactivating clears dnf_stage. (The automated pipeline uses ingest_rider_dnf,
-- which is service-role-only; this is the human path.)
create or replace function public.admin_set_rider_active(
  p_rider_id uuid, p_active boolean, p_dnf_stage int default null)
  returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  update public.riders
    set is_active = p_active,
        dnf_stage = case when p_active then null else p_dnf_stage end
  where id = p_rider_id;
end $$;
revoke execute on function public.admin_set_rider_active(uuid, boolean, int)
  from public, anon;
grant  execute on function public.admin_set_rider_active(uuid, boolean, int)
  to authenticated;
