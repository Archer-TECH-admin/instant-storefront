"use client";
import { useRef, useState, useEffect, useCallback } from "react";

export default function ScrollerWithArrows({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const updateArrows = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const canScroll = el.scrollWidth > el.clientWidth + 1; // +1 guards against rounding
    setShowLeftArrow(canScroll && el.scrollLeft > 0);
    setShowRightArrow(canScroll && el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    updateArrows();

    const resizeObserver = new ResizeObserver(updateArrows);
    resizeObserver.observe(el);

    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);

    return () => {
      resizeObserver.disconnect();
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows, children]);

  const scroll = (dir: "left" | "right") => {
    if (ref.current) {
      ref.current.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
    }
  };

  return (
    <div className="relative">
    {showLeftArrow && (
      <button
      onClick={() => scroll("left")}
      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100 -ml-5"
      aria-label="Scroll left"
      >
      &#8249;
      </button>
    )}
    <div
    ref={ref}
    className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
    {children}
    </div>
    {showRightArrow && (
      <button
      onClick={() => scroll("right")}
      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100 -mr-5"
      aria-label="Scroll right"
      >
      &#8250;
      </button>
    )}
    </div>
  );
}
