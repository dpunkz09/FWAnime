"use client";

import { useState, useEffect, useRef } from "react";
import NextLink from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, SearchField } from "@heroui/react";
import { Menu, X, BookmarkCheck } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const router = useRouter();
  const searchFieldRef = useRef<HTMLInputElement>(null);
  const { allWatchlist } = useWatchlist();
  const listCount = allWatchlist.length;

  useEffect(() => {
    if (searchOpen) searchFieldRef.current?.focus();
  }, [searchOpen]);

  function submit(val: string) {
    const q = val.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setSearchVal("");
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center"
      style={{ backgroundColor: "var(--color-nav)" }}
    >
      <div className="w-full max-w-[1300px] mx-auto px-6 flex items-center gap-4">

        {/* Logo */}
        <NextLink href="/" className="flex items-center gap-2.5 shrink-0 no-underline">
          <Image
            src="/assets/logo.png"
            alt="FWAnime"
            width={88}
            height={64}
            className="object-contain"
            style={{ height: "auto" }}
            priority
          />
          <span className="hidden sm:flex items-baseline font-black text-3xl tracking-tight select-none leading-none">
            <span style={{ color: "#e02020" }}>FW</span>
            <span className="text-white">Anime</span>
          </span>
        </NextLink>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Desktop: expanding SearchField on the right */}
        <div className="hidden md:flex items-center gap-2">
          {/* My List link */}
          <NextLink href="/my-list" className="no-underline">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors hover:bg-white/10 relative h-9"
              style={{ color: "var(--color-text-muted)" }}
            >
              <BookmarkCheck size={15} />
              <span className="hidden lg:inline">My List</span>
              {listCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-black px-1"
                  style={{ backgroundColor: "var(--color-blue)", color: "white" }}
                >
                  {listCount > 99 ? "99+" : listCount}
                </span>
              )}
            </button>
          </NextLink>

          {searchOpen ? (
            <SearchField
              aria-label="Search anime"
              value={searchVal}
              onChange={setSearchVal}
              onSubmit={submit}
              onClear={() => { setSearchVal(""); setSearchOpen(false); }}
              autoFocus
              className="w-64"
            >
              <SearchField.Group
                className="rounded-lg h-9 border"
                style={{
                  backgroundColor: "#0d151f",
                  borderColor: "var(--color-blue)",
                  boxShadow: "none",
                }}
              >
                <SearchField.SearchIcon
                  className="ml-2"
                  style={{ color: "var(--color-text-muted)" }}
                />
                <SearchField.Input
                  ref={searchFieldRef}
                  placeholder="Search anime, characters..."
                  className="text-sm"
                  style={{ color: "white" }}
                />
                <SearchField.ClearButton className="mr-1" />
              </SearchField.Group>
            </SearchField>
          ) : (
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              className="text-[#c0ccd8] hover:text-white hover:bg-white/10"
              onPress={() => setSearchOpen(true)}
              aria-label="Open search"
            >
              {/* Search icon inline to avoid extra import */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={17}
                height={17}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </Button>
          )}
        </div>

        {/* Mobile toggle */}
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          className="md:hidden text-[#c0ccd8] hover:text-white hover:bg-white/10"
          onPress={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className="absolute top-[60px] left-0 right-0 shadow-xl z-50 md:hidden border-t px-4 py-3"
          style={{ backgroundColor: "var(--color-nav)", borderColor: "var(--color-border)" }}
        >
          <SearchField
            aria-label="Search anime"
            value={searchVal}
            onChange={setSearchVal}
            onSubmit={(val) => { submit(val); setMobileOpen(false); }}
            onClear={() => setSearchVal("")}
            fullWidth
          >
            <SearchField.Group
              className="rounded-lg h-10 border w-full"
              style={{
                backgroundColor: "#0d151f",
                borderColor: "#2b3d52",
                boxShadow: "none",
              }}
            >
              <SearchField.SearchIcon
                className="ml-2"
                style={{ color: "var(--color-text-muted)" }}
              />
              <SearchField.Input
                placeholder="Search anime..."
                className="text-sm"
                style={{ color: "white" }}
              />
              <SearchField.ClearButton className="mr-1" />
            </SearchField.Group>
          </SearchField>

          <NextLink
            href="/my-list"
            onClick={() => setMobileOpen(false)}
            className="no-underline flex items-center gap-2 py-2.5 text-sm font-semibold border-t mt-2"
            style={{ color: "var(--color-text-muted)", borderColor: "var(--color-border)" }}
          >
            <BookmarkCheck size={15} />
            My List
            {listCount > 0 && (
              <span
                className="ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: "var(--color-blue)", color: "white" }}
              >
                {listCount}
              </span>
            )}
          </NextLink>
        </div>
      )}
    </nav>
  );
}
