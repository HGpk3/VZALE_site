// app/me/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { TournamentSignup, TournamentOption } from "./components/TournamentSignup";
import { AdminPanel } from "./components/AdminPanel";

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

type ProfileData = {
  fullName: string | null;
  memberships: TeamMembership[];
  freeAgentProfiles: FreeAgentProfile[];
  payments: PaymentRow[];
  achievements: AchievementRow[];
  globalRating: RatingRow | null;
  tournamentRatings: TournamentRatingRow[];
};

type TournamentRow = {
  id: number;
  name: string;
  status: string;
  dateStart: string | null;
  venue: string | null;
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

  return {
    fullName: fullNameRow?.full_name ?? null,
    memberships,
    freeAgentProfiles,
    payments,
    achievements,
    globalRating: globalRating ?? null,
    tournamentRatings,
  };
}

function getTournaments(): TournamentRow[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT id, name, status, date_start as dateStart, venue FROM tournaments ORDER BY id DESC"
    )
    .all() as TournamentRow[];
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
  const tournaments = getTournaments();
  const openTournaments = tournaments.filter(
    (t) => t.status === "registration_open"
  ) as TournamentOption[];
  const adminMode = isAdmin(telegramId);

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

          <TournamentSignup openTournaments={openTournaments} />
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
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                Панель админа
              </p>
              <h2 className="text-xl md:text-2xl font-semibold">
                Создание и управление турнирами
              </h2>
              <p className="text-sm text-white/70 max-w-2xl">
                Все действия пишутся в ту же базу, что и бот. Можно открыть или
                закрыть регистрацию, создать новый турнир и управлять статусами
                без Telegram.
              </p>
            </div>

            <AdminPanel tournaments={tournaments} />
          </section>
        )}
      </div>
    </main>
  );
}
