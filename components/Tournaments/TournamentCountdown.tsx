"use client";

import { useEffect, useMemo, useState } from "react";

// План: простой клиентский таймер с очисткой и мягким форматированием.

function formatTime(value: number) {
  return value.toString().padStart(2, "0");
}

function getTimeLeft(target: Date | null) {
  if (!target) return null;
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (Number.isNaN(diff) || diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds };
}

export function TournamentCountdown({ target }: { target?: string | null }) {
  const targetDate = useMemo(() => {
    if (!target) return null;
    const parsed = new Date(target);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [target]);

  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate));

  useEffect(() => {
    if (!targetDate) return undefined;

    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate || !timeLeft) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 md:px-6 md:py-4 inline-flex flex-col gap-2 text-white">
      <span className="text-xs uppercase tracking-[0.18em] text-white/60">До старта</span>
      <div className="flex items-center gap-3 md:gap-4 text-lg md:text-2xl font-semibold">
        <div className="flex flex-col items-center">
          <span>{formatTime(timeLeft.days)}</span>
          <span className="text-[11px] text-white/60">дн</span>
        </div>
        <span className="text-white/50">:</span>
        <div className="flex flex-col items-center">
          <span>{formatTime(timeLeft.hours)}</span>
          <span className="text-[11px] text-white/60">час</span>
        </div>
        <span className="text-white/50">:</span>
        <div className="flex flex-col items-center">
          <span>{formatTime(timeLeft.minutes)}</span>
          <span className="text-[11px] text-white/60">мин</span>
        </div>
        <span className="text-white/50">:</span>
        <div className="flex flex-col items-center">
          <span>{formatTime(timeLeft.seconds)}</span>
          <span className="text-[11px] text-white/60">сек</span>
        </div>
      </div>
    </div>
  );
}
