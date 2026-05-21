import { NextRequest, NextResponse } from "next/server";
import { exchangeDiscordCode, fetchDiscordUser } from "@/backend/auth/discord";
import { createSessionToken, OAUTH_STATE_COOKIE_NAME, SESSION_COOKIE_NAME, verifySignedState } from "@/backend/auth/session";
import { upsertDiscordUser } from "@/backend/repositories/userRepository";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;

  if (url.searchParams.get("error")) {
    return NextResponse.redirect(new URL(`/login?error=${url.searchParams.get("error")}`, request.url));
  }

  if (!code || !verifySignedState(savedState, state)) {
    return NextResponse.redirect(new URL("/login?error=invalid_oauth_state", request.url));
  }

  try {
    const token = await exchangeDiscordCode(code, request.url);
    const discordUser = await fetchDiscordUser(token.access_token);
    const user = await upsertDiscordUser(discordUser);

    const response = NextResponse.redirect(new URL("/?login=success", request.url));
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(user), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL("/login?error=discord_callback_failed", request.url));
  }
}
