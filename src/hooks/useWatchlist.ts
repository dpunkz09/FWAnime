"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

export type WatchStatus = "watching" | "completed" | "on_hold" | "dropped" | "plan_to_watch";

export interface WatchEntry {
  animeId: number;
  malId: number | null;
  title: string;
  coverImage: string;
  accent: string;
  status: WatchStatus;
  progress: number;       // last watched episode
  totalEpisodes: number | null;
  updatedAt: number;      // unix ms
}

export interface ContinueEntry {
  animeId: number;
  malId: number | null;
  title: string;
  coverImage: string;
  accent: string;
  episode: number;
  type: "sub" | "dub";
  playbackTime: number;   // seconds into the episode
  duration: number;       // total episode duration in seconds (0 if unknown)
  updatedAt: number;
}

const WATCHLIST_KEY = "fw_watchlist";
const CONTINUE_KEY  = "fw_continue";

// ── Helpers ───────────────────────────────────────────────────────────────

function readWatchlist(): Record<number, WatchEntry> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY) ?? "{}");
  } catch { return {}; }
}

function saveWatchlist(data: Record<number, WatchEntry>) {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(data));
}

function readContinue(): Record<number, ContinueEntry> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(CONTINUE_KEY) ?? "{}");
  } catch { return {}; }
}

function saveContinue(data: Record<number, ContinueEntry>) {
  localStorage.setItem(CONTINUE_KEY, JSON.stringify(data));
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Record<number, WatchEntry>>({});
  const [continueList, setContinueList] = useState<Record<number, ContinueEntry>>({});

  // Load on mount
  useEffect(() => {
    setWatchlist(readWatchlist());
    setContinueList(readContinue());
  }, []);

  // ── Watchlist actions ──

  const getEntry = useCallback((animeId: number) => watchlist[animeId] ?? null, [watchlist]);

  const addToList = useCallback((
    anime: { animeId: number; malId: number | null; title: string; coverImage: string; accent: string; totalEpisodes: number | null },
    status: WatchStatus = "plan_to_watch"
  ) => {
    setWatchlist((prev) => {
      const next = {
        ...prev,
        [anime.animeId]: {
          ...prev[anime.animeId],
          animeId: anime.animeId,
          malId: anime.malId,
          title: anime.title,
          coverImage: anime.coverImage,
          accent: anime.accent,
          totalEpisodes: anime.totalEpisodes,
          status,
          progress: prev[anime.animeId]?.progress ?? 0,
          updatedAt: Date.now(),
        },
      };
      saveWatchlist(next);
      return next;
    });
  }, []);

  const removeFromList = useCallback((animeId: number) => {
    setWatchlist((prev) => {
      const next = { ...prev };
      delete next[animeId];
      saveWatchlist(next);
      return next;
    });
  }, []);

  const updateStatus = useCallback((animeId: number, status: WatchStatus) => {
    setWatchlist((prev) => {
      if (!prev[animeId]) return prev;
      const next = { ...prev, [animeId]: { ...prev[animeId], status, updatedAt: Date.now() } };
      saveWatchlist(next);
      return next;
    });
  }, []);

  const updateProgress = useCallback((animeId: number, episode: number) => {
    setWatchlist((prev) => {
      if (!prev[animeId]) return prev;
      const entry = prev[animeId];
      const newStatus: WatchStatus =
        entry.totalEpisodes && episode >= entry.totalEpisodes ? "completed" : "watching";
      const next = {
        ...prev,
        [animeId]: { ...entry, progress: episode, status: newStatus, updatedAt: Date.now() },
      };
      saveWatchlist(next);
      return next;
    });
  }, []);

  // ── Continue watching ──

  const getContinue = useCallback((animeId: number) => continueList[animeId] ?? null, [continueList]);

  const recordProgress = useCallback((entry: Omit<ContinueEntry, "updatedAt">) => {
    setContinueList((prev) => {
      const next = { ...prev, [entry.animeId]: { ...entry, updatedAt: Date.now() } };
      saveContinue(next);
      return next;
    });
    // Also bump watchlist progress if this anime is in the list
    setWatchlist((prev) => {
      if (!prev[entry.animeId]) return prev;
      const existing = prev[entry.animeId];
      if (entry.episode <= existing.progress) return prev;
      const newStatus: WatchStatus =
        existing.totalEpisodes && entry.episode >= existing.totalEpisodes ? "completed" : "watching";
      const next = {
        ...prev,
        [entry.animeId]: { ...existing, progress: entry.episode, status: newStatus, updatedAt: Date.now() },
      };
      saveWatchlist(next);
      return next;
    });
  }, []);

  // All continue entries sorted newest first
  const allContinue = Object.values(continueList).sort((a, b) => b.updatedAt - a.updatedAt);
  const allWatchlist = Object.values(watchlist).sort((a, b) => b.updatedAt - a.updatedAt);

  return {
    watchlist,
    allWatchlist,
    continueList,
    allContinue,
    getEntry,
    addToList,
    removeFromList,
    updateStatus,
    updateProgress,
    getContinue,
    recordProgress,
  };
}
