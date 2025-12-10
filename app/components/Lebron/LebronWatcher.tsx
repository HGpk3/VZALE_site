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
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">Стилизованный Леброн следит за курсором</h2>
            <p className="text-base sm:text-lg text-black/80 max-w-2xl">
              Наведи мышку на экран — и король паркета мягко повернётся вслед. Глаза и голова отслеживают твои движения, сохраняя узнаваемые черты без стремления к фотографичной копии.
            </p>
            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              <span className="rounded-full bg-vz_purple/15 px-4 py-2 text-vz_purple">Интерактив</span>
              <span className="rounded-full bg-vz_green/20 px-4 py-2 text-black">Новый герой</span>
              <span className="rounded-full bg-black/80 px-4 py-2 text-white">Mouse tracking</span>
              <span className="rounded-full bg-gradient-to-r from-[#552583] to-[#FDB927] px-4 py-2 text-white">King vibe</span>
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
              className="relative flex h-[28rem] w-72 flex-col items-center transition-transform duration-150 ease-out"
            >
              <div className="relative h-52 w-48 rounded-[48%] bg-gradient-to-b from-[#7c431d] via-[#603018] to-[#3a1d10] shadow-[0_25px_55px_rgba(0,0,0,0.45)] border-4 border-[#2a180c]">
                <div className="absolute -left-4 top-24 h-10 w-6 rounded-full bg-gradient-to-b from-[#7c431d] to-[#4a2b15] shadow-[inset_0_6px_10px_rgba(0,0,0,0.35)]"></div>
                <div className="absolute -right-4 top-24 h-10 w-6 rounded-full bg-gradient-to-b from-[#7c431d] to-[#4a2b15] shadow-[inset_0_6px_10px_rgba(0,0,0,0.35)]"></div>
                <div className="absolute inset-x-8 top-6 h-6 rounded-full bg-gradient-to-r from-[#FDB927] via-white/90 to-[#FDB927] shadow-[0_4px_14px_rgba(0,0,0,0.45)]"></div>
                <div className="absolute inset-x-8 top-8 h-3 rounded-full bg-[#552583]/80 shadow-[0_2px_8px_rgba(0,0,0,0.35)]"></div>
                <div className="absolute inset-x-14 top-16 h-1 rounded-full bg-black/70 opacity-70"></div>
                <div className="absolute inset-x-12 top-10 h-[18px] rounded-full bg-gradient-to-r from-transparent via-white/12 to-transparent"></div>
                <div className="absolute inset-x-10 top-12 h-[26px] rounded-full bg-gradient-to-r from-transparent via-black/15 to-transparent opacity-60 blur-[0.5px]"></div>
                <div className="absolute inset-x-10 top-[60px] flex justify-between gap-6">
                  <div className="relative h-10 w-12 rounded-[24px] bg-[#F9EBD7] shadow-inner shadow-black/30">
                    <div
                      style={pupilShift}
                      className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black shadow-[0_0_0_3px_rgba(0,0,0,0.05)]"
                    ></div>
                    <div className="absolute left-1/3 top-1/3 h-1.5 w-1.5 rounded-full bg-white/90"></div>
                  </div>
                  <div className="relative h-10 w-12 rounded-[24px] bg-[#F9EBD7] shadow-inner shadow-black/30">
                    <div
                      style={pupilShift}
                      className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black shadow-[0_0_0_3px_rgba(0,0,0,0.05)]"
                    ></div>
                    <div className="absolute left-1/3 top-1/3 h-1.5 w-1.5 rounded-full bg-white/90"></div>
                  </div>
                </div>

                <div className="absolute inset-x-14 top-28 h-3 rounded-full bg-black/70 blur-[0.5px]"></div>
                <div className="absolute inset-x-12 top-30 h-3 rounded-full bg-gradient-to-r from-[#2a160b]/0 via-[#2a160b]/25 to-transparent"></div>
                <div className="absolute inset-x-12 top-32 h-[72px] rounded-b-[32px] bg-gradient-to-b from-[#2d170c] via-[#1c0f07] to-[#100803] shadow-inner shadow-black/40">
                  <div className="absolute inset-x-6 top-10 h-8 rounded-full bg-gradient-to-r from-[#412313]/40 via-transparent to-[#412313]/40 opacity-90"></div>
                  <div className="absolute inset-x-[34px] top-7 h-5 rounded-full bg-gradient-to-b from-[#f3d7b1]/50 to-transparent"></div>
                </div>
                <div className="absolute inset-x-12 top-[135px] h-16 rounded-b-[32px] bg-gradient-to-b from-[#4e2d18] via-[#3a1d10] to-[#2a150c] opacity-90">
                  <div className="absolute inset-x-4 bottom-2 h-2 rounded-full bg-black/20"></div>
                </div>
                <div className="absolute inset-x-14 top-[172px] h-5 rounded-full bg-gradient-to-r from-[#e6b889] via-[#f2d2aa] to-[#e6b889] shadow-[0_6px_14px_rgba(0,0,0,0.35)]"></div>
                <div className="absolute inset-x-20 top-[116px] flex justify-between text-[10px] font-black tracking-[0.2em] text-white/60">
                  <span className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]">KING</span>
                  <span className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]">AKRON</span>
                </div>
                <div className="absolute inset-x-[46px] top-[154px] h-7 rounded-full bg-gradient-to-r from-[#1c0f07]/85 via-[#2c160c]/60 to-[#1c0f07]/85 shadow-[0_6px_10px_rgba(0,0,0,0.35)]"></div>
                <div className="absolute inset-x-[38px] top-[128px] flex justify-between">
                  <div className="h-8 w-6 rounded-full bg-[#2a180c] shadow-[inset_0_6px_10px_rgba(0,0,0,0.4)]"></div>
                  <div className="h-8 w-6 rounded-full bg-[#2a180c] shadow-[inset_0_6px_10px_rgba(0,0,0,0.4)]"></div>
                </div>
                <div className="absolute inset-x-[36px] top-[138px] flex justify-center gap-3 text-[9px] uppercase tracking-[0.1em] text-white/50">
                  <span className="rounded-full bg-white/5 px-2 py-[2px] shadow-[0_2px_6px_rgba(0,0,0,0.35)]">MVP</span>
                  <span className="rounded-full bg-white/5 px-2 py-[2px] shadow-[0_2px_6px_rgba(0,0,0,0.35)]">Finals</span>
                  <span className="rounded-full bg-white/5 px-2 py-[2px] shadow-[0_2px_6px_rgba(0,0,0,0.35)]">GOAT?</span>
                </div>
              </div>

              <div className="relative -mt-1 flex w-56 items-center justify-center rounded-2xl bg-gradient-to-r from-[#552583] via-[#FDB927] to-[#552583] px-6 py-3 text-center text-white shadow-[0_14px_35px_rgba(0,0,0,0.35)] border border-white/20">
                <div className="absolute -left-9 -top-2 h-16 w-10 rounded-[18px] bg-gradient-to-b from-[#7c431d] via-[#603018] to-[#3a1d10] shadow-[inset_0_8px_12px_rgba(0,0,0,0.35)] rotate-[-10deg]"></div>
                <div className="absolute -right-9 -top-2 h-16 w-10 rounded-[18px] bg-gradient-to-b from-[#7c431d] via-[#603018] to-[#3a1d10] shadow-[inset_0_8px_12px_rgba(0,0,0,0.35)] rotate-[10deg]"></div>
                <div className="text-lg font-black tracking-[0.35em] drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]">LEBRON 23</div>
              </div>

              <div className="relative mt-4 flex w-64 flex-col items-center gap-3">
                <div className="relative h-28 w-full rounded-[28px] bg-gradient-to-b from-[#4c2e82] via-[#552583] to-[#3c1f68] shadow-[0_22px_40px_rgba(0,0,0,0.35)] border border-white/10">
                  <div className="absolute inset-x-6 top-2 h-5 rounded-full bg-white/10"></div>
                  <div className="absolute left-4 top-8 h-16 w-14 rounded-[18px] bg-gradient-to-b from-[#7c431d] via-[#603018] to-[#3a1d10] shadow-[inset_0_8px_12px_rgba(0,0,0,0.35)] rotate-[-4deg]"></div>
                  <div className="absolute right-4 top-8 h-16 w-14 rounded-[18px] bg-gradient-to-b from-[#7c431d] via-[#603018] to-[#3a1d10] shadow-[inset_0_8px_12px_rgba(0,0,0,0.35)] rotate-[4deg]"></div>
                  <div className="absolute inset-x-12 bottom-4 h-10 rounded-[16px] bg-gradient-to-r from-[#FDB927] via-[#f9d67c] to-[#FDB927] shadow-[0_10px_24px_rgba(0,0,0,0.3)]"></div>
                  <div className="absolute inset-x-8 bottom-6 h-4 rounded-full bg-gradient-to-r from-white/20 via-transparent to-white/20"></div>
                  <div className="absolute inset-x-16 top-6 h-3 rounded-full bg-gradient-to-r from-[#FDB927]/30 via-white/35 to-[#FDB927]/30"></div>
                  <div className="absolute inset-x-10 top-12 h-1 rounded-full bg-white/20"></div>
                  <div className="absolute inset-x-6 bottom-3 flex justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">
                    <span className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">LAL</span>
                    <span className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">17x</span>
                    <span className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">Champ</span>
                  </div>
                </div>
                <div className="relative h-16 w-48 rounded-[22px] bg-gradient-to-b from-[#1a1040] via-[#0f0a26] to-[#0b071d] shadow-[0_16px_28px_rgba(0,0,0,0.45)]">
                  <div className="absolute inset-x-12 top-4 h-3 rounded-full bg-white/12"></div>
                  <div className="absolute left-6 top-1/2 h-10 w-4 -translate-y-1/2 rounded-full bg-[#FDB927]/80"></div>
                  <div className="absolute right-6 top-1/2 h-10 w-4 -translate-y-1/2 rounded-full bg-[#FDB927]/80"></div>
                  <div className="absolute inset-x-10 top-2 h-[2px] rounded-full bg-gradient-to-r from-[#FDB927]/40 via-white/30 to-[#FDB927]/40"></div>
                  <div className="absolute inset-x-14 bottom-2 h-2 rounded-full bg-[#FDB927]/25"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
