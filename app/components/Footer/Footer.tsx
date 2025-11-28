export default function Footer() {
  return (
    <footer className="relative w-full bg-[#050309] text-white py-10 px-6 md:px-10 mt-auto overflow-hidden">
      {/* Неоновый фон для глубины */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-10 left-0 w-[240px] h-[180px] bg-vz_purple blur-[100px]" />
        <div className="absolute bottom-0 right-10 w-[220px] h-[160px] bg-vz_green blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row gap-8 md:gap-0 md:items-center md:justify-between">
        {/* Левая часть */}
        <div className="space-y-2">
          <div className="text-xl font-extrabold tracking-tight">
            VZALE
          </div>
          <p className="text-xs md:text-sm text-white/70 max-w-md">
            Любительские турниры 3×3. Атмосфера, стиль и комьюнити игроков,
            к которым хочется возвращаться.
          </p>
        </div>

        {/* Средняя часть — ссылки */}
        <nav className="flex flex-wrap gap-4 text-xs md:text-sm text-white/70">
          <a href="#tournaments" className="hover:text-white transition">
            Турниры
          </a>
          <a href="#teams" className="hover:text-white transition">
            Команды
          </a>
          <a href="#about" className="hover:text-white transition">
            О проекте
          </a>
          <a href="#contacts" className="hover:text-white transition">
            Контакты
          </a>
        </nav>

        {/* Правая часть — копирайт */}
        <div className="text-xs md:text-sm text-white/60 md:text-right">
          <p>© {new Date().getFullYear()} VZALE 3×3</p>
          <p>Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}
