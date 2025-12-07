import { NextRequest, NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";

type PaymentTeam = {
  name: string;
  paid: number;
};

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

    if (!tournamentId) {
      return NextResponse.json(
        { ok: false, error: "Не указан турнир" },
        { status: 400 }
      );
    }

    const db = getDb();

    const legacyTeams = db
      .prepare(
        `
          SELECT name, paid
          FROM tournament_team_names
          WHERE tournament_id = ?
        `
      )
      .all(tournamentId) as PaymentTeam[];

    const currentTeams = db
      .prepare(
        `
          SELECT name
          FROM teams_new
          WHERE tournament_id = ?
          ORDER BY name COLLATE NOCASE
        `
      )
      .all(tournamentId) as { name: string }[];

    const map = new Map<string, PaymentTeam>();

    currentTeams.forEach((team) => {
      map.set(team.name, { name: team.name, paid: 0 });
    });

    legacyTeams.forEach((team) => {
      map.set(team.name, { name: team.name, paid: team.paid ?? 0 });
    });

    const teams = Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return NextResponse.json({ ok: true, teams });
  } catch (err) {
    console.error("[admin:payments:get]", err);
    return NextResponse.json(
      { ok: false, error: "Не удалось загрузить оплаты" },
      { status: 500 }
    );
  }
}

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
    const teamName = (body?.teamName as string | undefined)?.trim();
    const paid = body?.paid ? 1 : 0;

    if (!tournamentId || !teamName) {
      return NextResponse.json(
        { ok: false, error: "Нужно указать турнир и команду" },
        { status: 400 }
      );
    }

    const db = getDb();

    const existing = db
      .prepare(
        `
          SELECT id
          FROM tournament_team_names
          WHERE tournament_id = ? AND name = ?
          ORDER BY id ASC
          LIMIT 1
        `
      )
      .get(tournamentId, teamName) as { id: number } | undefined;

    if (existing) {
      db.prepare("UPDATE tournament_team_names SET paid = ? WHERE id = ?").run(
        paid,
        existing.id
      );
    } else {
      db
        .prepare(
          "INSERT INTO tournament_team_names (tournament_id, name, paid) VALUES (?, ?, ?)"
        )
        .run(tournamentId, teamName, paid);
    }

    return NextResponse.json({ ok: true, paid });
  } catch (err) {
    console.error("[admin:payments:post]", err);
    return NextResponse.json(
      { ok: false, error: "Не удалось обновить оплату" },
      { status: 500 }
    );
  }
}
