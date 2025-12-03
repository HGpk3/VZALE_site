import Link from "next/link";

import { getDb } from "@/lib/db";

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

type TournamentOption = {
  id: number;
  name: string | null;
  status: string | null;
  hasTeams: boolean;
};

function getTournamentOptions(): TournamentOption[] {
  const db = getDb();
  return db
    .prepare(
      `
        SELECT
          t.id,
          t.name,
          t.status,
          COUNT(DISTINCT tn.id) > 0 AS hasTeams
        FROM tournaments t
        LEFT JOIN teams_new tn ON tn.tournament_id = t.id
        GROUP BY t.id
        ORDER BY t.id DESC
      `
    )
    .all() as TournamentOption[];
}

function getLatestFinishedTournamentId(): number | null {
  const db = getDb();
  const finished = db
    .prepare(
      `
        SELECT id
        FROM tournaments
        WHERE status IN ('finished', 'archived')
        ORDER BY id DESC
        LIMIT 1
      `,
    )
    .get() as { id: number } | undefined;

  return finished?.id ?? null;
}

function getLatestTournamentId(): number | null {
  const db = getDb();
  const populated = db
    .prepare(
      `
        SELECT t.id
        FROM tournaments t
        LEFT JOIN teams_new tn ON tn.tournament_id = t.id
        LEFT JOIN player_ratings_by_tournament prt ON prt.tournament_id = t.id
        GROUP BY t.id
        HAVING COUNT(tn.id) > 0 OR COUNT(prt.user_id) > 0
        ORDER BY
          CASE WHEN t.status = 'running' THEN 1 ELSE 0 END DESC,
          CASE WHEN t.status = 'registration_open' THEN 1 ELSE 0 END DESC,
          t.id DESC
        LIMIT 1
      `
    )
    .get() as { id: number } | undefined;

  if (populated?.id) return populated.id;

  const fallback = db
    .prepare(
      `
        SELECT id
        FROM tournaments
        ORDER BY
          CASE WHEN status = 'running' THEN 1 ELSE 0 END DESC,
          CASE WHEN status = 'registration_open' THEN 1 ELSE 0 END DESC,
          id DESC
        LIMIT 1
      `
    )
    .get() as { id: number } | undefined;

  return fallback?.id ?? null;
}

function getTeams(
  tournamentId: number | null,
  limit: number
): TeamRow[] {
  const db = getDb();

  return db
    .prepare(
      `
        SELECT
          tn.id,
          tn.name,
          tn.status,
          tn.tournament_id AS tournamentId,
          COUNT(tm.user_id) AS playersCount
        FROM teams_new tn
        LEFT JOIN team_members tm ON tm.team_id = tn.id
        WHERE (? IS NULL OR tn.tournament_id = ?)
        GROUP BY tn.id
        ORDER BY tn.created_at DESC
        LIMIT ?
      `
    )
    .all(tournamentId, tournamentId, limit) as TeamRow[];
}

function getTournamentName(tournamentId: number | null): string | null {
  if (!tournamentId) return null;
  const db = getDb();
  const row = db
    .prepare("SELECT name FROM tournaments WHERE id = ?")
    .get(tournamentId) as { name: string | null } | undefined;
  return row?.name ?? null;
}

function getLatestMatchesForTournament(
  tournamentId: number | null,
  limit: number,
): MatchRow[] {
  if (!tournamentId) return [];

  const db = getDb();
  return db
    .prepare(
      `
        SELECT
          ms.id,
          ms.team_home_name AS teamHomeName,
          ms.team_away_name AS teamAwayName,
          ms.score_home AS scoreHome,
          ms.score_away AS scoreAway,
          COALESCE(m.stage, ms.stage) AS stage,
          m.group_name AS groupName,
          COALESCE(m.status, ms.status) AS status,
          m.start_at AS startAt
        FROM matches_simple ms
        LEFT JOIN matches m ON m.id = ms.id
        WHERE ms.tournament_id = ?
        ORDER BY COALESCE(m.start_at, ms.id) DESC
        LIMIT ?
      `
    )
    .all(tournamentId, limit) as MatchRow[];
}

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
  next: Record<string, string | undefined>
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

export default function TeamsAndPlayers({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const tournamentOptions = getTournamentOptions();
  const latestTournamentId = getLatestTournamentId();
  const latestFinishedTournamentId = getLatestFinishedTournamentId();

  const defaultTeamsTournamentId =
    latestFinishedTournamentId ?? latestTournamentId;

  const selectedTeamsTournamentId =
    parseNumber(searchParams.teamTournament) ?? defaultTeamsTournamentId;
  const showAllTeams = (searchParams.showTeams as string) === "all";
  const teamsLimit = showAllTeams ? 50 : 6;

  const teams = getTeams(selectedTeamsTournamentId, teamsLimit);
  const resultsTournamentId = latestFinishedTournamentId ?? latestTournamentId;
  const matches = getLatestMatchesForTournament(resultsTournamentId, 8);
  const matchesTournamentName = getTournamentName(resultsTournamentId);

  const hasMoreTeams = !showAllTeams && teams.length === teamsLimit;

  return (
    <section className="relative w-full py-20 md:py-24 px-6 md:px-10 bg-gradient-to-b from-[#0B0615] via-[#050309] to-black text-white">
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
              Фильтруйте команды по турнирам и смотрите свежие результаты
              последнего завершённого ивента.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-xs md:text-sm text-white/70">
            <span className="font-mono bg-white/5 border border-white/10 px-3 py-1 rounded-full">
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

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-lg md:text-xl font-semibold mb-1">Команды</h3>
                <p className="text-xs text-white/60">Берём составы прямо из текущих заявок бота.</p>
              </div>
              <form method="get" className="flex items-center gap-2 text-xs">
                <label className="text-white/60" htmlFor="teams-select">
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
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-sm text-white focus:outline-none"
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
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1 bg-white/10 border border-white/15 text-white hover:bg-white/15"
                >
                  Показать
                </button>
              </form>
            </div>

            {teams.length === 0 ? (
              <p className="text-sm text-white/60">
                Пока нет активных команд. Как только в базе появятся заявки или
                составы, они появятся здесь.
              </p>
            ) : (
              <div className="space-y-3">
                {teams.map((team) => (
                  <div
                    key={`${team.id}-${team.name}`}
                    className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 px-4 py-3 md:px-5 md:py-4 shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
                  >
                    <div className="flex items-center gap-3">
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

                    <span
                      className={`text-xs md:text-sm px-3 py-1 rounded-full border ${
                        team.status === "active" || team.status === "confirmed"
                          ? "border-vz_green text-vz_green"
                          : "border-white/40 text-white/80"
                      }`}
                    >
                      {teamStatusLabel(team.status)}
                    </span>
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
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-lg md:text-xl font-semibold mb-1">
                  Результаты прошлого турнира
                </h3>
                <p className="text-xs text-white/60 -mt-1">
                  Показываем последние матчи завершённого турнира с максимальным ID.
                </p>
              </div>

              <span className={`px-3 py-1 rounded-full border text-xs ${statusPill('finished')}`}>
                {resultsTournamentId ? `Турнир #${resultsTournamentId}` : "Нет данных"}
              </span>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.6)] overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10 text-xs md:text-sm uppercase tracking-[0.18em] text-white/60">
                {matchesTournamentName || (resultsTournamentId ? `Турнир #${resultsTournamentId}` : "Матчи пока не найдены")}
              </div>

              {matches.length === 0 ? (
                <p className="px-5 py-4 text-sm text-white/60">
                  Завершённые матчи ещё не выгружены. Как только бот запишет результаты, они появятся здесь.
                </p>
              ) : (
                <ul className="divide-y divide-white/8">
                  {matches.map((match) => (
                    <li
                      key={match.id}
                      className="px-5 py-4 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-3">
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
                        <span className="text-base md:text-lg font-bold text-white">
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
