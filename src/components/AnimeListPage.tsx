import NextLink from "next/link";
import { Button, Separator } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MediaCard from "./MediaCard";
import { Media } from "@/lib/anilist";

interface Props {
  title: string;
  subtitle?: string;
  items: Media[];
  total: number;
  currentPage: number;
  lastPage: number;
  basePath: string; // e.g. "/anime/trending"
}

export default function AnimeListPage({
  title,
  subtitle,
  items,
  total,
  currentPage,
  lastPage,
  basePath,
}: Props) {
  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < lastPage ? currentPage + 1 : null;

  function pageHref(p: number) {
    return p === 1 ? basePath : `${basePath}?page=${p}`;
  }

  return (
    <div className="max-w-[1300px] mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1
            className="text-2xl font-black leading-tight"
            style={{ color: "var(--color-heading)" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm mt-0.5" style={{ color: "var(--color-blue)" }}>
              {subtitle}
            </p>
          )}
        </div>
        <Separator
          className="w-8 hidden sm:block"
          style={{ backgroundColor: "var(--color-border)" }}
        />
        <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {total.toLocaleString()} titles
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 mb-10">
        {items.map((media) => (
          <MediaCard key={media.id} media={media} />
        ))}
      </div>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-2">
          {prevPage ? (
            <NextLink href={pageHref(prevPage)} className="no-underline">
              <Button
                variant="secondary"
                size="sm"
                className="gap-1"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                }}
              >
                <ChevronLeft size={14} />
                Prev
              </Button>
            </NextLink>
          ) : (
            <Button variant="secondary" size="sm" isDisabled className="gap-1">
              <ChevronLeft size={14} />
              Prev
            </Button>
          )}

          {/* Page numbers — show a window around current */}
          <div className="flex items-center gap-1">
            {Array.from({ length: lastPage }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === lastPage ||
                  Math.abs(p - currentPage) <= 2
              )
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="text-sm px-1"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    …
                  </span>
                ) : (
                  <NextLink key={p} href={pageHref(p as number)} className="no-underline">
                    <Button
                      size="sm"
                      variant={p === currentPage ? "primary" : "ghost"}
                      className="w-8 h-8 p-0 text-xs font-bold"
                      style={
                        p === currentPage
                          ? { backgroundColor: "var(--color-blue)", color: "white" }
                          : { color: "var(--color-text)" }
                      }
                    >
                      {p}
                    </Button>
                  </NextLink>
                )
              )}
          </div>

          {nextPage ? (
            <NextLink href={pageHref(nextPage)} className="no-underline">
              <Button
                variant="secondary"
                size="sm"
                className="gap-1"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                }}
              >
                Next
                <ChevronRight size={14} />
              </Button>
            </NextLink>
          ) : (
            <Button variant="secondary" size="sm" isDisabled className="gap-1">
              Next
              <ChevronRight size={14} />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
