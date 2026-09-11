import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const dseg7 = localFont({
  src: "../../node_modules/dseg/fonts/DSEG7-Classic/DSEG7Classic-Bold.woff2",
  variable: "--font-dseg7",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FWAnime - Watch Anime Online Free",
    template: "%s | FWAnime",
  },
  description:
    "FWAnime - stream and discover thousands of anime series and movies. Watch trending, seasonal, and all-time popular anime in sub and dub for free.",
  keywords: [
    "anime", "watch anime", "anime streaming", "free anime",
    "anime online", "sub", "dub", "FWAnime",
    "trending anime", "seasonal anime", "popular anime",
  ],
  authors: [{ name: "FWAnime" }],
  creator: "FWAnime",
  metadataBase: new URL("https://flixworld.xyz"),
  openGraph: {
    title: "FWAnime - Watch Anime Online Free",
    description:
      "Stream thousands of anime series and movies in sub and dub. Discover trending, seasonal, and all-time popular titles — all in one place.",
    type: "website",
    url: "https://flixworld.xyz",
    siteName: "FWAnime",
    images: [
      {
        url: "/assets/logo.png",
        width: 1200,
        height: 630,
        alt: "FWAnime",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FWAnime - Watch Anime Online Free",
    description:
      "Stream thousands of anime series and movies in sub and dub. Discover trending, seasonal, and all-time popular titles.",
    images: ["/assets/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dseg7.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Overpass:wght@300;400;600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Navbar />
        <main className="pt-[60px]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
