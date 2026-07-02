-- 0006_display_name_constraint.sql
-- Server-side guard for display_name. The 2–24 char / non-blank rule was
-- client-only (Onboarding, Profil) and bypassable via a direct PostgREST call,
-- since profiles_update_own + the display_name column grant let a user write
-- their own row. Enforce it at the boundary. btrim also rejects whitespace-only.
alter table profiles
  add constraint profiles_display_name_len
  check (display_name is null or char_length(btrim(display_name)) between 2 and 24);
