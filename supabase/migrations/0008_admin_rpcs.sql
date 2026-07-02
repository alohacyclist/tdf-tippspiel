-- 0008_admin_rpcs.sql
-- Admin write path (Phase 1): is_admin-gated SECURITY DEFINER RPCs in the public
-- schema (PostgREST only exposes public). The browser never holds service-role;
-- these functions bypass RLS as owner but reject non-admins before any write.

create or replace function private.require_admin()
  returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin(auth.uid()) then
    raise exception 'forbidden: admin only' using errcode = '42501';
  end if;
end $$;
revoke execute on function private.require_admin() from public;
grant execute on function private.require_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Rider-pick classifications (Sonderwertungen), tour-wide or attached to a stage.
-- ---------------------------------------------------------------------------
create or replace function public.admin_create_classification(
  p_tour_id uuid, p_key text, p_name text, p_type text,
  p_slots int, p_ordered boolean, p_points int default null,
  p_stage_id uuid default null, p_deadline timestamptz default null)
  returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform private.require_admin();
  if p_stage_id is not null
     and (select s.tour_id from public.stages s where s.id = p_stage_id)
         is distinct from p_tour_id then
    raise exception 'stage not in tour';
  end if;
  if p_stage_id is null and p_deadline is null then
    raise exception 'tour-wide classification needs a deadline';
  end if;
  insert into public.classifications
    (tour_id, key, name, type, slots, ordered, points, stage_id, deadline, is_open)
  values (p_tour_id, p_key, p_name, p_type, p_slots, p_ordered, p_points,
          p_stage_id,
          case when p_stage_id is null then p_deadline end,
          true)
  returning id into v_id;
  return v_id;
end $$;
revoke execute on function public.admin_create_classification(uuid,text,text,text,int,boolean,int,uuid,timestamptz) from public, anon;
grant  execute on function public.admin_create_classification(uuid,text,text,text,int,boolean,int,uuid,timestamptz) to authenticated;

-- Rename / points / open toggle. deadline editable only for tour-wide rows.
create or replace function public.admin_update_classification(
  p_id uuid, p_name text, p_points int, p_is_open boolean,
  p_deadline timestamptz default null)
  returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  update public.classifications set
    name    = p_name,
    points  = p_points,
    is_open = p_is_open,
    deadline = case when stage_id is null then coalesce(p_deadline, deadline) else deadline end
  where id = p_id;
end $$;
revoke execute on function public.admin_update_classification(uuid,text,int,boolean,timestamptz) from public, anon;
grant  execute on function public.admin_update_classification(uuid,text,int,boolean,timestamptz) to authenticated;

create or replace function public.admin_set_classification_open(p_id uuid, p_open boolean)
  returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  update public.classifications set is_open = p_open where id = p_id;
end $$;
revoke execute on function public.admin_set_classification_open(uuid,boolean) from public, anon;
grant  execute on function public.admin_set_classification_open(uuid,boolean) to authenticated;

-- Enter/replace results; array index i (1-based) => rank i. Refuses before the
-- effective (derived) deadline so nothing scores while tips are still hidden.
create or replace function public.admin_set_classification_results(p_id uuid, p_riders uuid[])
  returns void language plpgsql security definer set search_path = '' as $$
declare v_slots int; v_n int;
begin
  perform private.require_admin();
  if coalesce(private.classification_deadline(p_id) > now(), true) then
    raise exception 'cannot enter results before the deadline';
  end if;
  select slots into v_slots from public.classifications where id = p_id;
  if v_slots is null then raise exception 'classification not found'; end if;
  v_n := array_length(p_riders, 1);
  if v_n is null or v_n < 1 or v_n > v_slots then
    raise exception 'expected 1..% riders, got %', v_slots, coalesce(v_n, 0);
  end if;
  if (select count(distinct rid) from unnest(p_riders) rid) <> v_n then
    raise exception 'duplicate rider in results';
  end if;
  if exists (select 1 from unnest(p_riders) rid
             where private.rider_tour(rid) is distinct from private.classification_tour(p_id)) then
    raise exception 'rider not in tour';
  end if;
  delete from public.classification_results where classification_id = p_id;
  insert into public.classification_results (classification_id, rider_id, rank)
    select p_id, rid, ord from unnest(p_riders) with ordinality as u(rid, ord);
end $$;
revoke execute on function public.admin_set_classification_results(uuid,uuid[]) from public, anon;
grant  execute on function public.admin_set_classification_results(uuid,uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Stage lifecycle: set winner (rider XOR team) and optionally close the stage.
-- Replaces the hand-run SQL during the tour.
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_stage_result(
  p_stage_id uuid, p_winner_rider_id uuid default null,
  p_winner_team text default null, p_close boolean default true)
  returns void language plpgsql security definer set search_path = '' as $$
declare v_tour uuid; v_type text;
begin
  perform private.require_admin();
  select tour_id, type into v_tour, v_type from public.stages where id = p_stage_id;
  if v_tour is null then raise exception 'stage not found'; end if;
  if (p_winner_rider_id is not null) = (p_winner_team is not null) then
    raise exception 'exactly one of rider / team required';
  end if;
  -- a team-time-trial is scored by team; every other stage type by rider.
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
  update public.stages set
    winner_rider_id = p_winner_rider_id,
    winner_team     = p_winner_team,
    status          = case when p_close then 'finished' else status end
  where id = p_stage_id;
end $$;
revoke execute on function public.admin_set_stage_result(uuid,uuid,text,boolean) from public, anon;
grant  execute on function public.admin_set_stage_result(uuid,uuid,text,boolean) to authenticated;
