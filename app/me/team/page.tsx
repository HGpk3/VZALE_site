import Link from "next/link";

import TeamDashboard from "./TeamDashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function MyTeamPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0B0615] via-[#050309] to-black text-white px-4 py-12 md:py-16">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/me"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
          >
            ← Личный кабинет
          </Link>
          <Link
            href="/tournaments"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
          >
            Архив турниров
          </Link>
        </div>
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Команда</p>
          <h1 className="text-3xl md:text-4xl font-extrabold">Моя команда</h1>
          <p className="text-sm text-white/70">
            Управляйте составом, подавайте заявку на турнир и следите за статусом оплаты.
          </p>
        </header>

        <TeamDashboard />
      </div>
    </main>
  );
}
