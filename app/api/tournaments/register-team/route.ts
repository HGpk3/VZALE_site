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

    const transaction = db.transaction(() => {
      const existingTeam = db
        .prepare(
          "SELECT id FROM teams_new WHERE tournament_id = ? AND LOWER(name) = LOWER(?)"
        )
        .get(tournamentId, teamName) as { id: number } | undefined;

      if (existingTeam) {
        return { kind: "duplicate" as const };
      }

      const lastTeam = db
        .prepare(
          "SELECT id FROM teams_new WHERE captain_user_id = ? ORDER BY id DESC LIMIT 1"
        )
        .get(telegramId) as { id: number } | undefined;

      const insertTeam = db.prepare(
        "INSERT INTO teams_new (tournament_id, name, captain_user_id, status) VALUES (?, ?, ?, 'active')"
      );
      const result = insertTeam.run(tournamentId, teamName, telegramId);
      const teamId = Number(result.lastInsertRowid);

      db.prepare(
        "INSERT OR IGNORE INTO team_members (team_id, user_id, role, status, tournament_id) VALUES (?, ?, 'captain', 'confirmed', ?)"
      ).run(teamId, telegramId, tournamentId);

      const lastRoster = lastTeam
        ? (db
            .prepare(
              "SELECT user_id as userId, role, status FROM team_members WHERE team_id = ? AND user_id <> ?"
            )
            .all(lastTeam.id, telegramId) as {
            userId: number;
            role: string | null;
            status: string | null;
          }[])
        : [];

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

      try {
        db.prepare(
          "INSERT OR IGNORE INTO tournament_teams (tournament_id, team_id, registered_at) VALUES (?, ?, CURRENT_TIMESTAMP)"
        ).run(tournamentId, teamId);
      } catch (err) {
        console.warn("[register-team] failed to mirror registration", err);
      }

      return { kind: "created" as const, copiedMembers, inviteCode, teamId };
    });

    const result = transaction();

    if (result.kind === "duplicate") {
      return NextResponse.json(
        { ok: false, error: "Эта команда уже зарегистрирована в турнире" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      teamId: result.teamId,
      registrationId: null,
      createdTeam: true,
      inviteCode: result.inviteCode,
      copiedMembers: result.copiedMembers,
    });
  } catch (err) {
    console.error("[register-team]", err);
    return NextResponse.json(
      { ok: false, error: "Не удалось создать команду" },
      { status: 500 }
    );
  }
}
