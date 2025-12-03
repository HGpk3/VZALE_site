import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

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
    const name = (body?.name as string | undefined)?.trim();
    const info = (body?.info as string | undefined)?.trim();

    if (!tournamentId || !name) {
      return NextResponse.json(
        { ok: false, error: "Укажите турнир и имя игрока" },
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
        "SELECT id FROM free_agents_new WHERE user_id = ? AND tournament_id = ?"
      )
      .get(telegramId, tournamentId) as { id: number } | undefined;

    const profileJson = JSON.stringify({ name, info });

    if (existing) {
      db.prepare(
        "UPDATE free_agents_new SET profile_json = ?, is_active = 1 WHERE id = ?"
      ).run(profileJson, existing.id);
    } else {
      db.prepare(
        "INSERT INTO free_agents_new (user_id, tournament_id, profile_json, is_active) VALUES (?, ?, ?, 1)"
      ).run(telegramId, tournamentId, profileJson);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[free-agent]", err);
    return NextResponse.json(
      { ok: false, error: "Не удалось сохранить анкету" },
      { status: 500 }
    );
  }
}
