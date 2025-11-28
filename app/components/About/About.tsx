export default function About() {
  return (
    <section className="relative w-full bg-white/70 backdrop-blur-xl py-20 md:py-28 px-6 md:px-10">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">

        {/* Левый блок — текст */}
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-vz_text">
            Что такое VZALE?
          </h2>

          <p className="text-base md:text-lg text-neutral-800 leading-relaxed">
            Мы создаём пространство, где баскетбол становится движением.
            Это не просто турнир 3×3 — это атмосфера, стиль и комьюнити,
            в котором хочется играть и возвращаться.
          </p>

          <ul className="space-y-2 text-sm md:text-base text-neutral-900">
            <li>• Турниры с уникальной атмосферой и музыкой</li>
            <li>• Комьюнити сильных и амбициозных игроков</li>
            <li>• Фото, видео, медиа и стиль на каждом ивенте</li>
          </ul>
        </div>

        {/* Правый блок — визуал */}
        <div className="relative h-[260px] md:h-[320px]">
          {/* Объёмный градиентный блок */}
          <div className="absolute inset-0 rounded-3xl bg-vz-gradient shadow-[0_24px_60px_rgba(0,0,0,0.25)] overflow-hidden">
            {/* Неоновый свет внутри */}
            <div className="absolute -top-10 left-6 w-[260px] h-[180px] bg-vz_green blur-[80px] opacity-60" />
            <div className="absolute bottom-0 right-0 w-[280px] h-[200px] bg-vz_green blur-[90px] opacity-40" />
            {/* Лёгкий слой "дыма" */}
            <div className="absolute inset-0 bg-white/5 mix-blend-screen" />
          </div>

          {/* Тонкая рамка сверху для глубины */}
          <div className="absolute -inset-[1px] rounded-3xl border border-white/40 pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
