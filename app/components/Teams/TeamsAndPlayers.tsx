import Link from "next/link";

import { fetchMatches, fetchTeams, fetchTournaments } from "@/lib/api";

type TournamentOption = {
  id: number;
  name: string | null;
  status: string | null;
  hasTeams: boolean;
};

type TeamRow = {
  id: number;
  name: string;
  status: string | null;
  playersCount: number;
  tournamentId: number | null;
};

type MatchRow = {
  id: number;
  teamHomeName: string;
  teamAwayName: string;
  scoreHome: number | null;
  scoreAway: number | null;
  stage: string | null;
  groupName: string | null;
  status: string | null;
  startAt: string | null;
};

function parseNumber(value: string | string[] | undefined): number | null {
  if (Array.isArray(value)) return parseNumber(value[0]);
  if (!value) return null;
  const num = Number.parseInt(value, 10);
  return Number.isNaN(num) ? null : num;
}

function teamStatusLabel(status: string | null) {
  switch (status) {
    case "active":
    case "confirmed":
      return "Участвует";
    case "pending":
      return "Заявка";
    case "eliminated":
      return "Выбыла";
    default:
      return status || "Команда";
  }
}

function statusPill(status: string | null) {
  switch (status) {
    case "registration_open":
      return "text-vz_green border-vz_green/50";
    case "running":
      return "text-emerald-200 border-emerald-400/70";
    case "finished":
    case "archived":
      return "text-white/70 border-white/25";
    default:
      return "text-white/70 border-white/25";
  }
}

function buildQuery(
  current: Record<string, string | string[] | undefined>,
  next: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  Object.entries(current).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else if (value) {
      params.set(key, value);
    }
  });

  Object.entries(next).forEach(([key, value]) => {
    if (value === undefined) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  });

  const search = params.toString();
  return search ? `?${search}` : "";
}

async function getTournamentOptions(): Promise<TournamentOption[]> {
  const tournaments = await fetchTournaments();
  if (!tournaments) return [];

  return tournaments.map((t) => ({
    id: t.id,
    name: t.name ?? null,
    status: t.status ?? null,
    hasTeams: Boolean(t.status),
  }));
}

function pickLatestTournamentId(options: TournamentOption[]): number | null {
  if (options.length === 0) return null;
  const finished = options.find((t) => t.status === "finished" || t.status === "archived");
  if (finished) return finished.id;
  return options[0]?.id ?? null;
}

async function getTeams(tournamentId: number | null, limit: number): Promise<TeamRow[]> {
  const teams = await fetchTeams();
  if (!teams) return [];

  const filtered = tournamentId
    ? teams.filter((t) => (t.tournamentId ?? null) === tournamentId)
    : teams;

  return filtered.slice(0, limit).map((team) => ({
    id: team.id,
    name: team.name,
    status: team.status ?? null,
    playersCount: team.playersCount ?? 0,
    tournamentId: team.tournamentId ?? null,
  }));
}

async function getLatestMatchesForTournament(
  tournamentId: number | null,
  limit: number,
): Promise<MatchRow[]> {
  const matches = await fetchMatches();
  if (!matches || matches.length === 0 || !tournamentId) return [];

  return matches
    .filter((m) => m.tournamentId === tournamentId)
    .sort((a, b) => (b.startedAt || "").localeCompare(a.startedAt || ""))
    .slice(0, limit)
    .map((m) => ({
      id: m.id,
      teamHomeName: m.teamHomeName ?? "Команда",
      teamAwayName: m.teamAwayName ?? "Соперник",
      scoreHome: m.scoreHome ?? null,
      scoreAway: m.scoreAway ?? null,
      stage: m.startedAt ?? null,
      groupName: null,
      status: m.status ?? null,
      startAt: m.startedAt ?? null,
    }));
}

export default async function TeamsAndPlayers({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const tournamentOptions = await getTournamentOptions();
  const latestFinishedTournamentId = pickLatestTournamentId(tournamentOptions);

  const defaultTeamsTournamentId = tournamentOptions[0]?.id ?? latestFinishedTournamentId;

  const selectedTeamsTournamentId =
    parseNumber(searchParams.teamTournament) ?? defaultTeamsTournamentId;
  const showAllTeams = (searchParams.showTeams as string) === "all";
  const teamsLimit = showAllTeams ? 50 : 6;

  const teams = await getTeams(selectedTeamsTournamentId, teamsLimit);
  const resultsTournamentId = latestFinishedTournamentId;
  const matches = await getLatestMatchesForTournament(resultsTournamentId, 8);
  const matchesTournamentName = tournamentOptions.find((t) => t.id === resultsTournamentId)?.name;

  const hasMoreTeams = !showAllTeams && teams.length === teamsLimit;

  return (
    <section className="relative w-full py-16 md:py-24 px-4 sm:px-6 md:px-10 bg-gradient-to-b from-[#0B0615] via-[#050309] to-black text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-10 left-0 w-[280px] h-[200px] bg-vz_purple blur-[110px]" />
        <div className="absolute bottom-0 right-10 w-[260px] h-[220px] bg-vz_green blur-[110px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-extrabold">
              Команды и результаты
            </h2>
            <p className="text-sm md:text-base text-white/70 max-w-md">
              Фильтруйте команды по турнирам и смотрите свежие результаты последнего завершённого ивента.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-xs md:text-sm text-white/70 justify-start md:justify-end">
            <span className="font-mono bg-white/5 border border-white/10 px-3 py-1 rounded-full whitespace-nowrap">
              {tournamentOptions.length} турниров в базе
            </span>
            <Link
              href="/tournaments"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs md:text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              Все турниры
            </Link>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h3 className="text-lg md:text-xl font-semibold mb-1">Команды</h3>
                <p className="text-xs text-white/60">Берём составы прямо из текущих заявок бота.</p>
              </div>
              <form method="get" className="flex flex-wrap items-center gap-2 text-xs">
                <label className="text-white/60 whitespace-nowrap" htmlFor="teams-select">
                  Турнир
                </label>
                <input
                  type="hidden"
                  name="showTeams"
                  value={
                    typeof searchParams.showTeams === "string"
                      ? searchParams.showTeams
                      : ""
                  }
                />
                <select
                  id="teams-select"
                  name="teamTournament"
                  defaultValue={selectedTeamsTournamentId ?? ""}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none min-w-[170px]"
                >
                  <option value="">Все турниры</option>
                  {tournamentOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      #{t.id} {t.name || "Турнир"}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 bg-white/10 border border-white/15 text-white hover:bg-white/15"
                >
                  Показать
                </button>
              </form>
            </div>

            {teams.length === 0 ? (
              <p className="text-sm text-white/60">
                Пока нет активных команд или сервис временно недоступен. Как только в базе появятся заявки, они появятся здесь.
              </p>
            ) : (
              <div className="space-y-3">
                {teams.map((team) => (
                  <div
                    key={`${team.id}-${team.name}`}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 md:px-5 md:py-4 shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
                  >
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="w-10 h-10 rounded-full bg-vz_purple_dark flex items-center justify-center text-sm font-bold">
                        {team.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm md:text-base">
                          {team.name}
                        </p>
                        <p className="text-xs md:text-sm text-white/60">
                          Игроков: {team.playersCount}
                        </p>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto sm:text-right">
                      <span
                        className={`inline-flex justify-center text-xs md:text-sm px-3 py-1 rounded-full border min-w-[110px] ${
                          team.status === "active" || team.status === "confirmed"
                            ? "border-vz_green text-vz_green"
                            : "border-white/40 text-white/80"
                        }`}
                      >
                        {teamStatusLabel(team.status)}
                      </span>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between text-xs text-white/60 pt-1">
                  {showAllTeams ? (
                    <span>Показаны все найденные команды</span>
                  ) : hasMoreTeams ? (
                    <span>Показаны последние {teams.length} команд</span>
                  ) : (
                    <span>Новых команд пока нет</span>
                  )}

                  {hasMoreTeams && (
                    <Link
                      href={buildQuery(searchParams, { showTeams: "all" })}
                      className="inline-flex items-center gap-2 text-vz_green hover:text-white"
                    >
                      Показать все
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h3 className="text-lg md:text-xl font-semibold mb-1">
                  Результаты прошлого турнира
                </h3>
                <p className="text-xs text-white/60 -mt-1">
                  Показываем последние матчи завершённого турнира с максимальным ID.
                </p>
              </div>

              <span className={`px-3 py-1 rounded-full border text-xs ${statusPill("finished")}`}>
                {resultsTournamentId ? `Турнир #${resultsTournamentId}` : "Нет данных"}
              </span>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.6)] overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10 text-xs md:text-sm uppercase tracking-[0.18em] text-white/60">
                {matchesTournamentName || (resultsTournamentId ? `Турнир #${resultsTournamentId}` : "Матчи пока не найдены")}
              </div>

              {matches.length === 0 ? (
                <p className="px-5 py-4 text-sm text-white/60">
                  Завершённые матчи ещё не выгружены или сервис временно недоступен.
                </p>
              ) : (
                <ul className="divide-y divide-white/8">
                  {matches.map((match) => (
                    <li
                      key={match.id}
                      className="px-5 py-4 space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">
                            {match.teamHomeName} vs {match.teamAwayName}
                          </span>
                          <span className="text-[11px] text-white/50">
                            {match.stage || "Матч"}
                            {match.groupName ? ` • ${match.groupName}` : ""}
                            {match.startAt ? ` • ${match.startAt}` : ""}
                          </span>
                        </div>
                        <span className="text-lg md:text-xl font-bold text-white">
                          {match.scoreHome ?? "-"} : {match.scoreAway ?? "-"}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center text-[11px] px-3 py-1 rounded-full border ${statusPill(match.status)}`}
                      >
                        {match.status === "finished"
                          ? "Завершён"
                          : match.status === "running"
                            ? "Идёт"
                            : "Запланирован"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs md:text-sm text-white/70 flex flex-wrap gap-2 items-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full border border-white/15 bg-white/5">
                Последний завершённый турнир
              </span>
              <span>
                {matchesTournamentName
                  ? `Показываем игры турнира “${matchesTournamentName}”`
                  : "Ждём завершения первого турнира, чтобы показать его матчи"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
