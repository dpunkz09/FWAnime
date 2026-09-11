import { NextRequest, NextResponse } from "next/server";

const ANILIST_API = "https://graphql.anilist.co";

// Fetch media status + episode count
const MEDIA_QUERY = `
  query MediaInfo($id: Int) {
    Media(id: $id, type: ANIME) {
      episodes
      status
      nextAiringEpisode { episode }
    }
  }
`;

// Paginated airing schedules
const SCHEDULE_QUERY = `
  query AiredEpisodes($mediaId: Int, $now: Int, $page: Int) {
    Page(page: $page, perPage: 50) {
      pageInfo { hasNextPage }
      airingSchedules(
        mediaId: $mediaId
        airingAt_lesser: $now
        sort: EPISODE
      ) {
        episode
        airingAt
      }
    }
  }
`;

async function post(body: object) {
  const res = await fetch(ANILIST_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    next: { revalidate: 300 },
  });
  return res.json();
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json([], { status: 400 });

  const mediaId = parseInt(id, 10);
  const now = Math.floor(Date.now() / 1000);

  // Get media info first
  const mediaJson = await post({ query: MEDIA_QUERY, variables: { id: mediaId } });
  const media = mediaJson?.data?.Media;
  const totalEpisodes: number | null = media?.episodes ?? null;
  const status: string = media?.status ?? "";
  const nextAiring: number | null = media?.nextAiringEpisode?.episode ?? null;

  // Strategy 1: finished show with known episode count — generate all
  if (status === "FINISHED" && totalEpisodes) {
    const schedules = Array.from({ length: totalEpisodes }, (_, i) => ({
      episode: i + 1,
      airingAt: 0,
    }));
    return NextResponse.json(schedules);
  }

  // Strategy 2: airing show where all episodes have aired
  if (totalEpisodes && nextAiring && nextAiring - 1 >= totalEpisodes) {
    const schedules = Array.from({ length: totalEpisodes }, (_, i) => ({
      episode: i + 1,
      airingAt: 0,
    }));
    return NextResponse.json(schedules);
  }

  // Strategy 3: paginate airing schedules
  const all: { episode: number; airingAt: number }[] = [];
  let page = 1;

  while (true) {
    const json = await post({
      query: SCHEDULE_QUERY,
      variables: { mediaId, now, page },
    });
    const pageData = json?.data?.Page;
    all.push(...(pageData?.airingSchedules ?? []));
    if (!pageData?.pageInfo?.hasNextPage) break;
    page++;
    if (page > 20) break;
  }

  return NextResponse.json(all);
}
