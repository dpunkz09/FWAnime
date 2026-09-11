"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isAniListDown =
    error.message?.includes("temporarily disabled") ||
    error.message?.includes("stability") ||
    error.message?.includes("403");

  const isRateLimit =
    error.message?.includes("rate_limited") ||
    error.message?.includes("rate limit");

  let heading = "Something went wrong";
  let body =
    "An unexpected error occurred. This is usually temporary — try refreshing the page.";

  if (isAniListDown) {
    heading = "AniList is currently down";
    body =
      "The AniList API has been temporarily disabled due to stability issues on their end. There's nothing to fix here — check back in a little while.";
  } else if (isRateLimit) {
    heading = "Too many requests";
    body =
      "AniList is rate limiting requests right now. Wait a moment and try again.";
  }

  return (
    <div
      className="min-h-[80vh] flex flex-col items-center justify-center gap-5 px-4 text-center"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      {/* Icon */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
        style={{ backgroundColor: "var(--color-surface)", color: "var(--color-blue)" }}
        aria-hidden="true"
      >
        {isAniListDown ? "⚡" : isRateLimit ? "⏱" : "⚠️"}
      </div>

      <h1
        className="text-2xl font-black"
        style={{ color: "var(--color-heading)" }}
      >
        {heading}
      </h1>

      <p
        className="text-sm max-w-md leading-relaxed"
        style={{ color: "var(--color-text-muted)" }}
      >
        {body}
      </p>

      {isAniListDown && (
        <a
          href="https://status.anilist.co"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline underline-offset-4"
          style={{ color: "var(--color-blue)" }}
        >
          Check AniList status →
        </a>
      )}

      <div className="flex gap-3 mt-2">
        <button
          onClick={reset}
          className="px-5 py-2 rounded text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--color-blue)", color: "white" }}
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-5 py-2 rounded text-sm font-semibold transition-opacity hover:opacity-80"
          style={{
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text)",
            border: "1px solid var(--color-border)",
          }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
