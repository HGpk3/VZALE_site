import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

type PlayerStatInput = {
  userId: number;
  teamName: string;
  points?: number;
  threes?: number;
  assists?: number;
  rebounds?: number;
  steals?: number;
  blocks?: number;
  fouls?: number;
  turnovers?: number;
  minutes?: number;
};

export async function POST(req: NextRequest) {
  try {
    const telegramId = req.cookies.get("vzale_telegram_id")?.value;
    if (!isAdmin(telegramId ? Number(telegramId) : null)) {
      return NextResponse.json(
        { ok: false, error: "Недостаточно прав" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const tournamentId = Number(body?.tournamentId);
    const stage = (body?.stage as string | undefined)?.trim() || "Групповой этап";
    const status = (body?.status as string | undefined)?.trim() || "finished";
    const teamHomeName = (body?.teamHomeName as string | undefined)?.trim();
    const teamAwayName = (body?.teamAwayName as string | undefined)?.trim();
    const scoreHomeRaw = body?.scoreHome;
    const scoreAwayRaw = body?.scoreAway;

    const playerStatsRaw = Array.isArray(body?.playerStats)
      ? body.playerStats
      : [];

    if (!tournamentId || !teamHomeName || !teamAwayName) {
      return NextResponse.json(
        { ok: false, error: "Укажите турнир и обе команды" },
        { status: 400 }
      );
    }

    const scoreHome =
      scoreHomeRaw === null || scoreHomeRaw === undefined
        ? null
        : Number(scoreHomeRaw);
    const scoreAway =
      scoreAwayRaw === null || scoreAwayRaw === undefined
        ? null
        : Number(scoreAwayRaw);

    const db = getDb();

    const insertMatch = db.prepare(
      `
        INSERT INTO matches_simple
          (tournament_id, stage, team_home_name, team_away_name, score_home, score_away, status)
        VALUES
          (?, ?, ?, ?, ?, ?, ?)
      `
    );

    const insertPlayerMatchStat = db.prepare(
      `
        INSERT INTO player_match_stats (
          tournament_id,
          match_id,
          team_name,
          user_id,
          points,
          threes,
          assists,
          rebounds,
          steals,
          blocks,
          fouls,
          turnovers,
          minutes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    );

    const updatePlayerTotals = db.prepare(
      `
        UPDATE player_stats
        SET
          games = games + 1,
          wins = wins + ?,
          losses = losses + ?,
          points = points + ?,
          threes = threes + ?,
          assists = assists + ?,
          rebounds = rebounds + ?,
          steals = steals + ?,
          blocks = blocks + ?,
          fouls = fouls + ?,
          turnovers = turnovers + ?,
          minutes = minutes + ?,
          last_updated = CURRENT_TIMESTAMP
        WHERE tournament_id = ? AND user_id = ?
      `
    );

    const insertPlayerTotals = db.prepare(
      `
        INSERT INTO player_stats (
          tournament_id,
          user_id,
          games,
          wins,
          losses,
          points,
          threes,
          assists,
          rebounds,
          steals,
          blocks,
          fouls,
          turnovers,
          minutes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    );

    const transaction = db.transaction((playerStats: PlayerStatInput[]) => {
      const matchResult = insertMatch.run(
        tournamentId,
        stage,
        teamHomeName,
        teamAwayName,
        scoreHome,
        scoreAway,
        status
      );
      const matchId = Number(matchResult.lastInsertRowid);

      let winnerTeamName: string | null = null;
      if (scoreHome !== null && scoreAway !== null && scoreHome !== scoreAway) {
        winnerTeamName = scoreHome > scoreAway ? teamHomeName : teamAwayName;
      }

      const validPlayerStats = playerStats
        .filter((ps) => ps.userId && ps.teamName)
        .map((ps) => ({
          ...ps,
          points: Number(ps.points || 0),
          threes: Number(ps.threes || 0),
          assists: Number(ps.assists || 0),
          rebounds: Number(ps.rebounds || 0),
          steals: Number(ps.steals || 0),
          blocks: Number(ps.blocks || 0),
          fouls: Number(ps.fouls || 0),
          turnovers: Number(ps.turnovers || 0),
          minutes: Number(ps.minutes || 0),
        }));

      for (const ps of validPlayerStats) {
        insertPlayerMatchStat.run(
          tournamentId,
          matchId,
          ps.teamName,
          ps.userId,
          ps.points,
          ps.threes,
          ps.assists,
          ps.rebounds,
          ps.steals,
          ps.blocks,
          ps.fouls,
          ps.turnovers,
          ps.minutes
        );

        const isWin = winnerTeamName
          ? Number(ps.teamName === winnerTeamName)
          : 0;
        const isLoss = winnerTeamName
          ? Number(ps.teamName !== winnerTeamName)
          : 0;

        const updated = updatePlayerTotals.run(
          isWin,
          isLoss,
          ps.points,
          ps.threes,
          ps.assists,
          ps.rebounds,
          ps.steals,
          ps.blocks,
          ps.fouls,
          ps.turnovers,
          ps.minutes,
          tournamentId,
          ps.userId
        );

        if (updated.changes === 0) {
          insertPlayerTotals.run(
            tournamentId,
            ps.userId,
            1,
            isWin,
            isLoss,
            ps.points,
            ps.threes,
            ps.assists,
            ps.rebounds,
            ps.steals,
            ps.blocks,
            ps.fouls,
            ps.turnovers,
            ps.minutes
          );
        }
      }

      return matchId;
    });

    const matchId = transaction(playerStatsRaw);

    return NextResponse.json({ ok: true, matchId });
  } catch (err) {
    console.error("[admin:add-match]", err);
    return NextResponse.json(
      { ok: false, error: "Не удалось сохранить матч" },
      { status: 500 }
    );
  }
}
