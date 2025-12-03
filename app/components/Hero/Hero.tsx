import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-vz-gradient flex flex-col items-center justify-center text-center px-6">
      {/* Неоновые мазки (салатовые) */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute top-20 left-10 w-[600px] h-[200px] bg-vz_green blur-[90px] rotate-[12deg] opacity-40"></div>
        <div className="absolute bottom-20 right-10 w-[600px] h-[220px] bg-vz_green blur-[80px] -rotate-[8deg] opacity-30"></div>
      </div>

      {/* Легкая туманность-облако для объёма */}
      <div className="absolute inset-0 bg-white opacity-[0.08] blur-[120px] mix-blend-overlay"></div>

      {/* Логотип */}
      <h1 className="text-[96px] font-black tracking-tight text-vz_text relative z-10 drop-shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
        VZALE
      </h1>

      {/* Подзаголовок */}
      <p className="relative z-10 text-xl md:text-2xl font-semibold text-vz_text mt-2 opacity-90">
        Любительские турниры 3×3 нового поколения
      </p>

      {/* Кнопки */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-10 relative z-10">
        <Link href="/participate">
          <button className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-vz_purple to-vz_green px-8 py-3 text-lg font-semibold text-black shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition hover:from-[#7d5cff] hover:to-[#b2ff6c]">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-vz_purple font-bold shadow-inner">
              →
            </span>
            <span className="leading-tight text-left">Принять участие</span>
          </button>
        </Link>

        <Link href="/tournaments">
          <button className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/70 bg-white/10 px-8 py-3 text-lg font-semibold text-white backdrop-blur transition hover:border-vz_green hover:bg-white/20 hover:text-vz_green">
            <span className="h-2 w-2 rounded-full bg-vz_green shadow-[0_0_0_6px_rgba(80,255,144,0.25)]"></span>
            <span>Список турниров</span>
          </button>
        </Link>
        <Link href="/me">
          <button className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-vz_purple px-8 py-3 text-lg font-semibold shadow-[0_12px_35px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 hover:bg-vz_green hover:text-black">
            <span className="h-2 w-2 rounded-full bg-vz_purple shadow-[0_0_0_6px_rgba(114,60,255,0.25)]"></span>
            <span>Личный кабинет</span>
          </button>
        </Link>
      </div>
    </section>
  );
}
