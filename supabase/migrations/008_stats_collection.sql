-- Migration 008 — Stats Collection PostEverywhere
-- Persistent history of per-post engagement stats, fetched periodically from
-- PE's /posts/:id/results endpoint. Stored at multiple time horizons so we
-- can later compare J+1 / J+3 / J+7 trajectories.

CREATE TABLE IF NOT EXISTS ig_post_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES ig_posts(id) ON DELETE CASCADE,
  pe_post_id text NOT NULL,

  fetched_at timestamptz DEFAULT now(),
  -- Hours elapsed between pe_published_at and fetched_at. The unique
  -- constraint below uses this as the snapshot key, so the same post can
  -- have multiple rows (J+1, J+3, J+7…).
  hours_since_publish numeric,

  reach int DEFAULT 0,
  impressions int DEFAULT 0,

  likes int DEFAULT 0,
  comments int DEFAULT 0,
  shares int DEFAULT 0,
  saves int DEFAULT 0,

  -- (likes + comments + shares + saves) / reach * 100, rounded to 2 dec.
  engagement_rate numeric,

  -- Per-platform breakdown. Shape:
  -- { "instagram": {"reach":145,"likes":12,...,"permalink":"..."}, "facebook": {...} }
  platforms_data jsonb DEFAULT '{}'::jsonb,

  -- Whole PE response kept for debugging / future reprocessing without re-hitting PE.
  raw_pe_response jsonb,

  CONSTRAINT unique_post_at_interval UNIQUE (post_id, hours_since_publish)
);

CREATE INDEX IF NOT EXISTS idx_ig_post_stats_post_id ON ig_post_stats (post_id);
CREATE INDEX IF NOT EXISTS idx_ig_post_stats_pe_post_id ON ig_post_stats (pe_post_id);
CREATE INDEX IF NOT EXISTS idx_ig_post_stats_fetched_at ON ig_post_stats (fetched_at);

-- Latest snapshot per post — most queries on the dashboard hit this.
CREATE OR REPLACE VIEW ig_post_latest_stats AS
SELECT DISTINCT ON (post_id)
  post_id,
  pe_post_id,
  fetched_at,
  hours_since_publish,
  reach,
  impressions,
  likes,
  comments,
  shares,
  saves,
  engagement_rate,
  platforms_data
FROM ig_post_stats
ORDER BY post_id, fetched_at DESC;

ALTER TABLE ig_posts
  ADD COLUMN IF NOT EXISTS last_stats_fetched_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stats_fetch_count int DEFAULT 0;
