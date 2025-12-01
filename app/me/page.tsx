import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const mockUser = {
  name: "Элена",
  role: "Игрок / капитан",
  status: "В команде",
};

const mockTeam = {
  name: "VZALE SQUAD",
  players: ["Элена", "Данил", "Кирилл", "Андрей"],
  tournament: "VZALE STREET OPEN",
  tournamentStatus: "Подтверждена",
};

const mockTournaments = [
  {
    title: "VZALE STREET OPEN",
    role: "Капитан",
    status: "Регистрация подтверждена",
  },
  {
    title: "VZALE NIGHT RUN",
    role: "Игрок",
    status: "Планируется участие",
  },
  {
    title: "VZALE SEASON FINALS",
    role: "Игрок",
    status: "Турнир завершён",
  },
];

const mockStats = {
  games: 18,
  points: 142,
  mvps: 3,
};

// Личный кабинет /me
export default async function MePage() {
  const cookieStore = await cookies();
  const telegramId = cookieStore.get("vzale_telegram_id")?.value;

  // Если не залогинен — уводим на /login
  if (!telegramId) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#0B0615] via-[#050309] to-black text-white py-16 md:py-20 px-6 md:px-10">
      {/* Неоновый фон */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-10 left-0 w-[260px] h-[200px] bg-vz_purple blur-[110px]" />
        <div className="absolute bottom-0 right-10 w-[260px] h-[220px] bg-vz_green blur-[110px]" />
      </div>

      <div className="relative max-w-6xl mx-auto space-y-10">
        {/* Хедер профиля */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4 md:gap-6">
            {/* Аватар */}
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl md:text-3xl font-bold shadow-[0_12px_35px_rgba(0,0,0,0.5)]">
              {mockUser.name[0]}
            </div>
            <div>
              <p className="text-xs md:text-sm uppercase tracking-[0.25em] text-white/60">
                Личный кабинет
              </p>
              <h1 className="text-2xl md:text-3xl font-extrabold">
                {mockUser.name}
              </h1>
              <p className="text-xs md:text-sm text-white/70 mt-1">
                {mockUser.role} · {mockUser.status}
              </p>
              <p className="text-[11px] text-white/50 mt-1">
                Telegram ID: {telegramId}
              </p>
            </div>
          </div>

          {/* Блок статуса */}
          <div className="flex flex-col items-start md:items-end gap-3">
            <span className="inline-flex items-center px-4 py-2 rounded-full border border-vz_green/70 bg-white/5 text-xs md:text-sm font-semibold">
              Связка с Telegram-ботом активна
            </span>
            <p className="text-[11px] md:text-xs text-white/60 max-w-xs md:text-right">
              Позже здесь будут реальные данные из БД по твоему Telegram ID:
              команда, турниры, статус игрока.
            </p>
          </div>
        </header>

        {/* Основная сетка: команда + статистика */}
        <section className="grid gap-8 md:grid-cols-[1.6fr,1fr] items-start">
          {/* Карточка команды */}
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)] space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg md:text-xl font-semibold">
                  Моя команда
                </h2>
                <p className="text-xs md:text-sm text-white/70 mt-1">
                  {mockTeam.name}
                </p>
              </div>

              <span className="inline-flex items-center px-3 py-1 rounded-full border border-vz_green/70 text-[11px] md:text-xs font-semibold text-vz_green">
                Участвует в турнире
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-xs md:text-sm text-white/60">
                Состав команды:
              </p>
              <ul className="grid grid-cols-2 gap-2 text-sm md:text-base">
                {mockTeam.players.map((p) => (
                  <li
                    key={p}
                    className="rounded-xl bg-white/5 px-3 py-2 border border-white/10 text-white/90"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="text-xs md:text-sm text-white/70">
                <p className="font-medium text-white">
                  Текущий турнир: {mockTeam.tournament}
                </p>
                <p className="text-white/60">
                  Статус заявки: {mockTeam.tournamentStatus}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button className="text-xs md:text-sm font-semibold px-4 py-2 rounded-xl bg-vz_green text-black hover:brightness-110 transition">
                  Управлять составом
                </button>
                <button className="text-xs md:text-sm font-semibold px-4 py-2 rounded-xl border border-white/40 hover:bg:white/10 transition">
                  Покинуть команду
                </button>
              </div>
            </div>
          </div>

          {/* Статистика / ачивки */}
          <div className="space-y-6">
            <div className="rounded-3xl bg:white/5 border border-white/10 p-6 md:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <h2 className="text-lg md:text-xl font-semibold mb-4">
                Статистика
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg:white/5 border border-white/10 px-3 py-3 text-center">
                  <p className="text-xs md:text-sm text-white/60 mb-1">
                    Игры
                  </p>
                  <p className="text-lg md:text-2xl font-bold">
                    {mockStats.games}
                  </p>
                </div>
                <div className="rounded-2xl bg:white/5 border border-white/10 px-3 py-3 text-center">
                  <p className="text-xs md:text-sm text-white/60 mb-1">
                    Очки
                  </p>
                  <p className="text-lg md:text-2xl font-bold">
                    {mockStats.points}
                  </p>
                </div>
                <div className="rounded-2xl bg:white/5 border border-white/10 px-3 py-3 text-center">
                  <p className="text-xs md:text-sm text-white/60 mb-1">
                    MVP
                  </p>
                  <p className="text-lg md:text-2xl font-bold">
                    {mockStats.mvps}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white/5 border border-white/10 p-5 text-xs md:text-sm text-white/70 space-y-2">
              <p>
                Позже здесь появятся достижения (ачивки), рейтинг по сезонам и
                ссылки на лучшие матчи.
              </p>
              <p>
                Эти данные будем брать из той же БД, с которой работает ваш
                бот: статистика матчей, рейтинг игрока, выполненные ачивки.
              </p>
            </div>
          </div>
        </section>

        {/* Мои турниры */}
        <section className="space-y-4">
          <h2 className="text-lg md:text-xl font-semibold">Мои турниры</h2>

          <div className="grid gap-3 md:grid-cols-3">
            {mockTournaments.map((t) => (
              <div
                key={t.title}
                className="rounded-2xl bg-white/5 border border-white/10 px-4 py-4 shadow-[0_16px_45px_rgba(0,0,0,0.5)] flex flex-col gap-2"
              >
                <p className="text-sm md:text-base font-semibold text-white">
                  {t.title}
                </p>
                <p className="text-xs md:text-sm text-white/70">
                  Роль: {t.role}
                </p>
                <p className="text-xs md:text-sm text-vz_green">{t.status}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
