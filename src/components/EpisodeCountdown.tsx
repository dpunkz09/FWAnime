"use client";

import Image from "next/image";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { UpcomingEpisode } from "@/lib/anilist";
import { Clock } from "lucide-react";

interface Props {
  episodes: UpcomingEpisode[];
}

function useNow() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function formatCountdown(secondsLeft: number): string {
  if (secondsLeft <= 0) return "Airing now";
  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

export default function EpisodeCountdown({ episodes }: Props) {
  const now = useNow();

  if (now === 0) return null;

  // Sort ascending, filter out already aired (allow 60s grace), pick the closest one
  const next = episodes
    .filter((ep) => ep.airingAt * 1000 > now - 60_000)
    .sort((a, b) => a.airingAt - b.airingAt)[0];

  if (!next) return null;

  const title = next.media.title.english || next.media.title.romaji;
  const accent = next.media.coverImage.color || "#3db4f2";
  const secondsLeft = Math.max(0, Math.floor((next.airingAt * 1000 - now) / 1000));
  const isImminent = secondsLeft < 3600;
  const countdown = formatCountdown(secondsLeft);

  return (
    <div
      className="rounded-xl overflow-hidden mb-4"
      style={{ backgroundColor: "var(--color-surface)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center gap-2">
          <Clock size={13} style={{ color: "var(--color-blue)" }} />
          <span className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--color-heading)" }}>
            Next Episode
          </span>
        </div>
        {/* Live countdown badge */}
        <div
          className="flex items-center gap-1 text-xs font-black tabular-nums px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: isImminent ? "#f59e0b22" : `${accent}22`,
            color: isImminent ? "#f59e0b" : accent,
          }}
        >
          <Clock size={9} />
          {countdown}
        </div>
      </div>

      {/* Single episode row */}
      <NextLink
        href={`/anime/${next.media.id}`}
        className="group flex items-center gap-3 px-3 py-3 hover:bg-white/5 transition-colors no-underline"
      >
        {/* Cover */}
        <div className="relative w-10 h-14 rounded-md overflow-hidden shrink-0 shadow-md">
          <Image
            src={next.media.coverImage.large}
            alt={title}
            fill
            className="object-cover"
            sizes="40px"
          />
          <div
            className="absolute left-0 top-0 bottom-0 w-[3px]"
            style={{ backgroundColor: accent }}
          />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-semibold line-clamp-2 leading-snug mb-1 group-hover:text-[var(--color-blue)] transition-colors"
            style={{ color: "var(--color-heading)" }}
          >
            {title}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold" style={{ color: accent }}>
              Ep {next.episode}
            </span>
            {next.media.episodes && (
              <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                / {next.media.episodes}
              </span>
            )}
            <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
              · {next.media.format.replace("_", " ")}
            </span>
          </div>
        </div>
      </NextLink>
    </div>
  );
}
