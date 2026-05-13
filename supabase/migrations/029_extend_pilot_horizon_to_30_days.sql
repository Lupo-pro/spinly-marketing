-- Migration 029 — Extend pilot scheduling horizon from 7 to 30 days.
-- The 7-day window kept findNextSlot() from placing new posts more than a
-- week out, capping the calendar even after fill-calendar-gaps generated 30
-- days of drafts. Bump column default and patch the existing 'global' row so
-- live cron/process-approved calls immediately see the new horizon.

ALTER TABLE pilot_settings
  ALTER COLUMN scheduling_horizon_days SET DEFAULT 30;

UPDATE pilot_settings
  SET scheduling_horizon_days = 30
  WHERE id = 'global';
