import { NextRequest, NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";

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
    const matchId = Number(body?.matchId);
    const tournamentId = Number(body?.tournamentId);
    const status = (body?.status as string | undefined)?.trim() || "running";

    if (!matchId || !tournamentId) {
      return NextResponse.json(
        { ok: false, error: "Передайте матч и турнир" },
        { status: 400 }
      );
    }

    const scoreHomeRaw = body?.scoreHome;
    const scoreAwayRaw = body?.scoreAway;

    const scoreHome =
      scoreHomeRaw === null || scoreHomeRaw === undefined
        ? null
        : Number(scoreHomeRaw);
    const scoreAway =
      scoreAwayRaw === null || scoreAwayRaw === undefined
        ? null
        : Number(scoreAwayRaw);

    const playerStatsRaw = Array.isArray(body?.playerStats)
      ? (body.playerStats as PlayerStatInput[])
      : [];

    const db = getDb();

    const matchRow = db
      .prepare(
        `
        SELECT
          ms.tournament_id AS tournamentId,
          ms.team_home_name AS teamHomeName,
          ms.team_away_name AS teamAwayName,
          ms.score_home AS oldScoreHome,
          ms.score_away AS oldScoreAway,
          COALESCE(m.stage, ms.stage) AS stage,
          COALESCE(m.status, ms.status) AS status
        FROM matches_simple ms
        LEFT JOIN matches m ON m.id = ms.id
        WHERE ms.id = ?
      `
      )
      .get(matchId) as
      | {
          tournamentId: number;
          teamHomeName: string;
          teamAwayName: string;
          oldScoreHome: number | null;
          oldScoreAway: number | null;
          stage: string | null;
          status: string | null;
        }
      | undefined;

    if (!matchRow || matchRow.tournamentId !== tournamentId) {
      return NextResponse.json(
        { ok: false, error: "Матч не найден" },
        { status: 404 }
      );
    }

    const oldStats = db
      .prepare(
        `
        SELECT
          user_id AS userId,
          team_name AS teamName,
          points,
          threes,
          assists,
          rebounds,
          steals,
          blocks,
          fouls,
          turnovers,
          minutes
        FROM player_match_stats
        WHERE match_id = ?
      `
      )
      .all(matchId) as PlayerStatInput[];

    const oldWinner =
      matchRow.oldScoreHome !== null &&
      matchRow.oldScoreAway !== null &&
      matchRow.oldScoreHome !== matchRow.oldScoreAway
        ? matchRow.oldScoreHome > matchRow.oldScoreAway
          ? matchRow.teamHomeName
          : matchRow.teamAwayName
        : null;

    const updateMatch = db.prepare(
      `
      UPDATE matches_simple
      SET
        score_home = ?,
        score_away = ?,
        status = ?,
        stage = COALESCE(?, stage)
      WHERE id = ?
    `
    );

    const deleteOldStats = db.prepare(
      `DELETE FROM player_match_stats WHERE match_id = ?`
    );

    const revertTotals = db.prepare(
      `
      UPDATE player_stats
      SET
        games = MAX(games - 1, 0),
        wins = MAX(wins - ?, 0),
        losses = MAX(losses - ?, 0),
        points = MAX(points - ?, 0),
        threes = MAX(threes - ?, 0),
        assists = MAX(assists - ?, 0),
        rebounds = MAX(rebounds - ?, 0),
        steals = MAX(steals - ?, 0),
        blocks = MAX(blocks - ?, 0),
        fouls = MAX(fouls - ?, 0),
        turnovers = MAX(turnovers - ?, 0),
        minutes = MAX(minutes - ?, 0),
        last_updated = CURRENT_TIMESTAMP
      WHERE tournament_id = ? AND user_id = ?
    `
    );

    const insertStat = db.prepare(
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

    const updateTotals = db.prepare(
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

    const insertTotals = db.prepare(
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

    const groupedStats = new Map<number, PlayerStatInput>();
    for (const raw of playerStatsRaw) {
      if (!raw?.userId || !raw?.teamName) continue;
      const existing = groupedStats.get(raw.userId);
      const next = {
        userId: raw.userId,
        teamName: raw.teamName,
        points: (existing?.points || 0) + Number(raw.points || 0),
        threes: (existing?.threes || 0) + Number(raw.threes || 0),
        assists: (existing?.assists || 0) + Number(raw.assists || 0),
        rebounds: (existing?.rebounds || 0) + Number(raw.rebounds || 0),
        steals: (existing?.steals || 0) + Number(raw.steals || 0),
        blocks: (existing?.blocks || 0) + Number(raw.blocks || 0),
        fouls: (existing?.fouls || 0) + Number(raw.fouls || 0),
        turnovers: (existing?.turnovers || 0) + Number(raw.turnovers || 0),
        minutes: (existing?.minutes || 0) + Number(raw.minutes || 0),
      };
      groupedStats.set(raw.userId, next);
    }

    const newWinner =
      scoreHome !== null &&
      scoreAway !== null &&
      scoreHome !== scoreAway
        ? scoreHome > scoreAway
          ? matchRow.teamHomeName
          : matchRow.teamAwayName
        : null;

    const runTransaction = db.transaction(() => {
      for (const stat of oldStats) {
        const wasWin = oldWinner ? Number(stat.teamName === oldWinner) : 0;
        const wasLoss = oldWinner ? Number(stat.teamName !== oldWinner) : 0;

        revertTotals.run(
          wasWin,
          wasLoss,
          Number(stat.points || 0),
          Number(stat.threes || 0),
          Number(stat.assists || 0),
          Number(stat.rebounds || 0),
          Number(stat.steals || 0),
          Number(stat.blocks || 0),
          Number(stat.fouls || 0),
          Number(stat.turnovers || 0),
          Number(stat.minutes || 0),
          tournamentId,
          stat.userId
        );
      }

      deleteOldStats.run(matchId);

      updateMatch.run(scoreHome, scoreAway, status, matchRow.stage, matchId);

      for (const stat of groupedStats.values()) {
        insertStat.run(
          tournamentId,
          matchId,
          stat.teamName,
          stat.userId,
          Number(stat.points || 0),
          Number(stat.threes || 0),
          Number(stat.assists || 0),
          Number(stat.rebounds || 0),
          Number(stat.steals || 0),
          Number(stat.blocks || 0),
          Number(stat.fouls || 0),
          Number(stat.turnovers || 0),
          Number(stat.minutes || 0)
        );

        const isWin = newWinner ? Number(stat.teamName === newWinner) : 0;
        const isLoss = newWinner ? Number(stat.teamName !== newWinner) : 0;

        const updateResult = updateTotals.run(
          isWin,
          isLoss,
          Number(stat.points || 0),
          Number(stat.threes || 0),
          Number(stat.assists || 0),
          Number(stat.rebounds || 0),
          Number(stat.steals || 0),
          Number(stat.blocks || 0),
          Number(stat.fouls || 0),
          Number(stat.turnovers || 0),
          Number(stat.minutes || 0),
          tournamentId,
          stat.userId
        );

        if (updateResult.changes === 0) {
          insertTotals.run(
            tournamentId,
            stat.userId,
            1,
            isWin,
            isLoss,
            Number(stat.points || 0),
            Number(stat.threes || 0),
            Number(stat.assists || 0),
            Number(stat.rebounds || 0),
            Number(stat.steals || 0),
            Number(stat.blocks || 0),
            Number(stat.fouls || 0),
            Number(stat.turnovers || 0),
            Number(stat.minutes || 0)
          );
        }
      }
    });

    runTransaction();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin:live-save]", err);
    return NextResponse.json(
      { ok: false, error: "Не удалось сохранить статистику" },
      { status: 500 }
    );
  }
}
