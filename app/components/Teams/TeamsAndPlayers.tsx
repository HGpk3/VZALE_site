const teams = [
  {
    name: "LIONS",
    status: "Участвует",
    playersCount: 4,
  },
  {
    name: "DRIVE",
    status: "Заявка",
    playersCount: 4,
  },
  {
    name: "WOLKES",
    status: "Участвует",
    playersCount: 3,
  },
  {
    name: "BLL",
    status: "Участвует",
    playersCount: 4,
  },
];

const players = [
  { name: "Кирилл Л.", points: 185 },
  { name: "Андрей С.", points: 163 },
  { name: "Иван К.", points: 149 },
  { name: "Данил Ч.", points: 132 },
];

export default function TeamsAndPlayers() {
  return (
    <section className="relative w-full py-20 md:py-24 px-6 md:px-10 bg-gradient-to-b from-[#0B0615] via-[#050309] to-black text-white">
      {/* Лёгкий неоновый фон для глубины */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-10 left-0 w-[280px] h-[200px] bg-vz_purple blur-[110px]" />
        <div className="absolute bottom-0 right-10 w-[260px] h-[220px] bg-vz_green blur-[110px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Заголовок */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold">
            Команды и топ игроки
          </h2>
          <p className="text-sm md:text-base text-white/70 max-w-md">
            Здесь собраны команды, которые уже с нами, и игроки, которые задают
            темп турнирам VZALE.
          </p>
        </div>

        {/* Две колонки */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Лево — команды */}
          <div className="space-y-4">
            <h3 className="text-lg md:text-xl font-semibold mb-2">
              Команды
            </h3>

            <div className="space-y-3">
              {teams.map((team) => (
                <div
                  key={team.name}
                  className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 px-4 py-3 md:px-5 md:py-4 shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
                >
                  <div className="flex items-center gap-3">
                    {/* Кружок-аватар команды */}
                    <div className="w-10 h-10 rounded-full bg-vz_purple_dark flex items-center justify-center text-sm font-bold">
                      {team.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm md:text-base">
                        {team.name}
                      </p>
                      <p className="text-xs md:text-sm text-white/60">
                        Игроков: {team.playersCount}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs md:text-sm px-3 py-1 rounded-full border ${
                      team.status === "Участвует"
                        ? "border-vz_green text-vz_green"
                        : "border-white/40 text-white/80"
                    }`}
                  >
                    {team.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Право — топ игроки */}
          <div className="space-y-4">
            <h3 className="text-lg md:text-xl font-semibold mb-2">
              Топ игроки
            </h3>

            <div className="rounded-2xl bg-white/5 border border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.6)] overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10 text-xs md:text-sm uppercase tracking-[0.18em] text-white/60">
                Рейтинг по очкам
              </div>

              <ul className="divide-y divide-white/8">
                {players.map((p, index) => (
                  <li
                    key={p.name}
                    className="flex items-center justify-between px-5 py-3 md:py-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/10 flex items-center justify-center text-xs md:text-sm font-semibold">
                        {index + 1}
                      </span>
                      <span className="text-sm md:text-base font-medium">
                        {p.name}
                      </span>
                    </div>
                    <span className="text-sm md:text-base font-semibold text-vz_green">
                      {p.points}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs md:text-sm text-white/60">
              В будущем этот блок будет подтягивать данные из вашей БД:
              статистику матчей, рейтинг за сезон и индивидуальные рекорды.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
