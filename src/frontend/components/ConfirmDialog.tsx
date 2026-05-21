"use client";

type Props = {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({ message, onConfirm, onCancel }: Props) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="guild-card w-full max-w-xs p-6" style={{ background: "var(--card)" }}>
        <p className="mb-5 text-center text-sm leading-6" style={{ color: "var(--text)" }}>{message}</p>
        <div className="flex gap-3">
          <button className="btn flex-1 text-sm" type="button" onClick={onCancel}>ยกเลิก</button>
          <button className="btn btn-danger flex-1 text-sm" type="button" onClick={onConfirm}>ยืนยัน</button>
        </div>
      </div>
    </div>
  );
}
