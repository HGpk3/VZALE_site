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
    const tournamentId = Number(body?.id);
    const status = (body?.status as string | undefined)?.trim();

    if (!tournamentId || !status) {
      return NextResponse.json(
        { ok: false, error: "Нужно указать турнир и статус" },
        { status: 400 }
      );
    }

    const allowed = [
      "draft",
      "announced",
      "registration_open",
      "closed",
      "running",
      "finished",
      "archived",
    ];

    if (!allowed.includes(status)) {
      return NextResponse.json(
        { ok: false, error: "Недопустимый статус" },
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

    db.prepare("UPDATE tournaments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, tournamentId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin:update-status]", err);
    return NextResponse.json(
      { ok: false, error: "Не удалось обновить статус" },
      { status: 500 }
    );
  }
}
