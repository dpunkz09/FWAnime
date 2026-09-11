"use client";

import { useCallback, useRef } from "react";

export interface ProgressPayload {
  animeId: number;
  malId: number | null;
  title: string;
  coverImage: string;
  accent: string;
  episode: number;
  type: "sub" | "dub";
  playbackTime: number;
  duration: number;
}

// Save interval — every 3 seconds while playing
const SAVE_INTERVAL_MS = 3000;

export function useProgress() {
  const lastSaveRef = useRef(0);
  const pendingRef = useRef<ProgressPayload | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch saved progress for one anime from the server ─────────────────
  const fetchProgress = useCallback(async (animeId: number): Promise<ProgressPayload | null> => {
    try {
      const res = await fetch(`/api/progress?animeId=${animeId}`, { cache: "no-store" });
      if (!res.ok) return null;
      const row = await res.json();
      if (!row) return null;
      return {
        animeId: row.anime_id,
        malId: row.mal_id,
        title: row.title,
        coverImage: row.cover_image,
        accent: row.accent,
        episode: row.episode,
        type: row.type,
        playbackTime: row.playback_time,
        duration: row.duration,
      };
    } catch {
      return null;
    }
  }, []);

  // ── Save progress to the server (fire-and-forget, no await needed) ──────
  const saveProgress = useCallback((payload: ProgressPayload) => {
    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        animeId: payload.animeId,
        malId: payload.malId,
        title: payload.title,
        coverImage: payload.coverImage,
        accent: payload.accent,
        episode: payload.episode,
        type: payload.type,
        playbackTime: payload.playbackTime,
        duration: payload.duration,
      }),
    }).catch(() => {/* swallow — best-effort save */});
  }, []);

  // ── Throttled save — called on timeupdate, max once per SAVE_INTERVAL_MS ─
  const recordProgress = useCallback((payload: ProgressPayload) => {
    const now = Date.now();
    pendingRef.current = payload;
    if (now - lastSaveRef.current >= SAVE_INTERVAL_MS) {
      lastSaveRef.current = now;
      saveProgress(payload);
    } else {
      // Schedule a trailing save so the last position is always flushed
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (pendingRef.current) {
          lastSaveRef.current = Date.now();
          saveProgress(pendingRef.current);
          pendingRef.current = null;
        }
      }, SAVE_INTERVAL_MS);
    }
  }, [saveProgress]);

  // ── Immediate save — called on pause / episode change ──────────────────
  const flushProgress = useCallback((payload: ProgressPayload) => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    lastSaveRef.current = Date.now();
    pendingRef.current = null;
    saveProgress(payload);
  }, [saveProgress]);

  return { fetchProgress, recordProgress, flushProgress };
}
