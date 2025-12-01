import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

type Pending = {
  createdAt: number;
  telegramId?: number;
};

const TTL_MS = 5 * 60 * 1000;

function getStore(): Map<string, Pending> {
  const g = global as any;
  if (!g.__vzaleQrStore) {
    g.__vzaleQrStore = new Map<string, Pending>();
  }
  return g.__vzaleQrStore;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json(
      { ok: false, done: false, error: "No token" },
      { status: 400 }
    );
  }

  const store = getStore();
  const pending = store.get(token);
  if (!pending) {
    return NextResponse.json(
      { ok: false, done: false, error: "Unknown token" },
      { status: 404 }
    );
  }

  if (!pending.telegramId) {
    return NextResponse.json({ ok: true, done: false });
  }

  // уже подтвердили — считаем, что можно логинить
  const telegramId = pending.telegramId;
  store.delete(token);

  const res = NextResponse.json({
    ok: true,
    done: true,
    telegramId,
  });

  // httpOnly-cookie для сессии
  res.cookies.set("vzale_session", crypto.randomUUID(), {
    httpOnly: true,
    path: "/",
    maxAge: 7 * 24 * 3600,
  });

  // обычная кука с telegram_id (для удобства на фронте/деве)
  res.cookies.set("vzale_telegram_id", String(telegramId), {
    httpOnly: false,
    path: "/",
    maxAge: 7 * 24 * 3600,
  });

  return res;
}
