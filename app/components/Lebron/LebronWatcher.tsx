"use client";

import { useEffect, useRef } from "react";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function LeBronCharacter() {
  const stageRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const pupilRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      const stage = stageRef.current;
      const head = headRef.current;
      if (!stage || !head) return;

      const rect = stage.getBoundingClientRect();
      const relativeX = event.clientX - rect.left;
      const relativeY = event.clientY - rect.top;
      const normalizedX = clamp(relativeX / rect.width - 0.5, -0.75, 0.75);
      const normalizedY = clamp(relativeY / rect.height - 0.5, -0.75, 0.75);

      const headTranslateX = normalizedX * 18;
      const headTranslateY = normalizedY * 10;

      head.style.transform = `translate(${headTranslateX}px, ${headTranslateY}px) rotate(${normalizedX * 8}deg)`;

      pupilRefs.current.forEach((pupil) => {
        pupil.style.transform = `translate(${normalizedX * 12}px, ${normalizedY * 12}px)`;
      });
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  const setPupilRef = (element: HTMLDivElement | null, index: number) => {
    if (element) {
      pupilRefs.current[index] = element;
    }
  };

  return (
    <div
      ref={stageRef}
      className="relative flex h-[540px] w-full max-w-[420px] items-center justify-center overflow-visible"
    >
      <div className="absolute inset-0 rounded-[36px] bg-gradient-to-b from-[#110a2c] via-[#1c1148] to-[#0b0720] opacity-80 blur-3xl"></div>
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div
          ref={headRef}
          className="character-head relative flex h-64 w-56 flex-col items-center transition-transform duration-150 ease-out"
        >
          <div className="absolute -left-6 top-24 h-10 w-8 rounded-full bg-gradient-to-b from-[#7c4924] via-[#5b3218] to-[#3a1d0f] shadow-[inset_0_6px_10px_rgba(0,0,0,0.35)]"></div>
          <div className="absolute -right-6 top-24 h-10 w-8 rounded-full bg-gradient-to-b from-[#7c4924] via-[#5b3218] to-[#3a1d0f] shadow-[inset_0_6px_10px_rgba(0,0,0,0.35)]"></div>

          <div className="character-face relative h-full w-full rounded-[52%] bg-gradient-to-b from-[#8a5229] via-[#6b3b1d] to-[#3c2112] shadow-[0_28px_55px_rgba(0,0,0,0.45)] border-4 border-[#2c180c]">
            <div className="absolute inset-x-10 top-6 h-7 rounded-full bg-gradient-to-r from-[#f4c144] via-white/90 to-[#f4c144] shadow-[0_6px_14px_rgba(0,0,0,0.45)]"></div>
            <div className="absolute inset-x-10 top-9 h-4 rounded-full bg-[#6f45ff]/80 shadow-[0_2px_9px_rgba(0,0,0,0.35)]"></div>
            <div className="absolute inset-x-14 top-12 h-2 rounded-full bg-white/30"></div>

            <div className="character-eyes absolute inset-x-12 top-16 flex justify-between">
              <div className="relative h-12 w-14 rounded-[28px] bg-[#f9ebd7] shadow-inner shadow-black/30 overflow-hidden">
                <div className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-white/40 via-transparent to-black/10"></div>
                <div
                  ref={(node) => setPupilRef(node, 0)}
                  className="pupil absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-black to-[#1e0f06] shadow-[0_0_0_4px_rgba(0,0,0,0.05)] transition-transform duration-150 ease-out"
                >
                  <div className="absolute left-[30%] top-[24%] h-2 w-2 rounded-full bg-white/85"></div>
                </div>
              </div>
              <div className="relative h-12 w-14 rounded-[28px] bg-[#f9ebd7] shadow-inner shadow-black/30 overflow-hidden">
                <div className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-white/40 via-transparent to-black/10"></div>
                <div
                  ref={(node) => setPupilRef(node, 1)}
                  className="pupil absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-black to-[#1e0f06] shadow-[0_0_0_4px_rgba(0,0,0,0.05)] transition-transform duration-150 ease-out"
                >
                  <div className="absolute left-[30%] top-[24%] h-2 w-2 rounded-full bg-white/85"></div>
                </div>
              </div>
            </div>

            <div className="absolute inset-x-14 top-32 h-4 rounded-full bg-black/70 blur-[0.6px]"></div>
            <div className="absolute inset-x-12 top-[138px] h-16 rounded-b-[36px] bg-gradient-to-b from-[#352012] via-[#24150c] to-[#120a06] shadow-inner shadow-black/35">
              <div className="absolute inset-x-8 top-8 h-8 rounded-full bg-gradient-to-r from-[#412313]/40 via-transparent to-[#412313]/40 opacity-90"></div>
              <div className="absolute inset-x-10 bottom-2 h-3 rounded-full bg-[#f6d8ad]/30"></div>
            </div>
            <div className="absolute inset-x-16 top-[188px] h-6 rounded-full bg-gradient-to-r from-[#e6b889] via-[#f2d2aa] to-[#e6b889] shadow-[0_6px_14px_rgba(0,0,0,0.35)]"></div>
          </div>
        </div>

        <div className="character-body relative mt-6 flex w-64 flex-col items-center">
          <div className="absolute -left-14 top-4 h-28 w-10 rounded-full bg-gradient-to-b from-[#7c4924] via-[#5b3218] to-[#3a1d0f] shadow-[inset_0_8px_12px_rgba(0,0,0,0.35)] rotate-[-14deg]"></div>
          <div className="absolute -right-14 top-4 h-28 w-10 rounded-full bg-gradient-to-b from-[#7c4924] via-[#5b3218] to-[#3a1d0f] shadow-[inset_0_8px_12px_rgba(0,0,0,0.35)] rotate-[14deg]"></div>

          <div className="relative w-full rounded-[40px] bg-gradient-to-b from-[#6f45ff] via-[#5b36d6] to-[#391f77] p-5 shadow-[0_22px_40px_rgba(0,0,0,0.35)] border border-white/10">
            <div className="absolute inset-x-10 -top-4 h-5 rounded-full bg-white/20"></div>
            <div className="absolute inset-x-8 top-0 h-3 rounded-full bg-white/10"></div>
            <div className="relative flex h-28 items-center justify-center rounded-[32px] bg-gradient-to-b from-[#7c4924] via-[#5b3218] to-[#3a1d0f] shadow-[inset_0_10px_16px_rgba(0,0,0,0.35)]">
              <div className="absolute inset-x-10 top-4 h-2 rounded-full bg-white/10"></div>
              <div className="absolute inset-x-8 bottom-4 h-5 rounded-full bg-gradient-to-r from-[#f4c144]/70 via-[#f9d67c]/85 to-[#f4c144]/70"></div>
              <div className="text-3xl font-black tracking-[0.28em] text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
                L23
              </div>
            </div>
          </div>

          <div className="relative mt-4 h-8 w-40 rounded-full bg-gradient-to-r from-[#f4c144]/70 via-[#f9d67c]/85 to-[#f4c144]/70 shadow-[0_12px_22px_rgba(0,0,0,0.3)]"></div>
          <div className="relative mt-3 h-16 w-56 rounded-[28px] bg-gradient-to-b from-[#120c2f] via-[#0c081f] to-[#080515] shadow-[0_16px_28px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-x-14 top-4 h-3 rounded-full bg-white/12"></div>
            <div className="absolute inset-x-12 bottom-3 h-2 rounded-full bg-[#f4c144]/25"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LebronWatcher() {
  return (
    <section className="relative flex min-h-screen items-center justify-center px-4 py-16 text-vz_text">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(111,69,255,0.18),transparent_36%),radial-gradient(circle_at_80%_30%,rgba(244,193,68,0.18),transparent_32%),radial-gradient(circle_at_50%_80%,rgba(76,201,160,0.18),transparent_32%)]"></div>
      <div className="relative z-10 grid w-full max-w-6xl grid-cols-1 items-center gap-10 rounded-[36px] border border-white/30 bg-white/60 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.15)] backdrop-blur-xl md:grid-cols-[1.1fr_0.9fr] md:p-12">
        <div className="space-y-6">
          <p className="inline-flex rounded-full border border-white/40 bg-white/30 px-4 py-1 text-sm font-semibold uppercase tracking-[0.25em] text-[#6f45ff] shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
            stylized lebron look
          </p>
          <h2 className="text-4xl font-black leading-tight text-[#120c2f] sm:text-5xl">
            Полируй навыки вместе с кастомным LeBron L23
          </h2>
          <p className="max-w-xl text-lg text-[#1f1b2d]">
            Премиальный, полу-плоский персонаж в стилистике NBA: голова и глаза мягко следят за курсором,
            цилиндрический торс подсвечен градиентами, а пурпурно-золотая форма с номером L23 придает узнаваемые
            черты без фотореализма.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-[#6f45ff]/10 px-4 py-2 text-sm font-semibold text-[#6f45ff] shadow-[0_6px_18px_rgba(111,69,255,0.25)]">
              cursor tracking head & eyes
            </span>
            <span className="rounded-full bg-[#f4c144]/15 px-4 py-2 text-sm font-semibold text-[#a56a12] shadow-[0_6px_18px_rgba(244,193,68,0.25)]">
              semi-flat gradients
            </span>
            <span className="rounded-full bg-[#0b0720]/80 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.25)]">
              premium vector finish
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <LeBronCharacter />
        </div>
      </div>
    </section>
  );
}
