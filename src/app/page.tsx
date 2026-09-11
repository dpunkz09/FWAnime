import {
  fetchAniList,
  TRENDING_ANIME_QUERY,
  POPULAR_SEASON_QUERY,
  UPCOMING_SEASON_QUERY,
  ALL_TIME_POPULAR_QUERY,
  TRENDING_BY_PERIOD_QUERY,
  AIRING_SCHEDULE_QUERY,
  UPCOMING_EPISODES_QUERY,
  TRENDING_CHARACTERS_QUERY,
  GENRE_COLLECTION_QUERY,
  getCurrentSeason,
  getNextSeason,
  PageData,
  AiringScheduleData,
  AiringEntry,
  UpcomingEpisodesData,
  TrendingCharactersData,
  GenreCollectionData,
} from "@/lib/anilist";
import HeroBanner from "@/components/HeroBanner";
import MediaSection from "@/components/MediaSection";
import Top10Section from "@/components/Top10Section";
import AnimeSchedule from "@/components/AnimeSchedule";
import GenreStrip from "@/components/GenreStrip";
import CTABanner from "@/components/CTABanner";
import ContinueWatching from "@/components/ContinueWatching";
import EpisodeCountdown from "@/components/EpisodeCountdown";
import TrendingCharacters from "@/components/TrendingCharacters";

const SEASON_LABELS: Record<string, string> = {
  WINTER: "Winter",
  SPRING: "Spring",
  SUMMER: "Summer",
  FALL: "Fall",
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Build the 7-day schedule windows starting from today
function buildScheduleDays(allEntries: AiringEntry[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(todayStart);
    dayStart.setDate(todayStart.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    const fromTs = Math.floor(dayStart.getTime() / 1000);
    const toTs = Math.floor(dayEnd.getTime() / 1000);

    const entries = allEntries.filter(
      (e) => e.airingAt >= fromTs && e.airingAt < toTs
    );

    const label = DAY_LABELS[dayStart.getDay()];
    const date = `${MONTH_LABELS[dayStart.getMonth()]} ${dayStart.getDate()}`;
    const dayNum = dayStart.getDate();

    return { label, date, dayNum, isToday: i === 0, entries };
  });
}

export default async function HomePage() {
  const { season, year } = getCurrentSeason();
  const { season: nextSeason, year: nextYear } = getNextSeason();

  // Fetch airing schedule: next 8 days window to cover full 7-day view
  const now = Math.floor(Date.now() / 1000);
  const todayMidnight = now - (now % 86400); // UTC midnight — close enough
  const weekEnd = todayMidnight + 8 * 86400;

  // Batch 1 — primary content (most important, above the fold)
  const [
    trendingData,
    popularSeasonData,
    upcomingSeasonData,
    allTimePopularData,
    genreData,
  ] = await Promise.all([
    fetchAniList<PageData>(TRENDING_ANIME_QUERY, { page: 1, perPage: 20 }),
    fetchAniList<PageData>(POPULAR_SEASON_QUERY, {
      season, seasonYear: year, page: 1, perPage: 10,
    }),
    fetchAniList<PageData>(UPCOMING_SEASON_QUERY, {
      season: nextSeason, seasonYear: nextYear, page: 1, perPage: 10,
    }),
    fetchAniList<PageData>(ALL_TIME_POPULAR_QUERY, { page: 1, perPage: 10 }),
    fetchAniList<GenreCollectionData>(GENRE_COLLECTION_QUERY),
  ]);

  // Batch 2 — sidebar + schedule (secondary content)
  const [
    topDayData,
    topWeekData,
    topMonthData,
    scheduleData,
    upcomingEpisodesData,
    trendingCharactersData,
  ] = await Promise.all([
    fetchAniList<PageData>(TRENDING_BY_PERIOD_QUERY, {
      sort: ["TRENDING_DESC"], page: 1, perPage: 10,
    }),
    fetchAniList<PageData>(TRENDING_BY_PERIOD_QUERY, {
      sort: ["POPULARITY_DESC"], page: 1, perPage: 10,
    }),
    fetchAniList<PageData>(TRENDING_BY_PERIOD_QUERY, {
      sort: ["SCORE_DESC"], page: 1, perPage: 10,
    }),
    fetchAniList<AiringScheduleData>(AIRING_SCHEDULE_QUERY, {
      from: todayMidnight,
      to: weekEnd,
      page: 1,
      perPage: 50,
    }),
    fetchAniList<UpcomingEpisodesData>(UPCOMING_EPISODES_QUERY, {
      from: now,
      to: now + 48 * 3600,
    }),
    fetchAniList<TrendingCharactersData>(TRENDING_CHARACTERS_QUERY, {
      page: 1,
      perPage: 10,
    }),
  ]);

  const trending = trendingData.Page.media;
  const popularSeason = popularSeasonData.Page.media;
  const upcomingSeason = upcomingSeasonData.Page.media;
  const allTimePopular = allTimePopularData.Page.media;
  const scheduleDays = buildScheduleDays(scheduleData.Page.airingSchedules);

  return (
    <>
      {/* Hero Banner */}
      <HeroBanner items={trending} />

      {/* Two-column layout */}
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-8 items-start">

          {/* ── Main feed ── */}
          <div className="flex-1 min-w-0">
            {/* Continue Watching — client, reads localStorage */}
            <ContinueWatching />

            <MediaSection
              title="Trending Now"
              items={trending}
              viewAllHref="/anime/trending"
            />

            {/* Genre strip */}
            <GenreStrip genres={genreData.GenreCollection} />

            <MediaSection
              title="Popular This Season"
              subtitle={`${SEASON_LABELS[season]} ${year}`}
              items={popularSeason}
              viewAllHref="/anime/seasonal"
            />

            {/* CTA banner */}
            <CTABanner />

            <MediaSection
              title="Upcoming Next Season"
              subtitle={`${SEASON_LABELS[nextSeason]} ${nextYear}`}
              items={upcomingSeason}
              viewAllHref="/anime/upcoming"
            />

            <MediaSection
              title="All Time Popular"
              items={allTimePopular}
              viewAllHref="/anime/popular"
            />

            {/* Airing Schedule */}
            <AnimeSchedule days={scheduleDays} />
          </div>

          {/* ── Right sidebar ── */}
          <div className="hidden lg:block shrink-0 w-[280px]">
            <EpisodeCountdown
              episodes={upcomingEpisodesData.Page.airingSchedules}
            />
            <TrendingCharacters
              characters={trendingCharactersData.Page.characters}
            />
            <Top10Section
              day={topDayData.Page.media}
              week={topWeekData.Page.media}
              month={topMonthData.Page.media}
            />
          </div>

        </div>
      </div>
    </>
  );
}
