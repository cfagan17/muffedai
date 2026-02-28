-- Fantasy Playbook — Add emailed_at tracking
-- Run this in your Supabase SQL Editor after migration-002-reports.sql

-- Track when reports are emailed (instead of changing status, which has a CHECK constraint)
alter table public.reports add column emailed_at timestamptz;

-- Allow the service role to update reports (for cron email delivery)
create policy "Service role can update reports"
  on public.reports for update using (true);
