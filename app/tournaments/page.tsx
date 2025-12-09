import Link from "next/link";

import TournamentCard from "../components/Tournaments/TournamentCard";

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
  date: string;
  place: string;
  status: TournamentStatus;
  type: string;
};

const statusPriority: Record<TournamentStatus, number> = {
  registration_open: 0,
  announced: 1,
  running: 2,
  finished: 3,
  closed: 4,
  draft: 5,
  archived: 6,
}; 

const mockTournaments: Tournament[] = [
  {
    id: 1,
    title: "VZALE STREET OPEN",
    date: "27 апреля · 13:00",
    place: "Санкт-Петербург, площадка VZALE",
    status: "registration_open",
    type: "Любительский 3×3 · до 12 команд",
  },
  {
    id: 2,
    title: "VZALE NIGHT RUN",
    date: "15 июня · 18:00",
    place: "Санкт-Петербург, outdoor площадка",
    status: "announced",
    type: "Вечерний турнир · музыка · медиа",
  },
  {
    id: 3,
    title: "VZALE SEASON FINALS",
    date: "Состоялся: 5 марта",
    place: "Санкт-Петербург",
    status: "finished",
    type: "Финальный турнир сезона",
  },
];

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

function fetchTournaments(): Tournament[] {
  return mockTournaments;
}

export default function TournamentsPage() {
  const tournaments = fetchTournaments().sort((a, b) => {
    const aStatus = normalizeStatus(a.status) ?? "draft";
    const bStatus = normalizeStatus(b.status) ?? "draft";
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
            />
          ))}
        </section>
      </div>
    </main>
  );
}
