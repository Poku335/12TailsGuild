import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/backend/auth/session";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
