import { NextRequest, NextResponse } from "next/server";
import { readSessionToken, SESSION_COOKIE_NAME } from "@/backend/auth/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = readSessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  return NextResponse.json({ user });
}