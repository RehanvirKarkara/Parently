import { useEffect } from "react";
import { motion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export function AppShell() {
  const location = useLocation();

  useEffect(() => {
    const frame = requestAnimationFrame(() => document.getElementById("main-content")?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  return (
    <div className="flex min-h-dvh bg-background bg-mesh-primary">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-soft-lg transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 pb-28 outline-none sm:px-6 sm:py-8 lg:px-8 lg:pb-10"
        >
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
