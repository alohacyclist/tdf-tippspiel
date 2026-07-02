-- 0010_admin_rpcs_questions.sql
-- Admin write path for free-form questions. All is_admin-gated SECURITY DEFINER
-- RPCs in public (require_admin() from 0008). Result entry is refused before the
-- (derived) deadline, so is_resolved — which gates scoring — can only become true
-- once every answer is already RLS-visible.

create or replace function public.admin_create_question(
  p_tour_id uuid, p_kind text, p_prompt text, p_points int,
  p_stage_id uuid default null, p_deadline timestamptz default null,
  p_help text default null)
  returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform private.require_admin();
  if p_kind not in ('boolean','choice') then raise exception 'bad kind'; end if;
  if p_stage_id is not null
     and (select s.tour_id from public.stages s where s.id = p_stage_id)
         is distinct from p_tour_id then
    raise exception 'stage not in tour';
  end if;
  if p_stage_id is null and p_deadline is null then
    raise exception 'tour-wide question needs a deadline';
  end if;
  insert into public.question (tour_id, stage_id, kind, prompt, help_text, points, deadline, is_open)
  values (p_tour_id, p_stage_id, p_kind, p_prompt, p_help, p_points,
          case when p_stage_id is null then p_deadline end, true)
  returning id into v_id;
  return v_id;
end $$;
revoke execute on function public.admin_create_question(uuid,text,text,int,uuid,timestamptz,text) from public, anon;
grant  execute on function public.admin_create_question(uuid,text,text,int,uuid,timestamptz,text) to authenticated;

create or replace function public.admin_add_question_option(
  p_question_id uuid, p_label text, p_sort int default 0)
  returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform private.require_admin();
  if (select kind from public.question where id = p_question_id) is distinct from 'choice' then
    raise exception 'options only on choice questions';
  end if;
  insert into public.question_option (question_id, label, sort_order)
  values (p_question_id, p_label, p_sort) returning id into v_id;
  return v_id;
end $$;
revoke execute on function public.admin_add_question_option(uuid,text,int) from public, anon;
grant  execute on function public.admin_add_question_option(uuid,text,int) to authenticated;

create or replace function public.admin_delete_question_option(p_option_id uuid)
  returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  if exists (select 1 from public.question_answer where option_id = p_option_id) then
    raise exception 'option already has answers; cannot delete';
  end if;
  delete from public.question_option where id = p_option_id;
end $$;
revoke execute on function public.admin_delete_question_option(uuid) from public, anon;
grant  execute on function public.admin_delete_question_option(uuid) to authenticated;

create or replace function public.admin_update_question(
  p_id uuid, p_prompt text, p_points int, p_is_open boolean,
  p_deadline timestamptz default null)
  returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  update public.question set
    prompt   = p_prompt,
    points   = p_points,
    is_open  = p_is_open,
    -- never move the deadline of an already-resolved question (would re-open writes)
    deadline = case when stage_id is null and not is_resolved
                    then coalesce(p_deadline, deadline) else deadline end
  where id = p_id;
end $$;
revoke execute on function public.admin_update_question(uuid,text,int,boolean,timestamptz) from public, anon;
grant  execute on function public.admin_update_question(uuid,text,int,boolean,timestamptz) to authenticated;

create or replace function public.admin_set_question_open(p_id uuid, p_open boolean)
  returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  update public.question set is_open = p_open where id = p_id;
end $$;
revoke execute on function public.admin_set_question_open(uuid,boolean) from public, anon;
grant  execute on function public.admin_set_question_open(uuid,boolean) to authenticated;

-- Enter/replace the correct answer. Exactly one of bool/option, matching kind.
-- Refuses before the (derived) deadline; sets is_resolved so scoring picks it up.
create or replace function public.admin_set_question_result(
  p_id uuid, p_bool boolean default null, p_option_id uuid default null)
  returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  if coalesce(private.question_deadline(p_id) > now(), true) then
    raise exception 'cannot enter a result before the deadline';
  end if;
  if not private.answer_shape_ok(p_id, p_option_id, p_bool) then
    raise exception 'result shape mismatch for question kind';
  end if;
  insert into public.question_result (question_id, option_id, bool_value)
  values (p_id, p_option_id, p_bool)
  on conflict (question_id) do update set
    option_id = excluded.option_id, bool_value = excluded.bool_value, set_at = now();
  update public.question set is_resolved = true where id = p_id;
end $$;
revoke execute on function public.admin_set_question_result(uuid,boolean,uuid) from public, anon;
grant  execute on function public.admin_set_question_result(uuid,boolean,uuid) to authenticated;

create or replace function public.admin_clear_question_result(p_id uuid)
  returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  delete from public.question_result where question_id = p_id;
  update public.question set is_resolved = false where id = p_id;
end $$;
revoke execute on function public.admin_clear_question_result(uuid) from public, anon;
grant  execute on function public.admin_clear_question_result(uuid) to authenticated;

create or replace function public.admin_delete_question(p_id uuid)
  returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  delete from public.question where id = p_id;   -- cascades options/answers/result
end $$;
revoke execute on function public.admin_delete_question(uuid) from public, anon;
grant  execute on function public.admin_delete_question(uuid) to authenticated;
