import TournamentCard from "../components/Tournaments/TournamentCard";

const mockTournaments = [
  {
    id: 1,
    title: "VZALE STREET OPEN",
    date: "27 апреля · 13:00",
    place: "Санкт-Петербург, площадка VZALE",
    status: "upcoming" as const,
    type: "Любительский 3×3 · до 12 команд",
  },
  {
    id: 2,
    title: "VZALE NIGHT RUN",
    date: "15 июня · 18:00",
    place: "Санкт-Петербург, outdoor площадка",
    status: "upcoming" as const,
    type: "Вечерний турнир · музыка · медиа",
  },
  {
    id: 3,
    title: "VZALE SEASON FINALS",
    date: "Состоялся: 5 марта",
    place: "Санкт-Петербург",
    status: "finished" as const,
    type: "Финальный турнир сезона",
  },
];

export default function TournamentsPage() {
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

        <section className="grid gap-6 md:grid-cols-2">
          {mockTournaments.map((t) => (
            <TournamentCard
              key={t.id}
              id={t.id}
              title={t.title}
              date={t.date}
              place={t.place}
              status={t.status}
              type={t.type}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
