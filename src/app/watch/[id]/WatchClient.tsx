"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import NextLink from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, ScrollShadow, Spinner, Breadcrumbs, Separator } from "@heroui/react";
import { Play, ChevronLeft, ChevronRight, SkipBack, SkipForward, ListEnd } from "lucide-react";
import { useProgress } from "@/hooks/useProgress";
import JWPlayer from "@/components/JWPlayer";

const AUTO_NEXT_KEY = "fw_auto_next";

interface TrackInfo { file: string; label?: string; kind: string; default?: boolean }
interface StreamData {
  m3u8?: string; proxiedUrl?: string; stream?: string; url?: string;
  sources?: { url: string }[];
  tracks?: TrackInfo[];
}
interface Episode { episode: number; airingAt: number }
interface RelatedMedia {
  id: number;
  title: { romaji: string; english: string | null };
  coverImage: { large: string; color: string | null };
  format: string | null;
  averageScore: number | null;
  relationType: string;
}

interface Props {
  animeId: number;
  malId: number | null;
  title: string;
  coverImage: string;
  bannerImage: string | null;
  accent: string;
  initialEpisode: number;
  initialType: "sub" | "dub";
  airedEpisodes: Episode[];
  related: RelatedMedia[];
}

const CORS_PROXY = "https://watch.flixworld.xyz/api/v1/streamingProxy?url=";
const PER_PAGE = 20;

const RELATION_LABELS: Record<string, string> = {
  SEQUEL: "Sequel", PREQUEL: "Prequel", SIDE_STORY: "Side Story",
  ALTERNATIVE: "Alternative", SPIN_OFF: "Spin-off",
  SUMMARY: "Summary", SOURCE: "Source", OTHER: "Other",
};

export default function WatchClient({
  animeId, malId, title, coverImage, accent,
  initialEpisode, initialType, airedEpisodes, related,
}: Props) {
  const router = useRouter();
  const [episode, setEpisode] = useState(initialEpisode);
  const [type, setType] = useState<"sub" | "dub">(initialType);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [tracks, setTracks] = useState<TrackInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [epPage, setEpPage] = useState(0);

  const totalEpPages = Math.ceil(airedEpisodes.length / PER_PAGE);
  const visibleEps = airedEpisodes.slice(epPage * PER_PAGE, (epPage + 1) * PER_PAGE);

  // Keep episode page in sync with selected episode
  useEffect(() => {
    const idx = airedEpisodes.findIndex((e) => e.episode === episode);
    if (idx >= 0) setEpPage(Math.floor(idx / PER_PAGE));
  }, [episode, airedEpisodes]);

  // Sync URL without a full navigation
  useEffect(() => {
    router.replace(
      `/watch/${animeId}?ep=${episode}&type=${type}${malId ? `&mal=${malId}` : ""}`,
      { scroll: false }
    );
  }, [episode, type, animeId, malId, router]);

  // Fetch stream URL from the anime API
  useEffect(() => {
    if (!malId) { setError("No MAL ID available"); setLoading(false); return; }
    setLoading(true); setError(null); setStreamUrl(null); setTracks([]);

    fetch(`https://api.flikhub.net/megaplay?mal=${malId}&ep=${episode}&type=${type}`)
      .then((r) => { if (!r.ok) throw new Error(`API error ${r.status}`); return r.json() as Promise<StreamData>; })
      .then((data) => {
        const raw = data.m3u8 ?? data.proxiedUrl ?? data.stream ?? data.url ?? data.sources?.[0]?.url ?? null;
        if (!raw) throw new Error("No stream URL in response");
        setStreamUrl(`${CORS_PROXY}${encodeURIComponent(raw)}`);
        if (data.tracks) {
          setTracks(data.tracks.map((t) => ({
            ...t,
            file: `${CORS_PROXY}${encodeURIComponent(t.file)}`,
          })));
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [malId, episode, type]);

  const prevEp = airedEpisodes.find((e) => e.episode === episode - 1);
  const nextEp = airedEpisodes.find((e) => e.episode === episode + 1);

  // ── Progress tracking ────────────────────────────────────────────────────
  const { fetchProgress, recordProgress, flushProgress } = useProgress();

  // Stable refs so callbacks passed to JWPlayer never carry stale closure values
  const episodeRef = useRef(episode);
  const typeRef    = useRef(type);
  useEffect(() => { episodeRef.current = episode; }, [episode]);
  useEffect(() => { typeRef.current    = type;    }, [type]);

  // How many seconds to resume from (0 = start from beginning)
  const resumeTargetRef = useRef(0);

  // Fetch saved progress whenever episode/type changes
  useEffect(() => {
    resumeTargetRef.current = 0;
    let cancelled = false;
    fetchProgress(animeId).then((saved) => {
      if (cancelled) return;
      if (saved && saved.episode === episode && saved.type === type && saved.playbackTime > 10) {
        resumeTargetRef.current = saved.playbackTime;
      }
    });
    return () => { cancelled = true; };
  }, [animeId, episode, type, fetchProgress]);

  // Register the episode in the DB as soon as the stream URL resolves
  useEffect(() => {
    if (!streamUrl) return;
    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        animeId, malId, title, coverImage, accent,
        episode, type,
        playbackTime: resumeTargetRef.current,
        duration: 0,
      }),
    }).catch(() => {});
  }, [streamUrl, episode, type]); // eslint-disable-line react-hooks/exhaustive-deps

  // Callbacks handed to JWPlayer — stable identity via useCallback
  const handleTimeUpdate = useCallback((currentTime: number, duration: number) => {
    recordProgress({
      animeId, malId, title, coverImage, accent,
      episode: episodeRef.current,
      type: typeRef.current,
      playbackTime: currentTime,
      duration,
    });
  }, [animeId, malId, title, coverImage, accent, recordProgress]);

  const handlePause = useCallback((currentTime: number, duration: number) => {
    flushProgress({
      animeId, malId, title, coverImage, accent,
      episode: episodeRef.current,
      type: typeRef.current,
      playbackTime: currentTime,
      duration,
    });
  }, [animeId, malId, title, coverImage, accent, flushProgress]);

  // ── Layout helpers ───────────────────────────────────────────────────────
  const centerRef = useRef<HTMLDivElement>(null);
  const [centerHeight, setCenterHeight] = useState<number | null>(null);

  useEffect(() => {
    const el = centerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setCenterHeight(el.offsetHeight));
    ro.observe(el);
    setCenterHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  // ── Auto-next episode ─────────────────────────────────────────────────────
  // Initialize to true (default), then sync from localStorage client-side
  const [autoNext, setAutoNext] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    const saved = localStorage.getItem(AUTO_NEXT_KEY);
    if (saved !== null) setAutoNext(saved === "true");
  }, []);

  const cancelCountdown = useCallback(() => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setCountdown(null);
  }, []);

  const toggleAutoNext = () => {
    setAutoNext(prev => {
      const next = !prev;
      localStorage.setItem(AUTO_NEXT_KEY, String(next));
      if (!next) cancelCountdown(); // cancel any running countdown when turned off
      return next;
    });
  };

  const handleEnded = useCallback(() => {
    if (!autoNext || !nextEp) return;
    // Start 5-second countdown
    setCountdown(5);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownRef.current!);
          countdownRef.current = null;
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [autoNext, nextEp]);

  // When countdown hits null after starting → advance episode
  const prevCountdown = useRef<number | null>(null);
  useEffect(() => {
    if (prevCountdown.current !== null && countdown === null && nextEp && autoNext) {
      setEpisode(nextEp.episode);
    }
    prevCountdown.current = countdown;
  }, [countdown, nextEp, autoNext]);

  // Clean up interval on unmount
  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current); }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 py-4">

        {/* Breadcrumbs */}
        <Breadcrumbs className="mb-3">
          <Breadcrumbs.Item>
            <NextLink href="/" className="no-underline text-xs" style={{ color: "var(--color-text-muted)" }}>Home</NextLink>
          </Breadcrumbs.Item>
          <Breadcrumbs.Item>
            <NextLink href={`/anime/${animeId}`} className="no-underline text-xs" style={{ color: "var(--color-text-muted)" }}>{title}</NextLink>
          </Breadcrumbs.Item>
          <Breadcrumbs.Item>
            <span className="text-xs" style={{ color: "var(--color-heading)" }}>Episode {episode}</span>
          </Breadcrumbs.Item>
        </Breadcrumbs>

        {/* ── 3-column grid ── */}
        <div className="flex gap-3 items-start">

          {/* ══ LEFT: Episode list ══ */}
          <div
            className="hidden lg:flex flex-col shrink-0 w-[240px] rounded-xl overflow-hidden self-stretch"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              ...(centerHeight ? { height: centerHeight } : {}),
            }}
          >
            <div className="px-3 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
              <NextLink href={`/anime/${animeId}`} className="no-underline group">
                <p className="text-xs font-black line-clamp-2 leading-snug group-hover:text-[var(--color-blue)] transition-colors"
                  style={{ color: "var(--color-heading)" }}>
                  {title}
                </p>
              </NextLink>
              <p className="text-[10px] mt-1" style={{ color: "var(--color-text-muted)" }}>
                {airedEpisodes.length} aired episodes
              </p>
            </div>

            {totalEpPages > 1 && (
              <div className="flex items-center justify-between px-2 py-1.5 border-b" style={{ borderColor: "var(--color-border)" }}>
                <Button isIconOnly size="sm" variant="ghost" isDisabled={epPage === 0}
                  onPress={() => setEpPage(p => p - 1)} className="w-6 h-6 min-w-0"
                  style={{ color: "var(--color-text-muted)" }}>
                  <ChevronLeft size={11} />
                </Button>
                <span className="text-[9px] font-semibold" style={{ color: "var(--color-text-muted)" }}>
                  {epPage * PER_PAGE + 1}–{Math.min((epPage + 1) * PER_PAGE, airedEpisodes.length)}
                </span>
                <Button isIconOnly size="sm" variant="ghost" isDisabled={epPage >= totalEpPages - 1}
                  onPress={() => setEpPage(p => p + 1)} className="w-6 h-6 min-w-0"
                  style={{ color: "var(--color-text-muted)" }}>
                  <ChevronRight size={11} />
                </Button>
              </div>
            )}

            <ScrollShadow hideScrollBar className="flex-1 min-h-0 overflow-y-auto">
              {visibleEps.map((ep) => {
                const isCurrent = ep.episode === episode;
                return (
                  <button
                    key={ep.episode}
                    onClick={() => setEpisode(ep.episode)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left cursor-pointer border-0 transition-colors hover:bg-white/5"
                    style={{
                      backgroundColor: isCurrent ? `${accent}18` : "transparent",
                      borderLeft: `3px solid ${isCurrent ? accent : "transparent"}`,
                    }}
                  >
                    {isCurrent
                      ? <Play size={9} fill={accent} className="shrink-0" style={{ color: accent }} />
                      : <span className="text-[10px] font-bold tabular-nums w-5 text-right shrink-0" style={{ color: "var(--color-text-muted)" }}>{ep.episode}</span>
                    }
                    <span className="text-xs truncate" style={{ color: isCurrent ? accent : "var(--color-text)", fontWeight: isCurrent ? 700 : 500 }}>
                      Ep {ep.episode}
                    </span>
                  </button>
                );
              })}
            </ScrollShadow>
          </div>

          {/* ══ CENTER: Player + controls ══ */}
          <div ref={centerRef} className="flex-1 min-w-0 flex flex-col gap-0">

            {/* Player container */}
            <div className="relative w-full overflow-hidden rounded-t-xl bg-black" style={{ aspectRatio: "16/9" }}>

              {/* Loading overlay */}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                  <Spinner size="lg" style={{ color: accent }} />
                </div>
              )}

              {/* Error overlay */}
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black gap-3 z-10 px-4 text-center">
                  <p className="text-sm text-red-400">{error}</p>
                  <Button size="sm" style={{ backgroundColor: accent, color: "white" }}
                    onPress={() => { setError(null); setLoading(true); setStreamUrl(null); }}>
                    Retry
                  </Button>
                </div>
              )}

              {/* JW Player — re-mounts on every new streamUrl via key */}
              {!loading && !error && streamUrl && (
                <JWPlayer
                  key={streamUrl}
                  src={streamUrl}
                  tracks={tracks}
                  accent={accent}
                  startTime={resumeTargetRef.current}
                  title={title}
                  episode={episode}
                  onTimeUpdate={handleTimeUpdate}
                  onPause={handlePause}
                  onEnded={handleEnded}
                  onError={(msg) => setError(msg)}
                />
              )}

              {/* Auto-next countdown overlay */}
              {countdown !== null && nextEp && (
                <div className="absolute inset-0 flex items-end justify-end p-4 pointer-events-none z-20">
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl pointer-events-auto"
                    style={{ backgroundColor: "rgba(11,22,34,0.92)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    {/* Circular countdown ring */}
                    <div className="relative w-10 h-10 shrink-0">
                      <svg className="absolute inset-0 -rotate-90" width="40" height="40" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                        <circle
                          cx="20" cy="20" r="16" fill="none"
                          stroke={accent} strokeWidth="3"
                          strokeDasharray={`${2 * Math.PI * 16}`}
                          strokeDashoffset={`${2 * Math.PI * 16 * (1 - countdown / 5)}`}
                          strokeLinecap="round"
                          style={{ transition: "stroke-dashoffset 1s linear" }}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-black">
                        {countdown}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-xs font-semibold leading-tight">
                        Next: Episode {nextEp.episode}
                      </p>
                      <p className="text-white/50 text-[10px] mt-0.5">Auto-playing in {countdown}s</p>
                    </div>
                    <button
                      onClick={cancelCountdown}
                      className="text-white/60 hover:text-white text-xs font-bold px-2 py-1 rounded transition-colors ml-2"
                      style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {!loading && !error && !streamUrl && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Stream unavailable</p>
                </div>
              )}
            </div>

            {/* Controls bar */}
            <div
              className="rounded-b-xl px-4 py-3 flex items-center gap-3 flex-wrap"
              style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderTop: "none" }}
            >
              {/* Cover + title */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative w-8 h-11 rounded overflow-hidden shrink-0 shadow">
                  <Image src={coverImage} alt={title} fill className="object-cover" sizes="32px" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold line-clamp-1" style={{ color: "var(--color-heading)" }}>{title}</p>
                  <p className="text-[10px]" style={{ color: accent }}>Episode {episode}</p>
                </div>
              </div>

              <Separator orientation="vertical" className="h-6 hidden sm:block" style={{ backgroundColor: "var(--color-border)" }} />

              {/* Prev / Next episode */}
              <div className="flex items-center gap-1">
                <Button isIconOnly size="sm" variant="ghost" isDisabled={!prevEp}
                  className="w-7 h-7" style={{ color: prevEp ? "var(--color-heading)" : "var(--color-text-muted)" }}
                  onPress={() => prevEp && setEpisode(prevEp.episode)}>
                  <SkipBack size={13} />
                </Button>
                <Button isIconOnly size="sm" variant="ghost" isDisabled={!nextEp}
                  className="w-7 h-7" style={{ color: nextEp ? "var(--color-heading)" : "var(--color-text-muted)" }}
                  onPress={() => nextEp && setEpisode(nextEp.episode)}>
                  <SkipForward size={13} />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6 hidden sm:block" style={{ backgroundColor: "var(--color-border)" }} />

              {/* Sub / Dub toggle */}
              <div className="flex items-center gap-1">
                {(["sub", "dub"] as const).map((t) => (
                  <Button key={t} size="sm"
                    variant={type === t ? "primary" : "ghost"}
                    className="uppercase text-[10px] font-black px-3 h-6"
                    style={type === t ? { backgroundColor: accent, color: "white" } : { color: "var(--color-text-muted)" }}
                    onPress={() => setType(t)}
                  >{t}</Button>
                ))}
              </div>

              <Separator orientation="vertical" className="h-6 hidden sm:block" style={{ backgroundColor: "var(--color-border)" }} />

              {/* Auto-next toggle */}
              <button
                onClick={toggleAutoNext}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors text-[10px] font-bold shrink-0"
                style={{
                  backgroundColor: autoNext ? `${accent}20` : "rgba(255,255,255,0.05)",
                  color: autoNext ? accent : "var(--color-text-muted)",
                  border: `1px solid ${autoNext ? `${accent}44` : "var(--color-border)"}`,
                }}
                title={autoNext ? "Auto-next: ON" : "Auto-next: OFF"}
              >
                <ListEnd size={12} />
                <span className="hidden sm:inline">Auto-next</span>
                {/* Toggle pill */}
                <span
                  className="w-6 h-3.5 rounded-full relative transition-colors shrink-0"
                  style={{ backgroundColor: autoNext ? accent : "rgba(255,255,255,0.15)" }}
                >
                  <span
                    className="absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-transform"
                    style={{ transform: autoNext ? "translateX(13px)" : "translateX(1px)" }}
                  />
                </span>
              </button>

              {/* Back to anime */}
              <NextLink href={`/anime/${animeId}`} className="no-underline ml-auto hidden sm:block">
                <Button variant="ghost" size="sm" className="text-xs gap-1" style={{ color: "var(--color-text-muted)" }}>
                  <ChevronLeft size={12} /> Back
                </Button>
              </NextLink>
            </div>

            {/* Mobile: episode grid */}
            <div className="lg:hidden mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold" style={{ color: "var(--color-heading)" }}>
                  Episodes <span className="text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>({airedEpisodes.length})</span>
                </p>
                {totalEpPages > 1 && (
                  <div className="flex items-center gap-1">
                    <Button isIconOnly size="sm" variant="ghost" isDisabled={epPage === 0}
                      onPress={() => setEpPage(p => p - 1)} className="w-6 h-6" style={{ color: "var(--color-text-muted)" }}>
                      <ChevronLeft size={11} />
                    </Button>
                    <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                      {epPage * PER_PAGE + 1}–{Math.min((epPage + 1) * PER_PAGE, airedEpisodes.length)}
                    </span>
                    <Button isIconOnly size="sm" variant="ghost" isDisabled={epPage >= totalEpPages - 1}
                      onPress={() => setEpPage(p => p + 1)} className="w-6 h-6" style={{ color: "var(--color-text-muted)" }}>
                      <ChevronRight size={11} />
                    </Button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
                {visibleEps.map((ep) => {
                  const isCurrent = ep.episode === episode;
                  return (
                    <Button key={ep.episode} size="sm"
                      className="h-9 font-bold text-xs rounded-lg border"
                      style={{
                        backgroundColor: isCurrent ? accent : "var(--color-surface)",
                        color: isCurrent ? "white" : "var(--color-text)",
                        borderColor: isCurrent ? accent : "var(--color-border)",
                      }}
                      onPress={() => setEpisode(ep.episode)}>
                      {ep.episode}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ══ RIGHT: Related anime ══ */}
          <div
            className="hidden xl:flex flex-col shrink-0 w-[300px] rounded-xl overflow-hidden self-stretch"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              ...(centerHeight ? { height: centerHeight } : {}),
            }}
          >
            <div className="px-4 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
              <p className="text-sm font-black" style={{ color: "var(--color-heading)" }}>Related</p>
            </div>

            <ScrollShadow hideScrollBar className="flex-1 min-h-0 overflow-y-auto">
              <div className="flex flex-col p-2 gap-1">
                {related.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center py-8">
                    <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>No related anime</p>
                  </div>
                ) : related.map((r) => {
                  const rAccent = r.coverImage.color || "#3db4f2";
                  return (
                    <NextLink key={r.id} href={`/anime/${r.id}`}
                      className="group flex items-center gap-2.5 no-underline rounded-lg p-2 transition-colors hover:bg-white/5"
                    >
                      <div className="relative w-10 h-14 rounded-md overflow-hidden shrink-0 shadow-sm">
                        <Image src={r.coverImage.large} alt={r.title.romaji} fill className="object-cover" sizes="40px" />
                        <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: rAccent }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-black uppercase tracking-wider mb-0.5" style={{ color: rAccent }}>
                          {RELATION_LABELS[r.relationType] ?? r.relationType}
                        </p>
                        <p className="text-xs font-semibold line-clamp-2 leading-snug group-hover:text-[var(--color-blue)] transition-colors"
                          style={{ color: "var(--color-heading)" }}>
                          {r.title.english || r.title.romaji}
                        </p>
                        <p className="text-[9px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                          {r.format?.replace("_", " ") ?? "—"}
                          {r.averageScore ? ` · ★ ${(r.averageScore / 10).toFixed(1)}` : ""}
                        </p>
                      </div>
                    </NextLink>
                  );
                })}
              </div>
            </ScrollShadow>
          </div>

        </div>
      </div>
    </div>
  );
}
