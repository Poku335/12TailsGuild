import { NextRequest, NextResponse } from "next/server";
import { readSessionToken, SESSION_COOKIE_NAME } from "@/backend/auth/session";
import { getPool } from "@/backend/db";
import type { UserRole } from "@/backend/types";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = readSessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!actor || actor.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json() as { role?: UserRole };
  const role = body.role;

  if (role !== "admin" && role !== "user") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const result = await getPool().query(
    `update users set role = $1, updated_at = now()
     where id = $2
     returning id, discord_id, username, global_name, avatar_url, role`,
    [role, id],
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const row = result.rows[0];
  return NextResponse.json({
    user: {
      id: String(row.id),
      discordId: row.discord_id,
      username: row.username,
      globalName: row.global_name,
      avatarUrl: row.avatar_url,
      role: row.role,
    },
  });
}
