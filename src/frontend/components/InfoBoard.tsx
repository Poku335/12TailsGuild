"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import type { AuthUser, InfoPost } from "@/backend/types";
import ConfirmDialog from "./ConfirmDialog";
import { useToast, ToastList } from "./Toast";
import { uploadImage } from "@/frontend/utils/image";
import { useImageUpload } from "@/frontend/hooks/useImageUpload";

const FALLBACK_STYLE = "linear-gradient(135deg, rgba(124,92,255,.86), rgba(79,209,197,.48))";

export default function InfoBoard({ posts: initialPosts, user }: Readonly<{ posts: InfoPost[]; user: AuthUser | null }>) {
  const [posts, setPosts] = useState(initialPosts);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [wideCard, setWideCard] = useState(false);
  const [selected, setSelected] = useState<InfoPost | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toasts, toast, dismiss } = useToast();
  const { preview, fileRef, handlePaste, handleFileChange, clearFile, getFile } = useImageUpload();

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key !== "Escape") return; setSelected(null); setShowModal(false); clearFile(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearFile]);

  const closeModal = () => { setShowModal(false); clearFile(); setWideCard(false); };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    const data = new FormData(form);

    let uploadedUrl: string | null = null;
    let uploadedWidth: number | null = null;
    let uploadedHeight: number | null = null;

    const file = getFile();
    if (file) {
      const result = await uploadImage(file);
      if (result) { uploadedUrl = result.url; uploadedWidth = result.width; uploadedHeight = result.height; }
    }

    const body = {
      title: data.get("title"),
      description: data.get("description"),
      tag: wideCard ? "wide" : "normal",
      imageUrl: uploadedUrl,
      imageWidth: uploadedWidth,
      imageHeight: uploadedHeight,
    };

    const res = await fetch("/api/info-posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      const newPost = await res.json() as InfoPost;
      setPosts((current) => [newPost, ...current]);
      closeModal();
      toast("โพสต์สำเร็จแล้ว");
    } else {
      toast("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง", "error");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setConfirmDeleteId(null);
    const res = await fetch(`/api/info-posts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPosts((current) => current.filter((p) => p.id !== id));
      if (selected?.id === id) setSelected(null);
      toast("ลบสำเร็จ", "info");
    } else {
      toast("ลบไม่สำเร็จ ลองใหม่อีกครั้ง", "error");
    }
    setDeletingId(null);
  };

  return (
    <section className="section-pad">
      <div className="page-shell">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="eyebrow text-sm font-semibold uppercase">Info Section</p>
            <h1 className="section-title mt-3 font-black">ประกาศ &amp; Guide</h1>
          </div>
          {isAdmin && (
            <button className="btn btn-primary font-semibold" type="button" onClick={() => setShowModal(true)}>
              + สร้างโพสต์ Info
            </button>
          )}
        </div>

        <div className="masonry">
          {posts.map((post) => {
            const isWide = post.tag === "wide";
            return (
              <article
                key={post.id}
                className={`guild-card cursor-pointer overflow-hidden flex flex-col ${isWide ? "sm:flex-row" : ""}`}
                style={isWide ? { columnSpan: "all" } : undefined}
                onClick={() => setSelected(post)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setSelected(post)}
              >
                {post.imageUrl ? (
                  <div
                    className={`art-frame shrink-0 overflow-hidden ${isWide ? "h-52 w-full sm:h-[22rem] sm:w-3/4" : "h-44 w-full"}`}
                    style={{ background: "var(--bg)" }}
                  >
                    <Image
                      src={post.imageUrl}
                      alt={post.title}
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 75vw, 50vw"
                    />
                  </div>
                ) : (
                  <div
                    className={`art-frame shrink-0 ${isWide ? "h-52 w-full sm:h-[22rem] sm:w-3/4" : "h-44 w-full"}`}
                    style={{ background: post.imageStyle || FALLBACK_STYLE }}
                  />
                )}
                <div className={`p-4 flex flex-col justify-between ${isWide ? "sm:flex-1" : ""}`}>
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-xs" style={{ color: "var(--subtext)" }}>By: {post.author}</span>
                      {isAdmin && (
                        <button
                          className="btn-danger-sm"
                          style={{ minWidth: 48 }}
                          type="button"
                          aria-label={`ลบโพสต์ ${post.title}`}
                          disabled={deletingId === post.id}
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(post.id); }}
                        >
                          {deletingId === post.id ? <span className="spinner" /> : "ลบ"}
                        </button>
                      )}
                    </div>
                    <h2 className="text-xl font-bold">{post.title}</h2>
                    <p className="mt-2 text-sm leading-7" style={{ color: "var(--subtext)" }}>{post.description}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.88)" }}
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl" style={{ background: "var(--card)" }}>
            <div className="flex items-start justify-between gap-3 border-b p-4" style={{ borderColor: "var(--line)" }}>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-black sm:text-xl">{selected.title}</h2>
                {selected.description && <p className="mt-1 text-sm" style={{ color: "var(--subtext)" }}>{selected.description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {isAdmin && (
                  <button
                    className="pill px-3 py-1 text-sm"
                    style={{ color: "var(--danger)", borderColor: "rgba(185,28,28,0.4)" }}
                    type="button"
                    aria-label={`ลบโพสต์ ${selected.title}`}
                    disabled={deletingId === selected.id}
                    onClick={() => setConfirmDeleteId(selected.id)}
                  >
                    {deletingId === selected.id ? <span className="spinner" /> : "ลบ"}
                  </button>
                )}
                <button className="pill px-3 py-1 text-sm" type="button" onClick={() => setSelected(null)}>ปิด</button>
              </div>
            </div>
            {selected.imageUrl ? (
              <div className="flex-1 overflow-auto p-2">
                <img src={selected.imageUrl} alt={selected.title} className="mx-auto block max-h-[75vh] w-auto rounded-xl object-contain" />
              </div>
            ) : (
              <div className="h-48 flex-1" style={{ background: selected.imageStyle || FALLBACK_STYLE }} />
            )}
            <div className="border-t px-4 py-2 text-xs" style={{ borderColor: "var(--line)", color: "var(--subtext)" }}>
              โดย {selected.author}
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          message="ต้องการลบโพสต์นี้ใช่ไหม?"
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="guild-card w-full max-w-lg p-6" style={{ background: "var(--card)" }} onPaste={handlePaste}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black">สร้างโพสต์ Info</h2>
              <button className="pill px-3 py-1 text-sm" type="button" onClick={closeModal}>ปิด</button>
            </div>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2">
                <span className="text-sm" style={{ color: "var(--subtext)" }}>หัวข้อ</span>
                <input className="field" name="title" placeholder="ชื่อโพสต์..." required />
              </label>
              <label className="grid gap-2">
                <span className="text-sm" style={{ color: "var(--subtext)" }}>รายละเอียด (optional)</span>
                <textarea className="field" name="description" rows={3} placeholder="อธิบายเนื้อหา..." style={{ resize: "vertical" }} />
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={wideCard} onChange={(e) => setWideCard(e.target.checked)} className="h-4 w-4 rounded" />
                <span className="text-sm" style={{ color: "var(--subtext)" }}>การ์ดใหญ่ (ขยายตามภาพ เต็มแถว)</span>
              </label>
              <label className="grid gap-2">
                <span className="text-sm" style={{ color: "var(--subtext)" }}>รูปภาพ (optional) · Ctrl+V วางจากคลิปบอร์ดได้</span>
                <input className="field" type="file" accept="image/*" ref={fileRef} onChange={handleFileChange} />
              </label>
              {preview && (
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <img src={preview} alt="preview" className="w-full object-contain" style={{ maxHeight: "240px" }} />
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
