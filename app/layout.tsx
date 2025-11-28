import type { Metadata } from "next";
import "./globals.css";   // ← ВОТ ЭТО ОЧЕНЬ ВАЖНО

export const metadata: Metadata = {
  title: "VZALE",
  description: "Любительские турниры 3x3 нового поколения",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
