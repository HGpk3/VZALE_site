import { NextResponse } from "next/server";

import { getFromApi } from "@/lib/api";
import { isAdmin } from "@/lib/admin";

export async function GET(request: Request) {
  const telegramId = request.headers.get("cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith("vzale_telegram_id="))
    ?.split("=")[1];

  if (!isAdmin(telegramId ? Number(telegramId) : null)) {
    return NextResponse.json({ ok: false, error: "Недостаточно прав" }, { status: 403 });
  }

  const data = await getFromApi<unknown>("/api/admin/matches/options");
  if (!data) {
    return NextResponse.json({ ok: false, error: "Сервис временно недоступен" }, { status: 502 });
  }

  return NextResponse.json(data);
}
