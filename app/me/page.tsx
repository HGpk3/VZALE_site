// app/me/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import {
  fetchAllTournaments,
  fetchLastTeamForCaptain,
  TournamentRow as TournamentDbRow,
} from "@/lib/tournaments";
import { TournamentSignup, TournamentOption } from "./components/TournamentSignup";

type TeamMembership = {
  teamId: number;
  teamName: string;
  role: string;
  memberStatus: string;
  tournamentId: number | null;
  tournamentName: string | null;
  tournamentStatus: string | null;
  captainUserId: number | null;
  inviteCode?: string | null;
  teamStatus?: string | null;
};

type FreeAgentProfile = {
  tournamentId: number | null;
  tournamentName: string | null;
  tournamentStatus: string | null;
  name?: string;
  info?: string;
  isActive: boolean;
};

type PaymentRow = {
  tournamentId: number;
  tournamentName: string | null;
  paid: number;
};

type RatingRow = {
  rating: number;
  games: number;
  updatedAt: string | null;
};

type TournamentRatingRow = {
  tournamentId: number;
  tournamentName: string | null;
  rating: number;
  games: number;
};

type StatsSummary = {
  games: number;
  wins: number;
  points: number;
  threes: number;
  assists: number;
  rebounds: number;
  blocks: number;
  lastUpdated: string | null;
};

type PlayerMatchRow = {
  matchId: number;
  tournamentId: number | null;
  teamName: string | null;
  points: number | null;
  assists: number | null;
  rebounds: number | null;
  threes: number | null;
  scoreHome: number | null;
  scoreAway: number | null;
  stage: string | null;
  groupName: string | null;
};

type AchievementRow = {
  code: string;
  title: string;
  description: string;
  emoji: string | null;
  tier: string;
  orderIndex: number;
  awardedAt: string | null;
  tournamentId: number | null;
  tournamentName: string | null;
};

type RecentMatchRow = {
  matchId: number;
  tournamentId: number | null;
  stage: string | null;
  groupName: string | null;
  startAt: string | null;
  teamName: string;
  opponentName: string;
  scoreHome: number | null;
  scoreAway: number | null;
  isHome: boolean;
  points: number;
  assists: number;
  rebounds: number;
  threes: number;
  result: "win" | "loss" | "pending";
};

type ProfileData = {
  fullName: string | null;
  memberships: TeamMembership[];
  freeAgentProfiles: FreeAgentProfile[];
  payments: PaymentRow[];
  achievements: AchievementRow[];
  allAchievements: AchievementRow[];
  globalRating: RatingRow | null;
  tournamentRatings: TournamentRatingRow[];
  statsTotals: StatsSummary;
  recentMatches: RecentMatchRow[];
};

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch (err) {
    console.error("[profile] failed to parse json", err);
    return null;
  }
}

function achievementTierLabel(tier: string) {
  switch (tier) {
    case "hard":
      return "Хард";
    case "medium":
      return "Средний";
    default:
      return "Лайт";
  }
}

function achievementColor(tier: string) {
  switch (tier) {
    case "hard":
      return "border-amber-300/40 text-amber-200 bg-amber-500/10";
    case "medium":
      return "border-vz_purple/40 text-vz_purple bg-vz_purple/15";
    default:
      return "border-vz_green/40 text-vz_green bg-vz_green/15";
  }
}

function formatAwardedDate(value: string | null) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function formatDateTime(value: string | null) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function achievementProgress(code: string, stats: StatsSummary) {
  const key = code.toLowerCase();
  const helpers: Record<
    string,
    { current: number; target: number; label: string } | undefined
  > = {
    ten_games: {
      current: stats.games,
      target: 10,
      label: `${stats.games} / 10 игр`,
    },
    fifty_games: {
      current: stats.games,
      target: 50,
      label: `${stats.games} / 50 игр`,
    },
    first_win: {
      current: stats.wins,
      target: 1,
      label: `${stats.wins} победа`,
    },
    win_streak3: {
      current: stats.wins,
      target: 3,
      label: `${stats.wins} / 3 победы`,
    },
    streak3: {
      current: stats.wins,
      target: 3,
      label: `${stats.wins} / 3 победы`,
    },
    score100: {
      current: stats.points,
      target: 100,
      label: `${stats.points} / 100 очков`,
    },
    hundred_points: {
      current: stats.points,
      target: 100,
      label: `${stats.points} / 100 очков`,
    },
    assists10: {
      current: stats.assists,
      target: 10,
      label: `${stats.assists} / 10 передач`,
    },
    sniper: {
      current: stats.threes,
      target: 15,
      label: `${stats.threes} / 15 трёхочковых`,
    },
    iron_def: {
      current: stats.blocks,
      target: 5,
      label: `${stats.blocks} / 5 блоков`,
    },
  };

  return helpers[key];
}

function sparkline(values: number[]) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" className="w-full h-16 text-vz_green">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}

function getProfileData(telegramId: number): ProfileData {
  const db = getDb();

  const fullNameRow = db
    .prepare("SELECT full_name FROM users WHERE user_id = ?")
    .get(telegramId) as { full_name?: string } | undefined;

  const memberships = db
    .prepare(
      `
      SELECT
        tm.team_id           AS teamId,
        tm.role              AS role,
        tm.status            AS memberStatus,
        tn.name              AS teamName,
        tn.captain_user_id   AS captainUserId,
        tn.tournament_id     AS tournamentId,
        tn.status            AS teamStatus,
        t.name               AS tournamentName,
        t.status             AS tournamentStatus,
        ts.invite_code       AS inviteCode
      FROM team_members tm
      JOIN teams_new tn ON tn.id = tm.team_id
      LEFT JOIN tournaments t ON t.id = tn.tournament_id
      LEFT JOIN team_security_new ts
        ON ts.team_id = tm.team_id AND ts.tournament_id = tn.tournament_id
      WHERE tm.user_id = ?
      ORDER BY tn.id DESC
    `
    )
    .all(telegramId) as TeamMembership[];

  const freeAgentRows = db
    .prepare(
      `
      SELECT
        fa.profile_json AS profileJson,
        fa.is_active    AS isActive,
        fa.tournament_id AS tournamentId,
        t.name          AS tournamentName,
        t.status        AS tournamentStatus
      FROM free_agents_new fa
      LEFT JOIN tournaments t ON t.id = fa.tournament_id
      WHERE fa.user_id = ?
      ORDER BY fa.id DESC
    `
    )
    .all(telegramId) as {
      profileJson: string | null;
      isActive: number;
      tournamentId: number | null;
      tournamentName: string | null;
      tournamentStatus: string | null;
    }[];

  const freeAgentProfiles: FreeAgentProfile[] = freeAgentRows.map((row) => {
    const parsed = safeJsonParse<{ name?: string; info?: string }>(
      row.profileJson
    );
    return {
      tournamentId: row.tournamentId,
      tournamentName: row.tournamentName,
      tournamentStatus: row.tournamentStatus,
      name: parsed?.name,
      info: parsed?.info,
      isActive: Boolean(row.isActive),
    };
  });

  const payments = db
    .prepare(
      `
        SELECT
          pp.tournament_id AS tournamentId,
          t.name           AS tournamentName,
          pp.paid          AS paid
      FROM player_payments pp
      LEFT JOIN tournaments t ON t.id = pp.tournament_id
      WHERE pp.user_id = ?
    `
    )
    .all(telegramId) as PaymentRow[];

  const achievements = db
    .prepare(
      `
      SELECT
        a.code,
        a.title,
        a.description,
        a.emoji,
        a.tier,
        a.order_index AS orderIndex,
        pa.awarded_at AS awardedAt,
        pa.tournament_id AS tournamentId,
        t.name AS tournamentName
      FROM player_achievements pa
      JOIN achievements a ON a.id = pa.achievement_id
      LEFT JOIN tournaments t ON t.id = pa.tournament_id
      WHERE pa.user_id = ?
      ORDER BY COALESCE(pa.awarded_at, '') DESC, a.order_index ASC
    `
    )
    .all(telegramId) as AchievementRow[];

  const allAchievements = db
    .prepare(
      `
      SELECT
        a.code,
        a.title,
        a.description,
        a.emoji,
        a.tier,
        a.order_index AS orderIndex,
        NULL AS awardedAt,
        NULL AS tournamentId,
        NULL AS tournamentName
      FROM achievements a
      ORDER BY a.order_index ASC, a.id ASC
    `
    )
    .all() as AchievementRow[];

  const globalRating = db
    .prepare(
      `
      SELECT rating, games, updated_at AS updatedAt
      FROM player_ratings
      WHERE user_id = ?
    `
    )
    .get(telegramId) as RatingRow | undefined;

  const tournamentRatings = db
    .prepare(
      `
      SELECT
        prt.tournament_id AS tournamentId,
        t.name AS tournamentName,
        prt.rating,
        prt.games
      FROM player_ratings_by_tournament prt
      LEFT JOIN tournaments t ON t.id = prt.tournament_id
      WHERE prt.user_id = ?
      ORDER BY prt.rating DESC
    `
    )
    .all(telegramId) as TournamentRatingRow[];

  const statsTotals = db
    .prepare(
      `
        SELECT
          COALESCE(SUM(games), 0) AS games,
          COALESCE(SUM(wins), 0) AS wins,
          COALESCE(SUM(points), 0) AS points,
          COALESCE(SUM(threes), 0) AS threes,
          COALESCE(SUM(assists), 0) AS assists,
          COALESCE(SUM(rebounds), 0) AS rebounds,
          COALESCE(SUM(blocks), 0) AS blocks,
          MAX(last_updated) AS lastUpdated
        FROM player_stats
        WHERE user_id = ?
      `
    )
    .get(telegramId) as StatsSummary;

  const recentMatchRows = db
    .prepare(
      `
        SELECT
          pms.match_id AS matchId,
          pms.tournament_id AS tournamentId,
          pms.team_name AS teamName,
          pms.points,
          pms.assists,
          pms.rebounds,
          pms.threes,
          ms.team_home_name AS teamHomeName,
          ms.team_away_name AS teamAwayName,
          ms.score_home AS scoreHome,
          ms.score_away AS scoreAway,
          m.start_at AS startAt,
          COALESCE(m.stage, ms.stage) AS stage,
          m.group_name AS groupName
        FROM player_match_stats pms
        LEFT JOIN matches_simple ms ON ms.id = pms.match_id
        LEFT JOIN matches m ON m.id = pms.match_id
        WHERE pms.user_id = ?
        ORDER BY COALESCE(m.start_at, ms.id) DESC
        LIMIT 6
      `
    )
    .all(telegramId) as (PlayerMatchRow & {
      teamHomeName: string | null;
      teamAwayName: string | null;
      startAt: string | null;
    })[];

  const recentMatches: RecentMatchRow[] = recentMatchRows.map((row) => {
    const teamName = row.teamName ?? "Без названия";
    const isHome = (row.teamHomeName ?? "") === teamName;
    const opponent = isHome ? row.teamAwayName : row.teamHomeName;
    const opponentName = opponent ?? "Соперник уточняется";
    const scoreHome = row.scoreHome ?? null;
    const scoreAway = row.scoreAway ?? null;
    const points = row.points ?? 0;
    const assists = row.assists ?? 0;
    const rebounds = row.rebounds ?? 0;
    const threes = row.threes ?? 0;
    let result: "win" | "loss" | "pending" = "pending";

    if (scoreHome !== null && scoreAway !== null) {
      const homeWon = scoreHome > scoreAway;
      const awayWon = scoreAway > scoreHome;
      if (homeWon || awayWon) {
        const playerWon = isHome ? homeWon : awayWon;
        result = playerWon ? "win" : "loss";
      }
    }

    return {
      matchId: row.matchId,
      tournamentId: row.tournamentId,
      stage: row.stage,
      groupName: row.groupName,
      startAt: row.startAt,
      teamName,
      opponentName,
      scoreHome,
      scoreAway,
      isHome,
      points,
      assists,
      rebounds,
      threes,
      result,
    };
  });

  return {
    fullName: fullNameRow?.full_name ?? null,
    memberships,
    freeAgentProfiles,
    payments,
    achievements,
    allAchievements,
    globalRating: globalRating ?? null,
    tournamentRatings,
    statsTotals,
    recentMatches,
  };
}

function tournamentStatusLabel(status?: string | null) {
  switch (status) {
    case "running":
    case "in_progress":
      return "Турнир идёт";
    case "finished":
      return "Турнир завершён";
    case "closed":
      return "Регистрация закрыта";
    case "registration_open":
      return "Регистрация открыта";
    case "announced":
      return "Анонс";
    case "archived":
      return "Архив";
    default:
      return "Черновик турнира";
  }
}

function badgeColor(status?: string | null) {
  switch (status) {
    case "running":
    case "in_progress":
      return "bg-vz_green/15 text-vz_green border-vz_green/30";
    case "finished":
    case "archived":
      return "bg-white/5 text-white/70 border-white/15";
    case "registration_open":
    case "announced":
      return "bg-vz_purple/15 text-vz_purple border-vz_purple/30";
    case "closed":
      return "bg-amber-500/15 text-amber-200 border-amber-200/30";
    default:
      return "bg-white/5 text-white/70 border-white/15";
  }
}

function roleBadge(role?: string) {
  if (role === "captain") return "Капитан команды";
  return "Игрок";
}

export default async function MePage() {
  const cookieStore = await cookies();
  const telegramIdRaw = cookieStore.get("vzale_telegram_id")?.value;
  const telegramId = telegramIdRaw ? Number(telegramIdRaw) : null;

  if (!telegramId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-vz-gradient px-4">
        <div className="bg-black/50 rounded-3xl p-8 w-full max-w-md text-center shadow-xl">
          <h1 className="text-2xl font-bold mb-4 text-white">
            Вход в личный кабинет
          </h1>
          <p className="text-sm text-white/70 mb-6">
            Войдите через Telegram, чтобы увидеть свои команды,
            турниры и статистику в VZALE.
          </p>
          <p className="text-xs text-white/60 mb-3">
            Авторизация работает через нашего бота: достаточно нажать кнопку
            ниже и подтвердить вход.
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold bg-vz_green text-black hover:brightness-110 transition"
          >
            Войти через Telegram-бота
          </a>
          <p className="mt-4 text-xs text-white/50">
            Мы используем только ваш Telegram ID и имя. Данные не передаются
            третьим лицам.
          </p>
        </div>
      </main>
    );
  }

  const profile = getProfileData(telegramId);
  const tournaments = fetchAllTournaments() as TournamentDbRow[];
  const openTournaments = tournaments.filter(
    (t) => t.status === "registration_open"
  ) as TournamentOption[];
  const adminMode = isAdmin(telegramId);
  const previousTeam = fetchLastTeamForCaptain(telegramId);

  const tournamentsFromTeams = profile.memberships
    .map((m) => m.tournamentId)
    .filter(Boolean) as number[];
  const tournamentsFromAgents = profile.freeAgentProfiles
    .map((f) => f.tournamentId)
    .filter(Boolean) as number[];
  const uniqueTournamentIds = new Set([
    ...tournamentsFromTeams,
    ...tournamentsFromAgents,
    ...profile.payments.map((p) => p.tournamentId),
  ]);

  const activeFreeAgents = profile.freeAgentProfiles.filter((f) => f.isActive);
  const ratingUpdatedAt = profile.globalRating?.updatedAt
    ? formatAwardedDate(profile.globalRating.updatedAt)
    : null;
  const ratingSeries = profile.tournamentRatings.length
    ? [...profile.tournamentRatings]
        .sort((a, b) => b.games - a.games || b.rating - a.rating)
        .map((rt) => rt.rating)
    : profile.globalRating
      ? [profile.globalRating.rating]
      : [];
  const lockedAchievements = profile.allAchievements.filter(
    (a) => !profile.achievements.some((earned) => earned.code === a.code)
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b0615] via-[#05030a] to-black text-white px-4 py-12 md:py-16">
      <div className="relative max-w-6xl mx-auto space-y-10">
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <div className="absolute -top-20 left-10 w-[260px] h-[220px] bg-vz_purple blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[320px] h-[240px] bg-vz_green blur-[140px]" />
        </div>

        <div className="relative z-10 flex items-center justify-between flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
          >
            <span aria-hidden>←</span>
            <span>На главную</span>
          </Link>
          <a
            href="https://t.me/vzalebb_bot"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-vz_green px-4 py-2 text-sm font-semibold text-black hover:brightness-110 transition"
          >
            Управление в боте
          </a>
          {adminMode && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-full bg-vz_purple px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-vz_green hover:text-black transition"
            >
              Отдельная админка
            </Link>
          )}
        </div>

        <header className="relative z-10 space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-white/60">
            Личный кабинет VZALE
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold">
            Привет, {profile.fullName || "игрок"}!
          </h1>
          <p className="text-sm md:text-base text-white/75 max-w-2xl">
            Здесь собрали всё, что связано с вашим участием в турнирах: команды,
            заявки свободного агента и статус оплат. Управление заявками
            происходит в боте, а на сайте — быстрый просмотр.
          </p>

          <div className="flex flex-wrap gap-3 text-xs text-white/60">
            <span className="font-mono bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              Telegram ID: {telegramId}
            </span>
            <a
              href="https://t.me/vzalebb_bot"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-vz_green text-black px-4 py-1.5 rounded-full text-xs font-semibold hover:brightness-110 transition"
            >
              Открыть бота для управления
            </a>
          </div>
        </header>

        <section className="relative z-10 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl">
            <p className="text-sm text-white/60">Команды</p>
            <div className="text-3xl font-bold mt-2">{profile.memberships.length}</div>
            <p className="text-xs text-white/60 mt-1">
              {profile.memberships.length > 0
                ? "Данные подтягиваются напрямую из базы турниров"
                : "Добавьте себя в команду через бота, чтобы увидеть здесь"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl">
            <p className="text-sm text-white/60">Турниры</p>
            <div className="text-3xl font-bold mt-2">
              {uniqueTournamentIds.size}
            </div>
            <p className="text-xs text-white/60 mt-1">
              Учитываем турниры из команд, анкет свободного агента и оплат
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl">
            <p className="text-sm text-white/60">Свободный агент</p>
            <div className="text-3xl font-bold mt-2">{activeFreeAgents.length}</div>
            <p className="text-xs text-white/60 mt-1">
              Активные анкеты из бота: обновите описание или выключите в боте
            </p>
          </div>
          <div className="rounded-2xl border border-vz_purple/20 bg-white/5 p-5 shadow-xl">
            <p className="text-sm text-white/60">Рейтинг</p>
            <div className="text-3xl font-bold mt-2 text-vz_green">
              {profile.globalRating ? `${profile.globalRating.rating.toFixed(1)} RP` : "нет игр"}
            </div>
            <p className="text-xs text-white/60 mt-1">
              {profile.globalRating
                ? `Матчей: ${profile.globalRating.games}${ratingUpdatedAt ? ` · обновлено ${ratingUpdatedAt}` : ""}`
                : "Появится после первого сыгранного матча"}
            </p>
          </div>
        </section>

        <section className="relative z-10 grid gap-4 md:grid-cols-[1.2fr,1fr] items-start">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3 shadow-[0_16px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Матчи</p>
                <h3 className="text-lg font-semibold">Последние игры</h3>
              </div>
              <span className="text-[11px] px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/70">
                {profile.recentMatches.length} записей
              </span>
            </div>

            {profile.recentMatches.length === 0 ? (
              <p className="text-sm text-white/70">
                Сыграйте матч, чтобы увидеть, как личная статистика влияет на RP. Записи подтягиваются напрямую из протоколов.
              </p>
            ) : (
              <div className="space-y-2">
                {profile.recentMatches.map((match) => (
                  <div
                    key={match.matchId}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 flex flex-col gap-1 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] border ${
                          match.result === "win"
                            ? "bg-vz_green/15 text-vz_green border-vz_green/30"
                            : match.result === "loss"
                              ? "bg-rose-500/15 text-rose-100 border-rose-200/40"
                              : "bg-white/5 text-white/70 border-white/15"
                        }`}>
                          {match.result === "win"
                            ? "Победа"
                            : match.result === "loss"
                              ? "Поражение"
                              : "В процессе"}
                        </span>
                        <span className="text-xs text-white/60">
                          {match.stage || "Матч"}
                          {match.groupName ? ` • ${match.groupName}` : ""}
                        </span>
                      </div>
                      {match.startAt && (
                        <span className="text-[11px] text-white/50">
                          {formatDateTime(match.startAt)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {match.teamName} vs {match.opponentName}
                        </span>
                        <span className="text-xs text-white/60">
                          {match.isHome ? "Домашние" : "Гости"} · Турнир #{match.tournamentId ?? "?"}
                        </span>
                      </div>
                      <span className="text-base font-bold">
                        {match.scoreHome ?? "-"} : {match.scoreAway ?? "-"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-white/70">
                      <span className="font-semibold text-vz_green">{match.points} оч.</span>
                      <span>{match.threes} 3-оч.</span>
                      <span>{match.assists} пас.</span>
                      <span>{match.rebounds} подб.</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3 shadow-[0_16px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Прогресс</p>
                <h3 className="text-lg font-semibold">Ближайшие ачивки</h3>
              </div>
              <span className="text-[11px] px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/70">
                {lockedAchievements.slice(0, 3).length || 0} цели
              </span>
            </div>

            {lockedAchievements.length === 0 ? (
              <p className="text-sm text-white/70">Все ачивки уже собраны — ждите новые задачи от организаторов!</p>
            ) : (
              <div className="space-y-2">
                {lockedAchievements.slice(0, 3).map((ach) => {
                  const progress = achievementProgress(ach.code, profile.statsTotals);
                  const pct = progress
                    ? Math.min(100, Math.round((progress.current / progress.target) * 100))
                    : null;

                  return (
                    <div
                      key={ach.code}
                      className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{ach.emoji || "🎯"}</span>
                          <div>
                            <p className="text-sm font-semibold">{ach.title}</p>
                            <p className="text-[11px] text-white/60">{ach.description}</p>
                          </div>
                        </div>
                        <span
                          className={`text-[11px] px-2 py-1 rounded-full border ${achievementColor(ach.tier)}`}
                        >
                          {achievementTierLabel(ach.tier)}
                        </span>
                      </div>

                      {progress ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-white/60">
                            <span>{progress.label}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-vz_purple to-vz_green"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-white/60">
                          Советы: выполните условия из описания — мы покажем прогресс, как только появятся данные в базе.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="relative z-10 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                Регистрация
              </p>
              <h2 className="text-xl md:text-2xl font-semibold">
                Записаться на турнир
              </h2>
            </div>
            <a
              href="https://t.me/vzalebb_bot"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-sm hover:bg-white/15 transition"
            >
              Сделать это в боте
            </a>
          </div>

          <TournamentSignup
            openTournaments={openTournaments}
            previousTeam={previousTeam}
          />
        </section>

        <section className="relative z-10 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                Мои команды
              </p>
              <h2 className="text-xl md:text-2xl font-semibold">Участие в турнирах</h2>
            </div>
            <a
              href="https://t.me/vzalebb_bot"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-sm hover:bg-white/15 transition"
            >
              Управлять заявками в боте
            </a>
          </div>

          {profile.memberships.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
              Вы ещё не добавлены ни в одну команду. Создайте команду или
              присоединитесь к существующей через бота VZALE, после чего данные
              появятся здесь автоматически.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {profile.memberships.map((team) => (
                <div
                  key={`${team.tournamentId}-${team.teamId}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)] space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm text-white/60">{team.teamName}</p>
                      <h3 className="text-lg font-semibold">
                        {team.tournamentName || "Турнир"} {team.tournamentId ? `#${team.tournamentId}` : ""}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full border ${badgeColor(team.tournamentStatus)}`}
                        >
                          {tournamentStatusLabel(team.tournamentStatus)}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full border border-white/15 bg-white/5 text-white/70">
                          {roleBadge(team.role)}
                        </span>
                        {team.memberStatus && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full border border-white/15 bg-white/5 text-white/70">
                            Статус: {team.memberStatus}
                          </span>
                        )}
                        {team.teamStatus && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full border border-white/15 bg-white/5 text-white/70">
                            Команда: {team.teamStatus}
                          </span>
                        )}
                      </div>
                    </div>
                    <a
                      href="https://t.me/vzalebb_bot"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold bg-vz_green text-black px-3 py-2 rounded-lg hover:brightness-110 transition"
                    >
                      Открыть в боте
                    </a>
                  </div>

                  {team.inviteCode && team.role === "captain" && (
                    <div className="rounded-xl bg-black/40 border border-vz_green/30 p-4 space-y-1">
                      <p className="text-xs text-white/60">Инвайт-код для игроков</p>
                      <p className="text-base font-mono tracking-wide text-vz_green">
                        {team.inviteCode}
                      </p>
                      <p className="text-xs text-white/50">
                        Отправьте код в чат, чтобы игроки подключались к команде
                        без подтверждения капитана.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="relative z-10 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">
              Свободный агент
            </p>
            <h2 className="text-xl md:text-2xl font-semibold">Ваши анкеты</h2>
          </div>

          {profile.freeAgentProfiles.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
              Пока нет анкет свободного агента. Оформите заявку в боте, чтобы
              команды могли найти вас и пригласить на турнир.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {profile.freeAgentProfiles.map((fa, idx) => (
                <div
                  key={`${fa.tournamentId}-${idx}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-white/60">{fa.name || "Без имени"}</p>
                      <h3 className="text-lg font-semibold">
                        {fa.tournamentName || "Турнир"} {fa.tournamentId ? `#${fa.tournamentId}` : ""}
                      </h3>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full border text-xs ${badgeColor(
                        fa.isActive ? fa.tournamentStatus : "archived"
                      )}`}
                    >
                      {fa.isActive ? "Анкета активна" : "Выключено"}
                    </span>
                  </div>
                  <p className="text-sm text-white/75 leading-relaxed">
                    {fa.info || "Описание игрока появится здесь после заполнения в боте."}
                  </p>
                  {!fa.isActive && (
                    <p className="text-xs text-white/50">
                      Вернитесь в бота и включите анкету, чтобы команды снова
                      видели вас в поиске.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="relative z-10 space-y-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">
              Рейтинг игрока
            </p>
            <h2 className="text-xl md:text-2xl font-semibold">Как считаем RP</h2>
            <p className="text-sm text-white/70 max-w-3xl leading-relaxed">
              Рейтинг пересчитывается ботом после каждого завершённого матча. Все
              стартуют с <span className="font-semibold text-white">1000 RP</span>,
              дальше добавляются очки за победу команды (+20), снимаются за поражение (-5),
              и начисляются за личную статистику: +2 за очко, +3 за ассист, +4 за блок.
              Победившая команда получает дополнительный бонус за разницу счёта
              (по +1 каждые 5 очков) и +5 RP у лучшего бомбардира матча. Эти же правила
              применяются для глобального рейтинга и рейтингов конкретных турниров.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_16px_50px_rgba(0,0,0,0.5)] space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/60">За всё время</p>
                  <h3 className="text-xl font-semibold">
                    {profile.globalRating ? `${profile.globalRating.rating.toFixed(1)} RP` : "Ещё нет игр"}
                  </h3>
                </div>
                <span className="text-xs px-3 py-1 rounded-full border border-white/15 bg-white/5 text-white/70">
                  {profile.globalRating ? `${profile.globalRating.games} игр` : "старт 1000 RP"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-white/70">
                <span className="px-2 py-1 rounded-full border border-white/10 bg-white/5">{profile.statsTotals.games} игр</span>
                <span className="px-2 py-1 rounded-full border border-white/10 bg-white/5">{profile.statsTotals.wins} побед</span>
                <span className="px-2 py-1 rounded-full border border-white/10 bg-white/5">{profile.statsTotals.points} очков</span>
                <span className="px-2 py-1 rounded-full border border-white/10 bg-white/5">{profile.statsTotals.assists} передач</span>
              </div>
              {ratingSeries.length > 1 && (
                <div className="mt-2">
                  <p className="text-[11px] text-white/60 mb-1">Динамика RP по турнирам</p>
                  {sparkline(ratingSeries)}
                </div>
              )}
              {ratingUpdatedAt && (
                <p className="text-xs text-white/50">Обновлено {ratingUpdatedAt}</p>
              )}
              {!profile.globalRating && (
                <p className="text-sm text-white/70">
                  Сыграйте любой матч, чтобы рейтинг начал расти.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_16px_50px_rgba(0,0,0,0.5)] space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/60">По турнирам</p>
                  <h3 className="text-lg font-semibold">Отдельные рейтинги</h3>
                </div>
                <span className="text-xs px-3 py-1 rounded-full border border-white/15 bg-white/5 text-white/70">
                  {profile.tournamentRatings.length} записей
                </span>
              </div>

              {profile.tournamentRatings.length === 0 ? (
                <p className="text-sm text-white/70">
                  Как только вы сыграете матчи в турнире, здесь появится его RP.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-auto pr-1">
                  {profile.tournamentRatings.map((rt) => (
                    <div
                      key={rt.tournamentId}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {rt.tournamentName || `Турнир #${rt.tournamentId}`}
                        </span>
                        <span className="text-xs text-white/60">Матчей: {rt.games}</span>
                      </div>
                      <span className="font-semibold text-vz_green">{rt.rating.toFixed(1)} RP</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {profile.payments.length > 0 && (
          <section className="relative z-10 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                Оплата участия
              </p>
              <h2 className="text-xl md:text-2xl font-semibold">Статус платежей</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {profile.payments.map((p) => (
                <div
                  key={`${p.tournamentId}-${p.tournamentName}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm text-white/60">
                      {p.tournamentName || "Турнир"} {p.tournamentId ? `#${p.tournamentId}` : ""}
                    </p>
                    <h3 className="text-lg font-semibold">Оплата участия</h3>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full border text-xs font-semibold ${
                      p.paid ? "bg-vz_green/15 text-vz_green border-vz_green/30" : "bg-white/5 text-white/70 border-white/15"
                    }`}
                  >
                    {p.paid ? "Оплачено" : "Ожидает оплаты"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="relative z-10 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">
              Ачивки
            </p>
            <h2 className="text-xl md:text-2xl font-semibold">Ваши награды</h2>
            <p className="text-sm text-white/70 max-w-2xl">
              Все награды подтянуты из бота. Видно, за какой турнир и когда была
              получена каждая ачивка.
            </p>
          </div>

          {profile.achievements.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
              Пока нет полученных ачивок. Играйте матчи и выполняйте условия в
              турнирах VZALE, чтобы собрать коллекцию наград.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {profile.achievements.map((ach, idx) => (
                <div
                  key={`${ach.code}-${idx}-${ach.tournamentId ?? "global"}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-xl">
                        {ach.emoji || "🏆"}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-white/60">
                          {ach.tournamentName || "Глобальная"}
                        </p>
                        <h3 className="text-lg font-semibold">{ach.title}</h3>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] px-3 py-1 rounded-full border font-semibold ${achievementColor(
                        ach.tier
                      )}`}
                    >
                      {achievementTierLabel(ach.tier)}
                    </span>
                  </div>

                  <p className="text-sm text-white/75 leading-relaxed">
                    {ach.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>
                      {ach.tournamentId
                        ? `Турнир #${ach.tournamentId}`
                        : "Глобальная награда"}
                    </span>
                    {ach.awardedAt && (
                      <span className="font-mono text-white/70">
                        {formatAwardedDate(ach.awardedAt)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {adminMode && (
          <section className="relative z-10 space-y-4">
            <div className="rounded-2xl border border-vz_purple/25 bg-vz_purple/10 p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                  Админ
                </p>
                <h3 className="text-lg font-semibold">Отдельная панель управления</h3>
                <p className="text-sm text-white/70 max-w-2xl">
                  Все инструменты создания турниров, матчей и статусов вынесены в отдельную страницу,
                  чтобы не прокручивать личный кабинет до самого низа.
                </p>
              </div>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-xl bg-vz_green px-4 py-2 text-sm font-semibold text-black hover:brightness-110 transition"
              >
                Открыть админку
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
