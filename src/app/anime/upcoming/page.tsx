import { fetchAniList, ANIME_LIST_QUERY, AnimeListData, getNextSeason } from "@/lib/anilist";
import AnimeListPage from "@/components/AnimeListPage";

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export const metadata = { title: "Upcoming Next Season — FWAnime" };

const SEASON_LABELS: Record<string, string> = {
  WINTER: "Winter", SPRING: "Spring", SUMMER: "Summer", FALL: "Fall",
};

export default async function UpcomingPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const { season, year } = getNextSeason();

  const data = await fetchAniList<AnimeListData>(ANIME_LIST_QUERY, {
    sort: ["POPULARITY_DESC"],
    season,
    seasonYear: year,
    page,
    perPage: 28,
  });

  return (
    <AnimeListPage
      title="Upcoming Next Season"
      subtitle={`${SEASON_LABELS[season]} ${year}`}
      items={data.Page.media}
      total={data.Page.pageInfo.total}
      currentPage={data.Page.pageInfo.currentPage}
      lastPage={data.Page.pageInfo.lastPage}
      basePath="/anime/upcoming"
    />
  );
}
