-- 0009_questions.sql
-- Free-form admin questions: boolean (Ja/Nein) and choice (Multiple-Choice).
-- Tour-wide (own deadline) OR attached to a stage (reveal pivot = stage start_time,
-- derived live, same pattern as classifications in 0007). Correct answers live in a
-- separate, deadline-gated result table so they never leak before reveal.

create table question (
  id           uuid primary key default gen_random_uuid(),
  tour_id      uuid not null references tours (id) on delete cascade,
  stage_id     uuid references stages (id) on delete cascade,   -- null = tour-wide
  kind         text not null check (kind in ('boolean','choice')),
  prompt       text not null,
  help_text    text,
  points       int  not null default 0 check (points >= 0),
  deadline     timestamptz,                     -- tour-wide only; null for stage-attached
  is_open      boolean not null default false,
  is_resolved  boolean not null default false,  -- admin entered the result (gates scoring)
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  constraint q_stage_deadline_xor
    check ((stage_id is not null and deadline is null)
        or (stage_id is null and deadline is not null))
);
create index question_tour  on question (tour_id, sort_order);
create index question_stage on question (stage_id) where stage_id is not null;

create table question_option (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references question (id) on delete cascade,
  label       text not null,
  sort_order  int  not null default 0,
  unique (question_id, id)          -- lets the answer FK pin the (question_id, id) pair
);
create index question_option_q on question_option (question_id, sort_order);

create table question_answer (
  id           uuid primary key default gen_random_uuid(),
  tour_id      uuid not null references tours (id) on delete cascade,
  user_id      uuid not null references profiles (id) on delete cascade,
  question_id  uuid not null references question (id) on delete cascade,
  option_id    uuid,
  bool_value   boolean,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- composite FK (MATCH SIMPLE): only enforced when option_id is not null, so a
  -- chosen option must belong to THIS question; boolean answers skip it.
  foreign key (question_id, option_id)
    references question_option (question_id, id) on delete cascade,
  constraint qa_one_value check (
    (option_id is not null)::int + (bool_value is not null)::int = 1),
  unique (user_id, question_id)     -- one answer per (player, question); upsert target
);
create index question_answer_q    on question_answer (question_id);
create index question_answer_user on question_answer (user_id);

create table question_result (
  question_id  uuid primary key references question (id) on delete cascade,
  option_id    uuid,
  bool_value   boolean,
  set_at       timestamptz not null default now(),
  foreign key (question_id, option_id)
    references question_option (question_id, id) on delete cascade,
  constraint qr_one_value check (
    (option_id is not null)::int + (bool_value is not null)::int = 1)
);

-- ---------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER, empty search_path, fully qualified).
-- ---------------------------------------------------------------------------
create or replace function private.question_deadline(qid uuid)
  returns timestamptz language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select s.start_time from public.question q
       join public.stages s on s.id = q.stage_id where q.id = qid),
    (select q.deadline from public.question q where q.id = qid));
$$;

create or replace function private.question_open(qid uuid)
  returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select q.is_open from public.question q where q.id = qid), false);
$$;

create or replace function private.question_tour(qid uuid)
  returns uuid language sql stable security definer set search_path = '' as $$
  select q.tour_id from public.question q where q.id = qid;
$$;

-- Validates the value columns match the question kind + option ownership.
create or replace function private.answer_shape_ok(qid uuid, oid uuid, bv boolean)
  returns boolean language sql stable security definer set search_path = '' as $$
  select case (select q.kind from public.question q where q.id = qid)
    when 'boolean' then bv is not null and oid is null
    when 'choice'  then bv is null and oid is not null
      and exists (select 1 from public.question_option o
                  where o.id = oid and o.question_id = qid)
    else false end;
$$;

revoke execute on all functions in schema private from public;
grant execute on all functions in schema private to authenticated, anon;

-- ---------------------------------------------------------------------------
-- RLS: reference rows readable by active members; results + others' answers only
-- at/after the (derived) deadline. Writes only while open and before the deadline.
-- ---------------------------------------------------------------------------
alter table question         enable row level security;
alter table question_option  enable row level security;
alter table question_answer  enable row level security;
alter table question_result  enable row level security;

grant select on question, question_option, question_result to authenticated;
grant select, insert, update, delete on question_answer to authenticated;

create policy question_select        on question        for select using (private.is_active(auth.uid()));
create policy question_option_select on question_option for select using (private.is_active(auth.uid()));

create policy question_result_select on question_result for select using (
  private.is_active(auth.uid())
  and coalesce(private.question_deadline(question_id) <= now(), false));

create policy qa_select on question_answer for select using (
  private.is_active(auth.uid())
  and (user_id = auth.uid()
       or coalesce(private.question_deadline(question_id) <= now(), false)));

create policy qa_insert on question_answer for insert with check (
  private.is_active(auth.uid())
  and user_id = auth.uid()
  and private.question_open(question_id)
  and coalesce(private.question_deadline(question_id) > now(), false)
  and tour_id = private.question_tour(question_id)
  and private.answer_shape_ok(question_id, option_id, bool_value));

create policy qa_update on question_answer for update using (
  private.is_active(auth.uid())
  and user_id = auth.uid()
  and private.question_open(question_id)
  and coalesce(private.question_deadline(question_id) > now(), false)
) with check (
  private.is_active(auth.uid())
  and user_id = auth.uid()
  and private.question_open(question_id)
  and coalesce(private.question_deadline(question_id) > now(), false)
  and tour_id = private.question_tour(question_id)
  and private.answer_shape_ok(question_id, option_id, bool_value));

create policy qa_delete on question_answer for delete using (
  private.is_active(auth.uid())
  and user_id = auth.uid()
  and private.question_open(question_id)
  and coalesce(private.question_deadline(question_id) > now(), false));

create trigger question_answer_touch before update on question_answer
  for each row execute function public.touch_updated_at();
