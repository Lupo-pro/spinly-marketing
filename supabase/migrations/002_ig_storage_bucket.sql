-- ============================================================================
-- 002 — IG Storage bucket for rendered slide PNGs
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ig-content',
  'ig-content',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

-- Public read access on ig-content (slides need to be embeddable in IG carousels).
drop policy if exists "Public read access on ig-content" on storage.objects;
create policy "Public read access on ig-content"
on storage.objects for select
using ( bucket_id = 'ig-content' );
