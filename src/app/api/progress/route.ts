import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const DEVICE_COOKIE = "fw_device_id";

// ── GET /api/progress?animeId=X ───────────────────────────────────────────
// Returns the saved progress row for this device + anime, or null.
export async function GET(request: NextRequest) {
  const deviceId = request.cookies.get(DEVICE_COOKIE)?.value;
  if (!deviceId) return NextResponse.json(null);

  const animeId = request.nextUrl.searchParams.get("animeId");
  if (!animeId) return NextResponse.json({ error: "Missing animeId" }, { status: 400 });

  const { data, error } = await supabase
    .from("watch_progress")
    .select("*")
    .eq("device_id", deviceId)
    .eq("anime_id", parseInt(animeId, 10))
    .maybeSingle();

  if (error) {
    console.error("[progress GET]", error.message);
    return NextResponse.json(null);
  }

  return NextResponse.json(data);
}

// ── POST /api/progress ────────────────────────────────────────────────────
// Upserts progress for this device + anime.
// Body: { animeId, episode, type, playbackTime, duration, title, coverImage, accent, malId }
export async function POST(request: NextRequest) {
  const deviceId = request.cookies.get(DEVICE_COOKIE)?.value;
  if (!deviceId) return NextResponse.json({ error: "No device ID" }, { status: 400 });

  let body: {
    animeId: number;
    episode: number;
    type: "sub" | "dub";
    playbackTime: number;
    duration: number;
    title: string;
    coverImage: string;
    accent: string;
    malId: number | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { error } = await supabase
    .from("watch_progress")
    .upsert(
      {
        device_id: deviceId,
        anime_id: body.animeId,
        episode: body.episode,
        type: body.type,
        playback_time: body.playbackTime,
        duration: body.duration,
        title: body.title,
        cover_image: body.coverImage,
        accent: body.accent,
        mal_id: body.malId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "device_id,anime_id" }
    );

  if (error) {
    console.error("[progress POST]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// ── GET /api/progress/all ─────────────────────────────────────────────────
// Returns all progress rows for this device, sorted newest first.
// Used by ContinueWatching component.
