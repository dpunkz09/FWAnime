"use client";

import { useEffect } from "react";
import { Button } from "@heroui/react";

export default function AnimeDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isRateLimit = error.message?.includes("rate limit");

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-2xl font-black" style={{ color: "var(--color-heading)" }}>
        {isRateLimit ? "Too many requests" : "Something went wrong"}
      </p>
      <p className="text-sm max-w-sm" style={{ color: "var(--color-text-muted)" }}>
        {isRateLimit
          ? "AniList is rate limiting requests right now. Wait a moment and try again."
          : "Failed to load anime details. This is usually a temporary issue."}
      </p>
      <Button
        onPress={reset}
        style={{ backgroundColor: "#3db4f2", color: "white" }}
        className="mt-2"
      >
        Try again
      </Button>
    </div>
  );
}
