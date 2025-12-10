import Link from "next/link";
import TournamentCard from "../components/Tournaments/TournamentCard";
import {
  TournamentSettings,
  fetchTournamentCards,
} from "@/lib/tournaments";

type TournamentStatus =
  | "draft"
  | "announced"
  | "registration_open"
  | "closed"
  | "running"
  | "finished"
  | "archived";

type Tournament = {
  id: number;
  title: string;
  date?: string | null;
  place?: string | null;
  status: TournamentStatus | null;
  format?: string | null;
  teamCount?: number;
  teamLimit?: number | null;
  price?: string | number | null;
  settings?: TournamentSettings | null;
};

const statusPriority: Record<TournamentStatus, number> = {
  running: 0,
  registration_open: 1,
  announced: 2,
  draft: 3,
  finished: 4,
  closed: 5,
  archived: 6,
};

const legacyTournaments: Tournament[] = [
  {
    id: 1,
    title: "VZALE STREET OPEN",
    date: "27 апреля · 13:00",
    place: "Санкт-Петербург, площадка VZALE",
    status: "registration_open",
    format: "Любительский 3×3 · до 12 команд",
    teamCount: 8,
    teamLimit: 12,
    price: "2000 ₽ с команды",
  },
  {
    id: 2,
    title: "VZALE NIGHT RUN",
    date: "15 июня · 18:00",
    place: "Санкт-Петербург, outdoor площадка",
    status: "announced",
    format: "Вечерний турнир · музыка · медиа",
    price: "Вход свободный",
  },
  {
    id: 3,
    title: "VZALE SEASON FINALS",
    date: "Состоялся: 5 марта",
    place: "Санкт-Петербург",
    status: "finished",
    format: "Финальный турнир сезона",
    teamCount: 16,
    teamLimit: 16,
  },
];

function normalizeStatus(status: TournamentStatus | null): TournamentStatus {
  return status ?? "draft";
}

export default function TournamentsPage() {
  const dbTournaments = fetchTournamentCards().map((t) => ({
    id: t.id,
    title: t.name,
    date: t.dateStart,
    place: t.venue,
    status: t.status as TournamentStatus,
    format: t.settings?.format || null,
    teamCount: t.teamCount,
    teamLimit: t.settings?.teamLimit ?? null,
    price: t.settings?.price ?? null,
    settings: t.settings,
  }));

  const tournaments = [...dbTournaments, ...legacyTournaments].sort((a, b) => {
    const aStatus = normalizeStatus(a.status);
    const bStatus = normalizeStatus(b.status);
    const aPriority = statusPriority[aStatus] ?? 99;
    const bPriority = statusPriority[bStatus] ?? 99;
    if (aPriority === bPriority) return b.id - a.id;
    return aPriority - bPriority;
  });

  return (
    <main className="min-h-screen w-full bg-vz-gradient py-20 px-6 md:px-10">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="space-y-3">
          <p className="text-xs md:text-sm uppercase tracking-[0.22em] text-vz_text/70">
            Турниры
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-vz_text">
            Все турниры VZALE
          </h1>
          <p className="text-sm md:text-base text-neutral-800 max-w-2xl">
            Здесь можно посмотреть ближайшие турниры, те, которые идут прямо
            сейчас, и прошедшие ивенты VZALE.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-vz_text/10 bg-white px-4 py-2 text-sm font-semibold text-vz_text shadow-sm hover:-translate-y-0.5 hover:shadow-md transition"
            >
              ← На главную
            </Link>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          {tournaments.map((t) => (
            <TournamentCard
              key={t.id}
              id={t.id}
              title={t.title}
              date={t.date}
              place={t.place}
              status={t.status}
              teamCount={t.teamCount}
              teamLimit={t.teamLimit}
              price={t.price}
              format={t.format || undefined}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
