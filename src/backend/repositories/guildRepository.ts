import { getPool, hasDatabase } from "@/backend/db";
import type { InfoPost, MarketPost, PartyPost, ReceiptCard, SearchResult, StorageCard, StorageItem, StorageRequest } from "@/backend/types";
import { infoPosts, marketPosts, partyPosts, receiptCards, storageCards, storageItems, storageRequests } from "@/frontend/data/mockGuild";
import type { QueryResultRow } from "pg";

async function queryRows<T extends QueryResultRow>(sql: string, values?: unknown[]) {
  if (!hasDatabase()) return null;

  try {
    const { rows } = await getPool().query<T>(sql, values);
    return rows;
  } catch (error) {
    console.warn("Database unavailable, using mock data instead.", error);
    return null;
  }
}

const createdLabel = (value: Date | string | null) => {
  if (!value) return "ล่าสุด";
  const date = value instanceof Date ? value : new Date(value);
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "ล่าสุด";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  return `${Math.round(minutes / 60)} ชม.ที่แล้ว`;
};

export async function listInfoPosts(): Promise<InfoPost[]> {
  const rows = await queryRows<{
    id: number;
    title: string;
    description: string;
    tag: string;
    author: string;
    image_style: string | null;
    image_url: string | null;
    image_width: number | null;
    image_height: number | null;
  }>("select id, title, description, tag, author, image_style, image_url, image_width, image_height from info_posts order by created_at desc");
  if (!rows) return infoPosts;
  return rows.map((row) => ({
    id: String(row.id),
    title: row.title,
    description: row.description,
    tag: row.tag,
    author: row.author,
    imageStyle: row.image_style ?? "linear-gradient(135deg, rgba(124,92,255,.86), rgba(79,209,197,.48))",
    imageUrl: row.image_url,
    imageWidth: row.image_width,
    imageHeight: row.image_height,
  }));
}

export async function createInfoPost(input: {
  title: string;
  description: string;
  tag: string;
  author: string;
  imageUrl?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
}): Promise<InfoPost> {
  const fallbackStyle = "linear-gradient(135deg, rgba(124,92,255,.86), rgba(79,209,197,.48))";
  if (!hasDatabase()) return { ...input, id: crypto.randomUUID(), imageStyle: fallbackStyle };
  const rows = await queryRows<{
    id: number; title: string; description: string; tag: string; author: string;
    image_style: string | null; image_url: string | null; image_width: number | null; image_height: number | null;
  }>(
    "insert into info_posts (title, description, tag, author, image_url, image_width, image_height) values ($1, $2, $3, $4, $5, $6, $7) returning id, title, description, tag, author, image_style, image_url, image_width, image_height",
    [input.title, input.description, input.tag, input.author, input.imageUrl ?? null, input.imageWidth ?? null, input.imageHeight ?? null],
  );
  if (!rows?.[0]) return { ...input, id: crypto.randomUUID(), imageStyle: fallbackStyle };
  const row = rows[0];
  return { id: String(row.id), title: row.title, description: row.description, tag: row.tag, author: row.author, imageStyle: row.image_style ?? fallbackStyle, imageUrl: row.image_url, imageWidth: row.image_width, imageHeight: row.image_height };
}

export async function listPartyPosts(): Promise<PartyPost[]> {
  const rows = await queryRows<{
    id: number; user_name: string; title: string; description: string;
    type: PartyPost["type"]; status: PartyPost["status"]; created_at: Date;
    image_url: string | null; image_width: number | null; image_height: number | null;
  }>("select id, user_name, title, description, type, status, created_at, image_url, image_width, image_height from party_posts order by created_at desc");
  if (!rows) return partyPosts;
  return rows.map((row) => ({
    id: String(row.id), user: row.user_name, title: row.title, desc: row.description,
    type: row.type, status: row.status, time: createdLabel(row.created_at),
    imageUrl: row.image_url, imageWidth: row.image_width, imageHeight: row.image_height,
  }));
}

export async function createPartyPost(input: Omit<PartyPost, "id" | "time" | "status">): Promise<PartyPost> {
  if (!hasDatabase()) return { ...input, id: crypto.randomUUID(), status: "OPEN", time: "ล่าสุด" };
  const rows = await queryRows<{
    id: number; user_name: string; title: string; description: string;
    type: PartyPost["type"]; status: PartyPost["status"]; created_at: Date;
    image_url: string | null; image_width: number | null; image_height: number | null;
  }>(
    "insert into party_posts (user_name, title, description, type, status, image_url, image_width, image_height) values ($1, $2, $3, $4, 'OPEN', $5, $6, $7) returning id, user_name, title, description, type, status, created_at, image_url, image_width, image_height",
    [input.user, input.title, input.desc ?? null, input.type ?? "Party", input.imageUrl ?? null, input.imageWidth ?? null, input.imageHeight ?? null],
  );
  if (!rows?.[0]) return { ...input, id: crypto.randomUUID(), status: "OPEN", time: "ล่าสุด" };
  const row = rows[0];
  return { id: String(row.id), user: row.user_name, title: row.title, desc: row.description, type: row.type, status: row.status, time: createdLabel(row.created_at), imageUrl: row.image_url, imageWidth: row.image_width, imageHeight: row.image_height };
}

export async function listMarketPosts(): Promise<MarketPost[]> {
  const rows = await queryRows<{
    id: number; user_name: string; post_type: MarketPost["type"]; item_name: string; price: number; created_at: Date;
    image_url: string | null; image_width: number | null; image_height: number | null;
  }>("select id, user_name, post_type, item_name, price, created_at, image_url, image_width, image_height from market_posts order by created_at desc");
  if (!rows) return marketPosts;
  return rows.map((row) => ({
    id: String(row.id), user: row.user_name, type: row.post_type, item: row.item_name,
    price: Number(row.price), time: createdLabel(row.created_at),
    imageUrl: row.image_url, imageWidth: row.image_width, imageHeight: row.image_height,
  }));
}

export async function createMarketPost(input: Omit<MarketPost, "id" | "time">): Promise<MarketPost> {
  if (!hasDatabase()) return { ...input, id: crypto.randomUUID(), time: "ล่าสุด" };
  const rows = await queryRows<{
    id: number; user_name: string; post_type: MarketPost["type"]; item_name: string; price: number; created_at: Date;
    image_url: string | null; image_width: number | null; image_height: number | null;
  }>(
    "insert into market_posts (user_name, post_type, item_name, price, image_url, image_width, image_height) values ($1, $2, $3, $4, $5, $6, $7) returning id, user_name, post_type, item_name, price, created_at, image_url, image_width, image_height",
    [input.user, input.type, input.item, input.price, input.imageUrl ?? null, input.imageWidth ?? null, input.imageHeight ?? null],
  );
  if (!rows?.[0]) return { ...input, id: crypto.randomUUID(), time: "ล่าสุด" };
  const row = rows[0];
  return { id: String(row.id), user: row.user_name, type: row.post_type, item: row.item_name, price: Number(row.price), time: createdLabel(row.created_at), imageUrl: row.image_url, imageWidth: row.image_width, imageHeight: row.image_height };
}

export async function listReceiptCards(): Promise<ReceiptCard[]> {
  const rows = await queryRows<{
    id: number; title: string; description: string | null;
    image_url: string; image_width: number; image_height: number;
    created_by: string; created_at: Date;
  }>("select id, title, description, image_url, image_width, image_height, created_by, created_at from receipt_cards order by created_at desc");
  if (!rows) return receiptCards;
  return rows.map((row) => ({
    id: String(row.id), title: row.title, description: row.description,
    imageUrl: row.image_url, imageWidth: Number(row.image_width), imageHeight: Number(row.image_height),
    createdBy: row.created_by, createdAt: createdLabel(row.created_at),
  }));
}

export async function createReceiptCard(input: {
  title: string;
  description?: string | null;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  createdBy: string;
}): Promise<ReceiptCard> {
  if (!hasDatabase()) return { ...input, id: crypto.randomUUID(), description: input.description ?? null, createdAt: "ล่าสุด" };
  const rows = await queryRows<{
    id: number; title: string; description: string | null;
    image_url: string; image_width: number; image_height: number; created_by: string; created_at: Date;
  }>(
    "insert into receipt_cards (title, description, image_url, image_width, image_height, created_by) values ($1, $2, $3, $4, $5, $6) returning id, title, description, image_url, image_width, image_height, created_by, created_at",
    [input.title, input.description ?? null, input.imageUrl, input.imageWidth, input.imageHeight, input.createdBy],
  );
  if (!rows?.[0]) return { ...input, id: crypto.randomUUID(), description: input.description ?? null, createdAt: "ล่าสุด" };
  const row = rows[0];
  return { id: String(row.id), title: row.title, description: row.description, imageUrl: row.image_url, imageWidth: Number(row.image_width), imageHeight: Number(row.image_height), createdBy: row.created_by, createdAt: createdLabel(row.created_at) };
}

export async function listStorageCards(): Promise<StorageCard[]> {
  const rows = await queryRows<{
    id: number; title: string; description: string | null; tag: string;
    image_url: string | null; image_width: number; image_height: number;
    caption: string | null; created_by: string; created_at: Date;
  }>("select id, title, description, tag, image_url, image_width, image_height, caption, created_by, created_at from storage_cards order by created_at desc");
  if (!rows) return storageCards;
  return rows.map((row) => ({
    id: String(row.id), title: row.title ?? "", description: row.description, tag: row.tag ?? "normal",
    imageUrl: row.image_url, imageWidth: row.image_width ? Number(row.image_width) : null,
    imageHeight: row.image_height ? Number(row.image_height) : null,
    caption: row.caption, createdBy: row.created_by, createdAt: createdLabel(row.created_at),
  }));
}

export async function createStorageCard(input: {
  title: string; description?: string | null; tag?: string;
  imageUrl?: string | null; imageWidth?: number | null; imageHeight?: number | null;
  caption?: string | null; createdBy: string;
}): Promise<StorageCard> {
  if (!hasDatabase()) return {
    id: crypto.randomUUID(), title: input.title, description: input.description ?? null,
    tag: input.tag ?? "normal", imageUrl: input.imageUrl ?? null, imageWidth: input.imageWidth ?? null,
    imageHeight: input.imageHeight ?? null, caption: input.caption ?? null, createdBy: input.createdBy, createdAt: "ล่าสุด",
  };
  const rows = await queryRows<{
    id: number; title: string; description: string | null; tag: string;
    image_url: string | null; image_width: number; image_height: number; caption: string | null; created_by: string; created_at: Date;
  }>(
    "insert into storage_cards (title, description, tag, image_url, image_width, image_height, caption, created_by) values ($1, $2, $3, $4, $5, $6, $7, $8) returning id, title, description, tag, image_url, image_width, image_height, caption, created_by, created_at",
    [input.title, input.description ?? null, input.tag ?? "normal", input.imageUrl ?? null, input.imageWidth ?? 0, input.imageHeight ?? 0, input.caption ?? null, input.createdBy],
  );
  if (!rows?.[0]) return {
    id: crypto.randomUUID(), title: input.title, description: input.description ?? null,
    tag: input.tag ?? "normal", imageUrl: input.imageUrl ?? null, imageWidth: input.imageWidth ?? null,
    imageHeight: input.imageHeight ?? null, caption: input.caption ?? null, createdBy: input.createdBy, createdAt: "ล่าสุด",
  };
  const row = rows[0];
  return {
    id: String(row.id), title: row.title, description: row.description, tag: row.tag,
    imageUrl: row.image_url, imageWidth: row.image_width ? Number(row.image_width) : null,
    imageHeight: row.image_height ? Number(row.image_height) : null,
    caption: row.caption, createdBy: row.created_by, createdAt: createdLabel(row.created_at),
  };
}

export async function listStorageItems(): Promise<StorageItem[]> {
  const rows = await queryRows<{ id: number; item_name: string; amount: number }>("select id, item_name, amount from storage_items order by item_name asc");
  if (!rows) return storageItems;
  return rows.map((row) => ({ id: String(row.id), name: row.item_name, amount: Number(row.amount) }));
}

export async function listStorageRequests(): Promise<StorageRequest[]> {
  const rows = await queryRows<{
    id: number; user_name: string; item_name: string; request_type: StorageRequest["type"];
    price: number | null; amount: number; status: string;
    confirmed_by: string | null; confirmed_at: Date | null; created_at: Date;
  }>("select id, user_name, item_name, request_type, price, amount, status, confirmed_by, confirmed_at, created_at from storage_requests order by created_at desc");
  if (!rows) return storageRequests;
  return rows.map((row) => ({
    id: String(row.id), user: row.user_name, item: row.item_name, type: row.request_type,
    price: row.price ? Number(row.price) : undefined, amount: Number(row.amount),
    status: (row.status === "confirmed" ? "confirmed" : "pending") as StorageRequest["status"],
    confirmedBy: row.confirmed_by,
    confirmedAt: row.confirmed_at ? createdLabel(row.confirmed_at) : null,
    createdAt: createdLabel(row.created_at),
  }));
}

export async function createStorageRequest(input: Omit<StorageRequest, "id" | "user" | "status" | "confirmedBy" | "confirmedAt" | "createdAt"> & { user?: string }): Promise<StorageRequest> {
  const request = { ...input, user: input.user ?? "kamibtood" };
  if (!hasDatabase()) return { ...request, id: crypto.randomUUID(), status: "pending" };
  const rows = await queryRows<{
    id: number; user_name: string; item_name: string; request_type: StorageRequest["type"]; price: number | null; amount: number; created_at: Date;
  }>(
    "insert into storage_requests (user_name, item_name, request_type, price, amount) values ($1, $2, $3, $4, $5) returning id, user_name, item_name, request_type, price, amount, created_at",
    [request.user, request.item, request.type, request.price ?? null, request.amount],
  );
  if (!rows?.[0]) return { ...request, id: crypto.randomUUID(), status: "pending" };
  const row = rows[0];
  return {
    id: String(row.id), user: row.user_name, item: row.item_name, type: row.request_type,
    price: row.price ? Number(row.price) : undefined, amount: Number(row.amount),
    status: "pending", createdAt: createdLabel(row.created_at),
  };
}

export async function confirmStorageRequest(id: string, adminName: string): Promise<void> {
  if (!hasDatabase()) return;
  await queryRows(
    "update storage_requests set status = 'confirmed', confirmed_by = $2, confirmed_at = now() where id = $1",
    [id, adminName],
  );
}

export async function deleteStorageRequest(id: string, callerName: string, callerIsAdmin: boolean): Promise<boolean> {
  if (!hasDatabase()) return true;
  const rows = await queryRows<{ id: number }>(
    "delete from storage_requests where id = $1 and (user_name = $2 or $3) returning id",
    [id, callerName, callerIsAdmin],
  );
  return (rows?.length ?? 0) > 0;
}

export async function deletePartyPost(id: string, callerName: string, callerIsAdmin: boolean): Promise<boolean> {
  if (!hasDatabase()) return true;
  const rows = await queryRows<{ id: number }>(
    "delete from party_posts where id = $1 and (user_name = $2 or $3) returning id",
    [id, callerName, callerIsAdmin],
  );
  return (rows?.length ?? 0) > 0;
}

export async function deleteMarketPost(id: string, callerName: string, callerIsAdmin: boolean): Promise<boolean> {
  if (!hasDatabase()) return true;
  const rows = await queryRows<{ id: number }>(
    "delete from market_posts where id = $1 and (user_name = $2 or $3) returning id",
    [id, callerName, callerIsAdmin],
  );
  return (rows?.length ?? 0) > 0;
}

export async function deleteInfoPost(id: string): Promise<void> {
  if (!hasDatabase()) return;
  await queryRows("delete from info_posts where id = $1", [id]);
}

export async function deleteReceiptCard(id: string): Promise<void> {
  if (!hasDatabase()) return;
  await queryRows("delete from receipt_cards where id = $1", [id]);
}

export async function deleteStorageCard(id: string): Promise<void> {
  if (!hasDatabase()) return;
  await queryRows("delete from storage_cards where id = $1", [id]);
}

export async function searchAll(q: string, limitPerCategory = 20): Promise<SearchResult[]> {
  if (!hasDatabase() || q.length < 2) return [];
  const pattern = `%${q}%`;
  const pool = getPool();
  const [info, party, market, receipt, storage] = await Promise.all([
    pool.query<{ id: number; title: string; description: string; image_url: string | null }>(
      `select id, title, description, image_url from info_posts where title ilike $1 or description ilike $1 order by created_at desc limit $2`,
      [pattern, limitPerCategory],
    ).catch(() => ({ rows: [] })),
    pool.query<{ id: number; title: string; description: string; image_url: string | null }>(
      `select id, title, description, image_url from party_posts where title ilike $1 or description ilike $1 order by created_at desc limit $2`,
      [pattern, limitPerCategory],
    ).catch(() => ({ rows: [] })),
    pool.query<{ id: number; item_name: string; post_type: string; price: number; image_url: string | null }>(
      `select id, item_name, post_type, price, image_url from market_posts where item_name ilike $1 order by created_at desc limit $2`,
      [pattern, limitPerCategory],
    ).catch(() => ({ rows: [] })),
    pool.query<{ id: number; title: string; description: string | null; image_url: string }>(
      `select id, title, description, image_url from receipt_cards where title ilike $1 or description ilike $1 order by created_at desc limit $2`,
      [pattern, limitPerCategory],
    ).catch(() => ({ rows: [] })),
    pool.query<{ id: number; title: string; description: string | null; caption: string | null; image_url: string | null }>(
      `select id, title, description, caption, image_url from storage_cards where title ilike $1 or description ilike $1 or caption ilike $1 order by created_at desc limit $2`,
      [pattern, limitPerCategory],
    ).catch(() => ({ rows: [] })),
  ]);
  return [
    ...info.rows.map((r) => ({ id: String(r.id), category: "info" as const, title: r.title, subtitle: r.description || null, href: "/info", imageUrl: r.image_url })),
    ...party.rows.map((r) => ({ id: String(r.id), category: "party" as const, title: r.title, subtitle: r.description || null, href: "/party", imageUrl: r.image_url })),
    ...market.rows.map((r) => ({ id: String(r.id), category: "market" as const, title: r.item_name, subtitle: `${r.post_type} · ${Number(r.price).toLocaleString()} บาท`, href: "/market", imageUrl: r.image_url })),
    ...receipt.rows.map((r) => ({ id: String(r.id), category: "receipt" as const, title: r.title, subtitle: r.description || null, href: "/receipt", imageUrl: r.image_url })),
    ...storage.rows.map((r) => ({ id: String(r.id), category: "storage" as const, title: r.title, subtitle: r.description || r.caption || null, href: "/storage", imageUrl: r.image_url })),
  ];
}

export async function getGuildStats(): Promise<{ members: number; partyPosts: number; storageItems: number }> {
  if (!hasDatabase()) return { members: 0, partyPosts: 0, storageItems: 0 };
  const rows = await queryRows<{ members: string; party_posts: string; storage_items: string }>(
    `select
      (select count(*) from users) as members,
      (select count(*) from party_posts where status = 'OPEN') as party_posts,
      (select count(*) from storage_items) as storage_items`,
  );
  if (!rows?.[0]) return { members: 0, partyPosts: 0, storageItems: 0 };
  const r = rows[0];
  return { members: Number(r.members), partyPosts: Number(r.party_posts), storageItems: Number(r.storage_items) };
}
