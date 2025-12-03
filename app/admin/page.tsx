import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { isAdmin } from "@/lib/admin";
import { fetchAllTournaments } from "@/lib/tournaments";
import { AdminPanel } from "../me/components/AdminPanel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  const cookieStore = await cookies();
  const telegramId = cookieStore.get("vzale_telegram_id")?.value;

  if (!telegramId || !isAdmin(Number(telegramId))) {
    redirect("/me");
  }

  const tournaments = fetchAllTournaments();

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b0615] via-[#05030a] to-black text-white px-4 py-12 md:py-16">
      <div className="relative max-w-6xl mx-auto space-y-10">
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <div className="absolute -top-20 left-10 w-[260px] h-[220px] bg-vz_purple blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[320px] h-[240px] bg-vz_green blur-[140px]" />
        </div>

        <div className="relative z-10 flex items-center justify-between flex-wrap gap-3">
          <Link
            href="/me"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
          >
            <span aria-hidden>←</span>
            <span>Личный кабинет</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/live"
              className="inline-flex items-center gap-2 rounded-full border border-vz_green/40 bg-vz_green/10 px-4 py-2 text-sm font-semibold text-vz_green hover:bg-vz_green/20 transition"
            >
              Лайв протокол
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              На главную
            </Link>
          </div>
        </div>

        <header className="relative z-10 space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-white/60">Админ-панель</p>
          <h1 className="text-3xl md:text-4xl font-extrabold">Управление турнирами и матчами</h1>
          <p className="text-sm md:text-base text-white/75 max-w-2xl">
            Здесь те же действия, что и в боте: создание турниров, открытие/закрытие регистрации,
            добавление матчей и статистики. Все изменения сразу пишутся в общую базу.
          </p>
        </header>

        <section className="relative z-10 space-y-4" id="admin">
          <AdminPanel tournaments={tournaments} />
        </section>
      </div>
    </main>
  );
}
