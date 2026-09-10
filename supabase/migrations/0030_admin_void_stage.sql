-- 0030_admin_void_stage.sql — mark a stage as abandoned (weather, protest, crash)
-- from the admin UI. A void stage scores nothing: the leaderboard only counts
-- stages with status 'finished', so annulling one removes its points for everyone
-- while the placed tips stay on record.
-- Content gate (editor + admin), like the other race-result edits.
create or replace function public.admin_set_stage_void(
  p_stage_id uuid, p_void boolean default true)
  returns void language plpgsql security definer set search_path = '' as $$
declare v_start timestamptz;
begin
  perform private.require_admin();
  select start_time into v_start from public.stages where id = p_stage_id;
  if not found then raise exception 'stage not found'; end if;

  if p_void then
    -- a stage without a result cannot have a winner
    update public.stages
      set status = 'void', winner_rider_id = null, winner_team = null
    where id = p_stage_id;
  else
    update public.stages
      set status = case
            when v_start is not null and v_start <= now() then 'started'
            else 'upcoming'
          end
    where id = p_stage_id;
  end if;
end $$;
revoke execute on function public.admin_set_stage_void(uuid, boolean) from public, anon;
grant  execute on function public.admin_set_stage_void(uuid, boolean) to authenticated;
