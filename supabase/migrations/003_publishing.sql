-- ============================================================================
-- 003 — Publishing : scheduling, tokens, warm-up
-- ============================================================================

alter table ig_posts
  add column if not exists publish_attempts int default 0,
  add column if not exists last_publish_error text,
  add column if not exists last_publish_attempt_at timestamptz;

create index if not exists idx_ig_posts_ready_to_publish
  on ig_posts(scheduled_for)
  where status = 'scheduled';

alter table ig_account
  add column if not exists app_id text,
  add column if not exists last_token_refresh_at timestamptz,
  add column if not exists posts_published_count int default 0,
  add column if not exists posts_failed_count int default 0;

create table if not exists ig_token_history (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references ig_account(id),
  refreshed_at timestamptz default now(),
  expires_at timestamptz not null,
  refresh_method text
);

create table if not exists ig_publish_logs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references ig_posts(id),
  attempted_at timestamptz default now(),
  success boolean,
  ig_media_id text,
  error_message text,
  meta_response_code int,
  meta_response_body jsonb
);

create index if not exists idx_ig_publish_logs_post on ig_publish_logs(post_id);
create index if not exists idx_ig_publish_logs_recent on ig_publish_logs(attempted_at desc);

alter table ig_token_history enable row level security;
alter table ig_publish_logs enable row level security;
