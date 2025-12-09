import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { LiveEntryClient } from "./LiveEntryClient";
import { isAdmin } from "@/lib/admin";
import { fetchAllTournaments } from "@/lib/tournaments";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LiveStatsPage() {
  const cookieStore = await cookies();
  const telegramId = cookieStore.get("vzale_telegram_id")?.value;

  if (!telegramId || !isAdmin(Number(telegramId))) {
    redirect("/me");
  }

  const tournaments = fetchAllTournaments().map((t) => ({
    ...t,
    status: t.status ?? undefined,
  }));

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b0615] via-[#05030a] to-black text-white px-4 py-12 md:py-16">
      <div className="relative max-w-6xl mx-auto space-y-10">
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <div className="absolute -top-20 left-10 w-[260px] h-[220px] bg-vz_purple blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[320px] h-[240px] bg-vz_green blur-[140px]" />
        </div>

        <div className="relative z-10 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              <span aria-hidden>←</span>
              <span>Назад в админку</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              На главную
            </Link>
          </div>
          <span className="relative z-10 rounded-full border border-vz_green/40 bg-vz_green/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-vz_green">
            Live-режим
          </span>
        </div>

        <header className="relative z-10 space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-white/60">Электронный протокол</p>
          <h1 className="text-3xl md:text-4xl font-extrabold">Лайв внесение статистики</h1>
          <p className="text-sm md:text-base text-white/75 max-w-2xl">
            Выберите матч, подтяните заявки команд и фиксируйте действия нажатием кнопок — очки, подборы, фолы, ассисты. Сохранение
            отправит протокол в общую базу бота.
          </p>
        </header>

        <section className="relative z-10">
          <LiveEntryClient tournaments={tournaments} />
        </section>
      </div>
    </main>
  );
}
