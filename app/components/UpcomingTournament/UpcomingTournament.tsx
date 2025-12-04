import Link from "next/link";

import { fetchTournaments, type TournamentSummary } from "@/lib/api";

type TournamentStatus =
  | "draft"
  | "announced"
  | "registration_open"
  | "closed"
  | "running"
  | "finished"
  | "archived"
  | "published"
  | "upcoming"
  | "active";

const statusLabel: Partial<Record<TournamentStatus, string>> = {
  draft: "Черновик",
  announced: "Анонс",
  registration_open: "Регистрация открыта",
  closed: "Регистрация закрыта",
  running: "Турнир идёт",
  finished: "Турнир завершён",
  archived: "Архив",
  published: "Скоро объявим",
  upcoming: "Скоро старт",
  active: "Идет сейчас",
};

const statusBadge: Partial<Record<TournamentStatus, string>> = {
  draft: "border-white/30 text-white/80",
  announced: "border-vz_purple/60 text-vz_purple",
  registration_open: "border-vz_green/80 text-vz_green",
  closed: "border-amber-300/60 text-amber-200",
  running: "border-emerald-300/70 text-emerald-200",
  finished: "border-white/30 text-white/70",
  archived: "border-white/20 text-white/60",
  published: "border-vz_purple/60 text-vz_purple",
  upcoming: "border-vz_green/80 text-vz_green",
  active: "border-emerald-300/70 text-emerald-200",
};

function normalizeStatus(status: string | null): TournamentStatus | null {
  if (!status) return null;
  const known: TournamentStatus[] = [
    "draft",
    "announced",
    "registration_open",
    "closed",
    "running",
    "finished",
    "archived",
    "published",
    "upcoming",
    "active",
  ];

  if (known.includes(status as TournamentStatus)) {
    return status as TournamentStatus;
  }

  return null;
}

async function fetchUpcomingTournament(): Promise<TournamentSummary | null> {
  try {
    const tournaments = await fetchTournaments();
    if (!tournaments || tournaments.length === 0) return null;

    const upcoming =
      tournaments.find((t) => t.status === "published") ??
      tournaments.find((t) => t.status === "upcoming") ??
      tournaments.find((t) => t.status === "active") ??
      tournaments[0];

    return upcoming ?? null;
  } catch (error) {
    console.error("[UpcomingTournament] Failed to fetch tournaments", error);
    return null;
  }
}

export default async function UpcomingTournament() {
  const tournament = await fetchUpcomingTournament();

  if (!tournament) {
    return (
      <section className="relative w-full py-20 px-6 md:px-10 bg-gradient-to-b from-[#15082A] via-[#0A0616] to-[#050309] text-white">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-vz_green/80">Ближайшие турниры</p>
              <h2 className="text-3xl md:text-4xl font-extrabold mt-2">Следите за обновлениями</h2>
            </div>
            <span className="inline-flex items-center text-sm md:text-base px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-white/80">
              Пока нет активных турниров
            </span>
          </div>

          <div className="rounded-3xl bg-[#120628] border border-white/15 p-8 md:p-10 shadow-[0_24px_80px_rgba(0,0,0,0.7)] space-y-4">
            <p className="text-base md:text-lg text-white/80">
              Сейчас нет турниров с открытой регистрацией. Подпишитесь на нас в соцсетях, чтобы первыми узнать о старте нового сезона.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-white/70">
              <Link href="/tournaments" className="underline hover:text-white">
                Смотреть архив турниров
              </Link>
              <span className="text-white/40">•</span>
              <Link href="/participate" className="underline hover:text-white">
                Оставить заявку как свободный игрок
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const status = normalizeStatus(tournament.status) ?? "draft";
  const canRegister = status === "registration_open" || status === "upcoming" || status === "published";
  const description =
    "Динамичный турнир 3×3 с живой атмосферой, музыкой и медиа-поддержкой. Следите за обновлениями, чтобы не пропустить старт.";
  const format = "Любительский 3×3";

  return (
    <section className="relative w-full py-20 px-6 md:px-10 bg-gradient-to-b from-[#15082A] via-[#0A0616] to-[#050309] text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-vz_green/80">Ближайшие турниры</p>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-2">{tournament.name}</h2>
          </div>

          <span
            className={`inline-flex items-center text-sm md:text-base px-4 py-2 rounded-full border bg-white/5 backdrop-blur-sm ${statusBadge[status]}`}
          >
            {statusLabel[status] ?? "Статус уточняется"}
          </span>
        </div>

        <div className="relative rounded-3xl bg-[#120628] border border-vz_green/40 shadow-[0_24px_80px_rgba(0,0,0,0.7)] overflow-hidden">
          <div className="absolute -top-24 -left-10 w-[320px] h-[260px] bg-vz_green blur-[120px] opacity-60" />
          <div className="absolute -bottom-24 right-0 w-[380px] h-[280px] bg-vz_purple blur-[120px] opacity-70" />

          <div className="relative z-10 grid md:grid-cols-[2fr,1fr] gap-10 p-8 md:p-10">
            <div className="space-y-4">
              <h3 className="text-2xl md:text-3xl font-bold">{tournament.name}</h3>

              <div className="text-sm md:text-base text-vz_green/90 font-medium space-y-1">
                <p>
                  {tournament.dateStart || "Дата будет объявлена"}
                  {tournament.dateStart || tournament.venue ? " · " : ""}
                  {tournament.venue || "Локация уточняется"}
                </p>
              </div>

              <p className="text-sm md:text-base text-white/90 max-w-xl">{description}</p>
            </div>

            <div className="flex flex-col justify-between gap-6 md:items-end">
              <div className="space-y-2 text-sm md:text-right">
                <p className="text-xs uppercase tracking-[0.18em] text-white/60">Формат</p>
                <p className="text-base md:text-lg font-semibold text-white">{format}</p>
              </div>

              <div className="flex md:flex-col gap-4 md:items-end">
                <Link
                  href={canRegister ? "/participate" : `/tournaments/${tournament.id}`}
                  className={`font-semibold text-base md:text-lg px-6 py-3 rounded-xl transition shadow-[0_0_30px_rgba(164,255,79,0.9)] ${
                    canRegister
                      ? "bg-vz_green text-black hover:brightness-110"
                      : "bg-white/10 text-white/70 border border-white/30 hover:bg-white/15"
                  }`}
                >
                  {canRegister ? "Участвовать" : "Подробнее"}
                </Link>

                <Link
                  href={`/tournaments/${tournament.id}`}
                  className="border border-white/30 text-white font-medium text-sm md:text-base px-6 py-3 rounded-xl hover:bg-white/10 transition"
                >
                  Подробнее о турнире
                </Link>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/10" />
        </div>
      </div>
    </section>
  );
}
