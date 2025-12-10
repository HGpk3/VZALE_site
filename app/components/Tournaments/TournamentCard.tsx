import Link from "next/link";

// План по улучшению карточки:
// 1) Отображать расширенную информацию (дата, площадка, стоимость).
// 2) Добавить прогресс по командам с индикацией свободных мест.
// 3) Сохранить существующий стиль и адаптивность.

type TournamentStatus =
  | "draft"
  | "announced"
  | "registration_open"
  | "closed"
  | "running"
  | "finished"
  | "archived";

interface TournamentCardProps {
  id: number | string;
  title: string;
  date?: string | null;
  place?: string | null;
  status: TournamentStatus | null;
  format?: string;
  teamCount?: number;
  teamLimit?: number | null;
  price?: string | number | null;
}

const statusLabel: Record<TournamentStatus, string> = {
  draft: "Черновик",
  announced: "Анонс",
  registration_open: "Регистрация открыта",
  closed: "Регистрация закрыта",
  running: "Турнир идёт",
  finished: "Турнир завершён",
  archived: "Архив",
};

const statusColor: Record<TournamentStatus, string> = {
  draft: "bg-white/10 text-white",
  announced: "bg-vz_purple text-white",
  registration_open: "bg-vz_green text-black",
  closed: "bg-amber-500 text-black",
  running: "bg-emerald-500 text-black",
  finished: "bg-neutral-700 text-white",
  archived: "bg-neutral-800 text-white",
};

export default function TournamentCard({
  id,
  title,
  date,
  place,
  status,
  format,
  teamCount = 0,
  teamLimit,
  price,
}: TournamentCardProps) {
  const label = status ? statusLabel[status] : "Черновик турнира";
  const color = status ? statusColor[status] : "bg-white/10 text-white";
  const hasLimit = typeof teamLimit === "number" && teamLimit > 0;
  const remaining = hasLimit ? Math.max(teamLimit! - teamCount, 0) : null;
  const isFull = hasLimit ? teamCount >= teamLimit! : false;
  const isLowSpots = hasLimit ? remaining !== null && remaining <= 2 && !isFull : false;
  const progress = hasLimit
    ? Math.min(100, Math.round((teamCount / teamLimit!) * 100))
    : null;

  return (
    <article className="relative rounded-3xl bg-white/90 border border-purple-100 shadow-[0_18px_50px_rgba(0,0,0,0.06)] overflow-hidden p-6 md:p-7 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.15)] transition">
      {/* Неоновый блик */}
      <div className="pointer-events-none absolute -bottom-10 right-0 w-[200px] h-[150px] bg-vz_purple blur-[90px] opacity-40" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg md:text-xl font-semibold text-vz_text">
            {title}
          </h3>
          {format ? (
            <p className="text-[11px] md:text-xs text-vz_purple font-semibold mt-0.5">
              {format}
            </p>
          ) : null}
          <p className="text-xs md:text-sm text-neutral-700 mt-1">
            {place || "Локация уточняется"}
          </p>
          <p className="text-[11px] md:text-xs text-neutral-500 mt-1">
            {date || "Дата будет объявлена"}
          </p>
          {price ? (
            <p className="text-xs md:text-sm text-vz_text font-semibold mt-2">
              Взнос: {price}
            </p>
          ) : null}
        </div>

        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] md:text-xs font-semibold ${color}`}
        >
          {label}
        </span>
      </div>

      {hasLimit ? (
        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between text-xs md:text-sm text-neutral-700">
            <span>
              {teamCount} / {teamLimit} команд
            </span>
            {isFull ? (
              <span className="px-2 py-0.5 rounded-full bg-neutral-900 text-white text-[11px] font-semibold uppercase">
                FULL
              </span>
            ) : isLowSpots ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold">
                Осталось мало мест
              </span>
            ) : null}
          </div>
          <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
            <div
              className={`h-2 rounded-full ${isFull ? "bg-neutral-800" : "bg-vz_purple"}`}
              style={{ width: `${progress ?? 0}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="relative z-10 text-xs md:text-sm text-neutral-700">
          Командный слот не ограничен
        </div>
      )}

      <div className="relative z-10 mt-3 flex justify-end">
        <div className="flex flex-wrap gap-2 text-xs md:text-sm font-semibold">
          <Link
            href={`/tournaments/${id}`}
            className="px-4 py-2 rounded-full bg-vz_purple text-white hover:brightness-110 transition"
          >
            Подробнее
          </Link>
          <Link
            href={`/tournaments/${id}`}
            className={`px-4 py-2 rounded-full border border-vz_text/10 hover:-translate-y-0.5 transition ${
              isFull ? "bg-neutral-100 text-neutral-500 cursor-not-allowed" : "bg-white text-vz_text shadow-sm"
            }`}
            aria-disabled={isFull}
          >
            Участвовать
          </Link>
        </div>
      </div>
    </article>
  );
}
