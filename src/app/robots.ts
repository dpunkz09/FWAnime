import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Allow normal search engine crawlers ──────────────────────────
      {
        userAgent: ["Googlebot", "Bingbot", "Slurp", "DuckDuckBot", "Baiduspider", "YandexBot"],
        allow: ["/"],
        disallow: ["/api/", "/watch/"],
      },

      // ── Block known aggressive AI training crawlers ──────────────────
      {
        userAgent: [
          // OpenAI
          "GPTBot",
          "ChatGPT-User",
          "OAI-SearchBot",
          // Anthropic
          "anthropic-ai",
          "Claude-Web",
          "ClaudeBot",
          // Google AI / Gemini
          "Google-Extended",
          "Gemini",
          // Meta
          "FacebookBot",
          "meta-externalagent",
          // Amazon / Alexa
          "Amazonbot",
          // Apple
          "Applebot-Extended",
          // Common scrapers & dataset collectors
          "CCBot",                // Common Crawl (used for training datasets)
          "DataForSeoBot",
          "PetalBot",
          "SemrushBot",
          "AhrefsBot",
          "MJ12bot",
          "DotBot",
          "BLEXBot",
          "SeznamBot",
          "Bytespider",           // TikTok / ByteDance
          "Diffbot",
          "Omgili",
          "omgilibot",
          "facebookexternalhit",
          "ia_archiver",          // Wayback Machine indexer
          "Scrapy",
          "python-requests",
          "Go-http-client",
          "okhttp",
          "axios",
        ],
        disallow: ["/"],
      },

      // ── Block everything else by default ─────────────────────────────
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/api/",        // internal API routes
          "/watch/",      // watch pages (not useful to index)
          "/_next/",      // Next.js internals
        ],
        crawlDelay: 5,    // be polite to unknown bots
      },
    ],

    sitemap: "https://anime.flixworld.xyz/sitemap.xml",
    host:    "https://anime.flixworld.xyz",
  };
}
