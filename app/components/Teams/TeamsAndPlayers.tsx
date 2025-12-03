import { getDb } from "@/lib/db";

type TeamRow = {
  id: number;
  name: string;
  status: string | null;
  playersCount: number;
  tournamentId: number | null;
};

type PlayerRow = {
  userId: number;
  fullName: string | null;
  points: number;
  games: number;
};

function getLatestTournamentId(): number | null {
  const db = getDb();
  // Берём самый свежий турнир, в котором уже есть команды или статистика игроков.
  // Так мы не показываем пустую карточку, если последний турнир ещё не заполнен.
  const populated = db
    .prepare(
      `
        SELECT t.id
        FROM tournaments t
        LEFT JOIN teams_new tn ON tn.tournament_id = t.id
        LEFT JOIN player_stats ps ON ps.tournament_id = t.id
        GROUP BY t.id
        HAVING COUNT(tn.id) > 0 OR COUNT(ps.user_id) > 0
        ORDER BY
          CASE WHEN t.status = 'running' THEN 1 ELSE 0 END DESC,
          CASE WHEN t.status = 'registration_open' THEN 1 ELSE 0 END DESC,
          t.id DESC
        LIMIT 1
      `
    )
    .get() as { id: number } | undefined;

  if (populated?.id) return populated.id;

  // Если нет турниров с данными, падаем обратно на самый свежий по статусу/дате.
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

function getTeams(tournamentId: number | null): TeamRow[] {
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
        LIMIT 6
      `
    )
    .all(tournamentId, tournamentId) as TeamRow[];
}

function getTopPlayers(tournamentId: number | null): PlayerRow[] {
  const db = getDb();

  if (tournamentId) {
    return db
      .prepare(
        `
          SELECT
            ps.user_id AS userId,
            u.full_name AS fullName,
            ps.points,
            ps.games
          FROM player_stats ps
          LEFT JOIN users u ON u.user_id = ps.user_id
          WHERE ps.tournament_id = ?
          ORDER BY ps.points DESC
          LIMIT 5
        `
      )
      .all(tournamentId) as PlayerRow[];
  }

  return db
    .prepare(
      `
        SELECT
          pr.user_id AS userId,
          u.full_name AS fullName,
          pr.rating AS points,
          pr.games
        FROM player_ratings pr
        LEFT JOIN users u ON u.user_id = pr.user_id
        ORDER BY pr.rating DESC
        LIMIT 5
      `
    )
    .all() as PlayerRow[];
}

export default function TeamsAndPlayers() {
  const tournamentId = getLatestTournamentId();
  const teams = getTeams(tournamentId);
  const players = getTopPlayers(tournamentId);

  const tournamentHint = tournamentId
    ? "Последний турнир"
    : "Рейтинги по всем играм";

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

  return (
    <section className="relative w-full py-20 md:py-24 px-6 md:px-10 bg-gradient-to-b from-[#0B0615] via-[#050309] to-black text-white">
      {/* Лёгкий неоновый фон для глубины */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-10 left-0 w-[280px] h-[200px] bg-vz_purple blur-[110px]" />
        <div className="absolute bottom-0 right-10 w-[260px] h-[220px] bg-vz_green blur-[110px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Заголовок */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold">
            Команды и топ игроки
          </h2>
          <p className="text-sm md:text-base text-white/70 max-w-md">
            Здесь собраны команды, которые уже с нами, и игроки, которые задают
            темп турнирам VZALE.
          </p>
        </div>

        {/* Две колонки */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Лево — команды */}
          <div className="space-y-4">
            <h3 className="text-lg md:text-xl font-semibold mb-2">
              Команды
            </h3>
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
                      {/* Кружок-аватар команды */}
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
              </div>
            )}
          </div>

          {/* Право — топ игроки */}
          <div className="space-y-4">
            <h3 className="text-lg md:text-xl font-semibold mb-2">
              Топ игроки
            </h3>

            <div className="rounded-2xl bg-white/5 border border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.6)] overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10 text-xs md:text-sm uppercase tracking-[0.18em] text-white/60">
                {tournamentHint}
              </div>

              <ul className="divide-y divide-white/8">
                {players.length === 0 ? (
                  <li className="px-5 py-4 text-sm text-white/60">
                    Статистика игроков появится после первых матчей.
                  </li>
                ) : (
                  players.map((p, index) => (
                    <li
                      key={`${p.userId}-${p.points}`}
                      className="flex items-center justify-between px-5 py-3 md:py-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/10 flex items-center justify-center text-xs md:text-sm font-semibold">
                          {index + 1}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm md:text-base font-medium">
                            {p.fullName || `Игрок ${p.userId}`}
                          </span>
                          <span className="text-xs text-white/50">{p.games} игр</span>
                        </div>
                      </div>
                      <span className="text-sm md:text-base font-semibold text-vz_green">
                        {p.points}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
