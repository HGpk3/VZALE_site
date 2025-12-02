import Link from "next/link";

type TournamentStatus = "upcoming" | "in_progress" | "finished";

interface TournamentDetails {
  id: number;
  title: string;
  date: string;
  time: string;
  place: string;
  status: TournamentStatus;
  type: string;
  description: string;
  format: string;
  prizes: string;
}

const mockTournaments: TournamentDetails[] = [
  {
    id: 1,
    title: "VZALE STREET OPEN",
    date: "27 апреля",
    time: "13:00",
    place: "Санкт-Петербург, площадка VZALE",
    status: "upcoming",
    type: "Любительский 3×3 · до 12 команд",
    description:
      "Открытие сезона VZALE. Динамичный турнир 3×3 с живой атмосферой, музыкой и медиа-сопровождением. Формат создан для игроков, которые любят комбинацию соревновательности и кайфа от игры.",
    format:
      "Команды 3×3, до 4 игроков в заявке. Групповой этап + плей-офф. Игры до 11 или 21 очка (по регламенту турнира).",
    prizes:
      "Призы от партнёров, индивидуальные награды MVP, лучший бомбардир, медали и дополнительные призы от VZALE.",
  },
  {
    id: 2,
    title: "VZALE NIGHT RUN",
    date: "15 июня",
    time: "18:00",
    place: "Санкт-Петербург, outdoor площадка",
    status: "upcoming",
    type: "Вечерний турнир 3×3 · музыка · медиа",
    description:
      "Вечерний турнир с акцентом на атмосферу: музыка, свет и медиа. Формат для тех, кто любит играть под музыку и камерой.",
    format:
      "Команды 3×3, до 5 игроков в заявке. Смешанный формат с сеткой и матчами за каждое место.",
    prizes:
      "Призы от партнёров, фотосессия, видеоролики с лучшими моментами, индивидуальные награды.",
  },
  {
    id: 3,
    title: "VZALE SEASON FINALS",
    date: "5 марта",
    time: "12:00",
    place: "Санкт-Петербург",
    status: "finished",
    type: "Финальный турнир сезона",
    description:
      "Финальный турнир сезона VZALE с участием лучших команд по итогам нескольких этапов. Высокий уровень конкуренции и сильные составы.",
    format:
      "Закрытый турнир по приглашению. Плей-офф сетка, матчи за 3 место и финал. Дополнительные активности для зрителей.",
    prizes:
      "Кубок VZALE, индивидуальные награды, медали и подарки от спонсоров.",
  },
];

const statusLabel: Record<TournamentStatus, string> = {
  upcoming: "Регистрация открыта",
  in_progress: "Турнир идёт",
  finished: "Турнир завершён",
};

export default function TournamentPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  const t = mockTournaments.find((x) => x.id === id);

  if (!t) {
    return (
      <main className="min-h-screen w-full bg-vz-gradient flex items-center justify-center px-6">
        <div className="max-w-md text-center bg-white/80 rounded-3xl p-8 shadow-xl">
          <h1 className="text-2xl font-extrabold text-vz_text mb-2">
            Турнир не найден
          </h1>
          <p className="text-sm text-neutral-700 mb-4">
            Возможно, этот турнир ещё не добавлен или ссылка неверна.
          </p>
          <Link
            href="/tournaments"
            className="inline-flex items-center justify-center px-5 py-2 rounded-xl bg-vz_purple_dark text-white text-sm font-semibold hover:bg-vz_purple transition"
          >
            Вернуться к списку турниров
          </Link>
        </div>
      </main>
    );
  }

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
            Турнир VZALE
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold">{t.title}</h1>

          <div className="flex flex-wrap items-center gap-3 text-sm md:text-base text-white/80">
            <span>
              {t.date} · {t.time}
            </span>
            <span className="text-white/60">•</span>
            <span>{t.place}</span>
            <span className="text-white/60">•</span>
            <span className="text-vz_green">{t.type}</span>
          </div>

          <span className="inline-flex items-center px-4 py-1 rounded-full border border-vz_green/70 bg-white/5 text-xs md:text-sm font-semibold">
            {statusLabel[t.status]}
          </span>
        </header>

        {/* Основной блок */}
        <section className="grid gap-8 md:grid-cols-[2fr,1.2fr] items-start">
          {/* Описание / формат / призы */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <h2 className="text-xl md:text-2xl font-semibold mb-3">
                О турнире
              </h2>
              <p className="text-sm md:text-base text-white/80 leading-relaxed">
                {t.description}
              </p>
            </div>

            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-7 space-y-4">
              <div>
                <h3 className="text-base md:text-lg font-semibold mb-1">
                  Формат и регламент
                </h3>
                <p className="text-sm md:text-base text-white/80 leading-relaxed">
                  {t.format}
                </p>
              </div>

              <div>
                <h3 className="text-base md:text-lg font-semibold mb-1">
                  Призы и награды
                </h3>
                <p className="text-sm md:text-base text-white/80 leading-relaxed">
                  {t.prizes}
                </p>
              </div>
            </div>
          </div>

          {/* Правая колонка — CTA и «будущие» блоки */}
          <aside className="space-y-6">
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)] space-y-4">
              <h3 className="text-base md:text-lg font-semibold">
                Принять участие
              </h3>
              <p className="text-xs md:text-sm text-white/75">
                На следующем шаге мы свяжем эту кнопку с регистрацией через
                сайт и бот: выбор команды, создание новой или вход как свободный
                игрок.
              </p>
              <button className="w-full mt-2 bg-vz_green text-black font-semibold text-sm md:text-base px-5 py-3 rounded-xl shadow-[0_0_30px_rgba(164,255,79,0.9)] hover:brightness-110 transition">
                Зарегистрировать команду
              </button>
            </div>

            <div className="rounded-3xl bg-white/5 border border-white/10 p-5 md:p-6 text-xs md:text-sm text-white/70 space-y-2">
              <p>
                В будущем здесь можно будет показать список команд, сетку,
                расписание матчей и прямые ссылки на фото/видео с турнира.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
