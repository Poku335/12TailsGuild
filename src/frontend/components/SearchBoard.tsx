"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SearchResult } from "@/backend/types";

type Category = SearchResult["category"] | "all";

const categoryLabel: Record<SearchResult["category"], string> = {
  info: "Info",
  party: "Party",
  market: "Market",
  receipt: "Receipt",
  storage: "Storage",
};

const tabs: { key: Category; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "info", label: "Info" },
  { key: "party", label: "Party" },
  { key: "market", label: "Market" },
  { key: "receipt", label: "Receipt" },
  { key: "storage", label: "Storage" },
];

export default function SearchBoard({
  initialQuery,
  initialResults,
}: Readonly<{ initialQuery: string; initialResults: SearchResult[] }>) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(initialResults);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Category>("all");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      router.replace("/search");
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`).catch(() => null);
      const data = res?.ok ? ((await res.json()) as { results: SearchResult[] }) : { results: [] };
      setResults(data.results);
      setLoading(false);
      router.replace(`/search?q=${encodeURIComponent(query.trim())}`, { scroll: false } as Parameters<typeof router.replace>[1]);
    }, 350);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const filtered = activeTab === "all" ? results : results.filter((r) => r.category === activeTab);

  const countFor = (cat: Category) =>
    cat === "all" ? results.length : results.filter((r) => r.category === cat).length;

  return (
    <section className="section-pad">
      <div className="page-shell">
        <div className="mb-8">
          <p className="eyebrow text-sm font-semibold uppercase">ค้นหา</p>
          <h1 className="section-title mt-3 font-black">ผลการค้นหา</h1>
        </div>

        {/* Search input */}
        <div
          className="guild-card mb-6 flex items-center gap-3 px-4 py-3"
          style={{ background: "var(--card)" }}
        >
          <svg width="16" height="16" viewBox="0 0 15 15" fill="none" style={{ color: "var(--subtext)", flexShrink: 0 }}>
            <path d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-.69 3.81a5 5 0 1 1 1.06-1.06l2.69 2.69a.75.75 0 1 1-1.06 1.06l-2.69-2.69Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
          </svg>
          <input
            className="flex-1 bg-transparent text-base outline-none"
            placeholder="ค้นหา..."
            value={query}
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && <span className="spinner" style={{ width: 14, height: 14 }} />}
          {query && (
            <button
              type="button"
              className="pill px-2 py-0.5 text-xs"
              onClick={() => setQuery("")}
            >
              ล้าง
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const count = countFor(tab.key);
            return (
              <button
                key={tab.key}
                type="button"
                className={`pill px-3 py-1.5 text-sm font-semibold transition-colors ${activeTab === tab.key ? "badge-open" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {query.length >= 2 && (
                  <span
                    className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]"
                    style={{ background: "var(--card-strong)" }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Empty states */}
        {query.length < 2 && (
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed" style={{ borderColor: "var(--line)" }}>
            <p className="text-sm" style={{ color: "var(--subtext)" }}>พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหา</p>
          </div>
        )}

        {query.length >= 2 && !loading && filtered.length === 0 && (
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed" style={{ borderColor: "var(--line)" }}>
            <p className="text-sm" style={{ color: "var(--subtext)" }}>ไม่พบผลลัพธ์สำหรับ &ldquo;{query}&rdquo;</p>
          </div>
        )}

        {/* Results grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((item) => (
              <Link
                key={`${item.category}-${item.id}`}
                href={item.href}
                className="guild-card overflow-hidden transition-transform hover:scale-[1.02]"
              >
                {item.imageUrl ? (
                  <div className="relative overflow-hidden border-b" style={{ borderColor: "var(--line)", height: "160px" }}>
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    />
                  </div>
                ) : (
                  <div className="border-b" style={{ borderColor: "var(--line)", height: "80px", background: "var(--card-strong)" }} />
                )}
                <div className="p-3">
                  <span className="pill text-[10px] px-2 py-0.5 mb-2 inline-block">
                    {categoryLabel[item.category]}
                  </span>
                  <p className="truncate text-sm font-bold">{item.title}</p>
                  {item.subtitle && (
                    <p className="mt-1 truncate text-xs leading-5" style={{ color: "var(--subtext)" }}>
                      {item.subtitle}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
