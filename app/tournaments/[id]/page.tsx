import Link from "next/link";
import { notFound } from "next/navigation";

import { getDb } from "@/lib/db";

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

type TournamentRow = {
  id: number;
  name: string;
  status: string | null;
  dateStart: string | null;
  venue: string | null;
  settingsJson: string | null;
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
  name: string;
  paid: number;
};

type RosterRow = {
  teamName: string;
  userId: number;
  fullName: string | null;
  isCaptain: number;
};

type TeamWithRoster = TeamRow & {
  wins: number;
  losses: number;
  roster: RosterRow[];
};

type PlayerMatchRow = {
  matchId: number;
  userId: number;
  fullName: string | null;
  teamName: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  threes: number;
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

function fetchTournament(id: number): TournamentRow | undefined {
  const db = getDb();
  return db
    .prepare(
      "SELECT id, name, status, date_start as dateStart, venue, settings_json as settingsJson FROM tournaments WHERE id = ?"
    )
    .get(id) as TournamentRow | undefined;
}

function parseSettings(settingsJson: string | null) {
  if (!settingsJson) return null;
  try {
    return JSON.parse(settingsJson) as {
      description?: string;
      format?: string;
      prizes?: string;
    };
  } catch (err) {
    console.error("[tournament] failed to parse settings_json", err);
    return null;
  }
}

function getMatches(tournamentId: number): MatchRow[] {
  const db = getDb();
  return db
    .prepare(
      `
        SELECT
          ms.id,
          COALESCE(m.stage, ms.stage) AS stage,
          m.group_name AS groupName,
          m.start_at AS startAt,
          m.court,
          ms.team_home_name AS teamHomeName,
          ms.team_away_name AS teamAwayName,
          ms.score_home AS scoreHome,
          ms.score_away AS scoreAway,
          COALESCE(m.status, ms.status) AS status
        FROM matches_simple ms
        LEFT JOIN matches m ON m.id = ms.id
        WHERE ms.tournament_id = ?
        ORDER BY COALESCE(m.start_at, ms.id) DESC
      `
    )
    .all(tournamentId) as MatchRow[];
}

function getTeams(tournamentId: number): TeamWithRoster[] {
  const db = getDb();

  let teams = db
    .prepare(
      `
        SELECT name, paid
        FROM tournament_team_names
        WHERE tournament_id = ?
        ORDER BY paid DESC, name ASC
      `,
    )
    .all(tournamentId) as TeamRow[];

  // Для старых турниров, где таблица имен команд могла не заполняться, собираем названия
  // из заявок и матчей, чтобы страница не была пустой.
  if (teams.length === 0) {
    const rosterTeams = db
      .prepare(
        `
          SELECT DISTINCT team_name AS name, 0 AS paid
          FROM tournament_roster
          WHERE tournament_id = ?
          ORDER BY name ASC
        `,
      )
      .all(tournamentId) as TeamRow[];

    const matchTeams = db
      .prepare(
        `
          SELECT DISTINCT team_home_name AS name, 0 AS paid
          FROM matches_simple
          WHERE tournament_id = ?
          UNION
          SELECT DISTINCT team_away_name AS name, 0 AS paid
          FROM matches_simple
          WHERE tournament_id = ?
        `,
      )
      .all(tournamentId, tournamentId) as TeamRow[];

    const merged = new Map<string, TeamRow>();
    [...rosterTeams, ...matchTeams].forEach((team) => {
      if (team.name) merged.set(team.name, team);
    });
    teams = Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  const rosterRows = db
    .prepare(
      `
        SELECT
          team_name AS teamName,
          user_id AS userId,
          full_name AS fullName,
          is_captain AS isCaptain
        FROM tournament_roster
        WHERE tournament_id = ?
        ORDER BY is_captain DESC, full_name ASC
      `,
    )
    .all(tournamentId) as RosterRow[];

  const rosterMap = new Map<string, RosterRow[]>();
  for (const row of rosterRows) {
    const bucket = rosterMap.get(row.teamName) || [];
    bucket.push(row);
    rosterMap.set(row.teamName, bucket);
  }

  // Собираем статистику побед/поражений из matches_simple, опираясь на названия команд
  const matchStats = db
    .prepare(
      `
        SELECT team_home_name AS home, team_away_name AS away, score_home AS sh, score_away AS sa
        FROM matches_simple
        WHERE tournament_id = ?
      `,
    )
    .all(tournamentId) as { home: string; away: string; sh: number | null; sa: number | null }[];

  const record = new Map<string, { wins: number; losses: number }>();
  for (const { home, away, sh, sa } of matchStats) {
    const homeRec = record.get(home) || { wins: 0, losses: 0 };
    const awayRec = record.get(away) || { wins: 0, losses: 0 };

    if (sh != null && sa != null) {
      if (sh > sa) {
        homeRec.wins += 1;
        awayRec.losses += 1;
      } else if (sa > sh) {
        awayRec.wins += 1;
        homeRec.losses += 1;
      }
    }

    record.set(home, homeRec);
    record.set(away, awayRec);
  }

  return teams.map((team) => ({
    ...team,
    wins: record.get(team.name)?.wins ?? 0,
    losses: record.get(team.name)?.losses ?? 0,
    roster: rosterMap.get(team.name) ?? [],
  }));
}

function getPlayerStatsMap(tournamentId: number) {
  const db = getDb();
  const rows = db
    .prepare(
      `
        SELECT
          pms.match_id AS matchId,
          pms.user_id AS userId,
          u.full_name AS fullName,
          pms.team_name AS teamName,
          pms.points,
          pms.rebounds,
          pms.assists,
          pms.steals,
          pms.blocks,
          pms.threes
        FROM player_match_stats pms
        LEFT JOIN users u ON u.user_id = pms.user_id
        WHERE pms.tournament_id = ?
        ORDER BY pms.points DESC
      `
    )
    .all(tournamentId) as PlayerMatchRow[];

  const map = new Map<number, PlayerMatchRow[]>();
  for (const row of rows) {
    const bucket = map.get(row.matchId) || [];
    bucket.push(row);
    map.set(row.matchId, bucket);
  }
  return map;
}

export default function TournamentPage({ params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id, 10);
  if (Number.isNaN(id)) return notFound();

  const row = fetchTournament(id);
  if (!row) return notFound();

  const status = normalizeStatus(row.status) ?? "draft";
  const settings = parseSettings(row.settingsJson);
  const canRegister = status === "registration_open";
  const matches = getMatches(id);
  const playerStatsMap = getPlayerStatsMap(id);
  const teams = getTeams(id);

  function matchStatusBadge(value: string | null) {
    switch (value) {
      case "finished":
        return "bg-white/10 border-white/20 text-white/70";
      case "running":
        return "bg-vz_green/20 border-vz_green/40 text-vz_green";
      case "scheduled":
      default:
        return "bg-vz_purple/15 border-vz_purple/30 text-vz_purple";
    }
  }

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
          <p className="text-xs md:text-sm uppercase tracking-[0.22em] text-white/70">
            Турнир VZALE #{row.id}
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold">{row.name}</h1>

          <div className="flex flex-wrap items-center gap-3 text-sm md:text-base text-white/80">
            {row.dateStart && <span>{row.dateStart}</span>}
            {row.dateStart && row.venue && <span className="text-white/60">•</span>}
            {row.venue && <span>{row.venue}</span>}
          </div>

          <span
            className={`inline-flex items-center px-4 py-1 rounded-full border bg-white/5 text-xs md:text-sm font-semibold ${statusColor[status]}`}
          >
            {statusLabel[status]}
          </span>
        </header>

        {/* Основной блок */}
        <section className="grid gap-8 md:grid-cols-[2fr,1.2fr] items-start">
          {/* Описание / формат / призы */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <h2 className="text-xl md:text-2xl font-semibold mb-3">О турнире</h2>
              <p className="text-sm md:text-base text-white/80 leading-relaxed">
                {settings?.description ||
                  "Организатор пока не добавил описание. Следите за обновлениями в боте VZALE."}
              </p>
            </div>

            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-7 space-y-4">
              <div>
                <h3 className="text-base md:text-lg font-semibold mb-1">Формат и регламент</h3>
                <p className="text-sm md:text-base text-white/80 leading-relaxed">
                  {settings?.format ||
                    "Детали формата появятся позже. Если вы капитан, уточните в боте перед подачей заявки."}
                </p>
              </div>

              <div>
                <h3 className="text-base md:text-lg font-semibold mb-1">Призы и награды</h3>
                <p className="text-sm md:text-base text-white/80 leading-relaxed">
                  {settings?.prizes || "Призы будут объявлены ближе к старту турнира."}
                </p>
              </div>
            </div>
          </div>

          {/* Правая колонка — CTA */}
          <aside className="space-y-6">
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)] space-y-4">
              <h3 className="text-base md:text-lg font-semibold">Принять участие</h3>
              <p className="text-xs md:text-sm text-white/75">
                Регистрация идёт через бота и сайт: капитаны подают команды, свободные агенты оставляют анкеты.
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
              <p>Все заявки и команды сразу пишутся в ту же базу, что и бот.</p>
              <p>После подачи заявку можно отследить и обновить в личном кабинете или в Telegram.</p>
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
            <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-5 text-sm text-white/70">
              Как только капитаны подадут заявки, здесь появится таблица команд и их составов.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {teams.map((team) => (
                <div
                  key={team.name}
                  className="rounded-2xl border border-white/10 bg-black/25 p-4 md:p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold leading-tight">{team.name}</h3>
                      <p className="text-[11px] text-white/60">
                        {team.wins + team.losses === 0
                          ? "Ещё нет сыгранных матчей"
                          : `${team.wins}-${team.losses} (W-L)`}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold ${team.paid ? "bg-vz_green/80 text-black" : "bg-white/10 text-white/70"}`}
                    >
                      {team.paid ? "Взнос оплачен" : "Без оплаты"}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-white/80">
                    {team.roster.length === 0 ? (
                      <p className="text-white/60">Состав пока не указан.</p>
                    ) : (
                      team.roster.map((player) => (
                        <div
                          key={`${team.name}-${player.userId}`}
                          className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2"
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold">{player.fullName || `Игрок ${player.userId}`}</span>
                            <span className="text-[11px] text-white/60">
                              {player.isCaptain ? "Капитан" : "Игрок"}
                            </span>
                          </div>
                          <span className="text-[11px] text-white/60">ID: {player.userId}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Результаты</p>
              <h2 className="text-xl md:text-2xl font-semibold">Матчи турнира</h2>
            </div>
            <span className="text-xs text-white/60">
              {matches.length > 0
                ? `${matches.length} матч(ей) из базы`
                : "Пока нет сыгранных или запланированных матчей"}
            </span>
          </div>

          {matches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-5 text-sm text-white/70">
              Как только появятся расписание или результаты, здесь отобразятся
              команды, счёт и лучшие игроки.
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 md:p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center gap-3 justify-between">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-white/60">
                        {match.stage || "Матч"}
                        {match.groupName ? ` • ${match.groupName}` : ""}
                      </p>
                      {(match.startAt || match.court) && (
                        <p className="text-[11px] text-white/50">
                          {match.startAt ? `Начало: ${match.startAt}` : ""}
                          {match.startAt && match.court ? " • " : ""}
                          {match.court ? `Площадка: ${match.court}` : ""}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-lg md:text-xl font-semibold">
                        <span>{match.teamHomeName}</span>
                        <span className="text-white/60">vs</span>
                        <span>{match.teamAwayName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl md:text-3xl font-extrabold">
                        {match.scoreHome ?? "-"} : {match.scoreAway ?? "-"}
                      </span>
                      <span
                        className={`text-xs px-3 py-1 rounded-full border ${matchStatusBadge(match.status)}`}
                      >
                        {match.status === "finished"
                          ? "Завершён"
                          : match.status === "running"
                            ? "Идёт"
                            : "Запланирован"}
                      </span>
                    </div>
                  </div>

                  {playerStatsMap.get(match.id)?.length ? (
                    <div className="grid md:grid-cols-2 gap-3">
                      {playerStatsMap
                        .get(match.id)!
                        .slice(0, 6)
                        .map((player) => (
                          <div
                            key={`${match.id}-${player.userId}`}
                            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                          >
                            <div className="flex flex-col">
                              <span className="font-semibold">
                                {player.fullName || `Игрок ${player.userId}`}
                              </span>
                              <span className="text-[11px] text-white/60">{player.teamName}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-white/80">
                              <span className="font-semibold text-vz_green">{player.points} оч.</span>
                              <span>{player.rebounds} подб.</span>
                              <span>{player.assists} пас.</span>
                              {player.threes ? <span>{player.threes} 3-оч.</span> : null}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/60">
                      Подробная статистика игроков для этого матча ещё не внесена.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <Link
          href="/tournaments"
          className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
        >
          ← Ко всем турнирам
        </Link>
      </div>
    </main>
  );
}
