"use client";

import { useRef, useState } from "react";
import { ScrollShadow } from "@heroui/react";
import type { ScrollShadowVisibility } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  children: React.ReactNode;
  gradientColor?: string;
  gap?: string;
}

export default function ScrollRow({ children, gradientColor = "rgba(11,22,34,0.85)", gap = "gap-4" }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibility, setVisibility] = useState<ScrollShadowVisibility>("right");

  const showLeft = visibility === "left" || visibility === "both";
  const showRight = visibility === "right" || visibility === "both";

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -520 : 520, behavior: "smooth" });
  }

  return (
    <div className="relative group/scroll">
      {/* Left gradient + chevron */}
      {showLeft && (
        <button
          onClick={() => scroll("left")}
          aria-label="Scroll left"
          className="absolute left-0 top-0 bottom-2 z-10 w-16 flex items-center justify-start
                     opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-200
                     cursor-pointer border-0 p-0 bg-transparent"
          style={{
            background: `linear-gradient(to right, ${gradientColor} 0%, transparent 100%)`,
          }}
        >
          <ChevronLeft size={28} className="text-white ml-1 drop-shadow-lg" strokeWidth={2.5} />
        </button>
      )}

      {/* Right gradient + chevron */}
      {showRight && (
        <button
          onClick={() => scroll("right")}
          aria-label="Scroll right"
          className="absolute right-0 top-0 bottom-2 z-10 w-16 flex items-center justify-end
                     opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-200
                     cursor-pointer border-0 p-0 bg-transparent"
          style={{
            background: `linear-gradient(to left, ${gradientColor} 0%, transparent 100%)`,
          }}
        >
          <ChevronRight size={28} className="text-white mr-1 drop-shadow-lg" strokeWidth={2.5} />
        </button>
      )}

      <ScrollShadow
        ref={scrollRef}
        orientation="horizontal"
        hideScrollBar
        className="pb-2"
        onVisibilityChange={setVisibility}
      >
        <div className={`flex ${gap}`}>
          {children}
        </div>
      </ScrollShadow>
    </div>
  );
}
