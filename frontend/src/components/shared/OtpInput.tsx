import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  error?: boolean;
}

export function OtpInput({ length = 6, value, onChange, autoFocus = true, disabled, error }: OtpInputProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const setDigit = (index: number, char: string) => {
    const clean = char.replace(/[^0-9]/g, "");
    if (!clean) return;
    const next = value.split("");
    next[index] = clean[clean.length - 1];
    onChange(next.join(""));
    if (index < length - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = value.split("");
      if (next[index]) {
        next[index] = "";
        onChange(next.join(""));
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      refs.current[index + 1]?.focus();
    } else if (/^\d$/.test(e.key)) {
      e.preventDefault();
      setDigit(index, e.key);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, length);
    onChange(text);
    refs.current[Math.min(text.length, length - 1)]?.focus();
  };

  return (
    <div className="grid w-full max-w-sm grid-cols-6 gap-1.5 sm:gap-2.5" onPaste={handlePaste} role="group" aria-label="Six-digit verification code" aria-invalid={error}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label={`Digit ${i + 1}`}
          maxLength={1}
          disabled={disabled}
          aria-invalid={error}
          value={digit}
          onFocus={() => setActiveIndex(i)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onChange={(e) => setDigit(i, e.target.value)}
          className={cn(
            "h-14 min-w-0 w-full rounded-xl border bg-card text-center font-metric text-lg font-semibold text-foreground shadow-soft-xs outline-none transition-[color,background-color,border-color,box-shadow,transform] duration-200 sm:h-16 sm:text-xl",
            error ? "border-destructive ring-4 ring-destructive/10" : "border-input",
            activeIndex === i && !error && "border-primary ring-4 ring-primary/10",
            disabled && "opacity-50",
          )}
        />
      ))}
    </div>
  );
}
