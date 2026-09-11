"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal, Button, ScrollShadow, Spinner } from "@heroui/react";
import { Play, RotateCcw } from "lucide-react";

interface Episode {
  episode: number;
  airingAt: number;
}

interface SavedProgress {
  episode: number;
  type: "sub" | "dub";
  playback_time: number;
  duration: number;
}

interface Props {
  animeId: number;
  malId: number | null;
  title: string;
  accent: string;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function WatchModal({ animeId, malId, title, accent }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"sub" | "dub">("sub");
  const [savedEntry, setSavedEntry] = useState<SavedProgress | null>(null);
  const router = useRouter();

  // Fetch saved progress from API when modal opens
  useEffect(() => {
    if (!isOpen) return;
    fetch(`/api/progress?animeId=${animeId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((row) => {
        if (row) {
          setSavedEntry(row);
          setType(row.type ?? "sub");
        }
      })
      .catch(() => {});
  }, [isOpen, animeId]);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch(`/api/aired-episodes?id=${animeId}`)
      .then((r) => r.json())
      .then((data: Episode[]) => setEpisodes(data))
      .catch(() => setEpisodes([]))
      .finally(() => setLoading(false));
  }, [isOpen, animeId]);

  function watchEpisode(ep: number) {
    setIsOpen(false);
    router.push(
      `/watch/${animeId}?ep=${ep}&type=${type}${malId ? `&mal=${malId}` : ""}`
    );
  }

  // Resume from last saved position
  function resume() {
    if (!savedEntry) return;
    setIsOpen(false);
    router.push(
      `/watch/${animeId}?ep=${savedEntry.episode}&type=${savedEntry.type}${malId ? `&mal=${malId}` : ""}`
    );
  }

  const hasResume =
    savedEntry &&
    savedEntry.playback_time > 10 &&
    savedEntry.duration > 0 &&
    savedEntry.playback_time < savedEntry.duration - 30;

  const resumePct =
    hasResume
      ? Math.min(100, Math.round((savedEntry!.playback_time / savedEntry!.duration) * 100))
      : 0;

  return (
    <>
      {/* Trigger — vertical bar style matching Average Score / Format */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 cursor-pointer border-0 bg-transparent p-0 group"
      >
        <div
          className="w-[3px] h-10 rounded-full transition-opacity group-hover:opacity-70"
          style={{ backgroundColor: accent }}
        />
        <div className="flex flex-col leading-none">
          <span
            className="flex items-center gap-1.5 text-3xl font-black tracking-tight"
            style={{ color: accent }}
          >
            <Play size={20} fill={accent} />
            Watch
          </span>
          <span
            className="text-[11px] uppercase tracking-widest font-semibold mt-0.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            {hasResume ? `Resume Ep ${savedEntry!.episode}` : "Play Now"}
          </span>
        </div>
      </button>

      {/* Episode picker modal */}
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        variant="blur"
      >
        <Modal.Container size="md" placement="center" scroll="inside">
          <Modal.Dialog
            className="border border-[var(--color-border)]"
            style={{ backgroundColor: "var(--color-surface)" }}
          >
            <Modal.CloseTrigger />

            <Modal.Header>
              <Modal.Heading
                className="text-base font-black line-clamp-1"
                style={{ color: "var(--color-heading)" }}
              >
                {title}
              </Modal.Heading>

              {/* Sub / Dub toggle */}
              <div className="flex items-center gap-2 mt-2">
                {(["sub", "dub"] as const).map((t) => (
                  <Button
                    key={t}
                    size="sm"
                    variant={type === t ? "primary" : "ghost"}
                    className="uppercase text-xs font-bold px-4 h-7"
                    style={
                      type === t
                        ? { backgroundColor: accent, color: "white" }
                        : { color: "var(--color-text-muted)" }
                    }
                    onPress={() => setType(t)}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </Modal.Header>

            <Modal.Body className="p-0">
              {/* Resume banner */}
              {hasResume && (
                <div
                  className="mx-4 mt-4 rounded-xl overflow-hidden border"
                  style={{ borderColor: `${accent}40`, backgroundColor: `${accent}12` }}
                >
                  <button
                    onClick={resume}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer border-0 bg-transparent group"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: accent }}
                    >
                      <RotateCcw size={15} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold" style={{ color: "var(--color-heading)" }}>
                        Resume Episode {savedEntry!.episode}
                        <span className="font-normal ml-1.5" style={{ color: "var(--color-text-muted)" }}>
                          ({savedEntry!.type.toUpperCase()})
                        </span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {/* Progress bar */}
                        <div
                          className="flex-1 rounded-full overflow-hidden"
                          style={{ height: 3, backgroundColor: "rgba(255,255,255,0.15)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${resumePct}%`, backgroundColor: accent }}
                          />
                        </div>
                        <span className="text-[10px] shrink-0" style={{ color: "var(--color-text-muted)" }}>
                          {formatTime(savedEntry!.playback_time)} / {formatTime(savedEntry!.duration)}
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="md" style={{ color: accent }} />
                </div>
              ) : episodes.length === 0 ? (
                <div
                  className="py-12 text-center text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  No aired episodes found
                </div>
              ) : (
                <ScrollShadow hideScrollBar className="max-h-[65vh]">
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
                      {episodes.length} episodes · scroll to see all
                    </p>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5 px-4 pb-4">
                    {episodes.map((ep) => {
                      const isSaved =
                        savedEntry?.episode === ep.episode;
                      const isFinished =
                        isSaved &&
                        savedEntry!.duration > 0 &&
                        savedEntry!.playback_time >= savedEntry!.duration - 30;
                      return (
                        <div key={ep.episode} className="relative">
                          <Button
                            size="sm"
                            className="w-full h-9 font-bold text-xs rounded-lg border transition-all hover:scale-105"
                            style={{
                              borderColor: isSaved ? accent : "var(--color-border)",
                              color: isSaved ? "white" : "var(--color-heading)",
                              backgroundColor: isSaved ? accent : "var(--color-bg)",
                            }}
                            onPress={() => watchEpisode(ep.episode)}
                          >
                            {ep.episode}
                          </Button>
                          {/* Small progress pip for the in-progress episode */}
                          {isSaved && !isFinished && savedEntry!.duration > 0 && (
                            <div
                              className="absolute bottom-0 left-0 rounded-b-lg overflow-hidden"
                              style={{ height: 3, width: `${Math.min(100, Math.round((savedEntry!.playback_time / savedEntry!.duration) * 100))}%` }}
                            >
                              <div className="h-full bg-white/70 rounded-full" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollShadow>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button
                slot="close"
                variant="secondary"
                size="sm"
                fullWidth
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                }}
              >
                Close
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
