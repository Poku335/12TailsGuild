"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import type { AuthUser, PartyPost } from "@/backend/types";
import ConfirmDialog from "./ConfirmDialog";
import { useToast, ToastList } from "./Toast";
import { uploadImage } from "@/frontend/utils/image";
import { useImageUpload } from "@/frontend/hooks/useImageUpload";

export default function PartyBoard({ initialPosts, user }: Readonly<{ initialPosts: PartyPost[]; user: AuthUser | null }>) {
  const [posts, setPosts] = useState(initialPosts);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmCloseId, setConfirmCloseId] = useState<string | null>(null);
  const { toasts, toast, dismiss } = useToast();
  const { preview, fileRef, handlePaste, handleFileChange, clearFile, getFile } = useImageUpload();

  const closeModal = () => { setShowModal(false); clearFile(); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key !== "Escape") return; setShowModal(false); clearFile(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearFile]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const data = new FormData(e.currentTarget);

    let imageUrl: string | null = null;
    let imageWidth: number | null = null;
    let imageHeight: number | null = null;

    const file = getFile();
    if (file) {
      const result = await uploadImage(file);
      if (result) { imageUrl = result.url; imageWidth = result.width; imageHeight = result.height; }
    }

    const body = { title: data.get("title"), desc: data.get("desc"), type: data.get("type"), imageUrl, imageWidth, imageHeight };
    const res = await fetch("/api/party-posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      const newPost = (await res.json()) as PartyPost;
      setPosts((current) => [newPost, ...current]);
      closeModal();
      toast("โพสต์หา Party สำเร็จแล้ว");
    } else {
      toast("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง", "error");
    }
    setSubmitting(false);
  };

  return (
    <section className="section-pad">
      <div className="page-shell">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="eyebrow text-sm font-semibold uppercase">Party Finder</p>
            <h1 className="section-title mt-3 font-black">หา Party</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {user && (
              <button className="btn btn-primary px-3 py-1.5 text-sm font-semibold" type="button" onClick={() => setShowModal(true)}>
                + สร้างโพสต์
              </button>
            )}
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed" style={{ borderColor: "var(--line)" }}>
            <p className="text-sm" style={{ color: "var(--subtext)" }}>ยังไม่มีโพสต์หา Party{user ? " — กด สร้างโพสต์ เพื่อเริ่มต้น" : ""}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {posts.map((post) => (
              <article key={post.id} className="guild-card flex flex-col overflow-hidden">
                {post.imageUrl ? (
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={post.imageUrl}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    />
                  </div>
                ) : (
                  <div className="aspect-square" style={{ background: "var(--bg)" }} />
                )}
                <div className="p-3">
                  <div className="mb-2 flex items-center justify-between gap-1">
                    <span className="text-xs" style={{ color: "var(--subtext)" }}>By: {post.user}</span>
                    <span className={`pill text-sm px-2 py-0.5 ${post.status === "OPEN" ? "badge-open" : "badge-full"}`}>{post.status}</span>
                  </div>
                  <h2 className="text-base font-bold leading-tight">{post.title}</h2>
                  {post.desc && <p className="mt-2 text-sm leading-5" style={{ color: "var(--subtext)" }}>{post.desc}</p>}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-sm" style={{ color: "var(--subtext)" }}>{post.time}</span>
                    {(user?.username === post.user || user?.globalName === post.user) && (
                      <button
                        className="btn-danger-sm shrink-0"
                        style={{ minWidth: 48 }}
                        type="button"
                        aria-label={`ปิดโพสต์ ${post.title}`}
                        onClick={() => setConfirmCloseId(post.id)}
                      >
                        ปิดโพสต์
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {confirmCloseId && (
        <ConfirmDialog
          message="ต้องการปิดโพสต์นี้ใช่ไหม?"
          onConfirm={async () => {
            const id = confirmCloseId;
            setConfirmCloseId(null);
            const res = await fetch(`/api/party-posts/${id}`, { method: "DELETE" });
            if (res.ok) {
              setPosts((current) => current.filter((item) => item.id !== id));
              toast("ปิดสำเร็จ", "info");
            } else {
              toast("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง", "error");
            }
          }}
          onCancel={() => setConfirmCloseId(null)}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="guild-card w-full max-w-md p-6" style={{ background: "var(--card)", maxHeight: "90vh", overflowY: "auto" }} onPaste={handlePaste}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black">สร้างโพสต์ Party</h2>
              <button className="pill px-3 py-1 text-sm" type="button" onClick={closeModal}>ปิด</button>
            </div>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2">
                <span className="text-sm" style={{ color: "var(--subtext)" }}>ชื่อโพสต์</span>
                <input className="field" name="title" placeholder="เช่น หาเพื่อนลงชาบู" required />
              </label>
              <label className="grid gap-2">
                <span className="text-sm" style={{ color: "var(--subtext)" }}>รายละเอียด (optional)</span>
                <textarea className="field" name="desc" rows={3} placeholder="" style={{ resize: "vertical" }} />
              </label>
              <label className="grid gap-2">
                <span className="text-sm" style={{ color: "var(--subtext)" }}>รูปภาพ (optional) · Ctrl+V วางจากคลิปบอร์ดได้</span>
                <input
                  className="field"
                  type="file"
                  accept="image/*"
                  ref={fileRef}
                  onChange={handleFileChange}
                />
              </label>
              {preview && (
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <img src={preview} alt="preview" className="w-full object-contain" style={{ maxHeight: "200px" }} />
                </div>
              )}
              <button className="btn btn-primary font-semibold" type="submit" disabled={submitting}>
                {submitting ? <><span className="spinner" /> กำลังโพสต์...</> : "โพสต์"}
              </button>
            </form>
          </div>
        </div>
      )}
      <ToastList toasts={toasts} onDismiss={dismiss} />
    </section>
  );
}
