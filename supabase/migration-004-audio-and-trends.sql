-- Fantasy Playbook — Migration 004: Audio URL + Sleeper league info
-- Run this in your Supabase SQL Editor

-- 1. Add audio_url to reports for TTS playback
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS audio_url text;

-- 2. Add sleeper_username to profiles for league import
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sleeper_username text;

-- 3. Create the audio storage bucket (run in Supabase dashboard > Storage > New Bucket)
-- Bucket name: "audio"
-- Public: true
-- Allowed MIME types: audio/mpeg
-- NOTE: You must create this bucket manually in the Supabase dashboard
--       or via the Supabase Storage API. SQL cannot create storage buckets.
