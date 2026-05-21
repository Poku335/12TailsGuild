import { NextRequest, NextResponse } from "next/server";
import { isAdmin, readSessionToken, SESSION_COOKIE_NAME } from "@/backend/auth/session";
import { deleteMarketPost } from "@/backend/repositories/guildRepository";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = readSessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const callerName = user.globalName ?? user.username;
  const deleted = await deleteMarketPost(id, callerName, user.role === "admin");
  if (!deleted) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ ok: true });
}
