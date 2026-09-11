import NextLink from "next/link";

interface Props {
  text: string;
  className?: string;
}

interface Segment {
  type: "text" | "link" | "bold" | "italic";
  content: string;
  href?: string;
}

function parse(raw: string): Segment[] {
  // Strip spoiler tags ~! ... !~ but keep content
  const cleaned = raw
    .replace(/~!([\s\S]*?)!~/g, "$1")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "");

  const segments: Segment[] = [];
  // Combined regex: markdown links, bold, italic
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)|\*\*(.+?)\*\*|__(.+?)__|_(.+?)_|\*(.+?)\*/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(cleaned)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: cleaned.slice(lastIndex, match.index) });
    }

    if (match[1] && match[2]) {
      // [text](url)
      segments.push({ type: "link", content: match[1], href: match[2] });
    } else if (match[3]) {
      // **bold**
      segments.push({ type: "bold", content: match[3] });
    } else if (match[4]) {
      // __bold__
      segments.push({ type: "bold", content: match[4] });
    } else if (match[5]) {
      // _italic_
      segments.push({ type: "italic", content: match[5] });
    } else if (match[6]) {
      // *italic*
      segments.push({ type: "italic", content: match[6] });
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < cleaned.length) {
    segments.push({ type: "text", content: cleaned.slice(lastIndex) });
  }

  return segments;
}

export default function AniListText({ text, className }: Props) {
  const segments = parse(text);

  return (
    <p className={`text-sm leading-relaxed whitespace-pre-line ${className ?? ""}`} style={{ color: "var(--color-text)" }}>
      {segments.map((seg, i) => {
        if (seg.type === "link" && seg.href) {
          // Detect internal AniList links and route internally
          const internalMatch = seg.href.match(/anilist\.co\/(character|staff|anime|studio)\/(\d+)/);
          if (internalMatch) {
            const [, type, id] = internalMatch;
            const path = type === "anime" ? `/anime/${id}` : `/${type}/${id}`;
            return (
              <NextLink key={i} href={path} className="font-medium no-underline hover:underline" style={{ color: "var(--color-blue)" }}>
                {seg.content}
              </NextLink>
            );
          }
          return (
            <a key={i} href={seg.href} target="_blank" rel="noopener noreferrer" className="font-medium no-underline hover:underline" style={{ color: "var(--color-blue)" }}>
              {seg.content}
            </a>
          );
        }
        if (seg.type === "bold") {
          return <strong key={i} style={{ color: "var(--color-heading)" }}>{seg.content}</strong>;
        }
        if (seg.type === "italic") {
          return <em key={i}>{seg.content}</em>;
        }
        return <span key={i}>{seg.content}</span>;
      })}
    </p>
  );
}
