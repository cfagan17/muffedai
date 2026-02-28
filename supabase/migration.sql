-- Fantasy Playbook — Database Migration
-- Run this in your Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → Paste this → Click "Run"

-- 1. Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  scoring_format text not null default 'PPR' check (scoring_format in ('PPR', 'Half-PPR', 'Standard')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. NFL Players table
create table public.nfl_players (
  id serial primary key,
  name text not null,
  team text not null,
  position text not null check (position in ('QB', 'RB', 'WR', 'TE', 'K', 'DEF')),
  created_at timestamptz not null default now()
);

alter table public.nfl_players enable row level security;

create policy "NFL players are readable by all authenticated users"
  on public.nfl_players for select to authenticated using (true);

-- Enable trigram extension for fuzzy search
create extension if not exists pg_trgm;

-- Index for search
create index nfl_players_name_idx on public.nfl_players using gin (name gin_trgm_ops);
create index nfl_players_name_lower_idx on public.nfl_players (lower(name));

-- 3. User Players table (roster)
create table public.user_players (
  id serial primary key,
  user_id uuid not null references auth.users on delete cascade,
  player_id integer not null references public.nfl_players on delete cascade,
  position_tag text not null check (position_tag in ('QB', 'RB1', 'RB2', 'WR1', 'WR2', 'TE', 'FLEX')),
  created_at timestamptz not null default now(),
  unique (user_id, player_id),
  unique (user_id, position_tag)
);

alter table public.user_players enable row level security;

create policy "Users can view their own roster"
  on public.user_players for select using (auth.uid() = user_id);

create policy "Users can add to their own roster"
  on public.user_players for insert with check (auth.uid() = user_id);

create policy "Users can remove from their own roster"
  on public.user_players for delete using (auth.uid() = user_id);

create policy "Users can update their own roster"
  on public.user_players for update using (auth.uid() = user_id);
