"use client";

import Image from "next/image";
import { useState } from "react";
import { Button, Tooltip } from "@heroui/react";
import { Link, Check } from "lucide-react";

const SHARE_URL = "https://fwanime.com"; // swap for real domain when live
const SHARE_TEXT = "Discover and track anime with FWAnime — check it out!";

const socials = [
  {
    id: "x",
    label: "X / Twitter",
    color: "#000000",
    href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16} aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: "facebook",
    label: "Facebook",
    color: "#1877F2",
    href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16} aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: "reddit",
    label: "Reddit",
    color: "#FF4500",
    href: `https://www.reddit.com/submit?url=${encodeURIComponent(SHARE_URL)}&title=${encodeURIComponent(SHARE_TEXT)}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16} aria-hidden>
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
      </svg>
    ),
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    color: "#25D366",
    href: `https://wa.me/?text=${encodeURIComponent(SHARE_TEXT + " " + SHARE_URL)}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16} aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      </svg>
    ),
  },
];

export default function CTABanner() {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(SHARE_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section
      className="relative mb-10 rounded-2xl overflow-hidden"
      style={{ backgroundColor: "var(--color-surface)" }}
    >
      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-blue) 1px, transparent 1px), linear-gradient(90deg, var(--color-blue) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ backgroundColor: "var(--color-blue)" }}
      />

      {/* Content */}
      <div className="relative flex items-center justify-between px-8 py-8 pr-0">
        {/* Copy + share buttons */}
        <div className="flex-1 min-w-0 pr-4 z-10">
          <p
            className="text-xs font-black uppercase tracking-[0.2em] mb-2"
            style={{ color: "#e02020" }}
          >
            Share
          </p>

          <h2
            className="text-2xl md:text-3xl font-black leading-tight mb-3"
            style={{ color: "var(--color-heading)" }}
          >
            Show your taste.
            <br />
            <span style={{ color: "var(--color-blue)" }}>Share what you watch.</span>
          </h2>

          <p
            className="text-sm leading-relaxed mb-6 max-w-sm"
            style={{ color: "var(--color-text)" }}
          >
            Share your watchlist and recommendations with friends.
            Let them know what's worth watching this season.
          </p>

          {/* Social share badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {socials.map((s) => (
              <Tooltip key={s.id} delay={150}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Share on ${s.label}`}
                  className="no-underline"
                >
                  <Button
                    isIconOnly
                    size="sm"
                    className="w-9 h-9 rounded-xl transition-all duration-150 hover:scale-110 active:scale-95 border-0"
                    style={{ backgroundColor: s.color, color: "#fff" }}
                  >
                    {s.icon}
                  </Button>
                </a>
                <Tooltip.Content className="text-xs bg-[#111927] border border-[#2b3d52] text-[#c0ccd8]">
                  {s.label}
                </Tooltip.Content>
              </Tooltip>
            ))}

            {/* Copy link button */}
            <Tooltip delay={150}>
              <Button
                isIconOnly
                size="sm"
                onPress={copyLink}
                aria-label="Copy link"
                className="w-9 h-9 rounded-xl transition-all duration-150 hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: copied ? "#22c55e" : "var(--color-bg)",
                  color: copied ? "#fff" : "var(--color-heading)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {copied ? <Check size={15} /> : <Link size={15} />}
              </Button>
              <Tooltip.Content className="text-xs bg-[#111927] border border-[#2b3d52] text-[#c0ccd8]">
                {copied ? "Copied!" : "Copy link"}
              </Tooltip.Content>
            </Tooltip>
          </div>
        </div>

        {/* Luffy sticker */}
        <div
          className="hidden sm:block shrink-0 select-none pointer-events-none"
          aria-hidden
        >
          <Image
            src="/assets/luffy-sticker.png"
            alt=""
            width={240}
            height={240}
            className="object-contain"
            style={{
              filter: "drop-shadow(0 0 24px rgba(61,180,242,0.25))",
              marginRight: "-12px",
            }}
            priority
          />
        </div>
      </div>
    </section>
  );
}
