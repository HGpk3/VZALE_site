import Image from "next/image";

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
          <div className="absolute inset-0 rounded-3xl bg-vz-gradient shadow-[0_24px_60px_rgba(0,0,0,0.25)] overflow-hidden">
            <Image
              src="/vzale-block.svg"
              alt="VZALE"
              fill
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-vz_green/10 to-transparent mix-blend-screen" />
          </div>
          <div className="absolute -inset-[1px] rounded-3xl border border-white/40 pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
