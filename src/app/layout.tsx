import type { Metadata, Viewport } from "next";
import "./globals.css";
import NavigationLoader from "@/frontend/components/NavigationLoader";

export const metadata: Metadata = {
  title: "12Tails AgelaZ Hub",
  description: "AngelaZ Hub",
};

export const viewport: Viewport = {
  themeColor: "#0f1117",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" data-theme="dark" data-scroll-behavior="smooth">
      <body>
        <NavigationLoader />
        {children}
      </body>
    </html>
  );
}
