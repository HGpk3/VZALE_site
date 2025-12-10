"use client";

import { useEffect, useRef, useState } from "react";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function LebronWatcher() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cursorOffset, setCursorOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rawX = (event.clientX - centerX) / (rect.width / 2);
      const rawY = (event.clientY - centerY) / (rect.height / 2);

      setCursorOffset({
        x: clamp(rawX, -1, 1),
        y: clamp(rawY, -1, 1),
      });
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  const pupilShift = {
    transform: `translate(${cursorOffset.x * 8}px, ${cursorOffset.y * 8}px)`,
  };

  const headShift = {
    transform: `translate(${cursorOffset.x * 6}px, ${cursorOffset.y * 3}px) rotate(${cursorOffset.x * 6}deg)`,
  };

  return (
    <section className="relative py-16 px-4 sm:px-6 lg:px-10 text-vz_text">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-white/60 bg-white/55 p-6 sm:p-8 shadow-[0_30px_80px_rgba(0,0,0,0.15)] backdrop-blur-xl overflow-hidden">
        <div className="pointer-events-none absolute -left-14 -top-10 h-40 w-40 rounded-full bg-vz_purple blur-[90px] opacity-60"></div>
        <div className="pointer-events-none absolute -right-16 bottom-10 h-48 w-48 rounded-full bg-vz_green blur-[120px] opacity-70"></div>

        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] items-center">
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/80 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow-lg">
              <span className="inline-block h-2 w-2 rounded-full bg-vz_green animate-pulse"></span>
              Курсовой взгляд активен
            </div>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">Леброн Джейсон следит за курсором</h2>
            <p className="text-base sm:text-lg text-black/80 max-w-2xl">
              Наведи мышку на экран — и икона площадки мягко повернётся вслед. Глаза и голова отслеживают твои движения, создавая эффект живого персонажа в стиле VZALE.
            </p>
            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              <span className="rounded-full bg-vz_purple/15 px-4 py-2 text-vz_purple">Интерактив</span>
              <span className="rounded-full bg-vz_green/20 px-4 py-2 text-black">Новый герой</span>
              <span className="rounded-full bg-black/80 px-4 py-2 text-white">Mouse tracking</span>
            </div>
          </div>

          <div
            ref={cardRef}
            className="relative z-10 flex items-center justify-center rounded-3xl bg-gradient-to-br from-[#0D0825] via-[#1A1040] to-[#0A0620] p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.25)]"
          >
            <div className="absolute inset-x-10 top-6 h-10 rounded-full bg-white/5 blur-3xl"></div>
            <div className="absolute left-8 top-8 h-16 w-16 rounded-full bg-vz_purple/40 blur-2xl"></div>
            <div className="absolute right-8 bottom-8 h-20 w-20 rounded-full bg-vz_green/35 blur-2xl"></div>

            <div
              style={headShift}
              className="relative flex h-72 w-64 flex-col items-center transition-transform duration-150 ease-out"
            >
              <div className="relative h-48 w-48 rounded-[42%] bg-gradient-to-br from-[#5C3BFF] via-[#2E1F60] to-[#120C2A] shadow-[0_25px_55px_rgba(0,0,0,0.45)] border-4 border-[#1A123B]">
                <div className="absolute inset-x-6 top-8 h-6 rounded-full bg-gradient-to-r from-vz_green to-[#d8ff9c] shadow-[0_4px_12px_rgba(0,0,0,0.25)]"></div>
                <div className="absolute inset-x-10 top-16 flex justify-between gap-6">
                  <div className="relative h-10 w-12 rounded-[24px] bg-white shadow-inner shadow-black/30">
                    <div
                      style={pupilShift}
                      className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black shadow-[0_0_0_3px_rgba(0,0,0,0.05)]"
                    ></div>
                    <div className="absolute left-1/3 top-1/3 h-1.5 w-1.5 rounded-full bg-white/90"></div>
                  </div>
                  <div className="relative h-10 w-12 rounded-[24px] bg-white shadow-inner shadow-black/30">
                    <div
                      style={pupilShift}
                      className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black shadow-[0_0_0_3px_rgba(0,0,0,0.05)]"
                    ></div>
                    <div className="absolute left-1/3 top-1/3 h-1.5 w-1.5 rounded-full bg-white/90"></div>
                  </div>
                </div>

                <div className="absolute inset-x-14 top-28 h-3 rounded-full bg-black/70 blur-[0.5px]"></div>

                <div className="absolute inset-x-12 top-32 h-20 rounded-b-[36px] bg-gradient-to-b from-[#3B2B7A] to-[#1B123E] shadow-inner shadow-black/30"></div>
                <div className="absolute inset-x-16 top-[158px] h-6 rounded-full bg-gradient-to-r from-[#FBB040] to-[#FF5C5C] shadow-[0_8px_20px_rgba(0,0,0,0.3)]"></div>
              </div>

              <div className="mt-4 flex w-48 items-center justify-center rounded-2xl bg-gradient-to-r from-[#FF8D23] to-[#FF3C6F] px-6 py-3 text-center text-white shadow-[0_14px_35px_rgba(0,0,0,0.35)]">
                <div className="text-lg font-black tracking-widest drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]">JASON 23</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
