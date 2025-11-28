import Link from "next/link";

type TournamentStatus = "upcoming" | "in_progress" | "finished";

interface TournamentCardProps {
  id: number | string;
  title: string;
  date: string;
  place: string;
  status: TournamentStatus;
  type: string;
}

const statusLabel: Record<TournamentStatus, string> = {
  upcoming: "Регистрация открыта",
  in_progress: "Турнир идёт",
  finished: "Турнир завершён",
};

const statusColor: Record<TournamentStatus, string> = {
  upcoming: "bg-vz_green text-black",
  in_progress: "bg-yellow-400 text-black",
  finished: "bg-neutral-700 text-white",
};

export default function TournamentCard({
  id,
  title,
  date,
  place,
  status,
  type,
}: TournamentCardProps) {
  return (
    <Link href={`/tournaments/${id}`}>
      <article className="relative rounded-3xl bg-white/90 border border-purple-100 shadow-[0_18px_50px_rgba(0,0,0,0.06)] overflow-hidden p-6 md:p-7 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.15)] transition">
        {/* Неоновый блик */}
        <div className="pointer-events-none absolute -bottom-10 right-0 w-[200px] h-[150px] bg-vz_purple blur-[90px] opacity-40" />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-vz_text">
              {title}
            </h3>
            <p className="text-xs md:text-sm text-neutral-700 mt-1">{type}</p>
          </div>

          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] md:text-xs font-semibold ${statusColor[status]}`}
          >
            {statusLabel[status]}
          </span>
        </div>

        <div className="relative z-10 text-sm md:text-base text-neutral-800 space-y-1">
          <p>{date}</p>
          <p className="text-neutral-700">{place}</p>
        </div>

        <div className="relative z-10 mt-3 flex justify-end">
          <span className="text-xs md:text-sm font-semibold text-vz_text/70">
            Подробнее →
          </span>
        </div>
      </article>
    </Link>
  );
}
