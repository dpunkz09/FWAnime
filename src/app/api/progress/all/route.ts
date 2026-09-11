import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const DEVICE_COOKIE = "fw_device_id";

// ── GET /api/progress/all ─────────────────────────────────────────────────
// Returns all progress rows for this device, sorted newest first.
export async function GET(request: NextRequest) {
  const deviceId = request.cookies.get(DEVICE_COOKIE)?.value;
  if (!deviceId) return NextResponse.json([]);

  const { data, error } = await supabase
    .from("watch_progress")
    .select("*")
    .eq("device_id", deviceId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[progress/all GET]", error.message);
    return NextResponse.json([]);
  }

  return NextResponse.json(data ?? []);
}
