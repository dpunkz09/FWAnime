import Image from "next/image";
import NextLink from "next/link";
import { Separator } from "@heroui/react";
import { TrendingCharacter } from "@/lib/anilist";
import { Heart } from "lucide-react";

function TrendingUpIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height={size}
      width={size}
      viewBox="0 -960 960 960"
      fill={color}
      aria-hidden
    >
      <path d="m136-240-56-56 296-298 160 160 208-206H640v-80h240v240h-80v-104L536-320 376-480 136-240Z" />
    </svg>
  );
}

interface Props {
  characters: TrendingCharacter[];
}

function CharacterRow({ char, rank }: { char: TrendingCharacter; rank: number }) {
  const fromAnime = char.media.nodes[0];
  const accent = fromAnime?.coverImage.color || "#3db4f2";

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 group">
      {/* Rank */}
      <span
        className="text-xs font-black w-4 text-center shrink-0 tabular-nums"
        style={{ color: "var(--color-text-muted)", opacity: 0.5 }}
      >
        {rank}
      </span>

      {/* Avatar */}
      <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 shadow-sm ring-2 ring-transparent group-hover:ring-[var(--color-blue)] transition-all">
        <Image
          src={char.image.medium}
          alt={char.name.full}
          fill
          className="object-cover object-top"
          sizes="36px"
        />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <NextLink
          href={`https://anilist.co/character/${char.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="no-underline"
        >
          <p
            className="text-xs font-semibold line-clamp-1 hover:text-[var(--color-blue)] transition-colors"
            style={{ color: "var(--color-heading)" }}
          >
            {char.name.full}
          </p>
        </NextLink>
        {fromAnime && (
          <NextLink
            href={`/anime/${fromAnime.id}`}
            className="no-underline"
          >
            <p
              className="text-[10px] line-clamp-1 hover:text-[var(--color-blue)] transition-colors mt-0.5"
              style={{ color: "var(--color-text-muted)" }}
            >
              {fromAnime.title.english || fromAnime.title.romaji}
            </p>
          </NextLink>
        )}
      </div>

      {/* Favourites */}
      <div
        className="shrink-0 flex items-center gap-1 text-[10px] font-bold"
        style={{ color: accent }}
      >
        <Heart size={9} fill={accent} />
        {char.favourites >= 1000
          ? `${(char.favourites / 1000).toFixed(1)}k`
          : char.favourites.toLocaleString()}
      </div>
    </div>
  );
}

export default function TrendingCharacters({ characters }: Props) {
  if (characters.length === 0) return null;

  return (
    <div
      className="rounded-xl overflow-hidden mb-4"
      style={{ backgroundColor: "var(--color-surface)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <TrendingUpIcon size={16} color="#3db4f2" />
        <h2 className="text-sm font-black" style={{ color: "var(--color-heading)" }}>
          Trending Characters
        </h2>
      </div>

      <Separator style={{ backgroundColor: "var(--color-border)" }} />

      <div className="flex flex-col py-1">
        {characters.slice(0, 10).map((char, i) => (
          <div key={char.id}>
            <CharacterRow char={char} rank={i + 1} />
            {i < 9 && (
              <Separator
                className="mx-3"
                style={{ backgroundColor: "var(--color-border)", opacity: 0.5 }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
