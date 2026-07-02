-- 0011_leaderboard_v3.sql
-- Additive free-form question scoring. cfg / stage_pts / cls_pts are copied verbatim
-- from 0004 (three disjoint source tables: stage_tips, classification_tips,
-- question_answer -> no double count). q_pts is the only new term. Every q_pts branch
-- requires q.is_resolved, which admin_set_question_result can set only AFTER the
-- deadline, so under security_invoker all answers are already RLS-visible.
create or replace view leaderboard with (security_invoker = true) as
with cfg as (
  select tour_id,
    coalesce(max(value) filter (where key = 'stage_winner_points'), 0)   as stage_winner,
    coalesce(max(value) filter (where key = 'gc_exact_points'), 0)       as gc_exact,
    coalesce(max(value) filter (where key = 'gc_in_top3_points'), 0)     as gc_in_top3,
    coalesce(max(value) filter (where key = 'jersey_correct_points'), 0) as jersey
  from scoring_config group by tour_id
),
stage_pts as (
  select st.tour_id, st.user_id,
    count(*) filter (where s.status = 'finished' and (
      (s.type is distinct from 'ttt' and s.winner_rider_id = st.rider_id)
      or (s.type = 'ttt' and s.winner_team is not null and st.team = s.winner_team)
    )) as correct_winners
  from stage_tips st
  join stages s on s.id = st.stage_id
  group by st.tour_id, st.user_id
),
cls_pts as (
  select ct.tour_id, ct.user_id,
    sum(
      case
        when c.ordered then
          case
            when exists (select 1 from classification_results cr
                         where cr.classification_id = ct.classification_id
                           and cr.rider_id = ct.rider_id and cr.rank = ct.slot) then cfg.gc_exact
            when exists (select 1 from classification_results cr
                         where cr.classification_id = ct.classification_id
                           and cr.rider_id = ct.rider_id) then cfg.gc_in_top3
            else 0 end
        else
          case when exists (select 1 from classification_results cr
                            where cr.classification_id = ct.classification_id
                              and cr.rider_id = ct.rider_id) then coalesce(c.points, cfg.jersey)
               else 0 end
      end
    ) as points
  from classification_tips ct
  join classifications c on c.id = ct.classification_id
  join cfg on cfg.tour_id = ct.tour_id
  group by ct.tour_id, ct.user_id
),
q_pts as (
  select tour_id, user_id, sum(pts) as points from (
    select qa.tour_id, qa.user_id,
      case when qa.bool_value = qr.bool_value then q.points else 0 end as pts
    from question_answer qa
    join question q         on q.id = qa.question_id
    join question_result qr on qr.question_id = q.id
    where q.kind = 'boolean' and q.is_resolved
    union all
    select qa.tour_id, qa.user_id,
      case when qa.option_id = qr.option_id then q.points else 0 end
    from question_answer qa
    join question q         on q.id = qa.question_id
    join question_result qr on qr.question_id = q.id
    where q.kind = 'choice' and q.is_resolved
  ) s
  group by tour_id, user_id
)
select
  t.id as tour_id,
  p.id as user_id,
  p.display_name,
  coalesce(sp.correct_winners, 0) * coalesce(cfg.stage_winner, 0)
    + coalesce(cp.points, 0)
    + coalesce(qp.points, 0) as total_points,
  coalesce(sp.correct_winners, 0) as correct_winners
from tours t
cross join profiles p
left join cfg      on cfg.tour_id = t.id
left join stage_pts sp on sp.tour_id = t.id and sp.user_id = p.id
left join cls_pts  cp  on cp.tour_id = t.id and cp.user_id = p.id
left join q_pts    qp  on qp.tour_id = t.id and qp.user_id = p.id
where p.status = 'active';

grant select on leaderboard to authenticated;
