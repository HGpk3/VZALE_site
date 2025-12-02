import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";

import { isAdmin } from "@/lib/admin";
import "./globals.css";   // ← ВОТ ЭТО ОЧЕНЬ ВАЖНО

export const metadata: Metadata = {
  title: "VZALE",
  description: "Любительские турниры 3x3 нового поколения",
};

async function AdminShortcut() {
  const cookieStore = await cookies();
  const telegramIdRaw = cookieStore.get("vzale_telegram_id")?.value;
  const telegramId = telegramIdRaw ? Number(telegramIdRaw) : null;

  if (!isAdmin(telegramId)) return null;

  return (
    <div className="fixed right-4 top-4 z-50">
      <Link
        href="/me#admin"
        className="inline-flex items-center gap-2 rounded-full bg-vz_purple text-white px-4 py-2 text-sm font-semibold shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:bg-vz_green hover:text-black transition"
      >
        Админ-панель
      </Link>
    </div>
  );
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        {await AdminShortcut()}
        {children}
      </body>
    </html>
  );
}
