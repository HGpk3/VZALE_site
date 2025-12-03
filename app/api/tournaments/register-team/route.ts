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

    const existing = db
      .prepare(
        "SELECT id FROM teams_new WHERE tournament_id = ? AND captain_user_id = ?"
      )
      .get(tournamentId, telegramId) as { id: number } | undefined;

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Вы уже зарегистрировали команду в этом турнире" },
        { status: 400 }
      );
    }

    const insertTeam = db.prepare(
      "INSERT INTO teams_new (tournament_id, name, captain_user_id, status) VALUES (?, ?, ?, 'active')"
    );

    const result = insertTeam.run(tournamentId, teamName, telegramId);
    const newTeamId = Number(result.lastInsertRowid);

    db.prepare(
      "INSERT OR IGNORE INTO team_members (team_id, user_id, role, status, tournament_id) VALUES (?, ?, 'captain', 'confirmed', ?)"
    ).run(newTeamId, telegramId, tournamentId);

    let copiedMembers = 0;
    const lastTeam = db
      .prepare(
        "SELECT id FROM teams_new WHERE captain_user_id = ? AND id <> ? ORDER BY id DESC LIMIT 1"
      )
      .get(telegramId, newTeamId) as { id: number } | undefined;

    if (lastTeam) {
      const members = db
        .prepare(
          "SELECT user_id as userId, role, status FROM team_members WHERE team_id = ? AND user_id <> ?"
        )
        .all(lastTeam.id, telegramId) as { userId: number; role: string; status: string }[];

      const insertMember = db.prepare(
        "INSERT OR IGNORE INTO team_members (team_id, user_id, role, status, tournament_id) VALUES (?, ?, ?, COALESCE(?, 'confirmed'), ?)"
      );

      for (const member of members) {
        insertMember.run(newTeamId, member.userId, member.role || "player", member.status || "pending", tournamentId);
        copiedMembers += 1;
      }
    }

    const inviteCode = crypto.randomBytes(3).toString("hex");
    try {
      db.prepare(
        "INSERT INTO team_security_new (tournament_id, team_id, invite_code) VALUES (?, ?, ?)"
      ).run(tournamentId, newTeamId, inviteCode);
    } catch (err) {
      console.warn("[register-team] failed to create invite code", err);
    }

    return NextResponse.json({ ok: true, teamId: newTeamId, inviteCode, copiedMembers });
  } catch (err) {
    console.error("[register-team]", err);
    return NextResponse.json(
      { ok: false, error: "Не удалось создать команду" },
      { status: 500 }
    );
  }
}
