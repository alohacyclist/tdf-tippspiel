-- 0012_admin_delete_classification.sql
-- Admin can remove a classification (Sonderwertung). Cascades to classification_tips
-- and classification_results via their on-delete-cascade FKs (0001).
create or replace function public.admin_delete_classification(p_id uuid)
  returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  delete from public.classifications where id = p_id;
end $$;
revoke execute on function public.admin_delete_classification(uuid) from public, anon;
grant  execute on function public.admin_delete_classification(uuid) to authenticated;
