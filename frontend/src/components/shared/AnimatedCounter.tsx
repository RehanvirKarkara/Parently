import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
  duration?: number;
}

/**
 * Smooth animated number counter using Framer Motion spring physics.
 * Used in StatCards, ScoreRing, and dashboard metrics.
 */
export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  className,
  duration = 1.2,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  });
  const isInView = useInView(ref, { once: true, margin: "0px" });
  const formattedValue = `${prefix}${decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toString()}${suffix}`;

  useEffect(() => {
    if (isInView || reduceMotion) {
      motionValue.set(value);
    }
  }, [motionValue, isInView, reduceMotion, value]);

  useEffect(() => {
    if (reduceMotion) {
      if (ref.current) ref.current.textContent = formattedValue;
      return;
    }
    return springValue.on("change", (latest) => {
      if (ref.current) {
        const formatted = decimals > 0
          ? latest.toFixed(decimals)
          : Math.floor(latest).toString();
        ref.current.textContent = `${prefix}${formatted}${suffix}`;
      }
    });
  }, [springValue, prefix, suffix, decimals, reduceMotion, formattedValue]);

  return (
    <>
      <span className="sr-only">{formattedValue}</span>
      <span ref={ref} aria-hidden="true" className={cn("tabular-nums", className)}>
        {reduceMotion ? formattedValue : `${prefix}0${suffix}`}
      </span>
    </>
  );
}
