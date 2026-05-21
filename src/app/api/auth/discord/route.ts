import { NextRequest, NextResponse } from "next/server";
import { createDiscordAuthorizeUrl, isDiscordAuthConfigured } from "@/backend/auth/discord";
import { createSignedState, OAUTH_STATE_COOKIE_NAME } from "@/backend/auth/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isDiscordAuthConfigured()) {
    return NextResponse.redirect(new URL("/login?error=missing_discord_env", request.url));
  }

  const state = crypto.randomUUID();
  const response = NextResponse.redirect(createDiscordAuthorizeUrl(state, request.url));
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, createSignedState(state), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });
  return response;
}
