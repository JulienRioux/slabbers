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
  manufacturer text not null,

  team text null,
  league text null,
  is_sport boolean not null default true,
  sport text null,

  condition text null,
  condition_detail text null,
  country_of_origin text null,
  original_licensed_reprint text null,
  parallel_variety text null,
  features text null,
  season text null,
  year_manufactured integer null,

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

  notes text null,

  -- Required images
  front_image_url text null,
  back_image_url text null,

  image_urls text[] not null,
  created_at timestamptz not null default now(),

  constraint cards_image_urls_non_empty check (array_length(image_urls, 1) >= 1),
  constraint cards_sport_required_check check (
    (is_sport = false)
    or
    (sport is not null and btrim(sport) <> '')
  ),
  constraint cards_for_sale_price_check check (
    (for_sale = false and price_cents is null)
    or
    (for_sale = true and price_cents is not null and price_cents > 0)
  )
);

-- If the table already exists, ensure new columns are present.
alter table public.cards
  add column if not exists manufacturer text,
  add column if not exists team text,
  add column if not exists league text,
  add column if not exists is_sport boolean,
  add column if not exists sport text,
  add column if not exists condition text,
  add column if not exists condition_detail text,
  add column if not exists country_of_origin text,
  add column if not exists original_licensed_reprint text,
  add column if not exists parallel_variety text,
  add column if not exists features text,
  add column if not exists season text,
  add column if not exists year_manufactured integer,
  add column if not exists front_image_url text,
  add column if not exists back_image_url text,
  add column if not exists notes text;

-- Remove deprecated estimated value columns if present.
alter table public.cards
  drop column if exists estimated_value_cents,
  drop column if exists estimated_currency;

-- Migrate from legacy brand column -> manufacturer
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'cards'
      and column_name = 'brand'
  ) then
    alter table public.cards add column if not exists manufacturer text;
    execute 'update public.cards set manufacturer = brand where manufacturer is null';
    alter table public.cards alter column manufacturer set not null;
    alter table public.cards drop column if exists brand;
  end if;
end $$;

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
