import Image from "next/image";
import NextLink from "next/link";
import { fetchAniList } from "@/lib/anilist";
import { notFound } from "next/navigation";
import { Button, Chip, Card, Separator, Avatar } from "@heroui/react";
import { Heart, BookmarkPlus } from "lucide-react";
import WatchModal from "@/components/WatchModal";
import AiringCountdown from "@/components/AiringCountdown";
import AniListText from "@/components/AniListText";
import AddToListButton from "@/components/AddToListButton";

const MEDIA_DETAIL_QUERY = `
  query MediaDetail($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      idMal
      title { romaji english native }
      coverImage { extraLarge large color }
      bannerImage
      description(asHtml: false)
      genres
      averageScore
      meanScore
      popularity
      favourites
      episodes
      duration
      status
      season
      seasonYear
      format
      source
      startDate { year month day }
      endDate { year month day }
      studios { nodes { id name isAnimationStudio } }
      staff(perPage: 6) {
        edges {
          role
          node { id name { full } image { medium } }
        }
      }
      characters(perPage: 6, sort: [ROLE, RELEVANCE, ID]) {
        edges {
          role
          node { id name { full } image { medium } }
          voiceActors(language: JAPANESE) {
            id name { full } image { medium }
          }
        }
      }
      recommendations(perPage: 6, sort: RATING_DESC) {
        nodes {
          mediaRecommendation {
            id title { romaji english }
            coverImage { large color }
            averageScore format
          }
        }
      }
      relations {
        edges {
          relationType(version: 2)
          node {
            id type format
            title { romaji english }
            coverImage { large color }
            averageScore
          }
        }
      }
      tags { name rank isMediaSpoiler }
      externalLinks { url site icon color }
      trailer { id site }
      nextAiringEpisode { airingAt episode }
    }
  }
`;

interface DetailData {
  Media: {
    id: number;
    idMal: number | null;
    title: { romaji: string; english: string | null; native: string };
    coverImage: { extraLarge: string; large: string; color: string | null };
    bannerImage: string | null;
    description: string | null;
    genres: string[];
    averageScore: number | null;
    meanScore: number | null;
    popularity: number;
    favourites: number;
    episodes: number | null;
    duration: number | null;
    status: string;
    season: string | null;
    seasonYear: number | null;
    format: string;
    source: string | null;
    startDate: { year: number | null; month: number | null; day: number | null };
    endDate: { year: number | null; month: number | null; day: number | null };
    studios: { nodes: { id: number; name: string; isAnimationStudio: boolean }[] };
    staff: {
      edges: {
        role: string;
        node: { id: number; name: { full: string }; image: { medium: string } };
      }[];
    };
    characters: {
      edges: {
        role: string;
        node: { id: number; name: { full: string }; image: { medium: string } };
        voiceActors: { id: number; name: { full: string }; image: { medium: string } }[];
      }[];
    };
    recommendations: {
      nodes: {
        mediaRecommendation: {
          id: number;
          title: { romaji: string; english: string | null };
          coverImage: { large: string; color: string | null };
          averageScore: number | null;
          format: string;
        } | null;
      }[];
    };
    relations: {
      edges: {
        relationType: string;
        node: {
          id: number;
          type: string;
          format: string | null;
          title: { romaji: string; english: string | null };
          coverImage: { large: string; color: string | null };
          averageScore: number | null;
        };
      }[];
    };
    tags: { name: string; rank: number; isMediaSpoiler: boolean }[];
    externalLinks: { url: string; site: string; icon: string | null; color: string | null }[];
    trailer: { id: string; site: string } | null;
    nextAiringEpisode: { airingAt: number; episode: number } | null;
  };
}

function formatDate(d: { year: number | null; month: number | null; day: number | null }) {
  if (!d.year) return "TBA";
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.month ? months[d.month - 1] : ""} ${d.day || ""} ${d.year}`.trim();
}

export default async function AnimeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) notFound();

  let data: DetailData;
  try {
    data = await fetchAniList<DetailData>(MEDIA_DETAIL_QUERY, { id: numId }, 3, 43200);
  } catch (err) {
    // Only call notFound for actual missing content — not rate limits or network failures
    const msg = err instanceof Error ? err.message : "";
    if (msg === "rate_limited") {
      throw new Error("AniList API rate limited. Please try again in a moment.");
    }
    notFound();
  }

  const { Media: media } = data;
  const title = media.title.english || media.title.romaji;
  const accent = media.coverImage.color || "#3db4f2";
  const mainStudio = media.studios.nodes.find((s) => s.isAnimationStudio);

  const stats = [
    { label: "Episodes", value: media.episodes ?? "?" },
    { label: "Duration", value: media.duration ? `${media.duration} min` : "?" },
    { label: "Status", value: media.status.replace("_", " ") },
    { label: "Season", value: media.season ? `${media.season} ${media.seasonYear}` : "?" },
    { label: "Start Date", value: formatDate(media.startDate) },
    { label: "End Date", value: formatDate(media.endDate) },
    { label: "Source", value: media.source?.replace("_", " ") ?? "?" },
  ];

  return (
    <div>
      {/* Banner */}
      {media.bannerImage && (
        <div className="relative w-full h-[280px]">
          <Image
            src={media.bannerImage}
            alt={title}
            fill
            className="object-cover object-top"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, transparent 30%, var(--color-bg) 100%)",
            }}
          />
        </div>
      )}

      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="hidden md:block shrink-0 w-[200px]">
            <div className="sticky top-20">
              <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden shadow-xl mb-4">
                <Image
                  src={media.coverImage.extraLarge}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="200px"
                />
              </div>

              <AddToListButton
                animeId={media.id}
                malId={media.idMal}
                title={title}
                coverImage={media.coverImage.large}
                accent={accent}
                totalEpisodes={media.episodes}
              />
              <Button
                fullWidth
                variant="outline"
                className="gap-1.5"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                }}
              >
                <Heart size={14} />
                Favourite
              </Button>

              <div className="mt-6 space-y-3">
                {stats.map((s) => (
                  <div key={s.label}>
                    <p
                      className="text-xs font-bold uppercase tracking-wider mb-0.5"
                      style={{ color: accent }}
                    >
                      {s.label}
                    </p>
                    <p className="text-sm capitalize" style={{ color: "var(--color-text)" }}>
                      {s.value}
                    </p>
                  </div>
                ))}

                {/* Studio — clickable */}
                {mainStudio && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: accent }}>
                      Studio
                    </p>
                    <NextLink
                      href={`/studio/${mainStudio.id}`}
                      className="text-sm no-underline hover:text-[var(--color-blue)] transition-colors"
                      style={{ color: "var(--color-text)" }}
                    >
                      {mainStudio.name}
                    </NextLink>
                  </div>
                )}
              </div>

              {/* Genres */}
              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accent }}>
                  Genres
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {media.genres.map((g) => (
                    <NextLink key={g} href={`/search?genre=${g}`} className="no-underline">
                      <Chip
                        size="sm"
                        variant="tertiary"
                        className="cursor-pointer hover:opacity-80 transition-opacity text-xs"
                        style={{
                          color: accent,
                          backgroundColor: `${accent}15`,
                        }}
                      >
                        {g}
                      </Chip>
                    </NextLink>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {media.tags.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accent }}>
                    Tags
                  </p>
                  <div className="space-y-1">
                    {media.tags.filter((t) => !t.isMediaSpoiler).slice(0, 8).map((tag) => (
                      <NextLink
                        key={tag.name}
                        href={`/search?tag=${encodeURIComponent(tag.name)}`}
                        className="flex items-center justify-between group no-underline"
                      >
                        <span
                          className="text-xs group-hover:text-[var(--color-blue)] transition-colors"
                          style={{ color: "var(--color-text)" }}
                        >
                          {tag.name}
                        </span>
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          {tag.rank}%
                        </span>
                      </NextLink>
                    ))}
                  </div>
                </div>
              )}

              {/* External Links */}
              {media.externalLinks.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accent }}>
                    Streaming &amp; Links
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {media.externalLinks.slice(0, 6).map((link, i) => (
                      <a
                        key={`${link.site}-${i}`}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-2 py-1 rounded-md font-medium text-white transition-opacity hover:opacity-80 no-underline"
                        style={{ backgroundColor: link.color || accent }}
                      >
                        {link.site}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <div className="mb-6">
              <h1
                className="text-2xl md:text-3xl font-black leading-tight mb-1"
                style={{ color: "var(--color-heading)" }}
              >
                {title}
              </h1>
              {media.title.native && (
                <p className="text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>
                  {media.title.native}
                </p>
              )}
              <div className="flex items-center gap-6 flex-wrap mt-4">

                {/* Watch button — same line as Average Score */}
                <div
                  className="w-px h-8 hidden sm:block"
                  style={{ backgroundColor: "var(--color-border)" }}
                />
                <WatchModal
                  animeId={media.id}
                  malId={media.idMal}
                  title={title}
                  accent={accent}
                />
                {/* Average Score — same line as Watch button */}
                {media.averageScore && (
                  <div className="flex items-center gap-3">
                    <div
                      className="w-[3px] h-10 rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                    <div className="flex flex-col leading-none">
                      <div className="flex items-baseline gap-1">
                        <span
                          className="text-3xl font-black tracking-tight"
                          style={{ color: accent }}
                        >
                          {(media.averageScore / 10).toFixed(1)}
                        </span>
                        <span
                          className="text-sm font-medium"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          /10
                        </span>
                      </div>
                      <span
                        className="text-[11px] uppercase tracking-widest font-semibold mt-0.5"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        Average Score
                      </span>
                    </div>
                  </div>
                )}

                {/* Format — same vertical bar style */}
                {media.format && (
                  <>
                    <div
                      className="w-px h-8 hidden sm:block"
                      style={{ backgroundColor: "var(--color-border)" }}
                    />
                    <div className="flex items-center gap-3">
                      <div
                        className="w-[3px] h-10 rounded-full"
                        style={{ backgroundColor: "var(--color-text-muted)", opacity: 0.4 }}
                      />
                      <div className="flex flex-col leading-none">
                        <span
                          className="text-3xl font-black tracking-tight"
                          style={{ color: "var(--color-heading)" }}
                        >
                          {media.format.replace("_", " ")}
                        </span>
                        <span
                          className="text-[11px] uppercase tracking-widest font-semibold mt-0.5"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          Format
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Divider before user stats */}
                <div
                  className="w-px h-8 hidden sm:block"
                  style={{ backgroundColor: "var(--color-border)" }}
                />

                <div className="flex items-center gap-5 flex-wrap">
                  <div className="flex flex-col leading-none gap-0.5">
                    <span className="text-sm font-bold" style={{ color: "var(--color-heading)" }}>
                      {media.popularity.toLocaleString()}
                    </span>
                    <span
                      className="text-[11px] uppercase tracking-widest font-semibold"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Users
                    </span>
                  </div>

                  <div className="flex flex-col leading-none gap-0.5">
                    <div className="flex items-center gap-1">
                      <Heart size={12} className="text-pink-400" fill="#f472b6" />
                      <span className="text-sm font-bold" style={{ color: "var(--color-heading)" }}>
                        {media.favourites.toLocaleString()}
                      </span>
                    </div>
                    <span
                      className="text-[11px] uppercase tracking-widest font-semibold"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Favourites
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Airing notice */}
            {media.nextAiringEpisode && (
              <AiringCountdown
                airingAt={media.nextAiringEpisode.airingAt}
                episode={media.nextAiringEpisode.episode}
                accent={accent}
              />
            )}

            {/* Mobile cover */}
            <div className="md:hidden flex gap-4 mb-6">
              <div className="relative w-28 h-40 rounded-lg overflow-hidden shrink-0 shadow">
                <Image src={media.coverImage.large} alt={title} fill className="object-cover" sizes="112px" />
              </div>
              <div className="flex-1 grid grid-cols-2 gap-2">
                {stats.slice(0, 6).map((s) => (
                  <div key={s.label}>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>{s.label}</p>
                    <p className="text-xs capitalize" style={{ color: "var(--color-text)" }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="mb-6" style={{ backgroundColor: "var(--color-border)" }} />

            {/* Description */}
            {media.description && (
              <section className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-muted)" }}>
                  Description
                </h2>
                <AniListText text={media.description} />
              </section>
            )}

            {/* Trailer */}
            {media.trailer?.site === "youtube" && (
              <section className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-muted)" }}>
                  Trailer
                </h2>
                <div className="relative aspect-video w-full max-w-xl rounded-xl overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${media.trailer.id}`}
                    title="Trailer"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              </section>
            )}

            {/* Characters */}
            {media.characters.edges.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-muted)" }}>
                  Characters &amp; Voice Actors
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {media.characters.edges.map((edge) => {
                    const va = edge.voiceActors[0];
                    return (
                      <Card
                        key={edge.node.id}
                        variant="default"
                        className="p-2 flex flex-row items-center gap-2"
                        style={{ backgroundColor: "var(--color-surface)" }}
                      >
                        {/* Character side */}
                        <NextLink
                          href={`/character/${edge.node.id}`}
                          className="flex items-center gap-2 flex-1 min-w-0 no-underline group"
                        >
                          <Avatar className="w-10 h-12 rounded-md shrink-0">
                            <Avatar.Image src={edge.node.image.medium} alt={edge.node.name.full} asChild width={40} height={48}>
                              <Image src={edge.node.image.medium} alt={edge.node.name.full} width={40} height={48} className="object-cover" />
                            </Avatar.Image>
                            <Avatar.Fallback>{edge.node.name.full[0]}</Avatar.Fallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p
                              className="text-xs font-semibold line-clamp-1 group-hover:text-[var(--color-blue)] transition-colors"
                              style={{ color: "var(--color-heading)" }}
                            >
                              {edge.node.name.full}
                            </p>
                            <p className="text-xs capitalize" style={{ color: "var(--color-text-muted)" }}>
                              {edge.role.toLowerCase()}
                            </p>
                          </div>
                        </NextLink>

                        {/* Voice actor side */}
                        {va && (
                          <NextLink
                            href={`/staff/${va.id}`}
                            className="flex items-center gap-2 flex-1 min-w-0 justify-end text-right no-underline group"
                          >
                            <div className="min-w-0">
                              <p
                                className="text-xs font-semibold line-clamp-1 group-hover:text-[var(--color-blue)] transition-colors"
                                style={{ color: "var(--color-heading)" }}
                              >
                                {va.name.full}
                              </p>
                              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>JP</p>
                            </div>
                            <Avatar className="w-10 h-12 rounded-md shrink-0">
                              <Avatar.Image src={va.image.medium} alt={va.name.full} asChild width={40} height={48}>
                                <Image src={va.image.medium} alt={va.name.full} width={40} height={48} className="object-cover" />
                              </Avatar.Image>
                              <Avatar.Fallback>{va.name.full[0]}</Avatar.Fallback>
                            </Avatar>
                          </NextLink>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Staff */}
            {media.staff.edges.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-muted)" }}>
                  Staff
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {media.staff.edges.map((edge, i) => (
                    <Card
                      key={`${edge.node.id}-${edge.role}-${i}`}
                      variant="default"
                      className="p-2 flex flex-row items-center gap-2"
                      style={{ backgroundColor: "var(--color-surface)" }}
                    >
                      <Avatar className="w-10 h-12 rounded-md shrink-0">
                        <Avatar.Image src={edge.node.image.medium} alt={edge.node.name.full} asChild width={40} height={48}>
                          <Image src={edge.node.image.medium} alt={edge.node.name.full} width={40} height={48} className="object-cover" />
                        </Avatar.Image>
                        <Avatar.Fallback>{edge.node.name.full[0]}</Avatar.Fallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold line-clamp-1" style={{ color: "var(--color-heading)" }}>
                          {edge.node.name.full}
                        </p>
                        <p className="text-xs line-clamp-1" style={{ color: "var(--color-text-muted)" }}>
                          {edge.role}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Recommendations */}
            {media.recommendations.nodes.filter((n) => n.mediaRecommendation).length > 0 && (
              <section className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-muted)" }}>
                  Recommendations
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                  {media.recommendations.nodes
                    .filter((n) => n.mediaRecommendation)
                    .map(({ mediaRecommendation: rec }) => {
                      if (!rec) return null;
                      const recAccent = rec.coverImage.color || "#3db4f2";
                      return (
                        <NextLink
                          key={rec.id}
                          href={`/anime/${rec.id}`}
                          className="shrink-0 w-[110px] group no-underline"
                        >
                          <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
                            <Image
                              src={rec.coverImage.large}
                              alt={rec.title.romaji}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="110px"
                            />
                            {rec.averageScore && (
                              <div
                                className="absolute top-1 right-1 text-[10px] font-bold text-white px-1 py-0.5 rounded"
                                style={{ backgroundColor: recAccent }}
                              >
                                ★ {(rec.averageScore / 10).toFixed(1)}
                              </div>
                            )}
                          </div>
                          <p
                            className="mt-1 text-xs font-medium line-clamp-2 leading-snug group-hover:text-[var(--color-blue)] transition-colors"
                            style={{ color: "var(--color-heading)" }}
                          >
                            {rec.title.english || rec.title.romaji}
                          </p>
                        </NextLink>
                      );
                    })}
                </div>
              </section>
            )}

            {/* Relations */}
            {media.relations.edges.filter((e) => e.node.type === "ANIME").length > 0 && (
              <section className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-muted)" }}>
                  Related Anime
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {media.relations.edges
                    .filter((e) => e.node.type === "ANIME")
                    .map((edge) => {
                      const rel = edge.node;
                      const relAccent = rel.coverImage.color || "#3db4f2";
                      const relLabel: Record<string, string> = {
                        SEQUEL: "Sequel", PREQUEL: "Prequel", SIDE_STORY: "Side Story",
                        ALTERNATIVE: "Alternative", SPIN_OFF: "Spin-off",
                        SUMMARY: "Summary", SOURCE: "Source", OTHER: "Other",
                      };
                      return (
                        <NextLink
                          key={rel.id}
                          href={`/anime/${rel.id}`}
                          className="group flex items-center gap-3 no-underline rounded-xl p-2 transition-colors hover:bg-white/5"
                          style={{ backgroundColor: "var(--color-surface)" }}
                        >
                          <div className="relative w-12 h-16 rounded-md overflow-hidden shrink-0">
                            <Image src={rel.coverImage.large} alt={rel.title.romaji} fill className="object-cover" sizes="48px" />
                            <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: relAccent }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black uppercase tracking-wider mb-0.5" style={{ color: relAccent }}>
                              {relLabel[edge.relationType] ?? edge.relationType.replace("_", " ")}
                            </p>
                            <p className="text-xs font-semibold line-clamp-2 leading-snug group-hover:text-[var(--color-blue)] transition-colors" style={{ color: "var(--color-heading)" }}>
                              {rel.title.english || rel.title.romaji}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>
                                {rel.format?.replace("_", " ") ?? "—"}
                              </span>
                              {rel.averageScore && (
                                <>
                                  <span style={{ color: "var(--color-text-muted)" }}>·</span>
                                  <span className="text-[9px] font-bold" style={{ color: relAccent }}>
                                    ★ {(rel.averageScore / 10).toFixed(1)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </NextLink>
                      );
                    })}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
