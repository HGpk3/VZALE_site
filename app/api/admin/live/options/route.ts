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

    const matches = db
      .prepare(
        `
        SELECT
          ms.id,
          ms.tournament_id AS tournamentId,
          COALESCE(m.stage, ms.stage) AS stage,
          COALESCE(m.status, ms.status) AS status,
          m.start_at AS startAt,
          m.court,
          ms.team_home_name AS teamHomeName,
          ms.team_away_name AS teamAwayName,
          ms.score_home AS scoreHome,
          ms.score_away AS scoreAway
        FROM matches_simple ms
        LEFT JOIN matches m ON m.id = ms.id
        WHERE (? IS NULL OR ms.tournament_id = ?)
        ORDER BY COALESCE(m.start_at, ms.id) DESC
      `
      )
      .all(tournamentId, tournamentId) as {
      id: number;
      tournamentId: number;
      stage: string | null;
      status: string | null;
      startAt: string | null;
      court: string | null;
      teamHomeName: string;
      teamAwayName: string;
      scoreHome: number | null;
      scoreAway: number | null;
    }[];

    const rosters = db
      .prepare(
        `
        SELECT
          t.name AS teamName,
          tm.user_id AS userId,
          u.full_name AS fullName
        FROM teams_new t
        LEFT JOIN team_members tm ON tm.team_id = t.id
        LEFT JOIN users u ON u.user_id = tm.user_id
        WHERE (? IS NULL OR t.tournament_id = ?)
      `
      )
      .all(tournamentId, tournamentId) as {
      teamName: string;
      userId: number | null;
      fullName: string | null;
    }[];

    const rosterMap = new Map<string, { userId: number; fullName: string | null }[]>();
    for (const row of rosters) {
      if (!row.userId) continue;
      const key = row.teamName.toLowerCase();
      const bucket = rosterMap.get(key) || [];
      bucket.push({ userId: row.userId, fullName: row.fullName });
      rosterMap.set(key, bucket);
    }

    const statsRows = db
      .prepare(
        `
        SELECT
          pms.match_id AS matchId,
          pms.user_id AS userId,
          u.full_name AS fullName,
          pms.team_name AS teamName,
          pms.points,
          pms.threes,
          pms.assists,
          pms.rebounds,
          pms.steals,
          pms.blocks,
          pms.fouls,
          pms.turnovers,
          pms.minutes
        FROM player_match_stats pms
        LEFT JOIN users u ON u.user_id = pms.user_id
        WHERE (? IS NULL OR pms.tournament_id = ?)
      `
      )
      .all(tournamentId, tournamentId) as {
      matchId: number;
      userId: number;
      fullName: string | null;
      teamName: string;
      points: number | null;
      threes: number | null;
      assists: number | null;
      rebounds: number | null;
      steals: number | null;
      blocks: number | null;
      fouls: number | null;
      turnovers: number | null;
      minutes: number | null;
    }[];

    const statsByMatch = new Map<number, typeof statsRows>();
    for (const stat of statsRows) {
      const bucket = statsByMatch.get(stat.matchId) || [];
      bucket.push(stat);
      statsByMatch.set(stat.matchId, bucket);
    }

    const payload = matches.map((match) => {
      const homeRoster = rosterMap.get(match.teamHomeName.toLowerCase()) || [];
      const awayRoster = rosterMap.get(match.teamAwayName.toLowerCase()) || [];

      return {
        ...match,
        homeRoster,
        awayRoster,
        stats: statsByMatch.get(match.id) || [],
      };
    });

    return NextResponse.json({ ok: true, matches: payload });
  } catch (err) {
    console.error("[admin:live-options]", err);
    return NextResponse.json(
      { ok: false, error: "Не удалось получить матчи" },
      { status: 500 }
    );
  }
}
