"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import type { AuthUser, MarketPost } from "@/backend/types";
import ConfirmDialog from "./ConfirmDialog";
import { useToast, ToastList } from "./Toast";
import { uploadImage } from "@/frontend/utils/image";
import { useImageUpload } from "@/frontend/hooks/useImageUpload";

export default function MarketBoard({
  initialPosts,
  user,
}: Readonly<{ initialPosts: MarketPost[]; user: AuthUser | null }>) {
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

    const body = {
      type: data.get("type"),
      item: data.get("item"),
      price: Number(data.get("price") || 0),
      imageUrl,
      imageWidth,
      imageHeight,
    };
    const res = await fetch("/api/market-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const newPost = (await res.json()) as MarketPost;
      setPosts((current) => [newPost, ...current]);
      closeModal();
      toast("ลงประกาศสำเร็จแล้ว");
    } else {
      toast("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง", "error");
    }
    setSubmitting(false);
  };

  return (
    <section className="section-pad">
      <div className="page-shell">
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow text-sm font-semibold uppercase">Market</p>
            <h1 className="section-title mt-3 font-black">เปิดตลาดกิลด์</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {user && (
              <button
                className="btn btn-primary px-4 py-2 text-sm font-semibold"
                type="button"
                onClick={() => setShowModal(true)}
              >
                + ลงประกาศ
              </button>
            )}
          </div>
        </div>

        {posts.length === 0 ? (
          <div
            className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed"
            style={{ borderColor: "var(--line)" }}
          >
            <p className="text-sm" style={{ color: "var(--subtext)" }}>
              ยังไม่มีประกาศ{user ? " — กด ลงประกาศ เพื่อเริ่มต้น" : ""}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {posts.map((post) => (
              <article
                key={post.id}
                className="guild-card flex flex-col overflow-hidden"
              >
                {post.imageUrl ? (
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={post.imageUrl}
                      alt={post.item}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-[radial-gradient(circle_at_62%_22%,rgba(245,247,250,.24),transparent_18%),linear-gradient(135deg,rgba(79,209,197,.22),rgba(124,92,255,.26))]" />
                )}
                <div className="p-3">
                  <div className="mb-2 flex items-center justify-between gap-1">
                    <span
                      className="text-xs"
                      style={{ color: "var(--subtext)" }}
                    >
                      By: {post.user}
                    </span>
                    <span className="pill text-sm px-2 py-0.5">
                      {post.type}
                    </span>
                  </div>
                  <h2 className="text-base font-bold leading-tight">
                    {post.item}
                  </h2>
                  <p
                    className="mt-2 text-lg font-black"
                    style={{ color: "var(--accent)" }}
                  >
                    {post.price.toLocaleString()} บาท
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span
                      className="text-sm"
                      style={{ color: "var(--subtext)" }}
                    >
                      {post.time}
                    </span>
                    {(user?.username === post.user ||
                      user?.globalName === post.user) && (
                      <button
                        className="btn-danger-sm shrink-0"
                        style={{ minWidth: 48 }}
                        type="button"
                        aria-label={`ปิดโพสต์ ${post.item}`}
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
            const res = await fetch(`/api/market-posts/${id}`, {
              method: "DELETE",
            });
            if (res.ok) {
              setPosts((c) => c.filter((p) => p.id !== id));
              toast("ปิดสำเร็จ", "info");
            } else {
              toast("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง", "error");
            }
          }}
          onCancel={() => setConfirmCloseId(null)}
        />
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="guild-card w-full max-w-md p-6"
            style={{
              background: "var(--card)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onPaste={handlePaste}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black">ลงประกาศ</h2>
              <button
                className="pill px-3 py-1 text-sm"
                type="button"
                onClick={closeModal}
              >
                ปิด
              </button>
            </div>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2">
                <span className="text-sm" style={{ color: "var(--subtext)" }}>
                  ประเภท
                </span>
                <select className="field" name="type">
                  <option value="ขาย">ขาย</option>
                  <option value="รับซื้อ">รับซื้อ</option>
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-sm" style={{ color: "var(--subtext)" }}>
                  ชื่อ Item
                </span>
                <input className="field" name="item" placeholder="" required />
              </label>
              <label className="grid gap-2">
                <span className="text-sm" style={{ color: "var(--subtext)" }}>
                  ราคา (บาท)
                </span>
                <input
                  className="field"
                  name="price"
                  type="number"
                  min="0"
                  defaultValue="0"
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm" style={{ color: "var(--subtext)" }}>
                  รูปภาพ Item (optional) · Ctrl+V วางจากคลิปบอร์ดได้
                </span>
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
                  <img
                    src={preview}
                    alt="preview"
                    className="w-full object-contain"
                    style={{ maxHeight: "200px" }}
                  />
                </div>
              )}
              <button
                className="btn btn-primary font-semibold"
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner" /> กำลังโพสต์...
                  </>
                ) : (
                  "ลงประกาศ"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
      <ToastList toasts={toasts} onDismiss={dismiss} />
    </section>
  );
}
