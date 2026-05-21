import { useCallback, useRef, useState } from "react";

export function useImageUpload() {
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pastedFileRef = useRef<File | null>(null);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (!item) return;
    const file = item.getAsFile();
    if (!file) return;
    pastedFileRef.current = file;
    if (fileRef.current) fileRef.current.value = "";
    setPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    pastedFileRef.current = null;
    const file = e.target.files?.[0];
    setPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return file ? URL.createObjectURL(file) : null; });
  }, []);

  const clearFile = useCallback(() => {
    setPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    pastedFileRef.current = null;
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const getFile = useCallback(
    () => pastedFileRef.current ?? fileRef.current?.files?.[0] ?? null,
    []
  );

  return { preview, fileRef, handlePaste, handleFileChange, clearFile, getFile };
}
