"use client";

import { useState } from "react";
import NextLink from "next/link";
import Image from "next/image";
import { Button, Chip } from "@heroui/react";
import { Trash2, Play } from "lucide-react";
import { useWatchlist, WatchStatus, type WatchEntry } from "@/hooks/useWatchlist";

const STATUS_LABELS: Record<WatchStatus, string> = {
  watching:      "Watching",
  completed:     "Completed",
  on_hold:       "On Hold",
  dropped:       "Dropped",
  plan_to_watch: "Plan to Watch",
};

const STATUS_COLORS: Record<WatchStatus, string> = {
  watching:      "#3db4f2",
  completed:     "#22c55e",
  on_hold:       "#f59e0b",
  dropped:       "#ef4444",
  plan_to_watch: "#9ab0cc",
};

const ALL_STATUSES = Object.keys(STATUS_LABELS) as WatchStatus[];

export default function MyListPage() {
  const { allWatchlist, removeFromList, updateStatus } = useWatchlist();
  const [activeTab, setActiveTab] = useState<WatchStatus | "all">("all");

  const filtered: WatchEntry[] =
    activeTab === "all"
      ? allWatchlist
      : allWatchlist.filter((e) => e.status === activeTab);

  const countFor = (s: WatchStatus) => allWatchlist.filter((e) => e.status === s).length;

  return (
    <div className="min-h-screen pt-6 pb-16" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black" style={{ color: "var(--color-heading)" }}>My List</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            {allWatchlist.length} {allWatchlist.length === 1 ? "title" : "titles"} saved
          </p>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <button
            onClick={() => setActiveTab("all")}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            style={{
              backgroundColor: activeTab === "all" ? "var(--color-blue)" : "var(--color-surface)",
              color: activeTab === "all" ? "white" : "var(--color-text-muted)",
              border: "1px solid",
              borderColor: activeTab === "all" ? "var(--color-blue)" : "var(--color-border)",
            }}
          >
            All ({allWatchlist.length})
          </button>
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setActiveTab(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              style={{
                backgroundColor: activeTab === s ? `${STATUS_COLORS[s]}22` : "var(--color-surface)",
                color: activeTab === s ? STATUS_COLORS[s] : "var(--color-text-muted)",
                border: "1px solid",
                borderColor: activeTab === s ? STATUS_COLORS[s] : "var(--color-border)",
              }}
            >
              {STATUS_LABELS[s]} ({countFor(s)})
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-4xl">📚</p>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>
              {activeTab === "all" ? "Your list is empty" : `No ${STATUS_LABELS[activeTab]} titles`}
            </p>
            <NextLink href="/">
              <Button size="sm" style={{ backgroundColor: "var(--color-blue)", color: "white" }}>
                Browse Anime
              </Button>
            </NextLink>
          </div>
        )}

        {/* Grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map((entry) => (
              <ListCard
                key={entry.animeId}
                entry={entry}
                onRemove={() => removeFromList(entry.animeId)}
                onStatusChange={(s) => updateStatus(entry.animeId, s)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Individual card ────────────────────────────────────────────────────────
function ListCard({
  entry,
  onRemove,
  onStatusChange,
}: {
  entry: WatchEntry;
  onRemove: () => void;
  onStatusChange: (s: WatchStatus) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const color = STATUS_COLORS[entry.status];

  return (
    <div className="group relative flex flex-col rounded-xl overflow-hidden"
      style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>

      {/* Cover */}
      <NextLink href={`/anime/${entry.animeId}`} className="relative block" style={{ aspectRatio: "3/4" }}>
        <Image
          src={entry.coverImage}
          alt={entry.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 200px"
        />
        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />

        {/* Play button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: entry.accent }}>
            <Play size={16} fill="white" className="text-white ml-0.5" />
          </div>
        </div>

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <span
            className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${color}dd`, color: "white" }}
          >
            {STATUS_LABELS[entry.status]}
          </span>
        </div>

        {/* Progress badge */}
        {entry.progress > 0 && (
          <div className="absolute top-2 right-2">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-black/70 text-white">
              Ep {entry.progress}{entry.totalEpisodes ? `/${entry.totalEpisodes}` : ""}
            </span>
          </div>
        )}

        {/* Progress bar */}
        {entry.totalEpisodes && entry.totalEpisodes > 0 && (
          <div className="absolute bottom-0 inset-x-0 h-1" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
            <div
              className="h-full"
              style={{
                width: `${Math.min(100, (entry.progress / entry.totalEpisodes) * 100)}%`,
                backgroundColor: color,
              }}
            />
          </div>
        )}
      </NextLink>

      {/* Info + actions */}
      <div className="p-2 flex flex-col gap-1.5">
        <NextLink href={`/anime/${entry.animeId}`} className="no-underline">
          <p className="text-xs font-bold line-clamp-2 leading-snug hover:text-[var(--color-blue)] transition-colors"
            style={{ color: "var(--color-heading)" }}>
            {entry.title}
          </p>
        </NextLink>

        {/* Action row */}
        <div className="flex items-center gap-1 mt-0.5">
          {/* Watch button */}
          <NextLink
            href={`/watch/${entry.animeId}${entry.malId ? `?mal=${entry.malId}` : ""}`}
            className="flex-1 no-underline"
          >
            <button
              className="w-full text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
              style={{ backgroundColor: `${entry.accent}20`, color: entry.accent }}
            >
              Watch
            </button>
          </NextLink>

          {/* Status change menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="p-1 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: "var(--color-text-muted)" }}
              aria-label="Change status"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>

            {menuOpen && (
              <StatusMenu
                current={entry.status}
                onSelect={(s) => { onStatusChange(s); setMenuOpen(false); }}
                onRemove={() => { onRemove(); setMenuOpen(false); }}
                onClose={() => setMenuOpen(false)}
              />
            )}
          </div>

          {/* Remove button */}
          <button
            onClick={onRemove}
            className="p-1 rounded-lg transition-colors hover:bg-red-500/20 text-red-400/60 hover:text-red-400"
            aria-label="Remove from list"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status context menu ────────────────────────────────────────────────────
function StatusMenu({
  current, onSelect, onRemove, onClose,
}: {
  current: WatchStatus;
  onSelect: (s: WatchStatus) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  // Close on outside click
  const ref = (el: HTMLDivElement | null) => {
    if (!el) return;
    const handler = (e: MouseEvent) => {
      if (!el.contains(e.target as Node)) onClose();
    };
    // Delay so the opening click doesn't immediately close it
    setTimeout(() => document.addEventListener("mousedown", handler, { once: true }), 0);
  };

  return (
    <div
      ref={ref}
      className="absolute bottom-full right-0 mb-1 rounded-xl shadow-2xl z-50 py-1 overflow-hidden min-w-[150px]"
      style={{ backgroundColor: "rgba(12,17,28,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      {ALL_STATUSES.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-white/10 flex items-center gap-2"
          style={{
            color: current === s ? STATUS_COLORS[s] : "rgba(255,255,255,0.75)",
            fontWeight: current === s ? 700 : 400,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: STATUS_COLORS[s] }}
          />
          {STATUS_LABELS[s]}
          {current === s && <span className="ml-auto text-[10px]">✓</span>}
        </button>
      ))}
      <div className="my-1 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }} />
      <button
        onClick={onRemove}
        className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
      >
        <Trash2 size={11} />
        Remove from List
      </button>
    </div>
  );
}
