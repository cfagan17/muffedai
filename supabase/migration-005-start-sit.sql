-- Fantasy Playbook — Migration 005: Start/Sit recommendations
-- Run this in your Supabase SQL Editor

-- Add start_sit JSONB column to reports for weekly start/sit verdicts
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS start_sit jsonb;
