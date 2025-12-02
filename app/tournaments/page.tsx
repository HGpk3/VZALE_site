import { getDb } from "@/lib/db";
import TournamentCard from "../components/Tournaments/TournamentCard";

type TournamentRow = {
  id: number;
  name: string;
  status: string | null;
  dateStart: string | null;
  venue: string | null;
};

const statusPriority: Record<string, number> = {
  registration_open: 1,
  announced: 2,
  running: 3,
  draft: 4,
  closed: 5,
  finished: 6,
  archived: 7,
};

function fetchTournaments(): TournamentRow[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT id, name, status, date_start as dateStart, venue FROM tournaments ORDER BY id DESC"
    )
    .all() as TournamentRow[];
}

function normalizeStatus(status: string | null):
  | "draft"
  | "announced"
  | "registration_open"
  | "closed"
  | "running"
  | "finished"
  | "archived"
  | null {
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
    return status as
      | "draft"
      | "announced"
      | "registration_open"
      | "closed"
      | "running"
      | "finished"
      | "archived";
  }
  return null;
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
        </header>

        {tournaments.length === 0 ? (
          <div className="rounded-3xl bg-white/80 border border-white/60 p-6 text-neutral-800 text-sm shadow-lg">
            Пока нет ни одного турнира. Создайте его через админскую панель или
            бот, и данные появятся здесь автоматически.
          </div>
        ) : (
          <section className="grid gap-6 md:grid-cols-2">
            {tournaments.map((t) => (
              <TournamentCard
                key={t.id}
                id={t.id}
                title={t.name}
                date={t.dateStart}
                place={t.venue}
                status={normalizeStatus(t.status)}
              />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
