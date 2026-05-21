import Link from "next/link";
import { getGuildStats } from "@/backend/repositories/guildRepository";

export default async function GuildHomeHero() {
  const stats = await getGuildStats();

  return (
    <main>
      <section className="guild-hero">
        <div className="hero-panel page-shell">
          <div>
            <p className="eyebrow mb-4 text-sm font-semibold uppercase"></p>
            <h1 className="hero-title font-black">AngelaZ</h1>
            <p
              className="mt-6 max-w-2xl text-lg leading-8"
              style={{ color: "var(--subtext)" }}
            >
              Power By : Kamibtood
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="btn btn-primary font-semibold" href="/party">
                หา Party
              </Link>
              <Link className="btn font-semibold" href="/market">
                เปิดตลาดกิลด์
              </Link>
              <Link className="btn font-semibold" href="/storage">
                ดูคลังกิลด์
              </Link>
            </div>

            <div className="mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="stat-card p-4">
                <div className="text-3xl font-black">{stats.members}</div>
                <div className="text-sm" style={{ color: "var(--subtext)" }}>
                  Members
                </div>
              </div>
              <div className="stat-card p-4">
                <div className="text-3xl font-black">{stats.partyPosts}</div>
                <div className="text-sm" style={{ color: "var(--subtext)" }}>
                  Party Posts
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
