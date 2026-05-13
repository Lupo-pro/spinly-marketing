-- Migration 006 — Pilot Mode
-- Auto-render + auto-schedule + auto-publish pipeline.
-- Adds tracking columns on ig_posts and a singleton pilot_settings table
-- holding the scheduling rules (slots, daily quotas, platforms, etc.).

ALTER TABLE ig_posts
  ADD COLUMN IF NOT EXISTS pilot_scheduled_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pilot_published_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pilot_platforms text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pilot_skipped boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pilot_telegram_alerted boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS pilot_settings (
  id text PRIMARY KEY DEFAULT 'global',
  enabled boolean DEFAULT true,
  -- Slots in Bogotá local time, "HH:MM" strings.
  carousel_slots text[] DEFAULT ARRAY['09:00', '19:00'],
  single_post_slots text[] DEFAULT ARRAY['12:00', '13:00'],
  story_slots text[] DEFAULT ARRAY['08:00', '12:00', '16:00', '19:00', '21:00'],
  -- Default platforms per content type, CSV ("instagram,facebook").
  carousel_platforms text DEFAULT 'instagram,facebook',
  single_post_platforms text DEFAULT 'instagram,facebook,threads',
  story_platforms text DEFAULT 'instagram',
  -- Daily quotas.
  max_carousels_per_day int DEFAULT 2,
  max_single_posts_per_day int DEFAULT 2,
  max_stories_per_day int DEFAULT 5,
  -- Min spacing between two posts of the same content_type.
  min_hours_between_same_type int DEFAULT 4,
  scheduling_horizon_days int DEFAULT 30,
  earliest_hour int DEFAULT 8,
  latest_hour int DEFAULT 21,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO pilot_settings (id) VALUES ('global') ON CONFLICT DO NOTHING;
