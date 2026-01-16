-- Storage bucket + policies
-- Run this in Supabase SQL Editor.

begin;

-- Create bucket (public = true for MVP)
insert into storage.buckets (id, name, public)
values ('card-images', 'card-images', true)
on conflict (id) do update set public = excluded.public;

-- RLS policies on storage.objects
-- Note: Supabase Storage uses RLS on storage.objects.

drop policy if exists "Card images are publicly readable" on storage.objects;
drop policy if exists "Authenticated users can upload card images" on storage.objects;
drop policy if exists "Users can update their own card images" on storage.objects;
drop policy if exists "Users can delete their own card images" on storage.objects;

create policy "Card images are publicly readable"
  on storage.objects
  for select
  using (bucket_id = 'card-images');

create policy "Authenticated users can upload card images"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'card-images');

create policy "Users can update their own card images"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'card-images' and owner = auth.uid())
  with check (bucket_id = 'card-images' and owner = auth.uid());

create policy "Users can delete their own card images"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'card-images' and owner = auth.uid());

commit;
