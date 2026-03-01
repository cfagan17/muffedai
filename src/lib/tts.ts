/**
 * Text-to-speech via OpenAI's TTS API.
 *
 * Converts report narratives into an audio file and stores it
 * in Supabase Storage.
 */

import { createClient } from "@supabase/supabase-js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isTTSEnabled(): boolean {
  return !!OPENAI_API_KEY && !!SUPABASE_SERVICE_KEY;
}

/**
 * Build a natural-sounding audio script from the report data.
 * Designed to be read aloud as a ~2 minute briefing.
 */
export function buildAudioScript(report: {
  title: string;
  grade: string | null;
  week_narrative: string | null;
  bottom_line: string | null;
  players: { name: string; narrative: string | null; outlook: string | null }[];
}): string {
  const parts: string[] = [];

  // Intro
  parts.push(`Here's your ${report.title}.`);

  // Week narrative
  if (report.week_narrative) {
    parts.push(report.week_narrative);
  }

  // Player breakdowns (keep it tight)
  for (const p of report.players) {
    if (p.narrative) {
      parts.push(p.narrative);
    }
    if (p.outlook) {
      parts.push(`Looking ahead: ${p.outlook}`);
    }
  }

  // Bottom line
  if (report.bottom_line) {
    parts.push(report.bottom_line);
  }

  return parts.join("\n\n");
}

/**
 * Generate TTS audio from text and upload to Supabase Storage.
 * Returns the public URL of the audio file, or null on failure.
 */
export async function generateAndStoreAudio(
  text: string,
  reportId: number
): Promise<string | null> {
  if (!OPENAI_API_KEY || !SUPABASE_SERVICE_KEY) return null;

  try {
    // Call OpenAI TTS API
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text.slice(0, 4096), // API limit
        voice: "onyx", // Deep, authoritative voice — good for sports commentary
        response_format: "mp3",
        speed: 1.05, // Slightly faster for a punchy briefing feel
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI TTS error:", err);
      return null;
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    // Upload to Supabase Storage
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const path = `reports/${reportId}.mp3`;

    const { error: uploadError } = await supabase.storage
      .from("audio")
      .upload(path, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("audio")
      .getPublicUrl(path);

    return urlData.publicUrl;
  } catch (error) {
    console.error("TTS generation failed:", error);
    return null;
  }
}
