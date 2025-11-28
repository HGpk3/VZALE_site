import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramAuth } from "@/lib/telegramAuth";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const data = Object.fromEntries(req.nextUrl.searchParams.entries());

  // Telegram возвращает строки, auth_date и id тоже строки → приводим
  const parsed = {
    ...data,
    id: Number(data.id),
  };

  const isValid = verifyTelegramAuth(parsed as any);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const sessionId = crypto.randomUUID();

  const res = NextResponse.redirect("http://localhost:3000/me");

  // кука
  res.cookies.set("vzale_telegram_id", String(parsed.id), {
    httpOnly: false,
    path: "/",
    maxAge: 7 * 24 * 3600,
  });

  return res;
}
