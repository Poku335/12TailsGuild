"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchResult } from "@/backend/types";

const categoryLabel: Record<SearchResult["category"], string> = {
  info: "Info",
  party: "Party",
  market: "Market",
  receipt: "Receipt",
  storage: "Storage",
};

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const backdropMouseDownRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
    else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`,
      ).catch(() => null);
      const data = res?.ok
        ? ((await res.json()) as { results: SearchResult[] })
        : { results: [] };
      setResults(data.results);
      setLoading(false);
    }, 300);
  }, [query]);

  const goToSearch = () => {
    if (query.trim().length < 2) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") goToSearch();
  };

  if (!open)
    return (
      <button
        className="btn px-3 flex items-center gap-2 text-sm"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="ค้นหา"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-.69 3.81a5 5 0 1 1 1.06-1.06l2.69 2.69a.75.75 0 1 1-1.06 1.06l-2.69-2.69Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          />
        </svg>
        <span className="hidden sm:inline" style={{ color: "var(--subtext)" }}>
          ค้นหา
        </span>
      </button>
    );

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.category] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh] px-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => {
        backdropMouseDownRef.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (backdropMouseDownRef.current && e.target === e.currentTarget)
          setOpen(false);
      }}
    >
      <div
        className="guild-card w-full max-w-xl overflow-hidden"
        style={{
          background: "var(--card)",
          maxHeight: "70vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          className="flex items-center gap-3 border-b px-4 py-3"
          style={{ borderColor: "var(--line)" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 15 15"
            fill="none"
            style={{ color: "var(--subtext)", flexShrink: 0 }}
          >
            <path
              d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-.69 3.81a5 5 0 1 1 1.06-1.06l2.69 2.69a.75.75 0 1 1-1.06 1.06l-2.69-2.69Z"
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
            />
          </svg>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-base outline-none"
            placeholder="ค้นหา..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          {loading && (
            <span className="spinner" style={{ width: 14, height: 14 }} />
          )}
          <button
            className="pill px-2 py-0.5 text-xs"
            type="button"
            onClick={() => setOpen(false)}
          >
            Esc
          </button>
        </div>

        <div className="overflow-y-auto">
          {query.length >= 2 && !loading && results.length === 0 && (
            <p
              className="px-5 py-8 text-center text-sm"
              style={{ color: "var(--subtext)" }}
            >
              ไม่พบผลลัพธ์สำหรับ &ldquo;{query}&rdquo;
            </p>
          )}

          {query.length < 2 && (
            <p
              className="px-5 py-8 text-center text-sm"
              style={{ color: "var(--subtext)" }}
            >
              พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหา
            </p>
          )}

          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <p
                className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--subtext)" }}
              >
                {categoryLabel[cat as SearchResult["category"]]}
              </p>
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex w-full items-center gap-3 px-4 py-2.5"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-9 w-9 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="h-9 w-9 rounded-lg flex-shrink-0"
                      style={{ background: "var(--card-strong)" }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.title}</p>
                    {item.subtitle && (
                      <p className="truncate text-xs mt-0.5" style={{ color: "var(--subtext)" }}>
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                  <span className="pill text-[10px] px-2 py-0.5 flex-shrink-0">
                    {categoryLabel[item.category]}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {query.length >= 2 && (
          <div
            className="border-t px-4 py-2.5 flex items-center justify-between"
            style={{ borderColor: "var(--line)" }}
          >
            <span className="text-[11px]" style={{ color: "var(--subtext)" }}>
              {results.length > 0 ? `พบ ${results.length} รายการ` : ""}
            </span>
            <button
              type="button"
              className="btn btn-primary text-xs px-3 py-1"
              style={{ minHeight: "unset", borderRadius: "8px" }}
              onClick={goToSearch}
            >
              ค้นหาทั้งหมด →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
