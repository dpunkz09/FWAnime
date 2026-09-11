"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import NextLink from "next/link";
import { Button, Chip } from "@heroui/react";
import { ChevronLeft, ChevronRight, Play, Plus, Check } from "lucide-react";
import { Media } from "@/lib/anilist";
import { useWatchlist } from "@/hooks/useWatchlist";

interface Props {
  items: Media[];
}

export default function HeroBanner({ items }: Props) {
  const [current, setCurrent] = useState(0);
  const featured = items.slice(0, 6).filter((m) => m.bannerImage);
  const { getEntry, addToList, removeFromList } = useWatchlist();

  useEffect(() => {
    if (featured.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % featured.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featured.length]);

  if (featured.length === 0) return null;

  const media = featured[current];
  const title = media.title.english || media.title.romaji;

  return (
    <div className="relative w-full h-[450px] md:h-[500px] overflow-hidden">
      {/* Backgrounds */}
      {featured.map((m, i) => (
        <div
          key={m.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <Image
            src={m.bannerImage!}
            alt={m.title.romaji}
            fill
            className="object-cover object-center"
            priority={i === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b1622]/90 via-[#0b1622]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1622] via-transparent to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 h-full max-w-[1300px] mx-auto px-6 flex items-end pb-12">
        <div className="flex items-end gap-6 max-w-xl">
          {/* Cover thumbnail */}
          <div className="hidden sm:block shrink-0 w-[120px] h-[170px] rounded-lg overflow-hidden shadow-2xl">
            <Image
              src={media.coverImage.large}
              alt={title}
              width={120}
              height={170}
              className="object-cover w-full h-full"
            />
          </div>

          <div className="flex-1 min-w-0">
            {/* Genre chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {media.genres.slice(0, 3).map((g) => (
                <Chip
                  key={g}
                  size="sm"
                  className="text-white border-none font-medium"
                  style={{ backgroundColor: "var(--color-blue)" }}
                >
                  {g}
                </Chip>
              ))}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-2 line-clamp-2">
              {title}
            </h1>

            {/* Score — vertical bar style */}
            {media.averageScore && (
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-[3px] h-8 rounded-full shrink-0"
                  style={{ backgroundColor: "var(--color-blue)" }}
                />
                <div className="flex flex-col leading-none">
                  <span className="text-lg font-black text-white">
                    {(media.averageScore / 10).toFixed(1)}
                    <span className="text-sm font-normal text-white/50 ml-1">/10</span>
                  </span>
                  <span className="text-[9px] uppercase tracking-widest font-semibold text-white/40 mt-0.5">
                    Average Score
                  </span>
                </div>
              </div>
            )}

            {media.description && (
              <p className="text-sm text-[#aabdd0] line-clamp-3 mb-4 leading-relaxed">
                {media.description.replace(/<[^>]*>/g, "")}
              </p>
            )}

            <div className="flex items-center gap-3">
              <NextLink href={`/anime/${media.id}`} className="no-underline">
                <Button
                  size="sm"
                  className="font-semibold gap-1.5"
                  style={{ backgroundColor: "var(--color-blue)", color: "white" }}
                >
                  <Play size={13} fill="white" />
                  Details
                </Button>
              </NextLink>
              {(() => {
                const entry = getEntry(media.id);
                return entry ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-medium gap-1.5 border-none"
                    style={{ backgroundColor: `${media.coverImage.color || "#3db4f2"}25`, color: media.coverImage.color || "#3db4f2" }}
                    onPress={() => removeFromList(media.id)}
                  >
                    <Check size={13} />
                    In My List
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-medium gap-1.5 text-white bg-white/10 hover:bg-white/20 border-none"
                    onPress={() =>
                      addToList(
                        {
                          animeId: media.id,
                          malId: media.idMal ?? null,
                          title: media.title.english || media.title.romaji,
                          coverImage: media.coverImage.large,
                          accent: media.coverImage.color || "#3db4f2",
                          totalEpisodes: media.episodes ?? null,
                        },
                        "plan_to_watch"
                      )
                    }
                  >
                    <Plus size={13} />
                    Add to List
                  </Button>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="absolute bottom-4 right-6 z-10 flex items-center gap-2">
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          className="w-7 h-7 bg-black/40 hover:bg-black/60 text-white border-none rounded-full"
          onPress={() => setCurrent((c) => (c - 1 + featured.length) % featured.length)}
          aria-label="Previous"
        >
          <ChevronLeft size={15} />
        </Button>

        {featured.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="w-2 h-2 rounded-full transition-all cursor-pointer border-0 p-0"
            style={{
              backgroundColor:
                i === current ? "var(--color-blue)" : "rgba(255,255,255,0.4)",
              transform: i === current ? "scale(1.3)" : "scale(1)",
            }}
          />
        ))}

        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          className="w-7 h-7 bg-black/40 hover:bg-black/60 text-white border-none rounded-full"
          onPress={() => setCurrent((c) => (c + 1) % featured.length)}
          aria-label="Next"
        >
          <ChevronRight size={15} />
        </Button>
      </div>
    </div>
  );
}
