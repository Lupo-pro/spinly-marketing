-- ============================================================================
-- 005 — PostEverywhere publishing tracking
-- ============================================================================

alter table ig_posts
  add column if not exists pe_post_id text,
  add column if not exists pe_status text default null,
  add column if not exists pe_scheduled_for timestamptz default null,
  add column if not exists pe_published_at timestamptz default null,
  add column if not exists pe_destinations jsonb default null,
  add column if not exists pe_error text default null,
  add column if not exists pe_last_check_at timestamptz default null;

create index if not exists idx_ig_posts_pe_status
  on ig_posts(pe_status) where pe_status is not null;

create index if not exists idx_ig_posts_pe_post_id
  on ig_posts(pe_post_id) where pe_post_id is not null;

-- pe_status values:
--   null         pas encore envoyé à PostEverywhere
--   'queued'     accepté par PE, en file d'attente
--   'scheduled'  programmé pour publication future
--   'publishing' en cours de publication
--   'published'  publié sur toutes les plateformes
--   'partial'    publié sur certaines plateformes seulement
--   'failed'     échec total
