"use client";

import { useState } from "react";
import Image from "next/image";
import NextLink from "next/link";
import { Modal, Button, ScrollShadow, Chip, Separator } from "@heroui/react";
import { AiringEntry } from "@/lib/anilist";
import { Calendar, Clock, Tv } from "lucide-react";

interface DaySchedule {
  label: string;   // "Mon"
  date: string;    // "Jul 28"
  dayNum: number;  // 28
  isToday: boolean;
  entries: AiringEntry[];
}

interface Props {
  days: DaySchedule[];
}

// ── Modal content for one day ──────────────────────────────────────────────
function DayModal({ day }: { day: DaySchedule }) {
  return (
    <Modal>
      {/* Trigger: invisible, opened programmatically via Modal.Backdrop isOpen */}
      <Modal.Backdrop variant="blur">
        <Modal.Container size="sm" placement="center" scroll="inside">
          <Modal.Dialog
            className="border border-[var(--color-border)]"
            style={{ backgroundColor: "var(--color-surface)" }}
          >
            <Modal.CloseTrigger />

            <Modal.Header>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0"
                  style={{ backgroundColor: "var(--color-blue)" }}
                >
                  <span className="text-[10px] font-bold text-white/70 uppercase leading-none">
                    {day.label}
                  </span>
                  <span className="text-lg font-black text-white leading-tight">
                    {day.dayNum}
                  </span>
                </div>
                <div>
                  <Modal.Heading
                    className="text-base"
                    style={{ color: "var(--color-heading)" }}
                  >
                    {day.isToday ? "Today's Schedule" : `${day.label} · ${day.date}`}
                  </Modal.Heading>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {day.entries.length} episode{day.entries.length !== 1 ? "s" : ""} airing
                  </p>
                </div>
              </div>
            </Modal.Header>

            <Modal.Body className="p-0">
              {day.entries.length === 0 ? (
                <div
                  className="py-12 text-center text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <Calendar className="mx-auto mb-3 opacity-30" size={36} />
                  No episodes scheduled
                </div>
              ) : (
                <ScrollShadow hideScrollBar className="max-h-[60vh]">
                  <div className="flex flex-col">
                    {day.entries.map((entry, i) => {
                      const title =
                        entry.media.title.english || entry.media.title.romaji;
                      const accent = entry.media.coverImage.color || "#3db4f2";
                      const isPast = entry.airingAt * 1000 < Date.now();
                      const time = new Date(entry.airingAt * 1000).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div key={entry.id}>
                          <NextLink
                            href={`/anime/${entry.media.id}`}
                            className="group flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors no-underline"
                          >
                            {/* Cover */}
                            <div className="relative w-10 h-14 rounded-lg overflow-hidden shrink-0 shadow">
                              <Image
                                src={entry.media.coverImage.large}
                                alt={title}
                                fill
                                className="object-cover"
                                sizes="40px"
                                style={{ opacity: isPast ? 0.5 : 1 }}
                              />
                              {/* accent left bar */}
                              <div
                                className="absolute left-0 top-0 bottom-0 w-[3px]"
                                style={{ backgroundColor: accent }}
                              />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-semibold line-clamp-1 group-hover:text-[var(--color-blue)] transition-colors"
                                style={{
                                  color: isPast
                                    ? "var(--color-text-muted)"
                                    : "var(--color-heading)",
                                }}
                              >
                                {title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span
                                  className="text-[11px] font-bold"
                                  style={{ color: accent, opacity: isPast ? 0.5 : 1 }}
                                >
                                  Ep {entry.episode}
                                </span>
                                {entry.media.episodes && (
                                  <span
                                    className="text-[11px]"
                                    style={{ color: "var(--color-text-muted)" }}
                                  >
                                    / {entry.media.episodes}
                                  </span>
                                )}
                                <span
                                  className="text-[11px]"
                                  style={{ color: "var(--color-text-muted)" }}
                                >
                                  · {entry.media.format?.replace("_", " ")}
                                </span>
                              </div>
                            </div>

                            {/* Time + status */}
                            <div className="shrink-0 flex flex-col items-end gap-1">
                              <span
                                className="text-xs font-bold tabular-nums flex items-center gap-1"
                                style={{
                                  color: isPast
                                    ? "var(--color-text-muted)"
                                    : accent,
                                }}
                              >
                                <Clock size={10} />
                                {time}
                              </span>
                              <Chip
                                size="sm"
                                className="text-[9px] h-4 border-none px-1.5"
                                style={{
                                  backgroundColor: isPast
                                    ? "rgba(255,255,255,0.06)"
                                    : `${accent}25`,
                                  color: isPast
                                    ? "var(--color-text-muted)"
                                    : accent,
                                }}
                              >
                                {isPast ? "Aired" : "Soon"}
                              </Chip>
                            </div>
                          </NextLink>
                          {i < day.entries.length - 1 && (
                            <Separator
                              className="mx-4"
                              style={{ backgroundColor: "var(--color-border)" }}
                            />
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
                className="w-full"
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
    </Modal>
  );
}

// ── Week calendar row ──────────────────────────────────────────────────────
export default function AnimeSchedule({ days }: Props) {
  const [openDay, setOpenDay] = useState<DaySchedule | null>(null);

  return (
    <section className="mb-10">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-base font-bold" style={{ color: "var(--color-heading)" }}>
          Airing Schedule
        </h2>
        <Separator
          className="w-8 hidden sm:block"
          style={{ backgroundColor: "var(--color-border)" }}
        />
      </div>

      {/* Week row — 7 day cells */}
      <div
        className="rounded-xl overflow-hidden grid grid-cols-7"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        {days.map((day, i) => {
          const hasEpisodes = day.entries.length > 0;
          const isLast = i === days.length - 1;

          return (
            <button
              key={day.label}
              onClick={() => setOpenDay(day)}
              className={[
                "flex flex-col items-center justify-between py-3 px-1 transition-colors relative",
                "hover:bg-white/5 active:bg-white/10 cursor-pointer border-0 outline-none",
                !isLast ? "border-r" : "",
              ].join(" ")}
              style={{ borderColor: "var(--color-border)" }}
            >
              {/* Day label */}
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{
                  color: day.isToday
                    ? "var(--color-blue)"
                    : "var(--color-text-muted)",
                }}
              >
                {day.label}
              </span>

              {/* Day number circle */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center my-1.5 font-black text-sm"
                style={
                  day.isToday
                    ? {
                        backgroundColor: "var(--color-blue)",
                        color: "white",
                      }
                    : {
                        backgroundColor: "transparent",
                        color: "var(--color-heading)",
                      }
                }
              >
                {day.dayNum}
              </div>

              {/* Episode count pill */}
              {hasEpisodes ? (
                <div
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: day.isToday
                      ? "var(--color-blue)"
                      : "var(--color-bg)",
                  }}
                >
                  <Tv size={9} style={{ color: day.isToday ? "white" : "var(--color-text-muted)" }} />
                  <span
                    className="text-[9px] font-bold tabular-nums"
                    style={{
                      color: day.isToday ? "white" : "var(--color-text-muted)",
                    }}
                  >
                    {day.entries.length}
                  </span>
                </div>
              ) : (
                <div className="h-[18px]" />
              )}

              {/* Bottom accent line for today */}
              {day.isToday && (
                <div
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                  style={{ backgroundColor: "var(--color-blue)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Hint text */}
      <p
        className="text-[11px] mt-2 text-center"
        style={{ color: "var(--color-text-muted)" }}
      >
        Tap a day to see the episode schedule
      </p>

      {/* Modal — controlled open via isOpen/onOpenChange on Backdrop */}
      {openDay && (
        <Modal.Backdrop
          isOpen={true}
          onOpenChange={(open) => { if (!open) setOpenDay(null); }}
          variant="blur"
        >
          <Modal.Container size="sm" placement="center" scroll="inside">
            <Modal.Dialog
              className="border border-[var(--color-border)]"
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              <Modal.CloseTrigger />

              <Modal.Header>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0"
                    style={{ backgroundColor: "var(--color-blue)" }}
                  >
                    <span className="text-[10px] font-bold text-white/70 uppercase leading-none">
                      {openDay.label}
                    </span>
                    <span className="text-lg font-black text-white leading-tight">
                      {openDay.dayNum}
                    </span>
                  </div>
                  <div>
                    <Modal.Heading
                      className="text-base"
                      style={{ color: "var(--color-heading)" }}
                    >
                      {openDay.isToday
                        ? "Today's Schedule"
                        : `${openDay.label} · ${openDay.date}`}
                    </Modal.Heading>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {openDay.entries.length} episode
                      {openDay.entries.length !== 1 ? "s" : ""} airing
                    </p>
                  </div>
                </div>
              </Modal.Header>

              <Modal.Body className="p-0">
                {openDay.entries.length === 0 ? (
                  <div
                    className="py-12 text-center text-sm"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    <Calendar className="mx-auto mb-3 opacity-30" size={36} />
                    No episodes scheduled
                  </div>
                ) : (
                  <ScrollShadow hideScrollBar className="max-h-[60vh]">
                    <div className="flex flex-col">
                      {openDay.entries.map((entry, i) => {
                        const title =
                          entry.media.title.english || entry.media.title.romaji;
                        const accent = entry.media.coverImage.color || "#3db4f2";
                        const isPast = entry.airingAt * 1000 < Date.now();
                        const time = new Date(
                          entry.airingAt * 1000
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        return (
                          <div key={entry.id}>
                            <NextLink
                              href={`/anime/${entry.media.id}`}
                              onClick={() => setOpenDay(null)}
                              className="group flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors no-underline"
                            >
                              {/* Cover */}
                              <div className="relative w-10 h-14 rounded-lg overflow-hidden shrink-0 shadow">
                                <Image
                                  src={entry.media.coverImage.large}
                                  alt={title}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                  style={{ opacity: isPast ? 0.5 : 1 }}
                                />
                                <div
                                  className="absolute left-0 top-0 bottom-0 w-[3px]"
                                  style={{ backgroundColor: accent }}
                                />
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p
                                  className="text-sm font-semibold line-clamp-1 group-hover:text-[var(--color-blue)] transition-colors"
                                  style={{
                                    color: isPast
                                      ? "var(--color-text-muted)"
                                      : "var(--color-heading)",
                                  }}
                                >
                                  {title}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span
                                    className="text-[11px] font-bold"
                                    style={{
                                      color: accent,
                                      opacity: isPast ? 0.5 : 1,
                                    }}
                                  >
                                    Ep {entry.episode}
                                  </span>
                                  {entry.media.episodes && (
                                    <span
                                      className="text-[11px]"
                                      style={{ color: "var(--color-text-muted)" }}
                                    >
                                      / {entry.media.episodes}
                                    </span>
                                  )}
                                  <span
                                    className="text-[11px]"
                                    style={{ color: "var(--color-text-muted)" }}
                                  >
                                    · {entry.media.format?.replace("_", " ")}
                                  </span>
                                </div>
                              </div>

                              {/* Time + status */}
                              <div className="shrink-0 flex flex-col items-end gap-1">
                                <span
                                  className="text-xs font-bold tabular-nums flex items-center gap-1"
                                  style={{
                                    color: isPast
                                      ? "var(--color-text-muted)"
                                      : accent,
                                  }}
                                >
                                  <Clock size={10} />
                                  {time}
                                </span>
                                <Chip
                                  size="sm"
                                  className="text-[9px] h-4 border-none px-1.5"
                                  style={{
                                    backgroundColor: isPast
                                      ? "rgba(255,255,255,0.06)"
                                      : `${accent}25`,
                                    color: isPast
                                      ? "var(--color-text-muted)"
                                      : accent,
                                  }}
                                >
                                  {isPast ? "Aired" : "Soon"}
                                </Chip>
                              </div>
                            </NextLink>

                            {i < openDay.entries.length - 1 && (
                              <Separator
                                className="mx-4"
                                style={{ backgroundColor: "var(--color-border)" }}
                              />
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
                  className="w-full"
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
      )}
    </section>
  );
}
