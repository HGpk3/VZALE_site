import { NextRequest, NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const telegramId = req.cookies.get("vzale_telegram_id")?.value;
    if (!isAdmin(telegramId ? Number(telegramId) : null)) {
      return NextResponse.json(
        { ok: false, error: "Недостаточно прав" },
        { status: 403 }
      );
    }

    const tournamentIdParam = req.nextUrl.searchParams.get("tournamentId");
    const tournamentId = tournamentIdParam ? Number(tournamentIdParam) : null;

    const db = getDb();

    const teams = db
      .prepare(
        `
        SELECT id, name, tournament_id AS tournamentId
        FROM teams_new
        WHERE (? IS NULL OR tournament_id = ?)
        ORDER BY name COLLATE NOCASE
      `
      )
      .all(tournamentId, tournamentId) as {
        id: number;
        name: string;
        tournamentId: number | null;
      }[];

    const members = db
      .prepare(
        `
        SELECT
          tm.team_id AS teamId,
          tm.user_id AS userId,
          u.full_name AS fullName
        FROM team_members tm
        LEFT JOIN users u ON u.user_id = tm.user_id
        WHERE (? IS NULL OR tm.tournament_id = ?)
        ORDER BY u.full_name COLLATE NOCASE
      `
      )
      .all(tournamentId, tournamentId) as {
        teamId: number;
        userId: number;
        fullName: string | null;
      }[];

    const rosterMap = new Map<number, { userId: number; fullName: string | null }[]>();
    for (const member of members) {
      const bucket = rosterMap.get(member.teamId) || [];
      bucket.push({ userId: member.userId, fullName: member.fullName });
      rosterMap.set(member.teamId, bucket);
    }

    const payload = teams.map((team) => ({
      ...team,
      members: rosterMap.get(team.id) || [],
    }));

    return NextResponse.json({ ok: true, teams: payload });
  } catch (err) {
    console.error("[admin:match-options]", err);
    return NextResponse.json(
      { ok: false, error: "Не удалось получить команды" },
      { status: 500 }
    );
  }
}
