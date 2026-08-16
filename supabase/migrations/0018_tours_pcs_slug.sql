-- 0018_tours_pcs_slug.sql — multi-tour generalization. A tour needs its own PCS
-- race slug: it drives both the results/profile links AND the per-tour stage-profile
-- image folder (public/stage-profiles/<slug>/), since two Grand Tours can share a
-- year (TdF + Vuelta 2026) and would otherwise collide on stage-N.jpg.
alter table tours add column if not exists pcs_slug text;
update tours set pcs_slug = 'tour-de-france' where pcs_slug is null;
alter table tours alter column pcs_slug set not null;
