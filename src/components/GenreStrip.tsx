import NextLink from "next/link";
import ScrollRow from "./ScrollRow";

interface Props {
  genres: string[];
}

export default function GenreStrip({ genres }: Props) {
  return (
    <section
      className="relative mb-10 rounded-2xl overflow-hidden px-5 pt-5 pb-6"
      style={{ backgroundColor: "var(--color-surface)" }}
    >
      <h2
        className="text-base font-bold mb-4"
        style={{ color: "var(--color-heading)" }}
      >
        Browse by Genre
      </h2>

      <ScrollRow gradientColor="rgba(21,31,46,0.9)" gap="gap-2">
        {genres.map((genre) => (
          <NextLink
            key={genre}
            href={`/search?genre=${encodeURIComponent(genre)}`}
            className="no-underline shrink-0 group"
          >
            <span
              className="block px-4 py-1.5 rounded-lg text-sm font-semibold
                         whitespace-nowrap select-none cursor-pointer
                         transition-all duration-150
                         group-hover:bg-[var(--color-blue)] group-hover:text-white group-hover:border-[var(--color-blue)]"
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                color: "var(--color-heading)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              {genre}
            </span>
          </NextLink>
        ))}
      </ScrollRow>
    </section>
  );
}
