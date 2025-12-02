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
