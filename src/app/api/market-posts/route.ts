import { NextRequest, NextResponse } from "next/server";
import { readSessionToken, SESSION_COOKIE_NAME } from "@/backend/auth/session";
import { createMarketPost, listMarketPosts } from "@/backend/repositories/guildRepository";

export async function GET() {
  return NextResponse.json(await listMarketPosts());
}

export async function POST(request: NextRequest) {
  const user = readSessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const post = await createMarketPost({
    user: user?.globalName ?? user?.username ?? "Unknown",
    type: body.type,
    item: body.item,
    price: Number(body.price),
    imageUrl: body.imageUrl ?? null,
    imageWidth: body.imageWidth ? Number(body.imageWidth) : null,
    imageHeight: body.imageHeight ? Number(body.imageHeight) : null,
  });
  return NextResponse.json(post, { status: 201 });
}
