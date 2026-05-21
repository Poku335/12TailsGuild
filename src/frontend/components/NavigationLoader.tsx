"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationLoader() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      document.documentElement.classList.remove("nav-loading");

      // flash to 100% then fade out
      setDone(true);
      setLoading(false);

      doneTimer.current = setTimeout(() => {
        setDone(false);
      }, 400);
    }
    return () => {
      if (doneTimer.current) clearTimeout(doneTimer.current);
    };
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      if (href.startsWith("http") || href.startsWith("//") || href.startsWith("#")) return;
      if (href === pathname) return;

      document.documentElement.classList.add("nav-loading");
      setDone(false);
      setLoading(true);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  if (!loading && !done) return null;

  return (
    <div
      className={`nav-progress-bar${done ? " nav-progress-done" : ""}`}
      aria-hidden="true"
    />
  );
}
