"use client";

import { useCallback, useState } from "react";

export type ToastType = "success" | "error" | "info";
export type ToastItem = { id: string; type: ToastType; message: string };

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
}

export function ToastList({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[70] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-item toast-${t.type} pointer-events-auto`}
          role="alert"
          onClick={() => onDismiss(t.id)}
        >
          {t.type === "success" && <span>✓</span>}
          {t.type === "error" && <span>✕</span>}
          {t.type === "info" && <span>·</span>}
          {t.message}
        </div>
      ))}
    </div>
  );
}
