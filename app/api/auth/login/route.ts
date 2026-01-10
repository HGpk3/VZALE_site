import { NextRequest, NextResponse } from "next/server";

import { postJson } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { ok: false, error: "Логин и пароль обязательны" },
        { status: 400 },
      );
    }

    const result = await postJson<{ ok: boolean; telegramId?: number; error?: string }>(
      "/api/auth/login",
      { username, password },
    );

    if (!result) {
      return NextResponse.json(
        { ok: false, error: "Сервис временно недоступен" },
        { status: 502 },
      );
    }

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error || "Неверный логин или пароль" },
        { status: 401 },
      );
    }

    const res = NextResponse.json({ ok: true });

    if (result.telegramId) {
      res.cookies.set("vzale_telegram_id", String(result.telegramId), {
        httpOnly: false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return res;
  } catch (err) {
    console.error("LOGIN API ERROR:", err);
    return NextResponse.json(
      { ok: false, error: "Внутренняя ошибка сервера" },
      { status: 500 },
    );
  }
}
