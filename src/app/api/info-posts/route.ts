import { NextRequest, NextResponse } from "next/server";
import { isAdmin, readSessionToken, SESSION_COOKIE_NAME } from "@/backend/auth/session";
import { createInfoPost, listInfoPosts } from "@/backend/repositories/guildRepository";

export async function GET() {
  return NextResponse.json(await listInfoPosts());
}

export async function POST(request: NextRequest) {
  const user = readSessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const post = await createInfoPost({
    title: body.title,
    description: body.description,
    tag: body.tag ?? "Guide",
    author: user?.globalName ?? user?.username ?? "Unknown",
    imageUrl: body.imageUrl ?? null,
    imageWidth: body.imageWidth ? Number(body.imageWidth) : null,
    imageHeight: body.imageHeight ? Number(body.imageHeight) : null,
  });
  return NextResponse.json(post, { status: 201 });
}
