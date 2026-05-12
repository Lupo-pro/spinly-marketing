-- Migration 028 — Disable vendedor angles
-- The @spinly.lat Instagram account targets dueños de comercios, not Spinly's
-- sales force. The vendedor axis (seeded in 001/027) was producing content for
-- the wrong audience. Code-side, selectAnglesForGeneration now filters this
-- axis out unconditionally; this migration deactivates the bank rows so that
-- any future reactivation logic or admin UI also treats them as off.

UPDATE ig_angles
   SET active = false
 WHERE axis = 'vendedor';
