import { getPool, hasDatabase } from "@/backend/db";
import type { AuthUser, UserRole } from "@/backend/types";

function adminDiscordIds() {
  return (process.env.ADMIN_DISCORD_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function roleForDiscordId(discordId: string): UserRole {
  return adminDiscordIds().includes(discordId) ? "admin" : "user";
}

export async function upsertDiscordUser(user: AuthUser): Promise<AuthUser> {
  const role = roleForDiscordId(user.discordId);
  if (!hasDatabase()) return { ...user, role };

  let rows: {
    id: number;
    discord_id: string;
    username: string;
    role: UserRole;
    global_name: string | null;
    avatar_url: string | null;
  }[];

  try {
    // role on insert = derived from env var (admin or user)
    // role on conflict = keep existing DB role UNLESS env var explicitly grants admin
    const isEnvAdmin = adminDiscordIds().includes(user.discordId);
    const result = await getPool().query(
      `insert into users (discord_id, username, role, global_name, avatar_url)
       values ($1, $2, $3, $4, $5)
       on conflict (discord_id)
       do update set
         username = excluded.username,
         role = case when $6 then 'admin'::text else users.role end,
         global_name = excluded.global_name,
         avatar_url = excluded.avatar_url,
         updated_at = now()
       returning id, discord_id, username, role, global_name, avatar_url`,
      [user.discordId, user.username, role, user.globalName ?? null, user.avatarUrl ?? null, isEnvAdmin],
    );
    rows = result.rows;
  } catch (error) {
    console.warn("Database unavailable, keeping Discord session without persistence.", error);
    return { ...user, role };
  }

  const row = rows[0];
  return {
    id: String(row.id),
    discordId: row.discord_id,
    username: row.username,
    role: row.role,
    globalName: row.global_name,
    avatarUrl: row.avatar_url,
  };
}
