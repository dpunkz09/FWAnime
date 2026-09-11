"use client";

import Image from "next/image";
import NextLink from "next/link";
import { Tabs } from "@heroui/react";
import { Media } from "@/lib/anilist";

interface Props {
  day: Media[];
  week: Media[];
  month: Media[];
}

function RankRow({ media, rank }: { media: Media; rank: number }) {
  const title = media.title.english || media.title.romaji;
  const accent = media.coverImage.color || "#3db4f2";
  const isTop3 = rank <= 3;

  return (
    <NextLink
      href={`/anime/${media.id}`}
      className="group flex items-center gap-0 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors no-underline"
    >
      {/* Digital watch rank number — fixed width, right-aligned toward the cover */}
      <div
        className="shrink-0 flex items-center justify-end select-none pr-5"
        style={{ width: 44 }}
      >
        {/* Ghost unlit segments */}
        <span
          aria-hidden="true"
          style={{
            fontFamily: "var(--font-dseg7), monospace",
            fontSize: 26,
            lineHeight: 1,
            color: isTop3 ? accent : "var(--color-text-muted)",
            opacity: 0.12,
            letterSpacing: "0.05em",
            position: "absolute",
            userSelect: "none",
          }}
        >
          {rank}
        </span>
        {/* Lit segments */}
        <span
          style={{
            fontFamily: "var(--font-dseg7), monospace",
            fontSize: 26,
            lineHeight: 1,
            color: isTop3 ? accent : "var(--color-text-muted)",
            opacity: isTop3 ? 1 : 0.35,
            letterSpacing: "0.05em",
            position: "relative",
            userSelect: "none",
          }}
        >
          {rank}
        </span>
      </div>

      {/* Cover thumbnail — slightly overlapping the number */}
      <div
        className="relative rounded-md overflow-hidden shrink-0 shadow-md -ml-1"
        style={{ width: 45, height: 63 }}
      >
        <Image
          src={media.coverImage.large}
          alt={title}
          fill
          className="object-cover"
          sizes="45px"
        />
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{ backgroundColor: accent }}
        />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1 ml-3">
        <p
          className="text-sm font-semibold leading-snug line-clamp-2 mb-1.5 group-hover:text-[var(--color-blue)] transition-colors"
          style={{ color: "var(--color-heading)" }}
        >
          {title}
        </p>

        <div className="flex items-center gap-1.5 flex-wrap">
          {media.averageScore && (
            <div className="flex items-center gap-1">
              <div
                className="w-[2px] h-4 rounded-full shrink-0"
                style={{ backgroundColor: accent }}
              />
              <span className="text-[11px] font-black" style={{ color: accent }}>
                {(media.averageScore / 10).toFixed(1)}
              </span>
            </div>
          )}
          {media.episodes && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white bg-[#44475a]">
              {media.episodes} ep
            </span>
          )}
          <span className="text-[10px] font-medium" style={{ color: "var(--color-text-muted)" }}>
            · {media.format?.replace("_", " ")}
          </span>
        </div>
      </div>
    </NextLink>
  );
}

export default function Top10Section({ day, week, month }: Props) {
  const tabs = [
    { id: "day", label: "Day", items: day },
    { id: "week", label: "Week", items: week },
    { id: "month", label: "Month", items: month },
  ];

  return (
    <aside
      className="rounded-xl overflow-hidden w-full"
      style={{ backgroundColor: "var(--color-surface)" }}
    >
      <Tabs defaultSelectedKey="day" className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-1">
          <h2 className="text-lg font-black shrink-0" style={{ color: "var(--color-heading)" }}>
            Top Anime
          </h2>

          <Tabs.ListContainer className="bg-transparent p-0 shrink-0">
            <Tabs.List
              aria-label="Top anime period"
              className={[
                "rounded-lg p-0.5 gap-0 h-8",
                "bg-[#0d151f] border border-[#2b3d52]",
                "**:data-[slot=tabs-tab]:rounded-[6px]",
                "**:data-[slot=tabs-tab]:text-xs",
                "**:data-[slot=tabs-tab]:font-semibold",
                "**:data-[slot=tabs-tab]:px-2.5",
                "**:data-[slot=tabs-tab]:h-full",
                "**:data-[slot=tabs-tab]:text-[#516170]",
                "**:data-[slot=tabs-tab]:opacity-100",
                "**:data-[slot=tabs-tab]:data-[selected=true]:text-white",
                "**:data-[slot=tabs-indicator]:rounded-[5px]",
                "**:data-[slot=tabs-indicator]:bg-[var(--color-blue)]",
              ].join(" ")}
            >
              {tabs.map((tab) => (
                <Tabs.Tab key={tab.id} id={tab.id}>
                  {tab.label}
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
        </div>

        {/* Panels */}
        {tabs.map((tab) => (
          <Tabs.Panel key={tab.id} id={tab.id} className="py-2 outline-none">
            <div className="flex flex-col">
              {tab.items.slice(0, 10).map((media, i) => (
                <RankRow key={media.id} media={media} rank={i + 1} />
              ))}
            </div>
          </Tabs.Panel>
        ))}
      </Tabs>
    </aside>
  );
}
