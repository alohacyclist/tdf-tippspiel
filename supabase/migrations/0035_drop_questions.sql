-- 0035_drop_questions.sql — remove the free-form questions ("Sonderfragen") feature
-- entirely (tables, admin RPCs, helpers, policies). The leaderboard + season views
-- reference question_answer/result, so drop them first; 0036 recreates them without
-- questions. Hard drop: existing questions/answers are discarded with the feature.
drop view if exists season_leaderboard;
drop view if exists leaderboard;

-- Functions (resolved via regprocedure so exact signatures are not needed).
do $$
declare r record;
begin
  for r in
    select 'drop function if exists ' || p.oid::regprocedure || ' cascade' as stmt
    from pg_proc p
    where p.pronamespace in ('public'::regnamespace, 'private'::regnamespace)
      and p.proname in (
        'admin_create_question', 'admin_add_question_option',
        'admin_delete_question_option', 'admin_update_question',
        'admin_set_question_open', 'admin_set_question_result',
        'admin_clear_question_result', 'admin_delete_question',
        'question_deadline', 'question_open', 'question_tour', 'answer_shape_ok'
      )
  loop execute r.stmt; end loop;
end $$;

-- Tables (cascade drops their policies, triggers and FKs).
drop table if exists question_answer  cascade;
drop table if exists question_result  cascade;
drop table if exists question_option  cascade;
drop table if exists question         cascade;
