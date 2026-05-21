import Link from "next/link";
import SiteHeader from "@/frontend/components/SiteHeader";

export default function GuildHubLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeader />
      {children}
      <footer className="border-t py-8" style={{ borderColor: "var(--line)" }}>
        <div
          className="page-shell flex flex-col justify-between gap-4 text-sm md:flex-row md:items-center"
          style={{ color: "var(--subtext)" }}
        >
          <p>Discord : FamilyMart</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/info">ประกาศ Guide</Link>
            <Link href="/party">หา Party</Link>
            <Link href="/market">เปิดตลาดกิลด์</Link>
            <Link href="/receipt">ตำรา</Link>
            <Link href="/storage">ดูคลังกิลด์</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
