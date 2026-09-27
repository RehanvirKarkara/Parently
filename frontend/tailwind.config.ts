import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const brand = {
  50: "#EEEEFF",
  100: "#E0E0FF",
  200: "#C5C4FF",
  300: "#A3A1FF",
  400: "#8480FF",
  500: "#6C63FF",
  600: "#5B52E8",
  700: "#4A44CC",
  800: "#3A35A8",
  900: "#2D2882",
  950: "#1E1B5E",
};

const mint = {
  50: "#ECFDF5",
  100: "#D1FAE5",
  200: "#A7F3D0",
  300: "#6EE7B7",
  400: "#34D399",
  500: "#22C55E",
  600: "#16A34A",
  700: "#15803D",
  800: "#166534",
  900: "#14532D",
};

const coral = {
  50: "#FFF5F0",
  100: "#FFE8DE",
  200: "#FFCDB8",
  300: "#FFAB8A",
  400: "#FF8A65",
  500: "#FF6B45",
  600: "#F05A2E",
  700: "#D84A1E",
  800: "#B83912",
  900: "#962C0D",
};

const amber = {
  50: "#FFFBEB",
  100: "#FEF3C7",
  200: "#FDE68A",
  300: "#FCD34D",
  400: "#FBBF24",
  500: "#F59E0B",
  600: "#D97706",
  700: "#B45309",
  800: "#92400E",
  900: "#78350F",
};

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Text", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["ui-rounded", "-apple-system", "BlinkMacSystemFont", "SF Pro Display", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          hover: "hsl(var(--primary-hover))",
          foreground: "hsl(var(--primary-foreground))",
          light: "hsl(var(--primary-light))",
          ...brand,
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          ...mint,
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          ...coral,
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          ...amber,
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        surface: "hsl(var(--surface))",
        "secondary-accent": "hsl(var(--secondary-accent))",
        brand,
        mint,
        coral,
        amber,
      },
      borderRadius: {
        "4xl": "2rem",
        "3xl": "1.5rem",
        "2xl": "1rem",
        xl: "0.75rem",
        lg: "0.625rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      boxShadow: {
        "soft-xs": "var(--shadow-soft-xs)",
        "soft-sm": "var(--shadow-soft-sm)",
        soft: "var(--shadow-soft)",
        "soft-md": "var(--shadow-soft-md)",
        "soft-lg": "var(--shadow-soft-lg)",
        "soft-xl": "var(--shadow-soft-xl)",
        brand: "var(--shadow-brand)",
        "brand-md": "var(--shadow-brand-md)",
        "brand-lg": "var(--shadow-brand-lg)",
        "brand-xl": "var(--shadow-brand-xl)",
        mint: "var(--shadow-mint)",
        "mint-lg": "var(--shadow-mint-lg)",
        coral: "var(--shadow-coral)",
        inner: "inset 0 1px 2px hsl(var(--foreground) / 0.08)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary-accent)) 100%)",
        "gradient-hero": "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(258 78% 60%) 52%, hsl(var(--secondary-accent)) 100%)",
        "gradient-mint": "linear-gradient(135deg, hsl(var(--secondary)) 0%, hsl(162 62% 32%) 100%)",
        "gradient-coral": "linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(6 72% 45%) 100%)",
        "gradient-surface": "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)",
        "gradient-card": "linear-gradient(145deg, hsl(var(--card) / 0.98) 0%, hsl(var(--background) / 0.88) 100%)",
        "gradient-radial-brand": "radial-gradient(circle at top right, hsl(var(--primary) / 0.12) 0%, transparent 70%)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-down": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-left": {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "scale-out": {
          from: { opacity: "1", transform: "scale(1)" },
          to: { opacity: "0", transform: "scale(0.98)" },
        },
        "scale-in-bounce": {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "70%": { transform: "scale(1.04)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "dialog-in": {
          from: { opacity: "0", transform: "translate(-50%, -48%) scale(0.96)" },
          to: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        "dialog-out": {
          from: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
          to: { opacity: "0", transform: "translate(-50%, -48%) scale(0.98)" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(108, 99, 255, 0.15)" },
          "50%": { boxShadow: "0 0 32px rgba(108, 99, 255, 0.32)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.5" },
          "100%": { transform: "scale(1.7)", opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%": { transform: "translateY(-8px) rotate(1deg)" },
          "66%": { transform: "translateY(-4px) rotate(-1deg)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "dots-bounce": {
          "0%, 80%, 100%": { transform: "scale(0.6)", opacity: "0.4" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "fade-up": "fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-down": "fade-down 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-left": "fade-left 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-out": "fade-out 0.18s ease-out both",
        "scale-in": "scale-in 0.22s cubic-bezier(0.22, 1, 0.36, 1) both",
        "scale-out": "scale-out 0.18s ease-in both",
        "scale-in-bounce": "scale-in-bounce 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "dialog-in": "dialog-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both",
        "dialog-out": "dialog-out 0.18s cubic-bezier(0.4, 0, 1, 1) both",
        shimmer: "shimmer 1.8s linear infinite",
        "pulse-soft": "pulse-soft 2.5s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "pulse-ring": "pulse-ring 1.8s ease-out infinite",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float-slow 8s ease-in-out infinite",
        "spin-slow": "spin-slow 10s linear infinite",
        gradient: "gradient-shift 6s ease infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "dots-bounce": "dots-bounce 1.4s ease-in-out infinite",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      transitionDuration: {
        "400": "400ms",
      },
      opacity: {
        "3": ".03",
        "8": ".08",
        "12": ".12",
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
