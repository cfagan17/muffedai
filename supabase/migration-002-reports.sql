-- Fantasy Playbook — Reports Migration
-- Run this in your Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → Paste this → Click "Run"

-- 1. Reports table — stores generated weekly reports
create table public.reports (
  id serial primary key,
  user_id uuid not null references auth.users on delete cascade,
  week_number integer not null check (week_number between 1 and 18),
  season integer not null,
  scoring_format text not null check (scoring_format in ('PPR', 'Half-PPR', 'Standard')),
  title text not null,
  total_points numeric(6,1),
  grade text check (grade in ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F')),
  summary text,
  week_narrative text,
  league_context jsonb,
  bottom_line text,
  status text not null default 'generated' check (status in ('generating', 'generated', 'failed')),
  created_at timestamptz not null default now(),
  unique (user_id, week_number, season)
);

alter table public.reports enable row level security;

create policy "Users can view their own reports"
  on public.reports for select using (auth.uid() = user_id);

create policy "System can insert reports for users"
  on public.reports for insert with check (auth.uid() = user_id);

create index reports_user_id_idx on public.reports (user_id);
create index reports_user_week_idx on public.reports (user_id, season desc, week_number desc);

-- 2. Report Players table — per-player breakdown within a report
create table public.report_players (
  id serial primary key,
  report_id integer not null references public.reports on delete cascade,
  player_id integer not null references public.nfl_players on delete cascade,
  position_tag text not null,
  points numeric(5,1),
  season_avg numeric(5,1),
  position_rank text,
  stats_line text,
  betting_lines jsonb,
  narrative text,
  outlook text,
  created_at timestamptz not null default now()
);

alter table public.report_players enable row level security;

create policy "Users can view their own report players"
  on public.report_players for select
  using (
    exists (
      select 1 from public.reports
      where reports.id = report_players.report_id
      and reports.user_id = auth.uid()
    )
  );

create policy "System can insert report players"
  on public.report_players for insert
  with check (
    exists (
      select 1 from public.reports
      where reports.id = report_players.report_id
      and reports.user_id = auth.uid()
    )
  );

create index report_players_report_id_idx on public.report_players (report_id);
