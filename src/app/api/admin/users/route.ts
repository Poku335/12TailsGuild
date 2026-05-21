import { NextRequest, NextResponse } from "next/server";
import { readSessionToken, SESSION_COOKIE_NAME } from "@/backend/auth/session";
import { getPool } from "@/backend/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = readSessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await getPool().query(
    `select id, discord_id, username, global_name, avatar_url, role
     from users
     order by username asc`,
  );

  const users = result.rows.map((row) => ({
    id: String(row.id),
    discordId: row.discord_id,
    username: row.username,
    globalName: row.global_name,
    avatarUrl: row.avatar_url,
    role: row.role,
  }));

  return NextResponse.json({ users });
}
