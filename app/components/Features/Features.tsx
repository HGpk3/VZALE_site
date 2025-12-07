const features = [
  {
    title: "Атмосфера",
    desc: "Музыка, свет, эмоции. Турнир ощущается как вечерний стрит-ивент, а не просто соревнование.",
    icon: "🎧",
  },
  {
    title: "Команда",
    desc: "Комьюнити игроков, организаторов и зрителей, где каждый чувствует себя частью движения.",
    icon: "🧩",
  },
  {
    title: "Стиль",
    desc: "Фирменный визуал, мерч, медийка и образ VZALE — всё продумано до деталей.",
    icon: "⚡",
  },
  {
    title: "Медиа",
    desc: "Фото, видео, клипы и сторис — мы сохраняем лучший момент каждого турнира.",
    icon: "📸",
  },
];

export default function Features() {
  return (
    <section className="relative w-full py-20 md:py-24 px-6 md:px-10 bg-white/80 backdrop-blur-xl appear-block">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Заголовок */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold text-vz_text">
            Наш стиль — наша энергия
          </h2>
          <p className="text-sm md:text-base text-neutral-700 max-w-2xl mx-auto">
            VZALE — это не только игры. Это настроение, визуал и люди вокруг
            площадки. Мы хотим, чтобы каждый турнир чувствовался как событие.
          </p>
        </div>

        {/* Сетка карточек */}
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="relative rounded-3xl bg-white/90 border border-purple-100 shadow-[0_18px_50px_rgba(0,0,0,0.06)] overflow-hidden px-6 py-6 md:px-7 md:py-7 flex gap-4 items-start"
            >
              {/* Неоновый блик */}
              <div className="absolute -bottom-10 right-0 w-[180px] h-[140px] bg-vz_purple blur-[80px] opacity-40 pointer-events-none" />

              <div className="relative z-10">
                <div className="text-2xl mb-2">{f.icon}</div>
                <h3 className="text-lg md:text-xl font-semibold text-vz_text mb-1">
                  {f.title}
                </h3>
                <p className="text-sm md:text-base text-neutral-700 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
