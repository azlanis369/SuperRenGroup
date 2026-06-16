-- ============================================================================
-- Storage bucket for listing media & avatars
-- Run after 0001_init.sql.
-- ============================================================================

-- Public bucket so listing images can be served via CDN URLs.
insert into storage.buckets (id, name, public)
values ('listing-media', 'listing-media', true)
on conflict (id) do nothing;

-- Public read of objects in the bucket.
drop policy if exists "listing-media public read" on storage.objects;
create policy "listing-media public read" on storage.objects
  for select using (bucket_id = 'listing-media');

-- Authenticated users may upload to the bucket.
drop policy if exists "listing-media auth insert" on storage.objects;
create policy "listing-media auth insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'listing-media');

-- Owners may update/delete their own uploaded objects.
drop policy if exists "listing-media owner update" on storage.objects;
create policy "listing-media owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'listing-media' and owner = auth.uid());

drop policy if exists "listing-media owner delete" on storage.objects;
create policy "listing-media owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-media' and owner = auth.uid());
