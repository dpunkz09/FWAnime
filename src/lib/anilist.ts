const ANILIST_API = "https://graphql.anilist.co";

export async function fetchAniList<T>(
  query: string,
  variables?: Record<string, unknown>,
  retries = 3,
  revalidate = 21600
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(ANILIST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "FWAnime/1.0 (https://github.com/fwanime; contact@fwanime.app)",
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate },
    });

    if (res.status === 429) {
      if (attempt < retries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }
      throw new Error("rate_limited");
    }

    if (!res.ok) {
      // Try to surface a descriptive message from the response body (e.g. outage notices)
      let detail = `AniList API error: ${res.status}`;
      try {
        const errJson = await res.clone().json();
        if (errJson?.errors?.[0]?.message) {
          detail = errJson.errors[0].message;
        }
      } catch {
        // ignore parse failures — use the default message
      }
      throw new Error(detail);
    }

    const json = await res.json();
    if (json.errors) {
      throw new Error(json.errors[0].message);
    }
    return json.data as T;
  }

  throw new Error("AniList API: max retries exceeded");
}

// ---- Queries ----

export const TRENDING_ANIME_QUERY = `
  query TrendingAnime($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
        id
        idMal
        title { romaji english native }
        coverImage { extraLarge large color }
        bannerImage
        genres
        averageScore
        episodes
        status
        season
        seasonYear
        format
        nextAiringEpisode { airingAt episode }
        studios(isMain: true) { nodes { name } }
        description(asHtml: false)
      }
    }
  }
`;

export const POPULAR_SEASON_QUERY = `
  query PopularSeason($season: MediaSeason, $seasonYear: Int, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(sort: POPULARITY_DESC, type: ANIME, season: $season, seasonYear: $seasonYear, isAdult: false) {
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

export const UPCOMING_SEASON_QUERY = `
  query UpcomingSeason($season: MediaSeason, $seasonYear: Int, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(sort: POPULARITY_DESC, type: ANIME, season: $season, seasonYear: $seasonYear, isAdult: false) {
        id
        title { romaji english }
        coverImage { extraLarge large color }
        genres
        averageScore
        episodes
        status
        format
        studios(isMain: true) { nodes { name } }
      }
    }
  }
`;

export const ALL_TIME_POPULAR_QUERY = `
  query AllTimePopular($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
        id
        title { romaji english }
        coverImage { extraLarge large color }
        genres
        averageScore
        episodes
        status
        format
        studios(isMain: true) { nodes { name } }
      }
    }
  }
`;

export const TOP_ANIME_QUERY = `
  query TopAnime($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(sort: SCORE_DESC, type: ANIME, isAdult: false) {
        id
        title { romaji english }
        coverImage { extraLarge large color }
        genres
        averageScore
        episodes
        status
        format
        season
        seasonYear
        studios(isMain: true) { nodes { name } }
      }
    }
  }
`;

// Trending by period — day = trending, week = popularity, month = score
export const TRENDING_BY_PERIOD_QUERY = `
  query TrendingByPeriod($sort: [MediaSort], $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(sort: $sort, type: ANIME, isAdult: false) {
        id
        title { romaji english }
        coverImage { large color }
        averageScore
        episodes
        format
        status
        studios(isMain: true) { nodes { name } }
      }
    }
  }
`;

// Airing schedule — fetch episodes airing within a unix time window
export const AIRING_SCHEDULE_QUERY = `
  query AiringSchedule($from: Int, $to: Int, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      airingSchedules(
        airingAt_greater: $from
        airingAt_lesser: $to
        sort: TIME
      ) {
        id
        airingAt
        episode
        media {
          id
          title { romaji english }
          coverImage { large color }
          format
          averageScore
          episodes
          status
          studios(isMain: true) { nodes { name } }
        }
      }
    }
  }
`;

// Aired episodes for a specific anime (for the watch modal)
export const AIRED_EPISODES_QUERY = `
  query AiredEpisodes($mediaId: Int) {
    AiringSchedule: Page(page: 1, perPage: 50) {
      airingSchedules(
        mediaId: $mediaId
        airingAt_lesser: ${Math.floor(Date.now() / 1000)}
        sort: EPISODE
      ) {
        episode
        airingAt
      }
    }
  }
`;

export interface AiredEpisodesData {
  AiringSchedule: {
    airingSchedules: { episode: number; airingAt: number }[];
  };
}
export const UPCOMING_EPISODES_QUERY = `
  query UpcomingEpisodes($from: Int, $to: Int) {
    Page(page: 1, perPage: 15) {
      airingSchedules(
        airingAt_greater: $from
        airingAt_lesser: $to
        sort: TIME
      ) {
        id
        airingAt
        episode
        media {
          id
          title { romaji english }
          coverImage { large color }
          format
          episodes
        }
      }
    }
  }
`;

export interface UpcomingEpisode {
  id: number;
  airingAt: number;
  episode: number;
  media: {
    id: number;
    title: { romaji: string; english: string | null };
    coverImage: { large: string; color: string | null };
    format: string;
    episodes: number | null;
  };
}

export interface UpcomingEpisodesData {
  Page: { airingSchedules: UpcomingEpisode[] };
}

// Trending characters
export const TRENDING_CHARACTERS_QUERY = `
  query TrendingCharacters($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      characters(sort: FAVOURITES_DESC) {
        id
        name { full }
        image { large medium }
        favourites
        media(perPage: 1, sort: POPULARITY_DESC) {
          nodes {
            id
            title { romaji english }
            coverImage { color }
          }
        }
      }
    }
  }
`;

export interface TrendingCharacter {
  id: number;
  name: { full: string };
  image: { large: string; medium: string };
  favourites: number;
  media: {
    nodes: {
      id: number;
      title: { romaji: string; english: string | null };
      coverImage: { color: string | null };
    }[];
  };
}

export interface TrendingCharactersData {
  Page: { characters: TrendingCharacter[] };
}

export interface AiringEntry {
  id: number;
  airingAt: number;
  episode: number;
  media: {
    id: number;
    title: { romaji: string; english: string | null };
    coverImage: { large: string; color: string | null };
    format: string;
    averageScore: number | null;
    episodes: number | null;
    status: string;
    studios?: { nodes: { name: string }[] };
  };
}

export interface AiringScheduleData {
  Page: {
    airingSchedules: AiringEntry[];
  };
}

export const TOP_MANGA_QUERY = `
  query TopManga($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(sort: SCORE_DESC, type: MANGA, isAdult: false) {
        id
        title { romaji english }
        coverImage { extraLarge large color }
        genres
        averageScore
        chapters
        status
        format
      }
    }
  }
`;

// All available genres
export const GENRE_COLLECTION_QUERY = `
  query GenreCollection {
    GenreCollection
  }
`;

export interface GenreCollectionData {
  GenreCollection: string[];
}

// Fetch top anime per genre — one query, we'll map covers from a large popularity set
export const GENRE_COVER_QUERY = `
  query GenreCovers($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
        id
        genres
        coverImage { extraLarge large color }
        bannerImage
        title { romaji english }
      }
    }
  }
`;

export interface GenreCoverMedia {
  id: number;
  genres: string[];
  coverImage: { extraLarge: string; large: string; color: string | null };
  bannerImage: string | null;
  title: { romaji: string; english: string | null };
}

export interface GenreCoverData {
  Page: { media: GenreCoverMedia[] };
}

// Generic paginated anime list — used by the View All pages
export const ANIME_LIST_QUERY = `
  query AnimeList($sort: [MediaSort], $season: MediaSeason, $seasonYear: Int, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage }
      media(sort: $sort, type: ANIME, season: $season, seasonYear: $seasonYear, isAdult: false) {
        id
        title { romaji english }
        coverImage { extraLarge large color }
        genres
        averageScore
        episodes
        status
        format
        season
        seasonYear
        nextAiringEpisode { airingAt episode }
        studios(isMain: true) { nodes { name } }
      }
    }
  }
`;

export interface AnimeListData {
  Page: {
    pageInfo: {
      total: number;
      currentPage: number;
      lastPage: number;
      hasNextPage: boolean;
    };
    media: Media[];
  };
}

export interface MediaTitle {
  romaji: string;
  english: string | null;
  native?: string;
}

export interface CoverImage {
  extraLarge: string;
  large: string;
  color: string | null;
}

export interface Studio {
  name: string;
}

export interface AiringSchedule {
  airingAt: number;
  episode: number;
}

export interface Media {
  id: number;
  idMal?: number | null;
  title: MediaTitle;
  coverImage: CoverImage;
  bannerImage?: string | null;
  genres: string[];
  averageScore: number | null;
  episodes: number | null;
  chapters?: number | null;
  status: string;
  season?: string | null;
  seasonYear?: number | null;
  format: string;
  nextAiringEpisode?: AiringSchedule | null;
  studios?: { nodes: Studio[] };
  description?: string | null;
}

export interface PageData {
  Page: {
    media: Media[];
  };
}

// ---- Season helpers ----

const SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"] as const;
type Season = (typeof SEASONS)[number];

export function getCurrentSeason(): { season: Season; year: number } {
  const month = new Date().getMonth(); // 0-indexed
  const year = new Date().getFullYear();
  const season: Season =
    month < 3 ? "WINTER" : month < 6 ? "SPRING" : month < 9 ? "SUMMER" : "FALL";
  return { season, year };
}

export function getNextSeason(): { season: Season; year: number } {
  const { season, year } = getCurrentSeason();
  const idx = SEASONS.indexOf(season);
  const nextIdx = (idx + 1) % 4;
  return {
    season: SEASONS[nextIdx],
    year: nextIdx === 0 ? year + 1 : year,
  };
}
