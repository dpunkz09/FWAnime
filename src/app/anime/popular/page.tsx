import { fetchAniList, ANIME_LIST_QUERY, AnimeListData } from "@/lib/anilist";
import AnimeListPage from "@/components/AnimeListPage";

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export const metadata = { title: "All Time Popular Anime — FWAnime" };

export default async function PopularPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const data = await fetchAniList<AnimeListData>(ANIME_LIST_QUERY, {
    sort: ["POPULARITY_DESC"],
    page,
    perPage: 28,
  });

  return (
    <AnimeListPage
      title="All Time Popular"
      items={data.Page.media}
      total={data.Page.pageInfo.total}
      currentPage={data.Page.pageInfo.currentPage}
      lastPage={data.Page.pageInfo.lastPage}
      basePath="/anime/popular"
    />
  );
}
