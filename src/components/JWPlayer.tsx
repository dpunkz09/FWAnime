"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls, { type Level } from "hls.js";

interface TrackInfo {
  file: string;
  label?: string;
  kind: string;
  default?: boolean;
}

interface Props {
  src: string;
  tracks?: TrackInfo[];
  accent?: string;
  startTime?: number;
  title?: string;
  episode?: number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPause?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onError?: (msg: string) => void;
}

interface QualityLevel {
  index: number;   // hls.js level index, -1 = auto
  label: string;
  height: number;
}

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// ── Shared icon helpers ───────────────────────────────────────────────────
const IconCC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-8 8.25h-1.5V11H8v2.25H6.5v-2.5C6.5 9.78 7.28 9 8.25 9H11v3.25zm6.5 0H16V11h-1.5v2.25H13v-2.5C13 9.78 13.78 9 14.75 9H17.5v3.25z"/>
  </svg>
);
const IconQuality = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
  </svg>
);

interface SubtitleStyle {
  fontSize: number;        // px
  color: string;           // hex
  bgOpacity: number;       // 0–1
  position: "bottom" | "top" | "middle";
}

const SUBTITLE_STYLE_KEY = "player_subtitle_style";

function loadSubtitleStyle(): SubtitleStyle {
  // SSR-safe: always return default, localStorage is hydrated client-side
  return { fontSize: 18, color: "#ffffff", bgOpacity: 0.6, position: "bottom" };
}

function saveSubtitleStyle(s: SubtitleStyle) {
  try { localStorage.setItem(SUBTITLE_STYLE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

// ── Subtitle settings panel ───────────────────────────────────────────────
interface SubtitleSettingsProps {
  style: SubtitleStyle;
  onChange: (s: SubtitleStyle) => void;
  accent: string;
}

const FONT_SIZES  = [12, 14, 16, 18, 20, 24, 28, 32];
const TEXT_COLORS = [
  { label: "White",   value: "#ffffff" },
  { label: "Yellow",  value: "#facc15" },
  { label: "Cyan",    value: "#22d3ee" },
  { label: "Green",   value: "#4ade80" },
  { label: "Pink",    value: "#f472b6" },
];
const POSITIONS = [
  { label: "Bottom", value: "bottom" },
  { label: "Middle", value: "middle" },
  { label: "Top",    value: "top"    },
] as const;

function SubtitleSettings({ style, onChange, accent }: SubtitleSettingsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const set = (patch: Partial<SubtitleStyle>) => {
    const next = { ...style, ...patch };
    onChange(next);
    saveSubtitleStyle(next);
  };

  return (
    <div ref={ref} className="relative shrink-0">
      {/* Gear button */}
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className="text-white hover:text-white/80 transition-colors flex items-center"
        aria-label="Subtitle settings"
        title="Subtitle settings"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87a.47.47 0 0 0 .12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.37 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 0 0-.12-.61l-2.01-1.58zM12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z"/>
        </svg>
      </button>

      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 rounded-xl shadow-2xl z-50 w-64 p-4 flex flex-col gap-4"
          style={{ backgroundColor: "rgba(12,17,28,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}
          onClick={e => e.stopPropagation()}
        >
          <p className="text-white text-xs font-black uppercase tracking-widest mb-1" style={{ color: accent }}>
            Subtitle Style
          </p>

          {/* Font size */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-white/60">Font Size</label>
            <div className="flex flex-wrap gap-1">
              {FONT_SIZES.map(sz => (
                <button
                  key={sz}
                  onClick={() => set({ fontSize: sz })}
                  className="px-2 py-0.5 rounded text-xs transition-colors"
                  style={{
                    backgroundColor: style.fontSize === sz ? accent : "rgba(255,255,255,0.08)",
                    color: style.fontSize === sz ? "#fff" : "rgba(255,255,255,0.7)",
                    fontWeight: style.fontSize === sz ? 700 : 400,
                  }}
                >
                  {sz}px
                </button>
              ))}
            </div>
          </div>

          {/* Text color */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-white/60">Text Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {TEXT_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => set({ color: c.value })}
                  title={c.label}
                  className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c.value,
                    borderColor: style.color === c.value ? "#fff" : "transparent",
                  }}
                />
              ))}
              {/* Custom color picker */}
              <label title="Custom color" className="w-6 h-6 rounded-full overflow-hidden cursor-pointer border-2 relative"
                style={{ borderColor: TEXT_COLORS.some(c => c.value === style.color) ? "transparent" : "#fff" }}>
                <span className="text-[9px] absolute inset-0 flex items-center justify-center text-white font-bold select-none">+</span>
                <input
                  type="color"
                  value={style.color}
                  onChange={e => set({ color: e.target.value })}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Background opacity */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-white/60">
              Background Opacity <span className="text-white/40 ml-1">{Math.round(style.bgOpacity * 100)}%</span>
            </label>
            <input
              type="range" min={0} max={1} step={0.05}
              value={style.bgOpacity}
              onChange={e => set({ bgOpacity: Number(e.target.value) })}
              className="w-full cursor-pointer"
              style={{ accentColor: accent }}
            />
          </div>

          {/* Position */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-white/60">Position</label>
            <div className="flex gap-1">
              {POSITIONS.map(p => (
                <button
                  key={p.value}
                  onClick={() => set({ position: p.value })}
                  className="flex-1 py-1 rounded text-xs transition-colors"
                  style={{
                    backgroundColor: style.position === p.value ? accent : "rgba(255,255,255,0.08)",
                    color: style.position === p.value ? "#fff" : "rgba(255,255,255,0.7)",
                    fontWeight: style.position === p.value ? 700 : 400,
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg p-3 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)", minHeight: 44 }}>
            <span
              className="text-sm text-center rounded px-2 py-0.5"
              style={{
                color: style.color,
                fontSize: Math.min(style.fontSize, 18),
                backgroundColor: `rgba(0,0,0,${style.bgOpacity})`,
                textShadow: "0 1px 4px rgba(0,0,0,0.9)",
              }}
            >
              Sample subtitle text
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
interface DropdownProps {
  label: React.ReactNode;
  items: { value: string | number; label: string }[];
  active: string | number;
  onSelect: (value: string | number) => void;
  accent: string;
}
function Dropdown({ label, items, active, onSelect, accent }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="text-white hover:text-white/80 transition-colors flex items-center"
        aria-label="Open menu"
      >
        {label}
      </button>
      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 rounded-lg shadow-xl z-50 min-w-[140px] overflow-y-auto"
          style={{
            backgroundColor: "rgba(15,20,30,0.97)",
            border: "1px solid rgba(255,255,255,0.08)",
            maxHeight: "240px",
          }}
          onClick={e => e.stopPropagation()}
        >
          {items.map(item => (
            <button
              key={item.value}
              onClick={() => { onSelect(item.value); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-white/10"
              style={{
                color: active === item.value ? accent : "rgba(255,255,255,0.85)",
                fontWeight: active === item.value ? 700 : 400,
              }}
            >
              {active === item.value && <span className="mr-1.5">✓</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function JWPlayer({
  src,
  tracks = [],
  accent = "#3db4f2",
  startTime = 0,
  title,
  episode,
  onTimeUpdate,
  onPause,
  onEnded,
  onError,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef     = useRef<HTMLVideoElement>(null);
  const hlsRef       = useRef<Hls | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing,      setPlaying]      = useState(false);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [duration,     setDuration]     = useState(0);
  const [volume,       setVolume]       = useState(1);
  const [muted,        setMuted]        = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered,     setBuffered]     = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Quality
  const [qualityLevels,   setQualityLevels]   = useState<QualityLevel[]>([]);
  const [activeQuality,   setActiveQuality]   = useState<number>(-1); // -1 = auto

  // Subtitles — drive via video.textTracks
  const [subtitleTracks,  setSubtitleTracks]  = useState<{ index: number; label: string }[]>([]);
  const [activeSubtitle,  setActiveSubtitle]  = useState<number>(-1); // -1 = off
  const [cueText,         setCueText]         = useState<string>(""); // currently visible cue
  const [subtitleStyle,   setSubtitleStyle]   = useState<SubtitleStyle>(loadSubtitleStyle);

  // Hydrate subtitle style from localStorage on mount (SSR-safe)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SUBTITLE_STYLE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SubtitleStyle>;
        setSubtitleStyle(prev => ({ ...prev, ...parsed }));
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stable callback refs
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onPauseRef      = useRef(onPause);
  const onEndedRef      = useRef(onEnded);
  const onErrorRef      = useRef(onError);
  useEffect(() => { onTimeUpdateRef.current = onTimeUpdate; }, [onTimeUpdate]);
  useEffect(() => { onPauseRef.current      = onPause;      }, [onPause]);
  useEffect(() => { onEndedRef.current      = onEnded;      }, [onEnded]);
  useEffect(() => { onErrorRef.current      = onError;      }, [onError]);

  // ── HLS + event setup ─────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let lastSave = 0;
    let seeked   = false;

    const onTimeUpdateNative = () => {
      const dur = video.duration;
      const cur = video.currentTime;
      if (!isFinite(dur) || dur <= 0) return;

      if (!seeked && startTime > 10 && startTime < dur - 30) {
        video.currentTime = startTime;
        seeked = true;
        return;
      }

      setCurrentTime(cur);
      setDuration(dur);

      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }

      const now = Date.now();
      if (now - lastSave >= 3000) {
        lastSave = now;
        onTimeUpdateRef.current?.(Math.floor(cur), Math.floor(dur));
      }
    };

    const onPauseNative = () => {
      setPlaying(false);
      const dur = video.duration;
      if (isFinite(dur) && dur > 0) {
        onPauseRef.current?.(Math.floor(video.currentTime), Math.floor(dur));
      }
    };

    const onPlay             = () => setPlaying(true);
    const onEnded            = () => { setPlaying(false); onEndedRef.current?.(); };
    const onLoadedMetadata   = () => { setDuration(video.duration); setCurrentTime(video.currentTime); };
    const onVolumeChange     = () => { setVolume(video.volume); setMuted(video.muted); };
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);

    video.addEventListener("timeupdate",      onTimeUpdateNative);
    video.addEventListener("pause",           onPauseNative);
    video.addEventListener("play",            onPlay);
    video.addEventListener("ended",           onEnded);
    video.addEventListener("loadedmetadata",  onLoadedMetadata);
    video.addEventListener("volumechange",    onVolumeChange);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, backBufferLength: 90 });
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        // Build quality list from parsed levels, sorted best → worst
        const levels: QualityLevel[] = (data.levels as Level[])
          .map((l, i) => ({
            index: i,
            height: l.height ?? 0,
            label: l.height ? `${l.height}p` : `Level ${i + 1}`,
          }))
          .sort((a, b) => b.height - a.height);

        // Deduplicate labels (some streams have identical heights)
        const seen = new Set<string>();
        const deduped = levels.map(l => {
          let label = l.label;
          let n = 2;
          while (seen.has(label)) label = `${l.label} (${n++})`;
          seen.add(label);
          return { ...l, label };
        });

        setQualityLevels([{ index: -1, height: 0, label: "Auto" }, ...deduped]);
        setActiveQuality(-1);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) onErrorRef.current?.(String(data.details ?? "Stream error"));
      });

      hls.loadSource(src);
      hls.attachMedia(video);
      video.play().catch(() => {});
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.play().catch(() => {});
    } else {
      onErrorRef.current?.("HLS is not supported in this browser.");
    }

    // Build subtitle list from <track> elements (populated after render)
    const buildSubtitleList = () => {
      const list: { index: number; label: string }[] = [];
      for (let i = 0; i < video.textTracks.length; i++) {
        const t = video.textTracks[i];
        if (t.kind === "subtitles" || t.kind === "captions") {
          list.push({ index: i, label: t.label || `Track ${i + 1}` });
          // Force all to hidden — we render cues ourselves
          t.mode = "hidden";
        }
      }
      setSubtitleTracks(list);
      // Auto-select the first track (matches the <track default> attribute)
      const defaultIdx = list.length > 0 ? list[0].index : -1;
      setActiveSubtitle(defaultIdx);
    };

    // textTracks are populated after a tick
    setTimeout(buildSubtitleList, 100);

    return () => {
      video.removeEventListener("timeupdate",      onTimeUpdateNative);
      video.removeEventListener("pause",           onPauseNative);
      video.removeEventListener("play",            onPlay);
      video.removeEventListener("ended",           onEnded);
      video.removeEventListener("loadedmetadata",  onLoadedMetadata);
      video.removeEventListener("volumechange",    onVolumeChange);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.src = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, startTime]);

  // ── Quality switching ─────────────────────────────────────────────────
  const handleQualitySelect = (value: string | number) => {
    const idx = Number(value);
    const hls = hlsRef.current;
    if (!hls) return;
    if (idx === -1) {
      hls.currentLevel     = -1;   // auto
      hls.loadLevel        = -1;
    } else {
      hls.currentLevel     = idx;
      hls.loadLevel        = idx;
    }
    setActiveQuality(idx);
  };

  // ── Subtitle switching ────────────────────────────────────────────────
  const handleSubtitleSelect = (value: string | number) => {
    const idx = Number(value);
    const video = videoRef.current;
    if (!video) return;
    // Set all tracks to "hidden" — we render cues ourselves so the
    // browser doesn't draw them on top of the controls at the bottom.
    for (let i = 0; i < video.textTracks.length; i++) {
      video.textTracks[i].mode = i === idx ? "hidden" : "disabled";
    }
    setActiveSubtitle(idx);
    if (idx === -1) setCueText("");
  };

  // ── Cue renderer — fires whenever the active track's cues change ──────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || activeSubtitle < 0) { setCueText(""); return; }

    const track = video.textTracks[activeSubtitle];
    if (!track) { setCueText(""); return; }

    track.mode = "hidden"; // ensure it's in hidden (loaded) mode

    const onCueChange = () => {
      if (!track.activeCues || track.activeCues.length === 0) {
        setCueText("");
        return;
      }
      // Collect all active cue texts, strip basic HTML tags
      const text = Array.from(track.activeCues)
        .map(c => (c as VTTCue).text.replace(/<[^>]+>/g, ""))
        .join("\n");
      setCueText(text);
    };

    track.addEventListener("cuechange", onCueChange);
    onCueChange(); // sync immediately

    return () => {
      track.removeEventListener("cuechange", onCueChange);
    };
  }, [activeSubtitle]);

  // ── Controls auto-hide ────────────────────────────────────────────────
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't fire when user is typing in an input / textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const v = videoRef.current;
      if (!v) return;

      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          v.paused ? v.play() : v.pause();
          resetHideTimer();
          break;

        case "ArrowRight":
          e.preventDefault();
          v.currentTime = Math.min(v.duration, v.currentTime + 10);
          resetHideTimer();
          break;

        case "ArrowLeft":
          e.preventDefault();
          v.currentTime = Math.max(0, v.currentTime - 10);
          resetHideTimer();
          break;

        case "ArrowUp":
          e.preventDefault();
          v.volume = Math.min(1, v.volume + 0.1);
          v.muted  = false;
          resetHideTimer();
          break;

        case "ArrowDown":
          e.preventDefault();
          v.volume = Math.max(0, v.volume - 0.1);
          resetHideTimer();
          break;

        case "m":
        case "M":
          e.preventDefault();
          v.muted = !v.muted;
          break;

        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;

        case "j":
        case "J":
          e.preventDefault();
          v.currentTime = Math.max(0, v.currentTime - 10);
          resetHideTimer();
          break;

        case "l":
        case "L":
          e.preventDefault();
          v.currentTime = Math.min(v.duration, v.currentTime + 10);
          resetHideTimer();
          break;
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetHideTimer]);

  // ── Playback controls ─────────────────────────────────────────────────
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const t = Number(e.target.value);
    v.currentTime = t;
    setCurrentTime(t);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const vol = Number(e.target.value);
    v.volume = vol;
    v.muted  = vol === 0;
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      await el.requestFullscreen().catch(() => {});
      // Lock to landscape on mobile if the Screen Orientation API is available
      try {
        await (screen.orientation as ScreenOrientation & {
          lock?: (o: string) => Promise<void>;
        }).lock?.("landscape");
      } catch {
        // API not supported or denied (desktop) — silently ignore
      }
    } else {
      await document.exitFullscreen().catch(() => {});
      // Unlock orientation when leaving fullscreen
      try { screen.orientation.unlock(); } catch { /* ignore */ }
    }
  };

  const seekPct   = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferPct = duration > 0 ? (buffered   / duration) * 100 : 0;

  const qualityItems  = qualityLevels.map(q => ({ value: q.index, label: q.label }));
  const subtitleItems = [
    { value: -1, label: "Off" },
    ...subtitleTracks.map(t => ({ value: t.index, label: t.label })),
  ];

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full bg-black"
      style={{ cursor: showControls ? "default" : "none" }}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => { if (playing) setShowControls(false); }}
      onTouchStart={resetHideTimer}
    >
      {/* ── Video element ──────────────────────────────────────────── */}
      <video
        ref={videoRef}
        className="w-full h-full"
        playsInline
        crossOrigin="anonymous"
      >
        {tracks.map((t, i) => (
          <track
            key={i}
            src={t.file}
            kind={(t.kind as "subtitles" | "captions") || "subtitles"}
            label={t.label ?? `Track ${i + 1}`}
            default={t.default ?? i === 0}
          />
        ))}
      </video>

      {/* Tap/click anywhere on the video → toggle controls visibility only.
          Does NOT pause. Play/pause is only via the dedicated button. */}
      <div className="absolute inset-0" onClick={resetHideTimer} />

      {/* ── Custom subtitle overlay — sits above the controls ─────── */}
      {cueText && (
        <div
          className="absolute inset-x-0 pointer-events-none flex flex-col items-center gap-0.5 px-8"
          style={{
            ...(subtitleStyle.position === "bottom"
              ? { bottom: showControls ? "140px" : "32px", transition: "bottom 0.3s ease" }
              : subtitleStyle.position === "top"
              ? { top: "24px" }
              : { top: "50%", transform: "translateY(-50%)" }),
          }}
        >
          {cueText.split("\n").map((line, i) => (
            <span
              key={i}
              className="text-center rounded px-2 py-0.5"
              style={{
                color: subtitleStyle.color,
                fontSize: subtitleStyle.fontSize,
                backgroundColor: `rgba(0,0,0,${subtitleStyle.bgOpacity})`,
                textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                lineHeight: 1.5,
              }}
            >
              {line}
            </span>
          ))}
        </div>
      )}

      {/* ── Controls overlay ───────────────────────────────────────── */}
      <div
        className="absolute inset-x-0 bottom-0 transition-opacity duration-300"
        style={{ opacity: showControls ? 1 : 0, pointerEvents: showControls ? "auto" : "none" }}
      >
        {/* Gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

        <div className="relative px-3 sm:px-4 pb-3 pt-10 sm:pt-12 flex flex-col gap-2">

          {/* Title strip */}
          {(title || episode !== undefined) && (
            <div className="flex items-baseline gap-2 mb-0.5">
              {title && (
                <span className="text-white text-xs sm:text-sm font-bold leading-tight line-clamp-1 drop-shadow">
                  {title}
                </span>
              )}
              {episode !== undefined && (
                <span
                  className="text-[10px] sm:text-xs font-semibold shrink-0 px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: `${accent}33`, color: accent }}
                >
                  EP {episode}
                </span>
              )}
            </div>
          )}

          {/* ── Seek bar ──────────────────────────────────────────── */}
          <div className="relative flex items-center" style={{ height: 20 }}>
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full" style={{ height: 4, backgroundColor: "rgba(255,255,255,0.15)" }} />
            <div className="absolute top-1/2 -translate-y-1/2 left-0 rounded-full pointer-events-none"
              style={{ height: 4, width: `${bufferPct}%`, backgroundColor: "rgba(255,255,255,0.3)" }} />
            <div className="absolute top-1/2 -translate-y-1/2 left-0 rounded-full pointer-events-none"
              style={{ height: 4, width: `${seekPct}%`, backgroundColor: accent }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-lg pointer-events-none z-10"
              style={{ left: `calc(${seekPct}% - 8px)`, backgroundColor: accent }} />
            <input
              type="range" min={0} max={duration || 100} step={0.5} value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
              style={{ margin: 0, height: "100%" }}
            />
          </div>

          {/* ── Mobile: two-row controls / Desktop: single row ───────── */}

          {/* ROW 1 — mobile only: centered play + ±10s seek buttons */}
          <div className="flex sm:hidden items-center justify-center gap-6 py-1">
            {/* Seek back 10s */}
            <button
              onClick={() => { const v = videoRef.current; if (v) v.currentTime = Math.max(0, v.currentTime - 10); }}
              className="text-white flex flex-col items-center gap-0.5"
              aria-label="Seek back 10 seconds"
              style={{ minWidth: 44, minHeight: 44, justifyContent: "center" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
              </svg>
              <span className="text-[9px] font-bold text-white/60 leading-none">10</span>
            </button>

            {/* Play / Pause — large on mobile */}
            <button
              onClick={togglePlay}
              className="text-white flex items-center justify-center rounded-full"
              style={{ width: 52, height: 52, backgroundColor: "rgba(255,255,255,0.15)" }}
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1.5"/>
                  <rect x="14" y="4" width="4" height="16" rx="1.5"/>
                </svg>
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5.14v14l11-7-11-7z"/>
                </svg>
              )}
            </button>

            {/* Seek forward 10s */}
            <button
              onClick={() => { const v = videoRef.current; if (v) v.currentTime = Math.min(v.duration, v.currentTime + 10); }}
              className="text-white flex flex-col items-center gap-0.5"
              aria-label="Seek forward 10 seconds"
              style={{ minWidth: 44, minHeight: 44, justifyContent: "center" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 13c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6v4l5-5-5-5v4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8h-2z"/>
              </svg>
              <span className="text-[9px] font-bold text-white/60 leading-none">10</span>
            </button>
          </div>

          {/* ROW 2 (mobile) / SINGLE ROW (desktop) */}
          <div className="flex items-center gap-2 sm:gap-2.5">

            {/* Play/Pause — desktop only */}
            <button onClick={togglePlay}
              className="hidden sm:flex text-white hover:text-white/75 transition-colors shrink-0 items-center justify-center"
              style={{ minWidth: 36, minHeight: 36 }}
              aria-label={playing ? "Pause" : "Play"}>
              {playing ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1.5"/>
                  <rect x="14" y="4" width="4" height="16" rx="1.5"/>
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5.14v14l11-7-11-7z"/>
                </svg>
              )}
            </button>

            {/* Seek ±10s — desktop only */}
            <button
              onClick={() => { const v = videoRef.current; if (v) v.currentTime = Math.max(0, v.currentTime - 10); }}
              className="hidden sm:flex text-white hover:text-white/75 transition-colors items-center justify-center"
              style={{ minWidth: 32, minHeight: 36 }}
              aria-label="Seek back 10 seconds"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
              </svg>
            </button>
            <button
              onClick={() => { const v = videoRef.current; if (v) v.currentTime = Math.min(v.duration, v.currentTime + 10); }}
              className="hidden sm:flex text-white hover:text-white/75 transition-colors items-center justify-center"
              style={{ minWidth: 32, minHeight: 36 }}
              aria-label="Seek forward 10 seconds"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 13c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6v4l5-5-5-5v4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8h-2z"/>
              </svg>
            </button>

            {/* Volume — desktop only (mobile uses hardware volume) */}
            <div className="hidden sm:flex items-center gap-1 shrink-0">
              <button onClick={toggleMute}
                className="text-white hover:text-white/75 transition-colors flex items-center justify-center"
                style={{ minWidth: 36, minHeight: 36 }}
                aria-label="Toggle mute">
                {muted || volume === 0 ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                  </svg>
                ) : volume < 0.5 ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                )}
              </button>
              <input type="range" min={0} max={1} step={0.05}
                value={muted ? 0 : volume} onChange={handleVolume}
                className="w-16 cursor-pointer" style={{ accentColor: accent }} aria-label="Volume" />
            </div>

            {/* Mute button — mobile only (no slider) */}
            <button onClick={toggleMute}
              className="sm:hidden text-white flex items-center justify-center"
              style={{ minWidth: 40, minHeight: 40 }}
              aria-label="Toggle mute">
              {muted || volume === 0 ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              )}
            </button>

            {/* Time */}
            <span className="text-white/90 text-[10px] sm:text-xs tabular-nums select-none shrink-0">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Subtitle selector */}
            {subtitleTracks.length > 0 && (
              <Dropdown
                label={<IconCC />}
                items={subtitleItems}
                active={activeSubtitle}
                onSelect={handleSubtitleSelect}
                accent={accent}
              />
            )}

            {/* Subtitle settings */}
            {subtitleTracks.length > 0 && (
              <SubtitleSettings
                style={subtitleStyle}
                onChange={setSubtitleStyle}
                accent={accent}
              />
            )}

            {/* Quality selector */}
            {qualityLevels.length > 1 && (
              <Dropdown
                label={
                  <span className="flex items-center gap-1">
                    <IconQuality />
                    <span className="hidden sm:inline text-[10px] font-bold leading-none">
                      {activeQuality === -1 ? "Auto" : qualityLevels.find(q => q.index === activeQuality)?.label ?? ""}
                    </span>
                  </span>
                }
                items={qualityItems}
                active={activeQuality}
                onSelect={handleQualitySelect}
                accent={accent}
              />
            )}

            {/* Fullscreen */}
            <button onClick={toggleFullscreen}
              className="text-white hover:text-white/75 transition-colors shrink-0 flex items-center justify-center"
              style={{ minWidth: 40, minHeight: 40 }}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
              {isFullscreen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Centre play indicator when paused — shown briefly, pointer-events-none */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", border: `2px solid ${accent}` }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill={accent}>
              <path d="M8 5.14v14l11-7-11-7z"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
