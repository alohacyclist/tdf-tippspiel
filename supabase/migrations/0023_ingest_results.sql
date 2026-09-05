-- 0023_ingest_results.sql — write path for the automated results ingester
-- (GitHub Actions cron, authenticated with the SERVICE-ROLE key). SECURITY DEFINER;
-- EXECUTE revoked from anon/authenticated so only service_role can call it via
-- PostgREST — regular users can never set a winner through these.
-- Idempotent: the same winner is a no-op ('unchanged'); a different winner is applied
-- and reported as 'changed' so a notifier can flag it.

create or replace function public.ingest_stage_result(
  p_stage_id uuid,
  p_winner_rider_id uuid default null,
  p_winner_team text default null)
  returns text language plpgsql security definer set search_path = '' as $$
declare
  v_tour uuid; v_type text; v_cur_rider uuid; v_cur_team text;
begin
  select tour_id, type, winner_rider_id, winner_team
    into v_tour, v_type, v_cur_rider, v_cur_team
  from public.stages where id = p_stage_id;
  if v_tour is null then raise exception 'stage not found'; end if;

  if (p_winner_rider_id is not null) = (p_winner_team is not null) then
    raise exception 'exactly one of rider / team required';
  end if;
  if v_type = 'ttt' and p_winner_rider_id is not null then
    raise exception 'ttt stage needs a winning team, not a rider';
  end if;
  if v_type is distinct from 'ttt' and p_winner_team is not null then
    raise exception 'non-ttt stage needs a winning rider, not a team';
  end if;
  if p_winner_rider_id is not null
     and private.rider_tour(p_winner_rider_id) is distinct from v_tour then
    raise exception 'rider not in tour';
  end if;
  if p_winner_team is not null and not private.team_in_tour(p_winner_team, v_tour) then
    raise exception 'team not in tour';
  end if;

  if v_cur_rider is not distinct from p_winner_rider_id
     and v_cur_team is not distinct from p_winner_team then
    return 'unchanged';
  end if;

  update public.stages
    set winner_rider_id = p_winner_rider_id,
        winner_team     = p_winner_team,
        status          = 'finished'
  where id = p_stage_id;

  return case
    when v_cur_rider is null and v_cur_team is null then 'set'
    else 'changed'
  end;
end $$;
revoke execute on function public.ingest_stage_result(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.ingest_stage_result(uuid, uuid, text) to service_role;

-- Mark a rider as abandoned (removes them from tip pickers). Idempotent; keeps the
-- earliest recorded dnf stage. service_role only.
create or replace function public.ingest_rider_dnf(
  p_rider_id uuid, p_stage_number int default null)
  returns text language plpgsql security definer set search_path = '' as $$
declare v_was boolean;
begin
  select is_active into v_was from public.riders where id = p_rider_id;
  if v_was is null then raise exception 'rider not found'; end if;
  update public.riders
    set is_active = false,
        dnf_stage = coalesce(dnf_stage, p_stage_number)
  where id = p_rider_id;
  return case when v_was then 'dnf' else 'unchanged' end;
end $$;
revoke execute on function public.ingest_rider_dnf(uuid, int)
  from public, anon, authenticated;
grant execute on function public.ingest_rider_dnf(uuid, int) to service_role;
