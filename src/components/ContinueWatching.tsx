"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import NextLink from "next/link";
import { ScrollShadow, Separator } from "@heroui/react";
import { Play } from "lucide-react";

interface ProgressRow {
  anime_id: number;
  mal_id: number | null;
  title: string;
  cover_image: string;
  accent: string;
  episode: number;
  type: "sub" | "dub";
  playback_time: number;
  duration: number;
  updated_at: string;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ContinueWatching() {
  const [entries, setEntries] = useState<ProgressRow[]>([]);

  useEffect(() => {
    fetch("/api/progress/all", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: ProgressRow[]) => {
        // Only show entries that have meaningful progress
        setEntries(data.filter((e) => e.playback_time > 10 || e.episode > 1));
      })
      .catch(() => setEntries([]));
  }, []);

  if (entries.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-base font-bold" style={{ color: "var(--color-heading)" }}>
          Continue Watching
        </h2>
        <Separator className="w-8 hidden sm:block" style={{ backgroundColor: "var(--color-border)" }} />
      </div>

      <ScrollShadow orientation="horizontal" hideScrollBar className="pb-2">
        <div className="flex gap-3">
          {entries.slice(0, 10).map((entry) => {
            const href = `/watch/${entry.anime_id}?ep=${entry.episode}&type=${entry.type}${entry.mal_id ? `&mal=${entry.mal_id}` : ""}`;
            const pct = entry.duration > 0
              ? Math.min(100, Math.round((entry.playback_time / entry.duration) * 100))
              : 0;
            const hasProgress = entry.playback_time > 10 && entry.duration > 0;

            return (
              <NextLink
                key={entry.anime_id}
                href={href}
                className="group shrink-0 no-underline"
                style={{ width: 160 }}
              >
                {/* Cover */}
                <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "3/4" }}>
                  <Image
                    src={entry.cover_image}
                    alt={entry.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="160px"
                  />

                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  {/* Play button on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: entry.accent }}
                    >
                      <Play size={18} fill="white" className="text-white ml-0.5" />
                    </div>
                  </div>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <p className="text-white text-xs font-bold line-clamp-1 mb-1.5">
                      {entry.title}
                    </p>

                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: entry.accent, color: "white" }}
                      >
                        Ep {entry.episode}
                      </span>
                      {hasProgress && (
                        <span className="text-[9px] font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
                          {formatTime(entry.playback_time)}
                          {entry.duration > 0 ? ` / ${formatTime(entry.duration)}` : ""}
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    {hasProgress && (
                      <div
                        className="w-full rounded-full overflow-hidden"
                        style={{ height: 3, backgroundColor: "rgba(255,255,255,0.2)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: entry.accent }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </NextLink>
            );
          })}
        </div>
      </ScrollShadow>
    </section>
  );
}
