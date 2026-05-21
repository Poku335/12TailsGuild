import { createHmac, timingSafeEqual } from "crypto";
import type { AuthUser } from "@/backend/types";

export const SESSION_COOKIE_NAME = "tilas_session";
export const OAUTH_STATE_COOKIE_NAME = "tilas_oauth_state";

const encoder = new TextEncoder();

const base64UrlEncode = (value: string) => Buffer.from(value).toString("base64url");
const base64UrlDecode = (value: string) => Buffer.from(value, "base64url").toString("utf8");

function authSecret() {
  return process.env.AUTH_SECRET || process.env.DISCORD_CLIENT_SECRET || "dev-only-change-me";
}

function sign(value: string) {
  return createHmac("sha256", authSecret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createSessionToken(user: AuthUser) {
  const payload = {
    user,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function readSessionToken(token?: string | null): AuthUser | null {
  if (!token) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature || !safeEqual(signature, sign(encodedPayload))) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as { user?: AuthUser; expiresAt?: number };
    if (!payload.user || !payload.expiresAt || payload.expiresAt < Date.now()) return null;
    return payload.user;
  } catch {
    return null;
  }
}

export function createSignedState(state: string) {
  return `${state}.${sign(state)}`;
}

export function verifySignedState(value: string | undefined, expectedState: string | null) {
  if (!value || !expectedState) return false;
  const [state, signature] = value.split(".");
  return state === expectedState && Boolean(signature) && safeEqual(signature, sign(state));
}

export function isAdmin(user: AuthUser | null) {
  return user?.role === "admin";
}
