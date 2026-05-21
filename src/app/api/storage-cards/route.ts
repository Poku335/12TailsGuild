import { NextRequest, NextResponse } from "next/server";
import { isAdmin, readSessionToken, SESSION_COOKIE_NAME } from "@/backend/auth/session";
import { createStorageCard, listStorageCards } from "@/backend/repositories/guildRepository";

export async function GET() {
  return NextResponse.json(await listStorageCards());
}

export async function POST(request: NextRequest) {
  const user = readSessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const card = await createStorageCard({
    title: String(body.title ?? ""),
    description: body.description ?? null,
    tag: body.tag ?? "normal",
    imageUrl: body.imageUrl ?? null,
    imageWidth: body.imageWidth ? Number(body.imageWidth) : null,
    imageHeight: body.imageHeight ? Number(body.imageHeight) : null,
    caption: body.caption ?? null,
    createdBy: user!.globalName ?? user!.username,
  });
  return NextResponse.json(card, { status: 201 });
}
