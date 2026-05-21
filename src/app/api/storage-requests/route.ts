import { NextRequest, NextResponse } from "next/server";
import { readSessionToken, SESSION_COOKIE_NAME } from "@/backend/auth/session";
import { createStorageRequest, listStorageRequests } from "@/backend/repositories/guildRepository";

export async function GET() {
  return NextResponse.json(await listStorageRequests());
}

export async function POST(request: NextRequest) {
  const user = readSessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const storageRequest = await createStorageRequest({
    user: user.globalName ?? user.username,
    item: body.item,
    type: body.type,
    price: body.price ? Number(body.price) : undefined,
    amount: Number(body.amount ?? 1),
  });
  return NextResponse.json(storageRequest, { status: 201 });
}
