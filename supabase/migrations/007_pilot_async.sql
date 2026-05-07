-- Migration 007 — Async approve flow
-- Decouples the synchronous approve from the long-running render + schedule
-- + publish chain. The pilot_processing flag is a soft lock; the watchdog
-- retriggers posts stuck >5 min so a Vercel cold-kill can't strand them.

ALTER TABLE ig_posts
  ADD COLUMN IF NOT EXISTS pilot_processing boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pilot_processing_started_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pilot_error text DEFAULT NULL;

-- Partial index — keeps the watchdog query cheap even at scale.
CREATE INDEX IF NOT EXISTS idx_ig_posts_pilot_processing
  ON ig_posts (pilot_processing_started_at)
  WHERE pilot_processing = true;
