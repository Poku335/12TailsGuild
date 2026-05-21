import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { readSessionToken, SESSION_COOKIE_NAME } from "@/backend/auth/session";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const user = readSessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const filename = `${crypto.randomUUID()}.${ext}`;

  const blob = await put(filename, file, { access: "public" });

  return NextResponse.json({ url: blob.url });
}
