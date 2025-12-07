import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import crypto from "crypto";

function ensureAuth(req: NextRequest) {
  const telegramId = req.cookies.get("vzale_telegram_id")?.value;
  return telegramId ? Number(telegramId) : null;
}

export async function POST(req: NextRequest) {
  try {
    const telegramId = ensureAuth(req);
    if (!telegramId) {
      return NextResponse.json(
        { ok: false, error: "Требуется авторизация через бота" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const tournamentId = Number(body?.tournamentId);
    const teamName = (body?.teamName as string | undefined)?.trim();

    if (!tournamentId || !teamName) {
      return NextResponse.json(
        { ok: false, error: "Нужно указать турнир и название команды" },
        { status: 400 }
      );
    }

    const db = getDb();

    const tournament = db
      .prepare("SELECT id, status FROM tournaments WHERE id = ?")
      .get(tournamentId) as { id: number; status: string } | undefined;

    if (!tournament) {
      return NextResponse.json(
        { ok: false, error: "Турнир не найден" },
        { status: 404 }
      );
    }

    if (tournament.status !== "registration_open") {
      return NextResponse.json(
        { ok: false, error: "Регистрация на этот турнир закрыта" },
        { status: 400 }
      );
    }

    const teamRow = db
      .prepare(
        "SELECT id, name FROM teams WHERE captain_user_id = ? AND LOWER(name) = LOWER(?)"
      )
      .get(telegramId, teamName) as { id: number; name: string } | undefined;

    let teamId = teamRow?.id;
    let createdTeam = false;

    if (!teamId) {
      const insertTeam = db.prepare(
        "INSERT INTO teams (name, captain_user_id) VALUES (?, ?)"
      );
      const result = insertTeam.run(teamName, telegramId);
      teamId = Number(result.lastInsertRowid);
      createdTeam = true;
    }

    const duplicate = db
      .prepare(
        "SELECT id FROM tournament_teams WHERE tournament_id = ? AND team_id = ?"
      )
      .get(tournamentId, teamId) as { id: number } | undefined;

    if (duplicate) {
      return NextResponse.json(
        { ok: false, error: "Эта команда уже зарегистрирована в турнире" },
        { status: 400 }
      );
    }

    const transaction = db.transaction(() => {
      db.prepare(
        "INSERT OR IGNORE INTO team_members (team_id, user_id, role, status, tournament_id) VALUES (?, ?, 'captain', 'confirmed', ?)"
      ).run(teamId, telegramId, tournamentId);

      const lastRoster = db
        .prepare(
          "SELECT user_id as userId, role, status FROM team_members WHERE team_id = ? AND user_id <> ?"
        )
        .all(teamId, telegramId) as { userId: number; role: string | null; status: string | null }[];

      let copiedMembers = 0;
      const insertMember = db.prepare(
        "INSERT OR IGNORE INTO team_members (team_id, user_id, role, status, tournament_id) VALUES (?, ?, COALESCE(?, 'player'), COALESCE(?, 'pending'), ?)"
      );

      for (const member of lastRoster) {
        insertMember.run(teamId, member.userId, member.role, member.status, tournamentId);
        copiedMembers += 1;
      }

      const inviteCode = crypto.randomBytes(3).toString("hex");
      try {
        db.prepare(
          "INSERT OR IGNORE INTO team_security_new (tournament_id, team_id, invite_code) VALUES (?, ?, ?)"
        ).run(tournamentId, teamId, inviteCode);
      } catch (err) {
        console.warn("[register-team] failed to create invite code", err);
      }

      const reg = db
        .prepare(
          "INSERT INTO tournament_teams (tournament_id, team_id, registered_at) VALUES (?, ?, CURRENT_TIMESTAMP)"
        )
        .run(tournamentId, teamId);

      return { copiedMembers, inviteCode, registrationId: Number(reg.lastInsertRowid) };
    });

    const { copiedMembers, inviteCode, registrationId } = transaction();

    return NextResponse.json({
      ok: true,
      teamId,
      registrationId,
      createdTeam,
      inviteCode,
      copiedMembers,
    });
  } catch (err) {
    console.error("[register-team]", err);
    return NextResponse.json(
      { ok: false, error: "Не удалось создать команду" },
      { status: 500 }
    );
  }
}
