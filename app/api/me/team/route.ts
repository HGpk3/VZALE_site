import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function ensureAuth(req: NextRequest) {
  const telegramId = req.cookies.get("vzale_telegram_id")?.value;
  return telegramId ? Number(telegramId) : null;
}

function getTeamForUser(db: ReturnType<typeof getDb>, userId: number) {
  return db
    .prepare(
      `
      SELECT t.id, t.name, t.captain_user_id as captainUserId, t.tournament_id as tournamentId
      FROM teams_new t
      JOIN team_members tm ON tm.team_id = t.id AND tm.tournament_id = t.tournament_id
      WHERE tm.user_id = ?
      ORDER BY t.id DESC
      LIMIT 1
    `,
    )
    .get(userId) as
    | { id: number; name: string; captainUserId: number; tournamentId: number }
    | undefined;
}

function getRegistration(db: ReturnType<typeof getDb>, teamId: number) {
  return db
    .prepare(
      `
      SELECT tn.tournament_id as tournamentId, tn.created_at as registeredAt, t.name as tournamentName, t.status
      FROM teams_new tn
      LEFT JOIN tournaments t ON t.id = tn.tournament_id
      WHERE tn.id = ?
      LIMIT 1
    `,
    )
    .get(teamId) as
    | { tournamentId: number; registeredAt: string | null; tournamentName: string | null; status: string | null }
    | undefined;
}

export async function GET(req: NextRequest) {
  const telegramId = ensureAuth(req);
  if (!telegramId) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  const db = getDb();
  const team = getTeamForUser(db, telegramId);

  if (!team) {
    const openTournaments = db
      .prepare("SELECT id, name, status FROM tournaments WHERE status = 'registration_open' ORDER BY id DESC")
      .all() as { id: number; name: string; status: string | null }[];

    return NextResponse.json({ ok: true, team: null, openTournaments });
  }

  const members = db
    .prepare(
      `
      SELECT tm.user_id as userId, tm.role, tm.status, u.full_name as fullName
      FROM team_members tm
      LEFT JOIN users u ON u.user_id = tm.user_id
      WHERE tm.team_id = ? AND tm.tournament_id = ?
      ORDER BY CASE WHEN tm.role = 'captain' THEN 1 ELSE 0 END DESC, u.full_name ASC
    `,
    )
    .all(team.id, team.tournamentId) as { userId: number; role: string | null; status: string | null; fullName: string | null }[];

  const registration = getRegistration(db, team.id);
  const openTournaments = db
    .prepare("SELECT id, name, status FROM tournaments WHERE status = 'registration_open' ORDER BY id DESC")
    .all() as { id: number; name: string; status: string | null }[];

  return NextResponse.json({
    ok: true,
    team,
    members,
    registration,
    openTournaments,
    isCaptain: team.captainUserId === telegramId,
  });
}

export async function POST(req: NextRequest) {
  const telegramId = ensureAuth(req);
  if (!telegramId) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  const db = getDb();
  const body = await req.json();
  const action = (body?.action as string | undefined) ?? "create";

  try {
      switch (action) {
        case "create": {
          const name = (body?.name as string | undefined)?.trim();
          const tournamentId = Number(body?.tournamentId);
          if (!name) {
            return NextResponse.json({ ok: false, error: "Название команды обязательно" }, { status: 400 });
          }
          if (!tournamentId) {
            return NextResponse.json({ ok: false, error: "tournament_required" }, { status: 400 });
          }

          const tournament = db
            .prepare("SELECT id, status FROM tournaments WHERE id = ?")
            .get(tournamentId) as { id: number; status: string | null } | undefined;
          if (!tournament) {
            return NextResponse.json({ ok: false, error: "tournament_not_found" }, { status: 404 });
          }
          if (tournament.status !== "registration_open") {
            return NextResponse.json({ ok: false, error: "registration_closed" }, { status: 400 });
          }

          const existing = getTeamForUser(db, telegramId);
          if (existing) {
            return NextResponse.json({ ok: false, error: "Команда уже создана" }, { status: 400 });
          }

          const result = db
            .prepare(
              "INSERT INTO teams_new (tournament_id, name, captain_user_id, status) VALUES (?, ?, ?, 'active')"
            )
            .run(tournamentId, name, telegramId);
          const teamId = Number(result.lastInsertRowid);
          db.prepare(
            "INSERT OR IGNORE INTO team_members (team_id, user_id, role, status, tournament_id) VALUES (?, ?, 'captain', 'confirmed', ?)",
          ).run(teamId, telegramId, tournamentId);

          return NextResponse.json({ ok: true, teamId });
        }
        case "rename": {
          const team = getTeamForUser(db, telegramId);
          if (!team) return NextResponse.json({ ok: false, error: "team_not_found" }, { status: 404 });
          if (team.captainUserId !== telegramId)
            return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

          const name = (body?.name as string | undefined)?.trim();
          if (!name) return NextResponse.json({ ok: false, error: "empty_name" }, { status: 400 });

          db.prepare("UPDATE teams_new SET name = ? WHERE id = ?").run(name, team.id);
          return NextResponse.json({ ok: true });
        }
        case "add_member": {
          const team = getTeamForUser(db, telegramId);
          if (!team) return NextResponse.json({ ok: false, error: "team_not_found" }, { status: 404 });
        if (team.captainUserId !== telegramId)
          return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

        const newUserId = Number(body?.userId);
        const fullName = (body?.fullName as string | undefined)?.trim();
        if (!newUserId) return NextResponse.json({ ok: false, error: "user_required" }, { status: 400 });

          db.prepare(
            "INSERT OR IGNORE INTO team_members (team_id, user_id, role, status, tournament_id) VALUES (?, ?, 'player', 'confirmed', ?)"
          )
            .run(team.id, newUserId, team.tournamentId);

        if (fullName) {
          db.prepare(
            "INSERT OR REPLACE INTO users (user_id, full_name) VALUES (?, COALESCE((SELECT full_name FROM users WHERE user_id = ?), ?))",
          ).run(newUserId, newUserId, fullName);
        }

        return NextResponse.json({ ok: true });
      }
        case "remove_member": {
          const team = getTeamForUser(db, telegramId);
          if (!team) return NextResponse.json({ ok: false, error: "team_not_found" }, { status: 404 });
          if (team.captainUserId !== telegramId)
            return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

          const removeId = Number(body?.userId);
          if (!removeId) return NextResponse.json({ ok: false, error: "user_required" }, { status: 400 });
          db.prepare("DELETE FROM team_members WHERE team_id = ? AND user_id = ? AND tournament_id = ?").run(
            team.id,
            removeId,
            team.tournamentId,
          );
          return NextResponse.json({ ok: true });
        }
        case "leave": {
          const team = getTeamForUser(db, telegramId);
          if (!team) return NextResponse.json({ ok: false, error: "team_not_found" }, { status: 404 });
          if (team.captainUserId === telegramId) {
            return NextResponse.json({ ok: false, error: "captain_cannot_leave" }, { status: 400 });
          }
          db.prepare("DELETE FROM team_members WHERE team_id = ? AND user_id = ? AND tournament_id = ?").run(
            team.id,
            telegramId,
            team.tournamentId,
          );
          return NextResponse.json({ ok: true });
        }
        case "delete": {
          const team = getTeamForUser(db, telegramId);
          if (!team) return NextResponse.json({ ok: false, error: "team_not_found" }, { status: 404 });
          if (team.captainUserId !== telegramId)
            return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

          const tx = db.transaction(() => {
            db.prepare("DELETE FROM tournament_teams WHERE team_id = ?").run(team.id);
            db.prepare("DELETE FROM team_members WHERE team_id = ? AND tournament_id = ?").run(team.id, team.tournamentId);
            db.prepare("DELETE FROM team_security_new WHERE team_id = ? AND tournament_id = ?").run(team.id, team.tournamentId);
            db.prepare("DELETE FROM teams_new WHERE id = ?").run(team.id);
          });
          tx();
          return NextResponse.json({ ok: true });
        }
        case "register": {
          const team = getTeamForUser(db, telegramId);
          if (!team) return NextResponse.json({ ok: false, error: "team_not_found" }, { status: 404 });
          if (team.captainUserId !== telegramId)
            return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

          const tournamentId = Number(body?.tournamentId);
          if (!tournamentId) return NextResponse.json({ ok: false, error: "tournament_required" }, { status: 400 });

          if (tournamentId !== team.tournamentId)
            return NextResponse.json({ ok: false, error: "wrong_tournament" }, { status: 400 });

          const tournament = db
            .prepare("SELECT id, status FROM tournaments WHERE id = ?")
            .get(tournamentId) as { id: number; status: string | null } | undefined;
          if (!tournament) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
        if (tournament.status !== "registration_open")
          return NextResponse.json({ ok: false, error: "registration_closed" }, { status: 400 });

        const duplicate = db
          .prepare("SELECT id FROM tournament_teams WHERE tournament_id = ? AND team_id = ?")
          .get(tournamentId, team.id) as { id: number } | undefined;
        if (duplicate) return NextResponse.json({ ok: false, error: "already_registered" }, { status: 400 });

        db.prepare(
          "INSERT INTO tournament_teams (tournament_id, team_id, registered_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
        ).run(tournamentId, team.id);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
    }
  } catch (err) {
    console.error("[team API]", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
