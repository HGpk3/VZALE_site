import Link from "next/link";

import { fetchMatches, fetchTeams, fetchTournaments } from "@/lib/api";
import TournamentSelector from "./TournamentSelector";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TournamentStatus =
  | "draft"
  | "announced"
  | "registration_open"
  | "closed"
  | "running"
  | "finished"
  | "archived";

type TournamentSummary = {
  id: number;
  name: string;
  status: string | null;
  dateStart: string | null;
  venue: string | null;
};

type MatchRow = {
  id: number;
  stage: string | null;
  groupName: string | null;
  startAt: string | null;
  court: string | null;
  teamHomeName: string;
  teamAwayName: string;
  scoreHome: number | null;
  scoreAway: number | null;
  status: string | null;
};

type TeamRow = {
  id: number;
  name: string;
  status: string | null;
};

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
  draft: "border-white/20 text-white/80",
  announced: "border-vz_purple/60 text-vz_purple",
  registration_open: "border-vz_green/70 text-vz_green",
  closed: "border-amber-400/70 text-amber-200",
  running: "border-emerald-400/70 text-emerald-200",
  finished: "border-white/30 text-white/80",
  archived: "border-white/20 text-white/70",
};

function normalizeStatus(status: string | null): TournamentStatus | null {
  if (!status) return null;
  if (
    [
      "draft",
      "announced",
      "registration_open",
      "closed",
      "running",
      "finished",
      "archived",
    ].includes(status)
  ) {
    return status as TournamentStatus;
  }
  return null;
}

async function fetchTournamentList(): Promise<Pick<TournamentSummary, "id" | "name">[]> {
  const tournaments = await fetchTournaments();
  return tournaments.map((t) => ({ id: t.id, name: t.name }));
}

async function fetchTournament(id: number): Promise<TournamentSummary | undefined> {
  const tournaments = await fetchTournaments();
  return tournaments.find((t) => t.id === id);
}

async function getMatches(tournamentId: number): Promise<MatchRow[]> {
  const matches = await fetchMatches();
  if (!matches) return [];

  return matches
    .filter((m) => m.tournamentId === tournamentId)
    .map((m) => ({
      id: m.id,
      stage: null,
      groupName: null,
      startAt: m.startedAt ?? null,
      court: null,
      teamHomeName: m.teamHomeName ?? "Команда",
      teamAwayName: m.teamAwayName ?? "Соперник",
      scoreHome: m.scoreHome ?? null,
      scoreAway: m.scoreAway ?? null,
      status: m.status ?? null,
    }));
}

async function getTeams(tournamentId: number): Promise<TeamRow[]> {
  const teams = await fetchTeams();
  if (!teams) return [];

  return teams
    .filter((t) => (t.tournamentId ?? null) === tournamentId)
    .map((t) => ({ id: t.id, name: t.name, status: t.status ?? null }));
}

export default async function TournamentPage({ params }: { params: { id: string } }) {
  const allTournaments = await fetchTournamentList();
  const paramId = Number.parseInt(params.id, 10);
  const selectedId = Number.isNaN(paramId) || paramId === 0 ? allTournaments[0]?.id : paramId;

  if (!selectedId) {
    return (
      <main className="min-h-screen w-full bg-gradient-to-b from-[#0B0615] via-[#050309] to-black text-white py-16 md:py-20 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <header className="space-y-3 text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold">Турниры VZALE</h1>
            <p className="text-sm md:text-base text-white/70">
              Турниры пока не созданы. Как только бот или админка добавят первый турнир, его можно будет выбрать в списке.
            </p>
            <Link
              href="/tournaments"
              className="inline-flex items-center gap-2 justify-center text-sm text-white/70 hover:text-white"
            >
              ← Ко всем турнирам
            </Link>
          </header>
        </div>
      </main>
    );
  }

  const row = await fetchTournament(selectedId);
  const status = normalizeStatus(row?.status ?? null) ?? "announced";
  const selectorOptions = allTournaments.map((t) => ({ id: t.id, name: t.name }));
  const showEmptyState = !row;

  const matches = await getMatches(selectedId);
  const teams = await getTeams(selectedId);

  const canRegister = status === "registration_open";

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#0B0615] via-[#050309] to-black text-white py-16 md:py-20 px-6 md:px-10">
      {/* Неоновый фон */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-10 left-0 w-[280px] h-[200px] bg-vz_purple blur-[110px]" />
        <div className="absolute bottom-0 right-10 w-[260px] h-[220px] bg-vz_green blur-[110px]" />
      </div>

      <div className="relative max-w-6xl mx-auto space-y-10">
        {/* Хедер турнира */}
        <header className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-xs md:text-sm uppercase tracking-[0.22em] text-white/70">
                Турнир VZALE #{row?.id ?? selectedId}
              </p>
              <h1 className="text-3xl md:text-4xl font-extrabold">
                {row?.name ?? selectorOptions.find((t) => t.id === selectedId)?.name ?? `Турнир #${selectedId}`}
              </h1>
            </div>

            <TournamentSelector
              tournaments={selectorOptions}
              selectedId={selectedId}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm md:text-base text-white/80">
            {row?.dateStart && <span>{row.dateStart}</span>}
            {row?.dateStart && row?.venue && <span className="text-white/60">•</span>}
            {row?.venue && <span>{row.venue}</span>}
          </div>

          <span
            className={`inline-flex items-center px-4 py-1 rounded-full border bg-white/5 text-xs md:text-sm font-semibold ${statusColor[status]}`}
          >
            {statusLabel[status]}
          </span>

          {showEmptyState ? (
            <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-white/75">
              <p className="font-semibold text-white">Данные пока не загружены</p>
              <p className="mt-1 text-white/70">
                Мы не нашли запись турнира или связанные матчи и команды. Ссылка останется доступной, как только бот или админка добавят информацию в базу.
              </p>
            </div>
          ) : null}
        </header>

        {/* Основной блок */}
        <section className="grid gap-8 md:grid-cols-[2fr,1.2fr] items-start">
          {/* Описание / формат / призы */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <h2 className="text-xl md:text-2xl font-semibold mb-3">О турнире</h2>
              <p className="text-sm md:text-base text-white/80 leading-relaxed">
                {row?.name
                  ? `Турнир "${row.name}". Данные подтягиваются из внешнего API.`
                  : "Организатор пока не добавил описание. Следите за обновлениями в боте VZALE."}
              </p>
            </div>

            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-7 space-y-4">
              <div>
                <h3 className="text-base md:text-lg font-semibold mb-1">Формат и регламент</h3>
                <p className="text-sm md:text-base text-white/80 leading-relaxed">
                  Детали формата появятся позже. Мы показываем только данные, полученные из внешнего API.
                </p>
              </div>

              <div>
                <h3 className="text-base md:text-lg font-semibold mb-1">Призы и награды</h3>
                <p className="text-sm md:text-base text-white/80 leading-relaxed">
                  Призы будут объявлены ближе к старту турнира.
                </p>
              </div>
            </div>
          </div>

          {/* Правая колонка — CTA */}
          <aside className="space-y-6">
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)] space-y-4">
              <h3 className="text-base md:text-lg font-semibold">Принять участие</h3>
              <p className="text-xs md:text-sm text-white/75">
                Регистрация идёт через бота и внешний API: капитаны подают команды, свободные агенты оставляют анкеты.
              </p>
              <Link
                href="/participate"
                className={`w-full inline-flex justify-center mt-2 font-semibold text-sm md:text-base px-5 py-3 rounded-xl transition shadow-[0_0_30px_rgba(164,255,79,0.5)] ${
                  canRegister
                    ? "bg-vz_green text-black hover:brightness-110"
                    : "bg-white/10 text-white/70 cursor-not-allowed"
                }`}
                aria-disabled={!canRegister}
              >
                {canRegister ? "Подать заявку" : "Регистрация закрыта"}
              </Link>
            </div>

            <div className="rounded-3xl bg-white/5 border border-white/10 p-5 md:p-6 text-xs md:text-sm text-white/70 space-y-2">
              <p>Все заявки и команды хранятся во внешнем API, общее с ботом.</p>
              <p>Если API временно недоступен, мы покажем заглушки вместо ошибок.</p>
            </div>
          </aside>
        </section>

        <section className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Участники</p>
              <h2 className="text-xl md:text-2xl font-semibold">Команды турнира</h2>
            </div>
            <span className="text-xs text-white/60">
              {teams.length > 0
                ? `${teams.length} команд(ы) в списке`
                : "Пока ни одна команда не добавлена"}
            </span>
          </div>

          {teams.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              Пока нет команд или сервис временно недоступен.
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {teams.map((team) => (
                <li
                  key={team.id}
                  className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-white">{team.name}</p>
                    <p className="text-xs text-white/60">{team.status ?? "Команда"}</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full border border-white/20 bg-white/5">
                    #{team.id}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Матчи</p>
              <h2 className="text-xl md:text-2xl font-semibold">Последние игры</h2>
            </div>
            <span className="text-xs text-white/60">
              {matches.length > 0 ? `${matches.length} матчей` : "Список матчей пока пуст"}
            </span>
          </div>

          {matches.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              Матчи ещё не загружены или сервис временно недоступен.
            </div>
          ) : (
            <ul className="space-y-3">
              {matches.map((match) => (
                <li
                  key={match.id}
                  className="rounded-2xl bg-white/5 border border-white/10 p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">
                        {match.teamHomeName} vs {match.teamAwayName}
                      </span>
                      <span className="text-[11px] text-white/50">
                        {match.stage || "Матч"}
                        {match.groupName ? ` • ${match.groupName}` : ""}
                        {match.startAt ? ` • ${match.startAt}` : ""}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-white">
                      {match.scoreHome ?? "-"} : {match.scoreAway ?? "-"}
                    </span>
                  </div>
                  <span className="inline-flex items-center text-[11px] px-3 py-1 mt-2 rounded-full border border-white/20 bg-white/5">
                    {match.status ?? "Запланирован"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
