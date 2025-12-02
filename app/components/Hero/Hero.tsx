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
      <div className="flex gap-6 mt-10 relative z-10">
        <Link href="/participate">
            <button className="bg-vz_green text-black py-3 px-10 rounded-xl text-lg font-semibold transition shadow-[0_20px_60px_rgba(0,0,0,0.35)] hover:brightness-110">
            Принять участие
            </button>
        </Link>

        <Link href="/tournaments">
            <button className="border-2 border-vz_green text-vz_text py-3 px-10 rounded-xl text-lg font-semibold transition hover:bg-vz_purple hover:text-white hover:shadow-xl">
            Список турниров
            </button>
        </Link>
        <Link href="/me">
            <button className="bg-white/15 border-2 border-white/25 text-white py-3 px-10 rounded-xl text-lg font-semibold transition hover:bg-white/25 hover:shadow-[0_12px_35px_rgba(0,0,0,0.25)]">
            Личный кабинет
            </button>
        </Link>
        </div>



    </section>
  );
}
