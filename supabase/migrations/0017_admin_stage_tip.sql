-- 0017_admin_stage_tip.sql — let an admin backfill a stage-winner tip for another
-- player after the deadline. SECURITY DEFINER (owner bypasses RLS, so the deadline
-- insert policy does not apply). Admin-only: editing another player's bet is the
-- most sensitive write, so it is gated by require_admin_strict(), not the content gate.
create or replace function public.admin_set_stage_tip(
  p_user_id uuid, p_stage_id uuid,
  p_rider_id uuid default null, p_team text default null)
  returns void language plpgsql security definer set search_path = '' as $$
declare v_tour uuid; v_type text;
begin
  perform private.require_admin_strict();
  select tour_id, type into v_tour, v_type from public.stages where id = p_stage_id;
  if v_tour is null then raise exception 'stage not found'; end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'user not found';
  end if;
  if (p_rider_id is not null) = (p_team is not null) then
    raise exception 'exactly one of rider / team required';
  end if;
  -- a team-time-trial is tipped by team; every other stage type by rider.
  if v_type = 'ttt' and p_rider_id is not null then
    raise exception 'ttt stage needs a team tip, not a rider';
  end if;
  if v_type is distinct from 'ttt' and p_team is not null then
    raise exception 'non-ttt stage needs a rider tip, not a team';
  end if;
  if p_rider_id is not null
     and private.rider_tour(p_rider_id) is distinct from v_tour then
    raise exception 'rider not in tour';
  end if;
  if p_team is not null and not private.team_in_tour(p_team, v_tour) then
    raise exception 'team not in tour';
  end if;
  insert into public.stage_tips (tour_id, user_id, stage_id, rider_id, team)
  values (v_tour, p_user_id, p_stage_id, p_rider_id, p_team)
  on conflict (user_id, stage_id) do update
    set rider_id = excluded.rider_id, team = excluded.team;
end $$;
revoke execute on function public.admin_set_stage_tip(uuid, uuid, uuid, text) from public, anon;
grant  execute on function public.admin_set_stage_tip(uuid, uuid, uuid, text) to authenticated;
