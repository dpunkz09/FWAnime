export const dynamic = "force-dynamic";

import { fetchAniList, Media } from "@/lib/anilist";
import MediaCard from "@/components/MediaCard";
import { Chip } from "@heroui/react";
import { Search } from "lucide-react";
import SearchForm from "./SearchForm";

const SEARCH_QUERY = `
  query SearchMedia($search: String, $genre: String, $tag: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage hasNextPage }
      media(search: $search, type: ANIME, genre: $genre, tag: $tag, isAdult: false, sort: POPULARITY_DESC) {
        id
        title { romaji english }
        coverImage { extraLarge large color }
        genres
        averageScore
        episodes
        status
        format
        nextAiringEpisode { airingAt episode }
        studios(isMain: true) { nodes { name } }
      }
    }
  }
`;

interface SearchData {
  Page: {
    pageInfo: { total: number; currentPage: number; hasNextPage: boolean };
    media: Media[];
  };
}

interface Props {
  searchParams: Promise<{ q?: string; genre?: string; tag?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q || "";
  const genre = params.genre || undefined;
  const tag = params.tag || undefined;

  let results: Media[] = [];
  let total = 0;

  if (query || genre || tag) {
    const data = await fetchAniList<SearchData>(SEARCH_QUERY, {
      search: query || undefined,
      genre,
      tag,
      page: 1,
      perPage: 40,
    });
    results = data.Page.media;
    total = data.Page.pageInfo.total;
  }

  const activeFilter = genre || tag;

  return (
    <div className="max-w-[1300px] mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-black mb-6" style={{ color: "var(--color-heading)" }}>
        {tag ? `Tag: ${tag}` : genre ? `Genre: ${genre}` : "Search"}
      </h1>

      <div className="mb-6">
        <SearchForm defaultValue={query} />
      </div>

      {/* Active filter pill */}
      {activeFilter && (
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {tag ? "Tag:" : "Genre:"}
          </span>
          <Chip size="sm" className="text-white border-none font-medium" style={{ backgroundColor: "var(--color-blue)" }}>
            {activeFilter}
          </Chip>
          <a href="/search" className="text-xs transition-colors hover:text-[var(--color-blue)] inline-flex items-center" style={{ color: "var(--color-text-muted)" }}>
            Clear
          </a>
        </div>
      )}

      {results.length > 0 ? (
        <>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
            {total.toLocaleString()} results{query ? ` for "${query}"` : ""}
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
            {results.map((media) => (
              <MediaCard key={media.id} media={media} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-24 flex flex-col items-center gap-3" style={{ color: "var(--color-text-muted)" }}>
          <Search size={48} className="opacity-20" />
          <p className="text-lg font-semibold">
            {query || activeFilter ? "No results found" : "Start searching"}
          </p>
          <p className="text-sm">
            {query || activeFilter ? "Try a different search term" : "Enter an anime title, character, or genre"}
          </p>
        </div>
      )}
    </div>
  );
}
