-- ============================================================================
-- 001 — Instagram Automation
-- Banque d'angles, posts générés, credentials compte IG
-- ============================================================================

-- Banque d'angles éditoriaux
create table if not exists ig_angles (
  id uuid primary key default gen_random_uuid(),
  axis text not null check (axis in (
    'anti_agencias',
    'google_algo',
    'pme_pain',
    'vendedor',
    'social_proof',
    'gamification',
    'reseñas_strategy'
  )),
  hook text not null,
  thesis text not null,
  used_count int default 0,
  last_used_at timestamptz,
  performance_score numeric,
  active boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_ig_angles_axis on ig_angles(axis);
create index if not exists idx_ig_angles_last_used on ig_angles(last_used_at nulls first);

-- Carrousels générés
create table if not exists ig_posts (
  id uuid primary key default gen_random_uuid(),
  angle_id uuid references ig_angles(id),
  status text default 'draft' check (status in (
    'draft',
    'approved',
    'scheduled',
    'published',
    'failed',
    'rejected'
  )),
  caption text not null,
  hashtags text[] default '{}',
  slides_json jsonb not null,
  slide_image_urls text[] default '{}',
  scheduled_for timestamptz,
  published_at timestamptz,
  ig_media_id text,
  ig_permalink text,
  reach int,
  likes int,
  saves int,
  shares int,
  comments int,
  rejection_reason text,
  generated_at timestamptz default now(),
  approved_at timestamptz,
  approved_by text
);

create index if not exists idx_ig_posts_status on ig_posts(status);
create index if not exists idx_ig_posts_scheduled on ig_posts(scheduled_for) where status = 'scheduled';
create index if not exists idx_ig_posts_angle on ig_posts(angle_id);

-- Compte IG (singleton)
create table if not exists ig_account (
  id uuid primary key default gen_random_uuid(),
  ig_user_id text,
  fb_page_id text,
  access_token text,
  token_expires_at timestamptz,
  posting_schedule jsonb default '{
    "monday":    ["09:00", "13:00", "18:00"],
    "tuesday":   ["09:00", "13:00", "18:00"],
    "wednesday": ["09:00", "13:00", "18:00"],
    "thursday":  ["09:00", "13:00", "18:00"],
    "friday":    ["09:00", "13:00", "18:00"],
    "saturday":  ["11:00", "17:00"],
    "sunday":    ["11:00", "17:00"]
  }'::jsonb,
  warmup_phase text default 'phase_1',
  warmup_started_at timestamptz default now(),
  active boolean default false,
  created_at timestamptz default now()
);

-- RLS — service role only (admin)
alter table ig_angles enable row level security;
alter table ig_posts enable row level security;
alter table ig_account enable row level security;

-- Pas de policy = personne ne peut lire/écrire avec anon key.
-- Le service role (utilisé côté serveur uniquement) bypass RLS automatiquement.
