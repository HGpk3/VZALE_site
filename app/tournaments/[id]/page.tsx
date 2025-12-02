import Link from "next/link";
import { notFound } from "next/navigation";

import { getDb } from "@/lib/db";

type TournamentStatus =
  | "draft"
  | "announced"
  | "registration_open"
  | "closed"
  | "running"
  | "finished"
  | "archived";

type TournamentRow = {
  id: number;
  name: string;
  status: string | null;
  dateStart: string | null;
  venue: string | null;
  settingsJson: string | null;
};

const statusLabel: Record<TournamentStatus, string> = {
  draft: "Черновик",
  announced: "Анонс",
  registration_open: "Регистрация открыта",
  closed: "Регистрация закрыта",
  running: "Турнир идёт",
  finished: "Турнир завершён",
  archived: "Архив",
};

const statusColor: Record<TournamentStatus, string> = {
  draft: "border-white/20 text-white/80",
  announced: "border-vz_purple/60 text-vz_purple",
  registration_open: "border-vz_green/70 text-vz_green",
  closed: "border-amber-400/70 text-amber-200",
  running: "border-emerald-400/70 text-emerald-200",
  finished: "border-white/30 text-white/80",
  archived: "border-white/20 text-white/70",
};

function normalizeStatus(status: string | null): TournamentStatus | null {
  if (!status) return null;
  if (
    [
      "draft",
      "announced",
      "registration_open",
      "closed",
      "running",
      "finished",
      "archived",
    ].includes(status)
  ) {
    return status as TournamentStatus;
  }
  return null;
}

function fetchTournament(id: number): TournamentRow | undefined {
  const db = getDb();
  return db
    .prepare(
      "SELECT id, name, status, date_start as dateStart, venue, settings_json as settingsJson FROM tournaments WHERE id = ?"
    )
    .get(id) as TournamentRow | undefined;
}

function parseSettings(settingsJson: string | null) {
  if (!settingsJson) return null;
  try {
    return JSON.parse(settingsJson) as {
      description?: string;
      format?: string;
      prizes?: string;
    };
  } catch (err) {
    console.error("[tournament] failed to parse settings_json", err);
    return null;
  }
}

export default function TournamentPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (Number.isNaN(id)) return notFound();

  const row = fetchTournament(id);
  if (!row) return notFound();

  const status = normalizeStatus(row.status) ?? "draft";
  const settings = parseSettings(row.settingsJson);
  const canRegister = status === "registration_open";

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#0B0615] via-[#050309] to-black text-white py-16 md:py-20 px-6 md:px-10">
      {/* Неоновый фон */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-10 left-0 w-[280px] h-[200px] bg-vz_purple blur-[110px]" />
        <div className="absolute bottom-0 right-10 w-[260px] h-[220px] bg-vz_green blur-[110px]" />
      </div>

      <div className="relative max-w-6xl mx-auto space-y-10">
        {/* Хедер турнира */}
        <header className="space-y-4">
          <p className="text-xs md:text-sm uppercase tracking-[0.22em] text-white/70">
            Турнир VZALE #{row.id}
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold">{row.name}</h1>

          <div className="flex flex-wrap items-center gap-3 text-sm md:text-base text-white/80">
            {row.dateStart && <span>{row.dateStart}</span>}
            {row.dateStart && row.venue && <span className="text-white/60">•</span>}
            {row.venue && <span>{row.venue}</span>}
          </div>

          <span
            className={`inline-flex items-center px-4 py-1 rounded-full border bg-white/5 text-xs md:text-sm font-semibold ${statusColor[status]}`}
          >
            {statusLabel[status]}
          </span>
        </header>

        {/* Основной блок */}
        <section className="grid gap-8 md:grid-cols-[2fr,1.2fr] items-start">
          {/* Описание / формат / призы */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <h2 className="text-xl md:text-2xl font-semibold mb-3">О турнире</h2>
              <p className="text-sm md:text-base text-white/80 leading-relaxed">
                {settings?.description ||
                  "Организатор пока не добавил описание. Следите за обновлениями в боте VZALE."}
              </p>
            </div>

            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-7 space-y-4">
              <div>
                <h3 className="text-base md:text-lg font-semibold mb-1">Формат и регламент</h3>
                <p className="text-sm md:text-base text-white/80 leading-relaxed">
                  {settings?.format ||
                    "Детали формата появятся позже. Если вы капитан, уточните в боте перед подачей заявки."}
                </p>
              </div>

              <div>
                <h3 className="text-base md:text-lg font-semibold mb-1">Призы и награды</h3>
                <p className="text-sm md:text-base text-white/80 leading-relaxed">
                  {settings?.prizes || "Призы будут объявлены ближе к старту турнира."}
                </p>
              </div>
            </div>
          </div>

          {/* Правая колонка — CTA */}
          <aside className="space-y-6">
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)] space-y-4">
              <h3 className="text-base md:text-lg font-semibold">Принять участие</h3>
              <p className="text-xs md:text-sm text-white/75">
                Регистрация идёт через бота и сайт: капитаны подают команды, свободные агенты оставляют анкеты.
              </p>
              <Link
                href="/participate"
                className={`w-full inline-flex justify-center mt-2 font-semibold text-sm md:text-base px-5 py-3 rounded-xl transition shadow-[0_0_30px_rgba(164,255,79,0.5)] ${
                  canRegister
                    ? "bg-vz_green text-black hover:brightness-110"
                    : "bg-white/10 text-white/70 cursor-not-allowed"
                }`}
                aria-disabled={!canRegister}
              >
                {canRegister ? "Подать заявку" : "Регистрация закрыта"}
              </Link>
            </div>

            <div className="rounded-3xl bg-white/5 border border-white/10 p-5 md:p-6 text-xs md:text-sm text-white/70 space-y-2">
              <p>Все заявки и команды сразу пишутся в ту же базу, что и бот.</p>
              <p>После подачи заявку можно отследить и обновить в личном кабинете или в Telegram.</p>
            </div>
          </aside>
        </section>

        <Link
          href="/tournaments"
          className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
        >
          ← Ко всем турнирам
        </Link>
      </div>
    </main>
  );
}
