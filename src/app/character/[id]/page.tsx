import Image from "next/image";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { fetchAniList } from "@/lib/anilist";
import { Heart } from "lucide-react";
import AniListText from "@/components/AniListText";

const CHARACTER_QUERY = `
  query Character($id: Int) {
    Character(id: $id) {
      id
      name { full native alternative }
      image { large }
      description(asHtml: false)
      gender
      dateOfBirth { year month day }
      age
      bloodType
      favourites
      media(perPage: 12, sort: POPULARITY_DESC) {
        edges {
          node {
            id
            title { romaji english }
            coverImage { large color }
            format
            averageScore
          }
          characterRole
          voiceActors(language: JAPANESE) {
            id
            name { full }
            image { medium }
          }
        }
      }
    }
  }
`;

interface CharacterData {
  Character: {
    id: number;
    name: { full: string; native: string | null; alternative: string[] };
    image: { large: string };
    description: string | null;
    gender: string | null;
    dateOfBirth: { year: number | null; month: number | null; day: number | null };
    age: string | null;
    bloodType: string | null;
    favourites: number;
    media: {
      edges: {
        node: {
          id: number;
          title: { romaji: string; english: string | null };
          coverImage: { large: string; color: string | null };
          format: string;
          averageScore: number | null;
        };
        characterRole: string;
        voiceActors: { id: number; name: { full: string }; image: { medium: string } }[];
      }[];
    };
  };
}

export default async function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) notFound();

  let data: CharacterData;
  try {
    data = await fetchAniList<CharacterData>(CHARACTER_QUERY, { id: numId });
  } catch {
    notFound();
  }

  const { Character: char } = data;

  const details = [
    { label: "Gender", value: char.gender },
    { label: "Age", value: char.age },
    { label: "Blood Type", value: char.bloodType },
    {
      label: "Birthday",
      value: char.dateOfBirth.month && char.dateOfBirth.day
        ? `${char.dateOfBirth.month}/${char.dateOfBirth.day}${char.dateOfBirth.year ? `/${char.dateOfBirth.year}` : ""}`
        : null,
    },
  ].filter((d) => d.value);

  return (
    <div className="max-w-[1300px] mx-auto px-4 sm:px-6 py-8">
      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="hidden md:block shrink-0 w-[180px]">
          <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden shadow-xl mb-4">
            <Image src={char.image.large} alt={char.name.full} fill className="object-cover" sizes="180px" />
          </div>
          {/* Favourites */}
          <div className="flex items-center gap-1.5 mb-4">
            <Heart size={14} className="text-pink-400" fill="#f472b6" />
            <span className="text-sm font-bold" style={{ color: "var(--color-heading)" }}>
              {char.favourites.toLocaleString()}
            </span>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>favourites</span>
          </div>
          {/* Details */}
          <div className="space-y-3">
            {details.map((d) => (
              <div key={d.label}>
                <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--color-blue)" }}>
                  {d.label}
                </p>
                <p className="text-sm" style={{ color: "var(--color-text)" }}>{d.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-black mb-1" style={{ color: "var(--color-heading)" }}>
            {char.name.full}
          </h1>
          {char.name.native && (
            <p className="text-sm mb-1" style={{ color: "var(--color-text-muted)" }}>{char.name.native}</p>
          )}
          {char.name.alternative.filter(Boolean).length > 0 && (
            <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
              Also known as: {char.name.alternative.filter(Boolean).join(", ")}
            </p>
          )}

          {/* Mobile details */}
          <div className="md:hidden flex gap-4 mb-6">
            <div className="relative w-24 h-32 rounded-lg overflow-hidden shrink-0 shadow">
              <Image src={char.image.large} alt={char.name.full} fill className="object-cover" sizes="96px" />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              {details.map((d) => (
                <div key={d.label}>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-blue)" }}>{d.label}</p>
                  <p className="text-xs" style={{ color: "var(--color-text)" }}>{d.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {char.description && (
            <section className="mb-8">
              <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-muted)" }}>About</h2>
              <AniListText text={char.description} />
            </section>
          )}

          {/* Anime appearances */}
          {char.media.edges.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--color-text-muted)" }}>
                Appears In
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {char.media.edges.map((edge) => {
                  const accentColor = edge.node.coverImage.color || "#3db4f2";
                  const va = edge.voiceActors[0];
                  return (
                    <NextLink
                      key={edge.node.id}
                      href={`/anime/${edge.node.id}`}
                      className="group flex items-center gap-2 p-2 rounded-lg no-underline transition-colors hover:bg-white/5"
                      style={{ backgroundColor: "var(--color-surface)" }}
                    >
                      <div className="relative w-10 h-14 rounded-md overflow-hidden shrink-0">
                        <Image src={edge.node.coverImage.large} alt={edge.node.title.romaji} fill className="object-cover" sizes="40px" />
                        <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: accentColor }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold line-clamp-2 group-hover:text-[var(--color-blue)] transition-colors" style={{ color: "var(--color-heading)" }}>
                          {edge.node.title.english || edge.node.title.romaji}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                          {edge.characterRole.replace("_", " ").toLowerCase()}
                          {va ? ` · ${va.name.full}` : ""}
                        </p>
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
  );
}
