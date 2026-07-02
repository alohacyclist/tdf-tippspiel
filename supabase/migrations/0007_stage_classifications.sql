-- 0007_stage_classifications.sql
-- Attach a rider-pick classification to a specific stage so it renders in the stage
-- UI and reveals at that stage's start_time. The reveal pivot is DERIVED live
-- (coalesce stage.start_time, own deadline) — no stored copy, so rescheduling a
-- stage moves the reveal automatically (no drift).

-- A stage-attached classification carries NO own deadline; make the column nullable.
alter table classifications alter column deadline drop not null;

alter table classifications
  add column if not exists stage_id uuid references stages (id) on delete cascade;

create index if not exists classifications_stage
  on classifications (stage_id) where stage_id is not null;

-- Exactly one source of timing: attached-to-stage XOR own deadline.
-- Existing seeded rows have (stage_id null, deadline set) -> they satisfy this.
alter table classifications
  add constraint cls_stage_deadline_xor
  check ((stage_id is not null and deadline is null)
      or (stage_id is null and deadline is not null));

-- Redefining this ONE helper makes the existing classification_tips RLS policies
-- and the leaderboard cls_pts CTE honor stage timing with zero further edits:
-- both already call private.classification_deadline(classification_id).
create or replace function private.classification_deadline(cid uuid)
  returns timestamptz language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select s.start_time
       from public.classifications c
       join public.stages s on s.id = c.stage_id
      where c.id = cid),
    (select c.deadline from public.classifications c where c.id = cid));
$$;
revoke execute on function private.classification_deadline(uuid) from public;
grant execute on function private.classification_deadline(uuid) to authenticated, anon;
