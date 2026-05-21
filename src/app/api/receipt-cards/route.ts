import { NextRequest, NextResponse } from "next/server";
import { isAdmin, readSessionToken, SESSION_COOKIE_NAME } from "@/backend/auth/session";
import { createReceiptCard, listReceiptCards } from "@/backend/repositories/guildRepository";

export async function GET() {
  return NextResponse.json(await listReceiptCards());
}

export async function POST(request: NextRequest) {
  const user = readSessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const card = await createReceiptCard({
    title: body.title,
    description: body.description ?? null,
    imageUrl: body.imageUrl,
    imageWidth: Number(body.imageWidth),
    imageHeight: Number(body.imageHeight),
    createdBy: user!.globalName ?? user!.username,
  });
  return NextResponse.json(card, { status: 201 });
}
