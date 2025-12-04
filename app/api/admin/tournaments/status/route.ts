import { NextRequest, NextResponse } from "next/server";

import { postJson } from "@/lib/api";
import { isAdmin } from "@/lib/admin";

export async function POST(req: NextRequest) {
  try {
    const telegramId = req.cookies.get("vzale_telegram_id")?.value;
    if (!isAdmin(telegramId ? Number(telegramId) : null)) {
      return NextResponse.json({ ok: false, error: "Недостаточно прав" }, { status: 403 });
    }

    const body = await req.json();
    const result = await postJson<{ ok: boolean; error?: string }>("/api/admin/tournaments/status", body);

    if (!result) {
      return NextResponse.json({ ok: false, error: "Сервис временно недоступен" }, { status: 502 });
    }

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error || "Не удалось обновить турнир" }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[admin:update-tournament-status]", err);
    return NextResponse.json({ ok: false, error: "Не удалось обновить турнир" }, { status: 500 });
  }
}
