export async function uploadImage(file: File): Promise<{ url: string; width: number; height: number } | null> {
  const dims = await measureImage(file);
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) return null;
  const { url } = (await res.json()) as { url: string };
  return { url, width: dims.width, height: dims.height };
}

export async function measureImage(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ width: 0, height: 0 }); };
    img.src = url;
  });
}
