import type { AuthUser } from "@/backend/types";

const DISCORD_API = "https://discord.com/api/v10";

type DiscordTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
};

type DiscordUserResponse = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
};

export function getAuthBaseUrl(requestUrl?: string) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (requestUrl) return new URL(requestUrl).origin;
  return "http://localhost:5110";
}

export function getDiscordRedirectUri(requestUrl?: string) {
  return `${getAuthBaseUrl(requestUrl)}/api/auth/discord/callback`;
}

export function isDiscordAuthConfigured() {
  return Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET);
}

export function createDiscordAuthorizeUrl(state: string, requestUrl: string) {
  if (!process.env.DISCORD_CLIENT_ID) {
    throw new Error("DISCORD_CLIENT_ID is not set.");
  }

  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", process.env.DISCORD_CLIENT_ID);
  url.searchParams.set("redirect_uri", getDiscordRedirectUri(requestUrl));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify");
  url.searchParams.set("state", state);
  return url;
}

export async function exchangeDiscordCode(code: string, requestUrl: string) {
  if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) {
    throw new Error("Discord OAuth is not configured.");
  }

  const body = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: getDiscordRedirectUri(requestUrl),
  });

  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`Discord token exchange failed: ${response.status}`);
  }

  return (await response.json()) as DiscordTokenResponse;
}

export async function fetchDiscordUser(accessToken: string): Promise<AuthUser> {
  const response = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Discord user request failed: ${response.status}`);
  }

  const user = (await response.json()) as DiscordUserResponse;
  return {
    id: user.id,
    discordId: user.id,
    username: user.username,
    role: "user",
    globalName: user.global_name,
    avatarUrl: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128` : null,
  };
}
