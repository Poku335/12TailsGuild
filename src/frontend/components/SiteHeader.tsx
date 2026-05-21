"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { AuthUser } from "@/backend/types";
import GlobalSearch from "@/frontend/components/GlobalSearch";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Info", href: "/info" },
  { label: "Party", href: "/party" },
  { label: "Market", href: "/market" },
  { label: "Receipt", href: "/receipt" },
  { label: "Guild Storage", href: "/storage" },
];

type UserListItem = {
  id: string;
  discordId: string;
  username: string;
  globalName: string | null;
  avatarUrl: string | null;
  role: "user" | "admin";
};

export default function SiteHeader() {
  const pathname = usePathname();
  const [theme, setTheme] = useState("dark");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userList, setUserList] = useState<UserListItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [changingId, setChangingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const saved = localStorage.getItem("guild-theme") ?? "dark";
    document.documentElement.dataset.theme = saved;
    setTheme(saved);

    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data: { user: AuthUser | null }) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("guild-theme", nextTheme);
    setTheme(nextTheme);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  const openAdminPanel = async () => {
    setAdminOpen((prev) => {
      if (prev) return false;
      return true;
    });
    if (!adminOpen && userList.length === 0) {
      setLoadingUsers(true);
      try {
        const res = await fetch("/api/admin/users");
        const data = await res.json() as { users: UserListItem[] };
        setUserList(data.users ?? []);
      } finally {
        setLoadingUsers(false);
      }
    }
  };

  const changeRole = async (targetId: string, newRole: "admin" | "user") => {
    setChangingId(targetId);
    try {
      const res = await fetch(`/api/admin/users/${targetId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        const data = await res.json() as { user: UserListItem };
        setUserList((prev) => prev.map((u) => u.id === targetId ? data.user : u));
      }
    } finally {
      setChangingId(null);
    }
  };

  // close dropdown when clicking outside
  useEffect(() => {
    if (!adminOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAdminOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [adminOpen]);

  return (
    <>
    <header className="topbar">
      <div className="page-shell flex min-h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <img
            src="/angelaz.png"
            alt="12Guide"
            className="h-11 w-11 rounded-full object-cover"
          />
          <span className="leading-tight">
            <strong className="block text-base">12Tails</strong>
            <span className="block text-xs" style={{ color: "var(--subtext)" }}>
              AngelaZ Hub
            </span>
          </span>
        </Link>

        <nav className="desktop-nav flex items-center gap-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              className={`nav-link px-4 py-2 ${pathname === item.href ? "is-active" : ""}`}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <GlobalSearch />
          <button
            className="mobile-menu-btn btn px-3"
            type="button"
            aria-label="เมนู"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            {mobileMenuOpen ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            )}
          </button>
          {user ? (
            <div className="flex items-center gap-2">
              <span
                className="hidden items-center gap-2 text-sm sm:flex"
                style={{ color: "var(--subtext)" }}
              >
                {user.avatarUrl && (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <strong style={{ color: "var(--text)" }}>
                  {user.globalName || user.username}
                </strong>
                <span
                  className={`pill px-2 py-1 text-[11px] ${user.role === "admin" ? "badge-open" : ""}`}
                >
                  {user.role}
                </span>
              </span>

              {user.role === "admin" && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    className={`btn text-sm font-semibold ${adminOpen ? "border-[rgba(124,92,255,0.7)]" : ""}`}
                    type="button"
                    onClick={openAdminPanel}
                  >
                    Admin
                    <svg
                      width="12" height="12" viewBox="0 0 12 12" fill="none"
                      style={{ transition: "transform 140ms", transform: adminOpen ? "rotate(180deg)" : "rotate(0)" }}
                    >
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {adminOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-80 rounded-2xl border p-3"
                      style={{
                        background: "color-mix(in srgb, var(--card) 97%, transparent)",
                        borderColor: "var(--line)",
                        boxShadow: "var(--shadow)",
                        zIndex: 50,
                      }}
                    >
                      <p className="mb-2 px-1 text-xs font-semibold" style={{ color: "var(--subtext)" }}>
                        จัดการสมาชิก
                      </p>
                      {loadingUsers ? (
                        <div className="flex justify-center py-6">
                          <span className="spinner spinner-accent" />
                        </div>
                      ) : (
                        <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
                          {userList.map((u) => (
                            <li
                              key={u.id}
                              className="flex items-center gap-2 rounded-xl px-2 py-1.5"
                              style={{ background: "color-mix(in srgb, var(--card-strong) 60%, transparent)" }}
                            >
                              {u.avatarUrl ? (
                                <img src={u.avatarUrl} alt="" className="h-7 w-7 flex-shrink-0 rounded-full" />
                              ) : (
                                <div className="h-7 w-7 flex-shrink-0 rounded-full" style={{ background: "var(--card-strong)" }} />
                              )}
                              <span className="flex-1 truncate text-sm">
                                {u.globalName || u.username}
                              </span>
                              <span
                                className={`pill px-2 py-0.5 text-[10px] ${u.role === "admin" ? "badge-open" : ""}`}
                              >
                                {u.role}
                              </span>
                              {u.id !== user.id && (
                                changingId === u.id ? (
                                  <span className="spinner" />
                                ) : u.role === "admin" ? (
                                  <button
                                    className="btn-danger-sm"
                                    type="button"
                                    onClick={() => changeRole(u.id, "user")}
                                  >
                                    ถอด
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-primary px-2 py-0.5 text-[11px]"
                                    type="button"
                                    style={{ minHeight: "unset", borderRadius: "8px" }}
                                    onClick={() => changeRole(u.id, "admin")}
                                  >
                                    ยก Admin
                                  </button>
                                )
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button
                className="header-logout btn text-sm font-semibold"
                type="button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              className="header-logout btn btn-primary text-sm font-semibold"
              href="/login"
            >
              Login Discord
            </Link>
          )}
        </div>
      </div>
    </header>

    {/* Mobile nav dropdown */}
    {mobileMenuOpen && (
      <>
        <div
          className="mobile-nav-panel"
          style={{ borderColor: "var(--line)" }}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item${pathname === item.href ? " is-active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div style={{ borderTop: "1px solid var(--line)" }}>
            {user ? (
              <button
                className="mobile-nav-item"
                type="button"
                style={{ width: "100%", justifyContent: "flex-start", borderBottom: "none" }}
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="mobile-nav-item"
                style={{ borderBottom: "none" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Login Discord
              </Link>
            )}
          </div>
        </div>
        <div
          className="mobile-nav-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      </>
    )}
    </>
  );
}
