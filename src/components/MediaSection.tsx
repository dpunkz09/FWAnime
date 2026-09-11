import NextLink from "next/link";
import { Button, Separator } from "@heroui/react";
import { ChevronRight } from "lucide-react";
import MediaCard from "./MediaCard";
import ScrollRow from "./ScrollRow";
import { Media } from "@/lib/anilist";

interface Props {
  title: string;
  subtitle?: string;
  items: Media[];
  viewAllHref?: string;
  showRank?: boolean;
}

export default function MediaSection({
  title,
  subtitle,
  items,
  viewAllHref,
  showRank = false,
}: Props) {
  return (
    <section className="mb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold" style={{ color: "var(--color-heading)" }}>
            {title}
            {subtitle && (
              <span className="ml-2 text-sm font-normal" style={{ color: "var(--color-blue)" }}>
                {subtitle}
              </span>
            )}
          </h2>
          <Separator
            orientation="horizontal"
            className="w-8 hidden sm:block"
            style={{ backgroundColor: "var(--color-border)" }}
          />
        </div>

        {viewAllHref && (
          <NextLink href={viewAllHref} className="no-underline">
            <Button
              variant="ghost"
              size="sm"
              className="gap-0.5 font-medium text-xs h-7 px-2"
              style={{ color: "var(--color-blue)" }}
            >
              View All
              <ChevronRight size={13} />
            </Button>
          </NextLink>
        )}
      </div>

      {/* Scrollable row with nav buttons */}
      <ScrollRow>
        {items.slice(0, 10).map((media, i) => (
          <div key={media.id} className="shrink-0 w-[140px] sm:w-[160px]">
            <MediaCard media={media} rank={showRank ? i + 1 : undefined} />
          </div>
        ))}
      </ScrollRow>
    </section>
  );
}
