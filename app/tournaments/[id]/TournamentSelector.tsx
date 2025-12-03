"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Props = {
  tournaments: { id: number; name: string }[];
  selectedId: number;
};

export default function TournamentSelector({ tournaments, selectedId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <label className="inline-flex flex-col gap-2 text-sm text-white/80">
      <span className="text-xs uppercase tracking-[0.12em] text-white/60">Выбор турнира</span>
      <select
        className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm md:text-base text-white/90 outline-none shadow-[0_10px_40px_rgba(0,0,0,0.4)]"
        value={selectedId.toString()}
        onChange={(e) => {
          const value = Number.parseInt(e.target.value, 10);
          startTransition(() => {
            router.replace(`/tournaments/${value}`);
          });
        }}
        disabled={isPending}
      >
        {tournaments.map((tournament) => (
          <option key={tournament.id} value={tournament.id} className="text-black">
            #{tournament.id} — {tournament.name}
          </option>
        ))}
      </select>
    </label>
  );
}
