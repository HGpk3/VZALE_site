import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

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
    const name = (body?.name as string | undefined)?.trim();
    const venue = (body?.venue as string | undefined)?.trim();
    const dateStart = (body?.dateStart as string | undefined)?.trim();
    const status = (body?.status as string | undefined)?.trim() || "registration_open";

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "Укажите название турнира" },
        { status: 400 }
      );
    }

    const db = getDb();
    const stmt = db.prepare(
      "INSERT INTO tournaments (name, date_start, venue, status) VALUES (?, ?, ?, ?)"
    );
    const result = stmt.run(name, dateStart || null, venue || null, status);

    return NextResponse.json({ ok: true, id: Number(result.lastInsertRowid) });
  } catch (err) {
    console.error("[admin:create-tournament]", err);
    return NextResponse.json(
      { ok: false, error: "Не удалось создать турнир" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const telegramId = req.cookies.get("vzale_telegram_id")?.value;
    if (!isAdmin(telegramId ? Number(telegramId) : null)) {
      return NextResponse.json(
        { ok: false, error: "Недостаточно прав" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const tournamentId = Number(body?.id);
    const name = body?.name as string | undefined;
    const venue = body?.venue as string | undefined;
    const dateStart = body?.dateStart as string | undefined;

    if (!tournamentId) {
      return NextResponse.json(
        { ok: false, error: "Нужно указать турнир" },
        { status: 400 }
      );
    }

    const updates: { column: string; value: string | null }[] = [];

    if (name !== undefined) {
      const trimmed = name.trim();
      if (!trimmed) {
        return NextResponse.json(
          { ok: false, error: "Название не может быть пустым" },
          { status: 400 }
        );
      }
      updates.push({ column: "name", value: trimmed });
    }

    if (venue !== undefined) {
      updates.push({ column: "venue", value: venue.trim() || null });
    }

    if (dateStart !== undefined) {
      updates.push({ column: "date_start", value: dateStart.trim() || null });
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Нет данных для обновления" },
        { status: 400 }
      );
    }

    const db = getDb();
    const exists = db
      .prepare("SELECT id FROM tournaments WHERE id = ?")
      .get(tournamentId) as { id: number } | undefined;

    if (!exists) {
      return NextResponse.json(
        { ok: false, error: "Турнир не найден" },
        { status: 404 }
      );
    }

    const setClause = updates.map((u) => `${u.column} = ?`).join(", ");
    const values = updates.map((u) => u.value);

    db.prepare(
      `UPDATE tournaments SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(...values, tournamentId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin:update-tournament]", err);
    return NextResponse.json(
      { ok: false, error: "Не удалось обновить турнир" },
      { status: 500 }
    );
  }
}
