"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { AuthUser, ReceiptCard } from "@/backend/types";
import ConfirmDialog from "./ConfirmDialog";
import { useToast, ToastList } from "./Toast";
import { uploadImage } from "@/frontend/utils/image";
import { useImageUpload } from "@/frontend/hooks/useImageUpload";

export default function ReceiptBoard({ initialCards, user }: Readonly<{ initialCards: ReceiptCard[]; user: AuthUser | null }>) {
  const [cards, setCards] = useState(initialCards);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lbScale, setLbScale] = useState(1);
  const [lbPos, setLbPos] = useState({ x: 0, y: 0 });
  const lbDrag = useRef<{ on: boolean; mx: number; my: number; px: number; py: number }>({ on: false, mx: 0, my: 0, px: 0, py: 0 });
  const lbHasDragged = useRef(false);
  const pinchStartDist = useRef(0);
  const pinchStartScale = useRef(1);
  const [showUpload, setShowUpload] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const lightboxMouseDownRef = useRef(false);
  const { toasts, toast, dismiss } = useToast();
  const { preview, fileRef, handlePaste, handleFileChange, clearFile, getFile } = useImageUpload();

  const isAdmin = user?.role === "admin";

  const openLightbox = (url: string) => { setLightboxUrl(url); setLbScale(1); setLbPos({ x: 0, y: 0 }); };
  const closeLightbox = () => { setLightboxUrl(null); setLbScale(1); setLbPos({ x: 0, y: 0 }); };
  const resetZoom = () => { setLbScale(1); setLbPos({ x: 0, y: 0 }); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key !== "Escape") return; setLightboxUrl(null); setLbScale(1); setLbPos({ x: 0, y: 0 }); setShowUpload(false); clearFile(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearFile]);

  const closeUpload = () => { setShowUpload(false); clearFile(); };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const file = getFile();
    if (!file) return;
    setSubmitting(true);

    const data = new FormData(e.currentTarget);
    const result = await uploadImage(file);
    if (!result) {
      toast("อัพโหลดไฟล์ไม่สำเร็จ", "error");
      setSubmitting(false);
      return;
    }

    const body = {
      title: data.get("title"),
      description: data.get("description") || null,
      imageUrl: result.url,
      imageWidth: result.width,
      imageHeight: result.height,
    };

    const res = await fetch("/api/receipt-cards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      const newCard = await res.json() as ReceiptCard;
      setCards((current) => [newCard, ...current]);
      closeUpload();
      toast("เพิ่มตำราเรียบร้อยแล้ว");
    } else {
      toast("บันทึกไม่สำเร็จ", "error");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setConfirmDeleteId(null);
    const res = await fetch(`/api/receipt-cards/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCards((current) => current.filter((c) => c.id !== id));
      toast("ลบสำเร็จ", "info");
    } else {
      toast("ลบไม่สำเร็จ", "error");
    }
    setDeletingId(null);
  };

  return (
    <section className="section-pad">
      <div className="page-shell">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="eyebrow text-sm font-semibold uppercase">Crafting Recipes</p>
            <h1 className="section-title mt-3 font-black">ตำรา</h1>
          </div>
          {isAdmin && (
            <button className="btn btn-primary font-semibold" type="button" onClick={() => setShowUpload(true)}>
              + เพิ่มตำรา
            </button>
          )}
        </div>

        {cards.length === 0 && (
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed" style={{ borderColor: "var(--line)" }}>
            <p className="text-sm" style={{ color: "var(--subtext)" }}>ยังไม่มีตำรา{isAdmin ? " — กด เพิ่มตำรา เพื่อเริ่มต้น" : ""}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.id}
              className="guild-card overflow-hidden"
            >
              <div
                className="relative overflow-hidden cursor-pointer border-b"
                style={{ width: "100%", height: "220px", borderColor: "var(--line)" }}
                onClick={() => openLightbox(card.imageUrl)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && openLightbox(card.imageUrl)}
              >
                <Image src={card.imageUrl} alt={card.title} fill className="object-contain" sizes="(max-width: 768px) 50vw, 33vw" />
              </div>
              <div className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <span className="text-sm" style={{ color: "var(--subtext)" }}>By: {card.createdBy} · {card.createdAt}</span>
                  </div>
                  {isAdmin && (
                    <button
                      className="btn-danger-sm shrink-0"
                      style={{ minWidth: 48 }}
                      type="button"
                      aria-label={`ลบตำรา ${card.title}`}
                      disabled={deletingId === card.id}
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(card.id); }}
                    >
                      {deletingId === card.id ? <span className="spinner" /> : "ลบ"}
                    </button>
                  )}
                </div>
                <h2 className="text-lg font-bold">{card.title}</h2>
                {card.description && (
                  <p className="mt-2 text-sm leading-6" style={{ color: "var(--subtext)" }}>{card.description}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 select-none"
          style={{ background: "rgba(0,0,0,0.92)", touchAction: "none" }}
          onWheel={(e) => {
            e.preventDefault();
            const next = Math.min(8, Math.max(1, lbScale * (e.deltaY > 0 ? 0.85 : 1.18)));
            setLbScale(next);
            if (next === 1) setLbPos({ x: 0, y: 0 });
          }}
          onMouseMove={(e) => {
            if (!lbDrag.current.on) return;
            const dx = e.clientX - lbDrag.current.mx;
            const dy = e.clientY - lbDrag.current.my;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) lbHasDragged.current = true;
            setLbPos({ x: lbDrag.current.px + dx, y: lbDrag.current.py + dy });
          }}
          onMouseUp={() => { lbDrag.current.on = false; }}
          onMouseLeave={() => { lbDrag.current.on = false; }}
          onMouseDown={(e) => { lightboxMouseDownRef.current = e.target === e.currentTarget; }}
          onClick={(e) => {
            if (lightboxMouseDownRef.current && e.target === e.currentTarget) { lightboxMouseDownRef.current = false; closeLightbox(); }
          }}
          onTouchStart={(e) => {
            if (e.touches.length === 1) {
              lbHasDragged.current = false;
              lbDrag.current = { on: true, mx: e.touches[0].clientX, my: e.touches[0].clientY, px: lbPos.x, py: lbPos.y };
            } else if (e.touches.length === 2) {
              lbDrag.current.on = false;
              pinchStartDist.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
              pinchStartScale.current = lbScale;
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 1 && lbDrag.current.on) {
              const dx = e.touches[0].clientX - lbDrag.current.mx;
              const dy = e.touches[0].clientY - lbDrag.current.my;
              if (Math.abs(dx) > 3 || Math.abs(dy) > 3) lbHasDragged.current = true;
              setLbPos({ x: lbDrag.current.px + dx, y: lbDrag.current.py + dy });
            } else if (e.touches.length === 2) {
              const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
              const next = Math.min(8, Math.max(1, pinchStartScale.current * (d / pinchStartDist.current)));
              setLbScale(next);
              if (next === 1) setLbPos({ x: 0, y: 0 });
            }
          }}
          onTouchEnd={() => { lbDrag.current.on = false; }}
        >
          <div className="absolute top-5 right-5 flex gap-2 z-10">
            <button className="pill px-3 py-1 text-sm" type="button" onClick={closeLightbox}>ปิด</button>
          </div>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            <button className="pill px-3 py-1 text-sm" type="button" onClick={() => setLbScale(s => Math.min(8, s * 1.25))}>+</button>
            <span className="pill px-3 py-1 text-sm">{Math.round(lbScale * 100)}%</span>
            <button className="pill px-3 py-1 text-sm" type="button" onClick={() => setLbScale(s => { const n = Math.max(1, s * 0.8); if (n === 1) setLbPos({ x: 0, y: 0 }); return n; })}>−</button>
            {lbScale > 1 && <button className="pill px-3 py-1 text-sm" type="button" onClick={resetZoom}>Reset</button>}
          </div>
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <img
              src={lightboxUrl}
              alt=""
              className="rounded-2xl shadow-2xl object-contain"
              style={{
                maxWidth: "90vw",
                maxHeight: "90vh",
                transform: `translate(${lbPos.x}px, ${lbPos.y}px) scale(${lbScale})`,
                transformOrigin: "center",
                cursor: lbScale >= 6 ? "zoom-out" : "zoom-in",
                transition: lbDrag.current.on ? "none" : "transform 0.12s",
              }}
              onMouseDown={(e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                lbHasDragged.current = false;
                lbDrag.current = { on: true, mx: e.clientX, my: e.clientY, px: lbPos.x, py: lbPos.y };
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (lbHasDragged.current) return;
                if (lbScale >= 6) { resetZoom(); return; }
                const f = 2;
                const newScale = Math.min(8, lbScale * f);
                const cx = e.clientX - window.innerWidth / 2;
                const cy = e.clientY - window.innerHeight / 2;
                setLbScale(newScale);
                setLbPos({ x: cx * (1 - f) + lbPos.x * f, y: cy * (1 - f) + lbPos.y * f });
              }}
              onDoubleClick={resetZoom}
              draggable={false}
            />
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          message="ต้องการลบตำรานี้ใช่ไหม?"
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {/* Admin Upload Modal */}
      {showUpload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
        >
          <div className="guild-card w-full max-w-lg p-6" style={{ background: "var(--card)", maxHeight: "90vh", overflowY: "auto" }} onPaste={handlePaste}>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="pill badge-open text-xs">Admin</span>
                <h2 className="text-xl font-black">เพิ่มตำรา / ตาราง</h2>
              </div>
              <button className="pill px-3 py-1 text-sm" type="button" onClick={closeUpload}>ปิด</button>
            </div>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2">
                <span className="text-sm" style={{ color: "var(--subtext)" }}>ชื่อ</span>
                <input className="field" name="title" placeholder="" required />
              </label>
              <label className="grid gap-2">
                <span className="text-sm" style={{ color: "var(--subtext)" }}>คำอธิบาย (optional)</span>
                <textarea className="field" name="description" rows={2} placeholder="อธิบายเพิ่มเติม..." style={{ resize: "vertical" }} />
              </label>
              <label className="grid gap-2">
                <span className="text-sm" style={{ color: "var(--subtext)" }}>รูปภาพ · Ctrl+V วางจากคลิปบอร์ดได้</span>
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
                  <img src={preview} alt="preview" className="w-full object-contain" style={{ maxHeight: "280px" }} />
                </div>
              )}
              <button className="btn btn-primary font-semibold" type="submit" disabled={submitting}>
                {submitting ? <><span className="spinner" /> กำลังอัพโหลด...</> : "เพิ่มตำรา"}
              </button>
            </form>
          </div>
        </div>
      )}
      <ToastList toasts={toasts} onDismiss={dismiss} />
    </section>
  );
}
