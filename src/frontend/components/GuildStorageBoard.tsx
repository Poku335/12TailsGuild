"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { AuthUser, StorageCard, StorageRequest } from "@/backend/types";
import ConfirmDialog from "./ConfirmDialog";
import { useToast, ToastList } from "./Toast";
import { uploadImage } from "@/frontend/utils/image";
import { useImageUpload } from "@/frontend/hooks/useImageUpload";

export default function GuildStorageBoard({
  requests,
  cards: initialCards,
  user,
}: Readonly<{
  requests: StorageRequest[];
  cards: StorageCard[];
  user: AuthUser | null;
}>) {
  const [requestType, setRequestType] = useState<StorageRequest["type"]>("เบิก");
  const [storageRequests, setStorageRequests] = useState(requests);
  const [cards, setCards] = useState(initialCards);
  const [uploadSubmitting, setUploadSubmitting] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [captionValue, setCaptionValue] = useState("");
  const [wideCard, setWideCard] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [confirmDeleteCardId, setConfirmDeleteCardId] = useState<string | null>(null);
  const [confirmCloseRequestId, setConfirmCloseRequestId] = useState<string | null>(null);
  const [confirmingRequestId, setConfirmingRequestId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { toasts, toast, dismiss } = useToast();
  const { preview, fileRef, handlePaste, handleFileChange, clearFile, getFile } = useImageUpload();
  const lightboxMouseDownRef = useRef(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key !== "Escape") return; setLightboxUrl(null); setShowUploadModal(false); clearFile(); setShowHistory(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearFile]);

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestSubmitting(true);
    const data = new FormData(event.currentTarget);
    const nextRequest: StorageRequest = {
      id: crypto.randomUUID(),
      user: user?.globalName ?? user?.username ?? "Unknown",
      item: String(data.get("item")),
      type: requestType,
      price:
        requestType === "ซื้อ" ? Number(data.get("price") || 0) : undefined,
      amount: Number(data.get("amount") || 1),
      status: "pending",
    };

    const res = await fetch("/api/storage-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextRequest),
    }).catch(() => null);

    if (res?.ok) {
      setStorageRequests((current) => [nextRequest, ...current]);
      toast("ส่งคำขอเรียบร้อยแล้ว");
      (event.target as HTMLFormElement).reset();
    } else {
      toast("ส่งคำขอไม่สำเร็จ", "error");
    }
    setRequestSubmitting(false);
  };

  const closeUploadModal = () => { setShowUploadModal(false); clearFile(); setCaptionValue(""); setWideCard(false); };

  const submitCard = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploadSubmitting(true);
    const data = new FormData(event.currentTarget);

    let imageUrl: string | null = null;
    let imageWidth: number | null = null;
    let imageHeight: number | null = null;

    const file = getFile();
    if (file) {
      const result = await uploadImage(file);
      if (!result) {
        toast("อัพโหลดไฟล์ไม่สำเร็จ", "error");
        setUploadSubmitting(false);
        return;
      }
      imageUrl = result.url;
      imageWidth = result.width;
      imageHeight = result.height;
    }

    const cardRes = await fetch("/api/storage-cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.get("title"),
        description: data.get("description") || null,
        tag: wideCard ? "wide" : "normal",
        imageUrl,
        imageWidth,
        imageHeight,
      }),
    });

    if (cardRes.ok) {
      const newCard = (await cardRes.json()) as StorageCard;
      setCards((current) => [newCard, ...current]);
      closeUploadModal();
      toast("โพสต์สำเร็จแล้ว");
    } else {
      toast("บันทึก Card ไม่สำเร็จ", "error");
    }
    setUploadSubmitting(false);
  };

  const confirmRequest = async (id: string) => {
    setConfirmingRequestId(id);
    const res = await fetch(`/api/storage-requests/${id}`, { method: "PATCH" });
    if (res.ok) {
      const json = (await res.json()) as { confirmedBy: string };
      setStorageRequests((current) =>
        current.map((r) =>
          r.id === id
            ? { ...r, status: "confirmed" as const, confirmedBy: json.confirmedBy, confirmedAt: "ล่าสุด" }
            : r,
        ),
      );
      toast("ยืนยันคำขอเรียบร้อย");
    } else {
      toast("ยืนยันไม่สำเร็จ", "error");
    }
    setConfirmingRequestId(null);
  };

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const rows = storageRequests.map((r) => ({
      "Item": r.item,
      "ประเภท": r.type,
      "จำนวน": r.amount,
      "ราคา (บาท)": r.type === "ซื้อ" ? (r.price ?? 0) : "-",
      "โดย": r.user,
      "สถานะ": r.status === "confirmed" ? "ยืนยันแล้ว" : "รอดำเนินการ",
      "ยืนยันโดย": r.confirmedBy ?? "-",
      "วันที่ยืนยัน": r.confirmedAt ?? "-",
      "วันที่โพส": r.createdAt ?? "-",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "คำขอคลังกิลด์");
    XLSX.writeFile(wb, `storage-requests-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const deleteCard = async (id: string) => {
    setDeletingCardId(id);
    setConfirmDeleteCardId(null);
    const res = await fetch(`/api/storage-cards/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCards((current) => current.filter((c) => c.id !== id));
      toast("ลบสำเร็จ", "info");
    } else {
      toast("ลบไม่สำเร็จ", "error");
    }
    setDeletingCardId(null);
  };

  return (
    <section className="section-pad">
      <div className="page-shell">
        {/* Rules Hero */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <p
            className="eyebrow text-sm font-semibold uppercase tracking-widest"
            style={{ color: "var(--subtext)" }}
          >
            Guild Storage
          </p>
          <h2 className="text-2xl font-black">กฎการใช้คลังกิลด์</h2>
          <div
            className="overflow-hidden rounded-2xl shadow-lg"
            style={{ border: "1px solid var(--line)", width: "100%", maxWidth: 480 }}
          >
            <Image
              src="/da64147c-f601-44bf-9c77-347fbede4c90.png"
              alt="กฎการใช้คลังกิลด์"
              width={960}
              height={720}
              className="w-full h-auto object-contain"
            />
          </div>
        </div>

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="eyebrow text-base font-semibold uppercase">
              Guild Storage
            </p>
            <h2 className="section-title mt-1 text-base font-black">
              ดูคลังกิลด์
            </h2>
          </div>
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="btn font-semibold"
                type="button"
                onClick={() => setShowHistory(true)}
              >
                ประวัติคำขอ
              </button>
              <button
                className="btn font-semibold"
                type="button"
                onClick={exportExcel}
              >
                Export Excel
              </button>
              <button
                className="btn btn-primary font-semibold"
                type="button"
                onClick={() => setShowUploadModal(true)}
              >
                + ลงโพสต์
              </button>
            </div>
          )}
        </div>

        {/* Cards grid */}
        {cards.length > 0 && (
          <div className="mb-10">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {cards.map((card) => (
                <article
                  key={card.id}
                  className={`guild-card overflow-hidden${card.tag === "wide" ? " sm:col-span-2" : ""}`}
                >
                  {card.imageUrl ? (
                    <div
                      style={
                        card.imageWidth && card.imageHeight
                          ? { aspectRatio: `${card.imageWidth}/${card.imageHeight}`, width: "100%", position: "relative" }
                          : { height: "11rem", position: "relative" }
                      }
                      className="overflow-hidden cursor-pointer"
                      onClick={() => setLightboxUrl(card.imageUrl!)}
                    >
                      <Image
                        src={card.imageUrl}
                        alt={card.title}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div
                      className="h-48"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(124,92,255,.28), rgba(79,209,197,.35))",
                      }}
                    />
                  )}
                  <div className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <span
                          className="text-xs"
                          style={{ color: "var(--subtext)" }}
                        >
                          By: {card.createdBy} · {card.createdAt}
                        </span>
                      </div>
                      {isAdmin && (
                        <button
                          className="btn-danger-sm shrink-0"
                          style={{ minWidth: 48 }}
                          type="button"
                          disabled={deletingCardId === card.id}
                          onClick={() => setConfirmDeleteCardId(card.id)}
                        >
                          {deletingCardId === card.id ? (
                            <span className="spinner" />
                          ) : (
                            "ลบ"
                          )}
                        </button>
                      )}
                    </div>
                    {card.title && (
                      <h2 className="text-lg font-bold">{card.title}</h2>
                    )}
                    {card.description && (
                      <p
                        className="mt-2 text-sm leading-6"
                        style={{ color: "var(--subtext)" }}
                      >
                        {card.description}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Requests list */}
        {storageRequests.length > 0 && (
          <div className="mb-8">
            <div className="mb-6 flex flex-col items-center gap-1 text-center">
              <p className="eyebrow text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--subtext)" }}>
                Storage Requests
              </p>
              <h2 className="text-2xl font-black">คำขอที่โพส</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {storageRequests.map((request) => {
                const isOwner = user?.globalName === request.user || user?.username === request.user;
                const canDelete = isAdmin || isOwner;
                const isConfirmed = request.status === "confirmed";
                const isConfirming = confirmingRequestId === request.id;

                return (
                  <article key={request.id} className="guild-card overflow-hidden flex flex-col">
                    {/* Card header — gradient bg with item name */}
                    <div
                      className="flex flex-col items-center justify-center gap-2 px-4 py-6 text-center"
                      style={{
                        background: isConfirmed
                          ? "linear-gradient(135deg, rgba(79,209,197,.32), rgba(79,209,197,.12))"
                          : "linear-gradient(135deg, rgba(124,92,255,.28), rgba(79,209,197,.20))",
                        borderBottom: "1px solid var(--line)",
                      }}
                    >
                      <span
                        className="text-xl font-black leading-tight"
                        style={{ color: "var(--text)" }}
                      >
                        {request.item}
                      </span>
                      <span
                        className="pill px-3 py-1 text-xs font-semibold"
                        style={request.type === "ซื้อ"
                          ? { borderColor: "rgba(124,92,255,.5)", color: "var(--primary)", background: "rgba(124,92,255,.12)" }
                          : { borderColor: "rgba(79,209,197,.5)", color: "var(--accent)", background: "rgba(79,209,197,.12)" }}
                      >
                        {request.type}
                      </span>
                    </div>

                    {/* Card body */}
                    <div className="flex flex-1 flex-col items-center gap-1 px-4 py-4 text-center text-sm" style={{ color: "var(--subtext)" }}>
                      <p>จำนวน: <strong style={{ color: "var(--text)" }}>{request.amount} ชิ้น</strong></p>
                      {request.type === "ซื้อ" && (
                        <p>ราคา: <strong style={{ color: "var(--text)" }}>{request.price} บาท</strong></p>
                      )}
                      <p className="mt-1 text-xs">โดย: {request.user}</p>
                      {isConfirmed && (
                        <span className="mt-2 pill badge-open px-3 py-1 text-xs font-semibold">
                          ✓ ยืนยันแล้ว
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    {(isAdmin || canDelete) && (
                      <div
                        className="flex gap-2 border-t px-4 py-3"
                        style={{ borderColor: "var(--line)" }}
                      >
                        {isAdmin && !isConfirmed && (
                          <button
                            className="btn btn-primary flex-1 text-sm font-semibold"
                            type="button"
                            disabled={isConfirming}
                            onClick={() => confirmRequest(request.id)}
                          >
                            {isConfirming ? <><span className="spinner" /> ยืนยัน...</> : "ยืนยัน"}
                          </button>
                        )}
                        {isAdmin && isConfirmed && (
                          <div className="flex-1" />
                        )}
                        {canDelete && (
                          <button
                            className="btn btn-danger flex-1 text-sm font-semibold"
                            type="button"
                            onClick={() => setConfirmCloseRequestId(request.id)}
                          >
                            ลบ
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* Request form */}
        {user && (
          <div>
            <h2
              className="mb-3 text-base font-bold"
              style={{ color: "var(--subtext)" }}
            >
              ขอเบิกของ
            </h2>
            <form
              className="control-card grid gap-3 p-4"
              style={{ maxWidth: 480 }}
              onSubmit={submitRequest}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-xs" style={{ color: "var(--subtext)" }}>
                    ชื่อ Item
                  </span>
                  <input
                    className="field text-sm"
                    name="item"
                    placeholder="ชื่อ Item..."
                    required
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs" style={{ color: "var(--subtext)" }}>
                    ประเภท
                  </span>
                  <select
                    className="field text-sm"
                    name="type"
                    value={requestType}
                    onChange={(e) =>
                      setRequestType(e.target.value as StorageRequest["type"])
                    }
                  >
                    <option>เบิก</option>
                    <option>ซื้อ</option>
                  </select>
                </label>
                {requestType === "ซื้อ" && (
                  <label className="grid gap-1">
                    <span
                      className="text-xs"
                      style={{ color: "var(--subtext)" }}
                    >
                      ราคา
                    </span>
                    <input
                      className="field text-sm"
                      name="price"
                      type="number"
                      defaultValue="10"
                      min="0"
                    />
                  </label>
                )}
                <label className="grid gap-1">
                  <span className="text-xs" style={{ color: "var(--subtext)" }}>
                    จำนวน
                  </span>
                  <input
                    className="field text-sm"
                    name="amount"
                    type="number"
                    defaultValue="1"
                    min="1"
                  />
                </label>
              </div>
              <button
                className="btn btn-primary text-sm font-semibold"
                type="submit"
                disabled={requestSubmitting}
              >
                {requestSubmitting ? (
                  <>
                    <span className="spinner" /> กำลังส่งคำขอ...
                  </>
                ) : (
                  "ส่งคำขอ"
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {showHistory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)" }}
        >
          <div
            className="guild-card flex w-full flex-col"
            style={{
              background: "var(--card)",
              maxWidth: 860,
              maxHeight: "88vh",
            }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between border-b px-6 py-4"
              style={{ borderColor: "var(--line)" }}
            >
              <div>
                <p className="eyebrow text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--subtext)" }}>
                  Admin · Storage Requests
                </p>
                <h2 className="text-lg font-black">ประวัติคำขอทั้งหมด</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn text-sm font-semibold"
                  type="button"
                  onClick={exportExcel}
                >
                  Export Excel
                </button>
                <button
                  className="pill px-3 py-1 text-sm"
                  type="button"
                  onClick={() => setShowHistory(false)}
                >
                  ปิด
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-auto flex-1 px-2 py-2">
              {storageRequests.length === 0 ? (
                <p className="py-12 text-center text-sm" style={{ color: "var(--subtext)" }}>
                  ยังไม่มีคำขอ
                </p>
              ) : (
                <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--line)" }}>
                      {["Item", "ประเภท", "จำนวน", "ราคา", "โดย", "สถานะ", "ยืนยันโดย", "วันที่โพส"].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--subtext)", whiteSpace: "nowrap" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {storageRequests.map((r) => (
                      <tr
                        key={r.id}
                        style={{ borderBottom: "1px solid var(--line)" }}
                      >
                        <td className="px-3 py-3 font-semibold">{r.item}</td>
                        <td className="px-3 py-3">
                          <span
                            className="pill px-2 py-0.5 text-xs"
                            style={r.type === "ซื้อ"
                              ? { borderColor: "rgba(124,92,255,.5)", color: "var(--primary)", background: "rgba(124,92,255,.12)" }
                              : { borderColor: "rgba(79,209,197,.5)", color: "var(--accent)", background: "rgba(79,209,197,.12)" }}
                          >
                            {r.type}
                          </span>
                        </td>
                        <td className="px-3 py-3">{r.amount} ชิ้น</td>
                        <td className="px-3 py-3" style={{ color: "var(--subtext)" }}>
                          {r.type === "ซื้อ" ? `${r.price} บาท` : "—"}
                        </td>
                        <td className="px-3 py-3">{r.user}</td>
                        <td className="px-3 py-3">
                          {r.status === "confirmed" ? (
                            <span className="pill badge-open px-2 py-0.5 text-xs font-semibold">✓ ยืนยันแล้ว</span>
                          ) : (
                            <span className="pill px-2 py-0.5 text-xs" style={{ color: "var(--subtext)" }}>รอดำเนินการ</span>
                          )}
                        </td>
                        <td className="px-3 py-3" style={{ color: "var(--subtext)" }}>
                          {r.confirmedBy ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-xs" style={{ color: "var(--subtext)", whiteSpace: "nowrap" }}>
                          {r.createdAt ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="guild-card w-full max-w-lg p-6"
            style={{
              background: "var(--card)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onPaste={handlePaste}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black">สร้างโพสต์</h2>
              <button
                className="pill px-3 py-1 text-sm"
                type="button"
                onClick={closeUploadModal}
              >
                ปิด
              </button>
            </div>
            <form className="grid gap-4" onSubmit={submitCard}>
              <label className="grid gap-2">
                <span className="text-sm" style={{ color: "var(--subtext)" }}>
                  หัวข้อ
                </span>
                <input
                  className="field"
                  name="title"
                  placeholder="ชื่อโพสต์..."
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm" style={{ color: "var(--subtext)" }}>
                  รายละเอียด
                </span>
                <textarea
                  className="field"
                  name="description"
                  rows={3}
                  placeholder="อธิบายเนื้อหา..."
                  style={{ resize: "vertical" }}
                />
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded"
                  checked={wideCard}
                  onChange={(e) => setWideCard(e.target.checked)}
                />
                <span className="text-sm">การ์ดใหญ่ (ขยายตามภาพ เต็มแถว)</span>
              </label>
              <label className="grid gap-2">
                <span className="text-sm" style={{ color: "var(--subtext)" }}>
                  รูปภาพ (optional) · Ctrl+V วางจากคลิปบอร์ดได้
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
                    style={{ maxHeight: "300px" }}
                  />
                </div>
              )}
              <button
                className="btn btn-primary font-semibold"
                type="submit"
                disabled={uploadSubmitting}
              >
                {uploadSubmitting ? (
                  <>
                    <span className="spinner" /> กำลังโพสต์...
                  </>
                ) : (
                  "โพสต์"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onMouseDown={(e) => {
            lightboxMouseDownRef.current = e.target === e.currentTarget;
          }}
          onClick={(e) => {
            if (lightboxMouseDownRef.current && e.target === e.currentTarget)
              setLightboxUrl(null);
          }}
        >
          <button
            className="pill px-3 py-1 text-sm absolute top-5 right-5"
            type="button"
            onClick={() => setLightboxUrl(null)}
          >
            ปิด
          </button>
          <img
            src={lightboxUrl}
            alt=""
            className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}

      {confirmDeleteCardId && (
        <ConfirmDialog
          message="ต้องการลบ card นี้ใช่ไหม?"
          onConfirm={() => deleteCard(confirmDeleteCardId)}
          onCancel={() => setConfirmDeleteCardId(null)}
        />
      )}

      {confirmCloseRequestId && (
        <ConfirmDialog
          message="ต้องการปิดคำขอนี้ใช่ไหม?"
          onConfirm={async () => {
            const id = confirmCloseRequestId;
            setConfirmCloseRequestId(null);
            const res = await fetch(`/api/storage-requests/${id}`, {
              method: "DELETE",
            });
            if (res.ok || res.status === 204) {
              setStorageRequests((c) => c.filter((r) => r.id !== id));
              toast("ปิดสำเร็จ", "info");
            } else {
              toast("ปิดคำขอไม่สำเร็จ", "error");
            }
          }}
          onCancel={() => setConfirmCloseRequestId(null)}
        />
      )}

      <ToastList toasts={toasts} onDismiss={dismiss} />
    </section>
  );
}
