export type InfoPost = {
  id: string;
  title: string;
  description: string;
  tag: string;
  author: string;
  imageStyle: string;
  imageUrl?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
};

export type PartyPost = {
  id: string;
  user: string;
  title: string;
  desc: string;
  type: "Dungeon" | "Mission" | "Arena";
  status: "OPEN" | "FULL";
  time: string;
  imageUrl?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
};

export type MarketPost = {
  id: string;
  user: string;
  type: "ขาย" | "รับซื้อ";
  item: string;
  price: number;
  time: string;
  imageUrl?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
};

export type ReceiptCard = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  createdBy: string;
  createdAt: string;
};

export type StorageItem = {
  id: string;
  name: string;
  amount: number;
};

export type StorageRequest = {
  id: string;
  user: string;
  item: string;
  type: "เบิก" | "ซื้อ";
  price?: number;
  amount: number;
  status: "pending" | "confirmed";
  confirmedBy?: string | null;
  confirmedAt?: string | null;
  createdAt?: string | null;
};

export type StorageCard = {
  id: string;
  title: string;
  description: string | null;
  tag: string;
  imageUrl?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  caption: string | null;
  createdBy: string;
  createdAt: string;
};

export type SearchResult = {
  id: string;
  category: "info" | "party" | "market" | "receipt" | "storage";
  title: string;
  subtitle: string | null;
  href: string;
  imageUrl: string | null;
};

export type UserRole = "user" | "admin";

export type AuthUser = {
  id: string;
  discordId: string;
  username: string;
  role: UserRole;
  globalName?: string | null;
  avatarUrl?: string | null;
};
