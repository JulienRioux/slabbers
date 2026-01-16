-- Profile avatars bucket + policies
-- Run this in Supabase SQL Editor.

begin;

-- Bucket
insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', true)
on conflict (id) do update set public = excluded.public;

-- RLS
alter table storage.objects enable row level security;

drop policy if exists "Profile avatars are publicly readable" on storage.objects;
drop policy if exists "Users can upload their own profile avatar" on storage.objects;
drop policy if exists "Users can update their own profile avatar" on storage.objects;
drop policy if exists "Users can delete their own profile avatar" on storage.objects;

create policy "Profile avatars are publicly readable"
  on storage.objects
  for select
  using (bucket_id = 'profile-avatars');

-- Convention: store avatars under <user_id>/...
create policy "Users can upload their own profile avatar"
  on storage.objects
  for insert
  with check (
    bucket_id = 'profile-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own profile avatar"
  on storage.objects
  for update
  using (
    bucket_id = 'profile-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own profile avatar"
  on storage.objects
  for delete
  using (
    bucket_id = 'profile-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

commit;
