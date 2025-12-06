import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function ensureAuth(req: NextRequest) {
  const telegramId = req.cookies.get("vzale_telegram_id")?.value;
  return telegramId ? Number(telegramId) : null;
}

function getTeamForCaptain(teamId: number, captainId: number) {
  const db = getDb();
  const row = db
    .prepare(
      `
        SELECT
          tn.id,
          tn.name,
          tn.tournament_id AS tournamentId,
          tm.role
        FROM teams_new tn
        LEFT JOIN team_members tm ON tm.team_id = tn.id AND tm.user_id = ?
        WHERE tn.id = ?
      `,
    )
    .get(captainId, teamId) as
    | { id: number; name: string; tournamentId: number | null; role: string | null }
    | undefined;

  if (!row || row.role !== "captain") return null;
  return row;
}

function fetchTeamPayload(teamId: number) {
  const db = getDb();
  const team = db
    .prepare(
      `
        SELECT
          tn.id,
          tn.name,
          tn.tournament_id AS tournamentId,
          COALESCE(ttn.paid, 0) AS paid,
          t.name AS tournamentName,
          ts.invite_code AS inviteCode
        FROM teams_new tn
        LEFT JOIN tournament_team_names ttn
          ON ttn.tournament_id = tn.tournament_id AND ttn.name = tn.name
        LEFT JOIN tournaments t ON t.id = tn.tournament_id
        LEFT JOIN team_security_new ts ON ts.team_id = tn.id AND ts.tournament_id = tn.tournament_id
        WHERE tn.id = ?
      `,
    )
    .get(teamId) as
    | {
        id: number;
        name: string;
        tournamentId: number | null;
        paid: number;
        tournamentName: string | null;
        inviteCode: string | null;
      }
    | undefined;

  if (!team) return null;

  const roster = db
    .prepare(
      `
        SELECT
          tm.team_id AS teamId,
          tm.user_id AS userId,
          u.full_name AS fullName,
          tm.role,
          tm.status,
          CASE WHEN tm.role = 'captain' THEN 1 ELSE 0 END AS isCaptain
        FROM team_members tm
        LEFT JOIN users u ON u.user_id = tm.user_id
        WHERE tm.team_id = ?
        ORDER BY isCaptain DESC, COALESCE(u.full_name, '') ASC, tm.user_id ASC
      `,
    )
    .all(teamId) as {
    teamId: number;
    userId: number;
    fullName: string | null;
    role: string | null;
    status: string | null;
    isCaptain: number;
  }[];

  return {
    teamId: team.id,
    name: team.name,
    tournamentId: team.tournamentId,
    tournamentName: team.tournamentName ?? null,
    paid: team.paid,
    roster,
    inviteCode: team.inviteCode,
  };
}

export async function POST(req: NextRequest) {
  try {
    const telegramId = ensureAuth(req);
    if (!telegramId) {
      return NextResponse.json(
        { ok: false, error: "Требуется авторизация через бота" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const action = body?.action as string;
    const teamId = Number(body?.teamId);

    if (!teamId || !action) {
      return NextResponse.json(
        { ok: false, error: "Не указан teamId или действие" },
        { status: 400 },
      );
    }

    const team = getTeamForCaptain(teamId, telegramId);
    if (!team) {
      return NextResponse.json(
        { ok: false, error: "Только капитан может управлять командой" },
        { status: 403 },
      );
    }

    const db = getDb();

    if (action === "rename") {
      const newName = (body?.newName as string | undefined)?.trim();
      if (!newName) {
        return NextResponse.json(
          { ok: false, error: "Введите новое название команды" },
          { status: 400 },
        );
      }

      db.prepare("UPDATE teams_new SET name = ? WHERE id = ?").run(newName, teamId);
      db.prepare(
        "UPDATE tournament_team_names SET name = ? WHERE tournament_id = ? AND name = ?",
      ).run(newName, team.tournamentId, team.name);
      db.prepare(
        "INSERT OR IGNORE INTO tournament_team_names (tournament_id, name, paid) VALUES (?, ?, 0)",
      ).run(team.tournamentId, newName);
      db.prepare(
        "UPDATE tournament_roster SET team_name = ? WHERE tournament_id = ? AND team_name = ?",
      ).run(newName, team.tournamentId, team.name);
    } else if (action === "add_player") {
      const userId = Number(body?.userId);
      const fullName = (body?.fullName as string | undefined)?.trim() || null;
      if (!userId) {
        return NextResponse.json(
          { ok: false, error: "Укажите Telegram ID игрока" },
          { status: 400 },
        );
      }

      db.prepare("INSERT OR IGNORE INTO users (user_id, full_name) VALUES (?, ?)").run(
        userId,
        fullName,
      );
      if (fullName) {
        db.prepare("UPDATE users SET full_name = COALESCE(full_name, ?) WHERE user_id = ?").run(
          fullName,
          userId,
        );
      }

      db.prepare(
        "INSERT OR REPLACE INTO team_members (team_id, user_id, role, status, tournament_id) VALUES (?, ?, COALESCE(?, 'player'), 'confirmed', ?)",
      ).run(teamId, userId, "player", team.tournamentId);

      db.prepare(
        `
          INSERT OR IGNORE INTO tournament_roster (
            tournament_id,
            user_id,
            team_name,
            full_name,
            is_captain
          )
          VALUES (?, ?, ?, ?, 0)
        `,
      ).run(team.tournamentId, userId, team.name, fullName);
    } else if (action === "remove_player") {
      const userId = Number(body?.userId);
      if (!userId) {
        return NextResponse.json(
          { ok: false, error: "Укажите Telegram ID игрока" },
          { status: 400 },
        );
      }

      const member = db
        .prepare("SELECT role FROM team_members WHERE team_id = ? AND user_id = ?")
        .get(teamId, userId) as { role: string | null } | undefined;

      if (member?.role === "captain") {
        return NextResponse.json(
          { ok: false, error: "Нельзя удалить капитана команды" },
          { status: 400 },
        );
      }

      db.prepare("DELETE FROM team_members WHERE team_id = ? AND user_id = ?").run(teamId, userId);
      db.prepare(
        "DELETE FROM tournament_roster WHERE tournament_id = ? AND user_id = ? AND team_name = ?",
      ).run(team.tournamentId, userId, team.name);
    } else {
      return NextResponse.json(
        { ok: false, error: "Неизвестное действие" },
        { status: 400 },
      );
    }

    const payload = fetchTeamPayload(teamId);
    return NextResponse.json({ ok: true, team: payload });
  } catch (err) {
    console.error("[team-manage]", err);
    return NextResponse.json({ ok: false, error: "Ошибка при обновлении команды" }, { status: 500 });
  }
}
