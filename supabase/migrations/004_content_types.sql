-- ============================================================================
-- 004 — Content types (carousel, single_post, story)
-- ============================================================================

alter table ig_posts
  add column if not exists content_type text default 'carousel'
    check (content_type in ('carousel', 'single_post', 'story'));

create index if not exists idx_ig_posts_content_type on ig_posts(content_type);

-- Backfill: any existing row without a content_type is a carousel.
update ig_posts set content_type = 'carousel' where content_type is null;
