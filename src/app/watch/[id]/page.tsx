import { notFound } from "next/navigation";
import { fetchAniList } from "@/lib/anilist";
import WatchClient from "./WatchClient";

const ANIME_WATCH_QUERY = `
  query AnimeWatch($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      idMal
      title { romaji english }
      coverImage { large extraLarge color }
      bannerImage
      episodes
      status
      nextAiringEpisode { episode }
      relations {
        edges {
          relationType(version: 2)
          node {
            id
            title { romaji english }
            coverImage { large color }
            format
            averageScore
            type
          }
        }
      }
    }
  }
`;

interface RelatedMedia {
  id: number;
  title: { romaji: string; english: string | null };
  coverImage: { large: string; color: string | null };
  format: string | null;
  averageScore: number | null;
  relationType: string;
  type: string;
}

interface AnimeWatchData {
  Media: {
    id: number;
    idMal: number | null;
    title: { romaji: string; english: string | null };
    coverImage: { large: string; extraLarge: string; color: string | null };
    bannerImage: string | null;
    episodes: number | null;
    status: string;
    nextAiringEpisode: { episode: number } | null;
    relations: {
      edges: {
        relationType: string;
        node: {
          id: number;
          title: { romaji: string; english: string | null };
          coverImage: { large: string; color: string | null };
          format: string | null;
          averageScore: number | null;
          type: string;
        };
      }[];
    };
  };
}

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ep?: string; type?: string; mal?: string }>;
}

export default async function WatchPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const animeId = parseInt(id, 10);
  const episode = parseInt(sp.ep ?? "1", 10) || 1;
  const type = sp.type === "dub" ? "dub" : "sub";

  if (isNaN(animeId)) notFound();

  let anime: AnimeWatchData["Media"];
  try {
    const data = await fetchAniList<AnimeWatchData>(ANIME_WATCH_QUERY, { id: animeId }, 3, 43200);
    anime = data.Media;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "rate_limited") {
      throw new Error("AniList API rate limited. Please try again in a moment.");
    }
    notFound();
  }

  const malId = sp.mal ? parseInt(sp.mal, 10) : anime.idMal;

  // Build episode list:
  // - For FINISHED shows: use media.episodes count to generate all ep numbers
  // - For RELEASING shows: use airingSchedules (only aired so far)
  // - Fallback: try airingSchedules pagination anyway
  const now = Math.floor(Date.now() / 1000);
  let airedEpisodes: { episode: number; airingAt: number }[] = [];

  if (anime.status === "FINISHED" && anime.episodes) {
    // Generate all episodes — no airing schedule gaps for finished shows
    airedEpisodes = Array.from({ length: anime.episodes }, (_, i) => ({
      episode: i + 1,
      airingAt: 0,
    }));
  } else {
    // Currently airing or unknown — fetch actual airing schedule
    const upToEp = anime.nextAiringEpisode ? anime.nextAiringEpisode.episode - 1 : (anime.episodes ?? 0);

    if (anime.episodes && upToEp >= anime.episodes) {
      // All episodes have aired — generate from count
      airedEpisodes = Array.from({ length: anime.episodes }, (_, i) => ({
        episode: i + 1,
        airingAt: 0,
      }));
    } else {
      // Paginate through airing schedules
      let epPage = 1;
      while (true) {
        const epRes = await fetch("https://graphql.anilist.co", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `query($page:Int){Page(page:$page,perPage:50){pageInfo{hasNextPage}airingSchedules(mediaId:${animeId},airingAt_lesser:${now},sort:EPISODE){episode airingAt}}}`,
            variables: { page: epPage },
          }),
          next: { revalidate: 300 },
        });
        const epJson = await epRes.json();
        const pageData = epJson?.data?.Page;
        airedEpisodes.push(...(pageData?.airingSchedules ?? []));
        if (!pageData?.pageInfo?.hasNextPage) break;
        epPage++;
        if (epPage > 20) break;
      }
    }
  }

  // Only include ANIME type relations, sorted: SEQUEL first, then others
  const related: RelatedMedia[] = anime.relations.edges
    .filter((e) => e.node.type === "ANIME")
    .map((e) => ({ ...e.node, relationType: e.relationType }))
    .sort((a, b) => {
      const order = ["SEQUEL", "PREQUEL", "SIDE_STORY", "ALTERNATIVE", "SPIN_OFF", "OTHER"];
      return order.indexOf(a.relationType) - order.indexOf(b.relationType);
    });

  const title = anime.title.english || anime.title.romaji;
  const accent = anime.coverImage.color || "#3db4f2";

  return (
    <WatchClient
      animeId={animeId}
      malId={malId}
      title={title}
      coverImage={anime.coverImage.large}
      bannerImage={anime.bannerImage}
      accent={accent}
      initialEpisode={episode}
      initialType={type as "sub" | "dub"}
      airedEpisodes={airedEpisodes}
      related={related}
    />
  );
}
