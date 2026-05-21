import { isDiscordAuthConfigured } from "@/backend/auth/discord";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  missing_discord_env:
    "ยังไม่ได้ตั้งค่า DISCORD_CLIENT_ID หรือ DISCORD_CLIENT_SECRET",
  invalid_oauth_state:
    "Session login หมดอายุหรือ state ไม่ตรง ลองกด Login Discord อีกครั้ง",
  discord_callback_failed:
    "Discord callback ล้มเหลว ตรวจ client secret และ redirect URL",
  access_denied: "คุณยกเลิกการอนุญาตจาก Discord",
};

export default async function LoginPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ error?: string }>;
}>) {
  const { error } = await searchParams;
  const isConfigured = isDiscordAuthConfigured();
  const errorMessage = error
    ? (errorMessages[error] ?? `Discord error: ${error}`)
    : null;

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
      style={{ background: "var(--bg)" }}
    >
      {/* Back button */}
      <a
        href="/"
        className="absolute top-5 left-5 flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-opacity hover:opacity-70"
        style={{ color: "var(--subtext)", background: "var(--card)", border: "1px solid var(--line)" }}
      >
        ← กลับ
      </a>

      {/* Card */}
      <div
        className="relative z-10 flex w-full max-w-sm flex-col items-center gap-7 rounded-2xl p-8"
        style={{
          background: "rgba(26,31,43,0.85)",
          border: "1px solid rgba(124,92,255,0.25)",
          boxShadow:
            "0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset",
          backdropFilter: "blur(16px)",
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-8 right-8 h-px rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(124,92,255,0.6), rgba(79,209,197,0.4), transparent)",
          }}
        />

        {/* Icon */}
        <img
          src="/dissss.png"
          alt="Discord"
          className="h-20 w-20 object-contain"
        />

        {/* Text */}
        <div className="text-center">
          <p
            className="mb-1 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            12Tails AgelaZ Hub
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            เข้าสู่ระบบ
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--subtext)" }}>
            เชื่อมต่อด้วยบัญชี Discord ของคุณ
          </p>
        </div>

        {/* Error */}
        {errorMessage && (
          <div
            className="w-full rounded-xl px-4 py-3 text-sm"
            style={{
              border: "1px solid rgba(239,68,68,0.35)",
              background: "rgba(239,68,68,0.10)",
              color: "#fecaca",
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Button */}
        {isConfigured ? (
          <a
            href="/api/auth/discord"
            className="flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #5865F2, #4752c4)",
              color: "#fff",
              boxShadow: "0 4px 16px rgba(88,101,242,0.4)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.003.022.015.045.03.057a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
            เข้าสู่ระบบด้วย Discord
          </a>
        ) : (
          <div
            className="w-full rounded-xl px-4 py-3 text-sm"
            style={{
              border: "1px solid rgba(245,166,35,0.35)",
              background: "rgba(245,166,35,0.10)",
              color: "#f5a623",
            }}
          >
            ตั้งค่า `.env.local` ก่อนใช้งาน Discord Login
          </div>
        )}

        {/* Footer note */}
        <p
          className="text-center text-xs"
          style={{ color: "var(--subtext)" }}
        ></p>
      </div>
    </div>
  );
}
