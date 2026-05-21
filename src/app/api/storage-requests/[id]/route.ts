import { NextRequest, NextResponse } from "next/server";
import { readSessionToken, isAdmin, SESSION_COOKIE_NAME } from "@/backend/auth/session";
import { confirmStorageRequest, deleteStorageRequest } from "@/backend/repositories/guildRepository";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = readSessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const adminName = user!.globalName ?? user!.username;
  await confirmStorageRequest(id, adminName);
  return NextResponse.json({ status: "confirmed", confirmedBy: adminName });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = readSessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const callerName = user.globalName ?? user.username;
  const deleted = await deleteStorageRequest(id, callerName, user.role === "admin");
  if (!deleted) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return new NextResponse(null, { status: 204 });
}
