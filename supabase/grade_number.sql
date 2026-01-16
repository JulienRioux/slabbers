-- Adds a numeric grade column for server-side grade range filtering.
-- Run this in Supabase SQL Editor.

begin;

alter table public.cards
  add column if not exists grade_number numeric generated always as (
    case
      when grade ~ '^[0-9]+(\.[0-9]+)?$' then grade::numeric
      else null
    end
  ) stored;

create index if not exists cards_grade_number_idx on public.cards (grade_number);

commit;
