-- Cards table + RLS
-- Run this in Supabase SQL Editor.

begin;

-- Table
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  is_private boolean not null default false,

  title text not null,
  year integer not null,
  player text not null,
  brand text not null,

  set_name text null,
  card_number text null,

  is_graded boolean not null default false,
  grading_company text null,
  grade text null,

  rookie boolean not null default false,
  autograph boolean not null default false,
  serial_numbered boolean not null default false,
  print_run integer null,

  for_sale boolean not null default false,
  price_cents integer null,
  currency text not null default 'CAD',

  image_urls text[] not null,
  created_at timestamptz not null default now(),

  constraint cards_image_urls_non_empty check (array_length(image_urls, 1) >= 1),
  constraint cards_for_sale_price_check check (
    (for_sale = false and price_cents is null)
    or
    (for_sale = true and price_cents is not null and price_cents > 0)
  )
);

create index if not exists cards_created_at_idx on public.cards (created_at desc);
create index if not exists cards_user_id_idx on public.cards (user_id);

-- RLS
alter table public.cards enable row level security;

drop policy if exists "Cards are publicly readable" on public.cards;
drop policy if exists "Cards are readable" on public.cards;
drop policy if exists "Users can insert their own cards" on public.cards;
drop policy if exists "Users can update their own cards" on public.cards;
drop policy if exists "Users can delete their own cards" on public.cards;

create policy "Cards are readable"
  on public.cards
  for select
  using (
    is_private = false
    or auth.uid() = user_id
  );

create policy "Users can insert their own cards"
  on public.cards
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own cards"
  on public.cards
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own cards"
  on public.cards
  for delete
  using (auth.uid() = user_id);

commit;
