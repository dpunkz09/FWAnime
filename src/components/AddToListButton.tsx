"use client";

import { useState } from "react";
import { Button, Dropdown } from "@heroui/react";
import { BookmarkPlus, Check, ChevronDown } from "lucide-react";
import { useWatchlist, WatchStatus } from "@/hooks/useWatchlist";

const STATUS_LABELS: Record<WatchStatus, string> = {
  watching: "Watching",
  completed: "Completed",
  on_hold: "On Hold",
  dropped: "Dropped",
  plan_to_watch: "Plan to Watch",
};

const STATUS_COLORS: Record<WatchStatus, string> = {
  watching: "#3db4f2",
  completed: "#22c55e",
  on_hold: "#f59e0b",
  dropped: "#ef4444",
  plan_to_watch: "#9ab0cc",
};

interface Props {
  animeId: number;
  malId: number | null;
  title: string;
  coverImage: string;
  accent: string;
  totalEpisodes: number | null;
}

export default function AddToListButton({
  animeId, malId, title, coverImage, accent, totalEpisodes,
}: Props) {
  const { getEntry, addToList, removeFromList, updateStatus } = useWatchlist();
  const entry = getEntry(animeId);

  function handleAdd(status: WatchStatus) {
    addToList({ animeId, malId, title, coverImage, accent, totalEpisodes }, status);
  }

  if (entry) {
    const color = STATUS_COLORS[entry.status];
    return (
      <Dropdown>
        <Button
          fullWidth
          className="font-semibold mb-2 gap-1.5 justify-start border"
          style={{ backgroundColor: `${color}20`, color, borderColor: color }}
        >
          <Check size={14} />
          {STATUS_LABELS[entry.status]}
          <ChevronDown size={12} className="ml-auto" />
        </Button>
        <Dropdown.Popover className="bg-[#111927] border border-[#2b3d52]">
          <Dropdown.Menu
            onAction={(key) => {
              if (key === "remove") removeFromList(animeId);
              else updateStatus(animeId, key as WatchStatus);
            }}
          >
            {(Object.keys(STATUS_LABELS) as WatchStatus[]).map((s) => (
              <Dropdown.Item
                key={s}
                id={s}
                textValue={STATUS_LABELS[s]}
                className="text-[#9ab0cc] data-[focused=true]:bg-[#1e2d3d] data-[focused=true]:text-white text-sm"
              >
                {STATUS_LABELS[s]}
              </Dropdown.Item>
            ))}
            <Dropdown.Item
              key="remove"
              id="remove"
              textValue="Remove from List"
              variant="danger"
              className="text-sm"
            >
              Remove from List
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    );
  }

  return (
    <Dropdown>
      <Button
        fullWidth
        className="font-semibold mb-2 gap-1.5 border"
        style={{ backgroundColor: `${accent}15`, color: accent, borderColor: `${accent}44` }}
      >
        <BookmarkPlus size={14} />
        Add to List
        <ChevronDown size={12} className="ml-auto" />
      </Button>
      <Dropdown.Popover className="bg-[#111927] border border-[#2b3d52]">
        <Dropdown.Menu onAction={(key) => handleAdd(key as WatchStatus)}>
          {(Object.keys(STATUS_LABELS) as WatchStatus[]).map((s) => (
            <Dropdown.Item
              key={s}
              id={s}
              textValue={STATUS_LABELS[s]}
              className="text-[#9ab0cc] data-[focused=true]:bg-[#1e2d3d] data-[focused=true]:text-white text-sm"
            >
              {STATUS_LABELS[s]}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
