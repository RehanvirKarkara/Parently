import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardSliderProps {
  children: React.ReactNode[];
  className?: string;
  itemClassName?: string;
  showArrows?: boolean;
  showDots?: boolean;
  edgeFades?: boolean;
  gap?: "sm" | "md" | "lg";
  ariaLabel?: string;
}

export function CardSlider({
  children,
  className,
  itemClassName,
  showArrows = true,
  showDots = true,
  edgeFades = true,
  gap = "md",
  ariaLabel = "Horizontal scrollable list",
}: CardSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  const gapClasses = {
    sm: "gap-3",
    md: "gap-4 sm:gap-5",
    lg: "gap-6",
  }[gap];

  const updateScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);

    // Calculate approximate active item index based on scroll position
    const childrenCount = children.length;
    if (childrenCount <= 1) {
      setActiveIndex(0);
      return;
    }
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) {
      setActiveIndex(0);
      return;
    }
    const scrollRatio = scrollLeft / maxScroll;
    const computedIndex = Math.min(
      childrenCount - 1,
      Math.max(0, Math.round(scrollRatio * (childrenCount - 1))),
    );
    setActiveIndex(computedIndex);
  }, [children.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scrollTo = (direction: "left" | "right") => {
    const el = containerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  const scrollToIndex = (index: number) => {
    const el = containerRef.current;
    if (!el) return;
    const childNodes = el.querySelectorAll<HTMLElement>("[data-slider-item]");
    if (childNodes[index]) {
      childNodes[index].scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  };

  return (
    <div className={cn("relative group/slider", className)}>
      {/* Optional Left / Right Navigation Buttons (Desktop/Tablet) */}
      {showArrows && children.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollTo("left")}
            disabled={!canScrollLeft}
            aria-label="Previous items"
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3.5 z-20 hidden md:flex items-center justify-center",
              "size-9 rounded-full border border-border/80 bg-card/90 shadow-soft-md backdrop-blur-md",
              "text-foreground transition-all duration-200 hover:scale-105 hover:bg-card active:scale-95",
              "disabled:opacity-0 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => scrollTo("right")}
            disabled={!canScrollRight}
            aria-label="Next items"
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 translate-x-3.5 z-20 hidden md:flex items-center justify-center",
              "size-9 rounded-full border border-border/80 bg-card/90 shadow-soft-md backdrop-blur-md",
              "text-foreground transition-all duration-200 hover:scale-105 hover:bg-card active:scale-95",
              "disabled:opacity-0 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20",
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Subtle Gradient Edge Indicators */}
      {edgeFades && canScrollLeft && (
        <div
          className="pointer-events-none absolute left-0 inset-y-0 w-8 z-10 bg-gradient-to-r from-background to-transparent transition-opacity duration-300"
          aria-hidden="true"
        />
      )}
      {edgeFades && canScrollRight && (
        <div
          className="pointer-events-none absolute right-0 inset-y-0 w-8 z-10 bg-gradient-to-l from-background to-transparent transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Scroll Container */}
      <div
        ref={containerRef}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            scrollTo("left");
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            scrollTo("right");
          }
        }}
        className={cn(
          "flex overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 no-scrollbar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-2xl",
          gapClasses,
        )}
      >
        {React.Children.map(children, (child, idx) => (
          <div
            key={idx}
            data-slider-item
            className={cn(
              "snap-start shrink-0 transition-transform duration-200",
              itemClassName,
            )}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Pagination Dots */}
      {showDots && children.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden="true">
          {children.map((_, i) => (
            <button
              key={i}
              type="button"
              tabIndex={-1}
              onClick={() => scrollToIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === activeIndex
                  ? "w-5 bg-primary shadow-soft-xs"
                  : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50",
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
