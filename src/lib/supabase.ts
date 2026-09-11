import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

// ── Types matching the DB table ────────────────────────────────────────────

export interface ProgressRow {
  device_id: string;
  anime_id: number;
  episode: number;
  type: "sub" | "dub";
  playback_time: number;   // seconds
  duration: number;        // seconds (0 if unknown)
  title: string;
  cover_image: string;
  accent: string;
  mal_id: number | null;
  updated_at: string;      // ISO timestamp
}
