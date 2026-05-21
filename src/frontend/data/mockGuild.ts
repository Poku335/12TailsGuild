import type { InfoPost, MarketPost, PartyPost, ReceiptCard, StorageCard, StorageItem, StorageRequest } from "@/backend/types";

export const infoPosts: InfoPost[] = [
  {
    id: "info-1",
    title: "วิธีลงดัน Abyss แบบปลอดภัย",
    description: "ตั้งทีมฮีล 2 ดาเมจ 3 แล้วให้แทงค์เปิดก่อนเสมอ เก็บสกิลหยุดไว้ใช้ตอนบอสเรียกเงา",
    tag: "Guide",
    author: "Admin",
    imageStyle: "linear-gradient(135deg, rgba(124,92,255,.86), rgba(79,209,197,.48))",
  },
  {
    id: "info-2",
    title: "ตารางกิลด์วอร์สัปดาห์นี้",
    description: "ลงชื่อก่อน 20:00 น. Officer จะจัดกลุ่มตาม role และของที่พร้อมใช้",
    tag: "News",
    author: "Admin",
    imageStyle: "linear-gradient(145deg, rgba(79,209,197,.76), rgba(15,17,23,.5))",
  },
  {
    id: "info-3",
    title: "เทคนิคฟาร์มตั๋วชาบู",
    description: "วน quest รายวันกับปาร์ตี้ 4 คน ใช้เวลาประมาณ 18 นาทีต่อรอบ",
    tag: "Tips",
    author: "Admin",
    imageStyle: "linear-gradient(145deg, rgba(239,68,68,.55), rgba(124,92,255,.64))",
  },
];

export const partyPosts: PartyPost[] = [
  { id: "party-1", user: "kamibtood", title: "หาเพื่อนลงดันชาบูชาบู", desc: "มีฮีลเลอร์ 2 คน หาดาเมจเพิ่ม 3 คน เริ่ม 21:00", type: "Dungeon", status: "OPEN", time: "8 นาทีที่แล้ว" },
  { id: "party-2", user: "mizufox", title: "Raid Abyss รอบดึก", desc: "ขาดแทงค์ 1 และซัพ 1 ขอมีไมค์ Discord", type: "Dungeon", status: "OPEN", time: "22 นาทีที่แล้ว" },
  { id: "party-3", user: "nora", title: "ซ้อม Arena 3v3", desc: "รับทุกคลาส เน้นลองคอมโบและฝึกจังหวะ CC", type: "Arena", status: "FULL", time: "1 ชม.ที่แล้ว" },
];

export const marketPosts: MarketPost[] = [
  { id: "market-1", user: "kamibtood", type: "ขาย", item: "บัตรชาบูสำหรับลงดันเจี้ยน", price: 50, time: "ล่าสุด" },
  { id: "market-2", user: "juniper", type: "รับซื้อ", item: "ตั๋วดัน Abyss", price: 35, time: "15 นาทีที่แล้ว" },
  { id: "market-3", user: "sora", type: "ขาย", item: "ยาฟื้นฟูชุดใหญ่", price: 120, time: "33 นาทีที่แล้ว" },
];

export const storageItems: StorageItem[] = [
  { id: "item-1", name: "ดาบน้ำแข็ง", amount: 10 },
  { id: "item-2", name: "ยาฟื้นฟู", amount: 99 },
  { id: "item-3", name: "ตั๋วดัน Abyss", amount: 5 },
  { id: "item-4", name: "หินอัปเกรด", amount: 24 },
];

export const storageRequests: StorageRequest[] = [
  { id: "request-1", user: "kamibtood", item: "ดาบน้ำแข็ง", type: "เบิก", amount: 1, status: "pending", createdAt: "5 นาทีที่แล้ว" },
  { id: "request-2", user: "mizufox", item: "ยาฟื้นฟู", type: "ซื้อ", price: 10, amount: 3, status: "confirmed", confirmedBy: "kamibtood", confirmedAt: "2 นาทีที่แล้ว", createdAt: "10 นาทีที่แล้ว" },
];

export const storageCards: StorageCard[] = [];

export const receiptCards: ReceiptCard[] = [];
