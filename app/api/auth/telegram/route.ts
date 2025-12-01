import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramAuth, TelegramAuthData } from "@/lib/telegramAuth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as TelegramAuthData | null;

  if (!body) {
    return NextResponse.json({ ok: false, error: "No data" }, { status: 400 });
  }

  const isValid = verifyTelegramAuth(body);

  if (!isValid) {
    return NextResponse.json(
      { ok: false, error: "Invalid auth data" },
      { status: 401 }
    );
  }

  const telegramId = body.id;

  // тут потом будет поиск/создание пользователя
  const sessionId = crypto.randomUUID();

  const res = NextResponse.json({ ok: true });

  res.cookies.set("vzale_session", sessionId, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  res.cookies.set("vzale_telegram_id", String(telegramId), {
    httpOnly: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
