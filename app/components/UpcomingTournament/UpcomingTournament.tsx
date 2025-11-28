const mockTournament = {
  title: "VZALE STREET OPEN",
  date: "27 апреля",
  time: "13:00",
  place: "Санкт-Петербург, ул. Примерная, 5",
  description:
    "Динамичный турнир 3×3 с живой атмосферой, музыкой и медиа-поддержкой. Подходит для игроков с разным уровнем подготовки.",
};

export default function UpcomingTournament() {
  return (
    <section className="relative w-full py-20 px-6 md:px-10 bg-gradient-to-b from-[#15082A] via-[#0A0616] to-[#050309] text-white">
      <div className="max-w-6xl mx-auto">

        {/* Заголовок секции */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-vz_green/80">
              Ближайший турнир
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-2">
              Открытие сезона VZALE
            </h2>
          </div>

          <span className="inline-flex items-center text-sm md:text-base px-4 py-2 rounded-full border border-vz_green/60 bg-violet-900/40 backdrop-blur-sm">
            Регистрация открыта
          </span>
        </div>

        {/* Карточка турнира */}
        <div className="relative rounded-3xl bg-[#120628] border border-vz_green/40 shadow-[0_24px_80px_rgba(0,0,0,0.7)] overflow-hidden">
          {/* Неоновый фон внутри */}
          <div className="absolute -top-24 -left-10 w-[320px] h-[260px] bg-vz_green blur-[120px] opacity-60" />
          <div className="absolute -bottom-24 right-0 w-[380px] h-[280px] bg-vz_purple blur-[120px] opacity-70" />

          <div className="relative z-10 grid md:grid-cols-[2fr,1fr] gap-10 p-8 md:p-10">
            {/* Левая часть — инфа */}
            <div className="space-y-4">
              <h3 className="text-2xl md:text-3xl font-bold">
                {mockTournament.title}
              </h3>

              <div className="text-sm md:text-base text-vz_green/90 font-medium space-y-1">
                <p>
                  {mockTournament.date} · {mockTournament.time}
                </p>
                <p>{mockTournament.place}</p>
              </div>

              <p className="text-sm md:text-base text-white/90 max-w-xl">
                {mockTournament.description}
              </p>

            </div>

            {/* Правая часть — CTA */}
            <div className="flex flex-col justify-between gap-6 md:items-end">
              <div className="space-y-2 text-sm md:text-right">
                <p className="text-xs uppercase tracking-[0.18em] text-white/60">
                  Формат
                </p>
                <p className="text-base md:text-lg font-semibold text-white">
                  Любительский 3×3 · до 12 команд
                </p>
              </div>

              <div className="flex md:flex-col gap-4 md:items-end">
                <button className="bg-vz_green text-black font-semibold text-base md:text-lg px-6 py-3 rounded-xl shadow-[0_0_30px_rgba(164,255,79,0.9)] hover:brightness-110 transition">
                  Участвовать
                </button>

                <button className="border border-white/40 text-white font-medium text-sm md:text-base px-6 py-3 rounded-xl hover:bg-white/10 transition">
                  Подробнее о турнире
                </button>
              </div>
            </div>
          </div>

          {/* Верхняя тонкая рамка для объёма */}
          <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/10" />
        </div>
      </div>
    </section>
  );
}
