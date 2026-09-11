import Image from "next/image";
import NextLink from "next/link";
import { Chip, Tooltip } from "@heroui/react";
import { Media } from "@/lib/anilist";

interface Props {
  media: Media;
  rank?: number;
}

function formatStatus(status: string, nextAiring?: Media["nextAiringEpisode"]) {
  if (nextAiring) return `Ep ${nextAiring.episode} airing soon`;
  switch (status) {
    case "RELEASING": return "Airing";
    case "FINISHED": return "Finished";
    case "NOT_YET_RELEASED": return "Upcoming";
    case "CANCELLED": return "Cancelled";
    default: return status;
  }
}

function formatFormat(format: string) {
  const map: Record<string, string> = {
    TV: "TV", TV_SHORT: "TV Short", MOVIE: "Movie",
    SPECIAL: "Special", OVA: "OVA", ONA: "ONA", MUSIC: "Music",
  };
  return map[format] ?? format;
}

export default function MediaCard({ media, rank }: Props) {
  const title = media.title.english || media.title.romaji;
  const studio = media.studios?.nodes[0]?.name;
  const accentColor = media.coverImage.color || "#3db4f2";

  return (
    <Tooltip delay={300}>
      <NextLink href={`/anime/${media.id}`} className="group block no-underline">
        {/* Cover */}
        <div
          className="relative overflow-hidden rounded-lg w-full aspect-[3/4]"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          <Image
            src={media.coverImage.large}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 40vw, 160px"
          />

          {/* Rank badge */}
          {rank !== undefined && (
            <div
              className="absolute top-0 left-0 w-9 h-9 flex items-end justify-center pb-1 font-bold text-white text-sm"
              style={{ background: `linear-gradient(135deg, ${accentColor} 0%, transparent 100%)` }}
            >
              #{rank}
            </div>
          )}

          {/* Bottom strip — score + format, always visible */}
          {(media.averageScore || media.format) && (
            <div className="absolute bottom-0 left-0 right-0 px-2 pt-4 pb-2 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-2.5">
              {/* Score */}
              {media.averageScore && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <div
                    className="w-[2px] h-6 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                  <div className="flex flex-col leading-none">
                    <span className="text-sm font-black" style={{ color: accentColor }}>
                      {(media.averageScore / 10).toFixed(1)}
                    </span>
                    <span className="text-[8px] uppercase tracking-widest font-semibold text-white/50 mt-0.5">
                      Score
                    </span>
                  </div>
                </div>
              )}

              {/* Divider */}
              {media.averageScore && media.format && (
                <div className="w-px h-5 bg-white/20 shrink-0" />
              )}

              {/* Format */}
              {media.format && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-[2px] h-6 rounded-full bg-white/30" />
                  <div className="flex flex-col leading-none">
                    <span className="text-sm font-black text-white">
                      {formatFormat(media.format)}
                    </span>
                    <span className="text-[8px] uppercase tracking-widest font-semibold text-white/50 mt-0.5">
                      Type
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Genre hover overlay — sits above the bottom strip */}
          <div className="absolute inset-x-0 bottom-[56px] top-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2">
            <div className="flex flex-wrap gap-1">
              {media.genres.slice(0, 2).map((g) => (
                <Chip
                  key={g}
                  size="sm"
                  className="text-[9px] px-1 h-4 text-white border-none"
                  style={{ backgroundColor: `${accentColor}cc` }}
                >
                  {g}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-2 px-0.5">
          <p
            className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-[var(--color-blue)] transition-colors"
            style={{ color: "var(--color-heading)" }}
          >
            {title}
          </p>
          {studio && (
            <p className="text-xs mt-1 truncate" style={{ color: "var(--color-text-muted)" }}>
              {studio}
            </p>
          )}
        </div>
      </NextLink>

      <Tooltip.Content className="bg-[#111927] border border-[#2b3d52] text-[#c0ccd8] text-xs max-w-[200px]">
        <p className="font-semibold">{title}</p>
        {media.genres.length > 0 && (
          <p className="text-[#516170] mt-0.5">{media.genres.slice(0, 3).join(", ")}</p>
        )}
      </Tooltip.Content>
    </Tooltip>
  );
}
