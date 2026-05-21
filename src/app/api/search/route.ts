import { NextRequest, NextResponse } from "next/server";
import { getPool, hasDatabase } from "@/backend/db";
import type { SearchResult } from "@/backend/types";
export type { SearchResult } from "@/backend/types";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  if (!hasDatabase()) return NextResponse.json({ results: [] });

  const pattern = `%${q}%`;
  const pool = getPool();

  const [info, party, market, receipt, storage] = await Promise.all([
    pool.query<{ id: number; title: string; description: string; image_url: string | null }>(
      `select id, title, description, image_url from info_posts where title ilike $1 or description ilike $1 order by created_at desc limit 5`,
      [pattern],
    ).catch(() => ({ rows: [] })),

    pool.query<{ id: number; title: string; description: string; image_url: string | null }>(
      `select id, title, description, image_url from party_posts where title ilike $1 or description ilike $1 order by created_at desc limit 5`,
      [pattern],
    ).catch(() => ({ rows: [] })),

    pool.query<{ id: number; item_name: string; post_type: string; price: number; image_url: string | null }>(
      `select id, item_name, post_type, price, image_url from market_posts where item_name ilike $1 order by created_at desc limit 5`,
      [pattern],
    ).catch(() => ({ rows: [] })),

    pool.query<{ id: number; title: string; description: string | null; image_url: string }>(
      `select id, title, description, image_url from receipt_cards where title ilike $1 or description ilike $1 order by created_at desc limit 5`,
      [pattern],
    ).catch(() => ({ rows: [] })),

    pool.query<{ id: number; title: string; description: string | null; caption: string | null; image_url: string | null }>(
      `select id, title, description, caption, image_url from storage_cards where title ilike $1 or description ilike $1 or caption ilike $1 order by created_at desc limit 5`,
      [pattern],
    ).catch(() => ({ rows: [] })),
  ]);

  const results: SearchResult[] = [
    ...info.rows.map((r) => ({ id: String(r.id), category: "info" as const, title: r.title, subtitle: r.description || null, href: "/info", imageUrl: r.image_url })),
    ...party.rows.map((r) => ({ id: String(r.id), category: "party" as const, title: r.title, subtitle: r.description || null, href: "/party", imageUrl: r.image_url })),
    ...market.rows.map((r) => ({ id: String(r.id), category: "market" as const, title: r.item_name, subtitle: `${r.post_type} · ${Number(r.price).toLocaleString()} บาท`, href: "/market", imageUrl: r.image_url })),
    ...receipt.rows.map((r) => ({ id: String(r.id), category: "receipt" as const, title: r.title, subtitle: r.description || null, href: "/receipt", imageUrl: r.image_url })),
    ...storage.rows.map((r) => ({ id: String(r.id), category: "storage" as const, title: r.title, subtitle: r.description || r.caption || null, href: "/storage", imageUrl: r.image_url })),
  ];

  return NextResponse.json({ results });
}
