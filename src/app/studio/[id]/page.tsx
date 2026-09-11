import Image from "next/image";
import { notFound } from "next/navigation";
import { fetchAniList } from "@/lib/anilist";
import MediaCard from "@/components/MediaCard";
import { Media } from "@/lib/anilist";

const STUDIO_QUERY = `
  query Studio($id: Int) {
    Studio(id: $id) {
      id
      name
      isAnimationStudio
      favourites
      siteUrl
      media(sort: POPULARITY_DESC, perPage: 40) {
        nodes {
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
  }
`;

interface StudioData {
  Studio: {
    id: number;
    name: string;
    isAnimationStudio: boolean;
    favourites: number;
    siteUrl: string;
    media: { nodes: Media[] };
  };
}

export default async function StudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) notFound();

  let data: StudioData;
  try {
    data = await fetchAniList<StudioData>(STUDIO_QUERY, { id: numId });
  } catch {
    notFound();
  }

  const { Studio: studio } = data;

  return (
    <div className="max-w-[1300px] mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--color-blue)" }}>
          {studio.isAnimationStudio ? "Animation Studio" : "Studio"}
        </p>
        <h1 className="text-3xl font-black" style={{ color: "var(--color-heading)" }}>
          {studio.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          ♥ {studio.favourites.toLocaleString()} favourites
        </p>
      </div>

      {/* Anime grid */}
      <h2 className="text-base font-bold mb-4" style={{ color: "var(--color-heading)" }}>
        Works ({studio.media.nodes.length})
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
        {Array.from(new Map(studio.media.nodes.map((m) => [m.id, m])).values()).map((media) => (
          <MediaCard key={media.id} media={media} />
        ))}
      </div>
    </div>
  );
}
