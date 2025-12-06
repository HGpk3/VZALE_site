"use client";

import { useEffect, useRef, useState } from "react";

const ideas = [
  {
    title: "Световые дорожки",
    desc: "Мягкие лучи реагируют на прокрутку и ведут к следующим блокам — ощущение, будто ты двигаешься по туннелю арены.",
  },
  {
    title: "Момент хайлайта",
    desc: "Отметь лучший эпизод матча, и он загорается на шкале прокрутки, чтобы друзья тоже увидели эмоцию.",
  },
  {
    title: "Ритм площадки",
    desc: "Лёгкая вибрация и микродвижение иконок показывают пульс зала и помогают чувствовать, что турнир живой.",
  },
];

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export default function ScrollShowcase() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const node = sectionRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const total = rect.height + window.innerHeight;
      const seen = window.innerHeight - rect.top;
      setProgress(clamp(seen / total, 0, 1));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const streakShift = (progress - 0.5) * 140;
  const glowScale = 0.9 + progress * 0.35;
  const orbitAngle = progress * Math.PI * 2;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#05050a] text-white px-6 md:px-10 py-16 md:py-20"
    >
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div
          className="absolute right-[-160px] top-[-180px] h-[480px] w-[520px] rounded-full bg-gradient-to-br from-vz_green/50 to-vz_purple/40 blur-[140px]"
          style={{ transform: `translate3d(0, ${streakShift}px, 0) scale(${glowScale})` }}
        />
        <div
          className="absolute left-[-220px] bottom-[-160px] h-[500px] w-[360px] bg-gradient-to-b from-vz_purple/50 via-white/5 to-transparent blur-[140px]"
          style={{ transform: `translate3d(0, ${streakShift * -0.7}px, 0) rotate(${orbitAngle / 12}rad)` }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 30% 20%, rgba(164,255,79,0.08), transparent 38%), radial-gradient(circle at 80% 50%, rgba(164,92,255,0.12), transparent 42%)",
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-vz_green uppercase tracking-[0.12em]">Игровой вайб</p>
            <h3 className="text-3xl md:text-4xl font-black leading-tight">
              Эффекты, которые ощущаются при прокрутке
            </h3>
            <p className="text-sm md:text-base text-white/80 max-w-2xl">
              Хотим, чтобы даже скролл был частью шоу: мягкие блики, небольшие всплески
              и подсказки о том, что впереди. Игроки видят, что площадка живёт вместе
              с ними.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs md:text-sm text-white/70">
            <div className="h-[2px] w-36 bg-white/10">
              <div
                className="h-[2px] rounded-full bg-gradient-to-r from-vz_green via-white to-vz_purple"
                style={{ width: `${clamp(progress * 100, 8, 100)}%` }}
              />
            </div>
            <span className="font-semibold text-white/90">{Math.round(progress * 100)}%</span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {ideas.map((idea) => (
            <div
              key={idea.title}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-7 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
            >
              <div className="absolute right-6 top-6 h-10 w-10 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
              <div className="relative z-10 space-y-2">
                <h4 className="text-lg font-semibold">{idea.title}</h4>
                <p className="text-sm text-white/75 leading-relaxed">{idea.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-5 md:px-8 md:py-7 backdrop-blur-lg">
          <div
            className="absolute -left-10 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-gradient-to-br from-vz_green/60 to-vz_purple/60 blur-2xl"
            style={{ transform: `translate3d(${Math.sin(orbitAngle) * 20 - 40}px, ${Math.cos(orbitAngle) * 10}px, 0)` }}
          />
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm uppercase tracking-[0.12em] text-white/60">Идея для вау-эффекта</p>
              <h4 className="text-2xl md:text-3xl font-semibold">Секция хайлайтов на скролле</h4>
              <p className="text-sm md:text-base text-white/75 max-w-3xl">
                Делимся клипами и моментами прямо в потоке прокрутки: при остановке на клипе
                он вспыхивает, и можно быстро кинуть его другу. Готовая точка, чтобы удивить
                игроков и зрителей.
              </p>
            </div>
            <div className="relative h-16 w-full md:w-48">
              <div className="absolute inset-0 rounded-2xl border border-white/15 bg-white/10" />
              <div
                className="absolute left-2 top-2 h-12 w-12 rounded-xl bg-gradient-to-br from-vz_green to-vz_purple flex items-center justify-center text-black font-bold shadow-[0_12px_30px_rgba(164,255,79,0.45)]"
                style={{ transform: `translate3d(${Math.sin(orbitAngle) * 12}px, ${Math.cos(orbitAngle) * 12}px, 0)` }}
              >
                GO
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] uppercase tracking-[0.18em] text-white/60">
                Показать клип
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
