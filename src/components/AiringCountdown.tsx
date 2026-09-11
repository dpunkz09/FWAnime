"use client";

import { useEffect, useState } from "react";

interface Props {
  airingAt: number; // unix seconds
  episode: number;
  accent: string;
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

function format(ms: number): string {
  if (ms <= 0) return "Airing now";
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  // Show seconds only when < 1 hour remains
  if (d === 0 && h === 0) parts.push(`${s.toString().padStart(2, "0")}s`);

  return parts.join(" ");
}

export default function AiringCountdown({ airingAt, episode, accent }: Props) {
  const now = useNow();

  if (now === 0) {
    // Pre-hydration placeholder — keeps layout stable
    return (
      <div
        className="p-4 rounded-xl mb-6 text-sm"
        style={{ backgroundColor: `${accent}15`, borderLeft: `3px solid ${accent}` }}
      >
        <span className="font-semibold" style={{ color: accent }}>
          Episode {episode}
        </span>{" "}
        <span style={{ color: "var(--color-text)" }}>airing soon</span>
      </div>
    );
  }

  const msLeft = airingAt * 1000 - now;
  const countdown = format(msLeft);
  const isImminent = msLeft > 0 && msLeft < 3600_000; // < 1 hour

  return (
    <div
      className="p-4 rounded-xl mb-6 text-sm"
      style={{ backgroundColor: `${accent}15`, borderLeft: `3px solid ${accent}` }}
    >
      <span className="font-semibold" style={{ color: accent }}>
        Episode {episode}
      </span>{" "}
      <span style={{ color: "var(--color-text)" }}>airing in </span>
      <span
        className="font-black tabular-nums"
        style={{ color: isImminent ? "#f59e0b" : accent }}
      >
        {countdown}
      </span>
    </div>
  );
}
