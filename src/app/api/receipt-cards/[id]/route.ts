import { NextRequest, NextResponse } from "next/server";
import { isAdmin, readSessionToken, SESSION_COOKIE_NAME } from "@/backend/auth/session";
import { deleteReceiptCard } from "@/backend/repositories/guildRepository";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = readSessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await deleteReceiptCard(id);
  return NextResponse.json({ ok: true });
}
