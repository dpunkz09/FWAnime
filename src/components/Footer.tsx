import NextLink from "next/link";
import { Separator } from "@heroui/react";

const footerLinks = [
  {
    heading: "Site",
    links: [
      { label: "Home", href: "/" },
      { label: "Anime", href: "/anime" },
      { label: "Search", href: "/search" },
    ],
  },
  {
    heading: "Community",
    links: [
      { label: "Activity", href: "/activity" },
      { label: "Forum", href: "/forum" },
      { label: "Reviews", href: "/reviews" },
    ],
  },
  {
    heading: "Help",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      className="mt-16 py-12"
      style={{
        backgroundColor: "var(--color-surface)",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      <div className="max-w-[1300px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <path d="M8 32L20 8L32 32H8Z" fill="#3DB4F2" />
                <path d="M14 32L20 20L26 32H14Z" fill="#0b1622" opacity="0.7" />
              </svg>
              <span className="font-bold text-base" style={{ color: "var(--color-heading)" }}>
                FWAnime
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
              Track, discover and share your anime with other fans.
            </p>
          </div>

          {footerLinks.map((section) => (
            <div key={section.heading}>
              <h3
                className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: "var(--color-blue)" }}
              >
                {section.heading}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <NextLink
                      href={link.href}
                      className="text-sm no-underline transition-colors hover:text-[var(--color-blue)]"
                      style={{ color: "var(--color-text)" }}
                    >
                      {link.label}
                    </NextLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator style={{ backgroundColor: "var(--color-border)" }} className="mb-6" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            © {new Date().getFullYear()} FWAnime · Built with the AniList API · Not affiliated with AniList.
          </p>
          <div className="flex items-center gap-4">
            <NextLink
              href="https://anilist.co"
              className="text-xs no-underline transition-colors hover:text-[var(--color-blue)]"
              style={{ color: "var(--color-text-muted)" }}
              target="_blank"
            >
              AniList.co
            </NextLink>
            <NextLink
              href="https://github.com"
              className="text-xs no-underline transition-colors hover:text-[var(--color-blue)]"
              style={{ color: "var(--color-text-muted)" }}
            >
              GitHub
            </NextLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
